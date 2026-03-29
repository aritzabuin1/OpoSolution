'use client'

/**
 * components/simulacros/ExplicarErroresPanel.tsx — §2.6A.6
 *
 * Panel de análisis socrático de errores con sistema de batches.
 * Cada batch analiza hasta 10 errores y consume 1 crédito.
 *
 * Ejemplo: 25 errores → 3 batches (10 + 10 + 5) = 3 créditos.
 *
 * Estados por batch:
 *   idle      → muestra botón "¿Por qué fallo esto? — Tu Tutor IA te lo explica"
 *   loading   → spinner mientras se inicia conexión
 *   streaming → texto apareciendo token a token
 *   done      → texto completo, muestra botón para siguiente batch si queda
 *   error     → mensaje de error con retry
 *
 * Paywall: si sin créditos → muestra modal PaywallGate (PAYWALL_CORRECTIONS).
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { markdownToHtml } from '@/lib/utils/simple-markdown'
import { trackEvent } from '@/lib/analytics/track'

const LS_KEY = 'oporuta_first_analysis_seen'
const LS_DEMO_KEY = 'oporuta_demo_analysis_seen'
const ERRORS_PER_BATCH = 10

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExplicarErroresPanelProps {
  testId: string
  numErrores: number
  opciones: string[][]
  /** True when this is the user's first completed test — triggers demo preview */
  isFirstTestWithErrors?: boolean
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

type BatchState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

interface BatchResult {
  text: string
  state: BatchState
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ExplicarErroresPanel({ testId, numErrores, isFirstTestWithErrors }: ExplicarErroresPanelProps) {
  const totalBatches = Math.ceil(numErrores / ERRORS_PER_BATCH)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [currentBatch, setCurrentBatch] = useState(0) // next batch to analyze
  const [activeBatchState, setActiveBatchState] = useState<BatchState>('idle')
  const [showPaywall, setShowPaywall] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [demoText, setDemoText] = useState<string | null>(null)
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'done'>('idle')
  const textRef = useRef<HTMLDivElement>(null)

  const hasStarted = batchResults.length > 0 || activeBatchState !== 'idle'
  const allDone = currentBatch >= totalBatches
  const batchStart = currentBatch * ERRORS_PER_BATCH + 1
  const batchEnd = Math.min((currentBatch + 1) * ERRORS_PER_BATCH, numErrores)
  const errorsInBatch = batchEnd - batchStart + 1

  // Combine all batch results into a single rendered HTML
  const allText = batchResults.map(b => b.text).join('\n\n')
  const renderedHtml = useMemo(() => markdownToHtml(allText), [allText])

  // Check if user has never seen analysis before
  useEffect(() => {
    try {
      setIsFirstTime(!localStorage.getItem(LS_KEY))
    } catch { /* SSR / privacy mode */ }
    trackEvent('view:analysis-cta')
  }, [])

  const dismissFirstTime = useCallback(() => {
    setIsFirstTime(false)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* noop */ }
  }, [])

  // ── Demo auto-trigger: first test with errors → generate preview (no credit) ──
  const demoLaunched = useRef(false)
  useEffect(() => {
    if (!isFirstTestWithErrors || demoLaunched.current) return
    let demoSeen = false
    try { demoSeen = !!localStorage.getItem(LS_DEMO_KEY) } catch { /* noop */ }
    if (demoSeen) return

    demoLaunched.current = true
    setDemoState('loading')

    // Notify user + scroll to panel
    toast('Tu Tutor IA está analizando tus errores...', {
      description: 'Vista previa gratuita — no consume créditos',
      duration: 5000,
      icon: '✨',
    })
    setTimeout(() => {
      document.getElementById('analisis-ia')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 500)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    ;(async () => {
      try {
        const res = await fetch('/api/ai/explain-errores/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId, batch: 0, demo: true }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) { setDemoState('idle'); return }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let text = ''
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setDemoText(text)
        }
        if (text.length > 0) {
          setDemoState('done')
          try { localStorage.setItem(LS_DEMO_KEY, '1') } catch { /* noop */ }
        } else {
          setDemoState('idle')
        }
      } catch {
        setDemoState('idle')
      } finally {
        clearTimeout(timeout)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstTestWithErrors, testId])

  // Auto-scroll as text streams
  useEffect(() => {
    if (activeBatchState === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [batchResults, activeBatchState])

  async function handleAnalyzeBatch() {
    if (activeBatchState === 'loading' || activeBatchState === 'streaming') return
    trackEvent('click:analysis-cta')
    setActiveBatchState('loading')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50_000)

    try {
      const res = await fetch('/api/ai/explain-errores/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, batch: currentBatch }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        if (res.status === 402) {
          setShowPaywall(true)
          setActiveBatchState('idle')
          return
        }

        if (res.status === 503) {
          toast.error('Servicio no disponible', {
            description: 'El servicio de IA está ocupado. Inténtalo en un minuto.',
          })
          setActiveBatchState('error')
          return
        }

        toast.error('Error al generar explicaciones', {
          description: data?.error ?? 'Por favor inténtalo de nuevo.',
        })
        setActiveBatchState('error')
        return
      }

      if (!res.body) {
        setActiveBatchState('error')
        return
      }

      setActiveBatchState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        // Update batchResults with streaming text so it renders live
        setBatchResults(prev => {
          const updated = [...prev]
          // Replace or add the current batch entry
          if (updated.length <= currentBatch) {
            updated.push({ text: accumulated, state: 'streaming' })
          } else {
            updated[currentBatch] = { text: accumulated, state: 'streaming' }
          }
          return updated
        })
      }

      if (accumulated.trim().length === 0) {
        toast.error('El análisis no generó contenido', {
          description: 'Inténtalo de nuevo en unos segundos.',
        })
        setActiveBatchState('error')
        return
      }

      // Finalize this batch
      setBatchResults(prev => {
        const updated = [...prev]
        if (updated.length <= currentBatch) {
          updated.push({ text: accumulated, state: 'done' })
        } else {
          updated[currentBatch] = { text: accumulated, state: 'done' }
        }
        return updated
      })
      setActiveBatchState('done')
      setCurrentBatch(b => b + 1)
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
      setActiveBatchState('error')
    } finally {
      clearTimeout(timeout)
    }
  }

  // ── Info text about batching ──────────────────────────────────────────────
  function batchInfoText(): string {
    if (numErrores <= ERRORS_PER_BATCH) {
      return `Consume 1 crédito IA.`
    }
    return `${numErrores} errores → ${totalBatches} bloques de hasta ${ERRORS_PER_BATCH} (1 crédito IA por bloque).`
  }

  // ── Demo preview state (blur + CTA) ────────────────────────────────────
  if (demoText && demoState === 'done' && !hasStarted) {
    const demoHtml = markdownToHtml(demoText)
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Tu Tutor IA ha empezado a analizar tus errores</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Esto es una vista previa. Desbloquea el análisis completo gratis.
            </p>
          </div>
        </div>

        {/* Demo text visible */}
        <div className="relative">
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: demoHtml }}
          />
          {/* Gradient blur overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" style={{ top: '40%' }} />
          <div className="absolute bottom-0 inset-x-0 backdrop-blur-sm bg-background/60 h-16" />
        </div>

        {/* CTA over blur */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-sm font-medium">
            ¿Quieres ver la explicación completa?
          </p>
          <Button
            onClick={() => { dismissFirstTime(); setDemoText(null); setDemoState('idle'); handleAnalyzeBatch() }}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Ver análisis completo (gratis — tienes 2 sesiones)
          </Button>
        </div>

        <PaywallGate
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          code="PAYWALL_CORRECTIONS"
          temaId={undefined}
        />
      </div>
    )
  }

  // Demo loading state
  if (demoState === 'loading' && demoText && !hasStarted) {
    const partialHtml = markdownToHtml(demoText)
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium">Tu Tutor IA está analizando tus errores...</p>
        </div>
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: partialHtml }}
        />
      </div>
    )
  }

  // ── Initial idle state (never started) ────────────────────────────────────
  if (!hasStarted) {
    return (
      <div className={`rounded-xl border border-dashed p-6 space-y-4 transition-all ${
        isFirstTime
          ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-400/30 animate-[pulse_3s_ease-in-out_2]'
          : 'border-primary/30 bg-primary/5'
      }`}>
        {/* First-time highlight — no dismiss button, always visible until they click analyze */}
        {isFirstTime && (
          <div className="-mt-1 -mx-1 mb-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Nuevo — prueba cómo funciona
            </span>
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
              con preguntas y te da un truco para no olvidarlo. {batchInfoText()}
            </p>
          </div>
        </div>

        <Button
          onClick={() => { dismissFirstTime(); handleAnalyzeBatch() }}
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {numErrores <= ERRORS_PER_BATCH
            ? `¿Por qué fallo esto? — Tu Tutor IA te lo explica`
            : `Tutor IA: explicar errores 1-${Math.min(ERRORS_PER_BATCH, numErrores)} (1 crédito)`
          }
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

  // ── Loading state (connecting to current batch) ───────────────────────────
  if (activeBatchState === 'loading') {
    return (
      <section className="space-y-3">
        <BatchHeader />
        {/* Show previous batch results */}
        {batchResults.length > 0 && (
          <PreviousBatchesView html={renderedHtml} textRef={textRef} />
        )}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div>
            <p className="font-medium text-sm">Conectando con el tutor IA...</p>
            <p className="text-xs text-muted-foreground">
              Analizando errores {batchStart}-{batchEnd} de {numErrores}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Streaming / Done state ────────────────────────────────────────────────
  const currentStreamingText = batchResults[batchResults.length - 1]?.text ?? ''
  const isStreaming = activeBatchState === 'streaming'

  // Combine completed batches HTML + current streaming text
  const completedBatchesHtml = batchResults.slice(0, -1).map(b => b.text).join('\n\n')
  const completedHtml = useMemo(() => markdownToHtml(completedBatchesHtml), [completedBatchesHtml])

  return (
    <section className="space-y-3">
      <BatchHeader />

      <div
        ref={textRef}
        className="rounded-lg border border-primary/20 bg-muted/30 p-4 max-h-[500px] overflow-y-auto"
      >
        {/* Previously completed batches */}
        {completedBatchesHtml && (
          <>
            <div
              className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
                prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
                prose-strong:text-foreground prose-code:text-foreground"
              dangerouslySetInnerHTML={{ __html: completedHtml }}
            />
            <hr className="my-4 border-primary/20" />
          </>
        )}

        {/* Current batch (streaming or done) */}
        {isStreaming ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {currentStreamingText}
            <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
          </div>
        ) : (
          <div
            className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
              prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
              prose-strong:text-foreground prose-code:text-foreground"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(currentStreamingText) }}
          />
        )}
      </div>

      {/* Progress + next batch CTA */}
      {!isStreaming && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {allDone ? (
              <>Análisis completo — {numErrores} errores analizados en {totalBatches} {totalBatches === 1 ? 'bloque' : 'bloques'}.</>
            ) : (
              <>Bloque {currentBatch}/{totalBatches} completado — quedan {numErrores - currentBatch * ERRORS_PER_BATCH} errores sin analizar.</>
            )}
          </p>
          {!allDone && (
            <Button
              onClick={handleAnalyzeBatch}
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Tutor IA: errores {currentBatch * ERRORS_PER_BATCH + 1}-{Math.min((currentBatch + 1) * ERRORS_PER_BATCH, numErrores)} (1 crédito)
            </Button>
          )}
        </div>
      )}

      {/* Error retry for current batch */}
      {activeBatchState === 'error' && (
        <Button
          onClick={handleAnalyzeBatch}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Reintentar bloque {currentBatch + 1}
        </Button>
      )}

      <PaywallGate
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        code="PAYWALL_CORRECTIONS"
        temaId={undefined}
      />
    </section>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BatchHeader() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold">Análisis de errores con IA</h2>
    </div>
  )
}

function PreviousBatchesView({ html, textRef }: { html: string; textRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={textRef}
      className="rounded-lg border border-primary/20 bg-muted/30 p-4 max-h-[500px] overflow-y-auto"
    >
      <div
        className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
          prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground
          prose-strong:text-foreground prose-code:text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
