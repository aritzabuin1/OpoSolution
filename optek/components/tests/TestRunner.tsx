'use client'

/**
 * components/tests/TestRunner.tsx — §1.10.2 + §1.10.3 + §1.10.7 + §1.10.8 + §1.10.9 + §2.6.2
 *
 * Orquestador del test activo:
 *   - Barra de progreso "Pregunta X de Y"
 *   - Grid de navegación por número de pregunta
 *   - Botones Anterior / Siguiente
 *   - Finalizar test (con confirmación si hay preguntas sin responder)
 *   - Reportar pregunta (dialog con campo de texto)
 *   - Al finalizar: guarda respuestas + puntuación en BD → redirige a /tests/[id]/resultados
 *
 * §2.6.2 Timer:
 *   - Prop tiempoLimiteSegundos (opcional): activa countdown
 *   - Auto-submit al llegar a 0
 *   - Alertas visuales a 10min y 5min restantes
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { LOGROS_CATALOG } from '@/lib/utils/streaks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { QuestionView } from '@/components/tests/QuestionView'
import type { Pregunta } from '@/types/ai'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TestRunnerProps {
  testId: string
  preguntas: Pregunta[]
  /** Título del tema o "Simulacro Oficial INAP" */
  temaTitulo: string
  /**
   * §2.6.2 — Límite de tiempo en segundos (opcional).
   * Si se proporciona: muestra countdown, auto-submit al llegar a 0.
   * Ejemplo: 5400 = 90 minutos, 2700 = 45 minutos.
   */
  tiempoLimiteSegundos?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGridBtnClass(
  idx: number,
  current: number,
  respuestas: (number | null)[]
): string {
  const base =
    'h-8 w-8 rounded-md text-xs font-medium transition-colors border'
  if (idx === current) return `${base} border-primary bg-primary text-primary-foreground`
  if (respuestas[idx] !== null) return `${base} border-green-400 bg-green-100 text-green-700`
  return `${base} border-border bg-background text-muted-foreground hover:bg-muted`
}

function calcularPuntuacion(preguntas: Pregunta[], respuestas: (number | null)[]): number {
  const total = preguntas.length
  if (total === 0) return 0
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
  return Math.round((aciertos / total) * 100)
}

/** Formatea segundos en MM:SS */
function formatTimer(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function TestRunner({ testId, preguntas, temaTitulo, tiempoLimiteSegundos }: TestRunnerProps) {
  const router = useRouter()

  const [current, setCurrent] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(
    Array(preguntas.length).fill(null)
  )
  const [feedbackShown, setFeedbackShown] = useState<boolean[]>(
    Array(preguntas.length).fill(false)
  )
  const [isFinishing, setIsFinishing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportMotivo, setReportMotivo] = useState('')
  const [isSendingReport, setIsSendingReport] = useState(false)

  // §2.6.2 — Timer state
  const [tiempoRestante, setTiempoRestante] = useState(tiempoLimiteSegundos ?? 0)
  const tiempoRestanteRef = useRef(tiempoLimiteSegundos ?? 0)
  const alertadoRef = useRef<{ min10: boolean; min5: boolean }>({ min10: false, min5: false })
  const isFinishingRef = useRef(false)

  const preguntaActual = preguntas[current]
  const totalPreguntas = preguntas.length
  const respondidas = respuestas.filter((r) => r !== null).length
  const sinResponder = totalPreguntas - respondidas

  // ── Finalizar (memoizado para usarlo desde el timer) ──────────────────────
  const finalizarTest = useCallback(async (fromTimer = false) => {
    if (isFinishingRef.current) return
    isFinishingRef.current = true
    setShowConfirmDialog(false)
    setIsFinishing(true)

    if (fromTimer) {
      toast.info('⏱️ Tiempo agotado', {
        description: 'El test se ha enviado automáticamente.',
        duration: 5000,
      })
    }

    // Capturar respuestas actuales desde ref (el timer puede llamar esto)
    const respuestasActuales = respuestasRef.current
    const puntuacion = calcularPuntuacion(preguntas, respuestasActuales)

    try {
      const res = await fetch(`/api/tests/${testId}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: respuestasActuales, puntuacion }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const nuevosLogros: string[] = data?.nuevosLogros ?? []
        for (const tipo of nuevosLogros) {
          const info = LOGROS_CATALOG[tipo]
          if (info) {
            toast.success(`${info.emoji} ¡Logro desbloqueado!`, {
              description: info.titulo,
              duration: 5000,
            })
          }
        }
        router.push(`/tests/${testId}/resultados`)
        return
      }

      const data = await res.json().catch(() => ({}))
      toast.error('Error al guardar el test', {
        description: data?.error ?? 'Inténtalo de nuevo.',
      })
    } catch {
      toast.error('Error de conexión', {
        description: 'No se pudo guardar el test. Comprueba tu conexión.',
      })
    } finally {
      isFinishingRef.current = false
      setIsFinishing(false)
    }
  }, [preguntas, testId, router])

  // Ref para acceder a respuestas actuales desde el timer (closure)
  const respuestasRef = useRef(respuestas)
  useEffect(() => {
    respuestasRef.current = respuestas
  }, [respuestas])

  // §2.6.2 — Countdown timer
  useEffect(() => {
    if (!tiempoLimiteSegundos) return

    const interval = setInterval(() => {
      tiempoRestanteRef.current -= 1
      setTiempoRestante(tiempoRestanteRef.current)

      const restante = tiempoRestanteRef.current

      // Alertas a 10 y 5 minutos
      if (restante === 600 && !alertadoRef.current.min10) {
        alertadoRef.current.min10 = true
        toast.warning('⏱️ Quedan 10 minutos', {
          description: 'Ve cerrando las preguntas que te falten.',
          duration: 6000,
        })
      }
      if (restante === 300 && !alertadoRef.current.min5) {
        alertadoRef.current.min5 = true
        toast.warning('⚠️ Quedan 5 minutos', {
          description: 'Intenta responder las preguntas que te queden.',
          duration: 6000,
        })
      }

      // Auto-submit cuando el tiempo se agota
      if (restante <= 0) {
        clearInterval(interval)
        void finalizarTest(true)
      }
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoLimiteSegundos]) // solo al montar

  // ── Responder una pregunta ─────────────────────────────────────────────────
  function handleRespuesta(opcionIdx: number) {
    setRespuestas((prev) => {
      const next = [...prev]
      next[current] = opcionIdx
      return next
    })
    setFeedbackShown((prev) => {
      const next = [...prev]
      next[current] = true
      return next
    })
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  function goTo(idx: number) {
    if (idx >= 0 && idx < totalPreguntas) setCurrent(idx)
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
  function handleFinalizarClick() {
    if (sinResponder > 0) {
      setShowConfirmDialog(true)
    } else {
      void finalizarTest()
    }
  }

  // ── Reportar pregunta ─────────────────────────────────────────────────────
  async function handleSendReport() {
    if (!reportMotivo.trim()) return
    setIsSendingReport(true)

    try {
      await fetch('/api/tests/reportar-pregunta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          preguntaIndex: current,
          motivo: reportMotivo.trim(),
        }),
      })
      toast.success('Reporte enviado', {
        description: 'Gracias, revisaremos la pregunta.',
      })
      setShowReportDialog(false)
      setReportMotivo('')
    } catch {
      toast.error('No se pudo enviar el reporte')
    } finally {
      setIsSendingReport(false)
    }
  }

  // ── Colores del timer ─────────────────────────────────────────────────────
  function getTimerClass(): string {
    if (!tiempoLimiteSegundos) return ''
    if (tiempoRestante <= 300) return 'text-red-600 font-bold animate-pulse'
    if (tiempoRestante <= 600) return 'text-amber-600 font-semibold'
    return 'text-muted-foreground'
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabecera: progreso + timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">{temaTitulo}</span>
          <div className="flex items-center gap-3">
            {/* §2.6.2 — Timer visible cuando hay límite de tiempo */}
            {tiempoLimiteSegundos && (
              <div className={`flex items-center gap-1 tabular-nums ${getTimerClass()}`}>
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm">{formatTimer(tiempoRestante)}</span>
              </div>
            )}
            <span className="text-muted-foreground">
              {respondidas}/{totalPreguntas} respondidas
            </span>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(respondidas / totalPreguntas) * 100}%` }}
          />
        </div>
        <p className="text-xs text-center font-medium text-muted-foreground">
          Pregunta {current + 1} de {totalPreguntas}
        </p>
      </div>

      {/* Grid de navegación por número */}
      <div className="flex flex-wrap gap-1.5">
        {preguntas.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={getGridBtnClass(idx, current, respuestas)}
            aria-label={`Ir a pregunta ${idx + 1}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Pregunta actual */}
      <QuestionView
        pregunta={preguntaActual}
        index={current}
        respuestaUsuario={respuestas[current]}
        showFeedback={feedbackShown[current]}
        onRespuesta={handleRespuesta}
      />

      {/* Navegación + acciones */}
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(current + 1)}
            disabled={current === totalPreguntas - 1}
          >
            Siguiente
          </Button>
        </div>

        <div className="flex gap-2">
          {/* Reportar pregunta */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="text-muted-foreground"
          >
            <Flag className="mr-1 h-3.5 w-3.5" />
            Reportar
          </Button>

          {/* Finalizar */}
          <Button
            size="sm"
            onClick={handleFinalizarClick}
            disabled={isFinishing}
          >
            {isFinishing ? 'Guardando...' : 'Finalizar test'}
          </Button>
        </div>
      </div>

      {/* Dialog confirmación preguntas sin responder */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sinResponder === 1
                ? 'Tienes 1 pregunta sin responder'
                : `Tienes ${sinResponder} preguntas sin responder`}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Si finalizas ahora, las preguntas sin responder contarán como incorrectas.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Seguir respondiendo
            </Button>
            <Button onClick={() => finalizarTest()} disabled={isFinishing}>
              Finalizar igualmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reporte de pregunta */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar pregunta {current + 1}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo del reporte</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Describe el problema con esta pregunta (cita incorrecta, enunciado confuso, respuesta errónea...)"
              value={reportMotivo}
              onChange={(e) => setReportMotivo(e.target.value)}
              maxLength={500}
            />
            <p className="text-right text-xs text-muted-foreground">
              {reportMotivo.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendReport}
              disabled={!reportMotivo.trim() || isSendingReport}
            >
              {isSendingReport ? 'Enviando...' : 'Enviar reporte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
