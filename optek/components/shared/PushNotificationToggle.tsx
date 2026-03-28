'use client'

/**
 * components/shared/PushNotificationToggle.tsx
 *
 * Opt-in toggle for daily push notifications (Reto Diario 9AM).
 * Two variants:
 *   - "card": Dashboard nudge card with explanation (first-time opt-in)
 *   - "toggle": Simple on/off toggle for /cuenta settings
 *
 * Flow: user clicks "Activar" → browser asks permission → if granted,
 * registers service worker → saves subscription to DB → done.
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LS_KEY = 'oporuta_push_dismissed'
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

interface Props {
  variant: 'card' | 'toggle'
}

export function PushNotificationToggle({ variant }: Props) {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check support
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC) {
      setStatus('unsupported')
      return
    }

    // Check if dismissed (card variant only)
    if (variant === 'card') {
      try {
        if (localStorage.getItem(LS_KEY)) { setDismissed(true) }
      } catch { /* noop */ }
    }

    // Check current permission + subscription
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
      if (!reg) { setStatus('unsubscribed'); return }
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    }).catch(() => setStatus('unsubscribed'))
  }, [variant])

  const subscribe = useCallback(async () => {
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Request permission (browser popup)
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        toast.error('Notificaciones bloqueadas', {
          description: 'Puedes activarlas desde el icono del candado en la barra de direcciones.',
        })
        return
      }

      // Subscribe to push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      })

      // Save to DB
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (res.ok) {
        setStatus('subscribed')
        toast.success('Notificaciones activadas', {
          description: 'Recibirás el Reto Diario cada mañana a las 9:00.',
        })
      }
    } catch (err) {
      console.error('[push] subscribe error:', err)
      toast.error('Error al activar notificaciones')
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
      }

      // Remove from DB
      await fetch('/api/push/subscribe', { method: 'DELETE' })

      setStatus('unsubscribed')
      toast.success('Notificaciones desactivadas')
    } catch {
      toast.error('Error al desactivar notificaciones')
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem(LS_KEY, '1') } catch { /* noop */ }
  }

  // ── Toggle variant (for /cuenta) ──────────────────────────────────────
  if (variant === 'toggle') {
    if (status === 'loading' || status === 'unsupported') return null

    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Notificaciones del Reto Diario</p>
            <p className="text-xs text-muted-foreground">
              {status === 'subscribed'
                ? 'Recibes un aviso cada mañana a las 9:00'
                : status === 'denied'
                ? 'Bloqueadas en el navegador — actívalas desde el candado de la URL'
                : 'Recibe un recordatorio diario para mantener tu racha'}
            </p>
          </div>
        </div>
        {status === 'subscribed' ? (
          <Button variant="outline" size="sm" onClick={unsubscribe} className="gap-1.5 shrink-0">
            <BellOff className="h-3.5 w-3.5" />
            Desactivar
          </Button>
        ) : status !== 'denied' ? (
          <Button variant="default" size="sm" onClick={subscribe} className="gap-1.5 shrink-0">
            <Bell className="h-3.5 w-3.5" />
            Activar
          </Button>
        ) : null}
      </div>
    )
  }

  // ── Card variant (for dashboard) ──────────────────────────────────────
  if (status === 'loading' || status === 'unsupported' || status === 'subscribed' || status === 'denied' || dismissed) {
    return null
  }

  return (
    <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800/60 p-4 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs"
        aria-label="Cerrar"
      >
        ✕
      </button>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">¿Quieres que te avisemos del Reto Diario?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Un recordatorio cada mañana a las 9:00 — 3 minutos para mantener tu racha
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={subscribe} className="gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          Activar avisos
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss} className="text-muted-foreground">
          No, gracias
        </Button>
      </div>
    </div>
  )
}

/** Convert VAPID public key from base64 URL to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
