/**
 * execution/parse-ertzaintza-docs.ts
 *
 * Parsea los documentos de exámenes Ertzaintza (.doc/.docx) y genera
 * JSON compatible con ingest-examenes.ts
 *
 * Pipeline:
 *   1. Batch convert .doc → .docx (PowerShell .ps1 + Word COM)
 *   2. mammoth .docx → HTML
 *   3. Extraer preguntas + respuestas correctas (answer key / bold)
 *   4. Output: data/examenes_ertzaintza/YYYY_suffix/parsed.json
 *
 * Uso:
 *   pnpm parse:ertzaintza
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import mammoth from 'mammoth'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..', '..')
const SOURCE_DIR = path.join(PROJECT_ROOT, 'examenes ertzaintza')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'data', 'examenes_ertzaintza')
const TMP_DIR = path.join(PROJECT_ROOT, '.tmp', 'ertzaintza_docx')

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

interface ManifestEntry {
  sourceFile: string
  outputSuffix: string
  anno: number
  convocatoria: string
  temaNumeros: number[] | null
  expectedMin?: number
}

// ─── Manifest ─────────────────────────────────────────────────────────────────
// Filenames verified against actual disk contents on 2026-04-14

const MANIFEST: ManifestEntry[] = [
  // ── Full exams (multi-tema) ──
  { sourceFile: 'SOLUCIONES EXAMEN JULIO.doc', outputSuffix: 'jul', anno: 2021, convocatoria: 'preparacion_julio', temaNumeros: null, expectedMin: 90 },
  { sourceFile: 'SOLUCIONES EXAMEN REPASO NOVIEMBRE.doc', outputSuffix: 'nov', anno: 2021, convocatoria: 'preparacion_noviembre', temaNumeros: null, expectedMin: 40 },
  { sourceFile: 'SOLUCIONES SIMULACRO EXAMEN OCTUBRE.doc', outputSuffix: 'oct', anno: 2021, convocatoria: 'preparacion_octubre', temaNumeros: null, expectedMin: 35 },
  { sourceFile: 'SOLUCIONES SIMULACRO FINAL VERANO.doc', outputSuffix: 'ver', anno: 2021, convocatoria: 'preparacion_verano', temaNumeros: null, expectedMin: 30 },
  { sourceFile: 'SOLUCIONES EX\u00C1MEN SIMULACRO PROMOCI\u00D3N XXX (1).doc', outputSuffix: 'xxx', anno: 2020, convocatoria: 'promocion_xxx', temaNumeros: null, expectedMin: 30 },
  { sourceFile: 'SOLUCIONES EXAMEN REPASO TEMAS 1 Y 6.doc', outputSuffix: 'rep16', anno: 2021, convocatoria: 'preparacion_temas_1_6', temaNumeros: null, expectedMin: 40 },

  // ── Multi-tema subject tests ──
  { sourceFile: 'SOLUCIONES TEST PENAL PROMO XXXI.doc', outputSuffix: 'penal1', anno: 2021, convocatoria: 'preparacion_penal_xxxi', temaNumeros: null, expectedMin: 20 },
  { sourceFile: 'SOLUCIONES TEST POLICIA PAIS VASCO PROM XXXI.doc', outputSuffix: 'pvasco', anno: 2021, convocatoria: 'preparacion_policia_pv', temaNumeros: [37], expectedMin: 50 },
  { sourceFile: 'SOLUCIONES TEST SIMULACRO PARTE ADMINISTRATIVO.doc', outputSuffix: 'admin', anno: 2021, convocatoria: 'preparacion_administrativo', temaNumeros: null, expectedMin: 30 },
  { sourceFile: 'S TEST PENAL GENERAL XXXI.doc', outputSuffix: 'penal2', anno: 2021, convocatoria: 'preparacion_penal_general', temaNumeros: null, expectedMin: 15 },

  // ── Tema-specific tests (SOLUCIONES files — bold on correct answer) ──
  { sourceFile: 'SOLUCIONES TEST TEMA 10^.doc', outputSuffix: 'tema10', anno: 2021, convocatoria: 'preparacion_tema_10', temaNumeros: [10], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 11.doc', outputSuffix: 'tema11', anno: 2021, convocatoria: 'preparacion_tema_11', temaNumeros: [11], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 14^.doc', outputSuffix: 'tema14', anno: 2021, convocatoria: 'preparacion_tema_14', temaNumeros: [14], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 15.doc', outputSuffix: 'tema15', anno: 2021, convocatoria: 'preparacion_tema_15', temaNumeros: [15], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 38 PARTE ADRIANA.doc', outputSuffix: 'tema38', anno: 2021, convocatoria: 'preparacion_tema_38', temaNumeros: [38], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 9.EL MUNICIPIO.doc', outputSuffix: 'tema09', anno: 2021, convocatoria: 'preparacion_tema_9', temaNumeros: [9], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEMA 37 PREGUNTAS PARTE ADRIANA.doc', outputSuffix: 'tema37', anno: 2021, convocatoria: 'preparacion_tema_37', temaNumeros: [37], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES. TEST TEMA 4. PROTECCI\u00D3N DE DATOS.doc', outputSuffix: 'tema04', anno: 2021, convocatoria: 'preparacion_tema_4', temaNumeros: [4], expectedMin: 15 },
  { sourceFile: 'SOLUCIONES TEST TEMA 3.docx', outputSuffix: 'tema03', anno: 2021, convocatoria: 'preparacion_tema_3', temaNumeros: [3], expectedMin: 15 },

  // ── Files "CON SOLUCIONES" (answer key at end of file) ──
  { sourceFile: 'TEST TEMA 42 CON SOLUCIONES.doc', outputSuffix: 'tema42', anno: 2021, convocatoria: 'preparacion_tema_42', temaNumeros: [42], expectedMin: 20 },
  { sourceFile: 'TEST TEMA 43 CON SOLUCIONES.doc', outputSuffix: 'tema43', anno: 2021, convocatoria: 'preparacion_tema_43', temaNumeros: [43], expectedMin: 15 },

  // ── .docx with inline bold correct answers ──
  { sourceFile: 'Test de los temas 22 y 23 Reglamento General de Circulaci\u00F3n CON SOLUCIONES.docx', outputSuffix: 'tema2223', anno: 2021, convocatoria: 'preparacion_temas_22_23', temaNumeros: null, expectedMin: 20 },
  { sourceFile: 'Test de los temas 24 a 30 ley de Seguridad Vial CON SOLUCIONES.docx', outputSuffix: 'tema2430', anno: 2021, convocatoria: 'preparacion_temas_24_30', temaNumeros: null, expectedMin: 20 },

  // NOTE: TEST TITULO PRELIMINAR PENAL.doc and TEST TEMA 3 NUEVO.doc have NO solutions
  // (no answer key, no bold marking) — skipped until solutions are provided
]

// Files to SKIP (test files with separate SOLUCIONES, PDFs, outlines, etc.)
const SKIP_FILES = new Set([
  'ESQUEMA TEMA 10.doc',
  'EXAMEN JULIO.doc',
  'EXAMEN REPASO NOVIEMBRE.doc',
  'EXAMEN REPASO TEMAS 1 Y 6.doc',
  'EX\u00C1MEN SIMULACRO PROMOCI\u00D3N XXX (1).doc',
  'SIMULACRO EXAMEN OCTUBRE.doc',
  'SIMULACRO FINAL VERANO.doc',
  '2 TEST PENAL PROMO XXXI.doc',
  'TEST PENAL GENERAL XXXI (2).doc',
  'TEST POLICIA PAIS VASCO PROM XXXI.doc',
  'TEST SIMULACRO PARTE ADMINISTRATIVO.doc',
  'TEST TEMA 10..doc',
  'TEST TEMA 11- LOS BIENES DE LAS ENTIDADES LOCALES.doc',
  'TEST TEMA 14..doc',
  'TEST TEMA 15.doc',
  'TEST TEMA 38 PARTE ADRIANA.doc',
  'TEMA 37 PREGUNTAS PARTE ADRIANA.doc',
  'TEST TEMA 4. PROTECCI\u00D3N DE DATOS.doc',
  'TEST TEMA 9.EL MUNICIPIO.doc',
  'Test de los temas 22 y 23 Reglamento General de Circulaci\u00F3n.docx',
  'Test de los temas 24 a 30 ley de Seguridad Vial.docx',
  'EXAMEN 31.pdf',
  'Examen XXIX corregido.pdf',
  'TEST REPASO TEMA 7.pdf',
  'SOLUCIONES TEST REPASO TEMA 7.pdf',
  'TEST TEMA 13 ADMINISTRATIVO 1.pdf',
  'SOLUCIONES TEST TEMA 13 ADMINISTRATIVO 2.pdf',
  'test examen promoci\u00F3n 29.docx',
  // Test files without any answer marking
  'TEST TITULO PRELIMINAR PENAL.doc',
  'TEST TEMA 3 NUEVO.doc',
])

// ─── HTML Parsing ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function hasBold(html: string): boolean {
  return /<strong>/i.test(html)
}

/**
 * Strategy A: Look for answer key at end of document.
 * Pattern: "SOLUCIONES" section in the LAST 30% of doc, followed by "1- A", "2- C", etc.
 * Returns { keys, cutoffIndex } — cutoffIndex is where to cut questions HTML.
 */
function extractAnswerKey(html: string): { keys: Map<number, 0 | 1 | 2 | 3>; cutoffIndex: number } | null {
  // Search for "SOLUCIONES" only in the last 40% of the document
  // (avoid matching the title "SOLUCIONES" at the top of solution files)
  const searchFrom = Math.floor(html.length * 0.6)
  const solIdx = html.indexOf('SOLUCIONES', searchFrom)
  if (solIdx === -1) return null

  const afterSol = html.substring(solIdx)
  const keyPattern = /(\d{1,3})\s*[-.)]\s*([ABCD])/gi
  const keys = new Map<number, 0 | 1 | 2 | 3>()
  const letterMap: Record<string, 0 | 1 | 2 | 3> = { A: 0, B: 1, C: 2, D: 3 }

  let match
  while ((match = keyPattern.exec(afterSol)) !== null) {
    const num = parseInt(match[1])
    const letter = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D'
    keys.set(num, letterMap[letter])
  }

  return keys.size >= 5 ? { keys, cutoffIndex: solIdx } : null
}

interface RawQuestion {
  numero: number
  enunciado: string
  opciones: string[]
  opcionesHtml: string[]
}

/**
 * Parse questions from HTML. Three formats supported:
 *  1. <p> question + <ol><li> options (typical .docx CON SOLUCIONES)
 *  2. <p> question + <p>a)/b)/c)/d) options (typical SOLUCIONES EXAMEN .doc)
 *  3. <ol><li> all-in-one: bold <li> = question, plain <li> = option (typical SOLUCIONES TEST TEMA .doc)
 */
function extractQuestionsFromHtml(html: string, answerKeyCutoff?: number): RawQuestion[] {
  // Only exclude the answer key section if one was actually found
  const questionHtml = answerKeyCutoff != null ? html.substring(0, answerKeyCutoff) : html

  // Try all strategies, take the one with most questions
  const strategies = [
    extractFromPWithOl(questionHtml),    // Format 1: <p> + <ol><li>
    extractFromPFormat(questionHtml),     // Format 2: <p> + <p>a/b/c/d
    extractFromOlFormat(questionHtml),    // Format 3: all <ol><li>
  ]

  let best: RawQuestion[] = []
  for (const result of strategies) {
    if (result.length > best.length) best = result
  }

  return best
}

/**
 * Format 1: <p> for question text, followed by <ol><li> for 4 options.
 * Common in the .docx CON SOLUCIONES files.
 * Example:
 *   <p><strong>1. Question text</strong></p>
 *   <ol><li>Option A</li><li><strong>Option B (correct)</strong></li><li>C</li><li>D</li></ol>
 */
function extractFromPWithOl(html: string): RawQuestion[] {
  const questions: RawQuestion[] = []

  // Split by <ol> blocks — each <ol> contains 4 <li> options
  const parts = html.split(/<ol>/)

  for (let i = 1; i < parts.length; i++) {
    const olContent = parts[i].split(/<\/ol>/)[0] || ''
    const beforeOl = parts[i - 1]

    // Extract question text from the last <p> before this <ol>
    const pMatches = [...beforeOl.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    if (pMatches.length === 0) continue

    const lastP = pMatches[pMatches.length - 1][1]
    const qText = stripHtml(lastP).trim()
    if (!qText) continue

    // Extract question number
    const numMatch = qText.match(/^(\d{1,3})\s*[.):-]\s*(.+)/s)
    const numero = numMatch ? parseInt(numMatch[1]) : questions.length + 1
    const enunciado = numMatch ? numMatch[2].trim() : qText

    // Extract <li> options
    const liMatches = [...olContent.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    if (liMatches.length < 4) continue

    const opciones: string[] = []
    const opcionesHtml: string[] = []
    for (let j = 0; j < Math.min(liMatches.length, 4); j++) {
      opciones.push(stripHtml(liMatches[j][1]).trim())
      opcionesHtml.push(liMatches[j][0])
    }

    questions.push({ numero, enunciado, opciones, opcionesHtml })
  }

  return questions
}

/**
 * Format 2: <p> with number for question, <p> with a)/b)/c)/d) for options.
 * Common in SOLUCIONES EXAMEN .doc files.
 * Handles varied numbering: "1.", "2-", "4.", "6.", "16." etc.
 * Handles bold splits: "2-<strong>Question</strong>" or "<strong>1. Q</strong>"
 */
function extractFromPFormat(html: string): RawQuestion[] {
  const questions: RawQuestion[] = []
  const pMatches = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)]

  let currentQuestion: RawQuestion | null = null

  for (const pm of pMatches) {
    const fullP = pm[0]
    const inner = pm[1]
    const text = stripHtml(inner).trim()
    if (!text || text.length < 3) continue

    // Skip title lines (SOLUCIONES, EXAMEN, PROMOCION, TEMA headings)
    if (/^(SOLUCIONES|EX[ÁA]MEN|PROMOCI[ÓO]N|TEST TEMA|TEMA \d)/i.test(text)) continue

    // Detect question: starts with number (may have . - ) : after it)
    const qMatch = text.match(/^(\d{1,3})\s*[.):\-–]+\s*(.+)/s)
    // Detect option: starts with a)/b)/c)/d) (letter may be followed by ) or . )
    const optMatch = text.match(/^([a-dA-D])\s*[.)]\s*([\s\S]*)/s)

    if (qMatch && (!optMatch || parseInt(qMatch[1]) > 0)) {
      // It's a question (number takes priority over option letter if ambiguous)
      if (currentQuestion && currentQuestion.opciones.length >= 4) {
        questions.push(currentQuestion)
      }
      currentQuestion = {
        numero: parseInt(qMatch[1]),
        enunciado: qMatch[2].trim(),
        opciones: [],
        opcionesHtml: [],
      }
    } else if (optMatch && currentQuestion && currentQuestion.opciones.length < 4) {
      const optText = optMatch[2].trim()
      currentQuestion.opciones.push(optText)
      currentQuestion.opcionesHtml.push(fullP)
    }
  }

  if (currentQuestion && currentQuestion.opciones.length >= 4) {
    questions.push(currentQuestion)
  }

  return questions
}

/**
 * Format 3: Everything in <ol><li>. Items grouped in blocks of 5:
 *   - 1st item = question (usually bold, but not always)
 *   - Next 4 items = options (bold option = correct answer)
 * Common in SOLUCIONES TEST TEMA .doc files.
 *
 * Heuristic: the first bold item starts a question. Then we collect exactly 4
 * options regardless of bold status. The next item starts a new question.
 */
function extractFromOlFormat(html: string): RawQuestion[] {
  const questions: RawQuestion[] = []
  const liMatches = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)]

  const items = liMatches.map((m) => ({
    html: m[0],
    text: stripHtml(m[1]).trim(),
    isBold: hasBold(m[1]),
  })).filter((item) => item.text.length > 0)

  // Group in blocks of 5: [question, optA, optB, optC, optD]
  let i = 0
  let questionNum = 0
  while (i < items.length) {
    const qItem = items[i]

    // Skip non-bold items at the very start (title, headers)
    if (questionNum === 0 && !qItem.isBold) {
      i++
      continue
    }

    // Need at least 4 more items for options
    if (i + 4 >= items.length) break

    questionNum++
    const numMatch = qItem.text.match(/^(\d{1,3})\s*[.):\-–]+\s*(.+)/s)

    const opciones: string[] = []
    const opcionesHtml: string[] = []
    for (let j = 1; j <= 4; j++) {
      opciones.push(items[i + j].text)
      opcionesHtml.push(items[i + j].html)
    }

    questions.push({
      numero: numMatch ? parseInt(numMatch[1]) : questionNum,
      enunciado: numMatch ? numMatch[2].trim() : qItem.text,
      opciones,
      opcionesHtml,
    })

    i += 5 // Skip question + 4 options
  }

  return questions
}

/** Strategy B: bold option = correct answer */
function detectCorrectFromBold(q: RawQuestion): 0 | 1 | 2 | 3 | null {
  const boldIndices: number[] = []
  for (let i = 0; i < Math.min(q.opcionesHtml.length, 4); i++) {
    if (hasBold(q.opcionesHtml[i])) boldIndices.push(i)
  }
  return boldIndices.length === 1 ? (boldIndices[0] as 0 | 1 | 2 | 3) : null
}

// ─── .doc → .docx Conversion via PowerShell .ps1 file ────────────────────────

function batchConvertDocToDocx(docFiles: string[]): Map<string, string> {
  const result = new Map<string, string>()
  if (docFiles.length === 0) return result

  fs.mkdirSync(TMP_DIR, { recursive: true })

  // Build PowerShell script content
  const psLines: string[] = [
    '$word = New-Object -ComObject Word.Application',
    '$word.Visible = $false',
    'try {',
  ]

  for (const docFile of docFiles) {
    const srcPath = path.join(SOURCE_DIR, docFile).replace(/\//g, '\\')
    const safeName = docFile.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.doc$/i, '.docx')
    const dstPath = path.join(TMP_DIR, safeName).replace(/\//g, '\\')

    psLines.push(
      '  try {',
      `    $doc = $word.Documents.Open("${srcPath}")`,
      `    $doc.SaveAs2("${dstPath}", 16)`,
      '    $doc.Close()',
      `    Write-Output "OK:${safeName}"`,
      '  } catch {',
      `    Write-Output "FAIL:${docFile}"`,
      '  }'
    )
    result.set(docFile, path.join(TMP_DIR, safeName))
  }

  psLines.push('} finally {', '  $word.Quit()', '}')

  // Write to temp .ps1 file with UTF-8 BOM (required for PowerShell to handle accented chars)
  const ps1Path = path.join(TMP_DIR, 'convert.ps1')
  const bom = '\uFEFF'
  fs.writeFileSync(ps1Path, bom + psLines.join('\r\n'), 'utf-8')

  console.log(`\n🔄 Convirtiendo ${docFiles.length} archivos .doc → .docx...`)

  try {
    const output = execSync(
      `powershell -ExecutionPolicy Bypass -File "${ps1Path.replace(/\//g, '\\')}"`,
      { encoding: 'utf-8', timeout: 180000 }
    )

    let okCount = 0
    let failCount = 0
    for (const line of output.trim().split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('OK:')) okCount++
      else if (trimmed.startsWith('FAIL:')) {
        failCount++
        console.error(`  ❌ ${trimmed}`)
      }
    }
    console.log(`  ✅ ${okCount} convertidos, ${failCount} fallidos`)
  } catch (err) {
    console.error('  ❌ PowerShell conversion failed:', (err as Error).message?.substring(0, 200))
  }

  return result
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

async function processEntry(
  entry: ManifestEntry,
  diskName: string,
  convertedMap: Map<string, string>
): Promise<{ questions: number; errors: string[] }> {
  const errors: string[] = []
  const isDoc = diskName.toLowerCase().endsWith('.doc')
  const isDocx = diskName.toLowerCase().endsWith('.docx')

  let docxPath: string
  if (isDoc) {
    const converted = convertedMap.get(diskName)
    if (!converted || !fs.existsSync(converted)) {
      return { questions: 0, errors: [`Conversion failed for ${diskName}`] }
    }
    docxPath = converted
  } else if (isDocx) {
    docxPath = path.join(SOURCE_DIR, diskName)
  } else {
    return { questions: 0, errors: [`Unsupported format: ${entry.sourceFile}`] }
  }

  // mammoth → HTML
  let html: string
  try {
    const result = await mammoth.convertToHtml({ path: docxPath })
    html = result.value
  } catch (err) {
    return { questions: 0, errors: [`mammoth failed: ${(err as Error).message}`] }
  }

  // Strategy A: answer key at end
  const answerKeyResult = extractAnswerKey(html)
  const answerKey = answerKeyResult?.keys ?? null

  // Extract questions (pass cutoff only if answer key was found)
  const rawQuestions = extractQuestionsFromHtml(html, answerKeyResult?.cutoffIndex)
  if (rawQuestions.length === 0) {
    return { questions: 0, errors: [`No questions extracted from ${entry.sourceFile}`] }
  }

  // Build PreguntaParsed
  const preguntas: PreguntaParsed[] = []

  for (const rq of rawQuestions) {
    if (rq.opciones.length < 4) {
      errors.push(`Q${rq.numero}: only ${rq.opciones.length} options`)
      continue
    }

    // Determine correct answer
    let correcta: 0 | 1 | 2 | 3 | null = null

    // Strategy A: answer key
    if (answerKey?.has(rq.numero)) {
      correcta = answerKey.get(rq.numero)!
    }
    // Strategy B: bold
    if (correcta === null) {
      correcta = detectCorrectFromBold(rq)
    }

    if (correcta === null) {
      errors.push(`Q${rq.numero}: no correct answer detected`)
      continue
    }

    const temaNums = entry.temaNumeros
    preguntas.push({
      numero: rq.numero,
      enunciado: rq.enunciado,
      opciones: [rq.opciones[0], rq.opciones[1], rq.opciones[2], rq.opciones[3]],
      correcta,
      tema_numero: temaNums?.length === 1 ? temaNums[0] : null,
    })
  }

  if (preguntas.length === 0) {
    return { questions: 0, errors: [`No valid questions`, ...errors] }
  }

  // Write ExamenParsed JSON
  const examen: ExamenParsed = {
    convocatoria: entry.convocatoria,
    anno: entry.anno,
    turno: 'interna',
    modelo: null,
    fuente_url: null,
    total_preguntas: preguntas.length,
    preguntas,
  }

  const outputSubdir = path.join(OUTPUT_DIR, `${entry.anno}_${entry.outputSuffix}`)
  fs.mkdirSync(outputSubdir, { recursive: true })
  fs.writeFileSync(path.join(outputSubdir, 'parsed.json'), JSON.stringify(examen, null, 2), 'utf-8')

  return { questions: preguntas.length, errors }
}

async function main() {
  console.log('🔵 OpoRuta — Parser de Exámenes Ertzaintza')
  console.log(`📂 Fuente: ${SOURCE_DIR}`)
  console.log(`📂 Output: ${OUTPUT_DIR}`)
  console.log('=========================================\n')

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Directorio fuente no existe: ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Normalize filenames (Windows may use NFD decomposed Unicode)
  const allFiles = fs.readdirSync(SOURCE_DIR)
  const nfcMap = new Map<string, string>() // NFC name → actual disk name
  for (const f of allFiles) {
    nfcMap.set(f.normalize('NFC'), f)
  }

  // Check manifest coverage
  const manifestFiles = new Set(MANIFEST.map((m) => m.sourceFile.normalize('NFC')))
  const skipNfc = new Set([...SKIP_FILES].map((f) => f.normalize('NFC')))
  const unmapped = allFiles.filter((f) => {
    const nfc = f.normalize('NFC')
    return !manifestFiles.has(nfc) && !skipNfc.has(nfc) && !f.startsWith('.')
  })
  if (unmapped.length > 0) {
    console.log(`⚠️  No mapeados: ${unmapped.join(', ')}\n`)
  }

  // Resolve manifest filenames to actual disk names via NFC normalization
  function resolveFile(name: string): string | null {
    // Direct check first
    if (fs.existsSync(path.join(SOURCE_DIR, name))) return name
    // Try NFC lookup
    const diskName = nfcMap.get(name.normalize('NFC'))
    return diskName ?? null
  }

  // Collect .doc files that need conversion
  const docFiles = [...new Set(
    MANIFEST
      .filter((m) => m.sourceFile.toLowerCase().endsWith('.doc'))
      .map((m) => ({ manifest: m.sourceFile, disk: resolveFile(m.sourceFile) }))
      .filter((f): f is { manifest: string; disk: string } => f.disk !== null)
      .map((f) => f.disk)
  )]

  const convertedMap = batchConvertDocToDocx(docFiles)

  // Also build a manifest-to-disk name map for processEntry
  const manifestToDisk = new Map<string, string>()
  for (const entry of MANIFEST) {
    const disk = resolveFile(entry.sourceFile)
    if (disk) manifestToDisk.set(entry.sourceFile, disk)
  }

  // Process entries
  let totalQ = 0
  let totalErr = 0
  let totalFiles = 0

  for (const entry of MANIFEST) {
    const diskName = manifestToDisk.get(entry.sourceFile)
    if (!diskName) {
      console.log(`⚠️  SKIP (not found): ${entry.sourceFile}`)
      continue
    }

    const shortName = diskName.length > 60
      ? diskName.substring(0, 57) + '...'
      : diskName
    process.stdout.write(`📄 ${shortName}...`)

    const { questions, errors } = await processEntry(entry, diskName, convertedMap)

    if (questions > 0) {
      totalFiles++
      totalQ += questions
      const warn = entry.expectedMin && questions < entry.expectedMin
        ? ` ⚠️ (<${entry.expectedMin})`
        : ''
      console.log(` ✅ ${questions}q${warn}`)
    } else {
      console.log(` ❌ 0q`)
    }

    if (errors.length > 0) {
      totalErr += errors.length
      errors.slice(0, 3).forEach((e) => console.log(`    ⚠️ ${e}`))
      if (errors.length > 3) console.log(`    ⚠️ ... +${errors.length - 3} more`)
    }
  }

  // Cleanup
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
    console.log('\n🧹 Temp cleaned')
  }

  console.log('\n=========================================')
  console.log(`📊 ${totalFiles} archivos → ${totalQ} preguntas (${totalErr} errores)`)
  console.log(`\n💡 Siguiente: pnpm ingest:ertzaintza`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
