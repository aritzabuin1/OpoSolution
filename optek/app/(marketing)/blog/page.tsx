import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { blogPosts } from '@/content/blog/posts'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog OpoRuta — Guías para Opositores al Auxiliar Administrativo del Estado',
  description:
    'Guías prácticas para preparar el examen del Auxiliar Administrativo del Estado: LPAC, LRJSP, penalización, simulacros y más. Con verificación de citas legales.',
  openGraph: {
    title: 'Blog OpoRuta — Guías para Auxiliar Administrativo del Estado',
    description:
      'Artículos y guías para preparar el Cuerpo General Auxiliar de la Administración del Estado.',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
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
  )
}
