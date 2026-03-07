'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Error en Admin</h1>
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p className="font-medium">Algo ha fallado al cargar esta pagina.</p>
        <pre className="mt-2 text-xs opacity-60 whitespace-pre-wrap">{error.message}</pre>
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  )
}
