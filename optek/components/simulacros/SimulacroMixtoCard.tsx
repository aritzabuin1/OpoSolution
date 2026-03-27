'use client'

/**
 * components/simulacros/SimulacroMixtoCard.tsx — §2.6.1
 *
 * Tarjeta destacada para el "Simulacro Mixto": combina preguntas de TODAS
 * las convocatorias INAP disponibles (2019, 2022, 2024) en un único simulacro.
 *
 * Llama a POST /api/ai/generate-simulacro con { modo: 'mixto', ... }
 * (sin examenId/anno — el endpoint mezcla todas las convocatorias activas).
 *
 * Sin paywall — los simulacros son gratuitos.
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Shuffle, Play, Brain, BookOpen, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { useIsPremium } from '@/lib/hooks/useIsPremium'
import { FREE_LIMITS } from '@/lib/freemium'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SimulacroMixtoCardProps {
  /** Total de preguntas disponibles en todas las convocatorias combinadas */
  totalPreguntas: number
  /** Número de convocatorias activas disponibles */
  numConvocatorias: number
  /** Whether this oposición includes psicotécnicos (only C2 Auxiliar) */
  hasPsicotecnicos?: boolean
  /** Number of questions in first exercise (cuestionario) from scoring_config */
  preguntasExamenCompleto?: number
  /** Whether this oposición has supuesto test (caso práctico formato test) */
  hasSupuestoTest?: boolean
  /** Number of supuesto questions (from scoring_config ejercicio 2) */
  preguntasSupuesto?: number
  /** Penalización description for the exam */
  penalizacionDesc?: string
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SimulacroMixtoCard({ totalPreguntas, numConvocatorias, hasPsicotecnicos = false, preguntasExamenCompleto = 100, hasSupuestoTest = false, preguntasSupuesto = 0, penalizacionDesc }: SimulacroMixtoCardProps) {
  const router = useRouter()
  const isPremium = useIsPremium()

  const totalExamen = preguntasExamenCompleto + (hasSupuestoTest ? preguntasSupuesto : 0)
  const [incluirPsicotecnicos, setIncluirPsicotecnicos] = useState(false)
  const [dificultadPsico, setDificultadPsico] = useState<1 | 2 | 3>(2)
  const [isStarting, setIsStarting] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const isStartingRef = useRef(false)
  const isFree = isPremium !== true

  async function handleIniciar() {
    if (isStartingRef.current || totalPreguntas === 0) return
    isStartingRef.current = true
    setIsStarting(true)

    try {
      const res = await fetch('/api/ai/generate-simulacro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'mixto',
          numPreguntas: preguntasExamenCompleto,
          incluirPsicotecnicos,
          dificultadPsico,
          incluirSupuesto: hasSupuestoTest,
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
          description: 'No hay convocatorias disponibles todavía.',
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
    <Card className="border-primary/30 bg-primary/5 transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Icono distintivo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <Shuffle className="h-5 w-5 text-primary" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold leading-snug">Simulacro Mixto</p>
                <Badge className="text-[10px] font-medium bg-primary text-primary-foreground">
                  Todas las convocatorias
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Mezcla preguntas de {numConvocatorias} convocatorias —{' '}
                <span className="inline-flex items-center gap-0.5 font-medium text-green-700">
                  <BookOpen className="h-3 w-3" />
                  {totalPreguntas} preguntas disponibles
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Estructura del examen */}
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-1.5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Examen completo</p>
          <div className="text-xs text-foreground space-y-0.5">
            <p>{preguntasExamenCompleto} preguntas — Cuestionario</p>
            {hasSupuestoTest && (
              <p>{preguntasSupuesto} preguntas — Supuesto práctico (caso + preguntas vinculadas)</p>
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
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:bg-muted'
            }`}
          >
            <Brain
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                isFree ? 'text-amber-500' : incluirPsicotecnicos ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <div className="flex-1">
              <span
                className={`font-medium ${
                  isFree ? 'text-amber-800' : incluirPsicotecnicos ? 'text-primary' : 'text-foreground'
                }`}
              >
                Incluir psicotécnicos
              </span>
              {isFree ? (
                <span className="ml-1 text-amber-600">— Opcional: añade 30 preguntas psicotécnicas</span>
              ) : (
                <span className="ml-1 text-muted-foreground">— Añade 30 psicotécnicas al inicio (como en el examen real)</span>
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
                        ? 'border-primary bg-primary/10 text-primary'
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
          disabled={isStarting || totalPreguntas === 0}
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
      </CardContent>

      <PaywallGate
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        code="PAYWALL_SIMULACROS"
      />
    </Card>
  )
}
