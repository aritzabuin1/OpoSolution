import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendNurtureEmail } from '@/lib/email/client'
import {
  renderHotLead5,
  renderHotLead10,
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

/**
 * POST /api/admin/send-nurture
 *
 * Send a specific nurture email to a specific user. Admin-only.
 * Body: { userId: string, emailKey: string }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin('admin/send-nurture')
  if (!auth.authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.userId || !body?.emailKey) {
    return NextResponse.json({ error: 'userId y emailKey requeridos' }, { status: 400 })
  }

  const { userId, emailKey } = body as { userId: string; emailKey: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Get oposicion info
  const { data: opo } = profile.oposicion_id
    ? await supabase.from('oposiciones').select('nombre, slug').eq('id', profile.oposicion_id).single()
    : { data: null }

  // Get user stats for template
  const { data: tests } = await supabase
    .from('tests_generados')
    .select('tema_id, puntuacion')
    .eq('user_id', userId)
    .eq('completado', true)

  const testsArr = (tests ?? []) as Array<{ tema_id: string | null; puntuacion: number | null }>
  const temas = new Set(testsArr.filter(t => t.tema_id).map(t => t.tema_id!))
  const scores = testsArr.map(t => t.puntuacion).filter((s): s is number => s !== null)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const { count: totalTemas } = profile.oposicion_id
    ? await supabase.from('temas').select('id', { count: 'exact', head: true }).eq('oposicion_id', profile.oposicion_id)
    : { count: 0 }

  const nombre = profile.full_name as string | null
  const oposicionNombre = (opo?.nombre as string) ?? 'tu oposición'
  const oposicionSlug = (opo?.slug as string) ?? null

  // Render the email
  let subject: string
  let html: string

  switch (emailKey) {
    case 'hot_lead_5': {
      const body = renderHotLead5({
        nombre, oposicionNombre,
        temasExplored: temas.size,
        avgScore,
        totalTemas: totalTemas ?? 0,
      })
      subject = nombre
        ? `${nombre}, ${temas.size} temas explorados — ¿has probado el análisis IA?`
        : `${temas.size} temas explorados — ¿has probado el análisis IA?`
      html = wrapNurtureTemplate(body, { userId })
      break
    }
    case 'hot_lead_10': {
      const body = renderHotLead10({
        nombre, oposicionNombre, oposicionSlug,
        temasExplored: temas.size,
        avgScore,
        totalTemas: totalTemas ?? 0,
      })
      subject = nombre
        ? `${nombre}, ya conoces OpoRuta — es hora de ir a por todas`
        : 'Ya conoces OpoRuta — es hora de ir a por todas'
      html = wrapNurtureTemplate(body, { userId })
      break
    }
    default:
      return NextResponse.json({ error: `emailKey no soportado: ${emailKey}` }, { status: 400 })
  }

  // Send
  try {
    const result = await sendNurtureEmail({
      to: profile.email as string,
      subject,
      html,
      userId,
      emailKey,
    })

    logger.info({ userId, emailKey, email: profile.email }, '[admin/send-nurture] email sent')
    return NextResponse.json({ ok: true, email: profile.email, emailKey, resendId: result })
  } catch (err) {
    logger.error({ err, userId, emailKey }, '[admin/send-nurture] send failed')
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 })
  }
}
