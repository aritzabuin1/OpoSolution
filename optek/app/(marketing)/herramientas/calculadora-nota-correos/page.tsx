import type { Metadata } from 'next'
import { CalculadoraNotaCorreos } from './CalculadoraNotaCorreos'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas/calculadora-nota-correos`

export const metadata: Metadata = {
  title: 'Calculadora Nota Correos 2026 — Calcula tu puntuaci\u00f3n gratis',
  description:
    'Calcula tu nota del examen de Correos 2026 gratis. 100 preguntas, sin penalizaci\u00f3n, m\u00e1ximo 60 puntos. Introduce tus aciertos y descubre tu puntuaci\u00f3n al instante.',
  keywords: [
    'calculadora nota correos',
    'calcular nota examen correos 2026',
    'puntuaci\u00f3n examen correos',
    'nota correos sin penalizaci\u00f3n',
    'calculadora oposiciones correos gratis',
    'correos personal laboral fijo nota',
  ],
  openGraph: {
    title: 'Calculadora Nota Correos 2026 — Calcula tu puntuaci\u00f3n gratis',
    description: 'Calcula tu nota del examen de Correos. Sin penalizaci\u00f3n, 100 preguntas, m\u00e1ximo 60 puntos.',
    type: 'website',
    url: PAGE_URL,
    images: [{
      url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Calculadora Nota Correos')}`,
      width: 1200,
      height: 630,
      alt: 'Calculadora de nota del examen de Correos 2026 — OpoRuta',
    }],
  },
  alternates: { canonical: PAGE_URL },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora Nota Correos 2026 — Calcula tu puntuaci\u00f3n gratis',
    description: 'Calcula tu nota del examen de Correos. Sin penalizaci\u00f3n, 100 preguntas, m\u00e1ximo 60 puntos.',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de nota Correos 2026',
    description: 'Herramienta gratuita para calcular la nota del examen de Correos. Sin penalizaci\u00f3n: cada acierto vale 0,60 puntos, los errores no restan.',
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
      { '@type': 'ListItem', position: 3, name: 'Calculadora nota Correos', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '\u00bfC\u00f3mo se calcula la nota del examen de Correos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cada acierto suma 0,60 puntos. Los errores no restan (no hay penalizaci\u00f3n). La puntuaci\u00f3n m\u00e1xima es 60 puntos sobre 100 preguntas. F\u00f3rmula: Nota = Aciertos \u00d7 0,60.',
        },
      },
      {
        '@type': 'Question',
        name: '\u00bfEl examen de Correos penaliza los errores?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. A diferencia de oposiciones de AGE o Justicia, en Correos los errores no restan puntos. Conviene responder TODAS las preguntas, ya que dejar una en blanco es lo mismo que fallarla (0 puntos) pero con la posibilidad de acertar.',
        },
      },
      {
        '@type': 'Question',
        name: '\u00bfCu\u00e1ntas preguntas tiene el examen de Correos 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El examen tiene 100 preguntas: 90 de temario (12 temas) y 10 de psicot\u00e9cnicos. El tiempo disponible es de 110 minutos (1 minuto y 6 segundos por pregunta).',
        },
      },
      {
        '@type': 'Question',
        name: '\u00bfQu\u00e9 nota necesito para aprobar Correos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Correos es un concurso-oposici\u00f3n. La fase de examen vale hasta 60 puntos y los m\u00e9ritos hasta 40 puntos. No hay nota m\u00ednima oficial para el examen, pero la nota de corte depende de la convocatoria y el n\u00famero de plazas. En convocatorias anteriores, con 30+ aciertos ya se ten\u00edan opciones reales de plaza.',
        },
      },
    ],
  },
]

export default function CalculadoraNotaCorreosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculadoraNotaCorreos />
    </>
  )
}
