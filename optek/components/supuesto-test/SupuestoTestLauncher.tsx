'use client'

/**
 * components/supuesto-test/SupuestoTestLauncher.tsx — FASE 2.5c
 *
 * CTA button to start a supuesto práctico test.
 * Calls POST /api/ai/generate-supuesto-test → redirects to /tests/[id].
 * Shows animated loading overlay while AI generates the case.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Lock, Sparkles, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const MENSAJES_SUPUESTO = [
  'Construyendo el caso práctico...',
  'Redactando el escenario con situaciones reales...',
  'Generando preguntas vinculadas al caso...',
  'Verificando la legislación aplicable...',
  'Calibrando la dificultad del tribunal...',
  'Revisando coherencia del supuesto...',
  'Casi listo, últimos detalles...',
]

interface Props {
  isPremium: boolean
  hasDoneFree: boolean
  supuestosDone: number
  opoNombre: string
}

export function SupuestoTestLauncher({ isPremium, hasDoneFree, supuestosDone, opoNombre }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // Rotate messages every 3s while loading
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MENSAJES_SUPUESTO.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  // Elapsed time counter (updates every second)
  useEffect(() => {
    if (!loading) { setElapsed(0); return }
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [loading])

  async function handleStart() {
    setLoading(true)
    setMsgIdx(0)
    try {
      const res = await fetch('/api/ai/generate-supuesto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.status === 402) {
        toast.error('Hazte premium para practicar más supuestos', {
          action: { label: 'Ver planes', onClick: () => router.push('/precios') },
        })
        return
      }

      if (res.status === 429) {
        toast.error('Límite diario alcanzado. Vuelve mañana.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error generando el supuesto. Inténtalo de nuevo.')
        return
      }

      const { testId } = await res.json()
      router.push(`/tests/${testId}`)
    } catch {
      toast.error('Error de conexión. Comprueba tu internet.')
    } finally {
      setLoading(false)
    }
  }

  // Free user who already did the free supuesto
  if (hasDoneFree) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <Lock className="mx-auto h-8 w-8 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-800">Ya has practicado el supuesto gratuito</h3>
            <p className="text-sm text-amber-700 mt-1">
              Hazte premium para acceder a supuestos ilimitados generados por IA.
            </p>
          </div>
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <a href="/precios">Ver planes</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Full loading overlay while generating
  if (loading) {
    return (
      <Card className="border-indigo-200 bg-indigo-50/50 overflow-hidden">
        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Spinner + message */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <BookOpen className="absolute h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-indigo-800 animate-pulse min-h-[1.25rem]">
                {MENSAJES_SUPUESTO[msgIdx]}
              </p>
              <p className="text-xs text-indigo-600/70">
                {elapsed > 0 && `${elapsed}s`}
                {elapsed >= 10 && ' — los supuestos con IA tardan un poco, merece la pena'}
              </p>
            </div>
          </div>

          {/* Progress bar (indeterminate) */}
          <div className="w-full max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full w-1/3 rounded-full bg-indigo-500"
                style={{ animation: 'supuesto-progress 1.8s ease-in-out infinite' }}
              />
            </div>
          </div>
          <style>{`@keyframes supuesto-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>

          {/* Skeleton preview of what's coming */}
          <div className="w-full max-w-sm mx-auto space-y-4 opacity-60">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-indigo-200/50" />
              <Skeleton className="h-4 w-full bg-indigo-200/40" />
              <Skeleton className="h-4 w-5/6 bg-indigo-200/40" />
              <Skeleton className="h-4 w-4/5 bg-indigo-200/40" />
            </div>
            <div className="border-t border-indigo-200/50 pt-3 space-y-2">
              <Skeleton className="h-3 w-32 bg-indigo-200/50" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 rounded-md bg-indigo-200/30" />
                <Skeleton className="h-8 rounded-md bg-indigo-200/30" />
                <Skeleton className="h-8 rounded-md bg-indigo-200/30" />
                <Skeleton className="h-8 rounded-md bg-indigo-200/30" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleStart}
        disabled={loading}
        size="lg"
        className="w-full text-base"
      >
        <Play className="mr-2 h-5 w-5" />
        {isPremium ? 'Nuevo supuesto práctico' : 'Practicar supuesto gratuito'}
      </Button>

      {!isPremium && (
        <p className="text-xs text-center text-muted-foreground">
          1 supuesto gratuito (examen oficial INAP 2024). Premium: ilimitados.
        </p>
      )}

      {isPremium && supuestosDone > 0 && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" />
          {supuestosDone} supuesto{supuestosDone !== 1 ? 's' : ''} practicado{supuestosDone !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
