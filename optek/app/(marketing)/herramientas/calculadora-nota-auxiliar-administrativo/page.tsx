import type { Metadata } from 'next'
import { CalculadoraNota } from './CalculadoraNota'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas/calculadora-nota-auxiliar-administrativo`

export const metadata: Metadata = {
  title: 'Calculadora de nota con penalización -1/3 — Auxiliar Administrativo del Estado',
  description:
    'Calcula tu nota del examen de Auxiliar Administrativo del Estado con la penalización -1/3 oficial. Introduce tus aciertos y errores y descubre si apruebas. Gratis.',
  keywords: [
    'calculadora nota auxiliar administrativo',
    'calcular nota examen auxiliar administrativo penalización',
    'calculadora penalización 1/3 oposiciones',
    'nota examen INAP auxiliar administrativo',
    'calcular puntuación oposición auxiliar estado',
  ],
  openGraph: {
    title: 'Calculadora de nota — Auxiliar Administrativo del Estado',
    description: 'Calcula tu nota con la penalización -1/3 oficial. ¿Apruebas o suspendes? Descúbrelo gratis.',
    type: 'website',
    url: PAGE_URL,
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Calculadora de Nota -1/3')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: PAGE_URL },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de nota — Auxiliar Administrativo del Estado',
    description: 'Calcula tu nota con la penalización -1/3 oficial. Gratis.',
  },
}

// JSON-LD schemas
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de nota con penalización -1/3',
    description: 'Herramienta gratuita para calcular la nota del examen de Auxiliar Administrativo del Estado con la penalización -1/3 oficial del INAP.',
    url: PAGE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'es',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Herramientas', item: `${APP_URL}/herramientas` },
      { '@type': 'ListItem', position: 3, name: 'Calculadora de nota', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo se calcula la nota del examen de Auxiliar Administrativo del Estado?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La nota se calcula con la fórmula: Puntuación = Aciertos − (Errores / 3). Las respuestas en blanco no puntúan ni penalizan. Cada parte del examen se califica de 0 a 50 puntos, con un mínimo de 25 para aprobar.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuál es la nota de corte del Auxiliar Administrativo del Estado?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En la última convocatoria, la nota de corte fue de 30 puntos en la primera parte (teoría + psicotécnicos) y 26,33 puntos en la segunda parte (ofimática). Ambas partes son eliminatorias: necesitas el mínimo en las dos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuándo conviene dejar una pregunta en blanco?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Si puedes descartar al menos 1 de las 4 opciones, estadísticamente te compensa arriesgar. Si no puedes descartar ninguna, déjala en blanco. La penalización -1/3 está diseñada para que responder al azar entre 4 opciones tenga esperanza matemática cero.',
        },
      },
    ],
  },
]

export default function CalculadoraNotaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculadoraNota />
    </>
  )
}
