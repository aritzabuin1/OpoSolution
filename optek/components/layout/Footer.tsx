import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-card px-6 py-4">
      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} OPTEK. Todos los derechos reservados.</span>
        <nav className="flex gap-4">
          <Link href="/privacidad" className="hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-foreground transition-colors">
            Términos
          </Link>
          <Link href="/contacto" className="hover:text-foreground transition-colors">
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  )
}
