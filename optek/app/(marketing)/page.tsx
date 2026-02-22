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
  BookOpen,
  ClipboardList,
  ArrowRight,
  Star,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'OPTEK — Tu Entrenador Personal de Oposiciones con IA',
  description:
    'Prepara tu oposición con IA. Tests personalizados, corrección de desarrollos y simulacros. Cada cita legal verificada al artículo exacto.',
  openGraph: {
    title: 'OPTEK — Tu Entrenador Personal de Oposiciones con IA',
    description:
      'Prepara tu oposición con IA. Tests personalizados, corrección de desarrollos y simulacros con verificación determinista de citas legales.',
    type: 'website',
  },
}

// ─── Datos estáticos ───────────────────────────────────────────────────────────

const painPoints = [
  {
    icon: XCircle,
    title: 'Academias a 150€/mes',
    desc: 'Clases presenciales o grabadas a precio prohibitivo, con el mismo temario para todos.',
  },
  {
    icon: XCircle,
    title: 'Tests repetitivos y sin adaptación',
    desc: 'Siempre las mismas preguntas. Sin saber qué temas dominas y cuáles tienes flojos.',
  },
  {
    icon: XCircle,
    title: 'Sin feedback real en desarrollos',
    desc: 'Escribes, lo mandas a tu academia, esperas días. O peor: sin corregir nadie.',
  },
]

const steps = [
  {
    num: '01',
    icon: BookOpen,
    title: 'Elige tu oposición y tema',
    desc: 'Selecciona de nuestro catálogo de oposiciones y el tema del temario que quieres repasar.',
  },
  {
    num: '02',
    icon: Zap,
    title: 'OPTEK genera un test único',
    desc: 'La IA crea preguntas personalizadas basadas en la legislación real y en tus errores previos.',
  },
  {
    num: '03',
    icon: ShieldCheck,
    title: 'Recibe corrección verificada',
    desc: 'Cada pregunta y cada cita explicada con el artículo exacto. Sin inventos, sin alucinaciones.',
  },
]

const differentiators = [
  {
    title: 'Verificación determinista',
    desc: 'Cada cita legal generada por la IA se valida contra la base de datos de legislación real antes de mostrarte el resultado.',
  },
  {
    title: 'Sin alucinaciones legales',
    desc: 'Si la IA cita un artículo que no existe o está mal, el sistema lo detecta y regenera automáticamente.',
  },
  {
    title: 'Legislación siempre actualizada',
    desc: 'Monitorizamos el BOE. Cuando cambia un artículo, te alertamos y actualizamos el contenido afectado.',
  },
]

const plans = [
  {
    name: 'Gratis',
    price: '0€',
    period: 'siempre',
    badge: null,
    features: [
      '5 tests al mes',
      '2 correcciones de desarrollo',
      'Verificación de citas incluida',
      'Sin tarjeta de crédito',
    ],
    cta: 'Empezar gratis',
    href: '/register',
    variant: 'outline' as const,
  },
  {
    name: 'Por tema',
    price: '4,99€',
    period: 'por tema',
    badge: 'Más popular',
    features: [
      'Tests ilimitados de un tema',
      'Correcciones ilimitadas',
      'Verificación garantizada',
      'Acceso durante 6 meses',
    ],
    cta: 'Comprar tema',
    href: '/register',
    variant: 'default' as const,
  },
  {
    name: 'Premium',
    price: '19,99€',
    period: '/mes',
    badge: null,
    features: [
      'Todo ilimitado',
      'Todas las oposiciones',
      'Simulacros completos',
      'Soporte prioritario',
    ],
    cta: 'Empezar Premium',
    href: '/register',
    variant: 'outline' as const,
  },
]

const faqs = [
  {
    q: '¿Los artículos legales que aparecen son exactos?',
    a: 'Sí. OPTEK usa verificación determinista: cada cita legal generada por la IA se valida contra nuestra base de datos de legislación antes de mostrártela. Si la cita no existe o es incorrecta, el sistema lo detecta y corrige automáticamente.',
  },
  {
    q: '¿Para qué oposiciones funciona ahora mismo?',
    a: 'En esta versión inicial preparamos Auxiliar Administrativo del Estado (convocatoria TAC). Próximamente añadiremos más oposiciones del Cuerpo General de la Administración del Estado y Administraciones locales.',
  },
  {
    q: '¿Puedo cancelar el plan Premium cuando quiera?',
    a: 'Sí, puedes cancelar en cualquier momento desde tu cuenta. No hay permanencia ni penalizaciones. El acceso continúa hasta el final del período ya pagado.',
  },
  {
    q: '¿La IA puede equivocarse?',
    a: 'Como cualquier modelo de IA, puede cometer errores en la redacción. Por eso tenemos el motor de verificación determinista: valida cada cita legal con código, no con más IA. Es nuestra garantía frente a las alucinaciones.',
  },
  {
    q: '¿Qué incluye exactamente el plan gratuito?',
    a: 'El plan gratuito incluye 5 tests de tipo test al mes y 2 correcciones de desarrollos escritos, con verificación de citas incluida en ambos. No necesitas tarjeta de crédito para empezar.',
  },
  {
    q: '¿Con qué frecuencia se actualiza la legislación?',
    a: 'Monitorizamos el BOE automáticamente. Cuando se publica un cambio en la legislación relevante para tu oposición, actualizamos el contenido y te notificamos para que repases los artículos modificados.',
  },
]

const testimonials = [
  {
    text: 'Por fin una app que no inventa artículos. He probado otras IA y siempre me citaban leyes que no existen. Con OPTEK, todo comprobado.',
    name: 'M. García',
    role: 'Opositora TAC, aprobó en 2ª convocatoria',
  },
  {
    text: 'El corrector de desarrollos me ahorra horas a la semana. Me señala exactamente qué cita mejorar y con qué artículo sustentarla.',
    name: 'J. Martínez',
    role: 'Opositor Auxiliar Administrativo',
  },
  {
    text: 'Llevo 3 meses con OPTEK y he pasado de un 55% a un 78% en los simulacros. El feedback con artículos exactos marca la diferencia.',
    name: 'A. López',
    role: 'Preparando convocatoria 2025',
  },
]

// ─── Página ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1">
            Beta — Auxiliar Administrativo del Estado
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl leading-tight">
            Tu Entrenador Personal
            <br />
            <span className="text-primary">de Oposiciones con IA</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tests personalizados, corrección de desarrollos y simulacros. Cada cita legal
            verificada al artículo exacto. Sin alucinaciones. Sin inventos.
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
            5 tests gratuitos · Sin compromiso · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* ─── Pain points ─────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Preparar oposiciones es difícil.
              <br />
              <span className="text-muted-foreground font-normal">No tiene que serlo tanto.</span>
            </h2>
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
      <section id="como-funciona" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Cómo funciona
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              De cero a tu primer test en{' '}
              <span className="text-primary">menos de 2 minutos</span>
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
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              El corazón de OPTEK:{' '}
              <span className="opacity-80">Verificación Determinista</span>
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
              La IA nunca habla sin artículo exacto delante. Cada cita se verifica con
              código determinista, no con más IA.
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

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="precios" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Precios
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Empieza gratis. Paga solo si apruebas.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sin suscripciones obligatorias. Paga por lo que usas.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
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

      {/* ─── Social proof ─────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Lo que dicen los opositores
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ text, name, role }) => (
              <Card key={name}>
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    &ldquo;{text}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center mt-6 text-xs text-muted-foreground">
            * Testimonios ilustrativos. Resultados individuales pueden variar.
          </p>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
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

      {/* ─── CTA final ────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary text-primary-foreground text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Empieza a entrenar hoy. Gratis.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Sin tarjeta de crédito. Sin permanencia. 5 tests gratuitos para que compruebes
            la diferencia por ti mismo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
