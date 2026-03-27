'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  RotateCcw,
  Info,
  Scale,
} from 'lucide-react'
import {
  calcularEjercicio,
  type EjercicioConfig,
  type EjercicioResult,
} from '@/lib/utils/scoring'

// ─── Scoring configs from migration 049 ─────────────────────────────────────

interface CuerpoConfig {
  nombre: string
  nivel: string
  plazas: number
  ejercicios: EjercicioConfig[]
}

const CUERPOS: Record<string, CuerpoConfig> = {
  auxilio: {
    nombre: 'Auxilio Judicial',
    nivel: 'C2',
    plazas: 425,
    ejercicios: [
      { nombre: 'Test teórico', preguntas: 100, minutos: 100, acierto: 0.60, error: 0.15, max: 60, min_aprobado: 30, penaliza: true },
      { nombre: 'Supuesto práctico', preguntas: 40, minutos: 60, acierto: 1.00, error: 0.25, max: 40, min_aprobado: 20, penaliza: true },
    ],
  },
  tramitacion: {
    nombre: 'Tramitación Procesal',
    nivel: 'C1',
    plazas: 1155,
    ejercicios: [
      { nombre: 'Test teórico', preguntas: 100, minutos: 100, acierto: 0.60, error: 0.15, max: 60, min_aprobado: 30, penaliza: true },
      { nombre: 'Supuesto práctico', preguntas: 10, minutos: 30, acierto: 2.00, error: 0.50, max: 20, min_aprobado: 10, penaliza: true },
      { nombre: 'Ofimática', preguntas: 20, minutos: 40, acierto: 1.00, error: 0.25, max: 20, min_aprobado: 10, penaliza: true },
    ],
  },
  gestion: {
    nombre: 'Gestión Procesal',
    nivel: 'A2',
    plazas: 725,
    ejercicios: [
      { nombre: 'Test teórico', preguntas: 100, minutos: 100, acierto: 0.60, error: 0.15, max: 60, min_aprobado: 30, penaliza: true },
      { nombre: 'Caso práctico', preguntas: 10, minutos: 30, acierto: 1.50, error: 0.30, max: 15, min_aprobado: 7.5, penaliza: true },
      { nombre: 'Desarrollo escrito', preguntas: 5, minutos: 45, acierto: 5.0, error: 0, max: 25, min_aprobado: 12.5, penaliza: false },
    ],
  },
}

// ─── Number Input ────────────────────────────────────────────────────────────

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

// ─── Result Card per exercise ────────────────────────────────────────────────

function EjercicioResultCard({ result, config }: { result: EjercicioResult; config: EjercicioConfig }) {
  const aprobado = result.aprobado !== false
  const porcentaje = Math.min(100, (result.notaSobreMax / config.max) * 100)

  const color = aprobado ? 'bg-green-500' : 'bg-red-500'
  const textColor = aprobado
    ? 'text-green-700 dark:text-green-400'
    : 'text-red-700 dark:text-red-400'
  const StatusIcon = aprobado ? CheckCircle2 : XCircle

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{result.nombre}</span>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${textColor}`} />
          <span className={`font-bold text-lg font-mono ${textColor}`}>
            {result.notaSobreMax.toFixed(2)}
          </span>
          <span className="text-muted-foreground text-sm">/ {config.max}</span>
        </div>
      </div>

      <div className="relative h-4 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
        {config.min_aprobado !== null && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/40"
            style={{ left: `${(config.min_aprobado / config.max) * 100}%` }}
            title={`Mínimo: ${config.min_aprobado} puntos`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0</span>
        {config.min_aprobado !== null && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-foreground/40 rounded-full" />
            Mínimo: {config.min_aprobado}
          </span>
        )}
        <span>{config.max}</span>
      </div>

      <p className={`text-sm font-medium ${textColor}`}>
        {aprobado
          ? `Apruebas este ejercicio (${config.min_aprobado !== null ? `>= ${config.min_aprobado} pts` : 'sin mínimo eliminatorio'})`
          : `No alcanzas el mínimo de ${config.min_aprobado} puntos`}
      </p>
    </div>
  )
}

// ─── Penalty description ─────────────────────────────────────────────────────

function penaltyLabel(config: EjercicioConfig): string {
  if (!config.penaliza) return 'Sin penalización'
  const ratio = config.acierto > 0 ? config.error / config.acierto : 0
  if (Math.abs(ratio - 1 / 4) < 0.01) return `-1/4`
  if (Math.abs(ratio - 1 / 5) < 0.01) return `-1/5`
  return `-${config.error}`
}

// ─── Calculator for a single cuerpo ─────────────────────────────────────────

function CuerpoCalculator({ cuerpo }: { cuerpo: CuerpoConfig }) {
  const initialValues = cuerpo.ejercicios.map((ej) => ({
    aciertos: Math.round(ej.preguntas * 0.6),
    errores: Math.round(ej.preguntas * 0.15),
  }))

  const [values, setValues] = useState(initialValues)

  const updateEjercicio = useCallback((idx: number, field: 'aciertos' | 'errores', value: number) => {
    setValues((prev) => {
      const next = [...prev]
      const ej = cuerpo.ejercicios[idx]
      if (field === 'aciertos') {
        next[idx] = {
          aciertos: value,
          errores: Math.min(prev[idx].errores, ej.preguntas - value),
        }
      } else {
        next[idx] = { ...prev[idx], errores: value }
      }
      return next
    })
  }, [cuerpo.ejercicios])

  const reset = useCallback(() => setValues(initialValues), [initialValues])

  const results = useMemo(() => {
    return cuerpo.ejercicios.map((ej, idx) => {
      const { aciertos, errores } = values[idx]
      const enBlanco = ej.preguntas - aciertos - errores
      return calcularEjercicio(aciertos, errores, enBlanco, ej)
    })
  }, [cuerpo.ejercicios, values])

  const maxTotal = cuerpo.ejercicios.reduce((sum, ej) => sum + ej.max, 0)
  const notaTotal = results.reduce((sum, r) => sum + r.notaSobreMax, 0)
  const todosAprobados = results.every((r) => r.aprobado !== false)

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-6">
        {cuerpo.ejercicios.map((ej, idx) => {
          const { aciertos, errores } = values[idx]
          const maxErrores = ej.preguntas - aciertos
          const enBlanco = ej.preguntas - aciertos - errores

          return (
            <Card key={ej.nombre}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{ej.nombre}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{ej.preguntas} preg.</Badge>
                    <Badge variant="outline" className="font-mono text-xs">{penaltyLabel(ej)}</Badge>
                  </div>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Acierto: +{ej.acierto} pts | Error: {ej.penaliza ? `-${ej.error}` : '0'} pts | Máx: {ej.max} pts | Mín: {ej.min_aprobado ?? 'N/A'} pts
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <NumberInput
                  label="Aciertos"
                  value={aciertos}
                  onChange={(v) => updateEjercicio(idx, 'aciertos', v)}
                  max={ej.preguntas}
                  icon={CheckCircle2}
                />
                <NumberInput
                  label="Errores"
                  value={errores}
                  onChange={(v) => updateEjercicio(idx, 'errores', v)}
                  max={maxErrores}
                  icon={XCircle}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <Info className="h-4 w-4 shrink-0" />
                  En blanco: <strong className="text-foreground">{enBlanco}</strong> (no penalizan)
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Restablecer valores
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Total score card */}
        <Card className={`border-2 ${todosAprobados ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'}`}>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Nota total</p>
            <p className={`text-5xl font-black font-mono ${todosAprobados ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {notaTotal.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">de {maxTotal} puntos</p>

            <div className="mt-4 flex items-center justify-center gap-2">
              {todosAprobados ? (
                <Badge className="bg-green-600 text-white gap-1 text-sm py-1 px-3">
                  <Trophy className="h-4 w-4" />
                  Apruebas todos los ejercicios
                </Badge>
              ) : (
                <Badge className="bg-red-600 text-white gap-1 text-sm py-1 px-3">
                  <XCircle className="h-4 w-4" />
                  No apruebas — revisa los ejercicios marcados en rojo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Per-exercise breakdown */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {results.map((result, idx) => (
              <div key={result.nombre}>
                {idx > 0 && <div className="border-t mb-8" />}
                <EjercicioResultCard result={result} config={cuerpo.ejercicios[idx]} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Formula */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Fórmula de puntuación — {cuerpo.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="font-mono font-bold text-foreground text-base">
                Nota = Aciertos x valor - Errores x penalización
              </p>
              <p className="text-xs mt-2">
                Penalización Justicia = 1/4 del valor del acierto (NO 1/3 como AGE)
              </p>
            </div>
            <div className="space-y-2">
              {cuerpo.ejercicios.map((ej) => (
                <div key={ej.nombre} className="flex items-center justify-between text-xs border-b pb-1 last:border-0">
                  <span className="font-medium text-foreground">{ej.nombre}</span>
                  <span>
                    +{ej.acierto} / {ej.penaliza ? `−${ej.error}` : 'sin penalización'} · Máx {ej.max} · Mín {ej.min_aprobado ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <p className="font-semibold mb-2">Practica con penalización real</p>
            <p className="text-sm text-muted-foreground mb-4">
              Los simulacros de OpoRuta aplican la penalización 1/4 de Justicia con cronómetro real.
              Al terminar, ves si habrías aprobado cada ejercicio. Tu primer test es gratis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button className="gap-2 w-full sm:w-auto">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/oposiciones/justicia">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver oposiciones de Justicia
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CalculadoraNotaJusticia() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
        <span>/</span>
        <Link href="/herramientas" className="hover:text-foreground transition-colors">Herramientas</Link>
        <span>/</span>
        <span className="text-foreground">Calculadora Nota Justicia</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className="gap-1">
            <Calculator className="h-3 w-3" />
            Herramienta gratuita
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Scale className="h-3 w-3" />
            Penalización 1/4
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
          Calculadora de nota — Oposiciones de Justicia 2026
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Calcula tu nota de <strong className="text-foreground">Auxilio Judicial (C2)</strong>,{' '}
          <strong className="text-foreground">Tramitación Procesal (C1)</strong> o{' '}
          <strong className="text-foreground">Gestión Procesal (A2)</strong> con la penalización 1/4 oficial.
          Introduce tus aciertos y errores de cada ejercicio.
        </p>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="auxilio" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auxilio" className="text-xs sm:text-sm">
            Auxilio (C2)
          </TabsTrigger>
          <TabsTrigger value="tramitacion" className="text-xs sm:text-sm">
            Tramitación (C1)
          </TabsTrigger>
          <TabsTrigger value="gestion" className="text-xs sm:text-sm">
            Gestión (A2)
          </TabsTrigger>
        </TabsList>

        {Object.entries(CUERPOS).map(([key, cuerpo]) => (
          <TabsContent key={key} value={key}>
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold">{cuerpo.nombre}</h2>
              <Badge variant="outline">{cuerpo.nivel}</Badge>
              <Badge variant="outline" className="text-xs">~{cuerpo.plazas} plazas</Badge>
              <Badge variant="outline" className="text-xs">{cuerpo.ejercicios.length} ejercicios</Badge>
            </div>
            <CuerpoCalculator cuerpo={cuerpo} />
          </TabsContent>
        ))}
      </Tabs>

      {/* SEO content */}
      <section className="mt-16 border-t pt-12 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Cómo calcular tu nota en las oposiciones de Justicia
        </h2>

        <div className="prose prose-neutral dark:prose-invert max-w-none
          prose-p:text-muted-foreground prose-li:text-muted-foreground
          prose-strong:text-foreground prose-headings:tracking-tight">

          <p>
            Las oposiciones de Justicia (Auxilio, Tramitación y Gestión Procesal) aplican un sistema de
            <strong> penalización de 1/4 del valor del acierto</strong>, diferente a la penalización 1/3 de la AGE.
            Cada ejercicio es eliminatorio: necesitas alcanzar el mínimo en todos para aprobar.
          </p>

          <h3>Auxilio Judicial (C2) — 2 ejercicios, 100 pts</h3>
          <ul>
            <li>
              <strong>Test teórico (60 pts):</strong> 100 preguntas en 100 minutos. Acierto: +0,60. Error: -0,15 (1/4). Mínimo: 30 pts.
            </li>
            <li>
              <strong>Supuesto práctico (40 pts):</strong> 40 preguntas en 60 minutos sobre 2 casos de diligencia judicial. Acierto: +1,00. Error: -0,25 (1/4). Mínimo: 20 pts.
            </li>
          </ul>

          <h3>Tramitación Procesal (C1) — 3 ejercicios, 100 pts</h3>
          <ul>
            <li>
              <strong>Test teórico (60 pts):</strong> 100 preguntas en 100 minutos. Acierto: +0,60. Error: -0,15 (1/4). Mínimo: 30 pts.
            </li>
            <li>
              <strong>Supuesto práctico (20 pts):</strong> 10 preguntas en 30 minutos. Acierto: +2,00. Error: -0,50 (1/4). Mínimo: 10 pts.
            </li>
            <li>
              <strong>Ofimática (20 pts):</strong> 20 preguntas en 40 minutos sobre Word 365. Acierto: +1,00. Error: -0,25 (1/4). Mínimo: 10 pts.
            </li>
          </ul>

          <h3>Gestión Procesal (A2) — 3 ejercicios, 100 pts</h3>
          <ul>
            <li>
              <strong>Test teórico (60 pts):</strong> 100 preguntas en 100 minutos. Acierto: +0,60. Error: -0,15 (1/4). Mínimo: 30 pts.
            </li>
            <li>
              <strong>Caso práctico (15 pts):</strong> 10 preguntas en 30 minutos. Acierto: +1,50. Error: -0,30 (1/5). Mínimo: 7,5 pts.
            </li>
            <li>
              <strong>Desarrollo escrito (25 pts):</strong> 5 temas en 45 minutos. Sin penalización, calificado por tribunal. Mínimo: 12,5 pts.
            </li>
          </ul>

          <h3>La regla de oro para la penalización 1/4</h3>
          <p>
            <strong>Si puedes descartar al menos 1 de las 4 opciones, arriesga. Si no, déjala en blanco.</strong>{' '}
            La penalización 1/4 es ligeramente menos agresiva que la 1/3 de la AGE, pero responder al azar
            entre 4 opciones sigue teniendo esperanza matemática negativa. Solo compensa arriesgar cuando
            puedes reducir las opciones a 3 o menos.
          </p>

          <h3>Diferencia clave: Justicia vs AGE</h3>
          <p>
            La penalización 1/4 de Justicia descuenta menos que la 1/3 de la AGE por cada error.
            Sin embargo, los mínimos eliminatorios por ejercicio hacen que sea crucial no fallar
            en ninguno de los ejercicios. Prepara todos los bloques del temario de forma equilibrada.
          </p>
        </div>
      </section>

      {/* FAQ visual */}
      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            {
              q: '¿Cómo se calcula la nota en las oposiciones de Justicia?',
              a: 'La penalización es de 1/4 del valor del acierto. Fórmula: Puntuación = Aciertos x valor - Errores x (valor / 4). Las respuestas en blanco no puntúan ni penalizan. Cada ejercicio es eliminatorio con un mínimo para aprobar.',
            },
            {
              q: '¿Cuántos ejercicios tiene cada oposición?',
              a: 'Auxilio Judicial: 2 ejercicios (test + práctico = 100 pts). Tramitación Procesal: 3 ejercicios (test + práctico + ofimática = 100 pts). Gestión Procesal: 3 ejercicios (test + caso práctico + desarrollo escrito = 100 pts).',
            },
            {
              q: '¿Cuántas plazas hay de Justicia en 2026?',
              a: 'La OEP 2024 ofertó aprox. 425 plazas de Auxilio (C2), 1.155 de Tramitación (C1) y 725 de Gestión (A2). Las cifras pueden acumular plazas de varias OEP.',
            },
            {
              q: '¿Cuándo conviene dejar una pregunta en blanco?',
              a: 'Con penalización 1/4, si puedes descartar al menos 1 de las 4 opciones, te compensa arriesgar. Si no puedes descartar ninguna, déjala en blanco.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA registro */}
      <section className="text-center py-8 px-4 bg-primary/5 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Practica con preguntas reales del MJU</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Tests con IA verificados, simulacros oficiales y Radar del Tribunal. Empieza gratis.
        </p>
        <a
          href="/register"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Empezar gratis — sin tarjeta
        </a>
      </section>
    </div>
  )
}
