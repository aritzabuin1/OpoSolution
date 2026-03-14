/**
 * execution/scrape-boe-ley.ts — Scraper de leyes del BOE consolidado
 *
 * Descarga una ley completa del BOE usando el ELI (European Legislation Identifier)
 * y genera un JSON compatible con ingest-legislacion.ts.
 *
 * Uso:
 *   npx tsx execution/scrape-boe-ley.ts <eli-path> <output-filename> <ley-nombre> <ley-nombre-completo>
 *
 * Ejemplo:
 *   npx tsx execution/scrape-boe-ley.ts "es/l/2003/11/17/38" ley_38_2003_subvenciones.json SUBVENCIONES "Ley 38/2003, de 17 de noviembre, General de Subvenciones"
 *
 * El BOE sirve texto consolidado en HTML. Este script:
 *   1. Fetch del HTML completo de la ley consolidada
 *   2. Parse con regex para extraer artículos (no necesita puppeteer)
 *   3. Genera JSON en el formato esperado por ingest-legislacion.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'legislacion')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Articulo {
  numero: string
  titulo_articulo: string
  titulo_seccion: string
  texto_integro: string
}

interface LeyJSON {
  ley_nombre: string
  ley_codigo: string
  ley_nombre_completo: string
  fecha_scraping: string
  total_articulos: number
  articulos: Articulo[]
}

// ─── HTML → Text helpers ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#171;/g, '«')
    .replace(/&#187;/g, '»')
    .replace(/&#x[0-9a-f]+;/gi, '')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractBoeId(html: string): string {
  // Try to find BOE-A-XXXX-XXXXX in the page
  const match = html.match(/BOE-A-\d{4}-\d+/)
  return match ? match[0] : 'UNKNOWN'
}

// ─── Parse articles from BOE HTML ─────────────────────────────────────────────

function parseArticles(html: string): Articulo[] {
  const articles: Articulo[] = []

  // BOE consolidated texts use <div class="articulo"> or <p class="articulo">
  // and article headings like "Artículo 1." or "Artículo 1 bis."
  // Strategy: split by article headings

  // Pattern: matches "Artículo N." or "Artículo N bis." etc.
  // The BOE uses various formats, so we try multiple patterns
  const articleRegex = /(?:<[^>]*(?:class="[^"]*articulo[^"]*"|id="a\d+")[^>]*>[\s\S]*?)?(?:Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?)\s*\.?\s*([^\n<]*?)(?:\.|<))/gi

  // Simpler approach: find all article boundaries
  const splits = html.split(/(?=Art[ií]culo\s+\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?\s*\.)/i)

  let currentSection = ''

  for (const chunk of splits) {
    // Extract section headers (Títulos, Capítulos) that may appear before articles
    const sectionMatches = chunk.match(/(?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s+[IVXLCDM\d]+[^<\n]*/gi)
    if (sectionMatches) {
      currentSection = sectionMatches.map(s => stripHtml(s).trim()).filter(Boolean).join(' | ')
    }

    // Extract article number and title
    const artMatch = chunk.match(/Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?)\s*\.?\s*([^\n<.]*)/i)
    if (!artMatch) continue

    const numero = artMatch[1].trim()
    const tituloRaw = artMatch[2]?.trim() || ''
    const titulo = `Artículo ${numero}. ${tituloRaw}`.replace(/\s+/g, ' ').trim()

    // Extract body text (everything after the heading)
    const headingEnd = chunk.indexOf(artMatch[0]) + artMatch[0].length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim()

    if (texto.length < 10) continue // Skip empty stubs

    articles.push({
      numero,
      titulo_articulo: titulo,
      titulo_seccion: currentSection,
      texto_integro: texto,
    })
  }

  return articles
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 4) {
    console.log('Uso: npx tsx execution/scrape-boe-ley.ts <eli-path> <output-filename> <ley-nombre> <ley-nombre-completo>')
    console.log('')
    console.log('Ejemplo:')
    console.log('  npx tsx execution/scrape-boe-ley.ts "es/l/2003/11/17/38" ley_38_2003_subvenciones.json SUBVENCIONES "Ley 38/2003, de 17 de noviembre, General de Subvenciones"')
    console.log('')
    console.log('Leyes pendientes C1:')
    console.log('  es/l/2003/11/17/38   → Ley 38/2003 Subvenciones (tema 37)')
    console.log('  es/l/1985/04/02/7    → Ley 7/1985 LBRL (tema 10)')
    console.log('  es/rdlg/2015/10/30/8 → LGSS RDL 8/2015 (tema 31)')
    process.exit(1)
  }

  const [eliPath, outputFilename, leyNombre, leyNombreCompleto] = args

  const url = `https://www.boe.es/eli/${eliPath}/con`
  console.log(`► Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OpoRuta/1.0; +https://oporuta.es)',
      'Accept': 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  console.log(`  HTML: ${html.length} chars`)

  const boeId = extractBoeId(html)
  console.log(`  BOE ID: ${boeId}`)

  const articles = parseArticles(html)
  console.log(`  Artículos encontrados: ${articles.length}`)

  if (articles.length === 0) {
    console.error('ERROR: No se encontraron artículos. El HTML del BOE puede haber cambiado de formato.')
    console.log('Guardando HTML raw para diagnóstico...')
    fs.writeFileSync(path.join(DATA_DIR, `${outputFilename}.debug.html`), html)
    process.exit(1)
  }

  // Show first and last articles
  console.log(`  Primer artículo: ${articles[0].titulo_articulo}`)
  console.log(`  Último artículo: ${articles[articles.length - 1].titulo_articulo}`)

  const ley: LeyJSON = {
    ley_nombre: leyNombre,
    ley_codigo: boeId,
    ley_nombre_completo: leyNombreCompleto,
    fecha_scraping: new Date().toISOString(),
    total_articulos: articles.length,
    articulos: articles,
  }

  const outputPath = path.join(DATA_DIR, outputFilename)
  fs.writeFileSync(outputPath, JSON.stringify(ley, null, 2), 'utf-8')
  console.log(`\n✅ Guardado: ${outputPath}`)
  console.log(`   ${articles.length} artículos listos para ingestar con 'pnpm ingest:legislacion'`)
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
