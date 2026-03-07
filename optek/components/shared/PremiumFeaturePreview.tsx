'use client'

/**
 * components/shared/PremiumFeaturePreview.tsx
 *
 * Full-page teaser for locked premium features.
 * Shows value proposition + benefits + CTA to buy.
 */

import { useState } from 'react'
import { Lock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trackPixelEvent } from '@/lib/analytics/pixel'
import type { LucideIcon } from 'lucide-react'

interface PremiumFeaturePreviewProps {
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
  /** Optional preview content (rendered below benefits, e.g. blurred sample) */
  preview?: React.ReactNode
}

export function PremiumFeaturePreview({
  icon: Icon,
  title,
  description,
  benefits,
  preview,
}: PremiumFeaturePreviewProps) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    trackPixelEvent('InitiateCheckout', { content_name: 'pack' })
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pack' }),
      })
      if (!res.ok) throw new Error('Error al iniciar el pago')
      const { url } = await res.json() as { url: string }
      if (url) window.location.href = url
    } catch {
      toast.error('Error al iniciar el pago. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
      {/* Icon + lock */}
      <div className="relative inline-flex items-center justify-center">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
          <Lock className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs">Premium</Badge>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Benefits */}
      <div className="text-left max-w-sm mx-auto space-y-2.5">
        {benefits.map((benefit) => (
          <div key={benefit} className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm">{benefit}</span>
          </div>
        ))}
      </div>

      {/* Optional preview */}
      {preview}

      {/* Price anchor + CTA */}
      <div className="space-y-3 pt-2">
        <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <span className="line-through text-destructive/60">Academia presencial: desde 150 EUR/mes</span>
          {' · '}
          <span className="font-semibold text-foreground">OpoRuta: 49,99 EUR una sola vez</span>
        </div>
        <Button onClick={handleBuy} disabled={loading} size="lg" className="w-full max-w-xs">
          {loading ? 'Cargando...' : 'Desbloquear Pack Oposicion — 49,99 EUR'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Pago seguro con Stripe · Sin suscripcion · Sin caducidad
        </p>
      </div>
    </div>
  )
}
