import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, CheckCircle, Clock, Shield,
  ArrowRight, Users, Sparkles, Calculator, AlertTriangle, Brain,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Instituciones Penitenciarias 2026: 900 plazas — Tests gratis | OpoRuta',
  description:
    'Prepara Ayudante de Instituciones Penitenciarias 2026: 900 plazas, 50 temas, examen 160 preguntas con penalización -1/3. Tests online gratis con IA. Temario completo por bloques.',
  keywords: [
    'test instituciones penitenciarias 2026', 'oposiciones prisiones', 'examen penitenciarias online',
    'temario funcionario prisiones', 'ayudante IIPP', 'test prisiones gratis', 'sueldo funcionario prisiones',
  ],
  openGraph: {
    title: 'Oposiciones Instituciones Penitenciarias 2026: 900 plazas | OpoRuta',
    description: 'Tests online gratis para Ayudante de Instituciones Penitenciarias 2026. 900 plazas, 50 temas, 160 preguntas.',
    url: `${APP_URL}/oposiciones/penitenciarias`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Test Instituciones Penitenciarias 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/penitenciarias` },
}

const BLOQUES = [
  {
    nombre: 'Bloque I — Organización del Estado',
    temas: [
      { num: 1, titulo: 'La Constitución Española de 1978', desc: 'Estructura, principios, derechos fundamentales y reforma constitucional.' },
      { num: 2, titulo: 'Las Cortes Generales', desc: 'Congreso, Senado, funciones legislativas y de control.' },
      { num: 3, titulo: 'El Poder Judicial', desc: 'CGPJ, organización judicial, Tribunal Constitucional y Defensor del Pueblo.' },
      { num: 4, titulo: 'El Gobierno', desc: 'Composición, funciones, relaciones con las Cortes.' },
      { num: 5, titulo: 'Organización Territorial del Estado', desc: 'CCAA, provincias, municipios, competencias.' },
      { num: 6, titulo: 'La Unión Europea', desc: 'Instituciones, fuentes del Derecho comunitario, libertades.' },
      { num: 7, titulo: 'Ministerio del Interior y SGIP', desc: 'Estructura orgánica de la SGIP. Organismos Autónomos.' },
      { num: 8, titulo: 'Personal de Instituciones Penitenciarias', desc: 'Cuerpos, escalas y funciones del personal penitenciario.' },
      { num: 9, titulo: 'Régimen jurídico del personal (TREBEP)', desc: 'Derechos, deberes, situaciones administrativas, incompatibilidades.' },
      { num: 10, titulo: 'Acceso al empleo público', desc: 'Sistemas de selección, provisión de puestos, carrera profesional.' },
      { num: 11, titulo: 'Prevención de Riesgos Laborales', desc: 'Obligaciones, evaluación de riesgos, plan de prevención en IIPP.' },
      { num: 12, titulo: 'Fuentes del Derecho Administrativo', desc: 'Jerarquía normativa, ley, reglamento, costumbre.' },
      { num: 13, titulo: 'El acto administrativo', desc: 'Requisitos, eficacia, nulidad y anulabilidad.' },
      { num: 14, titulo: 'Procedimiento administrativo común', desc: 'Ley 39/2015: fases, plazos, recursos.' },
      { num: 15, titulo: 'Gobierno abierto y transparencia', desc: 'Ley 19/2013, derecho de acceso, publicidad activa.' },
      { num: 16, titulo: 'El presupuesto del Estado', desc: 'Elaboración, aprobación, ejecución, control del gasto.' },
      { num: 17, titulo: 'Políticas públicas e igualdad', desc: 'Ley de Igualdad, violencia de género, planes de igualdad.' },
    ],
  },
  {
    nombre: 'Bloque II — Derecho Penal',
    temas: [
      { num: 18, titulo: 'El Derecho Penal', desc: 'Principios, fuentes, ámbito de aplicación del Código Penal.' },
      { num: 19, titulo: 'Las penas', desc: 'Clasificación, duración, reglas de aplicación.' },
      { num: 20, titulo: 'Formas sustitutivas de ejecución', desc: 'Suspensión, sustitución, expulsión.' },
      { num: 21, titulo: 'Suspensión de ejecución', desc: 'Requisitos, condiciones, revocación.' },
      { num: 22, titulo: 'Principales delitos (1)', desc: 'Delitos contra la vida, integridad, libertad sexual.' },
      { num: 23, titulo: 'Delitos contra la libertad', desc: 'Detenciones ilegales, amenazas, coacciones.' },
      { num: 24, titulo: 'Principales delitos (2)', desc: 'Patrimonio, salud pública, seguridad vial.' },
      { num: 25, titulo: 'Delitos de funcionarios públicos', desc: 'Prevaricación, cohecho, malversación, abuso de autoridad.' },
      { num: 26, titulo: 'Responsabilidad civil ex delicto', desc: 'Restitución, reparación, indemnización.' },
      { num: 27, titulo: 'Derecho Procesal Penal', desc: 'Jurisdicción, competencia, fases del proceso penal.' },
    ],
  },
  {
    nombre: 'Bloque III — Derecho Penitenciario',
    temas: [
      { num: 28, titulo: 'Regulación supranacional penitenciaria', desc: 'Reglas mínimas ONU, reglas europeas, CEPT.' },
      { num: 29, titulo: 'El Derecho Penitenciario', desc: 'LOGP, Reglamento Penitenciario, principios rectores.' },
      { num: 30, titulo: 'Relación jurídico-penitenciaria', desc: 'Derechos y deberes de los internos.' },
      { num: 31, titulo: 'Prestaciones de la Admón. Penitenciaria', desc: 'Asistencia sanitaria, religiosa, social, educativa.' },
      { num: 32, titulo: 'Régimen Penitenciario (1)', desc: 'Régimen ordinario, abierto y cerrado.' },
      { num: 33, titulo: 'Régimen Penitenciario (2): seguridad', desc: 'Seguridad exterior, interior, cacheos, recuentos.' },
      { num: 34, titulo: 'Clasificación de establecimientos', desc: 'Tipos de establecimientos. Régimen ordinario.' },
      { num: 35, titulo: 'Régimen cerrado y régimen abierto', desc: 'Objetivos y criterios de aplicación.' },
      { num: 36, titulo: 'Tratamiento penitenciario (1)', desc: 'Concepto, fines, principios. Clasificación en grados. Programas. Permisos de salida.' },
      { num: 37, titulo: 'Tratamiento penitenciario (2)', desc: 'Actividades educativas, culturales, deportivas. Formación, trabajo y empleo.' },
      { num: 38, titulo: 'La relación laboral penitenciaria', desc: 'Tipos de trabajo productivo y ocupacional.' },
      { num: 39, titulo: 'Los permisos de salida', desc: 'Ordinarios y extraordinarios. Duración y requisitos.' },
      { num: 40, titulo: 'Libertad y excarcelación', desc: 'Libertad condicional. Suspensión de ejecución.' },
      { num: 41, titulo: 'Formas especiales de ejecución', desc: 'Jóvenes, madres, CIS, unidades dependientes.' },
      { num: 42, titulo: 'El régimen disciplinario', desc: 'Faltas, sanciones, ejecución y cancelación.' },
      { num: 43, titulo: 'Juez de Vigilancia Penitenciaria', desc: 'Control de la actividad penitenciaria.' },
      { num: 44, titulo: 'Modelo organizativo penitenciario', desc: 'Órganos colegiados y unipersonales.' },
      { num: 45, titulo: 'Régimen administrativo (1)', desc: 'Oficina de gestión. Expediente personal del interno.' },
      { num: 46, titulo: 'Régimen administrativo (2)', desc: 'Servicio interior. Funcionamiento administrativo.' },
      { num: 47, titulo: 'Régimen económico', desc: 'Contabilidad general. Presupuesto. Peculio.' },
    ],
  },
  {
    nombre: 'Bloque IV — Conducta Humana',
    temas: [
      { num: 48, titulo: 'Conducta humana', desc: 'Psicología básica, personalidad, motivación, aprendizaje.' },
      { num: 49, titulo: 'Organización social de la prisión', desc: 'Subculturas carcelarias, código del preso, liderazgo.' },
      { num: 50, titulo: 'Comportamiento social y conducta adictiva', desc: 'Habilidades sociales, drogodependencias, intervención.' },
    ],
  },
]

export default function PenitenciariasLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Instituciones Penitenciarias 2026',
        description: 'Tests online con IA para oposiciones de Ayudante de Instituciones Penitenciarias. 50 temas, 160 preguntas, penalización -1/3.',
        provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Cuántas plazas hay en Instituciones Penitenciarias?', acceptedAnswer: { '@type': 'Answer', text: '900 plazas (OEP 2025). Histórico: 800 (2024), 756 (2023). Se esperan ~800 para 2026.' } },
          { '@type': 'Question', name: '¿Cómo es el examen de Instituciones Penitenciarias?', acceptedAnswer: { '@type': 'Answer', text: '2 ejercicios tipo test: 120 preguntas de todo el temario + 8 supuestos × 5 preguntas = 40. Después, reconocimiento médico (Apto/No apto).' } },
          { '@type': 'Question', name: '¿Cuándo es el examen de Instituciones Penitenciarias?', acceptedAnswer: { '@type': 'Answer', text: 'Convocatoria anual. El último fue enero 2026. La próxima se espera para enero 2027.' } },
          { '@type': 'Question', name: '¿Qué bloque pesa más en el examen?', acceptedAnswer: { '@type': 'Answer', text: 'Derecho Penitenciario (temas 28-47) representa ~36% de las preguntas, seguido de Organización del Estado (~35%), Derecho Penal (~20%) y Conducta Humana (~9%).' } },
        ],
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
          <Shield className="w-4 h-4 mr-1.5 inline" />
          900 plazas · Penalización -1/3
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-rose-600">Instituciones Penitenciarias</span> 2026
        </h1>
        <p className="text-sm text-muted-foreground">Actualizado: abril 2026</p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practica con tests online gratis. 50 temas en 4 bloques, 120 + 40 preguntas tipo test en 2 ejercicios.
          El Derecho Penitenciario es el bloque más preguntado (~36%).
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=penitenciarias">
            <Button size="lg" className="gap-2">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/precios">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted transition-colors">
              49,99€ pago único — Ver precios
            </Badge>
          </Link>
        </div>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: '120 preguntas test', desc: 'Ej. 1 — todo el temario' },
            { icon: Calculator, label: '40 preguntas supuestos', desc: 'Ej. 2 — 8 supuestos × 5 preguntas' },
            { icon: AlertTriangle, label: 'Penalización -1/3', desc: 'En ambos ejercicios' },
            { icon: CheckCircle, label: 'Aptitud médica', desc: 'Ej. 3 — Apto/No apto' },
          ].map(({ icon: Icon, label, desc }) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center space-y-2">
                <Icon className="h-8 w-8 text-rose-600 mx-auto" />
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Penalización -1/3 — responde solo si puedes descartar al menos 2 opciones.
          </p>
        </div>
      </section>

      {/* Temario */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 50 temas</h2>
        {BLOQUES.map(bloque => (
          <div key={bloque.nombre} className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-600">{bloque.nombre}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {bloque.temas.map(t => (
                <div key={t.num} className="flex gap-3 items-start p-2.5 rounded-lg border">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-full w-7 h-7 flex items-center justify-center shrink-0">
                    {t.num}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Cómo te ayuda OpoRuta */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">¿Cómo te ayuda OpoRuta?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Sparkles, title: 'Tests con IA', desc: 'Preguntas verificadas contra LOGP, Reglamento Penitenciario y Código Penal.' },
            { icon: BookOpen, title: '160 preguntas test', desc: '120 cuestionario + 40 supuestos prácticos. Ambos tipo test.' },
            { icon: Brain, title: 'Conducta Humana', desc: 'Bloque IV incluido: psicología penitenciaria, subculturas, HHSS.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado. 20 créditos IA.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-rose-600" />
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
            'Nacionalidad española',
            'Bachillerato, Técnico FP o equivalente',
            'No haber sido condenado por delito doloso >3 años',
            'Sin exclusiones médicas (Anexo III convocatoria)',
          ].map(r => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ visual */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuántas plazas hay?', a: '900 plazas (OEP 2025). Histórico: 800 (2024), 756 (2023). Se esperan ~800 para 2026.' },
            { q: '¿Cómo es el examen?', a: '2 ejercicios tipo test: 120 preguntas de todo el temario + 8 supuestos × 5 preguntas = 40. Después, reconocimiento médico (Apto/No apto).' },
            { q: '¿Cuándo es el examen?', a: 'Convocatoria anual. El último fue enero 2026. La próxima se espera para enero 2027.' },
            { q: '¿Qué bloque pesa más?', a: 'Derecho Penitenciario (temas 28-47) representa ~36% de las preguntas, seguido de Organización del Estado (~35%), Derecho Penal (~20%) y Conducta Humana (~9%).' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-8 space-y-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Penitenciarias hoy</h2>
        <p className="text-muted-foreground">Gratis, sin tarjeta de crédito, desde el primer tema.</p>
        <Link href="/register?oposicion=penitenciarias">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
