import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_ROADMAP } from '@/lib/ai/prompts'
import { calcularIPR } from '@/lib/utils/ipr'
import { logger } from '@/lib/logger'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'

// Vercel Hobby max: 60s. Streaming needs connection open for full response.
export const maxDuration = 60

/**
 * POST /api/ai/generate-roadmap/stream
 *
 * Genera un plan de estudio personalizado basado en TODAS las métricas del usuario.
 * Recopila datos server-side (temas, tests, IPR, racha, fecha examen) y envía
 * al modelo como prompt. Consume 1 análisis.
 *
 * Streaming: primer token en <500ms, plan completo en ~10-15s.
 */

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-roadmap' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // ── 2. Anti-spam: 3 req/min ────────────────────────────────────────────
  const antiSpam = await checkRateLimit(user.id, 'ai-roadmap', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // ── 3. Verificar créditos (SIN descontar) ─────────────────────────────
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await (serviceSupabase as any)
    .from('profiles')
    .select('corrections_balance, free_corrector_used, racha_actual, fecha_examen')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as {
    corrections_balance?: number
    free_corrector_used?: number
    racha_actual?: number
    fecha_examen?: string | null
  } | null

  const hasPaidCredit = (profile?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profile?.free_corrector_used ?? 0) < 2
  const isPaid = await checkPaidAccess(serviceSupabase, user.id)

  if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
    return NextResponse.json({
      error: 'No tienes análisis disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // ── 4. Daily limit: 3/day ─────────────────────────────────────────────
  const dailyLimit = await checkRateLimit(user.id, 'ai-roadmap-daily', 3, '24 h')
  if (!dailyLimit.success) {
    return NextResponse.json(
      { error: 'Límite de 3 planes de estudio diarios alcanzado.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(dailyLimit.resetAt) } }
    )
  }

  // ── 5. Recopilar TODOS los datos del usuario ───────────────────────────
  const [
    { data: tests },
    { data: temas },
  ] = await Promise.all([
    supabase
      .from('tests_generados')
      .select('id, created_at, puntuacion, tema_id, preguntas, tipo')
      .eq('user_id', user.id)
      .eq('completado', true)
      .order('created_at', { ascending: false })
      .limit(100),
    serviceSupabase
      .from('temas')
      .select('id, numero, titulo')
      .order('numero', { ascending: true }),
  ])

  const testsCompletados = tests ?? []
  const allTemas = temas ?? []
  const rachaActual = profile?.racha_actual ?? 0
  const fechaExamen = profile?.fecha_examen ?? null

  // ── 5b. Calcular métricas derivadas ────────────────────────────────────

  // IPR
  const ipr = calcularIPR(
    testsCompletados.map(t => ({ puntuacion: t.puntuacion ?? 0, created_at: t.created_at })),
    rachaActual
  )

  // Score por tema
  const scoreByTema: Record<string, { sum: number; count: number }> = {}
  for (const t of testsCompletados) {
    if (t.tema_id && t.puntuacion != null) {
      if (!scoreByTema[t.tema_id]) scoreByTema[t.tema_id] = { sum: 0, count: 0 }
      scoreByTema[t.tema_id].sum += t.puntuacion
      scoreByTema[t.tema_id].count += 1
    }
  }

  const temaScores = allTemas.map(tema => {
    const data = scoreByTema[tema.id]
    return {
      numero: tema.numero,
      titulo: tema.titulo,
      notaMedia: data ? Math.round(data.sum / data.count) : null,
      testsCount: data?.count ?? 0,
    }
  })

  // Días para examen
  const diasParaExamen = fechaExamen
    ? Math.ceil((new Date(fechaExamen).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // ── 6. Construir prompt con datos reales ───────────────────────────────
  const temasTexto = temaScores.map(t => {
    const bloque = t.numero <= 16 ? 'I' : 'II'
    if (t.notaMedia === null) {
      return `- T${t.numero} (Bloque ${bloque}): "${t.titulo}" → SIN DATOS (no ha hecho tests)`
    }
    return `- T${t.numero} (Bloque ${bloque}): "${t.titulo}" → ${t.notaMedia}% acierto (${t.testsCount} tests)`
  }).join('\n')

  const parts: string[] = [
    `DATOS DEL OPOSITOR:`,
    `- Tests completados: ${testsCompletados.length}`,
    `- Nota media global: ${testsCompletados.length > 0
      ? Math.round(testsCompletados.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / testsCompletados.length) + '%'
      : 'Sin datos'}`,
    `- Racha actual: ${rachaActual} días consecutivos`,
  ]

  if (ipr) {
    parts.push(
      `- IPR (Índice Personal de Rendimiento): ${ipr.score}/100 (nivel: ${ipr.nivel}, tendencia: ${ipr.tendencia})`,
      `  Componentes: rendimiento ${ipr.components.rendimiento}%, constancia ${ipr.components.constancia}%, progresión ${ipr.components.progresion}%`
    )
  }

  if (diasParaExamen !== null) {
    parts.push(`- Días hasta el examen: ${diasParaExamen} (${fechaExamen})`)
  } else {
    parts.push(`- Fecha de examen: no configurada`)
  }

  parts.push(`\nRENDIMIENTO POR TEMA (28 temas del temario):`)
  parts.push(temasTexto)

  // Resumen rápido para el modelo
  const temasConDatos = temaScores.filter(t => t.notaMedia !== null)
  const temasSinDatos = temaScores.filter(t => t.notaMedia === null)
  const temasDebiles = temasConDatos.filter(t => t.notaMedia! < 60).sort((a, b) => a.notaMedia! - b.notaMedia!)

  parts.push(`\nRESUMEN:`)
  parts.push(`- Temas probados: ${temasConDatos.length} de 28`)
  parts.push(`- Temas sin probar: ${temasSinDatos.length} (${temasSinDatos.map(t => `T${t.numero}`).join(', ') || 'ninguno'})`)
  if (temasDebiles.length > 0) {
    parts.push(`- Temas débiles (<60%): ${temasDebiles.map(t => `T${t.numero} (${t.notaMedia}%)`).join(', ')}`)
  }

  const userPrompt = `Genera un plan de estudio personalizado basado en estos datos:\n\n${parts.join('\n')}`

  // ── 7. Stream AI response ─────────────────────────────────────────────
  log.info(
    { userId: user.id, totalTests: testsCompletados.length, temasConDatos: temasConDatos.length, iprScore: ipr?.score },
    '[generate-roadmap] iniciando stream'
  )

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(SYSTEM_ROADMAP, userPrompt, {
      maxTokens: 2000,
      requestId,
      endpoint: 'generate-roadmap',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, '[generate-roadmap] failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar el plan de estudio.' }, { status: 500 })
  }

  // ── 8. Pipe through: encode + deduct credit on completion ────────────
  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'generate-roadmap',
    context: { totalTests: testsCompletados.length, temasConDatos: temasConDatos.length },
    onComplete: async () => {
      if (hasPaidCredit) {
        await serviceSupabase.rpc('use_correction', { p_user_id: userId })
      } else {
        await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
      }
    },
  })
}
