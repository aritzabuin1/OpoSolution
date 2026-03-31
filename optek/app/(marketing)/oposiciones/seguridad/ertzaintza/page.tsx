import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  Shield, BookOpen, ArrowRight, ArrowLeft, Users, Clock,
  GraduationCap, CheckCircle2, Brain, FileText, Target,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Ertzaintza 2026 — 54 temas, C1, Tests con IA | OpoRuta',
  description:
    'Prepara las oposiciones de Ertzaintza 2026: 54 temas en 11 bloques, ~40 preguntas tipo test, nivel C1. Tests verificados contra BOPV. Incluye psicotécnicos y Personalidad Policial con IA.',
  keywords: [
    'oposiciones ertzaintza 2026', 'test ertzaintza online', 'temario ertzaintza',
    'policia autonomica pais vasco', 'oposiciones ertzaintza temario',
    'psicotecnicos ertzaintza', 'ertzaintza requisitos',
  ],
  openGraph: {
    title: 'Oposiciones Ertzaintza 2026 — 54 temas, C1, Tests con IA | OpoRuta',
    description: 'Tests con IA para Ertzaintza. 54 temas, 11 bloques, scoring verificado BOPV.',
    url: `${APP_URL}/oposiciones/seguridad/ertzaintza`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Ertzaintza 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/seguridad/ertzaintza` },
}

const BLOQUES = [
  { num: 'I', titulo: 'Derecho Constitucional y Administrativo', temas: '1-8', count: 8 },
  { num: 'II', titulo: 'Unión Europea', temas: '9-11', count: 3 },
  { num: 'III', titulo: 'Estatuto de Gernika e Instituciones del País Vasco', temas: '12-17', count: 6 },
  { num: 'IV', titulo: 'Policía del País Vasco', temas: '18-22', count: 5 },
  { num: 'V', titulo: 'Seguridad Ciudadana y Seguridad Privada', temas: '23-27', count: 5 },
  { num: 'VI', titulo: 'Tráfico y Seguridad Vial', temas: '28-31', count: 4 },
  { num: 'VII', titulo: 'Derecho Penal', temas: '32-38', count: 7 },
  { num: 'VIII', titulo: 'Derecho Procesal Penal', temas: '39-43', count: 5 },
  { num: 'IX', titulo: 'Derechos Humanos e Igualdad', temas: '44-47', count: 4 },
  { num: 'X', titulo: 'Sociedad y Diversidad', temas: '48-51', count: 4 },
  { num: 'XI', titulo: 'Conocimiento del País Vasco', temas: '52-54', count: 3 },
]

export default function ErtzaintzaPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            name: 'Preparación Oposiciones Ertzaintza 2026',
            description: 'Tests con IA para oposiciones de Ertzaintza. 54 temas en 11 bloques, verificados contra BOPV.',
            provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
            educationalLevel: 'C1 - Bachillerato',
            numberOfCredits: '54',
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
              courseWorkload: 'PT200H',
            },
            offers: { '@type': 'Offer', price: '79.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: '¿Cuántos temas tiene la oposición de Ertzaintza?', acceptedAnswer: { '@type': 'Answer', text: '54 temas organizados en 11 bloques temáticos, desde Derecho Constitucional hasta Conocimiento del País Vasco. La convocatoria está regulada por BOPV 226 de 24/11/2025.' } },
              { '@type': 'Question', name: '¿Qué nivel de euskera se necesita para Ertzaintza?', acceptedAnswer: { '@type': 'Answer', text: 'Se requiere nivel B2/PL2 de euskera para aproximadamente el 80% de las plazas. No todas las plazas exigen el mismo perfil lingüístico.' } },
              { '@type': 'Question', name: '¿Cuántas preguntas tiene el examen de Ertzaintza?', acceptedAnswer: { '@type': 'Answer', text: 'Aproximadamente 40 preguntas tipo test con 4 opciones de respuesta. Cada acierto suma +3,75 puntos y cada error resta -1,25 puntos (penalización -1/3). La escala es 0-150 con un mínimo de 75 puntos para aprobar.' } },
              { '@type': 'Question', name: '¿Cuánto cobra un ertzaina?', acceptedAnswer: { '@type': 'Answer', text: 'El sueldo base de un agente de la Ertzaintza es de aproximadamente 32.000€/año, que puede aumentar con complementos por antigüedad, nocturnidad y destino.' } },
            ],
          },
        ],
      }} />

      {/* Hero */}
      <section className="space-y-6">
        <Link href="/oposiciones/seguridad" className="text-sm text-sky-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a Seguridad
        </Link>
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <Shield className="w-4 h-4 mr-1.5 inline" />
            C1 · 54 temas · ~800 plazas · BOPV 226
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Oposiciones <span className="text-sky-600">Ertzaintza</span> 2026
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Policía autonómica del País Vasco. 54 temas en 11 bloques, ~40 preguntas tipo test.
            Tests con IA verificados contra legislación BOPV.
          </p>
        </div>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Temas', value: '54 (11 bloques)', icon: BookOpen },
            { label: 'Preguntas', value: '~40 (variable)', icon: FileText },
            { label: 'Opciones', value: '4 por pregunta', icon: Target },
            { label: 'Tiempo', value: 'Según convocatoria', icon: Clock },
            { label: 'Acierto', value: '+3,75 pts', icon: CheckCircle2 },
            { label: 'Error', value: '-1,25 pts (pen. -1/3)', icon: Shield },
            { label: 'Escala', value: '0-150 (mín. 75)', icon: GraduationCap },
            { label: 'Convocatoria', value: 'BOPV 226 (24/11/2025)', icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Temario por bloques */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario: 11 bloques</h2>
        <div className="grid gap-3">
          {BLOQUES.map(b => (
            <Card key={b.num}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sky-600 font-bold text-sm w-8">{b.num}</span>
                  <div>
                    <p className="font-medium text-sm">{b.titulo}</p>
                    <p className="text-xs text-muted-foreground">Temas {b.temas}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{b.count} temas</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Lo que incluye OpoRuta para Ertzaintza</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Tests por tema y bloque', desc: 'Practica cada uno de los 54 temas o por bloque temático. Preguntas generadas con IA y verificadas contra legislación BOPV.', icon: BookOpen },
            { title: 'Scoring exacto BOPV', desc: 'Escala 0-150, acierto +3,75, error -1,25 (pen. -1/3). Réplica exacta del sistema de puntuación oficial.', icon: Target },
            { title: 'Psicotécnicos específicos', desc: 'Tests de aptitudes adaptados al perfil Ertzaintza: razonamiento verbal, numérico, abstracto y espacial.', icon: Brain },
            { title: 'Personalidad Policial con IA', desc: 'Módulo exclusivo: Big Five, SJT, entrevista simulada y análisis de consistencia. Transversal para las 3 oposiciones de seguridad.', icon: Users },
          ].map(({ title, desc, icon: Icon }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="w-6 h-6 text-sky-600" />
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Requisitos */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Requisitos</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm">
              {[
                'Bachillerato o titulación equivalente (nivel C1)',
                'Nivel B2/PL2 de euskera (exigido en ~80% de plazas)',
                '18-37 años (no haber cumplido 38)',
                'Nacionalidad española',
                'Permiso de conducir B',
                'No haber sido condenado/a por delito doloso',
              ].map(r => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuántos temas tiene la oposición de Ertzaintza?', a: '54 temas organizados en 11 bloques temáticos, desde Derecho Constitucional hasta Conocimiento del País Vasco. La convocatoria está regulada por BOPV 226 de 24/11/2025.' },
            { q: '¿Qué nivel de euskera se necesita?', a: 'Se requiere nivel B2/PL2 de euskera para aproximadamente el 80% de las plazas. No todas las plazas exigen el mismo perfil lingüístico. OpoRuta no prepara el euskera, pero sí todo el temario teórico y los psicotécnicos.' },
            { q: '¿Cuántas preguntas tiene el examen?', a: 'Aproximadamente 40 preguntas tipo test con 4 opciones. El número exacto puede variar por convocatoria. Cada acierto suma +3,75 puntos y cada error resta -1,25 (penalización -1/3). Escala 0-150, mínimo 75.' },
            { q: '¿Cuánto cobra un ertzaina?', a: 'El sueldo base es de aproximadamente 32.000€/año, que puede aumentar con complementos por antigüedad, nocturnidad, peligrosidad y destino.' },
            { q: '¿Hay pruebas físicas?', a: 'Sí, la oposición incluye pruebas físicas eliminatorias. OpoRuta se centra en la preparación teórica (test de conocimientos) y psicotécnica (personalidad policial).' },
            { q: '¿Cuánto cuesta preparar Ertzaintza con OpoRuta?', a: 'Pack Ertzaintza: 79,99€ (pago único). Pack Completo (Ertzaintza + Personalidad Policial): 119,99€. Pack Personalidad Policial solo: 49,99€.' },
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
        <h2 className="text-2xl font-bold">Empieza a preparar Ertzaintza hoy</h2>
        <p className="text-muted-foreground">54 temas, scoring BOPV exacto y Personalidad Policial con IA. Gratis para empezar.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
