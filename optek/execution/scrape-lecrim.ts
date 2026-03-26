/**
 * execution/scrape-lecrim.ts — Scraping COMPLETO de la LECrim (RD 14/09/1882)
 *
 * Descarga TODOS los ~998 artículos + disposiciones de la Ley de Enjuiciamiento
 * Criminal desde el BOE consolidado.
 *
 * La LECrim es de 1882 y ha sido muy modificada. El BOE mantiene la versión
 * consolidada con todas las reformas vigentes.
 *
 * Uso:
 *   npx tsx execution/scrape-lecrim.ts
 *
 * Output:
 *   data/legislacion/lecrim_1882_completa.json
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
    // Decode HTML entities FIRST (before cleanup patterns that match accented text)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&#171;/g, '«')
    .replace(/&#187;/g, '»')
    .replace(/&#x[0-9a-f]+;/gi, '')
    .replace(/&#\d+;/g, '')
    // Remove BOE navigation artifacts
    .replace(/\[Bloque\s+\d+:\s*#[^\]]*\]/g, '')
    .replace(/^\s*Subir\s*$/gm, '')
    .replace(/^\s*Jur\s*$/gm, '')
    .replace(/^\s*Jurisprudencia\s*$/gm, '')
    .replace(/^\s*Concordancias\s*$/gm, '')
    // Remove "Seleccionar redacción" blocks (BOE version selectors)
    // These may span multiple lines and contain version info
    .replace(/Seleccionar redacci[oó]n:[\s\S]*?(?=\n\n|$)/g, '')
    .replace(/[ÚU]ltima actualizaci[oó]n,\s+publicada el[^\n]*/g, '')
    .replace(/Modificaci[oó]n publicada el[^\n]*/g, '')
    .replace(/Texto original,?\s+publicado el[^\n]*/g, '')
    .replace(/Texto consolidado a fecha[^\n]*/g, '')
    .replace(/Texto a[ñn]adido,?\s+publicado el[^\n]*/g, '')
    .replace(/Se (?:modifica|añade|suprime|deroga|renumera)[^\n]*Ref\.\s*BOE-A-\d+-\d+/g, '')
    .replace(/en vigor a partir del[^\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Check if text looks like a TOC entry ─────────────────────────────────────

function isTocEntry(texto: string): boolean {
  const artRefCount = (texto.match(/Art[ií]culo\s+\d+/gi) || []).length
  const lines = texto.split('\n').filter(l => l.trim()).length
  if (artRefCount > 10 && artRefCount / lines > 0.3) return true
  if (texto.length > 10000 && artRefCount > 20) return true
  return false
}

// ─── Parse grouped derogated articles (e.g. "Arts. 48 a 50. (Derogados)") ────

function parseGroupedDerogated(html: string): Articulo[] {
  const results: Articulo[] = []
  const seen = new Set<string>()

  // First strip all HTML tags to get clean text for pattern matching
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  // BOE groups derogated articles like:
  //   "Arts. 48 a 50. (Derogados) Se derogan por..."
  //   "Arts. 601 a 610. (Sin contenido) Se dejan sin contenido por..."
  const groupedPattern = /Arts?\.\s+(\d+)\s+a\s+(\d+)\.\s*\(([^)]+)\)\s*([^[]*?)(?=\[|Arts?\.\s+\d|$)/gi
  let match
  while ((match = groupedPattern.exec(plainText)) !== null) {
    const start = parseInt(match[1], 10)
    const end = parseInt(match[2], 10)
    const status = match[3].trim()
    const detail = match[4]?.trim() || ''
    if (isNaN(start) || isNaN(end) || end - start > 50 || end <= start) continue

    const reason = `Arts. ${start} a ${end}. (${status}) ${detail}`.substring(0, 200).trim()

    for (let i = start; i <= end; i++) {
      const num = String(i)
      if (seen.has(num)) continue
      seen.add(num)

      const statusLabel = status.toLowerCase().includes('derogad') ? 'Derogado' :
                          status.toLowerCase().includes('sin contenido') ? 'Sin contenido' : status

      results.push({
        numero: num,
        titulo_articulo: `Artículo ${i}. (${statusLabel})`,
        titulo_seccion: '',
        texto_integro: reason,
      })
    }
  }

  return results
}

// ─── Parse articles from BOE HTML ─────────────────────────────────────────────

function parseArticles(html: string): Articulo[] {
  const rawArticles: Articulo[] = []

  // Pattern to match article headings including "bis", "ter", "quater", etc.
  // LECrim uses "quáter" (with accent) in some articles
  const articleSplitPattern = /(?=Art[ií]culo\s+\d+(?:\s+(?:bis|ter|qu[aá]ter|quinquies|sexies|septies|octies|novies))?(?:\s+[a-k]\)?)?\s*\.)/i

  const splits = html.split(articleSplitPattern)

  let currentSection = ''

  for (const chunk of splits) {
    // Extract section headers — structural headers in the law
    const sectionMatches = chunk.match(/(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION)\s+[IVXLCDM\d]+[^<\n]*/g)
    if (sectionMatches) {
      const cleaned = sectionMatches
        .map(s => stripHtml(s).trim())
        .filter(s => s.length > 3 && s.length < 200)
      if (cleaned.length > 0 && cleaned.length <= 5) {
        currentSection = cleaned.join(' | ')
      } else if (cleaned.length > 5) {
        // TOC or preamble dump — take only the last 2-3 (closest to this article)
        currentSection = cleaned.slice(-3).join(' | ')
      }
    }

    // Extract article number and title
    // Handle LECrim-specific numbering: "Artículo 367 bis", "Artículo 588 quáter a)"
    const artMatch = chunk.match(/Art[ií]culo\s+(\d+(?:\s+(?:bis|ter|qu[aá]ter|quinquies|sexies|septies|octies|novies))?(?:\s+[a-k]\))?)\s*\.?\s*([^\n<.]*)/i)
    if (!artMatch) continue

    const numero = artMatch[1].trim()
    const tituloRaw = artMatch[2]?.trim() || ''
    const titulo = `Artículo ${numero}. ${tituloRaw}`.replace(/\s+/g, ' ').trim()

    // Extract body text (everything after the heading)
    const headingEnd = chunk.indexOf(artMatch[0]) + artMatch[0].length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim()

    // Clean leading period/dot from text
    let textoClean = texto.replace(/^\s*\.\s*/, '').trim()

    // Remove trailing section headers that leak from next section
    textoClean = textoClean
      .replace(/\n(?:LIBRO|TÍTULO|TITULO|CAPÍTULO|CAPITULO|SECCIÓN|SECCION)\s+[IVXLCDM\d]+[^\n]*$/gm, '')
      .replace(/\n(?:Cap[ií]tulo\s+[IVXLCDM\d]+)[^\n]*$/gm, '')
      .replace(/\nDe (?:la|las|los|el)\s+[^\n]{5,80}$/gm, (m) => {
        // Only remove if it looks like a section title (short, at end)
        return m.trim().length < 80 ? '' : m
      })
      .trim()

    if (textoClean.length < 10) continue // Skip empty stubs
    if (isTocEntry(textoClean)) continue // Skip TOC entries

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

  // Split by disposición headings
  const dispoSplitPattern = /(?=Disposici[oó]n\s+(?:adicional|transitoria|derogatoria|final)\s+(?:primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|d[eé]cima|und[eé]cima|duod[eé]cima|decimotercera|decimocuarta|decimoquinta|decimosexta|decimos[eé]ptima|decimoctava|decimonovena|vig[eé]sima|vig[eé]simo\s+\w+|[uú]nica)\b)/i

  const splits = html.split(dispoSplitPattern)

  for (const chunk of splits) {
    const dispoMatch = chunk.match(/Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s+(\w+(?:\s+\w+)?)/i)
    if (!dispoMatch) continue

    const tipo = dispoMatch[1].charAt(0).toUpperCase() + dispoMatch[1].slice(1).toLowerCase()
    const ordinal = dispoMatch[2].trim().toLowerCase()

    const fullHeading = dispoMatch[0]
    const headingEnd = chunk.indexOf(fullHeading) + fullHeading.length
    const bodyHtml = chunk.slice(headingEnd)
    const texto = stripHtml(bodyHtml).trim().replace(/^\s*\.\s*/, '').trim()

    if (texto.length < 10) continue
    if (isTocEntry(texto)) continue

    // Truncate if text contains the start of another disposición
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
      // Penalize entries that look like false positives:
      // - Text starts with comma or lowercase (truncated mid-sentence)
      if (/^[,;]/.test(c.texto_integro)) score -= 20
      // - Title contains "de la Constitución", "del Código", etc. (cross-reference, not real title)
      if (/(?:de la Constituci[oó]n|del C[oó]digo|de la Ley)/i.test(titleWords)) score -= 15
      // - Very short text (<50 chars) that starts with fragment
      if (c.texto_integro.length < 50) score -= 5
      return { art: c, score }
    })
    scored.sort((a, b) => b.score - a.score)
    articles.push(scored[0].art)
  }

  // Sort by article number (base number first, then suffix)
  articles.sort((a, b) => {
    const numA = parseInt(a.numero.split(/\s/)[0], 10)
    const numB = parseInt(b.numero.split(/\s/)[0], 10)
    if (numA !== numB) return numA - numB
    return a.numero.localeCompare(b.numero)
  })

  return articles
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  LECrim (RD 14/09/1882) — Scraping COMPLETO (~998 artículos)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // The BOE consolidated URL for LECrim
  const url = 'https://www.boe.es/buscar/act.php?id=BOE-A-1882-6036'
  console.log(`► Fetching: ${url}`)
  console.log('  (la LECrim es muy grande ~5MB+, puede tardar 10-30 segundos...)')

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
  const boeId = boeMatch ? boeMatch[0] : 'BOE-A-1882-6036'
  console.log(`  BOE ID: ${boeId}`)

  // Parse all articles (no range filtering — we want ALL of them)
  console.log('')
  console.log('► Parseando artículos...')
  const rawArticles = parseArticles(html)
  console.log(`  Artículos raw: ${rawArticles.length}`)

  // Parse grouped derogated articles (e.g. "Artículos 48 a 50")
  const groupedDerogated = parseGroupedDerogated(html)
  console.log(`  Artículos agrupados (derogados/sin contenido): ${groupedDerogated.length}`)

  // Merge: regular articles take priority over grouped placeholders
  const regularNums = new Set(rawArticles.map(a => a.numero))
  const newFromGrouped = groupedDerogated.filter(a => !regularNums.has(a.numero))
  console.log(`  Nuevos de agrupados (no duplicados): ${newFromGrouped.length}`)

  const allRaw = [...rawArticles, ...newFromGrouped]
  const articles = deduplicateArticles(allRaw)
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
    fs.writeFileSync(path.join(DATA_DIR, 'lecrim_debug.html'), html)
    console.error(`  HTML guardado en: ${path.join(DATA_DIR, 'lecrim_debug.html')}`)
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

  // Check coverage (articles 1-999)
  const artNumbers = new Set(articles.map(a => parseInt(a.numero.split(/\s/)[0], 10)).filter(n => !isNaN(n)))
  const missing: number[] = []
  // LECrim goes up to article 999 (some may be derogated/empty)
  for (let i = 1; i <= 999; i++) {
    if (!artNumbers.has(i)) missing.push(i)
  }
  if (missing.length > 0 && missing.length < 50) {
    console.log('')
    console.log(`  ⚠ Artículos base no encontrados (${missing.length}): ${missing.join(', ')}`)
    console.log('    (algunos pueden estar derogados o vacíos en la versión consolidada)')
  } else if (missing.length >= 50) {
    console.log('')
    console.log(`  ⚠ Artículos base no encontrados: ${missing.length}`)
    console.log(`    Primeros 30: ${missing.slice(0, 30).join(', ')}`)
    console.log('    (algunos pueden estar derogados — revisar HTML si el número es alto)')
  } else {
    console.log('')
    console.log('  ✓ Todos los artículos 1-999 presentes')
  }

  // Show article distribution by hundreds
  console.log('')
  console.log('  Distribución por centenas:')
  for (let start = 1; start <= 900; start += 100) {
    const end = start + 99
    const count = articles.filter(a => {
      const n = parseInt(a.numero.split(/\s/)[0], 10)
      return n >= start && n <= end
    }).length
    console.log(`    Arts ${String(start).padStart(3)}-${String(end).padStart(3)}: ${count} artículos`)
  }

  // Build output JSON
  const ley: LeyJSON = {
    ley_nombre: 'LECrim',
    ley_codigo: boeId,
    ley_nombre_completo: 'Real decreto de 14 de septiembre de 1882 por el que se aprueba la Ley de Enjuiciamiento Criminal',
    fecha_scraping: new Date().toISOString(),
    total_articulos: allEntries.length,
    articulos: allEntries,
  }

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const outputPath = path.join(DATA_DIR, 'lecrim_1882_completa.json')
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
