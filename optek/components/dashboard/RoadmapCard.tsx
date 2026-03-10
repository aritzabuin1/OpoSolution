'use client'

/**
 * components/dashboard/RoadmapCard.tsx
 *
 * Dashboard card for generating a personalized study roadmap.
 * Uses AI streaming → parses structured JSON → renders visual cards.
 * Consumes 1 analysis credit.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Map, Loader2, RotateCcw, RefreshCw, CheckCircle2,
  PartyPopper, Calendar, ChevronDown, Zap, Target, Flame,
  Trophy, Lightbulb, BarChart3, GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'

type CardState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

const STORAGE_KEY = 'oporuta_roadmap_v2'

// ── Types for structured roadmap ────────────────────────────────────────────

type TaskTier = 'quick' | 'challenge' | 'star'

interface RoadmapTask {
  tier: TaskTier
  accion: string
  detalle: string
  tema: number | null
}

interface PlanItem {
  tema: number | null
  titulo: string
  mensaje: string
}

interface RoadmapData {
  diagnostico: string
  plan: PlanItem[]
  consejo: string
  tareas: RoadmapTask[]
}

interface SavedRoadmap {
  data: RoadmapData
  rawText: string
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

// ── Tier config ─────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  quick: {
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: Zap,
    label: 'Victoria rápida',
    accent: 'emerald',
  },
  challenge: {
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200/80 dark:border-amber-800/60',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: Target,
    label: 'Reto',
    accent: 'amber',
  },
  star: {
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20',
    border: 'border-rose-200/80 dark:border-rose-800/60',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    icon: Flame,
    label: 'Desafío estrella',
    accent: 'rose',
  },
} as const

// ── Activity auto-detection ─────────────────────────────────────────────────

function isTaskCompleted(task: RoadmapTask, activity: UserActivity, generatedAt: string | null): boolean {
  if (!generatedAt) return false
  const lower = task.accion.toLowerCase()

  if (task.tema) {
    const dates = activity.testsByTema[task.tema] ?? []
    return dates.some(d => d >= generatedAt)
  }

  if (/simulacro/i.test(lower)) return activity.simulacrosCount > 0
  if (/flashcard/i.test(lower)) return activity.flashcardsReviewed > 0
  if (/caza.?trampa/i.test(lower)) return activity.cazatrampasCount > 0

  return false
}

// ── Parse JSON from streamed text ───────────────────────────────────────────

function parseRoadmapJSON(text: string): RoadmapData | null {
  try {
    // Try to find JSON in the text (model might wrap it in markdown code blocks)
    let jsonStr = text.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

    // Try direct parse
    const parsed = JSON.parse(jsonStr)

    // Validate minimum structure
    if (parsed.tareas && Array.isArray(parsed.tareas)) {
      return {
        diagnostico: parsed.diagnostico ?? '',
        plan: Array.isArray(parsed.plan) ? parsed.plan.filter((p: PlanItem) => p.titulo && p.mensaje) : [],
        consejo: parsed.consejo ?? '',
        tareas: parsed.tareas.filter((t: RoadmapTask) =>
          t.accion && ['quick', 'challenge', 'star'].includes(t.tier)
        ),
      }
    }
  } catch {
    // JSON parse failed
  }
  return null
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
      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
        <Calendar className="h-3 w-3" />
        Hoy
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {dateStr}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
      <Calendar className="h-3 w-3" />
      Actualizar plan
    </span>
  )
}

// ── Task card component ─────────────────────────────────────────────────────

function TaskCard({ task, isDone }: { task: RoadmapTask; isDone: boolean }) {
  const config = TIER_CONFIG[task.tier]
  const Icon = config.icon

  return (
    <div className={`rounded-lg border p-3 transition-all ${
      isDone
        ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60'
        : `${config.bg} ${config.border}`
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center ${
          isDone ? 'bg-gray-100 dark:bg-gray-800' : config.iconBg
        }`}>
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Icon className={`h-4 w-4 ${config.color}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-semibold leading-snug ${
            isDone ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}>
            {task.accion}
          </p>
          {task.detalle && (
            <p className={`text-[11px] mt-0.5 leading-relaxed ${
              isDone ? 'text-muted-foreground/60' : 'text-muted-foreground'
            }`}>
              {task.detalle}
            </p>
          )}
        </div>

        {/* Tier badge */}
        {!isDone && (
          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            task.tier === 'quick' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            : task.tier === 'star' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
          }`}>
            {config.label}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Study plan component ────────────────────────────────────────────────────

function StudyPlan({ plan }: { plan: PlanItem[] }) {
  if (plan.length === 0) return null

  return (
    <div className="space-y-2">
      {plan.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
              {item.tema ?? '—'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-snug">
              {item.titulo}
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
              {item.mensaje}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function RoadmapCard({ activity }: RoadmapCardProps) {
  const [state, setState] = useState<CardState>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [planOpen, setPlanOpen] = useState(true)
  const [tasksOpen, setTasksOpen] = useState(true)
  const textRef = useRef<HTMLDivElement>(null)

  // Load saved roadmap
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: SavedRoadmap = JSON.parse(saved)
        setRoadmap(parsed.data)
        setStreamedText(parsed.rawText)
        setGeneratedAt(parsed.generatedAt)
        setState('done')
      }
    } catch {
      // ignore
    }
  }, [])

  // Auto-scroll streaming
  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [streamedText, state])

  // Completed tasks
  const completedSet = useMemo(() => {
    if (!roadmap) return new Set<number>()
    const set = new Set<number>()
    roadmap.tareas.forEach((task, idx) => {
      if (isTaskCompleted(task, activity, generatedAt)) set.add(idx)
    })
    return set
  }, [roadmap, activity, generatedAt])

  const totalTasks = roadmap?.tareas.length ?? 0
  const completedCount = completedSet.size
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0
  const allDone = totalTasks > 0 && completedCount >= totalTasks

  const handleGenerate = useCallback(async () => {
    if (state === 'loading' || state === 'streaming') return

    const prevPlan = streamedText || null
    const prevDate = generatedAt || null

    setState('loading')
    setStreamedText('')
    setRoadmap(null)
    setGeneratedAt(null)
    setPlanOpen(true)
    setTasksOpen(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55_000)

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
        if (res.status === 402) { setShowPaywall(true); setState('idle'); return }
        if (res.status === 503) {
          toast.error('IA no disponible', { description: 'Inténtalo en un minuto.' })
          setState('error'); return
        }
        toast.error('Error al generar plan', { description: data?.error ?? 'Inténtalo de nuevo.' })
        setState('error'); return
      }

      if (!res.body) { setState('error'); return }

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
        toast.error('Plan vacío', { description: 'Inténtalo de nuevo.' })
        setState('error'); return
      }

      // Parse JSON
      const parsed = parseRoadmapJSON(accumulated)
      if (!parsed || parsed.tareas.length === 0) {
        toast.error('Error al procesar el plan', { description: 'Formato inesperado. Inténtalo de nuevo.' })
        setState('error'); return
      }

      const nowIso = new Date().toISOString()
      setRoadmap(parsed)
      setGeneratedAt(nowIso)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: parsed,
        rawText: accumulated,
        generatedAt: nowIso,
      }))
      setState('done')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error('Timeout', { description: 'IA saturada. Inténtalo de nuevo.' })
      } else {
        toast.error('Error de conexión', { description: 'Comprueba tu conexión.' })
      }
      setState('error')
    } finally {
      clearTimeout(timeout)
    }
  }, [state, streamedText, generatedAt])

  // ── Idle / Error ────────────────────────────────────────────────────────
  if (state === 'idle' || state === 'error') {
    return (
      <div className="rounded-xl border-2 border-dashed border-blue-300/50 dark:border-blue-700/30 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-950/50 dark:to-blue-950/20 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Map className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[15px]">Tu plan de estudio semanal</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
              La IA analiza tu historial completo y crea un plan con victorias rápidas, retos y un desafío estrella para que avances de verdad.
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          size="sm"
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20"
        >
          {state === 'error' ? <RotateCcw className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {state === 'error' ? 'Reintentar' : 'Generar plan'}
          <span className="text-[10px] opacity-70 ml-1">1 análisis</span>
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

  // ── Loading ─────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-950/50 dark:to-blue-950/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Analizando tu preparación...</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Revisando notas, temas y tendencias</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
            style={{ animation: 'roadmap-shimmer 1.5s ease-in-out infinite' }}
          />
        </div>
        <style>{`@keyframes roadmap-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
      </div>
    )
  }

  // ── Streaming ───────────────────────────────────────────────────────────
  if (state === 'streaming') {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold">Generando plan...</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>
        <div ref={textRef} className="p-4 max-h-[300px] overflow-y-auto">
          <pre className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
            {streamedText}
            <span className="inline-block w-2 h-3 bg-blue-500/50 animate-pulse ml-0.5 rounded-sm" />
          </pre>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────
  if (!roadmap) return null

  const quickTasks = roadmap.tareas.filter(t => t.tier === 'quick')
  const challengeTasks = roadmap.tareas.filter(t => t.tier === 'challenge')
  const starTask = roadmap.tareas.find(t => t.tier === 'star')

  return (
    <div className="space-y-3">
      {/* ── Diagnóstico + Consejo ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tu nivel</p>
              {generatedAt && <PlanAge generatedAt={generatedAt} />}
            </div>
            <p className="text-[13px] leading-relaxed mt-1 text-foreground">{roadmap.diagnostico}</p>
          </div>
        </div>
        {roadmap.consejo && (
          <div className="px-4 py-2.5 bg-amber-50/50 dark:bg-amber-950/10 border-t border-amber-100 dark:border-amber-900/30 flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">{roadmap.consejo}</p>
          </div>
        )}
      </div>

      {/* ── Objetivos ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        <button
          onClick={() => setTasksOpen(t => !t)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Objetivos de la semana</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {quickTasks.length} rápidas
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {challengeTasks.length} retos
                </span>
                {starTask && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      1 desafío
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tabular-nums text-foreground">
              {completedCount}/{totalTasks}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${tasksOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                allDone ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
        </div>

        {tasksOpen && (
          <div className="px-4 pb-4 space-y-2">
            {/* Quick wins */}
            {quickTasks.length > 0 && (
              <div className="space-y-1.5">
                {quickTasks.map((task, i) => {
                  const globalIdx = roadmap.tareas.indexOf(task)
                  return <TaskCard key={`q-${i}`} task={task} isDone={completedSet.has(globalIdx)} />
                })}
              </div>
            )}

            {/* Challenges */}
            {challengeTasks.length > 0 && (
              <div className="space-y-1.5">
                {challengeTasks.map((task, i) => {
                  const globalIdx = roadmap.tareas.indexOf(task)
                  return <TaskCard key={`c-${i}`} task={task} isDone={completedSet.has(globalIdx)} />
                })}
              </div>
            )}

            {/* Star challenge */}
            {starTask && (
              <div className="mt-1">
                <TaskCard task={starTask} isDone={completedSet.has(roadmap.tareas.indexOf(starTask))} />
              </div>
            )}
          </div>
        )}

        {/* All done */}
        {allDone && (
          <div className="bg-green-50 dark:bg-green-950/20 border-t border-green-200 dark:border-green-800 px-4 py-3 flex items-center gap-3">
            <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs font-semibold text-green-800 dark:text-green-300 flex-1">
              Todos los objetivos completados. Genera un nuevo plan.
            </p>
            <Button
              onClick={handleGenerate}
              size="sm"
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Nuevo
            </Button>
          </div>
        )}
      </div>

      {/* ── Plan de estudio (guía pedagógica) ────────────────────────── */}
      {roadmap.plan.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
          <button
            onClick={() => setPlanOpen(p => !p)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">Plan de estudio</p>
                <p className="text-[10px] text-muted-foreground">Guía por temas: qué priorizar y cómo mejorar</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${planOpen ? 'rotate-180' : ''}`} />
          </button>

          {planOpen && (
            <div className="px-4 pb-4">
              <StudyPlan plan={roadmap.plan} />
            </div>
          )}
        </div>
      )}

      {/* Regenerate */}
      {!allDone && (
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            variant="ghost"
            size="sm"
            className="text-[11px] text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            Regenerar (1 análisis)
          </Button>
        </div>
      )}
    </div>
  )
}
