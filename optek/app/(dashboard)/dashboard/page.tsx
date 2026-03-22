/**
 * app/(dashboard)/dashboard/page.tsx — §1.13
 *
 * Dashboard principal del usuario.
 *
 * Secciones:
 *   1. Saludo + racha de días
 *   2. Stats cards (tests, nota media, racha)
 *   3. Gráfico de evolución (últimos 30 días)
 *   4. Mapa de temas (coloreados por nota, dinámico por oposición)
 *   5. Últimas actividades (tests + correcciones)
 *   6. Logros desbloqueados
 *   7. CTAs contextuales
 *
 * Server Component. Todos los datos se fetch en el servidor.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { CalendarCheck, CheckCircle2, ClipboardCheck, Flame, Layers, Star, Target, TrendingUp, Trophy } from 'lucide-react'

export const metadata: Metadata = { title: 'Mi Dashboard' }
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TopicMap } from '@/components/dashboard/TopicMap'
import { EvolutionChart } from '@/components/dashboard/EvolutionChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { LogrosGrid } from '@/components/dashboard/LogrosGrid'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { DailyBrief } from '@/components/shared/DailyBrief'
import RadarMini from '@/components/shared/RadarMini'
import { MapaDebilidades } from '@/components/shared/MapaDebilidades'
import { calcularIPR } from '@/lib/utils/ipr'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ExamCountdownBanner } from '@/components/dashboard/ExamCountdownBanner'
import { RoadmapCard } from '@/components/dashboard/RoadmapCard'
import { FounderBetaBanner } from '@/components/dashboard/FounderBetaBanner'
import { getDashboardPhase } from '@/lib/utils/dashboard-phase'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'
import { NewUserHero } from '@/components/dashboard/NewUserHero'
import { ProgressUnlockBar } from '@/components/dashboard/ProgressUnlockBar'
import { EmptyStateOverlay } from '@/components/dashboard/EmptyStateOverlay'
import { ReEngagementBanner } from '@/components/dashboard/ReEngagementBanner'
import { AIAnalysisNudge } from '@/components/dashboard/AIAnalysisNudge'
import { AnalysisStatsCard } from '@/components/dashboard/AnalysisStatsCard'

// ─── Tipos locales ─────────────────────────────────────────────────────────────

interface TestRow {
  id: string
  created_at: string
  puntuacion: number | null
  completado: boolean
  tema_id: string | null
  temas: { titulo: string; numero: number } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile — columnas estables (siempre presentes)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, oposicion_id, corrections_balance, fecha_examen')
    .eq('id', user.id)
    .single()

  // is_founder — migration 019 (best-effort: null hasta aplicar)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: founderData } = await (supabase as any)
    .from('profiles')
    .select('is_founder')
    .eq('id', user.id)
    .single() as { data: { is_founder: boolean } | null }

  // Racha + último test + onboarding — columnas de migrations 008/037 (best-effort)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rachaData } = await (supabase as any)
    .from('profiles')
    .select('racha_actual, ultimo_test_dia, onboarding_completed_at')
    .eq('id', user.id)
    .single() as { data: { racha_actual: number; ultimo_test_dia: string | null; onboarding_completed_at: string | null } | null }

  // Todos los tests completados del usuario PARA SU OPOSICIÓN ACTIVA
  const userOposicionId = profile?.oposicion_id ?? ''
  const { data: tests } = await supabase
    .from('tests_generados')
    .select('id, created_at, puntuacion, completado, tema_id, temas(titulo, numero)')
    .eq('user_id', user.id)
    .eq('completado', true)
    .eq('oposicion_id', userOposicionId)
    .order('created_at', { ascending: false })
    .limit(100) as { data: TestRow[] | null }

  // Temas de la oposición (para el mapa)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: temas } = await (supabase as any)
    .from('temas')
    .select('id, numero, titulo, bloque')
    .eq('oposicion_id', userOposicionId)
    .order('numero') as { data: { id: string; numero: number; titulo: string; bloque?: string }[] | null }

  // Flashcards pendientes de repaso hoy (migration 015 — cast necesario hasta regenerar tipos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: flashcardsPendientes } = await (supabase as any)
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('oposicion_id', userOposicionId)
    .lte('siguiente_repaso', new Date().toISOString()) as { count: number | null }

  // Reto Diario — estado de hoy (migration 020, best-effort)
  const today = new Date().toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: retoHoy } = await (supabase as any)
    .from('reto_diario')
    .select('id, num_errores, ley_nombre, articulo_numero')
    .eq('fecha', today)
    .maybeSingle() as {
      data: { id: string; num_errores: number; ley_nombre: string; articulo_numero: string } | null
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: retoDiarioResult } = retoHoy
    ? await (supabase as any)
        .from('reto_diario_resultados')
        .select('trampas_encontradas, puntuacion')
        .eq('reto_diario_id', retoHoy.id)
        .eq('user_id', user.id)
        .maybeSingle() as {
          data: { trampas_encontradas: number; puntuacion: number } | null
        }
    : { data: null }

  // Logros — tabla añadida en migration 008 (cast necesario hasta regenerar tipos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logros } = await (supabase as any)
    .from('logros')
    .select('tipo, desbloqueado_en')
    .eq('user_id', user.id)
    .order('desbloqueado_en', { ascending: false }) as {
      data: { tipo: string; desbloqueado_en: string }[] | null
    }

  // ── Derivar estadísticas ────────────────────────────────────────────────────

  const testsCompletados = tests ?? []
  const totalTests = testsCompletados.length

  // Nota media de todos los tests completados
  const notaMedia =
    totalTests > 0
      ? testsCompletados.reduce((sum, t) => sum + (t.puntuacion ?? 0), 0) / totalTests
      : null

  // Datos para gráfico (últimos 30 días, max 30 puntos)
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  const chartData = testsCompletados
    .filter((t) => new Date(t.created_at) >= hace30Dias && t.puntuacion !== null)
    .slice(0, 30)
    .reverse()
    .map((t) => ({
      fecha: t.created_at,
      puntuacion: t.puntuacion ?? 0,
      tema: t.temas?.titulo ?? 'Test',
    }))

  // Mapa de temas: nota media por tema
  const scoreByTema: Record<string, { sum: number; count: number }> = {}
  for (const test of testsCompletados) {
    if (!test.tema_id || test.puntuacion === null) continue
    if (!scoreByTema[test.tema_id]) scoreByTema[test.tema_id] = { sum: 0, count: 0 }
    scoreByTema[test.tema_id].sum += test.puntuacion
    scoreByTema[test.tema_id].count += 1
  }

  const temaScores = (temas ?? []).map((t) => {
    const score = scoreByTema[t.id]
    return {
      numero: t.numero,
      titulo: t.titulo,
      notaMedia: score ? score.sum / score.count : null,
      testsCount: score?.count ?? 0,
    }
  })

  // Actividad reciente (últimos tests)
  type Actividad =
    | { id: string; tipo: 'test'; fecha: string; titulo: string; puntuacion: number | null }

  const actividades: Actividad[] = testsCompletados.slice(0, 10).map((t) => ({
    id: t.id,
    tipo: 'test',
    fecha: t.created_at,
    titulo: t.temas?.titulo ? `Tema ${t.temas.numero}: ${t.temas.titulo}` : 'Test',
    puntuacion: t.puntuacion,
  }))

  // CTA contextual: tema con peor nota
  const temaConPeorNota = temaScores
    .filter((t) => t.notaMedia !== null && t.notaMedia < 50)
    .sort((a, b) => (a.notaMedia ?? 0) - (b.notaMedia ?? 0))[0]

  // Días para el examen
  const diasParaExamen = profile?.fecha_examen
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.fecha_examen).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null

  const nombreUsuario = profile?.full_name?.split(' ')[0] ?? 'opositor'
  const rachaActual = rachaData?.racha_actual ?? 0
  const ultimoTestDia = rachaData?.ultimo_test_dia ?? null

  // Dashboard adaptativo — fase del usuario
  const phase = getDashboardPhase(totalTests, rachaActual, ultimoTestDia)

  // Re-engagement: días sin practicar
  const diasSinPracticar = ultimoTestDia
    ? Math.floor((Date.now() - new Date(ultimoTestDia).getTime()) / (1000 * 60 * 60 * 24))
    : null

  // §2.5 — IPR: Índice Personal de Rendimiento (sin migration — cálculo puro)
  const ipr = calcularIPR(
    testsCompletados.map((t) => ({
      puntuacion: t.puntuacion ?? 0,
      created_at: t.created_at,
    })),
    rachaActual
  )

  // ── Build activity data for RoadmapCard auto-detection ────────────────────
  const testsByTema: Record<number, string[]> = {}
  for (const test of testsCompletados) {
    const num = test.temas?.numero
    if (num == null) continue
    if (!testsByTema[num]) testsByTema[num] = []
    testsByTema[num].push(test.created_at)
  }

  const roadmapActivity = {
    testsByTema,
    simulacrosCount: testsCompletados.filter(t => !t.tema_id).length,
    psicotecnicosCount: 0, // no direct data available here; heuristic
    cazatrampasCount: 0,
    flashcardsReviewed: 0,
  }

  const onboardingCompletedAt = rachaData?.onboarding_completed_at ?? null

  // Last test with errors — for AI analysis nudge deep link
  const lastTestWithErrors = testsCompletados.find(t => (t.puntuacion ?? 100) < 100)
  const lastTestWithErrorsId = lastTestWithErrors?.id ?? null
  const analysisBalance = profile?.corrections_balance ?? 0

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* ── Onboarding Tour (client-side, zero-render) ─────────────────── */}
      <OnboardingTour
        userId={user.id}
        onboardingCompletedAt={onboardingCompletedAt}
        totalTests={totalTests}
        diasParaExamen={diasParaExamen}
      />

      {/* ── -1. Exam Countdown Banner ──────────────────────────────────────── */}
      {diasParaExamen !== null && (
        <div data-tour="countdown">
          <ExamCountdownBanner
            diasRestantes={diasParaExamen}
            nombre={nombreUsuario !== 'opositor' ? nombreUsuario : undefined}
          />
        </div>
      )}

      {/* ── Founder Beta Banner ─────────────────────────────────────────── */}
      {founderData?.is_founder && <FounderBetaBanner />}

      {/* ── Re-engagement banner (lapsed users) ───────────────────────── */}
      {phase === 'lapsed' && diasSinPracticar !== null && (
        <ReEngagementBanner
          diasSinPracticar={diasSinPracticar}
          notaMedia={notaMedia}
          diasParaExamen={diasParaExamen}
        />
      )}

      {/* ── New User Hero + Progress ───────────────────────────────────── */}
      {phase === 'new' && <NewUserHero diasParaExamen={diasParaExamen} />}
      {(phase === 'new' || phase === 'starting') && (
        <ProgressUnlockBar totalTests={totalTests} />
      )}

      {/* ── 0. Daily Brief (above the fold) ──────────────────────────────── */}
      <Suspense fallback={<div className="flex justify-center py-4"><LoadingSpinner /></div>}>
        <DailyBrief
          userId={user.id}
          rachaActual={rachaActual}
          totalTests={totalTests}
          temaDebil={
            temaConPeorNota?.notaMedia != null
              ? { ...temaConPeorNota, notaMedia: temaConPeorNota.notaMedia }
              : null
          }
        />
      </Suspense>

      {/* ── AI Analysis Nudge — for users who never tried analysis ────── */}
      {totalTests >= 1 && lastTestWithErrorsId && (
        <AIAnalysisNudge lastTestWithErrorsId={lastTestWithErrorsId} />
      )}

      {/* ── 0b. Reto Diario — §2.20.9 ────────────────────────────────────── */}
      {retoHoy && (
        <Card data-tour="reto-diario" className={retoDiarioResult
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
          : 'border-primary/30 bg-primary/5'
        }>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <CalendarCheck className={`h-8 w-8 shrink-0 ${retoDiarioResult ? 'text-green-600' : 'text-primary'}`} />
              <div>
                {retoDiarioResult ? (
                  <>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Reto de hoy completado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {retoDiarioResult.trampas_encontradas}/{retoHoy.num_errores} trampas encontradas
                      {' '}— {Math.round(retoDiarioResult.puntuacion)}%
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      Reto Diario
                      <Badge className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground">NUEVO</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ¿Puedes encontrar las {retoHoy.num_errores} trampas del artículo de hoy?
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant={retoDiarioResult ? 'outline' : 'default'} className="shrink-0">
              <Link href="/reto-diario">
                {retoDiarioResult ? 'Ver resultado' : 'Jugar →'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── 0b.5 Flashcards pendientes ──────────────────────────────────── */}
      {(flashcardsPendientes ?? 0) > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  {flashcardsPendientes} flashcard{flashcardsPendientes !== 1 ? 's' : ''} pendiente{flashcardsPendientes !== 1 ? 's' : ''} de repaso
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Repasa ahora para consolidar lo aprendido
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link href="/flashcards">Repasar →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── 0c. Radar Mini — §2.14.9 ──────────────────────────────────────── */}
      <Suspense fallback={<div className="flex justify-center py-4"><LoadingSpinner /></div>}>
        <RadarMini />
      </Suspense>

      {/* ── 0d. Exam date CTA para usuarios sin fecha configurada ────────── */}
      {!profile?.fecha_examen && totalTests > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-2.5 text-sm text-muted-foreground">
          <span>¿Ya tienes fecha de examen? Configúrala para ver cuántos días te quedan.</span>
          <Link href="/cuenta" className="text-primary font-medium hover:underline shrink-0 text-xs">
            Configurar →
          </Link>
        </div>
      )}

      {/* ── 1. Cabecera ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* DashboardGreeting es Client Component para evitar hydration mismatch con getHours() */}
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardGreeting
            nombre={nombreUsuario}
            diasParaExamen={diasParaExamen}
          />
          {founderData?.is_founder && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1 text-xs">
              <Star className="h-3 w-3 fill-white" />
              Miembro Fundador
            </Badge>
          )}
        </div>

        {/* CTAs rápidos */}
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm">
            <Link href="/tests">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Generar test
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/simulacros">
              <Trophy className="w-4 h-4 mr-2" />
              Simulacros
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Stats cards ────────────────────────────────────────────────── */}
      <div data-tour="stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<ClipboardCheck className="w-5 h-5" />}
          value={totalTests}
          label="Tests realizados"
        />
        <StatsCard
          icon={<Target className="w-5 h-5" />}
          value={notaMedia !== null ? `${Math.round(notaMedia)}%` : '—'}
          label="Nota media"
          valueClassName={
            notaMedia === null
              ? undefined
              : notaMedia >= 70
              ? 'text-green-600'
              : notaMedia >= 50
              ? 'text-amber-600'
              : 'text-red-600'
          }
        />
        <StatsCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          value={rachaActual}
          label="Días seguidos"
          sub={rachaActual > 0 ? '¡Sigue así!' : 'Empieza hoy'}
          valueClassName={rachaActual >= 3 ? 'text-orange-500' : undefined}
        />
        <AnalysisStatsCard balance={analysisBalance} />
      </div>

      {/* ── 2b. IPR card — §2.5 ──────────────────────────────────────────── */}
      {ipr && phase !== 'new' && (
        <Card className={`border ${
          ipr.nivel === 'preparado' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
          : ipr.nivel === 'avanzado' ? 'border-primary/20 bg-primary/3'
          : 'border-border bg-card'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold tabular-nums ${
                  ipr.nivel === 'preparado' ? 'text-green-600'
                  : ipr.nivel === 'avanzado' ? 'text-primary'
                  : ipr.nivel === 'aprendiendo' ? 'text-amber-600'
                  : 'text-muted-foreground'
                }`}>
                  {ipr.score}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">IPR — Índice de Preparación</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize
                      bg-muted text-muted-foreground">
                      {ipr.nivel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ipr.tendencia === 'subiendo' ? '↑' : ipr.tendencia === 'bajando' ? '↓' : '→'}{' '}
                      {ipr.tendencia}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ipr.mensaje}</p>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="w-full sm:w-48 shrink-0">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ipr.nivel === 'preparado' ? 'bg-green-500'
                      : ipr.nivel === 'avanzado' ? 'bg-primary'
                      : ipr.nivel === 'aprendiendo' ? 'bg-amber-500'
                      : 'bg-muted-foreground'
                    }`}
                    style={{ width: `${ipr.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0</span>
                  <span>Aprobado: ~75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 2c. Mapa de debilidades — §2.25.1 ────────────────────────────── */}
      {temaScores.filter((t) => t.notaMedia !== null && t.testsCount >= 1).length >= 2 && (
        <MapaDebilidades temaScores={temaScores} />
      )}

      {/* ── 2d. Plan de estudio personalizado (roadmap IA) ────────────────── */}
      {totalTests >= 3 && <RoadmapCard activity={roadmapActivity} oposicionId={profile?.oposicion_id ?? undefined} />}

      {/* ── 3. Gráfico de evolución ──────────────────────────────────────── */}
      <EmptyStateOverlay locked={phase === 'new' || phase === 'starting'} message="Completa 5 tests para ver tu evolución">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolución de puntuación — últimos 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutionChart data={chartData} />
          </CardContent>
        </Card>
      </EmptyStateOverlay>

      {/* ── 4. Mapa de temas ─────────────────────────────────────────────── */}
      {temas && temas.length > 0 && (
        <EmptyStateOverlay locked={phase === 'new'} message="Haz tu primer test para ver el mapa de temario">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mapa del temario</CardTitle>
            </CardHeader>
            <CardContent>
              <TopicMap temas={temaScores} />
            </CardContent>
          </Card>
        </EmptyStateOverlay>
      )}

      {/* ── 5. Actividad + Logros (columnas) — oculto para usuarios nuevos ── */}
      {phase !== 'new' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Últimas actividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed actividades={actividades} />
            </CardContent>
          </Card>
        </div>

        {/* Logros */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🏆 Logros
                {logros && logros.length > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {logros.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogrosGrid logros={logros ?? []} />
            </CardContent>
          </Card>

        </div>
      </div>}

      {/* ── 6. Simulacros CTA ─────────────────────────────────────────────── */}
      {totalTests >= 3 && phase !== 'new' && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/3">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Ponlo a prueba con un Simulacro Oficial</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Penalización real · Exámenes oficiales · Comprueba tu nivel
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/simulacros">Ver simulacros →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
