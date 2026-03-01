import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, STRIPE_PRICES, type StripePriceTier } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/stripe/checkout
 *
 * Crea una Stripe Checkout Session y retorna la URL de pago.
 *
 * Body: { tier: 'tema'|'pack'|'recarga', temaId?: string }
 *
 * El userId se obtiene de la sesión Supabase (no del body — previene suplantación).
 * Los metadata de Stripe se usan en el webhook para completar la compra.
 *
 * Ref: ADR-0010 (Fuel Tank), ADR-0008 (Stripe)
 */

const BodySchema = z.object({
  tier: z.enum(['tema', 'pack', 'recarga']),
  temaId: z.string().uuid().optional(),
  oposicionId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const log = logger.child({ route: 'POST /api/stripe/checkout' })

  // Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Validar body
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { tier, temaId, oposicionId } = body

  // Verificar que el precio está configurado en env
  const priceId = STRIPE_PRICES[tier as StripePriceTier]
  if (!priceId) {
    log.error({ tier }, 'Precio Stripe no configurado para tier')
    return NextResponse.json({ error: 'Producto no disponible' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/tests?compra=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/tests?compra=cancelada`,
      // Metadata que el webhook usa para completar la compra
      metadata: {
        user_id: user.id,
        tier,
        tema_id: temaId ?? '',
        oposicion_id: oposicionId ?? '',
      },
      // Pre-rellenar email si lo tenemos
      customer_email: user.email,
      // Locale español
      locale: 'es',
      // Permitir guardar pago para futuras compras (optional)
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          tier,
        },
      },
    })

    log.info({ userId: user.id, tier, sessionId: session.id }, 'Checkout session creada')

    return NextResponse.json({ url: session.url })
  } catch (err) {
    log.error({ err, userId: user.id, tier }, 'Error al crear Stripe Checkout session')
    return NextResponse.json({ error: 'Error al iniciar el pago' }, { status: 500 })
  }
}
