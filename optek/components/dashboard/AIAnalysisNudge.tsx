'use client'

/**
 * components/dashboard/AIAnalysisNudge.tsx
 *
 * Dashboard card that nudges users to try AI analysis for the first time.
 * Shows when user has tests with errors but has never used an analysis.
 * Dismissible via localStorage.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Stethoscope, BookOpen, Lightbulb, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LS_DISMISS_KEY = 'oporuta_analysis_nudge_dismissed'
const LS_FIRST_ANALYSIS_KEY = 'oporuta_first_analysis_seen'

interface AIAnalysisNudgeProps {
  lastTestWithErrorsId: string | null
}

const steps = [
  { icon: Stethoscope, text: 'Diagnostica tus errores', color: 'text-blue-600' },
  { icon: BookOpen, text: 'Agrupa y explica el patrón', color: 'text-emerald-600' },
  { icon: Lightbulb, text: 'Te da un truco de memoria real', color: 'text-purple-600' },
  { icon: ArrowRight, text: 'Te dice qué hacer en la app', color: 'text-amber-600' },
]

export function AIAnalysisNudge({ lastTestWithErrorsId }: AIAnalysisNudgeProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      // Don't show if dismissed or if user has already used analysis
      const dismissed = localStorage.getItem(LS_DISMISS_KEY)
      const hasUsed = localStorage.getItem(LS_FIRST_ANALYSIS_KEY)
      setShow(!dismissed && !hasUsed)
    } catch { /* SSR / privacy mode */ }
  }, [])

  function dismiss() {
    setShow(false)
    try { localStorage.setItem(LS_DISMISS_KEY, '1') } catch { /* noop */ }
  }

  if (!show || !lastTestWithErrorsId) return null

  return (
    <div className="relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 p-5 space-y-4">
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
        aria-label="Ocultar"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">
          Tu Tutor IA está listo para ayudarte
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground pr-6">
        Después de cada test, tu Tutor IA diagnostica tus errores, encuentra patrones y te da trucos reales para no repetirlos:
      </p>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map(({ icon: Icon, text, color }) => (
          <div key={text} className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <span className="text-foreground">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button asChild size="sm" className="gap-2">
          <Link href={`/tests/${lastTestWithErrorsId}/resultados`}>
            <Sparkles className="h-3.5 w-3.5" />
            Ir a mi último test
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
          Ocultar
        </Button>
      </div>
    </div>
  )
}
