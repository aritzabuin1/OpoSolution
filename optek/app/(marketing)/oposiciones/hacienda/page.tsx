import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  BookOpen, CheckCircle, Clock, Landmark, Building2, Shield,
  ArrowRight, Users, Sparkles, Calculator,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Agente de Hacienda 2026: 1.000 plazas AEAT — Tests gratis | OpoRuta',
  description:
    'Prepara Agente de Hacienda Pública 2026: 1.000 plazas AEAT, 32 temas, examen 80+10 preguntas con penalización -1/4. Tests online gratis con IA verificados contra LGT, IRPF, IVA.',
  keywords: [
    'test agente hacienda 2026', 'oposiciones agente hacienda', 'examen hacienda online',
    'temario agente hacienda', 'AEAT oposiciones', 'test hacienda gratis',
    'sueldo agente hacienda',
  ],
  openGraph: {
    title: 'Oposiciones Agente de Hacienda 2026: 1.000 plazas AEAT | OpoRuta',
    description: 'Tests online gratis para Agente de Hacienda 2026. 32 temas, penalización -1/4, 1.000 plazas AEAT.',
    url: `${APP_URL}/oposiciones/hacienda`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Test Agente de Hacienda 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/hacienda` },
}

const TEMAS = [
  { num: 1, titulo: 'La Constitución Española de 1978', desc: 'Estructura, derechos fundamentales, principios rectores, reforma constitucional.' },
  { num: 2, titulo: 'Las Cortes Generales', desc: 'Congreso y Senado. Composición, funciones, procedimiento legislativo.' },
  { num: 3, titulo: 'El Gobierno', desc: 'Composición, funciones, relaciones con las Cortes. Presidente y Consejo de Ministros.' },
  { num: 4, titulo: 'La Administración Pública', desc: 'Principios de organización. AGE, CCAA y Administración Local.' },
  { num: 5, titulo: 'La Unión Europea', desc: 'Instituciones, fuentes del Derecho comunitario, libertades fundamentales.' },
  { num: 6, titulo: 'Protección de Datos Personales', desc: 'RGPD y LOPDGDD. Derechos digitales, delegado de protección de datos.' },
  { num: 7, titulo: 'Políticas de igualdad de género', desc: 'LO 3/2007. Planes de igualdad. Violencia de género. Conciliación.' },
  { num: 8, titulo: 'Fuentes del Derecho Administrativo', desc: 'Ley, reglamento, jerarquía normativa. Principios generales del Derecho.' },
  { num: 9, titulo: 'El acto administrativo', desc: 'Requisitos, eficacia, nulidad y anulabilidad. Notificaciones.' },
  { num: 10, titulo: 'Procedimiento administrativo común', desc: 'Ley 39/2015. Fases, plazos, silencio administrativo, recursos.' },
  { num: 11, titulo: 'Contratos del sector público', desc: 'Ley 9/2017. Tipos, procedimientos de adjudicación, ejecución.' },
  { num: 12, titulo: 'Responsabilidad patrimonial', desc: 'Requisitos, procedimiento, indemnización. Responsabilidad de autoridades.' },
  { num: 13, titulo: 'El sistema fiscal español', desc: 'Principios constitucionales tributarios. Poder financiero. Tributos: impuestos, tasas, contribuciones.' },
  { num: 14, titulo: 'La AEAT', desc: 'Agencia Estatal de Administración Tributaria. Organización, funciones, estructura.' },
  { num: 15, titulo: 'Derecho Tributario: conceptos generales', desc: 'Ley 58/2003 LGT. Hecho imponible, base, cuota, deuda.' },
  { num: 16, titulo: 'Derechos de los obligados tributarios', desc: 'LGT Arts. 34-35. Derechos y garantías. Obligados tributarios.' },
  { num: 17, titulo: 'Obligaciones formales', desc: 'NIF, censos, facturación, libros registro, deberes de información.' },
  { num: 18, titulo: 'Información y asistencia tributaria', desc: 'Consultas vinculantes, publicaciones, asistencia al contribuyente.' },
  { num: 19, titulo: 'Declaraciones tributarias', desc: 'Autoliquidaciones, comunicaciones de datos, declaraciones informativas.' },
  { num: 20, titulo: 'La deuda tributaria', desc: 'Extinción: pago, prescripción, compensación, condonación. Recaudación.' },
  { num: 21, titulo: 'Garantías de la deuda tributaria', desc: 'Derecho de prelación, hipoteca legal tácita, afección de bienes.' },
  { num: 22, titulo: 'Gestión tributaria', desc: 'Procedimientos de gestión. Verificación de datos, comprobación limitada.' },
  { num: 23, titulo: 'Inspección de los Tributos', desc: 'Funciones, facultades, procedimiento inspector, documentación.' },
  { num: 24, titulo: 'Potestad sancionadora tributaria', desc: 'Infracciones y sanciones tributarias. Procedimiento sancionador.' },
  { num: 25, titulo: 'Revisión en vía administrativa', desc: 'Recurso de reposición, reclamación económico-administrativa, TEAC.' },
  { num: 26, titulo: 'IRPF (I)', desc: 'Hecho imponible, contribuyente, rendimientos del trabajo y capital.' },
  { num: 27, titulo: 'IRPF (II)', desc: 'Rendimientos de actividades económicas, ganancias patrimoniales, base liquidable.' },
  { num: 28, titulo: 'Impuesto sobre Sociedades', desc: 'Hecho imponible, base imponible, tipo, deducciones, régimen especial PYMES.' },
  { num: 29, titulo: 'IVA (I)', desc: 'Hecho imponible, sujeto pasivo, base imponible, tipos impositivos.' },
  { num: 30, titulo: 'IVA (II)', desc: 'Deducciones, regímenes especiales, operaciones intracomunitarias.' },
  { num: 31, titulo: 'Impuestos Especiales', desc: 'Alcohol, tabaco, hidrocarburos, electricidad. Normativa y gestión.' },
  { num: 32, titulo: 'Aduanas', desc: 'Código Aduanero de la Unión. Despacho, origen, valor en aduana.' },
]

export default function HaciendaLanding() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Preparación Oposiciones Agente de Hacienda 2026',
        description: 'Tests online con IA para oposiciones de Agente de Hacienda Pública. 32 temas, 80+10 preguntas test, penalización -1/4.',
        provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: '¿Cuántas plazas hay de Agente de Hacienda?', acceptedAnswer: { '@type': 'Answer', text: '1.000 plazas libre (OEP 2025). Histórico: 851 (2024), 823 (2023), 787 (2022).' } },
          { '@type': 'Question', name: '¿Cómo es el examen de Agente de Hacienda?', acceptedAnswer: { '@type': 'Answer', text: '2 ejercicios: 80 preguntas test de todo el temario (90 min, -1/4) + 10 supuestos prácticos de desarrollo escrito del Bloque III (2h30, respuestas breves y razonadas, 0-30 pts).' } },
          { '@type': 'Question', name: '¿Cuándo es el examen de Agente de Hacienda?', acceptedAnswer: { '@type': 'Answer', text: 'Convocatoria anual. El último fue marzo 2026. La próxima se espera para marzo 2027.' } },
          { '@type': 'Question', name: '¿Cuál es la ley más importante para Agente de Hacienda?', acceptedAnswer: { '@type': 'Answer', text: 'La Ley General Tributaria (Ley 58/2003) es con diferencia la más preguntada, cubriendo temas 13-25.' } },
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
          <Landmark className="w-4 h-4 mr-1.5 inline" />
          1.000 plazas · Penalización -1/4
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Oposiciones Agente de <span className="text-emerald-600">Hacienda</span> 2026
        </h1>
        <p className="text-sm text-muted-foreground">Actualizado: abril 2026</p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practica con tests online gratis. 32 temas en 3 bloques: test de 80 preguntas + 10 supuestos de desarrollo escrito.
          La LGT es la ley más preguntada — nuestras preguntas se verifican contra ella.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register?oposicion=hacienda-aeat">
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
            { icon: BookOpen, label: '80 preguntas test', desc: 'Ej. 1 — todo el temario, 90 min' },
            { icon: Calculator, label: 'Penalización -1/4', desc: 'Ej. 1 — error resta 1/4 del acierto' },
            { icon: Building2, label: '10 supuestos escritos', desc: 'Ej. 2 — desarrollo Bloque III, 2h30' },
            { icon: Clock, label: 'Máx. 30 puntos ej. 2', desc: 'Respuestas breves y razonadas' },
          ].map(({ icon: Icon, label, desc }) => (
            <Card key={label}>
              <CardContent className="pt-6 text-center space-y-2">
                <Icon className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <Shield className="w-4 h-4 inline mr-1.5" />
            Penalización -1/4 — responde solo si puedes descartar al menos 1 opción.
          </p>
        </div>
      </section>

      {/* Temario */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo — 32 temas</h2>
        <div className="grid gap-3">
          {TEMAS.map(t => (
            <div key={t.num} className="flex gap-4 items-start p-3 rounded-lg border">
              <span className="text-sm font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
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
          <h2 className="text-2xl font-bold text-center mb-8">¿Para quién es OpoRuta para Hacienda?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">✓ OpoRuta es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quieres practicar con preguntas tipo examen verificadas contra BOE</li>
                <li>• Preparas por libre o complementas academia</li>
                <li>• Prefieres pago único (49,99 €) sin suscripción mensual</li>
                <li>• Preparas Agente de Hacienda Pública (C1) con temario tributario</li>
                <li>• Quieres practicar LGT, IRPF, IVA con citas verificadas</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-amber-700">△ Quizás no es para ti si...</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Necesitas temario completo (OpoRuta es para practicar, no para estudiar desde cero)</li>
                <li>• Buscas tutorías presenciales con profesor</li>
                <li>• Buscas preparación para el supuesto práctico exclusivamente</li>
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
            { icon: Sparkles, title: 'Tests con IA', desc: 'Preguntas verificadas contra LGT, IRPF, IVA y más.' },
            { icon: BookOpen, title: 'Supuestos con corrección IA', desc: 'Practica los 10 supuestos de desarrollo del Bloque III con corrección automática.' },
            { icon: Landmark, title: 'Radar del Tribunal', desc: 'Temas más preguntados en convocatorias AEAT anteriores.' },
            { icon: Users, title: 'Precio único 49,99€', desc: 'Sin suscripción. Acceso ilimitado. 20 créditos IA.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="h-6 w-6 text-emerald-600" />
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
            'Mayor de 16 años',
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
            { q: '¿Cuántas plazas hay?', a: '1.000 plazas libre (OEP 2025). Histórico: 851 (2024), 823 (2023), 787 (2022).' },
            { q: '¿Cómo es el examen?', a: '2 ejercicios: 80 preguntas test de todo el temario (90 min, -1/4) + 10 supuestos prácticos de desarrollo escrito del Bloque III (2h30, respuestas breves y razonadas, 0-30 pts).' },
            { q: '¿Cuándo es el examen?', a: 'Convocatoria anual. El último fue marzo 2026. La próxima se espera para marzo 2027.' },
            { q: '¿Cuál es la ley más importante?', a: 'La Ley General Tributaria (Ley 58/2003) es con diferencia la más preguntada, cubriendo temas 13-25.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center py-8 space-y-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Hacienda hoy</h2>
        <p className="text-muted-foreground">Gratis, sin tarjeta de crédito, desde el primer tema.</p>
        <Link href="/register?oposicion=hacienda-aeat">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </main>
  )
}
