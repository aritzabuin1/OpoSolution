/**
 * lib/email/nurture-templates.ts
 *
 * HTML templates for the nurture email sequence.
 * All templates use inline CSS for maximum email client compatibility.
 * Brand: navy #1B4F72, gold #F39C12, body #f4f4f5, cards white, system-ui font.
 */

import { createHmac } from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// ─── Unsubscribe token ──────────────────────────────────────────────────────

export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.CRON_SECRET ?? 'dev-secret'
  return createHmac('sha256', secret).update(userId).digest('hex')
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId)
  return token === expected
}

// ─── Shared wrapper ─────────────────────────────────────────────────────────

interface WrapOptions {
  urgencyBanner?: string  // e.g. "Quedan 45 días para el examen"
  userId: string
}

export function wrapNurtureTemplate(body: string, options: WrapOptions): string {
  const unsubToken = generateUnsubscribeToken(options.userId)
  const unsubUrl = `${APP_URL}/api/email/unsubscribe?uid=${options.userId}&token=${unsubToken}`
  const urgencyHtml = options.urgencyBanner
    ? `<tr><td style="background:#F39C12;padding:12px 40px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#ffffff;font-weight:700;">${options.urgencyBanner}</p>
       </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OpoRuta</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#1B4F72;padding:24px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">OpoRuta</span>
            <p style="color:#A9CCE3;margin:4px 0 0;font-size:13px;">El camino más corto hacia el aprobado</p>
          </td>
        </tr>
        ${urgencyHtml}
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px 24px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5;">
              OpoRuta · Madrid<br/>
              <a href="${APP_URL}/legal/privacidad" style="color:#6b7280;">Privacidad</a> ·
              <a href="${APP_URL}/cuenta" style="color:#6b7280;">Mi cuenta</a><br/>
              <a href="${unsubUrl}" style="color:#9ca3af;font-size:11px;">Dejar de recibir estos emails</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(nombre: string | null): string {
  return nombre ? `Hola ${nombre},` : 'Hola,'
}

function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
  <tr><td align="center">
    <a href="${APP_URL}${href}" style="display:inline-block;padding:14px 32px;background:#1B4F72;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;">
      ${text}
    </a>
  </td></tr>
</table>`
}

function dataCard(content: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
  <tr><td style="padding:16px;background:#EFF6FF;border-radius:8px;border:1px solid #DBEAFE;">
    ${content}
  </td></tr>
</table>`
}

function precio(oposicionSlug: string | null): string {
  return oposicionSlug === 'gestion-estado' ? '69,99€' : '49,99€'
}

// ─── Email 1: Activation D+2 ────────────────────────────────────────────────

export function renderActivationD2(data: {
  nombre: string | null
  oposicionNombre: string
}): string {
  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Te registraste en OpoRuta para preparar <strong>${data.oposicionNombre}</strong>, pero
  aún no has hecho tu primer test.
</p>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  Tu primer test tarda <strong>3 minutos</strong>. Son 10 preguntas con citas legales verificadas
  contra la legislación oficial — sin artículos inventados.
</p>
${dataCard(`
  <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">Tus 3 temas de prueba:</p>
  <p style="margin:6px 0 0;font-size:13px;color:#3b82f6;line-height:1.6;">
    ✓ Constitución Española<br/>
    ✓ Ley 39/2015 (LPAC)<br/>
    ✓ Ofimática (Word)
  </p>
`)}
<p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
  Tienes 5 tests gratuitos. Úsalos para ver si OpoRuta te encaja.
</p>
${ctaButton('Hacer mi primer test →', '/dashboard')}`
}

// ─── Email 2: Value — Radar D+5 ────────────────────────────────────────────

export function renderValueRadarD5(data: {
  nombre: string | null
  oposicionNombre: string
  topArticulos: Array<{ articulo: string; ley: string; frecuencia: number }>
}): string {
  const articulosHtml = data.topArticulos.length > 0
    ? data.topArticulos.map((a, i) =>
        `<tr>
          <td style="padding:6px 0;font-size:13px;color:#374151;border-bottom:1px solid #E5E7EB;">
            <strong>${i + 1}.</strong> Art. ${a.articulo} ${a.ley}
          </td>
          <td style="padding:6px 0;font-size:13px;color:#1e40af;text-align:right;border-bottom:1px solid #E5E7EB;font-weight:600;">
            ${a.frecuencia} convocatorias
          </td>
        </tr>`
      ).join('')
    : `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">
        Datos del Radar disponibles en la app.
      </td></tr>`

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  ¿Sabes qué artículos pregunta más el tribunal INAP en <strong>${data.oposicionNombre}</strong>?
  Hemos analizado los exámenes de 2018 a 2024 y estos son los que más se repiten:
</p>
${dataCard(`
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding:0 0 8px;font-size:14px;color:#1e40af;font-weight:700;">Artículo</td>
      <td style="padding:0 0 8px;font-size:14px;color:#1e40af;font-weight:700;text-align:right;">Apariciones</td>
    </tr>
    ${articulosHtml}
  </table>
`)}
<p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
  El <strong>Radar del Tribunal</strong> completo tiene cientos de artículos ordenados por frecuencia.
  Estudia lo que el tribunal pregunta de verdad.
</p>
${ctaButton('Ver el Radar completo →', '/radar')}`
}

// ─── Email 3: Progress D+10 ────────────────────────────────────────────────

export function renderProgressD10(data: {
  nombre: string | null
  oposicionNombre: string
  testsCompleted: number
  avgScore: number | null
  freeLimit: number
  oposicionSlug: string | null
}): string {
  const pct = Math.min(100, Math.round((data.testsCompleted / data.freeLimit) * 100))
  const scoreText = data.avgScore !== null
    ? `Tu nota media: <strong>${Math.round(data.avgScore)}/100</strong>`
    : 'Completa más tests para ver tu nota media'
  const remaining = Math.max(0, data.freeLimit - data.testsCompleted)
  const ctaText = remaining > 0 ? 'Seguir practicando →' : `Desbloquear todo por ${precio(data.oposicionSlug)} →`
  const ctaHref = remaining > 0 ? '/dashboard' : '/#precios'

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Llevas <strong>${data.testsCompleted} de ${data.freeLimit} tests gratuitos</strong> en ${data.oposicionNombre}.
</p>
${dataCard(`
  <!-- Progress bar -->
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
    <tr>
      <td style="background:#DBEAFE;border-radius:4px;height:12px;">
        <div style="background:#1B4F72;border-radius:4px;height:12px;width:${pct}%;"></div>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 4px;font-size:14px;color:#1e40af;font-weight:600;">${data.testsCompleted}/${data.freeLimit} tests completados</p>
  <p style="margin:0;font-size:13px;color:#3b82f6;">${scoreText}</p>
`)}
<p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
  ${remaining > 0
    ? `Te quedan <strong>${remaining} tests gratuitos</strong>. Cada test te acerca más al aprobado.`
    : `Has agotado tus tests gratuitos. Desbloquea acceso completo a los ${data.oposicionSlug === 'gestion-estado' ? '58' : data.oposicionSlug === 'administrativo-estado' ? '45' : '28'} temas.`
  }
</p>
${ctaButton(ctaText, ctaHref)}`
}

// ─── Email 4: Wall Hit ──────────────────────────────────────────────────────

export function renderWallHit(data: {
  nombre: string | null
  oposicionNombre: string
  testsCompleted: number
  avgScore: number | null
  daysUntilExam: number
  oposicionSlug: string | null
}): string {
  const pricePerDay = data.daysUntilExam > 0
    ? (parseFloat(precio(data.oposicionSlug).replace('€', '').replace(',', '.')) / data.daysUntilExam).toFixed(2)
    : '0.82'
  const scoreText = data.avgScore !== null
    ? `<strong>${Math.round(data.avgScore)}/100</strong> de nota media`
    : ''

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Has completado tus <strong>5 tests gratuitos</strong> de ${data.oposicionNombre}.
  ${scoreText ? `Tu resultado: ${scoreText}.` : ''}
</p>
${dataCard(`
  <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:600;">Lo que desbloqueas con el Pack:</p>
  <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.8;">
    ✓ Tests ilimitados en todos los temas<br/>
    ✓ Simulacros completos (100 preguntas)<br/>
    ✓ Radar del Tribunal completo<br/>
    ✓ Flashcards con repetición espaciada<br/>
    ✓ Caza-Trampas para detectar errores comunes<br/>
    ✓ 20 análisis detallados con IA
  </p>
`)}
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  <strong>${precio(data.oposicionSlug)} de pago único</strong> — sin suscripción, sin renovaciones.
  Son <strong>${pricePerDay}€ al día</strong> hasta el examen.
</p>
<p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
  Una academia presencial cuesta 150-300€ al mes. OpoRuta: un solo pago y acceso para siempre.
</p>
${ctaButton(`Desbloquear por ${precio(data.oposicionSlug)} →`, '/#precios')}`
}

// ─── Email 5: Urgency D+21 ─────────────────────────────────────────────────

export function renderUrgencyD21(data: {
  nombre: string | null
  oposicionNombre: string
  daysUntilExam: number
  oposicionSlug: string | null
}): string {
  const numTemas = data.oposicionSlug === 'gestion-estado' ? 58
    : data.oposicionSlug === 'administrativo-estado' ? 45 : 28
  const temasPerWeek = data.daysUntilExam > 0
    ? Math.ceil(numTemas / (data.daysUntilExam / 7))
    : numTemas

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Quedan <strong>${data.daysUntilExam} días</strong> para el examen de ${data.oposicionNombre}.
</p>
${dataCard(`
  <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:700;">Tu plan de estudio:</p>
  <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.8;">
    📚 ${numTemas} temas × ${temasPerWeek} temas/semana<br/>
    📝 1 test diario (10 preguntas, 3 min)<br/>
    🎯 1 simulacro semanal (condiciones reales)
  </p>
`)}
<p style="margin:0 0 0;font-size:15px;color:#374151;line-height:1.6;">
  Cada día que pasa sin practicar es un día que tus competidores pueden estar aprovechando.
  Con OpoRuta practicas con preguntas verificadas contra la legislación oficial.
</p>
${ctaButton(`Empezar mi plan por ${precio(data.oposicionSlug)} →`, '/#precios')}`
}

// ─── Email 6: Final 30 days ─────────────────────────────────────────────────

export function renderFinal30d(data: {
  nombre: string | null
  oposicionNombre: string
  daysUntilExam: number
  oposicionSlug: string | null
}): string {
  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  En <strong>${data.daysUntilExam} días</strong> te sentarás en la sala de examen de ${data.oposicionNombre}.
  La pregunta es si habrás practicado con cientos de preguntas o irás sin preparar.
</p>
${dataCard(`
  <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:700;">30 días × 10 preguntas/día =</p>
  <p style="margin:0;font-size:24px;color:#1B4F72;font-weight:700;">300+ preguntas practicadas</p>
  <p style="margin:4px 0 0;font-size:13px;color:#3b82f6;">Con citas legales verificadas y explicaciones detalladas</p>
`)}
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  <strong>${precio(data.oposicionSlug)} de pago único.</strong> Sin suscripción.
  No esperar un año más a la siguiente convocatoria.
</p>
${ctaButton(`Empezar hoy →`, '/#precios')}`
}
