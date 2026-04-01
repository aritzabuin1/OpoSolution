'use client'

/**
 * components/simulacros/SimulacroMixtoCard.tsx
 *
 * Single "Iniciar Simulacro" card. No toggles — always generates the COMPLETE exam
 * with all sections from scoring_config (conocimientos + psicotécnicos + ortografía + etc).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, BookOpen, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { useIsPremium } from '@/lib/hooks/useIsPremium'

interface Props {
  totalPreguntas: number
  numConvocatorias: number
  penalizacionDesc?: string
}

export function SimulacroMixtoCard({ totalPreguntas, numConvocatorias, penalizacionDesc }: Props) {
  const router = useRouter()
  const isPremium = useIsPremium()
  const [isStarting, setIsStarting] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  async function handleStart() {
    setIsStarting(true)
    try {
      const res = await fetch('/api/ai/generate-simulacro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: 'mixto' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 402) {
          setShowPaywall(true)
          return
        }
        toast.error('Error', { description: data?.error ?? 'No se pudo generar el simulacro.' })
        return
      }

      const data = await res.json()
      router.push(`/tests/${data.id}`)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Simulacro Completo</h3>
                <Badge className="bg-primary/10 text-primary text-[10px]">Examen real</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {numConvocatorias > 0
                  ? `Preguntas de ${numConvocatorias} convocatorias oficiales`
                  : 'Preguntas del banco de la plataforma'
                }
                {totalPreguntas > 0 && (
                  <span className="inline-flex items-center gap-0.5 ml-1 font-medium text-green-700">
                    <BookOpen className="h-3 w-3" />
                    {totalPreguntas} disponibles
                  </span>
                )}
              </p>
              {penalizacionDesc && (
                <p className="mt-1 text-[10px] text-muted-foreground">{penalizacionDesc}</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={isStarting || totalPreguntas === 0}
            className="w-full gap-2"
          >
            {isStarting ? (
              <>Generando simulacro...</>
            ) : isPremium === false ? (
              <><Lock className="h-4 w-4" /> Simulacro gratuito (1 disponible)</>
            ) : (
              <><Play className="h-4 w-4" /> Iniciar Simulacro</>
            )}
          </Button>
        </CardContent>
      </Card>

      {showPaywall && (
        <PaywallGate
          open={showPaywall}
          code="PAYWALL_SIMULACROS"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  )
}

// Re-export the interface for backward compat
export type SimulacroMixtoCardProps = Props
