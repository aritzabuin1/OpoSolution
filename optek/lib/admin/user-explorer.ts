/**
 * lib/admin/user-explorer.ts — User Explorer functions
 *
 * Search users by email/name, get individual timeline, state and balances.
 * Admin-only: uses createServiceClient (bypasses RLS).
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSearchResult {
  id: string
  email: string
  fullName: string | null
  oposicion: string | null
  oposicionSlug: string | null
  isPremium: boolean
  temasExplored: number
  testsCompleted: number
  lastActivity: string | null
  createdAt: string
}

export interface UserDetail {
  id: string
  email: string
  fullName: string | null
  oposicionId: string | null
  oposicionNombre: string | null
  isAdmin: boolean
  isPremium: boolean
  createdAt: string
  // Balances
  correctionsBalance: number
  freeCorrectionsUsed: number
  supuestosBalance: number
  freeTestsUsed: number
  // Activity stats
  testsCompleted: number
  temasExplored: number
  avgScore: number | null
  rachaActual: number
  lastTestDate: string | null
  // Revenue
  totalSpent: number
  purchases: { tipo: string; amount: number; date: string }[]
}

export interface TimelineEvent {
  type: 'register' | 'test' | 'test_completed' | 'analysis' | 'purchase' | 'supuesto' | 'nurture'
  date: string
  detail: string
  meta?: Record<string, unknown>
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function getUserSearch(query: string, limit = 20): Promise<UserSearchResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Search by email or name (ilike for partial match)
  const searchTerm = `%${query.trim()}%`
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id, created_at')
    .or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!profiles || profiles.length === 0) return []

  const userIds = (profiles as Array<{ id: string }>).map(p => p.id)

  // Get oposicion names, compras, tests in parallel
  const [oposicionesRes, comprasRes, testsRes] = await Promise.all([
    supabase.from('oposiciones').select('id, nombre, slug'),
    supabase.from('compras').select('user_id').in('user_id', userIds),
    supabase.from('tests_generados').select('user_id, tema_id, created_at')
      .eq('completado', true).in('user_id', userIds),
  ])

  const opoMap = new Map(
    ((oposicionesRes.data ?? []) as Array<{ id: string; nombre: string; slug: string }>)
      .map(o => [o.id, { nombre: o.nombre, slug: o.slug }])
  )
  const paidUsers = new Set(
    ((comprasRes.data ?? []) as Array<{ user_id: string }>).map(c => c.user_id)
  )

  // Tests per user
  const userTests = new Map<string, { count: number; temas: Set<string>; lastDate: string }>()
  for (const t of (testsRes.data ?? []) as Array<{ user_id: string; tema_id: string | null; created_at: string }>) {
    const entry = userTests.get(t.user_id) ?? { count: 0, temas: new Set<string>(), lastDate: '' }
    entry.count++
    if (t.tema_id) entry.temas.add(t.tema_id)
    if (t.created_at > entry.lastDate) entry.lastDate = t.created_at
    userTests.set(t.user_id, entry)
  }

  return (profiles as Array<{ id: string; email: string; full_name: string | null; oposicion_id: string | null; created_at: string }>).map(p => {
    const opo = p.oposicion_id ? opoMap.get(p.oposicion_id) : null
    const tests = userTests.get(p.id)
    return {
      id: p.id,
      email: p.email ?? '',
      fullName: p.full_name,
      oposicion: opo?.nombre ?? null,
      oposicionSlug: opo?.slug ?? null,
      isPremium: paidUsers.has(p.id),
      temasExplored: tests?.temas.size ?? 0,
      testsCompleted: tests?.count ?? 0,
      lastActivity: tests?.lastDate || null,
      createdAt: p.created_at,
    }
  })
}

// ─── User Detail ──────────────────────────────────────────────────────────────

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id, is_admin, corrections_balance, free_corrector_used, supuestos_balance, free_tests_used, racha_actual, created_at')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const p = profile as Record<string, unknown>

  // Oposicion name
  let oposicionNombre: string | null = null
  if (p.oposicion_id) {
    const { data: opo } = await supabase.from('oposiciones').select('nombre').eq('id', p.oposicion_id).single()
    oposicionNombre = (opo as { nombre: string } | null)?.nombre ?? null
  }

  // Tests + scores
  const { data: tests } = await supabase
    .from('tests_generados')
    .select('tema_id, puntuacion, created_at')
    .eq('user_id', userId)
    .eq('completado', true)

  const testsArr = (tests ?? []) as Array<{ tema_id: string | null; puntuacion: number | null; created_at: string }>
  const temas = new Set(testsArr.filter(t => t.tema_id).map(t => t.tema_id!))
  const scores = testsArr.map(t => t.puntuacion).filter((s): s is number => s !== null)
  const lastTest = testsArr.length > 0 ? testsArr.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at : null

  // Purchases
  const { data: compras } = await supabase
    .from('compras')
    .select('tipo, amount_paid, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const purchasesArr = (compras ?? []) as Array<{ tipo: string; amount_paid: number; created_at: string }>
  const totalSpent = purchasesArr.reduce((s, c) => s + (c.amount_paid ?? 0), 0) / 100

  return {
    id: p.id as string,
    email: (p.email as string) ?? '',
    fullName: (p.full_name as string) ?? null,
    oposicionId: (p.oposicion_id as string) ?? null,
    oposicionNombre,
    isAdmin: p.is_admin === true,
    isPremium: purchasesArr.length > 0 || p.is_admin === true,
    createdAt: p.created_at as string,
    correctionsBalance: (p.corrections_balance as number) ?? 0,
    freeCorrectionsUsed: (p.free_corrector_used as number) ?? 0,
    supuestosBalance: (p.supuestos_balance as number) ?? 0,
    freeTestsUsed: (p.free_tests_used as number) ?? 0,
    testsCompleted: testsArr.length,
    temasExplored: temas.size,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    rachaActual: (p.racha_actual as number) ?? 0,
    lastTestDate: lastTest,
    totalSpent,
    purchases: purchasesArr.map(c => ({ tipo: c.tipo, amount: c.amount_paid / 100, date: c.created_at })),
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export async function getUserTimeline(userId: string, limit = 50): Promise<TimelineEvent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const [profileRes, testsRes, comprasRes, analysisRes, supuestosRes, nurtureRes] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('id', userId).single(),
    supabase.from('tests_generados')
      .select('id, created_at, completado, puntuacion, tipo, prompt_version, temas(titulo)')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
    supabase.from('compras')
      .select('created_at, tipo, amount_paid')
      .eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('api_usage_log')
      .select('timestamp, endpoint, cost_estimated_cents')
      .eq('user_id', userId)
      .in('endpoint', ['explain-errores-stream', 'explain-errores', 'correct-desarrollo', 'informe-simulacro-stream'])
      .order('timestamp', { ascending: false }).limit(20),
    supabase.from('supuestos_practicos')
      .select('created_at, completado, puntuacion_total')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('nurture_emails_sent')
      .select('email_key, sent_at')
      .eq('user_id', userId).order('sent_at', { ascending: false }),
  ])

  const events: TimelineEvent[] = []

  // Registration
  if (profileRes.data?.created_at) {
    events.push({
      type: 'register',
      date: profileRes.data.created_at as string,
      detail: 'Se registró en OpoRuta',
    })
  }

  // Tests
  for (const t of (testsRes.data ?? []) as Array<{
    id: string; created_at: string; completado: boolean; puntuacion: number | null;
    tipo: string; prompt_version: string; temas: { titulo: string } | null
  }>) {
    const tema = t.temas?.titulo ?? t.tipo
    const isFreeBank = t.prompt_version === 'free-bank-1.0' || t.prompt_version === 'free-supuesto-1.0'
    const isBankServed = isFreeBank || t.prompt_version === 'supuesto-bank-1.0' || t.prompt_version === 'repeat-1.0' || t.prompt_version?.startsWith('oficial')
    const source = isFreeBank ? 'free bank' : isBankServed ? 'banco' : 'IA'
    if (t.completado) {
      events.push({
        type: 'test_completed',
        date: t.created_at,
        detail: `Completó test: ${tema} — ${t.puntuacion ?? '?'}% (${source})`,
        meta: { testId: t.id, score: t.puntuacion, source },
      })
    } else {
      events.push({
        type: 'test',
        date: t.created_at,
        detail: `Generó test: ${tema} (${source}) — no completado`,
        meta: { testId: t.id },
      })
    }
  }

  // Purchases
  for (const c of (comprasRes.data ?? []) as Array<{ created_at: string; tipo: string; amount_paid: number }>) {
    events.push({
      type: 'purchase',
      date: c.created_at,
      detail: `Compró: ${c.tipo} — €${(c.amount_paid / 100).toFixed(2)}`,
      meta: { tipo: c.tipo, amount: c.amount_paid / 100 },
    })
  }

  // Analysis
  for (const a of (analysisRes.data ?? []) as Array<{ timestamp: string; endpoint: string; cost_estimated_cents: number }>) {
    const labels: Record<string, string> = {
      'explain-errores-stream': 'Análisis errores',
      'explain-errores': 'Análisis errores (batch)',
      'correct-desarrollo': 'Corrección desarrollo',
      'informe-simulacro-stream': 'Informe simulacro',
    }
    events.push({
      type: 'analysis',
      date: a.timestamp,
      detail: `${labels[a.endpoint] ?? a.endpoint} — €${(a.cost_estimated_cents / 100).toFixed(3)}`,
    })
  }

  // Supuestos
  for (const s of (supuestosRes.data ?? []) as Array<{ created_at: string; completado: boolean; puntuacion_total: number | null }>) {
    events.push({
      type: 'supuesto',
      date: s.created_at,
      detail: `Supuesto práctico${s.completado ? ` — ${s.puntuacion_total ?? '?'}/50 pts` : ' (en progreso)'}`,
    })
  }

  // Nurture emails (already fetched in Promise.all above)
  for (const n of (nurtureRes.data ?? []) as Array<{ email_key: string; sent_at: string }>) {
    events.push({
      type: 'nurture',
      date: n.sent_at,
      detail: `Nurture email: ${n.email_key}`,
      meta: { emailKey: n.email_key },
    })
  }

  // Sort by date descending
  events.sort((a, b) => b.date.localeCompare(a.date))
  return events.slice(0, limit)
}

// ─── Nurture Emails per User ─────────────────────────────────────────────────

export interface NurtureEmailSent {
  emailKey: string
  sentAt: string
}

export async function getUserNurtureEmails(userId: string): Promise<NurtureEmailSent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data } = await supabase
    .from('nurture_emails_sent')
    .select('email_key, sent_at')
    .eq('user_id', userId)
    .order('sent_at', { ascending: true })

  return ((data ?? []) as Array<{ email_key: string; sent_at: string }>).map(r => ({
    emailKey: r.email_key,
    sentAt: r.sent_at,
  }))
}

// ─── Global Nurture Funnel ───────────────────────────────────────────────────

export const NURTURE_EMAIL_KEYS = [
  'activation_d2', 'first_test_analysis', 'value_radar_d5', 'progress_d10',
  'wall_hit', 'urgency_d21', 'final_30d', 'hot_lead_5', 'hot_lead_10',
] as const

export const NURTURE_EMAIL_LABELS: Record<string, string> = {
  activation_d2: 'D+2 Activación',
  first_test_analysis: '1er test → Análisis IA',
  value_radar_d5: 'D+5 Radar Tribunal',
  progress_d10: 'D+10 Progreso',
  wall_hit: 'Wall hit (5 free)',
  urgency_d21: 'D+21 Urgencia',
  final_30d: '30 días pre-examen',
  hot_lead_5: 'Hot lead (5 temas)',
  hot_lead_10: 'Hot lead (10 temas)',
}

export interface NurtureFunnelRow {
  emailKey: string
  sent: number
  optedOut: number
  converted: number
  optOutEmails: string[]
  convertedEmails: string[]
}

export async function getNurtureFunnel(): Promise<NurtureFunnelRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Parallel: fetch all 3 independent datasets at once
  const [sentRes, optOutRes, purchasersRes] = await Promise.all([
    supabase.from('nurture_emails_sent').select('user_id, email_key, sent_at').order('sent_at', { ascending: true }),
    supabase.from('profiles').select('id, email, email_nurture_opt_out').eq('email_nurture_opt_out', true),
    supabase.from('compras').select('user_id, created_at').order('created_at', { ascending: true }),
  ])

  const sentRows = (sentRes.data ?? []) as Array<{ user_id: string; email_key: string; sent_at: string }>

  const optedOutMap = new Map(
    ((optOutRes.data ?? []) as Array<{ id: string; email: string }>).map(p => [p.id, p.email])
  )

  const purchaseMap = new Map<string, string>() // userId → first purchase date
  for (const p of (purchasersRes.data ?? []) as Array<{ user_id: string; created_at: string }>) {
    if (!purchaseMap.has(p.user_id)) purchaseMap.set(p.user_id, p.created_at)
  }

  // Dependent query: get emails for users who received nurture
  const nurtureUserIds = [...new Set(sentRows.map(r => r.user_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', nurtureUserIds.length > 0 ? nurtureUserIds : ['none'])

  const emailMap = new Map(
    ((profilesData ?? []) as Array<{ id: string; email: string }>).map(p => [p.id, p.email])
  )

  // Group by email_key
  const byKey = new Map<string, { userIds: Set<string>; lastSentPerUser: Map<string, string> }>()
  for (const r of sentRows) {
    if (!byKey.has(r.email_key)) byKey.set(r.email_key, { userIds: new Set(), lastSentPerUser: new Map() })
    const entry = byKey.get(r.email_key)!
    entry.userIds.add(r.user_id)
    entry.lastSentPerUser.set(r.user_id, r.sent_at)
  }

  // For each email_key, find the LAST nurture email sent to each user before they opted out or purchased
  // A user "opted out on email X" = X was the last nurture they received before opting out
  // A user "converted after email X" = X was the last nurture they received before purchasing

  // Build per-user: ordered list of nurture emails received
  const userNurtureOrder = new Map<string, Array<{ key: string; sentAt: string }>>()
  for (const r of sentRows) {
    if (!userNurtureOrder.has(r.user_id)) userNurtureOrder.set(r.user_id, [])
    userNurtureOrder.get(r.user_id)!.push({ key: r.email_key, sentAt: r.sent_at })
  }

  // For opted-out users: last email before opt-out
  const optOutOnEmail = new Map<string, string[]>() // emailKey → emails[]
  for (const [userId] of optedOutMap) {
    const nurtures = userNurtureOrder.get(userId)
    if (nurtures && nurtures.length > 0) {
      const lastKey = nurtures[nurtures.length - 1].key
      if (!optOutOnEmail.has(lastKey)) optOutOnEmail.set(lastKey, [])
      optOutOnEmail.get(lastKey)!.push(emailMap.get(userId) ?? userId)
    }
  }

  // For converted users: last nurture email before first purchase
  const convertedOnEmail = new Map<string, string[]>() // emailKey → emails[]
  for (const [userId, purchaseDate] of purchaseMap) {
    const nurtures = userNurtureOrder.get(userId)
    if (nurtures && nurtures.length > 0) {
      // Last nurture sent BEFORE purchase
      const before = nurtures.filter(n => n.sentAt < purchaseDate)
      if (before.length > 0) {
        const lastKey = before[before.length - 1].key
        if (!convertedOnEmail.has(lastKey)) convertedOnEmail.set(lastKey, [])
        convertedOnEmail.get(lastKey)!.push(emailMap.get(userId) ?? userId)
      }
    }
  }

  // Build funnel rows
  const EMAIL_ORDER = NURTURE_EMAIL_KEYS

  const result: NurtureFunnelRow[] = []
  for (const key of EMAIL_ORDER) {
    const entry = byKey.get(key)
    result.push({
      emailKey: key,
      sent: entry?.userIds.size ?? 0,
      optedOut: optOutOnEmail.get(key)?.length ?? 0,
      converted: convertedOnEmail.get(key)?.length ?? 0,
      optOutEmails: optOutOnEmail.get(key) ?? [],
      convertedEmails: convertedOnEmail.get(key) ?? [],
    })
  }

  // Add any keys not in the predefined order
  for (const [key, entry] of byKey) {
    if (!(EMAIL_ORDER as readonly string[]).includes(key)) {
      result.push({
        emailKey: key,
        sent: entry.userIds.size,
        optedOut: optOutOnEmail.get(key)?.length ?? 0,
        converted: convertedOnEmail.get(key)?.length ?? 0,
        optOutEmails: optOutOnEmail.get(key) ?? [],
        convertedEmails: convertedOnEmail.get(key) ?? [],
      })
    }
  }

  return result
}

// ─── Waitlist ────────────────────────────────────────────────────────────────

export interface WaitlistEntry {
  email: string
  oposicionSlug: string
  createdAt: string
  notifiedAt: string | null
}

export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const { data } = await supabase
    .from('waitlist')
    .select('email, oposicion_slug, created_at, notified_at')
    .order('created_at', { ascending: false })

  return ((data ?? []) as Array<{ email: string; oposicion_slug: string; created_at: string; notified_at: string | null }>)
    .map(r => ({ email: r.email, oposicionSlug: r.oposicion_slug, createdAt: r.created_at, notifiedAt: r.notified_at }))
}
