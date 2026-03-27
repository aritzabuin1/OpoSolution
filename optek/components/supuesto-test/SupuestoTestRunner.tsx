'use client'

/**
 * components/supuesto-test/SupuestoTestRunner.tsx — FASE 2.5c
 *
 * Wraps TestRunner with the supuesto caso display:
 *   - Desktop: split view — caso sticky left, preguntas right
 *   - Mobile: collapsible drawer with FAB "Ver caso"
 */

import { useState } from 'react'
import { TestRunner } from '@/components/tests/TestRunner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
}

export function SupuestoTestRunner({
  testId,
  preguntas,
  caso,
  temaTitulo,
  tiempoLimiteSegundos,
}: SupuestoTestRunnerProps) {
  // Mobile: start collapsed so questions + buttons are visible immediately
  const [casoExpanded, setCasoExpanded] = useState(false)

  return (
    <>
      {/* ── Desktop: split layout ──────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_1fr] lg:gap-6 lg:-mx-[calc((100vw-42rem)/2+5rem)] lg:max-w-none lg:px-8">
        {/* Caso sticky panel */}
        <div className="sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
          <CasoPanel caso={caso} />
        </div>

        {/* Preguntas */}
        <div>
          <TestRunner
            testId={testId}
            preguntas={preguntas}
            temaTitulo={temaTitulo}
            tiempoLimiteSegundos={tiempoLimiteSegundos}
          />
        </div>
      </div>

      {/* ── Mobile: collapsible caso + preguntas below ─────────────────────── */}
      <div className="lg:hidden space-y-4">
        {/* Collapsible caso card */}
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
              <p className="text-xs text-indigo-600">Pulsa para leer el caso antes de responder</p>
            </CardContent>
          )}
        </Card>

        {/* FAB to expand caso (visible when collapsed) */}
        {!casoExpanded && (
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
