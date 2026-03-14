/**
 * lib/analytics/pixel.ts — §1.20.4
 *
 * Helper para eventos de conversión de Meta Pixel (fbq).
 * Solo activo si NEXT_PUBLIC_META_PIXEL_ID está configurado.
 *
 * Eventos de conversión:
 *   - CompleteRegistration: nuevo usuario registrado
 *   - StartTrial: primer test generado (free_tests_used === 0)
 *   - InitiateCheckout: usuario hace clic en "Comprar"
 *   - Purchase: pago completado (se dispara desde el webhook via Conversions API — pendiente)
 *
 * No se exporten funciones que puedan romper SSR (solo client-side safe).
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
  }
}

type PixelEvent =
  | 'CompleteRegistration'
  | 'StartTrial'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'ViewContent'

/**
 * Dispara un evento estándar de Meta Pixel.
 * Es seguro llamarlo aunque fbq no esté cargado (no lanza excepción).
 */
export function trackPixelEvent(
  event: PixelEvent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
): void {
  if (typeof window === 'undefined') return
  if (!window.fbq) return
  // Re-check consent — user may have withdrawn via ManageCookiesButton
  try {
    if (localStorage.getItem('oporuta_cookie_consent') !== 'accepted') return
  } catch { /* localStorage may be blocked */ }
  try {
    if (params) {
      window.fbq('track', event, params)
    } else {
      window.fbq('track', event)
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/**
 * Dispara StartTrial exactamente una vez por navegador/usuario.
 * Usar tras generar el primer test exitoso (cualquier tipo).
 * Usa localStorage como deduplicación — no depende del servidor.
 */
export function trackStartTrialOnce(): void {
  if (typeof window === 'undefined') return
  const LS_KEY = 'oporuta_trial_started'
  try {
    if (localStorage.getItem(LS_KEY)) return
    localStorage.setItem(LS_KEY, '1')
    trackPixelEvent('StartTrial')
  } catch {
    // localStorage may be blocked (private mode) — fail silently
  }
}
