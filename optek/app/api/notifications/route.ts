import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

/**
 * GET  /api/notifications   — últimas 20 notificaciones del usuario (las 5 no leídas primero)
 * PATCH /api/notifications  — { id } → marca notificación como leída
 *
 * §2.13.12
 */

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notificaciones')
    .select('id, tipo, titulo, mensaje, url_accion, leida, created_at')
    .eq('user_id', user.id)
    .order('leida', { ascending: true })        // no leídas primero
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Error cargando notificaciones.' }, { status: 500 })

  return NextResponse.json(data ?? [])
}

const PatchSchema = z.object({ id: z.string().uuid() })

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id) // RLS extra check

  if (error) return NextResponse.json({ error: 'Error actualizando notificación.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
