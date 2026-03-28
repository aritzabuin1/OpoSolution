/**
 * lib/admin/premium-analytics.ts — Premium user monitoring + conversion signals
 *
 * Tracks: feature adoption, engagement depth, at-risk users, pre-conversion behavior.
 * Admin-only: uses createServiceClient (bypasses RLS).
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, adminIdFilter, getAdminUserIds } from '@/lib/admin/metrics-filter'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremiumFeatureAdoption {
  feature: string
  usersUsed: number
  totalPremium: number
  adoptionPct: number
}

export interface PremiumEngagement {
  totalPremium: number
  avgTestsPerWeek: number
  avgTemasExplored: number
  avgScore: number | null
  avgAnalysisUsed: number
  rechargeRate: number          // % premium who bought recarga
}

export interface AtRiskUser {
  id: string
  email: string
  fullName: string | null
  oposicion: string | null
  category: 'hot_lead' | 'pre_churn' | 'premium_inactive'
  temasExplored: number
  lastActivity: string | null
  daysSince: number
  totalSpent: number
}

export interface PreConversionSignal {
  avgTemasBeforePurchase: number
  avgDaysToConvert: number | null
  topFeatureBeforePurchase: string | null
  purchaseCount: number
}

// ─── Premium Feature Adoption ─────────────────────────────────────────────────

export async function getPremiumFeatureAdoption(): Promise<PremiumFeatureAdoption[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()

  // Get premium user IDs (have compras)
  const { data: comprasData } = await supabase
    .from('compras').select('user_id').gte('created_at', METRICS_START_DATE)
  const premiumIds = [...new Set(
    ((comprasData ?? []) as Array<{ user_id: string }>)
      .map(c => c.user_id)
      .filter(id => !adminIds.includes(id))
  )]
  const totalPremium = premiumIds.length
  if (totalPremium === 0) return []

  // Check each feature
  const [testsRes, simulacrosRes, psicoRes, flashRes, radarRes, cazaRes, analysisRes, supuestosRes] = await Promise.all([
    supabase.from('tests_generados').select('user_id').eq('tipo', 'tema').in('user_id', premiumIds).neq('prompt_version', 'free-bank-1.0'),
    supabase.from('tests_generados').select('user_id').eq('tipo', 'simulacro').in('user_id', premiumIds),
    supabase.from('tests_generados').select('user_id').eq('tipo', 'psicotecnico').in('user_id', premiumIds),
    supabase.from('flashcard_reviews').select('user_id').in('user_id', premiumIds),
    supabase.from('tests_generados').select('user_id').eq('tipo', 'radar').in('user_id', premiumIds),
    supabase.from('cazatrampas_intentos').select('user_id').in('user_id', premiumIds),
    supabase.from('api_usage_log').select('user_id').in('endpoint', ['explain-errores-stream', 'explain-errores']).in('user_id', premiumIds),
    supabase.from('supuestos_practicos').select('user_id').in('user_id', premiumIds),
  ])

  function countUnique(data: Array<{ user_id: string }> | null): number {
    return new Set((data ?? []).map(r => r.user_id)).size
  }

  const features: PremiumFeatureAdoption[] = [
    { feature: 'Tests IA', usersUsed: countUnique(testsRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Simulacros', usersUsed: countUnique(simulacrosRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Psicotécnicos', usersUsed: countUnique(psicoRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Flashcards', usersUsed: countUnique(flashRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Radar', usersUsed: countUnique(radarRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Caza-Trampas', usersUsed: countUnique(cazaRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Análisis IA', usersUsed: countUnique(analysisRes.data), totalPremium, adoptionPct: 0 },
    { feature: 'Supuestos', usersUsed: countUnique(supuestosRes.data), totalPremium, adoptionPct: 0 },
  ]

  for (const f of features) {
    f.adoptionPct = Math.round((f.usersUsed / totalPremium) * 100)
  }

  return features.sort((a, b) => b.adoptionPct - a.adoptionPct)
}

// ─── Premium Engagement Summary ───────────────────────────────────────────────

export async function getPremiumEngagement(): Promise<PremiumEngagement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()

  const { data: comprasData } = await supabase.from('compras').select('user_id, tipo')
  const allCompras = (comprasData ?? []) as Array<{ user_id: string; tipo: string }>
  const premiumIds = [...new Set(allCompras.map(c => c.user_id).filter(id => !adminIds.includes(id)))]
  const totalPremium = premiumIds.length
  if (totalPremium === 0) return { totalPremium: 0, avgTestsPerWeek: 0, avgTemasExplored: 0, avgScore: null, avgAnalysisUsed: 0, rechargeRate: 0 }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [testsRes, analysisRes] = await Promise.all([
    supabase.from('tests_generados').select('user_id, tema_id, puntuacion')
      .eq('completado', true).in('user_id', premiumIds).gte('created_at', thirtyDaysAgo),
    supabase.from('api_usage_log').select('user_id')
      .in('endpoint', ['explain-errores-stream', 'explain-errores']).in('user_id', premiumIds),
  ])

  const tests = (testsRes.data ?? []) as Array<{ user_id: string; tema_id: string | null; puntuacion: number | null }>
  const totalTests = tests.length
  const scores = tests.map(t => t.puntuacion).filter((s): s is number => s !== null)

  // Unique temas per user
  const temasPerUser = new Map<string, Set<string>>()
  for (const t of tests) {
    if (!t.tema_id) continue
    if (!temasPerUser.has(t.user_id)) temasPerUser.set(t.user_id, new Set())
    temasPerUser.get(t.user_id)!.add(t.tema_id)
  }
  const totalTemas = [...temasPerUser.values()].reduce((s, set) => s + set.size, 0)

  const analysisCount = (analysisRes.data ?? []).length

  // Recharge rate: premium users who bought 'recarga'
  const rechargeUsers = new Set(allCompras.filter(c => c.tipo === 'recarga').map(c => c.user_id))
  const rechargeRate = Math.round((rechargeUsers.size / totalPremium) * 100)

  return {
    totalPremium,
    avgTestsPerWeek: totalPremium > 0 ? Math.round((totalTests / totalPremium / 4.3) * 10) / 10 : 0,
    avgTemasExplored: totalPremium > 0 ? Math.round((totalTemas / totalPremium) * 10) / 10 : 0,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    avgAnalysisUsed: totalPremium > 0 ? Math.round((analysisCount / totalPremium) * 10) / 10 : 0,
    rechargeRate,
  }
}

// ─── At Risk Users ────────────────────────────────────────────────────────────

export async function getAtRiskUsers(limit = 20): Promise<AtRiskUser[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  // All profiles
  const { data: profilesData } = await supabase
    .from('profiles').select('id, email, full_name, oposicion_id')
    .eq('is_admin', false).gte('created_at', METRICS_START_DATE)

  const profiles = (profilesData ?? []) as Array<{ id: string; email: string; full_name: string | null; oposicion_id: string | null }>

  // Get compras + tests + oposicion names
  const userIds = profiles.map(p => p.id)
  const [comprasRes, testsRes, opoRes] = await Promise.all([
    supabase.from('compras').select('user_id, amount_paid'),
    supabase.from('tests_generados').select('user_id, tema_id, created_at')
      .eq('completado', true).in('user_id', userIds.slice(0, 300)),
    supabase.from('oposiciones').select('id, nombre'),
  ])

  const paidUsers = new Map<string, number>()
  for (const c of (comprasRes.data ?? []) as Array<{ user_id: string; amount_paid: number }>) {
    paidUsers.set(c.user_id, (paidUsers.get(c.user_id) ?? 0) + c.amount_paid / 100)
  }

  const opoMap = new Map(((opoRes.data ?? []) as Array<{ id: string; nombre: string }>).map(o => [o.id, o.nombre]))

  // Build user stats
  const userStats = new Map<string, { temas: Set<string>; lastDate: string }>()
  for (const t of (testsRes.data ?? []) as Array<{ user_id: string; tema_id: string | null; created_at: string }>) {
    const entry = userStats.get(t.user_id) ?? { temas: new Set<string>(), lastDate: '' }
    if (t.tema_id) entry.temas.add(t.tema_id)
    if (t.created_at > entry.lastDate) entry.lastDate = t.created_at
    userStats.set(t.user_id, entry)
  }

  const now = Date.now()
  const results: AtRiskUser[] = []

  for (const p of profiles) {
    const stats = userStats.get(p.id)
    const temasExplored = stats?.temas.size ?? 0
    const lastActivity = stats?.lastDate || null
    const daysSince = lastActivity ? Math.floor((now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : 999
    const isPaid = paidUsers.has(p.id)
    const totalSpent = paidUsers.get(p.id) ?? 0

    // Hot lead: free user with 5+ temas (high intent, hasn't converted)
    if (!isPaid && temasExplored >= 5) {
      results.push({
        id: p.id, email: p.email, fullName: p.full_name,
        oposicion: p.oposicion_id ? opoMap.get(p.oposicion_id) ?? null : null,
        category: 'hot_lead', temasExplored, lastActivity, daysSince, totalSpent,
      })
    }
    // Pre-churn: was active (3+ temas), inactive 7+ days
    else if (!isPaid && temasExplored >= 3 && daysSince >= 7 && daysSince < 999) {
      results.push({
        id: p.id, email: p.email, fullName: p.full_name,
        oposicion: p.oposicion_id ? opoMap.get(p.oposicion_id) ?? null : null,
        category: 'pre_churn', temasExplored, lastActivity, daysSince, totalSpent,
      })
    }
    // Premium inactive: paid but no test in 14+ days
    else if (isPaid && daysSince >= 14) {
      results.push({
        id: p.id, email: p.email, fullName: p.full_name,
        oposicion: p.oposicion_id ? opoMap.get(p.oposicion_id) ?? null : null,
        category: 'premium_inactive', temasExplored, lastActivity, daysSince, totalSpent,
      })
    }
  }

  // Sort: hot leads first, then premium_inactive, then pre_churn
  const order = { hot_lead: 0, premium_inactive: 1, pre_churn: 2 }
  results.sort((a, b) => order[a.category] - order[b.category] || b.temasExplored - a.temasExplored)

  return results.slice(0, limit)
}

// ─── Pre-Conversion Behavior ──────────────────────────────────────────────────

export async function getPreConversionBehavior(): Promise<PreConversionSignal> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Get all purchasers
  const { data: comprasData } = await supabase
    .from('compras').select('user_id, created_at')
    .gte('created_at', METRICS_START_DATE)
    .order('created_at')

  const compras = (comprasData ?? []) as Array<{ user_id: string; created_at: string }>
  if (compras.length === 0) return { avgTemasBeforePurchase: 0, avgDaysToConvert: null, topFeatureBeforePurchase: null, purchaseCount: 0 }

  // First purchase per user
  const firstPurchase = new Map<string, string>()
  for (const c of compras) {
    if (!firstPurchase.has(c.user_id)) firstPurchase.set(c.user_id, c.created_at)
  }

  const purchaserIds = [...firstPurchase.keys()]

  // Get tests before purchase + registration dates
  const [testsRes, profilesRes] = await Promise.all([
    supabase.from('tests_generados').select('user_id, tema_id, created_at, tipo')
      .eq('completado', true).in('user_id', purchaserIds),
    supabase.from('profiles').select('id, created_at').in('id', purchaserIds),
  ])

  const profileCreated = new Map(
    ((profilesRes.data ?? []) as Array<{ id: string; created_at: string }>).map(p => [p.id, p.created_at])
  )

  let totalTemas = 0
  const daysList: number[] = []
  const featureCounts: Record<string, number> = {}

  for (const [userId, purchaseDate] of firstPurchase) {
    // Count temas explored BEFORE purchase
    const testsBeforePurchase = ((testsRes.data ?? []) as Array<{ user_id: string; tema_id: string | null; created_at: string; tipo: string }>)
      .filter(t => t.user_id === userId && t.created_at < purchaseDate)

    const temas = new Set(testsBeforePurchase.filter(t => t.tema_id).map(t => t.tema_id!))
    totalTemas += temas.size

    // Days to convert
    const regDate = profileCreated.get(userId)
    if (regDate) {
      const days = (new Date(purchaseDate).getTime() - new Date(regDate).getTime()) / (1000 * 60 * 60 * 24)
      daysList.push(Math.max(0, Math.round(days * 10) / 10))
    }

    // Last feature used before purchase
    const lastTest = testsBeforePurchase.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    if (lastTest) {
      const feat = lastTest.tipo === 'tema' ? 'test' : lastTest.tipo
      featureCounts[feat] = (featureCounts[feat] ?? 0) + 1
    }
  }

  const topFeature = Object.entries(featureCounts).sort((a, b) => b[1] - a[1])[0]

  return {
    avgTemasBeforePurchase: purchaserIds.length > 0 ? Math.round((totalTemas / purchaserIds.length) * 10) / 10 : 0,
    avgDaysToConvert: daysList.length > 0 ? Math.round((daysList.reduce((a, b) => a + b, 0) / daysList.length) * 10) / 10 : null,
    topFeatureBeforePurchase: topFeature ? topFeature[0] : null,
    purchaseCount: purchaserIds.length,
  }
}
