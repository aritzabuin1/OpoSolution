/**
 * app/(marketing)/examenes-oficiales/[examen]/page.tsx — §1.21.6 PRIORIDAD 1
 *
 * Página pública de simulacro oficial INAP para SEO.
 * Muestra las primeras 10 preguntas del examen real (preview gratuita).
 * Paywall: respuestas + explicaciones IA → registro en OpoRuta.
 *
 * Fetching con createServiceClient() — bypasa RLS para contenido público.
 * Las preguntas_oficiales son contenido educativo público (exámenes oficiales).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { ArrowRight, BookOpen, Timer, CheckCircle2, Lock } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// ─── Catálogo de exámenes conocidos ──────────────────────────────────────────

const EXAMEN_META: Record<string, {
  anio: number
  titulo: string
  description: string
  keywords: string[]
}> = {
  'inap-2024': {
    anio: 2024,
    titulo: 'Examen Oficial INAP 2024 — Auxiliar Administrativo del Estado',
    description:
      'Practica con las preguntas reales del examen oficial INAP 2024 del Cuerpo General Auxiliar de la Administración del Estado. Con respuestas y explicaciones IA de cada error.',
    keywords: [
      'examen auxiliar administrativo INAP 2024',
      'simulacro INAP 2024 con respuestas',
      'preguntas examen auxiliar estado 2024',
      'test oposiciones TAC 2024',
    ],
  },
  'inap-2023': {
    anio: 2023,
    titulo: 'Examen Oficial INAP 2023 — Auxiliar Administrativo del Estado',
    description:
      'Practica con las preguntas reales del examen oficial INAP 2023 del Cuerpo General Auxiliar de la Administración del Estado. Con respuestas y explicaciones IA de cada error.',
    keywords: [
      'examen auxiliar administrativo INAP 2023',
      'simulacro INAP 2023 con respuestas',
      'preguntas examen auxiliar estado 2023',
      'test oposiciones TAC 2023',
    ],
  },
  'inap-2022': {
    anio: 2022,
    titulo: 'Examen Oficial INAP 2022 — Auxiliar Administrativo del Estado',
    description:
      'Practica con las preguntas reales del examen oficial INAP 2022 del Cuerpo General Auxiliar de la Administración del Estado. Con respuestas y explicaciones IA de cada error.',
    keywords: [
      'examen auxiliar administrativo INAP 2022',
      'simulacro INAP 2022 con respuestas',
      'preguntas examen auxiliar estado 2022',
      'test oposiciones TAC 2022',
    ],
  },
  'inap-2021': {
    anio: 2021,
    titulo: 'Examen Oficial INAP 2021 — Auxiliar Administrativo del Estado',
    description:
      'Practica con las preguntas reales del examen oficial INAP 2021 del Cuerpo General Auxiliar de la Administración del Estado. Con respuestas y explicaciones IA de cada error.',
    keywords: [
      'examen auxiliar administrativo INAP 2021',
      'simulacro INAP 2021 con respuestas',
      'preguntas examen auxiliar estado 2021',
      'test oposiciones TAC 2021',
    ],
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreguntaPreview {
  numero: number
  enunciado: string
  opciones: string[]
}

interface Props {
  params: Promise<{ examen: string }>
}

// ─── Static params (SSG) ──────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(EXAMEN_META).map((examen) => ({ examen }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examen } = await params
  const meta = EXAMEN_META[examen]
  if (!meta) return {}

  const ogUrl = `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent(`Simulacro INAP ${meta.anio}`)}`

  return {
    title: `${meta.titulo} — OpoRuta`,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.titulo,
      description: meta.description,
      type: 'website',
      url: `${APP_URL}/examenes-oficiales/${examen}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: meta.titulo }],
    },
    alternates: {
      canonical: `${APP_URL}/examenes-oficiales/${examen}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SimulacroExamenPage({ params }: Props) {
  const { examen } = await params
  const meta = EXAMEN_META[examen]
  if (!meta) notFound()

  // Fetch exam data using service client (bypasses RLS for public marketing page)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: examenData } = await supabase
    .from('examenes_oficiales')
    .select('id, anio, convocatoria, activo')
    .eq('anio', meta.anio)
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  let preguntas: PreguntaPreview[] = []
  let totalPreguntas = 0

  if (examenData?.id) {
    const { data: preguntasData, count } = await supabase
      .from('preguntas_oficiales')
      .select('numero, enunciado, opciones', { count: 'exact' })
      .eq('examen_id', examenData.id)
      .order('numero', { ascending: true })
      .limit(10)

    preguntas = ((preguntasData ?? []) as Array<{
      numero: number
      enunciado: string
      opciones: unknown
    }>).map((p) => ({
      numero: p.numero,
      enunciado: p.enunciado,
      opciones: Array.isArray(p.opciones) ? (p.opciones as string[]) : [],
    }))
    totalPreguntas = count ?? 0
  }

  // JSON-LD — Quiz schema para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: meta.titulo,
    description: meta.description,
    url: `${APP_URL}/examenes-oficiales/${examen}`,
    author: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
    educationalLevel: 'Professional',
    educationalUse: 'Practice',
    about: {
      '@type': 'EducationalOccupationalCredential',
      name: 'Cuerpo General Auxiliar de la Administración del Estado',
      credentialCategory: 'Oposición',
    },
    ...(preguntas.length > 0 && {
      hasPart: preguntas.slice(0, 3).map((p) => ({
        '@type': 'Question',
        name: p.enunciado,
        suggestedAnswer: p.opciones.map((o) => ({
          '@type': 'Answer',
          text: o,
        })),
      })),
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
          <span>/</span>
          <Link href="/examenes-oficiales" className="hover:text-foreground transition-colors">Simulacros</Link>
          <span>/</span>
          <span className="text-foreground">INAP {meta.anio}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <Badge className="mb-3">INAP Oficial</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            {meta.titulo}
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
            {meta.description}
          </p>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-6">
            {totalPreguntas > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                <span><strong>{totalPreguntas}</strong> preguntas oficiales</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-primary" />
              <span><strong>90 minutos</strong> · formato oficial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Explicaciones IA disponibles en OpoRuta</span>
            </div>
          </div>
        </header>

        {/* CTA destacada */}
        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Practica el examen completo de forma interactiva</p>
            <p className="text-sm text-muted-foreground mt-1">
              5 tests gratuitos. Sin tarjeta de crédito. Respuestas y explicaciones IA de cada error.
            </p>
          </div>
          <Link href="/register">
            <Button className="gap-2 whitespace-nowrap">
              Empezar gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Vista previa de preguntas */}
        {preguntas.length > 0 ? (
          <>
            <h2 className="text-xl font-bold mb-6">
              Vista previa — Primeras {preguntas.length} preguntas
            </h2>

            <div className="space-y-6 mb-10">
              {preguntas.map((pregunta, idx) => (
                <Card key={pregunta.numero} className={idx >= 5 ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium leading-snug">
                      <span className="text-muted-foreground mr-2 font-bold">
                        {pregunta.numero}.
                      </span>
                      {pregunta.enunciado}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pregunta.opciones.map((opcion, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                        >
                          <span className="font-semibold text-muted-foreground shrink-0">
                            {String.fromCharCode(65 + oIdx)})
                          </span>
                          <span className="text-muted-foreground">{opcion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paywall CTA */}
            <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
              <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-xl font-bold mb-2">
                {totalPreguntas > 10
                  ? `+${totalPreguntas - 10} preguntas más en OpoRuta`
                  : 'Respuestas y explicaciones en OpoRuta'}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Regístrate para ver las respuestas correctas, practicar el examen completo con
                penalización real (-1/3) y obtener explicaciones IA de cada error.
                El primer examen es completamente gratuito.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Ver respuestas gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Ya tengo cuenta
                  </Button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          // Estado vacío — datos no ingestados aún
          <>
            <h2 className="text-xl font-bold mb-6">Sobre este examen</h2>
            <div className="space-y-4 mb-8 text-muted-foreground">
              <p>
                El <strong className="text-foreground">examen oficial INAP {meta.anio}</strong> del
                Cuerpo General Auxiliar de la Administración del Estado está compuesto por 100 preguntas
                de tipo test en 90 minutos, divididas en dos partes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-foreground">Parte 1 (50 puntos):</strong> 30 preguntas de
                  Bloque I (organización pública, legislación) + 30 psicotécnicas
                </li>
                <li>
                  <strong className="text-foreground">Parte 2 (50 puntos):</strong> 50 preguntas de
                  Bloque II (administración práctica y ofimática)
                </li>
              </ul>
              <p>
                Se aplica una penalización de <strong className="text-foreground">-1/3</strong> por
                cada respuesta incorrecta. Las respuestas en blanco no penalizan.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-bold mb-2">Simulacro disponible próximamente</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Las preguntas del examen INAP {meta.anio} se están procesando. Mientras tanto,
                puedes preparar tu oposición con tests por tema generados con IA y verificación
                de citas legales.
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Practicar por temas gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}

        {/* Información complementaria */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-lg font-bold mb-4">¿Por qué practicar con exámenes oficiales INAP?</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground mb-1">Preguntas reales</p>
              <p>Las mismas preguntas que cayeron en el examen oficial. Sin simulaciones artificiales.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground mb-1">Penalización real</p>
              <p>Practica con el sistema de penalización -1/3 para acostumbrarte a la presión del examen.</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground mb-1">Explicaciones IA</p>
              <p>Cuando fallas una pregunta, la IA te explica por qué la respuesta correcta es correcta.</p>
            </div>
          </div>
        </div>

        {/* Otros simulacros */}
        <div className="mt-8">
          <Link href="/examenes-oficiales">
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Ver todos los simulacros INAP
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
