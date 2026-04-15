import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, ArrowRight, Users, Clock,
  GraduationCap, FileText, Sparkles, Building2,
  Target, Brain, BarChart3, Shield, Zap,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Administración del Estado 2026: 4.200+ plazas (C2, C1, A2) | OpoRuta',
  description:
    'Prepara AGE 2026: Auxiliar C2 (1.700 plazas, 28 temas), Administrativo C1 (2.512 plazas, 45 temas) y GACE A2 (1.356 plazas). Tests con IA verificados contra BOE. Simulacros INAP reales. Empieza gratis.',
  keywords: [
    'oposiciones administracion estado 2026', 'auxiliar administrativo estado',
    'administrativo estado c1', 'gace a2', 'gestion administracion estado',
    'test oposiciones administracion', 'temario auxiliar administrativo 2026',
    'examen auxiliar administrativo estado', 'inap oposiciones',
  ],
  openGraph: {
    title: 'Oposiciones Administración del Estado 2026: 4.200+ plazas | OpoRuta',
    description: 'Tests con IA para Auxiliar C2 (1.700 plazas), Administrativo C1 (2.512) y GACE A2 (1.356). Temario actualizado, simulacros INAP reales.',
    url: `${APP_URL}/oposiciones/administracion`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Administración del Estado 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/administracion` },
}

const CUERPOS = [
  {
    nombre: 'Auxiliar Administrativo',
    nivel: 'C2',
    slug: 'aux-admin-estado',
    temas: 28,
    plazas: '1.700',
    ejercicios: 1,
    sueldo: '',
    requisito: 'ESO o equivalente',
    desc: 'Tareas de mecanización, registro, archivo, atención al público y apoyo administrativo en ministerios y organismos públicos.',
    color: 'blue',
    icon: BookOpen,
    featured: false,
  },
  {
    nombre: 'Administrativo del Estado',
    nivel: 'C1',
    slug: 'administrativo-estado',
    temas: 45,
    plazas: '750',
    ejercicios: 2,
    sueldo: '',
    requisito: 'Bachillerato o equivalente',
    desc: 'Gestión administrativa, tramitación de expedientes, contabilidad pública y gestión de personal en la AGE.',
    color: 'indigo',
    icon: FileText,
    featured: false,
  },
  {
    nombre: 'Gestión del Estado — GACE',
    nivel: 'A2',
    slug: 'gestion-estado',
    temas: 58,
    plazas: '200+',
    ejercicios: '2 + supuesto práctico',
    sueldo: '',
    requisito: 'Grado universitario',
    desc: 'Gestión y dirección de procedimientos administrativos, elaboración de informes técnicos y resolución de supuestos prácticos complejos.',
    color: 'emerald',
    icon: Sparkles,
    featured: true,
  },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Tests verificados contra BOE',
    desc: 'Cada pregunta se contrasta con la Constitución, LPAC, TREBEP y LGP. Si cambia la ley, se actualiza automáticamente.',
  },
  {
    icon: Target,
    title: 'Simulacros tipo INAP',
    desc: 'Practica con exámenes reales de convocatorias anteriores (2018–2024). Penalización oficial y tiempo real.',
  },
  {
    icon: Brain,
    title: 'Psicotécnicos adaptativos',
    desc: 'Series numéricas, verbales y abstractas que se ajustan a tu nivel. Incluidos en el ejercicio de Auxiliar C2.',
  },
  {
    icon: BarChart3,
    title: 'Radar del Tribunal',
    desc: 'Detecta los artículos más preguntados en exámenes INAP y prioriza tu estudio por frecuencia real.',
  },
  {
    icon: Zap,
    title: 'Tutor IA con análisis detallados',
    desc: 'Explicaciones paso a paso de cada error. El tutor identifica tus debilidades y sugiere qué repasar.',
  },
]

const FAQS = [
  {
    q: '¿Cuál es la diferencia entre C2, C1 y A2?',
    a: 'C2 (Auxiliar) requiere la ESO y tiene 1 ejercicio tipo test. C1 (Administrativo) requiere Bachillerato y tiene 2 ejercicios. A2 (GACE) requiere Grado universitario e incluye un supuesto práctico de desarrollo. A mayor grupo, mayor responsabilidad.',
  },
  {
    q: '¿Qué requisitos necesito para presentarme?',
    a: 'Nacionalidad española o UE, 16+ años, no inhabilitación. C2: ESO. C1: Bachillerato o técnico. A2: Grado universitario o equivalente. No se exige experiencia previa.',
  },
  {
    q: '¿Qué incluye OpoRuta para Administración?',
    a: 'Tests ilimitados verificados contra legislación vigente, simulacros con exámenes INAP reales (2018–2024), psicotécnicos adaptativos, Radar del Tribunal, flashcards con repetición espaciada, Reto Diario y análisis detallados con IA de cada error.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Puedes empezar gratis con acceso limitado a temas y simulacros. El Pack completo de una oposición cuesta 49,99€ (pago único, sin suscripción). El Pack Doble (dos cuerpos) cuesta 79,99€.',
  },
  {
    q: '¿El temario está actualizado a 2026?',
    a: 'Sí. OpoRuta actualiza las preguntas automáticamente cuando cambia la legislación (Constitución, LPAC 39/2015, TREBEP, LGP 47/2003, LRJSP). Además, el Radar del Tribunal detecta cambios normativos vía BOE.',
  },
]

export default function AdministracionHub() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'OpoRuta',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: 'https://oporuta.es',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Gratis — 1 test por tema + 3 simulacros' },
          { '@type': 'Offer', price: '49.99', priceCurrency: 'EUR', description: 'Pack completo — tests ilimitados, análisis IA, Radar del Tribunal' },
        ],
      }} />

      {/* Hero */}
      <section className="text-center space-y-6">
        <Badge variant="secondary" className="text-sm px-4 py-1">
          <Building2 className="w-4 h-4 mr-1.5 inline" />
          INAP · 4.200+ plazas · 3 cuerpos
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-blue-600">Administración General del Estado</span> 2026
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualizado: abril 2026
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Auxiliar Administrativo (C2), Administrativo del Estado (C1) y Gestión GACE (A2).
          Tests con IA verificados contra la legislación vigente del BOE: Constitución, LPAC, TREBEP y LGP.
        </p>
      </section>

      {/* 3 cuerpos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Elige tu cuerpo</h2>
        <div className="grid gap-6">
          {CUERPOS.map(c => {
            const Icon = c.icon
            return (
              <Link key={c.slug} href={`/register?oposicion=${c.slug}`}>
                <Card className={`hover:border-blue-400 hover:shadow-md transition-all cursor-pointer ${c.featured ? 'border-emerald-400 shadow-md ring-1 ring-emerald-200' : ''}`}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-8 w-8 shrink-0 ${c.featured ? 'text-emerald-600' : 'text-blue-600'}`} />
                        <div>
                          <h3 className="text-lg font-bold">
                            {c.nombre}
                            {c.featured && (
                              <Badge variant="outline" className="ml-2 text-xs text-emerald-700 border-emerald-300">
                                Supuesto práctico con IA
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{c.desc}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{c.nivel}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.temas} temas</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.plazas} plazas</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.ejercicios} ejercicios</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {c.requisito}</span>
                      {c.sueldo && <span className="font-medium text-green-700">{c.sueldo}</span>}
                    </div>
                    <div className="flex justify-end">
                      <span className={`text-sm font-medium flex items-center gap-1 ${c.featured ? 'text-emerald-600' : 'text-blue-600'}`}>
                        Empezar gratis <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">¿Cómo te ayuda OpoRuta?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <Card key={f.title}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600 shrink-0" />
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza tu preparación</h2>
        <p className="text-muted-foreground">
          Más de 4.200 plazas convocadas. Regístrate gratis y empieza a entrenar hoy.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
