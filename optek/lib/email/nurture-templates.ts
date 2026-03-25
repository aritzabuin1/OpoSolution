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

// ─── Email NEW: First Test Analysis (behavior-triggered) ────────────────────

export function renderFirstTestAnalysis(data: {
  nombre: string | null
  oposicionNombre: string
  firstTestTema: string
  firstTestScore: number  // 0-100 from BD
  oposicionSlug: string | null
}): string {
  const nota = Math.round(data.firstTestScore / 10)
  const falladas = 10 - nota
  const aprobado = nota >= 7

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  ${aprobado
    ? `Has sacado un <strong>${nota}/10</strong> en <strong>${data.firstTestTema}</strong>. Buen comienzo.`
    : `Has sacado un <strong>${nota}/10</strong> en <strong>${data.firstTestTema}</strong>. Has fallado <strong>${falladas} preguntas</strong>.`
  }
</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  ¿Sabes por qué has fallado cada pregunta? OpoRuta tiene un <strong>análisis con IA</strong>
  que te lo explica paso a paso. Así funciona:
</p>
${dataCard(`
  <p style="margin:0 0 12px;font-size:14px;color:#1e40af;font-weight:700;">Ejemplo de análisis:</p>
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:8px 0;border-bottom:1px solid #DBEAFE;">
      <p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">
        "¿Ante quién se interpone el recurso de alzada?"
      </p>
      <p style="margin:4px 0 0;font-size:12px;color:#dc2626;">❌ Tu respuesta: Ante el mismo órgano</p>
    </td></tr>
    <tr><td style="padding:10px 0 6px;">
      <p style="margin:0 0 6px;font-size:13px;color:#374151;">
        <strong>💭 Paso 1:</strong> Es habitual confundir el recurso de alzada con el de reposición...
      </p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151;">
        <strong>🔍 Paso 2:</strong> ¿Qué diferencia hay entre "subir" al superior y "quedarse" en el mismo órgano?
      </p>
      <p style="margin:0 0 6px;font-size:13px;color:#374151;">
        <strong>✅ Paso 3:</strong> El recurso de alzada se interpone ante el <strong>superior jerárquico</strong>
        (Art. 121 LPAC). El de reposición, ante el mismo órgano (Art. 123 LPAC).
      </p>
      <p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">
        💡 <strong>Recuerda:</strong> Alzada = sube. Reposición = se queda.
      </p>
    </td></tr>
  </table>
`)}
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  <strong>Tienes 2 análisis gratuitos.</strong> Úsalos para entender por qué fallas y no repetir los mismos errores.
</p>
<p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
  Cuando completes un test, pulsa "¿Por qué he fallado?" en la página de resultados.
</p>
${ctaButton('Hacer otro test y analizar errores →', '/tests')}`
}

// ─── Email 1: Activation D+2 ────────────────────────────────────────────────

export function renderActivationD2(data: {
  nombre: string | null
  oposicionNombre: string
  totalTemas: number
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
  <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">Tienes acceso a los ${data.totalTemas} temas de tu oposición:</p>
  <p style="margin:6px 0 0;font-size:13px;color:#3b82f6;line-height:1.6;">
    ✓ 1 test gratuito en cada tema<br/>
    ✓ 10 preguntas por test<br/>
    ✓ Descubre tus puntos débiles en todos los temas
  </p>
`)}
<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
  Cuando falles preguntas, la <strong>IA te explica por qué</strong> paso a paso:
</p>
${dataCard(`
  <p style="margin:0 0 4px;font-size:13px;color:#374151;">💭 Te explica por qué es fácil confundirse</p>
  <p style="margin:0 0 4px;font-size:13px;color:#374151;">🔍 Te guía con preguntas para que razones</p>
  <p style="margin:0 0 4px;font-size:13px;color:#374151;">✅ Te revela la respuesta con la cita legal exacta</p>
  <p style="margin:0;font-size:13px;color:#1e40af;font-weight:600;">💡 Te da un truco para no olvidarlo</p>
`)}
<p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
  Tienes 2 análisis con IA gratuitos. Haz tu primer test para usarlos.
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
  totalTemas: number
  oposicionSlug: string | null
}): string {
  const pct = data.totalTemas > 0 ? Math.min(100, Math.round((data.testsCompleted / data.totalTemas) * 100)) : 0
  const nota = data.avgScore !== null ? Math.round(data.avgScore / 10) : null
  const scoreText = nota !== null
    ? `Tu nota media: <strong>${nota}/10</strong>`
    : 'Completa más tests para ver tu nota media'
  const remaining = Math.max(0, data.totalTemas - data.testsCompleted)

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Has explorado <strong>${data.testsCompleted} de ${data.totalTemas} temas</strong> de ${data.oposicionNombre}.
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
  <p style="margin:0 0 4px;font-size:14px;color:#1e40af;font-weight:600;">${data.testsCompleted}/${data.totalTemas} temas explorados</p>
  <p style="margin:0;font-size:13px;color:#3b82f6;">${scoreText}</p>
`)}
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
  ${remaining > 0
    ? `Te quedan <strong>${remaining} temas por explorar</strong>. Descubre en cuáles necesitas más práctica.`
    : `Has explorado todos los temas. ¿Quieres mejorar en los que más fallas?`
  }
</p>
<p style="margin:0 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
  ¿Sabías que la IA de OpoRuta te explica paso a paso por qué fallas cada pregunta? Tienes 2 análisis gratuitos.
</p>
${ctaButton(remaining > 0 ? 'Seguir explorando temas →' : `Desbloquear tests ilimitados por ${precio(data.oposicionSlug)} →`, remaining > 0 ? '/tests' : '/#precios')}`
}

// ─── Email 4: Wall Hit ──────────────────────────────────────────────────────

export function renderWallHit(data: {
  nombre: string | null
  oposicionNombre: string
  testsCompleted: number
  avgScore: number | null
  totalTemas: number
  daysUntilExam: number
  oposicionSlug: string | null
}): string {
  const pricePerDay = data.daysUntilExam > 0
    ? (parseFloat(precio(data.oposicionSlug).replace('€', '').replace(',', '.')) / data.daysUntilExam).toFixed(2)
    : '0.82'
  const nota = data.avgScore !== null ? Math.round(data.avgScore / 10) : null
  const scoreText = nota !== null ? `<strong>${nota}/10</strong> de nota media` : ''

  return `
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
  ${greeting(data.nombre)}
</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
  Has explorado <strong>${data.testsCompleted} de ${data.totalTemas} temas</strong> de ${data.oposicionNombre}.
  ${scoreText ? `Tu resultado: ${scoreText}.` : ''}
  Ya conoces tus puntos débiles — ahora necesitas practicar para mejorarlos.
</p>
${dataCard(`
  <p style="margin:0 0 8px;font-size:14px;color:#1e40af;font-weight:600;">Lo que desbloqueas con el Pack:</p>
  <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.8;">
    ✓ Tests ilimitados en todos los temas (repite hasta dominarlos)<br/>
    ✓ Elige dificultad y nº de preguntas (10, 20 o 30)<br/>
    ✓ Simulacros completos (100 preguntas)<br/>
    ✓ Radar del Tribunal completo<br/>
    ✓ Flashcards con repetición espaciada<br/>
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

// ─── Hot Lead 5 temas — show analysis value ─────────────────────────────────

export function renderHotLead5(data: {
  nombre: string | null
  oposicionNombre: string
  temasExplored: number
  avgScore: number | null
  totalTemas: number
}): string {
  const saludo = data.nombre ? `${data.nombre}, ` : ''
  const nota = data.avgScore !== null ? Math.round(data.avgScore) : null
  const notaText = nota !== null
    ? nota >= 70
      ? `Tu nota media es <strong>${nota}%</strong> — vas bien encaminado.`
      : `Tu nota media es <strong>${nota}%</strong> — hay margen de mejora.`
    : ''

  return `
<p style="font-size:16px;color:#1f2937;line-height:1.6;">
  ${saludo}ya has explorado <strong>${data.temasExplored} temas</strong> de ${data.oposicionNombre}. ${notaText}
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
  ¿Sabes que puedes <strong>analizar cada error con IA</strong>? Cuando fallas una pregunta,
  la IA te explica paso a paso por qué — primero te ayuda a razonar, luego te revela
  la respuesta con la cita legal exacta.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
  Tienes <strong>2 análisis gratuitos</strong>. Haz un test, falla alguna pregunta, y prueba el análisis.
  Verás la diferencia entre estudiar solo y estudiar con un tutor que sabe la ley de memoria.
</p>
${ctaButton('Hacer un test y probar el análisis IA →', '/tests')}
<p style="font-size:13px;color:#6b7280;margin-top:16px;">
  Te quedan ${data.totalTemas - data.temasExplored} temas gratis por explorar.
</p>`
}

// ─── Hot Lead 10+ temas — urgency, push to buy ──────────────────────────────

export function renderHotLead10(data: {
  nombre: string | null
  oposicionNombre: string
  oposicionSlug: string | null
  temasExplored: number
  avgScore: number | null
  totalTemas: number
}): string {
  const saludo = data.nombre ? `${data.nombre}, ` : ''
  const pct = Math.round((data.temasExplored / data.totalTemas) * 100)
  const nota = data.avgScore !== null ? Math.round(data.avgScore) : null

  return `
<p style="font-size:16px;color:#1f2937;line-height:1.6;">
  ${saludo}has explorado <strong>${data.temasExplored} de ${data.totalTemas} temas</strong> (${pct}%).
  ${nota !== null ? `Tu nota media: <strong>${nota}%</strong>.` : ''}
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
  Ya conoces la herramienta. Sabes que funciona. Pero con 1 test por tema, no puedes
  <strong>repetir los temas que peor llevas</strong> ni elegir la dificultad.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;">
  Con el Pack Oposición desbloqueas:
</p>
<ul style="font-size:14px;color:#374151;line-height:1.8;padding-left:20px;">
  <li><strong>Tests ilimitados</strong> — repite cualquier tema las veces que quieras</li>
  <li><strong>Elige dificultad</strong> — fácil, media, difícil o progresivo</li>
  <li><strong>20 análisis detallados con IA</strong> — cada error explicado con la ley exacta</li>
  <li><strong>Simulacros oficiales INAP</strong> — con penalización real</li>
</ul>
<p style="font-size:15px;color:#374151;line-height:1.6;">
  <strong>${precio(data.oposicionSlug)} · Pago único · Sin suscripción.</strong>
</p>
${ctaButton(`Desbloquear tests ilimitados — ${precio(data.oposicionSlug)} →`, '/cuenta')}`
}
