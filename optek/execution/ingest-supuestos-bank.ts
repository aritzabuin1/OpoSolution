#!/usr/bin/env tsx
/**
 * execution/ingest-supuestos-bank.ts
 *
 * Inserts parsed supuestos oficiales into free_supuesto_bank + supuesto_bank.
 *
 * - Supuesto I → free_supuesto_bank (all free users see this one)
 * - Supuesto I + II → supuesto_bank (premium users get variety)
 *
 * Usage: pnpm ingest:supuestos [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const dryRun = process.argv.includes('--dry-run')

// ─── Oposicion IDs ──────────────────────────────────────────────────────────

const OPOSICION_IDS: Record<string, string> = {
  'c1-age': 'b0000000-0000-0000-0000-000000000001',
}

// ─── Data sources ───────────────────────────────────────────────────────────

interface RawPregunta {
  numero: number
  enunciado: string
  opciones: string[]
  correcta: number
  anulada: boolean
}

interface RawSupuesto {
  id: string
  titulo: string
  caso?: { escenario: string }
  escenario?: string  // modelo B has escenario at top level
  preguntas: RawPregunta[]
  preguntas_reserva?: { numero: number; correcta: number; enunciado?: string; opciones?: string[] }[]
}

interface RawFile {
  convocatoria: string
  anno: number
  supuestos: RawSupuesto[]
}

// ─── Transform to DB schema ─────────────────────────────────────────────────

function transformCaso(supuesto: RawSupuesto) {
  const escenario = supuesto.escenario ?? supuesto.caso?.escenario ?? ''
  return {
    titulo: supuesto.titulo,
    escenario,
    bloques_cubiertos: ['II', 'III', 'IV', 'V'], // AGE C1 supuesto covers these blocks
  }
}

function transformPreguntas(supuesto: RawSupuesto): RawPregunta[] {
  // Only non-anulada questions
  return supuesto.preguntas.filter(p => !p.anulada)
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(dryRun ? '🏃 DRY RUN — no DB writes' : '💾 LIVE — writing to DB')

  // Load C1 AGE supuestos
  const dataPath = path.join(__dirname, '..', '..', 'data', 'examenes_c1', '2024', 'supuestos_a.json')
  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`)
    process.exit(1)
  }
  const raw: RawFile = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`Loaded ${raw.supuestos.length} supuestos from ${raw.convocatoria}`)

  const oposicionId = OPOSICION_IDS['c1-age']

  // ── 1. Insert Supuesto I into free_supuesto_bank ──────────────────────────
  const supuesto1 = raw.supuestos[0]
  const freeRecord = {
    oposicion_id: oposicionId,
    caso: transformCaso(supuesto1),
    preguntas: transformPreguntas(supuesto1),
    es_oficial: true,
    fuente: `INAP-${raw.anno}-ADVO-L-ModeloA-${supuesto1.id}`,
  }

  console.log(`\n📋 free_supuesto_bank: "${supuesto1.titulo}" (${freeRecord.preguntas.length} preguntas)`)
  if (!dryRun) {
    const { error } = await supabase
      .from('free_supuesto_bank')
      .upsert(freeRecord, { onConflict: 'oposicion_id' })
    if (error) {
      console.error('  ❌ Error inserting free_supuesto_bank:', error.message)
    } else {
      console.log('  ✅ Inserted into free_supuesto_bank')
    }
  }

  // ── 2. Insert ALL supuestos into supuesto_bank (premium) ──────────────────
  for (const supuesto of raw.supuestos) {
    const bankRecord = {
      oposicion_id: oposicionId,
      caso: transformCaso(supuesto),
      preguntas: transformPreguntas(supuesto),
      es_oficial: true,
      fuente: `INAP-${raw.anno}-ADVO-L-ModeloA-${supuesto.id}`,
    }

    console.log(`📋 supuesto_bank: "${supuesto.titulo}" (${bankRecord.preguntas.length} preguntas)`)
    if (!dryRun) {
      // Check if already exists by fuente
      const { data: existing } = await supabase
        .from('supuesto_bank')
        .select('id')
        .eq('fuente', bankRecord.fuente)
        .maybeSingle()

      if (existing) {
        console.log('  ⏭️  Already exists, skipping')
        continue
      }

      const { error } = await supabase
        .from('supuesto_bank')
        .insert(bankRecord)
      if (error) {
        console.error('  ❌ Error inserting supuesto_bank:', error.message)
      } else {
        console.log('  ✅ Inserted into supuesto_bank')
      }
    }
  }

  // ── 3. Insert Modelo B supuestos into supuesto_bank ────────────────────
  const dataBPath = path.join(__dirname, '..', '..', 'data', 'examenes_c1', '2024', 'supuestos_b.json')
  if (fs.existsSync(dataBPath)) {
    const rawB: RawFile = JSON.parse(fs.readFileSync(dataBPath, 'utf-8'))
    console.log(`\nLoaded ${rawB.supuestos.length} supuestos from Modelo B`)

    for (const supuesto of rawB.supuestos) {
      const bankRecord = {
        oposicion_id: oposicionId,
        caso: transformCaso(supuesto),
        preguntas: transformPreguntas(supuesto),
        es_oficial: true,
        fuente: `INAP-${rawB.anno}-ADVO-L-ModeloB-${supuesto.id}`,
      }

      console.log(`📋 supuesto_bank (B): "${supuesto.titulo}" (${bankRecord.preguntas.length} preguntas)`)
      if (!dryRun) {
        const { data: existing } = await supabase
          .from('supuesto_bank')
          .select('id')
          .eq('fuente', bankRecord.fuente)
          .maybeSingle()

        if (existing) {
          console.log('  ⏭️  Already exists, skipping')
          continue
        }

        const { error } = await supabase
          .from('supuesto_bank')
          .insert(bankRecord)
        if (error) {
          console.error('  ❌ Error inserting supuesto_bank:', error.message)
        } else {
          console.log('  ✅ Inserted into supuesto_bank')
        }
      }
    }
  } else {
    console.log('\nNo modelo B file found, skipping')
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n✅ Done!')
  if (dryRun) console.log('Re-run without --dry-run to write to DB')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
