#!/usr/bin/env tsx
/**
 * execution/ingest-conocimiento-correos.ts
 *
 * Transforms data/correos/*.json into conocimiento_tecnico rows for Correos.
 * Maps JSON content to actual DB temas by best-fit matching.
 *
 * Usage: pnpm ingest:correos [--dry-run]
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
const CORREOS_DIR = path.join(__dirname, '..', '..', 'data', 'correos')
const CORREOS_OPOSICION_ID = 'd0000000-0000-0000-0000-000000000001'
const dryRun = process.argv.includes('--dry-run')

// ─── Env ──────────────────────────────────────────────────────────────────────

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

// ─── Mapping: JSON files → DB tema numbers ───────────────────────────────────
// Best-fit: each JSON covers content relevant to one or more BD temas
// BD temas: 1=Marco normativo, 2=Experiencia personas, 3=Paquetería, 4=Productos oficinas,
// 5=Nuevas líneas, 6=Herramientas, 7=Admisión, 8=Tratamiento/Transporte, 9=Distribución,
// 10=Atención cliente, 11=Internacionalización, 12=Normas cumplimiento

const FILE_TO_TEMAS: Record<string, number[]> = {
  't02_organizacion.json': [2],           // Organización → Experiencia personas
  't03_productos_servicios.json': [3, 4], // Productos postales → Paquetería + Productos oficinas
  't04_servicios_financieros.json': [4],  // Servicios financieros → Productos oficinas
  't05_logistica.json': [3, 5],           // Logística/e-commerce → Paquetería + Nuevas líneas
  't06_admision.json': [7],               // Admisión → Admisión (BD tema 7, no 6)
  't07_clasificacion_transporte.json': [8], // Clasificación → Tratamiento/Transporte
  't08_distribucion_entrega.json': [9],   // Distribución → Distribución
  't09_atencion_cliente.json': [10],      // Atención cliente → Atención cliente
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CorreosJSON {
  tema: number
  titulo: string
  contenido: Array<{ subtema: string; texto: string }>
  fuente: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function hash(titulo: string, contenido: string): string {
  return crypto.createHash('sha256').update(`${titulo.trim()}\n${contenido.trim()}`, 'utf-8').digest('hex')
}

async function sleep(ms: number) { await new Promise(r => setTimeout(r, ms)) }

async function embed(openai: OpenAI, text: string): Promise<number[] | null> {
  const truncated = text.slice(0, 8000)
  try {
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: truncated })
    return res.data[0].embedding
  } catch (err) {
    console.error(`  ❌ Embedding error: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(dryRun ? '🏃 DRY RUN' : '💾 LIVE — writing to DB')
  console.log('📚 OpoRuta — Ingesta Conocimiento Técnico Correos')
  console.log('='.repeat(55))

  const supabase = buildSupabaseClient()
  const openai = buildOpenAI()

  // Load all DB temas for Correos
  const { data: temas } = await (supabase as any)
    .from('temas')
    .select('id, numero, titulo')
    .eq('oposicion_id', CORREOS_OPOSICION_ID)
    .order('numero')

  const temaMap = new Map<number, { id: string; titulo: string }>()
  for (const t of (temas ?? []) as { id: string; numero: number; titulo: string }[]) {
    temaMap.set(t.numero, { id: t.id, titulo: t.titulo })
  }
  console.log(`📋 ${temaMap.size} temas de Correos en BD\n`)

  // Discover JSON files
  const jsonFiles = fs.readdirSync(CORREOS_DIR).filter(f => f.endsWith('.json'))
  if (jsonFiles.length === 0) {
    console.log('ℹ️  No se encontraron JSON en data/correos/')
    return
  }

  let totalInsertadas = 0
  let totalErrors = 0

  for (const file of jsonFiles) {
    const targetTemas = FILE_TO_TEMAS[file]
    if (!targetTemas) {
      console.log(`  ⏭️  ${file} — sin mapeo a temas BD, skip`)
      continue
    }

    const data: CorreosJSON = JSON.parse(fs.readFileSync(path.join(CORREOS_DIR, file), 'utf-8'))
    console.log(`\n📥 ${file}: "${data.titulo}" (${data.contenido.length} secciones) → temas ${targetTemas.join(', ')}`)

    for (const temaNum of targetTemas) {
      const tema = temaMap.get(temaNum)
      if (!tema) {
        console.log(`  ⚠️  Tema ${temaNum} no existe en BD, skip`)
        continue
      }

      for (const seccion of data.contenido) {
        const h = hash(seccion.subtema, seccion.texto)

        if (dryRun) {
          console.log(`  📝 [DRY] Tema ${temaNum}: ${seccion.subtema.slice(0, 60)}`)
          totalInsertadas++
          continue
        }

        // Check if exists
        const { data: existing } = await (supabase as any)
          .from('conocimiento_tecnico')
          .select('id, hash_sha256')
          .eq('bloque', 'correos')
          .eq('tema_id', tema.id)
          .eq('titulo_seccion', seccion.subtema)
          .maybeSingle()

        if ((existing as any)?.hash_sha256 === h) continue // no changes

        // Generate embedding
        const embedding = await embed(openai, `${seccion.subtema}\n\n${seccion.texto}`)
        if (!embedding) { totalErrors++; continue }

        // Upsert
        const { error } = await (supabase as any)
          .from('conocimiento_tecnico')
          .upsert({
            bloque: 'correos',
            tema_id: tema.id,
            titulo_seccion: seccion.subtema,
            contenido: seccion.texto,
            fuente_url: data.fuente ?? 'correos.es',
            hash_sha256: h,
            embedding: embedding as unknown as string,
            activo: true,
          }, { onConflict: 'bloque,tema_id,titulo_seccion' })

        if (error) {
          console.error(`  ❌ ${seccion.subtema}: ${error.message}`)
          totalErrors++
        } else {
          totalInsertadas++
        }

        await sleep(300) // rate limit embeddings
      }
    }
  }

  console.log('\n' + '='.repeat(55))
  console.log(`✅ ${totalInsertadas} secciones insertadas | ${totalErrors} errores`)
  if (dryRun) console.log('Re-run without --dry-run to write to DB')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
