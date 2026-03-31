import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogPosts } from '@/content/blog/posts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { BlogCTA, injectMidArticleCTA } from '@/components/blog/BlogCTA'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return {}

  const ogUrl = `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent(post.title.slice(0, 60))}`

  return {
    title: `${post.title} — Blog OpoRuta`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.dateModified ?? post.date,
      authors: ['OpoRuta'],
      url: `${APP_URL}/blog/${post.slug}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: post.title }],
    },
    alternates: {
      canonical: `${APP_URL}/blog/${post.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 230))
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) notFound()

  const readingTime = estimateReadingTime(post.content)
  const contentWithCTA = injectMidArticleCTA(post.content)

  // Days to exam for bottom CTA — dynamic per oposición
  const isCorreosPost = post.slug.includes('correos') || post.keywords.some(k => k.toLowerCase().includes('correos'))
  const examDateStr = isCorreosPost ? '2026-05-07' : '2026-05-23'
  const examLabel = isCorreosPost ? '7 de mayo' : '23 de mayo'
  const examDate = new Date(examDateStr)
  const diasParaExamen = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const postIndex = blogPosts.findIndex((p) => p.slug === slug)
  const prevPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null
  const nextPost = postIndex > 0 ? blogPosts[postIndex - 1] : null

  // JSON-LD Article + BreadcrumbList schemas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.dateModified ?? post.date,
      author: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
      publisher: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}/blog/${post.slug}` },
      keywords: post.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${APP_URL}/blog/${post.slug}` },
      ],
    },
  ]

  // FAQPage schema for posts with FAQs — enables rich snippets in Google
  if (post.faqs && post.faqs.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    })
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            OpoRuta
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{post.title.slice(0, 50)}...</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.keywords.slice(0, 3).map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-muted-foreground">{post.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Publicado el{' '}
            {new Date(post.date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {post.dateModified && post.dateModified !== post.date && (
              <>
                {' '}· Actualizado el{' '}
                {new Date(post.dateModified).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </>
            )}
            {' '}· OpoRuta · {readingTime} min lectura
          </p>
        </header>

        {/* Content */}
        <article
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-muted-foreground
            prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-strong:text-foreground
            prose-table:text-sm
            prose-th:bg-muted prose-th:font-semibold prose-th:p-2
            prose-td:p-2 prose-td:border"
          dangerouslySetInnerHTML={{ __html: contentWithCTA }}
        />

        {/* FAQ section — visible + JSON-LD for rich snippets */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Preguntas frecuentes</h2>
            <dl className="space-y-4">
              {post.faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <dt className="font-semibold text-foreground">{faq.question}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* CTA bottom */}
        <BlogCTA variant="bottom" diasParaExamen={diasParaExamen} examLabel={examLabel} />

        {/* Navegación entre posts */}
        <nav aria-label="Navegacion entre articulos" className="mt-12 flex flex-col sm:flex-row gap-4 justify-between">
          {prevPost && (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="line-clamp-2">{prevPost.title}</span>
            </Link>
          )}
          {nextPost && (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto text-right"
            >
              <span className="line-clamp-2">{nextPost.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </nav>

        {/* Back to blog */}
        <div className="mt-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al blog
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
