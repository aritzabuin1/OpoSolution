/**
 * tests/unit/personalidad-validity.test.ts
 * Unit tests for personality validity scales.
 */
import { describe, it, expect } from 'vitest'

import {
  scoreSocialDesirability,
  scoreInfrequency,
  scoreConsistency,
  scoreAcquiescence,
  computeValidity,
  THRESHOLDS,
} from '@/lib/personalidad/validity'

import type {
  IPIPItem,
  ItemResponse,
  ConsistencyPair,
  Dimension,
  LikertResponse,
} from '@/lib/personalidad/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSDItem(id: string): IPIPItem {
  return { id, texto: `SD ${id}`, dimension: null, faceta: null, reversed: false, validez_type: 'social_desirability' }
}

function makeIFItem(id: string): IPIPItem {
  return { id, texto: `IF ${id}`, dimension: null, faceta: null, reversed: false, validez_type: 'infrequency' }
}

function makeBFItem(id: string, dim: Dimension = 'O'): IPIPItem {
  return { id, texto: `BF ${id}`, dimension: dim, faceta: 1, reversed: false, validez_type: null }
}

function resp(item_id: string, value: LikertResponse): ItemResponse {
  return { item_id, value }
}

// ---------------------------------------------------------------------------
// 1. Social Desirability
// ---------------------------------------------------------------------------

describe('scoreSocialDesirability', () => {
  const items = Array.from({ length: 8 }, (_, i) => makeSDItem(`sd-${i + 1}`))

  it('returns 0 when no SD item is answered 4+', () => {
    const responses = items.map((it) => resp(it.id, 2))
    expect(scoreSocialDesirability(items, responses)).toBe(0)
  })

  it('returns 1 when all SD items are answered 5', () => {
    const responses = items.map((it) => resp(it.id, 5))
    expect(scoreSocialDesirability(items, responses)).toBe(1)
  })

  it('returns 0.5 when half the SD items are answered 4+', () => {
    const responses = items.map((it, i) => resp(it.id, i < 4 ? 4 : 2))
    expect(scoreSocialDesirability(items, responses)).toBe(0.5)
  })
})

// ---------------------------------------------------------------------------
// 2. Infrequency
// ---------------------------------------------------------------------------

describe('scoreInfrequency', () => {
  const items = Array.from({ length: 5 }, (_, i) => makeIFItem(`if-${i + 1}`))

  it('returns 0 when no IF item is answered <= 2', () => {
    const responses = items.map((it) => resp(it.id, 4))
    expect(scoreInfrequency(items, responses)).toBe(0)
  })

  it('returns count of IF items when all answered 1', () => {
    const responses = items.map((it) => resp(it.id, 1))
    expect(scoreInfrequency(items, responses)).toBe(items.length)
  })
})

// ---------------------------------------------------------------------------
// 3. Consistency
// ---------------------------------------------------------------------------

describe('scoreConsistency', () => {
  it('same direction, consistent (|3-4| = 1 < 3)', () => {
    const pairs: ConsistencyPair[] = [
      { id: 'p1', item_a: 'a1', item_b: 'b1', expected_direction: 'same' },
    ]
    const responses = [resp('a1', 3), resp('b1', 4)]
    expect(scoreConsistency(pairs, responses)).toBe(0)
  })

  it('same direction, inconsistent (|1-5| = 4 >= 3)', () => {
    const pairs: ConsistencyPair[] = [
      { id: 'p1', item_a: 'a1', item_b: 'b1', expected_direction: 'same' },
    ]
    const responses = [resp('a1', 1), resp('b1', 5)]
    expect(scoreConsistency(pairs, responses)).toBe(1)
  })

  it('opposite direction, consistent (reversed 1->5, |5-4| = 1 < 3)', () => {
    const pairs: ConsistencyPair[] = [
      { id: 'p1', item_a: 'a1', item_b: 'b1', expected_direction: 'opposite' },
    ]
    const responses = [resp('a1', 1), resp('b1', 4)]
    expect(scoreConsistency(pairs, responses)).toBe(0)
  })

  it('opposite direction, inconsistent (reversed 5->1, |1-5| = 4 >= 3)', () => {
    const pairs: ConsistencyPair[] = [
      { id: 'p1', item_a: 'a1', item_b: 'b1', expected_direction: 'opposite' },
    ]
    const responses = [resp('a1', 5), resp('b1', 5)]
    expect(scoreConsistency(pairs, responses)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 4. Acquiescence
// ---------------------------------------------------------------------------

describe('scoreAcquiescence', () => {
  const items = Array.from({ length: 10 }, (_, i) => makeBFItem(`bf-${i + 1}`))

  it('returns 0 when all BF items answered 2', () => {
    const responses = items.map((it) => resp(it.id, 2))
    expect(scoreAcquiescence(items, responses)).toBe(0)
  })

  it('returns 1 when all BF items answered 5', () => {
    const responses = items.map((it) => resp(it.id, 5))
    expect(scoreAcquiescence(items, responses)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 5. computeValidity (aggregate)
// ---------------------------------------------------------------------------

describe('computeValidity', () => {
  it('returns valid=true and no flags when everything is under thresholds', () => {
    // SD items all answered low (ratio 0)
    const sdItems = Array.from({ length: 5 }, (_, i) => makeSDItem(`sd-${i}`))
    // IF items all answered high (count 0)
    const ifItems = Array.from({ length: 5 }, (_, i) => makeIFItem(`if-${i}`))
    // BF items half agree, half disagree (ratio 0.5, under 0.7)
    const bfItems = Array.from({ length: 10 }, (_, i) => makeBFItem(`bf-${i}`))
    const allItems = [...sdItems, ...ifItems, ...bfItems]

    const responses: ItemResponse[] = [
      ...sdItems.map((it) => resp(it.id, 2)),
      ...ifItems.map((it) => resp(it.id, 4)),
      ...bfItems.map((it, i) => resp(it.id, i < 5 ? 4 : 2)),
    ]

    // No consistency pairs or all consistent
    const pairs: ConsistencyPair[] = []

    const result = computeValidity(allItems, pairs, responses)
    expect(result.valid).toBe(true)
    expect(result.flags).toHaveLength(0)
  })

  it('returns valid=false with SD and acquiescence flags when both exceed thresholds', () => {
    // SD items all answered 5 → ratio 1.0 (> 0.6 threshold)
    const sdItems = Array.from({ length: 5 }, (_, i) => makeSDItem(`sd-${i}`))
    // IF items all answered high → count 0 (under threshold)
    const ifItems = Array.from({ length: 5 }, (_, i) => makeIFItem(`if-${i}`))
    // BF items all answered 5 → ratio 1.0 (> 0.7 threshold)
    const bfItems = Array.from({ length: 10 }, (_, i) => makeBFItem(`bf-${i}`))
    const allItems = [...sdItems, ...ifItems, ...bfItems]

    const responses: ItemResponse[] = [
      ...sdItems.map((it) => resp(it.id, 5)),
      ...ifItems.map((it) => resp(it.id, 4)),
      ...bfItems.map((it) => resp(it.id, 5)),
    ]

    const pairs: ConsistencyPair[] = []

    const result = computeValidity(allItems, pairs, responses)
    expect(result.valid).toBe(false)
    expect(result.flags).toHaveLength(2)

    const flagScales = result.flags.map((f) => f.scale)
    expect(flagScales).toContain('social_desirability')
    expect(flagScales).toContain('acquiescence')
  })
})
