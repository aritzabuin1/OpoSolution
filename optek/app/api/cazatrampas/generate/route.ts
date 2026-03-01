import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generateCazaTrampas } from '@/lib/ai/generate-cazatrampas'
import { logger } from '@/lib/logger'

/**
 * POST /api/cazatrampas/generate — §2.12.9
 *
 * Genera una sesión Caza-Trampas.
 * Rate limit: 20/día (sin créditos — es gratuito como los simulacros).
 *
 * Input: { temaId?: string, numErrores?: 1|2|3 }
 * Output: { id, texto_trampa, numErrores, leyNombre, articuloNumero, tituloCap }
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  // Rate limit
  const rateLimit = await checkRateLimit(user.id, 'cazatrampas-daily', 20, '24 h')
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Límite diario alcanzado. Vuelve mañana.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
    )
  }

  try {
    const sesion = await generateCazaTrampas(user.id, temaId, numErrores)
    log.info({ sesionId: sesion.id, numErrores: sesion.numErrores }, '[cazatrampas/generate] OK')
    return NextResponse.json(sesion, { status: 201 })
  } catch (err) {
    log.error({ err }, '[cazatrampas/generate] error')
    const msg = err instanceof Error ? err.message : 'Error al generar el ejercicio.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
