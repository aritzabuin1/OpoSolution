/**
 * lib/admin/retention.ts — Retention cohort analysis
 *
 * Weekly cohort table: rows = registration week, columns = relative week.
 * Cell = % of users from that cohort who were active in that relative week.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, getAdminUserIds } from '@/lib/admin/metrics-filter'

export interface CohortRow {
  week: string           // 'W1', 'W2', etc.
  weekStart: string      // 'YYYY-MM-DD'
  registered: number     // users registered that week
  retention: number[]    // [week0%, week1%, week2%, ...] — up to maxWeeks
}

export async function getRetentionCohorts(maxWeeks = 8): Promise<CohortRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()

  // Get all profiles and their tests
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('is_admin', false)
    .gte('created_at', METRICS_START_DATE)

  const { data: testsData } = await supabase
    .from('tests_generados')
    .select('user_id, created_at')
    .eq('completado', true)
    .gte('created_at', METRICS_START_DATE)

  const profiles = ((profilesData ?? []) as Array<{ id: string; created_at: string }>)
    .filter(p => !adminIds.includes(p.id))
  const tests = ((testsData ?? []) as Array<{ user_id: string; created_at: string }>)
    .filter(t => !adminIds.includes(t.user_id))

  if (profiles.length === 0) return []

  // Group profiles by registration week
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const metricsStart = new Date(METRICS_START_DATE).getTime()
  const now = Date.now()

  function getWeekNumber(timestamp: number): number {
    return Math.floor((timestamp - metricsStart) / WEEK_MS)
  }

  function getWeekStart(weekNum: number): string {
    return new Date(metricsStart + weekNum * WEEK_MS).toISOString().split('T')[0]
  }

  // Build user activity map: userId → Set of week numbers they were active
  const userActiveWeeks = new Map<string, Set<number>>()
  for (const t of tests) {
    const week = getWeekNumber(new Date(t.created_at).getTime())
    if (!userActiveWeeks.has(t.user_id)) userActiveWeeks.set(t.user_id, new Set())
    userActiveWeeks.get(t.user_id)!.add(week)
  }

  // Group profiles by registration week
  const cohorts = new Map<number, string[]>()
  for (const p of profiles) {
    const week = getWeekNumber(new Date(p.created_at).getTime())
    if (!cohorts.has(week)) cohorts.set(week, [])
    cohorts.get(week)!.push(p.id)
  }

  const currentWeek = getWeekNumber(now)
  const results: CohortRow[] = []

  // Sort cohorts by week (oldest first)
  const sortedWeeks = [...cohorts.keys()].sort((a, b) => a - b)

  for (let i = 0; i < sortedWeeks.length && i < maxWeeks; i++) {
    const cohortWeek = sortedWeeks[i]
    const userIds = cohorts.get(cohortWeek)!
    const registered = userIds.length

    // Calculate retention for each relative week
    const weeksAvailable = Math.min(maxWeeks, currentWeek - cohortWeek + 1)
    const retention: number[] = []

    for (let relWeek = 0; relWeek < weeksAvailable; relWeek++) {
      const absoluteWeek = cohortWeek + relWeek
      const activeCount = userIds.filter(uid => {
        const weeks = userActiveWeeks.get(uid)
        return weeks?.has(absoluteWeek) ?? false
      }).length

      retention.push(registered > 0 ? Math.round((activeCount / registered) * 100) : 0)
    }

    results.push({
      week: `W${i + 1}`,
      weekStart: getWeekStart(cohortWeek),
      registered,
      retention,
    })
  }

  return results
}
