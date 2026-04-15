/**
 * execution/scrape-correos-operativa.ts
 *
 * Scrapes operational content from cristinaiglesias.neocities.org
 * (Correos corporate tools, admission processes, delivery procedures, products).
 *
 * Output: data/correos/operativa_t{NN}_{slug}.json
 * Compatible with ingest-conocimiento-correos.ts format.
 *
 * Usage:
 *   pnpm scrape:correos-operativa
 *
 * Rate limit: 1 request/second (be nice to free hosting)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as cheerio from 'cheerio'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'data', 'correos')

const BASE_URL = 'https://cristinaiglesias.neocities.org/paginas'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScrapePage {
  url: string
  subtema: string
}

interface ScrapeGroup {
  slug: string
  titulo: string
  temaCorreos: number // Correos BD tema number
  pages: ScrapePage[]
}

// ─── Manifest ────────────────────────────────────────────────────────────────
// Correos BD temas: 1=Marco normativo, 2=Organización, 3=Paquetería,
// 4=Productos oficinas, 5=Nuevas líneas, 6=Herramientas IRIS/SGIE,
// 7=Admisión, 8=Tratamiento/Transporte, 9=Distribución/Entrega,
// 10=Atención cliente, 11=Internacionalización, 12=Cumplimiento

const GROUPS: ScrapeGroup[] = [
  // ── Tema 6: Herramientas corporativas (IRIS, SGIE, SIE, PDA) ──
  {
    slug: 'iris',
    titulo: 'IRIS 6.0 — Sistema principal oficinas Correos',
    temaCorreos: 6,
    pages: [
      { url: `${BASE_URL}/OTRO8/IRIS%206.0.html`, subtema: 'IRIS 6.0: descripción general, acceso y menús' },
      { url: `${BASE_URL}/OTRO8/Proceso%20de%20admision%20Ordinario-Certificado.html`, subtema: 'IRIS: admisión ordinario y certificado' },
      { url: `${BASE_URL}/OTRO8/Admision%20de%20envios%20postales.html`, subtema: 'IRIS: admisión de envíos postales' },
      { url: `${BASE_URL}/OTRO8/Admision%20linea%20economica.html`, subtema: 'IRIS: admisión línea económica' },
      { url: `${BASE_URL}/OTRO8/Admision%20envio%20de%20dinero.html`, subtema: 'IRIS: admisión envío de dinero' },
      { url: `${BASE_URL}/OTRO8/Admision%20de%20productos%20telefraficos.html`, subtema: 'IRIS: admisión productos telegráficos' },
      { url: `${BASE_URL}/OTRO8/Menu%20de%20admision%20IRIS%20Otros%20servicios.html`, subtema: 'IRIS: menú admisión otros servicios' },
      { url: `${BASE_URL}/OTRO8/Procesos%20IRIS%20desde%20llamadas%20a%20sistemas%20externos.html`, subtema: 'IRIS: llamadas a sistemas externos' },
      { url: `${BASE_URL}/OTRO8/Gestion%20de%20caja.html`, subtema: 'IRIS: gestión de caja y cierre' },
    ],
  },
  {
    slug: 'sgei',
    titulo: 'SGEI/SGIE — Sistema gestión envíos registrados',
    temaCorreos: 6,
    pages: [
      { url: `${BASE_URL}/OTRO8/SGEI.html`, subtema: 'SGEI: descripción general y funciones' },
      { url: `${BASE_URL}/OTRO8/Recepcion%20y%20control%20de%20despachos.html`, subtema: 'SGEI distribución: recepción y control de despachos' },
      { url: `${BASE_URL}/OTRO8/Alta%20en%20unidad%20de%20reparto.html`, subtema: 'SGEI distribución: alta en unidad de reparto' },
      { url: `${BASE_URL}/OTRO8/Asignar%20a%20seccion_.html`, subtema: 'SGEI distribución: asignar a sección' },
      { url: `${BASE_URL}/OTRO8/Liquidacion%20seccion.html`, subtema: 'SGEI distribución: liquidación de sección' },
      { url: `${BASE_URL}/OTRO8/Cierre%20de%20Reparto.html`, subtema: 'SGEI distribución: cierre de reparto' },
      { url: `${BASE_URL}/OTRO8/Gestion%20de%20despachos%20de%20salida.html`, subtema: 'SGEI distribución: gestión despachos de salida' },
      { url: `${BASE_URL}/OTRO8/Entradas.html`, subtema: 'SGEI oficinas: entradas' },
      { url: `${BASE_URL}/OTRO8/Entrega%20de%20Envios.html`, subtema: 'SGEI oficinas: entrega de envíos' },
      { url: `${BASE_URL}/OTRO8/Salida%20y%20Cierre.html`, subtema: 'SGEI oficinas: salida y cierre' },
    ],
  },
  {
    slug: 'pda',
    titulo: 'PDA y aplicaciones móviles de reparto',
    temaCorreos: 6,
    pages: [
      { url: `${BASE_URL}/OTRO8/PDA.html`, subtema: 'PDA: descripción general y tipos' },
      { url: `${BASE_URL}/OTRO8/Entar%20en%20la%20PDA.html`, subtema: 'PDA distribución: acceso y login' },
      { url: `${BASE_URL}/OTRO8/Reparto.html`, subtema: 'PDA distribución: proceso de reparto' },
      { url: `${BASE_URL}/OTRO8/Liquidacion.html`, subtema: 'PDA distribución: liquidación' },
      { url: `${BASE_URL}/OTRO8/PDA%20OFICINA.html`, subtema: 'PDA oficina: funciones' },
      { url: `${BASE_URL}/OTRO8/TAURO.html`, subtema: 'TAURO: app de reparto' },
      { url: `${BASE_URL}/OTRO8/HERA.html`, subtema: 'HERA: herramienta de rutas' },
    ],
  },
  {
    slug: 'sie_quenda',
    titulo: 'SIE, QUENDA y otras herramientas',
    temaCorreos: 6,
    pages: [
      { url: `${BASE_URL}/OTRO8/SIE%20distribucion.html`, subtema: 'SIE distribución: información estadística' },
      { url: `${BASE_URL}/OTRO8/SIE%20Oficinas.html`, subtema: 'SIE oficinas: información estadística' },
      { url: `${BASE_URL}/OTRO8/QUENDA.html`, subtema: 'QUENDA: gestión turnos y atención cliente' },
      { url: `${BASE_URL}/OTRO8/Acceso%20a%20la%20aplicacion.html`, subtema: 'QUENDA: acceso a la aplicación' },
      { url: `${BASE_URL}/OTRO8/Menu%20Atencion%20al%20Cliente.html`, subtema: 'QUENDA: menú atención al cliente' },
      { url: `${BASE_URL}/OTRO8/SIGUA.html`, subtema: 'SIGUA: seguimiento automatizado' },
      { url: `${BASE_URL}/OTRO8/Intranet%20CONECTA.html`, subtema: 'Intranet CONECTA: portal interno' },
    ],
  },

  // ── Tema 7: Proceso de Admisión ──
  {
    slug: 'admision',
    titulo: 'Proceso de admisión en oficina',
    temaCorreos: 7,
    pages: [
      { url: `${BASE_URL}/OTRO5/Admision_Aduana.html`, subtema: 'Admisión: índice de procesos y aduanas' },
      { url: `${BASE_URL}/Tema7/ADMISION.html`, subtema: 'Admisión: proceso general en oficina' },
      { url: `${BASE_URL}/Tema7/7.7.%20La%20admision%20en%20Oficina.html`, subtema: 'La admisión en oficina: pasos y verificaciones' },
      { url: `${BASE_URL}/Tema7/7.3.5.%20El%20franqueo%20mediante%20etiquetas%20generadas%20por%20IRIS.html`, subtema: 'Franqueo mediante etiquetas IRIS' },
      { url: `${BASE_URL}/Tema7/7.12.3%20La%20admision%20de%20paqueteria.html`, subtema: 'Admisión de paquetería' },
      { url: `${BASE_URL}/Tema7/7.13.1%20La%20admision%20de%20cartas%20ordinarias%20nacionales%20e%20internacionales.html`, subtema: 'Admisión de cartas ordinarias nacionales e internacionales' },
      { url: `${BASE_URL}/Tema7/7.14.4%20La%20admision%20del%20Paq%20Retorno%20Premium%20y%20del%20Paq%20Retorno.html`, subtema: 'Admisión de Paq Retorno Premium y Paq Retorno' },
      { url: `${BASE_URL}/OTRO5/ADMISION%20INDIVIDUALIZADA%20EN%20OFICINA.html`, subtema: 'Admisión individualizada en oficina' },
      { url: `${BASE_URL}/OTRO5/Admision%20de%20envios%20prerregistrados%20en%20Mi%20Oficina.html`, subtema: 'Admisión de envíos prerregistrados en Mi Oficina' },
      { url: `${BASE_URL}/OTRO5/Admision%20Correos%20Express.html`, subtema: 'Admisión Correos Express' },
      { url: `${BASE_URL}/OTRO5/Admision%20en%20IRIS%20de%20envios%20con%20Mercancias%20Peligrosas.html`, subtema: 'Admisión en IRIS de envíos con mercancías peligrosas' },
      { url: `${BASE_URL}/OTRO5/T%E2%82%ACNvio.html`, subtema: 'T€nvío: admisión digital prerregistrada' },
      { url: `${BASE_URL}/OTRO5/Recogida%20a%20domicilio.html`, subtema: 'Recogida a domicilio' },
    ],
  },

  // ── Tema 4: Servicios financieros en oficina ──
  {
    slug: 'financieros',
    titulo: 'Servicios financieros: giros, SEDI, cobros',
    temaCorreos: 4,
    pages: [
      { url: `${BASE_URL}/Tema5/Servicios%20Financieros.html`, subtema: 'Servicios financieros: índice general' },
      { url: `${BASE_URL}/OTRO5/Admision%20de%20Servicios%20Financieros.html`, subtema: 'Admisión de servicios financieros y SEDI' },
      { url: `${BASE_URL}/OTRO5/Impresos%20de%20Giro-CEDICO.html`, subtema: 'Impresos de giro y sistema CEDICO' },
      { url: `${BASE_URL}/OTRO7_2/Entrega%20de%20giros-Envio%20de%20dinero.html`, subtema: 'Entrega de giros y envío de dinero' },
    ],
  },

  // ── Tema 1: Productos y servicios postales ──
  {
    slug: 'productos',
    titulo: 'Productos y servicios postales',
    temaCorreos: 1,
    pages: [
      { url: `${BASE_URL}/Servicios%20postales%20todos.html`, subtema: 'Servicios postales: visión general' },
      { url: `${BASE_URL}/Linea%20basica.html`, subtema: 'Línea básica: productos y características' },
      { url: `${BASE_URL}/Linea%20Urgente.html`, subtema: 'Línea urgente: productos y plazos' },
      { url: `${BASE_URL}/Linea%20de%20paqueteria.html`, subtema: 'Línea de paquetería: Paq 10/14/24/48/72' },
      { url: `${BASE_URL}/Tema4/Linea%20Economica.html`, subtema: 'Línea económica: publicorreo y marketing' },
      { url: `${BASE_URL}/Tema1/Productos%20con%20tratamiento%20SICE.html`, subtema: 'Productos con tratamiento SICE' },
      { url: `${BASE_URL}/Tema2/Paq%2010,%20Paq%2014%20y%20Paq%2024.html`, subtema: 'Paq 10, Paq 14, Paq 24: detalles y diferencias' },
    ],
  },

  // ── Tema 2: Valores añadidos ──
  {
    slug: 'valores_anadidos',
    titulo: 'Valores añadidos y servicios adicionales',
    temaCorreos: 3,
    pages: [
      { url: `${BASE_URL}/OTRO2/Valores%20a%C3%B1adidos.html`, subtema: 'Valores añadidos: índice completo' },
      { url: `${BASE_URL}/OTRO2/Aviso%20de%20Recibo%20(AR).html`, subtema: 'Aviso de Recibo (AR): procedimiento y formulario' },
    ],
  },

  // ── Tema 8: Clasificación y tratamiento ──
  {
    slug: 'clasificacion',
    titulo: 'Clasificación, tratamiento y transporte',
    temaCorreos: 8,
    pages: [
      { url: `${BASE_URL}/OTRO6/Procesos%20de%20Tratamiento%20y%20Transporte.html`, subtema: 'Procesos de tratamiento y transporte' },
      { url: `${BASE_URL}/Tema8/clasificacion.html`, subtema: 'Clasificación: centros y procesos' },
      { url: `${BASE_URL}/OTRO7/Clasificacion%20correspondencia%20registrada%20y%20grabacion%20en%20SGIE.html`, subtema: 'Clasificación de correspondencia registrada y grabación en SGIE' },
    ],
  },

  // ── Tema 9: Distribución y entrega ──
  {
    slug: 'entrega',
    titulo: 'Distribución y entrega de envíos',
    temaCorreos: 9,
    pages: [
      { url: `${BASE_URL}/OTRO7/Procesos%20de%20Entrega%20I.html`, subtema: 'Procesos de entrega parte I' },
      { url: `${BASE_URL}/OTRO7_2/Procesos%20de%20Entrega%20II.html`, subtema: 'Procesos de entrega parte II' },
      { url: `${BASE_URL}/OTRO7_2/Recepcion,%20almacenamiento%20y%20entrega%20de%20envios%20registrados.html`, subtema: 'Recepción, almacenamiento y entrega de envíos registrados' },
      { url: `${BASE_URL}/OTRO7_2/Entrega%20de%20envios%20registrados.html`, subtema: 'Entrega de envíos registrados: procedimiento' },
      { url: `${BASE_URL}/OTRO7/Particularidades%20en%20la%20entrega%20de%20algunos%20productos_1.html`, subtema: 'Particularidades en la entrega de productos' },
      { url: `${BASE_URL}/OTRO7/Recepcion%20de%20envios%20a%20traves%20del%20Buzon%20Electronico%20de%20SGIE.html`, subtema: 'Recepción de envíos mediante buzón electrónico SGIE' },
    ],
  },

  // ── Tema 10: Atención al cliente ──
  {
    slug: 'atencion_cliente',
    titulo: 'Atención al cliente y reclamaciones',
    temaCorreos: 10,
    pages: [
      { url: `${BASE_URL}/Tema10/El%20Cliente.html`, subtema: 'El cliente: atención, quejas y reclamaciones' },
      { url: `${BASE_URL}/OTRO4/Oficina.html`, subtema: 'Oficina de Correos: servicios disponibles' },
      { url: `${BASE_URL}/OTRO4/Apartados%20Postales.html`, subtema: 'Apartados postales y lista de correos' },
    ],
  },

  // ── Tema 3: Paquetería y e-commerce ──
  {
    slug: 'ecommerce',
    titulo: 'Paquetería, e-commerce y soluciones digitales',
    temaCorreos: 3,
    pages: [
      { url: `${BASE_URL}/Tema3/Paqueteria%20y%20e-Commerce.html`, subtema: 'Paquetería y e-Commerce: servicios y plataformas' },
      { url: `${BASE_URL}/OTRO8/Soluciones%20ecommerce%20de%20Correos-Comandia.html`, subtema: 'Soluciones e-commerce: Comandia y marketplace' },
      { url: `${BASE_URL}/OTRO8/APP%20CORREOS.html`, subtema: 'App Correos: funcionalidades' },
      { url: `${BASE_URL}/OTRO8/APP%20CITYPAQ.html`, subtema: 'CityPaq: taquillas automáticas' },
      { url: `${BASE_URL}/OTRO8/CityPaq%20Partners.html`, subtema: 'CityPaq Partners: red de puntos' },
      { url: `${BASE_URL}/OTRO8/Portal%20de%20devoluciones.html`, subtema: 'Portal de devoluciones' },
    ],
  },

  // ── Tema 5: Nuevas líneas de negocio ──
  {
    slug: 'nuevas_lineas',
    titulo: 'Nuevas líneas de negocio',
    temaCorreos: 5,
    pages: [
      { url: `${BASE_URL}/OTRO8/Correos%20Labs.html`, subtema: 'Correos Labs: innovación y nuevos servicios' },
      { url: `${BASE_URL}/OTRO8/Web%20Comercial.html`, subtema: 'Web comercial de Correos' },
      { url: `${BASE_URL}/OTRO8/Tienda%20Online.html`, subtema: 'Tienda online de Correos' },
      { url: `${BASE_URL}/OTRO8/El%20Camino%20de%20Santiago%20con%20Correos.html`, subtema: 'El Camino de Santiago con Correos' },
    ],
  },

  // ── Glosario ──
  {
    slug: 'glosario',
    titulo: 'Glosario y siglas de Correos',
    temaCorreos: 6,
    pages: [
      { url: `${BASE_URL}/GLOSARIO/GLOSARIO.html`, subtema: 'Glosario completo de siglas y términos Correos' },
    ],
  },

  // ── Tema 11: Internacionalización ──
  {
    slug: 'internacionalizacion',
    titulo: 'Internacionalización: UPU, aduanas y envíos internacionales',
    temaCorreos: 11,
    pages: [
      { url: `${BASE_URL}/OTRO5/Admision_Aduana.html`, subtema: 'Aduanas: procesos de admisión internacional' },
      { url: `${BASE_URL}/OTRO5/Admision%20de%20envios%20prerregistrados%20en%20Mi%20Oficina.html`, subtema: 'Envíos internacionales prerregistrados' },
    ],
  },

  // ── Tema 12: Normas de cumplimiento ──
  {
    slug: 'cumplimiento',
    titulo: 'Normas de cumplimiento: RGPD, blanqueo, ética y ciberseguridad',
    temaCorreos: 12,
    pages: [
      // cristinaiglesias no tiene sección específica de cumplimiento/RGPD
      // El contenido se ha creado manualmente en operativa_t12_cumplimiento.json
      // Si se descubren URLs futuras, añadirlas aquí
    ],
  },
]

// ─── Scraping ────────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'OpoRuta-Bot/1.0 (educational use; oporuta.es)',
      'Accept': 'text/html',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.text()
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html)

  // Remove scripts and styles only — neocities puts ALL content inside <nav>
  $('script, style').remove()

  // Get body content directly (neocities uses <nav> for ALL content, not navigation)
  let $content = $('body')

  // Convert tables to readable text
  $content.find('table').each(function () {
    const $table = $(this)
    const rows: string[] = []
    $table.find('tr').each(function () {
      const cells: string[] = []
      $(this).find('th, td').each(function () {
        cells.push($(this).text().trim())
      })
      if (cells.length > 0) rows.push(cells.join(' | '))
    })
    $table.replaceWith(rows.join('\n'))
  })

  // Convert lists to readable format
  $content.find('ol, ul').each(function () {
    const items: string[] = []
    $(this).find('> li').each(function (i) {
      items.push(`${i + 1}) ${$(this).text().trim()}`)
    })
    $(this).replaceWith(items.join('\n'))
  })

  // Get text, collapse whitespace
  let text = $content.text()
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()

  // Remove very short content (likely empty pages or redirects)
  if (text.length < 50) return ''

  return text
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface CorreosJSON {
  tema: number
  titulo: string
  contenido: Array<{ subtema: string; texto: string }>
  fuente: string
}

async function main() {
  console.log('🕸️  OpoRuta — Scraping Correos Operativa')
  console.log('📡 Fuente: cristinaiglesias.neocities.org')
  console.log('='.repeat(55))

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  let totalSections = 0
  let totalErrors = 0
  let totalChars = 0

  for (const group of GROUPS) {
    console.log(`\n📂 ${group.titulo} (tema ${group.temaCorreos})`)
    const secciones: Array<{ subtema: string; texto: string }> = []

    for (const page of group.pages) {
      process.stdout.write(`  📄 ${page.subtema.slice(0, 60)}... `)
      try {
        const html = await fetchPage(page.url)
        const text = htmlToText(html)

        if (text.length < 100) {
          console.log('⚠️ SKIP (too short)')
          continue
        }

        // Chunk if too long (>3000 chars → split by double newline)
        if (text.length > 3000) {
          const paragraphs = text.split(/\n\n+/)
          let chunk = ''
          let chunkIdx = 0
          for (const para of paragraphs) {
            if (chunk.length + para.length > 2500 && chunk.length > 500) {
              secciones.push({ subtema: `${page.subtema} (parte ${chunkIdx + 1})`, texto: chunk.trim() })
              totalChars += chunk.length
              chunk = ''
              chunkIdx++
            }
            chunk += para + '\n\n'
          }
          if (chunk.trim().length > 100) {
            secciones.push({
              subtema: chunkIdx > 0 ? `${page.subtema} (parte ${chunkIdx + 1})` : page.subtema,
              texto: chunk.trim(),
            })
            totalChars += chunk.length
          }
          console.log(`✅ ${text.length} chars → ${chunkIdx + 1} chunks`)
        } else {
          secciones.push({ subtema: page.subtema, texto: text })
          totalChars += text.length
          console.log(`✅ ${text.length} chars`)
        }

        totalSections++
      } catch (err) {
        console.log(`❌ ${err instanceof Error ? err.message : String(err)}`)
        totalErrors++
      }

      await sleep(1000) // rate limit
    }

    if (secciones.length === 0) {
      console.log(`  ⚠️ No content scraped for ${group.slug}`)
      continue
    }

    // Write JSON in same format as existing correos data
    const output: CorreosJSON = {
      tema: group.temaCorreos,
      titulo: group.titulo,
      contenido: secciones,
      fuente: 'cristinaiglesias.neocities.org',
    }

    const filename = `operativa_t${String(group.temaCorreos).padStart(2, '0')}_${group.slug}.json`
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(output, null, 2), 'utf-8')
    console.log(`  💾 ${filename} (${secciones.length} secciones)`)
  }

  console.log('\n' + '='.repeat(55))
  console.log(`✅ ${totalSections} páginas scrapeadas`)
  console.log(`📝 ${GROUPS.reduce((s, g) => s + g.pages.length, 0) - totalErrors} exitosas, ${totalErrors} errores`)
  console.log(`📊 ${(totalChars / 1024).toFixed(0)} KB de contenido total`)
  console.log('\nSiguiente paso: pnpm ingest:correos')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
