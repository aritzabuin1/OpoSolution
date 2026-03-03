import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/generate-repaso — §repaso_errores
 *
 * Genera un test de repaso con las preguntas que el usuario ha fallado
 * en sus tests recientes. Sin llamada a IA — 100% determinista.
 *
 * Fuente: tests_generados completados del usuario (tipo='tema' o 'simulacro'),
 * excluyendo tests tipo 'psicotecnico' y 'repaso_errores'.
 *
 * Algoritmo:
 *   1. Cargar los últimos 30 tests completados del usuario
 *   2. Por cada test, extraer preguntas donde respuesta_usuario ≠ correcta
 *   3. Deduplicar por enunciado (misma pregunta puede aparecer en varios tests)
 *   4. Shuffle Fisher-Yates → seleccionar hasta 20 preguntas
 *   5. Guardar en BD como tipo='repaso_errores'
 *
 * Créditos: NINGUNO — el repaso de errores es siempre gratuito.
 * Rate limit: 10 repasos/día (silencioso).
 */

const MAX_TESTS_SCAN = 30   // tests más recientes a escanear
const MAX_PREGUNTAS   = 20  // preguntas máximo por repaso
const MIN_PREGUNTAS   = 3   // mínimo para generar repaso (menos → empty state)

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-repaso' })

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

  // ── 2. Rate limit: 10 repasos/día ────────────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'repaso-daily', 10, '24 h')
  if (!rateLimit.success) {
    log.warn({ userId: user.id }, '[generate-repaso] daily limit reached')
    return NextResponse.json(
      { error: 'Has alcanzado el límite de 10 repasos diarios. Vuelve mañana.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
      }
    )
  }

  // ── 3. Cargar tests recientes del usuario ─────────────────────────────────
  const { data: testsData, error: testsError } = await supabase
    .from('tests_generados')
    .select('preguntas, respuestas_usuario')
    .eq('user_id', user.id)
    .eq('completado', true)
    .not('tipo', 'in', '("psicotecnico","repaso_errores")')
    .order('created_at', { ascending: false })
    .limit(MAX_TESTS_SCAN)

  if (testsError) {
    log.error({ err: testsError, userId: user.id }, '[generate-repaso] error fetching tests')
    return NextResponse.json(
      { error: 'Error al cargar tu historial de tests.' },
      { status: 500 }
    )
  }

  if (!testsData || testsData.length === 0) {
    return NextResponse.json(
      { error: 'Todavía no tienes tests completados. ¡Haz tu primer test primero!' },
      { status: 404 }
    )
  }

  // ── 4. Extraer preguntas falladas — deduplicar por enunciado ──────────────
  const preguntasFalladasMap = new Map<string, Pregunta>()

  for (const test of testsData) {
    const preguntas = test.preguntas as Pregunta[] | null
    const respuestas = test.respuestas_usuario as (number | null)[] | null

    if (!preguntas || !respuestas) continue

    preguntas.forEach((pregunta, idx) => {
      const respuesta = respuestas[idx]
      // Solo preguntas incorrectas (no en blanco, no correctas)
      if (respuesta === null || respuesta === pregunta.correcta) return
      // Deduplicar por enunciado (truncado a 100 chars para robustez)
      const key = pregunta.enunciado.slice(0, 100)
      if (!preguntasFalladasMap.has(key)) {
        // Limpiar explicación vacía para que el repaso muestre la explicación original
        preguntasFalladasMap.set(key, { ...pregunta })
      }
    })
  }

  const todasFalladas = [...preguntasFalladasMap.values()]

  if (todasFalladas.length < MIN_PREGUNTAS) {
    log.info(
      { userId: user.id, falladas: todasFalladas.length },
      '[generate-repaso] not enough errors — empty state'
    )
    return NextResponse.json(
      {
        error: `Solo has fallado ${todasFalladas.length} pregunta${todasFalladas.length === 1 ? '' : 's'} hasta ahora. ¡Sigue practicando y el repaso aparecerá aquí!`,
      },
      { status: 404 }
    )
  }

  // ── 5. Fisher-Yates shuffle + selección ───────────────────────────────────
  const shuffled = [...todasFalladas]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const preguntas = shuffled.slice(0, MAX_PREGUNTAS)

  // ── 6. Guardar en BD ──────────────────────────────────────────────────────
  const serviceSupabase = await createServiceClient()

  const { data: testRow, error: insertError } = await serviceSupabase
    .from('tests_generados')
    .insert({
      user_id: user.id,
      tema_id: null,
      tipo: 'repaso_errores',
      preguntas: preguntas as unknown as Json,
      completado: false,
      prompt_version: 'repaso-1.0',
    })
    .select('id, created_at')
    .single()

  if (insertError || !testRow) {
    log.error({ err: insertError, userId: user.id }, '[generate-repaso] error saving test')
    return NextResponse.json(
      { error: 'Error al guardar el repaso. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  log.info(
    {
      userId: user.id,
      testId: testRow.id,
      preguntasCount: preguntas.length,
      testsEscaneados: testsData.length,
      totalFalladas: todasFalladas.length,
    },
    '[generate-repaso] repaso creado correctamente'
  )

  return NextResponse.json(
    {
      id: testRow.id,
      preguntas,
      preguntasCount: preguntas.length,
      totalFalladas: todasFalladas.length,
      promptVersion: 'repaso-1.0',
      createdAt: testRow.created_at,
    },
    { status: 200 }
  )
}
