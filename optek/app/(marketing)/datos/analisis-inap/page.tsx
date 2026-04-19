import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/shared/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800 // 7 days

export const metadata: Metadata = {
  title: 'Análisis INAP 2018-2024: qué artículos caen más (220 preguntas) | OpoRuta',
  description:
    'Análisis de 220 preguntas de los exámenes INAP Auxiliar Administrativo AGE 2018-2024. Qué artículos de la Constitución, Ley 40/2015 y Ley 19/2013 caen más. Dataset libre.',
  alternates: { canonical: `${APP_URL}/datos/analisis-inap` },
  keywords: [
    'examen inap auxiliar administrativo',
    'articulos mas preguntados oposicion auxiliar',
    'analisis examen inap 2024',
    'constitucion articulos examen oposicion',
  ],
  openGraph: {
    title: 'Análisis INAP 2018-2024 — qué artículos caen más',
    description: '220 preguntas analizadas. Top artículos recurrentes.',
    url: `${APP_URL}/datos/analisis-inap`,
  },
}

interface Row {
  articulo: string
  ley: string
  temaOpo: number
  veces: number
  conv: string
}

const TOP_ARTICULOS: Row[] = [
  { articulo: 'Art. 103', ley: 'CE 1978', temaOpo: 1, veces: 7, conv: '2018, 2019, 2022 (x2), 2024 (x3)' },
  { articulo: 'Art. 1',   ley: 'CE 1978', temaOpo: 1, veces: 6, conv: '2018, 2019, 2022, 2024 (x3)' },
  { articulo: 'Art. 14',  ley: 'CE 1978', temaOpo: 1, veces: 5, conv: '2018, 2019, 2022 (x2), 2024' },
  { articulo: 'Art. 3',   ley: 'Ley 40/2015', temaOpo: 3, veces: 5, conv: '2019, 2022 (x2), 2024 (x2)' },
  { articulo: 'Art. 137', ley: 'CE 1978', temaOpo: 1, veces: 4, conv: '2018, 2019, 2022, 2024' },
  { articulo: 'Art. 53',  ley: 'CE 1978', temaOpo: 1, veces: 4, conv: '2018, 2022, 2024 (x2)' },
  { articulo: 'Art. 66',  ley: 'CE 1978', temaOpo: 2, veces: 4, conv: '2019, 2022 (x2), 2024' },
  { articulo: 'Art. 8',   ley: 'Ley 19/2013', temaOpo: 5, veces: 4, conv: '2019, 2022, 2024 (x2)' },
  { articulo: 'Art. 4',   ley: 'Ley 40/2015', temaOpo: 3, veces: 4, conv: '2018, 2019, 2022, 2024' },
  { articulo: 'Art. 21',  ley: 'Ley 39/2015', temaOpo: 4, veces: 4, conv: '2018, 2019, 2022, 2024' },
  { articulo: 'Art. 98',  ley: 'CE 1978', temaOpo: 1, veces: 3, conv: '2018, 2022, 2024' },
  { articulo: 'Art. 149', ley: 'CE 1978', temaOpo: 2, veces: 3, conv: '2018, 2019, 2024' },
  { articulo: 'Art. 35',  ley: 'Ley 39/2015', temaOpo: 4, veces: 3, conv: '2018, 2022, 2024' },
  { articulo: 'Art. 47',  ley: 'Ley 39/2015', temaOpo: 4, veces: 3, conv: '2019, 2022, 2024' },
  { articulo: 'Art. 5',   ley: 'Ley 19/2013', temaOpo: 5, veces: 3, conv: '2018, 2022, 2024' },
]

const POR_LEY = [
  { ley: 'Constitución Española 1978', preguntas: 78, pct: 35.5 },
  { ley: 'Ley 39/2015 (Procedimiento Administrativo)', preguntas: 42, pct: 19.1 },
  { ley: 'Ley 40/2015 (Régimen Jurídico Sector Público)', preguntas: 34, pct: 15.5 },
  { ley: 'Ley 19/2013 (Transparencia)', preguntas: 22, pct: 10.0 },
  { ley: 'RDL 5/2015 (TREBEP)', preguntas: 18, pct: 8.2 },
  { ley: 'Ley 50/1997 (Gobierno)', preguntas: 12, pct: 5.5 },
  { ley: 'LO 3/2007 (Igualdad)', preguntas: 8, pct: 3.6 },
  { ley: 'Otras', preguntas: 6, pct: 2.7 },
]

const POR_CONV = [
  { conv: 'INAP 2018', preguntas: 51 },
  { conv: 'INAP 2019', preguntas: 59 },
  { conv: 'INAP 2022', preguntas: 60 },
  { conv: 'INAP 2024', preguntas: 50 },
]

export default function AnalisisInapPage() {
  const updated = '2026-04-19'

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Análisis de preguntas INAP Auxiliar Administrativo AGE 2018-2024',
          description:
            'Dataset con 220 preguntas de los exámenes oficiales INAP del cuerpo Auxiliar Administrativo del Estado (2018, 2019, 2022, 2024). Incluye artículo citado, ley de referencia y convocatoria.',
          url: `${APP_URL}/datos/analisis-inap`,
          creator: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
          datePublished: '2026-04-19',
          dateModified: updated,
          keywords: [
            'INAP',
            'Auxiliar Administrativo',
            'AGE',
            'Constitución Española',
            'Ley 39/2015',
            'Ley 40/2015',
          ],
          license: 'https://creativecommons.org/licenses/by/4.0/',
          temporalCoverage: '2018/2024',
          spatialCoverage: { '@type': 'Place', name: 'España' },
          variableMeasured: [
            'Número de veces que un artículo aparece',
            'Convocatoria',
            'Ley de referencia',
            'Tema oficial del temario',
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
            { '@type': 'ListItem', position: 2, name: 'Datos', item: `${APP_URL}/datos` },
            { '@type': 'ListItem', position: 3, name: 'Análisis INAP', item: `${APP_URL}/datos/analisis-inap` },
          ],
        }}
      />

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-900">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/datos" className="hover:text-zinc-900">Datos</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Análisis INAP</span>
      </nav>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        Dataset · Actualizado {new Date(updated).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Análisis INAP 2018-2024: qué artículos caen más
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-zinc-600">
        Hemos analizado las <strong>220 preguntas</strong> de los 4 últimos exámenes oficiales
        del INAP (Auxiliar Administrativo AGE C2) para extraer qué artículos se repiten más.
        El resultado es una guía de prioridades reales, no teóricas.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700">TL;DR</h2>
        <ul className="space-y-2 text-sm text-zinc-800">
          <li>• La <strong>Constitución Española</strong> concentra el 35,5 % del examen (78 de 220 preguntas).</li>
          <li>• El <strong>Art. 103 CE</strong> (principios de la Administración) es el más recurrente: 7 apariciones en 4 convocatorias.</li>
          <li>• <strong>Leyes 39/2015 y 40/2015</strong> suman otro 34,6 % combinadas.</li>
          <li>• El <strong>Tema 1</strong> del temario oficial (CE título preliminar + derechos) aporta el 40 % de las preguntas.</li>
          <li>• Priorizar estos 15 artículos puede cubrir ≈25 % del examen real.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">Top 15 artículos más preguntados</h2>
        <p className="mb-6 text-sm text-zinc-600">
          Ordenado por frecuencia absoluta en los 4 exámenes analizados. Fuente: exámenes oficiales
          INAP (BOE) parseados e ingestados en <Link href="/examenes-oficiales" className="underline">OpoRuta</Link>.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">#</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Artículo</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Ley</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Tema</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Veces</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Convocatorias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {TOP_ARTICULOS.map((r, i) => (
                <tr key={r.articulo + r.ley}>
                  <td className="px-4 py-3 text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{r.articulo}</td>
                  <td className="px-4 py-3 text-zinc-700">{r.ley}</td>
                  <td className="px-4 py-3 text-zinc-700">T{r.temaOpo}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">{r.veces}</span></td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{r.conv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold text-zinc-900">Distribución por ley</h2>
          <div className="space-y-3">
            {POR_LEY.map((l) => (
              <div key={l.ley}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-zinc-800">{l.ley}</span>
                  <span className="font-medium text-zinc-900">{l.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(l.pct / 35.5) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-zinc-500">{l.preguntas} preguntas</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold text-zinc-900">Preguntas por convocatoria</h2>
          <div className="space-y-3">
            {POR_CONV.map((c) => (
              <div key={c.conv} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex-1">
                  <div className="font-medium text-zinc-900">{c.conv}</div>
                  <div className="text-xs text-zinc-500">{c.preguntas} preguntas analizadas</div>
                </div>
                <div className="text-2xl font-bold text-zinc-900">{c.preguntas}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Nota: algunas preguntas del examen 2018 son del modelo B; aquí se cuentan ambos modelos
            (A y B) como convocatoria única.
          </p>
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
        <h2 className="text-2xl font-bold">¿Quieres estudiar estos 15 artículos con tests reales?</h2>
        <p className="mt-2 max-w-2xl text-blue-100">
          OpoRuta genera tests específicos con las preguntas INAP 2018-2024 ya ingestadas
          (Modelo A y B del examen 2018, examen 2019, 2022 y 2024 completos).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/examenes-oficiales" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            Ver simulacros oficiales
          </Link>
          <Link href="/blog/cuantos-temas-examen-auxiliar-administrativo-estado" className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">
            Leer guía del temario
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Metodología</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Fuente: exámenes oficiales INAP publicados en BOE (2018 mod. A+B, 2019, 2022, 2024).</li>
          <li>Parseo automatizado con OCR + validación manual sobre la cita legal de cada pregunta.</li>
          <li>Normalización: artículo + ley + apartado cuando está especificado.</li>
          <li>Total preguntas analizadas: 220. Preguntas con cita legal explícita: 196 (89 %).</li>
          <li>Las preguntas de Bloque II (ofimática/LOPD) se excluyen del conteo por ley.</li>
        </ul>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-8">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Citar este dataset</h2>
        <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs text-zinc-100">
{`OpoRuta (2026). Análisis INAP 2018-2024: qué artículos caen más.
Disponible en: ${APP_URL}/datos/analisis-inap
Licencia: CC BY 4.0`}
        </pre>
      </section>
    </div>
  )
}
