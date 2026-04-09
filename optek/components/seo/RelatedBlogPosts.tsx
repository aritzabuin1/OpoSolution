/**
 * components/seo/RelatedBlogPosts.tsx — Guías del blog relacionadas con una ley
 *
 * Server Component. Muestra hasta 4 posts del blog que referencian la ley dada.
 * Crea enlace bidireccional /ley/ ↔ blog (señal de autoridad temática para GEO).
 */

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { getBlogPostsForLey } from '@/data/seo/ley-blog-map'

interface Props {
  lawSlug: string
  lawShortName: string
  className?: string
}

export function RelatedBlogPosts({ lawSlug, lawShortName, className }: Props) {
  const posts = getBlogPostsForLey(lawSlug, 4)

  if (posts.length === 0) return null

  return (
    <section className={className}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <BookOpen className="h-5 w-5 text-blue-500" />
        Guías del blog sobre {lawShortName}
      </h2>
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block rounded-lg border border-gray-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
            >
              <p className="font-medium text-gray-900 group-hover:text-blue-700 line-clamp-2">
                {post.title}
              </p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {post.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
