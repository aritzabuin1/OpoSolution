/**
 * execution/scrape-lec-parcial.ts — Scraping parcial de la LEC (Ley 1/2000)
 *
 * La LEC tiene ~827 artículos — demasiado grande para scrapear entera.
 * Este script descarga el HTML completo y filtra solo los artículos
 * relevantes para oposiciones Justicia (Auxilio Judicial y Tramitación).
 *
 * Uso:
 *   npx tsx execution/scrape-lec-parcial.ts
 *
 * Output:
 *   data/legislacion/lec_1_2000_parcial.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'legislacion')

// ─── Article ranges to scrape (by exam relevance) ────────────────────────────

interface ArticleRange {
  start: number
  end: number
  label: string
}

const ARTICLE_RANGES: ArticleRange[] = [
  // Jurisdicción y competencia
  { start: 1, end: 24, label: 'Jurisdicción y competencia' },
  // Partes procesales
  { start: 36, end: 70, label: 'Partes procesales' },
  // Actos procesales, resoluciones, plazos, comunicaciones
  { start: 129, end: 168, label: 'Actos procesales, resoluciones, plazos, comunicaciones' },
  // Juicio ordinario: demanda, contestación, audiencia previa
  { start: 248, end: 280, label: 'Juicio ordinario' },
  // Juicio verbal
  { start: 437, end: 447, label: 'Juicio verbal' },
  // Recursos: reposición, apelación
  { start: 448, end: 476, label: 'Recursos: reposición y apelación' },
  // Casación
  { start: 477, end: 489, label: 'Recurso de casación' },
  // Títulos ejecutivos, despacho de ejecución
  { start: 517, end: 537, label: 'Títulos ejecutivos y despacho de ejecución' },
  // Ejecución dineraria, embargo
  { start: 571, end: 633, label: 'Ejecución dineraria y embargo' },
  // Ejecución no dineraria, lanzamientos
  { start: 699, end: 720, label: 'Ejecución no dineraria y lanzamientos' },
  // Medidas cautelares
  { start: 721, end: 747, label: 'Medidas cautelares' },
  // Procesos matrimoniales
  { start: 769, end: 778, label: 'Procesos matrimoniales' },
  // Monitorio y cambiario
  { start: 812, end: 827, label: 'Proceso monitorio y cambiario' },
]

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
  nota: string
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
    // Remove BOE navigation artifacts (standalone nav elements)
    .replace(/\[Bloque\s+\d+:\s*#[^\]]*\]/g, '')
    .replace(/^\s*Subir\s*$/gm, '')
    .replace(/^\s*Jur\s*$/gm, '')
    .replace(/^\s*Jurisprudencia\s*$/gm, '')
    .replace(/^\s*Concordancias\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Check if article number is in our ranges ─────────────────────────────────

function isArticleInRange(numero: string): boolean {
  // Extract pure number (handle "bis", "ter" etc by using base number)
  const baseNum = parseInt(numero.split(/\s/)[0], 10)
  if (isNaN(baseNum)) return false

  return ARTICLE_RANGES.some(r => baseNum >= r.start && baseNum <= r.end)
}

function getRangeLabel(numero: string): string {
  const baseNum = parseInt(numero.split(/\s/)[0], 10)
  if (isNaN(baseNum)) return ''

  const range = ARTICLE_RANGES.find(r => baseNum >= r.start && baseNum <= r.end)
  return range?.label || ''
}

// ─── Check if text looks like a TOC entry (mostly article references) ─────────

function isTocEntry(texto: string): boolean {
  // TOC entries are mostly lists of "Artículo N" references
  const artRefCount = (texto.match(/Art[ií]culo\s+\d+/gi) || []).length
  const lines = texto.split('\n').filter(l => l.trim()).length
  // If more than 50% of lines are article references, it's a TOC
  if (artRefCount > 10 && artRefCount / lines > 0.3) return true
  // Very long texts that are mostly navigation (>10KB with lots of article refs)
  if (texto.length > 10000 && artRefCount > 20) return true
  return false
}

// ─── Parse articles from BOE HTML ─────────────────────────────────────────────

function parseArticles(html: string): Articulo[] {
  const rawArticles: Articulo[] = []

  // Split by article headings
  const splits = html.split(/(?=Art[ií]culo\s+\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?\s*\.)/i)

  let currentSection = ''

  for (const chunk of splits) {
    // Extract section headers — only uppercase structural headers in HTML tags
    // Use case-sensitive match to avoid false positives from preamble/body text
    const sectionMatches = chunk.match(/(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION)\s+[IVXLCDM\d]+[^<\n]*/g)
    if (sectionMatches) {
      const cleaned = sectionMatches
        .map(s => stripHtml(s).trim())
        .filter(s => s.length > 3 && s.length < 200)
      // Only update if we have a reasonable number of sections (not TOC dump)
      if (cleaned.length > 0 && cleaned.length <= 5) {
        currentSection = cleaned.join(' | ')
      } else if (cleaned.length > 5) {
        // TOC or preamble dump — take only the last 2-3 (closest to this article)
        currentSection = cleaned.slice(-3).join(' | ')
      }
    }

    // Extract article number and title
    const artMatch = chunk.match(/Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?)\s*\.?\s*([^\n<.]*)/i)
    if (!artMatch) continue

    const numero = artMatch[1].trim()

    // Filter: only keep articles in our ranges
    if (!isArticleInRange(numero)) continue

    const tituloRaw = artMatch[2]?.trim() || ''
    const titulo = `Artículo ${numero}. ${tituloRaw}`.replace(/\s+/g, ' ').trim()

    // Extract body text (everything after the heading)
    const headingEnd = chunk.indexOf(artMatch[0]) + artMatch[0].length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim()

    // Clean leading period/dot from text (artifact of splitting on "Artículo N.")
    const textoClean = texto.replace(/^\s*\.\s*/, '').trim()

    if (textoClean.length < 10) continue // Skip empty stubs
    if (isTocEntry(textoClean)) continue // Skip TOC entries

    rawArticles.push({
      numero,
      titulo_articulo: titulo,
      titulo_seccion: currentSection,
      texto_integro: textoClean,
    })
  }

  // Deduplicate: keep the version with the most meaningful title and content
  const byNumero = new Map<string, Articulo[]>()
  for (const art of rawArticles) {
    const existing = byNumero.get(art.numero) || []
    existing.push(art)
    byNumero.set(art.numero, existing)
  }

  const articles: Articulo[] = []
  for (const [_numero, candidates] of byNumero) {
    // Pick the best candidate:
    // 1. Has a real title (not just "Artículo N.")
    // 2. Reasonable length (not too short = stub, not too long = contains other articles)
    // 3. Has section info
    const scored = candidates.map(c => {
      let score = 0
      const titleWords = c.titulo_articulo.replace(/Artículo\s+\d+\s*\.?\s*/, '').trim()
      if (titleWords.length > 3) score += 10 // Has a real title
      if (c.titulo_seccion.length > 5) score += 5 // Has section info
      if (c.texto_integro.length > 30 && c.texto_integro.length < 20000) score += 8
      else if (c.texto_integro.length >= 20000) score += 3 // Penalize very long (may contain noise)
      else score += 1
      return { art: c, score }
    })
    scored.sort((a, b) => b.score - a.score)
    articles.push(scored[0].art)
  }

  // Sort by article number
  articles.sort((a, b) => {
    const numA = parseInt(a.numero.split(/\s/)[0], 10)
    const numB = parseInt(b.numero.split(/\s/)[0], 10)
    return numA - numB
  })

  return articles
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  LEC (Ley 1/2000) — Scraping parcial para oposiciones Justicia')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // Show ranges
  console.log('Rangos de artículos a extraer:')
  let totalExpected = 0
  for (const r of ARTICLE_RANGES) {
    const count = r.end - r.start + 1
    totalExpected += count
    console.log(`  Arts ${r.start}-${r.end} (${count}): ${r.label}`)
  }
  console.log(`  Total esperado (max): ~${totalExpected} artículos`)
  console.log('')

  // The BOE consolidated URL for LEC
  const url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-323'
  console.log(`► Fetching: ${url}`)
  console.log('  (la LEC es muy grande, puede tardar unos segundos...)')

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
  console.log(`  HTML descargado: ${(html.length / 1024 / 1024).toFixed(1)} MB`)

  // Extract BOE ID
  const boeMatch = html.match(/BOE-A-\d{4}-\d+/)
  const boeId = boeMatch ? boeMatch[0] : 'BOE-A-2000-323'
  console.log(`  BOE ID: ${boeId}`)

  // Parse ALL articles first, then filter
  const allArticles = parseArticles(html)
  console.log(`  Artículos parseados (en rango): ${allArticles.length}`)

  if (allArticles.length === 0) {
    console.error('ERROR: No se encontraron artículos. Guardando HTML para diagnóstico...')
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(path.join(DATA_DIR, 'lec_debug.html'), html)
    process.exit(1)
  }

  // Stats per range
  console.log('')
  console.log('Desglose por rango:')
  for (const r of ARTICLE_RANGES) {
    const count = allArticles.filter(a => {
      const n = parseInt(a.numero.split(/\s/)[0], 10)
      return n >= r.start && n <= r.end
    }).length
    const expected = r.end - r.start + 1
    const status = count >= expected * 0.8 ? '✓' : count > 0 ? '~' : '✗'
    console.log(`  ${status} Arts ${r.start}-${r.end}: ${count}/${expected} — ${r.label}`)
  }

  // Show first and last
  console.log('')
  console.log(`  Primer artículo: ${allArticles[0].titulo_articulo}`)
  console.log(`  Último artículo: ${allArticles[allArticles.length - 1].titulo_articulo}`)

  // Build output JSON
  const ley: LeyJSON = {
    ley_nombre: 'LEC',
    ley_codigo: boeId,
    ley_nombre_completo: 'Ley 1/2000, de 7 de enero, de Enjuiciamiento Civil',
    fecha_scraping: new Date().toISOString(),
    nota: 'Scraping parcial — artículos más relevantes para oposiciones Justicia (Auxilio Judicial temas 16-17, Tramitación Procesal temas 16-19)',
    total_articulos: allArticles.length,
    articulos: allArticles,
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const outputPath = path.join(DATA_DIR, 'lec_1_2000_parcial.json')
  fs.writeFileSync(outputPath, JSON.stringify(ley, null, 2), 'utf-8')

  console.log('')
  console.log(`✅ Guardado: ${outputPath}`)
  console.log(`   ${allArticles.length} artículos listos para ingestar con 'pnpm ingest:legislacion'`)
  console.log('')

  // File size
  const stats = fs.statSync(outputPath)
  console.log(`   Tamaño archivo: ${(stats.size / 1024).toFixed(0)} KB`)
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
