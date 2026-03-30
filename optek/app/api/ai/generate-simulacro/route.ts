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
    /** Include supuesto práctico (caso + questions from bank) as Part 2 */
    incluirSupuesto: z.boolean().optional().default(false),
    /** Include ofimática questions as Part 3 (Tramitación C1) */
    incluirOfimatica: z.boolean().optional().default(false),
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

  const { examenId, anno, numPreguntas, incluirPsicotecnicos, dificultadPsico, modo, incluirSupuesto, incluirOfimatica } = parsed.data

  // ── 3. Freemium gating — scoped por oposición ──────────────────────────
  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const [hasPaidAccess, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])

  // Free users: 1 complete simulacro (cuestionario only, no supuesto)
  // Premium: unlimited simulacros with supuesto included
  const effectiveIncluirSupuesto = hasPaidAccess ? incluirSupuesto : false
  const effectiveIncluirOfimatica = hasPaidAccess ? incluirOfimatica : false

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

    if (freeSimUsed >= 1) {
      log.info({ userId: user.id, freeSimUsed }, 'Free simulacro quota exhausted — paywall')
      return NextResponse.json(
        {
          error: `Ya has realizado tu simulacro gratuito. Desbloquea simulacros ilimitados con el Pack Oposición.`,
          code: 'PAYWALL_SIMULACROS',
        },
        { status: 402 }
      )
    }
  }

  // ── 4. Buscar examen/s y cargar preguntas ────────────────────────────────

  // §BUG-SP2: obtener scoring_config para filtro dinámico de preguntas de reserva
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('scoring_config')
    .eq('id', oposicionId)
    .single()
  const scoringConfig = (opoData as { scoring_config?: unknown } | null)?.scoring_config as { ejercicios?: { nombre?: string; preguntas?: number; reserva?: number }[]; minutos_total?: number } | null
  // Preguntas puntuables del primer ejercicio = preguntas - reserva
  const ej1 = scoringConfig?.ejercicios?.[0]
  const maxPreguntasPuntuables = (ej1?.preguntas ?? 60) - (ej1?.reserva ?? 0)

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

  // ── 6. Selección de preguntas oficiales ──────────────────────────────────
  let selected: typeof preguntasData

  if (!hasPaidAccess) {
    // FREE: deterministic selection — same questions for all free users
    const sorted = [...preguntasData].sort((a, b) => a.numero - b.numero)
    selected = sorted.slice(0, numPreguntas)
  } else {
    // PREMIUM: Fisher-Yates shuffle for variety
    const shuffled = [...preguntasData]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    selected = shuffled.slice(0, numPreguntas)
  }

  // ── 7. Mapear preguntas oficiales a Pregunta[] ────────────────────────────
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

  // ── 7a. FILL: si no hay suficientes oficiales, completar desde free_question_bank ──
  // Garantiza que el simulacro SIEMPRE tenga numPreguntas del cuestionario,
  // igual que el examen real. Las preguntas del banco son generadas por IA y
  // verificadas contra legislación BOE — misma calidad que las oficiales.
  if (preguntasOficiales.length < numPreguntas) {
    const faltantes = numPreguntas - preguntasOficiales.length
    log.info(
      { oficiales: preguntasOficiales.length, faltantes, numPreguntas },
      '[generate-simulacro] completando con preguntas del banco'
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bankRows } = await (serviceSupabase as any)
      .from('free_question_bank')
      .select('preguntas, tema_id, tema_numero')
      .eq('oposicion_id', oposicionId)

    if (bankRows && (bankRows as unknown[]).length > 0) {
      // Flatten all bank questions with tema info
      type BankRow = { preguntas: Pregunta[]; tema_id: string; tema_numero: number }
      const allBankQs: Pregunta[] = []
      for (const row of bankRows as BankRow[]) {
        const titulo = temaMap.get(row.tema_id) ?? `T${row.tema_numero}`
        for (const q of row.preguntas) {
          allBankQs.push({ ...q, temaId: row.tema_id, temaTitulo: titulo })
        }
      }
      // Exclude questions with same enunciado as official ones (avoid duplicates)
      const officialTexts = new Set(preguntasOficiales.map(p => p.enunciado.slice(0, 80)))
      const uniqueBankQs = allBankQs.filter(q => !officialTexts.has(q.enunciado.slice(0, 80)))
      // Fisher-Yates shuffle
      for (let i = uniqueBankQs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[uniqueBankQs[i], uniqueBankQs[j]] = [uniqueBankQs[j], uniqueBankQs[i]]
      }
      const fill = uniqueBankQs.slice(0, faltantes)
      preguntasOficiales.push(...fill)
      log.info(
        { filled: fill.length, totalAhora: preguntasOficiales.length },
        '[generate-simulacro] preguntas del banco añadidas'
      )
    }
  }

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

  // ── 7b. Incluir supuesto práctico (Parte 2) si la oposición lo tiene ─────
  let supuestoCaso: { titulo: string; escenario: string; bloques_cubiertos: string[]; ofimatica_start?: number } | null = null

  if (effectiveIncluirSupuesto) {
    // Determine how many supuestos to load from scoring_config
    // e.g. Penitenciarias: 40 preguntas / 5 per supuesto = 8 supuestos
    // e.g. Auxilio: 40 preguntas / ~10-20 per supuesto = 1-2 supuestos
    const ejSupuesto = scoringConfig?.ejercicios?.find(
      (e: { nombre?: string }) => {
        const n = (e.nombre ?? '').toLowerCase()
        return n.includes('supuesto') || n.includes('práctico')
      }
    ) as { preguntas?: number } | undefined
    const totalPreguntasSupuesto = ejSupuesto?.preguntas ?? 40

    // Fetch ALL available supuestos for this oposición (not just 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: simSeenRows } = await (serviceSupabase as any)
      .from('user_supuestos_seen')
      .select('supuesto_id')
      .eq('user_id', user.id)
    const simSeenIds = (simSeenRows ?? []).map((r: { supuesto_id: string }) => r.supuesto_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let simUnseenQuery = (serviceSupabase as any)
      .from('supuesto_bank')
      .select('id, caso, preguntas')
      .eq('oposicion_id', oposicionId)
    if (simSeenIds.length > 0) {
      simUnseenQuery = simUnseenQuery.not('id', 'in', `(${simSeenIds.join(',')})`)
    }
    const { data: unseenSupuestos } = await simUnseenQuery.limit(20) // fetch up to 20

    type SupuestoRow = { id: string; caso: { titulo?: string; escenario?: string; bloques_cubiertos?: string[] }; preguntas: Pregunta[] }
    let supuestoRows: SupuestoRow[] = (unseenSupuestos ?? []) as SupuestoRow[]

    // If not enough unseen, recycle seen ones
    if (supuestoRows.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allSupuestos } = await (serviceSupabase as any)
        .from('supuesto_bank')
        .select('id, caso, preguntas')
        .eq('oposicion_id', oposicionId)
        .limit(20)
      supuestoRows = (allSupuestos ?? []) as SupuestoRow[]
    }

    // Shuffle supuestos and collect questions until we reach totalPreguntasSupuesto
    for (let i = supuestoRows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[supuestoRows[i], supuestoRows[j]] = [supuestoRows[j], supuestoRows[i]]
    }

    const allSupPreguntas: Pregunta[] = []
    const supuestoCasos: { titulo: string; escenario: string }[] = []
    for (const row of supuestoRows) {
      if (allSupPreguntas.length >= totalPreguntasSupuesto) break
      const rowPreguntas = (row.preguntas as unknown as Pregunta[]).map((p) => ({
        ...p,
        enunciado: p.enunciado,
        opciones: p.opciones,
        correcta: p.correcta,
        explicacion: p.explicacion ?? '',
      }))
      allSupPreguntas.push(...rowPreguntas)
      supuestoCasos.push({
        titulo: row.caso?.titulo ?? 'Supuesto Práctico',
        escenario: row.caso?.escenario ?? '',
      })
      // Mark as seen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceSupabase as any)
        .from('user_supuestos_seen')
        .upsert({ user_id: user.id, supuesto_id: row.id }, { onConflict: 'user_id,supuesto_id' })
    }

    if (allSupPreguntas.length > 0) {
      // Use first supuesto's caso as the header (for UI compatibility)
      supuestoCaso = {
        titulo: supuestoCasos.length > 1 ? `${supuestoCasos.length} Supuestos Prácticos` : supuestoCasos[0]?.titulo ?? 'Supuesto Práctico',
        escenario: supuestoCasos.map(s => `**${s.titulo}**\n${s.escenario}`).join('\n\n---\n\n'),
        bloques_cubiertos: [],
      }
      // Take exactly the number needed
      const supPreguntasFinal = allSupPreguntas.slice(0, totalPreguntasSupuesto)
      preguntas = [...preguntas, ...supPreguntasFinal]
      promptVersion = incluirPsicotecnicos ? 'oficial-psico-supuesto-1.0' : 'oficial-supuesto-1.0'
      log.info(
        { supuestos: supuestoCasos.length, supPreguntas: supPreguntasFinal.length, totalPreguntasSupuesto },
        '[generate-simulacro] supuestos prácticos incluidos en simulacro'
      )
    } else {
      log.warn({ userId: user.id }, '[generate-simulacro] no supuesto available in bank')
    }
  }

  // ── 7c. Incluir ofimática (Parte 3) si la oposición lo tiene ─────────────
  if (effectiveIncluirOfimatica) {
    // Get ofimática exercise config from scoring_config
    const ejOfimatica = scoringConfig?.ejercicios?.find(
      (e: { nombre?: string }) => {
        const n = (e.nombre ?? '').toLowerCase()
        return n.includes('ofimática') || n.includes('informatica') || n.includes('informática')
      }
    ) as { preguntas?: number } | undefined
    const numOfimatica = ejOfimatica?.preguntas ?? 20

    // Get ofimática temas for this oposición (bloque III for Tramitación)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ofiTemas } = await (serviceSupabase as any)
      .from('temas')
      .select('id')
      .eq('oposicion_id', oposicionId)
      .eq('bloque', 'III')
    const ofiTemaIds = ((ofiTemas ?? []) as { id: string }[]).map(t => t.id)

    if (ofiTemaIds.length > 0) {
      // Fetch from question_bank (ofimática questions already generated by tests)
      // question_bank stores individual columns, not a 'pregunta' JSON
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ofiQuestions } = await (serviceSupabase as any)
        .from('question_bank')
        .select('enunciado, opciones, correcta, explicacion, cita_ley, cita_articulo')
        .in('tema_id', ofiTemaIds)
        .eq('oposicion_id', oposicionId)
        .limit(numOfimatica * 3) // fetch extra for random sampling

      type QBRow = { enunciado: string; opciones: string[]; correcta: string; explicacion: string | null; cita_ley: string | null; cita_articulo: string | null }
      const ofiRows = (ofiQuestions ?? []) as QBRow[]

      if (ofiRows.length > 0) {
        // Fisher-Yates shuffle and take numOfimatica
        const shuffled = [...ofiRows]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        // Convert question_bank rows to Pregunta format
        const correctaMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }
        const ofiPreguntas: Pregunta[] = shuffled.slice(0, numOfimatica).map(r => ({
          enunciado: r.enunciado,
          opciones: (r.opciones ?? ['', '', '', '']).slice(0, 4) as [string, string, string, string],
          correcta: (correctaMap[r.correcta] ?? 0) as 0 | 1 | 2 | 3,
          explicacion: r.explicacion ?? '',
          ...(r.cita_ley ? { cita: { ley: r.cita_ley, articulo: r.cita_articulo ?? '', textoExacto: '' } } : {}),
        }))
        // Record where ofimática starts for frontend part navigation
        if (supuestoCaso) {
          supuestoCaso.ofimatica_start = preguntas.length
        }
        preguntas = [...preguntas, ...ofiPreguntas]
        promptVersion = promptVersion.replace('1.0', 'ofi-1.0')
        log.info(
          { ofiAvailable: ofiRows.length, ofiUsed: ofiPreguntas.length, numOfimatica },
          '[generate-simulacro] ofimática incluida en simulacro'
        )
      } else {
        log.warn({ oposicionId, ofiTemaIds }, '[generate-simulacro] no ofimática questions in bank — skipping Part 3')
      }
    } else {
      log.warn({ oposicionId }, '[generate-simulacro] no ofimática temas found for Bloque III')
    }
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
      supuesto_caso: supuestoCaso as unknown as Json,
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
