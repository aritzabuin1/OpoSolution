/**
 * app/(dashboard)/tests/[id]/page.tsx — §1.10, §2.6A.4
 *
 * Carga el test desde Supabase y renderiza TestRunner (Client Component).
 * Si el test ya está completado, redirige a la vista de resultados.
 * Si el test es un simulacro oficial (examen_oficial_id IS NOT NULL),
 * muestra una cabecera contextual "Simulacro Oficial INAP".
 */

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TestRunner } from '@/components/tests/TestRunner'
import { SupuestoTestRunner } from '@/components/supuesto-test/SupuestoTestRunner'
import { Badge } from '@/components/ui/badge'
import { Trophy, RefreshCw, FileText } from 'lucide-react'
import type { Pregunta } from '@/types/ai'
import { JsonLd } from '@/components/shared/JsonLd'
import { getOposicionDisplay } from '@/lib/utils/oposicion-display'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

interface TestDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TestDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('tests_generados')
    .select('tipo, examen_oficial_id, temas(titulo)')
    .eq('id', id)
    .single()

  if (!data) return {}

  let simulacroOrganismo = 'Simulacro Oficial'
  if (data.tipo === 'simulacro' && data.examen_oficial_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: testFull } = await (supabase as any)
      .from('tests_generados')
      .select('oposicion_id')
      .eq('id', id)
      .single()
    if (testFull?.oposicion_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: opo } = await (supabase as any)
        .from('oposiciones')
        .select('rama, slug')
        .eq('id', testFull.oposicion_id)
        .single()
      if (opo) {
        simulacroOrganismo = getOposicionDisplay({ rama: opo.rama, slug: opo.slug }).simulacroLabel
      }
    }
  }

  const title =
    data.tipo === 'supuesto_test'
      ? 'Supuesto Práctico'
      : data.tipo === 'simulacro' && data.examen_oficial_id
      ? simulacroOrganismo
      : data.tipo === 'repaso_errores'
      ? 'Repaso de errores'
      : (data.temas as { titulo: string } | null)?.titulo ?? 'Test de práctica'

  return { title }
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Cargar test + tema — también tipo y examen_oficial_id (migration 011)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: test, error } = await (supabase as any)
    .from('tests_generados')
    .select('id, preguntas, completado, tipo, examen_oficial_id, tema_id, oposicion_id, supuesto_caso, temas(titulo)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !test) notFound()

  // Si ya está completado → redirigir a resultados
  if (test.completado) {
    redirect(`/tests/${id}/resultados`)
  }

  const preguntas = test.preguntas as unknown as Pregunta[]
  const esSimulacro = test.tipo === 'simulacro' && !!test.examen_oficial_id
  const esRepaso = test.tipo === 'repaso_errores'
  const esSupuestoTest = test.tipo === 'supuesto_test'
  const supuestoCaso = test.supuesto_caso as { titulo?: string; escenario?: string; bloques_cubiertos?: string[]; ofimatica_start?: number } | null

  // §BUG-SP3 — Timer dinámico desde scoring_config de la oposición
  let fullExamQuestions = 100
  let fullExamSeconds = 90 * 60
  let tiempoLimiteSupuesto: number | undefined
  let preguntasCuestionarioConfig: number | undefined
  let opoRama: string | undefined
  let opoSlug: string | undefined
  type ScoringEjercicio = { nombre?: string; preguntas?: number; minutos?: number | null; tipo?: string }
  if (test.oposicion_id) {
    const serviceSupabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opoData } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('scoring_config, rama, slug')
      .eq('id', test.oposicion_id)
      .single()
    const opoRow = opoData as { scoring_config?: unknown; rama?: string; slug?: string } | null
    opoRama = opoRow?.rama
    opoSlug = opoRow?.slug
    const sc = opoRow?.scoring_config as { ejercicios?: ScoringEjercicio[]; minutos_total?: number } | null
    if (sc?.ejercicios?.[0]) {
      fullExamQuestions = sc.ejercicios[0].preguntas ?? 100
      // For "examen completo" simulacro: sum simulable ejercicios' minutos
      // Exclude tipo='tribunal' (desarrollo escrito — not part of MCQ simulacro)
      // minutos_total overrides if present
      const simulableEjercicios = sc.ejercicios.filter(ej => ej.tipo !== 'tribunal')
      const totalMinutos = sc.minutos_total
        ?? (simulableEjercicios.reduce((sum, ej) => sum + (ej.minutos ?? 0), 0) || 90)
      fullExamSeconds = totalMinutos * 60
      preguntasCuestionarioConfig = sc.ejercicios[0].preguntas
    }
    if (esSupuestoTest && sc?.ejercicios) {
      const ejSup = sc.ejercicios.find(e => (e.nombre?.toLowerCase().includes('supuesto') || e.nombre?.toLowerCase().includes('práctico')))
      if (ejSup?.minutos) {
        tiempoLimiteSupuesto = ejSup.minutos * 60
      }
    }
  }

  const temaTitulo = esSupuestoTest
    ? 'Supuesto Práctico'
    : esSimulacro
    ? getOposicionDisplay({ rama: opoRama, slug: opoSlug }).simulacroLabel
    : esRepaso
    ? 'Repaso de errores'
    : ((test.temas as { titulo: string } | null)?.titulo ?? 'Test de práctica')

  const simulacroConSupuesto = esSimulacro && !!supuestoCaso
  const tiempoLimite = esSupuestoTest
    ? tiempoLimiteSupuesto
    : simulacroConSupuesto
    ? fullExamSeconds // Full exam time (e.g. 100 min for C1) — user distributes between parts
    : esSimulacro
    ? Math.round((preguntas.length / fullExamQuestions) * fullExamSeconds)
    : undefined

  // §2.17.6 — BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Dashboard', item: `${APP_URL}/dashboard` },
      { '@type': 'ListItem', position: 2, name: 'Tests', item: `${APP_URL}/tests` },
      { '@type': 'ListItem', position: 3, name: temaTitulo, item: `${APP_URL}/tests/${id}` },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Cabecera contextual para simulacros oficiales */}
      {esSimulacro && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <Trophy className="h-4 w-4 text-primary shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Simulacro Oficial{simulacroConSupuesto ? ' — Examen completo' : ''}</span>
            <Badge variant="secondary" className="text-[10px]">Penalización activa</Badge>
            {tiempoLimite && <Badge variant="outline" className="text-[10px]">{Math.round(tiempoLimite / 60)} min</Badge>}
            {simulacroConSupuesto && <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">Incluye supuesto</Badge>}
          </div>
        </div>
      )}

      {/* Cabecera contextual para repaso de errores */}
      {esRepaso && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <RefreshCw className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-amber-800">Repaso de tus errores</span>
            <Badge variant="secondary" className="text-[10px]">Preguntas que has fallado</Badge>
          </div>
        </div>
      )}

      {/* Cabecera contextual para supuesto práctico test */}
      {esSupuestoTest && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-indigo-800">Supuesto Práctico</span>
            <Badge variant="secondary" className="text-[10px]">Caso + preguntas test</Badge>
            {tiempoLimite && <Badge variant="outline" className="text-[10px]">{Math.round(tiempoLimite / 60)} min</Badge>}
          </div>
        </div>
      )}

      {(esSupuestoTest || simulacroConSupuesto) && supuestoCaso ? (
        <SupuestoTestRunner
          testId={id}
          preguntas={preguntas}
          caso={supuestoCaso}
          temaTitulo={simulacroConSupuesto ? 'Simulacro Oficial' : (supuestoCaso.titulo ?? 'Supuesto Práctico')}
          tiempoLimiteSegundos={tiempoLimite}
          preguntasCuestionario={simulacroConSupuesto ? preguntasCuestionarioConfig : undefined}
          ofimaticaStart={supuestoCaso?.ofimatica_start}
        />
      ) : (
        <TestRunner
          testId={id}
          preguntas={preguntas}
          temaTitulo={temaTitulo}
          tiempoLimiteSegundos={tiempoLimite}
        />
      )}
    </div>
    </>
  )
}
