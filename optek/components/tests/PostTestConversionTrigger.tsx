'use client'

/**
 * components/tests/PostTestConversionTrigger.tsx
 *
 * Conversion trigger shown after completing a test.
 * Three variants:
 *   A — Free user post-test: score + Radar freq + gap + weakness map + CTA
 *   B — Free user retry attempt: simple wall
 *   C — Paid user post-test: motivational, no CTA
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

export type TriggerVariant = 'free_post_test' | 'free_retry' | 'paid_post_test'

interface WeaknessTema {
  titulo: string
  score: number  // 0-100
}

export interface PostTestConversionTriggerProps {
  variant: TriggerVariant
  /** Current test score (0-100) */
  score?: number
  /** Tema title */
  temaTitulo?: string
  /** Radar: how many convocatorias this tema appeared in */
  radarFrequency?: number | null
  /** Approximate passing threshold (0-100) */
  passingThreshold?: number
  /** Weakness map: top 5 worst temas (only if 5+ temas completed) */
  weaknesses?: WeaknessTema[]
  /** Price display */
  precio?: string
  /** Checkout href */
  checkoutHref?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PostTestConversionTrigger({
  variant,
  score = 0,
  temaTitulo,
  radarFrequency,
  passingThreshold = 70,
  weaknesses = [],
  precio = '49,99€',
  checkoutHref = '/#precios',
}: PostTestConversionTriggerProps) {
  const nota = Math.round(score / 10)
  const notaCorte = Math.round(passingThreshold / 10)
  const gap = Math.max(0, notaCorte - nota)
  const isPassing = score >= passingThreshold

  // ── Variant A: Free user after completing a test ──────────────────────────
  if (variant === 'free_post_test') {
    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 mt-6">
        <CardContent className="pt-5 pb-5 space-y-4">
          {/* Score + context */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {isPassing ? 'Vas por buen camino' : `Te faltan ${gap} puntos para aprobar`}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Tu nota: <strong>{nota}/10</strong>
                {temaTitulo && <> en {temaTitulo}</>}
                {' · '}Corte para aprobar: ~{notaCorte}/10
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/60">
              <Target className="h-5 w-5 text-amber-700" />
            </div>
          </div>

          {/* Radar frequency (if available) */}
          {radarFrequency != null && radarFrequency > 0 && (
            <p className="text-xs text-amber-800 bg-amber-100 rounded-md px-3 py-1.5">
              Este tema ha caído en <strong>{radarFrequency} de las últimas 5 convocatorias</strong> INAP.
              {!isPassing && ' Necesitas dominarlo.'}
            </p>
          )}

          {/* Weakness map (if 5+ temas completed) */}
          {weaknesses.length >= 3 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-900">Tu mapa de debilidades:</p>
              {weaknesses.slice(0, 5).map((w) => {
                const wNota = Math.round(w.score / 10)
                const barColor = wNota >= 7 ? 'bg-green-500' : wNota >= 5 ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={w.titulo} className="flex items-center gap-2 text-xs">
                    <span className="w-28 truncate text-amber-800">{w.titulo}</span>
                    <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${w.score}%` }} />
                    </div>
                    <span className="w-8 text-right font-medium text-amber-900">{wNota}/10</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-amber-700">
              <Lock className="inline h-3 w-3 mr-1" />
              Has usado tu test gratuito de este tema. Para repetir y mejorar, desbloquea el acceso completo.
            </p>
            <Link href={checkoutHref}>
              <Button className="w-full" size="sm">
                Desbloquear tests ilimitados — {precio} pago único
              </Button>
            </Link>
            <p className="text-[10px] text-center text-amber-600">
              Sin suscripción · Elige dificultad · Repite sin límites
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Variant B: Free user tries to retry a completed tema ──────────────────
  if (variant === 'free_retry') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-amber-900">
              Ya has completado tu test gratuito de este tema
            </p>
            <p className="text-xs text-amber-700">
              Desbloquea acceso ilimitado para repetir este tema, elegir dificultad y practicar con preguntas nuevas.
            </p>
            <Link href={checkoutHref}>
              <Button size="sm">Desbloquear por {precio}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Variant C: Paid user motivational ─────────────────────────────────────
  return (
    <Card className="border-green-200 bg-green-50 mt-6">
      <CardContent className="flex items-start gap-3 pt-4 pb-4">
        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-900">
            {isPassing
              ? `${nota}/10 — Estás en zona de aprobado. ¡Sigue así!`
              : `${nota}/10 — Cada test te acerca más al aprobado. Repite este tema para mejorar.`
            }
          </p>
          <p className="text-xs text-green-700 mt-1">
            Prueba un nivel de dificultad más alto o haz un simulacro completo para medir tu progreso real.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
