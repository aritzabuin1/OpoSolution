import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callClaudeHaiku } from '@/lib/ai/claude'
import { logger } from '@/lib/logger'
import type { Pregunta, ExplicacionError } from '@/types/ai'

/**
 * POST /api/ai/explain-errores — §2.6A.5
 *
 * Explica los errores de un simulacro completado usando Claude Haiku.
 * PREMIUM: consume 1 corrections_balance (o free_corrector_used si free).
 *
 * Flujo (patrón BUG-010):
 *   1. Auth
 *   2. Validar input (testId)
 *   3. Anti-spam rate limit: 3 req/min
 *   4. Cargar test (debe ser simulacro, completado)
 *   5. Verificar créditos SIN descontar aún
 *   6. Rate limit silencioso: 5/día
 *   7. Llamar Claude Haiku con preguntas falladas (batch)
 *   8. Descontar crédito SOLO tras éxito
 *   9. Retornar { explicaciones }
 *
 * Coste: ~0.03€/sesión (1 call Haiku con todos los errores en batch)
 */

// ─── Schema ───────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ExplainEroresInputSchema = z.object({
  testId: z.string().regex(UUID_REGEX, 'testId debe ser un UUID válido'),
})

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_EXPLAIN_ERRORES = `Eres un experto en oposiciones a la Administración General del Estado española.
Tu tarea es explicar por qué el opositor se equivocó en cada pregunta de un examen oficial del INAP.

REGLAS:
1. Para cada pregunta: explica en 1-2 frases por qué la respuesta CORRECTA es correcta.
2. Menciona brevemente por qué la respuesta del opositor es errónea si ayuda a entenderlo.
3. Sé concreto, pedagógico y sin adornos.
4. Responde ÚNICAMENTE con JSON válido.

FORMATO JSON:
{
  "explicaciones": [
    { "numero": 1, "explicacion": "La respuesta correcta es C porque..." }
  ]
}` as const

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'explain-errores' })

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado. Inicia sesión para continuar.' },
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

  const parsed = ExplainEroresInputSchema.safeParse(body)
  if (!parsed.success) {
    const errores = parsed.error.issues.map((i) => i.message).join('; ')
    return NextResponse.json({ error: `Input inválido: ${errores}` }, { status: 400 })
  }

  const { testId } = parsed.data

  // ── 3. Anti-spam: 3 req/min ───────────────────────────────────────────────
  const antiSpam = await checkRateLimit(user.id, 'ai-explain', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // ── 4. Cargar test ────────────────────────────────────────────────────────
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
    return NextResponse.json(
      { error: 'El test aún no está completado.' },
      { status: 400 }
    )
  }

  if (testData.tipo !== 'simulacro' || !testData.examen_oficial_id) {
    return NextResponse.json(
      { error: 'La explicación de errores solo está disponible para simulacros oficiales.' },
      { status: 400 }
    )
  }

  const preguntas = testData.preguntas as Pregunta[]
  const respuestas = (testData.respuestas_usuario ?? []) as (number | null)[]

  // Extraer preguntas falladas
  const erroneas = preguntas
    .map((p, i) => ({ pregunta: p, index: i, respuesta: respuestas[i] }))
    .filter(
      ({ pregunta, respuesta }) =>
        respuesta !== null && respuesta !== pregunta.correcta
    )

  if (erroneas.length === 0) {
    return NextResponse.json(
      { explicaciones: [] },
      { status: 200 }
    )
  }

  // ── 5. Verificar créditos (SIN descontar — BUG-010) ─────────────────────
  const serviceSupabase = await createServiceClient()

  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2

  if (!hasPaidCredit && !hasFreeCredit) {
    return NextResponse.json(
      {
        error: 'No tienes correcciones disponibles.',
        code: 'PAYWALL_CORRECTIONS',
        upsell: [
          {
            id: 'recarga',
            name: 'Recarga de correcciones',
            price: '8,99€',
            description: '+15 correcciones IA',
          },
          {
            id: 'pack',
            name: 'Pack Oposición',
            price: '34,99€',
            description: 'Tests ilimitados + 20 correcciones + simulacros',
            badge: 'Más valor',
          },
        ],
      },
      { status: 402 }
    )
  }

  // ── 6. Rate limit silencioso: 5/día ──────────────────────────────────────
  const dailyLimit = await checkRateLimit(user.id, 'ai-explain-daily', 5, '24 h')
  if (!dailyLimit.success) {
    return NextResponse.json(
      { error: 'Has alcanzado el límite de 5 explicaciones diarias. Vuelve mañana.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(dailyLimit.resetAt) } }
    )
  }

  // ── 7. Llamar Claude Haiku ────────────────────────────────────────────────
  log.info(
    { userId: user.id, testId, errores: erroneas.length, hasPaidCredit },
    '[explain-errores] iniciando explicación'
  )

  const preguntasTexto = erroneas
    .map(
      ({ pregunta, index, respuesta }) =>
        `Pregunta ${index + 1}: ${pregunta.enunciado}\n` +
        `Opciones: A) ${pregunta.opciones[0]}  B) ${pregunta.opciones[1]}  ` +
        `C) ${pregunta.opciones[2]}  D) ${pregunta.opciones[3]}\n` +
        `Respuesta correcta: ${['A', 'B', 'C', 'D'][pregunta.correcta]}\n` +
        `Tu respuesta: ${respuesta !== null ? ['A', 'B', 'C', 'D'][respuesta] : 'Sin responder'}`
    )
    .join('\n\n')

  const userPrompt = `Explica los errores del siguiente examen INAP:

${preguntasTexto}

Responde en JSON con el array "explicaciones" donde cada item tiene "numero" (igual al número de pregunta) y "explicacion".`

  let rawResponse: string
  try {
    rawResponse = await callClaudeHaiku(userPrompt, {
      systemPrompt: SYSTEM_EXPLAIN_ERRORES,
      maxTokens: 2000,
      endpoint: 'explain-errores',
      userId: user.id,
      requestId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err, userId: user.id }, '[explain-errores] Claude Haiku failed')

    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible temporalmente. Inténtalo en un minuto.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar explicaciones. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  // Parse JSON response
  let explicacionesRaw: Array<{ numero: number; explicacion: string }> = []
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const parsed2 = JSON.parse(jsonMatch[0]) as { explicaciones: typeof explicacionesRaw }
    explicacionesRaw = parsed2.explicaciones ?? []
  } catch {
    log.warn({ rawResponse: rawResponse.slice(0, 200) }, '[explain-errores] JSON parse failed')
    // Fallback: crear explicaciones simples
    explicacionesRaw = erroneas.map(({ pregunta, index }) => ({
      numero: index + 1,
      explicacion: `La respuesta correcta es "${pregunta.opciones[pregunta.correcta]}".`,
    }))
  }

  // Mapear a ExplicacionError
  const explicaciones: ExplicacionError[] = erroneas.map(({ pregunta, index, respuesta }, i) => ({
    numero: index + 1,
    enunciado: pregunta.enunciado,
    tuRespuesta: respuesta as number,
    correcta: pregunta.correcta,
    explicacion: explicacionesRaw.find((e) => e.numero === index + 1)?.explicacion
      ?? explicacionesRaw[i]?.explicacion
      ?? `La respuesta correcta es "${pregunta.opciones[pregunta.correcta]}".`,
  }))

  // ── 8. Descontar crédito SOLO tras éxito (BUG-010) ────────────────────────
  if (hasPaidCredit) {
    void serviceSupabase.rpc('use_correction', { p_user_id: user.id })
  } else {
    void serviceSupabase.rpc('use_free_correction', { p_user_id: user.id })
  }

  log.info(
    { userId: user.id, testId, explicaciones: explicaciones.length, hasPaidCredit },
    '[explain-errores] explicaciones generadas correctamente'
  )

  return NextResponse.json({ explicaciones }, { status: 200 })
}
