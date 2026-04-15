import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, Scale, Mail, Landmark, Lock, Shield, ArrowRight, Users,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Oposiciones cubiertas por OpoRuta (abril 2026) — 12 oposiciones, +20.000 plazas',
  description:
    'OpoRuta cubre 12 oposiciones en 2026: AGE (C2, C1, A2), Justicia (Auxilio, Tramitación, Gestión), Correos, Hacienda AEAT, Penitenciarias, Policía Nacional, Guardia Civil y Ertzaintza. Más de 20.000 plazas convocadas.',
  keywords: [
    'oposiciones OpoRuta', 'oposiciones cubiertas OpoRuta', 'catálogo oposiciones OpoRuta',
    'oposiciones AGE 2026', 'oposiciones justicia 2026', 'oposiciones correos 2026',
    'oposiciones seguridad 2026', 'oposiciones hacienda 2026', 'oposiciones penitenciarias 2026',
  ],
  openGraph: {
    title: 'Oposiciones cubiertas por OpoRuta — 12 oposiciones, +20.000 plazas',
    description: 'AGE, Justicia, Correos, Hacienda, Penitenciarias, Policía Nacional, Guardia Civil y Ertzaintza. Tests con IA verificada contra el BOE.',
    url: `${APP_URL}/oposiciones`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('12 Oposiciones OpoRuta 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones` },
}

const RAMAS = [
  {
    nombre: 'Administración General del Estado (AGE)',
    icon: Landmark,
    color: 'text-blue-600',
    href: '/oposiciones/administracion',
    oposiciones: [
      { nombre: 'Auxiliar Administrativo del Estado', nivel: 'C2', plazas: '1.700', temas: 28, slug: 'aux-admin-estado', desc: 'ESO · 100 preguntas test · Penalización -1/3 · Examen 23 mayo 2026' },
      { nombre: 'Administrativo del Estado', nivel: 'C1', plazas: '2.512', temas: 45, slug: 'administrativo-estado', desc: 'Bachillerato · Test + supuesto práctico · Examen 23 mayo 2026' },
      { nombre: 'Gestión del Estado (GACE)', nivel: 'A2', plazas: '1.356', temas: 58, slug: 'gestion-estado', desc: 'Grado universitario · Test + supuesto práctico · Examen 23 mayo 2026' },
    ],
  },
  {
    nombre: 'Justicia (MJU)',
    icon: Scale,
    color: 'text-purple-600',
    href: '/oposiciones/justicia',
    oposiciones: [
      { nombre: 'Auxilio Judicial', nivel: 'C2', plazas: '425', temas: 26, slug: 'auxilio-judicial', desc: 'ESO · Test + caso práctico · Examen sept-oct 2026' },
      { nombre: 'Tramitación Procesal', nivel: 'C1', plazas: '1.155', temas: 37, slug: 'tramitacion-procesal', desc: 'Bachillerato · Test + caso práctico + ofimática · Examen sept-oct 2026' },
      { nombre: 'Gestión Procesal', nivel: 'A2', plazas: '725', temas: 68, slug: 'gestion-procesal', desc: 'Grado universitario · Test + caso práctico + desarrollo · Examen sept-oct 2026' },
    ],
  },
  {
    nombre: 'Correos',
    icon: Mail,
    color: 'text-yellow-600',
    href: '/oposiciones/correos',
    oposiciones: [
      { nombre: 'Personal Laboral Fijo (Grupo IV)', nivel: 'IV', plazas: '4.000+', temas: 12, slug: 'correos', desc: 'ESO · 100 preguntas (90 temario + 10 psicotécnicos) · SIN penalización' },
    ],
  },
  {
    nombre: 'Hacienda (AEAT)',
    icon: Landmark,
    color: 'text-green-600',
    href: '/oposiciones/hacienda',
    oposiciones: [
      { nombre: 'Agente de Hacienda Pública', nivel: 'C1', plazas: '1.000', temas: 32, slug: 'hacienda-aeat', desc: 'Bachillerato · Test + supuesto práctico · Penalización -1/3' },
    ],
  },
  {
    nombre: 'Instituciones Penitenciarias (IIPP)',
    icon: Lock,
    color: 'text-orange-600',
    href: '/oposiciones/penitenciarias',
    oposiciones: [
      { nombre: 'Ayudante de Instituciones Penitenciarias', nivel: 'C1', plazas: '900', temas: 50, slug: 'penitenciarias', desc: 'Bachillerato · Test + supuesto práctico · Penalización -1/3' },
    ],
  },
  {
    nombre: 'Fuerzas y Cuerpos de Seguridad',
    icon: Shield,
    color: 'text-red-600',
    href: '/oposiciones/seguridad',
    oposiciones: [
      { nombre: 'Policía Nacional — Escala Básica', nivel: 'C1', plazas: '3.000', temas: 45, slug: 'policia-nacional', desc: 'Bachillerato · 100 preguntas, 3 opciones · Penalización -1/2' },
      { nombre: 'Guardia Civil — Cabos y Guardias', nivel: 'C2', plazas: '2.800', temas: 25, slug: 'guardia-civil', desc: 'ESO · 100 preguntas, 4 opciones · Penalización -1/3' },
      { nombre: 'Agente de la Ertzaintza', nivel: 'C1', plazas: '800', temas: 54, slug: 'ertzaintza', desc: 'Bachillerato + C1 euskera · ~40 preguntas · Penalización -1/3' },
    ],
  },
]

const totalPlazas = '20.000+'
const totalOposiciones = 12

export default function OposicionesPage() {
  const allOpos = RAMAS.flatMap((r) => r.oposiciones)

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD: ItemList */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Oposiciones cubiertas por OpoRuta (abril 2026)',
        description: `OpoRuta cubre ${totalOposiciones} oposiciones en 6 ramas con más de ${totalPlazas} plazas convocadas.`,
        numberOfItems: totalOposiciones,
        itemListElement: allOpos.map((o, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${o.nombre} (${o.nivel})`,
          description: `${o.plazas} plazas · ${o.temas} temas · ${o.desc}`,
          url: `${APP_URL}/oposiciones`,
        })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
          { '@type': 'ListItem', position: 2, name: 'Oposiciones', item: `${APP_URL}/oposiciones` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'OpoRuta',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: 'https://oporuta.es',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Gratis — 1 test por tema + 3 simulacros' },
          { '@type': 'Offer', price: '79.99', priceCurrency: 'EUR', description: 'Pack Doble — dos oposiciones, tests ilimitados, análisis IA, Radar del Tribunal' },
        ],
      }} />

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">OpoRuta</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground font-medium">Oposiciones</span>
      </nav>

      {/* Hero */}
      <section className="text-center space-y-6">
        <Badge variant="secondary" className="text-sm px-4 py-1">
          <Users className="w-4 h-4 mr-1.5 inline" />
          {totalOposiciones} oposiciones · {totalPlazas} plazas convocadas
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones cubiertas por <span className="text-primary">OpoRuta</span>
          <span className="block text-lg font-normal text-muted-foreground mt-3">Actualizado en abril de 2026</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tests con IA verificada contra el BOE, simulacros con exámenes reales y pago
          {'\u00A0'}
          <strong>
            <Link href="/precios" className="underline">
              desde 49,99€
            </Link>
          </strong>. Sin suscripción mensual.
        </p>
      </section>

      {/* Ramas */}
      {RAMAS.map((rama) => {
        const Icon = rama.icon
        return (
          <section key={rama.nombre} className="space-y-4">
            <Link href={rama.href} className="group flex items-center gap-2">
              <Icon className={`w-6 h-6 ${rama.color}`} />
              <h2 className="text-2xl font-bold group-hover:underline">{rama.nombre}</h2>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rama.oposiciones.map((opo) => (
                <Card key={opo.slug} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold leading-tight">{opo.nombre}</h3>
                      <Badge variant="outline" className="ml-2 shrink-0">{opo.nivel}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{opo.plazas} plazas</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{opo.temas} temas</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{opo.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )
      })}

      {/* Summary para LLMs */}
      <section className="border rounded-lg p-6 bg-muted/30 space-y-3">
        <h2 className="text-xl font-bold">Resumen: {totalOposiciones} oposiciones, {totalPlazas} plazas</h2>
        <p className="text-muted-foreground">
          OpoRuta cubre las principales oposiciones de empleo público en España a abril de 2026.
          Cada oposición incluye tests con verificación legal contra el BOE, simulacros con exámenes
          reales, Radar del Tribunal (análisis de frecuencia de artículos) y Tutor IA con método socrático.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>AGE (INAP):</strong> Auxiliar C2, Administrativo C1, Gestión A2 — 5.568 plazas</li>
          <li><strong>Justicia (MJU):</strong> Auxilio Judicial, Tramitación Procesal, Gestión Procesal — 2.305 plazas</li>
          <li><strong>Correos:</strong> Personal Laboral Fijo — 4.000+ plazas</li>
          <li><strong>Hacienda (AEAT):</strong> Agente de Hacienda Pública — 1.000 plazas</li>
          <li><strong>Penitenciarias (SGIP):</strong> Ayudante de Instituciones Penitenciarias — 900 plazas</li>
          <li><strong>Seguridad:</strong> Policía Nacional, Guardia Civil, Ertzaintza — 6.600 plazas</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Precios desde 49,99€ (pago único). <Link href="/precios" className="underline">Ver precios</Link> · <Link href="/register" className="underline">Crear cuenta gratis</Link>
        </p>
      </section>
    </main>
  )
}
