import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FeedbackButton } from '@/components/shared/FeedbackButton'
import { checkIsAdmin } from '@/lib/admin/auth'

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
        <main className="flex-1 p-6" aria-label="Contenido principal">{children}</main>
      </div>

      <Footer />

      {/* §2.7.5 — Botón flotante de feedback (visible en todo el dashboard) */}
      <FeedbackButton />
    </div>
  )
}
