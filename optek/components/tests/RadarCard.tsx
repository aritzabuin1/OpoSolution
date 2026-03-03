'use client'

/**
 * components/tests/RadarCard.tsx — §2.14.4
 *
 * Card destacada para generar un test con los artículos más frecuentes del INAP.
 * Se muestra en /tests?modo=radar cuando el usuario llega desde /radar.
 *
 * Llama a /api/ai/generate-test con tipo='radar' (sin temaId).
 * Solo disponible para usuarios de pago (gate Premium en la API y aquí).
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Loader2, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TestGenerado } from '@/types/ai'
import { trackStartTrialOnce } from '@/lib/analytics/pixel'

interface RadarCardProps {
  hasPaidAccess: boolean
}

export function RadarCard({ hasPaidAccess }: RadarCardProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generatingRef = useRef(false)

  async function handleGenerar() {
    if (generatingRef.current) return
    generatingRef.current = true
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'radar',
          numPreguntas: 10,
          dificultad: 'media',
        }),
      })

      if (res.ok) {
        const test: TestGenerado = await res.json()
        trackStartTrialOnce() // §1.20.4
        router.push(`/tests/${test.id}`)
        return
      }

      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al generar el test del Radar.')
    } finally {
      if (!generatingRef.current) return
      generatingRef.current = false
      setIsGenerating(false)
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
      <CardContent className="flex items-start justify-between gap-4 pt-5">
        <div className="flex items-start gap-3 min-w-0">
          <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Test Radar del Tribunal
              </span>
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">Premium</Badge>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              10 preguntas generadas a partir de los artículos que más han caído en exámenes INAP reales.
              Practica exactamente lo que el tribunal pregunta.
            </p>
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>

        {hasPaidAccess ? (
          <Button
            size="sm"
            onClick={handleGenerar}
            disabled={isGenerating}
            className="shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Generando…
              </>
            ) : (
              'Generar test'
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 shrink-0">
            <Lock className="w-3.5 h-3.5" />
            Solo Premium
          </div>
        )}
      </CardContent>
    </Card>
  )
}
