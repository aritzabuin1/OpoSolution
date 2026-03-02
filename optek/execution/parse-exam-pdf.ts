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
import { PDFParse, VerbosityLevel } from 'pdf-parse'
import Anthropic from '@anthropic-ai/sdk'

// Helper: extrae texto plano de un Buffer PDF usando pdf-parse v2
async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: VerbosityLevel.ERRORS })
  await parser.load()
  const result = await parser.getText()
  await parser.destroy()
  return result.text
}

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
  turno: 'libre' | 'interna' | 'extraordinaria'
  modelo: string | null
  fuente_url: string | null
  total_preguntas: number
  preguntas: PreguntaParsed[]
}

// ─── Parsing determinista con regex ──────────────────────────────────────────

/**
 * Intenta extraer preguntas de texto raw con patrones regex.
 * Soporta tres formatos de opciones encontrados en exámenes españoles:
 *
 *   Formato 1 — Una opción por línea (2019 mayoría, 2022):
 *     "1. Enunciado\na) Opción\nb) Opción\nc) Opción\nd) Opción"
 *
 *   Formato 2 — Dos opciones por línea, comprimido (2019 algunas):
 *     "1. Enunciado\na) Opt1. b) Opt2.\nc) Opt3. d) Opt4."
 *
 *   Formato 3 — Opciones multilínea (2024):
 *     "1. Enunciado\na) Texto largo que\ncontinúa aquí.\nb) Otra opción"
 *
 * Estrategia: divide en bloques por número de pregunta, luego usa un
 * patrón unificado con flag `s` (dotAll) para extraer opciones independientemente
 * del formato. El lookahead `(?=\s+[letra]\))` localiza el límite entre opciones
 * tanto si la siguiente opción está en la misma línea como en la siguiente.
 */
function parseWithRegex(text: string): Partial<PreguntaParsed>[] {
  // 1. Limpiar texto
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Encabezados MINISTERIO / CUERPO GENERAL
    .replace(/MINISTERIO[^\n]*/g, '')
    .replace(/CUERPO GENERAL[^\n]*/g, '')
    // Encabezados tipo "Página N de M" y variantes
    .replace(/Página \d+ de \d+[^\n]*/gi, '')
    // Encabezados 2024: "2024 - AUX-P – MODELO A Página 1 de 7"
    .replace(/\d{4}\s*[-–]\s*AUX-[^\n]*/g, '')
    // Marcadores de página pdf-parse: "-- N of M --"
    .replace(/^--\s*\d+\s*of\s*\d+\s*--$/gm, '')
    // Eliminar líneas de sólo guiones/puntos (separadores de página)
    .replace(/^[\s.\-_]{5,}$/gm, '')
    // Eliminar sección "Preguntas de reserva" (preguntas numeradas 1-N que
    // generan conflictos con las preguntas reales del examen)
    .replace(/Preguntas de reserva[\s\S]*/i, '')

  // 2. Dividir en bloques: cada bloque empieza con "N. " o "N) " al inicio de línea
  const blocks = cleanText.split(/\n(?=\d{1,3}[.)]\s)/).filter(Boolean)

  const preguntas: Partial<PreguntaParsed>[] = []

  for (const block of blocks) {
    // 3. Extraer número de pregunta y enunciado (todo antes de la primera opción a/A)
    //    La primera opción SIEMPRE empieza en su propia línea (\n a/A) )
    const headerMatch = block.match(/^(\d{1,3})[.)]\s+([\s\S]+?)(?=\n[a-dA-D]\)\s?)/i)
    if (!headerMatch) continue

    const numero = parseInt(headerMatch[1])
    if (numero < 1 || numero > 150) continue

    const enunciado = headerMatch[2].replace(/\n/g, ' ').trim()

    // 4. Extraer opciones con patrón unificado (flag `s` = dotAll, '.' incluye '\n').
    //    Lookahead (?=\s+[letra]\)) encuentra el límite entre opciones independientemente
    //    de si están en la misma línea o en líneas distintas.
    //    - Formato comprimido: "a) X. b) Y." → \s+ = ' ', [bB]\) = 'b)'
    //    - Formato multilínea: "a) X\ncontinúa.\nb) Y" → \s+ = '\n', [bB]\) = 'b)'
    const optA = block.match(/[aA]\)\s*(.+?)(?=\s+[bBcCdD]\))/is)?.[1]
    const optB = block.match(/[bB]\)\s*(.+?)(?=\s+[cCdD]\))/is)?.[1]
    const optC = block.match(/[cC]\)\s*(.+?)(?=\s+[dD]\))/is)?.[1]
    // Opción D: captura hasta el final del bloque (sin lookahead)
    const optD = block.match(/[dD]\)\s*([\s\S]+)/i)?.[1]

    if (!optA || !optB || !optC || !optD) continue

    const clean = (s: string) => s.replace(/\n/g, ' ').trim()
    preguntas.push({
      numero,
      enunciado,
      opciones: [clean(optA), clean(optB), clean(optC), clean(optD)] as [
        string,
        string,
        string,
        string,
      ],
      tema_numero: null,
    })
  }

  // 5. Eliminar duplicados
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

// ─── Parsing con Claude Haiku (fallback texto) ────────────────────────────────

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

// ─── Parsing con Claude Vision (PDFs escaneados) ─────────────────────────────

/**
 * Usa la API de documentos de Claude para parsear PDFs escaneados (imagen-based).
 * Activado cuando pdf-parse extrae < 500 chars (texto vacío = PDF escaneado).
 *
 * Anthropic API soporta `{ type: "document", source: { type: "base64", ... } }`
 * en el bloque de contenido, lo que permite a Claude "ver" el PDF directamente.
 *
 * Coste ~0.002€ por examen de 60-100 preguntas con claude-haiku-4-5-20251001.
 */
async function parseScannedPdfWithClaude(
  pdfBuffer: Buffer,
  anno: string,
  modelo: string
): Promise<Partial<PreguntaParsed>[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('⚠️  ANTHROPIC_API_KEY no configurada. No se puede procesar PDF escaneado.')
    return []
  }

  const client = new Anthropic({ apiKey })
  console.log(`  🔍 PDF escaneado detectado — usando Claude Vision (${anno} modelo ${modelo})...`)

  const pdfBase64 = pdfBuffer.toString('base64')

  const EXTRACTION_SYSTEM = `Eres un extractor de preguntas de examen tipo test. Analiza el PDF adjunto y extrae TODAS las preguntas numeradas con sus 4 opciones.

REGLAS:
- Devuelve SOLO JSON válido, sin texto adicional ni markdown
- Formato exacto: {"preguntas": [{"numero": 1, "enunciado": "...", "opciones": ["texto opción A", "texto opción B", "texto opción C", "texto opción D"]}]}
- opciones siempre debe tener exactamente 4 elementos (A, B, C, D en ese orden)
- NO añadas campo "correcta" — se cruza con la plantilla de respuestas por separado
- Incluye el texto completo de cada opción, sin las letras a)/b)/c)/d) iniciales
- Si una pregunta tiene opciones en varias líneas, concaténalas en una sola cadena
- Numera desde 1 hasta el total de preguntas sin saltar números`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      temperature: 0,
      system: EXTRACTION_SYSTEM,
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
            } as unknown as { type: 'text'; text: string }, // Cast necesario hasta que los tipos SDK se actualicen
            {
              type: 'text',
              text: `Extrae todas las preguntas numeradas del examen ${anno}${modelo !== 'único' ? ` modelo ${modelo}` : ''}.`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') return []

    // Limpiar posible markdown code fence
    const jsonText = content.text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(jsonText) as { preguntas: Partial<PreguntaParsed>[] }
    const preguntas = parsed.preguntas ?? []

    console.log(`  ✅ Claude Vision extrajo ${preguntas.length} preguntas`)
    return preguntas
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ❌ Error en Claude Vision: ${msg}`)
    return []
  }
}

// ─── Procesador de un examen ──────────────────────────────────────────────────

async function processExamen(
  anno: string,
  turno: 'libre' | 'interna' | 'extraordinaria',
  modelo: string | null,
  cuestionarioPdf: string,
  plantillaPdf: string | null
): Promise<ExamenParsed | null> {
  const turnoLabel = turno !== 'libre' ? ` (${turno})` : ''
  console.log(`\n📄 Procesando examen ${anno}${turnoLabel}${modelo ? ` modelo ${modelo}` : ''}...`)

  if (!fs.existsSync(cuestionarioPdf)) {
    console.warn(`  ⚠️  PDF no encontrado: ${cuestionarioPdf}`)
    return null
  }

  // 1. Parsear cuestionario
  const cuestionarioBuffer = fs.readFileSync(cuestionarioPdf)
  const cuestionarioText = await extractPdfText(cuestionarioBuffer)

  console.log(`  📝 Texto extraído: ${cuestionarioText.length.toLocaleString()} chars`)

  // Detectar PDF escaneado (imagen) — texto extraído muy corto o vacío
  const IS_SCANNED_PDF = cuestionarioText.trim().length < 500

  let preguntas: Partial<PreguntaParsed>[] = []

  if (IS_SCANNED_PDF) {
    // 2a. PDF escaneado: usar Claude Vision con la API de documentos
    console.log(`  ⚠️  PDF escaneado detectado (${cuestionarioText.trim().length} chars de texto)`)
    preguntas = await parseScannedPdfWithClaude(cuestionarioBuffer, anno, modelo ?? 'único')
  } else {
    // 2b. PDF con texto: parsing determinista
    preguntas = parseWithRegex(cuestionarioText)
    console.log(`  🔍 Parsing regex: ${preguntas.length} preguntas detectadas`)

    // 3. Fallback a Claude si regex no encuentra suficientes preguntas.
    //    "Suficiente" = secuencia completa sin huecos (1..N) O ≥30 preguntas si la secuencia
    //    comienza desde 1. Exámenes como 2024 tienen solo 40 preguntas y eso es completo.
    const isSequenceComplete = (() => {
      if (preguntas.length === 0) return false
      const nums = (preguntas as { numero?: number }[])
        .map((p) => p.numero!)
        .filter(Boolean)
        .sort((a, b) => a - b)
      // Completo si empieza en 1 y no hay huecos > 2
      if (nums[0] !== 1) return false
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] - nums[i - 1] > 2) return false // hueco mayor de 2 → incompleto
      }
      return nums.length >= 30 // mínimo absoluto de preguntas
    })()

    if (!isSequenceComplete) {
      console.log(
        `  ⚡ Secuencia incompleta (${preguntas.length} preguntas) — activando fallback Claude Haiku`
      )
      preguntas = await parseWithClaude(cuestionarioText, anno, modelo ?? 'único')
      console.log(`  🤖 Claude Haiku: ${preguntas.length} preguntas detectadas`)
    }
  }

  if (preguntas.length === 0) {
    console.error(`  ❌ No se pudieron extraer preguntas del examen ${anno}`)
    return null
  }

  // 4. Parsear plantilla de respuestas
  let plantilla = new Map<number, 0 | 1 | 2 | 3>()
  if (plantillaPdf && fs.existsSync(plantillaPdf)) {
    const plantillaBuffer = fs.readFileSync(plantillaPdf)
    const plantillaText = await extractPdfText(plantillaBuffer)
    plantilla = parsePlantilla(plantillaText)
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
    turno,
    modelo,
    fuente_url: null, // Añadir manualmente si se conoce la URL
    total_preguntas: preguntasCompletas.length,
    preguntas: preguntasCompletas,
  }
}

// ─── Descubrimiento automático de PDFs ───────────────────────────────────────

interface ExamenDescubierto {
  anno: string
  turno: 'libre' | 'interna' | 'extraordinaria'
  modelo: string | null
  cuestionarioPdf: string
  plantillaPdf: string | null
  outputJson: string
}

/**
 * Descubre exámenes disponibles en data/examenes/.
 * Soporta carpetas:
 *   YYYY/           → turno 'libre'
 *   YYYY_ext/       → turno 'extraordinaria' (ej: 2019_ext/)
 * Cuestionarios: cualquier archivo que contenga 'examen' o 'cuestionario' (case-insensitive) + .pdf
 * Plantillas: cualquier archivo que contenga 'plantilla' + .pdf
 * Modelo: detectado vía modelo_a / modelo_b en el nombre del archivo.
 */
function discoverExamenes(targetAnno?: string, targetModelo?: string): ExamenDescubierto[] {
  const examenes: ExamenDescubierto[] = []

  if (!fs.existsSync(EXAMENES_DIR)) {
    console.error(`❌ Directorio no encontrado: ${EXAMENES_DIR}`)
    return []
  }

  // Carpetas válidas: YYYY o YYYY_ext
  const allFolders = fs.readdirSync(EXAMENES_DIR).filter((f) => /^\d{4}(_ext)?$/.test(f))
  const folders = targetAnno
    ? allFolders.filter((f) => f === targetAnno || f === `${targetAnno}_ext`)
    : allFolders

  for (const folder of folders) {
    const annoDir = path.join(EXAMENES_DIR, folder)
    if (!fs.statSync(annoDir).isDirectory()) continue

    // Extraer anno real y turno de la carpeta
    const isExt = folder.endsWith('_ext')
    const anno = isExt ? folder.replace('_ext', '') : folder
    const turno: 'libre' | 'extraordinaria' = isExt ? 'extraordinaria' : 'libre'

    const files = fs.readdirSync(annoDir)
    const cuestionarios = files.filter(
      (f) =>
        (f.toLowerCase().includes('examen') || f.toLowerCase().includes('cuestionario')) &&
        f.endsWith('.pdf')
    )

    for (const cuestionario of cuestionarios) {
      // Detectar modelo del nombre de archivo (modelo_a.pdf, modelo_b.pdf, etc.)
      const modeloMatch = cuestionario.match(/modelo[_\s-]?([ab])/i)
      const modelo = modeloMatch ? modeloMatch[1].toUpperCase() : null

      if (targetModelo && modelo?.toLowerCase() !== targetModelo.toLowerCase()) continue

      // Buscar plantilla correspondiente (con o sin letra de modelo)
      const plantillaName = modelo
        ? files.find(
            (f) =>
              f.toLowerCase().includes('plantilla') &&
              f.toLowerCase().includes(modelo.toLowerCase()) &&
              f.endsWith('.pdf')
          )
        : files.find((f) => f.toLowerCase().includes('plantilla') && f.endsWith('.pdf'))

      const outputName = modelo
        ? `parsed_${modelo.toLowerCase()}.json`
        : turno === 'extraordinaria'
        ? 'parsed_ext.json'
        : 'parsed.json'

      examenes.push({
        anno,
        turno,
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
      examen.turno,
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
