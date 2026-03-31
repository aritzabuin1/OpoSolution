import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  Brain, ArrowRight, ArrowLeft, Users, Shield,
  CheckCircle2, MessageSquare, BarChart3, Fingerprint,
  Sparkles, Lock, Clock,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Personalidad Policial con IA — Preparación Psicotécnica Exclusiva | OpoRuta',
  description:
    'Primera plataforma en España con preparación IA de personalidad policial. Perfil Big Five, test de juicio situacional (SJT), entrevista simulada con IA y análisis de consistencia. Para Ertzaintza, Guardia Civil y Policía Nacional.',
  keywords: [
    'personalidad policial', 'psicotecnicos policia', 'test personalidad policia',
    'big five policia', 'entrevista policial', 'sjt policia',
    'prueba psicotecnica policia', 'test psicotecnico oposiciones seguridad',
  ],
  openGraph: {
    title: 'Personalidad Policial con IA — Preparación Psicotécnica Exclusiva | OpoRuta',
    description: 'Big Five, SJT, entrevista simulada con IA y análisis de consistencia. Para Ertzaintza, GC y PN.',
    url: `${APP_URL}/oposiciones/seguridad/personalidad-policial`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Personalidad Policial con IA')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/seguridad/personalidad-policial` },
}

const MODULOS = [
  {
    titulo: 'Perfil Big Five',
    desc: 'Evaluación completa de los 5 factores de personalidad (Apertura, Responsabilidad, Extraversión, Amabilidad, Neuroticismo) calibrada al perfil policial ideal. Descubre tus fortalezas y áreas de mejora antes del examen real.',
    icon: Fingerprint,
    color: 'purple',
  },
  {
    titulo: 'Test de Juicio Situacional (SJT)',
    desc: 'Escenarios realistas de actuación policial con múltiples respuestas posibles. Mide tu capacidad de toma de decisiones bajo presión, proporcionalidad y adecuación a protocolos policiales.',
    icon: Shield,
    color: 'purple',
  },
  {
    titulo: 'Entrevista Simulada con IA',
    desc: 'Simulación de la entrevista personal/psicológica con un evaluador IA. Preguntas adaptativas basadas en tus respuestas anteriores. Feedback detallado sobre coherencia, lenguaje y perfil proyectado.',
    icon: MessageSquare,
    color: 'purple',
  },
  {
    titulo: 'Análisis de Consistencia',
    desc: 'Cruce automático entre tus respuestas en Big Five, SJT y entrevista. Detecta inconsistencias que los evaluadores reales buscan. Te ayuda a construir un perfil coherente y creíble.',
    icon: BarChart3,
    color: 'purple',
  },
]

export default function PersonalidadPolicialPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            name: 'Personalidad Policial con IA — OpoRuta',
            description: 'Módulo exclusivo de preparación de personalidad policial con IA. Big Five, SJT, entrevista simulada y análisis de consistencia.',
            provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
            },
            offers: { '@type': 'Offer', price: '49.99', priceCurrency: 'EUR', availability: 'https://schema.org/PreOrder' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: '¿Qué es el módulo de Personalidad Policial de OpoRuta?', acceptedAnswer: { '@type': 'Answer', text: 'Es el primer módulo en España que utiliza IA para preparar la prueba psicotécnica de personalidad policial. Incluye 4 componentes: perfil Big Five calibrado al perfil policial, test de juicio situacional (SJT), entrevista simulada con IA y análisis de consistencia entre respuestas.' } },
              { '@type': 'Question', name: '¿Para qué oposiciones sirve?', acceptedAnswer: { '@type': 'Answer', text: 'Es transversal para las 3 oposiciones de seguridad de OpoRuta: Ertzaintza, Guardia Civil y Policía Nacional. Todas incluyen pruebas psicotécnicas de personalidad en su proceso selectivo.' } },
              { '@type': 'Question', name: '¿Cuánto cuesta el módulo de Personalidad Policial?', acceptedAnswer: { '@type': 'Answer', text: 'El Pack Personalidad Policial cuesta 49,99€ (pago único). También está incluido en el Pack Completo por 119,99€ (1 oposición + personalidad policial).' } },
            ],
          },
        ],
      }} />

      {/* Hero */}
      <section className="space-y-6">
        <Link href="/oposiciones/seguridad" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a Seguridad
        </Link>
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              <Brain className="w-4 h-4 mr-1.5 inline" />
              Exclusivo OpoRuta
            </Badge>
            <Badge className="text-sm px-4 py-1 bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
              <Clock className="w-4 h-4 mr-1.5 inline" />
              Próximamente
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-purple-600">Personalidad Policial</span> con IA
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Primera plataforma en España con preparación IA de personalidad policial.
            Big Five, test de juicio situacional, entrevista simulada y análisis de consistencia.
          </p>
          <p className="text-sm text-purple-600 font-medium">
            Transversal para Ertzaintza, Guardia Civil y Policía Nacional
          </p>
        </div>
      </section>

      {/* Why this matters */}
      <section className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Por qué nadie más lo ofrece
        </h2>
        <p className="text-sm text-muted-foreground">
          Las oposiciones de seguridad incluyen pruebas psicotécnicas de personalidad que eliminan hasta un 15-20% de
          los candidatos que aprobaron el teórico. Sin embargo, <strong>ninguna academia en España prepara esta prueba
          de forma sistemática</strong>. Se limitan a decir &ldquo;sé sincero&rdquo;. OpoRuta usa IA para que entiendas
          qué mide cada test, cuál es el perfil policial esperado y cómo proyectar coherencia entre tus respuestas.
        </p>
      </section>

      {/* 4 módulos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">4 componentes del módulo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {MODULOS.map(({ titulo, desc, icon: Icon }) => (
            <Card key={titulo} className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6 space-y-2">
                <Icon className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-sm">{titulo}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Cómo funciona</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Completa tu perfil Big Five', desc: 'Responde al cuestionario de personalidad. La IA calcula tu perfil en los 5 factores y lo compara con el perfil policial de referencia.' },
            { step: '2', title: 'Resuelve escenarios SJT', desc: 'Enfréntate a situaciones policiales realistas. Elige la respuesta más adecuada. La IA evalúa tu criterio profesional.' },
            { step: '3', title: 'Entrevista simulada con IA', desc: 'Mantén una conversación con el evaluador IA. Preguntas adaptativas basadas en tu perfil Big Five y respuestas SJT.' },
            { step: '4', title: 'Recibe tu análisis de consistencia', desc: 'La IA cruza todas tus respuestas y detecta inconsistencias. Recibes un informe detallado con recomendaciones.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 items-start">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-sm shrink-0">{step}</span>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compatible con */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Compatible con las 3 oposiciones</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { nombre: 'Ertzaintza', slug: 'ertzaintza', nivel: 'C1', icon: Shield },
            { nombre: 'Guardia Civil', slug: 'guardia-civil', nivel: 'C2', icon: Users },
            { nombre: 'Policía Nacional', slug: 'policia-nacional', nivel: 'C1', icon: Lock },
          ].map(({ nombre, slug, nivel, icon: Icon }) => (
            <Link key={slug} href={`/oposiciones/seguridad/${slug}`}>
              <Card className="hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="pt-5 pb-5 text-center space-y-2">
                  <Icon className="w-6 h-6 text-purple-600 mx-auto" />
                  <p className="font-bold text-sm">{nombre}</p>
                  <Badge variant="secondary" className="text-xs">{nivel}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Precios</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-purple-300 dark:border-purple-700">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-bold">Pack Personalidad Policial</h3>
              <p className="text-3xl font-bold text-purple-600">49,99€</p>
              <p className="text-xs text-muted-foreground">Pago único · Sin suscripción</p>
              <ul className="space-y-1.5 text-sm">
                {['Perfil Big Five completo', 'Tests SJT ilimitados', 'Entrevista simulada con IA', 'Análisis de consistencia', 'Transversal (3 oposiciones)'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-purple-300 dark:border-purple-700">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-bold">Pack Completo</h3>
              <p className="text-3xl font-bold text-purple-600">119,99€</p>
              <p className="text-xs text-muted-foreground">1 oposición + Personalidad Policial</p>
              <ul className="space-y-1.5 text-sm">
                {['Todo el Pack Personalidad', 'Tests de conocimiento (1 opo)', 'Psicotécnicos específicos', 'Scoring oficial exacto', 'Ahorro vs compra separada'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Qué es el módulo de Personalidad Policial?', a: 'Es el primer módulo en España que usa IA para preparar la prueba psicotécnica de personalidad policial. Incluye 4 componentes: perfil Big Five, test de juicio situacional (SJT), entrevista simulada con IA y análisis de consistencia entre tus respuestas.' },
            { q: '¿Para qué oposiciones sirve?', a: 'Es transversal para las 3 oposiciones de seguridad: Ertzaintza, Guardia Civil y Policía Nacional. Con una sola compra accedes al módulo completo, válido para cualquiera de las tres.' },
            { q: '¿Qué es el Big Five?', a: 'Es el modelo de personalidad más validado en psicología. Mide 5 factores: Apertura a la experiencia, Responsabilidad, Extraversión, Amabilidad y Neuroticismo (estabilidad emocional). Cada oposición de seguridad busca un perfil específico en estos factores.' },
            { q: '¿Qué es un test SJT?', a: 'SJT (Situational Judgment Test) es un test de juicio situacional. Te presenta escenarios realistas de actuación policial y debes elegir la respuesta más adecuada. Mide tu criterio profesional, proporcionalidad y adecuación a protocolos.' },
            { q: '¿La IA sustituye al psicólogo?', a: 'No. La IA te ayuda a prepararte y entender qué se evalúa. Te permite practicar antes del examen real, detectar inconsistencias en tu perfil y mejorar tu coherencia. El examen real siempre lo evalúa un profesional humano.' },
            { q: '¿Cuándo estará disponible?', a: 'El módulo de Personalidad Policial está en fase de desarrollo. Regístrate para acceder en cuanto esté disponible. Los primeros usuarios registrados tendrán acceso prioritario.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA - Early access */}
      <section className="text-center py-8 space-y-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl">
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
          <Clock className="w-3.5 h-3.5 mr-1 inline" />
          Próximamente
        </Badge>
        <h2 className="text-2xl font-bold">Regístrate para acceso anticipado</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Sé de los primeros en probar el módulo de Personalidad Policial con IA.
          Crea tu cuenta gratis y te avisamos en cuanto esté disponible.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
            Registrarme para acceso anticipado <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
