/**
 * PlanSEO F6.T3 — sección GSC del dashboard /admin/seo
 *
 * Server component. Si GSC no está configurado o falla, muestra placeholder
 * con instrucciones — no rompe la página.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { getGscSummary, getTopQueries, getLowCtrPages } from '@/lib/seo/gsc-queries'

interface LoadResult {
  configured: boolean
  error?: string
  summary?: Awaited<ReturnType<typeof getGscSummary>>
  topQueries?: Awaited<ReturnType<typeof getTopQueries>>
  lowCtr?: Awaited<ReturnType<typeof getLowCtrPages>>
}

async function loadGscData(): Promise<LoadResult> {
  if (!process.env.GSC_SERVICE_ACCOUNT_EMAIL || !process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY || !process.env.GSC_SITE_URL) {
    return { configured: false }
  }
  try {
    const [summary, topQueries, lowCtr] = await Promise.all([
      getGscSummary(28),
      getTopQueries(28, 15),
      getLowCtrPages({ days: 28, minImpressions: 200, maxCtr: 0.02, limit: 10 }),
    ])
    return { configured: true, summary, topQueries, lowCtr }
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function GscSection() {
  const data = await loadGscData()

  if (!data.configured) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5" />
            Google Search Console (no configurado)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Añade envvars en Vercel: <code>GSC_SERVICE_ACCOUNT_EMAIL</code>, <code>GSC_SERVICE_ACCOUNT_PRIVATE_KEY</code>, <code>GSC_SITE_URL</code>.</p>
          <p>Autoriza el service account en Search Console → Settings → Users and permissions (Restricted).</p>
        </CardContent>
      </Card>
    )
  }

  if (data.error || !data.summary) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="h-5 w-5" />
            GSC: error al cargar datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-800 break-all">{data.error ?? 'Sin datos'}</p>
        </CardContent>
      </Card>
    )
  }

  const s = data.summary
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clics (28d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.clicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Impresiones (28d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.impressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">CTR medio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(s.ctr * 100).toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Posición media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.position.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Top 15 queries (28d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topQueries && data.topQueries.length > 0 ? (
              <ul className="space-y-1">
                {data.topQueries.map(q => (
                  <li key={q.keys[0]} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate flex-1">{q.keys[0]}</span>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                      <span>{q.clicks} clics</span>
                      <span>·</span>
                      <span>pos {q.position.toFixed(1)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos aún. GSC necesita ~3 días de delay.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              CTR bajo (candidatos a reescribir)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowCtr && data.lowCtr.length > 0 ? (
              <ul className="space-y-1">
                {data.lowCtr.map(p => (
                  <li key={p.keys[0]} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate flex-1 font-mono text-xs">{p.keys[0]?.replace(/^https?:\/\/[^/]+/, '')}</span>
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      <Badge variant="outline" className="text-xs">{p.impressions} imp</Badge>
                      <span className="text-amber-700">{(p.ctr * 100).toFixed(1)}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin páginas con CTR bajo en el umbral. ✅</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
