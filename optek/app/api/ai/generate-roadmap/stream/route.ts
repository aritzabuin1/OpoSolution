import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, checkIsAdmin, getOposicionFromProfile, getOposicionNombreFromProfile } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { getSystemRoadmap } from '@/lib/ai/prompts'
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
    .select('corrections_balance, free_corrector_used, racha_actual, fecha_examen, horas_diarias_estudio')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as {
    corrections_balance?: number
    free_corrector_used?: number
    racha_actual?: number
    fecha_examen?: string | null
    horas_diarias_estudio?: number | null
  } | null

  const isAdmin = await checkIsAdmin(serviceSupabase, user.id)

  let hasPaidCredit = false
  let hasFreeCredit = false
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  if (!isAdmin) {
    hasPaidCredit = (profile?.corrections_balance ?? 0) > 0
    hasFreeCredit = !hasPaidCredit && (profile?.free_corrector_used ?? 0) < 2
    const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

    if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
      return NextResponse.json({
        error: 'No tienes análisis disponibles.',
        code: 'PAYWALL_CORRECTIONS',
      }, { status: 402 })
    }
  }

  // ── 4b. Parse optional previous plan for context ──────────────────────
  let previousPlan: string | null = null
  let previousPlanDate: string | null = null
  try {
    const body = await request.json().catch(() => ({}))
    if (body.previousPlan && typeof body.previousPlan === 'string') {
      previousPlan = body.previousPlan.slice(0, 2000) // cap to avoid token bloat
    }
    if (body.previousPlanDate && typeof body.previousPlanDate === 'string') {
      previousPlanDate = body.previousPlanDate
    }
  } catch {
    // No body or invalid JSON — fine, no previous plan
  }

  // ── 5. Recopilar TODOS los datos del usuario ───────────────────────────
  // Get oposicion info for parametrized prompts
  const oposicionNombre = await getOposicionNombreFromProfile(serviceSupabase, user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oposicionInfo } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('num_temas')
    .eq('id', oposicionId)
    .single()
  const numTemas = (oposicionInfo as { num_temas?: number } | null)?.num_temas ?? 28

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
    // Filter temas by user's oposicion
    (serviceSupabase as any)
      .from('temas')
      .select('id, numero, titulo')
      .eq('oposicion_id', oposicionId)
      .order('numero', { ascending: true }),
  ])

  const testsCompletados = tests ?? []
  const allTemas = (temas ?? []) as Array<{ id: string; numero: number; titulo: string }>
  const rachaActual = profile?.racha_actual ?? 0
  const fechaExamen = profile?.fecha_examen ?? null
  const dedicacionSemanal = profile?.horas_diarias_estudio ?? null

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
    if (t.notaMedia === null) {
      return `- T${t.numero}: "${t.titulo}" → SIN DATOS (no ha hecho tests)`
    }
    return `- T${t.numero}: "${t.titulo}" → ${t.notaMedia}% acierto (${t.testsCount} tests)`
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

  if (dedicacionSemanal !== null) {
    parts.push(`- Dedicación semanal: ${dedicacionSemanal} horas/semana`)
  } else {
    parts.push(`- Dedicación semanal: no configurada`)
  }

  parts.push(`\nRENDIMIENTO POR TEMA (${numTemas} temas del temario de ${oposicionNombre}):`)
  parts.push(temasTexto)

  // Resumen rápido para el modelo
  const temasConDatos = temaScores.filter(t => t.notaMedia !== null)
  const temasSinDatos = temaScores.filter(t => t.notaMedia === null)
  const temasDebiles = temasConDatos.filter(t => t.notaMedia! < 60).sort((a, b) => a.notaMedia! - b.notaMedia!)

  parts.push(`\nRESUMEN:`)
  parts.push(`- Temas probados: ${temasConDatos.length} de ${numTemas}`)
  parts.push(`- Temas sin probar: ${temasSinDatos.length} (${temasSinDatos.map(t => `T${t.numero}`).join(', ') || 'ninguno'})`)
  if (temasDebiles.length > 0) {
    parts.push(`- Temas débiles (<60%): ${temasDebiles.map(t => `T${t.numero} (${t.notaMedia}%)`).join(', ')}`)
  }

  // Add previous plan context if regenerating
  if (previousPlan) {
    parts.push(`\nPLAN ANTERIOR${previousPlanDate ? ` (generado el ${previousPlanDate})` : ''}:`)
    parts.push(`"""`)
    parts.push(previousPlan)
    parts.push(`"""`)
    parts.push(`\nINSTRUCCIÓN: El opositor ya tenía un plan anterior. Reconoce brevemente qué ha mejorado comparando los datos actuales con el plan anterior. Genera un plan NUEVO y actualizado basado en los datos actuales. No repitas las mismas tareas si las notas indican que ya las completó.`)
  }

  const userPrompt = `Genera un plan de estudio personalizado basado en estos datos:\n\n${parts.join('\n')}`

  // ── 7. Stream AI response ─────────────────────────────────────────────
  log.info(
    { userId: user.id, totalTests: testsCompletados.length, temasConDatos: temasConDatos.length, iprScore: ipr?.score },
    '[generate-roadmap] iniciando stream'
  )

  let aiStream: ReadableStream<string>
  try {
    // Build bloque info based on oposicion
    const isC2 = numTemas <= 28
    const bloqueInfo = isC2
      ? 'Bloque I (1-16): Derecho. Bloque II (17-28): Ofimática.'
      : 'Bloque I (1-10): Constitución y Organización. Bloque II (11-20): Derecho Administrativo. Bloque III (21-30): UE y Organización. Bloque IV (31-35): Financiero. Bloque V (36-40): Informática. Bloque VI (41-45): Gestión de personal.'
    const systemPrompt = getSystemRoadmap(oposicionNombre, numTemas, bloqueInfo)

    aiStream = await callAIStream(systemPrompt, userPrompt, {
      maxTokens: 4000,
      requestId,
      endpoint: 'generate-roadmap',
      userId: user.id,
      oposicionId,
      useHeavyModel: true, // Paid feature — use Sonnet/GPT-5 for quality
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
      if (isAdmin) return
      if (hasPaidCredit) {
        await serviceSupabase.rpc('use_correction', { p_user_id: userId })
      } else {
        await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
      }
    },
  })
}
