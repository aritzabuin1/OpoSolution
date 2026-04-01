'use client'

/**
 * components/estudiar/EstudiarTemaList.tsx
 *
 * Client component for the list of temas with expandable study blocks.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BloqueEstudioCard } from './BloqueEstudioCard'

interface BloqueData {
  ley: string
  rango: string
  titulo: string
  tituloCompleto: string
  generado: boolean
  contenido?: string
  articulosCount: number
  tipo: 'legislacion' | 'conocimiento_tecnico'
}

interface TemaData {
  id: string
  numero: number
  titulo: string
  bloque: string
  bloques: BloqueData[]
  locked: boolean
}

interface Props {
  temas: TemaData[]
  isPremium: boolean
  rama?: string
}

export function EstudiarTemaList({ temas, isPremium, rama = 'age' }: Props) {
  const [expandedTema, setExpandedTema] = useState<string | null>(null)

  // Group by bloque
  const bloqueGroups = new Map<string, TemaData[]>()
  for (const tema of temas) {
    const group = bloqueGroups.get(tema.bloque) ?? []
    group.push(tema)
    bloqueGroups.set(tema.bloque, group)
  }

  return (
    <div className="space-y-6">
      {[...bloqueGroups.entries()].map(([bloque, temasInBloque]) => (
        <div key={bloque}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {bloque}
          </h2>
          <div className="space-y-2">
            {temasInBloque.map((tema) => {
              const isExpanded = expandedTema === tema.id
              const generados = tema.bloques.filter(b => b.generado).length
              const total = tema.bloques.length

              return (
                <div key={tema.id} className="rounded-lg border bg-card overflow-hidden">
                  {/* Tema header — always clickable */}
                  <button
                    onClick={() => {
                      if (tema.locked) return
                      setExpandedTema(isExpanded ? null : tema.id)
                    }}
                    disabled={tema.locked}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      tema.locked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-muted/50 cursor-pointer'
                    )}
                  >
                    {tema.locked ? (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          T{tema.numero}
                        </span>
                        <span className="font-medium text-sm truncate">{tema.titulo}</span>
                      </div>
                    </div>

                    {total > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {generados}/{total}
                      </span>
                    )}
                    {total === 0 && !tema.locked && (
                      <span className="text-xs text-muted-foreground italic">Sin material</span>
                    )}
                  </button>

                  {/* Expanded: show blocks */}
                  {isExpanded && !tema.locked && tema.bloques.length > 0 && (
                    <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
                      {tema.bloques.map((bloque) => (
                        <BloqueEstudioCard
                          key={`${bloque.ley}:${bloque.rango}`}
                          bloque={bloque}
                          temaId={tema.id}
                          isPremium={isPremium}
                          rama={rama}
                        />
                      ))}

                      {/* CTA: hacer test */}
                      <a
                        href={`/tests?tema=${tema.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                      >
                        Hacer test del Tema {tema.numero} →
                      </a>
                    </div>
                  )}

                  {isExpanded && !tema.locked && tema.bloques.length === 0 && (
                    <div className="border-t px-4 py-4 bg-muted/20 text-center">
                      <p className="text-sm text-muted-foreground">
                        Material de estudio en preparación para este tema.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
