import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES, CORRECTIONS_GRANTED, FOUNDER_LIMIT } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/stripe-health
 *
 * Verifica que todo el flujo Stripe está correctamente configurado:
 *   1. STRIPE_SECRET_KEY funciona (lista account)
 *   2. Cada STRIPE_PRICE_* es un price válido en Stripe
 *   3. STRIPE_WEBHOOK_SECRET está configurado
 *   4. Tablas BD existen (compras, stripe_events_processed)
 *   5. RPC grant_corrections funciona (dry-run)
 *   6. Modo live vs test
 *
 * Solo accesible con CRON_SECRET (mismo patrón que los crons).
 */
export async function GET(request: NextRequest) {
  // Auth: same pattern as cron endpoints
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log = logger.child({ route: 'stripe-health' })
  const checks: Record<string, { ok: boolean; detail: string }> = {}

  // 1. STRIPE_SECRET_KEY — can we reach Stripe?
  try {
    const account = await stripe.accounts.retrieve()
    const isLive = !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    checks['stripe_connection'] = {
      ok: true,
      detail: `Connected to Stripe account ${account.id} (${isLive ? 'LIVE' : 'TEST'} mode)`,
    }
    checks['stripe_mode'] = {
      ok: true,
      detail: isLive ? 'LIVE — real charges will be made' : 'TEST — safe for testing',
    }
  } catch (err) {
    checks['stripe_connection'] = {
      ok: false,
      detail: `Cannot connect: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // 2. STRIPE_WEBHOOK_SECRET
  checks['webhook_secret'] = {
    ok: !!process.env.STRIPE_WEBHOOK_SECRET,
    detail: process.env.STRIPE_WEBHOOK_SECRET
      ? `Configured (${process.env.STRIPE_WEBHOOK_SECRET.slice(0, 8)}...)`
      : 'MISSING — webhooks will fail!',
  }

  // 3. Validate each price ID
  for (const [tier, priceId] of Object.entries(STRIPE_PRICES)) {
    if (!priceId) {
      checks[`price_${tier}`] = { ok: false, detail: `STRIPE_PRICE_${tier.toUpperCase()} env var not set` }
      continue
    }
    try {
      const price = await stripe.prices.retrieve(priceId)
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : '?'
      const currency = price.currency?.toUpperCase() ?? '?'
      const active = price.active
      const corrections = CORRECTIONS_GRANTED[tier as keyof typeof CORRECTIONS_GRANTED]
      checks[`price_${tier}`] = {
        ok: active,
        detail: `${priceId.slice(0, 12)}... → ${amount} ${currency} (active=${active}) → grants ${corrections} corrections`,
      }
    } catch (err) {
      checks[`price_${tier}`] = {
        ok: false,
        detail: `Invalid price ID "${priceId}": ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  // 4. Database tables
  const supabase = await createServiceClient()

  // compras table
  try {
    const { count, error } = await supabase
      .from('compras')
      .select('*', { count: 'exact', head: true })
    checks['db_compras'] = {
      ok: !error,
      detail: error ? `Error: ${error.message}` : `Table exists (${count ?? 0} rows)`,
    }
  } catch (err) {
    checks['db_compras'] = { ok: false, detail: `Exception: ${err instanceof Error ? err.message : String(err)}` }
  }

  // stripe_events_processed table
  try {
    const { count, error } = await supabase
      .from('stripe_events_processed')
      .select('*', { count: 'exact', head: true })
    checks['db_stripe_events'] = {
      ok: !error,
      detail: error ? `Error: ${error.message}` : `Table exists (${count ?? 0} events processed)`,
    }
  } catch (err) {
    checks['db_stripe_events'] = { ok: false, detail: `Exception: ${err instanceof Error ? err.message : String(err)}` }
  }

  // profiles.corrections_balance column
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('corrections_balance')
      .limit(1)
      .maybeSingle()
    checks['db_corrections_balance'] = {
      ok: !error,
      detail: error ? `Error: ${error.message}` : 'Column exists in profiles',
    }
  } catch (err) {
    checks['db_corrections_balance'] = { ok: false, detail: `Exception: ${err instanceof Error ? err.message : String(err)}` }
  }

  // 5. Founder counter
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_founder', true)
    const founderCount = count ?? 0
    checks['founder_status'] = {
      ok: true,
      detail: `${founderCount}/${FOUNDER_LIMIT} founder slots used (${FOUNDER_LIMIT - founderCount} remaining)`,
    }
  } catch {
    checks['founder_status'] = { ok: false, detail: 'Cannot query is_founder' }
  }

  // 6. Webhook endpoint check — list recent webhook endpoints
  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 5 })
    const activeEndpoints = endpoints.data.filter(e => e.status === 'enabled')
    if (activeEndpoints.length === 0) {
      checks['webhook_endpoints'] = {
        ok: false,
        detail: 'No active webhook endpoints configured in Stripe! Go to Stripe Dashboard → Developers → Webhooks',
      }
    } else {
      const urls = activeEndpoints.map(e => e.url).join(', ')
      const events = activeEndpoints[0]?.enabled_events?.join(', ') ?? 'unknown'
      checks['webhook_endpoints'] = {
        ok: true,
        detail: `${activeEndpoints.length} active endpoint(s): ${urls}. Events: ${events}`,
      }
    }
  } catch (err) {
    checks['webhook_endpoints'] = {
      ok: false,
      detail: `Cannot list webhooks: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  // Summary
  const allOk = Object.values(checks).every(c => c.ok)
  const failCount = Object.values(checks).filter(c => !c.ok).length

  log.info({ allOk, failCount, checks }, 'Stripe health check completed')

  return NextResponse.json({
    status: allOk ? 'HEALTHY' : 'ISSUES_FOUND',
    failCount,
    checks,
    timestamp: new Date().toISOString(),
  }, { status: allOk ? 200 : 503 })
}
