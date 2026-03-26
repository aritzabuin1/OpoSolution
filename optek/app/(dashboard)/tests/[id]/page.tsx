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

  const title =
    data.tipo === 'supuesto_test'
      ? 'Supuesto Práctico'
      : data.tipo === 'simulacro' && data.examen_oficial_id
      ? 'Simulacro INAP'
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
  const supuestoCaso = test.supuesto_caso as { titulo?: string; escenario?: string; bloques_cubiertos?: string[] } | null
  const temaTitulo = esSupuestoTest
    ? 'Supuesto Práctico'
    : esSimulacro
    ? 'Simulacro Oficial INAP'
    : esRepaso
    ? 'Repaso de errores'
    : ((test.temas as { titulo: string } | null)?.titulo ?? 'Test de práctica')

  // §BUG-SP3 — Timer dinámico desde scoring_config de la oposición
  // Cada oposición tiene distinto nº de preguntas y tiempo (C2: 100q/90min, C1: 90q/100min, etc.)
  let fullExamQuestions = 100
  let fullExamSeconds = 90 * 60
  let tiempoLimiteSupuesto: number | undefined
  if (test.oposicion_id) {
    const serviceSupabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opoData } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('scoring_config')
      .eq('id', test.oposicion_id)
      .single()
    const sc = (opoData as { scoring_config?: unknown } | null)?.scoring_config as { ejercicios?: { nombre?: string; preguntas?: number; minutos?: number | null }[]; minutos_total?: number } | null
    if (sc?.ejercicios?.[0]) {
      fullExamQuestions = sc.ejercicios[0].preguntas ?? 100
      const minutos = sc.ejercicios[0].minutos ?? sc.minutos_total ?? 90
      fullExamSeconds = minutos * 60
    }
    // For supuesto_test: use the supuesto exercise timer if available
    if (esSupuestoTest && sc?.ejercicios) {
      const ejSup = sc.ejercicios.find(e => (e.nombre?.toLowerCase().includes('supuesto') || e.nombre?.toLowerCase().includes('práctico')))
      if (ejSup?.minutos) {
        tiempoLimiteSupuesto = ejSup.minutos * 60
      }
    }
  }

  const tiempoLimite = esSupuestoTest
    ? tiempoLimiteSupuesto
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
            <span className="text-sm font-medium">Simulacro Oficial INAP</span>
            <Badge variant="secondary" className="text-[10px]">Penalización activa</Badge>
            <Badge variant="outline" className="text-[10px]">{Math.round((preguntas.length / 100) * 90)} min</Badge>
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

      {esSupuestoTest && supuestoCaso ? (
        <SupuestoTestRunner
          testId={id}
          preguntas={preguntas}
          caso={supuestoCaso}
          temaTitulo={supuestoCaso.titulo ?? 'Supuesto Práctico'}
          tiempoLimiteSegundos={tiempoLimite}
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
