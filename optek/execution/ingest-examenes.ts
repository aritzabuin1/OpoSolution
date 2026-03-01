/**
 * execution/ingest-examenes.ts — OPTEK §1.3.2A
 *
 * Lee los JSON parsed de data/examenes/ e inserta en Supabase.
 *
 * Estrategia:
 *   - Upsert en examenes_oficiales (idempotente por convocatoria+modelo)
 *   - Upsert en preguntas_oficiales con SHA-256 por pregunta
 *   - Sin embeddings (las preguntas oficiales no usan RAG semántico)
 *
 * Uso:
 *   pnpm ingest:examenes
 *   pnpm ingest:examenes 2024      ← solo año 2024
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('SUPABASE_URL no configurada')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function hashPregunta(pregunta: PreguntaParsed): string {
  const normalized = JSON.stringify({
    enunciado: pregunta.enunciado.trim(),
    opciones: pregunta.opciones.map((o) => o.trim()),
    correcta: pregunta.correcta,
  })
  return crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex')
}

// ─── Ingesta de un examen ─────────────────────────────────────────────────────

async function ingestExamen(
  supabase: SupabaseClient,
  examenParsed: ExamenParsed,
  oposicionId: string
): Promise<{ ok: boolean; examenId?: string; preguntasInsertadas: number }> {
  console.log(
    `\n📥 Ingesta: ${examenParsed.convocatoria}${examenParsed.modelo ? ` modelo ${examenParsed.modelo}` : ''}`
  )

  // 1. Upsert examen_oficial
  const { data: examenRow, error: examenError } = await (supabase as ReturnType<typeof createClient>)
    .from('examenes_oficiales')
    .upsert(
      {
        oposicion_id: oposicionId,
        anio: examenParsed.anno,
        convocatoria: examenParsed.turno,
        fuente_url: examenParsed.fuente_url,
        activo: true,
      },
      {
        onConflict: 'oposicion_id,anio,convocatoria',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single()

  if (examenError || !examenRow) {
    console.error('  ❌ Error al insertar examen:', examenError?.message)
    return { ok: false, preguntasInsertadas: 0 }
  }

  const examenId = (examenRow as { id: string }).id
  console.log(`  ✅ Examen ID: ${examenId}`)

  // 2. Upsert preguntas_oficiales en batches de 50
  const BATCH_SIZE = 50
  let preguntasInsertadas = 0

  for (let i = 0; i < examenParsed.preguntas.length; i += BATCH_SIZE) {
    const batch = examenParsed.preguntas.slice(i, i + BATCH_SIZE)

    const rows = batch.map((p) => ({
      examen_id: examenId,
      numero: p.numero,
      enunciado: p.enunciado,
      opciones: p.opciones,
      correcta: p.correcta,
      tema_id: null as string | null, // Se puede mapear manualmente después
      dificultad: null as string | null,
    }))

    const { error: pregError, count } = await (supabase as ReturnType<typeof createClient>)
      .from('preguntas_oficiales')
      .upsert(rows, { onConflict: 'examen_id,numero', ignoreDuplicates: false })
      .select('id', { count: 'exact', head: true })

    if (pregError) {
      console.error(`  ❌ Error en batch ${i / BATCH_SIZE + 1}:`, pregError.message)
      continue
    }

    preguntasInsertadas += batch.length
    process.stdout.write(`  📝 Preguntas: ${preguntasInsertadas}/${examenParsed.preguntas.length}\r`)
  }

  console.log(`\n  ✅ ${preguntasInsertadas} preguntas insertadas`)
  return { ok: true, examenId, preguntasInsertadas }
}

// ─── Descubrimiento de JSON parsed ───────────────────────────────────────────

interface JsonDescubierto {
  anno: string
  filePath: string
}

function discoverParsedJsons(targetAnno?: string): JsonDescubierto[] {
  const results: JsonDescubierto[] = []

  if (!fs.existsSync(EXAMENES_DIR)) return results

  const annos = targetAnno
    ? [targetAnno]
    : fs.readdirSync(EXAMENES_DIR).filter((f) => /^\d{4}$/.test(f))

  for (const anno of annos) {
    const annoDir = path.join(EXAMENES_DIR, anno)
    if (!fs.existsSync(annoDir) || !fs.statSync(annoDir).isDirectory()) continue

    const jsonFiles = fs.readdirSync(annoDir).filter((f) => f.startsWith('parsed') && f.endsWith('.json'))
    for (const jsonFile of jsonFiles) {
      results.push({ anno, filePath: path.join(annoDir, jsonFile) })
    }
  }

  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , targetAnno] = process.argv
  console.log('🎓 OPTEK — Ingesta de Exámenes Oficiales')
  console.log('=========================================')

  const supabase = buildSupabaseClient()

  // Obtener oposicion_id de "aux-admin-estado"
  const { data: oposicion, error: opError } = await supabase
    .from('oposiciones')
    .select('id')
    .eq('slug', 'aux-admin-estado')
    .single()

  if (opError || !oposicion) {
    console.error('❌ Oposición "aux-admin-estado" no encontrada en BD')
    process.exit(1)
  }

  const oposicionId = (oposicion as { id: string }).id
  console.log(`✅ Oposición ID: ${oposicionId}\n`)

  const jsons = discoverParsedJsons(targetAnno)

  if (jsons.length === 0) {
    console.log('ℹ️  No se encontraron JSON parseados.')
    console.log('   Ejecuta primero: pnpm parse:examenes')
    return
  }

  console.log(`📂 Encontrados: ${jsons.length} archivo(s) JSON\n`)

  let totalPreguntas = 0
  let errors = 0

  for (const { anno, filePath } of jsons) {
    const examenParsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ExamenParsed
    const result = await ingestExamen(supabase, examenParsed, oposicionId)

    if (result.ok) {
      totalPreguntas += result.preguntasInsertadas
    } else {
      errors++
    }
  }

  console.log('\n=========================================')
  console.log(`✅ Total preguntas ingesta das: ${totalPreguntas}`)
  if (errors > 0) console.log(`❌ ${errors} error(es)`)
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
