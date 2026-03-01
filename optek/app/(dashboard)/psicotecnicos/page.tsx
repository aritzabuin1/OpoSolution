'use client'

/**
 * app/(dashboard)/psicotecnicos/page.tsx — §1.3B.12
 *
 * Página de entrada para tests psicotécnicos.
 * Motor 100% determinista (coste API = 0€).
 *
 * Flujo:
 *   1. Usuario elige tipo de dificultad + número de preguntas
 *   2. POST /api/ai/generate-test { tipo: 'psicotecnico', numPreguntas, dificultad }
 *   3. Redirect a /tests/[id] (reutiliza la misma UI de test MCQ)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, ChevronRight, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Dificultad = 'facil' | 'media' | 'dificil'

interface DificultadOption {
  value: Dificultad
  label: string
  description: string
  color: string
  badge: string
}

const DIFICULTAD_OPTIONS: DificultadOption[] = [
  {
    value: 'facil',
    label: 'Fácil',
    description: 'Operaciones básicas, series simples',
    color: 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800',
    badge: 'bg-green-100 text-green-700',
  },
  {
    value: 'media',
    label: 'Media',
    description: 'Problemas intermedios, patrones mixtos',
    color: 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    value: 'dificil',
    label: 'Difícil',
    description: 'Nivel examen oficial, cálculo mental rápido',
    color: 'border-red-300 bg-red-50 hover:bg-red-100 text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
]

const NUM_PREGUNTAS_OPTIONS = [5, 10, 15, 20, 30] as const

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PsicotecnicosPage() {
  const router = useRouter()

  const [dificultad, setDificultad] = useState<Dificultad>('media')
  const [numPreguntas, setNumPreguntas] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerar() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'psicotecnico',
          numPreguntas,
          dificultad,
        }),
      })

      const data = (await res.json()) as { id?: string; error?: string }

      if (!res.ok || !data.id) {
        setError(data.error ?? 'Error al generar el test. Inténtalo de nuevo.')
        return
      }

      router.push(`/tests/${data.id}`)
    } catch {
      setError('Error de conexión. Comprueba tu internet e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      {/* Cabecera */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tests Psicotécnicos</h1>
            <p className="text-sm text-muted-foreground">
              Practica razonamiento numérico, series y lógica
            </p>
          </div>
        </div>

        {/* Badge gratuito */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Zap className="h-3.5 w-3.5" />
          <span>Generación instantánea · No consume créditos gratuitos</span>
        </div>
      </div>

      {/* Tipos de preguntas incluidas */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
            Contenido del test
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Razonamiento numérico (40%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Series numéricas (25%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Comprensión verbal (20%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              Organización y clasificación (15%)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector dificultad */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Nivel de dificultad</h2>
        <div className="grid gap-2">
          {DIFICULTAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDificultad(opt.value)}
              className={cn(
                'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                dificultad === opt.value
                  ? opt.color
                  : 'border-border bg-background hover:bg-muted'
              )}
            >
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {dificultad === opt.value && (
                <span
                  className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', opt.badge)}
                >
                  Seleccionado
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selector número de preguntas */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Número de preguntas</h2>
        <div className="flex flex-wrap gap-2">
          {NUM_PREGUNTAS_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setNumPreguntas(n)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                numPreguntas === n
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Tiempo estimado: ~{Math.ceil(numPreguntas * 1.5)} minutos
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CTA */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleGenerar}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando test…
          </>
        ) : (
          <>
            Comenzar test · {numPreguntas} preguntas
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
