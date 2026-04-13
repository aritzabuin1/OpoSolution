import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'
import { verifyAdmin } from '@/lib/admin/auth'
import { getRecentActivity } from '@/lib/admin/content-health'

export const metadata = { title: 'Actividad en Tiempo Real — Admin' }

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  register: { label: 'Registro', className: 'bg-blue-100 text-blue-700' },
  test: { label: 'Test', className: 'bg-green-100 text-green-700' },
  purchase: { label: 'Compra', className: 'bg-emerald-100 text-emerald-700' },
  error: { label: 'Error', className: 'bg-red-100 text-red-700' },
}

export default async function ActivityPage() {
  const auth = await verifyAdmin('admin/activity')
  if (!auth.authorized) redirect('/login')

  const events = await getRecentActivity(30)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" /> Actividad Reciente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Últimas 24 horas (hora Madrid). Recarga la página para actualizar.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{events.length} eventos en las últimas 24h</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin actividad en las últimas 24 horas</p>
          ) : (
            <div className="space-y-1">
              {events.map((event, i) => {
                const badge = TYPE_BADGES[event.type] ?? TYPE_BADGES.error
                const displayName = event.fullName || (event.email ? event.email.split('@')[0] : null)
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-muted/50 last:border-0">
                    <Badge className={`text-[9px] w-16 justify-center shrink-0 mt-0.5 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0 w-14 tabular-nums mt-0.5">
                      {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{event.detail}</p>
                      {event.userId && (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Link
                            href={`/admin/users/${event.userId}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {displayName ?? 'ver usuario'}
                          </Link>
                          {event.email && displayName !== event.email && (
                            <span className="text-[10px] text-muted-foreground">{event.email}</span>
                          )}
                          {event.oposicion && (
                            <Badge variant="outline" className="text-[9px] py-0">{event.oposicion}</Badge>
                          )}
                          {event.isPremium && (
                            <Badge className="text-[9px] py-0 bg-amber-100 text-amber-700">PRO</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
