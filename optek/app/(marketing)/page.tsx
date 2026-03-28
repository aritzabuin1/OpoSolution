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
import { WaitlistForm } from '@/components/marketing/WaitlistForm'

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

const plans = [
  {
    name: 'Gratis',
    price: '0€',
    period: 'para siempre',
    badge: null,
    features: [
      '1 test gratuito en cada tema',
      '1 simulacro oficial + 3 psicotécnicos',
      '2 análisis detallados',
      'Sin tarjeta de crédito',
    ],
    cta: 'Empezar gratis',
    href: '/register',
    variant: 'outline' as const,
  },
  {
    name: 'Pack C2 o C1',
    price: '49,99€',
    period: 'pago único',
    badge: 'Más popular',
    features: [
      'Tests ilimitados — Auxiliar (C2) o Administrativo (C1)',
      'Simulacros y psicotécnicos ilimitados',
      '+20 análisis detallados + Radar',
      'Sin suscripción — pago único',
    ],
    cta: 'Empezar mi ruta',
    href: '/register',
    variant: 'default' as const,
  },
  {
    name: 'Pack Gestión A2',
    price: '69,99€',
    period: 'pago único',
    badge: 'Exclusivo',
    features: [
      'Tests ilimitados — Gestión del Estado (A2 GACE)',
      '58 temas en 6 bloques + simulacros INAP',
      '+20 análisis + 5 supuestos prácticos con IA',
      'Corrección con rúbrica oficial INAP',
    ],
    cta: 'Empezar con A2',
    href: '/register',
    variant: 'default' as const,
  },
  {
    name: 'Pack Doble',
    price: '79,99€',
    period: 'pago único',
    badge: 'Ahorra 20€',
    features: [
      'Acceso completo a C1 y C2',
      'Simulacros y psicotécnicos ilimitados',
      '+30 análisis detallados + Radar',
      'Cambia entre oposiciones cuando quieras',
    ],
    cta: 'C1 + C2',
    href: '/register',
    variant: 'default' as const,
  },
  {
    name: 'Pack Triple AGE',
    price: '129,99€',
    period: 'pago único',
    badge: 'Todo incluido',
    features: [
      'Las 3 oposiciones AGE: C2 + C1 + A2',
      '+40 análisis + 5 supuestos prácticos IA',
      'Simulacros, Radar, todo ilimitado',
      'Máximo ahorro — preparas todo',
    ],
    cta: 'Las tres oposiciones',
    href: '/register',
    variant: 'default' as const,
  },
]

const faqs = [
  {
    q: '¿Los artículos legales que aparecen son exactos?',
    a: 'Sí. OpoRuta usa verificación determinista: cada cita legal generada por la IA se valida contra nuestra base de datos de legislación oficial antes de mostrártela. Si la cita no existe o es incorrecta, el sistema lo detecta y corrige automáticamente.',
  },
  {
    q: '¿Para qué oposiciones funciona ahora mismo?',
    a: 'OpoRuta cubre las tres oposiciones de la Administración General del Estado: Auxiliar Administrativo (C2, 28 temas), Administrativo del Estado (C1, 45 temas) y Gestión del Estado GACE (A2, 58 temas con supuesto práctico IA). También Correos (12 temas, sin penalización, 4.055 plazas). Próximamente añadiremos Justicia (Auxilio, Tramitación y Gestión Procesal).',
  },
  {
    q: '¿Qué pasa cuando agoto mis análisis detallados?',
    a: 'Puedes recargar análisis desde 8,99€ (+10 análisis detallados) directamente desde tu panel, sin necesidad de contratar nada nuevo. Los tests de tipo test siguen siendo ilimitados — los análisis detallados son el único recurso limitado.',
  },
  {
    q: '¿La IA puede equivocarse?',
    a: 'Como cualquier modelo de IA, puede cometer errores en la redacción. Por eso tenemos el motor de verificación determinista: valida cada cita legal con código, no con más IA. Es nuestra garantía frente a las alucinaciones.',
  },
  {
    q: '¿Qué incluye exactamente el plan gratuito?',
    a: 'El plan gratuito incluye 1 test gratuito en cada tema (Constitución, LPAC, TREBEP y todos los demás), 1 simulacro oficial, 3 psicotécnicos y 2 análisis detallados. No necesitas tarjeta de crédito para empezar.',
  },
  {
    q: '¿Con qué frecuencia se actualiza la legislación?',
    a: 'Monitorizamos el BOE automáticamente. Cuando se publica un cambio en la legislación relevante para tu oposición, actualizamos el contenido y te notificamos para que repases los artículos modificados.',
  },
  {
    q: '¿Cuál es la nota de corte del Auxiliar Administrativo?',
    a: 'La última nota de corte fue 30 puntos (parte 1) y 26,33 puntos (parte 2), sobre 50 por parte. Puedes usar nuestra calculadora gratuita para simular tu nota con la penalización -1/3.',
  },
  {
    q: '¿Se puede preparar la oposición por libre, sin academia?',
    a: 'Sí. Los temarios de Auxiliar (28 temas), Administrativo (45 temas) y Gestión del Estado (58 temas) son abarcables sin academia. OpoRuta te ofrece tests con legislación verificada, simulacros INAP reales y análisis con IA — todo lo que necesitas para prepararte por tu cuenta.',
  },
  {
    q: '¿Qué es el supuesto práctico con IA para A2 (GACE)?',
    a: 'Es una funcionalidad exclusiva de OpoRuta para la oposición Gestión del Estado (A2). La IA genera un caso práctico realista (como los del INAP) con 5 cuestiones, tú escribes tus respuestas, y la IA las corrige usando la rúbrica oficial del INAP: conocimiento aplicado (60%), análisis (20%), sistemática (10%) y expresión escrita (10%). Recibes puntuación sobre 50, feedback por cuestión y respuesta modelo. Ninguna otra plataforma online ofrece esto.',
  },
  {
    q: '¿Cuánto cuesta preparar la oposición A2 (GACE)?',
    a: 'El Pack Gestión del Estado A2 cuesta 69,99€ (pago único, sin suscripción). Incluye tests ilimitados en los 58 temas, 20 análisis detallados y 5 supuestos prácticos con corrección IA. Las academias cobran 140€/mes solo por la corrección de supuestos — con OpoRuta lo tienes todo por un pago único.',
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
      name: '¿Se puede preparar la oposición de Auxiliar Administrativo por libre?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El temario del Auxiliar Administrativo del Estado (28 temas) es abarcable sin academia. Necesitas un manual de referencia (Adams, MAD o CEP, entre 30-50€), los exámenes oficiales del INAP de años anteriores para practicar y una herramienta de tests tipo test para entrenar el formato real del examen. OpoRuta ofrece todo esto de forma gratuita: tests por tema con legislación verificada, simulacros INAP reales y psicotécnicos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué tipo de psicotécnicos entran en el examen del Auxiliar Administrativo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La primera parte del examen del Auxiliar Administrativo incluye 30 preguntas psicotécnicas que evalúan: razonamiento verbal (sinónimos, antónimos, analogías), razonamiento numérico (series, operaciones, porcentajes), razonamiento abstracto (secuencias lógicas, patrones) y aptitud administrativa (ordenación, clasificación, detección de errores). OpoRuta genera psicotécnicos de práctica con los mismos tipos que aparecen en el examen oficial.',
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
      description: 'Tests ilimitados en Auxiliar (C2) o Administrativo (C1), simulacros ilimitados, 20 análisis detallados',
    },
    {
      '@type': 'Offer',
      price: '69.99',
      priceCurrency: 'EUR',
      name: 'Pack Gestión del Estado A2',
      description: 'Tests ilimitados A2 GACE (58 temas), 20 análisis detallados, 5 supuestos prácticos con corrección IA',
    },
    {
      '@type': 'Offer',
      price: '79.99',
      priceCurrency: 'EUR',
      name: 'Pack Doble (C2+C1)',
      description: 'Acceso completo a C1 y C2, simulacros ilimitados, 30 análisis detallados',
    },
    {
      '@type': 'Offer',
      price: '129.99',
      priceCurrency: 'EUR',
      name: 'Pack Triple AGE (C2+C1+A2)',
      description: 'Las 3 oposiciones AGE completas, 40 análisis, 5 supuestos prácticos IA',
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

          <ExamCountdown examDate="2026-05-23" />

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

      {/* ─── Elige tu oposición (T-15) ────────────────────────────────── */}
      <section aria-labelledby="oposiciones-heading" className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Oposiciones con IA verificada
            </Badge>
            <h2 id="oposiciones-heading" className="text-3xl font-bold tracking-tight">
              ¿Qué oposición preparas?
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Contenido específico para cada cuerpo. Temario completo, legislación verificada y exámenes reales.
            </p>
          </div>
          {/* Rama AGE header */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Administración General del Estado</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* C2 — Auxiliar */}
            <Card className="relative overflow-hidden border-primary/30 shadow-md">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Disponible
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Auxiliar Administrativo (C2)</CardTitle>
                    <p className="text-xs text-muted-foreground">Cuerpo General Auxiliar AGE</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 28 temas (Bloque I + II)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 1.700 plazas convocadas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Exámenes INAP 2018–2024</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Legislación verificada</li>
                </ul>
                <Link href="/register" className="block pt-2">
                  <Button className="w-full gap-2" size="sm">
                    Empezar con C2
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* C1 — Administrativo */}
            <Card className="relative overflow-hidden border-amber-400/30 shadow-md">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Disponible
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <GraduationCap className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Administrativo del Estado (C1)</CardTitle>
                    <p className="text-xs text-muted-foreground">Cuerpo General Administrativo AGE</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 45 temas (Bloque I + II)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 2.512 plazas convocadas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Exámenes INAP 2019–2024</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 21 leyes verificadas</li>
                </ul>
                <Link href="/register" className="block pt-2">
                  <Button variant="outline" className="w-full gap-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30" size="sm">
                    Empezar con C1
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* A2 — Gestión del Estado (GACE) — DIFERENCIADOR */}
            <Card className="relative overflow-hidden border-emerald-400/40 shadow-lg ring-2 ring-emerald-400/20">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Exclusivo
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gestión del Estado — GACE (A2)</CardTitle>
                    <p className="text-xs text-muted-foreground">Cuerpo de Gestión AGE · Grupo A2</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 58 temas en 6 bloques</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 1.356 plazas convocadas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 21 leyes verificadas</li>
                  <li className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> <strong>Supuesto práctico con corrección IA</strong></li>
                </ul>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 mt-2">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 text-center font-medium">
                    La IA corrige tu supuesto con la rúbrica oficial INAP.
                    <br />
                    <span className="opacity-75">Ninguna otra plataforma online lo ofrece.</span>
                  </p>
                </div>
                <Link href="/register" className="block pt-1">
                  <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    Empezar con A2
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4 mb-8">
            Pack Doble (C2+C1): 79,99€ · Pack Triple AGE (C2+C1+A2): 129,99€ — con supuesto práctico IA incluido.
          </p>

          {/* Correos — Nuevo */}
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-4">Correos</p>
          <div className="grid gap-6 md:grid-cols-1 max-w-lg mx-auto mb-10">
            <Card className="relative overflow-hidden border-orange-400/30 shadow-md">
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Nuevo
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                    <BookOpen className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Correos</CardTitle>
                    <p className="text-xs text-muted-foreground">Personal Laboral · Grupo IV</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 12 temas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 4.055 plazas</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Sin penalización</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> 100 preguntas + psicotécnicos</li>
                </ul>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">49,99€ <span className="text-xs font-normal text-muted-foreground">pago único</span></span>
                </div>
                <Link href="/register?oposicion=correos" className="block pt-1">
                  <Button className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                    Empieza gratis
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Próximamente — Justicia */}
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Próximamente</p>
          <div className="grid gap-6 md:grid-cols-1 max-w-lg mx-auto">
            {/* Justicia */}
            <Card className="relative overflow-hidden opacity-75">
              <div className="absolute top-0 right-0 bg-muted-foreground/60 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                Próximamente
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                    <GraduationCap className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Justicia</CardTitle>
                    <p className="text-xs text-muted-foreground">Auxilio (C2) · Tramitación (C1) · Gestión (A2)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Layers className="h-3.5 w-3.5 shrink-0" /> 3 cuerpos disponibles</li>
                  <li className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 shrink-0" /> Temario actualizado LO 1/2025</li>
                </ul>
                <div className="pt-2">
                  <p className="text-[11px] text-muted-foreground mb-2">Elige tu cuerpo y te avisamos:</p>
                  <WaitlistForm oposicionSlug={[
                    { slug: 'auxilio-judicial', label: 'Auxilio Judicial (C2) — 26 temas' },
                    { slug: 'tramitacion-procesal', label: 'Tramitación Procesal (C1) — 37 temas' },
                    { slug: 'gestion-procesal', label: 'Gestión Procesal (A2) — 68 temas' },
                  ]} />
                </div>
              </CardContent>
            </Card>
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
                Pruébalo con tus errores — 2 análisis gratis
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

      {/* ─── Exámenes INAP — internal link for SEO ───────────────────── */}
      <section className="py-12 bg-muted/20 border-y">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Practica con exámenes reales del INAP — preguntas oficiales de convocatorias anteriores
          </p>
          <div className="space-y-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Auxiliar (C2)</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['inap-2024', 'inap-2022', 'inap-2019', 'inap-2018'].map((slug) => (
                <Link key={slug} href={`/examenes-oficiales/${slug}`}>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1.5 hover:bg-accent transition-colors cursor-pointer"
                  >
                    C2 — INAP {slug.split('-')[1]}
                  </Badge>
                </Link>
              ))}
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Administrativo (C1)</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['inap-c1-2024', 'inap-c1-2022', 'inap-c1-2019'].map((slug) => (
                <Link key={slug} href={`/examenes-oficiales/${slug}`}>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1.5 hover:bg-accent transition-colors cursor-pointer"
                  >
                    C1 — INAP {slug.split('-').pop()}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <Link href="/examenes-oficiales" className="text-sm text-primary hover:underline">
            Ver todos los simulacros oficiales →
          </Link>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="precios" aria-labelledby="pricing-heading" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Precios
            </Badge>
            <h2 id="pricing-heading" className="text-3xl font-bold tracking-tight">
              Empieza gratis. Paga solo por lo que necesitas.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sin permanencias. Sin suscripción. Pago único — acceso para siempre.
              ¿Te quedas sin análisis detallados? Recárgalos desde 8,99€.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.badge ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.badge && (
                      <Badge className="text-xs">{plan.badge}</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="block">
                    <Button variant={plan.variant} className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Early adopter CTA ────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Únete a los primeros opositores en probarlo
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            AGE (C2, C1, A2) y Correos disponibles ahora. Justicia próximamente.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Empezar gratis — sin tarjeta
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-3 mt-6">Justicia · Próximamente</p>
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
