import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_ANALYZE_CAZATRAMPAS } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'

export const maxDuration = 60

/**
 * POST /api/ai/analyze-cazatrampas/stream
 *
 * Análisis profundo IA de una sesión Caza-Trampas completada.
 * Consume 1 análisis detallado. Streaming de texto plano.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  sesionId: z.string().regex(UUID_REGEX, 'sesionId debe ser un UUID válido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'analyze-cazatrampas-stream' })

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
  const { sesionId } = parsed.data

  // Anti-spam
  const antiSpam = await checkRateLimit(user.id, 'ai-analyze-ct', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Load session
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sesion, error: fetchErr } = await (serviceSupabase as any)
    .from('cazatrampas_sesiones')
    .select('id, user_id, texto_original, texto_trampa, errores_reales, ley_nombre, articulo_numero, completada_at')
    .eq('id', sesionId)
    .single()

  if (fetchErr || !sesion) {
    return NextResponse.json({ error: 'Sesión no encontrada.' }, { status: 404 })
  }
  if (sesion.user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  if (!sesion.completada_at) {
    return NextResponse.json({ error: 'Completa el ejercicio antes de pedir el análisis.' }, { status: 400 })
  }

  // Check credits
  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2

  if (!hasPaidCredit && !hasFreeCredit) {
    return NextResponse.json({
      error: 'No tienes análisis detallados disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // Build prompt
  type ErrorReal = { tipo: string; valor_original: string; valor_trampa: string; explicacion: string }
  const errores = sesion.errores_reales as ErrorReal[]
  const trampasTexto = errores
    .map((e: ErrorReal, i: number) =>
      `Trampa ${i + 1} (${e.tipo}):\n` +
      `  Original: "${e.valor_original}"\n` +
      `  Modificado a: "${e.valor_trampa}"\n` +
      `  Explicación básica: ${e.explicacion}`
    )
    .join('\n\n')

  const userPrompt = `Analiza en profundidad las siguientes trampas del ejercicio Caza-Trampas sobre ${sesion.ley_nombre}, Art. ${sesion.articulo_numero}:\n\n${trampasTexto}`

  // Stream
  log.info({ userId: user.id, sesionId, trampas: errores.length, hasPaidCredit }, 'starting stream')

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(SYSTEM_ANALYZE_CAZATRAMPAS, userPrompt, {
      maxTokens: 1500,
      requestId,
      endpoint: 'analyze-cazatrampas-stream',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, 'failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar análisis.' }, { status: 500 })
  }

  // Pipe + deduct credit on completion
  const reader = aiStream.getReader()
  const encoder = new TextEncoder()
  const userId = user.id

  const responseStream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          try {
            if (hasPaidCredit) {
              await serviceSupabase.rpc('use_correction', { p_user_id: userId })
            } else {
              await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
            }
          } catch (creditErr) {
            log.error({ err: creditErr, userId }, 'Failed to deduct credit')
          }
          log.info({ userId, sesionId }, 'completed')
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(value))
      } catch (err) {
        log.error({ err }, 'error during stream')
        controller.error(err)
      }
    },
    cancel() { reader.cancel() },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
