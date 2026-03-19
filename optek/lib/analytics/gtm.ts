/**
 * lib/analytics/gtm.ts
 *
 * Helper para eventos de conversión en Google Tag Manager / GA4.
 * Pushes al dataLayer — GTM los recoge y los envía a GA4.
 *
 * Eventos:
 *   - sign_up: registro completado (auth/confirm)
 *   - first_test: primer test generado
 *   - purchase: pago completado (Stripe checkout success)
 *
 * Seguro para SSR (no-op en server). Respeta consentimiento de cookies.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: Record<string, any>[]
  }
}

/**
 * Push un evento al dataLayer de GTM.
 * No-op si dataLayer no existe o cookies no aceptadas.
 */
export function trackGTMEvent(
  event: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return
  if (!window.dataLayer) return
  try {
    if (localStorage.getItem('oporuta_cookie_consent') !== 'accepted') return
  } catch { /* localStorage blocked */ }
  try {
    window.dataLayer.push({ event, ...params })
  } catch {
    // Analytics should never break the app
  }
}
