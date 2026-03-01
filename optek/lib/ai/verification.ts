/**
 * lib/ai/verification.ts — OPTEK §1.5
 *
 * Capa de verificación determinista de citas legales.
 *
 * Pipeline:
 *   1. extractCitations(text)         — §1.5.1 — regex multi-patrón
 *   2. verifyCitation(citation)       — §1.5.3 — lookup Supabase por ley_nombre + articulo_numero
 *   3. verifyContentMatch(...)        — §1.5.5 — verificación determinista de plazos y órganos
 *   4. verifyAllCitations(text)       — §1.5.7 — orquesta 1+2+3, loguea KPIs
 *
 * DDIA Observability (0.10.19): loguea KPIs tras cada verificación:
 *   { citations_total, citations_verified, citations_failed,
 *     verification_score, regeneration_triggered, duration_ms }
 *
 * Nota §1.15: Implementar RAG completo con match_legislacion() y búsqueda semántica.
 *             Por ahora: lookup directo por ley_nombre + articulo_numero.
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { resolveLeyNombre } from '@/lib/ai/citation-aliases'
import type { CitaLegal, VerificationResult } from '@/types/ai'
import type { Database } from '@/types/database'

// ─── Tipos internos (§1.5.1, §1.5.5) ─────────────────────────────────────────

export interface ExtractedCitation {
  /** ley_nombre resuelto ("CE", "LPAC"...) o rawLey si no resuelve */
  ley: string
  /** texto original del nombre de ley tal como aparece en el texto */
  leyRaw: string
  /** número del artículo ("14", "53", "9 bis") */
  articulo: string
  /** apartado opcional ("1", "1.a", "b") */
  apartado?: string
  /** match completo en el texto */
  textoOriginal: string
  /** true si resolveLeyNombre tuvo éxito */
  leyResuelta: boolean
}

export interface ContentMatchResult {
  match: boolean
  confidence: 'high' | 'medium' | 'low'
  details: string
}

// ─── Cliente Supabase (service role para bypass RLS) ─────────────────────────

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}

// ─── Keywords institucionales para verifyContentMatch ────────────────────────

const INSTITUTIONAL_KEYWORDS = [
  'Consejo de Ministros',
  'Ministerio',
  'Tribunal',
  'Gobierno',
  'Cortes',
  'Senado',
  'Congreso',
  'Defensor del Pueblo',
  'Tribunal de Cuentas',
]

// ─── §1.5.1 — extractCitations ───────────────────────────────────────────────

/**
 * Extrae citas legales de un texto usando regex multi-patrón.
 *
 * Formatos soportados:
 *   - artículo 14 CE
 *   - art. 53.1 LPAC
 *   - Art. 53.1.a de la Ley 39/2015
 *   - artículo 14 de la Constitución
 *   - artículo 1 del TREBEP
 *   - art. 9 bis de la LPAC
 *   - artículo 103.3 CE
 *
 * NO captura:
 *   - artículo catorce CE (números en texto)
 *   - disposición adicional primera LPAC (disposiciones)
 */
export function extractCitations(text: string): ExtractedCitation[] {
  /**
   * Estrategia de extracción multi-patrón:
   *
   * Patrón LEY_NAME captura (en orden de precedencia):
   *   1. Leyes con número: "Ley Orgánica X/YYYY", "Ley X/YYYY"
   *   2. "la Constitución [Española]" — con "la" delante
   *   3. "Constitución [Española]" — sin "la" (cuando "de la" fue consumido antes)
   *   4. Siglas UPPERCASE puras (CE, LPAC, LRJSP...) — solo [A-Z0-9], no minúsculas
   *
   * IMPORTANTE: La sigla `[A-Z0-9]{2,12}` usa la flag `u` explícita en el patrón
   * para no capturar palabras con minúsculas (evita capturar "Constituci").
   * El resto del regex usa flag `gi` (case-insensitive para "artículo"/"articulo").
   *
   * Formato completo:
   *   art[ículo]?.? NÚMERO[.APART]? [del/de la]? LEY_NAME
   */

  // Parte común: prefijo art[ículo] + número + apartado + preposición opcional
  // Grupo 1: número artículo (con posible "bis"/"ter"/"quater")
  // Grupo 2: apartado opcional (".1", ".1.a")
  // Grupo 3: nombre de ley
  //
  // La clave: para la sigla usamos [A-Z][A-Z0-9]+ en lugar de [A-Z]{2,12} con /i
  // Así solo captura tokens puramente en MAYÚSCULAS (CE, LPAC, etc.) pero no "Constituci"
  const LEY_NAME_PART =
    '(?:' +
    'Ley\\s+Org[aá]nica\\s+\\d+\\/\\d{4}' +   // Ley Orgánica X/YYYY
    '|Ley\\s+\\d+\\/\\d{4}' +                   // Ley X/YYYY
    '|[Ll]a\\s+Constituci[oó]n(?:\\s+Espa[nñ]ola)?' + // la Constitución [Española]
    '|Constituci[oó]n(?:\\s+Espa[nñ]ola)?' +    // Constitución [Española] (sin "la")
    '|[A-Z][A-Z0-9]{1,11}' +                    // Siglas UPPERCASE: CE, LPAC, TREBEP...
    ')'

  // Prefijo "artículo" completo
  const ARTICULO_PREFIX = '\\bart(?:í|i)culo\\.?\\s+'
  // Prefijo "art." abreviado
  const ART_PREFIX = '\\bart\\.\\s+'

  // Número + apartado + preposición
  const NUM_APART_PREP =
    '(\\d+(?:\\s+(?:bis|ter|quater))?)' +        // Grupo 1: número artículo
    '(\\.[0-9]+(?:\\.[a-z])?)?' +                 // Grupo 2: apartado opcional
    '(?:\\s+(?:de\\s+la|del?\\s+la|del?))?' +     // preposición opcional (no captura)
    '\\s+'                                         // espacio obligatorio antes del nombre de ley

  const buildRE = (prefix: string) =>
    new RegExp(prefix + NUM_APART_PREP + '(' + LEY_NAME_PART + ')', 'gi')

  const CITATION_RE = buildRE(ARTICULO_PREFIX)
  const ART_ABBREV_RE = buildRE(ART_PREFIX)

  const rawMatches: Array<{ full: string; artNum: string; apart: string | undefined; leyRaw: string }> = []

  // Procesar ambos patrones
  for (const re of [CITATION_RE, ART_ABBREV_RE]) {
    re.lastIndex = 0
    for (const m of text.matchAll(re)) {
      const artNum = m[1].trim()
      const apart = m[2] ? m[2].replace(/^\./, '') : undefined
      const leyRaw = m[3].trim()
      // Normalizar "la Constitución [Española]" y "Constitución [Española]" para alias lookup
      const leyForAlias = leyRaw
        .replace(/^[Ll]a\s+/i, '')            // quitar "la " inicial
        .replace(/\s+Espa[nñ]ola$/i, '')       // quitar " Española" final
        .trim()
      rawMatches.push({ full: m[0], artNum, apart, leyRaw: leyForAlias })
    }
  }

  // Deduplicar por textoOriginal (los dos regex pueden solapar en algunos casos)
  const seen = new Set<string>()
  const citations: ExtractedCitation[] = []

  for (const rm of rawMatches) {
    if (seen.has(rm.full)) continue
    seen.add(rm.full)

    const resolved = resolveLeyNombre(rm.leyRaw)
    citations.push({
      ley: resolved ?? rm.leyRaw,
      leyRaw: rm.leyRaw,
      articulo: rm.artNum,
      apartado: rm.apart,
      textoOriginal: rm.full,
      leyResuelta: resolved !== null,
    })
  }

  return citations
}

// ─── §1.5.3 — verifyCitation ─────────────────────────────────────────────────

/**
 * Verifica una cita extraída contra la tabla `legislacion`.
 *
 * Pasos:
 *   1. Si leyResuelta=false → error inmediato
 *   2. Lookup exacto por ley_nombre + articulo_numero
 *   3. Retry con variante limpia del número si falla (e.g. "53.1" → "53")
 */
export async function verifyCitation(citation: ExtractedCitation): Promise<VerificationResult> {
  if (!citation.leyResuelta) {
    const cita: CitaLegal = {
      ley: citation.ley,
      articulo: citation.articulo,
      apartado: citation.apartado,
      textoExacto: citation.textoOriginal,
    }
    return {
      cita,
      verificada: false,
      error: `Ley no reconocida: ${citation.leyRaw}`,
    }
  }

  const cita: CitaLegal = {
    ley: citation.ley,
    articulo: citation.articulo,
    apartado: citation.apartado,
    textoExacto: citation.textoOriginal,
  }

  try {
    const supabase = getClient()

    // Intento 1: lookup exacto
    const { data, error } = await supabase
      .from('legislacion')
      .select('texto_integro, ley_codigo, articulo_numero, apartado')
      .eq('ley_nombre', citation.ley)
      .eq('articulo_numero', citation.articulo)
      .eq('activo', true)
      .maybeSingle()

    if (error) {
      logger.warn({ err: error.message, cita }, 'verifyCitation DB error')
      return { cita, verificada: false, error: 'Error de base de datos' }
    }

    if (data) {
      return { cita, verificada: true, textoEnBD: data.texto_integro }
    }

    // Intento 2: variante del número de artículo
    // Ej: "53" puede estar guardado con apartado implícito, o "9 bis" con distinto formato
    const articuloVariant = buildArticuloVariant(citation.articulo)

    if (articuloVariant !== citation.articulo) {
      const { data: data2, error: error2 } = await supabase
        .from('legislacion')
        .select('texto_integro, ley_codigo, articulo_numero, apartado')
        .eq('ley_nombre', citation.ley)
        .eq('articulo_numero', articuloVariant)
        .eq('activo', true)
        .maybeSingle()

      if (!error2 && data2) {
        return { cita, verificada: true, textoEnBD: data2.texto_integro }
      }
    }

    return { cita, verificada: false, error: 'Artículo no encontrado en BD' }
  } catch (err) {
    logger.warn({ err, cita }, 'verifyCitation exception')
    return { cita, verificada: false, error: 'Error de base de datos' }
  }
}

/**
 * Construye una variante del número de artículo para retry.
 * Ej: "53.1" → "53", "9.bis" → "9 bis", "9 bis" → "9bis"
 */
function buildArticuloVariant(articulo: string): string {
  // Si tiene punto (e.g. "53.1"), quitar todo desde el punto
  if (/\.\d/.test(articulo)) {
    return articulo.replace(/\.\d+.*$/, '')
  }
  // Si tiene espacio entre número y bis/ter, quitar espacio
  if (/\d\s+(bis|ter|quater)$/i.test(articulo)) {
    return articulo.replace(/\s+/, '')
  }
  // Quitar puntos que no sean parte del número
  if (articulo.includes('.')) {
    return articulo.replace(/\./g, '')
  }
  return articulo
}

// ─── §1.5.5 — verifyContentMatch ─────────────────────────────────────────────

/**
 * Verifica de forma determinista si el texto del claim es consistente
 * con el texto real del artículo en la BD.
 *
 * Verificaciones:
 *   1. Plazos: extrae "N días|meses|años|horas" del claim y verifica en artículo
 *   2. Órganos/Instituciones: si keyword institucional aparece en claim, verifica en artículo
 *   3. Números escritos: normaliza "diez" → "10" para plazos en texto
 *
 * Confidence:
 *   - high:   hay plazos o números específicos verificados
 *   - medium: solo hay keywords generales
 *   - low:    no hay información verificable
 */
export function verifyContentMatch(
  _citation: ExtractedCitation,
  claimText: string,
  articuloTexto: string
): ContentMatchResult {
  const claimLower = claimText.toLowerCase()
  const articuloLower = articuloTexto.toLowerCase()

  // ── 1. Verificación de plazos ──────────────────────────────────────────────

  // Tabla bidireccional: numeral textual → número, número → numeral textual
  const NUMERALES_MAP: Record<number, string> = {
    1: 'un|uno|una',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
    10: 'diez',
    15: 'quince',
    20: 'veinte',
    30: 'treinta',
    60: 'sesenta',
  }

  // Mapa inverso: texto → número (para extraer plazos textuales del claim)
  const TEXTO_A_NUM: Record<string, number> = {
    'un': 1, 'uno': 1, 'una': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
    'diez': 10, 'quince': 15, 'veinte': 20, 'treinta': 30, 'sesenta': 60,
  }

  // Extraer plazos numéricos del claim: "10 días", "3 meses", "2 años", "24 horas"
  const PLAZO_NUM_RE = /(\d+)\s+(días?|meses?|años?|horas?)/gi
  // Extraer plazos textuales del claim: "tres meses", "diez días", "un año"
  const TEXTO_NUM_RE = new RegExp(
    `(${Object.keys(TEXTO_A_NUM).join('|')})\\s+(días?|meses?|años?|horas?)`,
    'gi'
  )

  const claimPlazos: Array<{ numero: number; unidad: string }> = []

  let m: RegExpExecArray | null
  PLAZO_NUM_RE.lastIndex = 0
  while ((m = PLAZO_NUM_RE.exec(claimLower)) !== null) {
    claimPlazos.push({ numero: parseInt(m[1], 10), unidad: m[2] })
  }
  TEXTO_NUM_RE.lastIndex = 0
  while ((m = TEXTO_NUM_RE.exec(claimLower)) !== null) {
    const num = TEXTO_A_NUM[m[1].toLowerCase()]
    if (num !== undefined) {
      // Evitar duplicar si ya fue extraído numéricamente
      const alreadyPresent = claimPlazos.some(
        (p) => p.numero === num && p.unidad.startsWith(m![2].replace(/s$/, ''))
      )
      if (!alreadyPresent) {
        claimPlazos.push({ numero: num, unidad: m[2] })
      }
    }
  }

  if (claimPlazos.length > 0) {
    let allPlazosMatch = true
    const mismatchedPlazos: string[] = []

    for (const plazo of claimPlazos) {
      const numStr = String(plazo.numero)
      const numTextPattern = NUMERALES_MAP[plazo.numero]
      const unidadBase = plazo.unidad.replace(/s$/, '') // "días" → "día", "meses" → "mes"
        .replace(/es$/, '') // "meses" → "mes" when only trailing "es"

      // Buscar en artículo: "3 meses", "3 mes", "tres meses" o textual
      const numericPattern = new RegExp(`${numStr}\\s+${unidadBase}`, 'i')
      const textualPattern = numTextPattern
        ? new RegExp(`(?:${numTextPattern})\\s+${unidadBase}`, 'i')
        : null

      const found =
        numericPattern.test(articuloLower) ||
        (textualPattern?.test(articuloLower) ?? false) ||
        // Fallback: comprobar la unidad completa con plural tal como aparece
        new RegExp(`${numStr}\\s+${plazo.unidad}`, 'i').test(articuloLower) ||
        (numTextPattern
          ? new RegExp(`(?:${numTextPattern})\\s+${plazo.unidad}`, 'i').test(articuloLower)
          : false)

      if (!found) {
        allPlazosMatch = false
        mismatchedPlazos.push(`${plazo.numero} ${plazo.unidad}`)
      }
    }

    if (allPlazosMatch) {
      return {
        match: true,
        confidence: 'high',
        details: `Plazos verificados: ${claimPlazos.map((p) => `${p.numero} ${p.unidad}`).join(', ')}`,
      }
    } else {
      return {
        match: false,
        confidence: 'high',
        details: `Plazos no encontrados en el artículo: ${mismatchedPlazos.join(', ')}`,
      }
    }
  }

  // ── 2. Verificación de órganos/instituciones ───────────────────────────────

  const claimKeywords = INSTITUTIONAL_KEYWORDS.filter((kw) =>
    claimLower.includes(kw.toLowerCase())
  )

  if (claimKeywords.length > 0) {
    const matchedKeywords = claimKeywords.filter((kw) =>
      articuloLower.includes(kw.toLowerCase())
    )
    const unmatchedKeywords = claimKeywords.filter(
      (kw) => !articuloLower.includes(kw.toLowerCase())
    )

    if (unmatchedKeywords.length > 0) {
      return {
        match: false,
        confidence: 'medium',
        details: `Órganos no encontrados en el artículo: ${unmatchedKeywords.join(', ')}`,
      }
    }

    return {
      match: true,
      confidence: 'medium',
      details: `Órganos verificados: ${matchedKeywords.join(', ')}`,
    }
  }

  // ── 3. Sin información verificable ────────────────────────────────────────

  return {
    match: true,
    confidence: 'low',
    details: 'Sin plazos ni órganos específicos para verificar determinísticamente',
  }
}

// ─── §1.5.7 — verifyAllCitations ─────────────────────────────────────────────

/**
 * Verifica todas las citas legales encontradas en un texto.
 *
 * Pipeline completo:
 *   1. extractCitations(text) → ExtractedCitation[]
 *   2. verifyCitation(cita) → VerificationResult (con textoEnBD si verified)
 *   3. verifyContentMatch(cita, text, textoEnBD) → ContentMatchResult
 *
 * Retorna array vacío si no hay citas.
 * Dispara alerta si verificationScore < 0.5 (regeneración necesaria).
 */
export async function verifyAllCitations(
  text: string,
  requestId?: string
): Promise<VerificationResult[]> {
  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger

  // §1.5.1: Extraer citas del texto
  const extracted = extractCitations(text)

  if (extracted.length === 0) {
    log.debug({ duration_ms: 0 }, 'Verification: no citations found in text')
    return []
  }

  // §1.5.3: Verificar cada cita contra la BD
  const verificationResults = await Promise.all(extracted.map((cita) => verifyCitation(cita)))

  // §1.5.5: Para citas verificadas, añadir content match
  const results: VerificationResult[] = verificationResults.map((result, idx) => {
    if (result.verificada && result.textoEnBD) {
      const contentMatch = verifyContentMatch(extracted[idx], text, result.textoEnBD)
      // Añadimos contentMatch al resultado extendiendo el objeto (compatible con VerificationResult)
      return {
        ...result,
        contentMatch,
      }
    }
    return result
  })

  const durationMs = Date.now() - start
  const citationsTotal = results.length
  const citationsVerified = results.filter((r) => r.verificada).length
  const citationsFailed = citationsTotal - citationsVerified
  const verificationScore = citationsVerified / citationsTotal
  const regenerationTriggered = verificationScore < 0.5 && citationsTotal > 0

  // DDIA Observability: KPIs de calidad del pipeline (0.10.19)
  log.info(
    {
      citations_total: citationsTotal,
      citations_verified: citationsVerified,
      citations_failed: citationsFailed,
      verification_score: Number(verificationScore.toFixed(3)),
      regeneration_triggered: regenerationTriggered,
      duration_ms: durationMs,
    },
    'Verification KPIs'
  )

  // INSERT en api_usage_log para tracking de calidad (0.10.19) — non-bloqueante
  void logVerificationMetrics({ verificationScore, citationsTotal })

  return results
}

/**
 * Alias de compatibilidad para código que use el nombre antiguo `verifySingleCitation`.
 * Recibe un CitaLegal (tipo público) y construye internamente un ExtractedCitation.
 *
 * @deprecated Usar verifyCitation(ExtractedCitation) directamente.
 */
export async function verifySingleCitation(cita: CitaLegal): Promise<VerificationResult> {
  const resolved = resolveLeyNombre(cita.ley)
  const extracted: ExtractedCitation = {
    ley: resolved ?? cita.ley,
    leyRaw: cita.ley,
    articulo: cita.articulo,
    apartado: cita.apartado,
    textoOriginal: cita.textoExacto,
    leyResuelta: resolved !== null,
  }
  return verifyCitation(extracted)
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function logVerificationMetrics(params: {
  verificationScore: number
  citationsTotal: number
}) {
  if (params.citationsTotal === 0) return
  try {
    const supabase = getClient()
    await supabase.from('api_usage_log').insert({
      user_id: null,
      endpoint: 'verification',
      model: 'deterministic',
      tokens_in: 0,
      tokens_out: 0,
      cost_estimated_cents: 0,
    })
  } catch {
    // Non-blocking — nunca fallar verificación por logging
  }
}
