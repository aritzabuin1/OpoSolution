import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Simulacros Oficiales INAP — Exámenes del Auxiliar Administrativo del Estado',
  description:
    'Practica con los exámenes oficiales del INAP para el Cuerpo General Auxiliar de la Administración del Estado. Preguntas reales de convocatorias 2021-2024 con respuestas y explicaciones IA.',
  keywords: [
    'simulacro INAP auxiliar administrativo',
    'examen oficial auxiliar estado PDF',
    'preguntas examen TAC resueltas',
    'test oposiciones auxiliar administrativo',
  ],
  openGraph: {
    title: 'Simulacros Oficiales INAP — Auxiliar Administrativo del Estado',
    description:
      'Practica con exámenes oficiales reales del INAP. Respuestas + explicaciones IA de cada error.',
    type: 'website',
  },
}

const EXAMENES = [
  {
    slug: 'inap-2024',
    anio: 2024,
    label: 'Convocatoria 2024',
    preguntas: 100,
    disponible: true,
  },
  {
    slug: 'inap-2023',
    anio: 2023,
    label: 'Convocatoria 2023',
    preguntas: 100,
    disponible: true,
  },
  {
    slug: 'inap-2022',
    anio: 2022,
    label: 'Convocatoria 2022',
    preguntas: 100,
    disponible: true,
  },
  {
    slug: 'inap-2021',
    anio: 2021,
    label: 'Convocatoria 2021',
    preguntas: 100,
    disponible: true,
  },
]

export default function SimulacrosIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4">
          <BookOpen className="h-3 w-3 mr-1" />
          Simulacros Oficiales INAP
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Exámenes Oficiales del Auxiliar Administrativo
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Practica con las preguntas reales de convocatorias INAP anteriores.
          Las mismas preguntas que cayeron en el examen oficial, con explicaciones IA de cada respuesta.
        </p>
      </div>

      {/* Grid de exámenes */}
      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {EXAMENES.map((examen) => (
          <Card key={examen.slug} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge>{examen.label}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {examen.anio}
                </span>
              </div>
              <CardTitle className="text-lg mt-2">
                Auxiliar Administrativo del Estado — INAP {examen.anio}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {examen.preguntas} preguntas oficiales · 90 minutos · Penalización -1/3
              </p>
              <Link href={`/simulacros/${examen.slug}`}>
                <Button className="w-full gap-2">
                  Ver examen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-8 text-center">
        <h2 className="text-xl font-bold mb-2">
          Practica de forma interactiva con IA
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
          Regístrate en OpoRuta para acceder al simulacro completo, ver las respuestas correctas
          y obtener explicaciones IA detalladas de cada pregunta que has fallado.
          5 tests gratuitos, sin tarjeta de crédito.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Empezar gratis
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
    </div>
  )
}
