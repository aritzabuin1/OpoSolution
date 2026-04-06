import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  GraduationCap, BookOpen, ArrowRight, ArrowLeft, Users, Clock,
  CheckCircle2, Brain, FileText, Target, AlertTriangle,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Policía Nacional 2026: 3.000 plazas, 45 temas — Tests gratis | OpoRuta',
  description:
    'Prepara Policía Nacional 2026: ~3.000 plazas, 45 temas, 100 preguntas con 3 opciones (penalización -1/2). Tests gratis con IA verificados contra BOE + psicotécnicos + Personalidad Policial.',
  keywords: [
    'oposiciones policia nacional 2026', 'test policia nacional online', 'temario policia nacional',
    'policia nacional requisitos', 'oposiciones policia nacional temario',
    'psicotecnicos policia nacional', 'policia nacional plazas 2026', 'policia nacional 3 opciones',
  ],
  openGraph: {
    title: 'Oposiciones Policía Nacional 2026: 3.000 plazas | OpoRuta',
    description: 'Tests gratis para Policía Nacional 2026. ~3.000 plazas, 45 temas, 100 preguntas con 3 opciones, scoring verificado BOE.',
    url: `${APP_URL}/oposiciones/seguridad/policia-nacional`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Policía Nacional 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/seguridad/policia-nacional` },
}

const BLOQUES = [
  { num: 'I', titulo: 'Ciencias Jurídicas', temas: '1-26', count: 26, desc: 'Constitución, Derechos Fundamentales, Gobierno, UE, Derecho Administrativo (LPAC, LRJSP), FCSE (LO 2/1986), Extranjería, Derecho Penal, Procesal Penal' },
  { num: 'II', titulo: 'Ciencias Sociales', temas: '27-38', count: 12, desc: 'DDHH, Globalización, Sociología, Psicología, Comunicación, Inmigración, Cooperación policial, Ortografía, Terrorismo' },
  { num: 'III', titulo: 'Materias Técnico-Científicas', temas: '39-45', count: 7, desc: 'TIC, Ciberseguridad, Transmisiones, Automoción, Armamento, Primeros auxilios, Seguridad vial' },
]

export default function PoliciaNacionalPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            name: 'Preparación Oposiciones Policía Nacional 2026',
            description: 'Tests con IA para oposiciones de Policía Nacional. 45 temas en 3 bloques, 100 preguntas con 3 opciones, verificados contra BOE.',
            provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
            educationalLevel: 'C1 - Bachillerato',
            numberOfCredits: '45',
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
              courseWorkload: 'PT180H',
            },
            offers: { '@type': 'Offer', price: '79.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: '¿Cuántos temas tiene la oposición de Policía Nacional?', acceptedAnswer: { '@type': 'Answer', text: '45 temas organizados en 3 bloques: I (Ciencias Jurídicas, 26 temas), II (Ciencias Sociales, 12 temas) y III (Materias Técnico-Científicas, 7 temas). Convocatoria BOE-A-2025-16610.' } },
              { '@type': 'Question', name: '¿Es verdad que Policía Nacional tiene 3 opciones?', acceptedAnswer: { '@type': 'Answer', text: 'Sí, es la única oposición de seguridad con solo 3 opciones (A, B, C) por pregunta. La penalización por error es -1/2 del valor de un acierto, más severa que la habitual -1/3 de otras oposiciones.' } },
              { '@type': 'Question', name: '¿Cuántas plazas de Policía Nacional hay en 2026?', acceptedAnswer: { '@type': 'Answer', text: 'Aproximadamente 3.000 plazas para la escala básica. Es una de las oposiciones de seguridad más demandadas de España.' } },
              { '@type': 'Question', name: '¿Cuánto cobra un Policía Nacional?', acceptedAnswer: { '@type': 'Answer', text: 'El sueldo de un Policía Nacional ronda los 28.000-34.000€/año, dependiendo del destino, complementos y antigüedad.' } },
            ],
          },
        ],
      }} />

      {/* Hero */}
      <section className="space-y-6">
        <Link href="/oposiciones/seguridad" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a Seguridad
        </Link>
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <GraduationCap className="w-4 h-4 mr-1.5 inline" />
            C1 · 45 temas · ~3.000 plazas · BOE-A-2025-16610
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Oposiciones <span className="text-blue-600">Policía Nacional</span> 2026
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cuerpo policial de ámbito nacional. 45 temas en 3 bloques, 100 preguntas tipo test con 3 opciones.
            Tests con IA verificados contra legislación BOE.
          </p>
        </div>
      </section>

      {/* Warning: 3 opciones */}
      <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-xl p-5 space-y-2">
        <h2 className="text-base font-bold flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Atención: 3 opciones y penalización -1/2
        </h2>
        <p className="text-sm text-amber-900 dark:text-amber-100">
          Policía Nacional es la <strong>única oposición con 3 opciones</strong> (A, B, C) en lugar de 4.
          La penalización por error es <strong>-1/2 del valor de un acierto</strong> (mucho más severa que
          la habitual -1/3 de Guardia Civil o Ertzaintza). Esto cambia radicalmente la estrategia:
          solo debes responder si descartas al menos 1 opción con seguridad.
          OpoRuta replica este scoring exacto en todos los tests.
        </p>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Temas', value: '45 (3 bloques)', icon: BookOpen },
            { label: 'Preguntas', value: '100', icon: FileText },
            { label: 'Opciones', value: '3 por pregunta (A, B, C)', icon: AlertTriangle },
            { label: 'Tiempo', value: '50 minutos', icon: Clock },
            { label: 'Acierto', value: '+0,1 pt', icon: CheckCircle2 },
            { label: 'Error', value: '-0,05 pts (pen. -1/2)', icon: AlertTriangle },
            { label: 'Escala', value: '0-10 (mín. 3)', icon: GraduationCap },
            { label: 'Convocatoria', value: 'BOE-A-2025-16610', icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-600 shrink-0" />
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
        <h2 className="text-2xl font-bold">Temario: 3 bloques, 45 temas</h2>
        <div className="grid gap-4">
          {BLOQUES.map(b => (
            <Card key={b.num}>
              <CardContent className="pt-5 pb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-bold text-lg">{b.num}</span>
                    <h3 className="font-bold text-sm">{b.titulo}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">{b.count} temas</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Temas {b.temas}: {b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Lo que incluye OpoRuta para Policía Nacional</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Tests por tema y bloque', desc: 'Practica cada uno de los 45 temas o por bloque (I/II/III). Preguntas generadas con IA y verificadas contra legislación BOE.', icon: BookOpen },
            { title: 'Scoring exacto BOE (3 opciones)', desc: 'Escala 0-10, acierto +0,1, error -0,05 (pen. -1/2). 3 opciones por pregunta. 100 preguntas en 50 min. Réplica exacta del sistema oficial.', icon: Target },
            { title: 'Psicotécnicos específicos', desc: 'Tests de aptitudes adaptados al perfil Policía Nacional: razonamiento verbal, numérico, abstracto y espacial.', icon: Brain },
            { title: 'Personalidad Policial con IA', desc: 'Módulo exclusivo: Big Five, SJT, entrevista simulada y análisis de consistencia. Transversal para las 3 oposiciones de seguridad.', icon: Users },
          ].map(({ title, desc, icon: Icon }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="w-6 h-6 text-blue-600" />
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
                '18 años cumplidos (sin límite superior de edad)',
                'Nacionalidad española',
                'Nivel A2 de inglés o francés obligatorio',
                'Permiso de conducir B',
                'No haber sido condenado/a por delito doloso',
                'Compromiso de portar armas',
              ].map(r => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
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
            { q: '¿Cuántos temas tiene la oposición de Policía Nacional?', a: '45 temas en 3 bloques: I (Ciencias Jurídicas, 26 temas), II (Ciencias Sociales, 12 temas) y III (Materias Técnico-Científicas, 7 temas). Convocatoria BOE-A-2025-16610.' },
            { q: '¿Es verdad que tiene 3 opciones y penalización -1/2?', a: 'Sí. Policía Nacional es la única oposición con solo 3 opciones (A, B, C). La penalización por error es -1/2 del valor de un acierto (no -1/3 como en GC o Ertzaintza). Esto hace que contestar al azar sea mucho más arriesgado.' },
            { q: '¿Puedo preparar PN y Guardia Civil a la vez?', a: 'Sí. Comparten ~60% de legislación (Constitución, LO 2/1986 FCSE, Seguridad Ciudadana, Código Penal). Con el Pack Doble GC+PN accedes a ambas oposiciones por 129,99€. Ojo: el scoring es diferente (4 opciones GC vs 3 opciones PN).' },
            { q: '¿Cuántas plazas hay en 2026?', a: 'Aproximadamente 3.000 plazas para la escala básica. Es una de las oposiciones de seguridad más demandadas de España.' },
            { q: '¿Cuánto cobra un Policía Nacional?', a: 'El sueldo ronda los 28.000-34.000€/año, dependiendo del destino, complementos por antigüedad, nocturnidad y peligrosidad.' },
            { q: '¿Cuánto cuesta preparar PN con OpoRuta?', a: 'Pack Policía Nacional: 79,99€ (pago único). Pack Doble GC+PN: 129,99€. Pack Completo (PN + Personalidad Policial): 119,99€. Pack Personalidad Policial solo: 49,99€.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Policía Nacional hoy</h2>
        <p className="text-muted-foreground">45 temas, scoring BOE exacto (3 opciones, -1/2) y Personalidad Policial con IA. Gratis para empezar.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
