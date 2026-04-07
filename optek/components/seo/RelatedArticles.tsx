/**
 * components/seo/RelatedArticles.tsx — Artículos relacionados del mismo capítulo
 *
 * Server Component. Muestra links a artículos de la misma sección.
 */

import Link from 'next/link'
import { slugifyArticulo, extractCleanTitle } from '@/lib/seo/slugify'
import type { ArticuloSummary } from '@/lib/seo/law-queries'

interface RelatedArticlesProps {
  articles: ArticuloSummary[]
  lawSlug: string
}

export function RelatedArticles({ articles, lawSlug }: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Artículos relacionados
      </h2>
      <ul className="space-y-2">
        {articles.map(art => {
          const cleanTitle = extractCleanTitle(art.titulo_capitulo ?? '')
          const isDisposicion = art.articulo_numero.startsWith('D')
          const label = isDisposicion
            ? art.articulo_numero
            : `Artículo ${art.articulo_numero}`

          return (
            <li key={art.articulo_numero}>
              <Link
                href={`/ley/${lawSlug}/${slugifyArticulo(art.articulo_numero)}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {label}
                {cleanTitle && (
                  <span className="text-gray-500"> — {cleanTitle}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
