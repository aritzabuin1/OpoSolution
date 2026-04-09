import { NextResponse } from 'next/server'
import { blogPosts } from '@/content/blog/posts'

/**
 * GET /blog/[slug]/raw
 *
 * Devuelve el contenido del blog post en texto plano (markdown simplificado).
 * Optimizado para LLM crawlers (Perplexity, ChatGPT, Claude).
 * Bloqueado de Google en robots.txt para evitar contenido duplicado.
 */

export const revalidate = 86400 // 24h

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    return new NextResponse('Not found', { status: 404 })
  }

  const markdown = htmlToPlainMarkdown(post.content)

  const body = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `- Publicado: ${post.date}`,
    post.dateModified ? `- Actualizado: ${post.dateModified}` : null,
    `- Palabras clave: ${post.keywords.join(', ')}`,
    `- URL canónica: https://oporuta.es/blog/${post.slug}`,
    '',
    '---',
    '',
    markdown,
    ...(post.faqs && post.faqs.length > 0
      ? [
          '',
          '---',
          '',
          '## Preguntas frecuentes',
          '',
          ...post.faqs.flatMap((faq) => [
            `### ${faq.question}`,
            '',
            faq.answer,
            '',
          ]),
        ]
      : []),
    '',
    '---',
    '',
    'Fuente: OpoRuta (https://oporuta.es) — Plataforma de preparación de oposiciones con IA.',
    `Más info: https://oporuta.es/llms.txt`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  })
}

/** Convert HTML to simplified markdown-style plain text */
function htmlToPlainMarkdown(html: string): string {
  return (
    html
      // Headings
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
      // Bold / italic
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      // Links — preserve href
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // List items
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1')
      // Table rows → pipe-separated
      .replace(/<th[^>]*>(.*?)<\/th>/gi, '| $1 ')
      .replace(/<td[^>]*>(.*?)<\/td>/gi, '| $1 ')
      .replace(/<\/tr>/gi, '|')
      .replace(/<tr[^>]*>/gi, '\n')
      // Paragraphs → double newline
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Strip remaining tags
      .replace(/<[^>]+>/g, '')
      // Clean up entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}
