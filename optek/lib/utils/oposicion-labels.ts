/**
 * Maps oposicion UUIDs to human-readable labels.
 * Queries DB dynamically — no more hardcoded arrays.
 */

import { createServiceClient } from '@/lib/supabase/server'

// In-memory cache (per serverless instance, refreshes on cold start)
let cache: Map<string, string> | null = null
let cacheTime = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function loadLabels(): Promise<Map<string, string>> {
  if (cache && Date.now() - cacheTime < CACHE_TTL_MS) return cache

  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('oposiciones')
      .select('id, nombre')

    const map = new Map<string, string>()
    if (data) {
      for (const row of data as { id: string; nombre: string }[]) {
        map.set(row.id, row.nombre)
      }
    }
    cache = map
    cacheTime = Date.now()
    return map
  } catch {
    // Fallback if DB unreachable
    return cache ?? new Map()
  }
}

/**
 * Resolves an oposicion UUID to its display name.
 * Async — queries DB with in-memory cache.
 */
export async function resolveOposicionLabel(oposicionId: string): Promise<string> {
  const labels = await loadLabels()
  return labels.get(oposicionId) ?? oposicionId
}
