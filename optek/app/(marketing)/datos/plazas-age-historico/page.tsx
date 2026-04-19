import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/shared/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800

export const metadata: Metadata = {
  title: 'Plazas AGE 2018-2026: evolución histórica por cuerpo | OpoRuta',
  description:
    'Serie histórica de plazas convocadas en la Administración General del Estado (2018-2026). Auxiliar C2, Administrativo C1 y Gestión A2. Tendencia, proyección y contexto BOE.',
  alternates: { canonical: `${APP_URL}/datos/plazas-age-historico` },
  keywords: [
    'plazas AGE historico',
    'oposiciones estado plazas',
    'evolucion plazas funcionario',
    'oferta empleo publico historico',
    'OEP AGE 2018 2020 2022 2024 2026',
  ],
  openGraph: {
    title: 'Plazas AGE 2018-2026: evolución histórica',
    description: 'Serie histórica de OEP por cuerpo AGE.',
    url: `${APP_URL}/datos/plazas-age-historico`,
  },
}

interface Year {
  anio: number
  auxiliar: number
  administrativo: number
  gestion: number
  total: number
  nota?: string
}

const SERIE: Year[] = [
  { anio: 2018, auxiliar: 910,  administrativo: 1200, gestion: 800,  total: 2910, nota: 'Post-recuperación de tasa de reposición' },
  { anio: 2019, auxiliar: 1222, administrativo: 1428, gestion: 820,  total: 3470 },
  { anio: 2020, auxiliar: 1045, administrativo: 1210, gestion: 700,  total: 2955, nota: 'COVID — convocatorias retrasadas' },
  { anio: 2021, auxiliar: 1175, administrativo: 1350, gestion: 880,  total: 3405 },
  { anio: 2022, auxiliar: 1425, administrativo: 1620, gestion: 1050, total: 4095, nota: 'OEP combinada 2021-2022' },
  { anio: 2023, auxiliar: 1500, administrativo: 1800, gestion: 1150, total: 4450 },
  { anio: 2024, auxiliar: 1700, administrativo: 2200, gestion: 1250, total: 5150, nota: 'OEP 2023-2024 acumulada' },
  { anio: 2025, auxiliar: 1200, administrativo: 1500, gestion: 900,  total: 3600, nota: 'Sin convocatoria específica nueva (ejecución pendiente)' },
  { anio: 2026, auxiliar: 1700, administrativo: 2512, gestion: 1356, total: 5568, nota: 'OEP 2024-2025 en ejecución' },
]

function CrecPct({ a, b }: { a: number; b: number }) {
  const pct = ((b - a) / a) * 100
  const up = pct >= 0
  return (
    <span className={up ? 'text-emerald-700' : 'text-rose-700'}>
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

export default function PlazasAgeHistoricoPage() {
  const updated = '2026-04-19'
  const maxTotal = Math.max(...SERIE.map((s) => s.total))

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Evolución histórica de plazas AGE 2018-2026',
          description:
            'Serie temporal de plazas convocadas en la Administración General del Estado entre 2018 y 2026, desglosadas por cuerpo (Auxiliar Administrativo C2, Administrativo C1 y Gestión A2).',
          url: `${APP_URL}/datos/plazas-age-historico`,
          creator: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
          datePublished: '2026-04-19',
          dateModified: updated,
          license: 'https://creativecommons.org/licenses/by/4.0/',
          temporalCoverage: '2018/2026',
          spatialCoverage: { '@type': 'Place', name: 'España' },
          keywords: ['OEP', 'AGE', 'plazas funcionario', 'Auxiliar', 'Administrativo', 'Gestión'],
          variableMeasured: [
            { '@type': 'PropertyValue', name: 'Plazas Auxiliar C2' },
            { '@type': 'PropertyValue', name: 'Plazas Administrativo C1' },
            { '@type': 'PropertyValue', name: 'Plazas Gestión A2' },
          ],
        }}
      />

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/datos" className="hover:text-zinc-900">Datos</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Plazas AGE histórico</span>
      </nav>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
        Serie temporal · Actualizado {new Date(updated).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Evolución plazas AGE 2018-2026
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-zinc-600">
        Serie histórica de plazas convocadas en la <strong>Administración General del Estado</strong>
        en los tres cuerpos administrativos más habituales: Auxiliar (C2), Administrativo (C1) y
        Gestión (A2). Incluye contexto de cada convocatoria.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">TL;DR</h2>
        <ul className="space-y-2 text-sm text-zinc-800">
          <li>• Las plazas AGE han crecido un <strong>+91 %</strong> entre 2018 y 2026 (2.910 → 5.568).</li>
          <li>• El Auxiliar C2 pasó de <strong>910 a 1.700 plazas</strong> (+87 %).</li>
          <li>• El Administrativo C1 es el cuerpo con mayor crecimiento: <strong>+109 %</strong>.</li>
          <li>• La caída 2025 es aparente: corresponde a la ejecución acumulada, no a nueva OEP.</li>
          <li>• Mejor año histórico para presentarse: <strong>2026</strong> (OEP 2024-2025 combinada).</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">Tabla anual por cuerpo</h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">Año</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Auxiliar C2</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Administrativo C1</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Gestión A2</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">Total AGE</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {SERIE.map((y) => (
                <tr key={y.anio}>
                  <td className="px-4 py-3 font-semibold text-zinc-900">{y.anio}</td>
                  <td className="px-4 py-3 text-right text-zinc-800">{y.auxiliar.toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3 text-right text-zinc-800">{y.administrativo.toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3 text-right text-zinc-800">{y.gestion.toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-900">{y.total.toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{y.nota ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">Gráfico comparado (total AGE)</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="space-y-3">
            {SERIE.map((y) => (
              <div key={y.anio} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-zinc-900">{y.anio}</div>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-zinc-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    style={{ width: `${(y.total / maxTotal) * 100}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white">
                    {y.total.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Crecimiento 2018 → 2026</div>
          <div className="mt-3 space-y-2 text-sm">
            <div>Auxiliar C2: <CrecPct a={910} b={1700} /></div>
            <div>Administrativo C1: <CrecPct a={1200} b={2512} /></div>
            <div>Gestión A2: <CrecPct a={800} b={1356} /></div>
            <div className="border-t pt-2 font-medium">Total: <CrecPct a={2910} b={5568} /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Promedio 2022-2026</div>
          <div className="mt-3 space-y-1 text-sm text-zinc-800">
            <div>Auxiliar C2: <strong>1.505</strong> plazas/año</div>
            <div>Administrativo C1: <strong>1.926</strong> plazas/año</div>
            <div>Gestión A2: <strong>1.141</strong> plazas/año</div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Proyección 2027</div>
          <p className="mt-3 text-sm text-zinc-700">
            Si se mantiene la tendencia de tasa de reposición, la OEP 2026-2027
            podría acercarse a <strong>5.700-6.000 plazas</strong> totales en los 3 cuerpos.
          </p>
          <p className="mt-2 text-xs text-zinc-500">Proyección lineal basada en 2022-2026.</p>
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white">
        <h2 className="text-2xl font-bold">Aprovecha la mayor OEP de los últimos 10 años</h2>
        <p className="mt-2 max-w-2xl text-purple-100">
          5.568 plazas AGE en 2026. Auxiliar C2 examen el 23 mayo 2026,
          Administrativo C1 el 20 junio 2026. Prepárate con simulacros reales.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/oep-2026" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50">
            Ver OEP 2026 completa
          </Link>
          <Link href="/examenes-oficiales" className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
            Simulacros INAP
          </Link>
          <Link href="/datos/mapa-destinos" className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
            Mapa de destinos
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Metodología y fuentes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Fuente: Real Decretos de OEP publicados en BOE 2018-2025.</li>
          <li>Incluye plazas de acceso libre + promoción interna agregadas.</li>
          <li>2025 refleja ejecución de convocatorias previas, no nueva OEP (pendiente aprobación OEP 2025-2026).</li>
          <li>Excluye plazas de estabilización Ley 20/2021 (proceso extraordinario separado).</li>
          <li>Las cifras de 2026 corresponden a la ejecución de la OEP 2024 y 2025 combinada.</li>
        </ul>
      </section>
    </div>
  )
}
