/**
 * app/(dashboard)/tests/[id]/resultados/page.tsx — §1.11, §2.6A.9
 *
 * Vista de resultados post-test.
 * Server Component: carga el test (completado=true) desde Supabase.
 *
 * §2.6A.9: Para simulacros con examen_oficial_id, muestra puntuación con
 * penalización oficial: correcta = +1, incorrecta = -1/3, en blanco = 0.
 * Coexiste con la puntuación porcentual estándar.
 */

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CitationBadge } from '@/components/shared/CitationBadge'
import { ExplicarErroresPanel } from '@/components/simulacros/ExplicarErroresPanel'
import { CheckCircle2, XCircle, Clock, BarChart3, TrendingUp, Trophy } from 'lucide-react'
import type { Pregunta } from '@/types/ai'
import { ShareButton } from '@/components/shared/ShareButton'

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

  // También fetch tipo y examen_oficial_id para §2.6A.9 (penalización)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tests_generados')
    .select('id, preguntas, respuestas_usuario, puntuacion, tiempo_segundos, tipo, examen_oficial_id, temas(titulo)')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('completado', true)
    .single()

  if (error || !data) notFound()

  const test = data as unknown as TestData
  const preguntas = test.preguntas
  const respuestas = test.respuestas_usuario ?? []
  const puntuacion = test.puntuacion ?? 0
  const esSimulacroOficial = test.tipo === 'simulacro' && !!test.examen_oficial_id
  const temaTitulo = esSimulacroOficial
    ? 'Simulacro Oficial INAP'
    : (test.temas?.titulo ?? 'Test de práctica')

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
  const errores = preguntas.filter(
    (p, i) => respuestas[i] !== null && respuestas[i] !== p.correcta
  ).length
  const sinResponder = preguntas.filter((_, i) => respuestas[i] === null).length

  // ── Puntuación con penalización oficial (§2.6A.9) ──────────────────────────
  // Correcta = +1 punto, Incorrecta = -1/3 punto, En blanco = 0
  // Solo se aplica en simulacros oficiales (examen_oficial_id IS NOT NULL)
  const notaConPenalizacion = esSimulacroOficial
    ? Math.max(0, aciertos - errores / 3)
    : null
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
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
      {esSimulacroOficial && notaConPenalizacion !== null && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Puntuación oficial con penalización
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-amber-700 tabular-nums">
                {notaConPenalizacion.toFixed(2)}
              </p>
              <p className="text-xs text-amber-600">puntos sobre {preguntas.length}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums ${getPuntuacionColor(notaConPenalizacionSobre100 ?? 0)}`}>
                {notaConPenalizacionSobre100}%
              </p>
              <p className="text-xs text-muted-foreground">nota sobre 100</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-700 border-t border-amber-200 pt-2">
            Fórmula oficial: correcta +1 · incorrecta -1/3 · en blanco 0
          </p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
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
        <Button variant="outline" asChild>
          <Link href="/corrector">Prueba el corrector</Link>
        </Button>
        <ShareButton
          score={puntuacion}
          tema={temaTitulo}
          nombre={user.user_metadata?.full_name as string | undefined}
          tipo={esSimulacroOficial ? 'simulacro' : 'test'}
          testId={id}
        />
      </div>

      {/* §2.6A.7 — Panel de explicación IA para simulacros oficiales */}
      {esSimulacroOficial && preguntasErroneas.length > 0 && (
        <ExplicarErroresPanel
          testId={id}
          numErrores={preguntasErroneas.length}
          opciones={preguntas.map((p) => [...p.opciones])}
        />
      )}

      {/* Preguntas falladas */}
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
                    <p className="text-sm font-medium leading-snug">
                      <span className="text-muted-foreground mr-2">P{index + 1}.</span>
                      {pregunta.enunciado}
                    </p>
                    {pregunta.cita && (
                      <CitationBadge
                        status="verified"
                        ley={pregunta.cita.ley}
                        articulo={pregunta.cita.articulo}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
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
                  {/* Justificación */}
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                    {pregunta.explicacion}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Si todo correcto */}
      {preguntasErroneas.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-2">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <p className="font-semibold text-green-800">¡Test perfecto!</p>
          <p className="text-sm text-green-700">
            Has respondido correctamente todas las preguntas.
          </p>
        </div>
      )}
    </div>
  )
}
