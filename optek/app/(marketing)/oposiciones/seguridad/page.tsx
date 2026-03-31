import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  Shield, BookOpen, ArrowRight, Users, Clock,
  GraduationCap, Siren, Brain,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Oposiciones Seguridad 2026 — Ertzaintza, Guardia Civil y Policía Nacional | OpoRuta',
  description:
    'Prepara las oposiciones de seguridad 2026 con IA: Ertzaintza (54 temas, C1), Guardia Civil (25 temas, C2) y Policía Nacional (45 temas, C1). Tests verificados contra BOE/BOPV. Módulo exclusivo de Personalidad Policial con IA.',
  keywords: [
    'oposiciones policia 2026', 'oposiciones guardia civil 2026', 'oposiciones ertzaintza 2026',
    'oposiciones policia nacional 2026', 'test policia online', 'test guardia civil online',
    'personalidad policial', 'psicotecnicos policia',
  ],
  openGraph: {
    title: 'Oposiciones Seguridad 2026 — Ertzaintza, Guardia Civil y Policía Nacional | OpoRuta',
    description: 'Tests con IA para Ertzaintza, Guardia Civil y Policía Nacional. Módulo exclusivo de Personalidad Policial.',
    url: `${APP_URL}/oposiciones/seguridad`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Seguridad 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/seguridad` },
}

const CUERPOS = [
  {
    nombre: 'Ertzaintza',
    nivel: 'C1',
    slug: 'ertzaintza',
    temas: 54,
    plazas: '~800',
    ejercicios: 1,
    requisito: 'Bachillerato + C1 euskera',
    desc: 'Policía autonómica del País Vasco. Competencias en seguridad ciudadana, tráfico, policía judicial y protección de personas.',
    color: 'sky',
    icon: Shield,
  },
  {
    nombre: 'Guardia Civil',
    nivel: 'C2',
    slug: 'guardia-civil',
    temas: 25,
    plazas: '~2.800',
    ejercicios: 1,
    requisito: 'ESO + 18 años + estatura mín.',
    desc: 'Instituto armado de naturaleza militar. Competencias en orden público, tráfico, medio ambiente, costas y fronteras.',
    color: 'green',
    icon: Siren,
  },
  {
    nombre: 'Policía Nacional',
    nivel: 'C1',
    slug: 'policia-nacional',
    temas: 45,
    plazas: '~3.000',
    ejercicios: 1,
    requisito: 'Bachillerato + 18 años + estatura mín.',
    desc: 'Cuerpo policial de ámbito nacional. Competencias en documentación, extranjería, orden público y policía judicial.',
    color: 'blue',
    icon: GraduationCap,
  },
]

export default function SeguridadHub() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Qué oposiciones de seguridad cubre OpoRuta?', acceptedAnswer: { '@type': 'Answer', text: 'OpoRuta cubre tres oposiciones de seguridad: Ertzaintza (policía autonómica vasca, 54 temas, C1), Guardia Civil (25 temas, C2) y Policía Nacional (45 temas, C1). Incluye un módulo exclusivo de Personalidad Policial con IA.' } },
          { '@type': 'Question', name: '¿Qué es el módulo de Personalidad Policial?', acceptedAnswer: { '@type': 'Answer', text: 'Es un módulo exclusivo de OpoRuta que prepara la prueba psicotécnica de personalidad policial. Incluye perfil Big Five, test de juicio situacional (SJT), entrevista simulada con IA y análisis de consistencia. Nadie más lo ofrece en España.' } },
          { '@type': 'Question', name: '¿Cuántas plazas hay de policía en 2026?', acceptedAnswer: { '@type': 'Answer', text: 'Aproximadamente 6.600 plazas entre las tres oposiciones: ~800 Ertzaintza, ~2.800 Guardia Civil y ~3.000 Policía Nacional. Las convocatorias exactas dependen de cada organismo.' } },
        ],
      }} />

      {/* Hero */}
      <section className="text-center space-y-6">
        <Badge variant="secondary" className="text-sm px-4 py-1">
          <Shield className="w-4 h-4 mr-1.5 inline" />
          ~6.600 plazas · 3 cuerpos · Personalidad Policial con IA
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-sky-600">Fuerzas y Cuerpos de Seguridad</span> 2026
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ertzaintza, Guardia Civil y Policía Nacional.
          Tests con IA verificados contra legislación BOE/BOPV. Módulo exclusivo de Personalidad Policial.
        </p>
        <Badge variant="outline" className="text-xs">3 cuerpos · Psicotécnicos específicos · Personalidad Policial IA</Badge>
      </section>

      {/* 3 cuerpos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Elige tu cuerpo</h2>
        <div className="grid gap-6">
          {CUERPOS.map(c => {
            const Icon = c.icon
            return (
              <Link key={c.slug} href={`/oposiciones/seguridad/${c.slug}`}>
                <Card className="hover:border-sky-400 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 text-sky-600 shrink-0" />
                        <div>
                          <h3 className="text-lg font-bold">{c.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{c.desc}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{c.nivel}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.temas} temas</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.plazas} plazas</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.ejercicios} ejercicio(s)</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {c.requisito}</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-sm text-sky-600 font-medium flex items-center gap-1">
                        Ver detalles <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Personalidad Policial highlight */}
      <section className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Exclusivo: Módulo de Personalidad Policial con IA
        </h2>
        <p className="text-sm text-muted-foreground">
          Primera plataforma en España con preparación IA de personalidad policial.
          Perfil Big Five, test de juicio situacional (SJT), entrevista simulada y análisis de consistencia.
          Transversal para Ertzaintza, Guardia Civil y Policía Nacional.
        </p>
        <Link href="/oposiciones/seguridad/personalidad-policial" className="text-sm text-purple-700 font-medium hover:underline">
          Descubre el módulo de Personalidad Policial →
        </Link>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Qué oposiciones de seguridad cubre OpoRuta?', a: 'Tres cuerpos: Ertzaintza (C1, Bachillerato + C1 euskera, 54 temas), Guardia Civil (C2, ESO, 25 temas) y Policía Nacional (C1, Bachillerato, 45 temas). Cada una con su scoring, legislación y psicotécnicos específicos.' },
            { q: '¿Qué es el módulo de Personalidad Policial?', a: 'Un módulo exclusivo de OpoRuta que te prepara para la prueba psicotécnica de personalidad que exigen las tres oposiciones. Incluye perfil Big Five, tests de juicio situacional (SJT), entrevista simulada con IA y análisis de consistencia entre respuestas.' },
            { q: '¿Policía Nacional tiene 3 opciones?', a: 'Sí, es la única oposición de la plataforma con 3 opciones por pregunta (A, B, C) en lugar de 4. La penalización es -1/2 del valor de un acierto (más severa que la habitual -1/3). OpoRuta replica este scoring exacto.' },
            { q: '¿Puedo preparar GC y PN a la vez?', a: 'Sí. Guardia Civil y Policía Nacional comparten legislación significativa (~60%): Constitución, LO 2/1986 FCSE, Seguridad Ciudadana, Código Penal. Con el Pack Doble GC+PN accedes a ambas por 129,99€.' },
            { q: '¿Cuánto cuesta?', a: 'Pack individual: 79,99€ (pago único). Pack Doble GC+PN: 129,99€. Pack Personalidad Policial: 49,99€ (transversal, sirve para las 3 oposiciones). Pack Completo (1 oposición + personalidad): 119,99€.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4 bg-sky-50 dark:bg-sky-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Seguridad hoy</h2>
        <p className="text-muted-foreground">Tests verificados, psicotécnicos específicos y Personalidad Policial con IA. Gratis para empezar.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
