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
import { CalendarDays, BookOpen, ChevronDown, Play, Brain, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { useIsPremium } from '@/lib/hooks/useIsPremium'
import { FREE_LIMITS } from '@/lib/freemium'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SimulacroCardProps {
  examen: {
    id: string
    anio: number
    convocatoria: string        // 'libre' | 'promocion_interna'
    fuente_url: string | null
    numPreguntas: number        // preguntas disponibles en BD
  }
  /** Whether this oposición includes psicotécnicos (only C2 Auxiliar) */
  hasPsicotecnicos?: boolean
  /** Number of questions in first exercise (cuestionario) from scoring_config */
  preguntasExamenCompleto?: number
  /** Whether this oposición has supuesto test */
  hasSupuestoTest?: boolean
  /** Number of supuesto questions */
  preguntasSupuesto?: number
  /** Whether this oposición has ofimática exercise */
  hasOfimatica?: boolean
  /** Number of ofimática questions */
  preguntasOfimatica?: number
  /** Whether this oposición has ortografía exercise (Guardia Civil) */
  hasOrtografia?: boolean
  /** Number of ortografía questions */
  preguntasOrtografia?: number
  /** Whether this oposición has inglés exercise (Guardia Civil) */
  hasIngles?: boolean
  /** Number of inglés questions */
  preguntasIngles?: number
  /** Penalización description */
  penalizacionDesc?: string
}

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

export function SimulacroCard({ examen, hasPsicotecnicos = false, preguntasExamenCompleto = 100, hasSupuestoTest = false, preguntasSupuesto = 0, hasOfimatica = false, preguntasOfimatica = 0, hasOrtografia = false, preguntasOrtografia = 0, hasIngles = false, preguntasIngles = 0, penalizacionDesc }: SimulacroCardProps) {
  const router = useRouter()
  const isPremium = useIsPremium()

  const [expanded, setExpanded] = useState(false)
  const [incluirPsicotecnicos, setIncluirPsicotecnicos] = useState(false)
  const [dificultadPsico, setDificultadPsico] = useState<1 | 2 | 3>(2)
  const [isStarting, setIsStarting] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const isStartingRef = useRef(false)
  const isFree = isPremium !== true
  const isLoaded = examen.numPreguntas > 0
  const totalExamen = preguntasExamenCompleto + (hasSupuestoTest ? preguntasSupuesto : 0) + (hasOfimatica ? preguntasOfimatica : 0) + (hasOrtografia ? preguntasOrtografia : 0) + (hasIngles ? preguntasIngles : 0)

  async function handleIniciar() {
    if (isStartingRef.current || !isLoaded) return
    isStartingRef.current = true
    setIsStarting(true)

    try {
      const res = await fetch('/api/ai/generate-simulacro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'anio',
          examenId: examen.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/tests/${data.id}`)
        return
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setShowPaywall(true)
        return
      }

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
                  Examen Oficial
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
              {/* Estructura del examen */}
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Examen completo</p>
                <div className="text-xs text-foreground space-y-0.5">
                  {hasOrtografia && (
                    <p>{preguntasOrtografia} preguntas — Ortografía y gramática</p>
                  )}
                  <p>{preguntasExamenCompleto} preguntas — Cuestionario</p>
                  {hasSupuestoTest && (
                    <p>{preguntasSupuesto} preguntas — Supuesto práctico (caso + preguntas vinculadas)</p>
                  )}
                  {hasOfimatica && (
                    <p>{preguntasOfimatica} preguntas — Ofimática</p>
                  )}
                  {hasIngles && (
                    <p>{preguntasIngles} preguntas — Lengua extranjera (Inglés)</p>
                  )}
                  <p className="text-muted-foreground font-medium">Total: {totalExamen} preguntas</p>
                </div>
              </div>

              {/* §1.3B.13 — Modo Examen Real (+ psicotécnicas) — solo oposiciones con psicotécnicos */}
              {hasPsicotecnicos && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Modo examen
                </label>
                <button
                  onClick={() => {
                    if (isFree) { setShowPaywall(true); return }
                    setIncluirPsicotecnicos((v) => !v)
                  }}
                  className={`w-full flex items-start gap-3 rounded-md border px-3 py-2.5 text-left text-xs transition-colors ${
                    isFree
                      ? 'border-amber-200 bg-amber-50/50 cursor-not-allowed'
                      : incluirPsicotecnicos
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  <Brain className={`h-4 w-4 shrink-0 mt-0.5 ${
                    isFree ? 'text-amber-500' : incluirPsicotecnicos ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1">
                    <span className={`font-medium ${
                      isFree ? 'text-amber-800' : incluirPsicotecnicos ? 'text-primary' : 'text-foreground'
                    }`}>
                      Incluir psicotécnicos
                    </span>
                    {isFree ? (
                      <span className="ml-1 text-amber-600">
                        — Opcional: añade 30 preguntas psicotécnicas
                      </span>
                    ) : (
                      <span className="ml-1 text-muted-foreground">
                        — Añade 30 psicotécnicas al inicio (como en el examen real)
                      </span>
                    )}
                    {incluirPsicotecnicos && !isFree && (
                      <span className="ml-1 font-semibold text-primary">
                        ({totalExamen + 30} preguntas total)
                      </span>
                    )}
                  </div>
                  {isFree && (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Lock className="h-3 w-3" /> Premium
                    </span>
                  )}
                </button>

                {isFree && (
                  <p className="text-[10px] text-amber-600 pl-1">
                    El examen real incluye psicotecnicas — practica como en el dia del examen con Premium
                  </p>
                )}

                {incluirPsicotecnicos && !isFree && (
                  <div className="space-y-1.5 pl-1">
                    <label className="text-[11px] text-muted-foreground">Dificultad psicotecnicas</label>
                    <div className="flex gap-2">
                      {([
                        { label: 'Facil', value: 1 as const },
                        { label: 'Media', value: 2 as const },
                        { label: 'Dificil', value: 3 as const },
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
              )}

              {/* Aviso de penalización */}
              {penalizacionDesc && (
                <p className="text-[11px] text-muted-foreground bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  {penalizacionDesc}
                </p>
              )}

              {/* Botón iniciar */}
              <Button
                className="w-full"
                onClick={handleIniciar}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Preparando simulacro...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Simulacro ({totalExamen} preguntas)
                  </>
                )}
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
      <PaywallGate
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        code="PAYWALL_SIMULACROS"
      />
    </Card>
  )
}
