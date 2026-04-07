/**
 * components/seo/ArticleNav.tsx — Navegación prev/next entre artículos
 *
 * Server Component. Usa article-index.json para conocer el orden.
 */

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { slugifyArticulo } from '@/lib/seo/slugify'
import articleIndex from '@/data/seo/article-index.json'

interface ArticleNavProps {
  lawSlug: string
  leyNombre: string
  currentArticulo: string
}

export function ArticleNav({ lawSlug, leyNombre, currentArticulo }: ArticleNavProps) {
  const law = articleIndex.laws.find(l => l.leyNombre === leyNombre)
  if (!law) return null

  const currentIdx = law.articles.indexOf(currentArticulo)
  if (currentIdx === -1) return null

  const prev = currentIdx > 0 ? law.articles[currentIdx - 1] : null
  const next = currentIdx < law.articles.length - 1 ? law.articles[currentIdx + 1] : null

  if (!prev && !next) return null

  return (
    <nav aria-label="Artículo anterior y siguiente" className="mt-8 flex items-stretch gap-4">
      {prev ? (
        <Link
          href={`/ley/${lawSlug}/${slugifyArticulo(prev)}`}
          className="group flex flex-1 items-center gap-2 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          <ChevronLeft className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
          <div className="min-w-0">
            <span className="block text-xs text-gray-500">Anterior</span>
            <span className="block truncate text-sm font-medium text-gray-700 group-hover:text-blue-600">
              {prev.startsWith('D') ? prev : `Artículo ${prev}`}
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={`/ley/${lawSlug}/${slugifyArticulo(next)}`}
          className="group flex flex-1 items-center justify-end gap-2 rounded-lg border border-gray-200 p-4 text-right transition-colors hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="min-w-0">
            <span className="block text-xs text-gray-500">Siguiente</span>
            <span className="block truncate text-sm font-medium text-gray-700 group-hover:text-blue-600">
              {next.startsWith('D') ? next : `Artículo ${next}`}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  )
}
