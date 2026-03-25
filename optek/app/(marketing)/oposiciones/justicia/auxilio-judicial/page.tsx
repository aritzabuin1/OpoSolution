import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, CheckCircle, Clock, Scale, Shield,
  ArrowRight, Users, Sparkles, Calculator, FileText,
  AlertTriangle, ArrowLeft,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Test Auxilio Judicial 2026 — Practica gratis con preguntas del examen | OpoRuta',
  description:
    'Prepara las oposiciones de Auxilio Judicial 2026 con tests online gratis. 26 temas, 104 preguntas tipo test con penalización, ~425 plazas. Practica con IA y aprueba a la primera.',
  keywords: [
    'test auxilio judicial 2026', 'oposiciones auxilio judicial', 'examen auxilio judicial online',
    'preguntas examen auxilio judicial', 'temario auxilio judicial 2026', 'test auxilio judicial gratis',
    'preparar oposiciones justicia', 'auxilio judicial C2', 'oposiciones justicia 2026',
  ],
  openGraph: {
    title: 'Test Auxilio Judicial 2026 — Practica gratis | OpoRuta',
    description: 'Tests online gratis para oposiciones Auxilio Judicial. 26 temas, 104 preguntas con penalización, ~425 plazas.',
    url: `${APP_URL}/oposiciones/justicia/auxilio-judicial`,
    type: 'website',
  },
  alternates: { canonical: `${APP_URL}/oposiciones/justicia/auxilio-judicial` },
}

const TEMAS = [
  { num: 1, titulo: 'Constitución Española I', desc: 'Título Preliminar. Derechos y libertades fundamentales. Garantías y suspensión.' },
  { num: 2, titulo: 'Constitución Española II', desc: 'La Corona. Las Cortes Generales. El Gobierno y la Administración. El Poder Judicial.' },
  { num: 3, titulo: 'Constitución Española III', desc: 'Organización territorial del Estado. El Tribunal Constitucional. Reforma constitucional.' },
  { num: 4, titulo: 'Unión Europea', desc: 'Instituciones de la UE. Libertades fundamentales. Fuentes del Derecho comunitario.' },
  { num: 5, titulo: 'Organización del Poder Judicial', desc: 'Principios. El Consejo General del Poder Judicial. Composición y funciones.' },
  { num: 6, titulo: 'Juzgados y tribunales', desc: 'Organización y competencia. Órganos jurisdiccionales: estructura y funciones.' },
  { num: 7, titulo: 'El Letrado de la Administración de Justicia', desc: 'Funciones. Fe pública judicial. Ordenación del proceso.' },
  { num: 8, titulo: 'La nueva oficina judicial', desc: 'LO 1/2025. Estructura y organización. Unidades procesales de apoyo directo y servicios comunes.' },
  { num: 9, titulo: 'Personal al servicio de la Administración de Justicia', desc: 'Cuerpos generales y especiales. Funciones del Cuerpo de Auxilio Judicial.' },
  { num: 10, titulo: 'Modernización tecnológica de la Justicia', desc: 'Expediente judicial electrónico. Lexnet. Firma electrónica. Sede judicial electrónica.' },
  { num: 11, titulo: 'Jurisdicción y competencia civil', desc: 'Concepto. Clases de jurisdicción. Competencia objetiva, funcional y territorial.' },
  { num: 12, titulo: 'Juicio ordinario y verbal', desc: 'Proceso de declaración. Demanda, contestación, audiencia previa, juicio, sentencia.' },
  { num: 13, titulo: 'Medidas cautelares y ejecución', desc: 'Tipos de medidas cautelares. Proceso de ejecución: títulos ejecutivos.' },
  { num: 14, titulo: 'Jurisdicción voluntaria', desc: 'Ley 15/2015. Expedientes de jurisdicción voluntaria. Tramitación.' },
  { num: 15, titulo: 'Proceso penal: procedimiento abreviado', desc: 'Principios del proceso penal. Fases: instrucción, intermedia, juicio oral. LECrim.' },
  { num: 16, titulo: 'Juicio por delitos leves y jurado', desc: 'Procedimiento para delitos leves. Tribunal del Jurado: composición y competencia.' },
  { num: 17, titulo: 'Proceso contencioso-administrativo', desc: 'Ley 29/1998. Órganos. Recurso contencioso-administrativo: procedimiento.' },
  { num: 18, titulo: 'Proceso laboral', desc: 'Ley 36/2011. Jurisdicción social. Proceso ordinario, despido, seguridad social.' },
  { num: 19, titulo: 'Actos procesales y de comunicación', desc: 'Requisitos. Notificaciones, citaciones, emplazamientos, requerimientos. Auxilio judicial.' },
  { num: 20, titulo: 'Registro Civil', desc: 'Ley 20/2011. Organización. Hechos y actos inscribibles. Procedimiento registral.' },
  { num: 21, titulo: 'Cooperación jurídica internacional', desc: 'Exhortos, comisiones rogatorias. Reglamentos europeos de cooperación judicial.' },
  { num: 22, titulo: 'LPAC — Ley 39/2015', desc: 'Procedimiento administrativo común. Interesados. Fases. Recursos administrativos.' },
  { num: 23, titulo: 'LRJSP — Ley 40/2015', desc: 'Régimen jurídico del sector público. Órganos administrativos. Funcionamiento.' },
  { num: 24, titulo: 'TREBEP', desc: 'Estatuto del Empleado Público. Derechos y deberes de los funcionarios. Situaciones administrativas.' },
  { num: 25, titulo: 'Igualdad y violencia de género', desc: 'LO 3/2007 Igualdad efectiva. LO 1/2004 Violencia de género. Medidas de protección.' },
  { num: 26, titulo: 'Protección de datos', desc: 'RGPD y LOPDGDD. Principios. Derechos del interesado. Delegado de protección de datos.' },
]

const FAQS = [
  {
    q: '¿Cuántas plazas hay de Auxilio Judicial en 2026?',
    a: 'La OEP 2024 ofertó aproximadamente 425 plazas para el Cuerpo de Auxilio Judicial (C2). Las convocatorias de Justicia suelen acumular plazas de varias OEP, por lo que la cifra final puede ser superior.',
  },
  {
    q: '¿El examen de Auxilio Judicial penaliza?',
    a: 'Sí. En el primer ejercicio (test), cada acierto suma 1 punto y cada error resta 1/3 de punto. Las preguntas en blanco no puntúan. Es importante no responder al azar.',
  },
  {
    q: '¿Cuántos ejercicios tiene la oposición?',
    a: 'Dos ejercicios eliminatorios. El primero es un test de 104 preguntas (75 minutos, con penalización). El segundo es un caso práctico con 2 supuestos de 10 preguntas cada uno (45 minutos, sin penalización).',
  },
  {
    q: '¿Qué requisitos necesito para presentarme?',
    a: 'Título de ESO o equivalente, ser mayor de 18 años y tener nacionalidad española o de un Estado miembro de la UE. No se exige experiencia previa.',
  },
  {
    q: '¿Cuánto cobra un Auxilio Judicial?',
    a: 'El sueldo bruto aproximado es de 18.000 € anuales repartidos en 14 pagas. Puede variar según la comunidad autónoma por complementos específicos.',
  },
  {
    q: '¿Cuándo es el examen de Auxilio Judicial 2026?',
    a: 'Las convocatorias de Justicia dependen del Ministerio. Habitualmente se convocan en el segundo semestre del año, con exámenes unos meses después. Pendiente de fecha oficial para 2026.',
  },
]

export default function AuxilioJudicialLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Auxilio Judicial 2026',
        description: 'Tests online con IA para oposiciones de Auxilio Judicial. 26 temas, 104 preguntas con penalización, ~425 plazas.',
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
            ~425 plazas · C2
          </Badge>
          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400">
            Próximamente
          </Badge>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-blue-600">Auxilio Judicial</span> 2026
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practica con tests online gratis. 26 temas, 104 preguntas tipo test con penalización.
          Tu puerta de entrada al Cuerpo de Auxilio Judicial de la Administración de Justicia.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=auxilio-judicial">
            <Button size="lg" className="gap-2">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs">Próximamente — Avísame al lanzar</Badge>
        </div>
        <div>
          <Link href="/oposiciones/justicia" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Oposiciones de Justicia
          </Link>
        </div>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen</h2>

        {/* Ejercicio 1 - Test */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-blue-600">Primer ejercicio — Test</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, label: '104 preguntas', desc: '100 ordinarias + 4 reserva' },
              { icon: Clock, label: '75 minutos', desc: '~43 seg por pregunta' },
              { icon: AlertTriangle, label: 'Con penalización', desc: 'Error = -1/3 punto' },
              { icon: Calculator, label: '60 pts máximo', desc: 'Acierto = +1 punto' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Con penalización — no respondas al azar. Deja en blanco si no tienes seguridad razonable.
            </p>
          </div>
        </div>

        {/* Ejercicio 2 - Caso práctico */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-blue-600">Segundo ejercicio — Caso práctico</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: '2 supuestos', desc: '10 preguntas cada uno' },
              { icon: Clock, label: '45 minutos', desc: '2 min 15 seg por pregunta' },
              { icon: CheckCircle, label: 'Sin penalización', desc: 'Error = 0 puntos' },
              { icon: Calculator, label: '40 pts máximo', desc: '2 pts por acierto' },
            ].map(({ icon: Icon, label, desc }) => (
              <Card key={label}>
                <CardContent className="pt-6 text-center space-y-2">
                  <Icon className="h-8 w-8 text-blue-600 mx-auto" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              <CheckCircle className="w-4 h-4 inline mr-1.5" />
              Sin penalización en el caso práctico — responde todas las preguntas.
            </p>
          </div>
        </div>
      </section>

      {/* Temario */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 26 temas</h2>
        <p className="text-sm text-muted-foreground">
          Según Anexo VI.c del BOE-A-2025-27053. Derecho constitucional, organización judicial, procesal y administrativo.
        </p>
        <div className="grid gap-3">
          {TEMAS.map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                {t.num}
              </span>
              <div>
                <p className="font-medium text-sm">{t.titulo}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo te ayuda OpoRuta */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">¿Cómo te ayuda OpoRuta?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Sparkles, title: 'Tests con IA', desc: 'Preguntas generadas y verificadas contra la legislación real: Constitución, LOPJ, LO 1/2025, LEC, LECrim, TREBEP, LPAC y LRJSP.' },
            { icon: AlertTriangle, title: 'Scoring con penalización', desc: 'OpoRuta replica el scoring real: acierto +1, error -1/3. Aprende a gestionar el riesgo antes del examen.' },
            { icon: Shield, title: '26 temas cubiertos', desc: 'Desde Constitución hasta Protección de datos. Cada test se genera con artículos reales del temario oficial.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado hasta que apruebes. 20 análisis detallados incluidos.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-blue-600" />
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
            'Título de ESO, Graduado Escolar o equivalente',
            'No estar inhabilitado para funciones públicas',
            'No tener antecedentes penales',
          ].map(r => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <div className="border rounded-lg p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Sueldo aproximado:</strong> ~18.000 €/año brutos en 14 pagas. Varía según comunidad autónoma y complementos.
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
      <section className="text-center py-8 space-y-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Auxilio Judicial hoy</h2>
        <p className="text-muted-foreground">Gratis, sin tarjeta de crédito, desde el primer tema.</p>
        <Link href="/register?oposicion=auxilio-judicial">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
