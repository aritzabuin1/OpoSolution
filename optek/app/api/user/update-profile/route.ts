import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/user/update-profile
 *
 * Server-side profile update.
 * 1. Verify identity via createClient (user-scoped, cookies)
 * 2. Perform update via createServiceClient (service_role, bypasses RLS)
 *
 * Why service client for the update: in API routes, the anon client's JWT
 * can't be refreshed (setAll silently fails) → expired token → auth.uid()=null
 * → RLS blocks the UPDATE with 0 rows. Service client bypasses this.
 * Security: we verify the user first, then update only THEIR profile.
 */
export async function POST(request: NextRequest) {
  // 1. Auth — verify the user's identity from cookies
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

  // Only allow updating specific fields (whitelist)
  const update: Record<string, unknown> = {}
  if ('full_name' in body) update.full_name = body.full_name
  if ('oposicion_id' in body) update.oposicion_id = body.oposicion_id
  if ('fecha_examen' in body) update.fecha_examen = body.fecha_examen
  if ('horas_diarias_estudio' in body) update.horas_diarias_estudio = body.horas_diarias_estudio

  // 2. Upsert via service client (bypasses RLS — safe because we verified identity above)
  // Uses upsert instead of update: if the profile row doesn't exist (e.g. trigger
  // handle_new_user didn't fire), it creates it. Otherwise it updates.
  const serviceClient = await createServiceClient()
  const { data, error } = await serviceClient
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...update }, { onConflict: 'id' })
    .select('oposicion_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, oposicion_id: data.oposicion_id })
}
