/**
 * components/shared/JsonLd.tsx — §2.17.2
 *
 * Componente servidor para inyectar datos estructurados JSON-LD en el HTML.
 * Usado para Schema.org (FAQPage, Organization, WebSite, BreadcrumbList, Article).
 *
 * Uso:
 *   <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Organization', ... }} />
 */

interface JsonLdProps {
  data: object
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
