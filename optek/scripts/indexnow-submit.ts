#!/usr/bin/env npx tsx
/**
 * scripts/indexnow-submit.ts
 *
 * Envía todas las URLs públicas de OpoRuta a IndexNow (Bing, Yandex, Naver, Seznam).
 * Perplexity usa el índice de Bing → esto acelera la aparición en LLMs.
 *
 * Uso: npx tsx scripts/indexnow-submit.ts
 * Opcional: npx tsx scripts/indexnow-submit.ts --only-new  (solo URLs nuevas/modificadas)
 *           npx tsx scripts/indexnow-submit.ts --ley       (solo /ley/ pSEO pages)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const INDEXNOW_KEY = 'fe9c4816141564c97f07016fe17a7b96'
const HOST = 'https://oporuta.es'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

// Todas las URLs públicas importantes
const STATIC_URLS = [
  '/',
  '/blog',
  '/precios',
  '/preguntas-frecuentes',
  '/examenes-oficiales',
  '/simulacros',
  '/herramientas',
  '/herramientas/calculadora-nota-auxiliar-administrativo',
  '/herramientas/calculadora-nota-administrativo-estado',
  '/herramientas/calculadora-nota-hacienda',
  '/herramientas/calculadora-nota-correos',
  '/herramientas/calculadora-nota-justicia',
  // Catálogo de oposiciones (fuente canónica)
  '/oposiciones',
  // Landing pages por rama
  '/oposiciones/administracion',
  '/oposiciones/correos',
  '/oposiciones/justicia',
  '/oposiciones/justicia/auxilio-judicial',
  '/oposiciones/justicia/tramitacion-procesal',
  '/oposiciones/justicia/gestion-procesal',
  '/oposiciones/hacienda',
  '/oposiciones/penitenciarias',
  '/oposiciones/seguridad',
  '/oposiciones/seguridad/ertzaintza',
  '/oposiciones/seguridad/guardia-civil',
  '/oposiciones/seguridad/policia-nacional',
  '/oposiciones/seguridad/personalidad-policial',
  // Exámenes oficiales
  '/examenes-oficiales/inap-2024',
  '/examenes-oficiales/inap-2022',
  '/examenes-oficiales/inap-2019',
  '/examenes-oficiales/inap-2018',
  '/examenes-oficiales/inap-c1-2024',
  '/examenes-oficiales/inap-c1-2022',
  '/examenes-oficiales/inap-c1-2019',
  // Ley hub
  '/ley',
  // LLM files
  '/llms.txt',
  '/llms-full.txt',
  '/api/info',
]

// High-priority laws: top articles submitted for each
const HIGH_PRIORITY_LAW_SLUGS = [
  'constitucion-espanola',
  'ley-39-2015-lpac',
  'ley-40-2015-lrjsp',
  'estatuto-basico-empleado-publico',
  'codigo-penal',
  'ley-organica-general-penitenciaria',
  'ley-enjuiciamiento-criminal',
  'ley-organica-poder-judicial',
  'ley-general-tributaria',
  'ley-contratos-sector-publico',
  'ley-fuerzas-cuerpos-seguridad',
  'ley-proteccion-datos',
  'ley-igualdad-efectiva-mujeres-hombres',
]

const ARTICLES_PER_HIGH_PRIORITY_LAW = 40

/** Slugify an article number: "14" → "articulo-14", "14 bis" → "articulo-14-bis", "DA-primera" → "da-primera" */
function slugifyArticle(article: string): string {
  let s = article
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/\.$/, '')              // trim trailing dots
    .replace(/\s+/g, '-')           // spaces → hyphens

  // Disposiciones: starts with d followed by a/f/t (da_, df_, dt_, derogatoria, etc.)
  const isDisposicion = /^d[aft][-_]/.test(s) || s.startsWith('derogatoria')
  if (!isDisposicion) {
    s = `articulo-${s}`
  }
  // Normalize underscores to hyphens
  s = s.replace(/_/g, '-')
  return s
}

/** Build all /ley/ URLs from article-index.json */
function buildLeyUrls(): string[] {
  const indexPath = join(__dirname, '..', 'data', 'seo', 'article-index.json')
  const data = JSON.parse(readFileSync(indexPath, 'utf-8')) as {
    laws: { leyNombre: string; slug: string; articles: string[]; totalArticles: number }[]
    totalArticles: number
  }

  const urls: string[] = []

  // 1. Hub page
  urls.push('/ley')

  // 2. All 53 law index pages
  for (const law of data.laws) {
    urls.push(`/ley/${law.slug}`)
  }

  // 3. Top articles from high-priority laws
  const highPrioritySet = new Set(HIGH_PRIORITY_LAW_SLUGS)
  for (const law of data.laws) {
    if (!highPrioritySet.has(law.slug)) continue
    const articlesToSubmit = law.articles.slice(0, ARTICLES_PER_HIGH_PRIORITY_LAW)
    for (const art of articlesToSubmit) {
      urls.push(`/ley/${law.slug}/${slugifyArticle(art)}`)
    }
  }

  return urls
}

// URLs de blog que queremos priorizar (ramas nuevas + top performers)
const PRIORITY_BLOG_SLUGS = [
  // Seguridad (nuevas, sin indexar)
  'test-ertzaintza-2026-practica-online-gratis-ia',
  'oposiciones-guardia-civil-2026-temario-plazas-examen',
  'examen-policia-nacional-3-opciones-penalizacion',
  'psicotecnicos-oposiciones-policia-2026',
  'sueldo-guardia-civil-policia-nacional-2026',
  'oporuta-vs-opositatest-oposiciones-policia',
  'test-personalidad-policial-prueba-psicotecnica',
  // Hacienda (pocas impresiones)
  'test-agente-hacienda-2026',
  'temario-agente-hacienda-2026',
  'notas-corte-agente-hacienda',
  'como-aprobar-agente-hacienda-estrategia',
  'sueldo-agente-hacienda-publica-2026',
  'oporuta-vs-opositatest-hacienda-2026',
  'mejores-apps-oposiciones-hacienda-2026',
  // Penitenciarias (pocas impresiones)
  'test-instituciones-penitenciarias-2026',
  'temario-instituciones-penitenciarias-2026',
  'como-aprobar-penitenciarias-estrategia-bloques',
  'sueldo-funcionario-prisiones-2026',
  'oporuta-vs-opositatest-penitenciarias-2026',
  'mejores-apps-oposiciones-penitenciarias-2026',
  // Correos (creciendo)
  'examen-correos-2026-guia-completa',
  'test-correos-online-gratis',
  'oposiciones-correos-2026-convocatoria-plazas-fechas',
  'psicotecnicos-correos-2026-tipos-ejemplos-practica',
  // Justicia
  'guia-auxilio-judicial-2026',
  'guia-tramitacion-procesal-2026',
  'gestion-procesal-a2-2026',
  'oporuta-vs-opositatest-justicia-auxilio-tramitacion-2026',
  // Top performers (re-submit con dateModified actualizado)
  'supuesto-practico-administrativo-estado-c1-estrategia',
  'psicotecnicas-examen-auxiliar-administrativo-estado',
  'contratacion-publica-lcsp-administrativo-estado-c1',
  'sueldo-gestion-estado-a2-gace-2026-nomina-desglosada',
  'temario-auxiliar-administrativo-estado-2025-2026',
  'calendario-oposiciones-age-2026-fechas-auxiliar-administrativo',
  'mejores-plataformas-ia-oposiciones-2026-comparativa',
  'oporuta-vs-opositatest-auxiliar-administrativo-2026',
  // === SEO update 2026-04-06: títulos reescritos + posts nuevos ===
  // Posts con títulos/descriptions reescritos (dateModified 2026-04-06)
  'sueldo-administrativo-estado-c1-2026-nomina',
  'nota-corte-auxiliar-administrativo-estado',
  'diferencias-auxiliar-c2-administrativo-c1-estado',
  'requisitos-oposiciones-auxiliar-administrativo-estado-2026',
  'sueldo-auxiliar-administrativo-estado-2026-nomina-desglosada',
  'plazas-auxiliar-administrativo-2026',
  'preparar-oposicion-auxiliar-administrativo-por-libre',
  'psicotecnicos-auxiliar-administrativo-tipos-trucos',
  'elegir-destino-auxiliar-administrativo-estado',
  'como-preparar-oposicion-auxiliar-administrativo-estado-guia',
  'trienios-funcionarios-2026-cuanto-cobras-antiguedad',
  'calendario-oposiciones-administrativo-estado-c1-2026',
  'cuantos-temas-examen-auxiliar-administrativo-estado',
  // Posts nuevos (2026-04-06)
  'mejores-destinos-auxiliar-administrativo-estado-ranking',
  'oposiciones-administracion-general-estado-2026-guia',
  'trebep-guia-completa-oposiciones-2026',
  // === High-volume query posts (2026-04-06 sprint 2) ===
  'test-oposiciones-online-gratis-2026',
  'preparar-oposiciones-con-inteligencia-artificial-2026',
  'test-administrativo-estado-c1-online-gratis-2026',
  'test-gace-a2-online-gratis-2026',
  'test-gestion-procesal-online-gratis-2026',
  'test-guardia-civil-online-gratis-2026',
  'test-policia-nacional-online-gratis-2026',
  // Rewritten comparativa title
  'mejores-plataformas-ia-oposiciones-2026-comparativa',
]

async function submitToIndexNow(urls: string[]) {
  const fullUrls = urls.map(u => u.startsWith('http') ? u : `${HOST}${u}`)

  // IndexNow acepta hasta 10.000 URLs por batch
  const body = {
    host: 'oporuta.es',
    key: INDEXNOW_KEY,
    keyLocation: `${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: fullUrls,
  }

  console.log(`\n📡 Enviando ${fullUrls.length} URLs a IndexNow...`)

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    if (res.ok || res.status === 202) {
      console.log(`✅ IndexNow aceptó ${fullUrls.length} URLs (status ${res.status})`)
    } else {
      const text = await res.text()
      console.error(`❌ IndexNow respondió ${res.status}: ${text}`)
    }
  } catch (err) {
    console.error('❌ Error conectando con IndexNow:', err)
  }
}

async function main() {
  const onlyNew = process.argv.includes('--only-new')
  const leyMode = process.argv.includes('--ley')

  const blogUrls = PRIORITY_BLOG_SLUGS.map(s => `/blog/${s}`)

  if (leyMode) {
    const leyUrls = buildLeyUrls()
    console.log(`📖 Modo --ley: ${leyUrls.length} URLs de /ley/ pSEO pages`)
    await submitToIndexNow(leyUrls)
  } else if (onlyNew) {
    console.log('🔍 Modo --only-new: solo URLs de ramas nuevas + blog actualizado')
    await submitToIndexNow([
      ...STATIC_URLS.filter(u =>
        u.includes('/seguridad') ||
        u.includes('/hacienda') ||
        u.includes('/penitenciarias') ||
        u === '/' ||
        u === '/precios' ||
        u === '/llms.txt' ||
        u === '/api/info')
      ,
      ...blogUrls,
    ])
  } else {
    console.log('🌐 Modo completo: todas las URLs públicas')
    await submitToIndexNow([...STATIC_URLS, ...blogUrls])
  }

  console.log('\n📋 Siguiente paso: ve a Google Search Console → URL Inspection')
  console.log('   y solicita indexación manual de las landing pages clave:')
  console.log('   - https://oporuta.es/oposiciones/seguridad')
  console.log('   - https://oporuta.es/oposiciones/seguridad/guardia-civil')
  console.log('   - https://oporuta.es/oposiciones/seguridad/policia-nacional')
  console.log('   - https://oporuta.es/oposiciones/hacienda')
  console.log('   - https://oporuta.es/oposiciones/penitenciarias')
  console.log('   - https://oporuta.es/oposiciones/correos')
  console.log('   - https://oporuta.es/ley/constitucion-espanola')
  console.log('\n💡 Google NO soporta IndexNow, pero Bing sí → y Perplexity usa el índice de Bing.')
}

main()
