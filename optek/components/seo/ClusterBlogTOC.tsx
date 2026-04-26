import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CLUSTER_LABELS,
  type ClusterId,
  getClusterPosts,
} from '@/lib/seo/blog-clusters'

interface Props {
  clusters: ClusterId | ClusterId[]
  title?: string
  description?: string
  /** Si pasas múltiples clusters, agrupa por cluster con subheading. */
  groupByCluster?: boolean
}

/**
 * Renderiza un Table of Contents con TODOS los posts del/los cluster(s)
 * indicado(s). Pensado para los pillar pages /oposiciones/<x> — Google premia
 * páginas pillar con muchos enlaces internos a contenido temático.
 *
 * Server component puro, cero JS al cliente.
 */
export function ClusterBlogTOC({
  clusters,
  title,
  description,
  groupByCluster,
}: Props) {
  const list = Array.isArray(clusters) ? clusters : [clusters]
  const useGrouping = groupByCluster ?? list.length > 1

  const allPosts = list.flatMap((c) =>
    getClusterPosts(c).map((p) => ({ post: p, cluster: c })),
  )
  if (allPosts.length === 0) return null

  const heading = title ?? 'Guías y artículos del blog'
  const sub = description ?? 'Todo el contenido publicado para esta oposición. Actualizado en cada convocatoria.'

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      </div>

      {useGrouping ? (
        <div className="space-y-8">
          {list.map((c) => {
            const posts = getClusterPosts(c)
            if (posts.length === 0) return null
            return (
              <div key={c}>
                <h3 className="text-lg font-semibold mb-3">
                  {CLUSTER_LABELS[c]}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({posts.length} artículos)
                  </span>
                </h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {posts.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/blog/${p.slug}`}
                        className="flex items-start gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-2 leading-snug">{p.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {allPosts.map(({ post: p }) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="flex items-start gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/40"
              >
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 leading-snug">{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
