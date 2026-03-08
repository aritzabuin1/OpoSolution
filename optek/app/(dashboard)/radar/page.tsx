/**
 * app/(dashboard)/radar/page.tsx — §2.14.6
 *
 * Radar del Tribunal: ranking de artículos por frecuencia en exámenes INAP.
 * - Top 20 visible para todos los usuarios
 * - 21+ bloqueado para usuarios free (blur + CTA)
 * - Botón "Practicar con los más frecuentes" (§2.14.4)
 *
 * Server Component.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import RadarTribunal, { type RadarArticulo } from '@/components/tests/RadarTribunal'

export const metadata: Metadata = {
  title: 'Radar del Tribunal',
  description: 'Los artículos que más caen en exámenes INAP reales. Practica lo que el tribunal pregunta.',
}

export default async function RadarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar si tiene compra activa OR es founder OR es admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: compra }, { data: profileData }] = await Promise.all([
    supabase.from('compras').select('id').eq('user_id', user.id).maybeSingle(),
    (supabase as any).from('profiles').select('is_founder, is_admin').eq('id', user.id).single(),
  ])
  const prof = profileData as { is_founder?: boolean; is_admin?: boolean } | null
  const isPaid = !!compra || prof?.is_founder === true || prof?.is_admin === true

  // Cargar ranking del radar (todos los artículos con frecuencia)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: radarData } = await (supabase as any)
    .from('radar_tribunal_view')
    .select(
      'legislacion_id, articulo_numero, ley_nombre, ley_codigo, titulo_capitulo, resumen, num_apariciones, pct_total, anios, ultima_aparicion'
    )
    .limit(100)

  const articulos = ((radarData ?? []) as unknown) as RadarArticulo[]

  // Estadísticas para el header
  const totalArticulos = articulos.length
  const examenesCubiertos = articulos.length > 0
    ? [...new Set(articulos.flatMap((a) => a.anios))].sort()
    : []

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
          Artículos que más han caído en exámenes INAP reales. Estudia lo que el tribunal realmente pregunta.
        </p>

        {/* Estadísticas */}
        {articulos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
              {totalArticulos} artículos analizados
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full">
              Exámenes: {examenesCubiertos.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Botón de práctica */}
      {articulos.length > 0 && (
        <div className="mb-6 flex gap-3">
          <Button asChild>
            <Link href="/tests?modo=radar">
              Practicar con los más frecuentes
            </Link>
          </Button>
        </div>
      )}

      {/* Tabla del radar */}
      {articulos.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-12 text-center">
          <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Radar en construcción
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Los datos del Radar se generan automáticamente a partir de los exámenes INAP históricos.
            Estamos procesando la información — vuelve a intentarlo en unos minutos.
          </p>
        </div>
      ) : (
        <RadarTribunal articulos={articulos} isPaid={isPaid} freeLimit={3} />
      )}

      {/* Nota metodológica */}
      <div className="mt-6 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Metodología:</strong> El ranking se construye analizando las {' '}
          {examenesCubiertos.length > 0 ? `convocatorias ${examenesCubiertos.join(', ')} ` : ''}
          del Cuerpo General Auxiliar de la Administración del Estado (INAP).
          Se extrae qué artículos menciona explícitamente cada pregunta oficial
          y se agrupan por frecuencia. Los artículos sin cita explícita no se contabilizan.
          Fuente: preguntas_oficiales.
        </p>
      </div>
    </div>
  )
}
