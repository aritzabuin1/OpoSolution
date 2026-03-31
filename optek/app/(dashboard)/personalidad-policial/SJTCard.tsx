'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'

interface Props {
  cuerpoSlug: string
  credits: number
}

interface Scenario {
  sesion_id: string
  escenario: string
  opciones: string[]
  dimension_focus: string
}

export function SJTCard({ cuerpoSlug, credits }: Props) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [userRanking, setUserRanking] = useState<number[]>([])
  const [result, setResult] = useState<{ concordancia: number; feedback: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateScenario = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setUserRanking([])
    try {
      const res = await fetch('/api/personalidad/sjt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', cuerpo_slug: cuerpoSlug }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error generando escenario')
      }
      const data = await res.json()
      setScenario(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const toggleRanking = (optionIndex: number) => {
    setUserRanking(prev => {
      if (prev.includes(optionIndex)) {
        return prev.filter(i => i !== optionIndex)
      }
      if (prev.length >= (scenario?.opciones.length ?? 5)) return prev
      return [...prev, optionIndex]
    })
  }

  const submitRanking = async () => {
    if (!scenario || userRanking.length !== scenario.opciones.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/personalidad/sjt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'score',
          sesion_id: scenario.sesion_id,
          user_ranking: userRanking,
        }),
      })
      if (!res.ok) throw new Error('Error evaluando respuesta')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Error al evaluar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Initial state
  if (!scenario) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Target className="mx-auto h-12 w-12 text-sky-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Juicio Situacional (SJT)</h3>
        <p className="mt-2 text-sm text-gray-500">
          Se te presentará un escenario policial real. Ordena las opciones de respuesta
          de mejor a peor según tu criterio profesional.
        </p>
        <p className="mt-1 text-xs text-gray-400">Consume 1 crédito por escenario</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={generateScenario}
          disabled={loading || credits < 1}
          className="mt-4 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Nuevo escenario'}
        </button>
      </div>
    )
  }

  // Result state
  if (result) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{result.concordancia}/100</p>
          <p className="text-sm text-gray-500">Concordancia con ranking ideal</p>
        </div>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">{result.feedback}</p>
        <div className="text-center">
          <button
            onClick={generateScenario}
            disabled={credits < 1}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Otro escenario
          </button>
        </div>
      </div>
    )
  }

  // Scenario active — ranking mode
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="rounded-lg bg-sky-50 p-4">
        <p className="text-sm font-medium text-sky-900">{scenario.escenario}</p>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Pulsa las opciones en orden de mejor a peor respuesta ({userRanking.length}/{scenario.opciones.length})
      </p>

      <div className="space-y-2">
        {scenario.opciones.map((opcion, idx) => {
          const rankPos = userRanking.indexOf(idx)
          const isSelected = rankPos !== -1

          return (
            <button
              key={idx}
              onClick={() => toggleRanking(idx)}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                isSelected
                  ? 'border-sky-400 bg-sky-50 text-sky-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isSelected ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isSelected ? rankPos + 1 : '·'}
                </span>
                {opcion}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={() => setUserRanking([])}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Reiniciar orden
        </button>
        <button
          onClick={submitRanking}
          disabled={loading || userRanking.length !== scenario.opciones.length}
          className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Evaluando...' : 'Evaluar mi respuesta'}
        </button>
      </div>
    </div>
  )
}
