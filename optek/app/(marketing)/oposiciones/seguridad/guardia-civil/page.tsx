import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import { TopLawsWidget } from '@/components/seo/TopLawsWidget'
import { ClusterBlogTOC } from '@/components/seo/ClusterBlogTOC'
import {
  Siren, BookOpen, ArrowRight, ArrowLeft, Users, Clock,
  GraduationCap, CheckCircle2, Brain, FileText, Target,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — servido desde CDN entre regeneraciones */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Oposiciones Guardia Civil 2026: 3.118 plazas, 25 temas — Tests gratis | OpoRuta',
  description:
    'Prepara Guardia Civil 2026: 3.118 plazas, 25 temas en 3 bloques, examen de 100 preguntas tipo test. Tests online gratis verificados contra BOE + psicotécnicos + Personalidad Policial con IA.',
  keywords: [
    'oposiciones guardia civil 2026', 'test guardia civil online', 'temario guardia civil',
    'guardia civil requisitos', 'oposiciones guardia civil temario', 'temas guardia civil',
    'psicotecnicos guardia civil', 'guardia civil plazas 2026', 'temario guardia civil actualizado',
    'test guardia civil gratis', 'examen guardia civil 2026',
  ],
  openGraph: {
    title: 'Oposiciones Guardia Civil 2026: 3.118 plazas — Tests gratis | OpoRuta',
    description: 'Tests online gratis para Guardia Civil 2026. 25 temas, 100 preguntas, scoring verificado BOE.',
    url: `${APP_URL}/oposiciones/seguridad/guardia-civil`,
    type: 'website',
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('Oposiciones Guardia Civil 2026')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oposiciones/seguridad/guardia-civil` },
}

const TEMAS = [
  { num: 1, titulo: 'La Constitución Española de 1978', desc: 'Características, estructura. Título Preliminar. Derechos y deberes fundamentales.' },
  { num: 2, titulo: 'Derecho de igualdad y no discriminación', desc: 'LO 3/2007 Igualdad. LO 1/2004 Violencia de Género. Ley 15/2022.' },
  { num: 3, titulo: 'La Corona', desc: 'Funciones constitucionales del Rey. Sucesión, regencia, refrendo.' },
  { num: 4, titulo: 'Las Cortes Generales', desc: 'Congreso y Senado. Funciones legislativas, de control y presupuestarias.' },
  { num: 5, titulo: 'El Gobierno y la Administración', desc: 'Composición, funciones, relaciones con las Cortes. El Presidente del Gobierno.' },
  { num: 6, titulo: 'El Poder Judicial', desc: 'CGPJ. Organización judicial. El Ministerio Fiscal. El Tribunal Constitucional.' },
  { num: 7, titulo: 'Organización territorial del Estado', desc: 'Comunidades Autónomas. Administración Local. Competencias.' },
  { num: 8, titulo: 'La Unión Europea', desc: 'Instituciones. Parlamento, Consejo, Comisión, TJUE.' },
  { num: 9, titulo: 'Derecho Penal (I)', desc: 'Concepto de delito. Dolo, culpa. Grados de ejecución: tentativa y consumación.' },
  { num: 10, titulo: 'Derecho Penal (II)', desc: 'Penas y medidas de seguridad. Circunstancias modificativas. Responsabilidad penal.' },
  { num: 11, titulo: 'Delitos contra las personas', desc: 'Homicidio, lesiones, detenciones ilegales, amenazas, coacciones.' },
  { num: 12, titulo: 'Delitos contra el patrimonio', desc: 'Hurto, robo, estafa, receptación, daños.' },
  { num: 13, titulo: 'Delitos contra la seguridad colectiva', desc: 'Riesgo catastrófico, incendios, salud pública, seguridad vial.' },
  { num: 14, titulo: 'Fuerzas y Cuerpos de Seguridad', desc: 'LO 2/1986. Principios básicos de actuación. Disposiciones estatutarias comunes.' },
  { num: 15, titulo: 'La Guardia Civil: organización', desc: 'Estructura orgánica. Dependencias (Interior/Defensa). Funciones y competencias.' },
  { num: 16, titulo: 'Seguridad Ciudadana', desc: 'LO 4/2015. Potestades administrativas. Infracciones y sanciones. Identificación.' },
  { num: 17, titulo: 'Protección Civil', desc: 'Fundamentos. Sistema Nacional de Protección Civil. Planes de emergencia.' },
  { num: 18, titulo: 'Topografía', desc: 'Conceptos básicos. Mapas y planos. Escalas. Coordenadas. Orientación.' },
  { num: 19, titulo: 'Sociología', desc: 'Conceptos fundamentales. Grupos sociales. Desigualdad. Globalización.' },
  { num: 20, titulo: 'Telecomunicaciones', desc: 'Conceptos. Redes de comunicación. Tecnologías inalámbricas. Espectro radioeléctrico.' },
  { num: 21, titulo: 'Automovilismo', desc: 'Mecánica del automóvil. Motor, transmisión, suspensión, frenos. Mantenimiento.' },
  { num: 22, titulo: 'Armamento y tiro', desc: 'Armas reglamentarias. Normas de seguridad. Balística. Nomenclatura.' },
  { num: 23, titulo: 'Primeros auxilios', desc: 'PAS. RCP. Hemorragias, fracturas, quemaduras. Protocolo de actuación.' },
  { num: 24, titulo: 'Seguridad vial', desc: 'RDL 6/2015. Normas de circulación. Señalización. Investigación de accidentes.' },
  { num: 25, titulo: 'Medio ambiente', desc: 'Protección ambiental. Delitos ecológicos. SEPRONA. Legislación ambiental.' },
]

export default function GuardiaCivilPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-16">
      {/* JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            name: 'Preparación Oposiciones Guardia Civil 2026',
            description: 'Tests con IA para oposiciones de Guardia Civil. 25 temas en 3 bloques, 100 preguntas, verificados contra BOE.',
            provider: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
            educationalLevel: 'C2 - ESO',
            numberOfCredits: '25',
            hasCourseInstance: {
              '@type': 'CourseInstance',
              courseMode: 'online',
              courseWorkload: 'PT150H',
            },
            offers: { '@type': 'Offer', price: '79.99', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: '¿Cuántos temas tiene la oposición de Guardia Civil?', acceptedAnswer: { '@type': 'Answer', text: '25 temas organizados en 3 bloques: A (Ciencias Jurídicas, 16 temas), B (Materias Socioculturales, 5 temas) y C (Materias Técnico-Científicas, 4 temas). Convocatoria BOE-A-2025-10521.' } },
              { '@type': 'Question', name: '¿Cuántas preguntas tiene el examen de Guardia Civil?', acceptedAnswer: { '@type': 'Answer', text: '100 preguntas tipo test (+5 de reserva) con 4 opciones. Cada acierto suma +1,0 punto, cada error resta -0,333 puntos (penalización -1/3). Escala 0-100, mínimo 50 para aprobar. 140 minutos compartidos (ortografía + gramática + conocimientos + inglés).' } },
              { '@type': 'Question', name: '¿Cuántas plazas de Guardia Civil hay en 2026?', acceptedAnswer: { '@type': 'Answer', text: '3.118 plazas totales (1.630 turno libre) para la escala de Cabos y Guardias. Es la oposición de seguridad con más plazas convocadas.' } },
              { '@type': 'Question', name: '¿Cuánto cobra un Guardia Civil?', acceptedAnswer: { '@type': 'Answer', text: 'El sueldo de un Guardia Civil ronda los 24.000-28.000€/año, dependiendo del destino, complementos y antigüedad.' } },
            ],
          },
        ],
      }} />

      {/* Hero */}
      <section className="space-y-6">
        <Link href="/oposiciones/seguridad" className="text-sm text-green-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a Seguridad
        </Link>
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <Siren className="w-4 h-4 mr-1.5 inline" />
            C2 · 25 temas · 3.118 plazas · BOE-A-2025-10521
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Oposiciones <span className="text-green-600">Guardia Civil</span> 2026
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Instituto armado de naturaleza militar. 25 temas en 3 bloques, 100 preguntas tipo test.
            Tests con IA verificados contra legislación BOE.
          </p>
        </div>
      </section>

      {/* Estructura del examen */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Estructura del examen</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Temas', value: '25 (3 bloques)', icon: BookOpen },
            { label: 'Preguntas', value: '100 (+5 reserva)', icon: FileText },
            { label: 'Opciones', value: '4 por pregunta', icon: Target },
            { label: 'Tiempo', value: '140 min (compartidos)', icon: Clock },
            { label: 'Acierto', value: '+1,0 pt', icon: CheckCircle2 },
            { label: 'Error', value: '-0,333 pts (pen. -1/3)', icon: Siren },
            { label: 'Escala', value: '0-100 (mín. 50)', icon: GraduationCap },
            { label: 'Convocatoria', value: 'BOE-A-2025-10521', icon: FileText },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Temario completo */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Temario completo: 25 temas</h2>

        {/* Bloque A */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600">Bloque A — Ciencias Jurídicas (temas 1-16)</h3>
          <div className="grid gap-2">
            {TEMAS.filter(t => t.num <= 16).map(t => (
              <Card key={t.num}>
                <CardContent className="pt-3 pb-3 flex items-start gap-3">
                  <span className="text-green-600 font-bold text-sm w-6 shrink-0">{t.num}</span>
                  <div>
                    <p className="font-medium text-sm">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bloque B */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600">Bloque B — Materias Socioculturales (temas 17-21)</h3>
          <div className="grid gap-2">
            {TEMAS.filter(t => t.num >= 17 && t.num <= 21).map(t => (
              <Card key={t.num}>
                <CardContent className="pt-3 pb-3 flex items-start gap-3">
                  <span className="text-green-600 font-bold text-sm w-6 shrink-0">{t.num}</span>
                  <div>
                    <p className="font-medium text-sm">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bloque C */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600">Bloque C — Materias Técnico-Científicas (temas 22-25)</h3>
          <div className="grid gap-2">
            {TEMAS.filter(t => t.num >= 22).map(t => (
              <Card key={t.num}>
                <CardContent className="pt-3 pb-3 flex items-start gap-3">
                  <span className="text-green-600 font-bold text-sm w-6 shrink-0">{t.num}</span>
                  <div>
                    <p className="font-medium text-sm">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Lo que incluye OpoRuta para Guardia Civil</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Tests por tema y bloque', desc: 'Practica cada uno de los 25 temas o por bloque (A/B/C). Preguntas generadas con IA y verificadas contra legislación BOE.', icon: BookOpen },
            { title: 'Scoring exacto BOE', desc: 'Escala 0-100, acierto +1,0, error -0,333 (pen. -1/3). 100 preguntas en 60 minutos. Réplica exacta del sistema oficial.', icon: Target },
            { title: 'Psicotécnicos específicos', desc: 'Tests de aptitudes adaptados al perfil Guardia Civil: razonamiento verbal, numérico, abstracto y espacial.', icon: Brain },
            { title: 'Personalidad Policial con IA', desc: 'Módulo exclusivo: Big Five, SJT, entrevista simulada y análisis de consistencia. Transversal para las 3 oposiciones de seguridad.', icon: Users },
          ].map(({ title, desc, icon: Icon }) => (
            <Card key={title}>
              <CardContent className="pt-6 space-y-2">
                <Icon className="w-6 h-6 text-green-600" />
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Requisitos */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Requisitos</h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm">
              {[
                'ESO o titulación equivalente (nivel C2)',
                '18-40 años (en el año de convocatoria)',
                'Nacionalidad española',
                'Permiso de conducir B',
                'No haber sido condenado/a por delito doloso',
                'Compromiso de portar armas',
              ].map(r => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <TopLawsWidget oposicionIds="ac000000-0000-0000-0000-000000000001" oposicionName="Guardia Civil" />

      {/* Recursos complementarios (SEO internal linking) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Guías complementarias Guardia Civil 2026</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { slug: 'plazas-guardia-civil-2026-convocatoria', t: 'Plazas Guardia Civil 2026', d: '3.118 plazas — desglose turno libre vs promoción' },
            { slug: 'sueldo-guardia-civil-2026-nomina-desglosada', t: 'Sueldo Guardia Civil 2026', d: 'Nómina desglosada: base + complementos + destino' },
            { slug: 'pruebas-fisicas-guardia-civil-2026', t: 'Pruebas físicas GC', d: 'Marcas mínimas oficiales por edad y sexo' },
            { slug: 'calendario-guardia-civil-2026-fechas-examen', t: 'Calendario GC 2026', d: 'Fechas clave convocatoria → toma de posesión' },
            { slug: 'guardia-civil-vs-policia-nacional-2026', t: 'GC vs Policía Nacional', d: 'Comparativa: requisitos, sueldo, destinos' },
            { slug: 'oposiciones-sin-penalizacion-2026', t: 'Penalización por errores', d: 'Cómo afecta el -1/3 en tu estrategia' },
          ].map(({ slug, t, d }) => (
            <Link key={slug} href={`/blog/${slug}`} className="block">
              <Card className="hover:border-green-500 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <p className="font-semibold text-sm">{t}</p>
                  <p className="text-xs text-muted-foreground mt-1">{d}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="space-y-4">
          {[
            { q: '¿Cuántos temas tiene la oposición de Guardia Civil?', a: '25 temas en 3 bloques: A (Ciencias Jurídicas, 16 temas), B (Materias Socioculturales, 5 temas) y C (Materias Técnico-Científicas, 4 temas). Convocatoria BOE-A-2025-10521.' },
            { q: '¿Cuántas preguntas tiene el examen?', a: '100 preguntas tipo test (+5 de reserva) con 4 opciones de respuesta. Cada acierto +1,0 punto, cada error -0,333 puntos (penalización -1/3). Escala 0-100, mínimo 50. El ejercicio de conocimientos comparte 140 minutos con ortografía, gramática e inglés.' },
            { q: '¿Puedo preparar GC y Policía Nacional a la vez?', a: 'Sí. Comparten ~60% de legislación (Constitución, LO 2/1986 FCSE, Seguridad Ciudadana, Código Penal). Con el Pack Doble GC+PN accedes a ambas oposiciones por 129,99€.' },
            { q: '¿Cuántas plazas hay en 2026?', a: '3.118 plazas totales (1.630 turno libre) para la escala de Cabos y Guardias. Es la oposición de seguridad con más plazas convocadas.' },
            { q: '¿Cuánto cobra un Guardia Civil?', a: 'El sueldo ronda los 24.000-28.000€/año, dependiendo del destino, complementos por antigüedad, nocturnidad y peligrosidad.' },
            { q: '¿Cuánto cuesta preparar GC con OpoRuta?', a: 'Pack Guardia Civil: 79,99€ (pago único). Pack Doble GC+PN: 129,99€. Pack Completo (GC + Personalidad Policial): 119,99€. Pack Personalidad Policial solo: 49,99€.' },
          ].map(({ q, a }) => (
            <div key={q} className="border rounded-lg p-4">
              <p className="font-medium text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8 space-y-4 bg-green-50 dark:bg-green-950/20 rounded-2xl">
        <h2 className="text-2xl font-bold">Empieza a preparar Guardia Civil hoy</h2>
        <p className="text-muted-foreground">25 temas, scoring BOE exacto y Personalidad Policial con IA. Gratis para empezar.</p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
      {/* Blog cluster TOC — autoridad temática + internal linking */}
      <ClusterBlogTOC
        clusters={'guardia-civil'}
        title="Guías y artículos del blog — Guardia Civil"
        description="Todo el contenido publicado para esta oposición. Actualizado en cada convocatoria."
      />


    </main>
  )
}
