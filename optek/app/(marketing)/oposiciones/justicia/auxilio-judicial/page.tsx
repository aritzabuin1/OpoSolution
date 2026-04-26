import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import { TopLawsWidget } from '@/components/seo/TopLawsWidget'
import { ClusterBlogTOC } from '@/components/seo/ClusterBlogTOC'
import {
  BookOpen, CheckCircle, Clock, Scale, Shield,
  ArrowRight, Users, Sparkles, Calculator, FileText,
  AlertTriangle, ArrowLeft,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Auxilio Judicial 2026: 425 plazas C2, 26 temas — Tests gratis | OpoRuta',
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
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Test Auxilio Judicial 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/justicia/auxilio-judicial` },
}

// 26 temas oficiales — Anexo VI.c BOE-A-2025-27053 (verificado contra administraciondejusticia.com + formacion.ninja)
const TEMAS = [
  { num: 1, titulo: 'La Constitución Española de 1978', desc: 'Estructura y contenido. Atribuciones de la Corona. Cortes Generales. Elaboración de leyes. Tribunal Constitucional.' },
  { num: 2, titulo: 'Derecho de igualdad y no discriminación', desc: 'LO 3/2007 Igualdad. LO 1/2004 Violencia de Género. Ley 15/2022. Ley 4/2023 LGTBI.' },
  { num: 3, titulo: 'El Gobierno y la Administración', desc: 'Organización administrativa: Ministros, Secretarios de Estado, Subsecretarios, Directores Generales.' },
  { num: 4, titulo: 'Organización territorial del Estado', desc: 'Las CCAA. Estatutos de Autonomía. Administración Local: provincia y municipio.' },
  { num: 5, titulo: 'La Unión Europea', desc: 'Competencias. Parlamento Europeo, Consejo, Comisión, TJUE, Tribunal de Cuentas.' },
  { num: 6, titulo: 'El Poder Judicial', desc: 'CGPJ. Jueces y Magistrados. Independencia judicial. El Ministerio Fiscal.' },
  { num: 7, titulo: 'Organización y competencia (I)', desc: 'TS, AN, TSJ y Audiencias Provinciales.' },
  { num: 8, titulo: 'Organización y competencia (II)', desc: 'Tribunales de Instancia y Tribunal Central de Instancia. Oficinas de Justicia. Juzgados de Paz. [LO 1/2025]' },
  { num: 9, titulo: 'Carta de Derechos de los Ciudadanos ante la Justicia', desc: 'Derechos de información, atención, gestión. Derecho a justicia gratuita.' },
  { num: 10, titulo: 'Modernización de la Oficina Judicial', desc: 'La nueva oficina judicial (LOPJ + LO 1/2025). Nuevas tecnologías. Presentación telemática de escritos.' },
  { num: 11, titulo: 'El Letrado de la Administración de Justicia', desc: 'Funciones y competencias en la LOPJ.' },
  { num: 12, titulo: 'Cuerpos de funcionarios de la Administración de Justicia', desc: 'Funciones y formas de acceso en los cuerpos generales.' },
  { num: 13, titulo: 'Los Cuerpos Generales (I)', desc: 'Derechos y deberes de los funcionarios. Situaciones administrativas.' },
  { num: 14, titulo: 'Los Cuerpos Generales (II)', desc: 'Régimen disciplinario. Delitos y penas: clases.' },
  { num: 15, titulo: 'Libertad sindical', desc: 'El sindicato en la CE. Elecciones sindicales (LOPJ y TREBEP). PRL.' },
  { num: 16, titulo: 'Procedimientos declarativos en la LEC', desc: 'Juicio ordinario y verbal. Procedimientos especiales. MASC (medios adecuados de solución de controversias). [LO 1/2025]' },
  { num: 17, titulo: 'Procedimientos de ejecución en la LEC', desc: 'Ejecución dineraria y no dineraria. Medidas cautelares. Embargo, lanzamiento, depósitos.' },
  { num: 18, titulo: 'Procedimientos penales en la LECrim', desc: 'Proceso ordinario, abreviado, delitos leves, jurado, rápidos. Habeas Corpus.' },
  { num: 19, titulo: 'Procedimientos contencioso-administrativos', desc: 'Ley 29/1998. Órganos y competencias. Recurso contencioso-administrativo.' },
  { num: 20, titulo: 'El proceso laboral', desc: 'Ley 36/2011. Jurisdicción social. Procesos ordinarios, despido, seguridad social.' },
  { num: 21, titulo: 'Los actos procesales', desc: 'Requisitos. Nulidad, anulabilidad, irregularidad. Plazos y términos: cómputo y control.' },
  { num: 22, titulo: 'Resoluciones de los órganos judiciales', desc: 'Clases, contenido y características. Resoluciones de órganos colegiados. Resoluciones del LAJ.' },
  { num: 23, titulo: 'Actos de comunicación con Tribunales y Autoridades', desc: 'Oficios y mandamientos. Auxilio judicial: exhortos. Cooperación jurídica internacional.' },
  { num: 24, titulo: 'Actos de comunicación a las partes', desc: 'Notificaciones, requerimientos, citaciones y emplazamientos. Nuevas tecnologías.' },
  { num: 25, titulo: 'El Registro Civil', desc: 'Estructura. Oficinas: Central, Generales y Consulares. Funciones.' },
  { num: 26, titulo: 'Archivo judicial y documentación judicial', desc: 'Formas de remisión. Nuevas tecnologías en archivos. Juntas de expurgo.' },
]

const FAQS = [
  {
    q: '¿Cuántas plazas hay de Auxilio Judicial en 2026?',
    a: 'La OEP 2024 ofertó aproximadamente 425 plazas para el Cuerpo de Auxilio Judicial (C2). Las convocatorias de Justicia suelen acumular plazas de varias OEP, por lo que la cifra final puede ser superior.',
  },
  {
    q: '¿El examen de Auxilio Judicial penaliza?',
    a: 'Sí, en ambos ejercicios. En el primer ejercicio (test), cada acierto suma 0,60 puntos y cada error resta 0,15 (1/4). En el segundo ejercicio (caso práctico), cada acierto suma 1,00 punto y cada error resta 0,25 (1/4). Las preguntas en blanco no puntúan.',
  },
  {
    q: '¿Cuántos ejercicios tiene la oposición?',
    a: 'Dos ejercicios eliminatorios el mismo día. El primero es un test de 104 preguntas (100 minutos, con penalización, mínimo 30 puntos). El segundo es un caso práctico con 42 preguntas sobre 2 supuestos de diligencia judicial (60 minutos, con penalización, mínimo 20 puntos).',
  },
  {
    q: '¿Qué requisitos necesito para presentarme?',
    a: 'Título de ESO o equivalente, ser mayor de 18 años y tener nacionalidad española o de un Estado miembro de la UE. No se exige experiencia previa.',
  },
  {
    q: '¿Cuánto cobra un Auxilio Judicial?',
    a: 'Aproximadamente 24.000€ brutos anuales en 14 pagas (sueldo base 988€/mes + complemento de destino + complemento específico). Varía según comunidad autónoma y tipo de juzgado. Con trienios de antigüedad puede superar los 26.000€. Fuente: PGE 2025.',
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
          <Badge variant="outline" className="text-xs border-green-400 text-green-700 dark:text-green-400">
            Disponible
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
          <Badge variant="outline" className="text-xs border-green-400 text-green-700">26 temas · 2 ejercicios</Badge>
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
              { icon: Clock, label: '100 minutos', desc: '~58 seg por pregunta' },
              { icon: AlertTriangle, label: 'Con penalización', desc: 'Error = -0,15 (1/4 del acierto)' },
              { icon: Calculator, label: '60 pts máximo', desc: 'Acierto = +0,60 pts · Mín. 30 pts' },
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
              { icon: FileText, label: '42 preguntas', desc: '40 + 2 reserva · 2 casos prácticos' },
              { icon: Clock, label: '60 minutos', desc: '~1 min 26 seg por pregunta' },
              { icon: AlertTriangle, label: 'Con penalización', desc: 'Error = -0,25 (1/4 del acierto)' },
              { icon: Calculator, label: '40 pts máximo', desc: 'Acierto = +1,00 pt · Mín. 20 pts' },
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
              Con penalización también en el caso práctico — acierto +1,00, error -0,25 (1/4). Mínimo 20 puntos para aprobar.
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
            { icon: AlertTriangle, title: 'Scoring con penalización', desc: 'OpoRuta replica el scoring real de ambos ejercicios. Ej1: +0,60 / -0,15. Ej2: +1,00 / -0,25. Aprende a gestionar el riesgo.' },
            { icon: FileText, title: '199 preguntas oficiales MJU', desc: 'Exámenes reales 2024 y 2025 completos. Practica con las mismas preguntas que puso el tribunal.' },
            { icon: Shield, title: '26 temas cubiertos', desc: 'Desde Constitución hasta Protección de datos. Cada test se genera con artículos reales del temario oficial.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado hasta que apruebes. 20 créditos IA incluidos.' },
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
            <strong>Sueldo bruto:</strong> ~24.000€/año en 14 pagas (base + complementos). Varía según comunidad autónoma y antigüedad. Fuente: PGE 2025.
          </p>
        </div>
      </section>

      <TopLawsWidget oposicionIds="e0000000-0000-0000-0000-000000000001" oposicionName="Auxilio Judicial" />

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
      {/* Blog cluster TOC — autoridad temática + internal linking */}
      <ClusterBlogTOC
        clusters={'auxilio-judicial'}
        title="Guías y artículos del blog — Auxilio Judicial"
        description="Todo el contenido publicado para esta oposición. Actualizado en cada convocatoria."
      />


    </main>
  )
}
