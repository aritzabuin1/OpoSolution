/**
 * components/dashboard/TopicMap.tsx — §1.13.3
 *
 * Mapa de temas del temario coloreados por nota media.
 * Verde ≥ 7, Amarillo 4-7, Rojo < 4, Gris = no intentado.
 * Adapta bloques dinámicamente según la oposición del usuario.
 *
 * Server Component — no requiere estado cliente.
 */

import { cn } from '@/lib/utils'

interface TemaScore {
  numero: number
  titulo: string
  notaMedia: number | null
  bloque?: string
  testsCount: number
}

interface TopicMapProps {
  temas: TemaScore[]
}

function getScoreClass(nota: number | null): string {
  if (nota === null) return 'bg-muted text-muted-foreground border-muted-foreground/20'
  if (nota >= 70) return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
  if (nota >= 50) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
  return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
}

function getScoreLabel(nota: number | null): string {
  if (nota === null) return '—'
  return `${Math.round(nota)}%`
}

export function TopicMap({ temas }: TopicMapProps) {
  // Group temas by bloque dynamically (works for any oposición)
  const bloqueGroups = new Map<string, typeof temas>()
  for (const tema of temas) {
    const bloque = tema.bloque ?? (tema.numero <= 16 ? 'I' : 'II')
    if (!bloqueGroups.has(bloque)) bloqueGroups.set(bloque, [])
    bloqueGroups.get(bloque)!.push(tema)
  }

  return (
    <div className="space-y-6">
      {[...bloqueGroups.entries()].map(([bloque, bloqueItems]) => (
        <div key={bloque}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Bloque {bloque}
          </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {bloqueItems.map((tema) => (
            <div
              key={tema.numero}
              title={`Tema ${tema.numero}: ${tema.titulo}${tema.notaMedia !== null ? ` — Nota media: ${Math.round(tema.notaMedia)}%` : ' — Sin tests'}`}
              className={cn(
                'border rounded-lg p-2 text-center cursor-default transition-opacity hover:opacity-80',
                getScoreClass(tema.notaMedia)
              )}
            >
              <p className="text-[10px] font-bold">{tema.numero}</p>
              <p className="text-xs font-semibold">{getScoreLabel(tema.notaMedia)}</p>
            </div>
          ))}
        </div>
      </div>
      ))}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-300 inline-block" />
          ≥ 70% — Bien
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-300 inline-block" />
          50–69% — Regular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-300 inline-block" />
          &lt; 50% — Refuerza
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-muted-foreground/20 inline-block" />
          Sin tests
        </span>
      </div>
    </div>
  )
}
