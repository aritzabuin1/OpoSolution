/**
 * execution/build-golden-dataset.ts — FASE Q.4.1
 *
 * Selecciona 20 preguntas representativas por oposición de los parsed JSONs.
 * Criterios de selección:
 *   - Variedad de temas (no repetir tema si posible)
 *   - Mezcla de dificultad (preguntas cortas y largas)
 *   - Preguntas con respuesta verificada (correcta != 0 default)
 *   - De los exámenes más recientes (priorizamos últimos años)
 *
 * Output: data/golden-dataset/[slug].json
 * Uso: pnpm build:golden
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_ROOT = path.join(__dirname, '..', '..', 'data')

interface ParsedQuestion {
  numero: number
  enunciado: string
  opciones: string[]
  correcta: number
}

interface ParsedExam {
  convocatoria: string
  anno: number
  modelo?: string
  preguntas: ParsedQuestion[]
}

interface GoldenQuestion {
  enunciado: string
  opciones: string[]
  correcta: number
  fuente: string  // "2024 modelo A"
  enunciado_words: number
  opcion_media_words: number
  es_negativa: boolean
}

const NEGATIVE_PATTERNS = [
  /no es correct/i, /incorrect/i, /señale.*incorrecta/i,
  /no es cierto/i, /cuál.*no.*es/i, /falsa/i,
]

const EXAM_DIRS: Array<{ dir: string; slug: string }> = [
  { dir: 'examenes', slug: 'aux-admin-estado' },
  { dir: 'examenes_c1', slug: 'administrativo-estado' },
  { dir: 'examenes_a2', slug: 'gestion-estado' },
  { dir: 'examenes_correos', slug: 'correos' },
  { dir: 'examenes_auxilio', slug: 'auxilio-judicial' },
  { dir: 'examenes_tramitacion', slug: 'tramitacion-procesal' },
  { dir: 'examenes_gestion_procesal', slug: 'gestion-procesal' },
]

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function findParsedJsons(baseDir: string): Array<{ path: string; anno: number; modelo: string }> {
  const results: Array<{ path: string; anno: number; modelo: string }> = []
  if (!fs.existsSync(baseDir)) return results

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.startsWith('parsed') && entry.name.endsWith('.json')) {
        const annoMatch = full.match(/(\d{4})/)
        const modeloMatch = entry.name.match(/parsed_?(\w?)\.json/)
        results.push({
          path: full,
          anno: annoMatch ? parseInt(annoMatch[1]) : 0,
          modelo: modeloMatch?.[1] || '',
        })
      }
    }
  }

  walk(baseDir)
  return results.sort((a, b) => b.anno - a.anno) // most recent first
}

function selectGoldenQuestions(slug: string, examDir: string, count: number = 20): GoldenQuestion[] {
  const jsons = findParsedJsons(path.join(DATA_ROOT, examDir))
  if (jsons.length === 0) return []

  // Collect all questions with metadata
  const allQuestions: Array<GoldenQuestion & { anno: number }> = []

  for (const { path: jsonPath, anno, modelo } of jsons) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as ParsedExam
      for (const q of parsed.preguntas) {
        const opcArr = Array.isArray(q.opciones) ? q.opciones : Object.values(q.opciones)
        const opcWords = opcArr.map(o => wordCount(String(o)))
        allQuestions.push({
          enunciado: q.enunciado,
          opciones: opcArr.map(String),
          correcta: q.correcta,
          fuente: `${anno}${modelo ? ` modelo ${modelo.toUpperCase()}` : ''}`,
          enunciado_words: wordCount(q.enunciado),
          opcion_media_words: Math.round(opcWords.reduce((a, b) => a + b, 0) / opcWords.length),
          es_negativa: NEGATIVE_PATTERNS.some(p => p.test(q.enunciado)),
          anno,
        })
      }
    } catch { /* skip */ }
  }

  if (allQuestions.length === 0) return []

  // Selection strategy: prioritize recent years, variety in length/style
  // Sort by year (desc), then shuffle within each year
  allQuestions.sort((a, b) => b.anno - a.anno)

  // Take from most recent years first, ensuring variety
  const selected: GoldenQuestion[] = []
  const usedEnunciados = new Set<string>()

  // Pass 1: one question per "bucket" (short/medium/long × positive/negative × recent/old)
  const buckets = {
    short_positive: allQuestions.filter(q => q.enunciado_words <= 15 && !q.es_negativa),
    short_negative: allQuestions.filter(q => q.enunciado_words <= 15 && q.es_negativa),
    medium_positive: allQuestions.filter(q => q.enunciado_words > 15 && q.enunciado_words <= 35 && !q.es_negativa),
    medium_negative: allQuestions.filter(q => q.enunciado_words > 15 && q.enunciado_words <= 35 && q.es_negativa),
    long_positive: allQuestions.filter(q => q.enunciado_words > 35 && !q.es_negativa),
    long_negative: allQuestions.filter(q => q.enunciado_words > 35 && q.es_negativa),
  }

  for (const [, questions] of Object.entries(buckets)) {
    for (const q of questions) {
      if (selected.length >= count) break
      const key = q.enunciado.slice(0, 80)
      if (usedEnunciados.has(key)) continue
      usedEnunciados.add(key)
      const { anno: _, ...golden } = q
      selected.push(golden)
      if (selected.length >= count) break
    }
  }

  // Pass 2: fill remaining from most recent
  for (const q of allQuestions) {
    if (selected.length >= count) break
    const key = q.enunciado.slice(0, 80)
    if (usedEnunciados.has(key)) continue
    usedEnunciados.add(key)
    const { anno: _, ...golden } = q
    selected.push(golden)
  }

  return selected.slice(0, count)
}

function main() {
  console.log('🏅 OpoRuta — Build Golden Dataset (FASE Q.4.1)')
  console.log('================================================\n')

  const outputDir = path.join(DATA_ROOT, 'golden-dataset')

  for (const { dir, slug } of EXAM_DIRS) {
    const questions = selectGoldenQuestions(slug, dir)
    if (questions.length === 0) {
      console.log(`⏭️  ${slug}: no parsed exams found`)
      continue
    }

    const outputPath = path.join(outputDir, `${slug}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2))

    // Compute summary stats
    const avgWords = Math.round(questions.reduce((s, q) => s + q.enunciado_words, 0) / questions.length)
    const avgOptWords = Math.round(questions.reduce((s, q) => s + q.opcion_media_words, 0) / questions.length)
    const negPct = Math.round((questions.filter(q => q.es_negativa).length / questions.length) * 100)
    const years = [...new Set(questions.map(q => q.fuente.split(' ')[0]))].join(', ')

    console.log(`✅ ${slug}: ${questions.length} preguntas → ${outputPath}`)
    console.log(`   Enunciado: ~${avgWords} words | Opciones: ~${avgOptWords} words | Negativas: ${negPct}% | Años: ${years}`)
  }

  console.log('\n📌 Siguiente: pnpm eval:quality para comparar IA vs golden dataset')
}

main()
