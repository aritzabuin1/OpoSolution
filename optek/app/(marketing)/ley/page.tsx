import type { Metadata } from 'next'
import { JsonLd } from '@/components/shared/JsonLd'
import { LawCard } from '@/components/seo/LawCard'
import { LawBreadcrumb } from '@/components/seo/LawBreadcrumb'
import { LawCTA } from '@/components/seo/LawCTA'
import { getEnabledLaws, type LawCategory } from '@/data/seo/ley-registry'
import articleIndex from '@/data/seo/article-index.json'
import { BookOpen } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800 // 7 days

export const metadata: Metadata = {
  title: 'Legislación para oposiciones — Todas las leyes actualizadas | OpoRuta',
  description:
    `Consulta las ${articleIndex.totalLaws} leyes y ${articleIndex.totalArticles.toLocaleString('es-ES')} artículos que se examinan en oposiciones. Texto oficial actualizado con índice por artículo. Descubre en qué oposiciones cae cada ley.`,
  keywords: [
    'legislación oposiciones', 'leyes oposiciones 2026',
    'artículos oposiciones', 'legislación actualizada oposiciones',
    'LPAC artículos', 'constitución española artículos',
  ],
  openGraph: {
    title: 'Legislación para oposiciones — Todas las leyes | OpoRuta',
    description: `${articleIndex.totalLaws} leyes y ${articleIndex.totalArticles.toLocaleString('es-ES')} artículos actualizados para oposiciones.`,
    url: `${APP_URL}/ley`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent(`${articleIndex.totalLaws} leyes · ${articleIndex.totalArticles.toLocaleString('es-ES')} artículos`)}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/ley` },
}

const CATEGORY_LABELS: Record<LawCategory, string> = {
  constitucional: 'Derecho Constitucional',
  administrativo: 'Derecho Administrativo',
  penal: 'Derecho Penal y Penitenciario',
  procesal: 'Derecho Procesal',
  tributario: 'Derecho Tributario y Fiscal',
  laboral: 'Derecho Laboral y Seguridad Social',
  seguridad: 'Seguridad Ciudadana',
  postal: 'Legislación Postal',
  autonomico: 'Normativa Autonómica',
  social: 'Legislación Social',
  derechos: 'Derechos Fundamentales e Igualdad',
}

const CATEGORY_ORDER: LawCategory[] = [
  'constitucional', 'administrativo', 'derechos', 'penal',
  'procesal', 'tributario', 'laboral', 'seguridad',
  'postal', 'autonomico', 'social',
]

export default function LeyHubPage() {
  const laws = getEnabledLaws()

  // Group by category
  const grouped = new Map<LawCategory, typeof laws>()
  for (const law of laws) {
    const group = grouped.get(law.category) ?? []
    group.push(law)
    grouped.set(law.category, group)
  }

  // Get article counts from the index
  const articleCounts = new Map<string, number>()
  for (const law of articleIndex.laws) {
    articleCounts.set(law.leyNombre, law.totalArticles)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legislación para oposiciones',
    description: `${articleIndex.totalLaws} leyes y ${articleIndex.totalArticles} artículos actualizados para preparar oposiciones en España.`,
    url: `${APP_URL}/ley`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: laws.length,
      itemListElement: laws.slice(0, 30).map((law, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${APP_URL}/ley/${law.slug}`,
        name: law.fullName,
      })),
    },
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={jsonLd} />
      <LawBreadcrumb lawName="" lawSlug="" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Legislación para oposiciones
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">
          Consulta las <strong>{articleIndex.totalLaws} leyes</strong> y{' '}
          <strong>{articleIndex.totalArticles.toLocaleString('es-ES')} artículos</strong> que se
          examinan en las principales oposiciones de España. Texto oficial completo con índice
          por artículo y referencia a qué oposiciones examinan cada ley.
        </p>
      </div>

      {CATEGORY_ORDER.map(category => {
        const categoryLaws = grouped.get(category)
        if (!categoryLaws || categoryLaws.length === 0) return null

        return (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryLaws.map(law => (
                <LawCard
                  key={law.leyNombre}
                  leyNombre={law.leyNombre}
                  slug={law.slug}
                  shortName={law.shortName}
                  fullName={law.fullName}
                  articleCount={articleCounts.get(law.leyNombre) ?? 0}
                />
              ))}
            </div>
          </section>
        )
      })}

      <LawCTA lawShortName="legislación" className="mt-12" />
    </div>
  )
}
