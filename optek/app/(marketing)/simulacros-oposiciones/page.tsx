/**
 * app/(marketing)/simulacros/page.tsx
 *
 * Pagina publica SEO para "simulacro oposiciones online gratis".
 * Hub de todos los simulacros disponibles en OpoRuta (12 oposiciones).
 * Enlaza a /examenes-oficiales para simulacros INAP y a /register para practicar.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  ArrowRight, BookOpen, Timer, CheckCircle2, Shield,
  Building2, Mail, Scale, Landmark, Siren, GraduationCap,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Simulacros Oposiciones Online Gratis 2026: 12 oposiciones con IA | OpoRuta',
  description:
    'Practica con simulacros de examen para 12 oposiciones: AGE (C2, C1, A2), Correos, Justicia, Hacienda, Penitenciarias, Guardia Civil, Policia Nacional y Ertzaintza. Examenes reales INAP + generados con IA. Timer y penalizacion oficial. Gratis.',
  keywords: [
    'simulacro oposiciones online gratis',
    'simulacro examen oposiciones',
    'examen oposiciones online gratis',
    'simulacro INAP gratis',
    'test oposiciones simulacro',
    'practica examen oposiciones',
    'simulacro auxiliar administrativo',
    'simulacro correos 2026',
    'simulacro policia nacional',
    'simulacro guardia civil',
  ],
  openGraph: {
    title: 'Simulacros Oposiciones Online Gratis 2026 | OpoRuta',
    description: 'Simulacros de examen para 12 oposiciones. Examenes reales INAP + IA. Timer y penalizacion oficial.',
    type: 'website',
    url: `${APP_URL}/simulacros-oposiciones`,
    images: [{ url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent('Simulacros Oposiciones 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/simulacros-oposiciones` },
}

const SIMULACROS = [
  {
    icon: Building2,
    title: 'AGE: Auxiliar Administrativo (C2)',
    plazas: '1.700',
    preguntas: '100 preguntas',
    penalizacion: '-1/3',
    examenes: '4 examenes reales INAP (2018-2024)',
    link: '/examenes-oficiales',
    color: 'text-blue-600',
  },
  {
    icon: Building2,
    title: 'AGE: Administrativo del Estado (C1)',
    plazas: '2.512',
    preguntas: '70 test + 20 supuesto practico',
    penalizacion: '-1/3',
    examenes: '3 examenes reales INAP (2019-2024)',
    link: '/examenes-oficiales',
    color: 'text-blue-700',
  },
  {
    icon: Building2,
    title: 'AGE: Gestion GACE (A2)',
    plazas: '1.356',
    preguntas: '100 preguntas + supuesto desarrollo',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/administracion',
    color: 'text-blue-800',
  },
  {
    icon: Mail,
    title: 'Correos',
    plazas: '4.000+',
    preguntas: '100 preguntas (90 + 10 psico)',
    penalizacion: 'Sin penalizacion',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/correos',
    color: 'text-yellow-600',
  },
  {
    icon: Scale,
    title: 'Auxilio Judicial',
    plazas: '425',
    preguntas: '100 preguntas',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/justicia/auxilio-judicial',
    color: 'text-purple-600',
  },
  {
    icon: Scale,
    title: 'Tramitacion Procesal',
    plazas: '1.155',
    preguntas: '100 preguntas',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/justicia/tramitacion-procesal',
    color: 'text-purple-700',
  },
  {
    icon: Scale,
    title: 'Gestion Procesal',
    plazas: '725',
    preguntas: 'Test + caso practico desarrollo',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/justicia/gestion-procesal',
    color: 'text-purple-800',
  },
  {
    icon: Landmark,
    title: 'Agente de Hacienda (AEAT)',
    plazas: '1.000',
    preguntas: '80 + 10 preguntas',
    penalizacion: '-1/4',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/hacienda',
    color: 'text-green-600',
  },
  {
    icon: Shield,
    title: 'Instituciones Penitenciarias',
    plazas: '900',
    preguntas: '160 preguntas',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/penitenciarias',
    color: 'text-orange-600',
  },
  {
    icon: Siren,
    title: 'Guardia Civil',
    plazas: '3.118',
    preguntas: '100 preguntas',
    penalizacion: '-1/3',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/seguridad/guardia-civil',
    color: 'text-emerald-700',
  },
  {
    icon: Siren,
    title: 'Policia Nacional',
    plazas: '~3.000',
    preguntas: '100 preguntas (3 opciones)',
    penalizacion: '-1/2',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/seguridad/policia-nacional',
    color: 'text-sky-700',
  },
  {
    icon: Siren,
    title: 'Ertzaintza',
    plazas: '~800',
    preguntas: '~40 preguntas',
    penalizacion: 'Variable',
    examenes: 'Generados con IA verificada',
    link: '/oposiciones/seguridad/ertzaintza',
    color: 'text-red-700',
  },
]

export default function SimulacrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Simulacros Oposiciones Online Gratis 2026',
          description: 'Simulacros de examen para 12 oposiciones con IA verificada.',
          url: `${APP_URL}/simulacros-oposiciones`,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: SIMULACROS.length,
            itemListElement: SIMULACROS.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: s.title,
              url: `${APP_URL}${s.link}`,
            })),
          },
        }}
      />

      {/* Hero */}
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">18.000+ plazas en 2026</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simulacros de oposiciones online gratis
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Practica con examenes reales INAP y simulacros generados con IA verificada.
          Timer, penalizacion oficial y explicaciones de cada error.
          <strong> 12 oposiciones disponibles.</strong>
        </p>
      </div>

      {/* Features */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Timer, title: 'Timer real', desc: 'Countdown con el tiempo exacto del examen oficial' },
          { icon: CheckCircle2, title: 'Penalizacion oficial', desc: '-1/3, -1/4 o sin penalizacion segun la oposicion' },
          { icon: BookOpen, title: 'Explicaciones IA', desc: 'Cada error explicado con cita al articulo correcto' },
        ].map((f) => (
          <Card key={f.title} className="text-center">
            <CardContent className="pt-6">
              <f.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulacros grid */}
      <h2 className="mb-6 text-2xl font-bold">Elige tu oposicion</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIMULACROS.map((s) => (
          <Card key={s.title} className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <CardTitle className="text-base">{s.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div><strong>{s.plazas}</strong> plazas</div>
              <div>{s.preguntas}</div>
              <div>Penalizacion: {s.penalizacion}</div>
              <div className="text-xs">{s.examenes}</div>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link href={s.link}>
                  Practicar gratis <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* INAP section */}
      <div className="mt-12 rounded-lg border bg-muted/50 p-6 text-center">
        <GraduationCap className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h2 className="text-xl font-bold">Examenes reales INAP</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Practica con las preguntas exactas que puso el tribunal en convocatorias anteriores.
          C2: 2018, 2019, 2022, 2024. C1: 2019, 2022, 2024.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/examenes-oficiales">
            Ver examenes oficiales <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-bold">Empieza tu primer simulacro gratis</h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Sin tarjeta de credito. 3 simulacros gratis + tests por tema ilimitados.
          Preguntas verificadas contra legislacion oficial.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/register">
            Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
