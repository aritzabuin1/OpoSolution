/**
 * app/(dashboard)/supuesto-test/page.tsx — FASE 2.5c
 *
 * Landing page para el módulo de supuesto práctico en formato TEST.
 * Adapta contenido dinámicamente según la oposición del usuario.
 *
 * Free: 1 supuesto (examen oficial INAP 2024) → paywall
 * Premium: supuestos ilimitados (banco progresivo + generación IA)
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import { getSupuestoTestConfig, hasSupuestoTest } from '@/lib/ai/supuesto-test'
import { parseScoringConfig } from '@/lib/utils/scoring'
import { SupuestoTestLauncher } from '@/components/supuesto-test/SupuestoTestLauncher'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, Target, AlertTriangle, BookOpen, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Supuesto Práctico — Test',
  description: 'Practica el supuesto práctico del examen con preguntas tipo test vinculadas a un caso real.',
}

export default async function SupuestoTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('slug, nombre, scoring_config')
    .eq('id', oposicionId)
    .single()

  const slug = (opoData as { slug?: string })?.slug ?? ''
  const opoNombre = (opoData as { nombre?: string })?.nombre ?? 'tu oposición'
  const scoringConfig = parseScoringConfig((opoData as { scoring_config?: unknown })?.scoring_config)

  if (!hasSupuestoTest(slug)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center py-16">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Supuesto Práctico</h1>
        <p className="text-muted-foreground">
          Tu oposición ({opoNombre}) no incluye supuesto práctico en formato test.
        </p>
      </div>
    )
  }

  const config = getSupuestoTestConfig(slug)!
  const isPremium = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  // Check how many supuesto tests the user has done
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: supuestosDone } = await (serviceSupabase as any)
    .from('tests_generados')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('tipo', 'supuesto_test')
    .eq('oposicion_id', oposicionId)

  const hasDoneFree = !isPremium && (supuestosDone ?? 0) > 0

  // Credits + bank stats for supuesto CTA
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: profileCredits }, { count: totalBank }, { count: seenCount }] = await Promise.all([
    (serviceSupabase as any)
      .from('profiles')
      .select('corrections_balance')
      .eq('id', user.id)
      .single(),
    (serviceSupabase as any)
      .from('supuesto_bank')
      .select('id', { count: 'exact', head: true })
      .eq('oposicion_id', oposicionId),
    (serviceSupabase as any)
      .from('user_supuestos_seen')
      .select('supuesto_id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])
  const creditsBalance = (profileCredits as { corrections_balance?: number } | null)?.corrections_balance ?? 0
  const bankStats = {
    totalBank: (totalBank as number) ?? 0,
    seen: (seenCount as number) ?? 0,
    unseen: Math.max(0, ((totalBank as number) ?? 0) - ((seenCount as number) ?? 0)),
  }

  // Find exercise config for the supuesto in scoring_config
  const ejSupuesto = scoringConfig?.ejercicios.find(
    e => e.nombre.toLowerCase().includes('supuesto') || e.nombre.toLowerCase().includes('práctico')
  )

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Supuesto Práctico</h1>
          <Badge variant="secondary" className="text-xs">
            Formato test
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Practica con casos reales: un escenario narrativo + preguntas tipo test vinculadas al caso.
          Idéntico al formato del examen oficial.
        </p>
      </div>

      {/* Exam format info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <BookOpen className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold">{config.preguntasPorCaso}</p>
            <p className="text-xs text-muted-foreground">preguntas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{config.timerMinutos ?? '—'}</p>
            <p className="text-xs text-muted-foreground">
              {config.timerMinutos ? 'minutos' : 'compartido'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Target className="mx-auto h-5 w-5 text-green-500 mb-1" />
            <p className="text-2xl font-bold">{config.maxPuntos}</p>
            <p className="text-xs text-muted-foreground">pts máximo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="mx-auto h-5 w-5 text-red-500 mb-1" />
            <p className="text-2xl font-bold">{config.minAprobado}</p>
            <p className="text-xs text-muted-foreground">mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* What to expect */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            ¿Cómo funciona?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Lees un <strong>caso narrativo largo</strong> sobre una situación real</li>
            <li>Respondes <strong>{config.preguntasPorCaso} preguntas</strong> vinculadas al caso</li>
            <li>Penalización: <strong>-1/{Math.round(1 / config.penalizacion)}</strong> por error</li>
            <li>Al terminar ves tu puntuación sobre {config.maxPuntos} y si superas el mínimo ({config.minAprobado})</li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <SupuestoTestLauncher
        isPremium={isPremium}
        hasDoneFree={hasDoneFree}
        supuestosDone={supuestosDone ?? 0}
        opoNombre={opoNombre}
        creditsBalance={creditsBalance}
        bankStats={bankStats}
      />
    </div>
  )
}
