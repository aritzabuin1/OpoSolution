/**
 * execution/generate-embeddings.ts — OPTEK §1.2 (segunda pasada)
 *
 * Genera embeddings vectoriales para todos los artículos de legislación
 * que tienen embedding = NULL en la tabla `legislacion` de Supabase.
 *
 * Modelo: text-embedding-3-small (1536 dims, $0.020/1M tokens)
 * Coste estimado: ~2.766 artículos × ~400 tokens = ~1.1M tokens ≈ $0.022
 *
 * Estrategia:
 *   - Procesa en lotes de 20 artículos (llamadas batch a OpenAI)
 *   - Pausa 200ms entre lotes (rate limit conservador)
 *   - Reanudable: solo procesa rows con embedding IS NULL
 *   - Retry automático en errores 429 (rate limit) con backoff exponencial
 *
 * Uso (desde el directorio optek/):
 *   pnpm generate:embeddings
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { Database } from '../types/database'

// ─── Rutas ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

// ─── Config ───────────────────────────────────────────────────────────────────

const BATCH_SIZE = 20       // artículos por llamada OpenAI (máx 2048, conservador)
const BATCH_PAUSE_MS = 200  // pausa entre lotes
const MAX_RETRIES = 3       // reintentos en error 429

const EMBEDDING_MODEL = 'text-embedding-3-small' as const
const EMBEDDING_DIMENSIONS = 1536 as const

// ─── Clientes ─────────────────────────────────────────────────────────────────

function buildClients() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl) throw new Error('[embed] SUPABASE_URL no configurada')
  if (!supabaseKey) throw new Error('[embed] SUPABASE_SERVICE_ROLE_KEY no configurada')
  if (!openaiKey) throw new Error('[embed] OPENAI_API_KEY no configurada')

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const openai = new OpenAI({ apiKey: openaiKey })

  return { supabase, openai }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function generateBatchEmbeddings(
  openai: OpenAI,
  texts: string[],
  retries = 0
): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    })
    return response.data.map((d) => d.embedding)
  } catch (err: unknown) {
    const isRateLimit =
      err instanceof Error && err.message.toLowerCase().includes('rate limit')
    if (isRateLimit && retries < MAX_RETRIES) {
      const wait = 2000 * Math.pow(2, retries) // 2s, 4s, 8s
      console.warn(`  ⚠ Rate limit — esperando ${wait / 1000}s (intento ${retries + 1}/${MAX_RETRIES})`)
      await sleep(wait)
      return generateBatchEmbeddings(openai, texts, retries + 1)
    }
    throw err
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { supabase, openai } = buildClients()

  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  OPTEK — Generación de Embeddings §1.2           ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`  Modelo: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS} dims)`)
  console.log(`  Batch:  ${BATCH_SIZE} artículos/llamada, ${BATCH_PAUSE_MS}ms entre lotes`)
  console.log()

  // Contar total pendiente
  const { count: totalPending } = await supabase
    .from('legislacion')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null)

  if (!totalPending) {
    console.log('✅ Todos los artículos ya tienen embedding. Nada que hacer.')
    return
  }

  console.log(`  Artículos pendientes: ${totalPending}`)
  const estimatedTokens = totalPending * 400
  const estimatedCost = (estimatedTokens / 1_000_000) * 0.02
  console.log(
    `  Coste estimado: ~${estimatedTokens.toLocaleString()} tokens ≈ $${estimatedCost.toFixed(4)}`
  )
  console.log()

  let processed = 0

  while (true) {
    // Siempre desde offset 0: las filas procesadas desaparecen del filtro IS NULL,
    // así que el siguiente lote siempre está al inicio de la lista restante.
    const { data: rows, error } = await supabase
      .from('legislacion')
      .select('id, ley_nombre, articulo_numero, texto_integro')
      .is('embedding', null)
      .order('ley_nombre', { ascending: true })
      .order('articulo_numero', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) throw new Error(`[embed] Error consultando Supabase: ${error.message}`)
    if (!rows || rows.length === 0) break

    const texts = rows.map((r) =>
      `${r.ley_nombre} - Artículo ${r.articulo_numero}\n${r.texto_integro ?? ''}`
    )

    console.log(
      `  [${processed + 1}–${processed + rows.length}/${totalPending}] ` +
      `${rows[0].ley_nombre} art.${rows[0].articulo_numero} → ` +
      `${rows[rows.length - 1].ley_nombre} art.${rows[rows.length - 1].articulo_numero}`
    )

    // Generar embeddings
    const embeddings = await generateBatchEmbeddings(openai, texts)

    // Actualizar en Supabase (fila por fila dentro del batch)
    for (let i = 0; i < rows.length; i++) {
      const { error: updateError } = await supabase
        .from('legislacion')
        .update({ embedding: embeddings[i] as unknown as string })
        .eq('id', rows[i].id)

      if (updateError) {
        console.error(`  ✗ Error actualizando ${rows[i].id}: ${updateError.message}`)
      }
    }

    processed += rows.length

    if (rows.length < BATCH_SIZE) break

    await sleep(BATCH_PAUSE_MS)
  }

  console.log()
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  RESUMEN                                          ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`  Embeddings generados: ${processed}/${totalPending}`)
  console.log(`  Modelo: ${EMBEDDING_MODEL}`)
  console.log()

  // Verificar que no quedan pendientes
  const { count: remaining } = await supabase
    .from('legislacion')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null)

  if (remaining && remaining > 0) {
    console.warn(`  ⚠ Quedan ${remaining} artículos sin embedding. Re-ejecuta el script.`)
  } else {
    console.log('  ✅ Todos los artículos tienen embedding. Pipeline RAG listo.')
  }
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
