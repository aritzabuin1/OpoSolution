'use client'

/**
 * components/simulacros/ExplicarErroresPanel.tsx — §2.6A.6
 *
 * Panel que explica los errores de un simulacro usando Claude Haiku.
 * Solo visible cuando test.tipo === 'simulacro' y examen_oficial_id IS NOT NULL.
 *
 * Estados:
 *   idle    → muestra botón "Explicar mis errores con IA (1 corrección)"
 *   loading → spinner mientras Claude procesa
 *   done    → acordeón con cada error explicado
 *   error   → mensaje de error con retry
 *
 * Paywall: si sin créditos → muestra mismo modal que TemaCard (PAYWALL_CORRECTIONS).
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, ChevronDown, XCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaywallGate } from '@/components/shared/PaywallGate'
import type { ExplicacionError } from '@/types/ai'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExplicarErroresPanelProps {
  testId: string
  numErrores: number
  opciones: string[][]  // opciones[i] = array de 4 opciones de la pregunta i
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type PanelState = 'idle' | 'loading' | 'done' | 'error'

// ─── Componente ──────────────────────────────────────────────────────────────

export function ExplicarErroresPanel({ testId, numErrores, opciones }: ExplicarErroresPanelProps) {
  const [state, setState] = useState<PanelState>('idle')
  const [explicaciones, setExplicaciones] = useState<ExplicacionError[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showPaywall, setShowPaywall] = useState(false)

  async function handleExplicar() {
    if (state === 'loading') return
    setState('loading')

    try {
      const res = await fetch('/api/ai/explain-errores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })

      if (res.ok) {
        const data = await res.json()
        setExplicaciones(data.explicaciones ?? [])
        setState('done')
        return
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setShowPaywall(true)
        setState('idle')
        return
      }

      if (res.status === 503) {
        toast.error('Servicio no disponible', {
          description: 'El servicio de IA está ocupado. Inténtalo en un minuto.',
        })
        setState('error')
        return
      }

      toast.error('Error al generar explicaciones', {
        description: data?.error ?? 'Por favor inténtalo de nuevo.',
      })
      setState('error')
    } catch {
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
      })
      setState('error')
    }
  }

  function toggleExpand(numero: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(numero)) {
        next.delete(numero)
      } else {
        next.add(numero)
      }
      return next
    })
  }

  // ── Idle / Error state ──────────────────────────────────────────────────
  if (state === 'idle' || state === 'error') {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Explicar mis errores con IA</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claude analizará tus {numErrores} error{numErrores !== 1 ? 'es' : ''} y
              explicará por qué fallaste cada pregunta. Consume 1 corrección.
            </p>
          </div>
        </div>

        <Button
          onClick={handleExplicar}
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {state === 'error' ? 'Reintentar' : 'Explicar mis errores (1 corrección)'}
        </Button>

        <PaywallGate
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          code="PAYWALL_CORRECTIONS"
          temaId={undefined}
        />
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
        <div>
          <p className="font-medium text-sm">Analizando tus errores...</p>
          <p className="text-xs text-muted-foreground">Claude está revisando las {numErrores} preguntas falladas</p>
        </div>
      </div>
    )
  }

  // ── Done state — acordeón de errores ─────────────────────────────────────
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Análisis de errores con IA</h2>
      </div>

      <div className="space-y-2">
        {explicaciones.map((exp) => {
          const isOpen = expanded.has(exp.numero)
          const opcionesItem = opciones[exp.numero - 1] ?? []
          return (
            <Card key={exp.numero} className="border-amber-100">
              <CardHeader className="pb-2 pt-3">
                <button
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() => toggleExpand(exp.numero)}
                  aria-expanded={isOpen}
                >
                  <p className="text-sm leading-snug">
                    <span className="text-muted-foreground mr-1.5">P{exp.numero}.</span>
                    <span className="font-medium">{exp.enunciado}</span>
                  </p>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform mt-0.5 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </CardHeader>

              {isOpen && (
                <CardContent className="space-y-3 pt-0 pb-3">
                  {/* Tu respuesta vs correcta */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-red-700">
                        Tu respuesta:{' '}
                        <span className="font-medium">
                          {opcionesItem[exp.tuRespuesta] ?? `Opción ${exp.tuRespuesta + 1}`}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      <span className="text-green-700">
                        Correcta:{' '}
                        <span className="font-medium">
                          {opcionesItem[exp.correcta] ?? `Opción ${exp.correcta + 1}`}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Explicación IA */}
                  <p className="text-xs text-foreground leading-relaxed border-l-2 border-primary/30 pl-3 bg-muted/30 py-2 pr-2 rounded-r">
                    {exp.explicacion}
                  </p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
