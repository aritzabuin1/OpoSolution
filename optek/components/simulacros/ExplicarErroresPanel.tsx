'use client'

/**
 * components/simulacros/ExplicarErroresPanel.tsx — §2.6A.6
 *
 * Panel de análisis socrático de errores.
 * Disponible en todos los tests con errores (tema, simulacro, radar, etc.).
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

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { markdownToHtml } from '@/lib/utils/simple-markdown'

const LS_KEY = 'oporuta_first_analysis_seen'

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
  const [isFirstTime, setIsFirstTime] = useState(false)
  const renderedHtml = useMemo(() => markdownToHtml(streamedText), [streamedText])
  const textRef = useRef<HTMLDivElement>(null)

  // Check if user has never seen analysis before
  useEffect(() => {
    try {
      setIsFirstTime(!localStorage.getItem(LS_KEY))
    } catch { /* SSR / privacy mode */ }
  }, [])

  const dismissFirstTime = useCallback(() => {
    setIsFirstTime(false)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* noop */ }
  }, [])

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

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50_000) // 50s client timeout

    try {
      const res = await fetch('/api/ai/explain-errores/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
        signal: controller.signal,
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

      // Guard against empty response from AI
      if (accumulated.trim().length === 0) {
        toast.error('El análisis no generó contenido', {
          description: 'Inténtalo de nuevo en unos segundos.',
        })
        setState('error')
        return
      }

      setState('done')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('El análisis ha tardado demasiado', {
          description: 'El servicio de IA está saturado. Inténtalo de nuevo.',
        })
      } else {
        toast.error('Error de conexión', {
          description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
        })
      }
      setState('error')
    } finally {
      clearTimeout(timeout)
    }
  }

  // ── Idle / Error state ──────────────────────────────────────────────────
  if (state === 'idle' || state === 'error') {
    return (
      <div className={`rounded-xl border border-dashed p-6 space-y-4 transition-all ${
        isFirstTime
          ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-400/30 animate-[pulse_3s_ease-in-out_2]'
          : 'border-primary/30 bg-primary/5'
      }`}>
        {/* First-time dismiss */}
        {isFirstTime && (
          <div className="flex items-center justify-between -mt-1 -mx-1 mb-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Nuevo — prueba cómo funciona
            </span>
            <button onClick={dismissFirstTime} className="text-muted-foreground hover:text-foreground p-0.5" aria-label="Cerrar">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isFirstTime ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'
          }`}>
            <Sparkles className={`h-5 w-5 ${isFirstTime ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
          </div>
          <div>
            <p className="font-semibold text-sm">
              ¿Por qué has fallado {numErrores === 1 ? 'esta pregunta' : `estas ${numErrores} preguntas`}?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              La IA analiza cada error: entiende tu razonamiento, te guía al artículo correcto
              con preguntas y te da un truco para no olvidarlo. Consume 1 análisis.
            </p>
          </div>
        </div>

        <Button
          onClick={() => { dismissFirstTime(); handleExplicar() }}
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {state === 'error' ? 'Reintentar' : 'Analizar mis errores (1 análisis)'}
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
        {state === 'streaming' ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {streamedText}
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
              prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
              prose-strong:text-foreground prose-code:text-foreground"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
      </div>
    </section>
  )
}
