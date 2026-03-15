import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { blogPosts } from '@/content/blog/posts'
import { ArrowRight, BookOpen } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Blog OpoRuta — Guías para Oposiciones AGE (C1 y C2)',
  description:
    'Guías prácticas para preparar las oposiciones de Auxiliar Administrativo (C2) y Administrativo del Estado (C1): LPAC, LRJSP, Constitución, TREBEP, penalización -1/3, simulacros INAP, psicotécnicos y supuesto práctico. Con verificación de citas legales.',
  keywords: [
    'blog oposiciones auxiliar administrativo',
    'guías auxiliar administrativo estado',
    'guías administrativo estado C1',
    'preparar oposición auxiliar administrativo',
    'preparar oposición administrativo estado',
    'artículos LPAC examen INAP',
    'temario auxiliar administrativo 2026',
    'temario administrativo estado C1 2026',
  ],
  openGraph: {
    title: 'Blog OpoRuta — Guías para Oposiciones AGE (C1 y C2)',
    description:
      'Artículos y guías para preparar Auxiliar Administrativo (C2) y Administrativo del Estado (C1). LPAC, LRJSP, Constitución, TREBEP, psicotécnicos y más.',
    type: 'website',
    url: `${APP_URL}/blog`,
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Guías para Opositores')}`, width: 1200, height: 630, alt: 'Blog OpoRuta — Guías para oposiciones AGE C1 y C2' }],
  },
  alternates: {
    canonical: `${APP_URL}/blog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog OpoRuta — Guías para Oposiciones AGE (C1 y C2)',
    description: 'Artículos verificados para preparar Auxiliar (C2) y Administrativo del Estado (C1).',
  },
}

export default function BlogIndexPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // JSON-LD — CollectionPage + ItemList for blog index
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Blog OpoRuta — Guías para Oposiciones AGE',
      description: 'Guías prácticas para preparar las oposiciones de Auxiliar Administrativo (C2) y Administrativo del Estado (C1).',
      url: `${APP_URL}/blog`,
      publisher: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: sortedPosts.length,
        itemListElement: sortedPosts.map((post, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${APP_URL}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4">
          <BookOpen className="h-3 w-3 mr-1" />
          Blog
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Guías para preparar Auxiliar del Estado
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Artículos prácticos sobre LPAC, LRJSP, psicotécnicos, ofimática y estrategias
          de examen. Todo verificado contra la legislación oficial.
        </p>
      </div>

      {/* Posts grid */}
      <div className="space-y-6">
        {sortedPosts.map((post) => (
          <Card key={post.slug} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg leading-snug">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(post.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {post.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.keywords.slice(0, 3).map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Leer artículo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  )
}
