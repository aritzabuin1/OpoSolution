/**
 * tests/unit/hash-normalize.test.ts
 *
 * Tests unitarios para hash.ts + normalizeForHash.ts.
 *
 * Cobertura:
 *   - normalizeForHash: trim, collapse whitespace, NFC unicode
 *   - computeHash: determinismo, SHA-256 format
 *   - Pipeline completo: normalize + hash
 */

import { describe, it, expect } from 'vitest'
import { computeHash } from '@/lib/utils/hash'
import { normalizeForHash } from '@/lib/utils/normalizeForHash'

// ─── normalizeForHash ────────────────────────────────────────────────────────

describe('normalizeForHash', () => {
  it('trim leading/trailing whitespace', () => {
    expect(normalizeForHash('  Artículo 1.  ')).toBe('Artículo 1.')
  })

  it('collapse multiple spaces to one', () => {
    expect(normalizeForHash('Artículo  1.   Objeto')).toBe('Artículo 1. Objeto')
  })

  it('collapse newlines and tabs', () => {
    expect(normalizeForHash('Artículo\n\n1.\t\tObjeto')).toBe('Artículo 1. Objeto')
  })

  it('normalize Unicode combining accents to NFC', () => {
    // cafe\u0301 (combining acute accent) → café (precomposed)
    const input = 'cafe\u0301'
    const result = normalizeForHash(input)
    expect(result).toBe('café')
  })

  it('preserva ñ y caracteres españoles', () => {
    expect(normalizeForHash('Año español')).toBe('Año español')
  })

  it('empty string returns empty', () => {
    expect(normalizeForHash('')).toBe('')
  })

  it('solo espacios returns empty', () => {
    expect(normalizeForHash('   \n\t  ')).toBe('')
  })

  it('mixed whitespace (\\r\\n) collapses to space', () => {
    expect(normalizeForHash('Uno\r\nDos\r\n\r\nTres')).toBe('Uno Dos Tres')
  })
})

// ─── computeHash ─────────────────────────────────────────────────────────────

describe('computeHash', () => {
  it('returns 64-char lowercase hex string', () => {
    const hash = computeHash('test')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('es determinista (mismo input → mismo hash)', () => {
    const h1 = computeHash('Artículo 14 CE')
    const h2 = computeHash('Artículo 14 CE')
    expect(h1).toBe(h2)
  })

  it('inputs distintos producen hashes distintos', () => {
    const h1 = computeHash('Artículo 14 CE')
    const h2 = computeHash('Artículo 15 CE')
    expect(h1).not.toBe(h2)
  })

  it('string vacío produce hash válido', () => {
    const hash = computeHash('')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('UTF-8: acentos y ñ producen hash consistente', () => {
    const h1 = computeHash('España')
    const h2 = computeHash('España')
    expect(h1).toBe(h2)
  })
})

// ─── Pipeline completo ──────────────────────────────────────────────────────

describe('normalize → hash pipeline', () => {
  it('textos equivalentes producen mismo hash', () => {
    const t1 = '  Artículo  1.\n\nObjeto  '
    const t2 = 'Artículo 1. Objeto'
    expect(computeHash(normalizeForHash(t1))).toBe(computeHash(normalizeForHash(t2)))
  })

  it('textos realmente distintos producen hash diferente', () => {
    const t1 = 'Artículo 1. Objeto'
    const t2 = 'Artículo 2. Ámbito'
    expect(computeHash(normalizeForHash(t1))).not.toBe(computeHash(normalizeForHash(t2)))
  })

  it('Unicode normalization: combining vs precomposed → mismo hash', () => {
    const combining = 'cafe\u0301'   // café with combining accent
    const precomposed = 'café'        // precomposed
    expect(computeHash(normalizeForHash(combining))).toBe(computeHash(normalizeForHash(precomposed)))
  })
})
