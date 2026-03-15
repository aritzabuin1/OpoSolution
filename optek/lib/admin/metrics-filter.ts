/**
 * lib/admin/metrics-filter.ts
 *
 * Shared constants and helpers for admin metrics.
 * ALL metrics must exclude admin users and pre-launch test data.
 */

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Only count data from this date onwards.
 * Everything before is test/development data from Aritz.
 */
export const METRICS_START_DATE = '2026-03-15T00:00:00Z'

/**
 * Fetches all admin user IDs from profiles.
 * Cached per request (call once, pass to all metric functions).
 */
export async function getAdminUserIds(): Promise<string[]> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('is_admin', true)

  return (data ?? []).map((p: { id: string }) => p.id)
}

/**
 * Formats admin IDs for Supabase `.not('user_id', 'in', ...)` filter.
 * Returns the parenthesized string: "(id1,id2,...)"
 * If no admins, returns null (skip filter).
 */
export function adminIdFilter(adminIds: string[]): string | null {
  if (adminIds.length === 0) return null
  return `(${adminIds.join(',')})`
}
