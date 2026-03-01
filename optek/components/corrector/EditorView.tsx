'use client'

/**
 * components/corrector/EditorView.tsx — §1.12.1 + §1.12.2 + §1.12.3
 *
 * Editor para escribir un desarrollo y solicitar corrección IA.
 *
 * - Textarea grande (min 400px) con contador de caracteres
 * - Selector de tema (dropdown con los 28 temas)
 * - Botón "Corregir mi desarrollo" con:
 *     - useState(isCorrecting) para deshabilitar re-renders
 *     - useRef(isCorrectingRef) para bloqueo síncrono
 * - Maneja respuestas:
 *     - 200 → muestra FeedbackView
 *     - 402 → muestra modal paywall con opciones de compra
 *     - 409 → toast "Corrección ya en proceso"
 *     - 5xx → toast de error
 */

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FeedbackView } from '@/components/corrector/FeedbackView'
import { LoadingState } from '@/components/shared/LoadingState'
import { PaywallGate } from '@/components/shared/PaywallGate'
import type { CorreccionDesarrolloResult } from '@/lib/ai/correct-desarrollo'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Tema {
  id: string
  numero: number
  titulo: string
}

interface EditorViewProps {
  temas: Tema[]
  freeCorrectionsUsed: number
  hasPaidAccess: boolean
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function EditorView({ temas, freeCorrectionsUsed, hasPaidAccess }: EditorViewProps) {
  const [texto, setTexto] = useState('')
  const [temaId, setTemaId] = useState(temas[0]?.id ?? '')
  const [isCorrecting, setIsCorrecting] = useState(false)
  const [resultado, setResultado] = useState<CorreccionDesarrolloResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const isCorrectingRef = useRef(false)

  const MIN_CHARS = 50
  const MAX_CHARS = 5000
  const textoLength = texto.length
  const isTextoValido = textoLength >= MIN_CHARS && textoLength <= MAX_CHARS

  const freeCorrectionsRemaining = Math.max(0, 2 - freeCorrectionsUsed)
  const freeLimitReached = !hasPaidAccess && freeCorrectionsUsed >= 2

  async function handleCorregir() {
    if (isCorrectingRef.current) return
    if (!isTextoValido || !temaId) return

    isCorrectingRef.current = true
    setIsCorrecting(true)
    setResultado(null)
    setShowPaywall(false)

    try {
      const res = await fetch('/api/ai/correct-desarrollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, temaId }),
      })

      if (res.ok) {
        const data: CorreccionDesarrolloResult = await res.json()
        setResultado(data)
        return
      }

      const data = await res.json().catch(() => ({}))

      if (res.status === 402) {
        setShowPaywall(true)
        return
      }
      if (res.status === 409) {
        toast.warning('Corrección ya en proceso', {
          description: 'Espera unos segundos antes de intentarlo de nuevo.',
        })
        return
      }
      if (res.status === 503) {
        toast.error('Servicio no disponible', {
          description: 'El servicio de IA está ocupado. Inténtalo en un minuto.',
        })
        return
      }
      toast.error('Error al corregir', {
        description: data?.error ?? 'Por favor inténtalo de nuevo.',
      })
    } catch {
      toast.error('Error de conexión')
    } finally {
      isCorrectingRef.current = false
      setIsCorrecting(false)
    }
  }

  // ── Resultado ─────────────────────────────────────────────────────────────
  if (resultado) {
    return (
      <div className="space-y-6">
        <FeedbackView resultado={resultado} />
        <Button
          variant="outline"
          onClick={() => {
            setResultado(null)
            setTexto('')
          }}
        >
          Nuevo desarrollo
        </Button>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isCorrecting) {
    return (
      <div className="flex justify-center py-12">
        <LoadingState tema={temas.find((t) => t.id === temaId)?.titulo} mode="corrector" />
      </div>
    )
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Banner correcciones gratuitas */}
      {!hasPaidAccess && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-blue-900">
              Correcciones gratuitas restantes
            </p>
            <span className="text-sm font-bold text-blue-700">
              {freeCorrectionsRemaining} de 2
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-blue-200">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${(freeCorrectionsUsed / 2) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Selector de tema */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="tema-select">
          Tema del desarrollo
        </label>
        <select
          id="tema-select"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={temaId}
          onChange={(e) => setTemaId(e.target.value)}
        >
          {temas.map((t) => (
            <option key={t.id} value={t.id}>
              Tema {t.numero}. {t.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="desarrollo-text">
            Tu desarrollo
          </label>
          <span
            className={`text-xs ${
              textoLength > MAX_CHARS
                ? 'text-red-500'
                : textoLength < MIN_CHARS
                  ? 'text-muted-foreground'
                  : 'text-green-600'
            }`}
          >
            {textoLength} / {MAX_CHARS}
          </span>
        </div>
        <textarea
          id="desarrollo-text"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          style={{ minHeight: '400px' }}
          placeholder="Escribe aquí tu desarrollo del tema seleccionado. Mínimo 50 caracteres. Incluye artículos legales, estructura y argumentación para recibir feedback completo..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={MAX_CHARS + 100} // un poco más para mostrar el error
        />
        {textoLength < MIN_CHARS && textoLength > 0 && (
          <p className="text-xs text-amber-600">
            Necesitas al menos {MIN_CHARS - textoLength} caracteres más
          </p>
        )}
      </div>

      {/* Botón corregir */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleCorregir}
        disabled={isCorrecting || !isTextoValido || !temaId || freeLimitReached}
      >
        {freeLimitReached ? 'Correcciones agotadas — Ver planes' : 'Corregir mi desarrollo'}
      </Button>

      {freeLimitReached && (
        <p className="text-center text-sm text-muted-foreground">
          Has usado tus 2 correcciones gratuitas.{' '}
          <a href="/cuenta" className="text-primary underline">
            Ver planes de pago
          </a>
        </p>
      )}

      {/* Paywall Dialog — se muestra sobre el editor sin reemplazarlo */}
      <PaywallGate
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        code="PAYWALL_CORRECTIONS"
      />
    </div>
  )
}
