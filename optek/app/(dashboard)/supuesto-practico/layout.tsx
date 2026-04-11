import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Supuesto Práctico' }

/**
 * Server-side gate: redirect to /dashboard if the user's oposición
 * does not have `supuesto_practico: true` in its features JSONB.
 * Admins bypass the check (for testing).
 */
export default async function SupuestoPracticoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceSupabase = await createServiceClient()

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('oposicion_id')
    .eq('id', user.id)
    .single()

  if (profile?.oposicion_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminCheck } = await (serviceSupabase as any)
      .from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = (adminCheck as { is_admin?: boolean } | null)?.is_admin === true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opo } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('features')
      .eq('id', profile.oposicion_id)
      .single()
    const features = (opo as { features?: { supuesto_practico?: boolean } } | null)?.features

    if (features?.supuesto_practico !== true && !isAdmin) {
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}
