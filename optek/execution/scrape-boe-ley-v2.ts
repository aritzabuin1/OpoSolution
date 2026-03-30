/**
 * execution/scrape-boe-ley-v2.ts — Improved BOE scraper using act.php HTML structure
 *
 * The BOE act.php pages use:
 *   - <h4 class="capitulo_num"> for chapter numbers (e.g., "CAPÍTULO I")
 *   - <h4 class="capitulo_tit"> for chapter titles
 *   - <h5 class="articulo"> for article headings (and disposiciones)
 *   - <p> for body text between h5 headings
 *
 * Usage:
 *   npx tsx execution/scrape-boe-ley-v2.ts <boe-id> <output-filename> <ley-nombre> <ley-nombre-completo>
 *
 * Example:
 *   npx tsx execution/scrape-boe-ley-v2.ts BOE-A-1995-24292 ley_31_1995_prl.json PRL "Ley 31/1995, de 8 de noviembre, de Prevención de Riesgos Laborales"
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
      try { return String.fromCharCode(parseInt(m.slice(3, -1), 16)) } catch { return '' }
    })
    .replace(/&#(\d+);/g, (_m, code) => {
      try { return String.fromCharCode(parseInt(code)) } catch { return '' }
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Parse using <h5 class="articulo"> structure ──────────────────────────────

function parseArticlesFromBOE(html: string): Articulo[] {
  const articles: Articulo[] = []

  // Find all relevant headers: <h4 class="capitulo_num/tit"> and <h5 class="articulo">
  // Also handle <h4 class="titulo_num"> and <h4 class="titulo_tit"> for TÍTULO headers
  const headerRegex = /<(h[45])\s+class="((?:capitulo|titulo|seccion)_(?:num|tit)|articulo|subseccion)"[^>]*>([\s\S]*?)<\/\1>/gi

  interface Header {
    tag: string
    cls: string
    text: string
    startPos: number  // position of the start of the tag
    endPos: number    // position after the closing tag
  }

  const headers: Header[] = []
  let match: RegExpExecArray | null

  while ((match = headerRegex.exec(html)) !== null) {
    const cls = match[2].toLowerCase()
    const text = stripHtml(match[3]).trim()

    // Skip preamble h4.subseccion elements (like "JUAN CARLOS I", "EXPOSICIÓN DE MOTIVOS", numbered paragraphs)
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

  const h5Count = headers.filter(h => h.cls === 'articulo').length
  const h4Count = headers.filter(h => h.cls !== 'articulo').length
  console.log(`  Found ${h5Count} article headers + ${h4Count} section headers`)

  let currentSection = ''

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]

    // Chapter/Title/Section headers → update currentSection
    if (h.cls.includes('_num')) {
      // Look ahead for matching _tit
      if (i + 1 < headers.length && headers[i + 1].cls.includes('_tit')) {
        currentSection = `${h.text} — ${headers[i + 1].text}`
        i++ // skip the title header
      } else {
        currentSection = h.text
      }
      continue
    }
    if (h.cls.includes('_tit')) {
      // Standalone title (no preceding _num)
      currentSection = h.text
      continue
    }

    // h5.articulo = article or disposición
    if (h.cls !== 'articulo') continue

    const headingText = h.text

    // Map Spanish ordinals to numbers (for old laws like LOGP that use "Artículo primero")
    const ORDINAL_MAP: Record<string, string> = {
      primero: '1', segundo: '2', tercero: '3', cuarto: '4', quinto: '5',
      sexto: '6', séptimo: '7', septimo: '7', octavo: '8', noveno: '9', diez: '10',
      once: '11', doce: '12', trece: '13', catorce: '14', quince: '15',
      dieciséis: '16', dieciseis: '16', diecisiete: '17', dieciocho: '18', diecinueve: '19', veinte: '20',
      veintiuno: '21', veintiún: '21', veintidós: '22', veintidos: '22', veintitrés: '23', veintitres: '23',
      veinticuatro: '24', veinticinco: '25', veintiséis: '26', veintiseis: '26',
      veintisiete: '27', veintiocho: '28', veintinueve: '29', treinta: '30',
      'treinta y uno': '31', 'treinta y dos': '32', 'treinta y tres': '33', 'treinta y cuatro': '34',
      'treinta y cinco': '35', 'treinta y seis': '36', 'treinta y siete': '37', 'treinta y ocho': '38',
      'treinta y nueve': '39', cuarenta: '40', 'cuarenta y uno': '41', 'cuarenta y dos': '42',
      'cuarenta y tres': '43', 'cuarenta y cuatro': '44', 'cuarenta y cinco': '45',
      'cuarenta y seis': '46', 'cuarenta y siete': '47', 'cuarenta y ocho': '48',
      'cuarenta y nueve': '49', cincuenta: '50', 'cincuenta y uno': '51', 'cincuenta y dos': '52',
      'cincuenta y tres': '53', 'cincuenta y cuatro': '54', 'cincuenta y cinco': '55',
      'cincuenta y seis': '56', 'cincuenta y siete': '57', 'cincuenta y ocho': '58',
      'cincuenta y nueve': '59', sesenta: '60', 'sesenta y uno': '61', 'sesenta y dos': '62',
      'sesenta y tres': '63', 'sesenta y cuatro': '64', 'sesenta y cinco': '65',
      'sesenta y seis': '66', 'sesenta y siete': '67', 'sesenta y ocho': '68',
      'sesenta y nueve': '69', setenta: '70', 'setenta y uno': '71', 'setenta y dos': '72',
      'setenta y tres': '73', 'setenta y cuatro': '74', 'setenta y cinco': '75',
      'setenta y seis': '76', 'setenta y siete': '77', 'setenta y ocho': '78',
      'setenta y nueve': '79', ochenta: '80',
    }

    // Try numeric format first: "Artículo 14", "Artículo 177 bis"
    let artMatch = headingText.match(
      /^Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|quater|quinquies|sexies|septies|octies|novies))?)\s*\.?\s*(.*)/i
    )

    // If not numeric, try ordinal format: "Artículo primero", "Artículo quince bis"
    if (!artMatch) {
      const ordinalMatch = headingText.match(
        /^Art[ií]culo\s+([a-záéíóúñü]+(?:\s+y\s+[a-záéíóúñü]+)?(?:\s+(?:bis|ter|quater|quinquies))?)\s*\.?\s*(.*)/i
      )
      if (ordinalMatch) {
        const raw = ordinalMatch[1].toLowerCase().trim()
        // Split off bis/ter suffix if present
        const suffixMatch = raw.match(/^(.+?)\s+(bis|ter|quater|quinquies)$/i)
        const baseWord = suffixMatch ? suffixMatch[1] : raw
        const suffix = suffixMatch ? ` ${suffixMatch[2]}` : ''
        const num = ORDINAL_MAP[baseWord]
        if (num) {
          // Reconstruct as artMatch-compatible result
          artMatch = [headingText, `${num}${suffix}`, ordinalMatch[2] || ''] as unknown as RegExpMatchArray
        }
      }
    }

    // Parse disposiciones (with or without ordinal)
    const dispMatch = !artMatch
      ? headingText.match(
          /^Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)(?:\s+(\S+))?\s*\.?\s*(.*)/i
        )
      : null

    let numero: string
    let titulo: string

    if (artMatch) {
      numero = artMatch[1].trim()
      const tituloRaw = artMatch[2]?.trim().replace(/\.$/, '') || ''
      titulo = tituloRaw
        ? `Artículo ${numero}. ${tituloRaw}`
        : `Artículo ${numero}`
    } else if (dispMatch) {
      const tipo = dispMatch[1].charAt(0).toUpperCase() + dispMatch[1].slice(1).toLowerCase()
      const ordinal = dispMatch[2]?.toLowerCase() || 'única'
      const tituloRaw = dispMatch[3]?.trim().replace(/\.$/, '') || ''

      // Generate short code for numero
      const prefix = tipo === 'Adicional' ? 'DA'
                   : tipo === 'Transitoria' ? 'DT'
                   : tipo === 'Derogatoria' ? 'DD'
                   : 'DF'
      numero = `${prefix}-${ordinal}`
      titulo = tituloRaw
        ? `Disposición ${tipo.toLowerCase()} ${ordinal}. ${tituloRaw}`.replace(/\.\./g, '.')
        : `Disposición ${tipo.toLowerCase()} ${ordinal}`
    } else {
      // Unknown h5 format — skip
      console.warn(`  Skipping unknown h5: "${headingText.substring(0, 60)}"`)
      continue
    }

    // Extract body: HTML between this h5's end and the next h4/h5 start
    const nextHeader = headers[i + 1]
    const bodyEnd = nextHeader ? nextHeader.startPos : html.length
    const bodyHtml = html.slice(h.endPos, bodyEnd)

    let texto = stripHtml(bodyHtml).trim()

    // Clean BOE navigation noise from article text
    // Strategy: find the FIRST occurrence of any navigation marker and truncate there
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
  const args = process.argv.slice(2)

  if (args.length < 4) {
    console.log(
      'Uso: npx tsx execution/scrape-boe-ley-v2.ts <boe-id> <output-filename> <ley-nombre> <ley-nombre-completo>'
    )
    console.log('')
    console.log('Ejemplo:')
    console.log(
      '  npx tsx execution/scrape-boe-ley-v2.ts BOE-A-1995-24292 ley_31_1995_prl.json PRL "Ley 31/1995, de 8 de noviembre, de Prevención de Riesgos Laborales"'
    )
    process.exit(1)
  }

  const [boeId, outputFilename, leyNombre, leyNombreCompleto] = args

  const url = `https://www.boe.es/buscar/act.php?id=${boeId}`
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
    fs.writeFileSync(
      path.join(DATA_DIR, `${outputFilename}.debug.html`),
      html
    )
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
  const numeros = articles.map(a => a.numero)
  const dupes = numeros.filter((n, i) => numeros.indexOf(n) !== i)
  if (dupes.length > 0) {
    console.warn(`  ⚠ Duplicate article numbers: ${[...new Set(dupes)].join(', ')}`)
  }

  // Show average text length
  const avgLen = Math.round(articles.reduce((sum, a) => sum + a.texto_integro.length, 0) / articles.length)
  console.log(`  Avg text length: ${avgLen} chars`)

  const ley: LeyJSON = {
    ley_nombre: leyNombre,
    ley_codigo: boeId,
    ley_nombre_completo: leyNombreCompleto,
    fecha_scraping: new Date().toISOString(),
    total_articulos: articles.length,
    articulos: articles,
  }

  // Ensure directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true })

  const outputPath = path.join(DATA_DIR, outputFilename)
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
