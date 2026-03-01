/**
 * app/(dashboard)/tests/[id]/page.tsx — §1.10, §2.6A.4
 *
 * Carga el test desde Supabase y renderiza TestRunner (Client Component).
 * Si el test ya está completado, redirige a la vista de resultados.
 * Si el test es un simulacro oficial (examen_oficial_id IS NOT NULL),
 * muestra una cabecera contextual "Simulacro Oficial INAP".
 */

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestRunner } from '@/components/tests/TestRunner'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import type { Pregunta } from '@/types/ai'

interface TestDetailPageProps {
  params: Promise<{ id: string }>
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
    .select('id, preguntas, completado, tipo, examen_oficial_id, tema_id, temas(titulo)')
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
  const temaTitulo = esSimulacro
    ? 'Simulacro Oficial INAP'
    : ((test.temas as { titulo: string } | null)?.titulo ?? 'Test de práctica')

  // §2.6.2 — Tiempo límite: 90 min para simulacros, sin límite para tests de práctica
  const tiempoLimite = esSimulacro ? 90 * 60 : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Cabecera contextual para simulacros oficiales */}
      {esSimulacro && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <Trophy className="h-4 w-4 text-primary shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Simulacro Oficial INAP</span>
            <Badge variant="secondary" className="text-[10px]">Penalización activa</Badge>
            <Badge variant="outline" className="text-[10px]">90 min</Badge>
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
  )
}
