/**
 * execution/update-email-templates.ts
 *
 * Updates Supabase Auth email templates to use /auth/confirm with token_hash.
 * This ensures email links verify server-side and redirect to the correct page.
 *
 * Usage: npx tsx execution/update-email-templates.ts
 */

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_ffc357ccaa62c6b1dff0165226521f053cbba575'
const PROJECT = 'yaxfgdvnfirazrguiykz'

const BRAND_HEADER = `<div style="background:linear-gradient(135deg,#1B4F72,#154360);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;margin-bottom:12px;">
    <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-1px;">OR</span>
    <span style="display:inline-block;width:6px;height:6px;background:#F39C12;border-radius:50%;vertical-align:top;margin-left:1px;"></span>
  </div>
  <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:8px 0 4px;">OpoRuta</h1>
  {{SUBTITLE}}
</div>`

function header(subtitle?: string) {
  return BRAND_HEADER.replace(
    '{{SUBTITLE}}',
    subtitle ? `<p style="color:#A9CCE3;font-size:13px;margin:0;">${subtitle}</p>` : ''
  )
}

const FOOTER = `<div style="text-align:center;padding:24px 16px;">
  <p style="color:#9CA3AF;font-size:12px;margin:0;">{{FOOTER_TEXT}}</p>
  <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0;">OpoRuta &middot; oporuta.es</p>
</div>`

function footer(text: string) {
  return FOOTER.replace('{{FOOTER_TEXT}}', text)
}

function btn(href: string, label: string) {
  return `<div style="text-align:center;margin:24px 0;">
  <a href="${href}" style="display:inline-block;background:#F39C12;color:#1B4F72;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(243,156,18,0.3);">${label}</a>
</div>`
}

function expiry(text: string) {
  return `<div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin:16px 0 0;">
  <p style="color:#92400E;font-size:13px;margin:0;text-align:center;">${text}</p>
</div>`
}

function wrap(body: string) {
  return `<div style="background-color:#F3F4F6;padding:40px 16px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    ${body}
  </div>
</div>`
}

function card(content: string) {
  return `<div style="background:#FFFFFF;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  ${content}
</div>`
}

// --- Templates ---

const confirmation = wrap([
  header('El camino m\u00e1s corto hacia el aprobado'),
  card([
    '<h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Ya casi est\u00e1s dentro</h2>',
    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">Has dado el primer paso. Ahora confirma tu email para acceder a:</p>',
    '<ul style="color:#374151;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">',
    '  <li><strong>Tests con IA</strong> que citan el art\u00edculo exacto</li>',
    '  <li><strong>Radar del Tribunal</strong> \u2014 qu\u00e9 art\u00edculos caen de verdad</li>',
    '  <li><strong>Simulacros INAP</strong> con cron\u00f3metro y penalizaci\u00f3n real</li>',
    '  <li><strong>An\u00e1lisis de errores</strong> que te explica por qu\u00e9 fallaste</li>',
    '</ul>',
    btn('{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email', 'Confirmar mi cuenta'),
    expiry('Este enlace caduca en 24 horas'),
  ].join('\n')),
  footer('Si no creaste esta cuenta, ignora este email.'),
].join('\n'))

const recovery = wrap([
  header(),
  card([
    '<h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Restablece tu contrase\u00f1a</h2>',
    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Has solicitado cambiar tu contrase\u00f1a. Haz clic abajo para elegir una nueva y seguir entrenando.</p>',
    btn('{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery', 'Elegir nueva contrase\u00f1a'),
    expiry('Este enlace caduca en 1 hora'),
  ].join('\n')),
  footer('Si no solicitaste esto, ignora este email \u2014 tu cuenta sigue segura.'),
].join('\n'))

const magicLink = wrap([
  header(),
  card([
    '<h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Accede a tu cuenta</h2>',
    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">Haz clic abajo para entrar directamente. Sin contrase\u00f1a, sin complicaciones.</p>',
    btn('{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink', 'Entrar a OpoRuta'),
    expiry('Este enlace caduca en 10 minutos y solo se puede usar una vez'),
  ].join('\n')),
  footer('Si no solicitaste este enlace, ignora este email.'),
].join('\n'))

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
    const ok = (result[k] || '').includes('/auth/confirm?token_hash=')
    console.log(`  ${k}: ${ok ? 'OK' : 'FAILED'}`)
  }

  console.log('\nDone. Send a test recovery to verify.')
}

main()
