'use client'

/**
 * components/shared/LoadingState.tsx — §1.9.5
 *
 * Estado de carga animado con skeleton y mensaje motivador rotativo.
 * Se usa mientras Claude genera el test.
 */

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  tema?: string
  mode?: 'test' | 'corrector'
}

const MENSAJES_TEST = [
  'Preparando tu test personalizado...',
  'Verificando las citas legales...',
  'Consultando la legislación actualizada...',
  'Generando preguntas con IA...',
  'Comprobando la exactitud jurídica...',
  'Ajustando la dificultad seleccionada...',
  'Casi listo...',
]

const MENSAJES_CORRECTOR = [
  'Analizando tu desarrollo...',
  'Verificando las citas legales...',
  'Evaluando la estructura y argumentación...',
  'Comprobando la exactitud jurídica...',
  'Contrastando con la legislación indexada...',
  'Generando feedback detallado...',
  'Casi listo...',
]

export function LoadingState({ tema, mode = 'test' }: LoadingStateProps) {
  const MENSAJES = mode === 'corrector' ? MENSAJES_CORRECTOR : MENSAJES_TEST
  const [mensajeIdx, setMensajeIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMensajeIdx((i) => (i + 1) % MENSAJES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [MENSAJES.length])

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Spinner animado */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span className="absolute text-2xl">⚖️</span>
      </div>

      {/* Mensaje rotativo */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground animate-pulse">
          {MENSAJES[mensajeIdx]}
        </p>
        {tema && (
          <p className="text-xs text-muted-foreground">Tema: {tema}</p>
        )}
      </div>

      {/* Skeleton que simula preguntas cargando */}
      <div className="w-full space-y-3 max-w-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
              <Skeleton className="h-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
