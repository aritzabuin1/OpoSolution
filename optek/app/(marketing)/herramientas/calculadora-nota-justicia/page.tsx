import type { Metadata } from 'next'
import { CalculadoraNotaJusticia } from './CalculadoraNotaJusticia'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const PAGE_URL = `${APP_URL}/herramientas/calculadora-nota-justicia`

/** ISR: regenerar cada 7 días — servido desde CDN entre regeneraciones */
export const revalidate = 604800

export const metadata: Metadata = {
  title: 'Calculadora Nota Justicia 2026 — Auxilio, Tramitación y Gestión Procesal',
  description:
    'Calcula tu nota de las oposiciones de Justicia 2026 con la penalización -1/4 oficial. Auxilio Judicial (C2), Tramitación Procesal (C1) y Gestión Procesal (A2). Gratis.',
  keywords: [
    'calculadora nota justicia 2026',
    'calcular nota oposiciones justicia',
    'calculadora penalización 1/4 justicia',
    'nota examen auxilio judicial',
    'nota examen tramitación procesal',
    'nota examen gestión procesal',
    'calculadora nota auxilio judicial',
    'calculadora nota tramitación procesal',
    'calculadora nota gestión procesal',
  ],
  openGraph: {
    title: 'Calculadora Nota Justicia 2026 — Auxilio, Tramitación y Gestión Procesal',
    description: 'Calcula tu nota con la penalización -1/4 oficial de Justicia. Auxilio, Tramitación y Gestión Procesal.',
    type: 'website',
    url: PAGE_URL,
    images: [{
      url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Calculadora Nota Justicia 2026')}`,
      width: 1200,
      height: 630,
      alt: 'Calculadora de nota oposiciones de Justicia — OpoRuta',
    }],
  },
  alternates: { canonical: PAGE_URL },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora Nota Justicia 2026 — Auxilio, Tramitación y Gestión',
    description: 'Calcula tu nota con la penalización -1/4 oficial de Justicia. Gratis.',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora Nota Justicia 2026',
    description: 'Herramienta gratuita para calcular la nota de las oposiciones de Justicia con la penalización -1/4 oficial. Soporta Auxilio Judicial, Tramitación Procesal y Gestión Procesal.',
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
      { '@type': 'ListItem', position: 3, name: 'Calculadora Nota Justicia', item: PAGE_URL },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo se calcula la nota en las oposiciones de Justicia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En Justicia la penalización es de 1/4 del valor del acierto (no 1/3 como en AGE). La fórmula es: Puntuación = Aciertos × valor − Errores × (valor / 4). Las respuestas en blanco no puntúan. Cada ejercicio es eliminatorio con un mínimo para aprobar.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuántos ejercicios tiene cada oposición de Justicia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Auxilio Judicial tiene 2 ejercicios (test teórico 60 pts + supuesto práctico 40 pts). Tramitación Procesal tiene 3 (test 60 pts + práctico 20 pts + ofimática 20 pts). Gestión Procesal tiene 3 (test 60 pts + caso práctico 15 pts + desarrollo escrito 25 pts).',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuántas plazas hay de Justicia en 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La OEP 2024 ofertó aproximadamente 425 plazas de Auxilio Judicial (C2), 1.155 plazas de Tramitación Procesal (C1) y 725 plazas de Gestión Procesal (A2). Las cifras pueden variar al acumular plazas de varias OEP.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuándo conviene dejar una pregunta en blanco en Justicia?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Con penalización 1/4, si puedes descartar al menos 1 de las 4 opciones, estadísticamente te compensa arriesgar. Si no puedes descartar ninguna, déjala en blanco. La penalización -1/4 está diseñada para que responder al azar entre 4 opciones tenga esperanza matemática negativa.',
        },
      },
    ],
  },
]

export default function CalculadoraNotaJusticiaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculadoraNotaJusticia />
    </>
  )
}
