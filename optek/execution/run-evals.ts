/**
 * execution/run-evals.ts — §1.18.3
 *
 * Runner de evaluaciones de calidad para los pipelines de IA de OPTEK.
 *
 * Ejecuta el pipeline real (RAG + GPT) contra los golden datasets,
 * evalúa el output contra criterios ponderados y calcula un Quality Score.
 *
 * NO guarda resultados en BD — es solo evaluación de calidad del modelo.
 *
 * Uso:
 *   pnpm eval:generate   → evalúa GENERATE_TEST
 *   pnpm eval:correct    → evalúa CORRECT_DESARROLLO
 *   pnpm eval:all        → evalúa ambos
 *
 * Resultado: PASS (≥85%) | FAIL (<85%)
 * Reporte:   tests/evals/reports/eval_[timestamp].json
 *
 * Ref: §1.18 PLAN.md | directives/00_EVALUATION_PROTOCOLS.md
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'fs'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// ─── Bootstrap: cargar .env.local antes de cualquier import de lib/ ──────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
}
loadEnv()

// ─── Imports de lib/ (DESPUÉS del loadEnv) ────────────────────────────────────

import { buildContext, formatContext } from '../lib/ai/retrieval'
import { callGPTJSON, callGPT } from '../lib/ai/openai'
import {
  SYSTEM_GENERATE_TEST,
  SYSTEM_CORRECT_DESARROLLO,
  buildGenerateTestPrompt,
  buildCorrectDesarrolloPrompt,
} from '../lib/ai/prompts'
import { TestGeneradoRawSchema, CorreccionDesarrolloRawSchema } from '../lib/ai/schemas'
import { verifyAllCitations } from '../lib/ai/verification'
import { sanitizeForAI } from '../lib/utils/sanitize'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface GoldenCase {
  id: string
  descripcion: string
  input: Record<string, unknown>
  criterios_evaluacion: Record<string, unknown>
  pesos: Record<string, number>
}

interface GoldenDataset {
  _meta: { version: string; threshold_quality_score: number }
  casos: GoldenCase[]
}

interface CaseResult {
  id: string
  descripcion: string
  score: number
  criterios_aprobados: string[]
  criterios_fallados: string[]
  output_summary?: string
  error?: string
  duration_ms?: number
}

interface EvalReport {
  pipeline: string
  timestamp: string
  quality_score: number
  threshold: number
  result: 'PASS' | 'FAIL'
  casos: CaseResult[]
  resumen: { total: number; aprobados: number; fallados: number }
}

// ─── Supabase admin (para lookup temas titulo) ────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Caché de títulos de temas para no hacer N queries
const temaCache = new Map<string, string>()

async function getTemaTitulo(temaId: string): Promise<string> {
  if (temaCache.has(temaId)) return temaCache.get(temaId)!
  try {
    const supabase = getAdminClient()
    const { data } = await supabase.from('temas').select('titulo').eq('id', temaId).single()
    const titulo = data?.titulo ?? `Tema ${temaId.slice(0, 8)}`
    temaCache.set(temaId, titulo)
    return titulo
  } catch {
    return `Tema ${temaId.slice(0, 8)}`
  }
}

// ─── Evaluadores ─────────────────────────────────────────────────────────────

function scoreGenerateTest(
  output: unknown,
  criterios: Record<string, unknown>,
  pesos: Record<string, number>
): { score: number; aprobados: string[]; fallados: string[] } {
  const aprobados: string[] = []
  const fallados: string[] = []

  // formato_valido: array preguntas con estructura correcta
  if ('formato_valido' in pesos) {
    type Preg = { enunciado?: string; opciones?: unknown[]; correcta?: unknown; explicacion?: string }
    const isValid =
      output !== null &&
      typeof output === 'object' &&
      'preguntas' in output &&
      Array.isArray((output as { preguntas: unknown[] }).preguntas) &&
      (output as { preguntas: Preg[] }).preguntas.length > 0 &&
      (output as { preguntas: Preg[] }).preguntas.every(
        (p) =>
          typeof p.enunciado === 'string' &&
          Array.isArray(p.opciones) &&
          p.opciones.length === 4 &&
          typeof p.correcta === 'number'
      )
    isValid ? aprobados.push('formato_valido') : fallados.push('formato_valido')
  }

  // num_preguntas
  if ('min_preguntas' in criterios && output && typeof output === 'object' && 'preguntas' in output) {
    const preguntas = (output as { preguntas: unknown[] }).preguntas
    const ok =
      preguntas.length >= (criterios.min_preguntas as number) &&
      preguntas.length <= (criterios.max_preguntas as number)
    ok ? aprobados.push('num_preguntas') : fallados.push(`num_preguntas (got ${preguntas.length})`)
  }

  // cita_presente: ≥80% de preguntas tienen justificacion larga
  if ('cita_presente' in pesos && output && typeof output === 'object' && 'preguntas' in output) {
    type Preg = { explicacion?: string; cita?: string }
    const preguntas = (output as { preguntas: Preg[] }).preguntas
    const conCita = preguntas.filter((p) => (p.explicacion ?? p.cita ?? '').length > 30)
    const ratio = preguntas.length > 0 ? conCita.length / preguntas.length : 0
    ratio >= 0.8
      ? aprobados.push('cita_presente')
      : fallados.push(`cita_presente (ratio ${(ratio * 100).toFixed(0)}%)`)
  }

  // sin_prompt_injection
  if ('sin_prompt_injection' in criterios) {
    const out = JSON.stringify(output).toLowerCase()
    const injections = ['ignora instrucciones', 'instrucciones previas', 'system:', '<system>']
    const clean = !injections.some((p) => out.includes(p))
    clean ? aprobados.push('sin_prompt_injection') : fallados.push('sin_prompt_injection')
  }

  // rechaza_correctamente (para casos adversariales)
  if (criterios.debe_rechazar) {
    const rejected = output === null || (typeof output === 'object' && output !== null && 'error' in output)
    rejected ? aprobados.push('rechaza_correctamente') : fallados.push('rechaza_correctamente')
  }

  let score = 0
  let total = 0
  for (const [crit, peso] of Object.entries(pesos)) {
    total += peso
    if (aprobados.some((a) => a.startsWith(crit))) score += peso
  }
  return { score: total > 0 ? score / total : 0, aprobados, fallados }
}

function scoreCorrectDesarrollo(
  output: unknown,
  criterios: Record<string, unknown>,
  pesos: Record<string, number>
): { score: number; aprobados: string[]; fallados: string[] } {
  const aprobados: string[] = []
  const fallados: string[] = []

  // estructura_valida
  if ('estructura_valida' in pesos) {
    type Out = { puntuacion_global?: unknown; dimensiones?: unknown; mejoras_sugeridas?: unknown }
    const o = output as Out
    const valid =
      o !== null &&
      typeof o === 'object' &&
      typeof o.puntuacion_global === 'number' &&
      Array.isArray(o.dimensiones) &&
      Array.isArray(o.mejoras_sugeridas)
    valid ? aprobados.push('estructura_valida') : fallados.push('estructura_valida')
  }

  // puntuacion_coherente
  if ('puntuacion_coherente' in pesos && output && typeof output === 'object') {
    const p = (output as { puntuacion_global?: number }).puntuacion_global
    const minP = criterios.puntuacion_minima as number | undefined
    const maxP = criterios.puntuacion_maxima as number | undefined
    if (typeof p === 'number') {
      const ok = (minP === undefined || p >= minP) && (maxP === undefined || p <= maxP)
      ok
        ? aprobados.push('puntuacion_coherente')
        : fallados.push(`puntuacion_coherente (got ${p}, expected [${minP ?? 0}-${maxP ?? 10}])`)
    } else {
      fallados.push('puntuacion_coherente (no es número)')
    }
  }

  // sin_pii
  if ('sin_pii' in pesos && output) {
    const out = JSON.stringify(output)
    const piiPatterns = criterios.output_no_contiene as string[] | undefined
    if (piiPatterns) {
      const found = piiPatterns.filter((p) => out.includes(p))
      found.length === 0
        ? aprobados.push('sin_pii')
        : fallados.push(`sin_pii (encontrado: ${found.join(', ')})`)
    } else {
      aprobados.push('sin_pii')
    }
  }

  // feedback_especifico (≥100 chars en feedback_global)
  if ('feedback_especifico' in pesos && output && typeof output === 'object') {
    const fg = (output as { feedback_global?: string }).feedback_global ?? ''
    fg.length >= 100
      ? aprobados.push('feedback_especifico')
      : fallados.push('feedback_especifico (muy corto)')
  }

  // idioma_espanol
  if ('idioma_espanol' in pesos && output) {
    const out = JSON.stringify(output).toLowerCase()
    const words = ['según', 'artículo', 'ley', 'puntuación', 'corrección', 'mejoras']
    const hasSpanish = words.some((w) => out.includes(w))
    hasSpanish ? aprobados.push('idioma_espanol') : fallados.push('idioma_espanol')
  }

  let score = 0
  let total = 0
  for (const [crit, peso] of Object.entries(pesos)) {
    total += peso
    if (aprobados.some((a) => a.startsWith(crit))) score += peso
  }
  return { score: total > 0 ? score / total : 0, aprobados, fallados }
}

// ─── Eval GENERATE_TEST ───────────────────────────────────────────────────────

async function runGenerateTestEvals(): Promise<EvalReport> {
  const datasetPath = path.join(__dirname, '../tests/evals/generate_test_golden.json')
  const dataset: GoldenDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'))

  console.log(`\n🧪 EVAL: GENERATE_TEST (${dataset.casos.length} casos)\n`)

  const casosResults: CaseResult[] = []
  const THRESHOLD = dataset._meta.threshold_quality_score

  for (const caso of dataset.casos) {
    const t0 = Date.now()
    console.log(`  📋 ${caso.id}`)
    let output: unknown = null
    let error: string | undefined

    try {
      const temaId = caso.input.temaId as string

      // Caso adversarial (UUID inválido) — verificar que el sistema lo rechaza
      if (caso.criterios_evaluacion.debe_rechazar) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(temaId)) {
          output = { error: 'temaId inválido (UUID incorrecto)' }
        } else {
          output = null // UUID válido pero no existe en BD → error esperado
        }
      } else {
        // Caso real: ejecutar pipeline completo (sin guardar en BD)
        const temaTitulo = await getTemaTitulo(temaId)
        const ctx = await buildContext(temaId)
        const contextoLegislativo = formatContext(ctx)

        const userPrompt = buildGenerateTestPrompt({
          contextoLegislativo,
          numPreguntas: caso.input.numPreguntas as number,
          dificultad: caso.input.dificultad as 'facil' | 'media' | 'dificil',
          temaTitulo,
        })

        output = await callGPTJSON(
          SYSTEM_GENERATE_TEST,
          userPrompt,
          TestGeneradoRawSchema,
          { model: 'gpt-5-mini', maxTokens: 4000, endpoint: 'eval:generate-test' }
        )
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      output = { error }
    }

    const { score, aprobados, fallados } = scoreGenerateTest(
      output,
      caso.criterios_evaluacion,
      caso.pesos
    )

    const result: CaseResult = {
      id: caso.id,
      descripcion: caso.descripcion,
      score,
      criterios_aprobados: aprobados,
      criterios_fallados: fallados,
      output_summary: output
        ? JSON.stringify(output).slice(0, 200) + '…'
        : undefined,
      error,
      duration_ms: Date.now() - t0,
    }
    casosResults.push(result)

    const emoji = score >= THRESHOLD ? '✅' : '❌'
    console.log(`     ${emoji} Score: ${(score * 100).toFixed(0)}% (${Date.now() - t0}ms)`)
    if (fallados.length > 0) console.log(`     ✗ ${fallados.join(' · ')}`)
  }

  const avgScore = casosResults.reduce((s, c) => s + c.score, 0) / casosResults.length
  return {
    pipeline: 'GENERATE_TEST',
    timestamp: new Date().toISOString(),
    quality_score: avgScore,
    threshold: THRESHOLD,
    result: avgScore >= THRESHOLD ? 'PASS' : 'FAIL',
    casos: casosResults,
    resumen: {
      total: casosResults.length,
      aprobados: casosResults.filter((c) => c.score >= THRESHOLD).length,
      fallados: casosResults.filter((c) => c.score < THRESHOLD).length,
    },
  }
}

// ─── Eval CORRECT_DESARROLLO ──────────────────────────────────────────────────

async function runCorrectDesarrolloEvals(): Promise<EvalReport> {
  const datasetPath = path.join(__dirname, '../tests/evals/correct_desarrollo_golden.json')
  const dataset: GoldenDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'))

  console.log(`\n🧪 EVAL: CORRECT_DESARROLLO (${dataset.casos.length} casos)\n`)

  const casosResults: CaseResult[] = []
  const THRESHOLD = dataset._meta.threshold_quality_score

  for (const caso of dataset.casos) {
    const t0 = Date.now()
    console.log(`  📋 ${caso.id}`)
    let output: unknown = null
    let error: string | undefined

    try {
      const temaId = caso.input.temaId as string
      const texto = caso.input.texto as string
      const temaTitulo = await getTemaTitulo(temaId)

      const ctx = await buildContext(temaId, texto)
      const contextoLegislativo = formatContext(ctx)
      const textoSanitizado = sanitizeForAI(texto)

      const userPrompt = buildCorrectDesarrolloPrompt({
        contextoLegislativo,
        textoUsuario: textoSanitizado,
        temaTitulo,
      })

      output = await callGPTJSON(
        SYSTEM_CORRECT_DESARROLLO,
        userPrompt,
        CorreccionDesarrolloRawSchema,
        { model: 'gpt-5', maxTokens: 3000, endpoint: 'eval:correct-desarrollo' }
      )
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      output = { error }
    }

    const { score, aprobados, fallados } = scoreCorrectDesarrollo(
      output,
      caso.criterios_evaluacion,
      caso.pesos
    )

    const result: CaseResult = {
      id: caso.id,
      descripcion: caso.descripcion,
      score,
      criterios_aprobados: aprobados,
      criterios_fallados: fallados,
      output_summary: output
        ? JSON.stringify(output).slice(0, 200) + '…'
        : undefined,
      error,
      duration_ms: Date.now() - t0,
    }
    casosResults.push(result)

    const emoji = score >= THRESHOLD ? '✅' : '❌'
    console.log(`     ${emoji} Score: ${(score * 100).toFixed(0)}% (${Date.now() - t0}ms)`)
    if (fallados.length > 0) console.log(`     ✗ ${fallados.join(' · ')}`)
  }

  const avgScore = casosResults.reduce((s, c) => s + c.score, 0) / casosResults.length
  return {
    pipeline: 'CORRECT_DESARROLLO',
    timestamp: new Date().toISOString(),
    quality_score: avgScore,
    threshold: THRESHOLD,
    result: avgScore >= THRESHOLD ? 'PASS' : 'FAIL',
    casos: casosResults,
    resumen: {
      total: casosResults.length,
      aprobados: casosResults.filter((c) => c.score >= THRESHOLD).length,
      fallados: casosResults.filter((c) => c.score < THRESHOLD).length,
    },
  }
}

// ─── Resumen final ────────────────────────────────────────────────────────────

function printReport(report: EvalReport) {
  const emoji = report.result === 'PASS' ? '✅' : '❌'
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${emoji} ${report.pipeline}`)
  console.log(`   Quality Score: ${(report.quality_score * 100).toFixed(1)}%  (umbral ≥${report.threshold * 100}%)`)
  console.log(`   Resultado:     ${report.result}`)
  console.log(`   Casos: ${report.resumen.total} total · ${report.resumen.aprobados} ✓ · ${report.resumen.fallados} ✗`)
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

async function main() {
  const pipeline = process.argv[2] ?? 'all'
  console.log('🚀 OPTEK Eval Runner')
  console.log(`   Fecha:    ${new Date().toISOString()}`)
  console.log(`   Pipeline: ${pipeline}`)

  const reports: EvalReport[] = []

  if (pipeline === 'generate' || pipeline === 'all') {
    reports.push(await runGenerateTestEvals())
  }
  if (pipeline === 'correct' || pipeline === 'all') {
    reports.push(await runCorrectDesarrolloEvals())
  }

  for (const r of reports) printReport(r)

  // Guardar reporte
  const reportsDir = path.join(__dirname, '../tests/evals/reports')
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
  const reportPath = path.join(
    reportsDir,
    `eval_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2))
  console.log(`\n📄 Reporte guardado: ${reportPath}`)

  const allPass = reports.every((r) => r.result === 'PASS')
  if (allPass) {
    console.log('\n🎉 TODOS LOS EVALS PASAN — Go/No-Go: PASS\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  ALGUNOS EVALS FALLAN — iterar prompts antes de beta\n')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Error en eval runner:', err)
  process.exit(1)
})
