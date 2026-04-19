'use client'
/**
 * PlanSEO F6.T5 — sección WoW del dashboard /admin/seo
 *
 * Botón "Generar reporte" → fetch a /api/admin/seo/weekly-report.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react'

interface WoWRow {
  query: string
  clicksCurr: number
  clicksPrev: number
  posCurr: number
  posPrev: number
  deltaClicks: number
  deltaPos: number
}

interface Report {
  generated_at: string
  totals: {
    queries_analizadas: number
    subieron_3pos: number
    bajaron_3pos: number
    caida_clicks_30pct: number
    queries_nuevas: number
  }
  rising: WoWRow[]
  falling: WoWRow[]
  click_drops: WoWRow[]
  new_queries: WoWRow[]
}

export function WeeklyReportSection() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/seo/weekly-report')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setReport(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Eval semanal (WoW)
        </CardTitle>
        <Button onClick={load} disabled={loading} size="sm" variant="outline">
          {loading ? 'Generando…' : report ? 'Regenerar' : 'Generar reporte'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Error: {error}
          </div>
        )}
        {!report && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Compara semana actual vs anterior: queries que suben/bajan ≥3 pos, caídas de clics ≥30%, queries nuevas. Datos frescos de GSC.
          </p>
        )}
        {report && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
              <Stat label="Suben ≥3 pos" value={report.totals.subieron_3pos} color="text-green-700" />
              <Stat label="Bajan ≥3 pos" value={report.totals.bajaron_3pos} color="text-red-700" />
              <Stat label="Clics -30%" value={report.totals.caida_clicks_30pct} color="text-amber-700" />
              <Stat label="Queries nuevas" value={report.totals.queries_nuevas} color="text-blue-700" />
            </div>

            <Block
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              title="Top 10 subidas de posición"
              rows={report.rising.slice(0, 10)}
              render={r => (
                <>
                  <Badge variant="outline" className="text-xs text-green-700">
                    +{r.deltaPos.toFixed(1)} pos
                  </Badge>
                  <span className="text-xs text-muted-foreground">{r.clicksCurr} clics</span>
                </>
              )}
            />

            <Block
              icon={<TrendingDown className="h-4 w-4 text-red-600" />}
              title="Top 10 caídas de posición"
              rows={report.falling.slice(0, 10)}
              render={r => (
                <>
                  <Badge variant="outline" className="text-xs text-red-700">
                    {r.deltaPos.toFixed(1)} pos
                  </Badge>
                  <span className="text-xs text-muted-foreground">{r.clicksCurr} clics</span>
                </>
              )}
            />

            <Block
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
              title="Top 10 caídas de clics ≥30%"
              rows={report.click_drops.slice(0, 10)}
              render={r => (
                <>
                  <Badge variant="outline" className="text-xs text-amber-700">
                    {r.clicksCurr}←{r.clicksPrev}
                  </Badge>
                </>
              )}
            />

            <Block
              icon={<Sparkles className="h-4 w-4 text-blue-600" />}
              title="Top 10 queries nuevas"
              rows={report.new_queries.slice(0, 10)}
              render={r => <span className="text-xs text-muted-foreground">{r.clicksCurr} clics · pos {r.posCurr.toFixed(1)}</span>}
            />

            <p className="text-xs text-muted-foreground pt-2 border-t">
              Generado {new Date(report.generated_at).toLocaleString('es-ES')} · Total queries analizadas: {report.totals.queries_analizadas}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Block({
  icon,
  title,
  rows,
  render,
}: {
  icon: React.ReactNode
  title: string
  rows: WoWRow[]
  render: (r: WoWRow) => React.ReactNode
}) {
  if (rows.length === 0) return null
  return (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
        {icon}
        {title}
      </h4>
      <ul className="space-y-1">
        {rows.map(r => (
          <li key={r.query} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate flex-1">{r.query}</span>
            <div className="flex items-center gap-2 shrink-0">{render(r)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
