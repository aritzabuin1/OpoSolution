/**
 * GET /api/admin/export-metrics
 *
 * Exports all admin dashboard metrics as a single JSON file.
 * Protected by admin auth (session-based).
 */

import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import {
  getConversionMetrics,
  getDAU30d,
  getFeatureEngagement,
  getChurnMetrics,
  getOnboardingFunnel,
  getTopTemas,
  getTemaScores,
  getCorrectionsUsage,
  getCompletionRate,
  getFeedbackSummary,
  getAnalysisUsageByType,
  getCtaFunnel,
  getDashboardPhaseDistribution,
  getDeviceDistribution,
  getOposicionBreakdown,
} from '@/lib/admin/analytics'
import {
  getFuelTank,
  getCostPerUser,
  getAARRR,
  getMRRHistory,
  getAlerts,
} from '@/lib/admin/metrics'
import { getInfraMetrics } from '@/lib/admin/infrastructure'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await verifyAdmin('export-metrics')
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      conversion, dau, engagement, churn, funnel,
      topTemas, temaScores, corrections, completion, feedback,
      analysisUsage, ctaFunnel, phaseDistribution, deviceDist, oposicionBreakdown,
      fuelTank, costPerUser, aarrr, mrrHistory, infra,
    ] = await Promise.all([
      getConversionMetrics(),
      getDAU30d(),
      getFeatureEngagement(),
      getChurnMetrics(),
      getOnboardingFunnel(),
      getTopTemas(10),
      getTemaScores(10),
      getCorrectionsUsage(),
      getCompletionRate(),
      getFeedbackSummary(),
      getAnalysisUsageByType(),
      getCtaFunnel(),
      getDashboardPhaseDistribution(),
      getDeviceDistribution(),
      getOposicionBreakdown(),
      getFuelTank(),
      getCostPerUser(),
      getAARRR(),
      getMRRHistory(6),
      getInfraMetrics(),
    ])

    const alerts = getAlerts(fuelTank, costPerUser)

    const exportData = {
      exportedAt: new Date().toISOString(),
      analytics: {
        conversion,
        dau,
        engagement,
        churn,
        funnel,
        topTemas,
        temaScores,
        corrections,
        completion,
        feedback,
        analysisUsage,
        ctaFunnel,
        phaseDistribution,
        deviceDist,
        oposicionBreakdown,
      },
      economics: {
        fuelTank,
        costPerUser,
        aarrr,
        mrrHistory,
        alerts,
      },
      infrastructure: infra,
    }

    return NextResponse.json(exportData)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
