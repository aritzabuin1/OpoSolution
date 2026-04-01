import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, CORRECTIONS_GRANTED, TIER_TO_OPOSICION } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPostPurchaseEmail } from '@/lib/email/client'
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
      // ALL pack tiers map to 'pack_oposicion' — the constraint doesn't distinguish ramas
      const TIER_TO_DB_TIPO: Record<string, string> = {
        pack: 'pack_oposicion',
        pack_c1: 'pack_oposicion',
        pack_a2: 'pack_oposicion',
        pack_doble: 'pack_oposicion',
        pack_triple: 'pack_oposicion',
        pack_correos: 'pack_oposicion',
        pack_auxilio: 'pack_oposicion',
        pack_tramitacion: 'pack_oposicion',
        pack_gestion_j: 'pack_oposicion',
        pack_doble_justicia: 'pack_oposicion',
        pack_triple_justicia: 'pack_oposicion',
        pack_hacienda: 'pack_oposicion',
        pack_penitenciarias: 'pack_oposicion',
        pack_ertzaintza: 'pack_oposicion',
        pack_guardia_civil: 'pack_oposicion',
        pack_policia_nacional: 'pack_oposicion',
        pack_doble_gc_pn: 'pack_oposicion',
        pack_personalidad: 'pack_oposicion',
        pack_completo_seguridad: 'pack_oposicion',
        recarga: 'pack_oposicion',
      }
      const dbTipo = TIER_TO_DB_TIPO[tier] ?? 'pack_oposicion'

      // 1. Registrar compra(s)
      // RECARGA: NO crea fila en compras — solo otorga créditos (paso 2).
      // Si creara fila, checkPaidAccess la contaría como acceso premium (bug: 9,99€ desbloquea todo).
      if (tier === 'recarga') {
        // Skip compra insert for recargas — only grant credits in step 2
      } else {
        // Resolve oposicion IDs from TIER_TO_OPOSICION (supports combos)
        const mapping = TIER_TO_OPOSICION[tier as keyof typeof TIER_TO_OPOSICION]
        let oposicionIds = Array.isArray(mapping)
          ? mapping
          : mapping ? [mapping] : [oposicionIdMeta]

        // Pack Completo Seguridad / Personalidad: resolve from user's profile
        // (these tiers have '' in TIER_TO_OPOSICION because they're user-dependent)
        if ((tier === 'pack_completo_seguridad' || tier === 'pack_personalidad') && (!oposicionIds[0] || oposicionIds[0] === '')) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('oposicion_id')
            .eq('id', userId)
            .single()
          const userOpoId = (userProfile as { oposicion_id?: string } | null)?.oposicion_id
          if (userOpoId) {
            oposicionIds = [userOpoId]
          }
        }

        // Insert one compra row per oposición (combos get multiple rows)
        const compraRows = oposicionIds
          .filter(id => id) // skip empty
          .map((opId, idx) => ({
            user_id: userId,
            oposicion_id: opId,
            tema_id: idx === 0 ? (session.metadata?.tema_id ?? null) : null,
            stripe_checkout_session_id: idx === 0 ? session.id : `${session.id}_${idx}`,
            tipo: dbTipo,
            amount_paid: idx === 0 ? (session.amount_total ?? 0) : 0,
          }))

        if (compraRows.length > 0) {
          await supabase.from('compras').insert(compraRows)
        }
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

      // supuestos_balance removed — supuesto desarrollo now uses créditos IA (2 per use)

      log.info({ sessionId: session.id, tier, dbTipo }, 'Compra registrada')

      // Post-purchase review email (fire-and-forget, non-blocking)
      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(userId)
          if (user?.email) {
            const nombre = user.user_metadata?.full_name as string | undefined
            void sendPostPurchaseEmail({ to: user.email, nombre })
          }
        } catch {
          // Non-critical
        }
      })()

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
