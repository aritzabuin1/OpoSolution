import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PersonalidadHub } from './PersonalidadHub'

export const metadata: Metadata = {
  title: 'Personalidad Policial',
  description: 'Módulo de personalidad policial con IA — assessment Big Five, entrevista simulada, coaching personalizado.',
}

export default async function PersonalidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceSupabase = await createServiceClient()

  // Fetch user profile for oposición context (is_admin not in generated types — cast)
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('oposicion_id, corrections_balance')
    .eq('id', user.id)
    .single()

  // Check admin status separately (field added by migration, not in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminCheck } = await (serviceSupabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  const isAdmin = (adminCheck as { is_admin?: boolean } | null)?.is_admin === true

  // Fetch oposición slug + features for cuerpo context & access gating
  // No admin bypass on feature gates — features define what the oposición offers
  let cuerpoSlug = 'policia-nacional'
  if (profile?.oposicion_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opo } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('slug, features')
      .eq('id', profile.oposicion_id)
      .single()
    const opoRow = opo as { slug?: string; features?: { personalidad?: boolean } } | null
    // Block access if oposición doesn't have personalidad feature
    if (opoRow?.features?.personalidad !== true) {
      redirect('/dashboard')
    }
    if (opoRow?.slug && ['ertzaintza', 'guardia-civil', 'policia-nacional'].includes(opoRow.slug)) {
      cuerpoSlug = opoRow.slug
    }
  } else {
    // No oposición selected — can't access personalidad
    redirect('/dashboard')
  }

  // Fetch personality sessions (table not yet in generated types — cast to any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions } = await (serviceSupabase as any)
    .from('personalidad_sesiones')
    .select('id, tipo, completed, scores, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Latest completed profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestProfile = (sessions ?? []).find(
    (s: any) => s.tipo === 'perfil' && s.completed
  )

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personalidad Policial</h1>
        <p className="mt-1 text-sm text-gray-500">
          Evalúa tu perfil de personalidad, practica entrevistas y recibe coaching personalizado.
        </p>
      </div>

      <PersonalidadHub
        cuerpoSlug={cuerpoSlug}
        credits={isAdmin ? 999 : (profile?.corrections_balance ?? 0)}
        sessions={sessions ?? []}
        hasProfile={!!latestProfile}
        latestProfile={latestProfile?.scores ?? null}
      />
    </div>
  )
}
