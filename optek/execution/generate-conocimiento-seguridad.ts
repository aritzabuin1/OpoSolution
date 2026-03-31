#!/usr/bin/env tsx
/**
 * execution/generate-conocimiento-seguridad.ts
 *
 * Uses Anthropic Claude API to generate educational content JSON files
 * for non-legislative temas across Ertzaintza, Guardia Civil, and Policía Nacional.
 *
 * Outputs JSON to data/seguridad/ following the conocimiento_tecnico format:
 *   { tema, titulo, secciones: [{ titulo, contenido }] }
 *
 * Usage:
 *   pnpm generate:seguridad                  ← all 33 temas
 *   pnpm generate:seguridad --tema 32        ← single tema (matches first found)
 *   pnpm generate:seguridad --dry-run        ← preview what would be generated
 *   pnpm generate:seguridad --oposicion ertzaintza  ← only one oposicion
 *
 * Requires: ANTHROPIC_API_KEY in .env.local
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

// ─── Paths ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'seguridad')

// ─── Env ─────────────────────────────────────────────────────────────────────

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

// ─── CLI flags ───────────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run')
const temaArgIdx = process.argv.indexOf('--tema')
const temaFilter = temaArgIdx !== -1 ? parseInt(process.argv[temaArgIdx + 1], 10) : null
const opoArgIdx = process.argv.indexOf('--oposicion')
const opoFilter = opoArgIdx !== -1 ? process.argv[opoArgIdx + 1]?.toLowerCase() : null

// ─── Tema definitions ────────────────────────────────────────────────────────

interface TemaDef {
  oposicion: string
  oposicion_id: string
  slug: string
  tema: number
  titulo: string
  fileSlug: string
}

const TEMAS: TemaDef[] = [
  // ── Ertzaintza ──
  { oposicion: 'Ertzaintza', oposicion_id: 'ab000000-0000-0000-0000-000000000001', slug: 'ertzaintza', tema: 32, titulo: 'Geografía e historia del País Vasco', fileSlug: 'geografia_historia_pv' },
  { oposicion: 'Ertzaintza', oposicion_id: 'ab000000-0000-0000-0000-000000000001', slug: 'ertzaintza', tema: 33, titulo: 'Medio natural del País Vasco', fileSlug: 'medio_natural_pv' },
  { oposicion: 'Ertzaintza', oposicion_id: 'ab000000-0000-0000-0000-000000000001', slug: 'ertzaintza', tema: 34, titulo: 'Demografía del País Vasco', fileSlug: 'demografia_pv' },
  { oposicion: 'Ertzaintza', oposicion_id: 'ab000000-0000-0000-0000-000000000001', slug: 'ertzaintza', tema: 35, titulo: 'Economía del País Vasco', fileSlug: 'economia_pv' },
  { oposicion: 'Ertzaintza', oposicion_id: 'ab000000-0000-0000-0000-000000000001', slug: 'ertzaintza', tema: 36, titulo: 'Cultura e identidad vasca', fileSlug: 'cultura_identidad_vasca' },

  // ── Guardia Civil ──
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 16, titulo: 'Protección Civil y Desarrollo Sostenible', fileSlug: 'proteccion_civil' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 17, titulo: 'Topografía', fileSlug: 'topografia' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 18, titulo: 'Sociología', fileSlug: 'sociologia' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 19, titulo: 'Tecnologías de la información', fileSlug: 'tecnologias_informacion' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 20, titulo: 'Telecomunicaciones', fileSlug: 'telecomunicaciones' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 21, titulo: 'Automovilismo', fileSlug: 'automovilismo' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 22, titulo: 'Armamento y tiro', fileSlug: 'armamento_tiro' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 23, titulo: 'Primeros auxilios', fileSlug: 'primeros_auxilios' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 24, titulo: 'Seguridad vial', fileSlug: 'seguridad_vial' },
  { oposicion: 'Guardia Civil', oposicion_id: 'ac000000-0000-0000-0000-000000000001', slug: 'guardia-civil', tema: 25, titulo: 'Medio ambiente', fileSlug: 'medio_ambiente' },

  // ── Policía Nacional ──
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 27, titulo: 'Derechos Humanos', fileSlug: 'derechos_humanos' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 28, titulo: 'Globalización y sociedad de la información', fileSlug: 'globalizacion_sociedad_informacion' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 29, titulo: 'Sociología', fileSlug: 'sociologia' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 30, titulo: 'Psicología', fileSlug: 'psicologia' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 31, titulo: 'Comunicación', fileSlug: 'comunicacion' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 32, titulo: 'Inmigración', fileSlug: 'inmigracion' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 33, titulo: 'Cooperación policial internacional', fileSlug: 'cooperacion_policial_internacional' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 34, titulo: 'Ortografía de la lengua española', fileSlug: 'ortografia' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 35, titulo: 'Terrorismo', fileSlug: 'terrorismo' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 36, titulo: 'Seguridad ciudadana', fileSlug: 'seguridad_ciudadana' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 37, titulo: 'Deontología policial', fileSlug: 'deontologia_policial' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 38, titulo: 'Tecnologías de la información', fileSlug: 'tecnologias_informacion' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 39, titulo: 'Ciberseguridad y ciberdelincuencia', fileSlug: 'ciberseguridad' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 40, titulo: 'Transmisiones', fileSlug: 'transmisiones' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 41, titulo: 'Automoción', fileSlug: 'automocion' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 42, titulo: 'Armamento', fileSlug: 'armamento' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 43, titulo: 'Primeros auxilios', fileSlug: 'primeros_auxilios' },
  { oposicion: 'Policía Nacional', oposicion_id: 'ad000000-0000-0000-0000-000000000001', slug: 'policia-nacional', tema: 44, titulo: 'Seguridad vial', fileSlug: 'seguridad_vial' },
]

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(t: TemaDef): string {
  return `Eres un experto redactor de contenido educativo para oposiciones a ${t.oposicion} en España (convocatoria 2025-2026).

Genera contenido educativo completo para el siguiente tema del temario oficial:

**Tema ${t.tema}: ${t.titulo}**

REQUISITOS:
1. Escribe aproximadamente 2000 palabras en total.
2. Divide el contenido en entre 4 y 8 secciones temáticas.
3. Cada sección debe tener entre 200 y 800 palabras.
4. Cada sección debe ser autocontenida (comprensible sin leer las demás).
5. El contenido debe ser factual, actualizado a 2026, y específico para oposiciones en España.
6. Incluye datos concretos que son frecuentes en exámenes: fechas, definiciones exactas, clasificaciones, protocolos, referencias legales, cifras clave.
7. Usa un estilo didáctico claro, directo, con estructura de apuntes de estudio.
8. NO incluyas introducciones genéricas ni despedidas. Ve directo al contenido sustantivo.
9. En cada sección, destaca los puntos que más se preguntan en exámenes tipo test.

FORMATO DE SALIDA — JSON estricto:
{
  "tema": ${t.tema},
  "titulo": "${t.titulo}",
  "secciones": [
    {
      "titulo": "Nombre de la sección",
      "contenido": "Texto educativo completo de la sección..."
    }
  ]
}

Responde ÚNICAMENTE con el JSON válido, sin markdown, sin bloques de código, sin texto adicional.`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function getFilename(t: TemaDef): string {
  return `${t.slug}_t${String(t.tema).padStart(2, '0')}_${t.fileSlug}.json`
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Generate Conocimiento Seguridad ===')
  console.log(`  Dry run: ${dryRun}`)
  console.log(`  Tema filter: ${temaFilter ?? 'all'}`)
  console.log(`  Oposicion filter: ${opoFilter ?? 'all'}`)
  console.log(`  Output: ${DATA_DIR}\n`)

  // Ensure output directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // Filter temas
  let temasToProcess = TEMAS
  if (opoFilter) {
    temasToProcess = temasToProcess.filter(t => t.slug.includes(opoFilter) || t.oposicion.toLowerCase().includes(opoFilter))
  }
  if (temaFilter !== null) {
    temasToProcess = temasToProcess.filter(t => t.tema === temaFilter)
  }

  if (temasToProcess.length === 0) {
    console.log('No temas match the given filters.')
    return
  }

  console.log(`  Temas to generate: ${temasToProcess.length}\n`)

  if (dryRun) {
    for (const t of temasToProcess) {
      const filename = getFilename(t)
      const exists = fs.existsSync(path.join(DATA_DIR, filename))
      console.log(`  ${exists ? '[EXISTS]' : '[NEW]   '} ${filename} — ${t.oposicion} Tema ${t.tema}: ${t.titulo}`)
    }
    console.log('\nDry run complete. Re-run without --dry-run to generate.')
    return
  }

  // Build Anthropic client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not found in environment or .env.local')
    process.exit(1)
  }
  const client = new Anthropic({ apiKey })

  let generated = 0
  let skipped = 0
  let errors = 0

  for (const t of temasToProcess) {
    const filename = getFilename(t)
    const outPath = path.join(DATA_DIR, filename)

    // Skip if file already exists
    if (fs.existsSync(outPath)) {
      console.log(`  [SKIP] ${filename} — already exists`)
      skipped++
      continue
    }

    console.log(`\n  Generating: ${t.oposicion} — Tema ${t.tema}: ${t.titulo}`)
    console.log(`    File: ${filename}`)

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content: buildPrompt(t) }],
      })

      // Extract text from response
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text block in response')
      }

      // Parse and validate JSON
      let jsonStr = textBlock.text.trim()
      // Strip markdown code fences if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
      }

      const parsed = JSON.parse(jsonStr)

      // Basic validation
      if (!parsed.tema || !parsed.titulo || !Array.isArray(parsed.secciones) || parsed.secciones.length === 0) {
        throw new Error('Invalid JSON structure: missing tema, titulo, or secciones')
      }

      // Write to file
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf-8')
      const totalWords = parsed.secciones.reduce((acc: number, s: { contenido: string }) => acc + s.contenido.split(/\s+/).length, 0)
      console.log(`    OK — ${parsed.secciones.length} secciones, ~${totalWords} words`)
      generated++

    } catch (err) {
      console.error(`    ERROR: ${err instanceof Error ? err.message : String(err)}`)
      errors++
    }

    // Rate limit: wait 3s between API calls to avoid throttling
    if (temasToProcess.indexOf(t) < temasToProcess.length - 1) {
      console.log('    Waiting 3s...')
      await sleep(3000)
    }
  }

  console.log('\n' + '='.repeat(55))
  console.log(`Generated: ${generated} | Skipped: ${skipped} | Errors: ${errors}`)
  console.log(`Total temas: ${temasToProcess.length}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
