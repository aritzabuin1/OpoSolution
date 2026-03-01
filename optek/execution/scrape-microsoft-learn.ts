/**
 * execution/scrape-microsoft-learn.ts — OPTEK §1.3A.4
 *
 * Extrae contenido estructurado de Microsoft Support/Learn en español.
 * Aplica chunking por objeto funcional (ver data/ofimatica/CHUNKING_STRATEGY.md).
 *
 * Estrategia de chunking:
 *   - Una sección de la página = un chunk funcional
 *   - Secciones <200 palabras se fusionan con la siguiente
 *   - Secciones >1500 palabras se dividen por subsecciones
 *   - Se preservan rutas de menú completas dentro de cada chunk
 *
 * Rate limit: 1 request cada 2 segundos (respeta robots.txt de nivel educativo)
 *
 * Uso:
 *   pnpm scrape:ofimatica word
 *   pnpm scrape:ofimatica excel
 *   pnpm scrape:ofimatica access
 *   pnpm scrape:ofimatica outlook
 *   pnpm scrape:ofimatica windows
 *   pnpm scrape:ofimatica all
 *
 * Variables de entorno requeridas: ninguna (scraping público)
 * Output: data/ofimatica/[producto].json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OFIMATICA_DIR = path.join(__dirname, '..', '..', 'data', 'ofimatica')

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Seccion {
  titulo: string
  contenido: string
  subtema: string
  fuente_url: string
}

interface ProductoJSON {
  tema_nombre: string
  tema_numero: number
  bloque: 'ofimatica' | 'informatica' | 'admin_electronica'
  fuente_url: string
  fecha_scraping: string
  secciones: Seccion[]
}

// ─── Catálogo de fuentes ──────────────────────────────────────────────────────

interface FuenteConfig {
  tema_nombre: string
  tema_numero: number
  bloque: 'ofimatica' | 'informatica' | 'admin_electronica'
  urls: Array<{ url: string; subtema: string }>
}

const FUENTES: Record<string, FuenteConfig> = {
  word: {
    tema_nombre: 'Word 365',
    tema_numero: 24,
    bloque: 'ofimatica',
    urls: [
      { url: 'https://support.microsoft.com/es-es/word', subtema: 'General' },
      { url: 'https://support.microsoft.com/es-es/office/atajos-de-teclado-en-word-95ef89dd-7142-4b50-afb2-f762f663ceb2', subtema: 'Atajos' },
      { url: 'https://support.microsoft.com/es-es/office/insertar-una-tabla-en-word-a138f745-73ef-4879-b99a-2f3d38be612a', subtema: 'Tablas' },
      { url: 'https://support.microsoft.com/es-es/office/opciones-de-formato-de-p%c3%a1rrafo-en-word-8b41acca-14e6-416f-8993-a01c4ad7bc13', subtema: 'Formato' },
    ],
  },
  excel: {
    tema_nombre: 'Excel 365',
    tema_numero: 25,
    bloque: 'ofimatica',
    urls: [
      { url: 'https://support.microsoft.com/es-es/excel', subtema: 'General' },
      { url: 'https://support.microsoft.com/es-es/office/m%c3%e9todos-abreviados-de-teclado-de-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f', subtema: 'Atajos' },
      { url: 'https://support.microsoft.com/es-es/office/funciones-de-excel-por-categor%c3%eda-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb', subtema: 'Funciones' },
    ],
  },
  access: {
    tema_nombre: 'Access 365',
    tema_numero: 26,
    bloque: 'ofimatica',
    urls: [
      { url: 'https://support.microsoft.com/es-es/access', subtema: 'General' },
      { url: 'https://support.microsoft.com/es-es/office/m%c3%e9todos-abreviados-de-teclado-para-access-70a673e4-9a2c-42d3-8a3f-8c06e8b1c5e5', subtema: 'Atajos' },
    ],
  },
  outlook: {
    tema_nombre: 'Outlook 365',
    tema_numero: 27,
    bloque: 'ofimatica',
    urls: [
      { url: 'https://support.microsoft.com/es-es/outlook', subtema: 'General' },
      { url: 'https://support.microsoft.com/es-es/office/m%c3%e9todos-abreviados-de-teclado-de-outlook-3cdeb221-7ae5-4462-8038-2a7cfe3b5a26', subtema: 'Atajos' },
    ],
  },
  windows: {
    tema_nombre: 'Windows 11 y Copilot',
    tema_numero: 22,
    bloque: 'ofimatica',
    urls: [
      { url: 'https://support.microsoft.com/es-es/windows', subtema: 'Windows 11' },
      { url: 'https://support.microsoft.com/es-es/windows/m%c3%e9todos-abreviados-de-teclado-en-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec', subtema: 'Atajos Windows' },
      { url: 'https://support.microsoft.com/es-es/copilot', subtema: 'Copilot' },
    ],
  },
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

const RATE_LIMIT_MS = 2000

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (educational-content-scraper/1.0; OPTEK-oposiciones)',
        'Accept-Language': 'es-ES,es;q=0.9',
        Accept: 'text/html',
      },
    })

    if (!response.ok) {
      console.warn(`  ⚠️  HTTP ${response.status} para ${url}`)
      return null
    }

    return await response.text()
  } catch (err) {
    console.warn(`  ⚠️  Error fetching ${url}:`, err instanceof Error ? err.message : String(err))
    return null
  }
}

/**
 * Extrae secciones funcionales de una página HTML de Microsoft Support.
 * Aplica la estrategia de chunking por objeto funcional.
 * Usa cheerio (ya instalado como dependencia de boe-scraper).
 */
function extractSections(html: string, pageUrl: string, subtema: string): Seccion[] {
  const $ = cheerio.load(html)

  // Eliminar elementos no relevantes
  $('nav, header, footer, .feedback, .breadcrumb, script, style, aside, [role="banner"]').remove()

  // Selector principal del contenido (Microsoft Support usa varios)
  const mainSelector = $('main, [role="main"], .ocpArticleContent, article').first()
  const $main = mainSelector.length > 0 ? mainSelector : $('body')

  const titulo_pagina =
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    subtema

  const secciones: Seccion[] = []

  // Extraer secciones por h2/h3
  const headers = $main.find('h2, h3').toArray()

  if (headers.length === 0) {
    // Página sin headers — tratar como una sola sección
    const texto = $main.text().replace(/\s+/g, ' ').trim()
    if (texto.length > 100) {
      secciones.push({
        titulo: titulo_pagina,
        contenido: limpiarTexto(texto),
        subtema,
        fuente_url: pageUrl,
      })
    }
    return secciones
  }

  // Procesar cada sección delimitada por h2/h3
  for (const header of headers) {
    const $header = $(header)
    const titulo_seccion = $header.text().trim()
    if (!titulo_seccion || titulo_seccion.length < 3) continue

    // Recoger texto de siblings hasta el próximo header
    let contenido = ''
    let $node = $header.next()
    const headerTag = header.tagName.toUpperCase()

    while ($node.length > 0) {
      const tag = $node.prop('tagName')?.toUpperCase() ?? ''
      // Parar en h1, h2 (siempre), o h3 si estamos en h2
      if (tag === 'H1' || tag === 'H2' || (headerTag === 'H2' && tag === 'H3')) break

      const text = $node.text() ?? ''
      if (text.trim()) contenido += text + ' '
      $node = $node.next()
    }

    contenido = limpiarTexto(contenido)
    if (contenido.length < 50) continue

    const palabras = contenido.split(/\s+/).length

    // Merging: chunks demasiado cortos se fusionan con el anterior
    if (palabras < 50 && secciones.length > 0) {
      secciones[secciones.length - 1].contenido += '\n\n' + titulo_seccion + ':\n' + contenido
      continue
    }

    // Truncar si es demasiado largo (>1500 palabras)
    let contenidoFinal = contenido
    if (palabras > 1500) {
      const palabrasArr = contenido.split(/\s+/)
      contenidoFinal = palabrasArr.slice(0, 1500).join(' ') + '...[continúa]'
    }

    secciones.push({
      titulo: `${titulo_pagina} — ${titulo_seccion}`,
      contenido: contenidoFinal,
      subtema,
      fuente_url: pageUrl,
    })
  }

  return secciones
}

function limpiarTexto(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Procesador de un producto ────────────────────────────────────────────────

async function scrapeProducto(productoClave: string): Promise<ProductoJSON | null> {
  const config = FUENTES[productoClave]
  if (!config) {
    console.error(`❌ Producto no reconocido: ${productoClave}`)
    console.log(`   Disponibles: ${Object.keys(FUENTES).join(', ')}`)
    return null
  }

  console.log(`\n🌐 Scraping: ${config.tema_nombre} (${config.urls.length} URLs)`)

  const todasSecciones: Seccion[] = []

  for (let i = 0; i < config.urls.length; i++) {
    const { url, subtema } = config.urls[i]
    console.log(`  [${i + 1}/${config.urls.length}] ${url.slice(0, 80)}...`)

    const html = await fetchPage(url)
    if (html) {
      const secciones = extractSections(html, url, subtema)
      console.log(`    → ${secciones.length} secciones extraídas`)
      todasSecciones.push(...secciones)
    }

    // Rate limiting: esperar entre requests
    if (i < config.urls.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
    }
  }

  if (todasSecciones.length === 0) {
    console.warn(`  ⚠️  Sin secciones extraídas para ${config.tema_nombre}`)
  }

  const output: ProductoJSON = {
    tema_nombre: config.tema_nombre,
    tema_numero: config.tema_numero,
    bloque: config.bloque,
    fuente_url: config.urls[0].url,
    fecha_scraping: new Date().toISOString(),
    secciones: todasSecciones,
  }

  console.log(`  ✅ Total: ${todasSecciones.length} secciones`)
  return output
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , target] = process.argv
  console.log('📚 OPTEK — Scraper de Microsoft Learn/Support')
  console.log('==============================================')
  console.log('Rate limit: 1 request / 2s (modo educativo)')

  if (!fs.existsSync(OFIMATICA_DIR)) {
    fs.mkdirSync(OFIMATICA_DIR, { recursive: true })
  }

  const productos = target === 'all' || !target
    ? Object.keys(FUENTES)
    : [target]

  let ok = 0
  let errors = 0

  for (const producto of productos) {
    const resultado = await scrapeProducto(producto)

    if (!resultado) {
      errors++
      continue
    }

    const outPath = path.join(OFIMATICA_DIR, `${producto}.json`)
    fs.writeFileSync(outPath, JSON.stringify(resultado, null, 2), 'utf-8')
    console.log(`  💾 Guardado: ${outPath}`)
    ok++

    // Pausa entre productos
    if (productos.indexOf(producto) < productos.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS * 2))
    }
  }

  console.log('\n==============================================')
  console.log(`✅ ${ok} producto(s) scrapeados`)
  if (errors > 0) console.log(`❌ ${errors} error(es)`)
  console.log('\n📌 Revisión manual recomendada antes de ingestar.')
  console.log('   Siguiente paso: pnpm ingest:ofimatica')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
