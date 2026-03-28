'use client'

/**
 * components/supuesto-test/SupuestoTestLauncher.tsx
 *
 * CTA to start/generate supuesto práctico tests.
 * - Unseen supuestos: serve instantly from bank (€0)
 * - No unseen: pay 1 crédito IA → generate or serve from bank
 * - Repeat: re-do any supuesto already seen (free)
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Lock, Sparkles, BookOpen, Zap } from 'lucide-react'
import { toast } from 'sonner'

const MENSAJES_LOADING = [
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
  creditsBalance?: number
  bankStats?: { totalBank: number; seen: number; unseen: number }
}

export function SupuestoTestLauncher({ isPremium, hasDoneFree, supuestosDone, opoNombre, creditsBalance, bankStats }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false) // true when AI generation (slow)

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MENSAJES_LOADING.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (!loading) { setElapsed(0); return }
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [loading])

  async function handleNew() {
    setLoading(true)
    setMsgIdx(0)
    setIsGenerating(false)
    try {
      const res = await fetch('/api/ai/generate-supuesto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'new' }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        if (data.code === 'PAYWALL_SUPUESTO_CREDITO') {
          // No credits — offer recharge
          toast.error('Necesitas 1 crédito IA para desbloquear un supuesto nuevo.', {
            action: { label: 'Recargar créditos', onClick: () => router.push('/precios') },
            duration: 8000,
          })
        } else {
          toast.error(data.error ?? 'Hazte premium para más supuestos.', {
            action: { label: 'Ver planes', onClick: () => router.push('/precios') },
          })
        }
        return
      }

      if (res.status === 429) {
        toast.error('Límite diario alcanzado. Vuelve mañana.')
        return
      }

      if (!res.ok) {
        toast.error(data.error ?? 'Error generando el supuesto.')
        return
      }

      router.push(`/tests/${data.testId}`)
    } catch {
      toast.error('Error de conexión.')
    } finally {
      setLoading(false)
      setIsGenerating(false)
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
              Hazte premium para acceder a supuestos ilimitados.
            </p>
          </div>
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <a href="/precios">Ver planes</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading overlay
  if (loading) {
    return (
      <Card className="border-indigo-200 bg-indigo-50/50 overflow-hidden">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <BookOpen className="absolute h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-indigo-800 animate-pulse min-h-[1.25rem]">
                {isGenerating ? MENSAJES_LOADING[msgIdx] : 'Preparando supuesto...'}
              </p>
              <p className="text-xs text-indigo-600/70">
                {elapsed > 0 && `${elapsed}s`}
                {isGenerating && elapsed >= 10 && ' — generando con IA, puede tardar hasta 30s'}
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full w-1/3 rounded-full bg-indigo-500"
                style={{ animation: 'supuesto-progress 1.8s ease-in-out infinite' }}
              />
            </div>
          </div>
          <style>{`@keyframes supuesto-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>

          <div className="w-full max-w-sm mx-auto space-y-4 opacity-60">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-indigo-200/50" />
              <Skeleton className="h-4 w-full bg-indigo-200/40" />
              <Skeleton className="h-4 w-5/6 bg-indigo-200/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unseen = bankStats?.unseen ?? 0
  const totalBank = bankStats?.totalBank ?? 0
  const seen = bankStats?.seen ?? 0
  const credits = creditsBalance ?? 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      {isPremium && totalBank > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{seen} de {totalBank} completados</span>
          {unseen > 0 && (
            <span className="text-green-600 font-medium">{unseen} sin hacer</span>
          )}
        </div>
      )}

      {/* Main CTA */}
      <Button
        onClick={handleNew}
        disabled={loading}
        size="lg"
        className="w-full text-base"
      >
        {unseen > 0 ? (
          <>
            <Play className="mr-2 h-5 w-5" />
            Siguiente supuesto
          </>
        ) : isPremium ? (
          <>
            <Zap className="mr-2 h-5 w-5" />
            Nuevo supuesto — 1 crédito IA
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Practicar supuesto gratuito
          </>
        )}
      </Button>

      {/* Credit info when no unseen */}
      {isPremium && unseen === 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {credits > 0
            ? `${credits} créditos disponibles · La generación tarda ~30 segundos`
            : 'Sin créditos · Recarga 10 por 9,99€'
          }
        </p>
      )}

      {/* Free user hint */}
      {!isPremium && (
        <p className="text-xs text-center text-muted-foreground">
          1 supuesto gratuito (examen oficial). Premium: ilimitados.
        </p>
      )}

      {/* Premium stats */}
      {isPremium && supuestosDone > 0 && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" />
          {supuestosDone} supuesto{supuestosDone !== 1 ? 's' : ''} practicado{supuestosDone !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
