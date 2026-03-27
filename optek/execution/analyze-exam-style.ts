/**
 * execution/analyze-exam-style.ts — FASE Q.2.1
 *
 * Analiza parsed exam JSONs para extraer patrones de estilo por oposición.
 * Output: data/exam-style-analysis.json + stdout resumen.
 *
 * Métricas: longitud enunciado/opciones, % preguntas negativas, distribución
 * de correctas, patrones de distractores.
 *
 * Coste: $0 (solo lee ficheros locales)
 * Uso: pnpm analyze:style
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_ROOT = path.join(__dirname, '..', '..', 'data')

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface OpoMetrics {
  oposicion: string
  totalPreguntas: number
  totalExamenes: number
  enunciado: {
    mediaWords: number
    medianWords: number
    minWords: number
    maxWords: number
  }
  opciones: {
    mediaWords: number
    medianWords: number
  }
  negativePct: number  // % preguntas con "NO es correcto" / "INCORRECTA" etc.
  correctaDistribution: { 0: number; 1: number; 2: number; 3: number }
  correctaBias: string  // "balanced" | "bias_A" | "bias_B" etc.
  prefixedOptions: number  // % opciones con "A)" "B)" prefix
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const NEGATIVE_PATTERNS = [
  /no es correct/i, /incorrect/i, /no se corresponde/i,
  /no es cierto/i, /no es verdad/i, /señale.*incorrecta/i,
  /cuál.*no.*es/i, /no.*procede/i, /no.*puede/i,
  /falsa/i, /no.*contempla/i, /excepción/i,
]

function isNegativeQuestion(enunciado: string): boolean {
  return NEGATIVE_PATTERNS.some(p => p.test(enunciado))
}

function hasPrefixedOptions(opciones: string[]): boolean {
  return opciones.some(o => /^[A-Da-d]\)\s/.test(o.trim()))
}

// ─── Exam directory mapping ──────────────────────────────────────────────────

const EXAM_DIRS: Array<{ dir: string; oposicion: string }> = [
  { dir: 'examenes', oposicion: 'C2 AGE (Auxiliar)' },
  { dir: 'examenes_c1', oposicion: 'C1 AGE (Administrativo)' },
  { dir: 'examenes_a2', oposicion: 'A2 GACE (Gestión Estado)' },
  { dir: 'examenes_correos', oposicion: 'Correos' },
  { dir: 'examenes_auxilio', oposicion: 'Auxilio Judicial' },
  { dir: 'examenes_tramitacion', oposicion: 'Tramitación Procesal' },
  { dir: 'examenes_gestion_procesal', oposicion: 'Gestión Procesal' },
]

function findParsedJsons(baseDir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(baseDir)) return results

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.startsWith('parsed') && entry.name.endsWith('.json')) results.push(full)
    }
  }

  walk(baseDir)
  return results
}

// ─── Analysis ────────────────────────────────────────────────────────────────

function analyzeOposicion(opoName: string, examDir: string): OpoMetrics | null {
  const jsons = findParsedJsons(path.join(DATA_ROOT, examDir))
  if (jsons.length === 0) return null

  const allQuestions: ParsedQuestion[] = []

  for (const jsonPath of jsons) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as ParsedExam
      allQuestions.push(...parsed.preguntas)
    } catch { /* skip invalid */ }
  }

  if (allQuestions.length === 0) return null

  // Enunciado lengths
  const enunciadoLengths = allQuestions.map(q => wordCount(q.enunciado))

  // Option lengths (flatten all options)
  const optionLengths: number[] = []
  for (const q of allQuestions) {
    const opts = Array.isArray(q.opciones) ? q.opciones : Object.values(q.opciones)
    for (const opt of opts) {
      optionLengths.push(wordCount(String(opt)))
    }
  }

  // Negative questions
  const negativeCount = allQuestions.filter(q => isNegativeQuestion(q.enunciado)).length

  // Correcta distribution
  const dist = { 0: 0, 1: 0, 2: 0, 3: 0 }
  for (const q of allQuestions) {
    const c = q.correcta as 0 | 1 | 2 | 3
    if (c >= 0 && c <= 3) dist[c]++
  }

  // Determine bias
  const total = allQuestions.length
  const expected = total / 4
  const letters = ['A', 'B', 'C', 'D'] as const
  let maxDeviation = 0
  let biasLetter = ''
  for (let i = 0; i < 4; i++) {
    const deviation = Math.abs(dist[i as 0 | 1 | 2 | 3] - expected) / expected
    if (deviation > maxDeviation) {
      maxDeviation = deviation
      biasLetter = letters[i]
    }
  }
  const correctaBias = maxDeviation > 0.15 ? `bias_${biasLetter} (${Math.round(maxDeviation * 100)}% off)` : 'balanced'

  // Prefixed options
  const prefixedCount = allQuestions.filter(q => {
    const opts = Array.isArray(q.opciones) ? q.opciones : Object.values(q.opciones)
    return hasPrefixedOptions(opts.map(String))
  }).length

  return {
    oposicion: opoName,
    totalPreguntas: allQuestions.length,
    totalExamenes: jsons.length,
    enunciado: {
      mediaWords: Math.round(enunciadoLengths.reduce((a, b) => a + b, 0) / enunciadoLengths.length),
      medianWords: Math.round(median(enunciadoLengths)),
      minWords: Math.min(...enunciadoLengths),
      maxWords: Math.max(...enunciadoLengths),
    },
    opciones: {
      mediaWords: Math.round(optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length),
      medianWords: Math.round(median(optionLengths)),
    },
    negativePct: Math.round((negativeCount / total) * 100),
    correctaDistribution: dist,
    correctaBias,
    prefixedOptions: Math.round((prefixedCount / total) * 100),
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('📊 OpoRuta — Análisis de Estilo de Exámenes Oficiales (FASE Q.2.1)')
  console.log('===================================================================\n')

  const results: OpoMetrics[] = []

  for (const { dir, oposicion } of EXAM_DIRS) {
    const metrics = analyzeOposicion(oposicion, dir)
    if (metrics) {
      results.push(metrics)
      console.log(`📝 ${oposicion}`)
      console.log(`   ${metrics.totalPreguntas} preguntas en ${metrics.totalExamenes} exámenes`)
      console.log(`   Enunciado: media ${metrics.enunciado.mediaWords} palabras (mediana ${metrics.enunciado.medianWords}, rango ${metrics.enunciado.minWords}-${metrics.enunciado.maxWords})`)
      console.log(`   Opciones: media ${metrics.opciones.mediaWords} palabras (mediana ${metrics.opciones.medianWords})`)
      console.log(`   Negativas: ${metrics.negativePct}%`)
      console.log(`   Correctas: A=${metrics.correctaDistribution[0]} B=${metrics.correctaDistribution[1]} C=${metrics.correctaDistribution[2]} D=${metrics.correctaDistribution[3]} → ${metrics.correctaBias}`)
      console.log(`   Opciones prefijadas (A/B/C/D): ${metrics.prefixedOptions}%`)
      console.log()
    }
  }

  // Save to JSON
  const outputPath = path.join(DATA_ROOT, 'exam-style-analysis.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`💾 Guardado en: ${outputPath}`)

  // Summary table
  console.log('\n📊 Tabla resumen:')
  console.log('| Oposición | Preguntas | Enunciado (media) | Opciones (media) | Negativas | Correcta bias | Prefijo A/B |')
  console.log('|-----------|-----------|-------------------|------------------|-----------|---------------|-------------|')
  for (const m of results) {
    console.log(`| ${m.oposicion.padEnd(25)} | ${String(m.totalPreguntas).padStart(5)} | ${String(m.enunciado.mediaWords).padStart(5)} words | ${String(m.opciones.mediaWords).padStart(5)} words | ${String(m.negativePct).padStart(5)}% | ${m.correctaBias.padEnd(13)} | ${String(m.prefixedOptions).padStart(5)}% |`)
  }
}

main()
