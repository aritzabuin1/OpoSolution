import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInfraMetrics } from '@/lib/admin/infrastructure'

/**
 * GET /api/admin/infrastructure — §2.23
 *
 * Retorna métricas de infraestructura (cacheadas 5 min).
 * Requiere is_admin = true — verificación independiente del layout.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metrics = await getInfraMetrics()
  return NextResponse.json(metrics, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
