import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generateCazaTrampas } from '@/lib/ai/generate-cazatrampas'
import { logger } from '@/lib/logger'
import { FREE_LIMITS, PAID_LIMITS, checkPaidAccess, checkIsAdmin, getOposicionFromTema, getOposicionFromProfile } from '@/lib/freemium'

// Vercel Hobby max: 60s. AI generation needs 15-40s.
export const maxDuration = 60

/**
 * POST /api/cazatrampas/generate — §2.12.9, §2.12.17
 *
 * Genera una sesión Caza-Trampas.
 * Rate limit (§2.12.17):
 *   - Free:  3 partidas/día (fricción positiva → conversión)
 *   - Paid:  ilimitado (usuarios con alguna compra en `compras`)
 *
 * Input: { temaId?: string, numErrores?: 1|2|3 }
 * Output: { id, texto_trampa, numErrores, leyNombre, articuloNumero, tituloCap }
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const FREE_DAILY_LIMIT = FREE_LIMITS.cazatrampasDay

const GenerateSchema = z.object({
  temaId: z.string().regex(UUID_REGEX).optional(),
  numErrores: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(3),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'cazatrampas/generate' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // Parse body
  let body: unknown
  try { body = await request.json() } catch {
    body = {}
  }
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input inválido.' }, { status: 400 })
  }
  const { temaId, numErrores } = parsed.data

  // ── Rate limit diferenciado (§2.12.17) ──────────────────────────────────────
  // Paid users (compra OR is_admin) → sin límite
  // Free users → FREE_DAILY_LIMIT partidas/día
  const svcSupabase = await createServiceClient()
  const oposicionId = temaId
    ? await getOposicionFromTema(svcSupabase, temaId)
    : await getOposicionFromProfile(svcSupabase, user.id)
  const [isPaid, isAdmin] = await Promise.all([
    checkPaidAccess(svcSupabase, user.id, oposicionId),
    checkIsAdmin(svcSupabase, user.id),
  ])

  // Free users: numErrores 3 (dificil) requiere Premium
  if (!isPaid && numErrores === 3) {
    return NextResponse.json(
      { error: 'El nivel Dificil (3 errores) requiere acceso Premium.', upgrade: true },
      { status: 402 }
    )
  }

  if (isPaid && !isAdmin) {
    // Paid: rate limit silencioso anti-abuso
    const rateLimit = await checkRateLimit(user.id, 'cazatrampas-paid-daily', PAID_LIMITS.cazatrampasDay, '24 h')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite diario. Vuelve mañana.' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
      )
    }
  } else if (!isPaid) {
    const rateLimit = await checkRateLimit(user.id, 'cazatrampas-daily', FREE_DAILY_LIMIT, '24 h')
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Has usado tus ${FREE_DAILY_LIMIT} partidas gratuitas de hoy. Con el Pack Oposición tienes partidas ilimitadas.`,
          upgrade: true,
        },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
      )
    }
  }

  try {
    const sesion = await generateCazaTrampas(user.id, temaId, numErrores, oposicionId)
    log.info({ sesionId: sesion.id, numErrores: sesion.numErrores }, '[cazatrampas/generate] OK')
    return NextResponse.json(sesion, { status: 201 })
  } catch (err) {
    log.error({ err }, '[cazatrampas/generate] error')
    const msg = err instanceof Error ? err.message : 'Error al generar el ejercicio.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
