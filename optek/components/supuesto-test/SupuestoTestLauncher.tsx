'use client'

/**
 * components/supuesto-test/SupuestoTestLauncher.tsx — FASE 2.5c
 *
 * CTA button to start a supuesto práctico test.
 * Calls POST /api/ai/generate-supuesto-test → redirects to /tests/[id].
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Play, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  isPremium: boolean
  hasDoneFree: boolean
  supuestosDone: number
  opoNombre: string
}

export function SupuestoTestLauncher({ isPremium, hasDoneFree, supuestosDone, opoNombre }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
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

  return (
    <div className="space-y-3">
      <Button
        onClick={handleStart}
        disabled={loading}
        size="lg"
        className="w-full text-base"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparando supuesto...
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            {isPremium ? 'Nuevo supuesto práctico' : 'Practicar supuesto gratuito'}
          </>
        )}
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
