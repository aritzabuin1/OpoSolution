'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, Brain, CalendarCheck, ClipboardList, FileText, LayoutDashboard, Layers, Target, TrendingUp, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/shared/NotificationBell'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/psicotecnicos', label: 'Psicotécnicos', icon: Brain },
  { href: '/corrector', label: 'Corrector', icon: FileText },
  { href: '/simulacros', label: 'Simulacros', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/cazatrampas', label: 'Caza-Trampas', icon: Target },
  { href: '/reto-diario', label: 'Reto Diario', icon: CalendarCheck },
  { href: '/radar', label: 'Radar Tribunal', icon: TrendingUp },
  { href: '/logros', label: 'Logros', icon: Trophy },
  { href: '/cuenta', label: 'Mi cuenta', icon: User },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold tracking-tight text-primary">OpoRuta</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Notificaciones BOE — campana en sidebar desktop */}
      <div className="mt-4 border-t pt-4 flex items-center gap-2 px-3">
        <NotificationBell />
        <span className="text-xs text-muted-foreground">Notificaciones</span>
      </div>

      {/* §2.18.13 — Admin link, visible solo para admins */}
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
            ⚙ Admin
          </Link>
        </div>
      )}
    </aside>
  )
}
