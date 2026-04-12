/**
 * app/(marketing)/oep-2026/page.tsx
 *
 * OEP 2026 — Oferta de Empleo Publico tracker page.
 * Captura queries "OEP 2026", "oferta empleo publico 2026",
 * "plazas funcionario 2026", "oposiciones 2026 plazas".
 * Actualizar con datos BOE cuando se publique.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import {
  ArrowRight, Building2, Mail, Scale, Landmark, Shield, Siren,
  GraduationCap, Stethoscope, Briefcase, TrendingUp, Calendar,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

/** ISR: regenerar cada 24h — BOE publishes once/day, 6h was wasteful */
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'OEP 2026: Oferta de Empleo Publico — todas las plazas por cuerpo | OpoRuta',
  description:
    'Oferta de Empleo Publico 2026 completa: 40.000+ plazas de funcionario. Desglose por cuerpo (AGE, Justicia, Correos, Hacienda, Seguridad, Educacion, Sanidad). Fechas de examen y como prepararte.',
  keywords: [
    'OEP 2026',
    'oferta empleo publico 2026',
    'plazas funcionario 2026',
    'oposiciones 2026 plazas',
    'OEP estado 2026',
    'oposiciones 2026',
    'empleo publico 2026',
    'convocatoria oposiciones 2026',
    'plazas oposiciones 2026',
    'BOE oposiciones 2026',
    'oep 2026 boe',
    'ope estado 2026',
    'oep gobierno 2026',
    'oferta empleo publico estado 2026',
  ],
  openGraph: {
    title: 'OEP 2026: todas las plazas de funcionario | OpoRuta',
    description: '40.000+ plazas en la OEP 2026. Desglose por cuerpo, fechas de examen y como prepararte.',
    type: 'website',
    url: `${APP_URL}/oep-2026`,
    images: [{ url: `${APP_URL}/api/og?tipo=blog&tema=${encodeURIComponent('OEP 2026 — Oferta de Empleo Publico')}`, width: 1200, height: 630 }],
  },
  alternates: { canonical: `${APP_URL}/oep-2026` },
}

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const LAST_UPDATED = '6 de abril de 2026'

interface PlazaRow {
  cuerpo: string
  grupo: string
  plazas: number | string
  estado: 'convocada' | 'pendiente' | 'prevista'
  fechaExamen?: string
  oporutaLink?: string
}

const AGE_PLAZAS: PlazaRow[] = [
  { cuerpo: 'Auxiliar Administrativo', grupo: 'C2', plazas: 1700, estado: 'convocada', fechaExamen: '23 mayo 2026', oporutaLink: '/oposiciones/administracion' },
  { cuerpo: 'Administrativo del Estado', grupo: 'C1', plazas: 2512, estado: 'convocada', fechaExamen: '20 junio 2026', oporutaLink: '/oposiciones/administracion' },
  { cuerpo: 'Gestion GACE', grupo: 'A2', plazas: 1356, estado: 'convocada', fechaExamen: 'Otono 2026 (est.)', oporutaLink: '/oposiciones/administracion' },
]

const JUSTICIA_PLAZAS: PlazaRow[] = [
  { cuerpo: 'Auxilio Judicial', grupo: 'C2', plazas: 425, estado: 'convocada', oporutaLink: '/oposiciones/justicia/auxilio-judicial' },
  { cuerpo: 'Tramitacion Procesal', grupo: 'C1', plazas: 1155, estado: 'convocada', oporutaLink: '/oposiciones/justicia/tramitacion-procesal' },
  { cuerpo: 'Gestion Procesal', grupo: 'A2', plazas: 725, estado: 'convocada', oporutaLink: '/oposiciones/justicia/gestion-procesal' },
]

const SEGURIDAD_PLAZAS: PlazaRow[] = [
  { cuerpo: 'Guardia Civil', grupo: 'C2', plazas: 3118, estado: 'convocada', oporutaLink: '/oposiciones/seguridad/guardia-civil' },
  { cuerpo: 'Policia Nacional', grupo: 'C1', plazas: '~3.000', estado: 'convocada', oporutaLink: '/oposiciones/seguridad/policia-nacional' },
  { cuerpo: 'Ertzaintza', grupo: 'C1', plazas: '~800', estado: 'prevista', oporutaLink: '/oposiciones/seguridad/ertzaintza' },
]

const OTROS_PLAZAS: PlazaRow[] = [
  { cuerpo: 'Correos (personal laboral)', grupo: 'E/C2', plazas: '4.055', estado: 'convocada', oporutaLink: '/oposiciones/correos' },
  { cuerpo: 'Agente de Hacienda (AEAT)', grupo: 'C1', plazas: 1000, estado: 'convocada', oporutaLink: '/oposiciones/hacienda' },
  { cuerpo: 'Tecnico de Hacienda', grupo: 'A2', plazas: 666, estado: 'convocada' },
  { cuerpo: 'Instituciones Penitenciarias', grupo: 'C1', plazas: 900, estado: 'convocada', oporutaLink: '/oposiciones/penitenciarias' },
]

const CCAA_PLAZAS: PlazaRow[] = [
  { cuerpo: 'Educacion: Maestros (todas las CCAA)', grupo: 'A2', plazas: '~40.000', estado: 'convocada' },
  { cuerpo: 'Educacion: Secundaria (todas las CCAA)', grupo: 'A1', plazas: '~20.000', estado: 'convocada' },
  { cuerpo: 'SAS Enfermeria (Andalucia)', grupo: 'A2', plazas: 1988, estado: 'convocada' },
  { cuerpo: 'SAS TCAE (Andalucia)', grupo: 'C2', plazas: 1675, estado: 'convocada' },
  { cuerpo: 'SERGAS Enfermeria (Galicia)', grupo: 'A2', plazas: 1980, estado: 'convocada' },
  { cuerpo: 'Mossos d\'Esquadra (Catalunya)', grupo: 'C1', plazas: 1587, estado: 'convocada' },
  { cuerpo: 'Comunidad de Madrid (todas)', grupo: 'Varios', plazas: '19.000+', estado: 'pendiente' },
]

function PlazaTable({ rows, title, icon: Icon }: { rows: PlazaRow[]; title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4">Cuerpo</th>
              <th className="pb-2 pr-4">Grupo</th>
              <th className="pb-2 pr-4">Plazas</th>
              <th className="pb-2 pr-4">Estado</th>
              <th className="pb-2">Examen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cuerpo} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">
                  {r.oporutaLink ? (
                    <Link href={r.oporutaLink} className="text-primary hover:underline">{r.cuerpo}</Link>
                  ) : r.cuerpo}
                </td>
                <td className="py-2 pr-4">{r.grupo}</td>
                <td className="py-2 pr-4 font-semibold">{typeof r.plazas === 'number' ? r.plazas.toLocaleString('es-ES') : r.plazas}</td>
                <td className="py-2 pr-4">
                  <Badge variant={r.estado === 'convocada' ? 'default' : 'secondary'} className="text-xs">
                    {r.estado === 'convocada' ? 'Convocada' : r.estado === 'pendiente' ? 'Pendiente BOE' : 'Prevista'}
                  </Badge>
                </td>
                <td className="py-2 text-muted-foreground">{r.fechaExamen ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function OEP2026Page() {
  const totalPlazas = '40.000+'

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'OEP 2026 — Oferta de Empleo Publico',
          description: `Oferta de Empleo Publico 2026: ${totalPlazas} plazas de funcionario.`,
          url: `${APP_URL}/oep-2026`,
          dateModified: '2026-04-06',
          mainEntity: {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '¿Cuantas plazas tiene la OEP 2026?',
                acceptedAnswer: { '@type': 'Answer', text: `La OEP 2026 contempla mas de ${totalPlazas} plazas entre Administracion General del Estado, Justicia, Seguridad, Correos, Hacienda y las convocatorias de Comunidades Autonomas.` },
              },
              {
                '@type': 'Question',
                name: '¿Cuando se aprueba la OEP 2026?',
                acceptedAnswer: { '@type': 'Answer', text: 'La OEP 2026 de la AGE fue aprobada en diciembre 2025 (RD 651/2025 publicado en BOE 22/12/2025). Las convocatorias especificas se van publicando durante 2026. Muchas CCAA ya han publicado sus OEP propias.' },
              },
              {
                '@type': 'Question',
                name: '¿Que oposiciones tienen mas plazas en 2026?',
                acceptedAnswer: { '@type': 'Answer', text: 'Las oposiciones con mas plazas en 2026 son: Educacion (maestros ~40.000, secundaria ~20.000), Correos (4.055), Guardia Civil (3.118), Policia Nacional (~3.000), Administrativo del Estado C1 (2.512), Auxiliar C2 (1.700), GACE A2 (1.356) y Tramitacion Procesal (1.155).' },
              },
            ],
          },
        }}
      />

      {/* Hero */}
      <div className="mb-10 text-center">
        <Badge variant="outline" className="mb-3">Ultima actualizacion: {LAST_UPDATED}</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          OEP 2026: Oferta de Empleo Publico
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          <strong>{totalPlazas} plazas</strong> de funcionario en 2026 — la mayor oferta de empleo publico de la historia de Espana.
          Desglose completo por cuerpo, fechas de examen y enlaces para prepararte.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-4">
        {[
          { icon: Building2, label: 'AGE', value: '5.568 plazas', sub: 'C2 + C1 + A2' },
          { icon: Scale, label: 'Justicia', value: '2.305 plazas', sub: 'Auxilio + Tramitacion + Gestion' },
          { icon: Siren, label: 'Seguridad', value: '~6.918 plazas', sub: 'GC + PN + Ertzaintza' },
          { icon: TrendingUp, label: 'Total OEP', value: totalPlazas, sub: 'Estado + CCAA + Local' },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6 text-center">
              <c.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables */}
      <h2 className="mb-6 text-2xl font-bold">Desglose por cuerpo</h2>

      <PlazaTable rows={AGE_PLAZAS} title="Administracion General del Estado (AGE)" icon={Building2} />
      <PlazaTable rows={JUSTICIA_PLAZAS} title="Justicia" icon={Scale} />
      <PlazaTable rows={SEGURIDAD_PLAZAS} title="Fuerzas y Cuerpos de Seguridad" icon={Siren} />
      <PlazaTable rows={OTROS_PLAZAS} title="Otros cuerpos estatales" icon={Landmark} />
      <PlazaTable rows={CCAA_PLAZAS} title="Comunidades Autonomas (principales)" icon={Briefcase} />

      {/* Context section */}
      <div className="my-12 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-bold">¿Que es la OEP?</h2>
        <p className="mb-3 text-muted-foreground">
          La <strong>Oferta de Empleo Publico (OEP)</strong> es el decreto del Consejo de Ministros
          que fija cuantas plazas de funcionario se convocan cada ano. Es el primer paso del proceso:
          tras la OEP se publican las convocatorias especificas en el BOE con bases, temarios y fechas de examen.
        </p>
        <p className="mb-3 text-muted-foreground">
          La OEP 2026 de la AGE fue aprobada en <strong>diciembre 2025</strong> (RD 651/2025, BOE 22/12/2025).
          Las CCAA publican sus propias OEP de forma independiente. Muchas ya estan publicadas.
        </p>
        <p className="text-muted-foreground">
          <strong>Dato clave:</strong> las plazas de la OEP deben convocarse en los 3 anos siguientes.
          Si una convocatoria no se ejecuta, las plazas se acumulan a la siguiente OEP.
          Por eso 2026 tiene tantas plazas: incluye remanentes de OEP anteriores.
        </p>
      </div>

      {/* Timeline */}
      <h2 className="mb-4 text-xl font-bold">Proximos examenes 2026</h2>
      <div className="mb-12 space-y-3">
        {[
          { fecha: '23 mayo 2026', cuerpo: 'Auxiliar Administrativo C2 + Administrativo C1', link: '/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo' },
          { fecha: 'Mayo 2026', cuerpo: 'Correos (4.055 plazas)', link: '/oposiciones/correos' },
          { fecha: '20 junio 2026', cuerpo: 'Administrativo C1 (supuesto practico)', link: '/blog/calendario-oposiciones-administrativo-estado-c1-2026' },
          { fecha: 'Otono 2026', cuerpo: 'GACE A2 (estimado)', link: '/oposiciones/administracion' },
        ].map((e) => (
          <div key={e.fecha + e.cuerpo} className="flex items-center gap-4 rounded-lg border p-3">
            <Calendar className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">{e.fecha}</div>
              <Link href={e.link} className="text-sm text-primary hover:underline">{e.cuerpo}</Link>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-lg bg-primary/5 p-8 text-center">
        <GraduationCap className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h2 className="text-2xl font-bold">Prepara tu oposicion con OpoRuta</h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Tests con IA verificada contra legislacion oficial para 12 oposiciones.
          Simulacros INAP reales, Radar del Tribunal y Tutor IA.
          <strong> Empieza gratis, sin tarjeta.</strong>
        </p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/register">Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/simulacros-oposiciones">Ver simulacros disponibles</Link>
          </Button>
        </div>
      </div>

      {/* Related content */}
      <div className="mt-12">
        <h3 className="mb-4 text-lg font-semibold">Guias relacionadas</h3>
        <ul className="space-y-2 text-sm">
          <li><Link href="/blog/oposiciones-administracion-general-estado-2026-guia" className="text-primary hover:underline">Oposiciones AGE 2026: guia completa 18.000+ plazas</Link></li>
          <li><Link href="/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo" className="text-primary hover:underline">Calendario oposiciones AGE 2026</Link></li>
          <li><Link href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado" className="text-primary hover:underline">C2 vs C1: cual elegir</Link></li>
          <li><Link href="/blog/test-oposiciones-online-gratis-2026" className="text-primary hover:underline">Tests gratis para las 12 oposiciones</Link></li>
          <li><Link href="/blog/mejores-plataformas-ia-oposiciones-2026-comparativa" className="text-primary hover:underline">Alternativas a OpositaTest 2026</Link></li>
          <li><Link href="/precios" className="text-primary hover:underline">Precios OpoRuta</Link></li>
        </ul>
      </div>
    </div>
  )
}
