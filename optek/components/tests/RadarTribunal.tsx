'use client'

import { Lock, TrendingUp, Shield, Target, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface RadarArticulo {
  legislacion_id: string
  articulo_numero: string
  ley_nombre: string
  ley_codigo: string
  titulo_capitulo: string | null
  resumen: string | null
  num_apariciones: number
  pct_total: number
  anios: number[]
  ultima_aparicion: number | null
}

interface RadarTribunalProps {
  articulos: RadarArticulo[]
  isPaid: boolean
  /** Numero de articulos visibles para usuarios free */
  freeLimit?: number
}

export default function RadarTribunal({ articulos, isPaid, freeLimit = 3 }: RadarTribunalProps) {
  // Free users see the LEAST important articles (bottom of ranking)
  // so they know the tool works but need Premium for the top ones
  const visibleArticulos = isPaid ? articulos : articulos.slice(-freeLimit)
  const hiddenCount = isPaid ? 0 : Math.max(0, articulos.length - freeLimit)

  return (
    <div className="w-full space-y-6">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-10">
                #
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                Articulo
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">
                Materia
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Apariciones
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell whitespace-nowrap">
                Anos
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleArticulos.map((art, idx) => {
              // For free users, show actual ranking position (from bottom of full list)
              const rankPos = isPaid ? idx + 1 : articulos.length - freeLimit + idx + 1
              return (
              <tr
                key={art.legislacion_id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-3 py-3 text-gray-400 font-mono text-xs">
                  <span className={rankPos <= 3 ? 'font-bold text-amber-500' : ''}>
                    {rankPos}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Art. {art.articulo_numero}
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {art.ley_nombre}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
                    {art.titulo_capitulo ?? '\u2014'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {art.num_apariciones}
                    </span>
                    <span className="text-gray-400 text-xs">
                      ({art.pct_total.toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell text-center">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {art.anios.join(', ')}
                  </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Paywall CTA para usuarios free */}
      {!isPaid && hiddenCount > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Los {hiddenCount} articulos que MAS caen estan ocultos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto">
              Has visto los menos frecuentes. Los articulos del <strong>top del ranking</strong> — los que
              el tribunal pregunta convocatoria tras convocatoria — solo estan disponibles con Premium.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Ranking completo</p>
                <p className="text-[10px] text-muted-foreground">{articulos.length} articulos ordenados por frecuencia</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Tests dirigidos</p>
                <p className="text-[10px] text-muted-foreground">Practica lo que realmente cae</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-white dark:bg-gray-800 border p-3">
              <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Datos reales</p>
                <p className="text-[10px] text-muted-foreground">{[...new Set(articulos.flatMap((a) => a.anios))].length} convocatorias INAP</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button asChild size="lg" className="px-8">
              <Link href="/cuenta">Desbloquear Radar completo — 49,99 EUR</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Pago unico · Incluye tests ilimitados + 20 analisis detallados + simulacros
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
