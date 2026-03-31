import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FeedbackButton } from '@/components/shared/FeedbackButton'
import { checkIsAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard — OpoRuta',
    template: '%s — OpoRuta',
  },
  robots: { index: false, follow: false },
}

// §2.18.13 — Server Component: fetch is_admin para mostrar link de admin en Sidebar
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIsAdmin()

  // Fetch user's oposición features for dynamic sidebar
  let features: { psicotecnicos?: boolean; cazatrampas?: boolean; supuesto_practico?: boolean; supuesto_test?: boolean; ofimatica?: boolean; personalidad?: boolean } | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('oposicion_id')
        .eq('id', user.id)
        .single()
      if (profile?.oposicion_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: opo } = await (supabase as any)
          .from('oposiciones')
          .select('features')
          .eq('id', profile.oposicion_id)
          .single()
        features = (opo as { features?: typeof features } | null)?.features ?? undefined
      }
    }
  } catch {
    // Non-blocking — sidebar works without features (shows all items)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navbar — visible en <768px */}
      <Navbar isAdmin={isAdmin} features={features} />

      <div className="flex flex-1">
        {/* Desktop sidebar — visible en ≥768px */}
        <div className="hidden md:flex">
          <Sidebar isAdmin={isAdmin} features={features} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6" aria-label="Contenido principal">{children}</main>
      </div>

      <Footer />

      {/* §2.7.5 — Botón flotante de feedback (visible en todo el dashboard) */}
      <FeedbackButton />
    </div>
  )
}
