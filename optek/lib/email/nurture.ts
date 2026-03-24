/**
 * lib/email/nurture.ts
 *
 * Email nurturing sequence processor.
 * Runs daily as piggyback on boe-watch cron (7AM UTC = 9AM Spain CEST).
 *
 * Sends personalized emails to free users based on their behavior:
 *   D+2:  Activation (ghost users)
 *   D+5:  Value — Radar del Tribunal data
 *   D+10: Progress report
 *   Wall: When free tests exhausted
 *   D+21: Urgency countdown
 *   30d:  Calendar-triggered final push
 *
 * Anti-spam: min 4 days between emails, max 6 total, never to paid users.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendNurtureEmail } from '@/lib/email/client'
import {
  renderActivationD2,
  renderFirstTestAnalysis,
  renderValueRadarD5,
  renderProgressD10,
  renderWallHit,
  renderUrgencyD21,
  renderFinal30d,
  wrapNurtureTemplate,
} from '@/lib/email/nurture-templates'
import { logger } from '@/lib/logger'

// ─── Constants ──────────────────────────────────────────────────────────────

const EXAM_DATE = new Date('2026-05-23T00:00:00+02:00')
const FREE_TEST_LIMIT = 5
const MIN_DAYS_BETWEEN_EMAILS = 4

// Email keys in priority order (highest first)
const EMAIL_KEYS = [
  'wall_hit',
  'final_30d',
  'first_test_analysis',
  'urgency_d21',
  'progress_d10',
  'value_radar_d5',
  'activation_d2',
] as const

type EmailKey = (typeof EMAIL_KEYS)[number]

// ─── Types ──────────────────────────────────────────────────────────────────

interface NurtureCandidate {
  id: string
  email: string
  full_name: string | null
  oposicion_id: string | null
  oposicion_nombre: string | null
  oposicion_slug: string | null
  created_at: string
  free_tests_used: number
  tests_completed: number
  avg_score: number | null
  last_test_at: string | null
  sent_keys: string[]  // already sent email keys
  // First test data (for first_test_analysis email)
  first_test_tema: string | null
  first_test_score: number | null
  // Tema counts (for new free tier model)
  total_temas: number
}

export interface NurtureResult {
  processed: number
  sent: number
  skipped_no_oposicion: number
  skipped_recent: number
  skipped_no_email_due: number
  emails: Array<{ userId: string; emailKey: string; resendId?: string }>
  errors: string[]
}

// ─── Main entry point ───────────────────────────────────────────────────────

export async function runNurtureEmails(): Promise<NurtureResult> {
  const log = logger.child({ module: 'nurture' })
  const result: NurtureResult = {
    processed: 0,
    sent: 0,
    skipped_no_oposicion: 0,
    skipped_recent: 0,
    skipped_no_email_due: 0,
    emails: [],
    errors: [],
  }

  try {
    const supabase = await createServiceClient()
    const now = new Date()
    const daysUntilExam = Math.max(0, Math.ceil((EXAM_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // ── Fetch all non-paying, opted-in users ──────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: candidates, error: fetchError } = await (supabase as any)
      .rpc('get_nurture_candidates', { min_days: MIN_DAYS_BETWEEN_EMAILS })

    // Fallback: if RPC doesn't exist yet, use direct query
    let users: NurtureCandidate[]
    if (fetchError || !candidates) {
      log.info('[nurture] RPC not available, using direct query')
      users = await fetchCandidatesDirect(supabase)
    } else {
      users = candidates as NurtureCandidate[]
    }

    result.processed = users.length

    for (const user of users) {
      // Skip users without oposición (can't personalize)
      if (!user.oposicion_id || !user.oposicion_nombre) {
        result.skipped_no_oposicion++
        continue
      }

      // Determine which email to send
      const emailKey = selectEmail(user, now, daysUntilExam)
      if (!emailKey) {
        result.skipped_no_email_due++
        continue
      }

      // Render and send
      try {
        const { subject, html } = await renderEmail(emailKey, user, daysUntilExam, supabase)
        const sendResult = await sendNurtureEmail({
          to: user.email,
          subject,
          html,
          userId: user.id,
          emailKey,
        })
        if (sendResult.success) {
          result.sent++
          result.emails.push({ userId: user.id, emailKey, resendId: sendResult.id })
        } else {
          result.errors.push(`${user.id}:${emailKey}: ${sendResult.error}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`${user.id}:${emailKey}: ${msg}`)
      }
    }

    log.info(result, '[nurture] completed')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error({ err }, '[nurture] fatal error')
    result.errors.push(`fatal: ${msg}`)
  }

  return result
}

// ─── Direct query fallback (until RPC is created) ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCandidatesDirect(supabase: any): Promise<NurtureCandidate[]> {
  const minDate = new Date(Date.now() - MIN_DAYS_BETWEEN_EMAILS * 24 * 60 * 60 * 1000).toISOString()

  // Get all non-paying, opted-in users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id, created_at, free_tests_used')
    .eq('email_nurture_opt_out', false)
    .not('email', 'is', null)

  if (!profiles || profiles.length === 0) return []

  // Filter out paid users
  const { data: paidUserIds } = await supabase
    .from('compras')
    .select('user_id')

  const paidSet = new Set((paidUserIds ?? []).map((r: { user_id: string }) => r.user_id))

  // Get sent nurture emails
  const { data: sentEmails } = await supabase
    .from('nurture_emails_sent')
    .select('user_id, email_key, sent_at')

  const sentMap = new Map<string, { keys: string[]; lastSent: string | null }>()
  for (const s of sentEmails ?? []) {
    const entry = sentMap.get(s.user_id) ?? { keys: [], lastSent: null }
    entry.keys.push(s.email_key)
    if (!entry.lastSent || s.sent_at > entry.lastSent) entry.lastSent = s.sent_at
    sentMap.set(s.user_id, entry)
  }

  // Get test stats per user (including first test data for analysis email)
  const { data: testStats } = await supabase
    .from('tests_generados')
    .select('user_id, completado, puntuacion, created_at, tema_id')

  interface UserStats {
    completed: number
    avgScore: number | null
    lastTest: string | null
    scores: number[]
    firstTestAt: string | null
    firstTestScore: number | null
    firstTestTemaId: string | null
  }
  const statsMap = new Map<string, UserStats>()
  for (const t of testStats ?? []) {
    const entry = statsMap.get(t.user_id) ?? {
      completed: 0, avgScore: null, lastTest: null, scores: [],
      firstTestAt: null, firstTestScore: null, firstTestTemaId: null,
    }
    if (t.completado) {
      entry.completed++
      if (t.puntuacion != null) entry.scores.push(t.puntuacion)
      // Track earliest completed test for first_test_analysis email
      if (!entry.firstTestAt || t.created_at < entry.firstTestAt) {
        entry.firstTestAt = t.created_at
        entry.firstTestScore = t.puntuacion
        entry.firstTestTemaId = t.tema_id
      }
    }
    if (!entry.lastTest || t.created_at > entry.lastTest) entry.lastTest = t.created_at
    statsMap.set(t.user_id, entry)
  }
  // Compute averages
  for (const [, entry] of statsMap) {
    entry.avgScore = entry.scores.length > 0
      ? entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
      : null
  }

  // Get oposición names + tema counts
  const { data: oposiciones } = await supabase
    .from('oposiciones')
    .select('id, nombre, slug')

  const opoMap = new Map<string, { nombre: string; slug: string }>()
  for (const o of oposiciones ?? []) opoMap.set(o.id, { nombre: o.nombre, slug: o.slug })

  // Count temas per oposición
  const { data: temas } = await supabase
    .from('temas')
    .select('id, oposicion_id, titulo')

  const temaCountMap = new Map<string, number>()
  const temaNameMap = new Map<string, string>()  // tema_id → titulo
  for (const t of (temas ?? []) as Array<{ id: string; oposicion_id: string; titulo: string }>) {
    temaCountMap.set(t.oposicion_id, (temaCountMap.get(t.oposicion_id) ?? 0) + 1)
    temaNameMap.set(t.id, t.titulo)
  }

  // Build candidates
  const candidates: NurtureCandidate[] = []
  for (const p of profiles) {
    if (paidSet.has(p.id)) continue

    const sent = sentMap.get(p.id)
    // Skip if sent email recently
    if (sent?.lastSent && sent.lastSent > minDate) continue

    const stats = statsMap.get(p.id)
    const opo = p.oposicion_id ? opoMap.get(p.oposicion_id) : null

    // Resolve first test tema name
    const firstTemaId = stats?.firstTestTemaId
    const firstTestTema = firstTemaId ? (temaNameMap.get(firstTemaId) ?? null) : null

    candidates.push({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      oposicion_id: p.oposicion_id,
      oposicion_nombre: opo?.nombre ?? null,
      oposicion_slug: opo?.slug ?? null,
      created_at: p.created_at,
      free_tests_used: p.free_tests_used ?? 0,
      tests_completed: stats?.completed ?? 0,
      avg_score: stats?.avgScore ?? null,
      last_test_at: stats?.lastTest ?? null,
      sent_keys: sent?.keys ?? [],
      first_test_tema: firstTestTema,
      first_test_score: stats?.firstTestScore ?? null,
      total_temas: p.oposicion_id ? (temaCountMap.get(p.oposicion_id) ?? 0) : 0,
    })
  }

  return candidates
}

// ─── Email selection logic ──────────────────────────────────────────────────

function selectEmail(
  user: NurtureCandidate,
  now: Date,
  daysUntilExam: number
): EmailKey | null {
  const daysSinceRegistration = Math.floor(
    (now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const alreadySent = new Set(user.sent_keys)

  // Priority order: wall_hit > final_30d > urgency > progress > value > activation
  // Each email is sent only once (UNIQUE constraint)

  // Email 4: Wall hit (triggered by behavior, not time)
  if (user.free_tests_used >= FREE_TEST_LIMIT && !alreadySent.has('wall_hit')) {
    return 'wall_hit'
  }

  // Email 6: Calendar — 30 days before exam (April 23 for May 23 exam)
  if (daysUntilExam <= 30 && daysUntilExam > 0 && !alreadySent.has('final_30d')) {
    return 'final_30d'
  }

  // Email NEW: First test analysis (behavior-triggered, high priority)
  // Sent the morning after first test — the pain is fresh
  if (
    user.tests_completed >= 1 &&
    user.first_test_score !== null &&
    daysSinceRegistration >= 1 &&
    !alreadySent.has('first_test_analysis')
  ) {
    return 'first_test_analysis'
  }

  // Email 5: Urgency D+21
  if (daysSinceRegistration >= 21 && !alreadySent.has('urgency_d21')) {
    return 'urgency_d21'
  }

  // Email 3: Progress D+12 (only if they've done at least 1 test)
  if (daysSinceRegistration >= 12 && user.tests_completed >= 1 && !alreadySent.has('progress_d10')) {
    return 'progress_d10'
  }

  // Email 2: Value (Radar) D+7
  if (daysSinceRegistration >= 7 && !alreadySent.has('value_radar_d5')) {
    return 'value_radar_d5'
  }

  // Email 1: Activation D+2 (only if 0 tests)
  if (daysSinceRegistration >= 2 && user.tests_completed === 0 && !alreadySent.has('activation_d2')) {
    return 'activation_d2'
  }

  return null // No email due
}

// ─── Email rendering ────────────────────────────────────────────────────────

async function renderEmail(
  key: EmailKey,
  user: NurtureCandidate,
  daysUntilExam: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ subject: string; html: string }> {
  const nombre = user.full_name
  const oposicionNombre = user.oposicion_nombre ?? 'tu oposición'
  const oposicionSlug = user.oposicion_slug

  switch (key) {
    case 'activation_d2': {
      const body = renderActivationD2({ nombre, oposicionNombre, totalTemas: user.total_temas })
      const subject = nombre
        ? `${nombre}, tu primer test de ${oposicionNombre} te espera`
        : `Tu primer test de ${oposicionNombre} te espera`
      return { subject, html: wrapNurtureTemplate(body, { userId: user.id }) }
    }

    case 'first_test_analysis': {
      const score = user.first_test_score ?? 0
      const tema = user.first_test_tema ?? oposicionNombre
      const nota = Math.round(score / 10)
      const body = renderFirstTestAnalysis({
        nombre,
        oposicionNombre,
        firstTestTema: tema,
        firstTestScore: score,
        oposicionSlug,
      })
      const subject = nombre
        ? `${nombre}, sacaste un ${nota}/10 en ${tema} — así te ayuda la IA`
        : `Sacaste un ${nota}/10 en ${tema} — así te ayuda la IA`
      return { subject, html: wrapNurtureTemplate(body, { userId: user.id }) }
    }

    case 'value_radar_d5': {
      // Fetch top articles from radar for this oposición
      let topArticulos: Array<{ articulo: string; ley: string; frecuencia: number }> = []
      try {
        const { data } = await supabase
          .from('frecuencias_articulos')
          .select('articulo, ley_nombre, frecuencia')
          .eq('oposicion_id', user.oposicion_id)
          .order('frecuencia', { ascending: false })
          .limit(5)
        if (data) {
          topArticulos = data.map((r: { articulo: string; ley_nombre: string; frecuencia: number }) => ({
            articulo: r.articulo,
            ley: r.ley_nombre,
            frecuencia: r.frecuencia,
          }))
        }
      } catch {
        // If table doesn't exist or no data, send without articles
      }
      const body = renderValueRadarD5({ nombre, oposicionNombre, topArticulos })
      return {
        subject: 'Los artículos que más repite el tribunal INAP',
        html: wrapNurtureTemplate(body, { userId: user.id }),
      }
    }

    case 'progress_d10': {
      const body = renderProgressD10({
        nombre,
        oposicionNombre,
        testsCompleted: user.tests_completed,
        avgScore: user.avg_score,
        totalTemas: user.total_temas,
        oposicionSlug,
      })
      return {
        subject: `Has explorado ${user.tests_completed} temas — así vas`,
        html: wrapNurtureTemplate(body, { userId: user.id }),
      }
    }

    case 'wall_hit': {
      const body = renderWallHit({
        nombre,
        oposicionNombre,
        testsCompleted: user.tests_completed,
        avgScore: user.avg_score,
        totalTemas: user.total_temas,
        daysUntilExam,
        oposicionSlug,
      })
      return {
        subject: nombre
          ? `${nombre}, ya conoces tus puntos débiles — es hora de mejorarlos`
          : 'Ya conoces tus puntos débiles — es hora de mejorarlos',
        html: wrapNurtureTemplate(body, { userId: user.id }),
      }
    }

    case 'urgency_d21': {
      const body = renderUrgencyD21({ nombre, oposicionNombre, daysUntilExam, oposicionSlug })
      return {
        subject: `Quedan ${daysUntilExam} días para tu examen`,
        html: wrapNurtureTemplate(body, {
          userId: user.id,
          urgencyBanner: `⏰ Quedan ${daysUntilExam} días para el examen`,
        }),
      }
    }

    case 'final_30d': {
      const body = renderFinal30d({ nombre, oposicionNombre, daysUntilExam, oposicionSlug })
      const price = oposicionSlug === 'gestion-estado' ? '69,99€' : '49,99€'
      return {
        subject: `30 días. ${price}. Tu plaza.`,
        html: wrapNurtureTemplate(body, {
          userId: user.id,
          urgencyBanner: `⏰ Faltan ${daysUntilExam} días para el 23 de mayo`,
        }),
      }
    }
  }
}

// ─── Preview mode (for admin) ───────────────────────────────────────────────

export async function previewNurtureEmail(emailKey: string): Promise<{ subject: string; html: string } | null> {
  const fakeUser: NurtureCandidate = {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'preview@oporuta.es',
    full_name: 'Aritz',
    oposicion_id: 'a0000000-0000-0000-0000-000000000001',
    oposicion_nombre: 'Auxiliar Administrativo del Estado',
    oposicion_slug: 'aux-admin-estado',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    free_tests_used: 3,
    tests_completed: 3,
    avg_score: 72,
    last_test_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sent_keys: [],
    first_test_tema: 'Ley 39/2015 (LPAC)',
    first_test_score: 50,
    total_temas: 28,
  }

  const daysUntilExam = Math.max(0, Math.ceil((EXAM_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  if (!EMAIL_KEYS.includes(emailKey as EmailKey)) return null

  // Use a mock supabase for radar data
  const mockSupabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              data: [
                { articulo: '14', ley_nombre: 'CE', frecuencia: 4 },
                { articulo: '21.1', ley_nombre: 'LPAC', frecuencia: 4 },
                { articulo: '53.1', ley_nombre: 'TREBEP', frecuencia: 3 },
                { articulo: '103', ley_nombre: 'CE', frecuencia: 3 },
                { articulo: '9.3', ley_nombre: 'CE', frecuencia: 3 },
              ],
            }),
          }),
        }),
      }),
    }),
  }

  return renderEmail(emailKey as EmailKey, fakeUser, daysUntilExam, mockSupabase)
}
