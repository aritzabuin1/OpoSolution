/**
 * lib/utils/hash.ts — OPTEK §1.2.6
 *
 * Calcula el hash SHA-256 de un texto normalizado.
 * Usado para detectar cambios en artículos legislativos (BOE Watcher).
 *
 * Uso:
 *   import { computeHash } from '@/lib/utils/hash'
 *   const hash = computeHash(normalizeForHash(articulo.texto_integro))
 */

import { createHash } from 'crypto'

/**
 * Calcula SHA-256 de un texto y lo retorna en hex (64 chars).
 *
 * @param text - Texto ya normalizado con normalizeForHash()
 * @returns    - Hash SHA-256 en hexadecimal lowercase
 *
 * @example
 * computeHash('Los interesados tendrán los siguientes derechos...')
 * // → 'a3f8b2...'
 */
export function computeHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}
