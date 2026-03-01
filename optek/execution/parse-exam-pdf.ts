/**
 * execution/parse-exam-pdf.ts — OPTEK §1.3.1A
 *
 * Extrae preguntas estructuradas de un PDF de examen oficial.
 *
 * Estrategia:
 *   1. pdf-parse extrae texto raw del cuestionario
 *   2. Intento de parsing determinista con regex (rápido, 0€)
 *   3. Si regex falla (<70% preguntas detectadas) → Claude Haiku analiza el texto
 *   4. Cruza con plantilla de respuestas (texto raw) para añadir correcta: 0|1|2|3
 *   5. Output: data/examenes/[año]/parsed_[modelo].json
 *
 * Uso:
 *   pnpm parse:examenes [año] [modelo]
 *   pnpm parse:examenes 2024 A
 *   pnpm parse:examenes          ← procesa todos los disponibles
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY (solo si el parsing determinista falla)
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import pdfParse from 'pdf-parse'
import Anthropic from '@anthropic-ai/sdk'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const EXAMENES_DIR = path.join(__dirname, '..', '..', 'data', 'examenes')

// ─── Carga .env.local ─────────────────────────────────────────────────────────

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PreguntaParsed {
  numero: number
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  tema_numero: number | null
}

interface ExamenParsed {
  convocatoria: string
  anno: number
  turno: 'libre' | 'interna'
  modelo: string | null
  fuente_url: string | null
  total_preguntas: number
  preguntas: PreguntaParsed[]
}

// ─── Parsing determinista con regex ──────────────────────────────────────────

/**
 * Intenta extraer preguntas de texto raw con patrones regex.
 * Formato habitual BOE: "1.- Enunciado\nA) Opción\nB) Opción\n..."
 */
function parseWithRegex(text: string): Partial<PreguntaParsed>[] {
  const preguntas: Partial<PreguntaParsed>[] = []

  // Normalizar saltos de línea y eliminar encabezados de página
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/MINISTERIO[^\n]*/g, '')
    .replace(/CUERPO GENERAL[^\n]*/g, '')
    .replace(/Página \d+ de \d+[^\n]*/g, '')

  // Patrón: número seguido de punto/guión/paréntesis + enunciado + opciones A/B/C/D
  const preguntaPattern =
    /(\d{1,3})[.\-)\s]+([^\n]+(?:\n(?![A-D][).]\s).*)*)\s*A[).]\s*([^\n]+)\s*B[).]\s*([^\n]+)\s*C[).]\s*([^\n]+)\s*D[).]\s*([^\n]+)/gim

  let match: RegExpExecArray | null
  while ((match = preguntaPattern.exec(cleanText)) !== null) {
    const numero = parseInt(match[1])
    if (numero < 1 || numero > 150) continue // sanity check

    preguntas.push({
      numero,
      enunciado: match[2].replace(/\n/g, ' ').trim(),
      opciones: [
        match[3].trim(),
        match[4].trim(),
        match[5].trim(),
        match[6].trim(),
      ] as [string, string, string, string],
      tema_numero: null,
    })
  }

  // Eliminar duplicados (el regex puede matchear partes solapadas)
  const seen = new Set<number>()
  return preguntas.filter((p) => {
    if (!p.numero || seen.has(p.numero)) return false
    seen.add(p.numero)
    return true
  })
}

/**
 * Extrae respuestas correctas de una plantilla de respuestas.
 * Formato habitual: "1 C\n2 A\n3 B\n..." o tabla con dos columnas.
 */
function parsePlantilla(text: string): Map<number, 0 | 1 | 2 | 3> {
  const mapa = new Map<number, 0 | 1 | 2 | 3>()
  const letraAIndice: Record<string, 0 | 1 | 2 | 3> = { A: 0, B: 1, C: 2, D: 3 }

  // Patrón: número + espacio/guión + letra (A/B/C/D)
  const pattern = /(\d{1,3})\s*[-.]?\s*([ABCD])/gim
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const num = parseInt(match[1])
    const letra = match[2].toUpperCase() as keyof typeof letraAIndice
    if (num >= 1 && num <= 150 && letra in letraAIndice) {
      mapa.set(num, letraAIndice[letra])
    }
  }

  return mapa
}

// ─── Parsing con Claude Haiku (fallback) ──────────────────────────────────────

async function parseWithClaude(
  pdfText: string,
  anno: string,
  modelo: string
): Promise<Partial<PreguntaParsed>[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('⚠️  ANTHROPIC_API_KEY no configurada. No se puede usar fallback Claude.')
    return []
  }

  const client = new Anthropic({ apiKey })
  console.log(`  🤖 Usando Claude Haiku para parsear examen ${anno} modelo ${modelo}...`)

  // Procesar en chunks de ~3000 tokens para evitar límites de contexto
  const CHUNK_SIZE = 10_000 // chars
  const chunks = []
  for (let i = 0; i < pdfText.length; i += CHUNK_SIZE) {
    chunks.push(pdfText.slice(i, i + CHUNK_SIZE))
  }

  const allPreguntas: Partial<PreguntaParsed>[] = []

  for (let i = 0; i < chunks.length; i++) {
    console.log(`    Procesando chunk ${i + 1}/${chunks.length}...`)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0,
      system: `Eres un extractor de preguntas de examen. Tu única tarea es extraer preguntas de examen tipo test de texto raw de PDF y devolver JSON.

REGLAS:
- Devuelve SOLO JSON válido, sin texto adicional
- Formato exacto: {"preguntas": [{"numero": 1, "enunciado": "...", "opciones": ["A...", "B...", "C...", "D..."]}]}
- Si no encuentras preguntas en el texto, devuelve {"preguntas": []}
- NO añadas campo "correcta" (lo cruzamos con la plantilla de respuestas por separado)
- opciones siempre debe tener exactamente 4 elementos`,
      messages: [
        {
          role: 'user',
          content: `Extrae las preguntas de este fragmento de examen oficial (fragmento ${i + 1}/${chunks.length}):\n\n${chunks[i]}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') continue

    try {
      const parsed = JSON.parse(content.text) as { preguntas: Partial<PreguntaParsed>[] }
      allPreguntas.push(...(parsed.preguntas ?? []))
    } catch {
      console.warn(`    ⚠️  JSON inválido en chunk ${i + 1}, saltando`)
    }

    // Rate limiting: 1s entre chunks
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 1000))
  }

  // Deduplicar por número
  const seen = new Set<number>()
  return allPreguntas.filter((p) => {
    if (!p.numero || seen.has(p.numero)) return false
    seen.add(p.numero)
    return true
  })
}

// ─── Procesador de un examen ──────────────────────────────────────────────────

async function processExamen(
  anno: string,
  modelo: string | null,
  cuestionarioPdf: string,
  plantillaPdf: string | null
): Promise<ExamenParsed | null> {
  console.log(`\n📄 Procesando examen ${anno}${modelo ? ` modelo ${modelo}` : ''}...`)

  if (!fs.existsSync(cuestionarioPdf)) {
    console.warn(`  ⚠️  PDF no encontrado: ${cuestionarioPdf}`)
    return null
  }

  // 1. Parsear cuestionario
  const cuestionarioBuffer = fs.readFileSync(cuestionarioPdf)
  const cuestionarioData = await pdfParse(cuestionarioBuffer)
  const cuestionarioText = cuestionarioData.text

  console.log(`  📝 Texto extraído: ${cuestionarioText.length.toLocaleString()} chars`)

  // 2. Parsing determinista
  let preguntas = parseWithRegex(cuestionarioText)
  console.log(`  🔍 Parsing regex: ${preguntas.length} preguntas detectadas`)

  // 3. Fallback a Claude si regex no encuentra suficientes preguntas
  if (preguntas.length < 50) {
    console.log(`  ⚡ <50 preguntas con regex — activando fallback Claude Haiku`)
    preguntas = await parseWithClaude(cuestionarioText, anno, modelo ?? 'único')
    console.log(`  🤖 Claude Haiku: ${preguntas.length} preguntas detectadas`)
  }

  if (preguntas.length === 0) {
    console.error(`  ❌ No se pudieron extraer preguntas del examen ${anno}`)
    return null
  }

  // 4. Parsear plantilla de respuestas
  let plantilla = new Map<number, 0 | 1 | 2 | 3>()
  if (plantillaPdf && fs.existsSync(plantillaPdf)) {
    const plantillaBuffer = fs.readFileSync(plantillaPdf)
    const plantillaData = await pdfParse(plantillaBuffer)
    plantilla = parsePlantilla(plantillaData.text)
    console.log(`  ✅ Plantilla de respuestas: ${plantilla.size} respuestas`)
  } else {
    console.warn(`  ⚠️  Sin plantilla de respuestas — correcta = 0 por defecto`)
  }

  // 5. Cruzar preguntas con plantilla
  const preguntasCompletas: PreguntaParsed[] = preguntas
    .filter((p): p is Required<typeof p> => !!p.numero && !!p.enunciado && !!p.opciones)
    .map((p) => ({
      numero: p.numero,
      enunciado: p.enunciado,
      opciones: p.opciones as [string, string, string, string],
      correcta: plantilla.get(p.numero) ?? 0,
      tema_numero: null,
    }))
    .sort((a, b) => a.numero - b.numero)

  console.log(`  ✅ Total preguntas completas: ${preguntasCompletas.length}`)

  return {
    convocatoria: anno,
    anno: parseInt(anno),
    turno: 'libre',
    modelo,
    fuente_url: null, // Añadir manualmente si se conoce la URL
    total_preguntas: preguntasCompletas.length,
    preguntas: preguntasCompletas,
  }
}

// ─── Descubrimiento automático de PDFs ───────────────────────────────────────

interface ExamenDescubierto {
  anno: string
  modelo: string | null
  cuestionarioPdf: string
  plantillaPdf: string | null
  outputJson: string
}

function discoverExamenes(targetAnno?: string, targetModelo?: string): ExamenDescubierto[] {
  const examenes: ExamenDescubierto[] = []

  if (!fs.existsSync(EXAMENES_DIR)) {
    console.error(`❌ Directorio no encontrado: ${EXAMENES_DIR}`)
    return []
  }

  const annos = targetAnno
    ? [targetAnno]
    : fs.readdirSync(EXAMENES_DIR).filter((f) => /^\d{4}$/.test(f))

  for (const anno of annos) {
    const annoDir = path.join(EXAMENES_DIR, anno)
    if (!fs.statSync(annoDir).isDirectory()) continue

    const files = fs.readdirSync(annoDir)
    const cuestionarios = files.filter(
      (f) => f.toLowerCase().includes('examen') && f.endsWith('.pdf')
    )

    for (const cuestionario of cuestionarios) {
      // Detectar modelo del nombre de archivo (modelo_a.pdf, modelo_b.pdf, etc.)
      const modeloMatch = cuestionario.match(/modelo[_\s-]?([ab])/i)
      const modelo = modeloMatch ? modeloMatch[1].toUpperCase() : null

      if (targetModelo && modelo?.toLowerCase() !== targetModelo.toLowerCase()) continue

      // Buscar plantilla correspondiente
      const plantillaName = modelo
        ? files.find((f) => f.toLowerCase().includes('plantilla') && f.toLowerCase().includes(modelo.toLowerCase()) && f.endsWith('.pdf'))
        : files.find((f) => f.toLowerCase().includes('plantilla') && f.endsWith('.pdf'))

      const outputName = modelo ? `parsed_${modelo.toLowerCase()}.json` : 'parsed.json'

      examenes.push({
        anno,
        modelo,
        cuestionarioPdf: path.join(annoDir, cuestionario),
        plantillaPdf: plantillaName ? path.join(annoDir, plantillaName) : null,
        outputJson: path.join(annoDir, outputName),
      })
    }
  }

  return examenes
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , targetAnno, targetModelo] = process.argv
  console.log('🎓 OPTEK — Parser de Exámenes Oficiales')
  console.log('========================================')

  const examenes = discoverExamenes(targetAnno, targetModelo)

  if (examenes.length === 0) {
    console.log('ℹ️  No se encontraron PDFs de exámenes.')
    console.log(`   Coloca los PDFs en: ${EXAMENES_DIR}/[año]/`)
    console.log('   Ver README.md para instrucciones de descarga.')
    return
  }

  console.log(`📂 Encontrados: ${examenes.length} examen(es)\n`)

  let ok = 0
  let errors = 0

  for (const examen of examenes) {
    const resultado = await processExamen(
      examen.anno,
      examen.modelo,
      examen.cuestionarioPdf,
      examen.plantillaPdf
    )

    if (!resultado) {
      errors++
      continue
    }

    fs.writeFileSync(examen.outputJson, JSON.stringify(resultado, null, 2), 'utf-8')
    console.log(`  💾 Guardado: ${examen.outputJson}`)
    ok++
  }

  console.log('\n========================================')
  console.log(`✅ ${ok} examen(es) procesado(s) correctamente`)
  if (errors > 0) console.log(`❌ ${errors} error(es)`)
  console.log('\n📌 Siguiente paso: pnpm ingest:examenes')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
