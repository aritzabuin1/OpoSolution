'use client'

/**
 * components/corrector/FeedbackView.tsx — §1.12.4 + §1.12.5 + §1.12.6 + §1.12.7
 *
 * Vista del feedback de corrección de desarrollo:
 *   - Nota global prominente (0-10 con color)
 *   - 3 tarjetas de dimensiones expandibles (jurídica, argumentación, estructura)
 *   - CitationBadge con artículo verificado por cada cita
 *   - Sección "Mejoras sugeridas"
 *   - verificationScore badge
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, CheckCircle2, AlertCircle, XCircle, Save } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CitationBadge } from '@/components/shared/CitationBadge'
import type { CorreccionDesarrolloResult } from '@/lib/ai/correct-desarrollo'
import type { VerificationStatus } from '@/components/shared/CitationBadge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNota(n: number) {
  if (n >= 8) return { color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Sobresaliente' }
  if (n >= 6) return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Notable' }
  if (n >= 5) return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Aprobado' }
  return { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Insuficiente' }
}

function getVerificationStatus(score: number): VerificationStatus {
  if (score >= 0.9) return 'verified'
  if (score >= 0.5) return 'partial'
  return 'unverified'
}

// ─── DimensionCard ────────────────────────────────────────────────────────────

function DimensionCard({
  nombre,
  nota,
  descripcion,
}: {
  nombre: string
  nota: number
  descripcion: string
}) {
  const [open, setOpen] = useState(false)
  const { color, bg } = getNota(nota)

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className={`w-full rounded-lg border text-left ${bg} transition-all`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-medium text-sm">{nombre}</span>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${color}`}>{nota}/10</span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
      {open && (
        <div className="border-t px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">{descripcion}</p>
        </div>
      )}
    </button>
  )
}

// ─── FeedbackView ─────────────────────────────────────────────────────────────

interface FeedbackViewProps {
  resultado: CorreccionDesarrolloResult
}

export function FeedbackView({ resultado }: FeedbackViewProps) {
  const notaGlobal = getNota(resultado.puntuacion)
  const verStatus = getVerificationStatus(resultado.verificationScore)
  const pctVerified = Math.round(resultado.verificationScore * 100)

  const DIMENSIONES = [
    {
      nombre: 'Dimensión Jurídica',
      nota: resultado.dimension_juridica,
      descripcion: 'Precisión en el uso de conceptos y citas legales.',
    },
    {
      nombre: 'Argumentación',
      nota: resultado.dimension_argumentacion,
      descripcion: 'Calidad del razonamiento jurídico y coherencia de los argumentos.',
    },
    {
      nombre: 'Estructura',
      nota: resultado.dimension_estructura,
      descripcion: 'Organización del desarrollo: introducción, cuerpo y conclusión.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Nota global */}
      <Card className={`border ${notaGlobal.bg}`}>
        <CardContent className="pt-6 pb-6 text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Puntuación global
          </p>
          <p className={`text-5xl font-extrabold ${notaGlobal.color}`}>
            {resultado.puntuacion.toFixed(1)}
          </p>
          <p className={`text-sm font-semibold ${notaGlobal.color}`}>
            {notaGlobal.label}
          </p>
          {/* Verification score badge */}
          <div className="flex justify-center pt-1">
            <CitationBadge status={verStatus} />
            <span className="ml-2 text-xs text-muted-foreground self-center">
              {pctVerified}% citas verificadas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Feedback general */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold">Evaluación general</h3>
        <p className="text-sm leading-relaxed text-foreground">{resultado.feedback}</p>
      </div>

      {/* 3 Dimensiones */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Dimensiones</h3>
        {DIMENSIONES.map((d) => (
          <DimensionCard key={d.nombre} {...d} />
        ))}
      </div>

      {/* Mejoras sugeridas */}
      {resultado.mejoras.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Puntos de mejora</h3>
          <ul className="space-y-2">
            {resultado.mejoras.map((mejora, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span className="leading-snug">{mejora}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citas verificadas */}
      {resultado.citasVerificadas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Citas legales analizadas</h3>
          <div className="flex flex-wrap gap-2">
            {resultado.citasVerificadas.map((cv, i) => (
              <div key={i} className="flex items-center gap-1">
                <CitationBadge
                  status={cv.verificada ? 'verified' : 'unverified'}
                  ley={cv.cita.ley}
                  articulo={cv.cita.articulo}
                />
                {!cv.verificada && cv.error && (
                  <span className="text-xs text-red-500" title={cv.error}>
                    ⚠
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Las citas verificadas se han encontrado en la base de datos legislativa de OPTEK.
          </p>
        </div>
      )}

      {/* §1.12.8 — Indicador de guardado + acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Save className="w-3.5 h-3.5" />
          <span>Evaluación guardada automáticamente en tu historial</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/corrector">Ver historial</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/tests">Practicar ahora</Link>
          </Button>
        </div>
      </div>

      {/* Prompt version */}
      <p className="text-right text-xs text-muted-foreground">
        Modelo v{resultado.promptVersion}
      </p>
    </div>
  )
}
