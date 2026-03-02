import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FeedbackButton } from '@/components/shared/FeedbackButton'
import { createClient } from '@/lib/supabase/server'

// §2.18.13 — Server Component: fetch is_admin para mostrar link de admin en Sidebar
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.is_admin === true
    }
  } catch {
    // Graceful degradation: si la columna is_admin no existe aún (migration pendiente)
    // o cualquier otro error, simplemente no mostramos el link de admin
    isAdmin = false
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navbar — visible en <768px */}
      <Navbar />

      <div className="flex flex-1">
        {/* Desktop sidebar — visible en ≥768px */}
        <div className="hidden md:flex">
          <Sidebar isAdmin={isAdmin} />
        </div>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      <Footer />

      {/* §2.7.5 — Botón flotante de feedback (visible en todo el dashboard) */}
      <FeedbackButton />
    </div>
  )
}
