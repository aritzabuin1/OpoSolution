/**
 * lib/personalidad/validity.ts
 * Escalas de validez deterministas para detectar sesgos de respuesta.
 */

import type {
  IPIPItem,
  ItemResponse,
  ConsistencyPair,
  ValidityResult,
  ValidityFlag,
} from './types'

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export const THRESHOLDS = {
  social_desirability: 0.6,  // >60% endorsing impossible virtues
  infrequency: 3,            // 3+ infrequent responses out of ~7
  consistency: 6,            // 6+ inconsistent pairs out of ~20
  acquiescence: 0.7,         // >70% agreeing
} as const

// ---------------------------------------------------------------------------
// Helper: build a lookup map from item_id → value
// ---------------------------------------------------------------------------

function responseMap(responses: ItemResponse[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of responses) {
    m.set(r.item_id, r.value)
  }
  return m
}

// ---------------------------------------------------------------------------
// 1. Social Desirability
// ---------------------------------------------------------------------------

/**
 * "Impossible virtue" items — strongly agreeing (4 or 5) is suspicious.
 * Returns ratio of items answered 4+ out of total SD items (0–1).
 */
export function scoreSocialDesirability(
  items: IPIPItem[],
  responses: ItemResponse[],
): number {
  const sdItems = items.filter((i) => i.validez_type === 'social_desirability')
  if (sdItems.length === 0) return 0

  const rMap = responseMap(responses)
  let suspicious = 0

  for (const item of sdItems) {
    const val = rMap.get(item.id)
    if (val !== undefined && val >= 4) {
      suspicious++
    }
  }

  return suspicious / sdItems.length
}

// ---------------------------------------------------------------------------
// 2. Infrequency
// ---------------------------------------------------------------------------

/**
 * Items where 90%+ of people agree — disagreeing (1 or 2) is suspicious.
 * Returns COUNT of infrequent responses.
 */
export function scoreInfrequency(
  items: IPIPItem[],
  responses: ItemResponse[],
): number {
  const ifItems = items.filter((i) => i.validez_type === 'infrequency')
  if (ifItems.length === 0) return 0

  const rMap = responseMap(responses)
  let count = 0

  for (const item of ifItems) {
    const val = rMap.get(item.id)
    if (val !== undefined && val <= 2) {
      count++
    }
  }

  return count
}

// ---------------------------------------------------------------------------
// 3. Consistency (VRIN-like)
// ---------------------------------------------------------------------------

/**
 * For each pair, check if responses are inconsistent:
 * - 'same': inconsistent if |response_a − response_b| >= 3
 * - 'opposite': inconsistent if |(6 − response_a) − response_b| >= 3
 * Returns COUNT of inconsistent pairs.
 */
export function scoreConsistency(
  pairs: ConsistencyPair[],
  responses: ItemResponse[],
): number {
  const rMap = responseMap(responses)
  let inconsistent = 0

  for (const pair of pairs) {
    const a = rMap.get(pair.item_a)
    const b = rMap.get(pair.item_b)
    if (a === undefined || b === undefined) continue

    if (pair.expected_direction === 'same') {
      if (Math.abs(a - b) >= 3) inconsistent++
    } else {
      // opposite: reverse item_a, then compare
      if (Math.abs((6 - a) - b) >= 3) inconsistent++
    }
  }

  return inconsistent
}

// ---------------------------------------------------------------------------
// 4. Acquiescence
// ---------------------------------------------------------------------------

/**
 * Only Big Five items (dimension !== null).
 * Returns ratio of responses with value >= 4 over total BF responses (0–1).
 */
export function scoreAcquiescence(
  items: IPIPItem[],
  responses: ItemResponse[],
): number {
  const bfItems = items.filter((i) => i.dimension !== null)
  if (bfItems.length === 0) return 0

  const rMap = responseMap(responses)
  const bfIds = new Set(bfItems.map((i) => i.id))

  let total = 0
  let agreeCount = 0

  for (const r of responses) {
    if (!bfIds.has(r.item_id)) continue
    total++
    if (r.value >= 4) agreeCount++
  }

  return total === 0 ? 0 : agreeCount / total
}

// ---------------------------------------------------------------------------
// 5. Compute Validity (aggregate)
// ---------------------------------------------------------------------------

export function computeValidity(
  items: IPIPItem[],
  pairs: ConsistencyPair[],
  responses: ItemResponse[],
): ValidityResult {
  const sd = scoreSocialDesirability(items, responses)
  const inf = scoreInfrequency(items, responses)
  const con = scoreConsistency(pairs, responses)
  const acq = scoreAcquiescence(items, responses)

  const flags: ValidityFlag[] = []

  if (sd > THRESHOLDS.social_desirability) {
    flags.push({
      scale: 'social_desirability',
      value: sd,
      threshold: THRESHOLDS.social_desirability,
      message: 'Tendencia a presentar una imagen excesivamente favorable',
    })
  }

  if (inf >= THRESHOLDS.infrequency) {
    flags.push({
      scale: 'infrequency',
      value: inf,
      threshold: THRESHOLDS.infrequency,
      message: 'Respuestas infrecuentes detectadas — posible falta de atención',
    })
  }

  if (con >= THRESHOLDS.consistency) {
    flags.push({
      scale: 'consistency',
      value: con,
      threshold: THRESHOLDS.consistency,
      message: 'Respuestas contradictorias en ítems similares',
    })
  }

  if (acq > THRESHOLDS.acquiescence) {
    flags.push({
      scale: 'acquiescence',
      value: acq,
      threshold: THRESHOLDS.acquiescence,
      message: 'Sesgo de aquiescencia — tendencia a estar de acuerdo con todo',
    })
  }

  return {
    social_desirability: sd,
    infrequency: inf,
    consistency: con,
    acquiescence: acq,
    valid: flags.length === 0,
    flags,
  }
}
