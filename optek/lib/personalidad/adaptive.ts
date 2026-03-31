/**
 * lib/personalidad/adaptive.ts
 * Computerized Adaptive Testing (CAT) engine using a simplified Graded Response Model.
 * All functions are pure/deterministic. State is immutable.
 */

import type {
  Dimension,
  IPIPItem,
  ItemResponse,
  CATState,
  LikertResponse,
} from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DIMENSIONS: Dimension[] = ['O', 'C', 'E', 'A', 'N']
export const ITEMS_SESSION_1 = 80 // broad screening: ~16 per dimension
export const ITEMS_FOLLOWUP = 20 // precision targeting: ~4 per dimension
export const INITIAL_THETA = 3.0 // midpoint of Likert scale

// ---------------------------------------------------------------------------
// 1. createCATState
// ---------------------------------------------------------------------------

export function createCATState(sessionNumber: number): CATState {
  const theta_estimates = {} as Record<Dimension, number>
  for (const d of DIMENSIONS) {
    theta_estimates[d] = INITIAL_THETA
  }

  return {
    session_number: sessionNumber,
    theta_estimates,
    items_administered: [],
    responses: [],
    completed: false,
  }
}

// ---------------------------------------------------------------------------
// 2. itemInformation
// ---------------------------------------------------------------------------

export function itemInformation(item: IPIPItem, theta: number): number {
  let info = 1.0 / (1.0 + Math.abs(theta - 3.0))

  // Bonus for dimensions where theta is far from midpoint (more uncertain)
  if (Math.abs(theta - 3.0) > 0.5) {
    info += 0.5
  }

  return info
}

// ---------------------------------------------------------------------------
// 3. selectNextItem
// ---------------------------------------------------------------------------

export function selectNextItem(
  state: CATState,
  items: IPIPItem[],
): IPIPItem | null {
  const administered = new Set(state.items_administered)

  // Filter out already-administered and validity items (dimension === null)
  const available = items.filter(
    (item) => !administered.has(item.id) && item.dimension !== null,
  )

  if (available.length === 0) return null

  // Count items administered per dimension
  const dimensionCounts: Record<Dimension, number> = {
    O: 0,
    C: 0,
    E: 0,
    A: 0,
    N: 0,
  }
  for (const itemId of state.items_administered) {
    const item = items.find((i) => i.id === itemId)
    if (item?.dimension) {
      dimensionCounts[item.dimension]++
    }
  }

  // Determine target dimension: fewest items administered
  // Tie-break: theta closest to 3.0 (most uncertain)
  const sortedDimensions = [...DIMENSIONS].sort((a, b) => {
    const countDiff = dimensionCounts[a] - dimensionCounts[b]
    if (countDiff !== 0) return countDiff
    // Tie-break: pick the one with theta closest to 3.0
    return (
      Math.abs(state.theta_estimates[a] - 3.0) -
      Math.abs(state.theta_estimates[b] - 3.0)
    )
  })

  // Try each dimension in priority order
  for (const targetDimension of sortedDimensions) {
    const dimensionItems = available.filter(
      (item) => item.dimension === targetDimension,
    )

    if (dimensionItems.length === 0) continue

    // Select item with highest information
    let bestItem = dimensionItems[0]
    let bestInfo = itemInformation(
      bestItem,
      state.theta_estimates[targetDimension],
    )

    for (let i = 1; i < dimensionItems.length; i++) {
      const info = itemInformation(
        dimensionItems[i],
        state.theta_estimates[targetDimension],
      )
      if (info > bestInfo) {
        bestInfo = info
        bestItem = dimensionItems[i]
      }
    }

    return bestItem
  }

  return null
}

// ---------------------------------------------------------------------------
// 4. updateTheta
// ---------------------------------------------------------------------------

export function updateTheta(
  state: CATState,
  item: IPIPItem,
  response: LikertResponse,
): number {
  if (item.dimension === null) return INITIAL_THETA

  // Build a map of item_id -> IPIPItem from responses already in state
  // We reconstruct scored values from all responses for this dimension
  // NOTE: This function scores the new response directly from `item`,
  // but for prior responses it needs item metadata. Since state.responses
  // only stores item_id + value, the full scoring with item lookup is
  // handled by computeTheta (used internally by processResponse).
  // As a standalone call, this returns the scored value of the current response.
  const scored = item.reversed ? 6 - response : response
  return scored
}

// Internal helper that has access to the items array
function computeTheta(
  state: CATState,
  items: IPIPItem[],
  dimension: Dimension,
  newItemId: string,
  newValue: LikertResponse,
): number {
  const itemMap = new Map(items.map((i) => [i.id, i]))
  const scoredValues: number[] = []

  // Score existing responses for this dimension
  for (const r of state.responses) {
    const existingItem = itemMap.get(r.item_id)
    if (existingItem?.dimension === dimension) {
      const scored = existingItem.reversed ? 6 - r.value : r.value
      scoredValues.push(scored)
    }
  }

  // Score the new response
  const newItem = itemMap.get(newItemId)
  if (newItem) {
    const scored = newItem.reversed ? 6 - newValue : newValue
    scoredValues.push(scored)
  }

  if (scoredValues.length === 0) return INITIAL_THETA

  const sum = scoredValues.reduce((a, b) => a + b, 0)
  return sum / scoredValues.length
}

// ---------------------------------------------------------------------------
// 5. processResponse
// ---------------------------------------------------------------------------

export function processResponse(
  state: CATState,
  items: IPIPItem[],
  item_id: string,
  value: LikertResponse,
): CATState {
  const item = items.find((i) => i.id === item_id)
  if (!item) return state

  const newResponses: ItemResponse[] = [...state.responses, { item_id, value }]
  const newAdministered = [...state.items_administered, item_id]

  // Update theta estimates
  const newThetas = { ...state.theta_estimates }
  if (item.dimension !== null) {
    newThetas[item.dimension] = computeTheta(
      state,
      items,
      item.dimension,
      item_id,
      value,
    )
  }

  // Check completion
  const target = getSessionItemCount(state.session_number)
  const completed = newAdministered.length >= target

  return {
    session_number: state.session_number,
    theta_estimates: newThetas,
    items_administered: newAdministered,
    responses: newResponses,
    completed,
  }
}

// ---------------------------------------------------------------------------
// 6. getSessionItemCount
// ---------------------------------------------------------------------------

export function getSessionItemCount(sessionNumber: number): number {
  return sessionNumber === 1 ? ITEMS_SESSION_1 : ITEMS_FOLLOWUP
}

// ---------------------------------------------------------------------------
// 7. getProgress
// ---------------------------------------------------------------------------

export function getProgress(state: CATState): {
  administered: number
  target: number
  percent: number
} {
  const administered = state.items_administered.length
  const target = getSessionItemCount(state.session_number)
  const percent = Math.round((administered / target) * 100)

  return { administered, target, percent }
}
