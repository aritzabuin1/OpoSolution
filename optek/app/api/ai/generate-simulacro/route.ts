import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generatePsicotecnicos } from '@/lib/psicotecnicos'
import { logger } from '@/lib/logger'
import { FREE_LIMITS, PAID_LIMITS, checkPaidAccess, checkIsAdmin, getOposicionFromProfile } from '@/lib/freemium'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/generate-simulacro — §2.6A.1 + §1.3B.13 + §2.6.1
 *
 * Genera un simulacro a partir de preguntas_oficiales (sin llamada a IA).
 * §1.3B.13: si incluirPsicotecnicos=true, genera 30 psicotécnicas y las
 * añade al inicio del test (simulando la estructura real del examen INAP).
 *
 * §2.6.1 — modo='mixto': mezcla preguntas de TODAS las convocatorias disponibles
 *   (2019, 2022, 2024), sin requerir examenId ni anno. Ideal para practicar con
 *   variedad máxima de preguntas reales del INAP.
 *
 * Estructura examen real:
 *   Parte 1: 30 psicotécnicas + N teóricas de convocatoria
 *   Parte 2: M teóricas de Bloque II de convocatoria
 *   Total: N + M + 30 psicotécnicas (cuando incluirPsicotecnicos=true)
 *
 * Créditos: NINGUNO — simulacros son gratis.
 */

// ─── Schema de validación ──────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GenerateSimulacroSchema = z
  .object({
    examenId: z.string().regex(UUID_REGEX, 'examenId debe ser un UUID válido').optional(),
    anno: z.number().int().min(2000).max(2099).optional(),
    numPreguntas: z.number().int().min(1).max(110).optional().default(100),
    /** §1.3B.13: si true, añade 30 psicotécnicas al inicio del test */
    incluirPsicotecnicos: z.boolean().optional().default(false),
    /** Dificultad de las psicotécnicas: 1 fácil, 2 media, 3 difícil */
    dificultadPsico: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(2),
    /**
     * §2.6.1 — modo de generación:
     * - 'anio' (default): usa examenId o anno (convocatoria específica)
     * - 'mixto': mezcla preguntas de TODAS las convocatorias disponibles
     */
    modo: z.enum(['anio', 'mixto']).optional().default('anio'),
  })
  .refine(
    (d) => d.modo === 'mixto' || d.examenId !== undefined || d.anno !== undefined,
    {
      message: 'Debes indicar examenId, anno, o modo=mixto',
      path: ['examenId'],
    }
  )

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-simulacro' })

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

  const parsed = GenerateSimulacroSchema.safeParse(body)
  if (!parsed.success) {
    const errores = parsed.error.issues.map((i) => i.message).join('; ')
    return NextResponse.json({ error: `Input inválido: ${errores}` }, { status: 400 })
  }

  const { examenId, anno, numPreguntas, incluirPsicotecnicos, dificultadPsico, modo } = parsed.data

  // ── 3. Freemium gating — scoped por oposición ──────────────────────────
  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const [hasPaidAccess, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])

  // Free users: máx 20 preguntas por simulacro
  if (!hasPaidAccess && numPreguntas > FREE_LIMITS.simulacroMaxPreguntas) {
    return NextResponse.json(
      {
        error: `Los simulacros de ${numPreguntas} preguntas requieren acceso Premium. Los usuarios gratuitos pueden hacer simulacros de ${FREE_LIMITS.simulacroMaxPreguntas} preguntas.`,
        code: 'PAYWALL_SIMULACROS',
      },
      { status: 402 }
    )
  }

  if (hasPaidAccess && !isAdmin) {
    // Paid: rate limit silencioso anti-abuso
    const rateLimit = await checkRateLimit(user.id, 'simulacro-daily', PAID_LIMITS.simulacrosDay, '24 h')
    if (!rateLimit.success) {
      log.warn({ userId: user.id }, '[generate-simulacro] paid daily limit reached')
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 10 simulacros diarios. Vuelve mañana.' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
      )
    }
  } else if (!hasPaidAccess) {
    // Free: verificar cuota lifetime
    const { data: profileSim } = await serviceSupabase
      .from('profiles')
      .select('free_simulacro_used')
      .eq('id', user.id)
      .single()

    const freeSimUsed = (profileSim as { free_simulacro_used?: number } | null)?.free_simulacro_used ?? 0

    if (freeSimUsed >= FREE_LIMITS.simulacros) {
      log.info({ userId: user.id, freeSimUsed }, 'Free simulacro quota exhausted — paywall')
      return NextResponse.json(
        {
          error: `Has agotado tu simulacro gratuito. Desbloquea simulacros ilimitados con el Pack Oposición.`,
          code: 'PAYWALL_SIMULACROS',
        },
        { status: 402 }
      )
    }
  }

  // ── 4. Buscar examen/s y cargar preguntas ────────────────────────────────

  // §BUG-SP2: obtener scoring_config para filtro dinámico de preguntas de reserva
  const { data: opoData } = await serviceSupabase
    .from('oposiciones')
    .select('scoring_config')
    .eq('id', oposicionId)
    .single()
  const scoringConfig = opoData?.scoring_config as { ejercicios?: { preguntas?: number }[] } | null
  // Preguntas puntuables del primer ejercicio (test teórico) — fallback 60 para C2 AGE
  const maxPreguntasPuntuables = scoringConfig?.ejercicios?.[0]?.preguntas ?? 60

  type ExamenRow = { id: string; anio: number; convocatoria: string }
  // §2.6.3: incluimos tema_id para desglose por tema en resultados
  type PreguntaRow = {
    id: string; numero: number; enunciado: string
    opciones: unknown; correcta: unknown; dificultad: unknown
    tema_id: string | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (supabase as any).from('examenes_oficiales')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preguntasTable = (supabase as any).from('preguntas_oficiales')

  // Examen usado para metadata en BD (el primer examen en modo mixto)
  let examen: ExamenRow | null = null
  let preguntasData: PreguntaRow[] | null = null

  if (modo === 'mixto') {
    // §2.6.1 — cargar preguntas de TODAS las convocatorias activas (scoped por oposición)
    const { data: todosExamenes } = await examenesTable
      .select('id, anio, convocatoria')
      .eq('oposicion_id', oposicionId)
      .eq('activo', true)
      .order('anio', { ascending: false })

    if (!todosExamenes || todosExamenes.length === 0) {
      return NextResponse.json(
        { error: 'No hay convocatorias disponibles todavía.' },
        { status: 404 }
      )
    }

    // Cargar preguntas de todos los exámenes en paralelo (con tema_id para §2.6.3)
    const pregResultados = await Promise.all(
      (todosExamenes as ExamenRow[]).map((ex) =>
        preguntasTable
          .select('id, numero, enunciado, opciones, correcta, dificultad, tema_id')
          .eq('examen_id', ex.id)
      )
    )
    // Excluir preguntas de reserva (defense in depth — §BUG-SP2: dinámico por oposición)
    const todasPreguntas = pregResultados
      .flatMap((r: { data: PreguntaRow[] | null }) => r.data ?? [])
      .filter((p: PreguntaRow) => p.numero <= maxPreguntasPuntuables)

    if (todasPreguntas.length === 0) {
      return NextResponse.json(
        { error: 'No hay preguntas disponibles todavía.' },
        { status: 404 }
      )
    }

    // Usar el examen más reciente como referencia en BD
    examen = (todosExamenes as ExamenRow[])[0]
    preguntasData = todasPreguntas

    log.info(
      { examenes: todosExamenes.length, totalPreguntas: todasPreguntas.length },
      '[generate-simulacro] modo mixto — combinando todas las convocatorias'
    )
  } else {
    // Modo por año — comportamiento original
    let examenRow: ExamenRow | null = null

    if (examenId) {
      const { data } = await examenesTable
        .select('id, anio, convocatoria')
        .eq('id', examenId)
        .eq('oposicion_id', oposicionId)
        .eq('activo', true)
        .single()
      examenRow = data as ExamenRow | null
    } else {
      const { data } = await examenesTable
        .select('id, anio, convocatoria')
        .eq('anio', anno!)
        .eq('oposicion_id', oposicionId)
        .eq('activo', true)
        .order('convocatoria')
        .limit(1)
        .maybeSingle()
      examenRow = data as ExamenRow | null
    }

    if (!examenRow) {
      return NextResponse.json(
        { error: 'Examen no encontrado o no disponible.' },
        { status: 404 }
      )
    }
    examen = examenRow

    // §2.6.3: include tema_id for per-tema breakdown in results
    const { data: pregData, error: pregError } = await preguntasTable
      .select('id, numero, enunciado, opciones, correcta, dificultad, tema_id')
      .eq('examen_id', examen.id)
      .order('numero')

    if (pregError) {
      log.error({ err: pregError, examenId: examen.id }, '[generate-simulacro] error fetching preguntas')
      return NextResponse.json(
        { error: 'Error al cargar las preguntas del examen.' },
        { status: 500 }
      )
    }

    if (!pregData || pregData.length === 0) {
      return NextResponse.json(
        { error: 'Este examen no tiene preguntas cargadas todavía.' },
        { status: 404 }
      )
    }

    // Excluir preguntas de reserva (defense in depth — §BUG-SP2: dinámico por oposición)
    preguntasData = (pregData as PreguntaRow[]).filter((p) => p.numero <= maxPreguntasPuntuables)
  }

  // Garantía de tipo — examen y preguntasData siempre tienen valor en este punto
  if (!examen || !preguntasData) {
    return NextResponse.json({ error: 'Error interno al cargar los datos.' }, { status: 500 })
  }

  // ── 5. §2.6.3 — Cargar títulos de temas para desglose en resultados ─────────
  // Batch-fetch tema titles for all distinct tema_ids (excluding null)
  const temaIdsDistintos = [
    ...new Set(preguntasData.map((p) => p.tema_id).filter((id): id is string => id !== null))
  ]
  const temaMap = new Map<string, string>()
  if (temaIdsDistintos.length > 0) {
    const { data: temasData } = await supabase
      .from('temas')
      .select('id, numero, titulo')
      .in('id', temaIdsDistintos)
    if (temasData) {
      for (const t of temasData) {
        temaMap.set(t.id, `T${t.numero}: ${t.titulo}`)
      }
    }
  }

  // ── 6. Selección aleatoria de preguntas oficiales ─────────────────────────
  // Fisher-Yates shuffle para selección sin reemplazo
  const shuffled = [...preguntasData]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, numPreguntas)

  // ── 7. Mapear preguntas oficiales a Pregunta[] ────────────────────────────
  // §2.6.3: include temaId + temaTitulo for per-tema breakdown in results page
  const preguntasOficiales: Pregunta[] = selected.map((p) => {
    const opciones = p.opciones as string[]
    const temaId = p.tema_id ?? null
    const temaTitulo = temaId ? (temaMap.get(temaId) ?? null) : null
    return {
      enunciado: p.enunciado,
      opciones: [
        opciones[0] ?? '',
        opciones[1] ?? '',
        opciones[2] ?? '',
        opciones[3] ?? '',
      ] as [string, string, string, string],
      correcta: (p.correcta as 0 | 1 | 2 | 3),
      explicacion: '',
      dificultad: (p.dificultad as 'facil' | 'media' | 'dificil') ?? undefined,
      temaId,
      temaTitulo,
    }
  })

  // ── §1.3B.13 — Añadir psicotécnicas al inicio ─────────────────────────────
  let preguntas: Pregunta[]
  let promptVersion = 'oficial-1.0'

  if (incluirPsicotecnicos) {
    const psicotecnicos = generatePsicotecnicos(30, dificultadPsico)
    // Psicotécnicas al inicio (Parte 1), oficiales después (Parte 2)
    const psicoPreguntasMapped: Pregunta[] = psicotecnicos.map((p) => ({
      enunciado: p.enunciado,
      opciones: p.opciones,
      correcta: p.correcta,
      explicacion: p.explicacion,
      dificultad: p.dificultad === 1 ? 'facil' : p.dificultad === 3 ? 'dificil' : 'media',
    }))
    preguntas = [...psicoPreguntasMapped, ...preguntasOficiales]
    promptVersion = 'oficial-psico-1.0'
    log.info(
      { psico: psicotecnicos.length, oficiales: preguntasOficiales.length },
      '[generate-simulacro] modo examen completo con psicotécnicas'
    )
  } else {
    preguntas = preguntasOficiales
  }

  // ── 8. Guardar en BD ──────────────────────────────────────────────────────
  const { data: testRow, error: insertError } = await serviceSupabase
    .from('tests_generados')
    .insert({
      user_id: user.id,
      tema_id: null,
      examen_oficial_id: examen.id,
      tipo: 'simulacro',
      preguntas: preguntas as unknown as Json,
      completado: false,
      prompt_version: promptVersion,
      oposicion_id: oposicionId,
    })
    .select('id, created_at')
    .single()

  if (insertError || !testRow) {
    log.error({ err: insertError, userId: user.id }, '[generate-simulacro] error saving test')
    return NextResponse.json(
      { error: 'Error al guardar el simulacro. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  // Consumir crédito simulacro free tras éxito (BUG-010 pattern)
  if (!hasPaidAccess) {
    await (serviceSupabase as any).rpc('use_free_simulacro', { p_user_id: user.id })
  }

  log.info(
    {
      userId: user.id,
      testId: testRow.id,
      examenId: examen.id,
      anio: examen.anio,
      preguntasCount: preguntas.length,
      incluirPsicotecnicos,
    },
    '[generate-simulacro] simulacro creado correctamente'
  )

  return NextResponse.json(
    {
      id: testRow.id,
      preguntas,
      temaId: null,
      examenId: examen.id,
      promptVersion,
      createdAt: testRow.created_at,
    },
    { status: 200 }
  )
}
