/**
 * app/(dashboard)/simulacros/page.tsx — §2.6A.2
 *
 * Grid de convocatorias oficiales disponibles para simulacro.
 *
 * Server Component: carga examenes_oficiales de Supabase.
 * Si no hay exámenes cargados, muestra empty state informativo.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Simulacros INAP' }
import Link from 'next/link'
import { DEFAULT_OPOSICION_ID } from '@/lib/freemium'
import { SimulacroCard } from '@/components/simulacros/SimulacroCard'
import { SimulacroMixtoCard } from '@/components/simulacros/SimulacroMixtoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Info, FileText, Sparkles, ArrowRight, Layers, BookOpen } from 'lucide-react'

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

  // Get profile + check premium (single query, scoped by oposición)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileFlags } = await (supabase as any)
    .from('profiles')
    .select('is_founder, is_admin, oposicion_id')
    .eq('id', user.id)
    .single()
  const flags = profileFlags as { is_founder?: boolean; is_admin?: boolean; oposicion_id?: string } | null
  const userOposicionId = flags?.oposicion_id ?? DEFAULT_OPOSICION_ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: purchaseCount } = await (supabase as any)
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('oposicion_id', userOposicionId)
  const isPremium = (purchaseCount ?? 0) > 0 || flags?.is_founder === true || flags?.is_admin === true

  // Free simulacro quota
  let freeSimUsed = 0
  if (!isPremium) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: simProfile } = await (supabase as any)
      .from('profiles')
      .select('free_simulacro_used')
      .eq('id', user.id)
      .single()
    freeSimUsed = (simProfile as { free_simulacro_used?: number } | null)?.free_simulacro_used ?? 0
  }
  const freeSimRemaining = Math.max(0, 3 - freeSimUsed)

  // Cargar examenes SOLO de la oposición del usuario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (supabase as any).from('examenes_oficiales')
  const { data: examenes } = await examenesTable
    .select('id, anio, convocatoria, fuente_url, activo')
    .eq('activo', true)
    .eq('oposicion_id', userOposicionId)
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
  const totalPreguntasCombinadas = examenesConCount.reduce((sum, ex) => sum + ex.numPreguntas, 0)

  // Check if user's oposición includes supuesto práctico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoFeatures } = await (supabase as any)
    .from('oposiciones')
    .select('features, scoring_config')
    .eq('id', userOposicionId)
    .single()
  const features = (opoFeatures as { features?: Record<string, boolean>; scoring_config?: { ejercicios?: Array<{ nombre?: string; preguntas?: number; minutos?: number }>; minutos_total?: number } } | null)
  const hasSupuestoPractico = features?.features?.supuesto_practico === true
  const hasSupuestoTest = features?.features?.supuesto_test === true
  const hasPsicotecnicos = features?.features?.psicotecnicos === true
  // Number of questions per exercise from scoring_config
  const preguntasEjercicio1 = features?.scoring_config?.ejercicios?.[0]?.preguntas ?? 100
  const preguntasSupuesto = features?.scoring_config?.ejercicios?.find(
    (e) => e.nombre?.toLowerCase().includes('supuesto') || e.nombre?.toLowerCase().includes('práctico')
  )?.preguntas ?? 20
  // Penalización description
  const penaliza = features?.scoring_config?.ejercicios?.[0]?.preguntas !== undefined
  const penalizacionDesc = penaliza ? `Penalización real: incorrecta descuenta según la fórmula oficial del examen.` : undefined
  // "Examen completo" available when oposición has both simulacros (oficial questions) AND supuesto test
  const hasExamenCompleto = hasSupuestoTest && hayExamenes

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

      {/* Aviso de simulacro — solo free users */}
      {!isPremium && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {freeSimRemaining > 0 ? (
              <>Tienes <strong>1 simulacro completo gratis</strong> — examen real del INAP con todas las preguntas y timer oficial. Simulacros ilimitados con el Pack Oposición.</>
            ) : (
              <>Ya has realizado tu simulacro gratuito. <strong>Desbloquea simulacros ilimitados</strong> con el Pack Oposición.</>
            )}
          </p>
        </div>
      )}

      {/* Banner supuesto práctico — solo oposiciones que lo tienen (A2 GACE) */}
      {hasSupuestoPractico && (
        <Card className="border-emerald-300/40 bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-transparent">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Supuesto Práctico</h3>
                  <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">2º ejercicio</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  El examen GACE incluye un supuesto práctico a desarrollar (150 min, 5 cuestiones). La IA genera un caso realista y corrige tu respuesta con la rúbrica oficial del INAP.
                </p>
                <Button asChild size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white mt-1">
                  <Link href="/supuesto-practico">
                    <Sparkles className="h-3.5 w-3.5" />
                    Practicar supuesto práctico
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* §2.5d — Estructura del examen (múltiples ejercicios) */}
      {(() => {
        const ejercicios = features?.scoring_config?.ejercicios
        const minTotal = features?.scoring_config?.minutos_total
        if (!ejercicios || ejercicios.length <= 1) return null

        return (
          <Card className="border-indigo-300/40 bg-gradient-to-r from-indigo-50 to-indigo-50/30 dark:from-indigo-950/20 dark:to-transparent">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 shrink-0">
                  <Layers className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Estructura del examen</h3>
                    <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">
                      {ejercicios.length} ejercicios{minTotal ? ` · ${minTotal} min` : ''}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {ejercicios.map((ej, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-900/40 rounded px-1.5 py-0.5 text-indigo-700">{i + 1}</span>
                        <span className="font-medium">{ej.nombre ?? `Ejercicio ${i + 1}`}</span>
                        <span className="text-muted-foreground">
                          {ej.preguntas ? `${ej.preguntas}q` : ''}{ej.minutos ? ` · ${ej.minutos} min` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    El simulacro incluye ambas partes con el tiempo total del examen real.
                    Para practicar cada parte por separado:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Link href="/tests">
                        <BookOpen className="h-3.5 w-3.5" />
                        Practicar Cuestionario
                      </Link>
                    </Button>
                    {hasSupuestoTest && (
                      <Button asChild size="sm" variant="outline" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <Link href="/supuesto-test">
                          <FileText className="h-3.5 w-3.5" />
                          Practicar Supuesto
                        </Link>
                      </Button>
                    )}
                    {hasSupuestoPractico && (
                      <Button asChild size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Link href="/supuesto-practico">
                          <Sparkles className="h-3.5 w-3.5" />
                          Supuesto (desarrollo)
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {hayExamenes ? (
        <div className="space-y-6">
          {/* §2.6.1 — Simulacro Mixto destacado (todas las convocatorias) */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
              Recomendado
            </h2>
            <SimulacroMixtoCard
              totalPreguntas={totalPreguntasCombinadas}
              numConvocatorias={examenesConCount.length}
              hasPsicotecnicos={hasPsicotecnicos}
              preguntasExamenCompleto={preguntasEjercicio1}
              hasSupuestoTest={hasSupuestoTest}
              preguntasSupuesto={preguntasSupuesto}
              penalizacionDesc={penalizacionDesc}
            />
          </div>

          {/* Convocatorias por año */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
              Por convocatoria
            </h2>
            <div className="space-y-3">
              {examenesConCount.map((examen) => (
                <SimulacroCard key={examen.id} examen={examen} hasPsicotecnicos={hasPsicotecnicos} preguntasExamenCompleto={preguntasEjercicio1} hasSupuestoTest={hasSupuestoTest} preguntasSupuesto={preguntasSupuesto} penalizacionDesc={penalizacionDesc} />
              ))}
            </div>
          </div>
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
              { label: '1 simulacro gratis', desc: 'Ilimitados con Premium' },
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
