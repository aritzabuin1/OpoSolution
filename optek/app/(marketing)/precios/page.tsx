'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Lock } from 'lucide-react'

// ─── Pricing data by rama ──────────────────────────────────────────────────────

type Rama = 'age' | 'justicia' | 'correos'

const RAMAS: { id: Rama; label: string; activa: boolean }[] = [
  { id: 'age', label: 'Administración del Estado', activa: true },
  { id: 'justicia', label: 'Justicia', activa: false },
  { id: 'correos', label: 'Correos', activa: true },
]

interface Plan {
  name: string
  price: string
  period: string
  badge: string | null
  features: string[]
  cta: string
  href: string
  highlight: boolean
}

const PLANS: Record<Rama, Plan[]> = {
  age: [
    {
      name: 'Gratis',
      price: '0€',
      period: 'para siempre',
      badge: null,
      features: [
        '1 test gratuito en cada tema',
        '3 simulacros (20 preguntas)',
        '2 análisis detallados con IA',
        'Sin tarjeta de crédito',
      ],
      cta: 'Empezar gratis',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pack C2 o C1',
      price: '49,99€',
      period: 'pago único',
      badge: 'Más popular',
      features: [
        'Tests ilimitados — Auxiliar (C2) o Administrativo (C1)',
        'Simulacros y psicotécnicos ilimitados',
        '+20 análisis detallados + Radar del Tribunal',
        'Sin suscripción — acceso permanente',
      ],
      cta: 'Comprar Pack',
      href: '/register',
      highlight: true,
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
      cta: 'Comprar A2',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pack Doble (C1+C2)',
      price: '79,99€',
      period: 'pago único',
      badge: 'Ahorra 20€',
      features: [
        'Acceso completo a C1 y C2',
        'Simulacros ilimitados en ambas',
        '+30 análisis detallados + Radar',
        'Cambia entre oposiciones',
      ],
      cta: 'C1 + C2',
      href: '/register',
      highlight: false,
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
        'Máximo ahorro',
      ],
      cta: 'Las tres AGE',
      href: '/register',
      highlight: false,
    },
  ],
  justicia: [
    {
      name: 'Gratis',
      price: '0€',
      period: 'para siempre',
      badge: null,
      features: [
        '1 test gratuito en cada tema',
        '3 simulacros (20 preguntas)',
        '2 análisis detallados con IA',
        'Sin tarjeta de crédito',
      ],
      cta: 'Empezar gratis',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pack Auxilio (C2)',
      price: '49,99€',
      period: 'pago único',
      badge: null,
      features: [
        'Tests ilimitados — Auxilio Judicial (26 temas)',
        'Simulacros y psicotécnicos ilimitados',
        '+20 análisis detallados',
        'Legislación verificada (LOPJ, LEC, LO 1/2025)',
      ],
      cta: 'Comprar Auxilio',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pack Tramitación (C1)',
      price: '49,99€',
      period: 'pago único',
      badge: 'Más popular',
      features: [
        'Tests ilimitados — Tramitación Procesal (37 temas)',
        'Incluye bloque ofimática',
        '+20 análisis detallados',
        'Legislación actualizada LO 1/2025',
      ],
      cta: 'Comprar Tramitación',
      href: '/register',
      highlight: true,
    },
    {
      name: 'Pack Gestión (A2)',
      price: '79,99€',
      period: 'pago único',
      badge: 'Exclusivo',
      features: [
        'Tests ilimitados — Gestión Procesal (68 temas)',
        '+20 análisis + supuestos prácticos IA',
        'Desarrollo escrito con corrección IA',
        'Legislación completa verificada',
      ],
      cta: 'Comprar Gestión',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pack Doble Justicia',
      price: '79,99€',
      period: 'pago único',
      badge: 'Ahorra 20€',
      features: [
        'Auxilio + Tramitación (comparten temas)',
        'Simulacros ilimitados en ambas',
        '+30 análisis detallados',
        'Cambia entre oposiciones',
      ],
      cta: 'Auxilio + Tramitación',
      href: '/register',
      highlight: false,
    },
  ],
  correos: [
    {
      name: 'Gratis',
      price: '0€',
      period: 'para siempre',
      badge: null,
      features: [
        '1 test gratuito en cada tema',
        '3 simulacros (20 preguntas)',
        '2 análisis detallados con IA',
        'Sin tarjeta de crédito',
      ],
      cta: 'Empezar gratis',
      href: '/register?oposicion=correos',
      highlight: false,
    },
    {
      name: 'Pack Correos',
      price: '49,99€',
      period: 'pago único',
      badge: 'Único pack',
      features: [
        'Tests ilimitados — 12 temas Correos',
        'Psicotécnicos ilimitados (10 en cada examen)',
        '+20 análisis detallados con IA',
        'Sin penalización — scoring real',
        'Sin suscripción — acceso permanente',
      ],
      cta: 'Comprar Pack Correos',
      href: '/register?oposicion=correos',
      highlight: true,
    },
  ],
}

const FREE_VS_PREMIUM = [
  { feature: 'Tests por tema', free: '1 por tema', premium: 'Ilimitados' },
  { feature: 'Simulacros oficiales', free: '3 (20 preguntas)', premium: 'Ilimitados (100 preguntas)' },
  { feature: 'Psicotécnicos', free: '3', premium: 'Ilimitados' },
  { feature: 'Análisis detallados IA', free: '2', premium: '20+ incluidos' },
  { feature: 'Radar del Tribunal', free: '5 artículos', premium: 'Completo' },
  { feature: 'Flashcards', free: '—', premium: 'Ilimitadas' },
  { feature: 'Caza-Trampas', free: '3/día (1-2 errores)', premium: 'Ilimitado (1-4 errores)' },
  { feature: 'Dificultad', free: 'Fácil y media', premium: 'Todas (+ difícil)' },
]

const FAQS = [
  { q: '¿Es pago único o suscripción?', a: 'Pago único. Sin suscripción, sin permanencia. Compras una vez y el acceso no caduca nunca.' },
  { q: '¿Puedo cambiar de oposición?', a: 'Sí. Tu pack da acceso a la oposición seleccionada. Si quieres preparar varias, los Packs Doble o Triple son la mejor opción.' },
  { q: '¿Qué son los análisis detallados?', a: 'Cuando fallas una pregunta, la IA te explica por qué con método socrático: empatía, pregunta guía, revelación y anclaje. Es el recurso que más aprendes, por eso es limitado.' },
  { q: '¿Puedo recargar análisis?', a: 'Sí. Desde 8,99€ puedes añadir 10 análisis más. No necesitas contratar otro pack.' },
  { q: '¿Qué incluye exactamente el plan gratuito?', a: '1 test en cada tema (todos abiertos), 3 simulacros de 20 preguntas, 2 análisis detallados y 3 psicotécnicos. Sin tarjeta.' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PreciosPage() {
  const [selectedRama, setSelectedRama] = useState<Rama>('age')
  const plans = PLANS[selectedRama]
  const rama = RAMAS.find(r => r.id === selectedRama)!

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Precios <span className="text-primary">transparentes</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Pago único, sin suscripción. Empieza gratis y paga solo cuando estés listo.
        </p>
      </section>

      {/* Rama tabs */}
      <section className="space-y-8">
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl border bg-muted p-1 gap-1">
            {RAMAS.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRama(r.id)}
                className={`relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                  selectedRama === r.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
                {!r.activa && (
                  <Badge variant="outline" className="absolute -top-2 -right-2 text-[9px] px-1.5 py-0">
                    Pronto
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Próximamente banner for inactive ramas */}
        {!rama.activa && (
          <div className="mx-auto max-w-lg text-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <Lock className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {rama.label} estará disponible próximamente
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Los precios son orientativos. Regístrate gratis para ser el primero en acceder.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className={`grid gap-4 ${
          plans.length <= 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' :
          plans.length <= 3 ? 'sm:grid-cols-3 max-w-4xl mx-auto' :
          'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        }`}>
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.badge && <Badge className="text-xs">{plan.badge}</Badge>}
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
                  <Button
                    variant={plan.highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Recarga de análisis: 8,99€ (+10 análisis). Recarga de supuestos prácticos (A2): 14,99€ (+5 correcciones).
        </p>
      </section>

      {/* ─── Separador visual ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-4 text-sm text-muted-foreground">Comparativa</span></div>
      </div>

      {/* Free vs Premium table */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Gratis vs Premium</h2>
          <p className="text-sm text-muted-foreground mt-2">Aplica a todas las oposiciones</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl mx-auto text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Funcionalidad</th>
                <th className="text-center py-3 px-2 font-medium">Gratis</th>
                <th className="text-center py-3 px-2 font-medium text-primary">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FREE_VS_PREMIUM.map(({ feature, free, premium }) => (
                <tr key={feature} className="border-b last:border-0">
                  <td className="py-2.5 px-2">{feature}</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{free}</td>
                  <td className="py-2.5 px-2 text-center font-medium">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Separador visual ─────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-4 text-sm text-muted-foreground">FAQ</span></div>
      </div>

      {/* FAQ */}
      <section className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center">Preguntas sobre precios</h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group rounded-lg border bg-card px-5 py-4 cursor-pointer">
              <summary className="flex items-center justify-between font-medium text-sm list-none select-none">
                {q}
                <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 bg-primary/5 rounded-2xl space-y-4">
        <h2 className="text-2xl font-bold">Empieza gratis, sin compromiso</h2>
        <p className="text-muted-foreground">Todos los temas abiertos. Sin tarjeta de crédito.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
