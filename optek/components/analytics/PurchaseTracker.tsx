'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { trackGTMEvent } from '@/lib/analytics/gtm'
import { trackPixelEvent } from '@/lib/analytics/pixel'

/**
 * Invisible component that fires purchase conversion events
 * when the user lands on /tests?compra=ok after Stripe checkout.
 * Uses sessionStorage to deduplicate (fire once per checkout).
 */
export function PurchaseTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const compra = searchParams.get('compra')
    const sessionId = searchParams.get('session_id')
    if (compra !== 'ok' || !sessionId) return

    const dedupKey = `oporuta_purchase_tracked_${sessionId}`
    try {
      if (sessionStorage.getItem(dedupKey)) return
      sessionStorage.setItem(dedupKey, '1')
    } catch { /* sessionStorage blocked */ }

    trackGTMEvent('purchase', { transaction_id: sessionId })
    trackPixelEvent('Purchase')
  }, [searchParams])

  return null
}
