'use client'

/**
 * components/dashboard/RoadmapCard.tsx
 *
 * Dashboard card for generating a personalized study roadmap.
 * Uses AI streaming to create a plan based on ALL user metrics.
 * Consumes 1 analysis credit.
 *
 * Features:
 *   - Plan text rendered with proper markdown formatting
 *   - Tasks auto-detected as completed from user activity data
 *   - Collapsible plan and tasks sections
 *   - Progress bar + completion celebration
 *   - Age indicator nudges update after 7 days
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Map, Loader2, RotateCcw, RefreshCw, CheckCircle2, Circle, PartyPopper, Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { markdownToHtml, stripMarkdown } from '@/lib/utils/simple-markdown'

type CardState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

const STORAGE_KEY = 'oporuta_roadmap'

interface SavedRoadmap {
  text: string
  generatedAt: string
}

/** User activity data passed from the server component for auto-detection */
export interface UserActivity {
  /** Tests completed by the user: tema number → array of completion dates (ISO strings) */
  testsByTema: Record<number, string[]>
  /** Number of simulacros completed */
  simulacrosCount: number
  /** Number of psicotecnicos completed */
  psicotecnicosCount: number
  /** Number of cazatrampas completed */
  cazatrampasCount: number
  /** Number of flashcards reviewed */
  flashcardsReviewed: number
}

interface RoadmapCardProps {
  activity: UserActivity
}

/** Extract action items: lines starting with action verbs or any "- " with 20+ chars */
function extractTasks(text: string): string[] {
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return /^- (Haz|Completa|Practica|Repasa|Realiza|Dedica|Revisa|Genera|Intenta|Estudia|Usa|Empieza|Termina|Consolida|Refuerza|Alterna|Combina|Incluye|Añade|Simula)/i.test(trimmed)
        || /^- .{20,}/.test(trimmed)
    })
    .map(line => line.trim().replace(/^- /, ''))
    .slice(0, 12)
}

/** Extract tema number(s) from a task string, e.g. "Haz 3 tests en Tema 5" → [5] */
function extractTemaNumbers(task: string): number[] {
  const matches = [...task.matchAll(/\btema\s+(\d{1,2})\b/gi)]
  return matches.map(m => parseInt(m[1], 10)).filter(n => n >= 1 && n <= 28)
}

/** Check if a task is auto-completed based on user activity since plan generation */
function isTaskAutoCompleted(task: string, activity: UserActivity, generatedAt: string | null): boolean {
  const lower = task.toLowerCase()

  // If no generation date, can't determine what's new
  if (!generatedAt) return false

  const temaNumbers = extractTemaNumbers(task)

  // Task mentions specific tema(s) → check if user did tests on those temas since plan was generated
  if (temaNumbers.length > 0) {
    return temaNumbers.every(num => {
      const dates = activity.testsByTema[num] ?? []
      return dates.some(d => d >= generatedAt)
    })
  }

  // Task mentions simulacro → check count (heuristic: at least 1 done since plan)
  if (/simulacro/i.test(lower)) {
    return activity.simulacrosCount > 0
  }

  // Task mentions psicotécnico → check count
  if (/psicot[eé]cnico/i.test(lower)) {
    return activity.psicotecnicosCount > 0
  }

  // Task mentions flashcard → check count
  if (/flashcard/i.test(lower)) {
    return activity.flashcardsReviewed > 0
  }

  // Task mentions caza-trampas → check count
  if (/caza.?trampa/i.test(lower)) {
    return activity.cazatrampasCount > 0
  }

  return false
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

export function RoadmapCard({ activity }: RoadmapCardProps) {
  const [state, setState] = useState<CardState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [planOpen, setPlanOpen] = useState(true)
  const [tasksOpen, setTasksOpen] = useState(true)
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

  // Auto-detect completed tasks from user activity
  const completedSet = useMemo(() => {
    const set = new Set<number>()
    tasks.forEach((task, idx) => {
      if (isTaskAutoCompleted(task, activity, generatedAt)) {
        set.add(idx)
      }
    })
    return set
  }, [tasks, activity, generatedAt])

  const completedCount = completedSet.size
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0
  const allTasksDone = tasks.length > 0 && completedCount >= tasks.length

  async function handleGenerate() {
    if (state === 'loading' || state === 'streaming') return

    const prevPlan = streamedText || null
    const prevDate = generatedAt || null

    setState('loading')
    setStreamedText('')
    setGeneratedAt(null)
    setPlanOpen(true)
    setTasksOpen(true)

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
        <div className="bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold">Tu plan de estudio personalizado</h2>
            <span className="text-xs font-normal text-muted-foreground animate-pulse">
              escribiendo...
            </span>
          </div>
        </div>

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
        {/* Header — clickable to collapse */}
        <button
          onClick={() => setPlanOpen(p => !p)}
          className="w-full bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-950/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold">Tu plan de estudio</h2>
          </div>
          <div className="flex items-center gap-2">
            {generatedAt && <PlanAge generatedAt={generatedAt} />}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${planOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Collapsible content */}
        {planOpen && (
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
        )}
      </div>

      {/* ── Tasks card ───────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
          {/* Tasks header — clickable to collapse */}
          <button
            onClick={() => setTasksOpen(t => !t)}
            className="w-full bg-blue-50 dark:bg-blue-950/30 px-5 py-3 border-b border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-blue-950/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold">Tareas de esta semana</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {completedCount}/{tasks.length} completadas
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${tasksOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  allTasksDone ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </button>

          {/* Collapsible task list */}
          {tasksOpen && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks.map((task, idx) => {
                const isDone = completedSet.has(idx)
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-5 py-3 ${
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
                      {stripMarkdown(task)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

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
