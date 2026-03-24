'use client'

/**
 * components/tests/TemaCard.tsx — §1.9.1
 *
 * Tarjeta interactiva para un tema del temario.
 *
 * Funcionalidad:
 *   - Muestra número de tema, título e icono de acceso (libre o bloqueado)
 *   - Selector de dificultad (fácil / media / difícil)
 *   - Selector de número de preguntas (10 / 20 / 30)
 *   - Botón "Generar Test" con protección contra doble-click:
 *       useState(isGenerating) = bloquea re-renders
 *       useRef(isGeneratingRef) = bloquea síncrono (antes del re-render)
 *   - Maneja errores HTTP del backend:
 *       402 → modal paywall
 *       409 → toast "Ya tienes un test en proceso"
 *       503 → toast "Servicio temporalmente no disponible"
 *       5xx → toast genérico
 *   - Al éxito redirige a /tests/[id]
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, ChevronDown, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { PaywallGate } from '@/components/shared/PaywallGate'
import type { TestGenerado } from '@/types/ai'
import { trackStartTrialOnce } from '@/lib/analytics/pixel'
import { trackGTMEvent } from '@/lib/analytics/gtm'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Dificultad = 'facil' | 'media' | 'dificil' | 'progresivo'
type NumPreguntas = 10 | 20 | 30

export interface TemaCardProps {
  tema: {
    id: string
    numero: number
    titulo: string
    descripcion: string | null
  }
  /** El usuario tiene acceso de pago (compras > 0) */
  hasPaidAccess: boolean
  /** Free tier v2: this specific tema has been completed by the free user */
  freeCompleted?: boolean
  /** Free tier v2: score achieved in the free test (0-100) */
  freeScore?: number | null
  /** @deprecated — kept for backward compat, ignored in new flow */
  freeTestsUsed?: number
  /** @deprecated — kept for backward compat, ignored in new flow */
  isFreeAllowed?: boolean
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIFICULTADES: { value: Dificultad; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'progresivo', label: 'Progresivo' },
]

const NUM_PREGUNTAS_OPTIONS: NumPreguntas[] = [10, 20, 30]

// ─── Componente ──────────────────────────────────────────────────────────────

export function TemaCard({ tema, hasPaidAccess, freeCompleted = false, freeScore = null }: TemaCardProps) {
  const router = useRouter()

  const [dificultad, setDificultad] = useState<Dificultad>('media')
  const [numPreguntas, setNumPreguntas] = useState<NumPreguntas>(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Bloqueo síncrono — previene doble-click incluso antes del re-render
  const isGeneratingRef = useRef(false)
  const generationStartRef = useRef<number>(0)

  // Recovery: si el usuario cambia de app y vuelve, resetear si >60s generando
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && isGeneratingRef.current) {
        const elapsed = Date.now() - generationStartRef.current
        if (elapsed > 60_000) {
          isGeneratingRef.current = false
          setIsGenerating(false)
          toast.info('Generación interrumpida', {
            description: 'La generación tardó demasiado. Puedes intentarlo de nuevo.',
          })
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Free tier v2: tema is locked if free user already completed it
  const isLocked = !hasPaidAccess && freeCompleted
  const nota = freeScore !== null ? Math.round(freeScore / 10) : null

  async function handleGenerarTest() {
    // Doble protección: ref (síncrono) + state (async)
    if (isGeneratingRef.current) return
    isGeneratingRef.current = true
    generationStartRef.current = Date.now()
    setIsGenerating(true)

    try {
      // 58s timeout — ligeramente bajo el maxDuration de Vercel (60s)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 58_000)

      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temaId: tema.id,
          numPreguntas,
          dificultad,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const test: TestGenerado = await res.json()
        trackStartTrialOnce() // §1.20.4 — fires only on first test ever
        trackGTMEvent('first_test', { test_type: 'tema' })
        router.push(`/tests/${test.id}`)
        return // no re-habilitamos el botón — navegamos fuera
      }

      // Manejo de errores HTTP
      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setShowPaywall(true)
        return
      }

      if (res.status === 409) {
        toast.warning('Ya tienes un test generándose', {
          description: 'Reintentando en unos segundos...',
        })
        // Auto-retry after the 30s server window expires
        setTimeout(() => {
          isGeneratingRef.current = false
          setIsGenerating(false)
          toast.info('Puedes volver a intentarlo', {
            description: 'El bloqueo ha expirado.',
          })
        }, 15_000)
        return
      }

      if (res.status === 503) {
        toast.error('Servicio temporalmente no disponible', {
          description: 'El servicio de IA está ocupado. Inténtalo en un minuto.',
        })
        return
      }

      if (res.status === 429) {
        toast.error('Demasiadas solicitudes', {
          description: data?.error ?? 'Espera un momento antes de intentarlo de nuevo.',
        })
        return
      }

      toast.error('Error al generar el test', {
        description: data?.error ?? `Error ${res.status}. Por favor inténtalo de nuevo.`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de red'
      toast.error('Error de conexión', {
        description: `${msg}. Comprueba tu conexión e inténtalo de nuevo.`,
      })
    } finally {
      isGeneratingRef.current = false
      setIsGenerating(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingState tema={tema.titulo} />
        </CardContent>
      </Card>
    )
  }

  // ── Vista normal ───────────────────────────────────────────────────────────
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <button
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {tema.numero}
            </span>
            <div>
              <p className="font-medium leading-snug">{tema.titulo}</p>
              {tema.descripcion && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {tema.descripcion}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {(tema as typeof tema & { bloque?: string }).bloque === 'I' && !isLocked && (
              <span
                title="Tema de legislación"
                className="flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-200"
              >
                <BookOpen className="h-2.5 w-2.5" />
                Ley
              </span>
            )}
            {isLocked && nota !== null && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                {nota}/10
              </span>
            )}
            {isLocked ? (
              <Lock className="h-4 w-4 text-amber-500" aria-label="Acceso bloqueado" />
            ) : (
              <Unlock className="h-4 w-4 text-green-500" aria-label="Acceso disponible" />
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </CardHeader>

      {expanded && isLocked && (
        <CardContent className="pt-0">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-900">
              Ya has completado tu test gratuito de este tema
              {nota !== null && <span className="ml-1">({nota}/10)</span>}
            </p>
            <p className="text-xs text-amber-700">
              Desbloquea tests ilimitados para repetir este tema y mejorar tu nota.
              Elige dificultad, número de preguntas y practica sin límites.
            </p>
            <Button
              className="w-full"
              size="sm"
              onClick={() => setShowPaywall(true)}
            >
              Desbloquear tests ilimitados
            </Button>
          </div>
        </CardContent>
      )}

      {expanded && !isLocked && (
        <CardContent className="space-y-4 pt-0">
          {hasPaidAccess ? (
            <>
              {/* Premium: selector de dificultad */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Dificultad
                </label>
                <div className="flex gap-2">
                  {DIFICULTADES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDificultad(value)}
                      className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                        dificultad === value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Premium: selector de nº preguntas */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Número de preguntas
                </label>
                <div className="flex gap-2">
                  {NUM_PREGUNTAS_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumPreguntas(n)}
                      className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                        numPreguntas === n
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleGenerarTest} disabled={isGenerating}>
                Generar Test
              </Button>
            </>
          ) : (
            /* Free: single button, no selectors */
            <div className="space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleGenerarTest}
                disabled={isGenerating}
              >
                Hacer test gratuito (10 preguntas)
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                1 test gratuito por tema · Dificultad media
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Paywall Dialog — se muestra sobre la card sin reemplazarla */}
      <PaywallGate
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        code="PAYWALL_TESTS"
        temaId={tema.id}
      />
    </Card>
  )
}
