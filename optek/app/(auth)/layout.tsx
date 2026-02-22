import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Minimal header */}
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <div className="ml-auto">
          <Link href="/" className="text-lg font-bold text-primary tracking-tight">
            OPTEK
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">
          Privacidad
        </Link>
        {' · '}
        <Link href="/legal/terminos" className="hover:text-foreground transition-colors">
          Términos
        </Link>
      </footer>
    </div>
  )
}
