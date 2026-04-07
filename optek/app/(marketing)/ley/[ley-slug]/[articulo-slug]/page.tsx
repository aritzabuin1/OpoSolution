import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/shared/JsonLd'
import { LawBreadcrumb } from '@/components/seo/LawBreadcrumb'
import { OposicionBadges } from '@/components/seo/OposicionBadges'
import { ArticleText } from '@/components/seo/ArticleText'
import { ArticleNav } from '@/components/seo/ArticleNav'
import { RelatedArticles } from '@/components/seo/RelatedArticles'
import { LawCTA } from '@/components/seo/LawCTA'
import { getLeyBySlug } from '@/data/seo/ley-registry'
import { getOposicionesForLey } from '@/data/seo/ley-oposicion-map'
import { getArticleProvisions, getRelatedArticles } from '@/lib/seo/law-queries'
import { extractCleanTitle, slugifyArticulo } from '@/lib/seo/slugify'
import articleIndex from '@/data/seo/article-index.json'
import { Scale } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 604800 // 7 days

// Pure ISR — no SSG at build time (9K+ articles would blow Vercel limits)
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ 'ley-slug': string; 'articulo-slug': string }> }

/**
 * Resolve an article slug back to the original article number.
 * "articulo-14" → "14", "da-primera" → "DA-primera", etc.
 */
function resolveArticuloNumero(slug: string, leyNombre: string): string | null {
  const law = articleIndex.laws.find(l => l.leyNombre === leyNombre)
  if (!law) return null

  // Find the article whose slugified form matches
  for (const numero of law.articles) {
    if (slugifyArticulo(numero) === slug) return numero
  }

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'ley-slug': lawSlug, 'articulo-slug': artSlug } = await params
  const ley = getLeyBySlug(lawSlug)
  if (!ley) return {}

  const artNumero = resolveArticuloNumero(artSlug, ley.leyNombre)
  if (!artNumero) return {}

  const provisions = await getArticleProvisions(ley.leyNombre, artNumero)
  if (provisions.length === 0) return {}

  const cleanTitle = extractCleanTitle(provisions[0].titulo_capitulo ?? '')
  const textoSnippet = provisions[0].texto_integro?.slice(0, 155).replace(/\n/g, ' ') ?? ''
  const isDisposicion = artNumero.startsWith('D')
  const artLabel = isDisposicion ? artNumero : `Artículo ${artNumero}`

  const titleParts = [`${artLabel} de la ${ley.fullName}`]
  if (cleanTitle) titleParts.push(cleanTitle)
  titleParts.push('OpoRuta')

  return {
    title: titleParts.join(' — '),
    description: `${textoSnippet}… Consulta en qué oposiciones se examina.`,
    keywords: [
      `artículo ${artNumero} ${ley.fullName}`,
      `art ${artNumero} ${ley.shortName}`,
      `${ley.shortName} artículo ${artNumero} oposiciones`,
    ],
    openGraph: {
      title: `${artLabel} ${ley.shortName} | OpoRuta`,
      description: textoSnippet,
      url: `${APP_URL}/ley/${lawSlug}/${artSlug}`,
      type: 'article',
    },
    alternates: { canonical: `${APP_URL}/ley/${lawSlug}/${artSlug}` },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { 'ley-slug': lawSlug, 'articulo-slug': artSlug } = await params
  const ley = getLeyBySlug(lawSlug)
  if (!ley) notFound()

  const artNumero = resolveArticuloNumero(artSlug, ley.leyNombre)
  if (!artNumero) notFound()

  const provisions = await getArticleProvisions(ley.leyNombre, artNumero)
  if (provisions.length === 0) notFound()

  // Quality check: total text must be >= 50 chars
  const totalText = provisions.reduce((sum, p) => sum + (p.texto_integro?.length ?? 0), 0)
  if (totalText < 50) notFound()

  const cleanTitle = extractCleanTitle(provisions[0].titulo_capitulo ?? '')
  const isDisposicion = artNumero.startsWith('D')
  const artLabel = isDisposicion ? artNumero : `Artículo ${artNumero}`

  // Fetch related articles from same chapter
  const related = await getRelatedArticles(
    ley.leyNombre,
    provisions[0].titulo_capitulo,
    artNumero,
    5,
  )

  // Build FAQ schema for high-priority laws
  const oposiciones = getOposicionesForLey(ley.leyNombre)
  const faqJsonLd = ley.priority === 'high' ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Qué dice el ${artLabel.toLowerCase()} de la ${ley.fullName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: provisions[0].texto_integro?.slice(0, 300).replace(/\n/g, ' ') ?? '',
        },
      },
      ...(oposiciones.length > 0 ? [{
        '@type': 'Question',
        name: `¿En qué oposiciones se pregunta el ${artLabel.toLowerCase()} ${ley.shortName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `El ${artLabel} de la ${ley.fullName} se examina en: ${oposiciones.map(o => o.name).join(', ')}.`,
        },
      }] : []),
    ],
  } : null

  const legislationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LegislationObject',
    name: `${artLabel} de la ${ley.fullName}`,
    legislationIdentifier: ley.boeCode,
    text: provisions[0].texto_integro?.slice(0, 500),
    isPartOf: {
      '@type': 'Legislation',
      name: ley.fullName,
      url: `${APP_URL}/ley/${lawSlug}`,
    },
    inLanguage: 'es',
    url: `${APP_URL}/ley/${lawSlug}/${artSlug}`,
  }

  // Section hierarchy
  const sectionParts = (provisions[0].titulo_capitulo ?? '')
    .split(/[|]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 120)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={legislationJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <LawBreadcrumb
        lawName={ley.shortName}
        lawSlug={lawSlug}
        articleNumber={artNumero}
        articleSlug={artSlug}
      />

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">{ley.fullName}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {artLabel} de la {ley.fullName}
        </h1>

        {cleanTitle && (
          <p className="mt-2 text-lg text-gray-600">{cleanTitle}</p>
        )}

        {sectionParts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {sectionParts.map((part, i) => (
              <span
                key={i}
                className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                {part}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Article text (handles multi-provision) */}
      <ArticleText provisions={provisions} />

      {/* Oposiciones badges */}
      <OposicionBadges leyNombre={ley.leyNombre} className="mt-8" />

      {/* Related articles */}
      <RelatedArticles articles={related} lawSlug={lawSlug} />

      {/* Prev/Next navigation */}
      <ArticleNav lawSlug={lawSlug} leyNombre={ley.leyNombre} currentArticulo={artNumero} />

      {/* CTA */}
      <LawCTA lawShortName={ley.shortName} className="mt-10" />
    </div>
  )
}
