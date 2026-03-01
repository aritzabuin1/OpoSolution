'use client'

/**
 * components/simulacros/SimulacroCard.tsx — §2.6A.3
 *
 * Tarjeta de convocatoria oficial para iniciar un simulacro.
 *
 * Patrón: análogo a TemaCard.tsx (useRef + useState para anti-doble-click).
 * Sin paywall — los simulacros son gratuitos.
 *
 * Props:
 *   examen   — datos de la convocatoria (id, anio, convocatoria, numPreguntas)
 *   isLoaded — true si el examen tiene preguntas cargadas en BD
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, BookOpen, ChevronDown, Play, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SimulacroCardProps {
  examen: {
    id: string
    anio: number
    convocatoria: string        // 'libre' | 'promocion_interna'
    fuente_url: string | null
    numPreguntas: number        // preguntas disponibles en BD
  }
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MODOS: { label: string; value: number; description: string }[] = [
  { label: '100 preguntas', value: 100, description: 'Examen completo (Parte 1 + Parte 2)' },
  { label: '50 preguntas', value: 50, description: 'Media sesión (Parte 1 o Parte 2)' },
  { label: '20 preguntas', value: 20, description: 'Repaso rápido' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convocatoriaLabel(convocatoria: string): string {
  const labels: Record<string, string> = {
    libre: 'Turno libre',
    promocion_interna: 'Promoción interna',
    ordinaria: 'Convocatoria ordinaria',
  }
  return labels[convocatoria] ?? convocatoria
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SimulacroCard({ examen }: SimulacroCardProps) {
  const router = useRouter()

  const [expanded, setExpanded] = useState(false)
  const [numPreguntas, setNumPreguntas] = useState(100)
  const [incluirPsicotecnicos, setIncluirPsicotecnicos] = useState(false)
  const [dificultadPsico, setDificultadPsico] = useState<1 | 2 | 3>(2)
  const [isStarting, setIsStarting] = useState(false)

  const isStartingRef = useRef(false)

  const isLoaded = examen.numPreguntas > 0
  const modos = MODOS.filter((m) => m.value <= examen.numPreguntas)

  async function handleIniciar() {
    if (isStartingRef.current || !isLoaded) return
    isStartingRef.current = true
    setIsStarting(true)

    try {
      const res = await fetch('/api/ai/generate-simulacro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examenId: examen.id,
          numPreguntas,
          incluirPsicotecnicos,
          dificultadPsico,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/tests/${data.id}`)
        return
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 429) {
        toast.error('Límite diario alcanzado', {
          description: data?.error ?? 'Has alcanzado el límite de simulacros diarios.',
        })
        return
      }

      if (res.status === 404) {
        toast.error('Preguntas no disponibles', {
          description: 'Este examen todavía no tiene preguntas cargadas.',
        })
        return
      }

      toast.error('Error al iniciar el simulacro', {
        description: data?.error ?? 'Por favor inténtalo de nuevo.',
      })
    } catch {
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
      })
    } finally {
      isStartingRef.current = false
      setIsStarting(false)
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <button
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          disabled={isStarting}
        >
          <div className="flex items-start gap-3">
            {/* Año como icono visual */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold leading-snug">
                  Convocatoria {examen.anio}
                </p>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  INAP Oficial
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {convocatoriaLabel(examen.convocatoria)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isLoaded ? (
              <span className="flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 border border-green-200">
                <BookOpen className="h-2.5 w-2.5" />
                {examen.numPreguntas} preg.
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground border">
                Próximamente
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Las preguntas de esta convocatoria se cargarán pronto.
            </p>
          ) : (
            <>
              {/* Selector de modo */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Número de preguntas
                </label>
                <div className="grid gap-2">
                  {modos.map((modo) => (
                    <button
                      key={modo.value}
                      onClick={() => setNumPreguntas(modo.value)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                        numPreguntas === modo.value
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="font-medium">{modo.label}</span>
                      <span className="ml-2 text-muted-foreground">— {modo.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* §1.3B.13 — Modo Examen Real (+ psicotécnicas) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Modo examen
                </label>
                <button
                  onClick={() => setIncluirPsicotecnicos((v) => !v)}
                  className={`w-full flex items-start gap-3 rounded-md border px-3 py-2.5 text-left text-xs transition-colors ${
                    incluirPsicotecnicos
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <Brain className={`h-4 w-4 shrink-0 mt-0.5 ${incluirPsicotecnicos ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <span className={`font-medium ${incluirPsicotecnicos ? 'text-primary' : 'text-foreground'}`}>
                      Modo Examen Real
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      — Añade 30 psicotécnicas al inicio
                    </span>
                    {incluirPsicotecnicos && (
                      <span className="ml-1 font-semibold text-primary">
                        ({numPreguntas + 30} preguntas total)
                      </span>
                    )}
                  </div>
                </button>

                {incluirPsicotecnicos && (
                  <div className="space-y-1.5 pl-1">
                    <label className="text-[11px] text-muted-foreground">Dificultad psicotécnicas</label>
                    <div className="flex gap-2">
                      {([
                        { label: 'Fácil', value: 1 as const },
                        { label: 'Media', value: 2 as const },
                        { label: 'Difícil', value: 3 as const },
                      ] satisfies { label: string; value: 1 | 2 | 3 }[]).map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setDificultadPsico(d.value)}
                          className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                            dificultadPsico === d.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Aviso de penalización */}
              <p className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                ⚠️ Penalización real: incorrecta descuenta 1/3 del valor de una correcta.
              </p>

              {/* Botón iniciar */}
              <Button
                className="w-full"
                onClick={handleIniciar}
                disabled={isStarting}
              >
                <Play className="h-4 w-4 mr-2" />
                {isStarting ? 'Iniciando...' : 'Iniciar Simulacro'}
              </Button>

              {examen.fuente_url && (
                <p className="text-center text-[10px] text-muted-foreground">
                  <a
                    href={examen.fuente_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Ver examen oficial en BOE ↗
                  </a>
                </p>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
