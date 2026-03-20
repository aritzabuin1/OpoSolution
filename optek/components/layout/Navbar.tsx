'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, BookOpen, Brain, CalendarCheck, ClipboardList, LayoutDashboard, Layers, Lock, LogOut, Menu, Target, TrendingUp, Trophy, User, X } from 'lucide-react'
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
  tourId?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'Tests', icon: ClipboardList, tourId: 'nav-tests' },
  { href: '/psicotecnicos', label: 'Psicotecnicos', icon: Brain, tourId: 'nav-psicotecnicos' },
  { href: '/simulacros', label: 'Simulacros', icon: BookOpen, tourId: 'nav-simulacros' },
  { href: '/flashcards', label: 'Flashcards', icon: Layers, premium: true, tourId: 'nav-flashcards' },
  { href: '/cazatrampas', label: 'Caza-Trampas', icon: Target, tourId: 'nav-cazatrampas' },
  { href: '/reto-diario', label: 'Reto Diario', icon: CalendarCheck, tourId: 'nav-reto-diario' },
  { href: '/radar', label: 'Radar Tribunal', icon: TrendingUp, premium: true, tourId: 'nav-radar' },
  { href: '/logros', label: 'Logros', icon: Trophy },
  { href: '/cuenta', label: 'Mi cuenta', icon: User },
]

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isPremium = useIsPremium()

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="border-b bg-card px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-primary">OpoRuta</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mt-3 flex flex-col gap-1" aria-label="Menu principal">
          {navItems.map(({ href, label, icon: Icon, premium, tourId }) => {
            const isLocked = premium && isPremium === false
            const isActive = pathname === href || (pathname.startsWith(href + '/') && !isTestDetailPage(pathname, href))

            return (
              <Link
                key={href}
                href={href}
                {...(tourId ? { 'data-tour': tourId } : {})}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {isLocked && <Lock className="h-3 w-3 text-amber-500" />}
              </Link>
            )
          })}
          {/* Admin link — solo visible para admins */}
          {isAdmin && (
            <Link
              href="/admin/economics"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mt-2 border-t pt-3',
                pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Admin
            </Link>
          )}
          {/* Cerrar sesión */}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full',
              isAdmin ? 'mt-1' : 'mt-2 border-t pt-3'
            )}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  )
}
