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
  Trophy,
  RotateCcw,
  Info,
  Mail,
} from 'lucide-react'

// ─── Constants (from scoring_config in migration 048) ─────────────────────────

const MAX_PREGUNTAS = 100
const ACIERTO_VALOR = 0.60
const MAX_PUNTOS = 60  // 100 * 0.60

// ─── Calculator Logic ────────────────────────────────────────────────────────

function calcularNota(aciertos: number) {
  // Correos: no penalty, score = aciertos * 0.60
  const puntuacion = Math.round(aciertos * ACIERTO_VALOR * 100) / 100
  const porcentaje = Math.min(100, (puntuacion / MAX_PUNTOS) * 100)
  return { puntuacion, porcentaje }
}

// ─── Number Input with Slider ────────────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  max,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Icon className={`h-4 w-4 ${color ?? 'text-muted-foreground'}`} />
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function CalculadoraNotaCorreos() {
  const [aciertos, setAciertos] = useState(60)
  const [errores, setErrores] = useState(25)

  // Enforce constraints: aciertos + errores <= 100
  const maxErrores = MAX_PREGUNTAS - aciertos
  const erroresClamped = Math.min(errores, maxErrores)
  const enBlanco = MAX_PREGUNTAS - aciertos - erroresClamped

  const { puntuacion, porcentaje } = calcularNota(aciertos)

  // Rough thresholds for visual feedback (no official min_aprobado)
  const buenaNota = puntuacion >= 36  // 60% of max
  const notaAlta = puntuacion >= 45   // 75% of max

  const reset = useCallback(() => {
    setAciertos(60)
    setErrores(25)
  }, [])

  const color = notaAlta
    ? 'text-green-700 dark:text-green-400'
    : buenaNota
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-700 dark:text-red-400'

  const borderColor = notaAlta
    ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
    : buenaNota
      ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20'
      : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'

  const barColor = notaAlta ? 'bg-green-500' : buenaNota ? 'bg-amber-500' : 'bg-red-500'

  const StatusIcon = notaAlta ? Trophy : buenaNota ? CheckCircle2 : XCircle

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
        <span>/</span>
        <Link href="/herramientas" className="hover:text-foreground transition-colors">Herramientas</Link>
        <span>/</span>
        <span className="text-foreground">Calculadora nota Correos</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <Badge className="mb-3 gap-1">
          <Calculator className="h-3 w-3" />
          Herramienta gratuita
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
          Calculadora de nota — Correos 2026
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Calcula tu puntuaci&oacute;n del examen de <strong className="text-foreground">Correos (Personal Laboral Fijo)</strong>.
          Sin penalizaci&oacute;n: cada acierto vale 0,60 puntos, los errores no restan.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ─── Inputs ──────────────────────────────────────────────── */}
        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Test — 100 preguntas</span>
                <Badge variant="outline" className="font-mono gap-1">
                  <Mail className="h-3 w-3" />
                  110 min
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberInput
                label="Aciertos"
                value={aciertos}
                onChange={(v) => {
                  setAciertos(v)
                  if (v + errores > MAX_PREGUNTAS) setErrores(MAX_PREGUNTAS - v)
                }}
                max={MAX_PREGUNTAS}
                icon={CheckCircle2}
                color="text-green-600"
              />
              <NumberInput
                label="Errores"
                value={erroresClamped}
                onChange={setErrores}
                max={maxErrores}
                icon={XCircle}
                color="text-red-600"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Info className="h-4 w-4 shrink-0" />
                En blanco: <strong className="text-foreground">{enBlanco}</strong>
              </div>
            </CardContent>
          </Card>

          {/* No penalty callout */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              <CheckCircle2 className="w-4 h-4 inline mr-1.5" />
              Sin penalizaci&oacute;n — responde TODAS las preguntas. Los errores no restan.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restablecer valores
          </Button>
        </div>

        {/* ─── Results ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Total score */}
          <Card className={`border-2 ${borderColor}`}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Tu puntuaci&oacute;n</p>
              <p className={`text-5xl font-black font-mono ${color}`}>
                {puntuacion.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">de {MAX_PUNTOS} puntos</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge className={`gap-1 text-sm py-1 px-3 text-white ${notaAlta ? 'bg-green-600' : buenaNota ? 'bg-amber-600' : 'bg-red-600'}`}>
                  <StatusIcon className="h-4 w-4" />
                  {notaAlta
                    ? 'Muy buena nota — tienes opciones reales de plaza'
                    : buenaNota
                      ? 'Nota aceptable — sigue practicando'
                      : 'Nota baja — necesitas m\u00e1s aciertos'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Score bar */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Desglose</span>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${color}`} />
                  <span className={`font-bold text-lg font-mono ${color}`}>
                    {puntuacion.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {MAX_PUNTOS}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                  <p className="text-lg font-bold font-mono text-green-700 dark:text-green-400">{aciertos}</p>
                  <p className="text-xs text-muted-foreground">Aciertos</p>
                  <p className="text-xs font-mono text-green-600">+{(aciertos * ACIERTO_VALOR).toFixed(2)} pts</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <p className="text-lg font-bold font-mono text-red-700 dark:text-red-400">{erroresClamped}</p>
                  <p className="text-xs text-muted-foreground">Errores</p>
                  <p className="text-xs font-mono text-red-600">0 pts</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-bold font-mono">{enBlanco}</p>
                  <p className="text-xs text-muted-foreground">En blanco</p>
                  <p className="text-xs font-mono text-muted-foreground">0 pts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formula */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">F&oacute;rmula de puntuaci&oacute;n</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-foreground text-base">
                  Nota = Aciertos &times; 0,60
                </p>
                <p className="text-xs mt-2">
                  M&aacute;ximo: 100 &times; 0,60 = 60 puntos
                </p>
              </div>
              <ul className="space-y-1">
                <li>Acierto: <strong className="text-foreground">+0,60 puntos</strong></li>
                <li>Error: <strong className="text-foreground">0 puntos</strong> (no penaliza)</li>
                <li>En blanco: <strong className="text-foreground">0 puntos</strong></li>
              </ul>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Consejo:</strong> En Correos no se penalizan los errores. Responde todas las preguntas: dejar una en blanco es lo mismo que fallarla, pero acertar&aacute;ndola sumas 0,60 puntos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Concurso-oposici&oacute;n breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sistema concurso-oposici&oacute;n</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Fase oposici&oacute;n (examen)</span>
                <span className="font-mono font-bold text-foreground">{puntuacion.toFixed(2)} / 60 pts</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Fase concurso (m&eacute;ritos)</span>
                <span className="font-mono text-muted-foreground">? / 40 pts</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-mono font-bold text-foreground">{puntuacion.toFixed(2)} + m&eacute;ritos / 100 pts</span>
              </div>
              <p className="text-xs pt-2">
                La puntuaci&oacute;n final combina el examen (m&aacute;x. 60) con los m&eacute;ritos (m&aacute;x. 40): experiencia laboral, formaci&oacute;n, idiomas, etc.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <p className="font-semibold mb-2">Practica con tests tipo examen</p>
              <p className="text-sm text-muted-foreground mb-4">
                OpoRuta genera tests de Correos con las mismas reglas del examen real:
                100 preguntas, 110 minutos, sin penalizaci&oacute;n. Tu primer test es gratis.
              </p>
              <Link href="/register?oposicion=correos">
                <Button className="gap-2">
                  Empieza gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── SEO Content ─────────────────────────────────────────── */}
      <section className="mt-16 border-t pt-12 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">
          C&oacute;mo se calcula la nota del examen de Correos
        </h2>

        <div className="prose prose-neutral dark:prose-invert max-w-none
          prose-p:text-muted-foreground prose-li:text-muted-foreground
          prose-strong:text-foreground prose-headings:tracking-tight">

          <p>
            El examen de <strong>Correos (Personal Laboral Fijo, Grupo IV)</strong> utiliza
            un sistema de puntuaci&oacute;n sencillo: cada acierto vale <strong>0,60 puntos</strong> y
            los errores <strong>no restan</strong>. La puntuaci&oacute;n m&aacute;xima del examen es
            de <strong>60 puntos</strong> (100 preguntas &times; 0,60).
          </p>

          <h3>Estructura del examen</h3>
          <p>
            El ejercicio consta de <strong>100 preguntas tipo test</strong> que deben responderse
            en <strong>110 minutos</strong> (1 minuto y 6 segundos por pregunta). Se dividen en:
          </p>
          <ul>
            <li><strong>90 preguntas de temario:</strong> 12 temas sobre normativa postal, productos y servicios de Correos, procesos operativos, atenci&oacute;n al cliente y normas de cumplimiento.</li>
            <li><strong>10 preguntas de psicot&eacute;cnicos:</strong> Razonamiento l&oacute;gico, num&eacute;rico y verbal.</li>
          </ul>

          <h3>Por qu&eacute; debes responder todas las preguntas</h3>
          <p>
            A diferencia de oposiciones como Auxiliar Administrativo del Estado (penalizaci&oacute;n -1/3)
            o Justicia (penalizaci&oacute;n -1/4), en <strong>Correos los errores no restan puntos</strong>.
            Esto significa que dejar una pregunta en blanco tiene exactamente el mismo resultado que fallarla (0 puntos),
            pero si la respondes tienes la posibilidad de sumar 0,60 puntos. La estrategia &oacute;ptima es
            <strong> responder siempre todas las preguntas</strong>.
          </p>

          <h3>Sistema de concurso-oposici&oacute;n</h3>
          <p>
            La selecci&oacute;n de Correos es un <strong>concurso-oposici&oacute;n</strong> con dos fases:
          </p>
          <ul>
            <li><strong>Fase de oposici&oacute;n (examen):</strong> M&aacute;ximo 60 puntos. Es el test que calcula esta herramienta.</li>
            <li><strong>Fase de concurso (m&eacute;ritos):</strong> M&aacute;ximo 40 puntos. Valora experiencia laboral, formaci&oacute;n acad&eacute;mica, idiomas y otros m&eacute;ritos.</li>
          </ul>
          <p>
            La puntuaci&oacute;n final (m&aacute;ximo 100 puntos) determina el orden de los aspirantes.
            Las plazas se asignan de mayor a menor puntuaci&oacute;n total.
          </p>

          <h3>Prepara Correos con OpoRuta</h3>
          <p>
            Genera tests ilimitados de los 12 temas de Correos con preguntas basadas en la legislaci&oacute;n real.
            OpoRuta aplica las mismas reglas del examen: sin penalizaci&oacute;n, 110 minutos de cron&oacute;metro.
            <Link href="/register?oposicion=correos" className="text-primary hover:underline"> Empieza gratis</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
