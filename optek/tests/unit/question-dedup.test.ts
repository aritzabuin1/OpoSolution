import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  computeHash,
  buildLegalKey,
  extractWordTrigrams,
  jaccardSimilarity,
  isDuplicate,
  buildDedupIndex,
} from '../../lib/utils/question-dedup'

describe('normalizeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeText('Constitución Española')).toBe('constitucion espanola')
  })

  it('removes punctuation', () => {
    expect(normalizeText('¿Qué establece el Art. 14?')).toBe('que establece el art 14')
  })

  it('collapses whitespace', () => {
    expect(normalizeText('  hello   world  ')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('')
  })
})

describe('computeHash', () => {
  it('returns consistent sha256 hex', () => {
    const h1 = computeHash('¿Qué dice el Art. 14?')
    const h2 = computeHash('¿Qué dice el Art. 14?')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64) // sha256 hex
  })

  it('normalizes before hashing', () => {
    const h1 = computeHash('Constitución Española')
    const h2 = computeHash('constitucion espanola')
    expect(h1).toBe(h2)
  })

  it('different texts produce different hashes', () => {
    const h1 = computeHash('Art 14 CE')
    const h2 = computeHash('Art 15 CE')
    expect(h1).not.toBe(h2)
  })
})

describe('buildLegalKey', () => {
  it('builds key from tema, citation, and answer', () => {
    const key = buildLegalKey('tema-1', { ley: 'CE', articulo: '14' }, 'Igualdad ante la ley')
    expect(key).toBe('tema-1:ce:14:igualdad ante la ley')
  })

  it('returns null without citation', () => {
    expect(buildLegalKey('tema-1', null, 'answer')).toBeNull()
    expect(buildLegalKey('tema-1', {}, 'answer')).toBeNull()
    expect(buildLegalKey('tema-1', { ley: 'CE' }, 'answer')).toBeNull()
  })
})

describe('extractWordTrigrams', () => {
  it('extracts 3-word windows', () => {
    const trigrams = extractWordTrigrams('el recurso de alzada se interpone')
    expect(trigrams.has('el recurso de')).toBe(true)
    expect(trigrams.has('recurso de alzada')).toBe(true)
    expect(trigrams.has('alzada se interpone')).toBe(true)
    expect(trigrams.size).toBe(4) // 6 words - 2 = 4 trigrams
  })

  it('returns empty set for short text', () => {
    expect(extractWordTrigrams('one two').size).toBe(0)
  })
})

describe('jaccardSimilarity', () => {
  it('returns 1 for identical sets', () => {
    const s = new Set(['a', 'b', 'c'])
    expect(jaccardSimilarity(s, s)).toBe(1)
  })

  it('returns 0 for disjoint sets', () => {
    const a = new Set(['a', 'b'])
    const b = new Set(['c', 'd'])
    expect(jaccardSimilarity(a, b)).toBe(0)
  })

  it('returns correct value for partial overlap', () => {
    const a = new Set(['a', 'b', 'c'])
    const b = new Set(['b', 'c', 'd'])
    // intersection=2, union=4 → 0.5
    expect(jaccardSimilarity(a, b)).toBe(0.5)
  })

  it('handles empty sets', () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(1)
    expect(jaccardSimilarity(new Set(['a']), new Set())).toBe(0)
  })
})

describe('isDuplicate', () => {
  const bankQuestions = [
    {
      id: 'q1',
      enunciado_hash: computeHash('¿Qué establece el artículo 14 de la CE?'),
      legal_key: 'tema-1:ce:14:igualdad ante la ley',
      enunciado: '¿Qué establece el artículo 14 de la CE?',
    },
    {
      id: 'q2',
      enunciado_hash: computeHash('¿Cuál es el plazo máximo para resolver?'),
      legal_key: 'tema-11:lpac:21:tres meses',
      enunciado: '¿Cuál es el plazo máximo para resolver?',
    },
  ]
  const { hashSet, legalKeyMap } = buildDedupIndex(bankQuestions)

  it('detects Level 1 duplicate (exact hash)', () => {
    const result = isDuplicate(
      {
        enunciado: '¿Qué establece el artículo 14 de la CE?',
        correctAnswerText: 'Igualdad ante la ley',
        temaId: 'tema-1',
      },
      bankQuestions,
      hashSet,
      legalKeyMap,
    )
    expect(result.duplicate).toBe(true)
    expect(result.level).toBe(1)
  })

  it('detects Level 2 duplicate (same legal key)', () => {
    const result = isDuplicate(
      {
        enunciado: 'Según el artículo 14 de la Constitución, ¿qué derecho fundamental se establece?',
        cita: { ley: 'CE', articulo: '14' },
        correctAnswerText: 'Igualdad ante la ley',
        temaId: 'tema-1',
      },
      bankQuestions,
      hashSet,
      legalKeyMap,
    )
    expect(result.duplicate).toBe(true)
    expect(result.level).toBe(2)
  })

  it('returns not duplicate for different question', () => {
    const result = isDuplicate(
      {
        enunciado: '¿Qué es el silencio administrativo positivo?',
        cita: { ley: 'LPAC', articulo: '24' },
        correctAnswerText: 'Estimación por falta de resolución',
        temaId: 'tema-11',
      },
      bankQuestions,
      hashSet,
      legalKeyMap,
    )
    expect(result.duplicate).toBe(false)
    expect(result.level).toBeNull()
  })
})

describe('buildDedupIndex', () => {
  it('builds hash set and legal key map', () => {
    const qs = [
      { id: 'a', enunciado_hash: 'hash1', legal_key: 'key1', enunciado: 'q1' },
      { id: 'b', enunciado_hash: 'hash2', legal_key: null, enunciado: 'q2' },
    ]
    const { hashSet, legalKeyMap } = buildDedupIndex(qs)
    expect(hashSet.size).toBe(2)
    expect(legalKeyMap.size).toBe(1)
    expect(legalKeyMap.get('key1')).toBe('a')
  })
})
