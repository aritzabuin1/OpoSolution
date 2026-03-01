import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generatePsicotecnicos } from '@/lib/psicotecnicos'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/generate-simulacro — §2.6A.1 + §1.3B.13
 *
 * Genera un simulacro a partir de preguntas_oficiales (sin llamada a IA).
 * §1.3B.13: si incluirPsicotecnicos=true, genera 30 psicotécnicas y las
 * añade al inicio del test (simulando la estructura real del examen INAP).
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
  })
  .refine((d) => d.examenId !== undefined || d.anno !== undefined, {
    message: 'Debes indicar examenId o anno',
    path: ['examenId'],
  })

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

  const { examenId, anno, numPreguntas, incluirPsicotecnicos, dificultadPsico } = parsed.data

  // ── 3. Rate limit silencioso: 10 simulacros/día ───────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'simulacro-daily', 10, '24 h')
  if (!rateLimit.success) {
    log.warn({ userId: user.id }, '[generate-simulacro] daily limit reached')
    return NextResponse.json(
      { error: 'Has alcanzado el límite de 10 simulacros diarios. Vuelve mañana.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
      }
    )
  }

  // ── 4. Buscar el examen ───────────────────────────────────────────────────
  type ExamenRow = { id: string; anio: number; convocatoria: string }
  let examen: ExamenRow | null = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (supabase as any).from('examenes_oficiales')

  if (examenId) {
    const { data } = await examenesTable
      .select('id, anio, convocatoria')
      .eq('id', examenId)
      .eq('activo', true)
      .single()
    examen = data as ExamenRow | null
  } else {
    const { data } = await examenesTable
      .select('id, anio, convocatoria')
      .eq('anio', anno!)
      .eq('activo', true)
      .order('convocatoria')
      .limit(1)
      .maybeSingle()
    examen = data as ExamenRow | null
  }

  if (!examen) {
    return NextResponse.json(
      { error: 'Examen no encontrado o no disponible.' },
      { status: 404 }
    )
  }

  // ── 5. Cargar preguntas_oficiales ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preguntasTable = (supabase as any).from('preguntas_oficiales')
  const { data: preguntasData, error: pregError } = await preguntasTable
    .select('id, numero, enunciado, opciones, correcta, dificultad')
    .eq('examen_id', examen.id)
    .order('numero')

  if (pregError) {
    log.error({ err: pregError, examenId: examen.id }, '[generate-simulacro] error fetching preguntas')
    return NextResponse.json(
      { error: 'Error al cargar las preguntas del examen.' },
      { status: 500 }
    )
  }

  if (!preguntasData || preguntasData.length === 0) {
    return NextResponse.json(
      { error: 'Este examen no tiene preguntas cargadas todavía.' },
      { status: 404 }
    )
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
  const preguntasOficiales: Pregunta[] = selected.map((p) => {
    const opciones = p.opciones as string[]
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
  const serviceSupabase = await createServiceClient()

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
