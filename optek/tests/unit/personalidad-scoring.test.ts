/**
 * tests/unit/personalidad-scoring.test.ts
 * Unit tests for the Big Five personality scoring engine.
 */

import { describe, it, expect } from 'vitest'
import {
  reverseScore,
  scoreFacet,
  scoreDimension,
  computePoliceFit,
  computeBigFiveProfile,
  NORMS,
  POLICE_PROFILE,
  DIMENSIONS,
  FACETS,
} from '@/lib/personalidad/scoring'
import type {
  IPIPItem,
  ItemResponse,
  Dimension,
  FacetNumber,
  LikertResponse,
  DimensionScore,
} from '@/lib/personalidad/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(
  id: string,
  dim: Dimension,
  faceta: FacetNumber,
  reversed = false,
): IPIPItem {
  return { id, texto: `Item ${id}`, dimension: dim, faceta, reversed, validez_type: null }
}

function makeResponse(item_id: string, value: LikertResponse): ItemResponse {
  return { item_id, value }
}

// ---------------------------------------------------------------------------
// reverseScore
// ---------------------------------------------------------------------------

describe('reverseScore', () => {
  it('reverses 5 → 1', () => {
    expect(reverseScore(5)).toBe(1)
  })

  it('reverses 4 → 2', () => {
    expect(reverseScore(4)).toBe(2)
  })

  it('keeps 3 → 3 (midpoint)', () => {
    expect(reverseScore(3)).toBe(3)
  })

  it('reverses 2 → 4', () => {
    expect(reverseScore(2)).toBe(4)
  })

  it('reverses 1 → 5', () => {
    expect(reverseScore(1)).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// scoreFacet
// ---------------------------------------------------------------------------

describe('scoreFacet', () => {
  it('computes mean for non-reversed items', () => {
    const items = [
      makeItem('i1', 'O', 1),
      makeItem('i2', 'O', 1),
      makeItem('i3', 'O', 1),
      makeItem('i4', 'O', 1),
    ]
    const responses = [
      makeResponse('i1', 4),
      makeResponse('i2', 4),
      makeResponse('i3', 4),
      makeResponse('i4', 4),
    ]

    const result = scoreFacet(items, responses, 'O', 1)

    expect(result.dimension).toBe('O')
    expect(result.faceta).toBe(1)
    expect(result.raw).toBe(4.0)
    expect(result.items_count).toBe(4)
  })

  it('applies reverse scoring where needed', () => {
    const items = [
      makeItem('i1', 'C', 2),
      makeItem('i2', 'C', 2),
      makeItem('i3', 'C', 2, true),
      makeItem('i4', 'C', 2, true),
    ]
    // Normal items: value 4 → scored 4
    // Reversed items: value 2 → reverseScore(2) = 4
    const responses = [
      makeResponse('i1', 4),
      makeResponse('i2', 4),
      makeResponse('i3', 2),
      makeResponse('i4', 2),
    ]

    const result = scoreFacet(items, responses, 'C', 2)

    expect(result.raw).toBe(4.0)
    expect(result.items_count).toBe(4)
  })

  it('only counts items that have responses (partial responses)', () => {
    const items = [
      makeItem('i1', 'E', 3),
      makeItem('i2', 'E', 3),
      makeItem('i3', 'E', 3),
      makeItem('i4', 'E', 3),
    ]
    // Only 2 of 4 items answered
    const responses = [
      makeResponse('i1', 5),
      makeResponse('i3', 3),
    ]

    const result = scoreFacet(items, responses, 'E', 3)

    expect(result.items_count).toBe(2)
    expect(result.raw).toBe(4.0) // (5 + 3) / 2
  })

  it('returns raw = 0 and items_count = 0 when no responses match', () => {
    const items = [
      makeItem('i1', 'A', 4),
      makeItem('i2', 'A', 4),
    ]
    const responses: ItemResponse[] = []

    const result = scoreFacet(items, responses, 'A', 4)

    expect(result.raw).toBe(0)
    expect(result.items_count).toBe(0)
  })

  it('ignores items from other dimensions or facets', () => {
    const items = [
      makeItem('i1', 'N', 1),
      makeItem('i2', 'O', 1), // wrong dimension
      makeItem('i3', 'N', 2), // wrong facet
      makeItem('i4', 'N', 1),
    ]
    const responses = [
      makeResponse('i1', 5),
      makeResponse('i2', 5),
      makeResponse('i3', 5),
      makeResponse('i4', 3),
    ]

    const result = scoreFacet(items, responses, 'N', 1)

    expect(result.items_count).toBe(2)
    expect(result.raw).toBe(4.0) // (5 + 3) / 2
  })
})

// ---------------------------------------------------------------------------
// scoreDimension
// ---------------------------------------------------------------------------

describe('scoreDimension', () => {
  it('computes T-score using NORMS', () => {
    // Build 1 item per facet for dimension O, all answered with value 3 (= NORMS.O.mean)
    const items: IPIPItem[] = []
    const responses: ItemResponse[] = []

    for (const f of FACETS) {
      const id = `o_f${f}`
      items.push(makeItem(id, 'O', f))
      responses.push(makeResponse(id, 3 as LikertResponse))
    }

    const result = scoreDimension(items, responses, 'O')

    expect(result.dimension).toBe('O')
    // raw mean = 3.0, NORMS.O.mean = 3.0, sd = 0.6
    // T = 50 + 10 * ((3.0 - 3.0) / 0.6) = 50
    expect(result.t_score).toBeCloseTo(50, 5)
    expect(result.facets).toHaveLength(6)
  })

  it('returns T-score = 50 when responses are at the norm mean', () => {
    // For dimension O, norm mean = 3.0
    const items: IPIPItem[] = FACETS.map((f) => makeItem(`o${f}`, 'O', f))
    const responses: ItemResponse[] = FACETS.map((f) =>
      makeResponse(`o${f}`, 3 as LikertResponse),
    )

    const result = scoreDimension(items, responses, 'O')

    expect(result.t_score).toBeCloseTo(50, 5)
  })

  it('computes correct T-score for values above norm mean', () => {
    // All facets answered with 5 for dimension C (norm mean=3.4, sd=0.5)
    const items: IPIPItem[] = FACETS.map((f) => makeItem(`c${f}`, 'C', f))
    const responses: ItemResponse[] = FACETS.map((f) =>
      makeResponse(`c${f}`, 5 as LikertResponse),
    )

    const result = scoreDimension(items, responses, 'C')

    // raw = 5.0, T = 50 + 10 * ((5.0 - 3.4) / 0.5) = 50 + 32 = 82
    expect(result.raw).toBeCloseTo(5.0, 5)
    expect(result.t_score).toBeCloseTo(82, 5)
  })
})

// ---------------------------------------------------------------------------
// computePoliceFit
// ---------------------------------------------------------------------------

describe('computePoliceFit', () => {
  it('returns all excellent and overall_fit = 100 for perfect match', () => {
    // Build dimension scores where t_score === ideal_t for each dimension
    const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => ({
      dimension: dim,
      raw: 0,
      t_score: POLICE_PROFILE.dimensions[dim].ideal_t,
      facets: [],
    }))

    const result = computePoliceFit(dimensions)

    expect(result.overall_fit).toBe(100)

    for (const dim of DIMENSIONS) {
      expect(result.dimension_fits[dim].fit).toBe('excellent')
      expect(result.dimension_fits[dim].delta).toBe(0)
    }
  })

  it('returns all good when user T-scores are off by exactly tolerance', () => {
    // delta === tolerance → fit = 'good' (since delta <= tolerance)
    const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => ({
      dimension: dim,
      raw: 0,
      t_score: POLICE_PROFILE.dimensions[dim].ideal_t + POLICE_PROFILE.dimensions[dim].tolerance,
      facets: [],
    }))

    const result = computePoliceFit(dimensions)

    for (const dim of DIMENSIONS) {
      expect(result.dimension_fits[dim].fit).toBe('good')
    }

    // overall_fit should be positive but < 100
    expect(result.overall_fit).toBeGreaterThan(0)
    expect(result.overall_fit).toBeLessThan(100)
  })

  it('flags concern for extreme mismatches', () => {
    // Set t_score very far from ideal (delta > tolerance * 1.5)
    const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => ({
      dimension: dim,
      raw: 0,
      t_score: POLICE_PROFILE.dimensions[dim].ideal_t + 50,
      facets: [],
    }))

    const result = computePoliceFit(dimensions)

    for (const dim of DIMENSIONS) {
      expect(result.dimension_fits[dim].fit).toBe('concern')
    }

    // overall_fit should be 0 (clamped) since mean delta = 50, score = 100 - 100 = 0
    expect(result.overall_fit).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeBigFiveProfile — integration
// ---------------------------------------------------------------------------

describe('computeBigFiveProfile', () => {
  it('returns a complete profile with all 5 dimensions and police fit', () => {
    // Create 1 item per facet per dimension (5 * 6 = 30 items)
    const items: IPIPItem[] = []
    const responses: ItemResponse[] = []

    for (const dim of DIMENSIONS) {
      for (const f of FACETS) {
        const id = `${dim}_f${f}`
        items.push(makeItem(id, dim, f))
        responses.push(makeResponse(id, 3 as LikertResponse))
      }
    }

    const profile = computeBigFiveProfile(items, responses)

    // Should have all 5 dimensions
    expect(profile.dimensions).toHaveLength(5)

    const dimNames = profile.dimensions.map((d) => d.dimension)
    expect(dimNames).toEqual(expect.arrayContaining(['O', 'C', 'E', 'A', 'N']))

    // Each dimension should have 6 facets
    for (const ds of profile.dimensions) {
      expect(ds.facets).toHaveLength(6)
    }

    // Police fit should exist with all dimensions
    expect(profile.police_fit).toBeDefined()
    expect(profile.police_fit.overall_fit).toBeGreaterThanOrEqual(0)
    expect(profile.police_fit.overall_fit).toBeLessThanOrEqual(100)

    for (const dim of DIMENSIONS) {
      expect(profile.police_fit.dimension_fits[dim]).toBeDefined()
    }
  })
})
