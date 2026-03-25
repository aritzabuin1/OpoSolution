import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNewUserNotification } from '@/lib/email/client'
import { resolveOposicionLabel } from '@/lib/utils/oposicion-labels'

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
  const serviceClient = await createServiceClient()

  // If switching to A2 (GACE), grant 1 free supuesto práctico (if they have 0)
  const A2_OPOSICION_ID = 'c2000000-0000-0000-0000-000000000001'
  if (update.oposicion_id === A2_OPOSICION_ID) {
    const { data: currentProfile } = await serviceClient
      .from('profiles')
      .select('supuestos_balance')
      .eq('id', user.id)
      .single()
    const currentBalance = (currentProfile as { supuestos_balance?: number } | null)?.supuestos_balance ?? 0
    if (currentBalance === 0) {
      update.supuestos_balance = 1
    }
  }

  const { data, error } = await serviceClient
    .from('profiles')
    .upsert({ id: user.id, email: user.email ?? '', ...update }, { onConflict: 'id' })
    .select('oposicion_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify admin when oposicion is set for NEW users (Google sign-in onboarding:
  // setup-new-user runs before /primer-test, so oposicion is missing in that email)
  // Only for users created in the last hour (onboarding window)
  if (update.oposicion_id && user.email) {
    const createdAt = new Date(user.created_at).getTime()
    const isRecentUser = Date.now() - createdAt < 60 * 60 * 1000
    if (isRecentUser) {
      const oposicionLabel = resolveOposicionLabel(update.oposicion_id as string)
      void sendNewUserNotification({
        email: user.email,
        nombre: user.user_metadata?.full_name as string | undefined,
        oposicion: oposicionLabel,
        confirmed: true,
      })
    }
  }

  return NextResponse.json({ ok: true, oposicion_id: data.oposicion_id })
}
