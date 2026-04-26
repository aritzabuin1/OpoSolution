import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CLUSTER_LABELS,
  CLUSTER_PILLAR_PATH,
  getCluster,
  getClusterSiblings,
} from '@/lib/seo/blog-clusters'

interface Props {
  slug: string
  limit?: number
}

/**
 * Renderiza siblings del mismo cluster temático al final de cada post.
 * Server component puro: cero JS al cliente, ideal para SEO/PageRank.
 */
export function RelatedClusterPosts({ slug, limit = 5 }: Props) {
  const cluster = getCluster(slug)
  const siblings = getClusterSiblings(slug, limit)
  if (siblings.length === 0) return null

  const label = CLUSTER_LABELS[cluster]
  const pillar = CLUSTER_PILLAR_PATH[cluster]

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Más sobre {label}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Artículos relacionados de la misma oposición.
      </p>
      <ul className="space-y-3">
        {siblings.map((p) => (
          <li key={p.slug} className="group">
            <Link
              href={`/blog/${p.slug}`}
              className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40"
            >
              <ArrowRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="flex-1">
                <span className="block font-medium text-foreground leading-snug">
                  {p.title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">
                  {p.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {pillar && (
        <div className="mt-6">
          <Link
            href={pillar}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver toda la oposición de {label} →
          </Link>
        </div>
      )}
    </section>
  )
}
