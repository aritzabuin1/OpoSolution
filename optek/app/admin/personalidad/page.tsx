/**
 * app/admin/personalidad/page.tsx
 *
 * Admin dashboard for Personalidad Policial module.
 * Metrics: users, sessions by type, completion rate, credits, cost, interview depth.
 */

export const dynamic = 'force-dynamic'

import { getPersonalidadMetrics } from '@/lib/admin/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TIPO_LABELS: Record<string, string> = {
  perfil: 'Evaluación Big Five',
  sjt: 'Juicio Situacional',
  entrevista: 'Entrevista IA',
  coaching: 'Coaching',
}

const TIPO_COLORS: Record<string, string> = {
  perfil: 'bg-blue-100 text-blue-800',
  sjt: 'bg-purple-100 text-purple-800',
  entrevista: 'bg-sky-100 text-sky-800',
  coaching: 'bg-amber-100 text-amber-800',
}

export default async function PersonalidadAdminPage() {
  const metrics = await getPersonalidadMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personalidad Policial</h1>
        <p className="text-sm text-muted-foreground">
          Métricas del módulo de personalidad: evaluaciones, entrevistas, SJT y coaching.
        </p>
      </div>

      {/* KPIs row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalUsers}</p>
            <p className="text-xs text-muted-foreground">han usado el módulo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sesiones totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.totalSessions}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.completionRate}% completadas · {metrics.avgSessionsPerUser} sesiones/usuario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créditos gastados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metrics.creditsSpent}</p>
            <p className="text-xs text-muted-foreground">
              ≈ €{(metrics.creditsSpent * 1).toFixed(0)} ingreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coste IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${(metrics.costCents / 100).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              margen {metrics.creditsSpent > 0 ? Math.round((1 - (metrics.costCents / 100) / metrics.creditsSpent) * 100) : 100}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions by type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sesiones por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.sessionsByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {metrics.sessionsByType.map((s) => {
                const pct = metrics.totalSessions > 0 ? Math.round((s.total / metrics.totalSessions) * 100) : 0
                return (
                  <div key={s.tipo} className="flex items-center gap-3">
                    <Badge className={TIPO_COLORS[s.tipo] ?? 'bg-gray-100 text-gray-800'} variant="outline">
                      {TIPO_LABELS[s.tipo] ?? s.tipo}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{s.total} sesiones</span>
                        <span className="text-muted-foreground">{s.completed} completadas ({s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview depth */}
      {metrics.interviewAvgMessages > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profundidad de entrevistas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.interviewAvgMessages} mensajes/sesión</p>
            <p className="text-xs text-muted-foreground">
              Media de intercambios por entrevista. Más mensajes = usuario más engaged.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad aún</p>
          ) : (
            <div className="space-y-2">
              {metrics.recentSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge className={TIPO_COLORS[s.tipo] ?? ''} variant="outline">
                      {TIPO_LABELS[s.tipo] ?? s.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {s.user_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${s.completed ? 'text-green-600' : 'text-amber-500'}`}>
                      {s.completed ? 'Completada' : 'En curso'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
