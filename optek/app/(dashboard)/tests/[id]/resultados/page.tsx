/**
 * app/(dashboard)/tests/[id]/resultados/page.tsx — §1.11, §2.6A.9, §2.16.6
 *
 * Vista de resultados post-test.
 * Server Component: carga el test (completado=true) desde Supabase.
 *
 * §2.6A.9: Para simulacros con examen_oficial_id, muestra puntuación con
 * penalización oficial: correcta = +1, incorrecta = -1/3, en blanco = 0.
 * Coexiste con la puntuación porcentual estándar.
 *
 * §2.16.6: generateMetadata genera OG image dinámica para compartir en
 * WhatsApp, Telegram, Twitter/X. Usa /api/og con score, tema y tipo.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CitationBadge } from '@/components/shared/CitationBadge'
import { ExplicarErroresPanel } from '@/components/simulacros/ExplicarErroresPanel'
// InformeSimulacroPanel removed — will be repositioned as study roadmap in dashboard
import { CheckCircle2, XCircle, Clock, BarChart3, TrendingUp, Trophy, BookOpen, Calendar } from 'lucide-react'
import type { Pregunta } from '@/types/ai'
import { ShareButton } from '@/components/shared/ShareButton'
import { StickyAnalysisCTA } from '@/components/shared/StickyAnalysisCTA'
import { PostTestConversionTrigger } from '@/components/tests/PostTestConversionTrigger'
import { calcularNotaSimulacro } from '@/lib/utils/simulacro-ranking'
import { parseScoringConfig, describePenalizacion, calcularEjercicio } from '@/lib/utils/scoring'
import { getAniosConvocatoriaBatch } from '@/lib/utils/cross-reference'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// ─── §2.16.6 — generateMetadata con OG dinámica ───────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('tests_generados')
    .select('puntuacion, tipo, examen_oficial_id, temas(titulo)')
    .eq('id', id)
    .eq('completado', true)
    .single()

  if (!data) return {}

  const score = data.puntuacion ?? 0
  const esSimulacro = data.tipo === 'simulacro' && !!data.examen_oficial_id
  const tipo = esSimulacro ? 'simulacro' : 'test'
  const tema = esSimulacro
    ? 'Simulacro Oficial INAP'
    : ((data.temas as { titulo: string } | null)?.titulo ?? '')

  const ogUrl = `${APP_URL}/api/og?score=${score}&tema=${encodeURIComponent(tema)}&tipo=${tipo}`

  return {
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogUrl],
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPuntuacionColor(p: number): string {
  if (p >= 70) return 'text-green-600'
  if (p >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getPuntuacionLabel(p: number): string {
  if (p >= 80) return 'Excelente'
  if (p >= 70) return 'Bueno'
  if (p >= 50) return 'Aprobado'
  if (p >= 40) return 'Mejorable'
  return 'A practicar más'
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TestData {
  id: string
  preguntas: Pregunta[]
  respuestas_usuario: (number | null)[]
  puntuacion: number
  tiempo_segundos: number | null
  tipo?: string
  examen_oficial_id?: string | null
  tema_id?: string | null
  temas: { titulo: string } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResultadosPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // También fetch tipo, examen_oficial_id y tema_id para penalización, ranking y cross-reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tests_generados')
    .select('id, preguntas, respuestas_usuario, puntuacion, tiempo_segundos, tipo, examen_oficial_id, tema_id, temas(titulo)')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('completado', true)
    .single()

  if (error || !data) notFound()

  const test = data as unknown as TestData

  // ── Check paid access for PostTestConversionTrigger ────────────────────────
  const serviceSupabase = await createServiceClient()
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const hasPaidAccess = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  // ── Fetch scoring_config from oposición ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = oposicionId
    ? await (serviceSupabase as any)
        .from('oposiciones')
        .select('scoring_config, slug')
        .eq('id', oposicionId)
        .single()
    : { data: null }
  const scoringConfig = parseScoringConfig((opoData as { scoring_config?: unknown })?.scoring_config)
  const oposicionSlug = (opoData as { slug?: string })?.slug ?? undefined
  const penalizaDesc = describePenalizacion(scoringConfig)

  // Free corrector usage for nudge
  const { data: profileData } = await serviceSupabase
    .from('profiles')
    .select('free_corrector_used')
    .eq('id', user.id)
    .single()
  const freeCorrectorUsed = (profileData as { free_corrector_used?: number } | null)?.free_corrector_used ?? 0
  const freeAnalysisRemaining = Math.max(0, 2 - freeCorrectorUsed)

  const preguntas = test.preguntas
  const respuestas = test.respuestas_usuario ?? []
  const puntuacion = test.puntuacion ?? 0
  const esSimulacroOficial = test.tipo === 'simulacro' && !!test.examen_oficial_id
  const esRepaso = test.tipo === 'repaso_errores'
  const temaTitulo = esSimulacroOficial
    ? 'Simulacro Oficial INAP'
    : esRepaso
    ? 'Repaso de errores'
    : (test.temas?.titulo ?? 'Test de práctica')

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
  const errores = preguntas.filter(
    (p, i) => respuestas[i] !== null && respuestas[i] !== p.correcta
  ).length
  const sinResponder = preguntas.filter((_, i) => respuestas[i] === null).length

  // ── Puntuación con penalización configurable (§0.3 + §2.6A.9 + GAP-3) ─────
  // Uses calcularEjercicio from scoring engine for consistent calculation
  const ejConfig = scoringConfig?.ejercicios?.[0]
  const ejercicioResult = esSimulacroOficial && ejConfig
    ? calcularEjercicio(aciertos, errores, sinResponder, ejConfig)
    : null
  const notaConPenalizacion = ejercicioResult?.puntosDirectos ?? (
    esSimulacroOficial
      ? Math.max(0, aciertos - errores * (1 / 3))
      : null
  )
  const notaConPenalizacionSobre100 = notaConPenalizacion !== null
    ? Math.round((notaConPenalizacion / preguntas.length) * 100 * 10) / 10
    : null

  const preguntasErroneas = preguntas
    .map((p, i) => ({ pregunta: p, index: i, respuesta: respuestas[i] }))
    .filter(({ pregunta, respuesta }) => respuesta !== null && respuesta !== pregunta.correcta)

  const tiempoStr = test.tiempo_segundos
    ? `${Math.floor(test.tiempo_segundos / 60)}m ${test.tiempo_segundos % 60}s`
    : null

  // ── Desglose por dificultad (disponible desde v1.8.0) ─────────────────────
  type Nivel = 'facil' | 'media' | 'dificil'
  const dificultadStats: Record<Nivel, { total: number; aciertos: number }> = {
    facil: { total: 0, aciertos: 0 },
    media: { total: 0, aciertos: 0 },
    dificil: { total: 0, aciertos: 0 },
  }
  let tieneDificultad = false
  preguntas.forEach((p, i) => {
    const nivel = p.dificultad as Nivel | undefined
    if (!nivel) return
    tieneDificultad = true
    dificultadStats[nivel].total++
    if (respuestas[i] === p.correcta) dificultadStats[nivel].aciertos++
  })
  const nivelesConDatos = (Object.keys(dificultadStats) as Nivel[]).filter(
    (n) => dificultadStats[n].total > 0
  )

  // ── §2.6.3 — Desglose por tema (solo para simulacros con temaId en preguntas) ──
  const temaStats = new Map<string, { titulo: string; total: number; aciertos: number }>()
  preguntas.forEach((p, i) => {
    if (!p.temaId || !p.temaTitulo) return
    if (!temaStats.has(p.temaId)) {
      temaStats.set(p.temaId, { titulo: p.temaTitulo, total: 0, aciertos: 0 })
    }
    const stat = temaStats.get(p.temaId)!
    stat.total++
    if (respuestas[i] === p.correcta) stat.aciertos++
  })
  // Sort by percentage ascending (worst topics first) — at most 10 for readability
  const temaStatsArr = [...temaStats.entries()]
    .map(([temaId, stats]) => ({ temaId, ...stats }))
    .sort((a, b) => {
      const pctA = a.total > 0 ? a.aciertos / a.total : 1
      const pctB = b.total > 0 ? b.aciertos / b.total : 1
      return pctA - pctB
    })
    .slice(0, 10)
  const tieneTemaStats = temaStatsArr.length >= 2

  // ── §2.25.2 — ¿Habría aprobado? (solo simulacros oficiales) ───────────────
  let examenAnio: number | null = null
  if (esSimulacroOficial && test.examen_oficial_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: examenData } = await (supabase as any)
      .from('examenes_oficiales')
      .select('anio')
      .eq('id', test.examen_oficial_id)
      .single()
    examenAnio = (examenData as { anio: number } | null)?.anio ?? null
  }
  const rankingResult = esSimulacroOficial
    ? calcularNotaSimulacro(aciertos, errores, preguntas.length, examenAnio)
    : null

  // ── §2.25.3 — Referencia cruzada convocatorias ───────────────────────────
  // Collect temaIds to look up (simulacro temas + regular test tema_id)
  const temaIdsParaCrossRef = new Set<string>()
  temaStatsArr.forEach(({ temaId }) => { if (temaId) temaIdsParaCrossRef.add(temaId) })
  if (test.tema_id) temaIdsParaCrossRef.add(test.tema_id)
  const crossRefAnios = await getAniosConvocatoriaBatch([...temaIdsParaCrossRef])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20 md:pb-12">
      {/* Cabecera simulacro oficial */}
      {esSimulacroOficial && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <Trophy className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium">Simulacro Oficial INAP</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">Resultado oficial</Badge>
        </div>
      )}

      {/* Puntuación prominente */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {temaTitulo}
        </p>
        <div className={`text-6xl font-extrabold tabular-nums ${getPuntuacionColor(puntuacion)}`}>
          {puntuacion}%
        </div>
        <p className="text-lg font-semibold text-foreground">
          {getPuntuacionLabel(puntuacion)}
        </p>
        <p className="text-sm text-muted-foreground">
          {aciertos} aciertos · {errores} errores · {sinResponder} sin responder
        </p>
      </div>

      {/* Puntuación con penalización — solo para simulacros oficiales */}
      {esSimulacroOficial && ejercicioResult && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Puntuación oficial con penalización
            {ejConfig && scoringConfig && scoringConfig.ejercicios.length > 1
              ? ` — ${ejConfig.nombre}`
              : ''}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-amber-700 tabular-nums">
                {ejercicioResult.notaSobreMax.toFixed(2)}
              </p>
              <p className="text-xs text-amber-600">puntos sobre {ejConfig!.max}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums ${getPuntuacionColor(notaConPenalizacionSobre100 ?? 0)}`}>
                {notaConPenalizacionSobre100}%
              </p>
              <p className="text-xs text-muted-foreground">nota sobre 100</p>
            </div>
          </div>
          {ejConfig!.min_aprobado !== null && (
            <div className={`flex items-center gap-2 text-xs font-medium ${
              ejercicioResult.aprobado ? 'text-green-700' : 'text-red-700'
            }`}>
              {ejercicioResult.aprobado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {ejercicioResult.aprobado
                ? `Superas el mínimo eliminatorio (${ejConfig!.min_aprobado})`
                : `No alcanzas el mínimo eliminatorio (${ejConfig!.min_aprobado}). Necesitas ${(ejConfig!.min_aprobado - ejercicioResult.notaSobreMax).toFixed(2)} puntos más.`}
            </div>
          )}
          <p className="text-[11px] text-amber-700 border-t border-amber-200 pt-2">
            {penalizaDesc}
          </p>
        </div>
      )}

      {/* §2.25.2 — ¿Habrías aprobado? */}
      {rankingResult && (
        <div className={`rounded-xl border p-4 space-y-2 ${
          rankingResult.habriaProbado
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
        }`}>
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 shrink-0 ${rankingResult.habriaProbado ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-xs font-semibold uppercase tracking-wide ${rankingResult.habriaProbado ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              ¿Habrías aprobado en {rankingResult.anio}?
            </p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-3xl font-extrabold tabular-nums ${rankingResult.habriaProbado ? 'text-green-700' : 'text-red-700'}`}>
                {rankingResult.habriaProbado ? '✓ SÍ' : '✗ NO'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tu nota: <span className="font-semibold">{rankingResult.tuNota.toFixed(2)}/10</span>
                {' · '}Corte {rankingResult.anio}: <span className="font-semibold">{rankingResult.corteOficial}/10</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold tabular-nums ${rankingResult.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {rankingResult.diferencia >= 0 ? '+' : ''}{rankingResult.diferencia.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">puntos vs corte</p>
            </div>
          </div>
          <p className={`text-xs border-t pt-2 ${rankingResult.habriaProbado ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200'}`}>
            {rankingResult.habriaProbado
              ? `¡Enhorabuena! Habrías entrado entre las ${rankingResult.plazas.toLocaleString('es-ES')} plazas de la convocatoria ${rankingResult.anio}.`
              : `Te faltan ${Math.abs(rankingResult.diferencia).toFixed(2)} puntos para alcanzar el corte de ${rankingResult.anio}. ¡Sigue practicando!`}
          </p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{aciertos}</p>
            <p className="text-xs text-muted-foreground">Aciertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{errores}</p>
            <p className="text-xs text-muted-foreground">Errores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
            <BarChart3 className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{preguntas.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por dificultad — disponible desde prompt v1.8.0 */}
      {tieneDificultad && nivelesConDatos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desglose por dificultad
            </h2>
          </div>
          <div className="grid gap-2">
            {nivelesConDatos.map((nivel) => {
              const { total, aciertos } = dificultadStats[nivel]
              const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0
              const labelMap: Record<Nivel, string> = {
                facil: 'Fácil',
                media: 'Media',
                dificil: 'Difícil',
              }
              const colorMap: Record<Nivel, string> = {
                facil: 'bg-green-500',
                media: 'bg-amber-500',
                dificil: 'bg-red-500',
              }
              return (
                <div key={nivel} className="flex items-center gap-3">
                  <span className="w-14 text-xs font-medium text-muted-foreground">
                    {labelMap[nivel]}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${colorMap[nivel]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-xs text-right text-muted-foreground tabular-nums">
                    {aciertos}/{total} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* §2.6.3 — Desglose por tema (solo simulacros con suficientes datos) */}
      {esSimulacroOficial && tieneTemaStats && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Desglose por tema — de peor a mejor
            </h2>
          </div>
          <div className="grid gap-3">
            {temaStatsArr.map(({ temaId, titulo, total, aciertos }) => {
              const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0
              const barColor =
                pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
              const aniosCrossRef = crossRefAnios.get(temaId) ?? []
              return (
                <div key={titulo}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="w-full sm:w-36 text-xs text-muted-foreground truncate shrink-0" title={titulo}>
                      {titulo}
                    </span>
                    <div className="flex items-center gap-2 w-full sm:flex-1">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-20 sm:w-24 text-xs text-right text-muted-foreground tabular-nums shrink-0">
                        {aciertos}/{total} ({pct}%)
                      </span>
                    </div>
                  </div>
                  {aniosCrossRef.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1 sm:pl-[calc(9rem+0.75rem)]">
                      Apareció en: {aniosCrossRef.join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Solo se muestran los temas de las preguntas mapeadas del examen oficial.
          </p>
        </section>
      )}

      {/* §2.25.3 — Referencia cruzada para tests normales (no simulacro) */}
      {!esSimulacroOficial && test.tema_id && (() => {
        const aniosCrossRef = crossRefAnios.get(test.tema_id!)
        if (!aniosCrossRef || aniosCrossRef.length === 0) return null
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Este tema ha aparecido en exámenes INAP de:{' '}
              <span className="font-medium text-foreground">{aniosCrossRef.join(', ')}</span>
            </span>
          </div>
        )
      })()}

      {/* Tiempo si está disponible */}
      {tiempoStr && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Tiempo total: {tiempoStr}</span>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/tests">Nuevo test</Link>
        </Button>
        <ShareButton
          score={puntuacion}
          tema={temaTitulo}
          nombre={user.user_metadata?.full_name as string | undefined}
          tipo={esSimulacroOficial ? 'simulacro' : 'test'}
          testId={id}
        />
      </div>

      {/* PostTestConversionTrigger — free users see conversion CTA, paid see motivational */}
      {!esRepaso && (
        <PostTestConversionTrigger
          variant={hasPaidAccess ? 'paid_post_test' : 'free_post_test'}
          score={puntuacion}
          temaTitulo={temaTitulo}
          passingThreshold={70}
        />
      )}

      {/* Panel de análisis socrático IA — ANTES de las preguntas falladas */}
      {preguntasErroneas.length > 0 && (
        <div id="analisis-ia">
          <ExplicarErroresPanel
            testId={id}
            numErrores={preguntasErroneas.length}
            opciones={preguntas.map((p) => [...p.opciones])}
          />
        </div>
      )}

      {/* Preguntas falladas — muestra correcta/incorrecta, SIN explicación */}
      {preguntasErroneas.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">
            Preguntas incorrectas ({preguntasErroneas.length})
          </h2>
          <div className="space-y-4">
            {preguntasErroneas.map(({ pregunta, index, respuesta }) => (
              <Card key={index} className="border-red-200">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug min-w-0">
                      <span className="text-muted-foreground mr-2">P{index + 1}.</span>
                      {pregunta.enunciado}
                    </p>
                    {pregunta.cita && (
                      <CitationBadge
                        status="verified"
                        ley={pregunta.cita.ley}
                        articulo={pregunta.cita.articulo}
                        className="shrink-0"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {/* Tu respuesta */}
                  {respuesta !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-red-700">
                        Tu respuesta:{' '}
                        <span className="font-medium">{pregunta.opciones[respuesta]}</span>
                      </span>
                    </div>
                  )}
                  {/* Respuesta correcta */}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-green-700">
                      Correcta:{' '}
                      <span className="font-medium">{pregunta.opciones[pregunta.correcta]}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Si todo correcto (sin errores NI preguntas sin responder) */}
      {preguntasErroneas.length === 0 && sinResponder === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-2">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <p className="font-semibold text-green-800">¡Test perfecto!</p>
          <p className="text-sm text-green-700">
            Has respondido correctamente todas las preguntas.
          </p>
        </div>
      )}

      {/* Sticky mobile CTA — visible solo cuando el panel IA está fuera del viewport */}
      {preguntasErroneas.length > 0 && (
        <StickyAnalysisCTA numErrores={preguntasErroneas.length} />
      )}
    </div>
  )
}
