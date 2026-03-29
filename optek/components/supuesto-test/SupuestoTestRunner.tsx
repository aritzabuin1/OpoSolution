'use client'

/**
 * components/supuesto-test/SupuestoTestRunner.tsx — FASE 2.5c
 *
 * Wraps TestRunner with the supuesto caso display.
 *
 * Two modes:
 *   1. Standalone supuesto test: caso visible from start (collapsible on mobile)
 *   2. Simulacro completo: caso hidden during Part 1 (cuestionario),
 *      revealed when user reaches Part 2 (supuesto questions)
 *
 * Desktop: split view — caso sticky left, preguntas right
 * Mobile: collapsible drawer with FAB "Ver caso"
 */

import { useState, useCallback } from 'react'
import { TestRunner } from '@/components/tests/TestRunner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { Pregunta } from '@/types/ai'

interface SupuestoTestRunnerProps {
  testId: string
  preguntas: Pregunta[]
  caso: {
    titulo?: string
    escenario?: string
    bloques_cubiertos?: string[]
  }
  temaTitulo: string
  tiempoLimiteSegundos?: number
  /**
   * For simulacro completo: number of cuestionario questions before the supuesto starts.
   * When set, the caso panel is hidden during Part 1 and revealed at Part 2.
   * When undefined, the caso is visible from the start (standalone supuesto test).
   */
  preguntasCuestionario?: number
  /** Index where ofimática (Part 3) starts. Only set for 3-part exams (Tramitación). */
  ofimaticaStart?: number
}

export function SupuestoTestRunner({
  testId,
  preguntas,
  caso,
  temaTitulo,
  tiempoLimiteSegundos,
  preguntasCuestionario,
  ofimaticaStart,
}: SupuestoTestRunnerProps) {
  const isSimulacroCompleto = preguntasCuestionario !== undefined
  const has3Parts = ofimaticaStart !== undefined && ofimaticaStart > 0
  // For standalone supuesto: start collapsed on mobile. For simulacro: start hidden.
  const [casoExpanded, setCasoExpanded] = useState(false)
  // Track current question to know when to reveal caso in simulacro mode
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const isInSupuestoPart = isSimulacroCompleto
    ? has3Parts
      ? currentQuestion >= preguntasCuestionario! && currentQuestion < ofimaticaStart
      : currentQuestion >= preguntasCuestionario!
    : true // standalone: always in supuesto part

  const isInOfimaticaPart = has3Parts && currentQuestion >= ofimaticaStart

  // Show caso only during supuesto part (Part 2), not during cuestionario (Part 1) or ofimática (Part 3)
  const showCaso = isInSupuestoPart

  const onQuestionChange = useCallback((idx: number) => {
    setCurrentQuestion(idx)
  }, [])

  return (
    <>
      {/* ── Desktop: split layout ──────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 lg:-mx-[calc((100vw-42rem)/2+5rem)] lg:max-w-none lg:px-8">
        {/* Caso sticky panel — hidden during Part 1 of simulacro */}
        <div className="sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
          {showCaso ? (
            <CasoPanel caso={caso} />
          ) : isInOfimaticaPart ? (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-6 pb-6 text-center space-y-2">
                <FileText className="h-8 w-8 text-blue-400 mx-auto" />
                <p className="text-sm font-medium text-blue-700">Parte 3 — Ofimática</p>
                <p className="text-xs text-blue-600/70">
                  {preguntas.length - ofimaticaStart!} preguntas de informática y ofimática
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-muted bg-muted/30">
              <CardContent className="pt-6 pb-6 text-center space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">Parte 1 — Cuestionario</p>
                <p className="text-xs text-muted-foreground/70">
                  El caso práctico aparecerá en la Parte 2 (pregunta {preguntasCuestionario! + 1})
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preguntas */}
        <div>
          <TestRunner
            testId={testId}
            preguntas={preguntas}
            temaTitulo={temaTitulo}
            tiempoLimiteSegundos={tiempoLimiteSegundos}
            onQuestionChange={onQuestionChange}
            partDivider={isSimulacroCompleto ? preguntasCuestionario : undefined}
            extraDividers={has3Parts ? [{ index: ofimaticaStart!, label: 'Parte 3 — Ofimática' }] : undefined}
          />
        </div>
      </div>

      {/* ── Mobile: collapsible caso + preguntas below ─────────────────────── */}
      <div className="lg:hidden space-y-4">
        {/* Part indicator for simulacro */}
        {isSimulacroCompleto && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={!isInSupuestoPart && !isInOfimaticaPart ? 'default' : 'outline'} className="text-xs">
              Parte 1: Cuestionario ({preguntasCuestionario} preg.)
            </Badge>
            <Badge variant={isInSupuestoPart ? 'default' : 'outline'} className="text-xs">
              Parte 2: Supuesto ({(has3Parts ? ofimaticaStart! : preguntas.length) - preguntasCuestionario!} preg.)
            </Badge>
            {has3Parts && (
              <Badge variant={isInOfimaticaPart ? 'default' : 'outline'} className="text-xs">
                Parte 3: Ofimática ({preguntas.length - ofimaticaStart!} preg.)
              </Badge>
            )}
          </div>
        )}

        {/* Collapsible caso card — only show when in supuesto part */}
        {showCaso && (
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardHeader
              className="pb-2 pt-3 px-4 cursor-pointer flex flex-row items-center justify-between"
              onClick={() => setCasoExpanded(!casoExpanded)}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">
                  {caso.titulo ?? 'Caso práctico'}
                </span>
              </div>
              {casoExpanded
                ? <ChevronUp className="h-4 w-4 text-indigo-600" />
                : <ChevronDown className="h-4 w-4 text-indigo-600" />}
            </CardHeader>
            {casoExpanded ? (
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {caso.escenario}
                </p>
              </CardContent>
            ) : (
              <CardContent className="px-4 pb-3 pt-0">
                <p className="text-xs text-indigo-600">
                  {isSimulacroCompleto ? 'Parte 2 — Pulsa para leer el caso' : 'Pulsa para leer el caso antes de responder'}
                </p>
              </CardContent>
            )}
          </Card>
        )}

        {/* FAB to expand caso (visible when collapsed and in supuesto part) */}
        {showCaso && !casoExpanded && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg border-indigo-300 bg-white"
            onClick={() => {
              setCasoExpanded(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <FileText className="h-4 w-4 mr-1 text-indigo-600" />
            Ver caso
          </Button>
        )}

        {/* Preguntas */}
        <TestRunner
          testId={testId}
          preguntas={preguntas}
          temaTitulo={temaTitulo}
          tiempoLimiteSegundos={tiempoLimiteSegundos}
          onQuestionChange={onQuestionChange}
          partDivider={isSimulacroCompleto ? preguntasCuestionario : undefined}
        />
      </div>
    </>
  )
}

// ─── Caso Panel (desktop) ────────────────────────────────────────────────────

function CasoPanel({ caso }: { caso: SupuestoTestRunnerProps['caso'] }) {
  return (
    <Card className="border-indigo-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-indigo-800">
            {caso.titulo ?? 'Caso práctico'}
          </h2>
        </div>
        {caso.bloques_cubiertos && caso.bloques_cubiertos.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Bloques: {caso.bloques_cubiertos.join(', ')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {caso.escenario}
        </p>
      </CardContent>
    </Card>
  )
}
