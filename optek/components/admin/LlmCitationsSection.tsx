/**
 * PlanSEO F6.T3 — sección citas LLM del dashboard /admin/seo
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'

interface CitationRow {
  query: string
  platform: string
  cited: boolean
  checked_at: string
}

export async function LlmCitationsSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createServiceClient()) as any
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: rows, error } = await supabase
    .from('llm_citations')
    .select('query, platform, cited, checked_at')
    .gte('checked_at', since.toISOString())
    .order('checked_at', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Citas LLM: error</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-red-800">{error.message}</p></CardContent>
      </Card>
    )
  }

  const all = (rows ?? []) as CitationRow[]
  const cited = all.filter(r => r.cited).length
  const rate = all.length > 0 ? (cited / all.length) * 100 : 0

  // Por plataforma
  const byPlatform = new Map<string, { total: number; cited: number }>()
  for (const r of all) {
    const cur = byPlatform.get(r.platform) ?? { total: 0, cited: 0 }
    cur.total += 1
    if (r.cited) cur.cited += 1
    byPlatform.set(r.platform, cur)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Citas LLM (últimos 30d)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin registros aún. Ejecuta <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">pnpm tsx execution/check-llm-citations.ts</code> cada lunes.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold">{rate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">{cited}/{all.length} queries con cita</p>
              </div>
            </div>
            <div className="space-y-1">
              {[...byPlatform.entries()]
                .sort((a, b) => b[1].total - a[1].total)
                .map(([platform, stats]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{platform.replace(/_/g, ' ')}</span>
                    <Badge variant="outline">{stats.cited}/{stats.total}</Badge>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
