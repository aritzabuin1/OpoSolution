/**
 * app/(dashboard)/estudiar/page.tsx — FASE 13
 *
 * Página principal de estudio: lista temas de la oposición con bloques de legislación.
 * Server Component que carga datos + client islands para interactividad.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import { resolverBloquesPorTema } from '@/lib/estudiar/resolver'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Lock } from 'lucide-react'
import { EstudiarTemaList } from '@/components/estudiar/EstudiarTemaList'

export const metadata: Metadata = { title: 'Estudiar' }

interface TemaRow {
  id: string
  numero: number
  titulo: string
  bloque: string
}

export default async function EstudiarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  // Fetch oposicion name
  const { data: opoData } = await serviceSupabase
    .from('oposiciones')
    .select('nombre')
    .eq('id', oposicionId)
    .single()
  const oposicionNombre = (opoData as { nombre?: string } | null)?.nombre ?? 'tu oposición'

  // Fetch all temas for this oposicion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: temas } = await (serviceSupabase as any)
    .from('temas')
    .select('id, numero, titulo, bloque')
    .eq('oposicion_id', oposicionId)
    .order('numero') as { data: TemaRow[] | null }

  if (!temas || temas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Material de estudio en preparación</h1>
        <p className="text-muted-foreground">
          Los materiales de estudio para esta oposición se están preparando. Vuelve pronto.
        </p>
      </div>
    )
  }

  // Resolve blocks for each tema (in parallel, limited concurrency)
  const temasConBloques = await Promise.all(
    temas.map(async (tema) => {
      const bloques = await resolverBloquesPorTema(serviceSupabase, tema.id)
      return { ...tema, bloques }
    })
  )

  // Count stats
  const totalTemas = temasConBloques.length
  const temasConMaterial = temasConBloques.filter(t => t.bloques.length > 0).length
  const totalBloques = temasConBloques.reduce((sum, t) => sum + t.bloques.length, 0)
  const bloquesGenerados = temasConBloques.reduce(
    (sum, t) => sum + t.bloques.filter(b => b.generado).length, 0
  )

  // Free users: first 2-3 temas are free
  const FREE_TEMAS_COUNT = 2

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Estudiar</h1>
          <Badge variant="outline" className="text-xs">{oposicionNombre}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Resúmenes didácticos de cada ley. Estudia antes de hacer tests.
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm mb-2">
          <span className="text-muted-foreground">
            {temasConMaterial} de {totalTemas} temas con material de estudio
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${totalBloques > 0 ? (bloquesGenerados / totalBloques) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Free user notice */}
      {!isPaid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Acceso gratuito limitado
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Los primeros {FREE_TEMAS_COUNT} temas están disponibles gratis.
              Desbloquea el pack para acceder a todos los temas y generar resúmenes nuevos.
            </p>
          </div>
        </div>
      )}

      {/* Tema list */}
      <EstudiarTemaList
        temas={temasConBloques.map((t, i) => ({
          id: t.id,
          numero: t.numero,
          titulo: t.titulo,
          bloque: t.bloque,
          bloques: t.bloques.map(b => ({
            ley: b.ley,
            rango: b.rango,
            titulo: b.titulo,
            tituloCompleto: b.tituloCompleto,
            generado: b.generado,
            contenido: b.contenido,
            articulosCount: b.articulosCount,
            tipo: b.tipo,
          })),
          locked: !isPaid && i >= FREE_TEMAS_COUNT,
        }))}
        isPremium={isPaid}
      />
    </div>
  )
}
