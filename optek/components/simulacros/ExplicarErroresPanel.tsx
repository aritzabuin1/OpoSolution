'use client'

/**
 * components/simulacros/ExplicarErroresPanel.tsx — §2.6A.6
 *
 * Panel que explica los errores de un simulacro usando Claude Haiku.
 * Solo visible cuando test.tipo === 'simulacro' y examen_oficial_id IS NOT NULL.
 *
 * Estados:
 *   idle      → muestra botón "Explicar mis errores con IA (1 corrección)"
 *   loading   → spinner mientras se inicia conexión
 *   streaming → texto apareciendo token a token (primer token <500ms)
 *   done      → texto completo con scroll
 *   error     → mensaje de error con retry
 *
 * Paywall: si sin créditos → muestra modal PaywallGate (PAYWALL_CORRECTIONS).
 */

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExplicarErroresPanelProps {
  testId: string
  numErrores: number
  opciones: string[][]
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type PanelState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

// ─── Componente ──────────────────────────────────────────────────────────────

export function ExplicarErroresPanel({ testId, numErrores }: ExplicarErroresPanelProps) {
  const [state, setState] = useState<PanelState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as text streams
  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [streamedText, state])

  async function handleExplicar() {
    if (state === 'loading' || state === 'streaming') return
    setState('loading')
    setStreamedText('')

    try {
      const res = await fetch('/api/ai/explain-errores/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })

      // Non-streaming error responses (auth, paywall, rate limit)
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

        toast.error('Error al generar explicaciones', {
          description: data?.error ?? 'Por favor inténtalo de nuevo.',
        })
        setState('error')
        return
      }

      // Start reading stream
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

  // ── Loading state (connecting) ──────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
        <div>
          <p className="font-medium text-sm">Conectando con el tutor IA...</p>
          <p className="text-xs text-muted-foreground">Preparando análisis socrático</p>
        </div>
      </div>
    )
  }

  // ── Streaming / Done state ──────────────────────────────────────────────
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">
          Análisis de errores con IA
          {state === 'streaming' && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              escribiendo...
            </span>
          )}
        </h2>
      </div>

      <div
        ref={textRef}
        className="rounded-lg border border-primary/20 bg-muted/30 p-4 max-h-[500px] overflow-y-auto"
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {streamedText}
          {state === 'streaming' && (
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>
    </section>
  )
}
