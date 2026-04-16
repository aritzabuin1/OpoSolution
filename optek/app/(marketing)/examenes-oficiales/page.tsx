/**
 * app/(marketing)/examenes-oficiales/page.tsx
 *
 * Página pública informativa sobre simulacros de examen oficial.
 * Cubre las 12 oposiciones disponibles en OpoRuta.
 * Objetivo: explicar la propuesta de valor y dirigir a /register.
 *
 * Las páginas de detalle [examen]/ (INAP C1/C2) siguen intactas
 * para conservar el posicionamiento SEO existente.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  ArrowRight, BookOpen, Timer, CheckCircle2, Shield,
  Building2, Mail, Scale, Landmark, Siren,
  BrainCircuit, FileCheck, BarChart3, Trophy,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Examenes Oficiales de Oposiciones: Simulacros con Preguntas Reales | OpoRuta',
  description:
    'Practica con simulacros basados en examenes oficiales de 12 oposiciones: AGE (C2, C1, A2), Correos, Justicia, Hacienda, Penitenciarias, Guardia Civil, Policia Nacional y Ertzaintza. Penalizacion real, timer oficial y explicaciones IA de cada error.',
  keywords: [
    'examenes oficiales oposiciones',
    'simulacro examen oficial oposiciones',
    'preguntas reales oposiciones',
    'simulacro INAP',
    'examen oposiciones con respuestas',
    'simulacro auxiliar administrativo',
    'simulacro correos',
    'simulacro justicia',
    'simulacro guardia civil',
    'simulacro policia nacional',
    'practica examen oposiciones online',
  ],
  openGraph: {
    title: 'Examenes Oficiales de Oposiciones | OpoRuta',
    description:
      'Simulacros basados en examenes oficiales de 12 oposiciones. Preguntas reales, timer y penalizacion oficial. Explicaciones IA de cada error.',
    type: 'website',
    url: `${APP_URL}/examenes-oficiales`,
    images: [
      {
        url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent('Examenes Oficiales Oposiciones 2026')}`,
        width: 1200,
        height: 630,
        alt: 'Simulacros de examenes oficiales en OpoRuta',
      },
    ],
  },
  alternates: { canonical: `${APP_URL}/examenes-oficiales` },
}

// ─── Datos de las 12 oposiciones ─────────────────────────────────────────────

const OPOSICIONES = [
  {
    icon: Building2,
    nombre: 'Auxiliar Administrativo del Estado (C2)',
    organismo: 'INAP',
    rama: 'Administracion General del Estado',
    color: 'text-blue-600',
    href: '/oposiciones/administracion',
  },
  {
    icon: Building2,
    nombre: 'Administrativo del Estado (C1)',
    organismo: 'INAP',
    rama: 'Administracion General del Estado',
    color: 'text-blue-700',
    href: '/oposiciones/administracion',
  },
  {
    icon: Building2,
    nombre: 'Gestion GACE (A2)',
    organismo: 'INAP',
    rama: 'Administracion General del Estado',
    color: 'text-blue-800',
    href: '/oposiciones/administracion',
  },
  {
    icon: Mail,
    nombre: 'Correos — Personal Laboral Fijo',
    organismo: 'Correos',
    rama: 'Correos y Telegrafos',
    color: 'text-yellow-600',
    href: '/oposiciones/correos',
  },
  {
    icon: Scale,
    nombre: 'Auxilio Judicial',
    organismo: 'MJU',
    rama: 'Justicia',
    color: 'text-purple-600',
    href: '/oposiciones/justicia/auxilio-judicial',
  },
  {
    icon: Scale,
    nombre: 'Tramitacion Procesal',
    organismo: 'MJU',
    rama: 'Justicia',
    color: 'text-purple-700',
    href: '/oposiciones/justicia/tramitacion-procesal',
  },
  {
    icon: Scale,
    nombre: 'Gestion Procesal',
    organismo: 'MJU',
    rama: 'Justicia',
    color: 'text-purple-800',
    href: '/oposiciones/justicia/gestion-procesal',
  },
  {
    icon: Landmark,
    nombre: 'Agente de Hacienda (AEAT)',
    organismo: 'AEAT',
    rama: 'Hacienda',
    color: 'text-green-600',
    href: '/oposiciones/hacienda',
  },
  {
    icon: Shield,
    nombre: 'Instituciones Penitenciarias',
    organismo: 'SGIP',
    rama: 'Interior',
    color: 'text-orange-600',
    href: '/oposiciones/penitenciarias',
  },
  {
    icon: Siren,
    nombre: 'Guardia Civil',
    organismo: 'Guardia Civil',
    rama: 'Seguridad',
    color: 'text-emerald-700',
    href: '/oposiciones/seguridad/guardia-civil',
  },
  {
    icon: Siren,
    nombre: 'Policia Nacional',
    organismo: 'DGP',
    rama: 'Seguridad',
    color: 'text-sky-700',
    href: '/oposiciones/seguridad/policia-nacional',
  },
  {
    icon: Siren,
    nombre: 'Ertzaintza',
    organismo: 'Ertzaintza',
    rama: 'Seguridad',
    color: 'text-red-700',
    href: '/oposiciones/seguridad/ertzaintza',
  },
]

const VENTAJAS = [
  {
    icon: FileCheck,
    titulo: 'Preguntas de examenes oficiales',
    desc: 'Simulacros construidos a partir de preguntas reales de convocatorias anteriores publicadas por los tribunales.',
  },
  {
    icon: Timer,
    titulo: 'Timer y formato oficial',
    desc: 'Cuenta atras con el tiempo exacto del examen real. Numero de preguntas, opciones y estructura identicos al dia del examen.',
  },
  {
    icon: BarChart3,
    titulo: 'Penalizacion real',
    desc: 'Cada oposicion tiene su formula de penalizacion: -1/3, -1/4 o sin penalizacion. Aplicamos la misma que usara el tribunal.',
  },
  {
    icon: BrainCircuit,
    titulo: 'Explicaciones IA de cada error',
    desc: 'Cuando fallas una pregunta, la IA te explica por que la respuesta correcta es correcta, citando el articulo o ley correspondiente.',
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExamenesOficialesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Examenes Oficiales de Oposiciones — Simulacros con Preguntas Reales',
          description:
            'Simulacros basados en examenes oficiales de 12 oposiciones con explicaciones IA.',
          url: `${APP_URL}/examenes-oficiales`,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: OPOSICIONES.length,
            itemListElement: OPOSICIONES.map((o, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: o.nombre,
              url: `${APP_URL}${o.href}`,
            })),
          },
        }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">

        {/* Hero */}
        <div className="mb-14 text-center">
          <Badge variant="secondary" className="mb-4">12 oposiciones disponibles</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simulacros basados en examenes oficiales
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Practica con simulacros que reproducen el formato exacto del examen real:
            preguntas de convocatorias anteriores, timer oficial y penalizacion del tribunal.
            Cuando fallas, la IA te explica por que.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Empezar gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">
                Ya tengo cuenta
              </Link>
            </Button>
          </div>
        </div>

        {/* Como funciona */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-2 text-center">Como funcionan nuestros simulacros</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            Cada simulacro reproduce las condiciones reales del examen de tu oposicion.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {VENTAJAS.map((v) => (
              <Card key={v.titulo}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <v.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{v.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{v.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Grid de oposiciones */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-2 text-center">Oposiciones con simulacros disponibles</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            Selecciona tu oposicion para ver los simulacros disponibles, la estructura del examen y empezar a practicar.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPOSICIONES.map((o) => (
              <Link key={o.nombre} href={o.href} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md group-hover:border-primary/30">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <o.icon className={`h-5 w-5 ${o.color} shrink-0`} />
                      <span className="font-semibold text-sm leading-tight">{o.nombre}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{o.organismo}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Que incluye cada simulacro */}
        <div className="mb-14 rounded-xl border bg-muted/30 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Que incluye cada simulacro</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Preguntas extraidas de examenes oficiales de convocatorias anteriores',
              'Numero de preguntas y opciones identico al examen real',
              'Timer con la duracion oficial del ejercicio',
              'Penalizacion del tribunal aplicada automaticamente',
              'Nota calculada con la formula oficial de la oposicion',
              'Explicacion IA de cada pregunta fallada con cita legal',
              'Informe detallado con analisis por temas y puntos debiles',
              'Historial de simulacros para ver tu progresion',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuentes */}
        <div className="mb-14">
          <h2 className="text-xl font-bold mb-3">De donde salen las preguntas</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Los simulacros de OpoRuta se construyen a partir de <strong className="text-foreground">examenes oficiales publicados por los organismos convocantes</strong> (INAP, MJU, AEAT, DGP, Correos, etc.) tras cada convocatoria. Las preguntas son de dominio publico.
            </p>
            <p>
              Para oposiciones donde el numero de convocatorias publicadas es limitado, complementamos con preguntas generadas por IA y <strong className="text-foreground">verificadas contra la legislacion vigente</strong>. Cada pregunta incluye la referencia al articulo o norma que la sustenta.
            </p>
            <p>
              El resultado es un banco de preguntas en constante crecimiento, siempre actualizado con los cambios legislativos mas recientes.
            </p>
          </div>
        </div>

        {/* CTA final */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Haz tu primer simulacro gratis</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Sin tarjeta de credito. Elige tu oposicion, haz un simulacro completo
            y recibe explicaciones de cada error. En menos de 2 minutos estas practicando.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/register">
                Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/simulacros-oposiciones">
                <BookOpen className="mr-2 h-4 w-4" />
                Ver detalle por oposicion
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </>
  )
}
