import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, getOposicionFromProfile, getOposicionNombreFromProfile } from '@/lib/freemium'
import { callAIMini } from '@/lib/ai/provider'
import { getSystemExplainErrores } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'
import type { Pregunta, ExplicacionError } from '@/types/ai'

// Vercel Hobby max: 60s. AI explanation needs 10-30s.
export const maxDuration = 60

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
    .select('id, preguntas, respuestas_usuario, tipo, examen_oficial_id, completado, tema_id')
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
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
    return NextResponse.json(
      {
        error: 'No tienes correcciones disponibles.',
        code: 'PAYWALL_CORRECTIONS',
        upsell: [
          {
            id: 'recarga',
            name: 'Recarga de créditos IA',
            price: '9,99€',
            description: '+10 créditos IA',
          },
          {
            id: 'pack',
            name: 'Pack Oposición',
            price: '49,99€',
            description: 'Tests ilimitados + 20 créditos IA + simulacros',
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

  const oposicionNombre = await getOposicionNombreFromProfile(serviceSupabase, user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoFeatRow } = await (serviceSupabase as any).from('oposiciones').select('features').eq('id', oposicionId).single()
  const opoFeatures = (opoFeatRow as { features?: Record<string, boolean> } | null)?.features
  const systemPrompt = getSystemExplainErrores(oposicionNombre, opoFeatures)

  // Resolve the REAL tema title from the DB
  let realTemaTitulo: string | null = null
  if (testData.tema_id) {
    const { data: temaRow } = await serviceSupabase
      .from('temas')
      .select('numero, titulo')
      .eq('id', testData.tema_id)
      .single()
    if (temaRow) {
      realTemaTitulo = `Tema ${(temaRow as { numero: number; titulo: string }).numero} (${(temaRow as { numero: number; titulo: string }).titulo})`
    }
  }

  const preguntasTexto = erroneas
    .map(
      ({ pregunta, index, respuesta }) => {
        const cita = (pregunta as Pregunta & { cita?: { ley: string; articulo: string } }).cita
        return `Pregunta ${index + 1}${realTemaTitulo ? ` [Tema: ${realTemaTitulo}]` : ''}: ${pregunta.enunciado}\n` +
          (cita ? `Referencia: ${cita.ley}, Art. ${cita.articulo}\n` : '') +
          `Opciones: ${pregunta.opciones.map((o: string, i: number) => `${String.fromCharCode(65 + i)}) ${o}`).join('  ')}\n` +
          `Respuesta correcta: ${String.fromCharCode(65 + pregunta.correcta)}\n` +
          `Tu respuesta: ${respuesta !== null ? String.fromCharCode(65 + respuesta) : 'Sin responder'}`
      }
    )
    .join('\n\n')

  const userPrompt = `Analiza los errores del siguiente test:\n\n${preguntasTexto}`

  // Dynamic maxTokens based on error count
  const maxTokens = erroneas.length <= 5 ? 1500 : erroneas.length <= 10 ? 2500 : 3500

  let rawResponse: string
  try {
    rawResponse = await callAIMini(userPrompt, {
      systemPrompt,
      maxTokens,
      endpoint: 'explain-errores',
      userId: user.id,
      requestId,
      oposicionId,
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

  // Parse JSON response — handles v2 (diagnostico+grupos) and legacy formats
  type GrupoRaw = { patron: string; explicacion: string; errores: Array<{ num: number; correccion: string }>; truco: string }
  type ErrorSueltoRaw = { num: number; correccion: string; truco: string }
  type V2Response = { diagnostico: string; grupos?: GrupoRaw[]; errores_sueltos?: ErrorSueltoRaw[]; accion: string }
  type LegacyRaw = { numero: number; explicacion: string }
  type SocraticRaw = { num: number; empatia: string; pregunta_guia: string; revelacion: string; anclaje: string }

  let explicacionesRaw: Array<{ numero: number; explicacion: string }> = []
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const parsed2 = JSON.parse(jsonMatch[0])

    if ('diagnostico' in parsed2) {
      // V2 format — flatten grupos + errores_sueltos into per-error explanations
      const v2 = parsed2 as V2Response
      const header = `**DIAGNÓSTICO**\n${v2.diagnostico}\n`

      // Build explanations from groups
      for (const grupo of v2.grupos ?? []) {
        for (const err of grupo.errores) {
          explicacionesRaw.push({
            numero: err.num,
            explicacion: `${header}\n**${grupo.patron}**\n${grupo.explicacion}\n${err.correccion}\n\n💡 ${grupo.truco}`,
          })
        }
      }
      // Add standalone errors
      for (const err of v2.errores_sueltos ?? []) {
        explicacionesRaw.push({
          numero: err.num,
          explicacion: `${header}\n${err.correccion}\n\n💡 ${err.truco}`,
        })
      }
      // Append action to first explanation
      if (explicacionesRaw.length > 0 && v2.accion) {
        explicacionesRaw[0].explicacion += `\n\n**QUÉ HACER AHORA**\n${v2.accion}`
      }
    } else if (parsed2.explicaciones) {
      // Legacy socratic or simple format
      const items = parsed2.explicaciones as Array<SocraticRaw | LegacyRaw>
      explicacionesRaw = items.map((item) => {
        if ('empatia' in item) {
          return {
            numero: item.num,
            explicacion: [item.empatia, `→ ${item.pregunta_guia}`, item.revelacion, item.anclaje]
              .filter(Boolean)
              .join('\n'),
          }
        }
        return { numero: (item as LegacyRaw).numero, explicacion: (item as LegacyRaw).explicacion }
      })
    }
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
  try {
    if (hasPaidCredit) {
      await serviceSupabase.rpc('use_correction', { p_user_id: user.id })
    } else {
      await serviceSupabase.rpc('use_free_correction', { p_user_id: user.id })
    }
  } catch (creditErr) {
    log.error({ err: creditErr, userId: user.id }, 'Failed to deduct correction credit')
  }

  // ── 9. Log to api_usage_log for admin analytics ────────────────────────────
  try {
    await serviceSupabase.from('api_usage_log').insert({
      user_id: user.id,
      endpoint: 'explain-errores-stream',
      model: 'batch',
      tokens_in: 0,
      tokens_out: Math.ceil(rawResponse.length / 4),
      cost_estimated_cents: Math.round(Math.ceil(rawResponse.length / 4) * 0.0015),
      oposicion_id: oposicionId || null,
    })
  } catch {
    // Non-blocking — analytics logging should never break the response
  }

  log.info(
    { userId: user.id, testId, explicaciones: explicaciones.length, hasPaidCredit },
    '[explain-errores] explicaciones generadas correctamente'
  )

  return NextResponse.json({ explicaciones }, { status: 200 })
}
