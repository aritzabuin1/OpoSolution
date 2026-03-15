import type { Metadata } from 'next'
import { CalculadoraNotaC1 } from './CalculadoraNotaC1'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas/calculadora-nota-administrativo-estado`

export const metadata: Metadata = {
  title: 'Calculadora de nota con penalización -1/3 — Administrativo del Estado (C1)',
  description:
    'Calcula tu nota del examen de Administrativo del Estado (C1) con la penalización -1/3 oficial. Cuestionario (70 preguntas) + Supuesto Práctico (20 preguntas). Gratis.',
  keywords: [
    'calculadora nota administrativo estado',
    'calculadora nota C1 administración general',
    'calcular nota examen administrativo estado penalización',
    'calculadora penalización 1/3 administrativo C1',
    'nota examen INAP administrativo estado',
    'calcular puntuación oposición administrativo estado',
    'nota supuesto práctico administrativo estado',
  ],
  openGraph: {
    title: 'Calculadora de nota — Administrativo del Estado (C1)',
    description: 'Calcula tu nota del C1 con la penalización -1/3 oficial. Cuestionario + Supuesto Práctico. Gratis.',
    type: 'website',
    url: PAGE_URL,
    images: [{
      url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Calculadora de Nota C1 -1/3')}`,
      width: 1200,
      height: 630,
      alt: 'Calculadora de nota del examen de Administrativo del Estado (C1) con penalización -1/3 — OpoRuta',
    }],
  },
  alternates: { canonical: PAGE_URL },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de nota — Administrativo del Estado (C1)',
    description: 'Calcula tu nota del C1 con la penalización -1/3 oficial. Gratis.',
  },
}

// JSON-LD schemas
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora de nota Administrativo del Estado (C1) con penalización -1/3',
    description: 'Herramienta gratuita para calcular la nota del examen de Administrativo del Estado (C1) con la penalización -1/3 oficial del INAP. Cuestionario (70 preguntas) + Supuesto Práctico (20 preguntas).',
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
      { '@type': 'ListItem', position: 3, name: 'Calculadora de nota C1', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo se calcula la nota del examen de Administrativo del Estado (C1)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La nota se calcula con la fórmula: Puntuación = Aciertos − (Errores / 3). Las respuestas en blanco no puntúan ni penalizan. El examen tiene dos partes eliminatorias: Cuestionario (70 preguntas, 0-50 pts) y Supuesto Práctico (20 preguntas, 0-50 pts). Necesitas al menos 25 puntos en cada parte. La nota de corte general en 2024 fue de 47,33 puntos sobre 100.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuántas preguntas tiene el examen de Administrativo del Estado C1?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El examen tiene 90 preguntas puntuables en total: 70 en la primera parte (40 de legislación + 30 de ofimática) y 20 en la segunda parte (supuesto práctico). La segunda parte tiene además 5 preguntas de reserva que no son puntuables. Tiempo total: 100 minutos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿En qué se diferencia el examen C1 del C2 (Auxiliar)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El C1 (Administrativo) tiene 70+20 preguntas en 100 minutos, con un supuesto práctico en la segunda parte. El C2 (Auxiliar) tiene 60+50 preguntas en 90 minutos, sin caso práctico. La penalización -1/3 es igual en ambos. El temario del C1 es más extenso (45 temas vs 28) e incluye derecho administrativo y gestión presupuestaria.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué es el supuesto práctico del C1?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es la segunda parte del examen donde eliges 1 de 2 casos prácticos sobre gestión de personal, contratación o presupuestos (bloques II y V). Consta de 20 preguntas puntuables tipo test con 4 opciones. El valor por pregunta es 2,50 puntos (50/20), mucho mayor que en la primera parte (0,71 pts/pregunta).',
        },
      },
    ],
  },
]

export default function CalculadoraNotaC1Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculadoraNotaC1 />
    </>
  )
}
