import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { CitaLegal, VerificationResult } from '@/types/ai'

/**
 * Pipeline de verificación determinista de citas legales.
 *
 * DDIA Observability (0.10.19): loguea KPIs tras cada verificación:
 *   { citations_total, citations_verified, citations_failed,
 *     verification_score, regeneration_triggered, duration_ms }
 *
 * TODO §1.15: Implementar RAG completo con match_legislacion() y búsqueda semántica.
 *             Por ahora: lookup directo por ley_codigo + articulo_numero.
 */

// Patrón para detectar citas legales en texto generado por Claude
// Ej: "artículo 14 CE", "art. 103 de la Constitución", "artículo 53.1 LPAC"
const CITATION_PATTERN = /\bart(?:ículo)?\.?\s+([\d.]+(?:\s*\w+)?)/gi

/**
 * Verifica todas las citas legales encontradas en un texto.
 * Retorna array con estado de verificación de cada cita.
 *
 * Dispara alerta si verificationScore < 0.5 (regeneración necesaria).
 */
export async function verifyAllCitations(
  text: string,
  requestId?: string
): Promise<VerificationResult[]> {
  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger

  // Extraer menciones de artículos del texto
  const matches = [...text.matchAll(CITATION_PATTERN)]

  if (matches.length === 0) {
    log.debug({ duration_ms: 0 }, 'Verification: no citations found in text')
    return []
  }

  // Verificar cada cita contra la BD
  const results = await Promise.all(
    matches.map((m) => {
      const rawArticle = m[1].trim()
      const cita: CitaLegal = {
        ley: 'UNKNOWN', // TODO §1.15: detectar ley del contexto (CE, LPAC, EBEP)
        articulo: rawArticle,
        textoExacto: m[0],
      }
      return verifySingleCitation(cita)
    })
  )

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
 * Verifica una única cita legal contra la tabla legislacion.
 */
export async function verifySingleCitation(cita: CitaLegal): Promise<VerificationResult> {
  try {
    const supabase = await createServiceClient()

    // Lookup directo por ley_codigo + articulo_numero (índice idx_legislacion_ley_art)
    const { data } = await supabase
      .from('legislacion')
      .select('texto_integro, ley_codigo, articulo_numero, apartado')
      .eq('ley_codigo', cita.ley)
      .eq('articulo_numero', cita.articulo)
      .eq('activo', true)
      .maybeSingle()

    if (!data) {
      return {
        cita,
        verificada: false,
        error: cita.ley === 'UNKNOWN'
          ? 'Ley no identificada en contexto — pendiente §1.15'
          : 'Artículo no encontrado en BD',
      }
    }

    return {
      cita,
      verificada: true,
      textoEnBD: data.texto_integro,
    }
  } catch (err) {
    logger.warn({ err, cita }, 'verifySingleCitation DB error')
    return { cita, verificada: false, error: 'Error de base de datos' }
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function logVerificationMetrics(params: {
  verificationScore: number
  citationsTotal: number
}) {
  if (params.citationsTotal === 0) return
  try {
    const supabase = await createServiceClient()
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
