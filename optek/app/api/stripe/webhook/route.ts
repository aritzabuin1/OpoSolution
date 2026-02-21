import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
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
 *   3. Procesar evento.
 *   4. INSERT en stripe_events_processed (tras éxito).
 *   5. Si falla el handler → 500 (Stripe reintentará, no marcamos como procesado).
 *
 * Ref: directives/OPTEK_security.md §6 — verificar firma siempre.
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

  // DDIA Consistency: check idempotencia
  const { data: existing } = await supabase
    .from('stripe_events_processed')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    log.info('Stripe event already processed — skipping (idempotent)')
    return NextResponse.json({ received: true, status: 'already_processed' })
  }

  // Procesar
  try {
    await handleStripeEvent(event, supabase, log)

    // Marcar como procesado SOLO tras éxito
    await supabase
      .from('stripe_events_processed')
      .insert({ stripe_event_id: event.id, event_type: event.type })

    return NextResponse.json({ received: true })
  } catch (err) {
    log.error({ err }, 'Stripe webhook handler failed — Stripe will retry')
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
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

      await supabase.from('compras').insert({
        user_id: session.metadata?.user_id ?? '',
        oposicion_id: session.metadata?.oposicion_id ?? '',
        tema_id: session.metadata?.tema_id ?? null,
        stripe_checkout_session_id: session.id,
        tipo: session.metadata?.tipo ?? 'tema',
        amount_paid: session.amount_total ?? 0,
      })
      log.info({ sessionId: session.id }, 'Compra registrada')
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
