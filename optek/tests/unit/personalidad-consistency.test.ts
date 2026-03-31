import { describe, it, expect } from 'vitest'
import type { Dimension, SessionRecord } from '@/lib/personalidad/types'
import {
  DIMENSIONS,
  DELTA_THRESHOLD,
  CORRELATION_THRESHOLD,
  pearsonCorrelation,
  computeDimensionDeltas,
  computeProfileCorrelation,
  detectTrend,
  computeOverallConsistency,
  analyzeConsistency,
} from '@/lib/personalidad/consistency-tracker'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(
  id: string,
  date: string,
  scores: Record<Dimension, number>,
): SessionRecord {
  return { session_id: id, date, dimension_scores: scores }
}

const BASE_SCORES: Record<Dimension, number> = { O: 50, C: 55, E: 45, A: 60, N: 40 }

// ---------------------------------------------------------------------------
// Constants sanity check
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('exports expected values', () => {
    expect(DIMENSIONS).toEqual(['O', 'C', 'E', 'A', 'N'])
    expect(DELTA_THRESHOLD).toBe(10)
    expect(CORRELATION_THRESHOLD).toBe(0.70)
  })
})

// ---------------------------------------------------------------------------
// pearsonCorrelation
// ---------------------------------------------------------------------------

describe('pearsonCorrelation', () => {
  it('returns r ≈ 1.0 for perfect positive correlation', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])
    expect(r).toBeCloseTo(1.0, 10)
  })

  it('returns r ≈ -1.0 for perfect negative correlation', () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])
    expect(r).toBeCloseTo(-1.0, 10)
  })

  it('returns 1.0 when both arrays have no variance', () => {
    const r = pearsonCorrelation([3, 3, 3, 3, 3], [3, 3, 3, 3, 3])
    expect(r).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// computeDimensionDeltas
// ---------------------------------------------------------------------------

describe('computeDimensionDeltas', () => {
  it('returns all deltas 0 with no flags when scores are identical', () => {
    const s1 = makeSession('a', '2026-01-01', BASE_SCORES)
    const s2 = makeSession('b', '2026-01-15', BASE_SCORES)

    const deltas = computeDimensionDeltas(s2, s1)

    for (const dim of DIMENSIONS) {
      expect(deltas[dim].delta).toBe(0)
      expect(deltas[dim].flagged).toBe(false)
    }
  })

  it('flags a dimension when |delta| > DELTA_THRESHOLD', () => {
    const changed: Record<Dimension, number> = { ...BASE_SCORES, E: BASE_SCORES.E + 15 }
    const s1 = makeSession('a', '2026-01-01', BASE_SCORES)
    const s2 = makeSession('b', '2026-01-15', changed)

    const deltas = computeDimensionDeltas(s2, s1)

    expect(deltas.E.delta).toBe(15)
    expect(deltas.E.flagged).toBe(true)

    // Other dimensions remain unflagged
    expect(deltas.O.flagged).toBe(false)
    expect(deltas.C.flagged).toBe(false)
    expect(deltas.A.flagged).toBe(false)
    expect(deltas.N.flagged).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// detectTrend
// ---------------------------------------------------------------------------

describe('detectTrend', () => {
  it('returns "stable" when fewer than 3 sessions', () => {
    const sessions = [
      makeSession('a', '2026-01-01', BASE_SCORES),
      makeSession('b', '2026-01-15', BASE_SCORES),
    ]
    expect(detectTrend(sessions)).toBe('stable')
  })

  it('returns "stable" when 3 sessions have small deltas', () => {
    const s1 = makeSession('a', '2026-01-01', BASE_SCORES)
    const s2 = makeSession('b', '2026-02-01', { O: 51, C: 56, E: 46, A: 61, N: 41 })
    const s3 = makeSession('c', '2026-03-01', { O: 52, C: 54, E: 44, A: 59, N: 42 })

    expect(detectTrend([s1, s2, s3])).toBe('stable')
  })

  it('returns "volatile" when sessions have wild swings', () => {
    const s1 = makeSession('a', '2026-01-01', { O: 30, C: 70, E: 30, A: 70, N: 30 })
    const s2 = makeSession('b', '2026-02-01', { O: 70, C: 30, E: 70, A: 30, N: 70 })
    const s3 = makeSession('c', '2026-03-01', { O: 30, C: 70, E: 30, A: 70, N: 30 })

    expect(detectTrend([s1, s2, s3])).toBe('volatile')
  })
})

// ---------------------------------------------------------------------------
// computeOverallConsistency
// ---------------------------------------------------------------------------

describe('computeOverallConsistency', () => {
  it('returns 100 when no flags and correlation is high', () => {
    const deltas = {} as Record<Dimension, { current: number; previous: number; delta: number; flagged: boolean }>
    for (const dim of DIMENSIONS) {
      deltas[dim] = { current: 50, previous: 50, delta: 0, flagged: false }
    }

    expect(computeOverallConsistency(deltas, 0.95)).toBe(100)
  })

  it('applies penalty for flagged dimensions and low correlation', () => {
    const deltas = {} as Record<Dimension, { current: number; previous: number; delta: number; flagged: boolean }>
    for (const dim of DIMENSIONS) {
      deltas[dim] = { current: 50, previous: 50, delta: 0, flagged: false }
    }
    // Flag 2 dimensions
    deltas.O.flagged = true
    deltas.E.flagged = true

    // Low correlation: below 0.50 triggers -20 AND -10 = -30 total from correlation
    const score = computeOverallConsistency(deltas, 0.40)

    // 100 - 10(O) - 10(E) - 20(below 0.70) - 10(below 0.50) = 50
    expect(score).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// analyzeConsistency
// ---------------------------------------------------------------------------

describe('analyzeConsistency', () => {
  it('returns perfect baseline for a single session', () => {
    const s1 = makeSession('a', '2026-01-01', BASE_SCORES)
    const result = analyzeConsistency([s1])

    expect(result.sessions_count).toBe(1)
    expect(result.profile_correlation).toBe(1.0)
    expect(result.trend).toBe('stable')
    expect(result.overall_consistency).toBe(100)

    for (const dim of DIMENSIONS) {
      expect(result.dimension_deltas[dim].delta).toBe(0)
      expect(result.dimension_deltas[dim].flagged).toBe(false)
      expect(result.dimension_deltas[dim].current).toBe(BASE_SCORES[dim])
      expect(result.dimension_deltas[dim].previous).toBe(BASE_SCORES[dim])
    }
  })

  it('computes deltas and correlation for two sessions', () => {
    const s1 = makeSession('a', '2026-01-01', BASE_SCORES)
    const s2 = makeSession('b', '2026-02-01', { O: 52, C: 57, E: 47, A: 62, N: 42 })
    const result = analyzeConsistency([s1, s2])

    expect(result.sessions_count).toBe(2)
    expect(result.dimension_deltas.O.delta).toBe(2)
    expect(result.dimension_deltas.C.delta).toBe(2)
    expect(result.profile_correlation).toBeCloseTo(1.0, 5)
    expect(result.overall_consistency).toBe(100)
    expect(result.trend).toBe('stable')
  })
})
