/**
 * components/seo/LawBreadcrumb.tsx — Breadcrumb para páginas de legislación
 *
 * Server Component. Renderiza breadcrumb visual + JSON-LD BreadcrumbList.
 */

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { JsonLd } from '@/components/shared/JsonLd'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

interface BreadcrumbItem {
  label: string
  href: string
}

interface LawBreadcrumbProps {
  lawName: string
  lawSlug: string
  articleNumber?: string
  articleSlug?: string
}

export function LawBreadcrumb({ lawName, lawSlug, articleNumber, articleSlug }: LawBreadcrumbProps) {
  const items: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/' },
    { label: 'Legislación', href: '/ley' },
    { label: lawName, href: `/ley/${lawSlug}` },
  ]

  if (articleNumber && articleSlug) {
    items.push({
      label: articleNumber.startsWith('D') ? articleNumber : `Art. ${articleNumber}`,
      href: `/ley/${lawSlug}/${articleSlug}`,
    })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `${APP_URL}${item.href}`,
    })),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
              {i === items.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-blue-600 transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
