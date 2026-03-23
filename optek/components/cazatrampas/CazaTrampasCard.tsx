'use client'

/**
 * components/cazatrampas/CazaTrampasCard.tsx — §2.12.11
 *
 * Tarjeta interactiva del modo Caza-Trampas.
 * El usuario selecciona fragmentos del texto (hace click) y propone la corrección.
 *
 * Flujo:
 *   1. Mostrar texto_trampa
 *   2. Usuario hace click en "Marcar error" → aparece input para corrección
 *   3. Al "Enviar" → POST /api/cazatrampas/[id]/grade
 *   4. Mostrar pantalla de resultados
 */

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Target, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShareButton } from '@/components/shared/ShareButton'
import { PaywallGate } from '@/components/shared/PaywallGate'
import { useAIAnalysis } from '@/lib/hooks/useAIAnalysis'
import { trackEvent } from '@/lib/analytics/track'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DeteccionUsuario {
  valor_trampa_detectado: string
  valor_original_propuesto: string
}

interface ErrorReal {
  tipo: string
  valor_original: string
  valor_trampa: string
  explicacion: string
}

interface DetalleResultado {
  error: ErrorReal
  detectado: boolean
  correccion_correcta: boolean
  deteccion_usuario?: DeteccionUsuario
}

interface Resultado {
  puntuacion: number
  aciertos: number
  total: number
  detalles: DetalleResultado[]
}

interface Props {
  sesionId: string
  textTrampa: string
  numErrores: number
  leyNombre: string
  articuloNumero: string
  tituloCap: string
  onNuevaSesion: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CazaTrampasCard({
  sesionId,
  textTrampa,
  numErrores,
  leyNombre,
  articuloNumero,
  tituloCap,
  onNuevaSesion,
}: Props) {
  const [detecciones, setDetecciones] = useState<DeteccionUsuario[]>([])
  const [currentTrampa, setCurrentTrampa] = useState('')
  const [currentCorreccion, setCurrentCorreccion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const analysis = useAIAnalysis('/api/ai/analyze-cazatrampas/stream')
  const trackedCazaView = useRef(false)

  // Track when analysis CTA becomes visible (resultado loaded)
  useEffect(() => {
    if (resultado && !trackedCazaView.current) {
      trackedCazaView.current = true
      trackEvent('view:cazatrampas-analysis-cta')
    }
  }, [resultado])

  function addDeteccion() {
    const trampa = currentTrampa.trim()
    const correccion = currentCorreccion.trim()
    if (!trampa || !correccion) {
      toast.error('Rellena ambos campos')
      return
    }
    if (detecciones.some((d) => d.valor_trampa_detectado === trampa)) {
      toast.error('Ya has marcado ese error')
      return
    }
    setDetecciones((prev) => [
      ...prev,
      { valor_trampa_detectado: trampa, valor_original_propuesto: correccion },
    ])
    setCurrentTrampa('')
    setCurrentCorreccion('')
    toast.success(`Error añadido (${detecciones.length + 1}/${numErrores})`)
  }

  function removeDeteccion(idx: number) {
    setDetecciones((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (detecciones.length === 0) {
      toast.error('Marca al menos un error antes de enviar')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/cazatrampas/${sesionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detecciones }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al evaluar')
        return
      }
      const data = (await res.json()) as Resultado
      setResultado(data)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Pantalla de resultados ─────────────────────────────────────────────────
  if (resultado) {
    const pctColor =
      resultado.puntuacion >= 80
        ? 'text-green-600'
        : resultado.puntuacion >= 50
        ? 'text-amber-600'
        : 'text-red-600'

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Resultado Caza-Trampas</p>
            <p className={`text-5xl font-extrabold ${pctColor}`}>
              {resultado.puntuacion.toFixed(0)}%
            </p>
            <p className="text-sm font-medium">
              {resultado.aciertos} de {resultado.total} errores detectados
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultado.detalles.map((d, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 space-y-2 ${
                d.detectado ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {d.detectado ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {d.error.tipo}
                </Badge>
                <span className="text-xs font-medium">
                  {d.detectado ? 'Detectado' : 'No detectado'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-red-700 font-medium line-through">{d.error.valor_trampa}</span>
                  {' → '}
                  <span className="text-green-700 font-medium">{d.error.valor_original}</span>
                </p>
                <p className="text-muted-foreground">{d.error.explicacion}</p>
              </div>
            </div>
          ))}

          {/* Análisis profundo IA */}
          {analysis.state === 'idle' || analysis.state === 'error' ? (
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Análisis profundo de las trampas</p>
                  <p className="text-xs text-muted-foreground">
                    La IA explica por qué cada trampa funciona y te da trucos de memoria. Consume 1 análisis.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => { trackEvent('click:cazatrampas-analysis-cta'); analysis.trigger({ sesionId }) }}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {analysis.state === 'error' ? 'Reintentar' : 'Analizar trampas (1 análisis)'}
              </Button>
            </div>
          ) : analysis.state === 'loading' ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
              <p className="font-medium text-sm">Analizando trampas...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">
                  Análisis profundo
                  {analysis.state === 'streaming' && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">escribiendo...</span>
                  )}
                </p>
              </div>
              <div
                ref={analysis.textRef}
                className="rounded-lg border border-primary/20 bg-muted/30 p-4 max-h-[400px] overflow-y-auto"
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {analysis.text}
                  {analysis.state === 'streaming' && (
                    <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              </div>
            </div>
          )}

          <PaywallGate
            open={analysis.showPaywall}
            onClose={() => analysis.setShowPaywall(false)}
            code="PAYWALL_CORRECTIONS"
          />

          {/* §2.16.8 — Compartir resultado Caza-Trampas */}
          <div className="flex gap-2">
            <ShareButton
              score={resultado.puntuacion}
              tema={`${leyNombre} — Art. ${articuloNumero}`}
              tipo="cazatrampas"
              resultUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'}/cazatrampas`}
            />
            <Button className="flex-1" onClick={onNuevaSesion}>
              Nuevo ejercicio
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Formulario principal ───────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold text-sm">{leyNombre}</span>
            <Badge variant="secondary" className="text-[10px]">Art. {articuloNumero}</Badge>
          </div>
          {tituloCap && (
            <p className="text-xs text-muted-foreground">{tituloCap}</p>
          )}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            <AlertTriangle className="inline h-3 w-3 mr-1" />
            Este texto contiene <strong>{numErrores} error{numErrores !== 1 ? 'es' : ''}</strong> sutil{numErrores !== 1 ? 'es' : ''}.
            Encuéntralos y corrígelos.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Texto con errores */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{textTrampa}</p>
        </div>

        {/* Errores ya marcados */}
        {detecciones.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Errores marcados ({detecciones.length}/{numErrores})
            </p>
            {detecciones.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs"
              >
                <span className="flex-1">
                  <span className="line-through text-red-600">{d.valor_trampa_detectado}</span>
                  {' → '}
                  <span className="text-green-700 font-medium">{d.valor_original_propuesto}</span>
                </span>
                <button
                  onClick={() => removeDeteccion(i)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para añadir error */}
        {detecciones.length < numErrores && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">Marcar un error</p>
            <div className="space-y-2">
              <input
                type="text"
                value={currentTrampa}
                onChange={(e) => setCurrentTrampa(e.target.value)}
                placeholder="El texto incorrecto (cópialo del fragmento)"
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                value={currentCorreccion}
                onChange={(e) => setCurrentCorreccion(e.target.value)}
                placeholder="Tu corrección propuesta"
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === 'Enter') addDeteccion() }}
              />
              <Button size="sm" variant="outline" onClick={addDeteccion} className="w-full">
                Añadir error
              </Button>
            </div>
          </div>
        )}

        {/* Enviar */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || detecciones.length === 0}
        >
          {isSubmitting ? 'Evaluando...' : `Enviar respuesta (${detecciones.length}/${numErrores} errores)`}
        </Button>
      </CardContent>
    </Card>
  )
}
