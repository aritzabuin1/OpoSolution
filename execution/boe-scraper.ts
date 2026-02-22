/**
 * execution/boe-scraper.ts
 *
 * Scrapes consolidated law text from BOE (boe.es) for the
 * Auxiliar Administrativo del Estado exam preparation (OPTEK).
 *
 * Source: BOE Código 435 — "Normativa para ingreso en el Cuerpo General
 * Auxiliar de la Administración del Estado"
 * https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=435
 *
 * Usage (from optek/ directory):
 *   pnpm scrape:boe           → scrape all laws
 *   pnpm scrape:boe LPAC      → scrape one law by name
 *   pnpm scrape:boe BOE-A-2015-10565 → scrape by BOE ID
 */

import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data', 'legislacion')
const BOE_BASE = 'https://www.boe.es/buscar/act.php?id='
const RATE_LIMIT_MS = 1500 // 1.5s between requests (BOE asks max 1 req/s)

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Laws catalogue ──────────────────────────────────────────────────────────
// Only laws relevant to Auxiliar Administrativo del Estado (BOE Código 435)

const LEYES = [
  {
    codigo: 'BOE-A-2015-10565',
    nombre: 'LPAC',
    nombre_completo:
      'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
    archivo: 'ley_39_2015_lpac.json',
  },
  {
    codigo: 'BOE-A-2015-10566',
    nombre: 'LRJSP',
    nombre_completo:
      'Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público',
    archivo: 'ley_40_2015_lrjsp.json',
  },
  {
    codigo: 'BOE-A-1978-31229',
    nombre: 'CE',
    nombre_completo: 'Constitución Española, de 27 de diciembre de 1978',
    archivo: 'constitucion_española_1978.json',
  },
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function fetchHTML(boeId: string): Promise<string> {
  const url = `${BOE_BASE}${boeId}`
  console.log(`  GET ${url}`)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; OPTEK-research/1.0; academic use)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

// ─── Parser ───────────────────────────────────────────────────────────────────
//
// BOE consolidated HTML structure (all inside #textoxslt):
//
//   <div class="bloque" id="tpreliminar">   ← Title block
//     <h4 class="titulo_num">TÍTULO PRELIMINAR</h4>
//     <h4 class="titulo_tit">Disposiciones generales</h4>
//   </div>
//   <div class="bloque" id="ci">            ← Chapter block
//     <h4 class="capitulo_num">CAPÍTULO I</h4>
//     <h4 class="capitulo_tit">De los interesados</h4>
//   </div>
//   <div class="bloque" id="s1">            ← Section block
//     <h4 class="seccion">Sección 1.ª Disposiciones generales</h4>
//   </div>
//   <div class="bloque" id="a1">            ← Article block
//     <h5 class="articulo">Artículo 1. Objeto de la Ley.</h5>
//     <p class="parrafo">1. La presente Ley...</p>
//     <p class="parrafo">2. Solo mediante ley...</p>
//   </div>
//
// Blocks are siblings, never nested in each other.

function parseLey(html: string, ley: (typeof LEYES)[number]): LeyJSON {
  const $ = cheerio.load(html)
  const articulos: Articulo[] = []

  let currentTitulo = ''
  let currentCapitulo = ''
  let currentSeccion = ''

  // All content blocks are div.bloque inside #textoxslt
  $('#textoxslt div.bloque').each((_, el) => {
    const $el = $(el)

    // ── Title block ──
    const tituloNum = $el.find('h4.titulo_num').first()
    if (tituloNum.length) {
      const tituloTit = $el.find('h4.titulo_tit').first()
      currentTitulo = tituloNum.text().trim()
      if (tituloTit.length) currentTitulo += ' — ' + tituloTit.text().trim()
      currentCapitulo = ''
      currentSeccion = ''
      return
    }

    // ── Chapter block ──
    const capNum = $el.find('h4.capitulo_num').first()
    if (capNum.length) {
      const capTit = $el.find('h4.capitulo_tit').first()
      currentCapitulo = capNum.text().trim()
      if (capTit.length) currentCapitulo += ' — ' + capTit.text().trim()
      currentSeccion = ''
      return
    }

    // ── Section block ──
    const seccion = $el.find('h4.seccion').first()
    if (seccion.length) {
      currentSeccion = seccion.text().trim()
      return
    }

    // ── Article block (artículos + disposiciones adicionales/transitorias/finales) ──
    const h5 = $el.find('h5.articulo').first()
    if (!h5.length) return

    const tituloArticulo = h5.text().trim()

    // Extract article number from different heading patterns:
    //   "Artículo 1. ..."           → "1"
    //   "Artículo 9 bis."           → "9 bis"
    //   "Disposición adicional primera." → "da_primera"
    //   "Disposición final sexta."  → "df_sexta"
    const artMatch = tituloArticulo.match(
      /^Art[ií]culo\s+([\d\w](?:[\s\w]*[\w])?)\s*[\.\-]/
    )
    const dispMatch = tituloArticulo.match(
      /^Disposici[oó]n\s+(adicional|transitoria|derogatoria|final)\s+(.+?)[\.\-]/i
    )
    const numero = artMatch
      ? artMatch[1].trim()
      : dispMatch
        ? `d${dispMatch[1][0].toLowerCase()}_${dispMatch[2].trim().replace(/\s+/g, '_')}`
        : ($el.attr('id') ?? '').replace(/^a/, '')

    // Collect paragraph text; skip [Bloque X: ...] markers
    const parrafos: string[] = []
    $el.find('p.parrafo, p.parrafo_2').each((_, p) => {
      const text = $(p).text().trim()
      if (text && !text.startsWith('[Bloque')) {
        parrafos.push(text)
      }
    })

    if (parrafos.length === 0) return

    const tituloSeccion = [currentTitulo, currentCapitulo, currentSeccion]
      .filter(Boolean)
      .join(' | ')

    articulos.push({
      numero,
      titulo_articulo: tituloArticulo,
      titulo_seccion: tituloSeccion,
      texto_integro: parrafos.join('\n'),
    })
  })

  return {
    ley_nombre: ley.nombre,
    ley_codigo: ley.codigo,
    ley_nombre_completo: ley.nombre_completo,
    fecha_scraping: new Date().toISOString(),
    total_articulos: articulos.length,
    articulos,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function scrapeLey(ley: (typeof LEYES)[number]): Promise<void> {
  console.log(`\n[${ley.nombre}] ${ley.nombre_completo}`)

  const html = await fetchHTML(ley.codigo)
  const result = parseLey(html, ley)

  const outputPath = path.join(DATA_DIR, ley.archivo)
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')

  console.log(`  ✓ ${result.total_articulos} artículos → ${ley.archivo}`)

  // Quick sanity check
  if (result.total_articulos === 0) {
    console.warn('  ⚠ WARNING: 0 artículos extraídos — revisar HTML estructura')
  }
}

async function main() {
  const args = process.argv.slice(2)

  fs.mkdirSync(DATA_DIR, { recursive: true })

  // Filter laws by argument (name or BOE ID), or scrape all
  let toScrape: (typeof LEYES)[number][] = [...LEYES]

  if (args.length > 0 && args[0].toLowerCase() !== 'all') {
    const query = args[0].toUpperCase()
    const filtered = LEYES.filter(
      (l) => l.nombre === query || l.codigo === args[0]
    )
    if (filtered.length === 0) {
      const names = LEYES.map((l) => l.nombre).join(', ')
      console.error(`Unknown law: "${args[0]}". Available: ${names} or "all"`)
      process.exit(1)
    }
    toScrape = filtered
  }

  console.log('━'.repeat(60))
  console.log('BOE Scraper — Auxiliar Administrativo del Estado (OPTEK)')
  console.log(`Laws to scrape: ${toScrape.map((l) => l.nombre).join(', ')}`)
  console.log(`Output dir:     ${DATA_DIR}`)
  console.log('━'.repeat(60))

  for (let i = 0; i < toScrape.length; i++) {
    if (i > 0) {
      process.stdout.write(`  Waiting ${RATE_LIMIT_MS}ms (rate limit)...`)
      await sleep(RATE_LIMIT_MS)
      process.stdout.write(' OK\n')
    }

    try {
      await scrapeLey(toScrape[i])
    } catch (err) {
      console.error(`  ✗ Error scraping ${toScrape[i].codigo}:`, err)
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log('✅ Done. Review output in data/legislacion/')
  console.log('━'.repeat(60))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
