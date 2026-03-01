/**
 * execution/ingest-legislacion.ts — OPTEK §1.2.4
 *
 * Lee los JSON de data/legislacion/ e ingesta los artículos en Supabase.
 *
 * Estrategia:
 *   - Upsert con ON CONFLICT (ley_codigo, articulo_numero, apartado)
 *   - Hash SHA-256 del texto normalizado → detectar cambios BOE
 *   - embedding = null en esta pasada (segunda pasada separada)
 *   - tema_ids = [] (se asocian en fase posterior de tagging)
 *
 * Uso (desde el directorio optek/):
 *   pnpm ingest:legislacion
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL              → URL del proyecto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY → clave service_role (bypass RLS)
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { normalizeForHash } from '../lib/utils/normalizeForHash'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'legislacion')

// ─── Carga .env.local manualmente (tsx no carga vars de entorno automáticamente) ──

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
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

// ─── Types ────────────────────────────────────────────────────────────────────

interface Articulo {
  numero: string
  titulo_articulo: string
  titulo_seccion: string
  texto_integro: string
}

interface LeyJSON {
  ley_nombre: string
  ley_codigo: string
  ley_nombre_completo: string
  fecha_scraping: string
  total_articulos: number
  articulos: Articulo[]
}

// Tipo de Insert derivado del Database para garantizar compatibilidad 1:1
type LegislacionInsert = Database['public']['Tables']['legislacion']['Insert']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient<Database> {
  // Acepta tanto SUPABASE_URL (scripts) como NEXT_PUBLIC_SUPABASE_URL (Next.js)
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      '[ingest] SUPABASE_URL no está configurada. Añade SUPABASE_URL=https://... a tu .env.local'
    )
  }
  if (!key) {
    throw new Error(
      '[ingest] SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
        'Añade SUPABASE_SERVICE_ROLE_KEY=eyJ... a tu .env.local'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

function readLeyFiles(): string[] {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`[ingest] Directorio de datos no encontrado: ${DATA_DIR}`)
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(DATA_DIR, f))

  if (files.length === 0) {
    throw new Error(`[ingest] No se encontraron archivos JSON en ${DATA_DIR}`)
  }

  return files
}

function buildRecord(ley: LeyJSON, articulo: Articulo): LegislacionInsert {
  const textNormalized = normalizeForHash(articulo.texto_integro)
  const hash = sha256(textNormalized)

  return {
    ley_nombre: ley.ley_nombre,
    ley_nombre_completo: ley.ley_nombre_completo,
    ley_codigo: ley.ley_codigo,
    articulo_numero: articulo.numero,
    apartado: null,
    titulo_capitulo: articulo.titulo_seccion,
    texto_integro: articulo.texto_integro,
    hash_sha256: hash,
    fecha_ultima_verificacion: new Date().toISOString(),
    tema_ids: [],
    activo: true,
    embedding: null,
  }
}

// ─── Ingesta por ley ──────────────────────────────────────────────────────────

const UPSERT_BATCH_SIZE = 50 // Supabase recomienda batches ≤100 rows

async function ingestLey(
  supabase: SupabaseClient<Database>,
  ley: LeyJSON
): Promise<{ procesados: number }> {
  const records = ley.articulos.map((art) => buildRecord(ley, art))
  let procesados = 0

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    const batch = records.slice(i, i + UPSERT_BATCH_SIZE)
    const batchEnd = Math.min(i + UPSERT_BATCH_SIZE, records.length)

    console.log(
      `  [${ley.ley_nombre}] Insertando art. ${i + 1}–${batchEnd}/${records.length}...`
    )

    const { data, error } = await supabase
      .from('legislacion')
      .upsert(batch, {
        onConflict: 'ley_codigo,articulo_numero,apartado',
        ignoreDuplicates: false,
      })
      .select('hash_sha256')

    if (error) {
      throw new Error(
        `[ingest] Error upsert en ${ley.ley_nombre} (art. ${i + 1}–${batchEnd}): ${error.message}`
      )
    }

    procesados += data?.length ?? batch.length
  }

  return { procesados }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  OPTEK — Ingesta de Legislación §1.2.4           ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`  Directorio fuente: ${DATA_DIR}`)
  console.log(`  Timestamp: ${new Date().toISOString()}\n`)

  // Validar entorno (lanza si faltan vars)
  const supabase = buildSupabaseClient()

  // Leer archivos JSON
  const files = readLeyFiles()
  console.log(`  Archivos encontrados: ${files.length}\n`)

  const summary: Array<{
    ley: string
    articulos: number
    procesados: number
  }> = []

  for (const file of files) {
    const filename = path.basename(file)
    console.log(`► Procesando ${filename}...`)

    let ley: LeyJSON
    try {
      const raw = fs.readFileSync(file, 'utf-8')
      ley = JSON.parse(raw) as LeyJSON
    } catch (err) {
      console.error(`  ERROR leyendo ${filename}: ${(err as Error).message}`)
      continue
    }

    console.log(`  Ley: ${ley.ley_nombre} (${ley.ley_nombre_completo})`)
    console.log(`  Artículos: ${ley.articulos.length}`)

    try {
      const { procesados } = await ingestLey(supabase, ley)
      console.log(`  OK: ${procesados} registros procesados (upsert)\n`)
      summary.push({
        ley: ley.ley_nombre,
        articulos: ley.articulos.length,
        procesados,
      })
    } catch (err) {
      console.error(`  ERROR ingesta ${ley.ley_nombre}: ${(err as Error).message}\n`)
      summary.push({
        ley: ley.ley_nombre,
        articulos: ley.articulos.length,
        procesados: -1,
      })
    }
  }

  // ─── Resumen final ─────────────────────────────────────────────────────────

  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  RESUMEN INGESTA                                  ║')
  console.log('╚══════════════════════════════════════════════════╝')

  let totalArticulos = 0
  let totalProcesados = 0

  for (const row of summary) {
    const status = row.procesados === -1 ? 'ERROR' : `${row.procesados} procesados`
    console.log(`  ${row.ley.padEnd(20)} | ${row.articulos} art. | ${status}`)
    totalArticulos += row.articulos
    if (row.procesados !== -1) totalProcesados += row.procesados
  }

  console.log('  ─────────────────────────────────────────────────')
  console.log(`  TOTAL: ${totalArticulos} artículos | ${totalProcesados} procesados`)
  console.log()
  console.log('  NOTA: embeddings = null en esta pasada.')
  console.log('  Ejecuta la segunda pasada (generate-embeddings) para vectorizar.')
  console.log()
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
