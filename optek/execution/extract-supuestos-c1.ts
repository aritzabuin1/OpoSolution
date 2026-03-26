/**
 * extract-supuestos-c1.ts
 *
 * Extracts "Parte 2 - Supuestos Practicos" from C1 2024 exam PDF
 * using Anthropic documents API (native PDF support).
 *
 * Usage: npx tsx optek/execution/extract-supuestos-c1.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

// ─── Load .env.local ─────────────────────────────────────────────────────────

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
const PDF_PATH = path.join(DATA_ROOT, 'examenes_c1', '2024', 'examen_a.pdf')
const PLANTILLA_PATH = path.join(DATA_ROOT, 'examenes_c1', '2024', 'supuesto_plantilla_a.json')
const RAW_OUTPUT = path.join(DATA_ROOT, 'examenes_c1', '2024', 'supuestos_a_raw.json')
const FINAL_OUTPUT = path.join(DATA_ROOT, 'examenes_c1', '2024', 'supuestos_a.json')

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ReservaFinal {
  numero: number
  enunciado: string
  opciones: [string, string, string, string]
  correcta: number
}

interface SupuestoFinal {
  id: string
  titulo: string
  escenario: string
  preguntas: PreguntaFinal[]
  preguntas_reserva: ReservaFinal[]
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Extract Supuestos C1 2024 ===\n')

  // 1. Check PDF exists
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`)
    process.exit(1)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set')
    process.exit(1)
  }

  // 2. Read PDF as base64
  const pdfBuffer = fs.readFileSync(PDF_PATH)
  const pdfBase64 = pdfBuffer.toString('base64')
  console.log(`PDF loaded: ${(pdfBuffer.length / 1024).toFixed(0)} KB`)

  // 3. Call Anthropic with documents API
  const client = new Anthropic({ apiKey })

  console.log('Sending to Claude (documents API)...')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Este es un examen oficial de oposiciones C1 Administrativo del Estado (2024, modelo A).

Las PAGINAS 8-14 contienen la "Segunda Parte: Supuesto Practico" con DOS supuestos (Supuesto I y Supuesto II).

Extrae SOLO la Segunda Parte (supuestos practicos). NO extraigas la primera parte (cuestionario de preguntas 1-100).

Para cada supuesto, extrae:
1. El TITULO exacto (e.g. "SUPUESTO I")
2. El ESCENARIO completo: el texto narrativo del caso practico que describe la situacion. Copia el texto INTEGRO, sin resumir ni omitir nada. Incluye todos los datos, cifras, nombres de organismos, fechas, etc.
3. Las 20 PREGUNTAS numeradas (1-20), cada una con sus 4 opciones (a, b, c, d). Copia el texto INTEGRO de cada enunciado y opcion.
4. Las PREGUNTAS DE RESERVA (normalmente 5 por supuesto), con el mismo formato.

IMPORTANTE:
- El escenario es el texto largo antes de la pregunta 1 de cada supuesto
- Mantener la numeracion original (1-20 para preguntas, 1-5 para reserva)
- Incluir TODO el texto, sin abreviar ni resumir
- Las opciones NO deben incluir la letra inicial (a/b/c/d)

Devuelve SOLO JSON valido (sin markdown, sin code fences), con esta estructura exacta:
{
  "supuestos": [
    {
      "titulo": "SUPUESTO I",
      "escenario": "texto completo del caso...",
      "preguntas": [
        { "numero": 1, "enunciado": "texto pregunta", "opciones": ["opcion a", "opcion b", "opcion c", "opcion d"] }
      ],
      "reserva": [
        { "numero": 1, "enunciado": "texto reserva", "opciones": ["opcion a", "opcion b", "opcion c", "opcion d"] }
      ]
    }
  ]
}`,
          },
        ],
      },
    ],
  })

  // 4. Parse response
  const content = response.content[0]
  if (content.type !== 'text') {
    console.error('Unexpected response type:', content.type)
    process.exit(1)
  }

  console.log(`Response received: ${content.text.length} chars`)
  console.log(`Tokens: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`)

  // Clean possible code fences
  let jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim()

  // Try to parse
  let rawData: { supuestos: SupuestoRaw[] }
  try {
    rawData = JSON.parse(jsonText)
  } catch (e) {
    console.error('Failed to parse JSON. Saving raw response for debugging...')
    fs.writeFileSync(RAW_OUTPUT.replace('.json', '_debug.txt'), content.text, 'utf-8')
    process.exit(1)
  }

  // 5. Save raw extraction
  fs.writeFileSync(RAW_OUTPUT, JSON.stringify(rawData, null, 2), 'utf-8')
  console.log(`\nRaw output saved: ${RAW_OUTPUT}`)

  // Stats
  for (const sup of rawData.supuestos) {
    console.log(`  ${sup.titulo}: ${sup.preguntas.length} preguntas + ${sup.reserva.length} reserva`)
    console.log(`  Escenario: ${sup.escenario.length} chars`)
  }

  // 6. Merge with answer key
  console.log('\nMerging with answer key...')
  const plantilla = JSON.parse(fs.readFileSync(PLANTILLA_PATH, 'utf-8'))

  const supuestosFinales: SupuestoFinal[] = rawData.supuestos.map((raw, idx) => {
    const plantillaSup = plantilla.supuestos[idx]
    if (!plantillaSup) {
      console.warn(`  No answer key for supuesto ${idx + 1}!`)
    }

    // Merge preguntas with correcta
    const preguntas: PreguntaFinal[] = raw.preguntas.map((p) => {
      const plantillaP = plantillaSup?.preguntas?.find((pp: any) => pp.numero === p.numero)
      return {
        numero: p.numero,
        enunciado: p.enunciado,
        opciones: p.opciones,
        correcta: plantillaP?.correcta ?? null,
        anulada: plantillaP?.anulada ?? false,
      }
    })

    // Merge reserva
    const reserva: ReservaFinal[] = raw.reserva.map((r) => {
      const plantillaR = plantillaSup?.preguntas_reserva?.find((pr: any) => pr.numero === r.numero)
      return {
        numero: r.numero,
        enunciado: r.enunciado,
        opciones: r.opciones,
        correcta: plantillaR?.correcta ?? 0,
      }
    })

    return {
      id: `supuesto_${idx + 1}`,
      titulo: raw.titulo,
      escenario: raw.escenario,
      preguntas,
      preguntas_reserva: reserva,
    }
  })

  const finalData = {
    convocatoria: '2024',
    anno: 2024,
    turno: 'libre',
    modelo: 'A',
    cuerpo: 'Cuerpo General Administrativo de la Administracion del Estado',
    parte: 'Segunda parte - Supuesto Practico',
    supuestos: supuestosFinales,
  }

  fs.writeFileSync(FINAL_OUTPUT, JSON.stringify(finalData, null, 2), 'utf-8')
  console.log(`\nFinal output saved: ${FINAL_OUTPUT}`)

  // Validation
  let totalPreguntas = 0
  let totalReserva = 0
  let withCorrectaNull = 0
  let anuladas = 0

  for (const sup of supuestosFinales) {
    totalPreguntas += sup.preguntas.length
    totalReserva += sup.preguntas_reserva.length
    withCorrectaNull += sup.preguntas.filter((p) => p.correcta === null && !p.anulada).length
    anuladas += sup.preguntas.filter((p) => p.anulada).length
  }

  console.log(`\n=== Validation ===`)
  console.log(`  Supuestos: ${supuestosFinales.length}`)
  console.log(`  Preguntas: ${totalPreguntas} (expected 40)`)
  console.log(`  Reserva: ${totalReserva} (expected 10)`)
  console.log(`  Anuladas: ${anuladas}`)
  console.log(`  Missing correcta: ${withCorrectaNull}`)
  console.log(`\nDone!`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
