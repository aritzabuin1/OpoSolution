#!/usr/bin/env tsx
/**
 * execution/ingest-conocimiento-penitenciarias.ts
 *
 * Ingests data/penitenciarias/t48-t50 JSON files into conocimiento_tecnico table.
 * These temas (Bloque IV — Conducta Humana) are NOT legislation-based.
 *
 * Usage: pnpm ingest:penitenciarias [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'penitenciarias')
const PENITENCIARIAS_OPOSICION_ID = 'f1000000-0000-0000-0000-000000000001'
const dryRun = process.argv.includes('--dry-run')

// ─── Env ──────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    if (!(k in process.env)) process.env[k] = t.slice(eq + 1).trim()
  }
}
loadEnvLocal()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Seccion {
  titulo: string
  contenido: string
}

interface TemaJSON {
  tema: number
  titulo: string
  secciones: Seccion[]
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // truncate if too long
  })
  return res.data[0].embedding
}

async function main() {
  console.log(`\n📚 Ingest Conocimiento Técnico — Penitenciarias Bloque IV`)
  console.log(`   Dry run: ${dryRun}\n`)

  // Resolve tema IDs from DB
  const { data: temas } = await supabase
    .from('temas')
    .select('id, numero')
    .eq('oposicion_id', PENITENCIARIAS_OPOSICION_ID)
    .in('numero', [48, 49, 50])

  const temaIdMap = new Map<number, string>()
  for (const t of (temas ?? []) as { id: string; numero: number }[]) {
    temaIdMap.set(t.numero, t.id)
  }

  if (temaIdMap.size !== 3) {
    console.error(`ERROR: Expected 3 temas (48-50), found ${temaIdMap.size}. Run migration 064+065 first.`)
    process.exit(1)
  }

  // Read JSON files
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))
  let inserted = 0

  for (const file of files) {
    const data: TemaJSON = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
    const temaId = temaIdMap.get(data.tema)
    if (!temaId) {
      console.warn(`  ⚠ Tema ${data.tema} not found in DB — skip ${file}`)
      continue
    }

    console.log(`\n📖 Tema ${data.tema}: ${data.titulo} (${data.secciones.length} secciones)`)

    for (const seccion of data.secciones) {
      const hash = crypto.createHash('sha256').update(seccion.contenido).digest('hex')

      if (dryRun) {
        console.log(`  ○ "${seccion.titulo}" (${seccion.contenido.length} chars) — WOULD insert`)
        continue
      }

      // Generate embedding
      console.log(`  ⏳ "${seccion.titulo}" — generating embedding...`)
      const embedding = await getEmbedding(`${seccion.titulo}\n\n${seccion.contenido}`)

      // Upsert
      const { error } = await supabase
        .from('conocimiento_tecnico')
        .upsert({
          bloque: 'penitenciarias',
          tema_id: temaId,
          titulo_seccion: seccion.titulo,
          contenido: seccion.contenido,
          hash_sha256: hash,
          embedding,
        }, { onConflict: 'bloque,tema_id,titulo_seccion' })

      if (error) {
        console.error(`  ❌ Error inserting "${seccion.titulo}":`, error.message)
      } else {
        console.log(`  ✅ "${seccion.titulo}"`)
        inserted++
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500))
    }
  }

  console.log(`\n✅ Done. Inserted ${inserted} secciones.`)
}

main().catch(console.error)
