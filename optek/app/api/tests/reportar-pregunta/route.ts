import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/tests/reportar-pregunta — §1.10.7
 *
 * Guarda un reporte de pregunta incorrecta/confusa en la tabla preguntas_reportadas.
 */

const ReportSchema = z.object({
  testId: z.string().uuid(),
  preguntaIndex: z.number().int().min(0),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres').max(500),
})

export async function POST(request: NextRequest) {
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

  const parsed = ReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    )
  }

  const { testId, preguntaIndex, motivo } = parsed.data

  const { error } = await supabase.from('preguntas_reportadas').insert({
    test_id: testId,
    pregunta_index: preguntaIndex,
    motivo,
    user_id: user.id,
    estado: 'pendiente',
  })

  if (error) {
    logger.error({ error, testId, preguntaIndex }, 'Error al guardar reporte')
    return NextResponse.json({ error: 'Error al enviar el reporte.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
