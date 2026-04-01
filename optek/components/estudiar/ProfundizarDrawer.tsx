'use client'

/**
 * components/estudiar/ProfundizarDrawer.tsx
 *
 * Drawer lateral para profundizar en un artículo concreto.
 * Usa el hook useAIAnalysis para streaming.
 */

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { useAIAnalysis } from '@/lib/hooks/useAIAnalysis'

interface Props {
  ley: string
  defaultArticulo: string
  onClose: () => void
}

export function ProfundizarDrawer({ ley, defaultArticulo, onClose }: Props) {
  const [articuloNumero, setArticuloNumero] = useState(defaultArticulo)
  const [pregunta, setPregunta] = useState('')
  const { state, text, trigger, textRef } = useAIAnalysis('/api/estudiar/profundizar/stream')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!articuloNumero.trim() || !pregunta.trim()) return
    trigger({ ley, articuloNumero: articuloNumero.trim(), pregunta: pregunta.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-background border-l shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Profundizar</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Número de artículo
            </label>
            <input
              type="text"
              value={articuloNumero}
              onChange={(e) => setArticuloNumero(e.target.value)}
              placeholder="Ej: 14, 53, 103"
              className="w-full rounded-md border px-3 py-1.5 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Tu pregunta
            </label>
            <textarea
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="¿Qué quieres entender de este artículo?"
              rows={2}
              className="w-full rounded-md border px-3 py-1.5 text-sm bg-background resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={state === 'loading' || state === 'streaming' || !articuloNumero.trim() || !pregunta.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {state === 'loading' || state === 'streaming' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {state === 'loading' ? 'Conectando...' : state === 'streaming' ? 'Generando...' : 'Preguntar (1 crédito IA)'}
          </button>
        </form>

        {/* Streaming response */}
        <div ref={textRef} className="flex-1 overflow-y-auto px-4 py-3">
          {text ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {text}
            </div>
          ) : state === 'idle' ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Escribe tu pregunta y el número de artículo para obtener una explicación detallada.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
