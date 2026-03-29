import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, CheckCircle, Clock, Scale, Shield,
  ArrowRight, Users, Sparkles, GraduationCap, FileText,
  AlertTriangle, Gavel,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Test Gestión Procesal 2026 — Practica gratis con preguntas del examen | OpoRuta',
  description:
    'Prepara las oposiciones de Gestión Procesal y Administrativa (A2) 2026. 68 temas, 3 ejercicios, 725 plazas. Tests con IA, caso práctico y desarrollo. El examen más completo de Justicia.',
  keywords: [
    'test gestión procesal 2026', 'oposiciones gestión procesal', 'examen gestión procesal online',
    'temario gestión procesal 2026', 'test gestión procesal gratis', 'caso práctico gestión procesal',
    'preparar oposiciones justicia A2', 'gestión procesal y administrativa',
    'oposiciones justicia 2026', 'cuerpo gestión procesal',
  ],
  openGraph: {
    title: 'Test Gestión Procesal 2026 — Practica gratis | OpoRuta',
    description: 'Tests online gratis para Gestión Procesal y Administrativa (A2). 68 temas, 3 ejercicios, 725 plazas.',
    url: `${APP_URL}/oposiciones/justicia/gestion-procesal`,
    type: 'website',
  },
  alternates: { canonical: `${APP_URL}/oposiciones/justicia/gestion-procesal` },
}

const BLOQUES = [
  {
    num: 'I',
    titulo: 'Organización del Estado y Administración de Justicia',
    temas: 16,
    rango: 'T1-16',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    desc: 'Constitución, UE, organización judicial, LAJ, oficina judicial, Justicia de Paz (exclusivo Gestión), personal, LPAC, LRJSP, TREBEP.',
  },
  {
    num: 'II',
    titulo: 'Normas comunes y procedimientos civiles',
    temas: 23,
    rango: 'T17-39',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    desc: 'Partes, representación, jurisdicción, actos procesales, resoluciones, comunicación. Declarativos, ordinario, verbal, especiales, voluntaria, recursos, casación, ejecución, apremio, cautelares, costas.',
  },
  {
    num: '',
    titulo: 'Registro Civil',
    temas: 3,
    rango: 'T40-42',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    desc: 'Registro Civil, asientos, publicidad registral.',
  },
  {
    num: 'III',
    titulo: 'Procedimiento penal',
    temas: 14,
    rango: 'T43-56',
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    desc: 'Sistema procesal penal completo: procedimiento ordinario, abreviado, jurado, menores, violencia de género, Habeas Corpus.',
  },
  {
    num: 'IV',
    titulo: 'Contencioso-administrativo y laboral',
    temas: 11,
    rango: 'T57-67',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    desc: 'Contencioso-administrativo (8 temas detallados), proceso laboral (3 temas).',
  },
  {
    num: '',
    titulo: 'Derecho mercantil',
    temas: 1,
    rango: 'T68',
    color: 'bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300',
    desc: 'Concurso de acreedores.',
  },
]

const FAQS = [
  {
    q: '¿Cuántas plazas hay en Gestión Procesal 2026?',
    a: 'La OEP 2024 ofertó 725 plazas para el Cuerpo de Gestión Procesal y Administrativa (A2). Es el cuerpo superior de Justicia con titulación universitaria.',
  },
  {
    q: '¿Qué diferencia hay entre Gestión Procesal, Tramitación y Auxilio?',
    a: 'Gestión Procesal (A2) es el más exigente: requiere grado universitario, tiene 68 temas y 3 ejercicios (test + caso práctico + desarrollo). Tramitación (C1) tiene 37 temas y 3 ejercicios, y Auxilio (C2) tiene 26 temas y 2 ejercicios tipo test.',
  },
  {
    q: '¿El examen de Gestión Procesal penaliza?',
    a: 'Sí. En el primer ejercicio (test), cada error resta 1/4 del valor del acierto (-0,15 por fallo). En el caso práctico, la penalización es 1/5 (-0,30 por fallo). Dejar en blanco no penaliza. Es fundamental no responder al azar.',
  },
  {
    q: '¿Cuántos ejercicios tiene la oposición?',
    a: 'Tres ejercicios eliminatorios: 1) Test de 100 preguntas en 100 minutos (60 pts, min 30). 2) Caso práctico tipo test: 10 preguntas en 30 minutos (15 pts, min 7,5). 3) Desarrollo escrito: 5 preguntas en 45 minutos sobre temas 17-39 y 43-67 (25 pts, min 12,5).',
  },
  {
    q: '¿Cuánto cobra un Gestor Procesal?',
    a: 'Aproximadamente 34.000€ brutos anuales en 14 pagas (sueldo base 1.294€/mes + complemento de destino + complemento específico). Varía según comunidad autónoma y tipo de juzgado. Con trienios puede superar los 38.000€. Fuente: PGE 2025.',
  },
  {
    q: '¿Puedo preparar Gestión Procesal con OpoRuta?',
    a: 'Sí. OpoRuta incluye los 68 temas completos de Gestión Procesal, simulacros con preguntas oficiales MJU, caso práctico tipo test y desarrollo escrito con corrección IA usando la rúbrica oficial del MJU.',
  },
]

export default function GestionProcesalLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Gestión Procesal y Administrativa 2026',
        description: 'Tests online con IA para oposiciones de Gestión Procesal (A2). 68 temas, 3 ejercicios, caso práctico corregido con IA.',
        provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }} />

      {/* Hero */}
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <Scale className="w-4 h-4 mr-1.5 inline" />
            725 plazas · Grupo A2
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1 border-green-300 text-green-700 dark:text-green-300">
            Disponible
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-purple-600">Gestión Procesal</span> 2026
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          El cuerpo más exigente de Justicia. 68 temas, 3 ejercicios, titulación universitaria.
          Prepárate con tests, casos prácticos y desarrollo corregidos con IA.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=gestion-procesal">
            <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/oposiciones/justicia">
            <Button variant="outline" size="lg" className="gap-2">
              <Gavel className="w-4 h-4" /> Ver todos los cuerpos de Justicia
            </Button>
          </Link>
        </div>
      </section>

      {/* Estructura del examen — 3 ejercicios */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen — 3 ejercicios</h2>

        {/* Ejercicio 1: Test */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">1</span>
            Ejercicio tipo test — 60 puntos
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: '100 preguntas (+4 reserva)', desc: '4 opciones, 1 correcta' },
              { icon: Clock, label: '100 minutos', desc: '60 seg por pregunta' },
              { icon: AlertTriangle, label: 'Penaliza errores', desc: 'Acierto +0,60 · error -0,15 (1/4)' },
              { icon: FileText, label: 'Min 30 pts de 60', desc: 'Eliminatorio' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon className="h-8 w-8 text-purple-600 mx-auto" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Penaliza errores — cada fallo resta 1/4 del valor del acierto. No respondas al azar.
            </p>
          </div>
        </div>

        {/* Ejercicio 2: Caso práctico */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">2</span>
            Caso práctico — 15 puntos
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: '10 preguntas (+2 reserva)', desc: '2 supuestos, 5 preguntas c/u' },
              { icon: Clock, label: '30 minutos', desc: '3 min por pregunta' },
              { icon: AlertTriangle, label: 'Penaliza 1/5', desc: 'Acierto +1,50 · error -0,30' },
              { icon: Scale, label: 'Min 7,5 pts de 15', desc: 'Eliminatorio' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon className="h-8 w-8 text-purple-600 mx-auto" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              El caso práctico tiene ratio de penalización 1/5 (única entre los cuerpos de Justicia). Cada error resta -0,30 sobre +1,50 de acierto.
            </p>
          </div>
        </div>

        {/* Ejercicio 3: Desarrollo */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">3</span>
            Desarrollo escrito — 25 puntos
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: '5 preguntas', desc: '0-5 pts por pregunta' },
              { icon: Clock, label: '45 minutos', desc: '9 min por pregunta' },
              { icon: GraduationCap, label: 'Temas 17-39 y 43-67', desc: 'Civil, mercantil, penal, procesal' },
              { icon: Scale, label: 'Min 12,5 pts de 25', desc: 'Eliminatorio' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon className="h-8 w-8 text-purple-600 mx-auto" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              <GraduationCap className="w-4 h-4 inline mr-1.5" />
              El ejercicio de desarrollo es eliminatorio y cubre derecho civil, mercantil, penal y procesal.
            </p>
          </div>
        </div>
      </section>

      {/* Temario por bloques */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 68 temas</h2>
        <div className="grid gap-3">
          {BLOQUES.map(b => (
            <div key={b.rango} className="flex gap-4 items-start p-4 rounded-lg border">
              <span className={`text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center shrink-0 ${b.color}`}>
                {b.num || b.rango}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{b.num ? `Bloque ${b.num}: ` : ''}{b.titulo}</p>
                  <Badge variant="secondary" className="text-xs">{b.temas} {b.temas === 1 ? 'tema' : 'temas'} ({b.rango})</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Temario completo del Anexo VI.a (BOE-A-2025-27053). Los temas 17-39 y 43-67 entran en el ejercicio de desarrollo.
        </p>
      </section>

      {/* Cómo te ayuda OpoRuta */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">¿Cómo te ayuda OpoRuta?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Sparkles, title: 'Tests con IA sobre 68 temas', desc: 'Preguntas generadas y verificadas contra la legislación real: LEC, LECrim, Ley Concursal, LOPJ y más.' },
            { icon: FileText, title: 'Caso práctico corregido con IA', desc: 'Entrena supuestos de juzgado con corrección inteligente. El segundo ejercicio ya no te pillará por sorpresa.' },
            { icon: GraduationCap, title: 'Desarrollo con feedback', desc: 'Practica las preguntas de desarrollo (temas 17-39 y 43-67) y recibe feedback detallado de tu Tutor IA.' },
            { icon: Shield, title: '186 preguntas oficiales MJU', desc: 'Exámenes reales 2023 y 2025 completos. Practica con el scoring oficial: acierto +0,60, error -0,15 (1/4).' },
            { icon: Scale, title: 'Legislación siempre actualizada', desc: 'Ley Concursal, LO Protección de Testigos, Ley de Mediación, Registros Civiles — todo verificado contra BOE.' },
            { icon: Users, title: 'Precio único 49,99 euros', desc: 'Sin suscripción. Acceso ilimitado hasta que apruebes. 20 créditos IA incluidos.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-purple-600" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Requisitos */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Requisitos</h2>
        <ul className="space-y-2 text-sm">
          {[
            'Nacionalidad española o de un Estado miembro de la UE',
            'Mayor de 18 años',
            'Grado universitario, diplomatura, ingeniería técnica o equivalente',
            'No haber sido separado del servicio de la Administración de Justicia',
            'No tener antecedentes penales',
          ].map(r => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <GraduationCap className="w-4 h-4 inline mr-1.5" />
            <strong>Grupo A2</strong> — se requiere titulación universitaria. Es el cuerpo más alto de la Administración de Justicia al que se accede con grado.
            <strong>Sueldo bruto:</strong> ~34.000€/año en 14 pagas (base 1.294€/mes + complementos). 725 plazas. Fuente: PGE 2025.
          </p>
        </div>
      </section>

      {/* FAQ visual */}
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

      {/* CTA final */}
      <section className="text-center py-8 space-y-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">La oposición más completa de Justicia</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          68 temas, 3 ejercicios, titulación universitaria. Gestión Procesal no es para todos,
          pero si te atreves, OpoRuta te prepara con IA.
        </p>
        <Link href="/register?oposicion=gestion-procesal">
          <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
            Avísame al lanzar <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">
          <Link href="/oposiciones/justicia" className="underline hover:text-purple-600">
            Ver todos los cuerpos de Justicia
          </Link>
        </p>
      </section>
    </main>
  )
}
