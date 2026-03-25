/**
 * execution/scrape-lo-1-2025.ts — Scraper for LO 1/2025 (Servicio Público de Justicia)
 *
 * This law has 24 main articles + disposiciones. The BOE consolidated HTML has:
 * - Articles 1-9: each in a <div class="bloque" id="aN">
 * - Articles 10-24: only <h5 class="articulo"> inside the a9 block (no separate div)
 * - Disposiciones: each in a <div class="bloque" id="da|dt|dd|df-N">
 *
 * Usage: npx tsx execution/scrape-lo-1-2025.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'legislacion')

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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<h5[^>]*>/gi, '\n')
    .replace(/<\/h5>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#171;/g, '«')
    .replace(/&#187;/g, '»')
    .replace(/&#x[0-9a-f]+;/gi, '')
    .replace(/&#\d+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Section mapping for articles 1-24
function getSectionForArticle(num: number): string {
  if (num === 1) return 'TÍTULO I'
  if (num >= 2 && num <= 11) return 'TÍTULO II, CAPÍTULO I, Sección 1ª - Disposiciones generales'
  if (num >= 12 && num <= 13) return 'TÍTULO II, CAPÍTULO I, Sección 2ª - Requisitos procedimentales'
  if (num >= 14 && num <= 19) return 'TÍTULO II, CAPÍTULO I, Sección 3ª - Medios adecuados de solución de controversias con regulación específica'
  if (num >= 20 && num <= 24) return 'TÍTULO II, CAPÍTULO II - Reformas procesales'
  return 'Articulado'
}

/**
 * Extract a block of HTML between two boundaries
 */
function extractBlockHtml(html: string, startMarker: string, endMarkers: string[]): string | null {
  const startIdx = html.indexOf(startMarker)
  if (startIdx === -1) return null

  let endIdx = html.length
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker, startIdx + startMarker.length)
    if (idx > 0 && idx < endIdx) endIdx = idx
  }

  return html.substring(startIdx, endIdx)
}

/**
 * Parse articles that have their own <div class="bloque" id="aN"> wrapper
 */
function parseAnchoredArticles(html: string): Articulo[] {
  const articles: Articulo[] = []

  for (let i = 1; i <= 30; i++) {
    const marker = `id="a${i}"`
    const startIdx = html.indexOf(marker)
    if (startIdx === -1) continue

    // End at next bloque div
    const nextBloque = html.indexOf('<div class="bloque"', startIdx + marker.length)
    let blockHtml: string

    if (nextBloque > 0) {
      blockHtml = html.substring(startIdx, nextBloque)
    } else {
      blockHtml = html.substring(startIdx, startIdx + 500000)
    }

    // For article 9 specifically, it contains articles 10-24 as h5 tags inside
    // We want ONLY article 9's own content, not 10-24
    // Article 9's content ends at the first <h5> for article 10
    if (i === 9) {
      const art10Marker = '<h5 class="articulo">Artículo 10.'
      const art10Idx = blockHtml.indexOf(art10Marker)
      if (art10Idx > 0) {
        blockHtml = blockHtml.substring(0, art10Idx)
      }
    }

    const titleMatch = blockHtml.match(/<h5 class="articulo">([\s\S]*?)<\/h5>/)
    const rawTitle = titleMatch ? stripHtml(titleMatch[1]).trim() : `Artículo ${i}`

    let bodyHtml = blockHtml
    if (titleMatch) {
      const titleEnd = blockHtml.indexOf(titleMatch[0]) + titleMatch[0].length
      bodyHtml = blockHtml.substring(titleEnd)
    }
    const texto = stripHtml(bodyHtml).trim()

    if (texto.length < 5) continue

    articles.push({
      numero: String(i),
      titulo_articulo: rawTitle,
      titulo_seccion: getSectionForArticle(i),
      texto_integro: texto,
    })
  }

  return articles
}

/**
 * Parse articles 10-24 which are h5-only (inside the a9 block area)
 */
function parseUnanchoredArticles(html: string): Articulo[] {
  const articles: Articulo[] = []

  for (let i = 10; i <= 24; i++) {
    const h5Start = `<h5 class="articulo">Artículo ${i}.`
    const startIdx = html.indexOf(h5Start)
    if (startIdx === -1) continue

    // Find the end: next <h5 class="articulo">Artículo N or next <div class="bloque"
    let endIdx = html.length
    const nextArt = html.indexOf('<h5 class="articulo">Artículo ' + (i + 1) + '.', startIdx + h5Start.length)
    const nextBloque = html.indexOf('<div class="bloque"', startIdx + h5Start.length)
    // Also check for Disposición markers
    const nextDisp = html.indexOf('<h5 class="articulo">Disposición', startIdx + h5Start.length)

    if (nextArt > 0 && nextArt < endIdx) endIdx = nextArt
    if (nextBloque > 0 && nextBloque < endIdx) endIdx = nextBloque
    if (nextDisp > 0 && nextDisp < endIdx) endIdx = nextDisp

    const blockHtml = html.substring(startIdx, endIdx)

    const titleMatch = blockHtml.match(/<h5 class="articulo">([\s\S]*?)<\/h5>/)
    const rawTitle = titleMatch ? stripHtml(titleMatch[1]).trim() : `Artículo ${i}`

    let bodyHtml = blockHtml
    if (titleMatch) {
      const titleEnd = blockHtml.indexOf(titleMatch[0]) + titleMatch[0].length
      bodyHtml = blockHtml.substring(titleEnd)
    }
    const texto = stripHtml(bodyHtml).trim()

    if (texto.length < 5) continue

    articles.push({
      numero: String(i),
      titulo_articulo: rawTitle,
      titulo_seccion: getSectionForArticle(i),
      texto_integro: texto,
    })
  }

  return articles
}

/**
 * Parse disposiciones (DA, DT, DD, DF) which have bloque divs
 */
function parseDisposiciones(html: string): Articulo[] {
  const articles: Articulo[] = []

  const ordinals = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta',
    'séptima', 'octava', 'novena', 'décima', 'undécima', 'duodécima',
    'decimotercera', 'decimocuarta', 'decimoquinta', 'decimosexta',
    'decimoséptima', 'decimoctava', 'decimonovena', 'vigésima']

  const groups = [
    { prefix: 'da', label: 'Disposición adicional', section: 'Disposiciones adicionales', max: 10 },
    { prefix: 'dt', label: 'Disposición transitoria', section: 'Disposiciones transitorias', max: 20 },
    { prefix: 'dd', label: 'Disposición derogatoria', section: 'Disposición derogatoria', max: 1 },
    { prefix: 'df', label: 'Disposición final', section: 'Disposiciones finales', max: 45 },
  ]

  for (const group of groups) {
    for (let i = 1; i <= group.max; i++) {
      const id = i === 1 ? group.prefix : `${group.prefix}-${i}`
      const marker = `id="${id}"`
      const startIdx = html.indexOf(marker)
      if (startIdx === -1) continue

      // End at next bloque div
      const nextBloque = html.indexOf('<div class="bloque"', startIdx + marker.length)
      const blockHtml = nextBloque > 0
        ? html.substring(startIdx, nextBloque)
        : html.substring(startIdx, startIdx + 500000)

      const titleMatch = blockHtml.match(/<h5 class="articulo">([\s\S]*?)<\/h5>/)
      const rawTitle = titleMatch ? stripHtml(titleMatch[1]).trim() : `${group.label} ${i}`

      let bodyHtml = blockHtml
      if (titleMatch) {
        const titleEnd = blockHtml.indexOf(titleMatch[0]) + titleMatch[0].length
        bodyHtml = blockHtml.substring(titleEnd)
      }
      const texto = stripHtml(bodyHtml).trim()

      if (texto.length < 5) continue

      const prefix = group.prefix.toUpperCase()
      const numero = group.prefix === 'dd' ? 'DD' : `${prefix}-${i}`

      articles.push({
        numero,
        titulo_articulo: rawTitle,
        titulo_seccion: group.section,
        texto_integro: texto,
      })
    }
  }

  return articles
}

async function main() {
  const url = 'https://www.boe.es/eli/es/lo/2025/01/02/1/con'
  console.log(`Fetching: ${url}`)

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
  console.log(`  HTML size: ${(html.length / 1024).toFixed(0)} KB`)

  // Parse all parts
  const anchoredArticles = parseAnchoredArticles(html)
  console.log(`  Anchored articles (1-9): ${anchoredArticles.length}`)

  const unanchoredArticles = parseUnanchoredArticles(html)
  console.log(`  Unanchored articles (10-24): ${unanchoredArticles.length}`)

  const disposiciones = parseDisposiciones(html)
  console.log(`  Disposiciones: ${disposiciones.length}`)

  const allArticles = [...anchoredArticles, ...unanchoredArticles, ...disposiciones]
  console.log(`  TOTAL: ${allArticles.length}`)

  // Show summary
  console.log('\n  All entries:')
  for (const a of allArticles) {
    const textLen = a.texto_integro.length
    console.log(`    ${a.numero.padEnd(6)} | ${textLen.toString().padStart(7)} chars | ${a.titulo_articulo.substring(0, 90)}`)
  }

  const ley: LeyJSON = {
    ley_nombre: 'LO 1/2025',
    ley_codigo: 'BOE-A-2025-76',
    ley_nombre_completo: 'Ley Orgánica 1/2025, de 2 de enero, de medidas en materia de eficiencia del Servicio Público de Justicia',
    fecha_scraping: new Date().toISOString(),
    total_articulos: allArticles.length,
    articulos: allArticles,
  }

  const outputPath = path.join(DATA_DIR, 'lo_1_2025_servicio_publico_justicia.json')
  fs.writeFileSync(outputPath, JSON.stringify(ley, null, 2), 'utf-8')
  console.log(`\nSaved: ${outputPath}`)
  console.log(`  ${allArticles.length} entries (24 articles + ${disposiciones.length} disposiciones)`)
  console.log(`  File size: ${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB`)
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
