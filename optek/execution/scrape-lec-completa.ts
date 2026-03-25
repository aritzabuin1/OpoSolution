/**
 * execution/scrape-lec-completa.ts — Scraping COMPLETO de la LEC (Ley 1/2000)
 *
 * Descarga TODOS los ~827+ artículos + disposiciones adicionales, transitorias,
 * derogatoria y finales desde el BOE consolidado.
 *
 * Uso:
 *   npx tsx execution/scrape-lec-completa.ts
 *
 * Output:
 *   data/legislacion/lec_1_2000_completa.json
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

// Map of common HTML named entities to their characters
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&apos;': "'", '&laquo;': '«', '&raquo;': '»',
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
  '&iexcl;': '¡', '&iquest;': '¿', '&ordf;': 'ª', '&ordm;': 'º',
  '&mdash;': '\u2014', '&ndash;': '\u2013', '&hellip;': '\u2026', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
  '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&bull;': '\u2022', '&deg;': '\u00B0',
  '&sect;': '§', '&copy;': '©', '&reg;': '®', '&euro;': '€',
}

function decodeHtmlEntities(text: string): string {
  // Named entities
  let result = text
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.split(entity).join(char)
  }
  // Numeric decimal entities: &#171; → character
  result = result.replace(/&#(\d+);/g, (_, code) => {
    const n = parseInt(code, 10)
    return n > 0 && n < 65536 ? String.fromCharCode(n) : ''
  })
  // Numeric hex entities: &#x00E9; → character
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const n = parseInt(hex, 16)
    return n > 0 && n < 65536 ? String.fromCharCode(n) : ''
  })
  return result
}

function stripHtml(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')

  // Decode all HTML entities
  text = decodeHtmlEntities(text)

  // Remove BOE navigation artifacts
  text = text
    .replace(/\[Bloque\s+\d+:\s*#[^\]]*\]/g, '')
    .replace(/^\s*Subir\s*$/gm, '')
    .replace(/^\s*Jur\s*$/gm, '')
    .replace(/^\s*Jurisprudencia\s*$/gm, '')
    .replace(/^\s*Concordancias\s*$/gm, '')

  // Remove "Seleccionar redacción" blocks and version history (BOE version selectors)
  // These can appear as decoded or raw text after entity decoding
  text = text
    .replace(/Seleccionar redacci[oó]n:[\s\S]*?(?=\n\n|$)/g, '')
    .replace(/[ÚU]ltima actualizaci[oó]n,\s+publicada el[^\n]*/g, '')
    .replace(/Modificaci[oó]n publicada el[^\n]*/g, '')
    .replace(/Texto original, publicado el[^\n]*/g, '')
    .replace(/Texto a[ñn]adido, publicado el[^\n]*/g, '')
    .replace(/Se (?:modifica|añade|suprime|deroga|renumera)[^\n]*Ref\.\s*BOE-A-\d+-\d+/g, '')
    // Clean up "Esta modificación entra en vigor..." lines
    .replace(/Esta modificaci[oó]n entra en vigor[^\n]*/g, '')

  text = text
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return text
}

// ─── Check if text looks like a TOC entry ─────────────────────────────────────

function isTocEntry(texto: string): boolean {
  const artRefCount = (texto.match(/Art[ií]culo\s+\d+/gi) || []).length
  const lines = texto.split('\n').filter(l => l.trim()).length
  if (artRefCount > 10 && artRefCount / lines > 0.3) return true
  if (texto.length > 10000 && artRefCount > 20) return true
  return false
}

// ─── Parse articles from BOE HTML ─────────────────────────────────────────────

function parseArticles(html: string): Articulo[] {
  const rawArticles: Articulo[] = []

  // Pattern to match article headings including "bis", "ter", "quater", etc.
  // Also handles "283 bis a)" style numbering
  const articleSplitPattern = /(?=Art[ií]culo\s+\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?(?:\s+[a-k]\)?)?\s*\.)/i

  const splits = html.split(articleSplitPattern)

  let currentSection = ''

  for (const chunk of splits) {
    // Extract section headers
    const sectionMatches = chunk.match(/(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION)\s+[IVXLCDM\d]+[^<\n]*/g)
    if (sectionMatches) {
      const cleaned = sectionMatches
        .map(s => stripHtml(s).trim())
        .filter(s => s.length > 3 && s.length < 200)
      if (cleaned.length > 0 && cleaned.length <= 5) {
        currentSection = cleaned.join(' | ')
      } else if (cleaned.length > 5) {
        currentSection = cleaned.slice(-3).join(' | ')
      }
    }

    // Extract article number and title
    const artMatch = chunk.match(/Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?(?:\s+[a-k]\))?)\s*\.?\s*([^\n<.]*)/i)
    if (!artMatch) continue

    const numero = artMatch[1].trim()
    const tituloRaw = artMatch[2]?.trim() || ''
    const titulo = `Artículo ${numero}. ${tituloRaw}`.replace(/\s+/g, ' ').trim()

    // Extract body text
    const headingEnd = chunk.indexOf(artMatch[0]) + artMatch[0].length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim()
    const textoClean = texto.replace(/^\s*\.\s*/, '').trim()

    if (textoClean.length < 10) continue
    if (isTocEntry(textoClean)) continue

    rawArticles.push({
      numero,
      titulo_articulo: titulo,
      titulo_seccion: currentSection,
      texto_integro: textoClean,
    })
  }

  return rawArticles
}

// ─── Parse disposiciones from BOE HTML ────────────────────────────────────────

function parseDisposiciones(html: string): Articulo[] {
  const disposiciones: Articulo[] = []

  // Pattern for all types of disposiciones
  const dispoTypes = [
    { pattern: /Disposici[oó]n\s+adicional\s+(\w+)/gi, tipo: 'Disposición adicional' },
    { pattern: /Disposici[oó]n\s+transitoria\s+(\w+)/gi, tipo: 'Disposición transitoria' },
    { pattern: /Disposici[oó]n\s+derogatoria\s+(\w+)/gi, tipo: 'Disposición derogatoria' },
    { pattern: /Disposici[oó]n\s+final\s+(\w+)/gi, tipo: 'Disposición final' },
  ]

  // Split by disposición headings
  const dispoSplitPattern = /(?=Disposici[oó]n\s+(?:adicional|transitoria|derogatoria|final)\s+(?:primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima|und[eé]cima|duod[eé]cima|decimotercera|decimocuarta|decimoquinta|decimosexta|decimos[eé]ptima|decimoctava|decimonovena|vig[eé]sima|vig[eé]simo\s+\w+|[uú]nica)\b)/i

  const splits = html.split(dispoSplitPattern)

  for (const chunk of splits) {
    const dispoMatch = chunk.match(/Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s+(\w+(?:\s+\w+)?)/i)
    if (!dispoMatch) continue

    const tipo = dispoMatch[1].charAt(0).toUpperCase() + dispoMatch[1].slice(1).toLowerCase()
    const ordinal = dispoMatch[2].trim().toLowerCase()

    // Skip if this looks like a TOC reference (very short chunk before next disposición)
    const fullHeading = dispoMatch[0]
    const headingEnd = chunk.indexOf(fullHeading) + fullHeading.length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim().replace(/^\s*\.\s*/, '').trim()

    if (texto.length < 10) continue
    if (isTocEntry(texto)) continue

    // Truncate if text contains the start of another disposición (parsing artifact)
    let textoClean = texto
    const nextDispoIdx = textoClean.search(/Disposici[oó]n\s+(?:adicional|transitoria|derogatoria|final)\s+(?:primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima)/i)
    if (nextDispoIdx > 100) {
      textoClean = textoClean.slice(0, nextDispoIdx).trim()
    }

    const numero = `D.${tipo.charAt(0).toUpperCase()}.${ordinal}`
    const titulo = `Disposición ${tipo.toLowerCase()} ${ordinal}`

    disposiciones.push({
      numero,
      titulo_articulo: titulo,
      titulo_seccion: `Disposiciones ${tipo.toLowerCase()}s`,
      texto_integro: textoClean,
    })
  }

  // Deduplicate disposiciones by titulo
  const seen = new Set<string>()
  const unique: Articulo[] = []
  for (const d of disposiciones) {
    const key = d.titulo_articulo.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(d)
  }

  return unique
}

// ─── Deduplicate articles ─────────────────────────────────────────────────────

function deduplicateArticles(rawArticles: Articulo[]): Articulo[] {
  const byNumero = new Map<string, Articulo[]>()
  for (const art of rawArticles) {
    const existing = byNumero.get(art.numero) || []
    existing.push(art)
    byNumero.set(art.numero, existing)
  }

  const articles: Articulo[] = []
  for (const [, candidates] of byNumero) {
    const scored = candidates.map(c => {
      let score = 0
      const titleWords = c.titulo_articulo.replace(/Artículo\s+\S+\s*\.?\s*/, '').trim()
      if (titleWords.length > 3) score += 10
      if (c.titulo_seccion.length > 5) score += 5
      if (c.texto_integro.length > 30 && c.texto_integro.length < 20000) score += 8
      else if (c.texto_integro.length >= 20000) score += 3
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
    if (numA !== numB) return numA - numB
    // For same base number, sort by suffix
    return a.numero.localeCompare(b.numero)
  })

  return articles
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  LEC (Ley 1/2000) — Scraping COMPLETO (~827+ artículos)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  const url = 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-323'
  console.log(`► Fetching: ${url}`)
  console.log('  (la LEC es muy grande ~4MB, puede tardar 10-20 segundos...)')

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

  const boeMatch = html.match(/BOE-A-\d{4}-\d+/)
  const boeId = boeMatch ? boeMatch[0] : 'BOE-A-2000-323'
  console.log(`  BOE ID: ${boeId}`)

  // Parse all articles (no range filtering)
  console.log('')
  console.log('► Parseando artículos...')
  const rawArticles = parseArticles(html)
  console.log(`  Artículos raw: ${rawArticles.length}`)

  const articles = deduplicateArticles(rawArticles)
  console.log(`  Artículos tras deduplicar: ${articles.length}`)

  // Parse disposiciones
  console.log('')
  console.log('► Parseando disposiciones...')
  const disposiciones = parseDisposiciones(html)
  console.log(`  Disposiciones encontradas: ${disposiciones.length}`)

  // Combine
  const allEntries = [...articles, ...disposiciones]

  if (allEntries.length === 0) {
    console.error('ERROR: No se encontraron artículos. Guardando HTML para diagnóstico...')
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(path.join(DATA_DIR, 'lec_debug.html'), html)
    process.exit(1)
  }

  // Stats
  console.log('')
  console.log('═══ Resumen ═══')
  const firstArt = articles[0]
  const lastArt = articles[articles.length - 1]
  console.log(`  Primer artículo: ${firstArt?.titulo_articulo}`)
  console.log(`  Último artículo: ${lastArt?.titulo_articulo}`)
  console.log(`  Total artículos regulares: ${articles.length}`)
  console.log(`  Disposiciones adicionales: ${disposiciones.filter(d => d.titulo_seccion.includes('adicional')).length}`)
  console.log(`  Disposiciones transitorias: ${disposiciones.filter(d => d.titulo_seccion.includes('transitoria')).length}`)
  console.log(`  Disposiciones derogatorias: ${disposiciones.filter(d => d.titulo_seccion.includes('derogatoria')).length}`)
  console.log(`  Disposiciones finales: ${disposiciones.filter(d => d.titulo_seccion.includes('final')).length}`)
  console.log(`  TOTAL: ${allEntries.length}`)

  // Check coverage (articles 1-827)
  const artNumbers = new Set(articles.map(a => parseInt(a.numero.split(/\s/)[0], 10)).filter(n => !isNaN(n)))
  const missing: number[] = []
  for (let i = 1; i <= 827; i++) {
    if (!artNumbers.has(i)) missing.push(i)
  }
  if (missing.length > 0) {
    console.log('')
    console.log(`  ⚠ Artículos base no encontrados (${missing.length}): ${missing.slice(0, 20).join(', ')}${missing.length > 20 ? '...' : ''}`)
  } else {
    console.log('')
    console.log('  ✓ Todos los artículos 1-827 presentes')
  }

  // Build output JSON
  const ley: LeyJSON = {
    ley_nombre: 'LEC',
    ley_codigo: boeId,
    ley_nombre_completo: 'Ley 1/2000, de 7 de enero, de Enjuiciamiento Civil',
    fecha_scraping: new Date().toISOString(),
    total_articulos: allEntries.length,
    articulos: allEntries,
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const outputPath = path.join(DATA_DIR, 'lec_1_2000_completa.json')
  fs.writeFileSync(outputPath, JSON.stringify(ley, null, 2), 'utf-8')

  console.log('')
  console.log(`✅ Guardado: ${outputPath}`)
  console.log(`   ${allEntries.length} entradas totales`)

  const stats = fs.statSync(outputPath)
  console.log(`   Tamaño archivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
