'use client'

import { Lock, TrendingUp } from 'lucide-react'
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
  /** Número de artículos visibles para usuarios free (resto se blurrea) */
  freeLimit?: number
}

export default function RadarTribunal({ articulos, isPaid, freeLimit = 20 }: RadarTribunalProps) {
  const totalExamenes = articulos.length > 0 ? Math.max(...articulos.map((a) => a.anios.length)) : 0

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-10">
                #
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                Artículo
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">
                Materia
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Apariciones
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell whitespace-nowrap">
                Años
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {articulos.map((art, idx) => {
              const isLocked = !isPaid && idx >= freeLimit

              return (
                <tr
                  key={art.legislacion_id}
                  className={`transition-colors ${
                    isLocked ? 'relative' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {/* Número de ranking */}
                  <td className="px-3 py-3 text-gray-400 font-mono text-xs">
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    ) : (
                      <span className={idx < 3 ? 'font-bold text-amber-500' : ''}>
                        {idx + 1}
                      </span>
                    )}
                  </td>

                  {/* Artículo + ley */}
                  <td className="px-3 py-3">
                    {isLocked ? (
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Art. {art.articulo_numero}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {art.ley_nombre}
                        </Badge>
                      </div>
                    )}
                  </td>

                  {/* Materia / título capítulo */}
                  <td className="px-3 py-3 hidden md:table-cell">
                    {isLocked ? (
                      <div className="h-3 w-40 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
                        {art.titulo_capitulo ?? '—'}
                      </span>
                    )}
                  </td>

                  {/* Número de apariciones */}
                  <td className="px-3 py-3 text-center">
                    {isLocked ? (
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {art.num_apariciones}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({art.pct_total.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Años en que apareció */}
                  <td className="px-3 py-3 hidden sm:table-cell text-center">
                    {isLocked ? (
                      <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/50 rounded mx-auto animate-pulse" />
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {art.anios.join(', ')}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paywall overlay para usuarios free */}
      {!isPaid && articulos.length > freeLimit && (
        <div className="mt-6 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900 p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              +{articulos.length - freeLimit} articulos clave ocultos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Estos son los articulos que el tribunal pregunta una y otra vez.
              Los opositores que aprueban los conocen. Tu tambien puedes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-gray-500">
            <span>Ranking completo de {articulos.length} articulos</span>
            <span className="hidden sm:inline">·</span>
            <span>Practica dirigida por frecuencia</span>
            <span className="hidden sm:inline">·</span>
            <span>Datos de {[...new Set(articulos.flatMap((a) => a.anios))].length} convocatorias</span>
          </div>
          <div className="space-y-2 pt-2">
            <Button asChild size="lg">
              <Link href="/cuenta">Desbloquear Radar completo — 49,99 EUR</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Pago unico · Incluye tests ilimitados + 20 analisis detallados
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
