'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, ClipboardList, FileText, LayoutDashboard, Layers, Menu, Target, Trophy, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/shared/NotificationBell'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/corrector', label: 'Corrector', icon: FileText },
  { href: '/psicotecnicos', label: 'Psicotécnicos', icon: Brain },
  { href: '/simulacros', label: 'Simulacros', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/cazatrampas', label: 'Caza-Trampas', icon: Target },
  { href: '/logros', label: 'Logros', icon: Trophy },
  { href: '/cuenta', label: 'Mi cuenta', icon: User },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="border-b bg-card px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">OPTEK</span>
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
        <nav className="mt-3 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
