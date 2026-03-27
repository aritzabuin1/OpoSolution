#!/usr/bin/env tsx
/**
 * extract-supuestos-c1-modeloB.ts
 *
 * Extracts supuestos practicos from C1 2024 modelo B exam PDF:
 *   Step 1: Extract answer key from plantilla_b.pdf
 *   Step 2: Extract supuesto cases + questions from examen_b.pdf
 *   Step 3: Merge and save
 *
 * Usage: npx tsx optek/execution/extract-supuestos-c1-modeloB.ts
 * Cost: ~$0.10-0.15 (2 Claude API calls with PDF)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnvLocal()

// ─── Paths ───────────────────────────────────────────────────────────────────

const DATA_ROOT = path.join(__dirname, '..', '..', 'data')
const EXAM_DIR = path.join(DATA_ROOT, 'examenes_c1', '2024')
const PDF_EXAM = path.join(EXAM_DIR, 'examen_b.pdf')
const PDF_PLANTILLA = path.join(EXAM_DIR, 'plantilla_b.pdf')
const OUTPUT_PLANTILLA = path.join(EXAM_DIR, 'supuesto_plantilla_b.json')
const OUTPUT_RAW = path.join(EXAM_DIR, 'supuestos_b_raw.json')
const OUTPUT_FINAL = path.join(EXAM_DIR, 'supuestos_b.json')

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlantillaPregunta {
  numero: number
  correcta: number | null
  anulada: boolean
}

interface PlantillaReserva {
  numero: number
  correcta: number
}

interface PlantillaSupuesto {
  id: string
  titulo: string
  preguntas: PlantillaPregunta[]
  preguntas_reserva: PlantillaReserva[]
}

interface PreguntaRaw {
  numero: number
  enunciado: string
  opciones: [string, string, string, string]
}

interface SupuestoRaw {
  titulo: string
  escenario: string
  preguntas: PreguntaRaw[]
  reserva: PreguntaRaw[]
}

interface PreguntaFinal {
  numero: number
  enunciado: string
  opciones: [string, string, string, string]
  correcta: number | null
  anulada: boolean
}

interface SupuestoFinal {
  id: string
  titulo: string
  escenario: string
  preguntas: PreguntaFinal[]
  preguntas_reserva: { numero: number; enunciado: string; opciones: [string, string, string, string]; correcta: number }[]
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Extract Supuestos C1 2024 Modelo B ===\n')

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1) }
  if (!fs.existsSync(PDF_EXAM)) { console.error(`Exam PDF not found: ${PDF_EXAM}`); process.exit(1) }
  if (!fs.existsSync(PDF_PLANTILLA)) { console.error(`Plantilla PDF not found: ${PDF_PLANTILLA}`); process.exit(1) }

  const client = new Anthropic({ apiKey })

  // ── Step 1: Extract answer key from plantilla_b.pdf ─────────────────────

  console.log('Step 1: Extracting answer key from plantilla_b.pdf...')
  const plantillaPdf = fs.readFileSync(PDF_PLANTILLA).toString('base64')

  const plantillaResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: plantillaPdf },
        },
        {
          type: 'text',
          text: `Este es la plantilla de respuestas definitiva del examen C1 Administrativo del Estado 2024, MODELO B.

Busca la seccion de la SEGUNDA PARTE (Supuesto Practico). Hay DOS supuestos, cada uno con 20 preguntas + 5 de reserva.

Para cada pregunta, extrae el numero y la respuesta correcta como indice 0-based:
  a = 0, b = 1, c = 2, d = 3

Si alguna pregunta esta ANULADA, pon correcta: null y anulada: true.

Devuelve SOLO JSON valido:
{
  "supuestos": [
    {
      "id": "supuesto_1",
      "titulo": "Supuesto I",
      "preguntas": [
        { "numero": 1, "correcta": 3, "anulada": false }
      ],
      "preguntas_reserva": [
        { "numero": 1, "correcta": 1 }
      ]
    }
  ]
}`,
        },
      ],
    }],
  })

  const plantillaText = (plantillaResponse.content[0] as { type: 'text'; text: string }).text
  console.log(`  Tokens: input=${plantillaResponse.usage.input_tokens}, output=${plantillaResponse.usage.output_tokens}`)

  const plantillaJson = JSON.parse(plantillaText.replace(/```json\n?|\n?```/g, '').trim())

  const plantillaData = {
    convocatoria: '2024',
    anno: 2024,
    turno: 'libre',
    modelo: 'B',
    cuerpo: 'Cuerpo General Administrativo de la Administración del Estado',
    parte: 'Segunda parte — Supuesto Práctico',
    supuestos: plantillaJson.supuestos as PlantillaSupuesto[],
  }

  fs.writeFileSync(OUTPUT_PLANTILLA, JSON.stringify(plantillaData, null, 2), 'utf-8')
  console.log(`  Saved: ${OUTPUT_PLANTILLA}`)

  for (const sup of plantillaData.supuestos) {
    const anuladas = sup.preguntas.filter(p => p.anulada).length
    console.log(`  ${sup.titulo}: ${sup.preguntas.length} preguntas, ${sup.preguntas_reserva.length} reserva, ${anuladas} anuladas`)
  }

  // ── Step 2: Extract supuestos from examen_b.pdf ─────────────────────────

  console.log('\nStep 2: Extracting supuestos from examen_b.pdf...')
  const examPdf = fs.readFileSync(PDF_EXAM).toString('base64')

  const examResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: examPdf },
        },
        {
          type: 'text',
          text: `Este es un examen oficial de oposiciones C1 Administrativo del Estado (2024, modelo B).

Las ULTIMAS PAGINAS contienen la "Segunda Parte: Supuesto Practico" con DOS supuestos (Supuesto I y Supuesto II).

Extrae SOLO la Segunda Parte (supuestos practicos). NO extraigas la primera parte (cuestionario).

Para cada supuesto, extrae:
1. El TITULO exacto (e.g. "SUPUESTO I")
2. El ESCENARIO completo: el texto narrativo del caso practico. Copia INTEGRO, sin resumir.
3. Las 20 PREGUNTAS numeradas (1-20), cada una con 4 opciones (a, b, c, d). Texto INTEGRO.
4. Las PREGUNTAS DE RESERVA (normalmente 5 por supuesto).

IMPORTANTE:
- El escenario es el texto largo antes de la pregunta 1
- Mantener la numeracion original
- Incluir TODO el texto, sin abreviar
- Las opciones NO deben incluir la letra inicial (a/b/c/d)

Devuelve SOLO JSON valido:
{
  "supuestos": [
    {
      "titulo": "SUPUESTO I",
      "escenario": "texto completo...",
      "preguntas": [
        { "numero": 1, "enunciado": "texto", "opciones": ["op a", "op b", "op c", "op d"] }
      ],
      "reserva": [
        { "numero": 1, "enunciado": "texto", "opciones": ["op a", "op b", "op c", "op d"] }
      ]
    }
  ]
}`,
        },
      ],
    }],
  })

  const examText = (examResponse.content[0] as { type: 'text'; text: string }).text
  console.log(`  Tokens: input=${examResponse.usage.input_tokens}, output=${examResponse.usage.output_tokens}`)

  const rawData: { supuestos: SupuestoRaw[] } = JSON.parse(examText.replace(/```json\n?|\n?```/g, '').trim())
  fs.writeFileSync(OUTPUT_RAW, JSON.stringify(rawData, null, 2), 'utf-8')
  console.log(`  Saved raw: ${OUTPUT_RAW}`)

  for (const sup of rawData.supuestos) {
    console.log(`  ${sup.titulo}: ${sup.preguntas.length} preguntas + ${sup.reserva.length} reserva, escenario ${sup.escenario.length} chars`)
  }

  // ── Step 3: Merge with answer key ───────────────────────────────────────

  console.log('\nStep 3: Merging with answer key...')

  const supuestosFinales: SupuestoFinal[] = rawData.supuestos.map((raw, idx) => {
    const plantillaSup = plantillaData.supuestos[idx]
    if (!plantillaSup) {
      console.warn(`  WARNING: No answer key for supuesto ${idx + 1}!`)
    }

    const preguntas: PreguntaFinal[] = raw.preguntas.map((p) => {
      const pk = plantillaSup?.preguntas?.find((pp) => pp.numero === p.numero)
      return {
        numero: p.numero,
        enunciado: p.enunciado,
        opciones: p.opciones,
        correcta: pk?.correcta ?? null,
        anulada: pk?.anulada ?? false,
      }
    })

    const preguntas_reserva = raw.reserva.map((r) => {
      const rk = plantillaSup?.preguntas_reserva?.find((pr) => pr.numero === r.numero)
      return {
        numero: r.numero,
        enunciado: r.enunciado,
        opciones: r.opciones,
        correcta: rk?.correcta ?? 0,
      }
    })

    return {
      id: `supuesto_${idx + 1}`,
      titulo: raw.titulo,
      escenario: raw.escenario,
      preguntas,
      preguntas_reserva,
    }
  })

  const finalData = {
    convocatoria: '2024',
    anno: 2024,
    turno: 'libre',
    modelo: 'B',
    cuerpo: 'Cuerpo General Administrativo de la Administración del Estado',
    parte: 'Segunda parte - Supuesto Práctico',
    supuestos: supuestosFinales,
  }

  fs.writeFileSync(OUTPUT_FINAL, JSON.stringify(finalData, null, 2), 'utf-8')
  console.log(`\nFinal output saved: ${OUTPUT_FINAL}`)

  // ── Validation ──────────────────────────────────────────────────────────

  let totalPreguntas = 0
  let totalReserva = 0
  let missingCorrecta = 0
  let anuladas = 0

  for (const sup of supuestosFinales) {
    totalPreguntas += sup.preguntas.length
    totalReserva += sup.preguntas_reserva.length
    missingCorrecta += sup.preguntas.filter(p => p.correcta === null && !p.anulada).length
    anuladas += sup.preguntas.filter(p => p.anulada).length
  }

  console.log(`\n=== Validation ===`)
  console.log(`  Supuestos: ${supuestosFinales.length}`)
  console.log(`  Preguntas: ${totalPreguntas} (expected 40)`)
  console.log(`  Reserva: ${totalReserva} (expected 10)`)
  console.log(`  Anuladas: ${anuladas}`)
  console.log(`  Missing correcta: ${missingCorrecta}`)

  if (missingCorrecta > 0) {
    console.warn(`\n  ⚠️ ${missingCorrecta} preguntas sin respuesta correcta — revisar plantilla`)
  }
  if (totalPreguntas !== 40) {
    console.warn(`\n  ⚠️ Expected 40 preguntas, got ${totalPreguntas}`)
  }

  console.log(`\nDone! Next step: run pnpm ingest:supuestos to load into supuesto_bank`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
