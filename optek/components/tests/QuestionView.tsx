'use client'

/**
 * components/tests/QuestionView.tsx — §1.10.1 + §1.10.4 + §1.10.6
 *
 * Vista de una única pregunta de test:
 *   - Enunciado
 *   - 4 opciones con radio-button styling
 *   - Feedback inmediato al responder: verde correcta / roja incorrecta
 *   - Justificación expandible con CitationBadge
 *   - Prop `answered` controla si se ha respondido (para deshabilitar cambios)
 */

import { CitationBadge } from '@/components/shared/CitationBadge'
import type { Pregunta } from '@/types/ai'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface QuestionViewProps {
  pregunta: Pregunta
  index: number
  /** null = no respondida, 0-3 = índice elegido */
  respuestaUsuario: number | null
  /** Si ya se respondió y se muestra feedback */
  showFeedback: boolean
  onRespuesta: (opcionIndex: number) => void
}

// ─── Colores por estado de opción ─────────────────────────────────────────────

function getOpcionClass(
  opcionIdx: number,
  correcta: number,
  respuestaUsuario: number | null,
  showFeedback: boolean
): string {
  const base =
    'flex items-start gap-3 w-full rounded-lg border p-3 text-left text-sm transition-colors'

  if (!showFeedback) {
    // Sin feedback: solo hover/selected state
    const isSelected = respuestaUsuario === opcionIdx
    return `${base} ${
      isSelected
        ? 'border-primary bg-primary/5 text-primary'
        : 'border-border bg-background hover:bg-muted cursor-pointer'
    }`
  }

  // Con feedback:
  if (opcionIdx === correcta) {
    return `${base} border-green-400 bg-green-50 text-green-800`
  }
  if (opcionIdx === respuestaUsuario && opcionIdx !== correcta) {
    return `${base} border-red-400 bg-red-50 text-red-800`
  }
  return `${base} border-border bg-background opacity-60`
}

const LETRAS = ['A', 'B', 'C', 'D'] as const

// ─── Componente ──────────────────────────────────────────────────────────────

export function QuestionView({
  pregunta,
  index,
  respuestaUsuario,
  showFeedback,
  onRespuesta,
}: QuestionViewProps) {
  const esCorrecto =
    showFeedback && respuestaUsuario !== null && respuestaUsuario === pregunta.correcta
  const esIncorrecto =
    showFeedback && respuestaUsuario !== null && respuestaUsuario !== pregunta.correcta

  return (
    <div className="space-y-4">
      {/* Enunciado */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pregunta {index + 1}
        </p>
        <p className="text-base font-medium leading-relaxed">{pregunta.enunciado}</p>
      </div>

      {/* Opciones */}
      <div className="space-y-2">
        {pregunta.opciones.map((opcion, i) => {
          const isSelected = respuestaUsuario === i
          const opcionClass = getOpcionClass(i, pregunta.correcta, respuestaUsuario, showFeedback)

          return (
            <button
              key={i}
              className={opcionClass}
              onClick={() => !showFeedback && onRespuesta(i)}
              disabled={showFeedback}
              aria-pressed={isSelected}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  showFeedback && i === pregunta.correcta
                    ? 'border-green-500 bg-green-500 text-white'
                    : showFeedback && i === respuestaUsuario && i !== pregunta.correcta
                      ? 'border-red-500 bg-red-500 text-white'
                      : isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {LETRAS[i]}
              </span>
              <span className="flex-1 leading-snug">{opcion}</span>
            </button>
          )
        })}
      </div>

      {/* Feedback: justificación + badge */}
      {showFeedback && (
        <div
          className={`rounded-lg border p-4 space-y-2 ${
            esCorrecto
              ? 'border-green-200 bg-green-50'
              : esIncorrecto
                ? 'border-red-200 bg-red-50'
                : 'border-border bg-muted'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${
                esCorrecto ? 'text-green-700' : esIncorrecto ? 'text-red-700' : ''
              }`}
            >
              {esCorrecto ? '¡Correcto!' : esIncorrecto ? 'Incorrecto' : 'Respuesta'}
            </span>
            {pregunta.cita && (
              <CitationBadge
                status="verified"
                ley={pregunta.cita.ley}
                articulo={pregunta.cita.articulo}
              />
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground">{pregunta.explicacion}</p>
          {pregunta.cita?.textoExacto && (
            <blockquote className="border-l-2 border-primary/30 pl-3 text-xs italic text-muted-foreground">
              &ldquo;{pregunta.cita.textoExacto}&rdquo;
            </blockquote>
          )}
        </div>
      )}
    </div>
  )
}
