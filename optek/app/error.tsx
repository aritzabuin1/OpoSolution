'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Error boundary global de Next.js 16.
 *
 * Se activa cuando un Server o Client Component lanza una excepción
 * no capturada fuera del dashboard. DEBE ser Client Component.
 *
 * `reset()` re-renderiza el segmento sin recargar la página.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log al servicio de observabilidad (actualmente solo console en Vercel)
    console.error('[OpoRuta] GlobalError:', error.message, { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Logo */}
      <Link href="/" className="mb-8 text-2xl font-bold text-primary tracking-tight">
        OpoRuta
      </Link>

      {/* Icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-foreground">Algo ha salido mal</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>

      {/* Digest for support — only in production */}
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          ref: {error.digest}
        </p>
      )}

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Ir al dashboard
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        © {new Date().getFullYear()} OpoRuta · El camino más corto hacia el aprobado
      </p>
    </div>
  )
}
