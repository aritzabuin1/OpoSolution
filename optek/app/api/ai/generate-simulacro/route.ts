import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generatePsicotecnicos, getDistribucionPsicotecnicos } from '@/lib/psicotecnicos'
import { generateOrtografia } from '@/lib/ortografia'
import { generateIngles } from '@/lib/ingles'
import { logger } from '@/lib/logger'
import { FREE_LIMITS, PAID_LIMITS, checkPaidAccess, checkIsAdmin, getOposicionFromProfile } from '@/lib/freemium'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/generate-simulacro
 *
 * Genera un simulacro COMPLETO que replica la estructura real del examen.
 * Lee scoring_config.ejercicios de la oposición y genera TODAS las secciones simulables:
 * - conocimientos: preguntas_oficiales o free_question_bank
 * - psicotecnicos: generatePsicotecnicos con distribución por oposición
 * - ortografia/gramatica: generateOrtografia
 * - ingles: generateIngles
 * - personalidad/entrevista/fisicas: se saltan (módulos separados)
 *
 * Cada pregunta lleva pregunta.seccion = nombre del ejercicio.
 * La respuesta incluye secciones[] con metadata por sección.
 */

export const maxDuration = 30

// ─── Schema ──────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GenerateSimulacroSchema = z.object({
  examenId: z.string().regex(UUID_REGEX).optional(),
  anno: z.number().int().min(2000).max(2099).optional(),
  modo: z.enum(['anio', 'mixto']).optional().default('mixto'),
  dificultad: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(2),
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ejercicio {
  nombre: string
  tipo_ejercicio: string
  preguntas?: number
  reserva?: number
  minutos?: number
  simulable?: boolean
  penaliza?: boolean
  ratio_penalizacion?: string
  min_aprobado?: number
  max?: number
  apto_no_apto?: boolean
}

interface ScoringConfig {
  num_opciones?: number
  ejercicios?: Ejercicio[]
  minutos_total?: number
}

interface SeccionMeta {
  nombre: string
  tipo: string
  count: number
  minutos?: number
  penaliza?: boolean
  ratio_penalizacion?: string
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-simulacro' })

  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // 2. Validate
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = GenerateSimulacroSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { examenId, anno, modo, dificultad } = parsed.data

  // 3. Freemium gating
  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const [hasPaidAccess, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])

  if (hasPaidAccess && !isAdmin) {
    const rl = await checkRateLimit(user.id, 'simulacro-daily', PAID_LIMITS.simulacrosDay, '24 h')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Límite de 10 simulacros diarios alcanzado.' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } }
      )
    }
  } else if (!hasPaidAccess) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileSim } = await (serviceSupabase as any)
      .from('profiles')
      .select('free_simulacro_used')
      .eq('id', user.id)
      .single()
    const freeSimUsed = (profileSim as { free_simulacro_used?: number } | null)?.free_simulacro_used ?? 0
    if (freeSimUsed >= 1) {
      return NextResponse.json({
        error: 'Ya has realizado tu simulacro gratuito. Desbloquea simulacros ilimitados con el Pack.',
        code: 'PAYWALL_SIMULACROS',
      }, { status: 402 })
    }
  }

  // 4. Load oposición config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('scoring_config, slug')
    .eq('id', oposicionId)
    .single()

  const scoringConfig = (opoData as { scoring_config?: ScoringConfig } | null)?.scoring_config
  const opoSlug = (opoData as { slug?: string } | null)?.slug ?? ''
  const numOpciones = scoringConfig?.num_opciones ?? 4
  const ejercicios = (scoringConfig?.ejercicios ?? []) as Ejercicio[]

  // Filter to simulable exercises only (skip fisicas, personalidad, entrevista)
  const SKIP_TIPOS = new Set(['fisicas', 'personalidad', 'entrevista'])
  const simulables = ejercicios.filter(ej => ej.simulable !== false && !SKIP_TIPOS.has(ej.tipo_ejercicio))

  if (simulables.length === 0) {
    return NextResponse.json({ error: 'No hay ejercicios simulables para esta oposición.' }, { status: 404 })
  }

  log.info({ opoSlug, ejercicios: simulables.map(e => e.nombre), modo }, 'generating simulacro completo')

  // 5. Generate each section
  const allPreguntas: Pregunta[] = []
  const secciones: SeccionMeta[] = []

  for (const ej of simulables) {
    // Resolve tipo_ejercicio — legacy oposiciones use nombre instead of tipo_ejercicio
    let tipo = ej.tipo_ejercicio
    if (!tipo) {
      const nombre = (ej.nombre ?? '').toLowerCase()
      if (nombre.includes('test') || nombre.includes('cuestionario') || nombre.includes('conocimiento')) tipo = 'conocimientos'
      else if (nombre.includes('supuesto') || nombre.includes('caso') || nombre.includes('práctico') || nombre.includes('practico')) tipo = 'conocimientos' // supuestos use same question bank
      else if (nombre.includes('ofimática') || nombre.includes('informática') || nombre.includes('ofimatica')) tipo = 'conocimientos'
      else if (nombre.includes('desarrollo') || nombre.includes('escrito')) continue // skip essay-type exercises
      else tipo = 'conocimientos' // default fallback
    }
    let sectionQuestions: Pregunta[] = []

    switch (tipo) {
      case 'conocimientos': {
        sectionQuestions = await generateConocimientosSection(
          serviceSupabase, supabase, oposicionId, numOpciones, ej, modo, examenId, anno, hasPaidAccess, log
        )
        break
      }

      case 'psicotecnicos': {
        const count = ej.preguntas ?? 30
        const distribucion = getDistribucionPsicotecnicos(opoSlug)
        const psicos = generatePsicotecnicos(count, dificultad, distribucion)
        sectionQuestions = psicos.map(p => ({
          enunciado: p.enunciado,
          opciones: p.opciones as Pregunta['opciones'],
          correcta: p.correcta as 0 | 1 | 2 | 3,
          explicacion: p.explicacion,
          dificultad: p.dificultad === 1 ? 'facil' as const : p.dificultad === 3 ? 'dificil' as const : 'media' as const,
        }))
        break
      }

      case 'ortografia':
      case 'gramatica': {
        const count = ej.preguntas ?? 5
        const ortoQuestions = generateOrtografia(count, dificultad)
        sectionQuestions = ortoQuestions.map(p => ({
          enunciado: p.enunciado,
          opciones: p.opciones as Pregunta['opciones'],
          correcta: p.correcta as 0 | 1 | 2 | 3,
          explicacion: p.explicacion,
          dificultad: 'media',
        }))
        break
      }

      case 'ingles': {
        const count = ej.preguntas ?? 20
        const inglesQuestions = generateIngles(count, dificultad)
        sectionQuestions = inglesQuestions.map(p => ({
          enunciado: p.enunciado,
          opciones: p.opciones as Pregunta['opciones'],
          correcta: p.correcta as 0 | 1 | 2 | 3,
          explicacion: p.explicacion,
          dificultad: 'media',
        }))
        break
      }

      default:
        log.warn({ tipo, nombre: ej.nombre }, 'Unknown tipo_ejercicio — skipping')
        continue
    }

    // Tag each question with its section name
    for (const q of sectionQuestions) {
      q.seccion = ej.nombre
    }

    allPreguntas.push(...sectionQuestions)
    secciones.push({
      nombre: ej.nombre,
      tipo,
      count: sectionQuestions.length,
      minutos: ej.minutos,
      penaliza: ej.penaliza,
      ratio_penalizacion: ej.ratio_penalizacion,
    })

    log.info({ seccion: ej.nombre, tipo, count: sectionQuestions.length }, 'section generated')
  }

  if (allPreguntas.length === 0) {
    return NextResponse.json({ error: 'No se pudieron generar preguntas para el simulacro.' }, { status: 404 })
  }

  // 6. Save to BD
  const { data: testRow, error: insertError } = await serviceSupabase
    .from('tests_generados')
    .insert({
      user_id: user.id,
      tema_id: null,
      examen_oficial_id: null,
      tipo: 'simulacro',
      preguntas: allPreguntas as unknown as Json,
      supuesto_caso: { secciones } as unknown as Json,
      completado: false,
      prompt_version: `simulacro-completo-${opoSlug}`,
      oposicion_id: oposicionId,
    })
    .select('id, created_at')
    .single()

  if (insertError || !testRow) {
    log.error({ err: insertError }, 'error saving simulacro')
    return NextResponse.json({ error: 'Error al guardar el simulacro.' }, { status: 500 })
  }

  // Deduct free simulacro credit
  if (!hasPaidAccess) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase as any).rpc('use_free_simulacro', { p_user_id: user.id })
  }

  log.info({
    userId: user.id,
    testId: testRow.id,
    secciones: secciones.map(s => `${s.nombre}(${s.count})`),
    totalPreguntas: allPreguntas.length,
  }, 'simulacro completo created')

  return NextResponse.json({
    id: testRow.id,
    preguntas: allPreguntas,
    secciones,
    temaId: null,
    examenId: null,
    promptVersion: `simulacro-completo-${opoSlug}`,
    createdAt: testRow.created_at,
  })
}

// ─── Conocimientos section generator ─────────────────────────────────────────

async function generateConocimientosSection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceSupabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  oposicionId: string,
  numOpciones: number,
  ej: Ejercicio,
  modo: string,
  examenId: string | undefined,
  anno: number | undefined,
  hasPaidAccess: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any,
): Promise<Pregunta[]> {
  const numPreguntas = ej.preguntas ?? 100
  const maxPuntuables = numPreguntas // without reserva for the selection

  // Try official questions first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (serviceSupabase as any).from('examenes_oficiales')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preguntasTable = (serviceSupabase as any).from('preguntas_oficiales')

  type PreguntaRow = { id: string; numero: number; enunciado: string; opciones: unknown; correcta: unknown; dificultad: unknown; tema_id: string | null }

  let preguntasData: PreguntaRow[] = []

  if (modo === 'mixto') {
    // Load from ALL active exams for this oposición
    const { data: exams } = await examenesTable
      .select('id')
      .eq('oposicion_id', oposicionId)
      .eq('activo', true)

    if (exams && exams.length > 0) {
      const results = await Promise.all(
        (exams as { id: string }[]).map(ex =>
          preguntasTable.select('id, numero, enunciado, opciones, correcta, dificultad, tema_id').eq('examen_id', ex.id)
        )
      )
      preguntasData = results.flatMap(r => (r.data ?? []) as PreguntaRow[])
        .filter(p => p.numero <= maxPuntuables)
    }
  } else if (examenId) {
    const { data } = await preguntasTable
      .select('id, numero, enunciado, opciones, correcta, dificultad, tema_id')
      .eq('examen_id', examenId)
    preguntasData = ((data ?? []) as PreguntaRow[]).filter(p => p.numero <= maxPuntuables)
  } else if (anno) {
    const { data: exam } = await examenesTable
      .select('id')
      .eq('oposicion_id', oposicionId)
      .eq('anio', anno)
      .eq('activo', true)
      .limit(1)
      .single()
    if (exam) {
      const { data } = await preguntasTable
        .select('id, numero, enunciado, opciones, correcta, dificultad, tema_id')
        .eq('examen_id', (exam as { id: string }).id)
      preguntasData = ((data ?? []) as PreguntaRow[]).filter(p => p.numero <= maxPuntuables)
    }
  }

  // Fallback to free_question_bank if not enough official questions
  if (preguntasData.length < numPreguntas) {
    const faltantes = numPreguntas - preguntasData.length
    log.info({ oficiales: preguntasData.length, faltantes }, 'filling from question bank')

    const { data: bankRows } = await (serviceSupabase as any)
      .from('free_question_bank')
      .select('preguntas, tema_id')
      .eq('oposicion_id', oposicionId)

    if (bankRows) {
      const officialTexts = new Set(preguntasData.map(p => p.enunciado.slice(0, 80)))
      const bankQs: PreguntaRow[] = []
      for (const row of bankRows as { preguntas: unknown; tema_id: string }[]) {
        const pregs = (typeof row.preguntas === 'string' ? JSON.parse(row.preguntas) : row.preguntas) as { enunciado: string; opciones: string[]; correcta: number; explicacion?: string }[]
        for (const [idx, p] of (pregs ?? []).entries()) {
          if (!p?.enunciado || officialTexts.has(p.enunciado.slice(0, 80))) continue
          bankQs.push({
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
      // Shuffle and take what we need
      for (let i = bankQs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[bankQs[i], bankQs[j]] = [bankQs[j], bankQs[i]]
      }
      preguntasData.push(...bankQs.slice(0, faltantes))
    }
  }

  // Fetch tema titles for breakdown
  const temaIds = [...new Set(preguntasData.map(p => p.tema_id).filter((id): id is string => !!id))]
  const temaMap = new Map<string, string>()
  if (temaIds.length > 0) {
    const { data: temas } = await supabase.from('temas').select('id, numero, titulo').in('id', temaIds)
    for (const t of temas ?? []) temaMap.set(t.id, `T${t.numero}: ${t.titulo}`)
  }

  // Select and shuffle
  let selected: PreguntaRow[]
  if (!hasPaidAccess) {
    selected = [...preguntasData].sort((a, b) => a.numero - b.numero).slice(0, numPreguntas)
  } else {
    const shuffled = [...preguntasData]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    selected = shuffled.slice(0, numPreguntas)
  }

  // Map to Pregunta[]
  return selected.map(p => ({
    enunciado: p.enunciado,
    opciones: Array.from({ length: numOpciones }, (_, i) => (p.opciones as string[])[i] ?? '') as Pregunta['opciones'],
    correcta: p.correcta as 0 | 1 | 2 | 3,
    explicacion: '',
    dificultad: (p.dificultad as 'facil' | 'media' | 'dificil') ?? undefined,
    temaId: p.tema_id,
    temaTitulo: p.tema_id ? temaMap.get(p.tema_id) ?? null : null,
  }))
}
