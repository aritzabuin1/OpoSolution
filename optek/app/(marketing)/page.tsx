import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  Zap,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  MessageCircleQuestion,
  BookOpen,
  GraduationCap,
  Flame,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react'
import { JsonLd } from '@/components/shared/JsonLd'
import { RoadHero } from '@/components/marketing/RoadHero'
import { ExamCountdown } from '@/components/marketing/ExamCountdown'
import { blogPosts } from '@/content/blog/posts'
import { AIAnalysisDemo } from '@/components/marketing/AIAnalysisDemo'
import { SocialProofCounter } from '@/components/marketing/SocialProofCounter'
// WaitlistForm removed — all ramas are now active

const APP_URL_META = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const metadata: Metadata = {
  title: 'OpoRuta — Oposiciones con IA: AGE, Correos y Justicia',
  description:
    'Plataforma de preparación para oposiciones con IA: AGE (Auxiliar C2, Administrativo C1, Gestión A2), Correos y Justicia (Auxilio, Tramitación, Gestión Procesal). Tests verificados, simulacros oficiales y Radar del Tribunal. 10.000+ plazas. Desde 0€.',
  keywords: [
    'oposiciones administracion general estado 2026',
    'oposiciones auxiliar administrativo 2026',
    'oposiciones administrativo estado C1',
    'preparar auxiliar administrativo estado',
    'test oposiciones online IA',
    'simulacro INAP auxiliar administrativo',
    'oposiciones correos 2026',
    'test correos online gratis',
    'oposiciones justicia 2026',
    'oposiciones auxilio judicial',
    'oposiciones tramitacion procesal',
    'IA oposiciones',
  ],
  openGraph: {
    title: 'OpoRuta — Oposiciones con IA: AGE, Correos y Justicia',
    description:
      'Tests verificados, simulacros oficiales, Radar del Tribunal y supuesto práctico con IA. AGE + Correos + Justicia. 10.000+ plazas. Empieza gratis.',
    type: 'website',
    url: APP_URL_META,
    images: [{ url: `${APP_URL_META}/api/og?tipo=blog&tema=${encodeURIComponent('OpoRuta — El camino más corto hacia el aprobado')}`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: APP_URL_META,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpoRuta — Oposiciones con IA: AGE, Correos y Justicia',
    description: 'Tests verificados, simulacros oficiales, Radar del Tribunal y supuesto práctico con IA. AGE + Correos + Justicia. Empieza gratis.',
  },
}

// ─── Datos estáticos ───────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: XCircle,
    title: 'Estudias de todo... sin saber qué cae de verdad',
    desc: 'El tribunal repite los mismos artículos convocatoria tras convocatoria. Sin datos históricos, distribuyes tu tiempo a ciegas.',
  },
  {
    icon: XCircle,
    title: 'La IA te cita artículos que no existen',
    desc: 'ChatGPT y similares inventan referencias legales. Estudiar con eso es peor que sin nada: aprendes mal y con confianza equivocada.',
  },
  {
    icon: XCircle,
    title: 'Llevas meses estudiando sin saber si mejoras',
    desc: 'Sin métricas reales, no puedes distinguir las horas que te acercan al aprobado de las que simplemente acumulas.',
  },
]

const steps = [
  {
    num: '01',
    icon: TrendingUp,
    title: 'Descubre qué pregunta el tribunal',
    desc: 'El Radar del Tribunal analiza exámenes INAP históricos (2019–2024) y te muestra qué artículos aparecen más. No estudies a ciegas.',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Practica con citas verificadas',
    desc: 'OpoRuta genera tests desde la legislación oficial. Cada artículo comprobado antes de llegar a ti. Sin inventos, sin alucinaciones.',
  },
  {
    num: '03',
    icon: MessageCircleQuestion,
    title: 'Entiende por qué fallaste',
    desc: 'Cuando fallas, la IA no te da la respuesta: te hace la pregunta correcta para que llegues tú. Así el artículo se queda grabado.',
  },
  {
    num: '04',
    icon: Zap,
    title: 'Ve cuánto has avanzado',
    desc: 'Tu dashboard mide tu progreso real: avance por tema, rachas, artículos débiles y si estás listo para el examen.',
  },
]

const differentiators = [
  {
    title: 'Verificación determinista',
    desc: 'Cada cita legal generada por la IA se valida contra la base de datos de legislación oficial antes de mostrártela. Si alucina, se descarta y regenera automáticamente.',
  },
  {
    title: 'Radar del Tribunal',
    desc: 'Análisis de frecuencias sobre exámenes INAP reales (2019–2024). Sabe exactamente qué artículos pregunta el tribunal y prioriza tu estudio.',
  },
  {
    title: 'Corrección que enseña',
    desc: 'Cuando fallas, la IA no te suelta la respuesta: te guía con preguntas para que descubras el artículo correcto tú mismo. Aprendes de verdad, no de memoria.',
  },
  {
    title: 'BOE Watcher activo',
    desc: 'Monitorizamos el BOE. Cuando cambia un artículo de tu temario, te alertamos para que nunca estudies legislación desactualizada.',
  },
]

// Pricing plans removed from landing — now at /precios with tabs per rama

const faqs = [
  {
    q: '¿Los artículos legales que aparecen son exactos?',
    a: 'Sí. OpoRuta usa verificación determinista: cada cita legal generada por la IA se valida contra nuestra base de datos de legislación oficial antes de mostrártela. Si la cita no existe o es incorrecta, el sistema lo detecta y corrige automáticamente.',
  },
  {
    q: '¿Para qué oposiciones funciona ahora mismo?',
    a: 'OpoRuta cubre 7 oposiciones en 3 ramas: Administración del Estado (C2, C1, A2 con 28, 45 y 58 temas), Correos (12 temas, sin penalización, 4.055 plazas) y Justicia (Auxilio Judicial, Tramitación Procesal, Gestión Procesal). Total: más de 10.000 plazas.',
  },
  {
    q: '¿Qué pasa cuando agoto mis créditos IA?',
    a: 'Puedes recargar créditos IA desde 9,99€ (+10 créditos) directamente desde tu panel, sin necesidad de contratar nada nuevo. Los tests de tipo test siguen siendo ilimitados — los créditos IA son el único recurso limitado.',
  },
  {
    q: '¿La IA puede equivocarse?',
    a: 'Como cualquier modelo de IA, puede cometer errores en la redacción. Por eso tenemos el motor de verificación determinista: valida cada cita legal con código, no con más IA. Es nuestra garantía frente a las alucinaciones.',
  },
  {
    q: '¿Qué incluye exactamente el plan gratuito?',
    a: 'El plan gratuito incluye 1 test gratuito en cada tema (Constitución, LPAC, TREBEP y todos los demás), 1 simulacro oficial, 3 psicotécnicos y 2 sesiones gratis con tu Tutor IA. No necesitas tarjeta de crédito para empezar.',
  },
  {
    q: '¿Con qué frecuencia se actualiza la legislación?',
    a: 'Monitorizamos el BOE automáticamente. Cuando se publica un cambio en la legislación relevante para tu oposición, actualizamos el contenido y te notificamos para que repases los artículos modificados.',
  },
  {
    q: '¿OpoRuta sirve para Correos?',
    a: 'Sí. Correos tiene 12 temas, 100 preguntas tipo test sin penalización y más de 4.000 plazas. OpoRuta incluye tests ilimitados, psicotécnicos y simulacros con preguntas reales. Pack Correos: 49,99€ pago único.',
  },
  {
    q: '¿Puedo preparar Auxilio Judicial o Tramitación con OpoRuta?',
    a: 'Sí. OpoRuta cubre las 3 oposiciones de Justicia: Auxilio Judicial (26 temas, C2), Tramitación Procesal (37 temas + ofimática, C1) y Gestión Procesal (68 temas + desarrollo escrito, A2). Legislación actualizada con la LO 1/2025 y exámenes MJU reales.',
  },
  {
    q: '¿Se puede preparar la oposición por libre, sin academia?',
    a: 'Sí. OpoRuta está diseñado para preparar por libre: tests con legislación verificada, simulacros con preguntas oficiales, Tutor IA que te explica cada error y Radar del Tribunal para saber qué cae más. Funciona para AGE, Correos y Justicia.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Empieza gratis (1 test por tema + simulacro + 2 sesiones Tutor IA). Packs desde 49,99€ pago único, sin suscripción. Cada rama tiene sus packs — consulta la página de precios para ver el tuyo.',
  },
]


// ─── JSON-LD (FAQPage + WebSite) ───────────────────────────────────────────────

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuándo son las oposiciones al Cuerpo Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las oposiciones al Cuerpo General Auxiliar de la Administración del Estado se convocan periódicamente por el Ministerio de Hacienda. Consulta el BOE y la web del INAP para las últimas convocatorias. OpoRuta te notifica automáticamente de cambios legislativos relevantes para prepararte siempre con el contenido actualizado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántos temas tiene el temario del Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El temario del Auxiliar Administrativo del Estado (C2) consta de 28 temas en dos bloques: Bloque I — Organización pública (16 temas: CE, LPAC, TREBEP, LOPDGDD, UE, Presupuestos, Igualdad...) y Bloque II — Actividad administrativa y ofimática (12 temas: atención al público, Windows 11, Word 365, Excel 365, Access 365, Outlook 365, Internet). OpoRuta cubre los 28 temas completos con preguntas verificadas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántos temas tiene el temario del Administrativo del Estado (C1)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El temario del Administrativo del Estado (C1) consta de 45 temas en dos bloques: Bloque I — Organización del Estado y Derecho Administrativo (37 temas: CE, LOPJ, Gobierno, Transparencia, LRJSP, LBRL, UE, LPAC, LCSP, TREBEP, LGSS, LGP, Igualdad...) y Bloque II — Informática y Ofimática (8 temas). OpoRuta cubre los 45 temas con legislación verificada y exámenes INAP reales (2019-2024).',
      },
    },
    {
      '@type': 'Question',
      name: '¿En qué consiste el examen de Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El proceso selectivo del Auxiliar Administrativo del Estado es de concurso-oposición (RD 651/2025, 1.700 plazas). El examen consta de un ejercicio único con 100 preguntas tipo test puntuables (más 10 de reserva por si se anula alguna) en 90 minutos, con penalización -1/3. Se divide en dos partes obligatorias y eliminatorias: Primera parte (máx. 60 preguntas) — 30 de teoría (Bloque I) + 30 psicotécnicas; Segunda parte (máx. 50 preguntas) — Informática y Ofimática (Bloque II: Windows 11, Word 365, Excel 365, Access 365, Outlook 365). Cada parte se califica de 0 a 50 puntos, con un mínimo de 25 puntos por parte para superar. OpoRuta simula este formato exacto.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué leyes hay que estudiar para el Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las principales leyes del Bloque I son: Constitución Española, Ley 39/2015 (LPAC), Ley 40/2015 (LRJSP), RDL 5/2015 TREBEP, LO 3/2018 LOPDGDD, Ley 19/2013 de Transparencia, LO 3/2007 de Igualdad, LO 1/2004 de Violencia de Género, Ley Orgánica 4/2023 LGTBI, Ley 47/2003 General Presupuestaria y otras. OpoRuta genera preguntas con verificación determinista sobre todos estos textos legales.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo funciona la penalización en el examen del Auxiliar Administrativo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En el examen oficial del Auxiliar Administrativo del Estado, la fórmula de puntuación es: respuesta correcta = +1 punto, respuesta incorrecta = -1/3 punto, respuesta en blanco = 0 puntos. Es importante dejar en blanco las preguntas que no se saben con seguridad. OpoRuta aplica esta penalización exacta en sus simulacros para que practiques en condiciones reales.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Los artículos legales que aparecen en OpoRuta son exactos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. OpoRuta usa verificación determinista: cada cita legal generada por la IA se valida contra la base de datos de legislación oficial antes de mostrártela. Si la cita no existe o es incorrecta, el sistema lo detecta y corrige automáticamente. Sin alucinaciones ni artículos inventados.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es la nota de corte del Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La nota de corte de la última convocatoria del Auxiliar Administrativo del Estado (C2) fue de 30 puntos en la primera parte (teoría + psicotécnicos) y 26,33 puntos en la segunda parte (ofimática), sobre un máximo de 50 puntos por parte. Cada parte es eliminatoria con un mínimo de 25 puntos. OpoRuta incluye una calculadora gratuita para simular tu nota con la penalización -1/3.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuántas plazas hay en la convocatoria de Auxiliar Administrativo del Estado 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La convocatoria 2025-2026 ofrece 1.700 plazas de acceso libre para el Cuerpo General Auxiliar de la Administración del Estado (C2), publicadas en el BOE del 22 de diciembre de 2025 (RD 651/2025). Es la mayor oferta histórica para esta oposición. El examen está previsto para mayo-junio de 2026.',
      },
    },
    {
      '@type': 'Question',
      name: '¿OpoRuta sirve para oposiciones de Correos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. OpoRuta cubre las oposiciones de Correos (Personal Laboral Fijo, Grupo IV) con 12 temas completos, 100 preguntas tipo test sin penalización, psicotécnicos y simulacros con preguntas de convocatorias anteriores. Más de 4.000 plazas. Pack Correos: 49,99€ pago único.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo preparar Auxilio Judicial o Tramitación Procesal con OpoRuta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. OpoRuta cubre las 3 oposiciones de Justicia del MJU: Auxilio Judicial (C2, 26 temas, 2 ejercicios), Tramitación Procesal (C1, 37 temas, 3 ejercicios incluyendo ofimática) y Gestión Procesal (A2, 68 temas, 3 ejercicios con desarrollo escrito corregido por IA). Legislación actualizada con la LO 1/2025. Más de 2.300 plazas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta OpoRuta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empieza gratis: 1 test por tema, 1 simulacro oficial y 2 sesiones con el Tutor IA. Packs desde 49,99€ pago único (sin suscripción) para AGE, Correos o Justicia. Packs dobles y triples con descuento. Recarga de créditos IA desde 9,99€.',
      },
    },
  ],
}

// §2.17.4-5 Organization + WebSite → inyectados globalmente en app/layout.tsx

// SoftwareApplication schema — rich snippet para Google
const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpoRuta',
  description: 'Plataforma de preparación de oposiciones AGE (C2 Auxiliar + C1 Administrativo + A2 Gestión GACE) con IA verificada y corrección de supuesto práctico.',
  url: APP_URL_META,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: 'es',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      name: 'Plan Gratuito',
      description: '1 test gratuito en cada tema, todos los temas de tu oposición',
    },
    {
      '@type': 'Offer',
      price: '49.99',
      priceCurrency: 'EUR',
      name: 'Pack C2 o C1',
      description: 'Tests ilimitados en Auxiliar (C2) o Administrativo (C1), simulacros ilimitados, 20 créditos IA',
    },
    {
      '@type': 'Offer',
      price: '69.99',
      priceCurrency: 'EUR',
      name: 'Pack Gestión del Estado A2',
      description: 'Tests ilimitados A2 GACE (58 temas), 20 créditos IA, 5 supuestos prácticos con corrección IA',
    },
    {
      '@type': 'Offer',
      price: '79.99',
      priceCurrency: 'EUR',
      name: 'Pack Doble (C2+C1)',
      description: 'Acceso completo a C1 y C2, simulacros ilimitados, 30 créditos IA',
    },
    {
      '@type': 'Offer',
      price: '129.99',
      priceCurrency: 'EUR',
      name: 'Pack Triple AGE (C2+C1+A2)',
      description: 'Las 3 oposiciones AGE completas, 40 créditos IA, 5 supuestos prácticos IA',
    },
  ],
  educationalUse: 'Practice',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'Student',
    audienceType: 'Opositores AGE (C2 Auxiliar + C1 Administrativo + A2 Gestión del Estado GACE)',
  },
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {

  return (
    <>
      {/* §2.17.3 — FAQPage schema (People Also Ask en Google) */}
      <JsonLd data={jsonLdFaq} />
      {/* SoftwareApplication schema (app rich snippet) */}
      <JsonLd data={jsonLdApp} />

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1">
            AGE · Correos · Justicia — 10.000+ plazas en 7 oposiciones
          </Badge>

          <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl leading-tight">
            Aprueba tu oposición.
            <br />
            <span className="text-primary">Entrena con lo que pregunta el tribunal.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Prepara AGE (C2, C1, A2), Correos o Justicia (Auxilio, Tramitación, Gestión Procesal)
            con tests verificados por IA y cada cita legal comprobada al artículo exacto.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Empezar gratis — sin tarjeta
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#como-funciona">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver cómo funciona
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Todos los temas gratis · Sin tarjeta · Sin suscripción
          </p>

          {/* Social proof — Cialdini's principle */}
          <SocialProofCounter />

          {/* Ilustración animada: el camino del opositor */}
          <RoadHero />
        </div>
      </section>

      {/* ─── Elige tu oposición — Multi-rama hub ────────────────────── */}
      <section aria-labelledby="oposiciones-heading" className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Oposiciones con IA verificada
            </Badge>
            <h2 id="oposiciones-heading" className="text-3xl font-bold tracking-tight">
              ¿Qué oposición preparas?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Elige tu rama. Contenido específico, legislación verificada y exámenes reales para cada oposición.
            </p>
          </div>

          {/* 3 Rama Cards */}
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto mb-4">
            {/* AGE Hub Card */}
            <Link href="/oposiciones/administracion" className="group">
              <Card className="h-full relative overflow-hidden border-blue-300/50 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-background ring-1 ring-blue-200/50 dark:ring-blue-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/30">
                      <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge className="bg-blue-600 text-white text-[11px]">4.200+ plazas</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">Administración del Estado</CardTitle>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mt-1">INAP · C2, C1, A2</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Auxiliar Administrativo (C2) — 28 temas</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Administrativo del Estado (C1) — 45 temas</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Gestión GACE (A2) — 58 temas + desarrollo escrito</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">Simulacros INAP 2018–2024. Legislación BOE verificada.</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 group-hover:translate-y-[-1px] transition-transform">
                    Ver oposiciones AGE <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            {/* Correos Hub Card */}
            <Link href="/oposiciones/correos" className="group">
              <Card className="h-full relative overflow-hidden border-orange-300/50 shadow-lg hover:shadow-xl hover:border-orange-400 transition-all duration-300 bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-background ring-1 ring-orange-200/50 dark:ring-orange-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-400/30">
                      <Flame className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                    </div>
                    <Badge className="bg-orange-600 text-white text-[11px]">4.055 plazas</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-orange-900 dark:text-orange-100">Correos</CardTitle>
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mt-1">Personal Laboral — Grupo IV</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-orange-600 shrink-0" /> 12 temas completos</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-orange-600 shrink-0" /> Sin penalización por error</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-orange-600 shrink-0" /> Psicotécnicos incluidos</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">Tests ilimitados desde 49,99€ (pago único).</p>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 group-hover:translate-y-[-1px] transition-transform">
                    Ver oposición Correos <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Justicia Hub Card */}
            <Link href="/oposiciones/justicia" className="group">
              <Card className="h-full relative overflow-hidden border-violet-300/50 shadow-lg hover:shadow-xl hover:border-violet-400 transition-all duration-300 bg-gradient-to-br from-violet-50 dark:from-violet-950/20 to-background ring-1 ring-violet-200/50 dark:ring-violet-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/30">
                      <GraduationCap className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                    </div>
                    <Badge className="bg-violet-600 text-white text-[11px]">2.300+ plazas</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-violet-900 dark:text-violet-100">Justicia</CardTitle>
                  <p className="text-sm text-violet-700 dark:text-violet-300 font-medium mt-1">MJU — Auxilio, Tramitación, Gestión</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-violet-600 shrink-0" /> Auxilio Judicial (C2) — 26 temas</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-violet-600 shrink-0" /> Tramitación Procesal (C1) — 37 temas</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-violet-600 shrink-0" /> Gestión Procesal (A2) — 68 temas</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">Legislación LO 1/2025. Exámenes MJU con penalización real.</p>
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 group-hover:translate-y-[-1px] transition-transform">
                    Ver oposiciones Justicia <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pain points ─────────────────────────────────────────────── */}
      <section aria-labelledby="pain-points-heading" className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 id="pain-points-heading" className="text-3xl font-bold tracking-tight">
              ¿Te suena alguna de estas situaciones?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              La mayoría de opositores las tienen. Y son solucionables.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {painPoints.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                  <Icon className="h-8 w-8 text-destructive mb-4" />
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────── */}
      <section id="como-funciona" aria-labelledby="como-funciona-heading" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Cómo funciona
            </Badge>
            <h2 id="como-funciona-heading" className="text-3xl font-bold tracking-tight">
              Tu ruta al aprobado,{' '}
              <span className="text-primary">paso a paso.</span>
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="relative text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary flex items-center justify-center hidden md:flex">
                  <span className="text-[10px] font-bold text-primary-foreground">{num}</span>
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Analysis Demo — Antes/Después ─────────────────────────── */}
      <section aria-labelledby="demo-heading" className="py-20 bg-muted/30 border-y">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">La diferencia</Badge>
            <h2 id="demo-heading" className="text-3xl font-bold tracking-tight">
              Otras apps te dicen que fallaste.{' '}
              <span className="text-primary">OpoRuta te dice por qué y cómo evitarlo.</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Mira qué pasa cuando fallas una pregunta sobre el Art. 14 de la Ley 39/2015:
            </p>
          </div>
          <AIAnalysisDemo variant="landing" />
          <div className="text-center mt-10">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Pruébalo con tus errores — 2 sesiones gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Differentiator ──────────────────────────────────────────── */}
      <section aria-labelledby="trust-heading" className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 id="trust-heading" className="text-3xl font-bold tracking-tight">
              Estudia con una fuente{' '}
              <span className="opacity-80">en la que puedas confiar.</span>
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
              La IA nunca te cita un artículo sin haberlo encontrado en la legislación oficial.
              Si alucina, lo descartamos antes de que te llegue.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map(({ title, desc }) => (
              <div key={title} className="rounded-xl bg-white/10 p-6">
                <CheckCircle className="h-6 w-6 mb-3 opacity-80" />
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-primary-foreground/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Exámenes oficiales — multi-rama SEO ─────────────────────── */}
      <section className="py-12 bg-muted/20 border-y">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-6">
            Practica con exámenes oficiales reales — preguntas de convocatorias anteriores
          </p>
          <div className="grid gap-6 sm:grid-cols-3 mb-6">
            {/* AGE */}
            <div className="space-y-2">
              <Link href="/oposiciones/administracion" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors block">
                Administración del Estado
              </Link>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { href: '/examenes-oficiales/inap-2024', label: 'C2 2024' },
                  { href: '/examenes-oficiales/inap-2022', label: 'C2 2022' },
                  { href: '/examenes-oficiales/inap-c1-2024', label: 'C1 2024' },
                  { href: '/examenes-oficiales/inap-c1-2022', label: 'C1 2022' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}>
                    <Badge variant="outline" className="text-xs px-2.5 py-1 hover:bg-accent transition-colors cursor-pointer">
                      {label}
                    </Badge>
                  </Link>
                ))}
              </div>
              <Link href="/oposiciones/administracion" className="text-xs text-primary hover:underline block mt-1">
                Ver oposiciones AGE →
              </Link>
            </div>
            {/* Justicia */}
            <div className="space-y-2">
              <Link href="/oposiciones/justicia" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors">
                Justicia
              </Link>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { href: '/oposiciones/justicia/auxilio-judicial', label: 'Auxilio 2025' },
                  { href: '/oposiciones/justicia/tramitacion-procesal', label: 'Tramit. 2025' },
                  { href: '/oposiciones/justicia/gestion-procesal', label: 'Gestión 2025' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}>
                    <Badge variant="outline" className="text-xs px-2.5 py-1 hover:bg-accent transition-colors cursor-pointer">
                      {label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
            {/* Correos */}
            <div className="space-y-2">
              <Link href="/oposiciones/correos" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-primary transition-colors">
                Correos
              </Link>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { href: '/oposiciones/correos', label: 'REP 2023' },
                  { href: '/oposiciones/correos', label: 'ATC 2023' },
                ].map(({ href, label }, i) => (
                  <Link key={`correos-${i}`} href={href}>
                    <Badge variant="outline" className="text-xs px-2.5 py-1 hover:bg-accent transition-colors cursor-pointer">
                      {label}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/examenes-oficiales" className="text-sm text-primary hover:underline">
            Ver todos los simulacros oficiales →
          </Link>
        </div>
      </section>

      {/* ─── Pricing — Visual con mini-cards por rama ────────────────── */}
      <section id="precios" aria-labelledby="pricing-heading" className="py-20 bg-gradient-to-b from-muted/40 via-primary/5 to-muted/40 border-y">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">Precios</Badge>
            <h2 id="pricing-heading" className="text-3xl font-bold tracking-tight">
              Empieza gratis. Paga solo por lo que necesitas.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Sin permanencias. Sin suscripción. Pago único — acceso para siempre.
            </p>
          </div>

          {/* 3 mini price cards */}
          <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto mb-10">
            {/* AGE */}
            <div className="relative rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Administración del Estado</p>
              <p className="text-sm text-muted-foreground">C2, C1 o A2</p>
              <p className="text-3xl font-bold text-blue-700">desde 49,99€</p>
              <p className="text-xs text-muted-foreground">pago único · acceso ilimitado</p>
            </div>
            {/* Correos */}
            <div className="relative rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Correos</p>
              <p className="text-sm text-muted-foreground">Grupo IV</p>
              <p className="text-3xl font-bold text-orange-700">49,99€</p>
              <p className="text-xs text-muted-foreground">pago único · acceso ilimitado</p>
            </div>
            {/* Justicia */}
            <div className="relative rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-background p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Justicia</p>
              <p className="text-sm text-muted-foreground">Auxilio, Tramitación o Gestión</p>
              <p className="text-3xl font-bold text-violet-700">desde 49,99€</p>
              <p className="text-xs text-muted-foreground">pago único · acceso ilimitado</p>
            </div>
          </div>

          {/* CTA + extras */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/precios">
                <Button size="lg" className="gap-2 px-8 shadow-md">
                  Ver todos los precios y packs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  Empezar gratis — sin tarjeta
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Todos los temas gratis · Packs dobles y triples con descuento · Recarga créditos IA desde 9,99€
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" aria-labelledby="faq-heading" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 id="faq-heading" className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-lg border bg-card px-5 py-4 cursor-pointer"
              >
                <summary className="flex items-center justify-between font-medium text-sm list-none select-none">
                  {q}
                  <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/preguntas-frecuentes" className="text-sm text-primary hover:underline">
              Ver todas las preguntas frecuentes →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Blog snippets ────────────────────────────────────────────── */}
      <section aria-labelledby="blog-heading" className="py-16 border-t">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 id="blog-heading" className="text-2xl font-bold tracking-tight">Guías para opositores</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Artículos prácticos escritos por expertos en oposiciones
              </p>
            </div>
            <Link href="/blog" className="text-sm text-primary hover:underline hidden sm:block">
              Ver todas las guías →
            </Link>
          </div>

          {/* ── Administrativo del Estado (C1) ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Administrativo del Estado (C1)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'ultimos-60-dias-administrativo-estado-c1-plan-estudio',
              'temario-administrativo-estado-c1-45-temas-como-priorizar',
              'supuesto-practico-administrativo-estado-c1-estrategia',
            ].map((slug) => blogPosts.find((p) => p.slug === slug)).filter((p): p is typeof blogPosts[0] => !!p)).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.keywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ── Gestión del Estado GACE (A2) ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3 mt-6">Gestión del Estado — GACE (A2) · Nuevo</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'oposiciones-gestion-estado-gace-a2-2026-plazas-temario-fechas',
              'supuesto-practico-gace-que-es-como-se-evalua-como-prepararlo',
              'oporuta-vs-opositatest-vs-academias-comparativa-gace-a2',
            ].map((slug) => blogPosts.find((p) => p.slug === slug)).filter((p): p is typeof blogPosts[0] => !!p)).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full hover:border-emerald-400/40 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.keywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-emerald-600 transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ── Auxiliar Administrativo (C2) ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-6">Auxiliar Administrativo (C2)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'mejores-plataformas-ia-oposiciones-2026-comparativa',
              'como-preparar-oposicion-auxiliar-administrativo-estado-guia',
              'penalizacion-examen-auxiliar-administrativo',
            ].map((slug) => blogPosts.find((p) => p.slug === slug)).filter((p): p is typeof blogPosts[0] => !!p)).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.keywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ── Correos ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-3 mt-6">Correos</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'test-correos-online-gratis',
              'temario-correos-2026-temas',
              'psicotecnicos-correos-2026-tipos-ejemplos-practica',
            ].map((slug) => blogPosts.find((p) => p.slug === slug)).filter((p): p is typeof blogPosts[0] => !!p)).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full hover:border-orange-400/40 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.keywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-orange-600 transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* ── Justicia ── */}
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-3 mt-6">Justicia</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'auxilio-judicial-vs-tramitacion-procesal',
              'guia-auxilio-judicial-2026',
              'guia-tramitacion-procesal-2026',
            ].map((slug) => blogPosts.find((p) => p.slug === slug)).filter((p): p is typeof blogPosts[0] => !!p)).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full hover:border-violet-400/40 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.keywords.slice(0, 2).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-snug group-hover:text-violet-600 transition-colors line-clamp-3">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-4 text-center sm:hidden">
            <Link href="/blog" className="text-sm text-primary hover:underline">
              Ver todas las guías →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonio real ─────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <div className="relative inline-block">
            <div className="absolute -top-3 -left-3 text-5xl text-primary/20 font-serif">&ldquo;</div>
            <blockquote className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed italic px-8">
              Me ha gustado mucho la forma que tenéis de preguntar y todos los porcentajes para saber la evolución. Estoy muy contenta.
            </blockquote>
            <div className="absolute -bottom-3 -right-3 text-5xl text-primary/20 font-serif">&rdquo;</div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">M</div>
            <div className="text-left">
              <p className="text-sm font-semibold">Mónica</p>
              <p className="text-xs text-muted-foreground">Auxiliar Administrativo del Estado (C2)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Motivacional ──────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <Flame className="h-10 w-10 text-amber-500 mx-auto mb-6" />
          <blockquote className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
            &ldquo;Las personas que aprueban no son las más listas.
            <br />
            <span className="text-primary">Son las que no se rinden.&rdquo;</span>
          </blockquote>
          <p className="mt-6 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cada test que haces, cada artículo que repasas, cada error que entiendes te acerca un paso más a tu plaza.
            No importa cuántas veces caigas — importa cuántas te levantas.
          </p>
          <p className="mt-4 text-sm font-medium text-primary">
            Tu plaza te está esperando. No pares ahora.
          </p>
        </div>
      </section>

      {/* ─── CTA final ────────────────────────────────────────────────── */}
      <section aria-labelledby="cta-final-heading" className="py-20 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 id="cta-final-heading" className="text-3xl font-bold tracking-tight">
            Empieza tu ruta hoy. Gratis.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Sin tarjeta de crédito. Sin permanencia. Un test gratuito en cada tema para que compruebes
            la diferencia por ti mismo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                Iniciar mi ruta gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
