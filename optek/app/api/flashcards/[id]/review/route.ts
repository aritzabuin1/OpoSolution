import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getNextInterval, getNextReviewDate } from '@/lib/utils/spaced-repetition'
import { logger } from '@/lib/logger'

/**
 * PUT /api/flashcards/[id]/review — §2.2.5
 *
 * Actualiza el intervalo y la fecha de próximo repaso de una flashcard
 * según la calidad de la respuesta del usuario.
 *
 * Input: { calidad: 'mal' | 'dificil' | 'bien' | 'facil' }
 * Output: { intervalo_dias, siguiente_repaso }
 */

const ReviewSchema = z.object({
  calidad: z.enum(['mal', 'dificil', 'bien', 'facil']),
})

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const log = logger.child({ endpoint: 'flashcard-review', id })

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  // Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // Validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Calidad inválida.' }, { status: 400 })
  }

  const { calidad } = parsed.data

  // Cargar flashcard actual (para obtener el intervalo actual)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: card, error: fetchError } = await (supabase as any)
    .from('flashcards')
    .select('id, intervalo_dias, veces_acertada, veces_fallada')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !card) {
    return NextResponse.json({ error: 'Flashcard no encontrada.' }, { status: 404 })
  }

  // Calcular nuevo intervalo y fecha
  const nuevoIntervalo = getNextInterval(card.intervalo_dias as number, calidad)
  const siguienteRepaso = getNextReviewDate(nuevoIntervalo)
  const esCorrecta = calidad !== 'mal'

  // Actualizar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('flashcards')
    .update({
      intervalo_dias: nuevoIntervalo,
      siguiente_repaso: siguienteRepaso,
      veces_acertada: esCorrecta ? (card.veces_acertada as number) + 1 : card.veces_acertada,
      veces_fallada: !esCorrecta ? (card.veces_fallada as number) + 1 : card.veces_fallada,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    log.error({ updateError }, '[flashcard-review] Error al actualizar')
    return NextResponse.json({ error: 'Error al guardar la evaluación.' }, { status: 500 })
  }

  log.info({ id, userId: user.id, calidad, nuevoIntervalo, siguienteRepaso }, '[flashcard-review] ok')

  return NextResponse.json({ intervalo_dias: nuevoIntervalo, siguiente_repaso: siguienteRepaso })
}
