import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_INFORME_SIMULACRO } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'
import type { Pregunta } from '@/types/ai'

export const maxDuration = 60

/**
 * POST /api/ai/informe-simulacro/stream
 *
 * Informe personalizado IA de un simulacro completado.
 * Consume 1 análisis detallado. Streaming de texto plano.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  testId: z.string().regex(UUID_REGEX, 'testId debe ser un UUID válido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'informe-simulacro-stream' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // Validate
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { testId } = parsed.data

  // Anti-spam
  const antiSpam = await checkRateLimit(user.id, 'ai-informe-sim', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Load test
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: testData, error: testError } = await (supabase as any)
    .from('tests_generados')
    .select('id, preguntas, respuestas_usuario, puntuacion, tipo, examen_oficial_id, completado, tiempo_segundos')
    .eq('id', testId)
    .eq('user_id', user.id)
    .single()

  if (testError || !testData) {
    return NextResponse.json({ error: 'Test no encontrado.' }, { status: 404 })
  }
  if (!testData.completado) {
    return NextResponse.json({ error: 'El simulacro aún no está completado.' }, { status: 400 })
  }
  if (testData.tipo !== 'simulacro' || !testData.examen_oficial_id) {
    return NextResponse.json({ error: 'Solo disponible para simulacros oficiales.' }, { status: 400 })
  }

  // Check credits
  const serviceSupabase = await createServiceClient()
  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2
  const isPaid = await checkPaidAccess(serviceSupabase, user.id)

  if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
    return NextResponse.json({
      error: 'No tienes análisis detallados disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // Build stats for prompt
  const preguntas = testData.preguntas as Pregunta[]
  const respuestas = (testData.respuestas_usuario ?? []) as (number | null)[]

  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
  const errores = preguntas.filter((p, i) => respuestas[i] !== null && respuestas[i] !== p.correcta).length
  const sinResponder = preguntas.filter((_, i) => respuestas[i] === null).length
  const notaPenalizacion = Math.max(0, aciertos - errores / 3)

  // Per-tema breakdown
  const temaStats = new Map<string, { total: number; aciertos: number; errores: number }>()
  preguntas.forEach((p, i) => {
    const key = p.temaTitulo ?? 'Sin tema'
    if (!temaStats.has(key)) temaStats.set(key, { total: 0, aciertos: 0, errores: 0 })
    const s = temaStats.get(key)!
    s.total++
    if (respuestas[i] === p.correcta) s.aciertos++
    else if (respuestas[i] !== null) s.errores++
  })

  const temaBreakdown = [...temaStats.entries()]
    .map(([tema, s]) => `  ${tema}: ${s.aciertos}/${s.total} aciertos (${Math.round((s.aciertos / s.total) * 100)}%)`)
    .join('\n')

  // Errores detallados (máx 15 para no exceder tokens)
  const preguntasErroneas = preguntas
    .map((p, i) => ({ p, i, r: respuestas[i] }))
    .filter(({ p, r }) => r !== null && r !== p.correcta)
    .slice(0, 15)

  const erroresDetalle = preguntasErroneas
    .map(({ p, i, r }) =>
      `P${i + 1}: ${p.enunciado.slice(0, 100)}...\n` +
      `  Tu respuesta: ${r !== null ? p.opciones[r] : '-'}\n` +
      `  Correcta: ${p.opciones[p.correcta]}` +
      (p.temaTitulo ? `\n  Tema: ${p.temaTitulo}` : '')
    )
    .join('\n\n')

  const tiempoMin = testData.tiempo_segundos
    ? `${Math.floor(testData.tiempo_segundos / 60)} minutos ${testData.tiempo_segundos % 60} segundos`
    : 'no registrado'

  const userPrompt = `Datos del simulacro:
- Total preguntas: ${preguntas.length}
- Aciertos: ${aciertos} | Errores: ${errores} | Sin responder: ${sinResponder}
- Puntuación: ${testData.puntuacion}%
- Nota con penalización (-1/3): ${notaPenalizacion.toFixed(2)} sobre ${preguntas.length}
- Tiempo: ${tiempoMin}

Desglose por tema:
${temaBreakdown || '  No disponible'}

Preguntas falladas (detalle):
${erroresDetalle || '  Ninguna'}`

  // Stream
  log.info({ userId: user.id, testId, aciertos, errores, hasPaidCredit }, 'starting stream')

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(SYSTEM_INFORME_SIMULACRO, userPrompt, {
      maxTokens: 2500,
      requestId,
      endpoint: 'informe-simulacro-stream',
      useHeavyModel: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, 'failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar informe.' }, { status: 500 })
  }

  // Pipe + deduct credit on completion
  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'informe-simulacro-stream',
    context: { testId, aciertos, errores },
    onComplete: async () => {
      if (hasPaidCredit) {
        await serviceSupabase.rpc('use_correction', { p_user_id: userId })
      } else {
        await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
      }
    },
  })
}
