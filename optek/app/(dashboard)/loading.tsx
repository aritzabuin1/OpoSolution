/**
 * Loading skeleton del segmento /(dashboard).
 *
 * Next.js muestra automáticamente este componente mientras
 * las páginas del dashboard cargan sus datos (Suspense boundary implícito).
 *
 * El layout (Sidebar + Navbar) permanece visible — solo se reemplaza
 * el contenido de `<main>`.
 *
 * Esqueleto neutral que se adapta a cualquier página del dashboard.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Cargando…">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/60" />
      </div>

      {/* Stats row skeleton — 3 cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-muted/60" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted/40" />
          </div>
        ))}
      </div>

      {/* Main content area skeleton */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full max-w-xs rounded bg-muted" />
                <div className="h-3 w-full max-w-sm rounded bg-muted/50" />
              </div>
              <div className="h-8 w-20 rounded-md bg-muted/60 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Secondary card skeleton */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="h-5 w-44 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    </div>
  )
}
