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
import { Badge } from '@/components/ui/badge'
import { Trophy, RefreshCw } from 'lucide-react'
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
    data.tipo === 'simulacro' && data.examen_oficial_id
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
    .select('id, preguntas, completado, tipo, examen_oficial_id, tema_id, oposicion_id, temas(titulo)')
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
  const temaTitulo = esSimulacro
    ? 'Simulacro Oficial INAP'
    : esRepaso
    ? 'Repaso de errores'
    : ((test.temas as { titulo: string } | null)?.titulo ?? 'Test de práctica')

  // §BUG-SP3 — Timer dinámico desde scoring_config de la oposición
  // Cada oposición tiene distinto nº de preguntas y tiempo (C2: 100q/90min, C1: 90q/100min, etc.)
  let fullExamQuestions = 100
  let fullExamSeconds = 90 * 60
  if (test.oposicion_id) {
    const serviceSupabase = await createServiceClient()
    const { data: opoData } = await serviceSupabase
      .from('oposiciones')
      .select('scoring_config')
      .eq('id', test.oposicion_id)
      .single()
    const sc = opoData?.scoring_config as { ejercicios?: { preguntas?: number; minutos?: number | null }[]; minutos_total?: number } | null
    if (sc?.ejercicios?.[0]) {
      fullExamQuestions = sc.ejercicios[0].preguntas ?? 100
      // Usar minutos del ejercicio, o minutos_total si es compartido (C1 AGE: null por ejercicio, 100 min total)
      const minutos = sc.ejercicios[0].minutos ?? sc.minutos_total ?? 90
      fullExamSeconds = minutos * 60
    }
  }
  const tiempoLimite = esSimulacro
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
      <TestRunner
        testId={id}
        preguntas={preguntas}
        temaTitulo={temaTitulo}
        tiempoLimiteSegundos={tiempoLimite}
      />
    </div>
    </>
  )
}
