/**
 * Sanitización de entradas de usuario para OPTEK.
 *
 * GDPR: Anthropic NO tiene DPA compatible con GDPR (decisión 0.1.0).
 * Todo texto de usuario DEBE pasar por sanitizeUserText() antes de enviarse a Claude API.
 *
 * Ref: directives/OPTEK_security.md §1, §2
 */

import DOMPurify from 'isomorphic-dompurify'

// ─── Patrones PII España (ref: OPTEK_security.md §1) ─────────────────────────

/**
 * DNI — negative lookbehind para evitar falsos positivos con texto legal.
 * "Real Decreto 12345678A" no se redacta, "Mi DNI es 12345678A" sí.
 */
const DNI_REGEX =
  /(?<!Real Decreto |RD |Ley |Ley Orgánica |art\.\s|Art\.\s|núm\.\s)\b\d{8}[A-HJ-NP-TV-Z]\b/gi

const NIE_REGEX = /\b[XYZ]\d{7}[A-HJ-NP-TV-Z]\b/gi
const PHONE_REGEX = /\b[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const IBAN_REGEX = /\bES\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{2}[\s]?\d{10}\b/gi
const CREDIT_CARD_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
const SS_REGEX = /\b\d{2}\/\d{8}\/\d{2}\b/g

const PII_REPLACEMENT = '[PII_REDACTADO]'

// ─── Funciones públicas ───────────────────────────────────────────────────────

/**
 * Elimina HTML/JS malicioso del texto.
 * Usar: antes de guardar en BD y antes de renderizar contenido de usuario.
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script>') // → ''
 * sanitizeHtml('Texto <b>normal</b>') // → 'Texto normal'
 */
export function sanitizeHtml(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Elimina PII español del texto antes de enviarlo a Claude API.
 * Obligatorio por decisión GDPR 0.1.0: Anthropic sin DPA → sanitización agresiva.
 *
 * No detecta nombres/apellidos (demasiados falsos positivos con texto jurídico).
 * El campo full_name del perfil NUNCA se incluye en prompts.
 *
 * @example
 * sanitizeUserText('Mi DNI es 12345678Z') // → 'Mi DNI es [PII_REDACTADO]'
 * sanitizeUserText('Art. 14 de la Constitución') // → 'Art. 14 de la Constitución' (sin cambio)
 */
export function sanitizeUserText(text: string): string {
  return text
    .replace(DNI_REGEX, PII_REPLACEMENT)
    .replace(NIE_REGEX, PII_REPLACEMENT)
    .replace(PHONE_REGEX, PII_REPLACEMENT)
    .replace(EMAIL_REGEX, PII_REPLACEMENT)
    .replace(IBAN_REGEX, PII_REPLACEMENT)
    .replace(CREDIT_CARD_REGEX, PII_REPLACEMENT)
    .replace(SS_REGEX, PII_REPLACEMENT)
}

/**
 * Pipeline completo: sanitiza HTML + PII.
 * Usar en el corrector antes de enviar a Claude.
 */
export function sanitizeForAI(text: string): string {
  return sanitizeUserText(sanitizeHtml(text))
}
