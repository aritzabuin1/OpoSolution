import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_EXPLAIN_FLASHCARD } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'

export const maxDuration = 60

/**
 * POST /api/ai/explain-flashcard/stream
 *
 * Explicación profunda IA de una flashcard fallada.
 * Consume 1 análisis detallado. Streaming de texto plano.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  flashcardId: z.string().regex(UUID_REGEX, 'flashcardId debe ser un UUID válido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'explain-flashcard-stream' })

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
  const { flashcardId } = parsed.data

  // Anti-spam
  const antiSpam = await checkRateLimit(user.id, 'ai-explain-fc', 5, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Load flashcard
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fc, error: fetchErr } = await (serviceSupabase as any)
    .from('flashcards')
    .select('id, user_id, frente, reverso, cita_legal')
    .eq('id', flashcardId)
    .single()

  if (fetchErr || !fc) {
    return NextResponse.json({ error: 'Flashcard no encontrada.' }, { status: 404 })
  }
  if ((fc as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
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
  type FlashcardRow = { frente: string; reverso: string; cita_legal: { ley: string; articulo: string; texto_ref: string } | null }
  const fcData = fc as FlashcardRow
  const cita = fcData.cita_legal
  const citaTexto = cita
    ? `\nReferencia legal: ${cita.ley}, Art. ${cita.articulo}\nTexto de referencia: ${cita.texto_ref}`
    : ''

  const userPrompt = `El opositor ha fallado esta flashcard y necesita entender el concepto:\n\nPregunta: ${fcData.frente}\nRespuesta correcta: ${fcData.reverso}${citaTexto}`

  // Stream
  log.info({ userId: user.id, flashcardId, hasPaidCredit }, 'starting stream')

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(SYSTEM_EXPLAIN_FLASHCARD, userPrompt, {
      maxTokens: 1000,
      requestId,
      endpoint: 'explain-flashcard-stream',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, 'failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar explicación.' }, { status: 500 })
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
          log.info({ userId, flashcardId }, 'completed')
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
