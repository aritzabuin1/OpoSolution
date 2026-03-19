import Link from 'next/link'
import { MarketingNavAuth } from '@/components/layout/MarketingNavAuth'
import { ManageCookiesButton } from '@/components/shared/ManageCookiesButton'

export const revalidate = 3600 // Cache marketing layout for 1 hour

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Public navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="relative inline-block group">
            <span
              className="absolute inset-0 text-xl font-black tracking-tight text-primary/20 blur-lg select-none pointer-events-none"
              aria-hidden="true"
            >
              OpoRuta
            </span>
            <span className="relative text-xl font-black tracking-tight bg-gradient-to-r from-[#1B4F72] via-[#2563EB] to-[#D4A017] bg-clip-text text-transparent">
              OpoRuta
            </span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Navegacion principal">
            <Link href="/blog" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-2">
              Blog
            </Link>
            <Link href="/examenes-oficiales" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-2">
              Simulacros INAP
            </Link>
            <Link href="/herramientas" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-2">
              Herramientas
            </Link>
            <MarketingNavAuth />
          </nav>
        </div>
      </header>

      <main className="flex-1" aria-label="Contenido principal">{children}</main>

      {/* Marketing footer */}
      <footer aria-label="Pie de pagina" className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <span className="text-lg font-bold text-primary">OpoRuta</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                El camino más corto hacia el aprobado. Cada cita legal verificada al artículo exacto.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Producto</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/#como-funciona" className="hover:text-foreground transition-colors">
                    Cómo funciona
                  </Link>
                </li>
                <li>
                  <Link href="/#precios" className="hover:text-foreground transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/examenes-oficiales" className="hover:text-foreground transition-colors">
                    Simulacros INAP Oficiales
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog y guías
                  </Link>
                </li>
                <li>
                  <Link href="/herramientas" className="hover:text-foreground transition-colors">
                    Herramientas gratuitas
                  </Link>
                </li>
                <li>
                  <Link href="/preguntas-frecuentes" className="hover:text-foreground transition-colors">
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/legal/privacidad" className="hover:text-foreground transition-colors">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terminos" className="hover:text-foreground transition-colors">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
                    Política de cookies
                  </Link>
                </li>
                <li>
                  <ManageCookiesButton />
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} OpoRuta. Todos los derechos reservados. · Hecho en España 🇪🇸
          </div>
        </div>
      </footer>
    </div>
  )
}
