import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { gradeCazaTrampas } from '@/lib/ai/grade-cazatrampas'
import { logger } from '@/lib/logger'

/**
 * POST /api/cazatrampas/[id]/grade — §2.12.10
 *
 * Evalúa las respuestas del usuario (100% determinista).
 *
 * Input: { detecciones: [{ valor_trampa_detectado, valor_original_propuesto }] }
 * Output: { puntuacion, aciertos, total, detalles, erroresReales }
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GradeSchema = z.object({
  detecciones: z.array(z.object({
    valor_trampa_detectado: z.string().min(1),
    valor_original_propuesto: z.string().min(1),
  })).min(1).max(10),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'cazatrampas/grade', sesionId: id })

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // Parse body
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = GradeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input inválido.' }, { status: 400 })
  }

  try {
    const resultado = await gradeCazaTrampas(id, user.id, parsed.data.detecciones)
    log.info({ puntuacion: resultado.puntuacion }, '[cazatrampas/grade] OK')
    return NextResponse.json(resultado, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al evaluar.'
    const status = msg === 'No autorizado' ? 403 : msg === 'Sesión no encontrada' ? 404 : 500
    if (status === 500) log.error({ err }, '[cazatrampas/grade] error')
    return NextResponse.json({ error: msg }, { status })
  }
}
