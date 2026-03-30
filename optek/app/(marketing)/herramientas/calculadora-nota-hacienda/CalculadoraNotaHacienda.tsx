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
  FileText,
} from 'lucide-react'

// --- Constants ---------------------------------------------------------------

const EJ1_MAX_PREGUNTAS = 80
const EJ1_MAX_PUNTOS = 10
const EJ1_MINIMO = 5

const EJ2_MAX_PUNTOS = 30
const EJ2_MINIMO = 15

const TOTAL_MAX_PUNTOS = 40 // 10 + 30

// --- Calculator Logic --------------------------------------------------------

function calcularEjercicio1(aciertos: number, errores: number) {
  // nota = (aciertos - errores/4) * 10 / 80
  const puntuacionBruta = ((aciertos - errores / 4) * EJ1_MAX_PUNTOS) / EJ1_MAX_PREGUNTAS
  const puntuacion = Math.max(0, Math.round(puntuacionBruta * 100) / 100)

  return {
    puntuacion,
    maxPuntos: EJ1_MAX_PUNTOS,
    aprueba: puntuacion >= EJ1_MINIMO,
    porcentaje: Math.min(100, (puntuacion / EJ1_MAX_PUNTOS) * 100),
  }
}

// --- Input Component ---------------------------------------------------------

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
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:cursor-pointer
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
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
    </div>
  )
}

// --- Result Bar (Ejercicio 1) ------------------------------------------------

function ResultBarEj1({
  puntuacion,
  aprueba,
  porcentaje,
}: {
  puntuacion: number
  aprueba: boolean
  porcentaje: number
}) {
  const color = aprueba ? 'bg-emerald-500' : 'bg-red-500'
  const textColor = aprueba
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-red-700 dark:text-red-400'
  const StatusIcon = aprueba ? CheckCircle2 : XCircle

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Ejercicio 1 -- Test</span>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${textColor}`} />
          <span className={`font-bold text-lg font-mono ${textColor}`}>
            {puntuacion.toFixed(2)}
          </span>
          <span className="text-muted-foreground text-sm">/ {EJ1_MAX_PUNTOS}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
        {/* Minimum mark (5/10) */}
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${(EJ1_MINIMO / EJ1_MAX_PUNTOS) * 100}%` }}
          title={`Minimo: ${EJ1_MINIMO} puntos`}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-foreground/40 rounded-full" /> Minimo: {EJ1_MINIMO}
        </span>
        <span>{EJ1_MAX_PUNTOS}</span>
      </div>

      {/* Status text */}
      <p className={`text-sm font-medium ${textColor}`}>
        {aprueba
          ? `Apruebas el ejercicio 1 (>=${EJ1_MINIMO}/10)`
          : `No alcanzas el minimo de ${EJ1_MINIMO} puntos para aprobar el ejercicio 1`}
      </p>
    </div>
  )
}

// --- Main Component ----------------------------------------------------------

export function CalculadoraNotaHacienda() {
  const [ej1Aciertos, setEj1Aciertos] = useState(50)
  const [ej1Errores, setEj1Errores] = useState(15)
  const [ej2Nota, setEj2Nota] = useState<string>('')

  // Enforce max constraints
  const maxEj1Errores = EJ1_MAX_PREGUNTAS - ej1Aciertos
  const ej1ErroresClamped = Math.min(ej1Errores, maxEj1Errores)
  const ej1Blanco = EJ1_MAX_PREGUNTAS - ej1Aciertos - ej1ErroresClamped

  const resultado1 = calcularEjercicio1(ej1Aciertos, ej1ErroresClamped)

  // Ejercicio 2: parsed from text input, clamped 0-30
  const ej2NotaParsed = Math.max(0, Math.min(EJ2_MAX_PUNTOS, parseFloat(ej2Nota) || 0))
  const hasEj2 = ej2Nota.trim() !== ''
  const ej2Aprueba = hasEj2 && ej2NotaParsed >= EJ2_MINIMO

  // Total
  const notaTotal = resultado1.puntuacion + (hasEj2 ? ej2NotaParsed : 0)
  const aprueba = resultado1.aprueba && ej2Aprueba
  const soloEj1 = !hasEj2

  const reset = useCallback(() => {
    setEj1Aciertos(50)
    setEj1Errores(15)
    setEj2Nota('')
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
        <span>/</span>
        <Link href="/herramientas" className="hover:text-foreground transition-colors">Herramientas</Link>
        <span>/</span>
        <span className="text-foreground">Calculadora Agente de Hacienda</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <Badge className="mb-3 gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
          <Calculator className="h-3 w-3" />
          Herramienta gratuita
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
          Calculadora de nota -- Agente de Hacienda 2026
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Calcula tu nota del primer ejercicio de <strong className="text-foreground">Agente de Hacienda</strong> con
          la penalizacion -1/4 oficial. Introduce tus aciertos y errores y descubre si apruebas.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* --- Inputs -------------------------------------------------- */}
        <div className="space-y-8">
          {/* Ejercicio 1 */}
          <Card className="border-emerald-200 dark:border-emerald-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Ejercicio 1 -- Test</span>
                <Badge variant="outline" className="font-mono border-emerald-300 dark:border-emerald-700">
                  {EJ1_MAX_PREGUNTAS} preguntas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberInput
                label="Aciertos"
                value={ej1Aciertos}
                onChange={(v) => {
                  setEj1Aciertos(v)
                  if (v + ej1Errores > EJ1_MAX_PREGUNTAS) setEj1Errores(EJ1_MAX_PREGUNTAS - v)
                }}
                max={EJ1_MAX_PREGUNTAS}
                icon={CheckCircle2}
              />
              <NumberInput
                label="Errores"
                value={ej1ErroresClamped}
                onChange={setEj1Errores}
                max={maxEj1Errores}
                icon={XCircle}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                <Info className="h-4 w-4 shrink-0" />
                En blanco: <strong className="text-foreground">{ej1Blanco}</strong> (no penalizan)
              </div>
            </CardContent>
          </Card>

          {/* Ejercicio 2 */}
          <Card className="border-emerald-200 dark:border-emerald-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Ejercicio 2 -- Desarrollo escrito</span>
                <Badge variant="outline" className="font-mono border-emerald-300 dark:border-emerald-700">
                  0-30 puntos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  El ejercicio 2 consiste en 10 supuestos de desarrollo escrito valorados por el tribunal.
                  No es calculable automaticamente. Introduce tu estimacion o dejalo en blanco para ver solo el resultado del test.
                </span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Nota estimada (0-30)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.01}
                  value={ej2Nota}
                  onChange={(e) => setEj2Nota(e.target.value)}
                  placeholder="Ej: 18.5"
                  className="w-full rounded-md border px-3 py-2 text-sm font-mono
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                    placeholder:text-muted-foreground/50"
                />
                {hasEj2 && (
                  <p className={`text-xs font-medium ${ej2Aprueba ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {ej2Aprueba
                      ? `Apruebas el ejercicio 2 (>=${EJ2_MINIMO}/30)`
                      : `No alcanzas el minimo de ${EJ2_MINIMO}/30`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restablecer valores
          </Button>
        </div>

        {/* --- Results ------------------------------------------------- */}
        <div className="space-y-6">
          {/* Total score */}
          <Card className={`border-2 ${
            aprueba
              ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
              : soloEj1 && resultado1.aprueba
                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
          }`}>
            <CardContent className="pt-6 text-center">
              {soloEj1 ? (
                <>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nota Ejercicio 1</p>
                  <p className={`text-5xl font-black font-mono ${
                    resultado1.aprueba
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {resultado1.puntuacion.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">de {EJ1_MAX_PUNTOS} puntos</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nota total estimada</p>
                  <p className={`text-5xl font-black font-mono ${
                    aprueba
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {notaTotal.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">de {TOTAL_MAX_PUNTOS} puntos</p>
                </>
              )}

              <div className="mt-4 flex items-center justify-center gap-2">
                {soloEj1 ? (
                  resultado1.aprueba ? (
                    <Badge className="bg-emerald-600 text-white gap-1 text-sm py-1 px-3">
                      <CheckCircle2 className="h-4 w-4" />
                      Apruebas el primer ejercicio
                    </Badge>
                  ) : (
                    <Badge className="bg-red-600 text-white gap-1 text-sm py-1 px-3">
                      <XCircle className="h-4 w-4" />
                      No apruebas — necesitas {'>='}{EJ1_MINIMO}/{EJ1_MAX_PUNTOS}
                    </Badge>
                  )
                ) : aprueba ? (
                  <Badge className="bg-emerald-600 text-white gap-1 text-sm py-1 px-3">
                    <Trophy className="h-4 w-4" />
                    Apruebas ambos ejercicios
                  </Badge>
                ) : (
                  <Badge className="bg-red-600 text-white gap-1 text-sm py-1 px-3">
                    <XCircle className="h-4 w-4" />
                    {!resultado1.aprueba && (!hasEj2 || !ej2Aprueba)
                      ? 'No apruebas ninguno de los dos ejercicios'
                      : !resultado1.aprueba
                        ? 'No apruebas el ejercicio 1'
                        : 'No apruebas el ejercicio 2'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Part breakdowns */}
          <Card>
            <CardContent className="pt-6 space-y-8">
              <ResultBarEj1
                puntuacion={resultado1.puntuacion}
                aprueba={resultado1.aprueba}
                porcentaje={resultado1.porcentaje}
              />
              {hasEj2 && (
                <>
                  <div className="border-t" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Ejercicio 2 -- Desarrollo</span>
                      <div className="flex items-center gap-2">
                        {ej2Aprueba ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
                        )}
                        <span className={`font-bold text-lg font-mono ${
                          ej2Aprueba
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}>
                          {ej2NotaParsed.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-sm">/ {EJ2_MAX_PUNTOS}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                          ej2Aprueba ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (ej2NotaParsed / EJ2_MAX_PUNTOS) * 100)}%` }}
                      />
                      <div
                        className="absolute inset-y-0 w-0.5 bg-foreground/40"
                        style={{ left: `${(EJ2_MINIMO / EJ2_MAX_PUNTOS) * 100}%` }}
                        title={`Minimo: ${EJ2_MINIMO} puntos`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-foreground/40 rounded-full" /> Minimo: {EJ2_MINIMO}
                      </span>
                      <span>{EJ2_MAX_PUNTOS}</span>
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                      * Nota estimada. La calificacion real depende de la valoracion del tribunal.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Formula */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Formula de puntuacion -- Ejercicio 1</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center">
                <p className="font-mono font-bold text-foreground text-base">
                  Nota = (Aciertos - Errores / 4) x 10 / 80
                </p>
                <p className="text-xs mt-2">
                  Escala 0-10. Minimo para aprobar: 5 puntos.
                </p>
              </div>
              <ul className="space-y-1">
                <li>Acierto: <strong className="text-foreground">suma al total</strong></li>
                <li>Error: <strong className="text-foreground">-1/4 del valor de un acierto</strong> (penalizacion -1/4)</li>
                <li>En blanco: <strong className="text-foreground">0 puntos</strong> (ni suma ni resta)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Info box */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Estructura del examen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">Ej. 1</Badge>
                  <span>80 preguntas tipo test con 4 opciones. Penalizacion -1/4. Escala 0-10, minimo 5. <strong className="text-foreground">Eliminatorio.</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">Ej. 2</Badge>
                  <span>10 supuestos de desarrollo escrito. Escala 0-30, minimo 15. <strong className="text-foreground">Eliminatorio.</strong> Valorado por el tribunal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">Total</Badge>
                  <span>Suma de ambos ejercicios. <strong className="text-foreground">Maximo 40 puntos.</strong></span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10">
            <CardContent className="pt-6 text-center">
              <p className="font-semibold mb-2">Prepara tu oposicion a Hacienda</p>
              <p className="text-sm text-muted-foreground mb-4">
                OpoRuta te ayuda a preparar oposiciones de la Administracion del Estado con tests por tema,
                simulacros con penalizacion real y analisis de errores con IA.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/oposiciones/hacienda">
                  <Button className="gap-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                    Ver plan Hacienda
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

      {/* --- SEO Content ------------------------------------------------ */}
      <section className="mt-16 border-t pt-12 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Como calcular tu nota del examen de Agente de Hacienda
        </h2>

        <div className="prose prose-neutral dark:prose-invert max-w-none
          prose-p:text-muted-foreground prose-li:text-muted-foreground
          prose-strong:text-foreground prose-headings:tracking-tight">

          <p>
            El examen de Agente de la Hacienda Publica consta de <strong>dos ejercicios eliminatorios</strong>.
            El primer ejercicio es un test de 80 preguntas con <strong>penalizacion -1/4</strong>: cada
            respuesta incorrecta descuenta un cuarto del valor de un acierto. Las respuestas en blanco no
            afectan a la puntuacion.
          </p>

          <h3>Ejercicio 1: Test (0-10 puntos)</h3>
          <p>
            Consiste en <strong>80 preguntas tipo test</strong> con 4 opciones de respuesta, de las cuales
            solo una es correcta. Se califica de 0 a 10 puntos y es necesario obtener un <strong>minimo
            de 5 puntos</strong> para superar este ejercicio. La formula es:
          </p>
          <p>
            <strong>Nota = (Aciertos - Errores/4) x 10 / 80</strong>
          </p>

          <h3>Ejercicio 2: Desarrollo escrito (0-30 puntos)</h3>
          <p>
            Consiste en <strong>10 supuestos de caracter practico</strong> que se responden por escrito.
            El tribunal califica este ejercicio de 0 a 30 puntos y es necesario obtener un <strong>minimo
            de 15 puntos</strong>. Al ser una evaluacion subjetiva del tribunal, no es posible calcular
            esta nota automaticamente; solo puedes estimarla.
          </p>

          <h3>Nota total</h3>
          <p>
            La nota total es la <strong>suma de ambos ejercicios</strong>, con un maximo de 40 puntos
            (10 + 30). Ambos ejercicios son eliminatorios: si no alcanzas el minimo en cualquiera de
            ellos, quedas eliminado independientemente de la nota del otro.
          </p>

          <h3>La regla de oro para la penalizacion -1/4</h3>
          <p>
            <strong>Si puedes descartar al menos 1 de las 4 opciones, arriesga. Si no, dejala en blanco.</strong>{' '}
            La penalizacion -1/4 esta matematicamente disenada para que responder al azar entre 4 opciones
            tenga esperanza cero. Pero en cuanto eliminas una opcion, las probabilidades juegan a tu favor:
            con 3 opciones, la esperanza es positiva (+1/12 por pregunta).
          </p>

          <h3>Otras calculadoras de nota</h3>
          <p>
            Si estas preparando otra oposicion, tenemos calculadoras especificas:
          </p>
          <ul>
            <li>
              <a href="/herramientas/calculadora-nota-auxiliar-administrativo">Calculadora Auxiliar Administrativo (C2)</a> -- penalizacion -1/3
            </li>
            <li>
              <a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora Administrativo del Estado (C1)</a> -- penalizacion -1/3
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
