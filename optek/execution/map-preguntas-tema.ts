/**
 * execution/map-preguntas-tema.ts — FASE Q.0
 *
 * Mapea tema_id en preguntas_oficiales usando keyword matching contra los títulos
 * de los temas. Prerequisito para few-shot examples (Q.1) y Radar multi-oposición (Q.3).
 *
 * Estrategia:
 *   1. Carga temas de la oposición (id, numero, titulo)
 *   2. Genera keywords automáticas a partir de los títulos de los temas
 *   3. Para cada pregunta sin tema_id, intenta matchear por keywords
 *   4. UPDATE preguntas_oficiales SET tema_id = X WHERE id = Y
 *
 * Script idempotente: puede re-ejecutarse sin efecto secundario.
 * Coste: $0 (determinista, sin IA)
 *
 * Uso:
 *   pnpm map:preguntas-tema --oposicion <slug>
 *   pnpm map:preguntas-tema --oposicion auxilio-judicial
 *   pnpm map:preguntas-tema  ← procesa TODAS las oposiciones
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos')
    process.exit(1)
  }
  return createClient(url, key)
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tema {
  id: string
  numero: number
  titulo: string
}

interface PreguntaOficial {
  id: string
  enunciado: string
  opciones: string[]
  numero: number
}

// ─── Keyword generation from tema titles ─────────────────────────────────────

/**
 * Generate regex patterns from a tema title.
 * Extracts significant words/phrases, creating patterns that are likely to match
 * in question enunciados.
 */
function generateKeywords(titulo: string): RegExp[] {
  const patterns: RegExp[] = []

  // Split title by periods and commas to get phrases
  const phrases = titulo
    .split(/[.,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 3)

  // Stop words to skip
  const stopWords = new Set([
    'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'en', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hacia', 'desde',
    'que', 'como', 'más', 'sus', 'su', 'al', 'ante', 'bajo', 'cabe',
    'es', 'son', 'ser', 'estar', 'hay', 'tiene', 'tienen', 'puede',
    'y', 'o', 'ni', 'pero', 'sino', 'aunque', 'cuando', 'donde',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'otro', 'otra', 'otros', 'otras', 'todo', 'toda', 'todos', 'todas',
    'tema', 'concepto', 'nociones', 'generales', 'especial', 'referencia',
    'regulación', 'régimen', 'general', 'clases', 'tipos', 'naturaleza',
    'jurídica', 'marco', 'normativo',
  ])

  for (const phrase of phrases) {
    // Extract multi-word key phrases (2-4 words)
    const words = phrase.split(/\s+/).filter(w => w.length > 2)
    const significantWords = words.filter(w => !stopWords.has(w.toLowerCase()))

    // Full phrase if short enough (and significant)
    if (significantWords.length >= 2 && significantWords.length <= 5) {
      const pattern = significantWords
        .map(w => escapeRegex(w))
        .join('\\s+(?:\\w+\\s+){0,2}')  // Allow 0-2 words between keywords
      try {
        patterns.push(new RegExp(pattern, 'i'))
      } catch { /* invalid regex, skip */ }
    }

    // Individual significant words (3+ chars, not stop words)
    for (const word of significantWords) {
      if (word.length >= 5) {  // Only words >= 5 chars to avoid false positives
        try {
          patterns.push(new RegExp(`\\b${escapeRegex(word)}`, 'i'))
        } catch { /* skip */ }
      }
    }
  }

  // Also detect law references in the title
  const lawPatterns = titulo.match(/(?:ley|lo|rd|rdl)\s+[\d/]+/gi)
  if (lawPatterns) {
    for (const law of lawPatterns) {
      try {
        patterns.push(new RegExp(escapeRegex(law).replace(/\s+/g, '\\s+'), 'i'))
      } catch { /* skip */ }
    }
  }

  // Named abbreviations commonly found in titles
  const abbreviations = titulo.match(/\b[A-Z]{2,}\b/g)
  if (abbreviations) {
    for (const abbr of abbreviations) {
      if (abbr.length >= 3 && !['DEL', 'LOS', 'LAS'].includes(abbr)) {
        try {
          patterns.push(new RegExp(`\\b${escapeRegex(abbr)}\\b`))
        } catch { /* skip */ }
      }
    }
  }

  return patterns
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Matching logic ──────────────────────────────────────────────────────────

interface TemaWithPatterns {
  id: string
  numero: number
  titulo: string
  patterns: RegExp[]
}

/**
 * Score how well a question matches a tema.
 * Returns number of pattern matches (0 = no match).
 */
function scoreMatch(text: string, tema: TemaWithPatterns): number {
  let score = 0
  for (const pattern of tema.patterns) {
    if (pattern.test(text)) score++
  }
  return score
}

/**
 * Find the best tema match for a question.
 * Returns tema_id if a match is found with score >= 2 (at least 2 keyword hits).
 * Minimum threshold prevents false positives.
 */
function findBestTema(enunciado: string, opciones: string[], temas: TemaWithPatterns[]): string | null {
  // Combine enunciado + all options for broader matching
  const fullText = `${enunciado} ${opciones.join(' ')}`

  let bestTema: TemaWithPatterns | null = null
  let bestScore = 0

  for (const tema of temas) {
    const score = scoreMatch(fullText, tema)
    if (score > bestScore) {
      bestScore = score
      bestTema = tema
    }
  }

  // Minimum threshold: at least 2 keyword hits to avoid false positives
  if (bestScore >= 2 && bestTema) {
    return bestTema.id
  }

  return null
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function mapForOposicion(supabase: SupabaseClient, oposicionId: string, slug: string) {
  console.log(`\n🏷️  Procesando: ${slug}`)

  // 1. Load temas
  const { data: temasRaw, error: temasErr } = await supabase
    .from('temas')
    .select('id, numero, titulo')
    .eq('oposicion_id', oposicionId)
    .order('numero')

  if (temasErr || !temasRaw) {
    console.error(`  ❌ Error cargando temas: ${temasErr?.message}`)
    return { mapped: 0, total: 0 }
  }

  const temas = (temasRaw as Tema[]).map(t => ({
    ...t,
    patterns: generateKeywords(t.titulo),
  }))

  console.log(`  📚 ${temas.length} temas cargados`)

  // 2. Load preguntas sin tema_id
  const { data: preguntasRaw, error: pregErr } = await supabase
    .from('preguntas_oficiales')
    .select('id, enunciado, opciones, numero, examenes_oficiales!inner(oposicion_id)')
    .is('tema_id', null)
    .eq('examenes_oficiales.oposicion_id', oposicionId)

  if (pregErr || !preguntasRaw) {
    console.error(`  ❌ Error cargando preguntas: ${pregErr?.message}`)
    return { mapped: 0, total: 0 }
  }

  const preguntas = preguntasRaw as unknown as PreguntaOficial[]
  console.log(`  📝 ${preguntas.length} preguntas sin tema_id`)

  if (preguntas.length === 0) {
    console.log(`  ✅ Todas las preguntas ya tienen tema_id`)
    return { mapped: 0, total: 0 }
  }

  // 3. Map each question
  let mapped = 0
  let failed = 0
  const BATCH_SIZE = 50

  const updates: Array<{ id: string; tema_id: string }> = []

  for (const p of preguntas) {
    const opciones = Array.isArray(p.opciones)
      ? p.opciones.map(String)
      : Object.values(p.opciones as Record<string, string>).map(String)

    const temaId = findBestTema(p.enunciado, opciones, temas)
    if (temaId) {
      updates.push({ id: p.id, tema_id: temaId })
      mapped++
    } else {
      failed++
    }
  }

  // 4. Batch update
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    for (const { id, tema_id } of batch) {
      await supabase
        .from('preguntas_oficiales')
        .update({ tema_id })
        .eq('id', id)
    }
    process.stdout.write(`  📝 ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length} actualizadas\r`)
  }

  const pct = preguntas.length > 0 ? Math.round((mapped / preguntas.length) * 100) : 0
  console.log(`  ✅ Mapeadas: ${mapped}/${preguntas.length} (${pct}%) — ${failed} sin match`)

  return { mapped, total: preguntas.length }
}

async function main() {
  console.log('🗺️  OpoRuta — Mapeo tema_id en preguntas_oficiales (FASE Q.0)')
  console.log('===============================================================')

  const supabase = buildSupabaseClient()

  // Parse --oposicion flag
  const opoIdx = process.argv.indexOf('--oposicion')
  const targetSlug = opoIdx !== -1 ? process.argv[opoIdx + 1] : null

  // Load oposiciones
  let query = supabase.from('oposiciones').select('id, slug, nombre')
  if (targetSlug) {
    query = query.eq('slug', targetSlug)
  }

  const { data: oposiciones, error: opErr } = await query

  if (opErr || !oposiciones || oposiciones.length === 0) {
    console.error(`❌ ${targetSlug ? `Oposición "${targetSlug}" no encontrada` : 'No hay oposiciones'}`)
    process.exit(1)
  }

  let totalMapped = 0
  let totalQuestions = 0

  for (const op of oposiciones as Array<{ id: string; slug: string; nombre: string }>) {
    const result = await mapForOposicion(supabase, op.id, op.slug)
    totalMapped += result.mapped
    totalQuestions += result.total
  }

  console.log('\n===============================================================')
  console.log(`✅ Total: ${totalMapped}/${totalQuestions} preguntas mapeadas`)
  if (totalQuestions > totalMapped) {
    console.log(`⚠️  ${totalQuestions - totalMapped} preguntas sin match — pueden necesitar mapeo manual o mejores keywords`)
  }
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
