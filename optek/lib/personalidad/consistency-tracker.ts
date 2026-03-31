/**
 * lib/personalidad/consistency-tracker.ts
 * Cross-session consistency tracker.
 * Detects faking vs genuine coaching improvement by comparing
 * Big Five profiles across multiple sessions.
 *
 * All functions are pure and deterministic — no side effects, no mutations.
 */

import type { Dimension, SessionRecord, ConsistencyAnalysis } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DIMENSIONS: Dimension[] = ['O', 'C', 'E', 'A', 'N']

/** 1 SD in the T-score scale — flag if |delta| exceeds this */
export const DELTA_THRESHOLD = 10

/** Profile shape must correlate r >= this value */
export const CORRELATION_THRESHOLD = 0.70

// ---------------------------------------------------------------------------
// 1. Dimension deltas between two sessions
// ---------------------------------------------------------------------------

export function computeDimensionDeltas(
  current: SessionRecord,
  previous: SessionRecord,
): ConsistencyAnalysis['dimension_deltas'] {
  const deltas = {} as ConsistencyAnalysis['dimension_deltas']

  for (const dim of DIMENSIONS) {
    const cur = current.dimension_scores[dim]
    const prev = previous.dimension_scores[dim]
    const delta = cur - prev

    deltas[dim] = {
      current: cur,
      previous: prev,
      delta,
      flagged: Math.abs(delta) > DELTA_THRESHOLD,
    }
  }

  return deltas
}

// ---------------------------------------------------------------------------
// 2. Pearson product-moment correlation
// ---------------------------------------------------------------------------

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length

  const meanX = x.reduce((s, v) => s + v, 0) / n
  const meanY = y.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    sumSqX += dx * dx
    sumSqY += dy * dy
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)

  // No variance in one or both arrays — treat as identical profiles
  if (denominator === 0) return 1.0

  const r = numerator / denominator

  // Clamp to [-1, 1] to guard against floating-point drift
  return Math.max(-1, Math.min(1, r))
}

// ---------------------------------------------------------------------------
// 3. Profile correlation between two sessions
// ---------------------------------------------------------------------------

export function computeProfileCorrelation(
  current: SessionRecord,
  previous: SessionRecord,
): number {
  const xScores = DIMENSIONS.map((d) => current.dimension_scores[d])
  const yScores = DIMENSIONS.map((d) => previous.dimension_scores[d])

  return pearsonCorrelation(xScores, yScores)
}

// ---------------------------------------------------------------------------
// 4. Trend detection across multiple sessions
// ---------------------------------------------------------------------------

export function detectTrend(
  sessions: SessionRecord[],
): 'stable' | 'improving' | 'volatile' {
  if (sessions.length < 3) return 'stable'

  // Compute mean absolute delta for each consecutive pair
  const meanDeltas: number[] = []
  const correlations: number[] = []

  for (let i = 1; i < sessions.length; i++) {
    const prev = sessions[i - 1]
    const cur = sessions[i]

    let sumAbsDelta = 0
    for (const dim of DIMENSIONS) {
      sumAbsDelta += Math.abs(
        cur.dimension_scores[dim] - prev.dimension_scores[dim],
      )
    }
    meanDeltas.push(sumAbsDelta / DIMENSIONS.length)
    correlations.push(computeProfileCorrelation(cur, prev))
  }

  // All mean deltas < 5 → stable
  if (meanDeltas.every((d) => d < 5)) return 'stable'

  // Deltas decreasing (last < first) AND all correlations > 0.80 → improving
  const deltasDecreasing = meanDeltas[meanDeltas.length - 1] < meanDeltas[0]
  const allHighCorrelation = correlations.every((r) => r > 0.80)

  if (deltasDecreasing && allHighCorrelation) return 'improving'

  return 'volatile'
}

// ---------------------------------------------------------------------------
// 5. Overall consistency score (0-100)
// ---------------------------------------------------------------------------

export function computeOverallConsistency(
  deltas: ConsistencyAnalysis['dimension_deltas'],
  correlation: number,
): number {
  let score = 100

  for (const dim of DIMENSIONS) {
    if (deltas[dim].flagged) score -= 10
  }

  if (correlation < CORRELATION_THRESHOLD) score -= 20
  if (correlation < 0.50) score -= 10

  return Math.max(0, Math.min(100, score))
}

// ---------------------------------------------------------------------------
// 6. Main entry point
// ---------------------------------------------------------------------------

export function analyzeConsistency(
  sessions: SessionRecord[],
): ConsistencyAnalysis {
  // Not enough sessions to compare — return "perfect" baseline
  if (sessions.length < 2) {
    const zeroDelta = {} as ConsistencyAnalysis['dimension_deltas']
    for (const dim of DIMENSIONS) {
      const score = sessions.length === 1 ? sessions[0].dimension_scores[dim] : 0
      zeroDelta[dim] = { current: score, previous: score, delta: 0, flagged: false }
    }

    return {
      sessions_count: sessions.length,
      dimension_deltas: zeroDelta,
      profile_correlation: 1.0,
      trend: 'stable',
      overall_consistency: 100,
    }
  }

  // Sort by date ascending (non-mutating)
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const previous = sorted[sorted.length - 2]
  const current = sorted[sorted.length - 1]

  const dimensionDeltas = computeDimensionDeltas(current, previous)
  const profileCorrelation = computeProfileCorrelation(current, previous)
  const trend = detectTrend(sorted)
  const overallConsistency = computeOverallConsistency(dimensionDeltas, profileCorrelation)

  return {
    sessions_count: sorted.length,
    dimension_deltas: dimensionDeltas,
    profile_correlation: profileCorrelation,
    trend,
    overall_consistency: overallConsistency,
  }
}
