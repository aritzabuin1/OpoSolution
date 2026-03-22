import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

type CheckStatus = 'ok' | 'error' | 'degraded'

interface HealthChecks {
  database: CheckStatus
  anthropic: CheckStatus
  openai: CheckStatus
  stripe: CheckStatus
  resend: CheckStatus
  upstash: CheckStatus
}

/**
 * GET /api/health
 *
 * Health check con verificación de conectividad a todos los servicios externos.
 * DDIA Observability: endpoint de referencia para monitoring y CI/CD.
 *
 * Response:
 *   200 → { status: 'healthy', checks: {...}, latency_ms }
 *   503 → { status: 'unhealthy' | 'degraded', checks: {...}, latency_ms }
 */
export async function GET() {
  const start = Date.now()

  const checks: HealthChecks = {
    database: 'error',
    anthropic: 'error',
    openai: 'error',
    stripe: 'error',
    resend: 'error',
    upstash: 'error',
  }

  // Run all checks in parallel with individual timeouts
  const timeout = (ms: number) => new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  )

  const results = await Promise.allSettled([
    // Database
    Promise.race([
      (async () => {
        const supabase = await createClient()
        const { error } = await supabase.from('oposiciones').select('id').limit(1)
        if (error) throw error
        checks.database = 'ok'
      })(),
      timeout(5000),
    ]),

    // Anthropic — check API key is configured
    Promise.race([
      (async () => {
        checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'ok' : 'degraded'
      })(),
      timeout(1000),
    ]),

    // OpenAI — check API key is configured
    Promise.race([
      (async () => {
        checks.openai = process.env.OPENAI_API_KEY ? 'ok' : 'degraded'
      })(),
      timeout(1000),
    ]),

    // Stripe — check keys configured
    Promise.race([
      (async () => {
        checks.stripe = (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
          ? 'ok' : 'degraded'
      })(),
      timeout(1000),
    ]),

    // Resend — check key configured
    Promise.race([
      (async () => {
        checks.resend = process.env.RESEND_API_KEY ? 'ok' : 'degraded'
      })(),
      timeout(1000),
    ]),

    // Upstash Redis — check connectivity
    Promise.race([
      (async () => {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
          checks.upstash = 'degraded'
          return
        }
        const res = await fetch(
          `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
          { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
        )
        checks.upstash = res.ok ? 'ok' : 'error'
      })(),
      timeout(3000),
    ]),
  ])

  // Log failures
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const names = ['database', 'anthropic', 'openai', 'stripe', 'resend', 'upstash']
      logger.warn({ service: names[i], error: r.reason?.message }, 'Health check: service degraded')
    }
  })

  const latencyMs = Date.now() - start
  const critical = checks.database === 'error'
  const hasErrors = Object.values(checks).some(v => v === 'error')
  const status = critical ? 'unhealthy' : hasErrors ? 'degraded' : 'healthy'
  const httpStatus = critical ? 503 : 200

  logger.info({ latencyMs, status, checks }, 'Health check completed')

  // Strip detailed service checks from public response (prevent infrastructure recon)
  // Detailed checks are still logged server-side for debugging
  return NextResponse.json(
    { status, latency_ms: latencyMs },
    {
      status: httpStatus,
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    }
  )
}
