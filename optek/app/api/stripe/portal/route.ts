import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/stripe/portal
 *
 * Redirige al usuario al Stripe Customer Portal para gestionar sus compras
 * (historial de pagos, descargar facturas).
 *
 * Requiere que el usuario tenga un stripe_customer_id guardado en profiles.
 * Si no lo tiene, retorna 404 (nunca ha realizado compras).
 */

export async function POST() {
  const supabase = await createClient()
  const log = logger.child({ route: 'POST /api/stripe/portal' })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Buscar stripe_customer_id en profiles
  // Nota: stripe_customer_id se añade en migración pendiente — cast necesario hasta regenerar tipos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single() as { data: { stripe_customer_id?: string } | null }

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Sin compras registradas — no hay portal disponible' },
      { status: 404 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id!,
      return_url: `${appUrl}/cuenta`,
    })

    log.info({ userId: user.id }, 'Portal Stripe session creada')

    return NextResponse.json({ url: session.url })
  } catch (err) {
    log.error({ err, userId: user.id }, 'Error al crear portal Stripe')
    return NextResponse.json({ error: 'Error al abrir el portal de pagos' }, { status: 500 })
  }
}
