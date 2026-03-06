import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_EXPLAIN_ERRORES_STREAM } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/explain-errores/stream
 *
 * Versión streaming de explain-errores. Misma lógica de auth/créditos,
 * pero retorna un ReadableStream de texto plano con las explicaciones
 * socráticas apareciendo token a token.
 *
 * UX: primer token en <500ms vs 3-5s de espera con la versión batch.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  testId: z.string().regex(UUID_REGEX, 'testId debe ser un UUID válido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'explain-errores-stream' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // ── 2. Validar input ────────────────────────────────────────────────────
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { testId } = parsed.data

  // ── 3. Anti-spam: 3 req/min ─────────────────────────────────────────────
  const antiSpam = await checkRateLimit(user.id, 'ai-explain', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // ── 4. Cargar test ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: testData, error: testError } = await (supabase as any)
    .from('tests_generados')
    .select('id, preguntas, respuestas_usuario, tipo, examen_oficial_id, completado')
    .eq('id', testId)
    .eq('user_id', user.id)
    .single()

  if (testError || !testData) {
    return NextResponse.json({ error: 'Test no encontrado.' }, { status: 404 })
  }
  if (!testData.completado) {
    return NextResponse.json({ error: 'El test aún no está completado.' }, { status: 400 })
  }
  if (testData.tipo !== 'simulacro' || !testData.examen_oficial_id) {
    return NextResponse.json({ error: 'Solo disponible para simulacros oficiales.' }, { status: 400 })
  }

  const preguntas = testData.preguntas as Pregunta[]
  const respuestas = (testData.respuestas_usuario ?? []) as (number | null)[]

  const erroneas = preguntas
    .map((p, i) => ({ pregunta: p, index: i, respuesta: respuestas[i] }))
    .filter(({ pregunta, respuesta }) => respuesta !== null && respuesta !== pregunta.correcta)

  if (erroneas.length === 0) {
    return NextResponse.json({ explicaciones: [] }, { status: 200 })
  }

  // ── 5. Verificar créditos (SIN descontar) ───────────────────────────────
  const serviceSupabase = await createServiceClient()
  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2

  if (!hasPaidCredit && !hasFreeCredit) {
    return NextResponse.json({
      error: 'No tienes correcciones disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // ── 6. Rate limit silencioso: 5/día ─────────────────────────────────────
  const dailyLimit = await checkRateLimit(user.id, 'ai-explain-daily', 5, '24 h')
  if (!dailyLimit.success) {
    return NextResponse.json(
      { error: 'Límite de 5 explicaciones diarias alcanzado.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(dailyLimit.resetAt) } }
    )
  }

  // ── 7. Build prompt ─────────────────────────────────────────────────────
  const preguntasTexto = erroneas
    .map(({ pregunta, index, respuesta }) =>
      `Pregunta ${index + 1}: ${pregunta.enunciado}\n` +
      `Opciones: A) ${pregunta.opciones[0]}  B) ${pregunta.opciones[1]}  ` +
      `C) ${pregunta.opciones[2]}  D) ${pregunta.opciones[3]}\n` +
      `Respuesta correcta: ${['A', 'B', 'C', 'D'][pregunta.correcta]}\n` +
      `Tu respuesta: ${respuesta !== null ? ['A', 'B', 'C', 'D'][respuesta] : 'Sin responder'}`
    )
    .join('\n\n')

  const userPrompt = `Explica los errores del siguiente examen INAP usando el método socrático:\n\n${preguntasTexto}`

  // ── 8. Stream Claude response ───────────────────────────────────────────
  log.info(
    { userId: user.id, testId, errores: erroneas.length, hasPaidCredit },
    '[explain-errores-stream] iniciando stream'
  )

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(SYSTEM_EXPLAIN_ERRORES_STREAM, userPrompt, {
      maxTokens: 2000,
      requestId,
      endpoint: 'explain-errores-stream',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, '[explain-errores-stream] failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar explicaciones.' }, { status: 500 })
  }

  // ── 9. Pipe through: encode + deduct credit on completion ───────────────
  const reader = aiStream.getReader()
  const encoder = new TextEncoder()
  const userId = user.id

  const responseStream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          // Stream completed — deduct credit (BUG-010 pattern)
          if (hasPaidCredit) {
            void serviceSupabase.rpc('use_correction', { p_user_id: userId })
          } else {
            void serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
          }
          log.info({ userId, testId }, '[explain-errores-stream] completado')
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(value))
      } catch (err) {
        log.error({ err }, '[explain-errores-stream] error during stream')
        controller.error(err)
      }
    },
    cancel() {
      reader.cancel()
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
