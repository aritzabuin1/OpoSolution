import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import { TopLawsWidget } from '@/components/seo/TopLawsWidget'
import { ClusterBlogTOC } from '@/components/seo/ClusterBlogTOC'
import {
  BookOpen, CheckCircle, Clock, Mail, Package, Shield,
  ArrowRight, Users, Sparkles, Calculator,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Correos 2026: 4.000+ plazas, 12 temas — Tests gratis | OpoRuta',
  description:
    'Prepara las oposiciones de Correos 2026: +4.000 plazas, 12 temas, examen de 100 preguntas SIN penalización. Tests online gratis con IA, psicotécnicos y temario completo. Empieza hoy.',
  keywords: [
    'oposiciones correos 2026', 'test correos 2026', 'examen correos online',
    'preguntas examen correos', 'temario correos 2026', 'test correos gratis',
    'preparar oposiciones correos', 'plazas correos 2026', 'oposiciones correos',
    'correos personal laboral fijo', 'test correos online',
  ],
  openGraph: {
    title: 'Oposiciones Correos 2026: 4.000+ plazas — Tests gratis | OpoRuta',
    description: 'Tests online gratis para oposiciones Correos 2026. 12 temas, 100 preguntas sin penalización, +4.000 plazas.',
    url: `${APP_URL}/oposiciones/correos`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Test Correos 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/correos` },
}

const TEMAS = [
  { num: 1, titulo: 'Marco normativo postal', desc: 'Naturaleza jurídica de Correos. Organismos reguladores nacionales e internacionales. Ley 43/2010, RD 437/2024.' },
  { num: 2, titulo: 'Experiencia de personas en Correos', desc: 'Diversidad, inclusión e igualdad. PRL y bienestar. RSC, ODS, sostenibilidad. Emprendimiento e innovación.' },
  { num: 3, titulo: 'Paquetería de Correos y Correos Express', desc: 'Servicios e-commerce y Citypaq.' },
  { num: 4, titulo: 'Productos y servicios en oficinas', desc: 'Servicios financieros. Soluciones digitales. Filatelia.' },
  { num: 5, titulo: 'Nuevas líneas de negocio', desc: 'Correos Logística. Correos Frío. Otros negocios.' },
  { num: 6, titulo: 'Herramientas', desc: 'IRIS, SGIE, PDA, SICER y otras. Funciones y utilidad.' },
  { num: 7, titulo: 'Procesos operativos I: admisión', desc: 'Etiquetado, franqueo, facturación, requisitos de envíos.' },
  { num: 8, titulo: 'Procesos operativos II: tratamiento y transporte', desc: 'Centros de tratamiento automatizado (CTA). Clasificación y rutas.' },
  { num: 9, titulo: 'Procesos operativos III: distribución y entrega', desc: 'RD 437/2024. Normas de entrega, avisos de llegada, buzones.' },
  { num: 10, titulo: 'El cliente: atención y calidad', desc: 'Reclamaciones. KPIs. Protocolos de ventas. Plan de calidad.' },
  { num: 11, titulo: 'Internacionalización y aduanas', desc: 'UPU. Envíos internacionales. Procedimientos aduaneros.' },
  { num: 12, titulo: 'Normas de cumplimiento', desc: 'RGPD, LOPDGDD, prevención blanqueo de capitales. Compromiso ético. Ciberseguridad.' },
]

export default function CorreosLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Correos 2026',
        description: 'Tests online con IA para oposiciones de Correos. 12 temas, 100 preguntas sin penalización.',
        provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Cuántas plazas hay en Correos 2026?', acceptedAnswer: { '@type': 'Answer', text: 'La última convocatoria (2023) ofertó 7.757 plazas. Para 2026 se esperan más de 4.000 plazas de personal laboral fijo (Grupo IV), dentro del plan plurianual 2025-2028. Es una de las oposiciones con más plazas de España.' } },
          { '@type': 'Question', name: '¿El examen de Correos penaliza?', acceptedAnswer: { '@type': 'Answer', text: 'No. A diferencia de AGE o Justicia, en Correos los errores no restan puntos. Cada acierto vale 0,60 puntos y los errores suman 0. Conviene responder todas las preguntas.' } },
          { '@type': 'Question', name: '¿Qué requisitos necesito para presentarme?', acceptedAnswer: { '@type': 'Answer', text: 'Título de ESO o equivalente, ser mayor de 18 años y nacionalidad española o de la UE. No se exige experiencia previa.' } },
          { '@type': 'Question', name: '¿Cuándo es el examen de Correos 2026?', acceptedAnswer: { '@type': 'Answer', text: 'Las convocatorias de Correos suelen publicarse entre marzo y mayo, con examen unas semanas después. Pendiente de publicación oficial para 2026.' } },
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
          <Mail className="w-4 h-4 mr-1.5 inline" />
          +4.000 plazas · Sin penalización
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones <span className="text-yellow-600">Correos</span> 2026
        </h1>
        <p className="text-sm text-muted-foreground">Actualizado: abril 2026</p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practica con tests online gratis. 12 temas, 100 preguntas tipo test sin penalización.
          La oposición con más plazas y menos requisitos de España.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=correos">
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
            { icon: BookOpen, label: '100 preguntas', desc: '90 temario + 10 psicotécnicos' },
            { icon: Clock, label: '110 minutos', desc: '1 min 6 seg por pregunta' },
            { icon: CheckCircle, label: 'Sin penalización', desc: 'Error = 0 puntos' },
            { icon: Calculator, label: '60 pts máximo', desc: '0,60 pts por acierto' },
          ].map(({ icon: Icon, label, desc }) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center space-y-2">
                <Icon className="h-8 w-8 text-yellow-600 mx-auto" />
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            <CheckCircle className="w-4 h-4 inline mr-1.5" />
            Sin penalización — responde TODAS las preguntas. No dejes ninguna en blanco.
          </p>
        </div>
      </section>

      {/* Temario */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 12 temas</h2>
        <div className="grid gap-3">
          {TEMAS.map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
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

      {/* ── ¿Para quién es OpoRuta? ── */}
      <section className="py-12 bg-muted/30 rounded-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">¿Para quién es OpoRuta para Correos?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">✓ OpoRuta es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quieres practicar con preguntas tipo examen verificadas contra BOE</li>
                <li>• Preparas por libre o complementas academia</li>
                <li>• Prefieres pago único (49,99 €) sin suscripción mensual</li>
                <li>• Preparas Correos Personal Laboral Fijo (12 temas operativos)</li>
                <li>• Quieres tests sobre IRIS, SGIE, PDA y herramientas reales</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-amber-700">△ Quizás no es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Necesitas temario completo (OpoRuta es para practicar, no para estudiar desde cero)</li>
                <li>• Buscas tutorías presenciales con profesor</li>
                <li>• Buscas solo psicotécnicos (OpoRuta los incluye pero el fuerte es conocimiento operativo)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo te ayuda OpoRuta */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">¿Cómo te ayuda OpoRuta?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Sparkles, title: 'Tests con IA', desc: 'Preguntas generadas y verificadas contra la legislación real de Correos.' },
            { icon: Package, title: 'Sin penalización', desc: 'El scoring de OpoRuta se adapta: sin descuento por errores, como el examen real.' },
            { icon: Shield, title: 'Psicotécnicos incluidos', desc: '10 de las 100 preguntas son psicotécnicos. OpoRuta los genera automáticamente.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado hasta que apruebes. 20 créditos IA incluidos.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-yellow-600" />
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
            'Título de ESO, Graduado Escolar o equivalente',
            'No haber sido separado del servicio de Correos',
          ].map(r => (
            <li key={r} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* F2.T1 Top leyes examinadas */}
      <TopLawsWidget
        oposicionIds="d0000000-0000-0000-0000-000000000001"
        oposicionName="Correos"
      />

      {/* FAQ visual */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuántas plazas hay en Correos 2026?', a: 'La última convocatoria (2023) ofertó 7.757 plazas. Para 2026 se esperan más de 4.000 plazas de personal laboral fijo (Grupo IV), dentro del plan plurianual 2025-2028. Es una de las oposiciones con más plazas de España.' },
            { q: '¿El examen de Correos penaliza?', a: 'No. Los errores no restan. Cada acierto vale 0,60 puntos. Conviene responder todas las preguntas.' },
            { q: '¿Qué requisitos necesito?', a: 'Título de ESO o equivalente, mayor de 18 años y nacionalidad española o UE.' },
            { q: '¿Cuándo es el examen?', a: 'Las convocatorias suelen publicarse entre marzo y mayo. Pendiente de fecha oficial para 2026.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-8 space-y-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Correos hoy</h2>
        <p className="text-muted-foreground">Gratis, sin tarjeta de crédito, desde el primer tema.</p>
        <Link href="/register?oposicion=correos">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
      {/* Blog cluster TOC — autoridad temática + internal linking */}
      <ClusterBlogTOC
        clusters={'correos'}
        title="Guías y artículos del blog — Correos"
        description="Todo el contenido publicado para esta oposición. Actualizado en cada convocatoria."
      />


    </main>
  )
}
