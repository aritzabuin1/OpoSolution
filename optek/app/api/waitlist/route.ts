import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWaitlistConfirmation } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/waitlist
 *
 * Registra un email en la lista de espera para una oposición no activa.
 * Rate-limited por IP (Upstash middleware aplica globalmente).
 * GDPR: el frontend debe mostrar opt-in explícito antes de enviar.
 */

const BodySchema = z.object({
  email: z.string().email(),
  oposicionSlug: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Email o oposición inválidos' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Verify the oposicion exists and is NOT active (only allow waitlist for inactive)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opo } = await (supabase as any)
    .from('oposiciones')
    .select('activa, nombre')
    .eq('slug', body.oposicionSlug)
    .single() as { data: { activa: boolean; nombre: string } | null }

  if (!opo) {
    return NextResponse.json({ error: 'Oposición no encontrada' }, { status: 404 })
  }

  if (opo.activa) {
    return NextResponse.json({ error: 'Esta oposición ya está disponible. ¡Regístrate directamente!' }, { status: 409 })
  }

  // Upsert — idempotent, no error on duplicate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('waitlist')
    .upsert(
      { email: body.email, oposicion_slug: body.oposicionSlug },
      { onConflict: 'email,oposicion_slug' }
    )

  if (error) {
    logger.error({ error, email: '***', slug: body.oposicionSlug }, 'Waitlist insert failed')
    return NextResponse.json({ error: 'Error al registrarse' }, { status: 500 })
  }

  // Send confirmation email (fire-and-forget — don't block the response)
  void sendWaitlistConfirmation({ to: body.email, oposicionNombre: opo.nombre })

  return NextResponse.json({ ok: true })
}
