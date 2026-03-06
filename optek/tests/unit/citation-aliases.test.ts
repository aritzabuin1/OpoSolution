/**
 * tests/unit/citation-aliases.test.ts
 *
 * Tests unitarios para resolveLeyNombre() en lib/ai/citation-aliases.ts.
 *
 * Cobertura:
 *   - Cada ley con alias principal
 *   - Case-insensitive
 *   - Con/sin acentos
 *   - Alias desconocido → null
 *   - Trim de espacios
 */

import { describe, it, expect } from 'vitest'
import { resolveLeyNombre, CITATION_ALIASES } from '@/lib/ai/citation-aliases'

describe('resolveLeyNombre', () => {
  // ─── Leyes principales ─────────────────────────────────────────────────────

  it.each([
    ['CE', 'CE'],
    ['constitución', 'CE'],
    ['constitucion', 'CE'],
    ['LPAC', 'LPAC'],
    ['ley 39/2015', 'LPAC'],
    ['LRJSP', 'LRJSP'],
    ['ley 40/2015', 'LRJSP'],
    ['TREBEP', 'TREBEP'],
    ['ebep', 'TREBEP'],
    ['LOPDGDD', 'LOPDGDD'],
    ['rgpd', 'LOPDGDD'],
    ['LOIGUALDAD', 'LOIGUALDAD'],
    ['LOVIGEN', 'LOVIGEN'],
    ['LGTBI', 'LGTBI'],
    ['LOTC', 'LOTC'],
    ['LOPJ', 'LOPJ'],
    ['LGP', 'LGP'],
    ['LGOB', 'LGOB'],
    ['TRANSPARENCIA', 'TRANSPARENCIA'],
    ['LCSP', 'LCSP'],
  ])('resuelve "%s" → "%s"', (input, expected) => {
    expect(resolveLeyNombre(input)).toBe(expected)
  })

  // ─── Case-insensitive ──────────────────────────────────────────────────────

  it('es case-insensitive', () => {
    expect(resolveLeyNombre('Ce')).toBe('CE')
    expect(resolveLeyNombre('lpac')).toBe('LPAC')
    expect(resolveLeyNombre('TREBEP')).toBe('TREBEP')
  })

  // ─── Trim de espacios ─────────────────────────────────────────────────────

  it('trimea espacios', () => {
    expect(resolveLeyNombre('  CE  ')).toBe('CE')
    expect(resolveLeyNombre(' lpac ')).toBe('LPAC')
  })

  // ─── Alias desconocido ────────────────────────────────────────────────────

  it('retorna null para alias desconocido', () => {
    expect(resolveLeyNombre('ley inventada')).toBeNull()
    expect(resolveLeyNombre('')).toBeNull()
    expect(resolveLeyNombre('xyz123')).toBeNull()
  })

  // ─── Variantes con/sin acentos ─────────────────────────────────────────────

  it('resuelve variantes sin acentos', () => {
    expect(resolveLeyNombre('constitucion española')).toBe('CE')
    expect(resolveLeyNombre('regimen juridico')).toBe('LRJSP')
    expect(resolveLeyNombre('estatuto basico')).toBe('TREBEP')
    expect(resolveLeyNombre('proteccion de datos')).toBe('LOPDGDD')
    expect(resolveLeyNombre('violencia de genero')).toBe('LOVIGEN')
  })

  it('resuelve variantes con acentos', () => {
    expect(resolveLeyNombre('constitución española')).toBe('CE')
    expect(resolveLeyNombre('régimen jurídico')).toBe('LRJSP')
    expect(resolveLeyNombre('estatuto básico')).toBe('TREBEP')
    expect(resolveLeyNombre('protección de datos')).toBe('LOPDGDD')
    expect(resolveLeyNombre('violencia de género')).toBe('LOVIGEN')
  })

  // ─── Cobertura completa del diccionario ────────────────────────────────────

  it('todas las leyes objetivo están representadas en el diccionario', () => {
    const leyesEsperadas = [
      'CE', 'LPAC', 'LRJSP', 'TREBEP', 'LOPDGDD',
      'LOIGUALDAD', 'LOVIGEN', 'LGTBI', 'LOTC', 'LOPJ',
      'LGP', 'LGOB', 'TRANSPARENCIA', 'LCSP',
    ]
    const leyesEnDiccionario = new Set(Object.values(CITATION_ALIASES))
    for (const ley of leyesEsperadas) {
      expect(leyesEnDiccionario.has(ley), `${ley} debería estar en CITATION_ALIASES`).toBe(true)
    }
  })
})
