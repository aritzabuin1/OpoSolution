/**
 * lib/utils/normalizeForHash.ts — OPTEK
 *
 * Normalización determinista de texto para hashing SHA-256.
 *
 * Garantiza que dos representaciones del mismo artículo legal producen
 * el mismo hash aunque difieran en espacios o codificación Unicode.
 * Esto permite detectar cambios reales en el contenido legislativo (BOE).
 *
 * Pipeline aplicado:
 *   1. trim()                   → eliminar espacios al inicio/final
 *   2. collapse whitespace      → múltiples espacios/newlines → un único espacio
 *   3. normalize('NFC')         → forma canónica Unicode compuesta
 *
 * Uso:
 *   import { normalizeForHash } from '@/lib/utils/normalizeForHash'
 *   const normalized = normalizeForHash(articulo.texto_integro)
 */

/**
 * Normaliza un texto de forma determinista para calcular su hash SHA-256.
 *
 * @param text - Texto original (e.g. texto_integro de un artículo legal)
 * @returns    - Texto normalizado: sin espacios extremos, sin blancos múltiples,
 *               en forma Unicode NFC
 *
 * @example
 * normalizeForHash('  Artículo  1.\n\nObjeto  ')
 * // → 'Artículo 1. Objeto'
 *
 * normalizeForHash('cafe\u0301') // 'café' con combining accent
 * // → 'café'                    // NFC precompuesto
 */
export function normalizeForHash(text: string): string {
  return text
    .trim()
    .replace(/[\s\n\r\t]+/g, ' ')
    .normalize('NFC')
}
