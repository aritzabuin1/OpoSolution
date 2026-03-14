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
const DATA_ROOT = path.join(__dirname, '..', '..', 'data')

// Support --dir flag: pnpm ingest:examenes --dir examenes_c1 [año]
function resolveExamenesDir(): string {
  const dirIdx = process.argv.indexOf('--dir')
  if (dirIdx !== -1 && process.argv[dirIdx + 1]) {
    return path.join(DATA_ROOT, process.argv[dirIdx + 1])
  }
  return path.join(DATA_ROOT, 'examenes')
}
const EXAMENES_DIR = resolveExamenesDir()

// Map directory to oposición slug
function resolveOposicionSlug(): string {
  const dirIdx = process.argv.indexOf('--dir')
  if (dirIdx !== -1 && process.argv[dirIdx + 1]?.includes('c1')) {
    return 'administrativo-estado'
  }
  return 'aux-admin-estado'
}

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

  // 1. Upsert examen_oficial (migration 021 aplicada: columna `modelo` disponible)
  const upsertRow: Record<string, unknown> = {
    oposicion_id: oposicionId,
    anio: examenParsed.anno,
    convocatoria: examenParsed.turno,
    fuente_url: examenParsed.fuente_url,
    modelo: examenParsed.modelo ?? null,
    activo: true,
  }

  // The unique index uses COALESCE(modelo, '') so standard upsert onConflict won't match.
  // Instead: try select first, then insert or update.
  const { data: existing } = await (supabase as ReturnType<typeof createClient>)
    .from('examenes_oficiales')
    .select('id')
    .eq('oposicion_id', oposicionId)
    .eq('anio', examenParsed.anno)
    .eq('convocatoria', examenParsed.turno)
    .then((res) => {
      // Filter for matching modelo (including null)
      if (!res.data) return res
      const filtered = res.data.filter((row: Record<string, unknown>) =>
        (examenParsed.modelo ?? null) === (row.modelo ?? null)
      )
      return { ...res, data: filtered.length > 0 ? filtered : null }
    })

  let examenRow: { id: string } | null = null
  let examenError: unknown = null

  if (existing && existing.length > 0) {
    // Update existing
    const { data, error } = await (supabase as ReturnType<typeof createClient>)
      .from('examenes_oficiales')
      .update({ fuente_url: examenParsed.fuente_url, activo: true })
      .eq('id', existing[0].id)
      .select('id')
      .single()
    examenRow = data
    examenError = error
  } else {
    // Insert new
    const { data, error } = await (supabase as ReturnType<typeof createClient>)
      .from('examenes_oficiales')
      .insert(upsertRow)
      .select('id')
      .single()
    examenRow = data
    examenError = error
  }

  if (examenError || !examenRow) {
    console.error('  ❌ Error al insertar examen:', examenError?.message)
    return { ok: false, preguntasInsertadas: 0 }
  }

  const examenId = (examenRow as { id: string }).id
  console.log(`  ✅ Examen ID: ${examenId}`)

  // 2. Excluir preguntas de reserva (sin respuesta verificada — credibilidad 0 tolerancia)
  //    C1 (Administrativo): 60 puntuables + 10 reserva
  //    C2 (Auxiliar): actualmente todos los exámenes ya vienen sin reservas
  const MAX_PUNTUABLE = 60 // Preguntas > 60 son reserva en C1; C2 no las incluye
  const preguntasPuntuables = examenParsed.preguntas.filter((p) => p.numero <= MAX_PUNTUABLE)
  const reservasDescartadas = examenParsed.preguntas.length - preguntasPuntuables.length
  if (reservasDescartadas > 0) {
    console.log(`  ⚠️  ${reservasDescartadas} preguntas de reserva descartadas (sin respuesta verificada)`)
  }

  // 3. Upsert preguntas_oficiales en batches de 50
  const BATCH_SIZE = 50
  let preguntasInsertadas = 0

  for (let i = 0; i < preguntasPuntuables.length; i += BATCH_SIZE) {
    const batch = preguntasPuntuables.slice(i, i + BATCH_SIZE)

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

  // Soporta YYYY y YYYY_ext (convocatoria extraordinaria)
  const allFolders = fs.readdirSync(EXAMENES_DIR).filter((f) => /^\d{4}(_ext)?$/.test(f))
  const folders = targetAnno
    ? allFolders.filter((f) => f === targetAnno || f === `${targetAnno}_ext`)
    : allFolders

  for (const folder of folders) {
    const annoDir = path.join(EXAMENES_DIR, folder)
    if (!fs.existsSync(annoDir) || !fs.statSync(annoDir).isDirectory()) continue

    const anno = folder.replace('_ext', '')
    const jsonFiles = fs
      .readdirSync(annoDir)
      .filter((f) => f.startsWith('parsed') && f.endsWith('.json'))

    for (const jsonFile of jsonFiles) {
      results.push({ anno, filePath: path.join(annoDir, jsonFile) })
    }
  }

  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Filter out --dir flag and its value from positional args
  const positionalArgs = process.argv.slice(2).filter((arg, i, arr) => {
    if (arg === '--dir') return false
    if (i > 0 && arr[i - 1] === '--dir') return false
    return true
  })
  const [targetAnno] = positionalArgs
  const slug = resolveOposicionSlug()

  console.log('🎓 OpoRuta — Ingesta de Exámenes Oficiales')
  console.log(`📂 Directorio: ${EXAMENES_DIR}`)
  console.log(`🏷️  Oposición: ${slug}`)
  console.log('=========================================')

  const supabase = buildSupabaseClient()

  // Obtener oposicion_id del slug correspondiente
  const { data: oposicion, error: opError } = await supabase
    .from('oposiciones')
    .select('id')
    .eq('slug', slug)
    .single()

  if (opError || !oposicion) {
    console.error(`❌ Oposición "${slug}" no encontrada en BD`)
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
