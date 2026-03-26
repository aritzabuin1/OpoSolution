'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  RotateCcw,
  Info,
} from 'lucide-react'

// ─── Constants (C1 Administrativo del Estado) ────────────────────────────────

const PARTE1_MAX_PREGUNTAS = 70 // 40 legislación (bloques I+V) + 30 ofimática (bloque VI)
const PARTE2_MAX_PREGUNTAS = 20 // Supuesto práctico (bloques II, III, IV y V), 20 puntuables (+5 reserva)
const PARTE1_MAX_PUNTOS = 50
const PARTE2_MAX_PUNTOS = 50
const MINIMO_APROBADO = 25

// Historical nota de corte (convocatoria 2024 C1) — nota general corte: 47,33
const CORTE_PARTE1 = 33
const CORTE_PARTE2 = 14

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParteResult {
  puntuacion: number
  maxPuntos: number
  aprueba: boolean
  superaCorte: boolean
  porcentaje: number
}

// ─── Calculator Logic ────────────────────────────────────────────────────────

function calcularParte(
  aciertos: number,
  errores: number,
  maxPreguntas: number,
  maxPuntos: number,
  corte: number,
): ParteResult {
  const valorPregunta = maxPuntos / maxPreguntas
  const puntuacionBruta = aciertos * valorPregunta - (errores * valorPregunta) / 3
  const puntuacion = Math.max(0, Math.round(puntuacionBruta * 100) / 100)

  return {
    puntuacion,
    maxPuntos,
    aprueba: puntuacion >= MINIMO_APROBADO,
    superaCorte: puntuacion >= corte,
    porcentaje: Math.min(100, (puntuacion / maxPuntos) * 100),
  }
}

// ─── Input Component ─────────────────────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  max,
  icon: Icon,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
  icon: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
        />
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Math.max(0, Math.min(max, Number(e.target.value) || 0))
            onChange(v)
          }}
          className="w-16 rounded-md border px-2 py-1.5 text-center text-sm font-mono font-bold
            focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  )
}

// ─── Result Bar ──────────────────────────────────────────────────────────────

function ResultBar({
  label,
  result,
  corte,
  corteParte,
}: {
  label: string
  result: ParteResult
  corte: number
  corteParte: string
}) {
  const color = result.superaCorte
    ? 'bg-green-500'
    : result.aprueba
      ? 'bg-amber-500'
      : 'bg-red-500'

  const textColor = result.superaCorte
    ? 'text-green-700 dark:text-green-400'
    : result.aprueba
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-700 dark:text-red-400'

  const StatusIcon = result.superaCorte
    ? Trophy
    : result.aprueba
      ? CheckCircle2
      : XCircle

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${textColor}`} />
          <span className={`font-bold text-lg font-mono ${textColor}`}>
            {result.puntuacion.toFixed(2)}
          </span>
          <span className="text-muted-foreground text-sm">/ {result.maxPuntos}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${result.porcentaje}%` }}
        />
        {/* Minimum mark (25 pts) */}
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${(MINIMO_APROBADO / result.maxPuntos) * 100}%` }}
          title={`Mínimo: ${MINIMO_APROBADO} puntos`}
        />
        {/* Corte mark */}
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/70 border-l border-dashed"
          style={{ left: `${(corte / result.maxPuntos) * 100}%` }}
          title={`Nota de corte: ${corte}`}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-foreground/40 rounded-full" /> Mínimo: 25
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-foreground/70 rounded-full" /> Corte {corteParte}: {corte}
        </span>
        <span>{result.maxPuntos}</span>
      </div>

      {/* Status text */}
      <p className={`text-sm font-medium ${textColor}`}>
        {result.superaCorte
          ? `Superarías la nota de corte de la última convocatoria (${corte} pts)`
          : result.aprueba
            ? `Apruebas (≥25), pero no alcanzas la nota de corte (${corte} pts)`
            : `No alcanzas el mínimo de 25 puntos para aprobar esta parte`}
      </p>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CalculadoraNotaC1() {
  const [p1Aciertos, setP1Aciertos] = useState(45)
  const [p1Errores, setP1Errores] = useState(15)
  const [p2Aciertos, setP2Aciertos] = useState(14)
  const [p2Errores, setP2Errores] = useState(3)

  // Enforce max constraints
  const maxP1Errores = PARTE1_MAX_PREGUNTAS - p1Aciertos
  const maxP2Errores = PARTE2_MAX_PREGUNTAS - p2Aciertos
  const p1ErroresClamped = Math.min(p1Errores, maxP1Errores)
  const p2ErroresClamped = Math.min(p2Errores, maxP2Errores)

  const p1Blanco = PARTE1_MAX_PREGUNTAS - p1Aciertos - p1ErroresClamped
  const p2Blanco = PARTE2_MAX_PREGUNTAS - p2Aciertos - p2ErroresClamped

  const resultado1 = calcularParte(p1Aciertos, p1ErroresClamped, PARTE1_MAX_PREGUNTAS, PARTE1_MAX_PUNTOS, CORTE_PARTE1)
  const resultado2 = calcularParte(p2Aciertos, p2ErroresClamped, PARTE2_MAX_PREGUNTAS, PARTE2_MAX_PUNTOS, CORTE_PARTE2)

  const notaTotal = resultado1.puntuacion + resultado2.puntuacion
  const aprueba = resultado1.aprueba && resultado2.aprueba
  // Nota de corte general (suma de ambas partes del último aprobado con plaza)
  const CORTE_TOTAL = 47.33
  const superaCorte = notaTotal >= CORTE_TOTAL && resultado1.aprueba && resultado2.aprueba

  const reset = useCallback(() => {
    setP1Aciertos(45)
    setP1Errores(15)
    setP2Aciertos(14)
    setP2Errores(3)
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
        <span>/</span>
        <Link href="/herramientas" className="hover:text-foreground transition-colors">Herramientas</Link>
        <span>/</span>
        <span className="text-foreground">Calculadora de nota C1</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <Badge className="mb-3 gap-1">
          <Calculator className="h-3 w-3" />
          Herramienta gratuita
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
          Calculadora de nota con penalización -1/3
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Calcula tu nota del examen de <strong className="text-foreground">Administrativo del Estado (C1)</strong> con
          la penalización -1/3 oficial. Introduce tus aciertos y errores de cada parte y descubre si apruebas.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ─── Inputs ──────────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Parte 1 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Primera parte — Cuestionario</span>
                <Badge variant="outline" className="font-mono">{PARTE1_MAX_PREGUNTAS} preguntas</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                40 legislación (bloques I y V) + 30 ofimática (bloque VI)
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberInput
                label="Aciertos"
                value={p1Aciertos}
                onChange={(v) => {
                  setP1Aciertos(v)
                  if (v + p1Errores > PARTE1_MAX_PREGUNTAS) setP1Errores(PARTE1_MAX_PREGUNTAS - v)
                }}
                max={PARTE1_MAX_PREGUNTAS}
                icon={CheckCircle2}
              />
              <NumberInput
                label="Errores"
                value={p1ErroresClamped}
                onChange={setP1Errores}
                max={maxP1Errores}
                icon={XCircle}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Info className="h-4 w-4 shrink-0" />
                En blanco: <strong className="text-foreground">{p1Blanco}</strong> (no penalizan)
              </div>
            </CardContent>
          </Card>

          {/* Parte 2 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Segunda parte — Supuesto Práctico</span>
                <Badge variant="outline" className="font-mono">{PARTE2_MAX_PREGUNTAS} preguntas</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Caso práctico (bloques II, III, IV y V) — 20 puntuables + 5 reserva
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberInput
                label="Aciertos"
                value={p2Aciertos}
                onChange={(v) => {
                  setP2Aciertos(v)
                  if (v + p2Errores > PARTE2_MAX_PREGUNTAS) setP2Errores(PARTE2_MAX_PREGUNTAS - v)
                }}
                max={PARTE2_MAX_PREGUNTAS}
                icon={CheckCircle2}
              />
              <NumberInput
                label="Errores"
                value={p2ErroresClamped}
                onChange={setP2Errores}
                max={maxP2Errores}
                icon={XCircle}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Info className="h-4 w-4 shrink-0" />
                En blanco: <strong className="text-foreground">{p2Blanco}</strong> (no penalizan)
              </div>
            </CardContent>
          </Card>

          <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restablecer valores
          </Button>
        </div>

        {/* ─── Results ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Total score */}
          <Card className={`border-2 ${superaCorte ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : aprueba ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'}`}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Nota total</p>
              <p className={`text-5xl font-black font-mono ${superaCorte ? 'text-green-700 dark:text-green-400' : aprueba ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                {notaTotal.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">de 100 puntos</p>

              <div className="mt-4 flex flex-col items-center gap-2">
                {superaCorte ? (
                  <Badge className="bg-green-600 text-white gap-1 text-sm py-1 px-3">
                    <Trophy className="h-4 w-4" />
                    Habrías obtenido plaza en la convocatoria 2024 (corte: {CORTE_TOTAL})
                  </Badge>
                ) : aprueba ? (
                  <Badge className="bg-amber-600 text-white gap-1 text-sm py-1 px-3">
                    <AlertTriangle className="h-4 w-4" />
                    Apruebas (≥25 en ambas), pero no alcanzas el corte de 2024 ({CORTE_TOTAL} pts)
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white gap-1 text-sm py-1 px-3">
                    <XCircle className="h-4 w-4" />
                    No apruebas — necesitas ≥25 en ambas partes
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Part breakdowns */}
          <Card>
            <CardContent className="pt-6 space-y-8">
              <ResultBar label="Primera parte — Cuestionario" result={resultado1} corte={CORTE_PARTE1} corteParte="2024" />
              <div className="border-t" />
              <ResultBar label="Segunda parte — Supuesto Práctico" result={resultado2} corte={CORTE_PARTE2} corteParte="2024" />
            </CardContent>
          </Card>

          {/* Nota de corte explanation */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              <strong className="text-foreground">Nota de corte 2024:</strong> El último opositor con plaza obtuvo
              33 puntos en la primera parte y 14 en la segunda (total: 47,33). La nota de corte por parte
              refleja el resultado real del último admitido, no un mínimo teórico. Se ajusta según el número
              de aprobados y plazas ofertadas en cada convocatoria.
            </p>
          </div>

          {/* Formula */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fórmula de puntuación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-foreground text-base">
                  Puntuación = Aciertos × V − Errores × (V / 3)
                </p>
                <p className="text-xs mt-2">
                  V = valor por pregunta (parte 1: {(PARTE1_MAX_PUNTOS / PARTE1_MAX_PREGUNTAS).toFixed(4)} pts, parte 2: {(PARTE2_MAX_PUNTOS / PARTE2_MAX_PREGUNTAS).toFixed(4)} pts)
                </p>
              </div>
              <ul className="space-y-1">
                <li>Acierto: <strong className="text-foreground">+V puntos</strong></li>
                <li>Error: <strong className="text-foreground">−V/3 puntos</strong> (penalización -1/3)</li>
                <li>En blanco: <strong className="text-foreground">0 puntos</strong> (ni suma ni resta)</li>
              </ul>
              <p>
                <Link href="/blog/penalizacion-examen-auxiliar-administrativo" className="text-primary hover:underline">
                  Guía completa sobre la penalización -1/3 →
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="font-semibold mb-2">Practica con preguntas reales del INAP</p>
              <p className="text-sm text-muted-foreground mb-4">
                Los simulacros de OpoRuta incluyen exámenes oficiales de Administrativo del Estado (C1)
                con cronómetro de 100 minutos y penalización -1/3. Tu primer simulacro es gratis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/examenes-oficiales">
                  <Button className="gap-2 w-full sm:w-auto">
                    Simulacros INAP C1
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    Empezar gratis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── SEO Content ─────────────────────────────────────────── */}
      <section className="mt-16 border-t pt-12 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Cómo calcular tu nota del examen de Administrativo del Estado (C1)
        </h2>

        <div className="prose prose-neutral dark:prose-invert max-w-none
          prose-p:text-muted-foreground prose-li:text-muted-foreground
          prose-strong:text-foreground prose-headings:tracking-tight">

          <p>
            El examen del Cuerpo General Administrativo de la Administración del Estado (C1)
            aplica un sistema de <strong>penalización -1/3</strong>: cada respuesta incorrecta
            descuenta un tercio del valor de un acierto. Las respuestas en blanco no afectan.
          </p>

          <h3>Estructura del examen C1</h3>
          <p>
            El ejercicio es único con <strong>90 preguntas puntuables</strong> (más 5 de reserva
            en la segunda parte) en <strong>100 minutos</strong>. Se divide en dos partes eliminatorias:
          </p>
          <ul>
            <li>
              <strong>Primera parte — Cuestionario (70 preguntas):</strong> 40 de legislación
              (bloques I y V: Derecho administrativo, organización pública, función pública) + 30 de
              ofimática (bloque VI: Windows, Word, Excel, Access). Calificación: 0-50 puntos. Mínimo: 25 puntos.
            </li>
            <li>
              <strong>Segunda parte — Supuesto Práctico (20 preguntas):</strong> Eliges 1 de 2 casos
              prácticos sobre los bloques II, III, IV y V (procedimiento administrativo, gestión de personal, contratación, presupuestos).
              Calificación: 0-50 puntos. Mínimo: 25 puntos. Las 5 preguntas de reserva no son puntuables.
            </li>
          </ul>

          <h3>Diferencias con el examen de Auxiliar (C2)</h3>
          <p>
            El C1 tiene <strong>más preguntas de legislación</strong> (40 vs 30 en C2) y un
            <strong> supuesto práctico</strong> que no existe en C2. El tiempo es mayor (100 vs 90 minutos)
            para compensar la complejidad del caso práctico. La penalización es la misma: -1/3.
            Si buscas la calculadora del C2,{' '}
            <a href="/herramientas/calculadora-nota-auxiliar-administrativo">calculadora de nota del Auxiliar Administrativo (C2)</a>.
          </p>

          <h3>Nota de corte de la última convocatoria</h3>
          <p>
            En la convocatoria 2024 del Administrativo del Estado (C1), la <strong>nota general de corte
            fue de 47,33 puntos</strong> (sobre 100). El último aprobado con plaza obtuvo 33 puntos
            en la primera parte y 14 en la segunda. Recuerda que ambas partes son eliminatorias:
            necesitas al menos <strong>25 puntos en cada una</strong> para aprobar.
          </p>

          <h3>Estrategia para el supuesto práctico</h3>
          <p>
            Lee ambos supuestos antes de elegir. El valor por pregunta en la segunda parte es
            <strong> 2,50 puntos</strong> (50/20) frente a 0,71 en la primera (50/70). Cada error
            en el práctico penaliza mucho más. Si no estás seguro, déjala en blanco.
          </p>

          <h3>Prepárate con preguntas reales del INAP</h3>
          <p>
            Hemos analizado las convocatorias del INAP para el Cuerpo General Administrativo y publicado
            simulacros con preguntas oficiales. Practica con{' '}
            <a href="/examenes-oficiales">los exámenes reales del INAP</a>{' '}
            y comprueba si habrías aprobado.
          </p>
        </div>
      </section>
    </div>
  )
}
