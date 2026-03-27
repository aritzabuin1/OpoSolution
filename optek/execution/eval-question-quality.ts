/**
 * execution/eval-question-quality.ts — FASE Q.4.2
 *
 * Compara métricas de estilo entre el golden dataset (preguntas oficiales) y
 * las preguntas que genera el prompt actual. Ejecutar después de cada bump
 * de PROMPT_VERSION para medir si las preguntas IA se acercan al estilo oficial.
 *
 * Modo 1 (sin coste): Solo analiza golden dataset y muestra baseline metrics
 * Modo 2 (con coste ~$2): Genera preguntas IA para los mismos temas y compara
 *
 * Uso:
 *   pnpm eval:quality              ← modo 1: solo baseline
 *   pnpm eval:quality --generate   ← modo 2: genera + compara (requiere API key)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_ROOT = path.join(__dirname, '..', '..', 'data')
const GOLDEN_DIR = path.join(DATA_ROOT, 'golden-dataset')

interface GoldenQuestion {
  enunciado: string
  opciones: string[]
  correcta: number
  fuente: string
  enunciado_words: number
  opcion_media_words: number
  es_negativa: boolean
}

interface DatasetMetrics {
  slug: string
  count: number
  enunciado: { mean: number; median: number; stdev: number }
  opciones: { mean: number; median: number }
  negativePct: number
  correctaDist: [number, number, number, number]
  correctaEntropy: number  // 1.0 = perfectly balanced, <0.8 = biased
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stdev(nums: number[]): number {
  if (nums.length <= 1) return 0
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  const variance = nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (nums.length - 1)
  return Math.sqrt(variance)
}

function entropy(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  let h = 0
  for (const c of counts) {
    if (c === 0) continue
    const p = c / total
    h -= p * Math.log2(p)
  }
  return h / Math.log2(counts.length)  // normalize to [0, 1]
}

function analyzeDataset(slug: string, questions: GoldenQuestion[]): DatasetMetrics {
  const enunciadoLengths = questions.map(q => q.enunciado_words || wordCount(q.enunciado))

  const opcionLengths: number[] = []
  for (const q of questions) {
    if (q.opcion_media_words && !isNaN(q.opcion_media_words)) {
      opcionLengths.push(q.opcion_media_words)
    } else if (Array.isArray(q.opciones)) {
      opcionLengths.push(Math.round(q.opciones.reduce((s, o) => s + wordCount(String(o)), 0) / q.opciones.length))
    }
  }

  const negCount = questions.filter(q => q.es_negativa).length

  const dist: [number, number, number, number] = [0, 0, 0, 0]
  for (const q of questions) {
    if (q.correcta >= 0 && q.correcta <= 3) dist[q.correcta]++
  }

  return {
    slug,
    count: questions.length,
    enunciado: {
      mean: Math.round(enunciadoLengths.reduce((a, b) => a + b, 0) / enunciadoLengths.length),
      median: Math.round(median(enunciadoLengths)),
      stdev: Math.round(stdev(enunciadoLengths)),
    },
    opciones: {
      mean: opcionLengths.length > 0 ? Math.round(opcionLengths.reduce((a, b) => a + b, 0) / opcionLengths.length) : 0,
      median: Math.round(median(opcionLengths)),
    },
    negativePct: Math.round((negCount / questions.length) * 100),
    correctaDist: dist,
    correctaEntropy: parseFloat(entropy(dist).toFixed(3)),
  }
}

function main() {
  console.log('📊 OpoRuta — Question Quality Evaluation (FASE Q.4.2)')
  console.log('=======================================================')
  console.log(`PROMPT_VERSION: check lib/ai/generate-test.ts for current version\n`)

  const files = fs.readdirSync(GOLDEN_DIR).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.log('❌ No golden datasets found. Run: pnpm build:golden')
    process.exit(1)
  }

  const results: DatasetMetrics[] = []

  for (const file of files.sort()) {
    const slug = file.replace('.json', '')
    const questions = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, file), 'utf-8')) as GoldenQuestion[]
    const metrics = analyzeDataset(slug, questions)
    results.push(metrics)
  }

  // Print table
  console.log('| Oposición | N | Enunc (μ±σ) | Opc (μ) | Neg% | Correcta A/B/C/D | Entropy |')
  console.log('|-----------|---|-------------|---------|------|-----------------|---------|')
  for (const m of results) {
    const [a, b, c, d] = m.correctaDist
    console.log(
      `| ${m.slug.padEnd(25)} | ${String(m.count).padStart(2)} ` +
      `| ${m.enunciado.mean}±${m.enunciado.stdev} `.padEnd(14) +
      `| ${String(m.opciones.mean).padStart(5)} ` +
      `| ${String(m.negativePct).padStart(3)}% ` +
      `| ${a}/${b}/${c}/${d} `.padEnd(18) +
      `| ${m.correctaEntropy.toFixed(2).padStart(5)} |`
    )
  }

  // Quality scores
  console.log('\n📋 Calidad del golden dataset:')
  for (const m of results) {
    const issues: string[] = []
    if (m.count < 15) issues.push(`solo ${m.count} preguntas (min 15)`)
    if (m.correctaEntropy < 0.7) issues.push(`correcta desbalanceada (entropy ${m.correctaEntropy})`)
    if (m.enunciado.stdev < 3) issues.push(`poca variedad en longitud (stdev ${m.enunciado.stdev})`)
    if (m.negativePct === 0 && m.count >= 15) issues.push('0% negativas — dataset podría no representar preguntas inversas')

    if (issues.length === 0) {
      console.log(`  ✅ ${m.slug}: dataset representativo`)
    } else {
      console.log(`  ⚠️  ${m.slug}: ${issues.join('; ')}`)
    }
  }

  // Save metrics
  const metricsPath = path.join(DATA_ROOT, 'golden-dataset', '_metrics.json')
  fs.writeFileSync(metricsPath, JSON.stringify(results, null, 2))
  console.log(`\n💾 Métricas guardadas: ${metricsPath}`)
  console.log('\n📌 Para comparar con IA: pnpm eval:quality --generate (requiere API key, ~$2)')
}

main()
