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
  Users,
} from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { FOUNDER_LIMIT } from '@/lib/stripe/client'
import { JsonLd } from '@/components/shared/JsonLd'
import { RoadHero } from '@/components/marketing/RoadHero'
import { blogPosts } from '@/content/blog/posts'
import { unstable_cache } from 'next/cache'

export const metadata: Metadata = {
  title: 'OpoRuta — El camino más corto hacia el aprobado',
  description:
    'Prepara tu oposición con IA verificada. Tests personalizados, el Radar del Tribunal y corrección de desarrollos. Cada cita legal comprobada al artículo exacto.',
  openGraph: {
    title: 'OpoRuta — El camino más corto hacia el aprobado',
    description:
      'Prepara tu oposición con IA verificada. Descubre qué artículos pregunta el tribunal INAP y practica con citas comprobadas. Sin alucinaciones, sin inventos.',
    type: 'website',
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
      '5 tests de prueba',
      '2 análisis detallados',
      'Verificación de citas incluida',
      'Sin tarjeta de crédito',
    ],
    cta: 'Empezar gratis',
    href: '/register',
    variant: 'outline' as const,
  },
  {
    name: 'Pack Oposición',
    price: '49,99€',
    period: 'pago único',
    badge: 'Más popular',
    features: [
      'Tests ilimitados de todo el temario',
      '+20 análisis detallados',
      'Simulacros completos + Radar',
      'Sin suscripción — pago único',
    ],
    cta: 'Empezar mi ruta',
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
    a: 'En esta versión inicial preparamos Auxiliar Administrativo del Estado (C2). Próximamente añadiremos más oposiciones del Cuerpo General de la Administración del Estado y Administraciones locales.',
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
    a: 'El plan gratuito incluye 5 tests de prueba y 2 análisis detallados (en total, no al mes), con verificación de citas incluida en ambos. No necesitas tarjeta de crédito para empezar.',
  },
  {
    q: '¿Con qué frecuencia se actualiza la legislación?',
    a: 'Monitorizamos el BOE automáticamente. Cuando se publica un cambio en la legislación relevante para tu oposición, actualizamos el contenido y te notificamos para que repases los artículos modificados.',
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
        text: 'El temario del Auxiliar Administrativo del Estado consta de 28 temas en dos bloques: Bloque I — Organización pública (16 temas: CE, LPAC, TREBEP, LOPDGDD, UE, Presupuestos, Igualdad...) y Bloque II — Actividad administrativa y ofimática (12 temas: atención al público, Windows 11, Word 365, Excel 365, Access 365, Outlook 365, Internet). OpoRuta cubre los 28 temas completos con preguntas verificadas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿En qué consiste el examen de Auxiliar Administrativo del Estado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El proceso selectivo del Auxiliar Administrativo del Estado es de concurso-oposición (RD 651/2025, 1.700 plazas). El examen consta de un ejercicio único con un máximo de 110 preguntas tipo test (más 10 de reserva) en 90 minutos, con penalización -1/3. Se divide en dos partes obligatorias y eliminatorias: Primera parte (máx. 60 preguntas) — 30 de teoría (Bloque I) + 30 psicotécnicas; Segunda parte (máx. 50 preguntas) — Informática y Ofimática (Bloque II: Windows 11, Word 365, Excel 365, Access 365, Outlook 365). Cada parte se califica de 0 a 50 puntos, con un mínimo de 25 puntos por parte para superar. OpoRuta simula este formato exacto.',
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
  ],
}

// §2.17.4-5 Organization + WebSite → inyectados globalmente en app/layout.tsx

// FOUNDER_LIMIT importado de lib/stripe/client.ts (fuente única de verdad)

// ─── Página ────────────────────────────────────────────────────────────────────

const getFounderCount = unstable_cache(
  async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = await createServiceClient() as any
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_founder', true)
      return count ?? 0
    } catch {
      return 0
    }
  },
  ['founder-count'],
  { revalidate: 300, tags: ['founder-count'] } // Cache 5 minutes
)

export default async function LandingPage() {
  const founderCount = await getFounderCount()
  const founderRemaining = Math.max(0, FOUNDER_LIMIT - founderCount)

  return (
    <>
      {/* §2.17.3 — FAQPage schema (People Also Ask en Google) */}
      <JsonLd data={jsonLdFaq} />

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1">
            Auxiliar Administrativo del Estado · 1.700 plazas
          </Badge>

          <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl leading-tight">
            Aprueba tu oposición.
            <br />
            <span className="text-primary">Entrena con lo que pregunta el tribunal.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tests generados desde exámenes INAP reales, con cada cita legal verificada
            al artículo exacto. Sabrás si estás avanzando — o si necesitas reforzar.
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
            5 tests gratuitos · Sin tarjeta · Sin suscripción
          </p>

          {/* Ilustración animada: el camino del opositor */}
          <RoadHero />
        </div>
      </section>

      {/* ─── Founder Pricing Banner (§1.21.3) — auto-oculto cuando vendido ─ */}
      {founderRemaining > 0 && (
        <section className="py-8 bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-800">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-xs">
                    Oferta Fundador
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400 font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {founderCount > 0
                      ? `Quedan ${founderRemaining} de ${FOUNDER_LIMIT} plazas`
                      : `Solo ${FOUNDER_LIMIT} plazas disponibles`}
                  </span>
                </div>
                <p className="font-semibold text-foreground">
                  Únete a los primeros {FOUNDER_LIMIT} opositores en OpoRuta
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  30 análisis detallados · Tests ilimitados · Badge Miembro Fundador permanente
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground line-through">49,99€</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">24,99€</p>
                  <p className="text-xs text-muted-foreground">pago único</p>
                </div>
                <Link href="/register?plan=fundador">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                    Soy Fundador
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

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
          <div className="grid gap-8 md:grid-cols-3">
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
          <div className="grid gap-6 md:grid-cols-3">
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
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {['inap-2024', 'inap-2022', 'inap-2019'].map((slug) => (
              <Link key={slug} href={`/examenes-oficiales/${slug}`}>
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1.5 hover:bg-accent transition-colors cursor-pointer"
                >
                  INAP {slug.split('-')[1]}
                </Badge>
              </Link>
            ))}
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
          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
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
            Acceso founder disponible ahora — precio especial para los primeros {FOUNDER_LIMIT}.
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
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              'como-preparar-oposicion-auxiliar-administrativo-estado-guia',
              'penalizacion-examen-auxiliar-administrativo',
              'articulos-lpac-que-mas-caen-examen-inap',
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
          <div className="mt-4 text-center sm:hidden">
            <Link href="/blog" className="text-sm text-primary hover:underline">
              Ver todas las guías →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA final ────────────────────────────────────────────────── */}
      <section aria-labelledby="cta-final-heading" className="py-20 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 id="cta-final-heading" className="text-3xl font-bold tracking-tight">
            Empieza tu ruta hoy. Gratis.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Sin tarjeta de crédito. Sin permanencia. 5 tests gratuitos para que compruebes
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
