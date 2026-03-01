/**
 * tests/unit/sanitize.test.ts — OPTEK §1.8.5
 *
 * Tests unitarios para sanitizeUserText y sanitizeHtml.
 * Verifica que el PII español se redacta correctamente y que el texto jurídico
 * legítimo NO se toca.
 *
 * Patrones probados (ref: directives/OPTEK_security.md §1):
 *   - DNI / NIE
 *   - Teléfono español (6xx / 7xx / 8xx / 9xx)
 *   - Email
 *   - IBAN español
 *   - Tarjeta de crédito (16 dígitos)
 *   - Número de Seguridad Social
 *   - XSS (sanitizeHtml)
 *   - Texto jurídico legítimo → NO redactado
 */

import { describe, it, expect } from 'vitest'
import { sanitizeUserText, sanitizeHtml, sanitizeForAI } from '@/lib/utils/sanitize'

const REDACTED = '[PII_REDACTADO]'

// ─── sanitizeUserText: PII españoles ──────────────────────────────────────────

describe('sanitizeUserText — PII españoles', () => {
  // ── DNI ───────────────────────────────────────────────────────────────────

  it('redacta DNI estándar "12345678Z"', () => {
    expect(sanitizeUserText('Mi DNI es 12345678Z y quiero recurrir.')).toContain(REDACTED)
    expect(sanitizeUserText('Mi DNI es 12345678Z y quiero recurrir.')).not.toContain('12345678Z')
  })

  it('redacta DNI con letra final minúscula "12345678z"', () => {
    const result = sanitizeUserText('DNI: 12345678z')
    expect(result).toContain(REDACTED)
  })

  it('redacta NIE con X inicial "X1234567L"', () => {
    const result = sanitizeUserText('Mi NIE es X1234567L.')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('X1234567L')
  })

  it('redacta NIE con Y inicial "Y9876543W"', () => {
    expect(sanitizeUserText('NIE: Y9876543W')).toContain(REDACTED)
  })

  it('redacta NIE con Z inicial "Z0000000R"', () => {
    expect(sanitizeUserText('Z0000000R es mi NIE.')).toContain(REDACTED)
  })

  // ── Teléfonos ─────────────────────────────────────────────────────────────

  it('redacta móvil español "666 123 456"', () => {
    const result = sanitizeUserText('Llámame al 666 123 456 por favor.')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('666 123 456')
  })

  it('redacta móvil sin espacios "666123456"', () => {
    expect(sanitizeUserText('Tel: 666123456')).toContain(REDACTED)
  })

  it('redacta teléfono fijo "912 345 678"', () => {
    expect(sanitizeUserText('Teléfono: 912 345 678')).toContain(REDACTED)
  })

  it('redacta teléfono con guiones "666-123-456"', () => {
    expect(sanitizeUserText('666-123-456')).toContain(REDACTED)
  })

  // ── Emails ────────────────────────────────────────────────────────────────

  it('redacta email "juan@gmail.com"', () => {
    const result = sanitizeUserText('Escríbeme a juan@gmail.com para más info.')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('juan@gmail.com')
  })

  it('redacta email con subdominio "empleado@agencia.gob.es"', () => {
    expect(sanitizeUserText('empleado@agencia.gob.es')).toContain(REDACTED)
  })

  // ── IBAN ─────────────────────────────────────────────────────────────────

  it('redacta IBAN español "ES9121000418450200051332"', () => {
    const result = sanitizeUserText('IBAN ES9121000418450200051332 para el pago.')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('ES9121000418450200051332')
  })

  it('redacta IBAN con espacios "ES91 2100 0418 4502 0005 1332"', () => {
    const result = sanitizeUserText('Cuenta: ES91 2100 0418 4502 0005 1332')
    expect(result).toContain(REDACTED)
  })

  // ── Tarjeta de crédito ────────────────────────────────────────────────────

  it('redacta número de tarjeta "4111 1111 1111 1111"', () => {
    const result = sanitizeUserText('Pago con tarjeta 4111 1111 1111 1111.')
    expect(result).toContain(REDACTED)
  })

  it('redacta tarjeta sin espacios "4111111111111111"', () => {
    expect(sanitizeUserText('Tarjeta: 4111111111111111')).toContain(REDACTED)
  })

  // ── Número Seguridad Social ───────────────────────────────────────────────

  it('redacta número SS "28/12345678/90"', () => {
    const result = sanitizeUserText('Mi número de la SS es 28/12345678/90.')
    expect(result).toContain(REDACTED)
    expect(result).not.toContain('28/12345678/90')
  })

  // ── Múltiples PII en el mismo texto ──────────────────────────────────────

  it('redacta múltiples PII en el mismo texto', () => {
    const texto = 'DNI 12345678Z, teléfono 666 123 456, email test@test.com.'
    const result = sanitizeUserText(texto)
    expect(result).not.toContain('12345678Z')
    expect(result).not.toContain('666 123 456')
    expect(result).not.toContain('test@test.com')
    // Debe haber múltiples redacciones
    const matches = result.match(/\[PII_REDACTADO\]/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── sanitizeUserText: texto jurídico legítimo → NO redactado ─────────────────

describe('sanitizeUserText — texto jurídico NO debe redactarse', () => {
  it('NO redacta referencia legal "Art. 14 CE"', () => {
    const texto = 'Según el Art. 14 CE, todos son iguales ante la ley.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })

  it('NO redacta número de ley "Ley 39/2015"', () => {
    const texto = 'La Ley 39/2015 regula el procedimiento.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })

  it('NO redacta "Real Decreto 5/2015"', () => {
    const texto = 'El Real Decreto 5/2015 aprueba el TREBEP.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })

  it('NO redacta siglas "CE, LPAC, TREBEP"', () => {
    const texto = 'Los artículos de la CE, la LPAC y el TREBEP son fundamentales.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })

  it('NO redacta plazos legales "3 meses", "10 días"', () => {
    const texto = 'El plazo es de 3 meses según el art. 21 LPAC, o 10 días para el recurso.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })

  it('texto completamente limpio sale sin cambios', () => {
    const texto = 'El principio de legalidad establece que la Administración debe actuar conforme a derecho.'
    expect(sanitizeUserText(texto)).toBe(texto)
  })
})

// ─── sanitizeHtml: XSS ────────────────────────────────────────────────────────

describe('sanitizeHtml — prevención XSS', () => {
  it('elimina etiqueta script', () => {
    const result = sanitizeHtml("<script>alert('xss')</script>")
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('elimina atributo onerror en img', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">')
    expect(result).not.toContain('onerror')
  })

  it('elimina href javascript:', () => {
    const result = sanitizeHtml('<a href="javascript:void(0)">link</a>')
    expect(result).not.toContain('javascript:')
  })

  it('texto plano pasa sin cambios', () => {
    const texto = 'El artículo 14 de la Constitución establece la igualdad.'
    expect(sanitizeHtml(texto)).toBe(texto)
  })

  it('elimina etiquetas HTML pero conserva el texto interior', () => {
    const result = sanitizeHtml('<b>texto en negrita</b>')
    expect(result).toContain('texto en negrita')
    expect(result).not.toContain('<b>')
  })
})

// ─── sanitizeForAI: pipeline completo ─────────────────────────────────────────

describe('sanitizeForAI — pipeline HTML + PII', () => {
  it('aplica ambas sanitizaciones en cadena', () => {
    const input = '<b>Mi DNI es 12345678Z</b> y mi email es test@test.com'
    const result = sanitizeForAI(input)
    expect(result).not.toContain('<b>')
    expect(result).not.toContain('12345678Z')
    expect(result).not.toContain('test@test.com')
    expect(result).toContain(REDACTED)
  })
})
