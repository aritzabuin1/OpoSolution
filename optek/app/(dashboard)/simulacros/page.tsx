/**
 * app/(dashboard)/simulacros/page.tsx — §2.6A.2
 *
 * Grid de convocatorias oficiales disponibles para simulacro.
 *
 * Server Component: carga examenes_oficiales de Supabase.
 * Si no hay exámenes cargados, muestra empty state informativo.
 */

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

import Link from 'next/link'
import { DEFAULT_OPOSICION_ID } from '@/lib/freemium'
import { getOposicionDisplay } from '@/lib/utils/oposicion-display'
import { SimulacroCard } from '@/components/simulacros/SimulacroCard'
import { SimulacroMixtoCard } from '@/components/simulacros/SimulacroMixtoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Info, FileText, Sparkles, ArrowRight, Layers, BookOpen, Clock } from 'lucide-react'

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
    .select('is_admin, oposicion_id')
    .eq('id', user.id)
    .single()
  const flags = profileFlags as { is_admin?: boolean; oposicion_id?: string } | null
  const userOposicionId = flags?.oposicion_id ?? DEFAULT_OPOSICION_ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: purchaseCount } = await (supabase as any)
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('oposicion_id', userOposicionId)
  const isPremium = (purchaseCount ?? 0) > 0 || flags?.is_admin === true

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

  // Cargar examenes SOLO de la oposición del usuario (service client para bypass RLS cache issues)
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const examenesTable = (serviceSupabase as any).from('examenes_oficiales')
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
        const pregTable = (serviceSupabase as any).from('preguntas_oficiales')
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
  let totalPreguntasCombinadas = examenesConCount.reduce((sum, ex) => sum + ex.numPreguntas, 0)

  // If no official exams, count free_question_bank as fallback for simulacro mixto
  let bankFallbackCount = 0
  if (!hayExamenes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bankRows } = await (serviceSupabase as any)
      .from('free_question_bank')
      .select('preguntas')
      .eq('oposicion_id', userOposicionId)
    for (const row of bankRows ?? []) {
      const pregs = typeof row.preguntas === 'string' ? JSON.parse(row.preguntas) : row.preguntas
      bankFallbackCount += Array.isArray(pregs) ? pregs.length : 0
    }
    totalPreguntasCombinadas = bankFallbackCount
  }

  // Check if user's oposición includes supuesto práctico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoFeatures } = await (supabase as any)
    .from('oposiciones')
    .select('features, scoring_config, rama, slug')
    .eq('id', userOposicionId)
    .single()
  const features = (opoFeatures as { features?: Record<string, boolean>; scoring_config?: { ejercicios?: Array<{ nombre?: string; preguntas?: number; minutos?: number; tipo_ejercicio?: string }>; minutos_total?: number; num_opciones?: number }; rama?: string; slug?: string } | null)
  const hasSupuestoPractico = features?.features?.supuesto_practico === true
  const hasSupuestoTest = features?.features?.supuesto_test === true
  const hasPsicotecnicos = features?.features?.psicotecnicos === true
  // Number of questions for the KNOWLEDGE exercise (not necessarily first)
  const conocimientosEj = features?.scoring_config?.ejercicios?.find(
    (e) => e.tipo_ejercicio === 'conocimientos' || e.nombre?.toLowerCase().includes('conocimiento') || e.nombre?.toLowerCase().includes('cuestionario')
  )
  const preguntasEjercicio1 = conocimientosEj?.preguntas ?? features?.scoring_config?.ejercicios?.[0]?.preguntas ?? 100
  // Psicotécnicos count from scoring_config
  const preguntasPsicotecnicos = features?.scoring_config?.ejercicios?.find(
    (e) => e.tipo_ejercicio === 'psicotecnicos'
  )?.preguntas ?? 30
  const preguntasSupuesto = features?.scoring_config?.ejercicios?.find(
    (e) => e.nombre?.toLowerCase().includes('supuesto') || e.nombre?.toLowerCase().includes('práctico')
  )?.preguntas ?? 20
  // Ofimática exercise (3rd exercise, only Tramitación)
  const hasOfimatica = features?.features?.ofimatica === true
  const preguntasOfimatica = features?.scoring_config?.ejercicios?.find(
    (e) => e.nombre?.toLowerCase().includes('ofimática') || e.nombre?.toLowerCase().includes('informatica') || e.nombre?.toLowerCase().includes('informática')
  )?.preguntas ?? 0
  // Ortografía + Inglés (Guardia Civil)
  const hasOrtografia = features?.features?.ortografia === true
  const preguntasOrtografia = (features?.scoring_config?.ejercicios as Array<{ nombre?: string; preguntas?: number; tipo_ejercicio?: string }> | undefined)?.find(
    (e) => e.tipo_ejercicio === 'ortografia' || e.nombre?.toLowerCase().includes('ortograf')
  )?.preguntas ?? 0
  const hasIngles = features?.features?.ingles === true
  const preguntasIngles = (features?.scoring_config?.ejercicios as Array<{ nombre?: string; preguntas?: number; tipo_ejercicio?: string }> | undefined)?.find(
    (e) => e.tipo_ejercicio === 'ingles' || e.nombre?.toLowerCase().includes('ingl')
  )?.preguntas ?? 0
  // Penalización description
  const penaliza = features?.scoring_config?.ejercicios?.[0]?.preguntas !== undefined
  const penalizacionDesc = penaliza ? `Penalización real: incorrecta descuenta según la fórmula oficial del examen.` : undefined
  // "Examen completo" available when oposición has both simulacros (oficial questions) AND supuesto test
  const hasExamenCompleto = hasSupuestoTest && hayExamenes
  const opoDisplay = getOposicionDisplay({ rama: features?.rama, slug: features?.slug })

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Simulacros de examen
            <Badge variant="secondary" className="text-xs font-normal">{opoDisplay.badgeLabel}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Practica con exámenes reales de convocatorias anteriores
          </p>
        </div>
        <Trophy className="h-7 w-7 text-primary/60 shrink-0 mt-1" />
      </div>

      {/* Estructura completa del examen — SIEMPRE visible */}
      {(() => {
        const ejercicios = features?.scoring_config?.ejercicios as Array<{
          nombre?: string; preguntas?: number; reserva?: number; minutos?: number;
          tipo_ejercicio?: string; penaliza?: boolean; ratio_penalizacion?: string;
          preguntas_variable?: boolean; descripcion?: string; simulable?: boolean;
          ruta_practica?: string; apto_no_apto?: boolean; min_aprobado?: number;
          max?: number; puntuacion_max?: number
        }> | undefined
        const minTotal = (features?.scoring_config as { minutos_total?: number })?.minutos_total
        const numOpciones = (features?.scoring_config as { num_opciones?: number })?.num_opciones ?? 4
        const puntMax = (features?.scoring_config as { puntuacion_max_oposicion?: number })?.puntuacion_max_oposicion
        const concursoMax = (features?.scoring_config as { fase_concurso_max?: number })?.fase_concurso_max
        if (!ejercicios || ejercicios.length === 0) return null

        const TIPO_TO_ROUTE: Record<string, { href: string; label: string }> = {
          conocimientos: { href: '/tests', label: 'Tests por tema' },
          psicotecnicos: { href: '/psicotecnicos', label: 'Psicotécnicos' },
          personalidad: { href: '/personalidad-policial', label: 'Personalidad' },
          entrevista: { href: '/personalidad-policial', label: 'Entrevista IA' },
          ortografia: { href: '/simulacros', label: 'En simulacro' },
          gramatica: { href: '/simulacros', label: 'En simulacro' },
          ingles: { href: '/simulacros', label: 'En simulacro' },
        }

        return (
          <Card className="border-indigo-300/40 bg-gradient-to-r from-indigo-50 to-indigo-50/30 dark:from-indigo-950/20 dark:to-transparent">
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-sm">Estructura del examen real</h3>
                {numOpciones && <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">{numOpciones} opciones</Badge>}
                {puntMax && <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">Máx. {puntMax} pts</Badge>}
                {concursoMax ? <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">Concurso: {concursoMax} pts</Badge> : null}
              </div>

              <div className="space-y-2">
                {ejercicios.map((ej, i) => {
                  const route = ej.ruta_practica
                    ? { href: ej.ruta_practica, label: 'Practicar' }
                    : TIPO_TO_ROUTE[ej.tipo_ejercicio ?? '']
                  const isSimulable = ej.simulable !== false

                  return (
                    <div key={i} className="flex items-start gap-2 text-xs rounded-md border border-indigo-100 dark:border-indigo-900/30 p-2.5">
                      <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-900/40 rounded px-1.5 py-0.5 text-indigo-700 shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{ej.nombre}</span>
                          {ej.preguntas && (
                            <span className="text-muted-foreground">
                              {ej.preguntas_variable ? '~' : ''}{ej.preguntas}{ej.reserva ? `+${ej.reserva}` : ''} preg.
                            </span>
                          )}
                          {ej.minutos ? <span className="text-muted-foreground">· {ej.minutos} min</span> : null}
                          {minTotal && i === 0 && ejercicios.filter(e => !e.minutos).length > 1 ? <span className="text-muted-foreground">· {minTotal} min total</span> : null}
                          {ej.apto_no_apto && <Badge className="bg-red-100 text-red-700 text-[9px]">Eliminatoria</Badge>}
                          {ej.penaliza && <span className="text-muted-foreground">· −{ej.ratio_penalizacion}</span>}
                          {ej.min_aprobado != null && !ej.apto_no_apto && <span className="text-muted-foreground">· mín. {ej.min_aprobado}/{ej.max ?? ej.puntuacion_max ?? '?'}</span>}
                          {!isSimulable && <Badge variant="outline" className="text-[9px] text-muted-foreground">Presencial</Badge>}
                        </div>
                        {ej.descripcion && <p className="text-muted-foreground mt-0.5">{ej.descripcion}</p>}
                      </div>
                      {isSimulable && route && (
                        <Link href={route.href} className="text-[10px] text-indigo-600 hover:underline shrink-0 mt-0.5">
                          {route.label} →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Aviso de simulacro — solo free users */}
      {!isPremium && (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            {freeSimRemaining > 0 ? (
              <>Tienes <strong>1 simulacro completo gratis</strong> — examen real {opoDisplay.tribunalDe} con todas las preguntas y timer oficial. Simulacros ilimitados con el Pack Oposición.</>
            ) : (
              <>Ya has realizado tu simulacro gratuito. <strong>Desbloquea simulacros ilimitados</strong> con el Pack Oposición.</>
            )}
          </p>
        </div>
      )}

      {/* Simulacro Mixto — siempre visible si hay preguntas (oficiales o banco) */}
      {totalPreguntasCombinadas > 0 && (
        <div className="space-y-2">
          <SimulacroMixtoCard
            totalPreguntas={totalPreguntasCombinadas}
            numConvocatorias={hayExamenes ? examenesConCount.length : 0}
            penalizacionDesc={penalizacionDesc}
          />
          {!hayExamenes && bankFallbackCount > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              No hay exámenes oficiales disponibles para esta oposición. El simulacro usa preguntas del banco de la plataforma.
            </p>
          )}
        </div>
      )}

      {/* Convocatorias por año — solo si hay exámenes oficiales */}
      {hayExamenes && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
            Por convocatoria
          </h2>
          <div className="space-y-3">
            {examenesConCount.map((examen) => (
              <SimulacroCard key={examen.id} examen={examen} hasPsicotecnicos={hasPsicotecnicos} preguntasExamenCompleto={preguntasEjercicio1} hasSupuestoTest={hasSupuestoTest} preguntasSupuesto={preguntasSupuesto} hasOfimatica={hasOfimatica} preguntasOfimatica={preguntasOfimatica} hasOrtografia={hasOrtografia} preguntasOrtografia={preguntasOrtografia} hasIngles={hasIngles} preguntasIngles={preguntasIngles} penalizacionDesc={penalizacionDesc} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state: 0 preguntas disponibles */}
      {totalPreguntasCombinadas === 0 && (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Simulacros en preparación</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Estamos cargando preguntas para esta oposición. Mientras, puedes practicar con Tests por tema.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
