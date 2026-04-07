/**
 * components/seo/LawTOC.tsx — Índice de artículos agrupado por sección
 *
 * Server Component. Parsea titulo_capitulo para agrupar artículos
 * en una estructura jerárquica (TÍTULO > CAPÍTULO > SECCIÓN).
 */

import Link from 'next/link'
import { slugifyArticulo, extractCleanTitle } from '@/lib/seo/slugify'
import type { ArticuloSummary } from '@/lib/seo/law-queries'

interface LawTOCProps {
  articles: ArticuloSummary[]
  lawSlug: string
}

interface SectionGroup {
  name: string
  articles: ArticuloSummary[]
}

export function LawTOC({ articles, lawSlug }: LawTOCProps) {
  if (articles.length === 0) return null

  // Deduplicate by articulo_numero (multi-provision may appear multiple times)
  const seen = new Set<string>()
  const unique: ArticuloSummary[] = []
  for (const art of articles) {
    if (!seen.has(art.articulo_numero)) {
      seen.add(art.articulo_numero)
      unique.push(art)
    }
  }

  // Group by section (first meaningful part of titulo_capitulo)
  const groups = groupBySection(unique)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Índice de artículos ({unique.length})
      </h2>
      {groups.map((group, i) => (
        <div key={i}>
          {group.name && (
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200 pb-1">
              {group.name}
            </h3>
          )}
          <ul className="space-y-1">
            {group.articles.map(art => {
              const cleanTitle = extractCleanTitle(art.titulo_articulo ?? '')
              const isDisposicion = art.articulo_numero.startsWith('D')
              const slug = slugifyArticulo(art.articulo_numero)
              const label = isDisposicion
                ? art.articulo_numero
                : `Art. ${art.articulo_numero}`

              return (
                <li key={art.articulo_numero}>
                  <Link
                    href={`/ley/${lawSlug}/${slug}`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5"
                  >
                    <span className="font-medium">{label}</span>
                    {cleanTitle && (
                      <span className="text-gray-600">. {cleanTitle}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function groupBySection(articles: ArticuloSummary[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  let currentSection = ''
  let currentGroup: ArticuloSummary[] = []

  for (const art of articles) {
    const section = extractTopSection(art.titulo_capitulo)

    if (section !== currentSection) {
      if (currentGroup.length > 0) {
        groups.push({ name: currentSection, articles: currentGroup })
      }
      currentSection = section
      currentGroup = [art]
    } else {
      currentGroup.push(art)
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ name: currentSection, articles: currentGroup })
  }

  return groups
}

function extractTopSection(tituloCapitulo: string | null): string {
  if (!tituloCapitulo) return ''

  // Split by | or — and take the first meaningful part
  const parts = tituloCapitulo
    .split(/[|]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 120)

  // Take first 1-2 parts for the section header
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts[0]} — ${parts[1]}`
}
