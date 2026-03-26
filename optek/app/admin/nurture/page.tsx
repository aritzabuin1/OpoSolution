import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getNurtureFunnel, getWaitlistEntries } from '@/lib/admin/user-explorer'

export const metadata = { title: 'Nurture & Waitlist — Admin' }

const KEY_LABELS: Record<string, string> = {
  activation_d2: 'D+2 Activación',
  first_test_analysis: '1er test → Análisis IA',
  value_radar_d5: 'D+5 Radar Tribunal',
  progress_d10: 'D+10 Progreso',
  wall_hit: 'Wall hit (5 free)',
  urgency_d21: 'D+21 Urgencia',
  final_30d: '30 días pre-examen',
  hot_lead_5: 'Hot lead (5 temas)',
  hot_lead_10: 'Hot lead (10 temas)',
}

export default async function NurturePage() {
  const [funnel, waitlist] = await Promise.all([
    getNurtureFunnel(),
    getWaitlistEntries(),
  ])

  const totalSent = funnel.reduce((s, r) => s + r.sent, 0)
  const totalOptOut = funnel.reduce((s, r) => s + r.optedOut, 0)
  const totalConverted = funnel.reduce((s, r) => s + r.converted, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Nurture Emails & Waitlist</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Emails enviados</p>
            <p className="text-2xl font-bold">{totalSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Bajas</p>
            <p className="text-2xl font-bold text-red-600">{totalOptOut}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Compras tras nurture</p>
            <p className="text-2xl font-bold text-green-600">{totalConverted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funnel por email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4 text-right">Enviados</th>
                  <th className="pb-2 pr-4 text-right">Bajas</th>
                  <th className="pb-2 pr-4 text-right">Compras</th>
                  <th className="pb-2">Detalle bajas / compras</th>
                </tr>
              </thead>
              <tbody>
                {funnel.filter(r => r.sent > 0).map((r) => (
                  <tr key={r.emailKey} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{KEY_LABELS[r.emailKey] ?? r.emailKey}</td>
                    <td className="py-2 pr-4 text-right">{r.sent}</td>
                    <td className="py-2 pr-4 text-right">
                      {r.optedOut > 0 ? (
                        <span className="text-red-600 font-medium">{r.optedOut}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {r.converted > 0 ? (
                        <span className="text-green-600 font-medium">{r.converted}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {r.optOutEmails.length > 0 && (
                        <span className="text-red-500">Baja: {r.optOutEmails.join(', ')}</span>
                      )}
                      {r.optOutEmails.length > 0 && r.convertedEmails.length > 0 && ' · '}
                      {r.convertedEmails.length > 0 && (
                        <span className="text-green-600">Compra: {r.convertedEmails.join(', ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {funnel.every(r => r.sent === 0) && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Sin emails enviados aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Waitlist ({waitlist.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {waitlist.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin registros en waitlist</p>
          ) : (
            <div className="divide-y">
              {waitlist.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium">{w.email}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">{w.oposicionSlug}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
