/**
 * lib/personalidad/scoring.ts
 * Deterministic Big Five scoring engine.
 * Pure functions — no side effects, no randomness.
 */

import type {
  Dimension,
  FacetNumber,
  LikertResponse,
  IPIPItem,
  ItemResponse,
  FacetScore,
  DimensionScore,
  BigFiveProfile,
  PoliceFitResult,
  PoliceProfile,
} from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIMENSIONS: Dimension[] = ['O', 'C', 'E', 'A', 'N']
const FACETS: FacetNumber[] = [1, 2, 3, 4, 5, 6]

/** Platform normative data (initial — will be updated with real data). */
const NORMS: Record<Dimension, { mean: number; sd: number }> = {
  O: { mean: 3.0, sd: 0.6 },
  C: { mean: 3.4, sd: 0.5 },
  E: { mean: 3.2, sd: 0.6 },
  A: { mean: 3.6, sd: 0.5 },
  N: { mean: 2.8, sd: 0.6 },
}

/** Ideal police profile reference values (T-scores). */
export const POLICE_PROFILE: PoliceProfile = {
  label: 'Perfil policial ideal (baremo publico)',
  dimensions: {
    O: { ideal_t: 45, tolerance: 12 },
    C: { ideal_t: 60, tolerance: 8 },
    E: { ideal_t: 55, tolerance: 10 },
    A: { ideal_t: 50, tolerance: 10 },
    N: { ideal_t: 40, tolerance: 10 },
  },
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/** Reverse-score a Likert 1-5 value. */
export function reverseScore(value: LikertResponse): LikertResponse {
  return (6 - value) as LikertResponse
}

/** Score a single facet within a dimension. */
export function scoreFacet(
  items: IPIPItem[],
  responses: ItemResponse[],
  dimension: Dimension,
  faceta: FacetNumber,
): FacetScore {
  const facetItems = items.filter(
    (it) => it.dimension === dimension && it.faceta === faceta,
  )

  const responseMap = new Map<string, LikertResponse>()
  for (const r of responses) {
    responseMap.set(r.item_id, r.value)
  }

  let sum = 0
  let count = 0

  for (const item of facetItems) {
    const raw = responseMap.get(item.id)
    if (raw === undefined) continue
    const scored = item.reversed ? reverseScore(raw) : raw
    sum += scored
    count++
  }

  const mean = count > 0 ? sum / count : 0

  return {
    dimension,
    faceta,
    raw: mean,
    items_count: count,
  }
}

/** Score an entire dimension (all 6 facets). */
export function scoreDimension(
  items: IPIPItem[],
  responses: ItemResponse[],
  dimension: Dimension,
): DimensionScore {
  const facets = FACETS.map((f) => scoreFacet(items, responses, dimension, f))

  const facetsWithData = facets.filter((f) => f.items_count > 0)
  const raw =
    facetsWithData.length > 0
      ? facetsWithData.reduce((acc, f) => acc + f.raw, 0) / facetsWithData.length
      : 0

  const norm = NORMS[dimension]
  const t_score = 50 + 10 * ((raw - norm.mean) / norm.sd)

  return {
    dimension,
    raw,
    t_score,
    facets,
  }
}

/** Compute how well a set of dimension scores fits the ideal police profile. */
export function computePoliceFit(dimensions: DimensionScore[]): PoliceFitResult {
  const profile = POLICE_PROFILE.dimensions

  const dimension_fits = {} as PoliceFitResult['dimension_fits']
  let totalDelta = 0
  let dimCount = 0

  for (const ds of dimensions) {
    const ref = profile[ds.dimension]
    const delta = Math.abs(ds.t_score - ref.ideal_t)

    let fit: 'excellent' | 'good' | 'moderate' | 'concern'
    if (delta <= ref.tolerance / 2) {
      fit = 'excellent'
    } else if (delta <= ref.tolerance) {
      fit = 'good'
    } else if (delta <= ref.tolerance * 1.5) {
      fit = 'moderate'
    } else {
      fit = 'concern'
    }

    dimension_fits[ds.dimension] = {
      user_t: ds.t_score,
      ideal_t: ref.ideal_t,
      delta,
      fit,
    }

    totalDelta += delta
    dimCount++
  }

  const meanDelta = dimCount > 0 ? totalDelta / dimCount : 0
  const overall_fit = Math.max(0, Math.min(100, 100 - meanDelta * 2))

  return {
    overall_fit,
    dimension_fits,
  }
}

/** Compute the full Big Five profile from raw items and responses. */
export function computeBigFiveProfile(
  items: IPIPItem[],
  responses: ItemResponse[],
): BigFiveProfile {
  const dimensions = DIMENSIONS.map((d) => scoreDimension(items, responses, d))
  const police_fit = computePoliceFit(dimensions)

  return {
    dimensions,
    police_fit,
  }
}

// Re-export constants for convenience
export { NORMS, DIMENSIONS, FACETS }
