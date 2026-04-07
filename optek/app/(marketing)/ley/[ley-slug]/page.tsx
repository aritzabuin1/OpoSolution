import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/shared/JsonLd'
import { LawBreadcrumb } from '@/components/seo/LawBreadcrumb'
import { OposicionBadges } from '@/components/seo/OposicionBadges'
import { LawTOC } from '@/components/seo/LawTOC'
import { LawCTA } from '@/components/seo/LawCTA'
import { getEnabledLaws, getLeyBySlug } from '@/data/seo/ley-registry'
import { getLawArticles } from '@/lib/seo/law-queries'
import articleIndex from '@/data/seo/article-index.json'
import { BookOpen } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800 // 7 days

// SSG all ~50 law index pages
export function generateStaticParams() {
  return getEnabledLaws().map(law => ({ 'ley-slug': law.slug }))
}

type Props = { params: Promise<{ 'ley-slug': string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'ley-slug': slug } = await params
  const ley = getLeyBySlug(slug)
  if (!ley) return {}

  const lawIndex = articleIndex.laws.find(l => l.leyNombre === ley.leyNombre)
  const count = lawIndex?.totalArticles ?? 0

  return {
    title: `${ley.fullName} — ${count} artículos para oposiciones | OpoRuta`,
    description: `Consulta los ${count} artículos de la ${ley.fullName}. Descubre en qué oposiciones se examina cada artículo. Texto oficial actualizado 2026.`,
    keywords: [
      `${ley.shortName} artículos`,
      `${ley.fullName} oposiciones`,
      `${ley.shortName} completa`,
      `artículos ${ley.shortName} que más caen`,
    ],
    openGraph: {
      title: `${ley.fullName} — Artículos completos | OpoRuta`,
      description: `${count} artículos de la ${ley.fullName} para oposiciones.`,
      url: `${APP_URL}/ley/${slug}`,
      type: 'website',
    },
    alternates: { canonical: `${APP_URL}/ley/${slug}` },
  }
}

export default async function LawIndexPage({ params }: Props) {
  const { 'ley-slug': slug } = await params
  const ley = getLeyBySlug(slug)
  if (!ley) notFound()

  const articles = await getLawArticles(ley.leyNombre)
  const lawIndex = articleIndex.laws.find(l => l.leyNombre === ley.leyNombre)
  const uniqueCount = lawIndex?.totalArticles ?? articles.length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: ley.fullName,
    legislationIdentifier: ley.boeCode,
    legislationType: 'Law',
    inLanguage: 'es',
    url: `${APP_URL}/ley/${slug}`,
    description: `${ley.officialRef}. ${uniqueCount} artículos.`,
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Artículos de la ${ley.fullName}`,
    numberOfItems: uniqueCount,
    itemListElement: (lawIndex?.articles ?? []).slice(0, 50).map((num, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: num.startsWith('D') ? num : `Artículo ${num}`,
      url: `${APP_URL}/ley/${slug}/${num.startsWith('D') ? num.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : `articulo-${num}`}`,
    })),
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={jsonLd} />
      <JsonLd data={itemListJsonLd} />
      <LawBreadcrumb lawName={ley.shortName} lawSlug={slug} />

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-7 w-7 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">{ley.shortName}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {ley.fullName}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {ley.officialRef} · {ley.boeCode} · {uniqueCount} artículos
        </p>
      </header>

      <OposicionBadges leyNombre={ley.leyNombre} className="mb-8" />

      <LawTOC articles={articles} lawSlug={slug} />

      <LawCTA lawShortName={ley.shortName} className="mt-12" />
    </div>
  )
}
