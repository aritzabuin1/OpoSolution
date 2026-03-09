'use client'

/**
 * components/dashboard/RoadmapCard.tsx
 *
 * Dashboard card for generating a personalized study roadmap.
 * Uses AI streaming to create a plan based on ALL user metrics.
 * Consumes 1 analysis credit.
 *
 * Visual design:
 *   - Plan text rendered with proper markdown formatting (prose CSS)
 *   - Tasks extracted into a visually polished card with checkboxes
 *   - Progress bar + completion celebration
 *   - Age indicator nudges update after 7 days
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Map, Loader2, RotateCcw, RefreshCw, CheckCircle2, Circle, PartyPopper, Calendar } from 'lucide-react'
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

/** Extract action items: lines starting with "- Haz/Completa/Practica/Repasa/Realiza/Dedica/Revisa" or any "- " with 15+ chars */
function extractTasks(text: string): string[] {
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      // Match action-oriented bullet points (verbs that start tasks)
      return /^- (Haz|Completa|Practica|Repasa|Realiza|Dedica|Revisa|Genera|Intenta|Estudia|Usa|Empieza|Termina|Consolida|Refuerza|Alterna|Combina|Incluye|Añade|Simula)/i.test(trimmed)
        || /^- .{20,}/.test(trimmed) // fallback: any bullet with 20+ chars
    })
    .map(line => line.trim().replace(/^- /, ''))
    .slice(0, 12) // max 12 tasks for clean UI
}

/** Format date in Spanish */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

/** Shows how old the plan is */
function PlanAge({ generatedAt }: { generatedAt: string }) {
  const days = Math.floor((Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24))
  const dateStr = formatDate(generatedAt)

  if (days < 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
        <Calendar className="h-3 w-3" />
        Generado hoy
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {dateStr} (hace {days}d)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
      <Calendar className="h-3 w-3" />
      {dateStr} — tu plan necesita actualizarse
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
  const completedCount = Math.min(completedTasks.size, tasks.length)
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0
  const allTasksDone = tasks.length > 0 && completedCount >= tasks.length

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

  // ── Streaming state ───────────────────────────────────────────────────
  if (state === 'streaming') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold">Tu plan de estudio personalizado</h2>
            <span className="text-xs font-normal text-muted-foreground animate-pulse">
              escribiendo...
            </span>
          </div>
        </div>

        {/* Streaming content */}
        <div
          ref={textRef}
          className="p-5 max-h-[500px] overflow-y-auto"
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {streamedText}
            <span className="inline-block w-2 h-4 bg-blue-500/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
          </div>
        </div>
      </div>
    )
  }

  // ── Done state ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Main plan card ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold">Tu plan de estudio</h2>
            </div>
            {generatedAt && <PlanAge generatedAt={generatedAt} />}
          </div>
        </div>

        {/* Rendered markdown content */}
        <div className="p-5 max-h-[500px] overflow-y-auto">
          <div
            className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2
              prose-p:text-foreground prose-p:my-1.5
              prose-li:text-foreground prose-li:my-0.5
              prose-strong:text-foreground prose-strong:font-semibold
              prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>

      {/* ── Tasks card ───────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
          {/* Tasks header with progress */}
          <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold">Tareas de esta semana</h3>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {completedCount}/{tasks.length} completadas
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  allTasksDone
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Task list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task, idx) => {
              const isDone = completedTasks.has(idx)
              return (
                <button
                  key={idx}
                  onClick={() => toggleTask(idx)}
                  className={`flex items-start gap-3 w-full text-left px-5 py-3 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                    isDone ? 'bg-green-50/30 dark:bg-green-950/10' : ''
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm leading-relaxed ${
                    isDone
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}>
                    {task}
                  </span>
                </button>
              )
            })}
          </div>

          {/* All tasks done — celebration */}
          {allTasksDone && (
            <div className="bg-green-50 dark:bg-green-950/30 border-t border-green-200 dark:border-green-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                  <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Has completado todas las tareas
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-0.5">
                    Tus datos han cambiado — genera un nuevo plan actualizado con tus avances.
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  size="sm"
                  className="shrink-0 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Nuevo plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regenerate button (when not all tasks done) */}
      {!allTasksDone && (
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerar plan (1 análisis)
          </Button>
        </div>
      )}
    </div>
  )
}
