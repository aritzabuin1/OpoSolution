import { TrendingUp, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { checkPaidAccess } from '@/lib/freemium'

interface RadarMiniTema {
  tema_id: string
  tema_numero: number
  tema_titulo: string
  num_apariciones: number
  anios: number[]
}

export default async function RadarMini() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isPaid = user ? await checkPaidAccess(supabase, user.id) : false

  // Try temas view first (new), fallback to articles view (legacy)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: temasTop } = await (supabase as any)
    .from('radar_temas_view')
    .select('tema_id, tema_numero, tema_titulo, num_apariciones, anios')
    .limit(5)

  const rows = (temasTop ?? []) as RadarMiniTema[]

  // If no temas data, don't render
  if (rows.length === 0) return null

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

        {/* Blurred preview */}
        <div className="relative">
          <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden="true">
            {rows.slice(0, 3).map((tema, idx) => (
              <div
                key={tema.tema_id}
                className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    Tema ██ — ████████
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 ml-2">
                  ██×
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Descubre qué temas pregunta más el tribunal en los exámenes reales
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
        {rows.map((tema, idx) => {
          const isBloque2 = tema.tema_numero > 16
          return (
            <div
              key={tema.tema_id}
              className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono text-gray-400 w-4 shrink-0">{idx + 1}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  T{tema.tema_numero}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${isBloque2 ? 'border-emerald-300 text-emerald-600 dark:text-emerald-400' : ''}`}
                >
                  {tema.tema_titulo.length > 20 ? tema.tema_titulo.slice(0, 20) + '...' : tema.tema_titulo}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {tema.num_apariciones}×
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <TrendingUp className="w-3 h-3" />
        <span>Top 5 de 28 temas · Ver detalle completo</span>
      </div>
    </div>
  )
}
