'use client'

import { Lock, TrendingUp, Shield, Target, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BuyButton } from '@/components/cuenta/BuyButton'
import { useOposicionTier } from '@/lib/hooks/useOposicionTier'

export interface RadarTema {
  tema_id: string
  tema_numero: number
  tema_titulo: string
  num_apariciones: number
  pct_total: number
  anios: number[]
}

interface RadarTemasProps {
  temas: RadarTema[]
  isPaid: boolean
  freeLimit?: number
}

function getBloqueLabel(_numero: number, bloque?: string): { label: string; color: string } {
  const b = bloque ?? 'I'
  if (b === 'I') return { label: 'Bloque I', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
  return { label: `Bloque ${b}`, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
}

export default function RadarTemas({ temas, isPaid, freeLimit = 5 }: RadarTemasProps) {
  const { tier, price } = useOposicionTier()
  const maxApariciones = temas.length > 0 ? Math.max(...temas.map(t => t.num_apariciones)) : 1
  // Free users see the LEAST important temas (bottom of ranking)
  const visibleTemas = isPaid ? temas : temas.slice(-freeLimit)
  const hiddenCount = isPaid ? 0 : Math.max(0, temas.length - freeLimit)

  return (
    <div className="w-full space-y-4">
      {/* Tema bars */}
      <div className="space-y-2">
        {visibleTemas.map((tema, idx) => {
          const rankPos = isPaid ? idx + 1 : temas.length - freeLimit + idx + 1
          const barWidth = Math.max(8, (tema.num_apariciones / maxApariciones) * 100)
          const bloque = getBloqueLabel(tema.tema_numero)

          return (
            <div
              key={tema.tema_id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Rank */}
              <span className={`text-xs font-mono w-6 shrink-0 text-center ${rankPos <= 3 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>
                {rankPos}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    Tema {tema.tema_numero} — {tema.tema_titulo}
                  </span>
                  <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${bloque.color} border-0`}>
                    {bloque.label}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (tema as typeof tema & { bloque?: string }).bloque === 'I'
                          ? 'bg-blue-500 dark:bg-blue-400'
                          : 'bg-emerald-500 dark:bg-emerald-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 text-right shrink-0">
                    {tema.num_apariciones}×
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400">
                    {tema.pct_total.toFixed(1)}% del total
                  </span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">
                    {tema.anios.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Paywall CTA for free users */}
      {!isPaid && hiddenCount > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Los {hiddenCount} temas que MAS caen estan ocultos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto">
              Has visto los menos frecuentes. Los temas del <strong>top del ranking</strong> — los que
              el tribunal pregunta convocatoria tras convocatoria — solo estan disponibles con Premium.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">28 temas completos</p>
                <p className="text-[10px] text-muted-foreground">Legislacion + Ofimatica</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Detalle por articulo</p>
                <p className="text-[10px] text-muted-foreground">Drill-down legislacion</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Datos reales</p>
                <p className="text-[10px] text-muted-foreground">Examenes INAP historicos</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <BuyButton tier={tier} label={`Desbloquear Radar completo — ${price}`} size="default" className="px-8" />
            <p className="text-xs text-muted-foreground">
              Pago único · Incluye tests ilimitados + 20 análisis detallados + simulacros
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
