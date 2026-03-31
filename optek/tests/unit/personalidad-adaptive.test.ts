import { describe, it, expect } from 'vitest'
import type { Dimension, FacetNumber, IPIPItem } from '@/lib/personalidad/types'
import {
  createCATState,
  itemInformation,
  selectNextItem,
  updateTheta,
  processResponse,
  getSessionItemCount,
  getProgress,
  DIMENSIONS,
  ITEMS_SESSION_1,
  ITEMS_FOLLOWUP,
  INITIAL_THETA,
} from '@/lib/personalidad/adaptive'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeItem(
  id: string,
  dim: Dimension | null,
  faceta: FacetNumber | null = 1,
  reversed = false,
): IPIPItem {
  return {
    id,
    texto: `Item ${id}`,
    dimension: dim,
    faceta,
    reversed,
    validez_type: dim === null ? 'social_desirability' : null,
  }
}

// ---------------------------------------------------------------------------
// Constants sanity check
// ---------------------------------------------------------------------------

describe('adaptive constants', () => {
  it('exports expected values', () => {
    expect(DIMENSIONS).toEqual(['O', 'C', 'E', 'A', 'N'])
    expect(ITEMS_SESSION_1).toBe(80)
    expect(ITEMS_FOLLOWUP).toBe(20)
    expect(INITIAL_THETA).toBe(3.0)
  })
})

// ---------------------------------------------------------------------------
// createCATState
// ---------------------------------------------------------------------------

describe('createCATState', () => {
  it('initialises session 1 with all thetas at 3.0 and empty arrays', () => {
    const state = createCATState(1)

    expect(state.session_number).toBe(1)
    expect(state.items_administered).toEqual([])
    expect(state.responses).toEqual([])
    expect(state.completed).toBe(false)

    for (const dim of DIMENSIONS) {
      expect(state.theta_estimates[dim]).toBe(3.0)
    }
  })

  it('initialises session 2 with same structure', () => {
    const state = createCATState(2)

    expect(state.session_number).toBe(2)
    expect(state.items_administered).toEqual([])
    expect(state.responses).toEqual([])
    expect(state.completed).toBe(false)

    for (const dim of DIMENSIONS) {
      expect(state.theta_estimates[dim]).toBe(3.0)
    }
  })
})

// ---------------------------------------------------------------------------
// itemInformation
// ---------------------------------------------------------------------------

describe('itemInformation', () => {
  const item = makeItem('i1', 'O')

  it('returns 1.0 at midpoint theta=3.0 (no bonus)', () => {
    const info = itemInformation(item, 3.0)
    expect(info).toBe(1.0)
  })

  it('returns 1.0 when theta=4.0 (0.5 base + 0.5 bonus)', () => {
    // 1/(1+|4-3|) = 0.5, |4-3|=1 > 0.5 so +0.5 bonus = 1.0
    const info = itemInformation(item, 4.0)
    expect(info).toBe(1.0)
  })

  it('returns base only when theta is slightly off midpoint (within 0.5)', () => {
    // theta=3.3 -> 1/(1+0.3) ≈ 0.769, no bonus since 0.3 <= 0.5
    const info = itemInformation(item, 3.3)
    expect(info).toBeCloseTo(1 / 1.3, 5)
  })
})

// ---------------------------------------------------------------------------
// selectNextItem
// ---------------------------------------------------------------------------

describe('selectNextItem', () => {
  it('selects from the dimension with fewest administered items', () => {
    // Create items for all 5 dimensions
    const items: IPIPItem[] = [
      makeItem('o1', 'O'),
      makeItem('c1', 'C'),
      makeItem('e1', 'E'),
      makeItem('a1', 'A'),
      makeItem('n1', 'N'),
    ]

    // State where O, C, E each have 1 item administered; A and N have 0
    const state = createCATState(1)
    state.items_administered.push('o1', 'c1', 'e1')

    // Add more items so the algorithm can pick from A and N
    const extraItems: IPIPItem[] = [
      ...items,
      makeItem('a2', 'A'),
      makeItem('n2', 'N'),
    ]

    const selected = selectNextItem(state, extraItems)
    expect(selected).not.toBeNull()
    // Should pick from A or N (both have 0 administered, tie-broken by theta closest to 3.0 — both equal)
    expect(['A', 'N']).toContain(selected!.dimension)
  })

  it('returns null when only validity items are available', () => {
    const items: IPIPItem[] = [
      makeItem('v1', null),
      makeItem('v2', null),
    ]
    const state = createCATState(1)

    const selected = selectNextItem(state, items)
    expect(selected).toBeNull()
  })

  it('returns null when all items have been administered', () => {
    const items: IPIPItem[] = [makeItem('o1', 'O')]
    const state = createCATState(1)
    state.items_administered.push('o1')

    const selected = selectNextItem(state, items)
    expect(selected).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// updateTheta
// ---------------------------------------------------------------------------

describe('updateTheta', () => {
  it('returns scored value for a normal item', () => {
    const state = createCATState(1)
    const item = makeItem('o1', 'O', 1, false)
    const result = updateTheta(state, item, 4)
    expect(result).toBe(4)
  })

  it('returns reversed scored value (6 - value) for a reversed item', () => {
    const state = createCATState(1)
    const item = makeItem('o1', 'O', 1, true)
    const result = updateTheta(state, item, 2)
    expect(result).toBe(4) // 6 - 2
  })
})

// ---------------------------------------------------------------------------
// processResponse
// ---------------------------------------------------------------------------

describe('processResponse', () => {
  it('does not mutate the original state (immutability)', () => {
    const items = [makeItem('o1', 'O')]
    const state = createCATState(1)
    const originalThetas = { ...state.theta_estimates }
    const originalAdministered = [...state.items_administered]

    processResponse(state, items, 'o1', 4)

    expect(state.theta_estimates).toEqual(originalThetas)
    expect(state.items_administered).toEqual(originalAdministered)
    expect(state.responses).toEqual([])
    expect(state.completed).toBe(false)
  })

  it('updates theta for the responded dimension', () => {
    const items = [makeItem('o1', 'O', 1, false)]
    const state = createCATState(1)

    const newState = processResponse(state, items, 'o1', 5)

    // Single response of 5 (not reversed) -> theta for O = 5.0
    expect(newState.theta_estimates.O).toBe(5.0)
    // Other dimensions unchanged
    expect(newState.theta_estimates.C).toBe(INITIAL_THETA)
    expect(newState.theta_estimates.E).toBe(INITIAL_THETA)
    expect(newState.theta_estimates.A).toBe(INITIAL_THETA)
    expect(newState.theta_estimates.N).toBe(INITIAL_THETA)
  })

  it('marks completed after 80 responses in session 1', () => {
    // Build 80 items
    const items: IPIPItem[] = []
    for (let i = 0; i < 80; i++) {
      const dim = DIMENSIONS[i % 5]
      items.push(makeItem(`item-${i}`, dim))
    }

    // Process 80 responses sequentially
    let state = createCATState(1)
    for (let i = 0; i < 80; i++) {
      expect(state.completed).toBe(false)
      state = processResponse(state, items, `item-${i}`, 3)
    }

    expect(state.completed).toBe(true)
    expect(state.items_administered).toHaveLength(80)
    expect(state.responses).toHaveLength(80)
  })

  it('marks completed after 20 responses in session 2', () => {
    const items: IPIPItem[] = []
    for (let i = 0; i < 20; i++) {
      const dim = DIMENSIONS[i % 5]
      items.push(makeItem(`item-${i}`, dim))
    }

    let state = createCATState(2)
    for (let i = 0; i < 20; i++) {
      state = processResponse(state, items, `item-${i}`, 3)
    }

    expect(state.completed).toBe(true)
    expect(state.items_administered).toHaveLength(20)
  })
})

// ---------------------------------------------------------------------------
// getSessionItemCount
// ---------------------------------------------------------------------------

describe('getSessionItemCount', () => {
  it('returns 80 for session 1', () => {
    expect(getSessionItemCount(1)).toBe(80)
  })

  it('returns 20 for session 2', () => {
    expect(getSessionItemCount(2)).toBe(20)
  })

  it('returns 20 for session 5', () => {
    expect(getSessionItemCount(5)).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// getProgress
// ---------------------------------------------------------------------------

describe('getProgress', () => {
  it('returns 0% for an empty session 1 state', () => {
    const state = createCATState(1)
    const progress = getProgress(state)

    expect(progress.administered).toBe(0)
    expect(progress.target).toBe(80)
    expect(progress.percent).toBe(0)
  })

  it('returns correct progress mid-session', () => {
    const state = createCATState(1)
    // Simulate 40 items administered
    for (let i = 0; i < 40; i++) {
      state.items_administered.push(`item-${i}`)
    }

    const progress = getProgress(state)
    expect(progress.administered).toBe(40)
    expect(progress.target).toBe(80)
    expect(progress.percent).toBe(50)
  })
})
