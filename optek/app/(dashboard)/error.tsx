'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Error boundary del segmento /(dashboard).
 *
 * Se activa cuando una página del dashboard lanza una excepción.
 * El layout (Sidebar + Navbar) permanece intacto — solo se reemplaza
 * el contenido de `<main>` con este componente.
 *
 * DEBE ser Client Component.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[OpoRuta] DashboardError:', error.message, { digest: error.digest })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      {/* Icon */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-7 w-7 text-destructive"
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

      <h2 className="text-xl font-bold text-foreground">Algo ha salido mal</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Esta sección ha encontrado un error. Tus datos están seguros — puedes intentar de nuevo.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/50">ref: {error.digest}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
