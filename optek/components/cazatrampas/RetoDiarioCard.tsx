'use client'

/**
 * components/cazatrampas/RetoDiarioCard.tsx — §2.20.7
 *
 * Componente interactivo del Reto Diario.
 * Carga el reto del día vía API, permite al usuario marcar errores y enviar.
 * Muestra resultado + share button tras completar.
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { RetoDiarioShareButton } from '@/components/cazatrampas/RetoDiarioShareButton'
import { AlertTriangle, CheckCircle2, Clock, Target, Trophy, XCircle } from 'lucide-react'
import type { ErrorInyectado } from '@/lib/ai/schemas'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Reto {
  id: string
  fecha: string
  ley_nombre: string
  articulo_numero: string
  texto_trampa: string
  num_errores: number
}

interface ResultadoPrevio {
  puntuacion: number
  trampas_encontradas: number
  completado: boolean
  created_at: string
}

interface DeteccionUsuario {
  valor_trampa_detectado: string
  valor_original_propuesto: string
}

interface GradingResult {
  puntuacion: number
  aciertos: number
  total: number
  detalles: Array<{
    error: ErrorInyectado
    detectado: boolean
    correccion_correcta: boolean
    deteccion_usuario?: DeteccionUsuario
  }>
  errores_reales: ErrorInyectado[]
  stats: { total_jugadores: number }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RetoDiarioCard() {
  const [loading, setLoading] = useState(true)
  const [reto, setReto] = useState<Reto | null>(null)
  const [resultadoPrevio, setResultadoPrevio] = useState<ResultadoPrevio | null>(null)
  const [totalJugadores, setTotalJugadores] = useState(0)

  // Estado del juego
  const [detecciones, setDetecciones] = useState<DeteccionUsuario[]>([])
  const [inputTrampa, setInputTrampa] = useState('')
  const [inputOriginal, setInputOriginal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<GradingResult | null>(null)

  // ── Cargar reto del día ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadReto() {
      try {
        const res = await fetch('/api/reto-diario')
        if (!res.ok) {
          // 503 = no articles available → card shows friendly empty state, no need for toast
          if (res.status === 401) {
            toast.error('Sesión expirada. Vuelve a iniciar sesión.')
          } else if (res.status !== 503) {
            const errData = await res.json().catch(() => ({}))
            toast.error(errData?.error ?? `Error cargando el reto (${res.status})`)
          }
          return
        }
        const data = await res.json()
        setReto(data.reto)
        setResultadoPrevio(data.resultado)
        setTotalJugadores(data.stats?.total_jugadores ?? 0)
      } catch {
        toast.error('Error cargando el reto del día.')
      } finally {
        setLoading(false)
      }
    }
    void loadReto()
  }, [])

  // ── Añadir detección ──────────────────────────────────────────────────────
  const handleAddDeteccion = () => {
    if (!inputTrampa.trim() || !inputOriginal.trim()) {
      toast.error('Indica el error detectado y su corrección.')
      return
    }
    if (!reto) return
    if (detecciones.length >= reto.num_errores) {
      toast.warning(`Solo hay ${reto.num_errores} errores ocultos en este texto.`)
      return
    }
    setDetecciones((prev) => [
      ...prev,
      {
        valor_trampa_detectado: inputTrampa.trim(),
        valor_original_propuesto: inputOriginal.trim(),
      },
    ])
    setInputTrampa('')
    setInputOriginal('')
  }

  const handleRemoveDeteccion = (index: number) => {
    setDetecciones((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Enviar respuestas ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!reto) return
    if (detecciones.length === 0) {
      toast.error('Debes marcar al menos un error antes de enviar.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reto-diario/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reto_id: reto.id, detecciones }),
      })

      if (res.status === 409) {
        toast.error('Ya has jugado el reto de hoy. Vuelve mañana.')
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? 'Error enviando respuesta.')
        return
      }

      const data: GradingResult = await res.json()
      setResultado(data)
      setTotalJugadores(data.stats?.total_jugadores ?? 0)
    } catch {
      toast.error('Error de red. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Countdown hasta el próximo reto ──────────────────────────────────────
  const getCountdown = () => {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 5, 0, 0) // 00:05 UTC
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!reto) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="font-semibold">El reto de hoy no está disponible aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Se genera automáticamente cada día a las 00:05 UTC. Vuelve más tarde.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Ya jugó (resultado previo desde BD) ───────────────────────────────────
  if (resultadoPrevio && !resultado) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Reto completado
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Próximo reto en {getCountdown()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">
              {resultadoPrevio.trampas_encontradas}/{reto.num_errores}
            </p>
            <p className="text-muted-foreground text-sm mt-1">trampas encontradas</p>
            <p className="text-2xl font-semibold mt-2">{Math.round(resultadoPrevio.puntuacion)}%</p>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {totalJugadores > 1 && (
              <p>{totalJugadores} opositores han jugado hoy</p>
            )}
          </div>
          <div className="flex justify-center">
            <RetoDiarioShareButton
              fecha={reto.fecha}
              aciertos={resultadoPrevio.trampas_encontradas}
              total={reto.num_errores}
              puntuacion={resultadoPrevio.puntuacion}
              leyNombre={`${reto.ley_nombre} — Art. ${reto.articulo_numero}`}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Resultado tras jugar en esta sesión ───────────────────────────────────
  if (resultado) {
    const scoreColor =
      resultado.puntuacion >= 80
        ? 'text-green-600'
        : resultado.puntuacion >= 50
        ? 'text-amber-600'
        : 'text-red-600'

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                ¡Reto completado!
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Próximo en {getCountdown()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className={`text-5xl font-bold ${scoreColor}`}>
                {resultado.aciertos}/{resultado.total}
              </p>
              <p className="text-muted-foreground text-sm mt-1">trampas encontradas</p>
              <p className={`text-3xl font-semibold mt-2 ${scoreColor}`}>
                {Math.round(resultado.puntuacion)}%
              </p>
              {(resultado.stats?.total_jugadores ?? 0) > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {resultado.stats.total_jugadores} opositores han jugado hoy
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <RetoDiarioShareButton
                fecha={reto.fecha}
                aciertos={resultado.aciertos}
                total={resultado.total}
                puntuacion={resultado.puntuacion}
                leyNombre={`${reto.ley_nombre} — Art. ${reto.articulo_numero}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detalles de los errores */}
        <h2 className="text-lg font-semibold">Errores del texto</h2>
        <div className="space-y-3">
          {resultado.detalles.map((d, idx) => (
            <Card key={idx} className={d.detectado ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  {d.detectado ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {d.detectado ? '¡Detectado!' : 'No detectado'}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      <span className="font-medium text-red-600">Error:</span>{' '}
                      &quot;{d.error.valor_trampa}&quot;
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-green-700">Original:</span>{' '}
                      &quot;{d.error.valor_original}&quot;
                    </p>
                    <p className="text-muted-foreground text-xs mt-1 italic">
                      {d.error.explicacion}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ── Juego activo ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Info del reto */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-primary" />
              {reto.ley_nombre} — Art. {reto.articulo_numero}
            </CardTitle>
            <Badge>
              {reto.num_errores} errores ocultos
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Lee el texto y encuentra las palabras que han sido cambiadas por errores sutiles.
            Haz clic en &quot;Añadir error&quot; para cada uno que encuentres.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono border">
            {reto.texto_trampa}
          </div>
        </CardContent>
      </Card>

      {/* Detecciones añadidas */}
      {detecciones.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Errores marcados ({detecciones.length}/{reto.num_errores})</h3>
          {detecciones.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="flex-1">
                <span className="font-medium text-red-600">&quot;{d.valor_trampa_detectado}&quot;</span>
                {' → '}
                <span className="font-medium text-green-700">&quot;{d.valor_original_propuesto}&quot;</span>
              </span>
              <button
                onClick={() => handleRemoveDeteccion(idx)}
                className="text-muted-foreground hover:text-foreground text-xs"
                aria-label="Eliminar detección"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulario añadir error */}
      {detecciones.length < reto.num_errores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Añadir error detectado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Texto con error (copia exactamente como aparece en el texto)
              </label>
              <Input
                value={inputTrampa}
                onChange={(e) => setInputTrampa(e.target.value)}
                placeholder='Ej: "30 días" (el texto incorrecto del artículo)'
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Corrección (cómo debería decir realmente)
              </label>
              <Input
                value={inputOriginal}
                onChange={(e) => setInputOriginal(e.target.value)}
                placeholder='Ej: "15 días" (la versión correcta)'
                onKeyDown={(e) => e.key === 'Enter' && handleAddDeteccion()}
              />
            </div>
            <Button onClick={handleAddDeteccion} variant="outline" className="w-full">
              + Añadir error
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Botón enviar */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || detecciones.length === 0}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Enviando...' : `Enviar respuestas (${detecciones.length} errores marcados)`}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Solo puedes enviar una vez. El reto se resetea mañana a las 00:05 UTC.
      </p>
    </div>
  )
}
