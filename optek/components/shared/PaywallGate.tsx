'use client'

/**
 * components/shared/PaywallGate.tsx — OPTEK §1.15.3
 *
 * Modal de paywall que se muestra cuando el usuario alcanza el límite gratuito.
 * Dos contextos: TESTS (cuando agota los 5 tests gratis) y CORRECTIONS (sin correcciones).
 *
 * Diseño basado en ADR-0010 (Fuel Tank / Stripe):
 *   - Ancla visual: "Academia presencial: desde 150€/mes" vs "OPTEK desde 4.99€"
 *   - Tarjeta destacada: Pack Oposición (mayor valor percibido)
 *   - Opción individual: más accesible psicológicamente
 *
 * Ref: ADR-0009 (pricing híbrido), ADR-0010 (Fuel Tank)
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaywallCode = 'PAYWALL_TESTS' | 'PAYWALL_CORRECTIONS'

interface PaywallGateProps {
  open: boolean
  onClose: () => void
  code: PaywallCode
  temaId?: string
  oposicionId?: string
}

interface PricingOption {
  tier: 'tema' | 'pack' | 'recarga'
  label: string
  price: string
  description: string
  corrections: string
  featured?: boolean
}

// ─── Pricing options por contexto ─────────────────────────────────────────────

const OPTIONS_TESTS: PricingOption[] = [
  {
    tier: 'tema',
    label: 'Por tema',
    price: '4,99€',
    description: 'Tests ilimitados de 1 tema para siempre',
    corrections: '+ 5 correcciones incluidas',
  },
  {
    tier: 'pack',
    label: 'Pack Oposición',
    price: '34,99€',
    description: 'Todo el temario completo (28 temas)',
    corrections: '+ 20 correcciones incluidas',
    featured: true,
  },
]

const OPTIONS_CORRECTIONS: PricingOption[] = [
  {
    tier: 'recarga',
    label: 'Recarga',
    price: '8,99€',
    description: '+15 correcciones adicionales',
    corrections: 'Para tu cuenta existente',
  },
  {
    tier: 'pack',
    label: 'Pack Oposición',
    price: '34,99€',
    description: 'Todo el temario + 20 correcciones',
    corrections: 'La opción con más valor',
    featured: true,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function PaywallGate({ open, onClose, code, temaId, oposicionId }: PaywallGateProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const options = code === 'PAYWALL_TESTS' ? OPTIONS_TESTS : OPTIONS_CORRECTIONS
  const title = code === 'PAYWALL_TESTS'
    ? 'Continúa preparando tu oposición'
    : 'Recarga tus correcciones'
  const description = code === 'PAYWALL_TESTS'
    ? 'Has utilizado tus 5 tests gratuitos. Desbloquea acceso ilimitado para seguir practicando.'
    : 'Te has quedado sin correcciones disponibles. Recarga tu saldo para continuar.'

  async function handleBuy(tier: string) {
    setLoading(tier)
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
      // En producción usar un toast — por ahora alert simplificado
      alert(err instanceof Error ? err.message : 'Error al iniciar el pago. Intenta de nuevo.')
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
          <span className="font-semibold text-foreground">OPTEK: desde 4,99€ una sola vez</span>
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
