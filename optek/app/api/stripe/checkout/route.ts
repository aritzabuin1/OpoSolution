import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe, STRIPE_PRICES, TIER_TO_OPOSICION, type StripePriceTier } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/stripe/checkout
 *
 * Crea una Stripe Checkout Session y retorna la URL de pago.
 *
 * Body: { tier: 'pack'|'pack_c1'|'pack_doble'|'recarga'|..., temaId?: string, oposicionId?: string }
 *
 * El userId se obtiene de la sesión Supabase (no del body — previene suplantación).
 * Los metadata de Stripe se usan en el webhook para completar la compra.
 * oposicionId se deriva automáticamente del tier (TIER_TO_OPOSICION).
 *
 * Ref: ADR-0010 (Fuel Tank), ADR-0008 (Stripe)
 */

const BodySchema = z.object({
  tier: z.enum([
    'pack', 'pack_c1', 'pack_a2', 'pack_doble', 'pack_triple',
    'pack_correos',
    'pack_auxilio', 'pack_tramitacion', 'pack_gestion_j', 'pack_doble_justicia', 'pack_triple_justicia',
    'recarga',
  ]),
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

  const { tier, temaId } = body

  // Derivar oposicionId del tier (no confiar en body — previene suplantación)
  const oposicionMapping = TIER_TO_OPOSICION[tier as StripePriceTier]
  // For combo packs (arrays), serialize as comma-separated for metadata
  const oposicionId = Array.isArray(oposicionMapping)
    ? oposicionMapping.join(',')
    : (oposicionMapping || '')

  // Recarga solo para usuarios premium (forzar compra de pack primero)
  if (tier === 'recarga') {
    const serviceClient = await createServiceClient()
    const [{ count: purchaseCount }, { data: profileData }] = await Promise.all([
      serviceClient
        .from('compras')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single(),
    ])
    const prof = profileData as { is_admin?: boolean } | null
    const hasPremium = (purchaseCount ?? 0) > 0 || prof?.is_admin === true
    if (!hasPremium) {
      log.warn({ userId: user.id }, 'Free user intentó comprar recarga')
      return NextResponse.json(
        { error: 'La recarga solo está disponible para usuarios premium. Adquiere primero un Pack Oposición.' },
        { status: 402 }
      )
    }
  }

  // Verificar que el precio está configurado en env
  const priceId = STRIPE_PRICES[tier as StripePriceTier]
  if (!priceId) {
    log.error({ tier }, 'Precio Stripe no configurado para tier')
    return NextResponse.json({ error: 'Producto no disponible' }, { status: 503 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/tests?compra=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/tests?compra=cancelada`,
      // Métodos de pago: sin payment_method_types → Stripe usa los habilitados
      // en Dashboard → Settings → Payment methods (modo automático).
      // Apple Pay / Google Pay aparecen si el dominio está verificado en Dashboard.
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
