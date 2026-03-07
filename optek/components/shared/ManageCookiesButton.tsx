'use client'

/**
 * Botón "Gestionar cookies" para footers.
 * Resetea el consentimiento y reabre el CookieBanner.
 * RGPD Art. 7.3: retirar consentimiento debe ser tan fácil como darlo.
 */
export function ManageCookiesButton() {
  function handleClick() {
    try {
      localStorage.removeItem('oporuta_cookie_consent')
    } catch { /* no-op */ }
    window.dispatchEvent(new CustomEvent('oporuta:reopen-cookie-banner'))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-foreground transition-colors"
    >
      Gestionar cookies
    </button>
  )
}
