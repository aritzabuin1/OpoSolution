'use client'

/**
 * components/shared/NotificationBell.tsx — §2.13.10
 *
 * Ícono campana en Navbar con badge de notificaciones no leídas.
 * Click → dropdown con últimas 5 → mark as read.
 *
 * Client Component (interactividad + fetch).
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  url_accion: string | null
  leida: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifs.filter((n) => !n.leida).length

  async function fetchNotifs() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = (await res.json()) as Notificacion[]
        setNotifs(data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
  }

  useEffect(() => {
    fetchNotifs()
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function formatRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Hace un momento'
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} nuevas)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} nuevas</span>
            )}
          </div>

          {loading && (
            <p className="text-xs text-muted-foreground text-center py-6">Cargando...</p>
          )}

          {!loading && notifs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Sin notificaciones
            </p>
          )}

          {!loading && notifs.length > 0 && (
            <ul className="max-h-72 overflow-y-auto divide-y">
              {notifs.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 transition-colors ${!n.leida ? 'bg-primary/5' : ''}`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (!n.leida) void markAsRead(n.id)
                    }}
                  >
                    {n.url_accion ? (
                      <Link href={n.url_accion} onClick={() => setOpen(false)}>
                        <p className={`text-xs font-medium line-clamp-1 ${!n.leida ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.titulo}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.mensaje}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className={`text-xs font-medium line-clamp-1 ${!n.leida ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.titulo}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.mensaje}
                        </p>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
