import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, checkIsAdmin, getOposicionFromProfile, getOposicionNombreFromProfile } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { getSystemExplainErroresStream } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'
import type { Pregunta } from '@/types/ai'

// Vercel Hobby max: 60s. Streaming needs connection open for full response.
export const maxDuration = 60

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
  // Available for all test types (tema, simulacro, radar, psicotecnico)

  const preguntas = testData.preguntas as Pregunta[]
  const respuestas = (testData.respuestas_usuario ?? []) as (number | null)[]

  const erroneas = preguntas
    .map((p, i) => ({ pregunta: p, index: i, respuesta: respuestas[i] }))
    .filter(({ pregunta, respuesta }) => respuesta !== null && respuesta !== pregunta.correcta)

  if (erroneas.length === 0) {
    return NextResponse.json({ explicaciones: [] }, { status: 200 })
  }

  // ── 5. Admin check — admin skips ALL limits ─────────────────────────────
  const serviceSupabase = await createServiceClient()
  const isAdmin = await checkIsAdmin(serviceSupabase, user.id)

  // ── 6. Verificar créditos (SIN descontar) — admin bypass ───────────────
  let hasPaidCredit = false
  let hasFreeCredit = false
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  if (!isAdmin) {
    const { data: profileCredits } = await serviceSupabase
      .from('profiles')
      .select('corrections_balance, free_corrector_used')
      .eq('id', user.id)
      .single()

    hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
    hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2
    const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

    if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
      return NextResponse.json({
        error: 'No tienes análisis disponibles.',
        code: 'PAYWALL_CORRECTIONS',
      }, { status: 402 })
    }
  }

  // ── 7. Build prompt ─────────────────────────────────────────────────────
  const oposicionNombre = await getOposicionNombreFromProfile(serviceSupabase, user.id)
  const systemPrompt = getSystemExplainErroresStream(oposicionNombre)

  const preguntasTexto = erroneas
    .map(({ pregunta, index, respuesta }) => {
      const tema = (pregunta as Pregunta & { temaTitulo?: string }).temaTitulo
      const cita = (pregunta as Pregunta & { cita?: { ley: string; articulo: string } }).cita
      return `Pregunta ${index + 1}${tema ? ` [Tema: ${tema}]` : ''}: ${pregunta.enunciado}\n` +
        (cita ? `Referencia: ${cita.ley}, Art. ${cita.articulo}\n` : '') +
        `Opciones: A) ${pregunta.opciones[0]}  B) ${pregunta.opciones[1]}  ` +
        `C) ${pregunta.opciones[2]}  D) ${pregunta.opciones[3]}\n` +
        `Respuesta correcta: ${['A', 'B', 'C', 'D'][pregunta.correcta]}\n` +
        `Tu respuesta: ${respuesta !== null ? ['A', 'B', 'C', 'D'][respuesta] : 'Sin responder'}`
    })
    .join('\n\n')

  const userPrompt = `Analiza los errores del siguiente test:\n\n${preguntasTexto}`

  // ── 8. Stream AI response ────────────────────────────────────────────────
  // Dynamic maxTokens based on error count
  const maxTokens = erroneas.length <= 5 ? 1500 : erroneas.length <= 10 ? 2500 : 3500

  log.info(
    { userId: user.id, testId, errores: erroneas.length, maxTokens, hasPaidCredit },
    '[explain-errores-stream] iniciando stream'
  )

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(systemPrompt, userPrompt, {
      maxTokens,
      requestId,
      endpoint: 'explain-errores-stream',
      useHeavyModel: true, // Paid feature — use Sonnet/GPT-5 for quality
      userId: user.id,
      oposicionId,
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
  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'explain-errores-stream',
    context: { testId, errores: erroneas.length },
    onComplete: async () => {
      // Admin: no credit deduction
      if (isAdmin) return
      if (hasPaidCredit) {
        await serviceSupabase.rpc('use_correction', { p_user_id: userId })
      } else {
        await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
      }
    },
  })
}
