/**
 * execution/generate-seo-index.ts — Pre-build SEO index generator
 *
 * Lee los JSON de data/legislacion/, extrae artículos únicos por ley,
 * y genera optek/data/seo/article-index.json para sitemap y generateStaticParams.
 *
 * Este fichero se commitea y se despliega con la app (los JSON raw no se despliegan).
 *
 * Uso: pnpm generate:seo-index
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'legislacion')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'seo', 'article-index.json')

// ─── Types ──────────────────────────────────────────────────────────────────

interface LeyJSON {
  ley_nombre: string
  ley_codigo: string
  ley_nombre_completo: string
  total_articulos: number
  articulos: Array<{
    numero: string
    titulo_articulo: string
    titulo_seccion: string
    texto_integro: string
  }>
}

interface LawIndex {
  leyNombre: string
  slug: string
  totalArticles: number
  articles: string[]   // unique articulo_numero values
  multiProvisionArticles: number  // articles with >1 provision (same numero)
}

interface ArticleIndex {
  laws: LawIndex[]
  totalArticles: number
  totalLaws: number
  generatedAt: string
}

// ─── Slug generation (mirrors lib/seo/slugify.ts) ──────────────────────────

function slugifyArticulo(numero: string): string {
  const cleaned = numero
    .trim()
    .replace(/\.+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const isDisposicion = /^d[aftud]-/.test(cleaned)
  if (isDisposicion) return cleaned

  return `articulo-${cleaned}`
}

// ─── Ley slug mapping (subset of ley-registry.ts for this script) ───────────

// Must match slugs in data/seo/ley-registry.ts exactly
const LEY_SLUG_MAP: Record<string, string> = {
  'CE': 'constitucion-espanola',
  'LOTC': 'ley-organica-tribunal-constitucional',
  'ESTATUTO_GERNIKA': 'estatuto-autonomia-pais-vasco',
  'LPAC': 'ley-39-2015-lpac',
  'LRJSP': 'ley-40-2015-lrjsp',
  'TREBEP': 'estatuto-basico-empleado-publico',
  'GOBIERNO': 'ley-50-1997-gobierno',
  'INCOMPATIBILIDADES': 'ley-incompatibilidades-funcionarios',
  'LBRL': 'ley-bases-regimen-local',
  'SUBVENCIONES': 'ley-general-subvenciones',
  'LGP': 'ley-general-presupuestaria',
  'MUFACE': 'reglamento-mutualismo-administrativo',
  'CONVENIO_UNICO_IV': 'iv-convenio-colectivo-personal-laboral-age',
  'TRANSPARENCIA': 'ley-transparencia-acceso-informacion',
  'VOLUNTARIADO': 'ley-voluntariado',
  'DEPENDENCIA': 'ley-dependencia',
  'CP': 'codigo-penal',
  'LOGP': 'ley-organica-general-penitenciaria',
  'RP': 'reglamento-penitenciario',
  'RD840': 'rd-840-2011-medidas-alternativas',
  'ESTATUTO_VICTIMA': 'estatuto-victima-delito',
  'LEC': 'ley-enjuiciamiento-civil',
  'LECrim': 'ley-enjuiciamiento-criminal',
  'LOPJ': 'ley-organica-poder-judicial',
  'LO 1/2025': 'lo-1-2025-eficiencia-justicia',
  'LGT': 'ley-general-tributaria',
  'LIRPF': 'ley-irpf',
  'LIVA': 'ley-iva',
  'LIS': 'ley-impuesto-sociedades',
  'LIEE': 'ley-impuestos-especiales',
  'RGR': 'reglamento-general-recaudacion',
  'RGAGI': 'reglamento-gestion-inspeccion-tributaria',
  'BLANQUEO_CAPITALES': 'ley-prevencion-blanqueo-capitales',
  'LCSP': 'ley-contratos-sector-publico',
  'LEY23_2014': 'ley-reconocimiento-mutuo-resoluciones-penales-ue',
  'LGSS': 'ley-general-seguridad-social',
  'PRL': 'ley-prevencion-riesgos-laborales',
  'LSV': 'ley-trafico-seguridad-vial',
  'FCSE': 'ley-fuerzas-cuerpos-seguridad',
  'SEG_CIUDADANA': 'ley-seguridad-ciudadana',
  'SEG_PRIVADA': 'ley-seguridad-privada',
  'DERECHO_REUNION': 'ley-organica-derecho-reunion',
  'LOPDGDD': 'ley-proteccion-datos',
  'LOIGUALDAD': 'ley-igualdad-efectiva-mujeres-hombres',
  'LGTBI': 'ley-igualdad-trans-lgtbi',
  'LOEX': 'ley-extranjeria',
  'LEY_POSTAL': 'ley-servicio-postal-universal',
  'REGLAMENTO_POSTAL': 'reglamento-servicios-postales',
  'LEY_SEG_EUSKADI': 'ley-seguridad-publica-euskadi',
  'DL_POLICIA_PV': 'ley-policia-pais-vasco',
  'DL_IGUALDAD_CAV': 'ley-igualdad-comunidad-autonoma-vasca',
  'D_VIDEOCAMARAS': 'decreto-videocamaras-pais-vasco',
  'D_COORDINACION': 'decreto-coordinacion-policial-pais-vasco',
}

// Files to skip (duplicates, partials, debug)
const SKIP_FILES = new Set([
  'lo_4_2000_extranjeria.json', // duplicate of lo_4_2000_loex.json (same LOEX law)
])

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('📚 Generating SEO article index...\n')

  const files = fs.readdirSync(DATA_DIR).filter(f => {
    if (!f.endsWith('.json')) return false
    if (f.includes('parcial') || f.includes('debug')) return false
    if (SKIP_FILES.has(f)) return false
    return true
  })

  console.log(`Found ${files.length} law files\n`)

  const laws: LawIndex[] = []
  let totalArticles = 0
  let totalMultiProvision = 0
  const slugCollisions = new Map<string, string[]>() // slug → [leyNombre]

  for (const file of files) {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8')
    let data: LeyJSON
    try {
      data = JSON.parse(raw)
    } catch (e) {
      console.warn(`  ⚠ Skip ${file}: JSON parse error`)
      continue
    }

    const leyNombre = data.ley_nombre
    const slug = LEY_SLUG_MAP[leyNombre]
    if (!slug) {
      console.warn(`  ⚠ Skip ${file}: ley_nombre "${leyNombre}" not in slug map`)
      continue
    }

    // Normalize article numbers: strip diacritics to avoid slug collisions
    // e.g., "DA-vigésima" and "DA-vigesima" → same canonical form
    function normalizeNumero(n: string): string {
      return n.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\.+$/, '')
    }

    // Map normalized numero → canonical (first-seen raw numero)
    const canonicalNumero = new Map<string, string>()
    for (const art of data.articulos) {
      const norm = normalizeNumero(art.numero)
      if (!canonicalNumero.has(norm)) {
        canonicalNumero.set(norm, art.numero)
      }
    }

    // Count articles per normalized numero to detect multi-provision
    const numeroCount = new Map<string, number>()
    for (const art of data.articulos) {
      const norm = normalizeNumero(art.numero)
      const count = (numeroCount.get(norm) ?? 0) + 1
      numeroCount.set(norm, count)
    }

    // Filter: only articles with texto_integro >= 50 chars (across all provisions)
    const qualityNumeros = new Set<string>()
    const textoByNumero = new Map<string, number>()
    for (const art of data.articulos) {
      const norm = normalizeNumero(art.numero)
      const current = textoByNumero.get(norm) ?? 0
      textoByNumero.set(norm, current + (art.texto_integro?.length ?? 0))
    }
    for (const [norm, totalLength] of textoByNumero) {
      if (totalLength >= 50) {
        qualityNumeros.add(canonicalNumero.get(norm)!)
      }
    }

    // Validate slugs are unique within this law
    const slugSet = new Map<string, string>()
    let hasCollision = false
    for (const numero of qualityNumeros) {
      const artSlug = slugifyArticulo(numero)
      if (slugSet.has(artSlug)) {
        console.error(`  ❌ SLUG COLLISION in ${leyNombre}: "${numero}" and "${slugSet.get(artSlug)}" → "${artSlug}"`)
        hasCollision = true
      }
      slugSet.set(artSlug, numero)
    }

    // Sort articles in a sensible order (numeric first, then disposiciones)
    const sortedArticles = [...qualityNumeros].sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      return a.localeCompare(b, 'es')
    })

    const multiProvision = [...numeroCount.values()].filter(v => v > 1).length

    laws.push({
      leyNombre,
      slug,
      totalArticles: qualityNumeros.size,
      articles: sortedArticles,
      multiProvisionArticles: multiProvision,
    })

    totalArticles += qualityNumeros.size
    totalMultiProvision += multiProvision

    const status = hasCollision ? '❌' : '✅'
    console.log(`  ${status} ${leyNombre.padEnd(25)} ${String(qualityNumeros.size).padStart(5)} articles ${multiProvision > 0 ? `(${multiProvision} multi-provision)` : ''}`)
  }

  // Check for cross-law slug collisions
  const lawSlugs = new Set<string>()
  for (const law of laws) {
    if (lawSlugs.has(law.slug)) {
      console.error(`\n❌ LAW SLUG COLLISION: "${law.slug}" used by multiple laws!`)
    }
    lawSlugs.add(law.slug)
  }

  // Sort laws alphabetically by leyNombre
  laws.sort((a, b) => a.leyNombre.localeCompare(b.leyNombre))

  const index: ArticleIndex = {
    laws,
    totalArticles,
    totalLaws: laws.length,
    generatedAt: new Date().toISOString(),
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2), 'utf-8')

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ Generated article-index.json`)
  console.log(`   Laws: ${laws.length}`)
  console.log(`   Total unique articles: ${totalArticles}`)
  console.log(`   Multi-provision articles: ${totalMultiProvision}`)
  console.log(`   Output: ${OUTPUT_PATH}`)
  console.log(`${'─'.repeat(60)}`)
}

main()
