import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/user/update-profile
 *
 * Server-side profile update. Uses the server Supabase client which has
 * a fresh session from request cookies — avoids browser client RLS issues
 * where auth.uid() can be null if the token expired client-side.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Only allow updating specific fields
  const update: Record<string, unknown> = {}
  if ('full_name' in body) update.full_name = body.full_name
  if ('oposicion_id' in body) update.oposicion_id = body.oposicion_id
  if ('fecha_examen' in body) update.fecha_examen = body.fecha_examen
  if ('horas_diarias_estudio' in body) update.horas_diarias_estudio = body.horas_diarias_estudio

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select('oposicion_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'No se encontró el perfil' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, oposicion_id: data.oposicion_id })
}
