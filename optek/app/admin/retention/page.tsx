import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyAdmin } from '@/lib/admin/auth'
import { getRetentionCohorts } from '@/lib/admin/retention'

export const metadata = { title: 'Retención por Cohortes — Admin' }

export default async function RetentionPage() {
  const auth = await verifyAdmin('admin/retention')
  if (!auth.authorized) redirect('/login')

  const cohorts = await getRetentionCohorts(8)

  // Max weeks across all cohorts (for column headers)
  const maxCols = cohorts.reduce((max, c) => Math.max(max, c.retention.length), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retención por Cohortes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Filas = semana de registro. Columnas = semana relativa. Celda = % activos esa semana.
          Verde = buena retención, rojo = mala.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tabla de Retención Semanal</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay datos suficientes. Se necesitan usuarios registrados en diferentes semanas.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Cohorte</th>
                  <th className="text-left py-2 pr-2 font-medium text-muted-foreground">Inicio</th>
                  <th className="text-right py-2 pr-3 font-medium text-muted-foreground">Users</th>
                  {Array.from({ length: maxCols }, (_, i) => (
                    <th key={i} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[40px]">
                      S{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => (
                  <tr key={cohort.week} className="border-b border-muted/50">
                    <td className="py-2 pr-3 font-medium">{cohort.week}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{cohort.weekStart}</td>
                    <td className="py-2 pr-3 text-right font-medium">{cohort.registered}</td>
                    {Array.from({ length: maxCols }, (_, i) => {
                      const pct = cohort.retention[i]
                      if (pct === undefined) return <td key={i} className="text-center px-1 text-muted-foreground/30">—</td>
                      return (
                        <td
                          key={i}
                          className="text-center px-1 font-medium rounded"
                          style={{ backgroundColor: getRetentionColor(pct), color: pct > 50 ? 'white' : 'inherit' }}
                        >
                          {pct}%
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getRetentionColor(80) }} /> &gt;60% excelente
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getRetentionColor(40) }} /> 30-60% normal
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getRetentionColor(15) }} /> &lt;30% problema
        </span>
      </div>
    </div>
  )
}

function getRetentionColor(pct: number): string {
  if (pct >= 60) return '#16a34a' // green-600
  if (pct >= 40) return '#65a30d' // lime-600
  if (pct >= 30) return '#ca8a04' // yellow-600
  if (pct >= 15) return '#ea580c' // orange-600
  return '#dc2626'                 // red-600
}
