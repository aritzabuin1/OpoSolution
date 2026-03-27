/**
 * execution/eval-question-quality.ts — FASE Q.4.2
 *
 * Compara métricas de estilo entre el golden dataset (preguntas oficiales) y
 * las preguntas que genera el prompt actual.
 *
 * Modo 1 (sin coste): Solo analiza golden dataset y muestra baseline metrics
 * Modo 2 (--generate, ~$2): Genera preguntas IA para cada oposición y compara
 *
 * Uso:
 *   pnpm eval:quality              ← modo 1: solo baseline
 *   pnpm eval:quality --generate   ← modo 2: genera + compara
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_ROOT = path.join(__dirname, '..', '..', 'data')
const GOLDEN_DIR = path.join(DATA_ROOT, 'golden-dataset')

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}

loadEnvLocal()

// ─── Types ───────────────────────────────────────────────────────────────────

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
  source: 'golden' | 'ai'
  count: number
  enunciado: { mean: number; median: number; stdev: number }
  opciones: { mean: number; median: number }
  negativePct: number
  correctaDist: [number, number, number, number]
  correctaEntropy: number
}

interface ComparisonScore {
  slug: string
  enunciadoDelta: number    // |AI_mean - golden_mean| / golden_mean
  opcionesDelta: number
  negativeDelta: number     // |AI_neg% - golden_neg%|
  entropyDelta: number
  overallScore: number      // 0-100, higher = closer to golden
}

const NEGATIVE_PATTERNS = [
  /no es correct/i, /incorrect/i, /señale.*incorrecta/i,
  /no es cierto/i, /cuál.*no.*es/i, /falsa/i,
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function med(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function sd(nums: number[]): number {
  if (nums.length <= 1) return 0
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  return Math.sqrt(nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (nums.length - 1))
}

function entropyNorm(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  let h = 0
  for (const c of counts) {
    if (c === 0) continue
    const p = c / total
    h -= p * Math.log2(p)
  }
  return h / Math.log2(counts.length)
}

function analyzeQuestions(slug: string, questions: Array<{ enunciado: string; opciones: string[]; correcta: number }>, source: 'golden' | 'ai'): DatasetMetrics {
  const enunciadoLengths = questions.map(q => wordCount(q.enunciado))
  const opcionLengths = questions.flatMap(q => {
    const opts = Array.isArray(q.opciones) ? q.opciones : Object.values(q.opciones as Record<string, unknown>)
    return opts.map(o => wordCount(String(o)))
  })
  const negCount = questions.filter(q => NEGATIVE_PATTERNS.some(p => p.test(q.enunciado))).length
  const dist: [number, number, number, number] = [0, 0, 0, 0]
  for (const q of questions) {
    const c = q.correcta
    if (c >= 0 && c <= 3) dist[c as 0 | 1 | 2 | 3]++
  }

  return {
    slug, source, count: questions.length,
    enunciado: {
      mean: Math.round(enunciadoLengths.reduce((a, b) => a + b, 0) / enunciadoLengths.length),
      median: Math.round(med(enunciadoLengths)),
      stdev: Math.round(sd(enunciadoLengths)),
    },
    opciones: {
      mean: opcionLengths.length > 0 ? Math.round(opcionLengths.reduce((a, b) => a + b, 0) / opcionLengths.length) : 0,
      median: Math.round(med(opcionLengths)),
    },
    negativePct: Math.round((negCount / questions.length) * 100),
    correctaDist: dist,
    correctaEntropy: parseFloat(entropyNorm(dist).toFixed(3)),
  }
}

function compareMetrics(golden: DatasetMetrics, ai: DatasetMetrics): ComparisonScore {
  const eDelta = golden.enunciado.mean > 0 ? Math.abs(ai.enunciado.mean - golden.enunciado.mean) / golden.enunciado.mean : 0
  const oDelta = golden.opciones.mean > 0 ? Math.abs(ai.opciones.mean - golden.opciones.mean) / golden.opciones.mean : 0
  const nDelta = Math.abs(ai.negativePct - golden.negativePct) / 100
  const entDelta = Math.abs(ai.correctaEntropy - golden.correctaEntropy)

  // Score 0-100: each factor weighted, lower delta = higher score
  const score = Math.max(0, Math.round(
    100 - (eDelta * 30) - (oDelta * 30) - (nDelta * 20) - (entDelta * 20)
  ))

  return {
    slug: golden.slug,
    enunciadoDelta: parseFloat((eDelta * 100).toFixed(1)),
    opcionesDelta: parseFloat((oDelta * 100).toFixed(1)),
    negativeDelta: parseFloat((nDelta * 100).toFixed(1)),
    entropyDelta: parseFloat((entDelta * 100).toFixed(1)),
    overallScore: score,
  }
}

// ─── AI Generation ───────────────────────────────────────────────────────────

const STYLE_HINTS: Record<string, string> = {
  'correos': 'Oposiciones de Correos. Preguntas cortas (~17 palabras), directas, sobre productos postales y procesos operativos. Sin penalización.',
  'auxilio-judicial': 'Oposiciones Auxilio Judicial (MJU). Preguntas formales (~27 palabras), opciones ~10 palabras. Cita LEC, LECrim, LOPJ.',
  'tramitacion-procesal': 'Oposiciones Tramitación Procesal (MJU). Preguntas formales (~22 palabras), opciones largas (~15 palabras). 14% preguntas negativas.',
  'gestion-procesal': 'Oposiciones Gestión Procesal (MJU). Preguntas ~23 palabras, opciones largas (~15 palabras). Legislación procesal.',
  'aux-admin-estado': 'Oposiciones Auxiliar Administrativo (INAP, C2). Preguntas ~26 palabras, opciones ~7 palabras. Constitución, LPAC, TREBEP.',
  'administrativo-estado': 'Oposiciones Administrativo del Estado (INAP, C1). Preguntas ~27 palabras, opciones ~11 palabras. LPAC, LRJSP, TREBEP.',
  'gestion-estado': 'Oposiciones GACE A2 (INAP). Preguntas técnicas ~29 palabras, opciones ~13 palabras. LGP, LCSP, TREBEP.',
}

async function generateAIQuestions(slug: string, count: number): Promise<Array<{ enunciado: string; opciones: string[]; correcta: number }>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const openai = new OpenAI({ apiKey })
  const hint = STYLE_HINTS[slug] ?? 'Oposiciones españolas. Genera preguntas tipo test.'

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_completion_tokens: 8000,
    messages: [
      {
        role: 'system',
        content: `Eres un experto en oposiciones españolas. Genera ${count} preguntas tipo test MCQ.

ESTILO: ${hint}

REGLAS:
1. Cada pregunta tiene: enunciado, 4 opciones (A-D), 1 correcta (0-indexed: 0=A, 1=B, 2=C, 3=D).
2. Opciones plausibles pero solo 1 correcta.
3. Distribuye correctas entre 0,1,2,3.
4. Incluye alguna pregunta negativa ("señale la incorrecta") si es representativo del examen.
5. Responde SOLO JSON válido.

Formato:
{"preguntas": [{"enunciado": "...", "opciones": ["A", "B", "C", "D"], "correcta": 2}, ...]}`,
      },
      {
        role: 'user',
        content: `Genera exactamente ${count} preguntas tipo test de ${slug.replace(/-/g, ' ')}. Solo JSON.`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return (parsed.preguntas ?? []).map((p: { enunciado?: string; opciones?: string[]; correcta?: number }) => ({
      enunciado: p.enunciado ?? '',
      opciones: Array.isArray(p.opciones) ? p.opciones : [],
      correcta: typeof p.correcta === 'number' ? p.correcta : 0,
    }))
  } catch {
    return []
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function printTable(label: string, metrics: DatasetMetrics[]) {
  console.log(`\n${label}:`)
  console.log('| Oposición                   |  N | Enunc μ±σ | Opc μ | Neg% | A/B/C/D         | Entr |')
  console.log('|-----------------------------|----|-----------| ------|------|-----------------|------|')
  for (const m of metrics) {
    const [a, b, c, d] = m.correctaDist
    console.log(
      `| ${m.slug.padEnd(27)} | ${String(m.count).padStart(2)} | ${String(m.enunciado.mean).padStart(3)}±${String(m.enunciado.stdev).padEnd(3)} | ${String(m.opciones.mean).padStart(5)} | ${String(m.negativePct).padStart(3)}% | ${a}/${b}/${c}/${d}`.padEnd(92) + ` | ${m.correctaEntropy.toFixed(2)} |`
    )
  }
}

async function main() {
  const generateMode = process.argv.includes('--generate')

  console.log('📊 OpoRuta — Question Quality Evaluation (FASE Q.4.2)')
  console.log(`Mode: ${generateMode ? '🔥 GENERATE + COMPARE (~$2 API cost)' : '📋 BASELINE ONLY (free)'}`)
  console.log('=======================================================\n')

  const files = fs.readdirSync(GOLDEN_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'))
  if (files.length === 0) {
    console.log('❌ No golden datasets found. Run: pnpm build:golden')
    process.exit(1)
  }

  // Analyze golden datasets
  const goldenMetrics: DatasetMetrics[] = []
  const goldenData: Map<string, GoldenQuestion[]> = new Map()

  for (const file of files.sort()) {
    const slug = file.replace('.json', '')
    const questions = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, file), 'utf-8')) as GoldenQuestion[]
    goldenData.set(slug, questions)
    goldenMetrics.push(analyzeQuestions(slug, questions, 'golden'))
  }

  printTable('📋 Golden Dataset (preguntas oficiales)', goldenMetrics)

  if (!generateMode) {
    const metricsPath = path.join(GOLDEN_DIR, '_metrics.json')
    fs.writeFileSync(metricsPath, JSON.stringify(goldenMetrics, null, 2))
    console.log(`\n💾 Métricas: ${metricsPath}`)
    console.log('📌 Añade --generate para comparar con IA (~$2)')
    return
  }

  // Generate AI questions for each oposición
  console.log('\n🤖 Generando preguntas IA para comparación...\n')

  const aiMetrics: DatasetMetrics[] = []
  const comparisons: ComparisonScore[] = []
  const AI_COUNT = 10 // 10 questions per oposición (balances cost vs statistical significance)

  for (const slug of [...goldenData.keys()]) {
    process.stdout.write(`  ${slug}... `)
    try {
      const aiQuestions = await generateAIQuestions(slug, AI_COUNT)
      if (aiQuestions.length === 0) {
        console.log('❌ no questions generated')
        continue
      }
      const aiM = analyzeQuestions(slug, aiQuestions, 'ai')
      aiMetrics.push(aiM)

      const goldenM = goldenMetrics.find(m => m.slug === slug)!
      const comp = compareMetrics(goldenM, aiM)
      comparisons.push(comp)

      console.log(`✅ ${aiQuestions.length}q → score ${comp.overallScore}/100`)
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  printTable('🤖 AI Generated', aiMetrics)

  // Comparison table
  console.log('\n📊 Comparación Golden vs IA (menor delta = mejor):')
  console.log('| Oposición                   | Score | Enunc Δ | Opc Δ | Neg Δ | Entr Δ |')
  console.log('|-----------------------------|-------|---------|-------|-------|--------|')
  for (const c of comparisons.sort((a, b) => b.overallScore - a.overallScore)) {
    const grade = c.overallScore >= 80 ? '🟢' : c.overallScore >= 60 ? '🟡' : '🔴'
    console.log(
      `| ${c.slug.padEnd(27)} | ${grade} ${String(c.overallScore).padStart(3)} | ${String(c.enunciadoDelta).padStart(5)}% | ${String(c.opcionesDelta).padStart(4)}% | ${String(c.negativeDelta).padStart(4)}% | ${String(c.entropyDelta).padStart(5)}% |`
    )
  }

  const avgScore = Math.round(comparisons.reduce((s, c) => s + c.overallScore, 0) / comparisons.length)
  console.log(`\n📈 Puntuación media: ${avgScore}/100`)
  console.log(avgScore >= 80 ? '✅ Las preguntas IA son estilísticamente similares a las oficiales.' :
    avgScore >= 60 ? '🟡 Aceptable, pero hay margen de mejora en estilo.' :
    '🔴 Las preguntas IA difieren significativamente del estilo oficial.')

  // Save full report
  const reportPath = path.join(GOLDEN_DIR, '_eval_report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    goldenMetrics,
    aiMetrics,
    comparisons,
    averageScore: avgScore,
  }, null, 2))
  console.log(`\n💾 Reporte completo: ${reportPath}`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
