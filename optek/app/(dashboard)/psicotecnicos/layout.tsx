import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Psicotécnicos' }

/**
 * Server-side gate: redirect to /dashboard if the user's oposición
 * does not have `psicotecnicos: true` in its features JSONB.
 * No admin bypass — features define what the oposición offers, not payment.
 */
export default async function PsicotecnicosLayout({ children }: { children: React.ReactNode }) {
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
    const { data: opo } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('features')
      .eq('id', profile.oposicion_id)
      .single()
    const features = (opo as { features?: { psicotecnicos?: boolean } } | null)?.features

    if (features?.psicotecnicos !== true) {
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}
