/**
 * lib/utils/deduplicate.ts — §DEDUP
 *
 * Deduplication utilities for premium_question_bank and supuesto_bank.
 * Uses text normalization + MD5 hashing. Similarity comparison is done
 * in PostgreSQL via pg_trgm (not here — see RPC check_question_duplicate).
 *
 * Cost: €0 AI — pure text processing.
 */

import { createHash } from 'crypto'

/** Normalize text for trigram comparison: lowercase + strip accents + strip punctuation */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^\w\s]/g, '')                           // strip punctuation
    .trim()
}

export function md5(text: string): string {
  return createHash('md5').update(text).digest('hex')
}

/** Extract citation components as normalized strings for fingerprinting */
export function extractCitation(cita?: { ley?: string; articulo?: string | number }): {
  ley: string | null
  articulo: string | null
} {
  if (!cita?.ley || !cita?.articulo) return { ley: null, articulo: null }
  return {
    ley: normalizeText(cita.ley),
    articulo: String(cita.articulo).trim(),
  }
}

/** Prepare dedup data for a test question (§2.8.3) */
export function prepareQuestionDedup(pregunta: {
  enunciado: string
  opciones: { texto: string }[]
  correcta: number
  cita?: { ley?: string; articulo?: string | number }
}) {
  const { ley, articulo } = extractCitation(pregunta.cita)
  return {
    enunciadoHash: md5(pregunta.enunciado),
    enunciadoNorm: normalizeText(pregunta.enunciado),
    correctaNorm: normalizeText(pregunta.opciones[pregunta.correcta].texto),
    citaLey: ley,
    citaArticulo: articulo,
  }
}

/** Prepare dedup data for a supuesto test (§2.7.2) */
export function prepareSupuestoDedup(caso: { titulo: string; escenario: string }) {
  return {
    tituloNorm: normalizeText(caso.titulo),
    escenarioNorm: normalizeText(caso.escenario.slice(0, 500)),
  }
}
