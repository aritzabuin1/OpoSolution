/**
 * lib/admin/auth.ts — Centralized admin authorization + audit logging
 *
 * Single source of truth for admin access checks.
 * All admin API routes and layouts MUST use verifyAdmin() instead of inline is_admin queries.
 *
 * Current implementation: profiles.is_admin boolean.
 * Future: role column with granular permissions.
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type AdminRole = 'admin' | 'auditor'

interface AdminAuthResult {
  authorized: boolean
  userId?: string
  role?: AdminRole
}

/**
 * Verifies admin authorization and logs the access attempt.
 * Uses profiles.is_admin for now (future: role column).
 *
 * @param endpoint - The route or page being accessed (for audit trail)
 * @param requestId - Optional correlation ID from x-request-id header
 */
export async function verifyAdmin(
  endpoint: string,
  requestId?: string
): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    logAdminAccess(null, endpoint, false, requestId)
    return { authorized: false }
  }

  // is_admin column from migration 019 — not yet in generated TS types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const authorized = !!profile?.is_admin
  const role: AdminRole = authorized ? 'admin' : 'auditor'

  logAdminAccess(user.id, endpoint, authorized, requestId)

  return { authorized, userId: user.id, role }
}

/**
 * Lightweight admin check for UI purposes (e.g., showing admin link in sidebar).
 * Does NOT log access — use verifyAdmin() for actual authorization gates.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    return profile?.is_admin === true
  } catch {
    // Graceful degradation: if is_admin column doesn't exist yet (migration pending)
    // or any other error, simply return false
    return false
  }
}

function logAdminAccess(
  userId: string | null,
  endpoint: string,
  authorized: boolean,
  requestId?: string
) {
  const log = logger.child({ requestId, endpoint, userId })
  if (authorized) {
    log.info('Admin access granted')
  } else {
    log.warn('Admin access denied')
  }
}
