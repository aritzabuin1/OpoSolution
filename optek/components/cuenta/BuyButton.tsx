'use client'

/**
 * components/cuenta/BuyButton.tsx
 *
 * Botón de compra simple para la página de cuenta.
 * Llama a Stripe checkout con el tier indicado.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackPixelEvent } from '@/lib/analytics/pixel'

interface BuyButtonProps {
  tier: string
  label: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default'
  className?: string
}

export function BuyButton({ tier, label, variant = 'default', size = 'sm', className }: BuyButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    trackPixelEvent('InitiateCheckout', { content_name: tier })

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error al iniciar el pago')
      }

      const { url } = await res.json() as { url: string }
      if (url) window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el pago. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Redirigiendo...
        </span>
      ) : label}
    </Button>
  )
}
