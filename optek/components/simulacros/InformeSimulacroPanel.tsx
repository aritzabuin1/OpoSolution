'use client'

/**
 * components/simulacros/InformeSimulacroPanel.tsx
 *
 * Panel de informe personalizado IA para simulacros oficiales.
 * Consume 1 análisis detallado. Streaming de texto plano.
 * Complementa ExplicarErroresPanel (errores individuales) con
 * un análisis global: puntos débiles, patrones, plan de acción.
 */

import { useEffect } from 'react'
import { Sparkles, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { useAIAnalysis } from '@/lib/hooks/useAIAnalysis'
import { trackEvent } from '@/lib/analytics/track'

interface InformeSimulacroPanelProps {
  testId: string
}

export function InformeSimulacroPanel({ testId }: InformeSimulacroPanelProps) {
  const analysis = useAIAnalysis('/api/ai/informe-simulacro/stream')

  useEffect(() => { trackEvent('view:informe-simulacro-cta') }, [])

  if (analysis.state === 'idle' || analysis.state === 'error') {
    return (
      <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm">Informe personalizado del simulacro</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              La IA analiza tu rendimiento global: puntos fuertes, debilidades,
              patrones de error y un plan de acción para las próximas 2 semanas.
              Consume 1 análisis.
            </p>
          </div>
        </div>

        <Button
          onClick={() => { trackEvent('click:informe-simulacro-cta'); analysis.trigger({ testId }) }}
          variant="default"
          size="sm"
          className="w-full sm:w-auto"
        >
          <FileText className="h-4 w-4 mr-2" />
          {analysis.state === 'error' ? 'Reintentar' : 'Generar informe (1 análisis)'}
        </Button>

        <PaywallGate
          open={analysis.showPaywall}
          onClose={() => analysis.setShowPaywall(false)}
          code="PAYWALL_CORRECTIONS"
        />
      </div>
    )
  }

  if (analysis.state === 'loading') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
        <div>
          <p className="font-medium text-sm">Generando informe personalizado...</p>
          <p className="text-xs text-muted-foreground">Analizando tu rendimiento completo</p>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-semibold">
          Informe del simulacro
          {analysis.state === 'streaming' && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">escribiendo...</span>
          )}
        </h2>
      </div>

      <div
        ref={analysis.textRef}
        className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 max-h-[500px] overflow-y-auto"
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {analysis.text}
          {analysis.state === 'streaming' && (
            <span className="inline-block w-2 h-4 bg-blue-500/60 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>
    </section>
  )
}
