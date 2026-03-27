import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, CheckCircle, Clock, Scale, Gavel,
  ArrowRight, Users, Sparkles, FileText, Monitor,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'Test Tramitación Procesal 2026 — Practica gratis con preguntas tipo examen | OpoRuta',
  description:
    'Prepara las oposiciones de Tramitación Procesal y Administrativa 2026 con tests online gratis. 37 temas, 100 preguntas con penalización, 1.155 plazas. Entrena con IA y aprueba a la primera.',
  keywords: [
    'test tramitación procesal 2026', 'oposiciones tramitación procesal',
    'examen tramitación procesal online', 'preguntas tramitación procesal',
    'temario tramitación procesal 2026', 'test justicia gratis',
    'preparar oposiciones justicia', 'tramitación procesal y administrativa',
    'oposiciones justicia 2026', 'cuerpo tramitación procesal',
  ],
  openGraph: {
    title: 'Test Tramitación Procesal 2026 — Practica gratis | OpoRuta',
    description: 'Tests online gratis para oposiciones de Tramitación Procesal. 37 temas, 3 ejercicios, 1.155 plazas.',
    url: `${APP_URL}/oposiciones/justicia/tramitacion-procesal`,
    type: 'website',
  },
  alternates: { canonical: `${APP_URL}/oposiciones/justicia/tramitacion-procesal` },
}

const TEMAS = [
  // Bloque I — Derecho constitucional, organización judicial y derecho administrativo (15 temas)
  { num: 1, titulo: 'La Constitución Española de 1978 (I)', desc: 'Estructura, principios generales, derechos fundamentales y libertades públicas.' },
  { num: 2, titulo: 'La Constitución Española de 1978 (II)', desc: 'La Corona, las Cortes Generales, el Gobierno y el Poder Judicial.' },
  { num: 3, titulo: 'La Constitución Española de 1978 (III)', desc: 'El Tribunal Constitucional. Organización territorial del Estado. Comunidades Autónomas.' },
  { num: 4, titulo: 'La Unión Europea', desc: 'Tratados constitutivos. Instituciones. Cooperación judicial en la UE.' },
  { num: 5, titulo: 'Organización y competencia del poder judicial (I)', desc: 'LOPJ y LO 1/2025. Juzgados y tribunales. Jurisdicción y competencia.' },
  { num: 6, titulo: 'Organización y competencia del poder judicial (II)', desc: 'Tribunal Supremo, Audiencia Nacional, TSJ, Audiencias Provinciales, Juzgados.' },
  { num: 7, titulo: 'El Consejo General del Poder Judicial', desc: 'Composición, funciones, órganos. Inspección de Juzgados y Tribunales.' },
  { num: 8, titulo: 'El Letrado de la Administración de Justicia', desc: 'Cuerpo de LAJ. Funciones de fe pública, documentación, impulso procesal.' },
  { num: 9, titulo: 'La Oficina Judicial', desc: 'Organización y funcionamiento. Unidades procesales de apoyo directo y servicios comunes.' },
  { num: 10, titulo: 'El personal al servicio de la Administración de Justicia', desc: 'Cuerpos generales y especiales. Selección, provisión y situaciones administrativas.' },
  { num: 11, titulo: 'Modernización de la Administración de Justicia', desc: 'Expediente judicial electrónico. LexNET. Firma electrónica. Interoperabilidad.' },
  { num: 12, titulo: 'Procedimiento administrativo (LPAC)', desc: 'Ley 39/2015. Fases del procedimiento. Actos administrativos. Recursos.' },
  { num: 13, titulo: 'Régimen jurídico del sector público (LRJSP)', desc: 'Ley 40/2015. Órganos administrativos. Convenios. Funcionamiento electrónico.' },
  { num: 14, titulo: 'Igualdad efectiva y violencia de género', desc: 'LO 3/2007. LO 1/2004. Medidas judiciales de protección. TREBEP e igualdad.' },
  { num: 15, titulo: 'Protección de datos', desc: 'RGPD y LOPDGDD. Tratamiento de datos en la Administración de Justicia.' },

  // Bloque II — Derecho procesal (16 temas)
  { num: 16, titulo: 'Procedimientos declarativos LEC. MASC', desc: 'Juicio ordinario, verbal, medios adecuados de solución de controversias.' },
  { num: 17, titulo: 'Procedimientos de ejecución LEC', desc: 'Embargos, subastas. Medidas cautelares.' },
  { num: 18, titulo: 'Procesos especiales LEC', desc: 'Matrimoniales, monitorio, cambiario.' },
  { num: 19, titulo: 'Jurisdicción voluntaria', desc: 'Ley 15/2015. Expedientes de jurisdicción voluntaria. Competencia del LAJ.' },
  { num: 20, titulo: 'Procedimientos penales LECrim', desc: 'Habeas Corpus. Instrucción. Denuncia y querella.' },
  { num: 21, titulo: 'Juicio sobre delitos leves', desc: 'Competencia. Citación. Celebración del juicio. Sentencia.' },
  { num: 22, titulo: 'Recurso contencioso-administrativo', desc: 'LJCA. Órganos. Procedimiento abreviado. Ejecución de sentencias.' },
  { num: 23, titulo: 'El proceso laboral', desc: 'LRJS. Juzgados de lo Social. Conciliación previa. Proceso ordinario y modalidades.' },
  { num: 24, titulo: 'Recursos', desc: 'Recursos ordinarios y extraordinarios en los distintos órdenes jurisdiccionales.' },
  { num: 25, titulo: 'Actos procesales', desc: 'Requisitos de los actos procesales. Plazos y términos. Nulidad de actuaciones.' },
  { num: 26, titulo: 'Resoluciones de órganos judiciales. Resoluciones del LAJ', desc: 'Providencias, autos, sentencias. Decretos y diligencias del Letrado de la Administración de Justicia.' },
  { num: 27, titulo: 'Comunicación con otros Tribunales', desc: 'Oficios, mandamientos, exhortos. Cooperación jurídica internacional.' },
  { num: 28, titulo: 'Comunicación a las partes', desc: 'Notificaciones, requerimientos, citaciones, emplazamientos.' },
  { num: 29, titulo: 'El Registro Civil', desc: 'Estructura. Ley 20/2011. Hechos inscribibles. Expedientes registrales.' },
  { num: 30, titulo: 'Las inscripciones', desc: 'Nacimiento, matrimonio, defunción. Fe pública registral.' },
  { num: 31, titulo: 'Archivo judicial y documentación judicial', desc: 'Organización, conservación y expurgo de documentación judicial.' },

  // Bloque III — Ofimática (6 temas)
  { num: 32, titulo: 'Informática básica', desc: 'Conceptos fundamentales. Hardware y software. Sistemas de información.' },
  { num: 33, titulo: 'El entorno Windows (10 y 11)', desc: 'Escritorio, configuración, gestión de archivos y carpetas.' },
  { num: 34, titulo: 'El explorador de Windows', desc: 'Navegación, búsqueda, organización de archivos. Impresoras y periféricos.' },
  { num: 35, titulo: 'Word 365', desc: 'Edición, formato, estilos, tablas, combinación de correspondencia.' },
  { num: 36, titulo: 'Outlook 365', desc: 'Correo electrónico, calendario, contactos, tareas.' },
  { num: 37, titulo: 'La Red Internet', desc: 'Navegadores, búsqueda, seguridad. Intranet judicial.' },
]

const FAQS = [
  {
    q: '¿Cuántas plazas hay de Tramitación Procesal 2026?',
    a: 'La OEP 2024 ofertó 1.155 plazas para el Cuerpo de Tramitación Procesal y Administrativa (C1). Es uno de los cuerpos de Justicia con mayor volumen de plazas.',
  },
  {
    q: '¿Cómo es el examen de Tramitación Procesal?',
    a: 'Consta de 3 ejercicios tipo test con penalización (1/4): Ej.1 — 100 preguntas en 100 minutos (60 pts máx, 30 mín); Ej.2 — 10 preguntas procesales en 30 minutos (20 pts máx, 10 mín); Ej.3 — 20 preguntas de ofimática en 40 minutos (20 pts máx, 10 mín). Todos penalizan: cada error resta 1/4 del valor del acierto.',
  },
  {
    q: '¿Qué requisitos necesito para presentarme?',
    a: 'Título de Bachillerato, Técnico o equivalente, ser mayor de 18 años y tener nacionalidad española o de la UE. No se exige experiencia previa ni titulación universitaria.',
  },
  {
    q: '¿Cuál es el sueldo de Tramitación Procesal?',
    a: 'Aproximadamente 22.000€ brutos anuales en 14 pagas. A esto se suman trienios, complemento de destino y productividad. Con antigüedad puede superar los 28.000€.',
  },
  {
    q: '¿Cuándo es el examen de Tramitación Procesal 2026?',
    a: 'La convocatoria depende del Ministerio de Justicia. Habitualmente los exámenes de cuerpos de Justicia se celebran en el segundo semestre del año. Pendiente de fecha oficial para 2026.',
  },
  {
    q: '¿En qué se diferencia Tramitación de Auxilio Judicial?',
    a: 'Tramitación Procesal es cuerpo C1 (Bachillerato), con mayor sueldo y responsabilidad. Auxilio Judicial es C2 (ESO). Tramitación exige 37 temas frente a 26 de Auxilio, y tiene 3 ejercicios tipo test (general + procesal + ofimática) frente al ejercicio único de Auxilio.',
  },
]

export default function TramitacionProcesalLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Tramitación Procesal 2026',
        description: 'Tests online con IA para oposiciones de Tramitación Procesal y Administrativa. 37 temas, 3 ejercicios, penalización por errores.',
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
        <Badge variant="secondary" className="text-sm px-4 py-1">
          <Scale className="w-4 h-4 mr-1.5 inline" />
          1.155 plazas · Cuerpo C1
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-indigo-600">Tramitación Procesal</span> 2026
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practica con tests online gratis. 37 temas, 3 ejercicios tipo test con penalización,
          100 + 10 + 20 preguntas. Tu puerta de entrada al Cuerpo C1 de Justicia.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=tramitacion-procesal">
            <Button size="lg" className="gap-2">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Badge variant="outline" className="text-xs">Próximamente — Avísame al lanzar</Badge>
        </div>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen — 3 ejercicios</h2>

        {/* Ejercicio 1: Test */}
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <h3 className="font-bold">Ejercicio 1 — Test (60% de la nota)</h3>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 text-center">
              {[
                { label: '100 preguntas', desc: '+ 4 de reserva' },
                { label: '100 minutos', desc: '60 seg por pregunta' },
                { label: 'Penaliza', desc: 'Error resta 1/4' },
                { label: '60 pts máx / 30 mín', desc: 'Acierto +0,60 pts' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ejercicio 2: Test procesal */}
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              <h3 className="font-bold">Ejercicio 2 — Test procesal (20% de la nota)</h3>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 text-center">
              {[
                { label: '10 preguntas', desc: '+ 2 de reserva' },
                { label: '30 minutos', desc: '3 min por pregunta' },
                { label: 'Penaliza', desc: 'Error resta 1/4' },
                { label: '20 pts máx / 10 mín', desc: 'Acierto +2,00 pts' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ejercicio 3: Test ofimática */}
        <Card className="border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-6 w-6 text-indigo-600" />
              <h3 className="font-bold">Ejercicio 3 — Test ofimática (20% de la nota)</h3>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 text-center">
              {[
                { label: '20 preguntas', desc: '+ 4 de reserva' },
                { label: '40 minutos', desc: '2 min por pregunta' },
                { label: 'Penaliza', desc: 'Error resta 1/4' },
                { label: '20 pts máx / 10 mín', desc: 'Acierto +1,00 pts' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <Gavel className="w-4 h-4 inline mr-1.5" />
            Los 3 ejercicios son tipo test con penalización — cada error resta 1/4 del valor del acierto. Deja en blanco lo que no sepas.
          </p>
        </div>
      </section>

      {/* Temario */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 37 temas</h2>

        <h3 className="text-lg font-semibold text-indigo-600">Bloque I — Derecho constitucional, organización judicial y administrativo (15 temas)</h3>
        <div className="grid gap-3">
          {TEMAS.filter(t => t.num <= 15).map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                {t.num}
              </span>
              <div>
                <p className="font-medium text-sm">{t.titulo}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-indigo-600">Bloque II — Derecho procesal (16 temas)</h3>
        <div className="grid gap-3">
          {TEMAS.filter(t => t.num >= 16 && t.num <= 31).map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                {t.num}
              </span>
              <div>
                <p className="font-medium text-sm">{t.titulo}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-indigo-600">Bloque III — Ofimática (6 temas)</h3>
        <div className="grid gap-3">
          {TEMAS.filter(t => t.num >= 32).map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
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

      {/* Leyes clave */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Leyes clave del temario</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { law: 'Constitución Española 1978', scope: 'Derechos, organización del Estado, Poder Judicial' },
            { law: 'LOPJ + LO 1/2025', scope: 'Organización judicial, competencias, personal' },
            { law: 'LEC (Ley Enjuiciamiento Civil)', scope: 'Juicio ordinario, verbal, ejecución, cautelares' },
            { law: 'LECrim (Ley Enjuiciamiento Criminal)', scope: 'Abreviado, delitos leves, instrucción' },
            { law: 'Ley 15/2015 Jurisdicción Voluntaria', scope: 'Expedientes sin contención' },
            { law: 'LJCA (Ley Contencioso-Administrativa)', scope: 'Recurso contencioso, procedimiento abreviado' },
            { law: 'LRJS (Ley Reguladora Jurisdicción Social)', scope: 'Proceso laboral, conciliación' },
            { law: 'Ley 39/2015 (LPAC)', scope: 'Procedimiento administrativo, recursos' },
            { law: 'Ley 40/2015 (LRJSP)', scope: 'Órganos administrativos, funcionamiento' },
            { law: 'LO 3/2007 + LO 1/2004', scope: 'Igualdad efectiva, violencia de género' },
            { law: 'RGPD + LOPDGDD', scope: 'Protección de datos en Justicia' },
            { law: 'Ley 29/2015 Cooperación Internacional', scope: 'Exhortos, comisiones rogatorias' },
          ].map(({ law, scope }) => (
            <div key={law} className="flex gap-3 items-start p-3 rounded-lg border">
              <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{law}</p>
                <p className="text-xs text-muted-foreground">{scope}</p>
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
            { icon: Sparkles, title: 'Tests con IA', desc: 'Preguntas generadas y verificadas contra la legislación procesal real. LEC, LECrim, LOPJ y más.' },
            { icon: Gavel, title: 'Penalización real', desc: 'Scoring idéntico al examen: los 3 ejercicios penalizan, error resta 1/4 del acierto. Practica con la presión real.' },
            { icon: FileText, title: '199 preguntas oficiales MJU', desc: 'Exámenes reales 2024 y 2025 completos. Practica con las mismas preguntas que puso el tribunal.' },
            { icon: Scale, title: '37 temas cubiertos', desc: 'Todo el temario oficial: derecho constitucional, procesal (civil, penal, laboral, contencioso) y ofimática.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado hasta que apruebes. 20 análisis detallados incluidos.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-indigo-600" />
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
            'Nacionalidad española o de la UE',
            'Mayor de 18 años',
            'Título de Bachillerato, Técnico o equivalente',
            'No haber sido condenado ni separado del servicio de la Administración de Justicia',
          ].map(r => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            <Users className="w-4 h-4 inline mr-1.5" />
            Sueldo aproximado: <strong>~22.000€/año</strong> en 14 pagas (sin contar trienios ni complementos).
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

      {/* Volver al hub de Justicia */}
      <section className="text-center">
        <Link href="/oposiciones/justicia" className="text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
          <ArrowRight className="w-3 h-3 inline mr-1 rotate-180" />
          Ver todas las oposiciones de Justicia
        </Link>
      </section>

      {/* CTA final */}
      <section className="text-center py-8 space-y-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Tramitación Procesal hoy</h2>
        <p className="text-muted-foreground">Gratis, sin tarjeta de crédito, desde el primer tema.</p>
        <Link href="/register?oposicion=tramitacion-procesal">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
