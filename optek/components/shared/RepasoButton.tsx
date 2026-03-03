'use client'

/**
 * components/shared/RepasoButton.tsx — §repaso_errores
 *
 * Botón que genera un test de repaso con las preguntas que el usuario
 * ha fallado en sus tests anteriores. Llama a POST /api/ai/generate-repaso.
 *
 * Sin paywall — el repaso de errores es siempre gratuito.
 */

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RepasoButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const loadingRef = useRef(false)

  async function handleClick() {
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/generate-repaso', { method: 'POST' })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        router.push(`/tests/${data.id}`)
        return
      }

      if (res.status === 404) {
        toast.error('Repaso no disponible', {
          description: data?.error ?? 'Sigue practicando para desbloquear el repaso de errores.',
        })
        return
      }

      if (res.status === 429) {
        toast.error('Límite diario alcanzado', {
          description: data?.error ?? 'Has alcanzado el límite de repasos diarios.',
        })
        return
      }

      toast.error('Error al generar el repaso', {
        description: data?.error ?? 'Por favor inténtalo de nuevo.',
      })
    } catch {
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión e inténtalo de nuevo.',
      })
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Generando...' : 'Repasar mis errores'}
    </Button>
  )
}
