'use client'

/**
 * lib/hooks/useAIAnalysis.ts
 *
 * Hook reutilizable para features de análisis IA con streaming.
 * Maneja: fetch → stream → paywall (402) → error handling.
 * Usado por: CazaTrampasCard, FlashcardReview, InformeSimulacroPanel.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

type AnalysisState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export function useAIAnalysis(endpoint: string) {
  const [state, setState] = useState<AnalysisState>('idle')
  const [text, setText] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as text streams
  useEffect(() => {
    if (state === 'streaming' && textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight
    }
  }, [text, state])

  const abortRef = useRef<AbortController | null>(null)

  const trigger = useCallback(async (body: Record<string, unknown>) => {
    if (state === 'loading' || state === 'streaming') return
    setState('loading')
    setText('')

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // 90s timeout — matches Vercel maxDuration=60 + network margin
    const timeoutId = setTimeout(() => controller.abort(), 90_000)

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        if (res.status === 402) {
          setShowPaywall(true)
          setState('idle')
          return
        }

        if (res.status === 503) {
          toast.error('Servicio no disponible', {
            description: 'El servicio de IA está ocupado. Inténtalo en un minuto.',
          })
          setState('error')
          return
        }

        toast.error('Error al generar análisis', {
          description: data?.error ?? 'Por favor inténtalo de nuevo.',
        })
        setState('error')
        return
      }

      if (!res.body) {
        setState('error')
        return
      }

      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setText(accumulated)
      }

      setState('done')
    } catch (err) {
      // Don't show error toast if user navigated away (intentional abort)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState('idle')
        return
      }
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
      })
      setState('error')
    } finally {
      clearTimeout(timeoutId)
    }
  }, [endpoint, state])

  return { state, text, trigger, showPaywall, setShowPaywall, textRef }
}
