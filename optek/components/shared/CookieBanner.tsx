'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'optek_cookie_consent'

/**
 * Banner de consentimiento de cookies (RGPD/LSSI).
 *
 * Se muestra en la primera visita si el usuario no ha dado consentimiento.
 * Guarda la elección en localStorage (no en servidor — no es dato personal).
 * Las cookies técnicas (sesión Supabase) se usan siempre independientemente
 * de esta elección, al ser necesarias para el funcionamiento del servicio.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (!consent) setVisible(true)
    } catch {
      // localStorage puede fallar en contextos restringidos → no mostrar
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted')
    } catch { /* no-op */ }
    setVisible(false)
  }

  function reject() {
    try {
      localStorage.setItem(CONSENT_KEY, 'rejected')
    } catch { /* no-op */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border bg-card shadow-xl p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">🍪 Cookies en OPTEK</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Usamos cookies técnicas necesarias para el funcionamiento del servicio (sesión).
            No usamos cookies de analítica ni publicidad.{' '}
            <Link href="/legal/cookies" className="text-primary hover:underline">
              Más información
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={reject}>
            Solo necesarias
          </Button>
          <Button size="sm" onClick={accept}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  )
}
