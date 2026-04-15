import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  Scale, BookOpen, ArrowRight, Users, Clock,
  GraduationCap, Briefcase, FileText,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Justicia 2026: 2.300+ plazas — Auxilio, Tramitación, Gestión | OpoRuta',
  description:
    'Prepara Justicia 2026: Auxilio Judicial (425 plazas, 26 temas), Tramitación Procesal (1.155 plazas, 37 temas) y Gestión Procesal (725 plazas, 68 temas). Temario actualizado LO 1/2025. Tests gratis con IA.',
  keywords: [
    'oposiciones justicia 2026', 'auxilio judicial', 'tramitación procesal',
    'gestión procesal', 'test oposiciones justicia', 'temario justicia 2026',
    'LO 1/2025 justicia', 'examen auxilio judicial',
  ],
  openGraph: {
    title: 'Oposiciones Justicia 2026: 2.300+ plazas | OpoRuta',
    description: 'Tests con IA para Auxilio Judicial, Tramitación y Gestión Procesal. 2.300+ plazas. Temario actualizado LO 1/2025.',
    url: `${APP_URL}/oposiciones/justicia`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Justicia 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/justicia` },
}

const CUERPOS = [
  {
    nombre: 'Auxilio Judicial',
    nivel: 'C2',
    slug: 'auxilio-judicial',
    temas: 26,
    plazas: 425,
    ejercicios: 2,
    requisito: 'ESO o equivalente',
    desc: 'Funciones de apoyo en juzgados: actos de comunicación, ejecuciones, registro, guardia.',
    color: 'blue',
    icon: Briefcase,
  },
  {
    nombre: 'Tramitación Procesal',
    nivel: 'C1',
    slug: 'tramitacion-procesal',
    temas: 37,
    plazas: 1155,
    ejercicios: 3,
    requisito: 'Bachillerato o equivalente',
    desc: 'Tramitación de procedimientos judiciales, fe pública, gestión procesal informatizada.',
    color: 'indigo',
    icon: FileText,
  },
  {
    nombre: 'Gestión Procesal',
    nivel: 'A2',
    slug: 'gestion-procesal',
    temas: 68,
    plazas: 725,
    ejercicios: 3,
    requisito: 'Grado universitario',
    desc: 'Dirección técnico-procesal, redacción de resoluciones, coordinación de oficina judicial.',
    color: 'purple',
    icon: GraduationCap,
  },
]

export default function JusticiaHub() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Qué oposiciones hay en Justicia?', acceptedAnswer: { '@type': 'Answer', text: 'Hay tres cuerpos principales: Auxilio Judicial (C2), Tramitación Procesal (C1) y Gestión Procesal (A2). Cada uno con diferente nivel de requisitos y temario.' } },
          { '@type': 'Question', name: '¿Qué ha cambiado con la LO 1/2025?', acceptedAnswer: { '@type': 'Answer', text: 'La Ley Orgánica 1/2025 del Servicio Público de Justicia sustituye parcialmente a la LOPJ. Afecta a temas de organización judicial, Letrado de la Administración de Justicia y oficina judicial.' } },
          { '@type': 'Question', name: '¿Cuándo son los exámenes de Justicia 2026?', acceptedAnswer: { '@type': 'Answer', text: 'Los exámenes de la OEP 2024 se celebrarán previsiblemente entre septiembre y noviembre de 2025. La OEP 2025 se espera para 2026.' } },
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
          <Scale className="w-4 h-4 mr-1.5 inline" />
          +2.300 plazas · 3 cuerpos · Temario actualizado LO 1/2025
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-indigo-600">Justicia</span> 2026
        </h1>
        <p className="text-sm text-muted-foreground">Actualizado: abril 2026</p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Auxilio Judicial, Tramitación Procesal y Gestión Procesal.
          Tests con IA verificados contra la legislación vigente, incluida la nueva LO 1/2025.
        </p>
        <Badge variant="outline" className="text-xs">MJU · 2.300+ plazas · 3 cuerpos disponibles</Badge>
      </section>

      {/* 3 cuerpos */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Elige tu cuerpo</h2>
        <div className="grid gap-6">
          {CUERPOS.map(c => {
            const Icon = c.icon
            return (
              <Link key={c.slug} href={`/oposiciones/justicia/${c.slug}`}>
                <Card className="hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 text-indigo-600 shrink-0" />
                        <div>
                          <h3 className="text-lg font-bold">{c.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{c.desc}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{c.nivel}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.temas} temas</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.plazas} plazas</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.ejercicios} ejercicios</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {c.requisito}</span>
                      <span className="font-medium text-green-700">{c.plazas.toLocaleString()} plazas</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                        Ver detalles <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── ¿Para quién es OpoRuta? ── */}
      <section className="py-12 bg-muted/30 rounded-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">¿Para quién es OpoRuta para Justicia?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">✓ OpoRuta es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quieres practicar con preguntas tipo examen verificadas contra BOE</li>
                <li>• Preparas por libre o complementas academia</li>
                <li>• Prefieres pago único (49,99 €) sin suscripción mensual</li>
                <li>• Preparas Auxilio Judicial (C2), Tramitación (C1) o Gestión Procesal (A2)</li>
                <li>• Quieres tests adaptados a LO 1/2025 y cambios procesales 2026</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-amber-700">△ Quizás no es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Necesitas temario completo (OpoRuta es para practicar, no para estudiar desde cero)</li>
                <li>• Buscas tutorías presenciales con profesor</li>
                <li>• Solo buscas tests de ofimática Word/Excel (los tenemos, pero el fuerte es legislación)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LO 1/2025 highlight */}
      <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-600" />
          Novedad: LO 1/2025 del Servicio Público de Justicia
        </h2>
        <p className="text-sm text-muted-foreground">
          La nueva ley orgánica modifica la organización judicial y afecta directamente al temario.
          OpoRuta actualiza automáticamente las preguntas para reflejar los cambios en la LOPJ,
          la figura del Letrado de la Administración de Justicia y la nueva oficina judicial.
        </p>
        <Link href="/blog/cambios-temario-justicia-2026-lo-1-2025" className="text-sm text-amber-700 font-medium hover:underline">
          Leer análisis completo de los cambios →
        </Link>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Qué oposiciones hay en Justicia?', a: 'Tres cuerpos: Auxilio Judicial (C2, ESO), Tramitación Procesal (C1, Bachillerato) y Gestión Procesal (A2, Grado). Cada uno con distinto temario, requisitos y nivel de exigencia.' },
            { q: '¿Qué ha cambiado con la LO 1/2025?', a: 'Sustituye parcialmente a la LOPJ. Afecta a temas de organización judicial, oficina judicial y el papel del Letrado de la Administración de Justicia.' },
            { q: '¿Se pueden preparar dos cuerpos a la vez?', a: 'Sí. Auxilio y Tramitación comparten muchos temas (Constitución, LOPJ, procedimiento). Con el Pack Doble accedes a ambos por 79,99€.' },
            { q: '¿Cuánto se cobra en Justicia?', a: 'Sueldo bruto anual aproximado (14 pagas, incluye base + complemento destino + específico): Auxilio Judicial ~24.000€, Tramitación Procesal ~28.000€, Gestión Procesal ~34.000€. Varía según comunidad autónoma, antigüedad (trienios) y tipo de juzgado. Fuente: PGE 2025 y tablas retributivas.' },
            { q: '¿Cuándo son los exámenes?', a: 'Los de la OEP 2024 se esperan entre septiembre y noviembre de 2025. La siguiente convocatoria (OEP 2025) previsiblemente en 2026.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Justicia hoy</h2>
        <p className="text-muted-foreground">Tests verificados, simulacros con exámenes MJU reales y Tutor IA. Gratis para empezar.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
