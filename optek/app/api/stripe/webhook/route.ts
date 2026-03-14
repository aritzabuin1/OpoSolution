import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, CORRECTIONS_GRANTED, C1_OPOSICION_ID, C2_OPOSICION_ID } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/stripe/webhook
 *
 * Receptor de webhooks de Stripe con idempotencia garantizada.
 *
 * DDIA Consistency: stripe_events_processed como idempotency store.
 *   1. Verificar firma Stripe.
 *   2. SELECT en stripe_events_processed → si ya existe, 200 + skip.
 *   3. Procesar evento (handleStripeEvent).
 *   4. INSERT en stripe_events_processed DESPUÉS del éxito.
 *   5. Si falla el handler → 500 → Stripe reintenta → no está marcado → se re-procesa.
 *
 * Ref: verificar firma Stripe siempre.
 */

// Stripe Subscription con campos de billing (compatibilidad API versión)
type StripeSubWithPeriod = Stripe.Subscription & {
  current_period_start?: number
  current_period_end?: number | null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('Stripe webhook: missing signature or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  // Verificar firma criptográfica del webhook
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const log = logger.child({ eventId: event.id, eventType: event.type })

  // DDIA Consistency: SELECT-first idempotencia
  // 1. Check if already processed → skip
  // 2. Run handler
  // 3. INSERT into stripe_events_processed AFTER success
  // If handler fails → no INSERT → Stripe retries → event is re-processed correctly
  const { data: existing } = await supabase
    .from('stripe_events_processed')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    log.info('Stripe event already processed — skipping (idempotent)')
    return NextResponse.json({ received: true, status: 'already_processed' })
  }

  // Process event FIRST — only mark as processed on success
  try {
    await handleStripeEvent(event, supabase, log)
  } catch (err) {
    log.error({ err }, 'Stripe webhook handler failed — Stripe will retry')
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  // Mark as processed AFTER successful handling
  const { error: insertIdempotencyError } = await supabase
    .from('stripe_events_processed')
    .insert({ stripe_event_id: event.id, event_type: event.type })

  if (insertIdempotencyError && insertIdempotencyError.code !== '23505') {
    // Non-critical: handler already succeeded, just log the idempotency insert failure
    log.warn({ err: insertIdempotencyError }, 'Stripe webhook: idempotency insert failed (event already handled)')
  }

  return NextResponse.json({ received: true })
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>

// Interfaz mínima del logger para evitar conflictos con los genéricos de pino
interface LogContext {
  info: (obj: Record<string, unknown> | string, msg?: string) => void
  warn: (obj: Record<string, unknown> | string, msg?: string) => void
  error: (obj: Record<string, unknown> | string, msg?: string) => void
  debug: (msg: string) => void
}

async function handleStripeEvent(
  event: Stripe.Event,
  supabase: SupabaseClient,
  log: LogContext
) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status !== 'paid') break

      const userId = session.metadata?.user_id ?? ''
      const tier = (session.metadata?.tier ?? 'pack') as keyof typeof CORRECTIONS_GRANTED
      const oposicionIdMeta = session.metadata?.oposicion_id ?? ''

      // Mapear tier del checkout → tipo que acepta el CHECK constraint de compras
      // BD: CHECK (tipo IN ('tema', 'pack_oposicion', 'subscription'))
      const TIER_TO_DB_TIPO: Record<string, string> = {
        pack: 'pack_oposicion',
        pack_c1: 'pack_oposicion',
        pack_doble: 'pack_oposicion',
        recarga: 'pack_oposicion',
        fundador: 'pack_oposicion',
      }
      const dbTipo = TIER_TO_DB_TIPO[tier] ?? 'pack_oposicion'

      // 1. Registrar compra(s)
      // RECARGA: NO crea fila en compras — solo otorga créditos (paso 2).
      // Si creara fila, checkPaidAccess la contaría como acceso premium (bug: 8,99€ desbloquea todo).
      if (tier === 'pack_doble') {
        // Pack Doble: 2 filas en compras (una C1 + una C2)
        await supabase.from('compras').insert([
          {
            user_id: userId,
            oposicion_id: C2_OPOSICION_ID,
            tema_id: null,
            stripe_checkout_session_id: session.id,
            tipo: dbTipo,
            amount_paid: session.amount_total ?? 0,
          },
          {
            user_id: userId,
            oposicion_id: C1_OPOSICION_ID,
            tema_id: null,
            stripe_checkout_session_id: `${session.id}_c1`, // unique constraint workaround
            tipo: dbTipo,
            amount_paid: 0, // segundo registro con amount 0 (total en el primero)
          },
        ])
      } else if (tier !== 'recarga') {
        await supabase.from('compras').insert({
          user_id: userId,
          oposicion_id: oposicionIdMeta,
          tema_id: session.metadata?.tema_id ?? null,
          stripe_checkout_session_id: session.id,
          tipo: dbTipo,
          amount_paid: session.amount_total ?? 0,
        })
      }

      // 2. Otorgar correcciones según tier de producto (pool compartido)
      const correctionsToGrant = CORRECTIONS_GRANTED[tier] ?? 0
      if (correctionsToGrant > 0) {
        await supabase.rpc('grant_corrections', {
          p_user_id: userId,
          p_amount: correctionsToGrant,
        })
        log.info({ sessionId: session.id, tier, correctionsToGrant }, 'Correcciones otorgadas')
      }

      // 3. Founder badge (§1.21.3): 20 plazas GLOBALES
      if (tier === 'fundador') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ is_founder: true })
          .eq('id', userId)
        log.info({ sessionId: session.id, userId }, 'Founder badge activado')
      }

      log.info({ sessionId: session.id, tier, dbTipo }, 'Compra registrada')
      break
    }

    case 'customer.subscription.created': {
      const sub = event.data.object as StripeSubWithPeriod
      const periodStart = sub.current_period_start ?? Math.floor(Date.now() / 1000)
      const periodEnd = sub.current_period_end ?? null

      await supabase.from('suscripciones').insert({
        user_id: sub.metadata?.user_id ?? '',
        stripe_subscription_id: sub.id,
        estado: 'activa',
        fecha_inicio: new Date(periodStart * 1000).toISOString(),
        fecha_fin: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
      log.info({ subId: sub.id }, 'Suscripción creada')
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as StripeSubWithPeriod
      const periodEnd = sub.current_period_end ?? null

      await supabase
        .from('suscripciones')
        .update({
          estado: sub.status === 'active' ? 'activa' : sub.status,
          fecha_fin: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq('stripe_subscription_id', sub.id)
      log.info({ subId: sub.id, status: sub.status }, 'Suscripción actualizada')
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('suscripciones')
        .update({ estado: 'cancelada' })
        .eq('stripe_subscription_id', sub.id)
      log.info({ subId: sub.id }, 'Suscripción cancelada')
      break
    }

    case 'payment_intent.succeeded':
      log.info({ piId: (event.data.object as Stripe.PaymentIntent).id }, 'PaymentIntent succeeded')
      break

    case 'charge.failed':
      log.warn({ chargeId: (event.data.object as Stripe.Charge).id }, 'Charge failed')
      break

    default:
      log.debug('Unhandled Stripe event type — no action needed')
  }
}
