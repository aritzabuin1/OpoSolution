import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
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

  // ── Cargar test (para tipo, tema_id y preguntas — necesarios para flashcards) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const { data: testData } = await sb
    .from('tests_generados')
    .select('id, tipo, tema_id, preguntas')
    .eq('id', testId)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('tests_generados')
    .update({
      respuestas_usuario: respuestas,
      puntuacion,
      completado: true,
    })
    .eq('id', testId)
    .eq('user_id', user.id)

  if (error) {
    log.error({ error }, 'Error al finalizar test')
    return NextResponse.json(
      { error: 'Error al guardar el test. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  // §1.13B — Actualizar racha + conceder logros (best-effort, no bloqueante)
  const [, logrosResult] = await Promise.allSettled([
    sb.rpc('update_streak', { p_user_id: user.id }),
    sb.rpc('check_and_grant_logros', { p_user_id: user.id }),
  ])

  const nuevosLogros =
    logrosResult.status === 'fulfilled' && Array.isArray(logrosResult.value.data)
      ? (logrosResult.value.data as string[])
      : []

  // §2.2.1 — Auto-generar flashcards en background (fire-and-forget)
  // Solo para tests tipo 'test' (no psicotécnicos, no simulacros)
  // Max 3 flashcards por test para controlar costes
  if (testData && testData.tipo === 'test') {
    void generateFlashcardsBackground({
      preguntas: testData.preguntas as Pregunta[],
      respuestas,
      temaId: testData.tema_id as string | null,
      userId: user.id,
      supabase: sb,
      log,
    })
  }

  log.info({ userId: user.id, puntuacion, nuevosLogros }, 'Test finalizado')
  return NextResponse.json({ ok: true, puntuacion, nuevosLogros }, { status: 200 })
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
