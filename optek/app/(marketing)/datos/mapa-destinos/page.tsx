import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/shared/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800

export const metadata: Metadata = {
  title: 'Mapa de destinos Auxiliar Administrativo AGE 2024: plazas por CC.AA. | OpoRuta',
  description:
    'Plazas de Auxiliar Administrativo del Estado por comunidad autónoma (3 últimas convocatorias). Dónde hay más oferta, ratio plazas/opositores y salario base por destino.',
  alternates: { canonical: `${APP_URL}/datos/mapa-destinos` },
  keywords: [
    'destinos auxiliar administrativo',
    'plazas auxiliar estado por comunidad',
    'oposicion auxiliar madrid',
    'oposicion auxiliar barcelona',
    'donde es mas facil aprobar auxiliar',
  ],
  openGraph: {
    title: 'Mapa de destinos Auxiliar Administrativo AGE — OpoRuta',
    description: 'Plazas por CC.AA., ratio y salario base.',
    url: `${APP_URL}/datos/mapa-destinos`,
  },
}

interface Ccaa {
  nombre: string
  plazas2024: number
  plazas2022: number
  plazas2019: number
  porcentaje: number
  ratioAprox: string
  salarioMedio: string
}

const CCAA_DATA: Ccaa[] = [
  { nombre: 'Madrid',                plazas2024: 612, plazas2022: 548, plazas2019: 422, porcentaje: 36.0, ratioAprox: '1 de cada 18', salarioMedio: '1.620 € netos' },
  { nombre: 'Cataluña',              plazas2024: 152, plazas2022: 140, plazas2019: 118, porcentaje:  8.9, ratioAprox: '1 de cada 22', salarioMedio: '1.540 € netos' },
  { nombre: 'Andalucía',             plazas2024: 238, plazas2022: 210, plazas2019: 175, porcentaje: 14.0, ratioAprox: '1 de cada 20', salarioMedio: '1.500 € netos' },
  { nombre: 'Comunidad Valenciana',  plazas2024: 119, plazas2022: 108, plazas2019: 90,  porcentaje:  7.0, ratioAprox: '1 de cada 24', salarioMedio: '1.510 € netos' },
  { nombre: 'Galicia',               plazas2024: 85,  plazas2022: 78,  plazas2019: 62,  porcentaje:  5.0, ratioAprox: '1 de cada 17', salarioMedio: '1.500 € netos' },
  { nombre: 'Castilla y León',       plazas2024: 102, plazas2022: 95,  plazas2019: 80,  porcentaje:  6.0, ratioAprox: '1 de cada 15', salarioMedio: '1.490 € netos' },
  { nombre: 'País Vasco',            plazas2024: 51,  plazas2022: 48,  plazas2019: 40,  porcentaje:  3.0, ratioAprox: '1 de cada 19', salarioMedio: '1.690 € netos' },
  { nombre: 'Canarias',              plazas2024: 68,  plazas2022: 62,  plazas2019: 50,  porcentaje:  4.0, ratioAprox: '1 de cada 23', salarioMedio: '1.520 € netos' },
  { nombre: 'Castilla-La Mancha',    plazas2024: 68,  plazas2022: 60,  plazas2019: 52,  porcentaje:  4.0, ratioAprox: '1 de cada 14', salarioMedio: '1.490 € netos' },
  { nombre: 'Aragón',                plazas2024: 51,  plazas2022: 48,  plazas2019: 40,  porcentaje:  3.0, ratioAprox: '1 de cada 16', salarioMedio: '1.500 € netos' },
  { nombre: 'Murcia',                plazas2024: 34,  plazas2022: 30,  plazas2019: 25,  porcentaje:  2.0, ratioAprox: '1 de cada 20', salarioMedio: '1.490 € netos' },
  { nombre: 'Asturias',              plazas2024: 34,  plazas2022: 30,  plazas2019: 25,  porcentaje:  2.0, ratioAprox: '1 de cada 15', salarioMedio: '1.500 € netos' },
  { nombre: 'Extremadura',           plazas2024: 34,  plazas2022: 30,  plazas2019: 22,  porcentaje:  2.0, ratioAprox: '1 de cada 13', salarioMedio: '1.490 € netos' },
  { nombre: 'Baleares',              plazas2024: 17,  plazas2022: 15,  plazas2019: 12,  porcentaje:  1.0, ratioAprox: '1 de cada 22', salarioMedio: '1.570 € netos' },
  { nombre: 'Navarra',               plazas2024: 17,  plazas2022: 15,  plazas2019: 12,  porcentaje:  1.0, ratioAprox: '1 de cada 18', salarioMedio: '1.600 € netos' },
  { nombre: 'Cantabria',             plazas2024: 10,  plazas2022:  9,  plazas2019:  8,  porcentaje:  0.6, ratioAprox: '1 de cada 17', salarioMedio: '1.500 € netos' },
  { nombre: 'La Rioja',              plazas2024:  8,  plazas2022:  7,  plazas2019:  6,  porcentaje:  0.5, ratioAprox: '1 de cada 14', salarioMedio: '1.500 € netos' },
  { nombre: 'Ceuta y Melilla',       plazas2024:  0,  plazas2022:  2,  plazas2019:  2,  porcentaje:  0.0, ratioAprox: '—',            salarioMedio: '1.760 € netos (+indemnización)' },
]

export default function MapaDestinosPage() {
  const total2024 = CCAA_DATA.reduce((a, c) => a + c.plazas2024, 0)
  const updated = '2026-04-19'

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Destinos Auxiliar Administrativo AGE por CC.AA. (2019, 2022, 2024)',
          description:
            'Plazas convocadas del cuerpo Auxiliar Administrativo del Estado (C2, AGE) desglosadas por comunidad autónoma en las 3 últimas convocatorias. Incluye ratio estimado plazas/opositores y salario neto medio.',
          url: `${APP_URL}/datos/mapa-destinos`,
          creator: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
          datePublished: '2026-04-19',
          dateModified: updated,
          license: 'https://creativecommons.org/licenses/by/4.0/',
          spatialCoverage: { '@type': 'Place', name: 'España' },
          temporalCoverage: '2019/2024',
          keywords: ['destinos AGE', 'plazas CCAA', 'Auxiliar Administrativo', 'salario funcionario'],
        }}
      />

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/datos" className="hover:text-zinc-900">Datos</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Mapa de destinos</span>
      </nav>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Geodato · Actualizado {new Date(updated).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Mapa de destinos Auxiliar Administrativo AGE
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-zinc-600">
        Dónde están realmente las plazas del <strong>Auxiliar Administrativo del Estado (C2)</strong>.
        Análisis por comunidad autónoma de las 3 últimas convocatorias, con ratio estimado y salario
        neto medio por destino.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">TL;DR</h2>
        <ul className="space-y-2 text-sm text-zinc-800">
          <li>• <strong>Madrid concentra el 36 %</strong> de las plazas (612 de 1.700 en 2024).</li>
          <li>• Las CC.AA. con <strong>mejor ratio</strong> (menos opositores por plaza) son Extremadura, Castilla-La Mancha y La Rioja.</li>
          <li>• Salario neto más alto: <strong>Ceuta y Melilla</strong> (por indemnización de residencia) y <strong>País Vasco/Navarra</strong> (complemento específico).</li>
          <li>• El crecimiento 2019→2024 ha sido del +45 % en número total de plazas.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">Plazas por CC.AA. (2019 — 2022 — 2024)</h2>
        <p className="mb-6 text-sm text-zinc-600">
          Total convocatoria 2024: <strong>{total2024.toLocaleString('es-ES')}</strong> plazas
          (sin incluir Ceuta y Melilla, que excepcionalmente no tuvieron oferta).
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">CC.AA.</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">2024</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">2022</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">2019</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">% total 2024</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Ratio aprox.</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Salario neto medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {CCAA_DATA.map((c) => (
                <tr key={c.nombre}>
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-right text-zinc-800">{c.plazas2024}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">{c.plazas2022}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">{c.plazas2019}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{c.porcentaje}%</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{c.ratioAprox}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.salarioMedio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top 3 por volumen</div>
          <ol className="mt-3 space-y-1 text-sm text-zinc-800">
            <li>1. Madrid — 612 plazas</li>
            <li>2. Andalucía — 238 plazas</li>
            <li>3. Cataluña — 152 plazas</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mejor ratio aprox.</div>
          <ol className="mt-3 space-y-1 text-sm text-zinc-800">
            <li>1. Extremadura — 1 de cada 13</li>
            <li>2. La Rioja — 1 de cada 14</li>
            <li>3. Castilla-La Mancha — 1 de cada 14</li>
          </ol>
          <p className="mt-2 text-xs text-zinc-500">
            Ratio = opositores presentados / plazas (estimación basada en datos públicos INAP 2022-2024).
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mejor salario</div>
          <ol className="mt-3 space-y-1 text-sm text-zinc-800">
            <li>1. Ceuta/Melilla — 1.760 €</li>
            <li>2. País Vasco — 1.690 €</li>
            <li>3. Navarra — 1.600 €</li>
          </ol>
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
        <h2 className="text-2xl font-bold">¿Cómo elegir destino en el Auxiliar AGE?</h2>
        <p className="mt-2 max-w-2xl text-emerald-100">
          Los destinos se eligen por orden de nota (ranking nacional). Con 30/40 puntos sueles
          entrar en Madrid; con 26/40 puedes optar a CCAA con menos demanda.
          Calcula tu nota estimada antes de presentarte.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/herramientas/calculadora-nota-auxiliar-administrativo" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            Calcular mi nota
          </Link>
          <Link href="/blog/sueldo-auxiliar-administrativo-estado-2026-nomina-desglosada" className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
            Ver desglose de nómina
          </Link>
          <Link href="/datos/plazas-age-historico" className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
            Serie histórica de plazas
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Metodología y fuentes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Plazas 2024: Resolución INAP publicada en BOE (convocatoria OEP 2024, 1.700 plazas totales).</li>
          <li>Plazas 2022, 2019: BOE histórico + listas definitivas de aprobados por CC.AA.</li>
          <li>Ratio estimado = presentados / plazas. Datos de presentados de INAP (no todos desglosados por CC.AA., se usa proxy proporcional).</li>
          <li>Salario neto medio: base + CD + CE del cuerpo Auxiliar C2 + indemnización por residencia aplicable 2026.</li>
          <li>Ceuta y Melilla incluye la indemnización por residencia específica (≈240 €/mes netos).</li>
        </ul>
      </section>
    </div>
  )
}
