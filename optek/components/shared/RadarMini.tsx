import { TrendingUp, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { checkPaidAccess } from '@/lib/freemium'

interface RadarMiniRow {
  legislacion_id: string
  articulo_numero: string
  ley_nombre: string
  num_apariciones: number
  anios: number[]
}

export default async function RadarMini() {
  const supabase = await createClient()

  // Check if user has paid access
  const { data: { user } } = await supabase.auth.getUser()
  const isPaid = user ? await checkPaidAccess(supabase, user.id) : false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: top5 } = await (supabase as any)
    .from('radar_tribunal_view')
    .select('legislacion_id, articulo_numero, ley_nombre, num_apariciones, anios')
    .limit(5)

  // Si la tabla no tiene datos aún (migration no aplicada), no mostrar nada
  if (!top5 || top5.length === 0) return null

  const rows = top5 as RadarMiniRow[]

  // Free users: show teaser with blurred content
  if (!isPaid) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Radar del Tribunal
            </h3>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              Premium
            </Badge>
          </div>
        </div>

        {/* Blurred preview — shows structure but not content */}
        <div className="relative">
          <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden="true">
            {rows.slice(0, 3).map((art, idx) => (
              <div
                key={art.legislacion_id}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    Art. ██
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    ████
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    ██×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Descubre qué artículos pregunta más el tribunal en los exámenes reales
          </p>
          <Link
            href="/radar"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Lock className="w-3 h-3" />
            Desbloquear Radar del Tribunal
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Radar del Tribunal
          </h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            Premium
          </Badge>
        </div>
        <Link
          href="/radar"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
        >
          Ver ranking completo
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((art, idx) => (
          <div
            key={art.legislacion_id}
            className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{idx + 1}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                Art. {art.articulo_numero}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {art.ley_nombre}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {art.num_apariciones}×
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hint for articles below */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Ver artículos 6–100+ en el ranking completo</span>
      </div>
    </div>
  )
}
