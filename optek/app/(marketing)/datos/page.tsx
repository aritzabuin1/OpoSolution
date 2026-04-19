import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/shared/JsonLd'
import { BarChart3, Map, TrendingUp, ArrowRight } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Datos Oposiciones AGE 2018-2026: análisis INAP, destinos y plazas | OpoRuta',
  description:
    'Datos propios sobre oposiciones AGE: análisis de 220 preguntas INAP (2018-2024), mapa de destinos por CC.AA., evolución de plazas 2018-2026. Tablas descargables y gráficos.',
  alternates: { canonical: `${APP_URL}/datos` },
  openGraph: {
    title: 'Datos Oposiciones AGE — OpoRuta',
    description: 'Análisis INAP + destinos + plazas históricas. Datos propios.',
    url: `${APP_URL}/datos`,
    type: 'website',
  },
}

const DATASETS = [
  {
    href: '/datos/analisis-inap',
    icon: BarChart3,
    title: 'Análisis INAP 2018-2024',
    desc: 'Qué artículos de la Constitución, Ley 40/2015 y Ley 19/2013 caen más en los exámenes reales. 220 preguntas analizadas.',
    tag: 'Dataset público',
  },
  {
    href: '/datos/mapa-destinos',
    icon: Map,
    title: 'Mapa de destinos Auxiliar AGE',
    desc: 'Plazas por CC.AA. en las últimas 3 convocatorias. Dónde es más fácil aprobar (ratio plazas/opositores).',
    tag: 'Geodato',
  },
  {
    href: '/datos/plazas-age-historico',
    icon: TrendingUp,
    title: 'Evolución plazas AGE 2018-2026',
    desc: 'Serie histórica de plazas convocadas por cuerpo (Auxiliar C2, Administrativo C1, Gestión A2). Tendencia y proyección.',
    tag: 'Serie temporal',
  },
]

export default function DatosIndex() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Datos Oposiciones AGE — OpoRuta',
          url: `${APP_URL}/datos`,
          description:
            'Colección de datasets propios sobre oposiciones AGE: análisis INAP, destinos y plazas históricas.',
          hasPart: DATASETS.map((d) => ({
            '@type': 'Dataset',
            name: d.title,
            url: `${APP_URL}${d.href}`,
            description: d.desc,
          })),
        }}
      />

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Datos</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Datos propios sobre oposiciones AGE
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-600">
        Investigación original a partir de exámenes INAP, BOE y estadísticas oficiales.
        Todos los datasets son de uso libre citando a OpoRuta.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {DATASETS.map((d) => {
          const Icon = d.icon
          return (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-900 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {d.tag}
              </div>
              <h2 className="mb-2 text-lg font-semibold text-zinc-900">{d.title}</h2>
              <p className="text-sm text-zinc-600">{d.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-zinc-900">
                Ver dataset <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          )
        })}
      </div>

      <section className="mt-16 rounded-2xl bg-zinc-50 p-8">
        <h2 className="text-xl font-semibold text-zinc-900">Licencia y uso</h2>
        <p className="mt-3 text-sm text-zinc-700">
          Los datos son libres para uso editorial, académico o divulgativo citando la fuente:{' '}
          <span className="font-medium">OpoRuta — oporuta.es/datos</span>.
          Si vas a publicarlos, agradecemos el enlace directo a la página del dataset.
        </p>
      </section>
    </div>
  )
}
