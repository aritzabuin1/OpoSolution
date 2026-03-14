import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { generateFlashcardFromError } from '@/lib/ai/flashcards'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/tests/[id]/finalizar — §1.10.9 + §2.2.1
 *
 * Guarda las respuestas del usuario y la puntuación final del test.
 * Marca el test como `completado = true`.
 *
 * §2.2.1: Auto-genera flashcards para preguntas incorrectas (best-effort,
 * máximo 3 por test). Solo para tests tipo 'test' (no psicotécnicos ni simulacros).
 * El cliente no espera a la generación de flashcards — se hace en background.
 */

const FinalizarSchema = z.object({
  respuestas: z.array(z.union([z.number().int().min(0).max(3), z.null()])),
  puntuacion: z.number().int().min(0).max(100),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testId } = await params
  const log = logger.child({ endpoint: 'finalizar-test', testId })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = FinalizarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos: ' + parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    )
  }

  const { respuestas, puntuacion } = parsed.data

  // Service client para bypass RLS (no hay UPDATE policy en tests_generados).
  // Auth ya verificada arriba — el .eq('user_id') asegura ownership.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = (await createServiceClient()) as any

  const { data: testData } = await sb
    .from('tests_generados')
    .select('id, tipo, tema_id, preguntas')
    .eq('id', testId)
    .eq('user_id', user.id)
    .single()

  const { error } = await sb
    .from('tests_generados')
    .update({
      respuestas_usuario: respuestas,
      puntuacion,
      completado: true,
    })
    .eq('id', testId)
    .eq('user_id', user.id)

  if (error) {
    log.error({ error, testId, userId: user.id, puntuacion }, 'Error al finalizar test')

    // BUG-027: DB constraint CHECK (puntuacion BETWEEN 0 AND 10) rechaza valores 0-100.
    // Fallback: reintentar con puntuacion escalada a 0-10 hasta aplicar migration 027.
    const isConstraintViolation = error.code === '23514'
    if (isConstraintViolation) {
      const puntuacion10 = Math.round(puntuacion / 10 * 10) / 10 // 70→7.0, 100→10.0
      const { error: retryError } = await sb
        .from('tests_generados')
        .update({
          respuestas_usuario: respuestas,
          puntuacion: puntuacion10,
          completado: true,
        })
        .eq('id', testId)
        .eq('user_id', user.id)

      if (!retryError) {
        log.warn({ testId, original: puntuacion, scaled: puntuacion10 },
          'Puntuacion escalada 0-10 (constraint legacy) — aplicar migration 027')
        // Fall through to RPCs and success response
      } else {
        log.error({ retryError }, 'Retry con puntuacion escalada también falló')
        return NextResponse.json(
          { error: 'Error al guardar el test. Inténtalo de nuevo.' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Error al guardar el test. Inténtalo de nuevo.' },
        { status: 500 }
      )
    }
  }

  // §1.13B — Actualizar racha PRIMERO, luego conceder logros (secuencial:
  // check_and_grant_logros lee racha_maxima, que update_streak acaba de actualizar)
  let nuevosLogros: string[] = []
  try {
    const { error: streakErr } = await sb.rpc('update_streak', { p_user_id: user.id })
    if (streakErr) log.warn({ streakErr }, 'update_streak RPC failed')

    const { data: logrosData, error: logrosErr } = await sb.rpc('check_and_grant_logros', { p_user_id: user.id })
    if (logrosErr) {
      log.error({ logrosErr }, 'check_and_grant_logros RPC failed — ¿migration 029 aplicada?')
    } else {
      nuevosLogros = Array.isArray(logrosData) ? (logrosData as string[]) : []
      if (nuevosLogros.length > 0) {
        log.info({ nuevosLogros, userId: user.id }, 'Logros desbloqueados')
      }
    }
  } catch (err) {
    log.error({ err }, 'Error en rachas/logros — verificar RPCs en Supabase remoto')
  }

  // §2.2.1 — Auto-generar flashcards en background (fire-and-forget)
  // Solo para tests tipo 'tema' y 'repaso_errores' (no psicotécnicos, no simulacros)
  // Max 3 flashcards por test para controlar costes
  if (testData && (testData.tipo === 'tema' || testData.tipo === 'repaso_errores')) {
    void generateFlashcardsBackground({
      preguntas: testData.preguntas as Pregunta[],
      respuestas,
      temaId: testData.tema_id as string | null,
      userId: user.id,
      supabase: sb,
      log,
    })

    // §2.11 — Registrar preguntas incorrectas para Weakness-Weighted RAG
    void trackWeaknessBackground({
      testId,
      preguntas: testData.preguntas as Pregunta[],
      respuestas,
      supabase: sb,
      log,
    })
  }

  log.info({ userId: user.id, puntuacion, nuevosLogros }, 'Test finalizado')
  return NextResponse.json({ ok: true, puntuacion, nuevosLogros }, { status: 200 })
}

// ─── Weakness-Weighted RAG tracking (§2.11) ───────────────────────────────────

interface WeaknessTrackParams {
  testId: string
  preguntas: Pregunta[]
  respuestas: (number | null)[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any
}

/**
 * Registra en `tests_generados.preguntas_incorrectas` los artículos legales
 * de las preguntas respondidas incorrectamente (solo Bloque I con cita).
 * Esto alimenta el Weakness-Weighted RAG: en futuros tests, buildContext
 * boosteará estos artículos al inicio del contexto.
 */
async function trackWeaknessBackground({
  testId,
  preguntas,
  respuestas,
  supabase,
  log,
}: WeaknessTrackParams) {
  try {
    // Filtrar preguntas incorrectas con cita legal (solo Bloque I)
    const incorrectas = preguntas
      .map((p, i) => ({ p, respuesta: respuestas[i] }))
      .filter(({ p, respuesta }) => respuesta !== null && respuesta !== p.correcta && p.cita)

    if (incorrectas.length === 0) return

    // Lookup batch: obtener legislacion_id para cada cita incorrecta
    const lookupResults = await Promise.allSettled(
      incorrectas.map(async ({ p }) => {
        const { data } = await supabase
          .from('legislacion')
          .select('id, ley_codigo, articulo_numero')
          .eq('ley_codigo', p.cita!.ley)
          .eq('articulo_numero', p.cita!.articulo)
          .maybeSingle()

        if (!data) return null
        return {
          legislacion_id: data.id as string,
          articulo_numero: data.articulo_numero as string,
          ley_codigo: data.ley_codigo as string,
        }
      })
    )

    const incorrectasData = lookupResults
      .filter(
        (
          r
        ): r is PromiseFulfilledResult<{
          legislacion_id: string
          articulo_numero: string
          ley_codigo: string
        }> => r.status === 'fulfilled' && r.value !== null
      )
      .map((r) => r.value)

    if (incorrectasData.length === 0) return

    await supabase
      .from('tests_generados')
      .update({ preguntas_incorrectas: incorrectasData })
      .eq('id', testId)

    log.info(
      { testId, count: incorrectasData.length },
      '[weakness-rag] preguntas_incorrectas actualizadas'
    )
  } catch (err) {
    // Nunca propagar errores en background — el usuario ya tiene su resultado
    log.warn({ err, testId }, '[weakness-rag] Error al registrar preguntas incorrectas')
  }
}

// ─── Flashcard background generation ─────────────────────────────────────────

interface FlashcardBgParams {
  preguntas: Pregunta[]
  respuestas: (number | null)[]
  temaId: string | null
  userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any
}

async function generateFlashcardsBackground({
  preguntas,
  respuestas,
  temaId,
  userId,
  supabase,
  log,
}: FlashcardBgParams) {
  try {
    // Encontrar preguntas incorrectas (no psicotécnicas — no tienen cita pero el tipo ya lo filtra)
    const incorrectas = preguntas
      .map((p, i) => ({ pregunta: p, respuesta: respuestas[i] }))
      .filter(({ pregunta, respuesta }) => respuesta !== null && respuesta !== pregunta.correcta)
      .slice(0, 3) // máximo 3 flashcards por test (control de costes)

    if (incorrectas.length === 0) return

    // Generar flashcards en paralelo (máx 3 llamadas Haiku simultáneas)
    const results = await Promise.allSettled(
      incorrectas.map(({ pregunta }) => generateFlashcardFromError(pregunta, temaId))
    )

    const flashcardsToInsert = results
      .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof generateFlashcardFromError>>>> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map((r) => ({
        user_id: userId,
        tema_id: r.value.tema_id,
        frente: r.value.frente,
        reverso: r.value.reverso,
        cita_legal: r.value.cita_legal,
        origen: r.value.origen,
        siguiente_repaso: new Date().toISOString().split('T')[0],
      }))

    if (flashcardsToInsert.length === 0) return

    const { error: insertError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)

    if (insertError) {
      log.warn({ insertError }, '[flashcards] Error al insertar flashcards')
    } else {
      log.info({ count: flashcardsToInsert.length, userId }, '[flashcards] Flashcards generadas')
    }
  } catch (err) {
    // Nunca propagar errores en background — el usuario ya tiene su resultado
    log.warn({ err }, '[flashcards] Error en generación background')
  }
}
