import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/shared/JsonLd'
import { LawBreadcrumb } from '@/components/seo/LawBreadcrumb'
import { OposicionBadges } from '@/components/seo/OposicionBadges'
import { ArticleExamQuestions } from '@/components/seo/ArticleExamQuestions'
import { ArticleFrequencyBadge } from '@/components/seo/ArticleFrequencyBadge'
import { ArticleSummaryCard } from '@/components/seo/ArticleSummaryCard'
import { getArticleSummary } from '@/lib/seo/article-summary'
import { ArticleText } from '@/components/seo/ArticleText'
import { ArticleNav } from '@/components/seo/ArticleNav'
import { RelatedArticles } from '@/components/seo/RelatedArticles'
import { LawCTA } from '@/components/seo/LawCTA'
import { RelatedBlogPosts } from '@/components/seo/RelatedBlogPosts'
import { getLeyBySlug } from '@/data/seo/ley-registry'
import { getOposicionesForLey } from '@/data/seo/ley-oposicion-map'
import { getArticleProvisions, getRelatedArticles } from '@/lib/seo/law-queries'
import { extractCleanTitle, slugifyArticulo } from '@/lib/seo/slugify'
import articleIndex from '@/data/seo/article-index.json'
import articleExamMap from '@/data/seo/article-exam-map.json'
import { isArticleIndexable } from '@/lib/seo/indexability'
import { getOposicionById } from '@/data/seo/oposicion-registry'
import { Scale } from 'lucide-react'

const NOINDEX_META: Metadata = { robots: { index: false, follow: true } }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// force-dynamic: ISR con generateStaticParams=[] en Next.js 16 produce 404s
// consistentes en Vercel (incluso con X-Vercel-Cache: MISS). El debug endpoint
// prueba que la pipeline completa funciona a runtime. SSR on-demand es la única
// configuración estable para estas 9K+ páginas. CDN sigue cacheando el 200 por
// X-Nextjs-Stale-Time durante 5 min, que es suficiente para tráfico SEO.
export const dynamic = 'force-dynamic'

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
  if (!ley) return NOINDEX_META

  const artNumero = resolveArticuloNumero(artSlug, ley.leyNombre)
  if (!artNumero) return NOINDEX_META

  const provisions = await getArticleProvisions(ley.leyNombre, artNumero)
  if (provisions.length === 0) return NOINDEX_META

  const indexable = isArticleIndexable(ley.leyNombre, artNumero)

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
      images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent(`${artLabel} — ${ley.shortName}`)}`, width: 1200, height: 630 }],
    },
    alternates: { canonical: `${APP_URL}/ley/${lawSlug}/${artSlug}` },
    robots: indexable ? undefined : { index: false, follow: true },
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

  // F1.T5: TL;DR cacheado (null si aún no generado — no degrada UX)
  const summary = await getArticleSummary(ley.leyNombre, artNumero)

  // Fetch related articles from same chapter
  const related = await getRelatedArticles(
    ley.leyNombre,
    provisions[0].titulo_capitulo,
    artNumero,
    5,
  )

  // Examen data (PlanSEO F1.T6): si hay preguntas oficiales cruzadas, enriquece FAQ
  // con información específica — esto es lo que Google post-HCU premia como
  // "information gain" y diferencia contenido único de réplicas del BOE.
  const examMap = (articleExamMap as { map: Record<string, { anio: number; oposicionId: string }[]> }).map ?? {}
  const examEntries = examMap[`${ley.leyNombre}:${artNumero}`] ?? []
  const examYears = [...new Set(examEntries.map(e => e.anio))].sort((a, b) => b - a)
  const examOposiciones = [
    ...new Set(
      examEntries
        .map(e => getOposicionById(e.oposicionId)?.shortName)
        .filter((n): n is string => !!n),
    ),
  ]

  // Build FAQ schema for all laws (LLMs cite FAQ answers textually)
  const oposiciones = getOposicionesForLey(ley.leyNombre)
  const faqEntries: Array<{ '@type': 'Question'; name: string; acceptedAnswer: { '@type': 'Answer'; text: string } }> = [
    {
      '@type': 'Question',
      name: `¿Qué dice el ${artLabel.toLowerCase()} de la ${ley.fullName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: provisions[0].texto_integro?.slice(0, 300).replace(/\n/g, ' ') ?? '',
      },
    },
  ]

  if (oposiciones.length > 0) {
    faqEntries.push({
      '@type': 'Question',
      name: `¿En qué oposiciones se pregunta el ${artLabel.toLowerCase()} ${ley.shortName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `El ${artLabel} de la ${ley.fullName} se examina en: ${oposiciones.map(o => o.name).join(', ')}.`,
      },
    })
  }

  // FAQ específica con datos reales de examen (anti-template): sólo si hay
  // histórico suficiente. Google penaliza FAQs que se repiten literales entre
  // URLs; esta varía con datos reales por artículo.
  if (examEntries.length > 0 && examYears.length > 0) {
    const yearList = examYears.slice(0, 6).join(', ')
    const opoList = examOposiciones.slice(0, 5).join(', ')
    faqEntries.push({
      '@type': 'Question',
      name: `¿En qué años cayó el ${artLabel.toLowerCase()} ${ley.shortName} en exámenes oficiales?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Según el histórico de preguntas oficiales, el ${artLabel} de la ${ley.fullName} ha aparecido en convocatorias de ${yearList}${opoList ? ` (oposiciones: ${opoList})` : ''}. En total se han registrado ${examEntries.length} ${examEntries.length === 1 ? 'pregunta' : 'preguntas'} oficiales que lo citan explícitamente.`,
      },
    })
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries,
  }

  // Article schema (PlanSEO F1.T10) — additional signal for Google/LLMs
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${artLabel} de la ${ley.fullName}${cleanTitle ? ` — ${cleanTitle}` : ''}`,
    description: provisions[0].texto_integro?.slice(0, 155).replace(/\n/g, ' ') ?? '',
    author: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
    publisher: {
      '@type': 'Organization',
      name: 'OpoRuta',
      url: APP_URL,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/icon.svg` },
    },
    inLanguage: 'es',
    mainEntityOfPage: `${APP_URL}/ley/${lawSlug}/${artSlug}`,
    datePublished: '2026-01-01',
    dateModified: new Date().toISOString().slice(0, 10),
  }

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

  // BreadcrumbList (PlanSEO F1.T9) — Google uses this to render rich breadcrumbs
  // under the search result title instead of the bare URL.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Legislación', item: `${APP_URL}/ley` },
      { '@type': 'ListItem', position: 3, name: ley.shortName, item: `${APP_URL}/ley/${lawSlug}` },
      { '@type': 'ListItem', position: 4, name: artLabel, item: `${APP_URL}/ley/${lawSlug}/${artSlug}` },
    ],
  }

  // Section hierarchy
  const sectionParts = (provisions[0].titulo_capitulo ?? '')
    .split(/[|]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 120)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={legislationJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

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

        <div className="mt-4">
          <ArticleFrequencyBadge leyNombre={ley.leyNombre} articuloNumero={artNumero} />
        </div>
      </header>

      {/* F1.T5 TL;DR IA (se oculta si aún no generado) */}
      <ArticleSummaryCard tldr={summary?.tldr ?? null} />

      {/* Article text (handles multi-provision) */}
      <ArticleText provisions={provisions} />

      {/* Oposiciones badges */}
      <OposicionBadges leyNombre={ley.leyNombre} className="mt-8" />

      {/* Preguntas oficiales donde cayó el artículo */}
      <ArticleExamQuestions
        leyNombre={ley.leyNombre}
        articuloNumero={artNumero}
        articuloLabel={artLabel}
        leyShortName={ley.shortName}
      />

      {/* Related articles */}
      <RelatedArticles articles={related} lawSlug={lawSlug} />

      {/* Prev/Next navigation */}
      <ArticleNav lawSlug={lawSlug} leyNombre={ley.leyNombre} currentArticulo={artNumero} />

      {/* Related blog posts (bidirectional linking) */}
      <RelatedBlogPosts lawSlug={lawSlug} lawShortName={ley.shortName} className="mt-10" />

      {/* CTA — F1.T7 article-scoped */}
      <LawCTA
        lawShortName={ley.shortName}
        articleLabel={artLabel}
        leyNombre={ley.leyNombre}
        articuloNumero={artNumero}
        className="mt-10"
      />
    </div>
  )
}
