/**
 * app/(dashboard)/radar/page.tsx — §2.14.6
 *
 * Radar del Tribunal: dual view — temas (28) + artículos (legislación).
 * - Radar por Temas: barras horizontales, Bloque I (azul) + Bloque II (verde)
 * - Detalle por Artículo: tabla existente para drill-down legislación
 * - Free users: ven bottom items + paywall CTA
 *
 * Server Component.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import { logger } from '@/lib/logger'
import { TrendingUp, Info, BookOpen, Scale } from 'lucide-react'
import { AIGenerationBanner } from '@/components/shared/AIGenerationBanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RadarTribunal, { type RadarArticulo } from '@/components/tests/RadarTribunal'
import RadarTemas, { type RadarTema } from '@/components/tests/RadarTemas'

export const metadata: Metadata = {
  title: 'Radar del Tribunal',
  description: 'Los temas y artículos que más caen en exámenes oficiales reales. Practica lo que el tribunal pregunta.',
}

export default async function RadarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for ALL queries — bypasses PostgREST view permission issues
  // (user client kept only for auth check above)
  const serviceSupabase = await createServiceClient()

  // Verificar si tiene compra activa — scoped por oposición
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)
  const log = logger.child({ page: 'radar', userId: user.id, oposicionId })

  // Load radar views + oposicion name, filtered by user's oposición
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radarQuery = (s: any, view: string) => oposicionId
    ? s.from(view).select('*').eq('oposicion_id', oposicionId)
    : s.from(view).select('*')

  const [temasResult, radarResult, { data: oposicionData }] = await Promise.all([
    radarQuery(serviceSupabase as any, 'radar_temas_view'),
    radarQuery(serviceSupabase as any, 'radar_tribunal_view').limit(100),
    serviceSupabase.from('oposiciones').select('nombre').eq('id', oposicionId).single(),
  ])

  // Log errors instead of swallowing them silently
  if (temasResult.error) log.error({ err: temasResult.error }, 'radar_temas_view query failed')
  if (radarResult.error) log.error({ err: radarResult.error }, 'radar_tribunal_view query failed')

  const temasData = temasResult.data
  const radarData = radarResult.data

  const oposicionNombre = oposicionData?.nombre ?? 'la Administración del Estado'

  // Fetch bloque info for each tema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: temasBloque } = oposicionId
    ? await (serviceSupabase as any).from('temas').select('id, bloque').eq('oposicion_id', oposicionId)
    : { data: null }
  const bloqueMap = new Map<string, string>()
  if (temasBloque) {
    for (const t of temasBloque as { id: string; bloque: string }[]) {
      bloqueMap.set(t.id, t.bloque)
    }
  }

  const temasRaw = ((temasData ?? []) as unknown) as RadarTema[]
  // Enrich with bloque
  const temas = temasRaw.map(t => ({ ...t, bloque: bloqueMap.get(t.tema_id) }))
  const articulos = ((radarData ?? []) as unknown) as RadarArticulo[]

  // Estadísticas para el header
  const allAnios = [
    ...new Set([
      ...temas.flatMap((t) => t.anios),
      ...articulos.flatMap((a) => a.anios),
    ]),
  ].sort()
  const totalPreguntas = temas.reduce((sum, t) => sum + t.num_apariciones, 0)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-7 h-7 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Radar del Tribunal
          </h1>
          <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
            Premium
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Temas y artículos que más han caído en exámenes oficiales reales. Estudia lo que el tribunal realmente pregunta.
        </p>

        {/* Estadísticas */}
        {(temas.length > 0 || articulos.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {temas.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
                {temas.length} temas analizados
              </div>
            )}
            {articulos.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
                {articulos.length} artículos indexados
              </div>
            )}
            {allAnios.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
                Exámenes: {allAnios.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner IA */}
      <AIGenerationBanner />

      {/* Botón de práctica */}
      {(temas.length > 0 || articulos.length > 0) && (
        <div className="mb-6 flex gap-3">
          <Button asChild>
            <Link href="/tests?modo=radar">
              Practicar con los más frecuentes
            </Link>
          </Button>
        </div>
      )}

      {/* No data state */}
      {temas.length === 0 && articulos.length === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-12 text-center">
          <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Radar en construcción
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Los datos del Radar se generan automáticamente a partir de los exámenes oficiales históricos.
            Estamos procesando la información — vuelve a intentarlo en unos minutos.
          </p>
        </div>
      )}

      {/* ═══ Radar por Temas ═══ */}
      {temas.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Radar por Temas
            </h2>
            <span className="text-xs text-gray-400">({temas.length} temas)</span>
          </div>
          <RadarTemas temas={temas} isPaid={isPaid} freeLimit={5} />
        </section>
      )}

      {/* ═══ Detalle por Artículo (Bloque I) ═══ */}
      {articulos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Detalle por Artículo
            </h2>
            <Badge variant="outline" className="text-xs">Detalle por artículo — Legislación</Badge>
          </div>
          <RadarTribunal articulos={articulos} isPaid={isPaid} freeLimit={3} />
        </section>
      )}

      {/* Nota metodológica */}
      <div className="mt-6 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Metodología:</strong> Se analizan {totalPreguntas > 0 ? `${totalPreguntas} preguntas de ` : ''}
          {allAnios.length > 0 ? `las convocatorias ${allAnios.join(', ')} ` : ''}
          de {oposicionNombre}.
          Cada pregunta se clasifica por tema según palabras clave del enunciado y opciones.
          Los temas de legislación incluyen detalle por artículo.
          Fuente: preguntas_oficiales.
        </p>
      </div>
    </div>
  )
}
