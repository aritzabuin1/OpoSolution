'use client'

/**
 * components/shared/PaywallGate.tsx — OPTEK §1.15.3
 *
 * Modal de paywall que se muestra cuando el usuario alcanza el límite gratuito.
 * Dos contextos: TESTS (cuando agota el test gratuito del tema) y CORRECTIONS (sin correcciones).
 *
 * Diseño basado en ADR-0010 (Fuel Tank / Stripe):
 *   - Ancla visual: "Academia presencial: desde 150€/mes" vs "OpoRuta desde 8.99€"
 *   - Tarjeta destacada: Pack Oposición (mayor valor percibido)
 *   - Opción individual: más accesible psicológicamente
 *
 * Ref: ADR-0009 (pricing híbrido), ADR-0010 (Fuel Tank)
 */

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trackPixelEvent } from '@/lib/analytics/pixel'
import { useIsPremium } from '@/lib/hooks/useIsPremium'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaywallCode = 'PAYWALL_TESTS' | 'PAYWALL_CORRECTIONS' | 'PAYWALL_SIMULACROS'

/** Oposicion IDs for contextual pack selection */
const C1_OPOSICION_ID = 'b0000000-0000-0000-0000-000000000001'
const A2_OPOSICION_ID = 'c2000000-0000-0000-0000-000000000001'

interface PaywallGateProps {
  open: boolean
  onClose: () => void
  code: PaywallCode
  temaId?: string
  oposicionId?: string
}

interface PricingOption {
  tier: 'pack' | 'pack_c1' | 'pack_a2' | 'recarga'
  label: string
  price: string
  description: string
  corrections: string
  featured?: boolean
}

// ─── Pricing options por contexto y oposición ─────────────────────────────────

function getTestOptions(oposicionId?: string): PricingOption[] {
  const isC1 = oposicionId === C1_OPOSICION_ID
  const isA2 = oposicionId === A2_OPOSICION_ID
  const tier = isA2 ? 'pack_a2' as const : isC1 ? 'pack_c1' as const : 'pack' as const
  const label = isA2 ? 'Pack Gestión del Estado A2' : isC1 ? 'Pack Administrativo C1' : 'Pack Auxiliar C2'
  const price = isA2 ? '69,99€' : '49,99€'
  const corrections = isA2 ? '+ 20 análisis + 5 supuestos prácticos' : '+ 20 análisis detallados incluidos'
  return [
    {
      tier,
      label,
      price,
      description: 'Todo el temario · simulacros · caza-trampas · radar',
      corrections,
      featured: true,
    },
  ]
}

const OPTIONS_RECARGA: PricingOption[] = [
  {
    tier: 'recarga',
    label: 'Recarga de análisis',
    price: '8,99€',
    description: '+10 análisis detallados adicionales',
    corrections: 'Se añaden a tu cuenta al instante',
    featured: true,
  },
]

function getCorrectionOptions(isPremium: boolean, oposicionId?: string): PricingOption[] {
  if (isPremium) return OPTIONS_RECARGA
  // Free users need to buy the pack first — recarga is only for existing premium users
  return getTestOptions(oposicionId)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaywallGate({ open, onClose, code, temaId, oposicionId }: PaywallGateProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const isPremium = useIsPremium()

  const options = code === 'PAYWALL_TESTS' || code === 'PAYWALL_SIMULACROS'
    ? getTestOptions(oposicionId)
    : getCorrectionOptions(isPremium === true, oposicionId)
  const title = code === 'PAYWALL_SIMULACROS'
    ? 'Simulacros ilimitados'
    : code === 'PAYWALL_TESTS'
    ? 'Continúa preparando tu oposición'
    : isPremium
      ? 'Recarga tus análisis'
      : 'Desbloquea análisis detallados'
  const description = code === 'PAYWALL_SIMULACROS'
    ? 'Has agotado tus 3 simulacros gratuitos. Con el Pack Oposición tienes simulacros ilimitados con preguntas oficiales INAP y penalización real.'
    : code === 'PAYWALL_TESTS'
    ? 'Ya has completado tu test gratuito de este tema. Desbloquea acceso ilimitado para seguir practicando.'
    : isPremium
      ? 'Te has quedado sin análisis detallados. Recarga tu saldo para continuar.'
      : 'Has utilizado tus 2 análisis gratuitos. Consigue el Pack para acceso ilimitado a tests + 20 análisis detallados.'

  async function handleBuy(tier: string) {
    setLoading(tier)
    // §1.20.4 — Conversion tracking: InitiateCheckout
    trackPixelEvent('InitiateCheckout', { content_name: tier })
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, temaId, oposicionId }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error al iniciar el pago')
      }

      const { url } = await res.json() as { url: string }
      if (url) window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el pago. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Ancla de precio — ADR-0010 */}
        <div className="rounded-lg bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          <span className="line-through text-destructive/60">Academia presencial: desde 150€/mes</span>
          {' · '}
          <span className="font-semibold text-foreground">
            OpoRuta: {code === 'PAYWALL_TESTS' || code === 'PAYWALL_SIMULACROS' || !isPremium ? '49,99€' : 'desde 8,99€'} una sola vez
          </span>
        </div>

        {/* Opciones de precio */}
        <div className="grid gap-3 mt-2">
          {options.map((opt) => (
            <div
              key={opt.tier}
              className={`relative rounded-xl border p-4 transition-colors ${
                opt.featured
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-background hover:border-primary/40'
              }`}
            >
              {opt.featured && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5">
                  Más popular
                </Badge>
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{opt.price}</span>
                    <span className="text-sm text-muted-foreground">pago único</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                  <p className="text-xs text-primary mt-1">{opt.corrections}</p>
                </div>
                <Button
                  size="sm"
                  variant={opt.featured ? 'default' : 'outline'}
                  onClick={() => handleBuy(opt.tier)}
                  disabled={loading !== null}
                  className="shrink-0"
                >
                  {loading === opt.tier ? (
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Cargando...
                    </span>
                  ) : (
                    'Comprar'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-1">
          Pago seguro con Stripe · Sin suscripción · Sin caducidad
        </p>
      </DialogContent>
    </Dialog>
  )
}
