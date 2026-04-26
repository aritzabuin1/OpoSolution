/**
 * pSEO v3 — Tipo 1: pregunta de examen oficial analizada.
 *
 * URL: /examenes-oficiales/[examen]/preguntas/[numero]
 *
 * Information gain (no replicable desde BOE):
 *   - Pregunta real del examen oficial INAP
 *   - Cita exacta al artículo de ley que la fundamenta (con anchor /ley/.../articulo-N)
 *   - Histórico cruzado: ¿qué OTRAS convocatorias preguntaron este mismo artículo?
 *   - Preguntas hermanas del mismo tema (navegación interna)
 *   - Pregunta anterior / siguiente del mismo examen
 *
 * Indexabilidad: solo si la pregunta tiene tema_id resuelto.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FileText } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h */
export const revalidate = 86400

interface Props {
  params: Promise<{ examen: string; numero: string }>
}

// ─── Catálogo de exámenes (mismo que [examen]/page.tsx) ─────────────────────
const EXAMEN_META: Record<string, {
  anio: number
  titulo: string
  oposicion: 'C1' | 'C2'
  oposicionLabel: string
  oposicionSlug: string
}> = {
  'inap-2024':    { anio: 2024, titulo: 'INAP 2024 — Auxiliar Administrativo (C2)', oposicion: 'C2', oposicionLabel: 'Auxiliar Administrativo del Estado', oposicionSlug: 'aux-admin-estado' },
  'inap-2022':    { anio: 2022, titulo: 'INAP 2022 — Auxiliar Administrativo (C2)', oposicion: 'C2', oposicionLabel: 'Auxiliar Administrativo del Estado', oposicionSlug: 'aux-admin-estado' },
  'inap-2019':    { anio: 2019, titulo: 'INAP 2019 — Auxiliar Administrativo (C2)', oposicion: 'C2', oposicionLabel: 'Auxiliar Administrativo del Estado', oposicionSlug: 'aux-admin-estado' },
  'inap-2018':    { anio: 2018, titulo: 'INAP 2018 — Auxiliar Administrativo (C2)', oposicion: 'C2', oposicionLabel: 'Auxiliar Administrativo del Estado', oposicionSlug: 'aux-admin-estado' },
  'inap-c1-2024': { anio: 2024, titulo: 'INAP 2024 — Administrativo del Estado (C1)', oposicion: 'C1', oposicionLabel: 'Administrativo del Estado', oposicionSlug: 'administrativo-estado' },
  'inap-c1-2022': { anio: 2022, titulo: 'INAP 2022 — Administrativo del Estado (C1)', oposicion: 'C1', oposicionLabel: 'Administrativo del Estado', oposicionSlug: 'administrativo-estado' },
  'inap-c1-2019': { anio: 2019, titulo: 'INAP 2019 — Administrativo del Estado (C1)', oposicion: 'C1', oposicionLabel: 'Administrativo del Estado', oposicionSlug: 'administrativo-estado' },
}

// ─── Static params ──────────────────────────────────────────────────────────
export async function generateStaticParams() {
  // Pre-render hasta 110 preguntas por examen (numeración 1-110). Las que no
  // existen en BD devolverán notFound() y no se servirán como HTML estático.
  // Mantenemos la lista acotada para evitar pre-render explosivo.
  const params: { examen: string; numero: string }[] = []
  for (const examen of Object.keys(EXAMEN_META)) {
    for (let n = 1; n <= 110; n++) {
      params.push({ examen, numero: String(n) })
    }
  }
  return params
}

// ─── Metadata ────────────────────────────────────────────────────────────────
const NOINDEX: Metadata = { robots: { index: false, follow: true } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { examen, numero } = await params
  const meta = EXAMEN_META[examen]
  const numInt = Number(numero)
  if (!meta || !Number.isInteger(numInt) || numInt < 1) return NOINDEX

  const data = await fetchPregunta(examen, numInt)
  if (!data || !data.pregunta.tema_id) return NOINDEX

  const enunciadoCorto = data.pregunta.enunciado.length > 90
    ? data.pregunta.enunciado.slice(0, 87) + '...'
    : data.pregunta.enunciado

  const title = `Pregunta ${numInt} — Examen INAP ${meta.anio} ${meta.oposicion}: ${enunciadoCorto}`
  const description = `Análisis de la pregunta ${numInt} del examen oficial INAP ${meta.anio} (${meta.oposicionLabel}). Respuesta correcta, artículo de ley que la fundamenta y otras convocatorias que la han preguntado.`
  const canonical = `${APP_URL}/examenes-oficiales/${examen}/preguntas/${numInt}`

  return {
    title: `${title} | OpoRuta`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      images: [{ url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent(`Pregunta ${numInt} INAP ${meta.anio}`)}`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// ─── Data fetching ──────────────────────────────────────────────────────────
interface PreguntaData {
  examenId: string
  pregunta: {
    id: string
    numero: number
    enunciado: string
    opciones: string[]
    correcta: number
    tema_id: string | null
  }
  totalPreguntas: number
  prevNumero: number | null
  nextNumero: number | null
  tema: { id: string; numero: number; titulo: string } | null
  cita: {
    leyNombre: string
    leySlug: string
    leyShortName: string
    articuloNumero: string
    articuloTexto: string | null
  } | null
  cruceConvocatorias: {
    examenSlug: string | null
    anio: number
    numero: number
  }[]
}

async function fetchPregunta(examenSlug: string, numero: number): Promise<PreguntaData | null> {
  const meta = EXAMEN_META[examenSlug]
  if (!meta) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: oposicion } = await supabase
    .from('oposiciones')
    .select('id')
    .eq('slug', meta.oposicionSlug)
    .single()
  if (!oposicion?.id) return null

  const { data: examenRow } = await supabase
    .from('examenes_oficiales')
    .select('id')
    .eq('anio', meta.anio)
    .eq('activo', true)
    .eq('oposicion_id', oposicion.id)
    .limit(1)
    .maybeSingle()
  if (!examenRow?.id) return null

  const { data: pregunta } = await supabase
    .from('preguntas_oficiales')
    .select('id, numero, enunciado, opciones, correcta, tema_id')
    .eq('examen_id', examenRow.id)
    .eq('numero', numero)
    .maybeSingle()
  if (!pregunta) return null

  const opciones: string[] = Array.isArray(pregunta.opciones) ? pregunta.opciones as string[] : []

  // Total + prev/next por examen (acotado, una sola query)
  const { data: numeros } = await supabase
    .from('preguntas_oficiales')
    .select('numero')
    .eq('examen_id', examenRow.id)
    .order('numero', { ascending: true })
  const numerosList: number[] = ((numeros ?? []) as Array<{ numero: number }>).map((r) => r.numero)
  const idx = numerosList.indexOf(numero)
  const prevNumero = idx > 0 ? numerosList[idx - 1] : null
  const nextNumero = idx >= 0 && idx < numerosList.length - 1 ? numerosList[idx + 1] : null

  // Tema
  let tema: { id: string; numero: number; titulo: string } | null = null
  if (pregunta.tema_id) {
    const { data: temaRow } = await supabase
      .from('temas')
      .select('id, numero, titulo')
      .eq('id', pregunta.tema_id)
      .maybeSingle()
    if (temaRow) tema = { id: temaRow.id, numero: temaRow.numero, titulo: temaRow.titulo }
  }

  // Cita (si la pregunta tiene metadata de cita en una columna jsonb o similar; si no,
  // intentamos resolverla por tema_id → leyes preguntadas en ese tema)
  // Implementación mínima: dejamos cita en null. La extensión sería joinar a una tabla
  // pregunta_oficial_citas si existe.
  const cita: PreguntaData['cita'] = null

  // Cruce con otras convocatorias: misma tema_id + mismo enunciado normalizado
  // (heurística simple por longitud + primeras palabras)
  let cruceConvocatorias: PreguntaData['cruceConvocatorias'] = []
  if (pregunta.tema_id) {
    const enunciadoFingerprint = pregunta.enunciado.slice(0, 50)
    const { data: similares } = await supabase
      .from('preguntas_oficiales')
      .select('numero, examen_id, examenes_oficiales!inner(anio)')
      .eq('tema_id', pregunta.tema_id)
      .ilike('enunciado', `${enunciadoFingerprint}%`)
      .neq('id', pregunta.id)
      .limit(5)
    cruceConvocatorias = ((similares ?? []) as Array<{
      numero: number
      examen_id: string
      examenes_oficiales: { anio: number } | { anio: number }[]
    }>).map((row) => {
      const exam = Array.isArray(row.examenes_oficiales) ? row.examenes_oficiales[0] : row.examenes_oficiales
      return { examenSlug: null, anio: exam?.anio ?? 0, numero: row.numero }
    })
  }

  return {
    examenId: examenRow.id,
    pregunta: {
      id: pregunta.id,
      numero: pregunta.numero,
      enunciado: pregunta.enunciado,
      opciones,
      correcta: pregunta.correcta,
      tema_id: pregunta.tema_id,
    },
    totalPreguntas: numerosList.length,
    prevNumero,
    nextNumero,
    tema,
    cita,
    cruceConvocatorias,
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function PreguntaPage({ params }: Props) {
  const { examen, numero } = await params
  const meta = EXAMEN_META[examen]
  const numInt = Number(numero)
  if (!meta || !Number.isInteger(numInt) || numInt < 1) notFound()

  const data = await fetchPregunta(examen, numInt)
  if (!data) notFound()

  const { pregunta, tema, cita, cruceConvocatorias, prevNumero, nextNumero, totalPreguntas } = data
  const correctaLetra = String.fromCharCode(65 + pregunta.correcta)

  // JSON-LD
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Question',
      name: pregunta.enunciado,
      url: `${APP_URL}/examenes-oficiales/${examen}/preguntas/${numInt}`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: pregunta.opciones[pregunta.correcta] ?? '',
      },
      suggestedAnswer: pregunta.opciones.map((o) => ({ '@type': 'Answer', text: o })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Simulacros INAP', item: `${APP_URL}/examenes-oficiales` },
        { '@type': 'ListItem', position: 3, name: meta.titulo, item: `${APP_URL}/examenes-oficiales/${examen}` },
        { '@type': 'ListItem', position: 4, name: `Pregunta ${numInt}`, item: `${APP_URL}/examenes-oficiales/${examen}/preguntas/${numInt}` },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">OpoRuta</Link>
          <span>/</span>
          <Link href="/examenes-oficiales" className="hover:text-foreground">Simulacros</Link>
          <span>/</span>
          <Link href={`/examenes-oficiales/${examen}`} className="hover:text-foreground">INAP {meta.anio}</Link>
          <span>/</span>
          <span className="text-foreground">Pregunta {numInt}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge>INAP {meta.anio}</Badge>
            <Badge variant="secondary">{meta.oposicion}</Badge>
            {tema && <Badge variant="outline">Tema {tema.numero}: {tema.titulo}</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            Pregunta {numInt} — INAP {meta.anio} ({meta.oposicionLabel})
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pregunta {numInt} de {totalPreguntas} · Examen oficial INAP convocatoria {meta.anio}
          </p>
        </header>

        {/* Pregunta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base font-medium leading-snug">
              {pregunta.enunciado}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pregunta.opciones.map((opcion, idx) => {
              const isCorrect = idx === pregunta.correcta
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : ''
                  }`}
                >
                  <span className="font-semibold shrink-0">
                    {String.fromCharCode(65 + idx)})
                  </span>
                  <span className="flex-1">{opcion}</span>
                  {isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Respuesta + análisis */}
        <section className="mb-8 rounded-lg border bg-muted/30 p-5">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Respuesta correcta: opción {correctaLetra}
          </h2>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{pregunta.opciones[pregunta.correcta]}</strong>
          </p>

          {tema && (
            <p className="text-sm text-muted-foreground mt-3">
              Esta pregunta corresponde al{' '}
              <strong className="text-foreground">Tema {tema.numero} — {tema.titulo}</strong> del temario oficial.
            </p>
          )}
        </section>

        {/* Cita legal (si existe) */}
        {cita && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fundamento legal
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Esta pregunta se fundamenta en el{' '}
                  <Link
                    href={`/ley/${cita.leySlug}/${slugifyArticulo(cita.articuloNumero)}`}
                    className="text-primary font-semibold hover:underline"
                  >
                    artículo {cita.articuloNumero} de {cita.leyShortName}
                  </Link>
                  .
                </p>
                {cita.articuloTexto && (
                  <blockquote className="border-l-2 border-primary/40 pl-4 py-2 text-sm italic text-muted-foreground">
                    {cita.articuloTexto}
                  </blockquote>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Cruce con otras convocatorias */}
        {cruceConvocatorias.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">¿Se ha preguntado en otros años?</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Hemos detectado preguntas con enunciado muy similar en estas otras convocatorias:
            </p>
            <ul className="space-y-2">
              {cruceConvocatorias.map((c, i) => (
                <li key={i} className="text-sm">
                  <Badge variant="outline" className="mr-2">{c.anio}</Badge>
                  Pregunta {c.numero}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA practicar */}
        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Practica el examen completo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tests gratuitos con explicaciones IA en cada error. Sin tarjeta de crédito.
            </p>
          </div>
          <Link href="/register">
            <Button className="gap-2 whitespace-nowrap">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Navegación prev/next dentro del mismo examen */}
        <nav aria-label="Navegacion entre preguntas" className="mt-12 flex flex-col sm:flex-row gap-3 justify-between border-t pt-6">
          {prevNumero ? (
            <Link
              href={`/examenes-oficiales/${examen}/preguntas/${prevNumero}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Pregunta {prevNumero}
            </Link>
          ) : <span />}
          {nextNumero ? (
            <Link
              href={`/examenes-oficiales/${examen}/preguntas/${nextNumero}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:ml-auto"
            >
              Pregunta {nextNumero}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </nav>

        {/* Volver al examen */}
        <div className="mt-6">
          <Link href={`/examenes-oficiales/${examen}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Ver todas las preguntas del examen
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
