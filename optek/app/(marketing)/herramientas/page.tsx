import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, ArrowRight, Wrench } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas`

export const metadata: Metadata = {
  title: 'Herramientas gratuitas para opositores — OpoRuta',
  description:
    'Calculadoras de nota con penalización -1/3 para Auxiliar Administrativo (C2) y Administrativo del Estado (C1). Herramientas gratuitas para preparar tu oposición.',
  keywords: [
    'herramientas oposiciones',
    'calculadora nota oposiciones',
    'calculadora penalización 1/3',
    'herramientas auxiliar administrativo',
    'herramientas administrativo estado',
    'calculadora nota INAP',
  ],
  openGraph: {
    title: 'Herramientas gratuitas para opositores — OpoRuta',
    description: 'Calculadoras de nota con penalización -1/3 para C1 y C2. Gratis.',
    type: 'website',
    url: PAGE_URL,
    images: [{
      url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Herramientas para Opositores')}`,
      width: 1200,
      height: 630,
      alt: 'Herramientas gratuitas para opositores — OpoRuta',
    }],
  },
  alternates: { canonical: PAGE_URL },
}

const tools = [
  {
    title: 'Calculadora de nota — Auxiliar Administrativo (C2)',
    description: 'Calcula tu nota con la penalización -1/3 oficial. Primera parte (60 preguntas: teoría + psicotécnicos) y segunda parte (50 preguntas: ofimática). Descubre si apruebas.',
    href: '/herramientas/calculadora-nota-auxiliar-administrativo',
    badge: 'C2 — Auxiliar',
    parts: '60 + 50 preguntas · 90 min',
  },
  {
    title: 'Calculadora de nota — Administrativo del Estado (C1)',
    description: 'Calcula tu nota con la penalización -1/3 oficial. Cuestionario (70 preguntas: legislación + ofimática) y supuesto práctico (20 preguntas). Descubre si apruebas.',
    href: '/herramientas/calculadora-nota-administrativo-estado',
    badge: 'C1 — Administrativo',
    parts: '70 + 20 preguntas · 100 min',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Herramientas gratuitas para opositores',
  description: 'Calculadoras de nota y herramientas de estudio para oposiciones AGE.',
  url: PAGE_URL,
  numberOfItems: tools.length,
  itemListElement: tools.map((tool, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: tool.title,
    url: `${APP_URL}${tool.href}`,
  })),
}

export default function HerramientasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">OpoRuta</Link>
          <span>/</span>
          <span className="text-foreground">Herramientas</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <Badge className="mb-3 gap-1">
            <Wrench className="h-3 w-3" />
            100% gratuitas
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            Herramientas gratuitas para opositores
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
            Calculadoras de nota, simulacros y recursos para preparar tu oposición
            al Cuerpo General de la Administración del Estado.
          </p>
        </header>

        {/* Tool cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{tool.badge}</Badge>
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">{tool.parts}</span>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Usar calculadora <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* SEO content */}
        <section className="mt-16 border-t pt-12 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Calcula tu nota de oposición con penalización -1/3
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none
            prose-p:text-muted-foreground prose-li:text-muted-foreground
            prose-strong:text-foreground prose-headings:tracking-tight">
            <p>
              Los exámenes del Cuerpo General de la Administración del Estado (tanto C1 como C2)
              aplican una <strong>penalización de -1/3</strong>: cada respuesta incorrecta descuenta
              un tercio del valor de un acierto. Las respuestas en blanco no afectan a la puntuación.
            </p>
            <p>
              Nuestras calculadoras te permiten introducir tus aciertos y errores de cada parte del
              examen y ver al instante si alcanzas el mínimo de 25 puntos por parte y si superarías
              la nota de corte de la última convocatoria. Son 100% gratuitas y no requieren registro.
            </p>
            <h3>¿Qué oposición estás preparando?</h3>
            <ul>
              <li>
                <strong><a href="/herramientas/calculadora-nota-auxiliar-administrativo">Auxiliar Administrativo (C2)</a></strong>
                {' '}— 100 preguntas puntuables en 90 minutos. Primera parte: teoría + psicotécnicos.
                Segunda parte: ofimática.
              </li>
              <li>
                <strong><a href="/herramientas/calculadora-nota-administrativo-estado">Administrativo del Estado (C1)</a></strong>
                {' '}— 90 preguntas puntuables en 100 minutos. Primera parte: cuestionario (legislación + ofimática).
                Segunda parte: supuesto práctico.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  )
}
