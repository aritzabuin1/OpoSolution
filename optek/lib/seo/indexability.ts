/**
 * lib/seo/indexability.ts
 *
 * Decide qué URLs /ley/[slug]/[articulo-slug] entran en el índice de Google.
 *
 * Política (2026-04-26 — corrección post Search Console):
 *   - Indexable SÓLO si el artículo tiene cross-reference con una pregunta oficial
 *     (data/seo/indexable-cross-ref.json, generado por execution/build-indexable-set.ts)
 *     o está en MANUAL_INDEXABLE (artículos icónicos de la CE/TREBEP que se preguntan
 *     en cualquier oposición pero pueden no tener cross-ref aún).
 *   - Todo lo demás devuelve noindex,follow. Google sigue crawlando los enlaces
 *     internos (PageRank fluye), pero la URL no entra en el índice.
 *
 * Por qué este cambio:
 *   La política previa (CORE_LAWS = 21 leyes enteras indexables) generó ~9.500
 *   URLs marcadas por Google como "Descubierta: actualmente sin indexar". Google
 *   las trataba como thin content (réplica del BOE) y arrastraba la calidad
 *   percibida del dominio entero. Concentramos crawl budget y autoridad en las
 *   URLs con verdadero information gain (cita en exámenes oficiales).
 */

import crossRefData from '@/data/seo/indexable-cross-ref.json'

/**
 * Whitelist manual: artículos icónicos preguntados en TODAS las oposiciones AGE
 * aunque aún no tengan cross-reference en nuestro dataset. Mantener corta —
 * cada entrada nueva debe ser un artículo claramente reclamado por demanda
 * orgánica (ej. CE art. 14 igualdad, art. 103 administración pública).
 */
const MANUAL_INDEXABLE: ReadonlySet<string> = new Set([
  // Constitución Española — bloque organizativo nuclear
  'CE:14',   // Igualdad ante la ley
  'CE:16',   // Libertad religiosa
  'CE:23',   // Acceso a la función pública
  'CE:53',   // Garantías derechos fundamentales
  'CE:97',   // Funciones del Gobierno
  'CE:103',  // Principios de la Administración Pública
  'CE:105',  // Audiencia ciudadanos / acceso archivos
  'CE:137',  // Organización territorial
  'CE:149',  // Competencias exclusivas Estado
  'CE:150',  // Transferencia/delegación competencias
  // TREBEP — núcleo
  'TREBEP:14',  // Derechos individuales
  'TREBEP:17',  // Provisión puestos de trabajo
  'TREBEP:50',  // Vacaciones
  'TREBEP:52',  // Deberes empleados
  // LPAC — los más preguntados
  'LPAC:21',    // Obligación de resolver
  'LPAC:35',    // Motivación
])

const crossRefKeys: Set<string> = new Set((crossRefData as { keys?: string[] }).keys ?? [])

/**
 * Returns true si /ley/{ley}/{articulo-slug} debe indexarse en Google.
 *
 * @param leyNombre - DB leyNombre value (e.g. "CE", "LPAC", "LEC")
 * @param articuloNumero - DB articulo_numero (e.g. "14", "DA primera", "2.1")
 */
export function isArticleIndexable(leyNombre: string, articuloNumero: string): boolean {
  const key = `${leyNombre}:${articuloNumero}`
  if (crossRefKeys.has(key)) return true
  if (MANUAL_INDEXABLE.has(key)) return true
  return false
}

/** Count de artículos cross-referenciados (diagnóstico). */
export function crossReferencedCount(): number {
  return crossRefKeys.size
}

/** Total indexable (cross-ref ∪ manual) — usado por debug endpoint y sitemap stats. */
export function totalIndexableCount(): number {
  const all = new Set<string>([...crossRefKeys, ...MANUAL_INDEXABLE])
  return all.size
}

/** Exposed para tests / sitemap debug. */
export const INDEXABLE_MANUAL_KEYS = MANUAL_INDEXABLE
