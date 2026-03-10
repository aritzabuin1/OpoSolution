'use client'

/**
 * components/dashboard/RoadmapCard.tsx
 *
 * Dashboard card for generating a personalized study roadmap.
 * Uses AI streaming to create a plan based on ALL user metrics.
 * Consumes 1 analysis credit.
 *
 * Features:
 *   - Plan rendered as styled cards with color-coded difficulty tiers
 *   - Tasks auto-detected as completed from user activity data
 *   - Collapsible plan and tasks sections
 *   - Progress bar + completion celebration
 *   - Age indicator nudges update after 7 days
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Map, Loader2, RotateCcw, RefreshCw, CheckCircle2, Circle,
  PartyPopper, Calendar, ChevronDown, Zap, Target, Flame,
  Trophy, BookOpen,
} from 'lucide-react'
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
  testsByTema: Record<number, string[]>
  simulacrosCount: number
  psicotecnicosCount: number
  cazatrampasCount: number
  flashcardsReviewed: number
}

interface RoadmapCardProps {
  activity: UserActivity
}

// ── Task tier detection ─────────────────────────────────────────────────────

type TaskTier = 'quick' | 'challenge' | 'star' | 'plan'

/** Detect which tier a task belongs to based on emoji markers or keywords */
function detectTier(task: string): TaskTier {
  const lower = task.toLowerCase()
  // The prompt uses 🟢 🟡 🔴 markers and tier headings
  if (/🟢|victoria|rápid|fácil|flashcard|5 pregunta|consolid|repas/i.test(task)) return 'quick'
  if (/🔴|desafío|estrella|capaz|demuestra|inténtalo|difícil/i.test(task)) return 'star'
  if (/🟡|reto|esfuerzo|15 pregunta|20 pregunta|media/i.test(task)) return 'challenge'
  // Calendar-style plan items
  if (/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(lower)) return 'plan'
  return 'challenge'
}

const TIER_CONFIG = {
  quick: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: Zap,
    label: 'Victoria rápida',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  challenge: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Target,
    label: 'Reto',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  star: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    icon: Flame,
    label: 'Desafío estrella',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
  plan: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/10',
    border: 'border-blue-100 dark:border-blue-900',
    icon: Calendar,
    label: 'Plan',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
}

// ── Task extraction ─────────────────────────────────────────────────────────

/** Extract action items from the plan text. Deduplicates by tema number. */
function extractTasks(text: string): string[] {
  const raw = text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return /^- (Haz|Completa|Practica|Repasa|Realiza|Dedica|Revisa|Genera|Intenta|Estudia|Usa|Empieza|Termina|Consolida|Refuerza|Alterna|Combina|Incluye|Añade|Simula|¿Serías|Demuestra)/i.test(trimmed)
        || /^- ".{15,}"/.test(trimmed) // Quoted challenge tasks
        || /^- .{20,}/.test(trimmed)
    })
    .map(line => line.trim().replace(/^- /, ''))

  const seen = new Set<string>()
  const unique: string[] = []

  for (const task of raw) {
    const temas = extractTemaNumbers(task)
    const keys: string[] = temas.length > 0
      ? temas.map(n => `tema:${n}`)
      : [task.toLowerCase().replace(/[^a-záéíóúñü0-9]/g, '').slice(0, 40)]

    if (keys.every(k => seen.has(k))) continue
    keys.forEach(k => seen.add(k))
    unique.push(task)
  }

  return unique.slice(0, 12)
}

function extractTemaNumbers(task: string): number[] {
  const matches = [...task.matchAll(/\btema\s+(\d{1,2})\b/gi)]
  return matches.map(m => parseInt(m[1], 10)).filter(n => n >= 1 && n <= 28)
}

// ── Activity auto-detection ─────────────────────────────────────────────────

function isTaskAutoCompleted(task: string, activity: UserActivity, generatedAt: string | null): boolean {
  const lower = task.toLowerCase()
  if (!generatedAt) return false

  const temaNumbers = extractTemaNumbers(task)
  if (temaNumbers.length > 0) {
    return temaNumbers.every(num => {
      const dates = activity.testsByTema[num] ?? []
      return dates.some(d => d >= generatedAt)
    })
  }

  if (/simulacro/i.test(lower)) return activity.simulacrosCount > 0
  if (/psicot[eé]cnico/i.test(lower)) return activity.psicotecnicosCount > 0
  if (/flashcard/i.test(lower)) return activity.flashcardsReviewed > 0
  if (/caza.?trampa/i.test(lower)) return activity.cazatrampasCount > 0

  return false
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

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

// ── Task item component ─────────────────────────────────────────────────────

function TaskItem({ task, isDone }: { task: string; isDone: boolean }) {
  const tier = detectTier(task)
  const config = TIER_CONFIG[tier]
  const Icon = config.icon

  // Clean emoji markers from display text
  const cleanText = stripMarkdown(task).replace(/^[🟢🟡🔴]\s*/, '')

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-all ${
      isDone
        ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800'
        : `${config.bg} ${config.border}`
    }`}>
      {/* Check / Circle */}
      <div className="shrink-0 mt-0.5">
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.border}`}>
            <Icon className={`h-3 w-3 ${config.color}`} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${config.badgeClass}`}>
            {config.label}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${
          isDone ? 'text-muted-foreground line-through' : 'text-foreground'
        }`}>
          {cleanText}
        </p>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function RoadmapCard({ activity }: RoadmapCardProps) {
  const [state, setState] = useState<CardState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [planOpen, setPlanOpen] = useState(true)
  const [tasksOpen, setTasksOpen] = useState(true)
  const textRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [streamedText, state])

  const renderedHtml = useMemo(() => markdownToHtml(streamedText), [streamedText])
  const tasks = useMemo(() => state === 'done' ? extractTasks(streamedText) : [], [streamedText, state])

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
      <div className="rounded-xl border border-dashed border-blue-400/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
            <Map className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Tu plan de estudio personalizado</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              La IA analizará tu historial completo — notas, temas pendientes, racha, tendencia
              y fecha de examen — para crear un plan semanal con victorias rápidas, retos
              y un desafío estrella. Consume 1 análisis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            variant="default"
            size="sm"
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
          >
            {state === 'error' ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Reintentar
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generar mi plan
              </>
            )}
          </Button>
          <span className="text-[10px] text-muted-foreground">1 análisis</span>
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

  // ── Loading state ──────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Analizando tu preparación...</p>
            <p className="text-xs text-muted-foreground mt-0.5">Revisando historial, notas y tendencias para crear tu plan</p>
          </div>
        </div>
        {/* Animated progress */}
        <div className="mt-4 h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{ animation: 'shimmer 1.5s ease-in-out infinite', transform: 'translateX(-100%)' }}
          />
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    )
  }

  // ── Streaming state ───────────────────────────────────────────────────
  if (state === 'streaming') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold">Tu plan de estudio</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-500 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              generando...
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

  // Group tasks by tier for visual structure
  const quickWins = tasks.filter((_, i) => !completedSet.has(i) && detectTier(tasks[i]) === 'quick')
  const challenges = tasks.filter((_, i) => !completedSet.has(i) && detectTier(tasks[i]) === 'challenge')
  const starTasks = tasks.filter((_, i) => !completedSet.has(i) && detectTier(tasks[i]) === 'star')
  const completedTasks = tasks.filter((_, i) => completedSet.has(i))

  return (
    <div className="space-y-4">
      {/* ── Header with stats ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        <button
          onClick={() => setPlanOpen(p => !p)}
          className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-4 border-b border-blue-200 dark:border-blue-800 hover:from-blue-100/80 hover:to-indigo-100/50 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-bold">Tu plan de estudio</h2>
                <p className="text-[11px] text-muted-foreground">Análisis completo y plan semanal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {generatedAt && <PlanAge generatedAt={generatedAt} />}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${planOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {planOpen && (
          <div className="p-5 max-h-[500px] overflow-y-auto">
            <div
              className="text-sm leading-relaxed prose prose-sm prose-gray dark:prose-invert max-w-none
                prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2
                prose-p:text-foreground prose-p:my-1.5
                prose-li:text-foreground prose-li:my-0.5
                prose-strong:text-foreground prose-strong:font-semibold"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}
      </div>

      {/* ── Tasks card ───────────────────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
          <button
            onClick={() => setTasksOpen(t => !t)}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-4 border-b border-blue-200 dark:border-blue-800 hover:from-blue-100/80 hover:to-indigo-100/50 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold">Objetivos de la semana</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {quickWins.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <Zap className="h-3 w-3" /> {quickWins.length} rápidas
                      </span>
                    )}
                    {challenges.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                        <Target className="h-3 w-3" /> {challenges.length} retos
                      </span>
                    )}
                    {starTasks.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                        <Flame className="h-3 w-3" /> {starTasks.length} desafío
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {completedCount}/{tasks.length}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${tasksOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  allTasksDone
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                }`}
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </button>

          {tasksOpen && (
            <div className="p-4 space-y-2">
              {tasks.map((task, idx) => (
                <TaskItem
                  key={idx}
                  task={task}
                  isDone={completedSet.has(idx)}
                />
              ))}
            </div>
          )}

          {/* All tasks done — celebration */}
          {allTasksDone && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-t border-green-200 dark:border-green-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 dark:text-green-300">
                    Todos los objetivos completados
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-0.5">
                    Has avanzado esta semana. Genera un nuevo plan con retos actualizados.
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-1.5 shadow-md"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Nuevo plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regenerate button */}
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
