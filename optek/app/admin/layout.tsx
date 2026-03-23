/**
 * app/(admin)/layout.tsx — §2.18.3
 *
 * Layout protegido para rutas de administración.
 * Server Component — uses centralized verifyAdmin() for authorization + audit logging.
 * Redirige a /dashboard si el usuario no es admin.
 */

import { redirect } from 'next/navigation'
import { verifyAdmin } from '@/lib/admin/auth'
import Link from 'next/link'
import { BarChart3, LineChart, Server, Settings } from 'lucide-react'
import { ExportMetricsButton } from '@/components/admin/ExportMetricsButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authorized, userId } = await verifyAdmin('(admin)/layout')

  if (!userId) redirect('/login')
  if (!authorized) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin nav bar */}
      <header className="border-b bg-background px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">OpoRuta Admin</span>
        </div>
        <nav className="flex items-center gap-3 sm:gap-4 text-sm overflow-x-auto" aria-label="Navegacion admin">
          <Link
            href="/admin/economics"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            Economics
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <LineChart className="h-3.5 w-3.5 shrink-0" />
            Analytics
          </Link>
          <Link
            href="/admin/infrastructure"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <Server className="h-3.5 w-3.5 shrink-0" />
            Infra
          </Link>
          <ExportMetricsButton />
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            ← App
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6" aria-label="Contenido admin">
        {children}
      </main>
    </div>
  )
}
