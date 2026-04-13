/**
 * lib/admin/content-health.ts — Content quality monitoring
 *
 * Tracks: score per tema, error reports, free bank coverage, premium bank depth.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, getAdminUserIds } from '@/lib/admin/metrics-filter'

export interface TemaHealth {
  temaId: string
  numero: number
  titulo: string
  oposicion: string
  avgScore: number | null
  testCount: number
  reports: number
  hasFreeBankData: boolean
  premiumBankQuestions: number
}

export interface SupuestoBankHealth {
  oposicion: string
  oposicionId: string
  freeBank: number
  premiumBank: number
  oficiales: number
  iaGenerated: number
  totalServed: number
}

export interface ContentHealthSummary {
  totalTemas: number
  temasWithFreeBank: number
  temasWithoutFreeBank: number
  avgScoreAll: number | null
  worstTemas: TemaHealth[]
  mostTestedTemas: TemaHealth[]
  supuestoBanks: SupuestoBankHealth[]
}

export async function getContentHealth(): Promise<ContentHealthSummary> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()

  const [temasRes, freeBankRes, premiumBankRes, testsRes, reportsRes, opoRes, freeSBankRes, premSBankRes, supTestsRes] = await Promise.all([
    supabase.from('temas').select('id, numero, titulo, oposicion_id').order('oposicion_id').order('numero'),
    supabase.from('free_question_bank').select('tema_id'),
    supabase.from('question_bank').select('tema_id'),
    supabase.from('tests_generados').select('tema_id, puntuacion')
      .eq('completado', true).not('tema_id', 'is', null).gte('created_at', METRICS_START_DATE),
    supabase.from('preguntas_reportadas').select('test_id'),
    supabase.from('oposiciones').select('id, nombre'),
    // Supuesto banks
    supabase.from('free_supuesto_bank').select('oposicion_id'),
    supabase.from('supuesto_bank').select('oposicion_id, es_oficial, fuente, times_served'),
    supabase.from('tests_generados').select('oposicion_id').eq('tipo', 'supuesto_test').eq('completado', true),
  ])

  const temas = (temasRes.data ?? []) as Array<{ id: string; numero: number; titulo: string; oposicion_id: string }>
  const freeBankTemas = new Set(((freeBankRes.data ?? []) as Array<{ tema_id: string }>).map(r => r.tema_id))
  const opoMap = new Map(((opoRes.data ?? []) as Array<{ id: string; nombre: string }>).map(o => [o.id, o.nombre]))

  // Premium bank questions per tema
  const premiumByTema = new Map<string, number>()
  for (const r of (premiumBankRes.data ?? []) as Array<{ tema_id: string }>) {
    premiumByTema.set(r.tema_id, (premiumByTema.get(r.tema_id) ?? 0) + 1)
  }

  // Scores per tema
  const scoresByTema = new Map<string, number[]>()
  for (const t of (testsRes.data ?? []) as Array<{ tema_id: string; puntuacion: number | null }>) {
    if (t.puntuacion === null) continue
    if (!scoresByTema.has(t.tema_id)) scoresByTema.set(t.tema_id, [])
    scoresByTema.get(t.tema_id)!.push(t.puntuacion)
  }

  const temaHealthMap: TemaHealth[] = temas.map(t => {
    const scores = scoresByTema.get(t.id) ?? []
    return {
      temaId: t.id,
      numero: t.numero,
      titulo: t.titulo,
      oposicion: opoMap.get(t.oposicion_id) ?? '?',
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      testCount: scores.length,
      reports: 0, // TODO: join reports by tema via test_id
      hasFreeBankData: freeBankTemas.has(t.id),
      premiumBankQuestions: premiumByTema.get(t.id) ?? 0,
    }
  })

  const allScores = [...scoresByTema.values()].flat()

  // Supuesto bank stats per oposicion
  const freeSBankByOpo = new Map<string, number>()
  for (const r of (freeSBankRes.data ?? []) as Array<{ oposicion_id: string }>) {
    freeSBankByOpo.set(r.oposicion_id, (freeSBankByOpo.get(r.oposicion_id) ?? 0) + 1)
  }
  const premSBankByOpo = new Map<string, { total: number; oficiales: number; ia: number; served: number }>()
  for (const r of (premSBankRes.data ?? []) as Array<{ oposicion_id: string; es_oficial: boolean; fuente: string; times_served: number }>) {
    const cur = premSBankByOpo.get(r.oposicion_id) ?? { total: 0, oficiales: 0, ia: 0, served: 0 }
    cur.total++
    if (r.es_oficial) cur.oficiales++; else cur.ia++
    cur.served += r.times_served ?? 0
    premSBankByOpo.set(r.oposicion_id, cur)
  }
  const supTestsByOpo = new Map<string, number>()
  for (const r of (supTestsRes.data ?? []) as Array<{ oposicion_id: string }>) {
    supTestsByOpo.set(r.oposicion_id, (supTestsByOpo.get(r.oposicion_id) ?? 0) + 1)
  }
  // Only include oposiciones that have supuesto_test feature
  const allOpoIds = new Set([...freeSBankByOpo.keys(), ...premSBankByOpo.keys()])
  const supuestoBanks: SupuestoBankHealth[] = [...allOpoIds].map(opoId => {
    const prem = premSBankByOpo.get(opoId) ?? { total: 0, oficiales: 0, ia: 0, served: 0 }
    return {
      oposicion: opoMap.get(opoId) ?? '?',
      oposicionId: opoId,
      freeBank: freeSBankByOpo.get(opoId) ?? 0,
      premiumBank: prem.total,
      oficiales: prem.oficiales,
      iaGenerated: prem.ia,
      totalServed: supTestsByOpo.get(opoId) ?? 0,
    }
  })

  return {
    totalTemas: temas.length,
    temasWithFreeBank: temaHealthMap.filter(t => t.hasFreeBankData).length,
    temasWithoutFreeBank: temaHealthMap.filter(t => !t.hasFreeBankData).length,
    avgScoreAll: allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null,
    worstTemas: temaHealthMap.filter(t => t.avgScore !== null).sort((a, b) => (a.avgScore ?? 100) - (b.avgScore ?? 100)).slice(0, 10),
    mostTestedTemas: [...temaHealthMap].sort((a, b) => b.testCount - a.testCount).slice(0, 10),
    supuestoBanks,
  }
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────

export interface ActivityEvent {
  type: 'register' | 'test' | 'purchase' | 'error'
  date: string
  detail: string
  userId?: string
  email?: string
  fullName?: string
  oposicion?: string
  isPremium?: boolean
}

export async function getRecentActivity(limit = 25): Promise<ActivityEvent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [registersRes, testsRes, purchasesRes] = await Promise.all([
    supabase.from('profiles').select('id, email, created_at')
      .gte('created_at', since).order('created_at', { ascending: false }).limit(limit),
    supabase.from('tests_generados').select('user_id, created_at, tipo, prompt_version, completado, temas(titulo)')
      .gte('created_at', since).eq('completado', true)
      .order('created_at', { ascending: false }).limit(limit),
    supabase.from('compras').select('user_id, created_at, tipo, amount_paid')
      .gte('created_at', since).order('created_at', { ascending: false }).limit(limit),
  ])

  // Get user profiles + oposicion names for enrichment
  const allUserIds = new Set<string>()
  for (const t of (testsRes.data ?? []) as Array<{ user_id: string }>) allUserIds.add(t.user_id)
  for (const c of (purchasesRes.data ?? []) as Array<{ user_id: string }>) allUserIds.add(c.user_id)
  for (const r of (registersRes.data ?? []) as Array<{ id: string }>) allUserIds.add(r.id)

  const [profilesData, oposicionesData, comprasData] = await Promise.all([
    allUserIds.size > 0
      ? supabase.from('profiles').select('id, email, full_name, oposicion_id').in('id', [...allUserIds])
      : { data: [] },
    supabase.from('oposiciones').select('id, nombre'),
    allUserIds.size > 0
      ? supabase.from('compras').select('user_id').in('user_id', [...allUserIds])
      : { data: [] },
  ])

  const opoMap = new Map(((oposicionesData.data ?? []) as Array<{ id: string; nombre: string }>).map(o => [o.id, o.nombre]))
  const paidUserIds = new Set(((comprasData.data ?? []) as Array<{ user_id: string }>).map(c => c.user_id))

  interface UserInfo { email: string; fullName?: string; oposicion?: string; isPremium: boolean }
  const userMap = new Map<string, UserInfo>()
  for (const p of ((profilesData.data ?? []) as Array<{ id: string; email: string; full_name: string | null; oposicion_id: string | null }>)) {
    userMap.set(p.id, {
      email: p.email,
      fullName: p.full_name ?? undefined,
      oposicion: p.oposicion_id ? opoMap.get(p.oposicion_id) : undefined,
      isPremium: paidUserIds.has(p.id),
    })
  }

  const events: ActivityEvent[] = []

  for (const r of (registersRes.data ?? []) as Array<{ id: string; email: string; created_at: string }>) {
    const u = userMap.get(r.id)
    events.push({ type: 'register', date: r.created_at, detail: `Nuevo registro: ${r.email}`, userId: r.id, email: r.email, fullName: u?.fullName, oposicion: u?.oposicion, isPremium: false })
  }

  for (const t of (testsRes.data ?? []) as Array<{ user_id: string; created_at: string; tipo: string; prompt_version: string; temas: { titulo: string } | null }>) {
    const source = t.prompt_version === 'free-bank-1.0' ? 'free' : 'IA'
    const tema = (t.temas as { titulo: string } | null)?.titulo ?? t.tipo
    const u = userMap.get(t.user_id)
    events.push({ type: 'test', date: t.created_at, detail: `Test ${source}: ${tema}`, userId: t.user_id, email: u?.email, fullName: u?.fullName, oposicion: u?.oposicion, isPremium: u?.isPremium })
  }

  for (const c of (purchasesRes.data ?? []) as Array<{ user_id: string; created_at: string; tipo: string; amount_paid: number }>) {
    const u = userMap.get(c.user_id)
    events.push({ type: 'purchase', date: c.created_at, detail: `Compra: ${c.tipo} — €${(c.amount_paid / 100).toFixed(2)}`, userId: c.user_id, email: u?.email, fullName: u?.fullName, oposicion: u?.oposicion, isPremium: true })
  }

  events.sort((a, b) => b.date.localeCompare(a.date))
  return events.slice(0, limit)
}
