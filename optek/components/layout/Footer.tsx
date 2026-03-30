import Link from 'next/link'
import { ManageCookiesButton } from '@/components/shared/ManageCookiesButton'

export function Footer() {
  return (
    <footer className="border-t bg-card px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Oposiciones links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Oposiciones:</span>
          <Link href="/oposiciones/administracion" className="hover:text-foreground transition-colors">Administración del Estado</Link>
          <Link href="/oposiciones/justicia" className="hover:text-foreground transition-colors">Justicia</Link>
          <Link href="/oposiciones/correos" className="hover:text-foreground transition-colors">Correos</Link>
          <Link href="/oposiciones/hacienda" className="hover:text-foreground transition-colors">Hacienda (AEAT)</Link>
          <Link href="/oposiciones/penitenciarias" className="hover:text-foreground transition-colors">Instituciones Penitenciarias</Link>
        </div>
        {/* Legal + copyright */}
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between border-t pt-4">
          <span>© {new Date().getFullYear()} OpoRuta. Todos los derechos reservados.</span>
          <nav className="flex gap-4" aria-label="Enlaces legales">
            <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/legal/terminos" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
            <ManageCookiesButton />
            <a href="mailto:soporte@oporuta.es" className="hover:text-foreground transition-colors">
              Contacto
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
