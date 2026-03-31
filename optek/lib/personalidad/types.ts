/**
 * lib/personalidad/types.ts
 * Tipos para el modulo de Personalidad Policial.
 */

/** Big Five dimensions */
export type Dimension = 'O' | 'C' | 'E' | 'A' | 'N'

/** Facet number within a dimension (1-6) */
export type FacetNumber = 1 | 2 | 3 | 4 | 5 | 6

/** Likert scale response (1-5) */
export type LikertResponse = 1 | 2 | 3 | 4 | 5

/** Validity item type */
export type ValidezType = 'social_desirability' | 'infrequency'

/** A single IPIP item */
export interface IPIPItem {
  id: string
  texto: string
  dimension: Dimension | null
  faceta: FacetNumber | null
  reversed: boolean
  validez_type: ValidezType | null
}

/** A consistency pair for VRIN-like detection */
export interface ConsistencyPair {
  id: string
  item_a: string
  item_b: string
  expected_direction: 'same' | 'opposite'
}

/** Complete IPIP bank */
export interface IPIPBank {
  meta: {
    version: string
    source: string
    language: string
    total_items: number
    dimensions: Dimension[]
    facets_per_dimension: number
    items_per_facet: number
    validity_items: number
    consistency_pairs: number
  }
  items: IPIPItem[]
  consistency_pairs: ConsistencyPair[]
}

/** User response to a single item */
export interface ItemResponse {
  item_id: string
  value: LikertResponse
}

/** Score for a single facet */
export interface FacetScore {
  dimension: Dimension
  faceta: FacetNumber
  raw: number       // mean of items (1-5 scale)
  items_count: number
}

/** Score for a dimension (aggregate of 6 facets) */
export interface DimensionScore {
  dimension: Dimension
  raw: number       // mean of facet scores
  t_score: number   // T-score (mean=50, SD=10)
  facets: FacetScore[]
}

/** Ideal police profile reference values (T-scores) */
export interface PoliceProfile {
  label: string
  dimensions: Record<Dimension, { ideal_t: number; tolerance: number }>
}

/** Big Five profile result */
export interface BigFiveProfile {
  dimensions: DimensionScore[]
  police_fit: PoliceFitResult
}

/** How well the user fits the ideal police profile */
export interface PoliceFitResult {
  overall_fit: number  // 0-100
  dimension_fits: Record<Dimension, {
    user_t: number
    ideal_t: number
    delta: number
    fit: 'excellent' | 'good' | 'moderate' | 'concern'
  }>
}

/** Validity scale results */
export interface ValidityResult {
  social_desirability: number  // 0-1 ratio of "agree strongly"
  infrequency: number          // count of infrequent responses
  consistency: number          // count of inconsistent pairs
  acquiescence: number         // ratio of "agree" responses (4+5)
  valid: boolean               // all scales within acceptable range
  flags: ValidityFlag[]
}

export interface ValidityFlag {
  scale: 'social_desirability' | 'infrequency' | 'consistency' | 'acquiescence'
  value: number
  threshold: number
  message: string
}

/** CAT session state */
export interface CATState {
  session_number: number       // 1 = first (80 items), 2+ = follow-up (20 items)
  theta_estimates: Record<Dimension, number>  // current ability estimate per dimension
  items_administered: string[] // item IDs already shown
  responses: ItemResponse[]
  completed: boolean
}

/** Cross-session consistency record */
export interface SessionRecord {
  session_id: string
  date: string  // ISO date
  dimension_scores: Record<Dimension, number>  // T-scores
}

/** Cross-session consistency analysis */
export interface ConsistencyAnalysis {
  sessions_count: number
  dimension_deltas: Record<Dimension, {
    current: number
    previous: number
    delta: number
    flagged: boolean  // |delta| > 10 (1 SD)
  }>
  profile_correlation: number  // Pearson r between sessions
  trend: 'stable' | 'improving' | 'volatile'
  overall_consistency: number  // 0-100
}
