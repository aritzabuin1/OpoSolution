'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, BookOpen, Brain, CalendarCheck, ClipboardList, LayoutDashboard, Layers, Lock, LogOut, Target, TrendingUp, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { useIsPremium } from '@/lib/hooks/useIsPremium'

/** /tests/[uuid] pages are shared by tests AND simulacros — don't highlight "Tests" for detail pages */
function isTestDetailPage(pathname: string, href: string): boolean {
  return href === '/tests' && /^\/tests\/[^/]+/.test(pathname)
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  premium?: boolean
  premiumDesc?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/psicotecnicos', label: 'Psicotecnicos', icon: Brain },
  { href: '/simulacros', label: 'Simulacros', icon: BookOpen },
  {
    href: '/flashcards', label: 'Flashcards', icon: Layers,
    premium: true,
    premiumDesc: 'Tarjetas de repaso espaciado que se adaptan a tu ritmo. Consolida lo aprendido y no olvides nada.',
  },
  {
    href: '/cazatrampas', label: 'Caza-Trampas', icon: Target,
    premium: true,
    premiumDesc: 'Detecta errores sutiles en textos legales reales. 3 gratis al dia, ilimitados con Premium.',
  },
  { href: '/reto-diario', label: 'Reto Diario', icon: CalendarCheck },
  {
    href: '/radar', label: 'Radar Tribunal', icon: TrendingUp,
    premium: true,
    premiumDesc: 'Descubre que articulos caen mas en los examenes INAP. Prioriza lo que el tribunal realmente pregunta.',
  },
  { href: '/logros', label: 'Logros', icon: Trophy },
  { href: '/cuenta', label: 'Mi cuenta', icon: User },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isPremium = useIsPremium()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside aria-label="Barra lateral" className="flex h-full w-64 flex-col border-r bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold tracking-tight text-primary">OpoRuta</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1" aria-label="Menu principal">
        {navItems.map(({ href, label, icon: Icon, premium, premiumDesc }) => {
          const isLocked = premium && isPremium === false
          const isActive = pathname === href || (pathname.startsWith(href + '/') && !isTestDetailPage(pathname, href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group/nav relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {isLocked && (
                <div className="relative">
                  <Lock className="h-3 w-3 text-amber-500" />
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover/nav:block w-56 p-3 rounded-lg bg-popover border shadow-lg">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{premiumDesc}</p>
                    <p className="text-[11px] text-primary font-medium mt-2">Desbloquear con Premium &rarr;</p>
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Notificaciones BOE + Cerrar sesion */}
      <div className="mt-4 border-t pt-4 space-y-2 px-3">
        <div className="flex items-center gap-2">
          <NotificationBell />
          <span className="text-xs text-muted-foreground">Notificaciones</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>

      {/* Admin link, visible solo para admins */}
      {isAdmin && (
        <div className="mt-4 border-t pt-4">
          <Link
            href="/admin/economics"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Admin
          </Link>
        </div>
      )}
    </aside>
  )
}
