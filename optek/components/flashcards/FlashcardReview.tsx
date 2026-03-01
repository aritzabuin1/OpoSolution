'use client'

/**
 * components/flashcards/FlashcardReview.tsx — §2.2.3 + §2.2.4 + §2.2.5
 *
 * Componente de sesión de repaso de flashcards:
 *   - Presenta las flashcards con siguiente_repaso <= hoy
 *   - Animación flip (frente/reverso) con CSS transform
 *   - Botones de calidad: "No lo sabía" (mal), "Difícil" (dificil), "Bien" (bien), "Fácil" (facil)
 *   - Al evaluar: llama PUT /api/flashcards/[id]/review → actualiza intervalo + siguiente_repaso
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw, CheckCircle2, Trophy, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CalidadRespuesta } from '@/lib/utils/spaced-repetition'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string
  frente: string
  reverso: string
  cita_legal: { ley: string; articulo: string; texto_ref: string } | null
  intervalo_dias: number
  veces_acertada: number
  veces_fallada: number
  tema_titulo?: string
}

interface FlashcardReviewProps {
  flashcards: Flashcard[]
  onComplete?: () => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function FlashcardReview({ flashcards, onComplete }: FlashcardReviewProps) {
  const router = useRouter()
  const [cards, setCards] = useState(flashcards)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState<{ total: number; correctas: number }>()

  const current = cards[currentIdx]
  const totalCards = cards.length
  const progress = Math.round((currentIdx / totalCards) * 100)

  async function handleCalidad(calidad: CalidadRespuesta) {
    if (!current || isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/flashcards/${current.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calidad }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error('Error al guardar la evaluación', {
          description: data?.error ?? 'Inténtalo de nuevo.',
        })
        return
      }
    } catch {
      toast.error('Error de conexión')
      return
    } finally {
      setIsSubmitting(false)
    }

    const esCorrecta = calidad !== 'mal'

    // Actualizar estado local
    setCards((prev) =>
      prev.map((c, i) =>
        i === currentIdx
          ? {
              ...c,
              veces_acertada: esCorrecta ? c.veces_acertada + 1 : c.veces_acertada,
              veces_fallada: !esCorrecta ? c.veces_fallada + 1 : c.veces_fallada,
            }
          : c
      )
    )

    // Avanzar o finalizar
    if (currentIdx < totalCards - 1) {
      setCurrentIdx((i) => i + 1)
      setIsFlipped(false)
    } else {
      // Sesión completada
      const correctas = cards.filter((_, i) =>
        i === currentIdx ? esCorrecta : true
      ).length
      setCompleted({
        total: totalCards,
        correctas: Math.min(correctas, totalCards),
      })
    }
  }

  // ── Estado: sesión completada ─────────────────────────────────────────────
  if (completed) {
    const pct = Math.round((completed.correctas / completed.total) * 100)
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-12">
        <Trophy className="h-16 w-16 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold">¡Sesión completada!</h2>
          <p className="text-muted-foreground mt-1">
            Has repassado {completed.total} flashcards hoy.
          </p>
        </div>
        <div className="text-5xl font-extrabold text-primary">{pct}%</div>
        <p className="text-sm text-muted-foreground">de respuestas correctas</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIdx(0)
              setIsFlipped(false)
              setCompleted(undefined)
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Repasar de nuevo
          </Button>
          <Button onClick={() => { onComplete?.(); router.push('/flashcards') }}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Volver al mazo
          </Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="space-y-6 mx-auto max-w-lg">
      {/* Progreso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Flashcard {currentIdx + 1} de {totalCards}</span>
          {current.tema_titulo && (
            <Badge variant="secondary" className="text-[10px]">{current.tema_titulo}</Badge>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tarjeta con flip */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '240px',
          }}
        >
          {/* Frente */}
          <Card
            className="absolute inset-0 flex items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="p-0 text-center space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Pregunta
              </p>
              <p className="text-base font-medium leading-relaxed">{current.frente}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Toca para ver la respuesta
              </p>
            </CardContent>
          </Card>

          {/* Reverso */}
          <Card
            className="absolute inset-0 flex items-center justify-center p-6 bg-primary/5 border-primary/30"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="p-0 text-center space-y-3 w-full">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Respuesta
              </p>
              <p className="text-sm leading-relaxed">{current.reverso}</p>
              {current.cita_legal && (
                <p className="text-xs text-muted-foreground border-t border-primary/20 pt-2 mt-2">
                  Art. {current.cita_legal.articulo} — {current.cita_legal.ley}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botones de calidad (solo visibles cuando está girada) */}
      {isFlipped && (
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">¿Cómo te fue?</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => handleCalidad('mal')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '😕 No lo sabía'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => handleCalidad('dificil')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '🤔 Difícil'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => handleCalidad('bien')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Bien'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => handleCalidad('facil')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '⚡ Muy fácil'}
            </Button>
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlipped(true)}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            Ver respuesta
          </Button>
        </div>
      )}
    </div>
  )
}
