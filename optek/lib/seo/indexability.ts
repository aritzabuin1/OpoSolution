/**
 * lib/seo/indexability.ts — PlanSEO F0.T5
 *
 * Decides which /ley/[slug]/[articulo-slug] URLs are indexable for Google.
 *
 * Policy: an article is indexable if ANY of the following holds
 *   1. The ley belongs to CORE_LAWS (high-priority curricular laws every opositor studies).
 *   2. The article has ≥1 cross-reference with preguntas_oficiales (pre-computed in
 *      data/seo/indexable-cross-ref.json by execution/build-indexable-set.ts).
 *
 * Everything else is noindex,follow — Google keeps crawling links but drops the page
 * from the index. This concentrates crawl budget on content with information gain.
 */

import crossRefData from '@/data/seo/indexable-cross-ref.json'

/**
 * Laws that are ALWAYS indexable (every article). These are core oposiciones law
 * everyone studies — even if a specific article has no cross-reference yet, Google
 * should index it because organic demand exists for every article.
 */
const CORE_LAWS: ReadonlySet<string> = new Set([
  'CE',               // Constitución Española
  'LPAC',             // Ley 39/2015 procedimiento administrativo
  'LRJSP',            // Ley 40/2015 régimen jurídico sector público
  'TREBEP',           // Estatuto básico empleado público
  'LOPDGDD',          // Protección de datos
  'LOTC',             // Tribunal Constitucional
  'GOBIERNO',         // Ley 50/1997 del Gobierno
  'TRANSPARENCIA',    // Ley 19/2013 LTAIBG
  'LOIGUALDAD',       // Igualdad efectiva mujeres y hombres
  'LGP',              // Ley General Presupuestaria
  'LOPJ',             // Ley Orgánica del Poder Judicial
  // Cuerpos de seguridad (policía, guardia civil, ertzaintza)
  'FCSE',             // Fuerzas y Cuerpos Seguridad del Estado
  'LOEX',             // Ley Extranjería
  'SEG_CIUDADANA',    // Ley seguridad ciudadana
  'LSV',              // Ley tráfico y seguridad vial
  // Penitenciarias
  'LOGP',             // Ley Orgánica General Penitenciaria
  'RP',               // Reglamento Penitenciario
  // Hacienda
  'LGT',              // Ley General Tributaria
  'LIRPF',            // IRPF
  'LIVA',             // IVA
  'LIS',              // Impuesto Sociedades
])

const crossRefKeys: Set<string> = new Set((crossRefData as { keys?: string[] }).keys ?? [])

/**
 * Returns true if /ley/{ley}/{articulo-slug} should be indexed.
 *
 * @param leyNombre - DB leyNombre value (e.g. "CE", "LPAC", "LEC")
 * @param articuloNumero - DB articulo_numero (e.g. "14", "DA primera", "2.1")
 */
export function isArticleIndexable(leyNombre: string, articuloNumero: string): boolean {
  if (CORE_LAWS.has(leyNombre)) return true
  const key = `${leyNombre}:${articuloNumero}`
  return crossRefKeys.has(key)
}

/** Count of cross-referenced articles (for diagnostics). */
export function crossReferencedCount(): number {
  return crossRefKeys.size
}

/** Exposed for tests / sitemap debug. */
export const INDEXABLE_CORE_LAWS = CORE_LAWS
