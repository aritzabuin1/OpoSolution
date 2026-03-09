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
 *   streaming → text appearing token by token (rendered as markdown)
 *   done      → full plan with action items as checkable tasks
 *   error     → error message with retry
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Map, Loader2, RotateCcw, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { markdownToHtml } from '@/lib/utils/simple-markdown'

type CardState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

const STORAGE_KEY = 'oporuta_roadmap'
const TASKS_KEY = 'oporuta_roadmap_tasks'

interface SavedRoadmap {
  text: string
  generatedAt: string
}

/** Extract action items from the roadmap text (lines starting with - that look like tasks) */
function extractTasks(text: string): string[] {
  return text
    .split('\n')
    .filter(line => /^- .{10,}/.test(line.trim()))
    .map(line => line.trim().replace(/^- /, ''))
    .slice(0, 15) // max 15 tasks
}

/** Shows how old the plan is, with a nudge to update if >7 days */
function PlanAge({ generatedAt }: { generatedAt: string }) {
  const days = Math.floor((Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 1) return <span className="text-[10px] text-muted-foreground">Generado hoy</span>
  if (days <= 7) return <span className="text-[10px] text-muted-foreground">Hace {days} día{days > 1 ? 's' : ''}</span>
  return (
    <span className="text-[10px] text-amber-600 font-medium">
      Hace {days} días — actualiza tu plan
    </span>
  )
}

export function RoadmapCard() {
  const [state, setState] = useState<CardState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  const textRef = useRef<HTMLDivElement>(null)

  // Load saved roadmap on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: SavedRoadmap = JSON.parse(saved)
        setStreamedText(parsed.text)
        setGeneratedAt(parsed.generatedAt)
        setState('done')
      }
      const savedTasks = localStorage.getItem(TASKS_KEY)
      if (savedTasks) {
        setCompletedTasks(new Set(JSON.parse(savedTasks)))
      }
    } catch {
      // ignore localStorage errors
    }
  }, [])

  // Auto-scroll as text streams
  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [streamedText, state])

  const renderedHtml = useMemo(() => markdownToHtml(streamedText), [streamedText])
  const tasks = useMemo(() => state === 'done' ? extractTasks(streamedText) : [], [streamedText, state])
  const allTasksDone = tasks.length > 0 && completedTasks.size >= tasks.length

  function toggleTask(idx: number) {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      localStorage.setItem(TASKS_KEY, JSON.stringify([...next]))
      return next
    })
  }

  async function handleGenerate() {
    if (state === 'loading' || state === 'streaming') return

    // Capture previous plan before clearing state (for evolution context)
    const prevPlan = streamedText || null
    const prevDate = generatedAt || null

    setState('loading')
    setStreamedText('')
    setCompletedTasks(new Set())
    setGeneratedAt(null)
    localStorage.removeItem(TASKS_KEY)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50_000)

    try {
      const res = await fetch('/api/ai/generate-roadmap/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(prevPlan ? { previousPlan: prevPlan, previousPlanDate: prevDate } : {}),
        }),
        signal: controller.signal,
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

      if (accumulated.trim().length === 0) {
        toast.error('El plan no generó contenido', {
          description: 'Inténtalo de nuevo en unos segundos.',
        })
        setState('error')
        return
      }

      // Save to localStorage for persistence
      const nowIso = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        text: accumulated,
        generatedAt: nowIso,
      }))
      setGeneratedAt(nowIso)

      setState('done')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('Ha tardado demasiado', {
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
      <div className="flex items-center justify-between gap-2">
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
        {state === 'done' && generatedAt && (
          <PlanAge generatedAt={generatedAt} />
        )}
      </div>

      <div
        ref={textRef}
        className="rounded-lg border border-blue-200 dark:border-blue-800 bg-muted/30 p-4 max-h-[600px] overflow-y-auto"
      >
        {state === 'streaming' ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {streamedText}
            <span className="inline-block w-2 h-4 bg-blue-500/60 animate-pulse ml-0.5 align-text-bottom" />
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

      {/* ── Task tracker (only when done) ──────────────────────────────── */}
      {state === 'done' && tasks.length > 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tareas del plan ({completedTasks.size}/{tasks.length})
            </p>
            <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${tasks.length > 0 ? (completedTasks.size / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <ul className="space-y-1.5">
            {tasks.map((task, idx) => (
              <li key={idx}>
                <button
                  onClick={() => toggleTask(idx)}
                  className={`flex items-start gap-2.5 w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted ${
                    completedTasks.has(idx) ? 'opacity-50' : ''
                  }`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                    completedTasks.has(idx)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {completedTasks.has(idx) ? '✓' : ''}
                  </span>
                  <span className={completedTasks.has(idx) ? 'line-through' : ''}>
                    {task}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {allTasksDone && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-center space-y-2">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Has completado todas las tareas del plan
              </p>
              <Button
                onClick={handleGenerate}
                variant="default"
                size="sm"
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar plan de estudio (1 análisis)
              </Button>
            </div>
          )}
        </div>
      )}

      {state === 'done' && !allTasksDone && (
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
