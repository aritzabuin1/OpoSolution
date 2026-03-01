/**
 * execution/ingest-conocimiento.ts — OPTEK §1.3A.12
 *
 * Lee los JSON de data/ofimatica/ e ingesta las secciones en Supabase
 * tabla conocimiento_tecnico con embeddings.
 *
 * Mismo patrón que ingest-legislacion.ts:
 *   - Hash SHA-256 para deduplicación (re-ingesta idempotente)
 *   - text-embedding-3-small para embeddings
 *   - Upsert con ON CONFLICT (bloque, tema_id, titulo_seccion)
 *
 * Uso:
 *   pnpm ingest:ofimatica               ← todos los JSON disponibles
 *   pnpm ingest:ofimatica word          ← solo word.json
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OFIMATICA_DIR = path.join(__dirname, '..', '..', 'data', 'ofimatica')

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

interface Seccion {
  titulo: string
  contenido: string
  subtema: string
  fuente_url: string
}

interface ProductoJSON {
  tema_nombre: string
  tema_numero: number
  bloque: 'ofimatica' | 'informatica' | 'admin_electronica'
  fuente_url: string
  fecha_scraping: string
  secciones: Seccion[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('SUPABASE_URL no configurada')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
  return createClient(url, key, { auth: { persistSession: false } })
}

function buildOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada')
  return new OpenAI({ apiKey })
}

function hashSeccion(titulo: string, contenido: string): string {
  const normalized = `${titulo.trim()}\n${contenido.trim()}`
  return crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex')
}

// Rate limiting: 500ms entre embeddings (OpenAI tier gratuito)
async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

// ─── Embedding con retry ──────────────────────────────────────────────────────

async function generateEmbeddingWithRetry(
  openai: OpenAI,
  text: string,
  maxRetries = 3
): Promise<number[] | null> {
  // Truncar a ~8000 chars (texto embedding 3-small max: ~8191 tokens)
  const truncated = text.slice(0, 8000)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncated,
      })
      return response.data[0].embedding
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`  ⚠️  Embedding error (intento ${attempt}/${maxRetries}), reintentando...`)
        await sleep(2000 * attempt)
      } else {
        console.error(`  ❌ Embedding fallido tras ${maxRetries} intentos`)
        return null
      }
    }
  }
  return null
}

// ─── Ingesta de un producto ───────────────────────────────────────────────────

async function ingestProducto(
  supabase: SupabaseClient,
  openai: OpenAI,
  producto: ProductoJSON
): Promise<{ insertadas: number; actualizadas: number; errors: number }> {
  console.log(`\n📥 Ingesta: ${producto.tema_nombre} (${producto.secciones.length} secciones)`)

  // Obtener tema_id del temario
  const { data: tema } = await supabase
    .from('temas')
    .select('id')
    .eq('numero', producto.tema_numero)
    .eq('oposicion_id', 'aux-admin-estado')
    .single()

  const temaId: string | null = (tema as { id: string } | null)?.id ?? null

  if (!temaId) {
    console.warn(`  ⚠️  Tema ${producto.tema_numero} no encontrado en BD. Insertando con tema_id=null`)
  } else {
    console.log(`  ✅ Tema ID: ${temaId}`)
  }

  let insertadas = 0
  let actualizadas = 0
  let errors = 0

  for (let i = 0; i < producto.secciones.length; i++) {
    const seccion = producto.secciones[i]
    process.stdout.write(`  📝 [${i + 1}/${producto.secciones.length}] ${seccion.titulo.slice(0, 50)}...\r`)

    const hash = hashSeccion(seccion.titulo, seccion.contenido)

    // Verificar si ya existe y no ha cambiado
    const { data: existente } = await supabase
      .from('conocimiento_tecnico')
      .select('id, hash_sha256')
      .eq('bloque', producto.bloque)
      .eq('titulo_seccion', seccion.titulo)
      .maybeSingle()

    if ((existente as { hash_sha256?: string } | null)?.hash_sha256 === hash) {
      // Sin cambios — skip embedding
      continue
    }

    // Generar embedding
    const embedding = await generateEmbeddingWithRetry(openai, `${seccion.titulo}\n\n${seccion.contenido}`)
    if (!embedding) {
      errors++
      continue
    }

    // Upsert en BD
    const { error: upsertError } = await supabase
      .from('conocimiento_tecnico')
      .upsert(
        {
          bloque: producto.bloque,
          tema_id: temaId,
          titulo_seccion: seccion.titulo,
          contenido: seccion.contenido,
          fuente_url: seccion.fuente_url || producto.fuente_url,
          hash_sha256: hash,
          embedding: embedding as unknown as string,
          activo: true,
        },
        { onConflict: 'bloque,tema_id,titulo_seccion' }
      )

    if (upsertError) {
      console.error(`\n  ❌ Error upsert: ${upsertError.message}`)
      errors++
    } else {
      if (existente) actualizadas++
      else insertadas++
    }

    // Rate limiting
    await sleep(500)
  }

  console.log(
    `\n  ✅ ${insertadas} nuevas | ${actualizadas} actualizadas | ${errors} errores`
  )
  return { insertadas, actualizadas, errors }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , target] = process.argv
  console.log('📚 OPTEK — Ingesta de Conocimiento Técnico (Bloque II)')
  console.log('=========================================================')

  const supabase = buildSupabaseClient()
  const openai = buildOpenAI()

  // Descubrir JSONs disponibles
  const jsonFiles = fs.readdirSync(OFIMATICA_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'CHUNKING_STRATEGY.json')
    .filter((f) => !target || f === `${target}.json` || f === target)

  if (jsonFiles.length === 0) {
    console.log('ℹ️  No se encontraron JSON en data/ofimatica/')
    console.log('   Ejecuta primero: pnpm scrape:ofimatica')
    return
  }

  console.log(`📂 Encontrados: ${jsonFiles.length} archivo(s) JSON\n`)

  let totalInsertadas = 0
  let totalActualizadas = 0
  let totalErrors = 0

  for (const file of jsonFiles) {
    const filePath = path.join(OFIMATICA_DIR, file)
    const producto = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ProductoJSON

    const result = await ingestProducto(supabase, openai, producto)
    totalInsertadas += result.insertadas
    totalActualizadas += result.actualizadas
    totalErrors += result.errors
  }

  console.log('\n=========================================================')
  console.log(`✅ Total: ${totalInsertadas} nuevas, ${totalActualizadas} actualizadas`)
  if (totalErrors > 0) console.log(`❌ ${totalErrors} error(es)`)
  console.log('\n📌 Siguiente paso: Verificar con `SELECT count(*) FROM conocimiento_tecnico`')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
