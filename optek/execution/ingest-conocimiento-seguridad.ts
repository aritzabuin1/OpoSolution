#!/usr/bin/env tsx
/**
 * execution/ingest-conocimiento-seguridad.ts
 *
 * Ingests data/seguridad/*.json into conocimiento_tecnico table.
 * Covers non-legislative temas for Ertzaintza, Guardia Civil, Policía Nacional.
 *
 * Usage: pnpm ingest:seguridad [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'seguridad')
const dryRun = process.argv.includes('--dry-run')

// ─── Oposicion IDs ──────────────────────────────────────────────────────────

const OPOSICION_IDS: Record<string, string> = {
  'ertzaintza':       'ab000000-0000-0000-0000-000000000001',
  'guardia-civil':    'ac000000-0000-0000-0000-000000000001',
  'policia-nacional': 'ad000000-0000-0000-0000-000000000001',
}

// Map filename prefix → oposicion slug
function oposicionFromFilename(filename: string): string | null {
  for (const slug of Object.keys(OPOSICION_IDS)) {
    if (filename.startsWith(slug + '_')) return slug
  }
  return null
}

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Seccion {
  titulo: string
  contenido: string
}

interface TemaJSON {
  tema: number
  titulo: string
  secciones: Seccion[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

function buildOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada')
  return new OpenAI({ apiKey })
}

function hashContent(titulo: string, contenido: string): string {
  return crypto.createHash('sha256').update(`${titulo.trim()}\n${contenido.trim()}`, 'utf-8').digest('hex')
}

async function sleep(ms: number) { await new Promise(r => setTimeout(r, ms)) }

async function embed(openai: OpenAI, text: string): Promise<number[] | null> {
  const truncated = text.slice(0, 8000)
  try {
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: truncated })
    return res.data[0].embedding
  } catch (err) {
    console.error(`  ERROR embedding: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(dryRun ? 'DRY RUN' : 'LIVE — writing to DB')
  console.log('Ingest Conocimiento Tecnico — Seguridad (Ertzaintza, GC, PN)')
  console.log('='.repeat(60))

  const supabase = buildSupabaseClient()
  const openai = buildOpenAI()

  // Pre-load all temas for the three oposiciones
  const temaMap = new Map<string, Map<number, { id: string; titulo: string }>>()

  for (const [slug, opoId] of Object.entries(OPOSICION_IDS)) {
    const { data: temas } = await supabase
      .from('temas')
      .select('id, numero, titulo')
      .eq('oposicion_id', opoId)
      .order('numero')

    const map = new Map<number, { id: string; titulo: string }>()
    for (const t of (temas ?? []) as { id: string; numero: number; titulo: string }[]) {
      map.set(t.numero, { id: t.id, titulo: t.titulo })
    }
    temaMap.set(slug, map)
    console.log(`  ${slug}: ${map.size} temas in DB`)
  }
  console.log()

  // Discover JSON files
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`No data directory at ${DATA_DIR}. Run generate-conocimiento-seguridad.ts first.`)
    return
  }

  const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort()
  if (jsonFiles.length === 0) {
    console.log('No JSON files found in data/seguridad/. Run generate-conocimiento-seguridad.ts first.')
    return
  }

  console.log(`Found ${jsonFiles.length} JSON files\n`)

  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const file of jsonFiles) {
    const opoSlug = oposicionFromFilename(file)
    if (!opoSlug) {
      console.log(`  [SKIP] ${file} — cannot determine oposicion from filename`)
      totalSkipped++
      continue
    }

    const opoTemas = temaMap.get(opoSlug)
    if (!opoTemas) {
      console.log(`  [SKIP] ${file} — no temas loaded for ${opoSlug}`)
      totalSkipped++
      continue
    }

    const data: TemaJSON = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
    const tema = opoTemas.get(data.tema)
    if (!tema) {
      console.log(`  [SKIP] ${file} — tema ${data.tema} not found in DB for ${opoSlug}`)
      totalSkipped++
      continue
    }

    console.log(`\n${file}`)
    console.log(`  ${opoSlug} Tema ${data.tema}: ${data.titulo} (${data.secciones.length} secciones)`)

    for (const seccion of data.secciones) {
      const h = hashContent(seccion.titulo, seccion.contenido)

      if (dryRun) {
        console.log(`  [DRY] "${seccion.titulo}" (${seccion.contenido.length} chars)`)
        totalInserted++
        continue
      }

      // Check if already exists with same hash
      const { data: existing } = await supabase
        .from('conocimiento_tecnico')
        .select('id, hash_sha256')
        .eq('bloque', 'seguridad')
        .eq('tema_id', tema.id)
        .eq('titulo_seccion', seccion.titulo)
        .maybeSingle()

      if ((existing as any)?.hash_sha256 === h) {
        console.log(`  [SAME] "${seccion.titulo}" — no changes`)
        totalSkipped++
        continue
      }

      // Generate embedding
      console.log(`  Embedding: "${seccion.titulo}"...`)
      const embedding = await embed(openai, `${seccion.titulo}\n\n${seccion.contenido}`)
      if (!embedding) {
        totalErrors++
        continue
      }

      // Upsert
      const { error } = await supabase
        .from('conocimiento_tecnico')
        .upsert({
          bloque: 'seguridad',
          tema_id: tema.id,
          titulo_seccion: seccion.titulo,
          contenido: seccion.contenido,
          hash_sha256: h,
          embedding: embedding as unknown as string,
          activo: true,
        }, { onConflict: 'bloque,tema_id,titulo_seccion' })

      if (error) {
        console.error(`  ERROR "${seccion.titulo}": ${error.message}`)
        totalErrors++
      } else {
        console.log(`  OK "${seccion.titulo}"`)
        totalInserted++
      }

      // Rate limit embeddings API
      await sleep(300)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Inserted: ${totalInserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`)
  if (dryRun) console.log('Re-run without --dry-run to write to DB')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
