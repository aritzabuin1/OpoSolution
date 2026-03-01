'use client'

/**
 * app/(dashboard)/cazatrampas/page.tsx — §2.12.12
 *
 * Página del Modo Caza-Trampas.
 * El usuario selecciona el número de errores y genera un ejercicio.
 * La sesión activa se muestra mediante CazaTrampasCard.
 *
 * Client Component (estado de sesión activa + generación async).
 */

import { useState } from 'react'
import { Target, AlertTriangle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CazaTrampasCard } from '@/components/cazatrampas/CazaTrampasCard'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SesionActiva {
  id: string
  texto_trampa: string
  numErrores: number
  leyNombre: string
  articuloNumero: string
  tituloCap: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CazaTrampasPage() {
  const [numErrores, setNumErrores] = useState<1 | 2 | 3>(3)
  const [sesionActiva, setSesionActiva] = useState<SesionActiva | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerar() {
    if (isGenerating) return
    setIsGenerating(true)
    setSesionActiva(null)

    try {
      const res = await fetch('/api/cazatrampas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numErrores }),
      })

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        toast.error('Límite diario alcanzado', {
          description: data.error ?? 'Vuelve mañana para más ejercicios.',
        })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error('Error al generar', { description: data.error ?? 'Inténtalo de nuevo.' })
        return
      }

      const sesion = (await res.json()) as SesionActiva
      setSesionActiva(sesion)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Caza-Trampas
            <Badge variant="secondary" className="text-xs font-normal">Nuevo</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Detecta errores sutiles inyectados en artículos legales reales
          </p>
        </div>
        <Target className="h-7 w-7 text-primary/60 shrink-0 mt-1" />
      </div>

      {/* Cómo funciona */}
      {!sesionActiva && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            ¿Cómo funciona?
          </p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>1. Recibes un fragmento de artículo legal con errores inyectados por IA</p>
            <p>2. Localizas los errores: plazos incorrectos, porcentajes cambiados, verbos alterados</p>
            <p>3. Propones la corrección para cada error que encuentras</p>
            <p>4. La puntuación es 100% determinista — sin IA en la corrección</p>
          </div>
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">
              Los ejercicios son gratuitos. Se generan de artículos reales de la legislación del temario.
            </p>
          </div>
        </div>
      )}

      {/* Configurador */}
      {!sesionActiva && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Número de errores a detectar
            </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setNumErrores(n)}
                  className={`flex-1 rounded-md border py-3 text-sm font-medium transition-colors ${
                    numErrores === n
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n} error{n !== 1 ? 'es' : ''}
                  {n === 1 && <span className="block text-[10px] font-normal">Fácil</span>}
                  {n === 2 && <span className="block text-[10px] font-normal">Medio</span>}
                  {n === 3 && <span className="block text-[10px] font-normal">Difícil</span>}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerar}
            disabled={isGenerating}
            size="lg"
          >
            <Target className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando ejercicio...' : 'Generar ejercicio'}
          </Button>

          {isGenerating && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              La IA está inyectando errores sutiles... (puede tardar unos segundos)
            </p>
          )}
        </div>
      )}

      {/* Sesión activa */}
      {sesionActiva && (
        <CazaTrampasCard
          sesionId={sesionActiva.id}
          textTrampa={sesionActiva.texto_trampa}
          numErrores={sesionActiva.numErrores}
          leyNombre={sesionActiva.leyNombre}
          articuloNumero={sesionActiva.articuloNumero}
          tituloCap={sesionActiva.tituloCap}
          onNuevaSesion={() => setSesionActiva(null)}
        />
      )}

      {/* Stats cards */}
      {!sesionActiva && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Gratis', desc: 'Sin límite de correcciones' },
            { label: 'Real', desc: 'Artículos legales auténticos' },
            { label: 'Determinista', desc: 'Evaluación sin IA' },
          ].map((f) => (
            <Card key={f.label} className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
