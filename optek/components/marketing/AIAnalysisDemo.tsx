'use client'

/**
 * components/marketing/AIAnalysisDemo.tsx
 *
 * Split before/after demo showing AI analysis value.
 * Left column: "Otras apps" — just shows wrong/correct (grey, muted).
 * Right column: "OpoRuta" — 4 Socratic steps cascading in.
 *
 * Animation: IntersectionObserver triggers cascade on scroll.
 * No API calls — purely hardcoded content from demo-analysis.ts.
 *
 * Variants:
 *   - landing: 2 columns (stack on mobile), IntersectionObserver trigger
 *   - modal: single column, starts immediately
 */

import { useState, useEffect, useRef } from 'react'
import { XCircle, CheckCircle2, Sparkles, MessageCircle, HelpCircle, BookOpen, Lightbulb } from 'lucide-react'
import { DEMO_QUESTION, DEMO_ANALYSIS_STEPS } from '@/lib/constants/demo-analysis'
import type { DemoAnalysisStep } from '@/lib/constants/demo-analysis'

interface AIAnalysisDemoProps {
  variant: 'landing' | 'modal'
}

const STEP_ICONS: Record<DemoAnalysisStep['type'], typeof MessageCircle> = {
  empatia: MessageCircle,
  pregunta: HelpCircle,
  revelacion: BookOpen,
  anclaje: Lightbulb,
}

const STEP_COLORS: Record<DemoAnalysisStep['type'], string> = {
  empatia: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  pregunta: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  revelacion: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  anclaje: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
}

const ICON_BG: Record<DemoAnalysisStep['type'], string> = {
  empatia: 'bg-blue-100 dark:bg-blue-900/40',
  pregunta: 'bg-amber-100 dark:bg-amber-900/40',
  revelacion: 'bg-emerald-100 dark:bg-emerald-900/40',
  anclaje: 'bg-purple-100 dark:bg-purple-900/40',
}

// ─── Question Card (shared between both columns) ────────────────────────────

function QuestionCard({ muted }: { muted?: boolean }) {
  const q = DEMO_QUESTION
  return (
    <div className="space-y-3">
      <p className={`text-sm font-medium leading-snug ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
        {q.enunciado}
      </p>
      <div className="space-y-1.5">
        {/* Wrong answer */}
        <div className="flex items-start gap-2 text-sm">
          <XCircle className={`h-4 w-4 shrink-0 mt-0.5 ${muted ? 'text-muted-foreground/60' : 'text-red-500'}`} />
          <span className={muted ? 'text-muted-foreground/60' : 'text-red-700 dark:text-red-400'}>
            Tu respuesta: <span className="font-medium">{q.opciones[q.respuestaUsuario]}</span>
          </span>
        </div>
        {/* Correct answer */}
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${muted ? 'text-muted-foreground/60' : 'text-green-500'}`} />
          <span className={muted ? 'text-muted-foreground/60' : 'text-green-700 dark:text-green-400'}>
            Correcta: <span className="font-medium">{q.opciones[q.correcta]}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AIAnalysisDemo({ variant }: AIAnalysisDemoProps) {
  const [isVisible, setIsVisible] = useState(variant === 'modal')
  const [visibleSteps, setVisibleSteps] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver — trigger animation when scrolled into view (landing only)
  useEffect(() => {
    if (variant === 'modal') return
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [variant])

  // Cascade steps once visible
  useEffect(() => {
    if (!isVisible) return
    // Small delay before starting cascade
    const baseDelay = variant === 'modal' ? 200 : 800
    const timers = DEMO_ANALYSIS_STEPS.map((_, i) =>
      setTimeout(() => setVisibleSteps(i + 1), baseDelay + i * 500)
    )
    return () => timers.forEach(clearTimeout)
  }, [isVisible, variant])

  const isLanding = variant === 'landing'

  return (
    <div ref={containerRef} className={`grid gap-4 ${isLanding ? 'md:grid-cols-2 md:gap-6' : ''}`}>
      {/* ── Left column: "Otras apps" ──────────────────────────────────────── */}
      {isLanding && (
        <div
          className={`rounded-xl border border-muted bg-muted/30 p-5 space-y-4 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Otras apps
            </span>
          </div>
          <QuestionCard muted />
          {/* Empty space — that's all other apps show */}
          <div className="pt-4 border-t border-muted">
            <p className="text-xs text-muted-foreground/50 italic text-center">
              Fin. Sin explicación.
            </p>
          </div>
        </div>
      )}

      {/* ── Right column: "OpoRuta" ────────────────────────────────────────── */}
      <div
        className={`rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
        style={{ transitionDelay: isLanding ? '300ms' : '0ms' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            OpoRuta — Análisis con IA
          </span>
        </div>

        {/* Show question in right column: always for modal, desktop-only for landing (mobile stacks so question is already visible above) */}
        <div className={isLanding ? 'hidden md:block' : ''}>
          <QuestionCard />
          <div className="border-t border-primary/10 mt-4" />
        </div>

        {/* Socratic steps with cascade */}
        <div className="space-y-3">
          {DEMO_ANALYSIS_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[step.type]
            const colors = STEP_COLORS[step.type]
            const iconBg = ICON_BG[step.type]
            const show = i < visibleSteps

            return (
              <div
                key={step.type}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-all duration-500 ${colors} ${
                  show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                    {step.label}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {step.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Connector line between steps */}
        {visibleSteps >= DEMO_ANALYSIS_STEPS.length && (
          <p className="text-[11px] text-center text-muted-foreground pt-1 transition-opacity duration-500">
            Todo esto en &lt;15 segundos, con streaming en tiempo real.
          </p>
        )}
      </div>
    </div>
  )
}
