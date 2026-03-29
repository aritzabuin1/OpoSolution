/**
 * execution/update-email-templates.ts
 *
 * Updates Supabase Auth email templates to use /auth/confirm with token_hash.
 * Compact HTML to avoid Gmail clipping (>102KB gets collapsed).
 *
 * Usage: npx tsx execution/update-email-templates.ts
 */

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) throw new Error('SUPABASE_ACCESS_TOKEN env var is required')
const PROJECT = process.env.SUPABASE_PROJECT_REF ?? 'yaxfgdvnfirazrguiykz'

// Compact, single-table email layout that Gmail won't clip
function template(opts: { title: string; body: string; btnHref: string; btnLabel: string; expiry: string; footer: string }) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 8px;font-family:system-ui,sans-serif;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1B4F72;padding:24px;text-align:center;">
<span style="color:#fff;font-size:22px;font-weight:800;">OpoRuta</span>
</td></tr>
<tr><td style="padding:28px 24px;">
<h2 style="margin:0 0 12px;font-size:18px;color:#111;">${opts.title}</h2>
${opts.body}
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
<a href="${opts.btnHref}" style="display:inline-block;background:#F39C12;color:#1B4F72;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">${opts.btnLabel}</a>
</td></tr></table>
<p style="margin:0;font-size:12px;color:#92400E;text-align:center;background:#FEF3C7;padding:8px;border-radius:6px;">${opts.expiry}</p>
</td></tr>
<tr><td style="padding:16px 24px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
<p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">${opts.footer} · OpoRuta · oporuta.es</p>
</td></tr>
</table>
</td></tr></table>`
}

const confirmation = template({
  title: 'Ya casi est\u00e1s dentro',
  body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">Confirma tu email para acceder a tests con IA, simulacros INAP reales, radar del tribunal y an\u00e1lisis de errores.</p>`,
  btnHref: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email',
  btnLabel: 'Confirmar mi cuenta',
  expiry: 'Caduca en 24 horas',
  footer: 'Si no creaste esta cuenta, ignora este email',
})

const recovery = template({
  title: 'Restablece tu contrase\u00f1a',
  body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">Haz clic abajo para elegir una nueva contrase\u00f1a y seguir entrenando.</p>`,
  btnHref: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery',
  btnLabel: 'Elegir nueva contrase\u00f1a',
  expiry: 'Caduca en 1 hora',
  footer: 'Si no solicitaste esto, ignora este email',
})

const magicLink = template({
  title: 'Accede a tu cuenta',
  body: `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">Haz clic abajo para entrar directamente. Sin contrase\u00f1a, sin complicaciones.</p>`,
  btnHref: '{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink',
  btnLabel: 'Entrar a OpoRuta',
  expiry: 'Caduca en 10 minutos \u2014 un solo uso',
  footer: 'Si no solicitaste este enlace, ignora este email',
})

async function main() {
  const payload = {
    mailer_templates_confirmation_content: confirmation,
    mailer_templates_recovery_content: recovery,
    mailer_templates_magic_link_content: magicLink,
  }

  console.log('Updating Supabase email templates...')

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`FAILED (${res.status}):`, err)
    process.exit(1)
  }

  const result = await res.json()

  const keys = Object.keys(payload) as (keyof typeof payload)[]
  for (const k of keys) {
    const val = result[k] || ''
    const ok = val.includes('/auth/confirm?token_hash=')
    const size = Buffer.byteLength(val, 'utf8')
    console.log(`  ${k}: ${ok ? 'OK' : 'FAILED'} (${size} bytes)`)
  }

  console.log('\nDone.')
}

main()
