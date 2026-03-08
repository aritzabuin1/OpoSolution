'use client'

/**
 * components/dashboard/RoadmapCard.tsx
 *
 * Dashboard card for generating a personalized study roadmap.
 * Uses AI streaming to create a plan based on ALL user metrics.
 * Consumes 1 analysis credit.
 *
 * States:
 *   idle      → shows description + CTA button
 *   loading   → spinner while connecting
 *   streaming → text appearing token by token
 *   done      → full text with scroll
 *   error     → error message with retry
 */

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Map, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'

type CardState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export function RoadmapCard() {
  const [state, setState] = useState<CardState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as text streams
  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [streamedText, state])

  async function handleGenerate() {
    if (state === 'loading' || state === 'streaming') return
    setState('loading')
    setStreamedText('')

    try {
      const res = await fetch('/api/ai/generate-roadmap/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
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

        toast.error('Error al generar plan de estudio', {
          description: data?.error ?? 'Por favor inténtalo de nuevo.',
        })
        setState('error')
        return
      }

      if (!res.body) {
        setState('error')
        return
      }

      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamedText(accumulated)
      }

      setState('done')
    } catch {
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
      })
      setState('error')
    }
  }

  // ── Idle / Error state ──────────────────────────────────────────────────
  if (state === 'idle' || state === 'error') {
    return (
      <div className="rounded-xl border border-dashed border-blue-400/30 bg-blue-50/50 dark:bg-blue-950/20 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Plan de estudio personalizado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Un tutor IA analizará todo tu historial — nota por tema, temas sin probar,
              racha, tendencia y fecha de examen — para crear un plan de estudio semanal
              adaptado a tu nivel. Consume 1 análisis.
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          {state === 'error' ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reintentar
            </>
          ) : (
            <>
              <Map className="h-4 w-4 mr-2" />
              Generar mi plan de estudio (1 análisis)
            </>
          )}
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

  // ── Loading state ──────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        <div>
          <p className="font-medium text-sm">Analizando tu preparación...</p>
          <p className="text-xs text-muted-foreground">Revisando historial completo para crear tu plan personalizado</p>
        </div>
      </div>
    )
  }

  // ── Streaming / Done state ─────────────────────────────────────────────
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h2 className="text-sm font-semibold">
          Tu plan de estudio personalizado
          {state === 'streaming' && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              escribiendo...
            </span>
          )}
        </h2>
      </div>

      <div
        ref={textRef}
        className="rounded-lg border border-blue-200 dark:border-blue-800 bg-muted/30 p-4 max-h-[600px] overflow-y-auto"
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {streamedText}
          {state === 'streaming' && (
            <span className="inline-block w-2 h-4 bg-blue-500/60 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>

      {state === 'done' && (
        <Button
          onClick={handleGenerate}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Regenerar plan (1 análisis)
        </Button>
      )}
    </section>
  )
}
