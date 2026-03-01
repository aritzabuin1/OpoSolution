/**
 * app/(dashboard)/simulacros/page.tsx — §2.6A.2
 *
 * Grid de convocatorias oficiales disponibles para simulacro.
 *
 * Server Component: carga examenes_oficiales de Supabase.
 * Si no hay exámenes cargados, muestra empty state informativo.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SimulacroCard } from '@/components/simulacros/SimulacroCard'
import { Badge } from '@/components/ui/badge'
import { Trophy, Info } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamenConCount {
  id: string
  anio: number
  convocatoria: string
  fuente_url: string | null
  numPreguntas: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SimulacrosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Cargar examenes con conteo de preguntas disponibles
  // Cast: fuente_url no está en types/database.ts hasta aplicar migration 011
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (supabase as any).from('examenes_oficiales')
  const { data: examenes } = await examenesTable
    .select('id, anio, convocatoria, fuente_url, activo')
    .eq('activo', true)
    .order('anio', { ascending: false })
    .order('convocatoria')

  // Para cada examen, contar preguntas en preguntas_oficiales
  // Se hace en paralelo para minimizar latencia
  let examenesConCount: ExamenConCount[] = []

  if (examenes && examenes.length > 0) {
    const examenesArr = examenes as Array<{
      id: string; anio: number; convocatoria: string; fuente_url: string | null; activo: boolean
    }>
    const counts = await Promise.all(
      examenesArr.map(async (ex) => {
        // Cast: preguntas_oficiales no está en types/database.ts hasta migration 011
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pregTable = (supabase as any).from('preguntas_oficiales')
        const { count } = await pregTable
          .select('id', { count: 'exact', head: true })
          .eq('examen_id', ex.id)
        return (count as number) ?? 0
      })
    )

    examenesConCount = examenesArr.map((ex, i) => ({
      id: ex.id,
      anio: ex.anio ?? 0,
      convocatoria: ex.convocatoria ?? 'libre',
      fuente_url: ex.fuente_url ?? null,
      numPreguntas: counts[i],
    }))
  }

  const hayExamenes = examenesConCount.length > 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Simulacros de examen
            <Badge variant="secondary" className="text-xs font-normal">INAP Oficial</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Practica con exámenes reales de convocatorias anteriores
          </p>
        </div>
        <Trophy className="h-7 w-7 text-primary/60 shrink-0 mt-1" />
      </div>

      {/* Aviso de simulacro gratis */}
      <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
        <Info className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
        <p className="text-xs text-green-700">
          Los simulacros son <strong>completamente gratuitos</strong>.
          Practica sin límite con exámenes reales del INAP.
        </p>
      </div>

      {/* Lista de convocatorias */}
      {hayExamenes ? (
        <div className="space-y-3">
          {examenesConCount.map((examen) => (
            <SimulacroCard key={examen.id} examen={examen} />
          ))}
        </div>
      ) : (
        /* Empty state cuando no hay exámenes cargados en BD */
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold">Exámenes en preparación</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Estamos cargando las preguntas de convocatorias anteriores del INAP.
                Estarán disponibles muy pronto.
              </p>
            </div>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Convocatorias reales', desc: 'Exámenes oficiales del INAP' },
              { label: 'Penalización real', desc: 'Incorrecta descuenta 1/3' },
              { label: '100% gratuito', desc: 'Sin créditos ni límites' },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border p-3 space-y-1 opacity-60">
                <p className="font-medium text-sm">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
