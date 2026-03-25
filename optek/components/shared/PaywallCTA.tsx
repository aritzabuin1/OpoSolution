'use client'

/**
 * components/shared/PaywallCTA.tsx
 *
 * Reusable conversion CTA for blocked features.
 * Shows a clear value proposition + BuyButton with correct tier/price
 * based on the user's active oposición.
 *
 * Usage:
 *   <PaywallCTA feature="tests ilimitados" description="Practica sin límites..." />
 *   <PaywallCTA feature="supuestos prácticos" description="Caso práctico con IA..." />
 */

import { Lock } from 'lucide-react'
import { BuyButton } from '@/components/cuenta/BuyButton'
import { useOposicionTier } from '@/lib/hooks/useOposicionTier'

interface PaywallCTAProps {
  /** Feature name shown in the title (e.g. "tests ilimitados") */
  feature: string
  /** Short description of the value (1-2 lines) */
  description?: string
  /** Override the button label (default: "Desbloquear — {price}") */
  buttonLabel?: string
  /** Visual variant */
  variant?: 'card' | 'inline' | 'banner'
  /** Additional CSS classes */
  className?: string
}

export function PaywallCTA({
  feature,
  description,
  buttonLabel,
  variant = 'card',
  className = '',
}: PaywallCTAProps) {
  const { tier, price, loading } = useOposicionTier()

  if (loading) return null

  const label = buttonLabel ?? `Desbloquear — ${price}`

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">{feature} es Premium</p>
        </div>
        <BuyButton tier={tier} label={label} size="sm" className="shrink-0" />
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-5 ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              {feature}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {price} · Pago único · Sin suscripción
            </p>
          </div>
          <BuyButton tier={tier} label={label} className="shrink-0" />
        </div>
      </div>
    )
  }

  // Default: card variant
  return (
    <div className={`rounded-xl border-2 border-dashed border-primary/30 bg-primary/3 p-6 text-center space-y-3 ${className}`}>
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
      </div>
      <div>
        <p className="font-semibold">{feature}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
        )}
      </div>
      <BuyButton tier={tier} label={label} />
      <p className="text-xs text-muted-foreground">{price} · Pago único · Sin suscripción</p>
    </div>
  )
}
