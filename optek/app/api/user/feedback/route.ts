import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { sendFeedbackNotification } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/user/feedback — §2.7.3
 *
 * Recibe sugerencias, reportes de errores y solicitudes de funcionalidades.
 * Rate limit: 5 sugerencias/día por usuario.
 *
 * Input: { tipo, mensaje, pagina_origen? }
 * Output: { id } de la sugerencia creada
 */

// ─── Schema ───────────────────────────────────────────────────────────────────

const FeedbackSchema = z.object({
  tipo: z.enum(['sugerencia', 'error', 'funcionalidad', 'otro']),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000, 'El mensaje no puede superar los 2000 caracteres').trim(),
  pagina_origen: z.string().max(500).optional(),
})

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'feedback' })

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado.' },
      { status: 401 }
    )
  }

  // ── 2. Validar input ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success) {
    const errores = parsed.error.issues.map((i) => i.message).join('; ')
    return NextResponse.json({ error: `Input inválido: ${errores}` }, { status: 400 })
  }

  const { tipo, mensaje, pagina_origen } = parsed.data

  // ── 3. Rate limit: 5/día ──────────────────────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'user-feedback', 5, '24 h')
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Has enviado demasiadas sugerencias hoy. Vuelve mañana.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
    )
  }

  // ── 4. Insertar en BD ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: dbError } = await (supabase as any)
    .from('sugerencias')
    .insert({
      user_id: user.id,
      tipo,
      mensaje,
      pagina_origen: pagina_origen ?? null,
    })
    .select('id')
    .single()

  if (dbError) {
    log.error({ err: dbError, userId: user.id }, '[feedback] DB error')
    return NextResponse.json(
      { error: 'Error al enviar la sugerencia. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  log.info({ userId: user.id, tipo, id: inserted?.id }, '[feedback] sugerencia recibida')

  // §2.7.6 — Notificación email a Aritz (fire-and-forget, no bloquea la respuesta)
  void sendFeedbackNotification({
    tipo,
    mensaje,
    paginaOrigen: pagina_origen,
  })

  return NextResponse.json({ id: inserted?.id }, { status: 201 })
}
