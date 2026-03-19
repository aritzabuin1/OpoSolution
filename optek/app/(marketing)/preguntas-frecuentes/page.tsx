import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FaqAccordion } from '@/components/shared/FaqAccordion'
import { faqSections, getAllFaqs } from '@/content/faq/preguntas-frecuentes'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes — Oposiciones Auxiliar y Administrativo del Estado 2026',
  description:
    'Respuestas actualizadas sobre plazas, temario, examen, nota de corte y preparación de las oposiciones de Auxiliar (C2) y Administrativo (C1) del Estado 2026.',
  keywords: [
    'preguntas frecuentes oposiciones',
    'auxiliar administrativo estado 2026',
    'administrativo estado C1',
    'temario auxiliar administrativo',
    'plazas auxiliar administrativo 2026',
    'examen auxiliar administrativo',
    'OpoRuta FAQ',
  ],
  openGraph: {
    title: 'FAQ Oposiciones Auxiliar y Administrativo del Estado 2026',
    description: 'Respuestas actualizadas sobre plazas, temario, examen y preparación.',
    type: 'website',
    url: `${APP_URL}/preguntas-frecuentes`,
  },
  alternates: {
    canonical: `${APP_URL}/preguntas-frecuentes`,
  },
}

export default function PreguntasFrecuentesPage() {
  const allFaqs = getAllFaqs()

  // FAQPage JSON-LD
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Preguntas Frecuentes',
          item: `${APP_URL}/preguntas-frecuentes`,
        },
      ],
    },
  ]

  // Days to exam
  const examDate = new Date('2026-05-23')
  const diasParaExamen = Math.max(
    0,
    Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            OpoRuta
          </Link>
          <span>/</span>
          <span className="text-foreground">Preguntas Frecuentes</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight leading-tight sm:text-4xl">
            Preguntas Frecuentes: Oposiciones AGE 2026
          </h1>
          <p className="mt-4 text-muted-foreground">
            Respuestas actualizadas a marzo de 2026 sobre las oposiciones de Auxiliar
            Administrativo (C2) y Administrativo del Estado (C1). Datos basados en el análisis
            de exámenes INAP y legislación oficial del BOE.
          </p>

          {/* Quick nav */}
          <div className="mt-6 flex flex-wrap gap-2">
            {faqSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs border rounded-full px-3 py-1 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                {s.title}
              </a>
            ))}
          </div>
        </header>

        {/* FAQ Accordion */}
        <FaqAccordion sections={faqSections} />

        {/* Bottom CTA */}
        <div className="mt-14 rounded-xl bg-gradient-to-br from-[#0f2b46] via-[#1a4a7a] to-[#2563eb] p-6 sm:p-8 text-center text-white">
          {diasParaExamen > 0 && (
            <p className="text-xl sm:text-2xl font-bold mb-1">
              Quedan {diasParaExamen} días para el examen
            </p>
          )}
          <p className="text-base opacity-90">
            4.200+ plazas · Prueba OpoRuta gratis · 5 tests sin tarjeta
          </p>
          <div className="mt-5">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-[#0f2b46] font-bold shadow-lg shadow-amber-500/20 gap-2"
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Related blog link */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Más recursos en nuestro blog →
          </Link>
        </div>
      </div>
    </>
  )
}
