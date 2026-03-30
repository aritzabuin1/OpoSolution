import type { Metadata } from 'next'
import { CalculadoraNotaHacienda } from './CalculadoraNotaHacienda'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas/calculadora-nota-hacienda`

export const metadata: Metadata = {
  title: 'Calculadora de Nota Agente de Hacienda 2026 — Penalizacion -1/4 | OpoRuta',
  description:
    'Calcula tu nota del examen de Agente de Hacienda con la penalizacion -1/4 oficial. Ejercicio 1: 80 preguntas test. Ejercicio 2: 10 supuestos desarrollo. Gratis.',
  keywords: [
    'calculadora nota agente hacienda',
    'nota examen hacienda',
    'penalizacion 1/4 hacienda',
    'calculadora agente hacienda publica',
    'nota examen agente hacienda 2026',
    'calcular puntuacion oposicion hacienda',
  ],
  openGraph: {
    title: 'Calculadora de Nota — Agente de Hacienda 2026',
    description: 'Calcula tu nota con la penalizacion -1/4 oficial. 80 preguntas test + 10 supuestos desarrollo. Gratis.',
    type: 'website',
    url: PAGE_URL,
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Calculadora Nota Agente Hacienda')}`, width: 1200, height: 630, alt: 'Calculadora de nota del examen de Agente de Hacienda con penalizacion -1/4 — OpoRuta' }],
  },
  alternates: { canonical: PAGE_URL },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de Nota — Agente de Hacienda 2026',
    description: 'Calcula tu nota con la penalizacion -1/4 oficial. Gratis.',
  },
}

// JSON-LD schemas
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de nota Agente de Hacienda con penalizacion -1/4',
    description: 'Herramienta gratuita para calcular la nota del primer ejercicio del examen de Agente de la Hacienda Publica con la penalizacion -1/4 oficial.',
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
      { '@type': 'ListItem', position: 3, name: 'Calculadora Agente de Hacienda', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como se calcula la nota del examen de Agente de Hacienda?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El ejercicio 1 (test) se calcula con la formula: Nota = (Aciertos - Errores/4) x 10/80. Se califica de 0 a 10, con un minimo de 5 para aprobar. El ejercicio 2 (desarrollo) lo califica el tribunal de 0 a 30, con minimo 15.',
        },
      },
      {
        '@type': 'Question',
        name: 'Cual es la penalizacion en el examen de Agente de Hacienda?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El primer ejercicio (test de 80 preguntas) tiene penalizacion -1/4: cada respuesta incorrecta descuenta un cuarto del valor de un acierto. Las respuestas en blanco no penalizan. El segundo ejercicio (desarrollo escrito) no tiene penalizacion ya que lo valora directamente el tribunal.',
        },
      },
      {
        '@type': 'Question',
        name: 'Cuantos puntos necesito para aprobar la oposicion de Agente de Hacienda?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Necesitas un minimo de 5/10 en el ejercicio 1 (test) y un minimo de 15/30 en el ejercicio 2 (desarrollo). Ambos son eliminatorios. La nota maxima total es 40 puntos (10 + 30).',
        },
      },
    ],
  },
]

export default function CalculadoraNotaHaciendaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculadoraNotaHacienda />
    </>
  )
}
