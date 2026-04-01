import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generatePsicotecnicos } from '@/lib/psicotecnicos'
import { generateOrtografia } from '@/lib/ortografia'
import { generateIngles } from '@/lib/ingles'
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
    numPreguntas: z.number().int().min(1).max(200).optional().default(100),
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
    /** Include ortografía questions (Guardia Civil) */
    incluirOrtografia: z.boolean().optional().default(false),
    /** Include inglés questions (Guardia Civil) */
    incluirIngles: z.boolean().optional().default(false),
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

  const { examenId, anno, numPreguntas, incluirPsicotecnicos, dificultadPsico, modo, incluirSupuesto, incluirOfimatica, incluirOrtografia, incluirIngles } = parsed.data

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
  const scoringConfig = (opoData as { scoring_config?: unknown } | null)?.scoring_config as { num_opciones?: 3 | 4; ejercicios?: { nombre?: string; preguntas?: number; reserva?: number }[]; minutos_total?: number } | null
  const numOpciones = scoringConfig?.num_opciones ?? 4
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
      // Fallback: use question_bank + free_question_bank when no official exams exist
      log.info({ oposicionId, modo }, 'No official exams — falling back to question bank')
      const { data: bankRows } = await (serviceSupabase as any)
        .from('free_question_bank')
        .select('preguntas, tema_id, tema_numero')
        .eq('oposicion_id', oposicionId)

      if (!bankRows || bankRows.length === 0) {
        return NextResponse.json(
          { error: 'No hay preguntas disponibles todavía para esta oposición.' },
          { status: 404 }
        )
      }

      // Flatten bank questions
      const allBankQs: PreguntaRow[] = []
      for (const row of bankRows) {
        const preguntas = (typeof row.preguntas === 'string' ? JSON.parse(row.preguntas) : row.preguntas) as Array<{ enunciado: string; opciones: string[]; correcta: number }>
        for (const [idx, p] of preguntas.entries()) {
          allBankQs.push({
            id: `bank-${row.tema_id}-${idx}`,
            numero: idx + 1,
            enunciado: p.enunciado,
            opciones: p.opciones,
            correcta: p.correcta,
            dificultad: 'media',
            tema_id: row.tema_id,
          })
        }
      }

      // Shuffle and take numPreguntas
      for (let i = allBankQs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allBankQs[i], allBankQs[j]] = [allBankQs[j], allBankQs[i]]
      }
      preguntasData = allBankQs.slice(0, numPreguntas)

      log.info({ bankTotal: allBankQs.length, selected: preguntasData.length }, 'Bank fallback simulacro')
    } else {

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
    } // end else (has official exams)
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
      opciones: Array.from({ length: numOpciones }, (_, i) => opciones[i] ?? '') as Pregunta['opciones'],
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
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bankRows, error: bankError } = await (serviceSupabase as any)
        .from('free_question_bank')
        .select('preguntas, tema_id, tema_numero')
        .eq('oposicion_id', oposicionId)

      if (bankError) {
        log.error({ err: bankError }, '[generate-simulacro] error fetching free_question_bank')
      } else if (bankRows && (bankRows as unknown[]).length > 0) {
        type BankRow = { preguntas: unknown[]; tema_id: string; tema_numero: number }
        const allBankQs: Pregunta[] = []
        for (const row of bankRows as BankRow[]) {
          const titulo = temaMap.get(row.tema_id) ?? `T${row.tema_numero}`
          for (const q of (row.preguntas ?? []) as Pregunta[]) {
            if (!q?.enunciado || !q?.opciones) continue // skip malformed
            allBankQs.push({
              enunciado: q.enunciado,
              opciones: (q.opciones ?? []).slice(0, numOpciones) as Pregunta['opciones'],
              correcta: typeof q.correcta === 'number' ? q.correcta as 0 | 1 | 2 | 3 : 0,
              explicacion: q.explicacion ?? '',
              dificultad: q.dificultad,
              temaId: row.tema_id,
              temaTitulo: titulo,
            })
          }
        }
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
    } catch (fillErr) {
      log.error({ err: fillErr }, '[generate-simulacro] fill from bank failed — continuing with oficiales only')
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

  // ── §6.5 — Añadir ortografía al inicio (Guardia Civil) ─────────────────────
  if (incluirOrtografia) {
    const ejOrtografia = scoringConfig?.ejercicios?.find(
      (e: { tipo_ejercicio?: string; nombre?: string }) =>
        e.tipo_ejercicio === 'ortografia' || (e.nombre ?? '').toLowerCase().includes('ortograf')
    ) as { preguntas?: number } | undefined
    const numOrtografia = ejOrtografia?.preguntas ?? 25

    const ortografiaQs = generateOrtografia(numOrtografia, 2) // dificultad media por defecto
    const ortografiaMapped: Pregunta[] = ortografiaQs.map((q) => ({
      enunciado: q.enunciado,
      opciones: q.opciones,
      correcta: q.correcta,
      explicacion: q.explicacion,
      dificultad: q.dificultad === 1 ? 'facil' : q.dificultad === 3 ? 'dificil' : 'media',
    }))
    // Ortografía va AL INICIO del simulacro (antes de conocimientos)
    preguntas = [...ortografiaMapped, ...preguntas]
    promptVersion = promptVersion.replace('1.0', 'orto-1.0')
    log.info(
      { ortografia: ortografiaQs.length, total: preguntas.length },
      '[generate-simulacro] ortografía GC incluida'
    )
  }

  // ── §6.6 — Añadir inglés al final (Guardia Civil) ──────────────────────────
  if (incluirIngles) {
    const ejIngles = scoringConfig?.ejercicios?.find(
      (e: { tipo_ejercicio?: string; nombre?: string }) =>
        e.tipo_ejercicio === 'ingles' || (e.nombre ?? '').toLowerCase().includes('ingl')
    ) as { preguntas?: number } | undefined
    const numIngles = ejIngles?.preguntas ?? 20

    const inglesQs = generateIngles(numIngles, 2) // dificultad media por defecto
    const inglesMapped: Pregunta[] = inglesQs.map((q) => ({
      enunciado: q.enunciado,
      opciones: q.opciones,
      correcta: q.correcta,
      explicacion: q.explicacion,
      dificultad: q.dificultad === 1 ? 'facil' : q.dificultad === 3 ? 'dificil' : 'media',
    }))
    // Inglés va AL FINAL del simulacro (después de conocimientos)
    preguntas = [...preguntas, ...inglesMapped]
    promptVersion = promptVersion.replace('1.0', 'eng-1.0')
    log.info(
      { ingles: inglesQs.length, total: preguntas.length },
      '[generate-simulacro] inglés GC incluido'
    )
  }

  // ── 7b. Incluir supuesto práctico (Parte 2) si la oposición lo tiene ─────
  let supuestoCaso: { titulo: string; escenario: string; bloques_cubiertos: string[]; ofimatica_start?: number; supuesto_dividers?: { index: number; label: string; escenario: string }[] } | null = null

  if (effectiveIncluirSupuesto) { try {
    // How many supuestos to load: from scoring_config.num_supuestos (explicit)
    // This is the EXACT number from the real exam structure:
    //   Auxilio Judicial: 2 supuestos × 20q = 40q
    //   Administrativo C1: 1 supuesto × 20q = 20q
    //   Tramitación: 1 supuesto × 10q = 10q
    //   Gestión Procesal: 1 supuesto × 10q = 10q
    //   Penitenciarias: 8 supuestos × 5q = 40q
    const ejSupuesto = scoringConfig?.ejercicios?.find(
      (e: { nombre?: string }) => {
        const n = (e.nombre ?? '').toLowerCase()
        return n.includes('supuesto') || n.includes('práctico')
      }
    ) as { preguntas?: number; num_supuestos?: number } | undefined
    const numSupuestosToLoad = ejSupuesto?.num_supuestos ?? 1 // default 1 for backward compat

    // Fetch unseen supuestos
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
    const { data: unseenSupuestos } = await simUnseenQuery.limit(numSupuestosToLoad)

    type SupuestoRow = { id: string; caso: { titulo?: string; escenario?: string; bloques_cubiertos?: string[] }; preguntas: Pregunta[] }
    let supuestoRows: SupuestoRow[] = (unseenSupuestos ?? []) as SupuestoRow[]

    // If not enough unseen, recycle seen ones to reach numSupuestosToLoad
    if (supuestoRows.length < numSupuestosToLoad) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allSupuestos } = await (serviceSupabase as any)
        .from('supuesto_bank')
        .select('id, caso, preguntas')
        .eq('oposicion_id', oposicionId)
        .limit(numSupuestosToLoad)
      supuestoRows = (allSupuestos ?? []) as SupuestoRow[]
    }

    // Shuffle and take exactly numSupuestosToLoad
    for (let i = supuestoRows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[supuestoRows[i], supuestoRows[j]] = [supuestoRows[j], supuestoRows[i]]
    }
    const selectedSupuestos = supuestoRows.slice(0, numSupuestosToLoad)

    const allSupPreguntas: Pregunta[] = []
    const supuestoCasos: { titulo: string; escenario: string }[] = []
    const supuestoDividers: { index: number; label: string; escenario: string }[] = []
    let supQOffset = 0 // offset within the supuesto part (relative to supuesto start)
    for (const row of selectedSupuestos) {
      const rowPreguntas = (row.preguntas as unknown as Pregunta[]).filter(p => p?.enunciado).map((p) => ({
        enunciado: p.enunciado,
        opciones: (p.opciones ?? []).slice(0, numOpciones) as Pregunta['opciones'],
        correcta: typeof p.correcta === 'number' ? p.correcta as 0 | 1 | 2 | 3 : 0,
        explicacion: p.explicacion ?? '',
      }))
      const titulo = row.caso?.titulo ?? `Supuesto ${supuestoCasos.length + 1}`
      supuestoDividers.push({
        index: supQOffset,
        label: titulo,
        escenario: row.caso?.escenario ?? '',
      })
      allSupPreguntas.push(...rowPreguntas)
      supQOffset += rowPreguntas.length
      supuestoCasos.push({
        titulo,
        escenario: row.caso?.escenario ?? '',
      })
      // Mark as seen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceSupabase as any)
        .from('user_supuestos_seen')
        .upsert({ user_id: user.id, supuesto_id: row.id }, { onConflict: 'user_id,supuesto_id' })
    }

    if (allSupPreguntas.length > 0) {
      supuestoCaso = {
        titulo: supuestoCasos.length > 1 ? `${supuestoCasos.length} Supuestos Prácticos` : supuestoCasos[0]?.titulo ?? 'Supuesto Práctico',
        escenario: supuestoCasos[0]?.escenario ?? '',
        bloques_cubiertos: [],
        // Store dividers so frontend knows where each supuesto starts within Part 2
        supuesto_dividers: supuestoDividers.length > 1 ? supuestoDividers : undefined,
      }
      preguntas = [...preguntas, ...allSupPreguntas]
      promptVersion = incluirPsicotecnicos ? 'oficial-psico-supuesto-1.0' : 'oficial-supuesto-1.0'
      log.info(
        { numSupuestos: selectedSupuestos.length, supPreguntas: allSupPreguntas.length, numSupuestosToLoad },
        '[generate-simulacro] supuestos prácticos incluidos en simulacro'
      )
    } else {
      log.warn({ userId: user.id }, '[generate-simulacro] no supuesto available in bank')
    }
  } catch (supErr) {
    log.error({ err: supErr }, '[generate-simulacro] supuesto loading failed — continuing without supuestos')
  } }

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
        const correctaMap: Record<string, number> = Object.fromEntries(
          Array.from({ length: numOpciones }, (_, i) => [String.fromCharCode(97 + i), i])
        )
        const ofiPreguntas: Pregunta[] = shuffled.slice(0, numOfimatica).map(r => ({
          enunciado: r.enunciado,
          opciones: (r.opciones ?? []).slice(0, numOpciones) as Pregunta['opciones'],
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
