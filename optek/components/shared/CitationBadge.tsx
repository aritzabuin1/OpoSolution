/**
 * components/shared/CitationBadge.tsx — §1.10.5
 *
 * Badge de verificación de cita legal:
 *   - Verde "Verificada"  → cita encontrada y coincide en BD
 *   - Amarillo "Parcial"  → cita encontrada pero texto no coincide exactamente
 *   - Rojo "No verificada" → cita no encontrada en BD
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

export type VerificationStatus = 'verified' | 'partial' | 'unverified'

interface CitationBadgeProps {
  status: VerificationStatus
  ley?: string
  articulo?: string
  className?: string
}

const CONFIG = {
  verified: {
    label: 'Verificada',
    Icon: CheckCircle2,
    className: 'border-green-300 bg-green-50 text-green-700',
  },
  partial: {
    label: 'Parcial',
    Icon: AlertCircle,
    className: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  unverified: {
    label: 'No verificada',
    Icon: XCircle,
    className: 'border-red-300 bg-red-50 text-red-700',
  },
} as const

export function CitationBadge({ status, ley, articulo, className }: CitationBadgeProps) {
  const { label, Icon, className: colorClass } = CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass} ${className ?? ''}`}
      title={
        ley && articulo
          ? `${ley} art. ${articulo} — ${label}`
          : label
      }
    >
      <Icon className="h-3 w-3 shrink-0" />
      {ley && articulo ? (
        <span>
          {ley} art. {articulo}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </span>
  )
}
