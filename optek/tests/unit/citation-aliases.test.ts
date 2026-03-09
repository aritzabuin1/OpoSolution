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

  // ─── Regex fallback por número de ley ──────────────────────────────────────

  it.each([
    ['Ley 39/2015', 'LPAC'],
    ['ley 40/2015', 'LRJSP'],
    ['Ley Orgánica 3/2018', 'LOPDGDD'],
    ['ley orgánica 3/2007', 'LOIGUALDAD'],
    ['RDLeg 5/2015', 'TREBEP'],
    ['rdleg 5/2015', 'TREBEP'],
    ['Real Decreto Legislativo 5/2015', 'TREBEP'],
    ['LO 1/2004', 'LOVIGEN'],
    ['Ley 4/2023', 'LGTBI'],
    ['Ley 47/2003', 'LGP'],
    ['Ley 50/1997', 'LGOB'],
    ['Ley 19/2013', 'TRANSPARENCIA'],
    ['Ley 9/2017', 'LCSP'],
  ])('regex fallback: resuelve "%s" → "%s"', (input, expected) => {
    expect(resolveLeyNombre(input)).toBe(expected)
  })

  // ─── Variantes comunes de la IA ──────────────────────────────────────────

  it('resuelve lpacap → LPAC', () => {
    expect(resolveLeyNombre('lpacap')).toBe('LPAC')
  })

  it('resuelve lrjpac → LPAC', () => {
    expect(resolveLeyNombre('lrjpac')).toBe('LPAC')
  })

  it('resuelve "ce 1978" → CE', () => {
    expect(resolveLeyNombre('ce 1978')).toBe('CE')
    expect(resolveLeyNombre('CE1978')).toBe('CE')
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
