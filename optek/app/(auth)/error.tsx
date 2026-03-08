'use client'

import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-6 text-2xl font-bold text-primary tracking-tight">
        OpoRuta
      </Link>

      <h2 className="text-xl font-bold">Error de autenticación</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ha ocurrido un problema al procesar tu solicitud. Inténtalo de nuevo.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/50">ref: {error.digest}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-sm hover:bg-accent"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
