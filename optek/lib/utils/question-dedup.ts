/**
 * lib/utils/question-dedup.ts
 *
 * Deterministic question deduplication — 3 levels, €0 cost (no AI).
 * Used to prevent duplicate questions in the progressive question bank.
 */

import { createHash } from 'crypto'

// ─── Level 1: Exact hash ────────────────────────────────────────────────────

/**
 * Normalize text for comparison: lowercase, strip accents, remove punctuation,
 * collapse whitespace, trim.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^\w\s]/g, ' ')          // punctuation → space
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
}

/**
 * SHA-256 hash of normalized enunciado. Used as UNIQUE constraint in question_bank.
 */
export function computeHash(enunciado: string): string {
  return createHash('sha256').update(normalizeText(enunciado)).digest('hex')
}

// ─── Level 2: Legal fingerprint ─────────────────────────────────────────────

/**
 * Build a legal fingerprint key from tema, citation, and correct answer text.
 * Two questions about the same article with the same correct answer are
 * functionally identical regardless of wording.
 *
 * Returns null if no citation exists (e.g., Bloque II, psicotécnicos).
 */
export function buildLegalKey(
  temaId: string,
  cita: { ley?: string; articulo?: string } | null | undefined,
  correctAnswerText: string,
): string | null {
  if (!cita?.ley || !cita?.articulo) return null
  return `${temaId}:${normalizeText(cita.ley)}:${normalizeText(cita.articulo)}:${normalizeText(correctAnswerText)}`
}

// ─── Level 3: Jaccard n-gram similarity ─────────────────────────────────────

/**
 * Extract word trigrams from normalized text.
 * E.g., "el recurso de alzada" → {"el recurso de", "recurso de alzada"}
 */
export function extractWordTrigrams(text: string): Set<string> {
  const normalized = normalizeText(text)
  const words = normalized.split(' ').filter(w => w.length > 0)
  const trigrams = new Set<string>()
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }
  return trigrams
}

/**
 * Jaccard similarity coefficient between two sets.
 * Returns 0-1 where 1 = identical.
 */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  if (a.size === 0 || b.size === 0) return 0

  let intersectionSize = 0
  const smaller = a.size <= b.size ? a : b
  const larger = a.size <= b.size ? b : a
  for (const item of smaller) {
    if (larger.has(item)) intersectionSize++
  }

  const unionSize = a.size + b.size - intersectionSize
  return unionSize > 0 ? intersectionSize / unionSize : 0
}

// ─── Combined dedup check ───────────────────────────────────────────────────

export interface BankQuestion {
  id: string
  enunciado_hash: string
  legal_key: string | null
  enunciado: string
}

export interface DedupResult {
  duplicate: boolean
  level: 1 | 2 | 3 | null
  matchId?: string
}

const JACCARD_THRESHOLD = 0.6

/**
 * Check if a question is a duplicate of any question in the bank.
 * Runs 3 levels of dedup, all deterministic (€0 cost).
 *
 * @param question - The new question to check
 * @param bankQuestions - Existing questions in the bank for same (tema, dificultad)
 * @param hashSet - Pre-built Set of enunciado_hash for O(1) Level 1 lookup
 * @param legalKeyMap - Pre-built Map of legal_key → question_id for O(1) Level 2 lookup
 */
export function isDuplicate(
  question: {
    enunciado: string
    cita?: { ley?: string; articulo?: string } | null
    correctAnswerText: string
    temaId: string
  },
  bankQuestions: BankQuestion[],
  hashSet: Set<string>,
  legalKeyMap: Map<string, string>,
): DedupResult {
  // Level 1: Exact hash
  const hash = computeHash(question.enunciado)
  if (hashSet.has(hash)) {
    return { duplicate: true, level: 1 }
  }

  // Level 2: Legal fingerprint
  const legalKey = buildLegalKey(question.temaId, question.cita, question.correctAnswerText)
  if (legalKey && legalKeyMap.has(legalKey)) {
    return { duplicate: true, level: 2, matchId: legalKeyMap.get(legalKey) }
  }

  // Level 3: Jaccard n-gram similarity
  const newTrigrams = extractWordTrigrams(question.enunciado)
  if (newTrigrams.size >= 3) { // skip very short texts
    for (const bq of bankQuestions) {
      const existingTrigrams = extractWordTrigrams(bq.enunciado)
      if (jaccardSimilarity(newTrigrams, existingTrigrams) > JACCARD_THRESHOLD) {
        return { duplicate: true, level: 3, matchId: bq.id }
      }
    }
  }

  return { duplicate: false, level: null }
}

/**
 * Build lookup structures from bank questions for efficient dedup.
 */
export function buildDedupIndex(bankQuestions: BankQuestion[]): {
  hashSet: Set<string>
  legalKeyMap: Map<string, string>
} {
  const hashSet = new Set<string>()
  const legalKeyMap = new Map<string, string>()

  for (const q of bankQuestions) {
    hashSet.add(q.enunciado_hash)
    if (q.legal_key) legalKeyMap.set(q.legal_key, q.id)
  }

  return { hashSet, legalKeyMap }
}
