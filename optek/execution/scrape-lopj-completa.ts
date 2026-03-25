/**
 * execution/scrape-lopj-completa.ts — Scrape complete LOPJ from BOE
 *
 * Based on scrape-boe-ley-v2.ts but with fixes for LOPJ-specific patterns:
 * 1. Accented Latin suffixes: quáter, nonies, decies, undecies, duodecies, terdecies
 * 2. Compound disposición ordinals: "vigésima primera", "trigésima segunda", etc.
 * 3. "Artículos X a Y" range headers (derogated sections) — skipped
 * 4. Section tracking for disposiciones (separate from libro/título sections)
 *
 * Usage:
 *   npx tsx execution/scrape-lopj-completa.ts
 *
 * Output: data/legislacion/lo_6_1985_lopj_completa.json
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
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
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
    .replace(/&#x[0-9a-f]+;/gi, (m) => {
      try {
        return String.fromCharCode(parseInt(m.slice(3, -1), 16))
      } catch {
        return ''
      }
    })
    .replace(/&#(\d+);/g, (_m, code) => {
      try {
        return String.fromCharCode(parseInt(code))
      } catch {
        return ''
      }
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Latin suffix normalizer ──────────────────────────────────────────────────

/** Normalize accented Latin suffixes to their canonical form */
function normalizeSuffix(s: string): string {
  return s
    .toLowerCase()
    .replace(/qu[áa]ter/g, 'quater')
    .trim()
}

// ─── Article regex ────────────────────────────────────────────────────────────
// Captures: bis, ter, quater/quáter, quinquies, sexies, septies, octies,
// novies/nonies, decies, undecies, duodecies, terdecies, etc.
// Also handles sub-articles like "216 bis 2", "216 bis 3"
const LATIN_SUFFIXES =
  'bis|ter|qu[áa]ter|quinquies|sexies|septies|octies|no[nv]ies|decies|undecies|duodecies|terdecies|quaterdecies|quindecies|sexdecies'

const ARTICLE_RE = new RegExp(
  `^Art[ií]culo\\s+(\\d+(?:\\s+(?:${LATIN_SUFFIXES}))(?:\\s+\\d+)?)\\s*\\.?\\s*(.*)`,
  'i'
)

// Fallback for articles without Latin suffix (just a number)
const ARTICLE_SIMPLE_RE = /^Art[ií]culo\s+(\d+)\s*\.?\s*(.*)/i

// "Artículos X a Y" = derogated range, skip
const ARTICLE_RANGE_RE = /^Art[ií]culos\s+\d+\s+a\s+\d+/i

// ─── Disposición regex ────────────────────────────────────────────────────────
// Must capture compound ordinals like "vigésima primera", "trigésimo sexta", etc.
// Strategy: capture all words between type and the period/title
const DISP_RE =
  /^Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s*(.*)/i

// Known Spanish ordinal words for compound matching
const ORDINAL_WORDS = new Set([
  'primera',
  'segundo',
  'segunda',
  'tercera',
  'tercero',
  'cuarta',
  'cuarto',
  'quinta',
  'quinto',
  'sexta',
  'sexto',
  'séptima',
  'séptimo',
  'octava',
  'octavo',
  'novena',
  'noveno',
  'décima',
  'décimo',
  'undécima',
  'undécimo',
  'duodécima',
  'duodécimo',
  'decimotercera',
  'decimotercero',
  'decimocuarta',
  'decimocuarto',
  'decimoquinta',
  'decimoquinto',
  'decimosexta',
  'decimosexto',
  'decimoséptima',
  'decimoséptimo',
  'decimoctava',
  'decimoctavo',
  'decimonovena',
  'decimonoveno',
  'vigésima',
  'vigésimo',
  'trigésima',
  'trigésimo',
  'cuadragésima',
  'cuadragésimo',
  'quincuagésima',
  'quincuagésimo',
  'única',
  'único',
])

/**
 * Parse a disposición heading after the type word.
 * Returns { ordinal, titulo }
 *
 * Examples:
 *   "primera. Salas de lo Contencioso" → { ordinal: "primera", titulo: "Salas de lo Contencioso" }
 *   "vigésima primera. Apoyo judicial" → { ordinal: "vigésima primera", titulo: "Apoyo judicial" }
 *   "" (derogatoria with no ordinal) → { ordinal: "única", titulo: "" }
 */
function parseDisposicionOrdinal(rest: string): {
  ordinal: string
  titulo: string
} {
  if (!rest || rest.trim() === '' || rest.trim() === '.') {
    return { ordinal: 'única', titulo: '' }
  }

  // Split on period to separate ordinal from title
  // But ordinals can also end with period, so we need to be careful
  const cleaned = rest.trim()

  // Try to extract ordinal words from the beginning
  const words = cleaned.split(/[\s.]+/).filter(Boolean)
  const ordinalParts: string[] = []
  let titleStart = 0

  for (let i = 0; i < words.length && i < 3; i++) {
    const w = words[i].toLowerCase().replace(/\.$/, '')
    if (ORDINAL_WORDS.has(w)) {
      ordinalParts.push(w)
      // Calculate where this word ends in the original string
      const wordInOriginal = cleaned.indexOf(words[i], titleStart)
      titleStart = wordInOriginal + words[i].length
    } else {
      break
    }
  }

  if (ordinalParts.length === 0) {
    return { ordinal: 'única', titulo: cleaned.replace(/^\.\s*/, '') }
  }

  const ordinal = ordinalParts.join(' ')
  let titulo = cleaned.substring(titleStart).replace(/^[\s.]+/, '').trim()
  titulo = titulo.replace(/\.$/, '')

  return { ordinal, titulo }
}

// ─── Parse ────────────────────────────────────────────────────────────────────

function parseArticlesFromBOE(html: string): Articulo[] {
  const articles: Articulo[] = []

  // Find all relevant headers
  const headerRegex =
    /<(h[45])\s+class="((?:capitulo|titulo|seccion|libro)_(?:num|tit)|articulo|subseccion)"[^>]*>([\s\S]*?)<\/\1>/gi

  interface Header {
    tag: string
    cls: string
    text: string
    startPos: number
    endPos: number
  }

  const headers: Header[] = []
  let match: RegExpExecArray | null

  while ((match = headerRegex.exec(html)) !== null) {
    const cls = match[2].toLowerCase()
    const text = stripHtml(match[3]).trim()

    if (cls === 'subseccion') continue

    headers.push({
      tag: match[1].toLowerCase(),
      cls,
      text,
      startPos: match.index,
      endPos: match.index + match[0].length,
    })
  }

  if (headers.length === 0) {
    console.error('  No relevant h4/h5 headers found')
    return []
  }

  const h5Count = headers.filter((h) => h.cls === 'articulo').length
  const h4Count = headers.filter((h) => h.cls !== 'articulo').length
  console.log(
    `  Found ${h5Count} article headers + ${h4Count} section headers`
  )

  let currentSection = ''
  let currentLibro = ''
  let currentTitulo = ''
  let currentCapitulo = ''

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]

    // Chapter/Title/Section/Libro headers → update currentSection
    if (h.cls.includes('_num')) {
      const level = h.cls.split('_')[0] // libro, titulo, capitulo, seccion
      // Look ahead for matching _tit
      let fullText = h.text
      if (i + 1 < headers.length && headers[i + 1].cls.includes('_tit')) {
        fullText = `${h.text} — ${headers[i + 1].text}`
        i++ // skip the title header
      }

      if (level === 'libro') {
        currentLibro = fullText
        currentTitulo = ''
        currentCapitulo = ''
      } else if (level === 'titulo') {
        currentTitulo = fullText
        currentCapitulo = ''
      } else if (level === 'capitulo' || level === 'seccion') {
        currentCapitulo = fullText
      }

      // Build section hierarchy
      const parts = [currentLibro, currentTitulo, currentCapitulo].filter(
        Boolean
      )
      currentSection = parts.length > 0 ? parts[parts.length - 1] : fullText

      // For the section, we want the most specific level
      // But also prefix with Libro if available for context
      if (currentCapitulo) {
        currentSection = currentCapitulo
      } else if (currentTitulo) {
        currentSection = currentTitulo
      } else if (currentLibro) {
        currentSection = currentLibro
      }

      continue
    }
    if (h.cls.includes('_tit')) {
      // Standalone title (no preceding _num)
      const level = h.cls.split('_')[0]
      if (level === 'titulo') {
        currentTitulo = h.text
        currentCapitulo = ''
        currentSection = h.text
      } else if (level === 'capitulo' || level === 'seccion') {
        currentCapitulo = h.text
        currentSection = h.text
      } else {
        currentSection = h.text
      }
      continue
    }

    // h5.articulo = article or disposición
    if (h.cls !== 'articulo') continue

    const headingText = h.text

    // Skip range headers like "Artículos 107 a 148."
    if (ARTICLE_RANGE_RE.test(headingText)) {
      console.log(`  Skipping range header: "${headingText}"`)
      continue
    }

    // Parse article number (try Latin suffix first, then simple number)
    const artMatch = headingText.match(ARTICLE_RE) || headingText.match(ARTICLE_SIMPLE_RE)

    // Parse disposiciones
    const dispMatch = !artMatch ? headingText.match(DISP_RE) : null

    let numero: string
    let titulo: string

    if (artMatch) {
      const rawNum = artMatch[1].trim()
      // Normalize: "22 quáter" → "22 quater"
      numero = normalizeSuffix(rawNum)
      const tituloRaw = artMatch[2]?.trim().replace(/\.$/, '') || ''
      titulo = tituloRaw
        ? `Artículo ${numero}. ${tituloRaw}`
        : `Artículo ${numero}`
    } else if (dispMatch) {
      const tipo =
        dispMatch[1].charAt(0).toUpperCase() +
        dispMatch[1].slice(1).toLowerCase()
      const { ordinal, titulo: tituloRaw } = parseDisposicionOrdinal(
        dispMatch[2]
      )

      // Generate short code for numero
      const prefix =
        tipo === 'Adicional'
          ? 'DA'
          : tipo === 'Transitoria'
            ? 'DT'
            : tipo === 'Derogatoria'
              ? 'DD'
              : 'DF'
      numero = `${prefix}-${ordinal}`

      // Update section for disposiciones
      const tipoPlural: Record<string, string> = {
        'Adicional': 'Disposiciones adicionales',
        'Transitoria': 'Disposiciones transitorias',
        'Derogatoria': 'Disposición derogatoria',
        'Final': 'Disposiciones finales',
      }
      currentSection = tipoPlural[tipo] || `Disposiciones ${tipo.toLowerCase()}s`

      titulo = tituloRaw
        ? `Disposición ${tipo.toLowerCase()} ${ordinal}. ${tituloRaw}`.replace(
            /\.\./g,
            '.'
          )
        : `Disposición ${tipo.toLowerCase()} ${ordinal}`
    } else {
      // Unknown h5 format — skip
      console.warn(
        `  Skipping unknown h5: "${headingText.substring(0, 60)}"`
      )
      continue
    }

    // Extract body: HTML between this h5's end and the next h4/h5 start
    const nextHeader = headers[i + 1]
    const bodyEnd = nextHeader ? nextHeader.startPos : html.length
    const bodyHtml = html.slice(h.endPos, bodyEnd)

    let texto = stripHtml(bodyHtml).trim()

    // Clean BOE navigation noise
    const noiseMarkers = [
      /\nSubir\b/,
      /\[Bloque \d+:/,
      /Seleccionar redacci/,
      /\nSe (?:modifica|añade|a.ade|suprime|deroga|renumera)[n]?[, ]/,
      /\nSu anterior denominaci/,
      /\nTexto a.adido/,
    ]
    for (const marker of noiseMarkers) {
      const idx = texto.search(marker)
      if (idx > 0) {
        texto = texto.slice(0, idx)
      }
    }
    texto = texto
      .replace(/Jurisprudencia\s*$/, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (texto.length < 5) {
      // Article might be derogated/empty
      continue
    }

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
  const BOE_ID = 'BOE-A-1985-12666'
  const OUTPUT_FILE = 'lo_6_1985_lopj_completa.json'
  const LEY_NOMBRE = 'LOPJ'
  const LEY_NOMBRE_COMPLETO =
    'Ley Orgánica 6/1985, de 1 de julio, del Poder Judicial'

  const url = `https://www.boe.es/buscar/act.php?id=${BOE_ID}`
  console.log(`► Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; OpoRuta/1.0; +https://oporuta.es)',
      Accept: 'text/html',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  console.log(`  HTML: ${html.length} chars`)

  const articles = parseArticlesFromBOE(html)
  console.log(`  Artículos encontrados: ${articles.length}`)

  if (articles.length === 0) {
    console.error(
      'ERROR: No se encontraron artículos. Guardando HTML para diagnóstico...'
    )
    fs.writeFileSync(path.join(DATA_DIR, `${OUTPUT_FILE}.debug.html`), html)
    process.exit(1)
  }

  // Show stats
  const artCount = articles.filter((a) => !a.numero.startsWith('D')).length
  const dispCount = articles.filter((a) => a.numero.startsWith('D')).length
  console.log(`  → ${artCount} artículos + ${dispCount} disposiciones`)
  console.log(`  Primer artículo: ${articles[0].titulo_articulo}`)
  console.log(
    `  Último: ${articles[articles.length - 1].titulo_articulo}`
  )

  // Show sections found
  const sections = [...new Set(articles.map((a) => a.titulo_seccion))]
  console.log(`  Secciones: ${sections.length}`)
  for (const s of sections) {
    const count = articles.filter((a) => a.titulo_seccion === s).length
    console.log(`    - "${s}" (${count})`)
  }

  // Validate: check for duplicates
  const numeros = articles.map((a) => a.numero)
  const dupes = numeros.filter((n, i) => numeros.indexOf(n) !== i)
  if (dupes.length > 0) {
    const uniqueDupes = [...new Set(dupes)]
    console.warn(
      `  ⚠ Duplicate article numbers (${uniqueDupes.length}): ${uniqueDupes.join(', ')}`
    )
    // Show details for each dupe
    for (const d of uniqueDupes) {
      const indices = numeros
        .map((n, i) => (n === d ? i : -1))
        .filter((i) => i >= 0)
      console.warn(`    ${d}:`)
      for (const idx of indices) {
        console.warn(
          `      [${idx}] ${articles[idx].titulo_articulo.substring(0, 80)}`
        )
      }
    }
  } else {
    console.log('  ✓ No duplicate article numbers')
  }

  // Show average text length
  const avgLen = Math.round(
    articles.reduce((sum, a) => sum + a.texto_integro.length, 0) /
      articles.length
  )
  console.log(`  Avg text length: ${avgLen} chars`)

  // Validate: check books coverage
  const libroSections = sections.filter(
    (s) => s.startsWith('LIBRO') || s.includes('Libro')
  )
  console.log(`\n  Libros found in sections: ${libroSections.length}`)
  libroSections.forEach((l) => console.log(`    - ${l}`))

  const ley: LeyJSON = {
    ley_nombre: LEY_NOMBRE,
    ley_codigo: BOE_ID,
    ley_nombre_completo: LEY_NOMBRE_COMPLETO,
    fecha_scraping: new Date().toISOString(),
    total_articulos: articles.length,
    articulos: articles,
  }

  // Ensure directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true })

  const outputPath = path.join(DATA_DIR, OUTPUT_FILE)
  fs.writeFileSync(outputPath, JSON.stringify(ley, null, 2), 'utf-8')
  console.log(`\n✅ Guardado: ${outputPath}`)
  console.log(
    `   ${articles.length} artículos listos para ingestar con 'pnpm ingest:legislacion'`
  )
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
