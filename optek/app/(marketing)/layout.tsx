import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // BUG-005 fix: detectar sesión activa para mostrar CTA correcto en el header
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Public navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-primary tracking-tight">
            OPTEK
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              // Usuario autenticado → CTA "Mi dashboard"
              <Link href="/dashboard">
                <Button size="sm">Mi dashboard →</Button>
              </Link>
            ) : (
              // Usuario no autenticado → login + registro
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Registrarse gratis</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Marketing footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <span className="text-lg font-bold text-primary">OPTEK</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Tu entrenador personal de oposiciones con IA. Cada cita legal verificada al artículo exacto.
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
                  <Link href="/#faq" className="hover:text-foreground transition-colors">
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
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} OPTEK. Todos los derechos reservados. · Hecho en España 🇪🇸
          </div>
        </div>
      </footer>
    </div>
  )
}
