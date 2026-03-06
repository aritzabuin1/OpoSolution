/**
 * app/(marketing)/examenes-oficiales/page.tsx — §1.21.6 PRIORIDAD 1
 *
 * Página índice pública de simulacros INAP para SEO.
 * Hub de todos los exámenes oficiales disponibles.
 * Enlaza a cada simulacro individual con vista previa de preguntas reales.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen, Trophy, Timer, CheckCircle2 } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Simulacros Examen INAP — Auxiliar Administrativo del Estado | OpoRuta',
  description:
    'Practica con exámenes reales del INAP para el Cuerpo General Auxiliar de la Administración del Estado. Convocatorias 2024, 2022, 2019 y 2018 con preguntas oficiales y explicaciones IA. Completamente gratis.',
  keywords: [
    'simulacro examen INAP auxiliar administrativo',
    'examen oficial INAP preguntas reales',
    'test oposiciones auxiliar administrativo con respuestas',
    'simulacro auxiliar estado gratis',
    'examen cuerpo general auxiliar administración',
  ],
  openGraph: {
    title: 'Simulacros INAP Oficiales — OpoRuta',
    description:
      'Practica con preguntas reales de convocatorias INAP anteriores. Explicaciones IA de cada error.',
    type: 'website',
    url: `${APP_URL}/examenes-oficiales`,
    images: [
      {
        url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent('Simulacros INAP Oficiales')}`,
        width: 1200,
        height: 630,
        alt: 'Simulacros INAP OpoRuta',
      },
    ],
  },
  alternates: {
    canonical: `${APP_URL}/examenes-oficiales`,
  },
}

// Catálogo de exámenes — sincronizado con [examen]/page.tsx
const SIMULACROS = [
  {
    slug: 'inap-2024',
    anio: 2024,
    titulo: 'Examen Oficial INAP 2024',
    descripcion:
      'La convocatoria más reciente. Incluye los nuevos temas sobre Windows 11, Office 365 y LGTBI.',
    preguntas: '40 preguntas disponibles',
    disponible: true,
    destacado: true,
  },
  {
    slug: 'inap-2022',
    anio: 2022,
    titulo: 'Examen Oficial INAP 2022',
    descripcion:
      'Convocatoria 2022. Primer examen post-pandemia. Alta frecuencia en LPAC y procedimiento administrativo.',
    preguntas: '60 preguntas',
    disponible: true,
    destacado: false,
  },
  {
    slug: 'inap-2019',
    anio: 2019,
    titulo: 'Examen Oficial INAP 2019',
    descripcion:
      'Convocatoria ordinaria 2019. Clásico del temario con equilibrio entre Bloque I y ofimática.',
    preguntas: '60 preguntas',
    disponible: true,
    destacado: false,
  },
  {
    slug: 'inap-2018',
    anio: 2018,
    titulo: 'Examen Oficial INAP 2018',
    descripcion:
      'Convocatoria 2018. Enfoque clásico en derecho administrativo y ofimática. Modelo A con 46 preguntas recuperadas del examen escaneado.',
    preguntas: '46 preguntas',
    disponible: true,
    destacado: false,
  },
]

export default function SimulacrosIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Simulacros Examen INAP — Auxiliar Administrativo del Estado',
    description: 'Lista de exámenes oficiales INAP con preguntas reales para práctica.',
    url: `${APP_URL}/examenes-oficiales`,
    itemListElement: SIMULACROS.filter((s) => s.disponible).map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: s.titulo,
      url: `${APP_URL}/examenes-oficiales/${s.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-4">
            <Trophy className="h-3 w-3 mr-1" />
            INAP Oficial
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simulacros de Examen INAP
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
            Practica con preguntas <strong>reales</strong> de convocatorias oficiales del
            Cuerpo General Auxiliar de la Administración del Estado.
            Completamente gratis.
          </p>

          {/* Ventajas */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Preguntas reales del INAP</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="h-4 w-4 text-primary" />
              <span>110 preguntas · 90 min · formato oficial</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Penalización -1/3 incluida</span>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="mb-8 rounded-xl bg-primary/5 border border-primary/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Practica y recibe explicaciones IA de cada error</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simulacros gratuitos. Sin tarjeta de crédito.
            </p>
          </div>
          <Link href="/register">
            <Button className="gap-2 whitespace-nowrap">
              Empezar gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid de simulacros */}
        <div className="space-y-4">
          {SIMULACROS.map((sim) => (
            <Card
              key={sim.slug}
              className={`transition-shadow ${sim.disponible ? 'hover:shadow-md' : 'opacity-60'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{sim.titulo}</CardTitle>
                      {sim.destacado && (
                        <Badge className="text-xs">Más reciente</Badge>
                      )}
                      {!sim.disponible && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Próximamente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{sim.preguntas}</p>
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30 shrink-0">
                    {sim.anio}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{sim.descripcion}</p>
                {sim.disponible ? (
                  <Link href={`/examenes-oficiales/${sim.slug}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      Ver preguntas
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                    Disponible próximamente
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer informativo */}
        <div className="mt-12 border-t pt-8 grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <h2 className="font-semibold text-foreground mb-2">¿Qué incluye cada simulacro?</h2>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>Preguntas íntegras tal como salieron en el examen</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>Vista previa de las primeras 10 preguntas sin registro</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>Respuestas oficiales y explicaciones IA de cada error</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>Sistema de penalización real (-1/3 por incorrecta)</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-foreground mb-2">Fuentes oficiales</h2>
            <p>
              Todas las preguntas provienen de los exámenes oficiales publicados por el{' '}
              <strong className="text-foreground">INAP (Instituto Nacional de Administración Pública)</strong>{' '}
              para el Cuerpo General Auxiliar de la Administración del Estado (C2).
            </p>
            <p className="mt-2">
              Los simulacros son gratuitos. Los exámenes oficiales son dominio público.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
