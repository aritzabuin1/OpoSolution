'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  cuerpoSlug: string
}

const LIKERT_OPTIONS = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
]

interface CATItem {
  id: string
  texto: string
}

export function PersonalidadAssessment({ cuerpoSlug }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentItem, setCurrentItem] = useState<CATItem | null>(null)
  const [progress, setProgress] = useState({ administered: 0, target: 80, percent: 0 })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize CAT session
  const initSession = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/personalidad/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init', cuerpo_slug: cuerpoSlug }),
      })
      if (!res.ok) throw new Error('Error iniciando sesión')
      const data = await res.json()
      setSessionId(data.sesion_id)
      setCurrentItem(data.next_item)
      setProgress(data.progress)
      setLoading(false)
    } catch (err) {
      setError('Error al iniciar el assessment. Inténtalo de nuevo.')
      setLoading(false)
    }
  }, [cuerpoSlug])

  useEffect(() => { initSession() }, [initSession])

  const handleResponse = async (value: number) => {
    if (!currentItem || !sessionId) return
    setLoading(true)
    try {
      const res = await fetch('/api/personalidad/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          sesion_id: sessionId,
          item_id: currentItem.id,
          value,
        }),
      })
      if (!res.ok) throw new Error('Error guardando respuesta')
      const data = await res.json()
      if (data.completed) {
        setCompleted(true)
      } else {
        setCurrentItem(data.next_item)
        setProgress(data.progress)
      }
      setLoading(false)
    } catch {
      setError('Error guardando respuesta. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-green-900">Assessment completado</h3>
        <p className="mt-2 text-sm text-green-700">
          Tu perfil Big Five ha sido calculado. Consulta la pestaña &quot;Mi Perfil&quot; para ver los resultados.
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Ver mi perfil
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={initSession} className="mt-3 text-sm font-medium text-red-600 hover:text-red-800">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Pregunta {progress.administered + 1} de {progress.target}</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Current item */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : currentItem ? (
        <div className="space-y-6">
          <p className="text-center text-lg font-medium text-gray-900">
            {currentItem.texto}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
            {LIKERT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleResponse(opt.value)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 active:bg-sky-100 sm:px-4"
              >
                <span className="block text-lg">{opt.value}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
