/**
 * execution/notify-waitlist.ts
 *
 * Envía emails a todos los usuarios de la waitlist para una oposición recién activada.
 * Marca cada registro como notificado (notified_at) para no enviar duplicados.
 *
 * Usage: pnpm notify-waitlist --slug correos
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const slugArg = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--slug') + 1]

  if (!slugArg) {
    console.error('Usage: pnpm notify-waitlist --slug <oposicion-slug>')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verify the oposición exists and IS active
  const { data: opo, error: opoErr } = await supabase
    .from('oposiciones')
    .select('nombre, slug, activa')
    .eq('slug', slugArg)
    .single()

  if (opoErr || !opo) {
    console.error(`Oposición "${slugArg}" no encontrada`)
    process.exit(1)
  }

  if (!opo.activa) {
    console.error(`Oposición "${slugArg}" no está activa todavía. Actívala primero.`)
    process.exit(1)
  }

  // Fetch all non-notified waitlist entries
  const { data: entries, error: fetchErr } = await supabase
    .from('waitlist')
    .select('id, email')
    .eq('oposicion_slug', slugArg)
    .is('notified_at', null)

  if (fetchErr) {
    console.error('Error fetching waitlist:', fetchErr.message)
    process.exit(1)
  }

  if (!entries || entries.length === 0) {
    console.log(`No hay usuarios pendientes de notificar para "${slugArg}"`)
    return
  }

  console.log(`Enviando ${entries.length} emails para "${opo.nombre}"...`)

  // Dynamic import to use the email client (needs Next.js env)
  const { sendWaitlistActivation } = await import('../lib/email/client')

  let sent = 0
  let failed = 0

  for (const entry of entries) {
    const result = await sendWaitlistActivation({
      to: entry.email,
      oposicionNombre: opo.nombre,
      oposicionSlug: opo.slug,
    })

    if (result.success) {
      // Mark as notified
      await supabase
        .from('waitlist')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', entry.id)
      sent++
    } else {
      console.warn(`Failed to send to ${entry.email}: ${result.error}`)
      failed++
    }

    // Rate limit: 2 emails/second (Resend free tier)
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
