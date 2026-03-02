import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada — OpoRuta',
  robots: { index: false },
}

/**
 * 404 global — rutas inexistentes.
 *
 * Standalone (no hereda ningún layout automáticamente).
 * Diseño mínimo con branding y CTAs útiles.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Logo */}
      <Link href="/" className="mb-8 text-2xl font-bold text-primary tracking-tight">
        OpoRuta
      </Link>

      {/* Error code */}
      <p className="text-8xl font-black text-primary/10 select-none leading-none">404</p>

      {/* Message */}
      <h1 className="mt-4 text-2xl font-bold text-foreground">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        La dirección que buscas no existe o ha sido movida. Pero tu oposición sigue en pie.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Ir al dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Volver al inicio
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        © {new Date().getFullYear()} OpoRuta · El camino más corto hacia el aprobado
      </p>
    </div>
  )
}
