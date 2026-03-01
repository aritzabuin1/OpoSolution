'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, ClipboardList, FileText, LayoutDashboard, Layers, Target, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tests', label: 'Tests', icon: ClipboardList },
  { href: '/psicotecnicos', label: 'Psicotécnicos', icon: Brain },
  { href: '/corrector', label: 'Corrector', icon: FileText },
  { href: '/simulacros', label: 'Simulacros', icon: BookOpen },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/cazatrampas', label: 'Caza-Trampas', icon: Target },
  { href: '/logros', label: 'Logros', icon: Trophy },
  { href: '/cuenta', label: 'Mi cuenta', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card px-4 py-6">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold tracking-tight text-primary">OPTEK</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
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
    </aside>
  )
}
