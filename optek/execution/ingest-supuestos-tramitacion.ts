#!/usr/bin/env tsx
/**
 * execution/ingest-supuestos-tramitacion.ts
 *
 * Inserts parsed Tramitación Procesal supuestos oficiales into free_supuesto_bank + supuesto_bank.
 *
 * Data sources:
 *   - 2024: data/examenes_justicia/tramitacion/2024/supuesto_ej2_a.json (1 supuesto)
 *
 * Rules:
 *   - First supuesto → free_supuesto_bank (free users see this one)
 *   - ALL supuestos → supuesto_bank (premium bank), dedup by fuente
 *
 * Usage: pnpm ingest:supuestos-tramitacion [--dry-run]
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

// ─── Constants ─────────────────────────────────────────────────────────────

const OPOSICION_ID_TRAMITACION = 'e1000000-0000-0000-0000-000000000001'

// ─── Types ─────────────────────────────────────────────────────────────────

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
  caso?: { escenario: string; bloques_cubiertos?: string[] }
  escenario?: string
  preguntas: RawPregunta[]
  preguntas_reserva?: { numero: number; correcta: number; enunciado?: string; opciones?: string[] }[]
}

interface RawFile {
  convocatoria: string
  anno: number
  supuestos: RawSupuesto[]
}

// ─── Transform to DB schema ────────────────────────────────────────────────

function transformCaso(supuesto: RawSupuesto) {
  const escenario = supuesto.escenario ?? supuesto.caso?.escenario ?? ''
  const bloques_cubiertos = supuesto.caso?.bloques_cubiertos ?? ['Derecho procesal civil', 'Derecho procesal penal']
  return {
    titulo: supuesto.titulo,
    escenario,
    bloques_cubiertos,
  }
}

function transformPreguntas(supuesto: RawSupuesto): RawPregunta[] {
  return supuesto.preguntas.filter(p => !p.anulada)
}

function buildFuente(anno: number, supuestoId: string): string {
  return `TRAMITACION-${anno}-L-${supuestoId}`
}

// ─── Data sources ──────────────────────────────────────────────────────────

interface DataSource {
  filePath: string
  label: string
}

const DATA_SOURCES: DataSource[] = [
  {
    filePath: path.join(__dirname, '..', '..', 'data', 'examenes_justicia', 'tramitacion', '2024', 'supuesto_ej2_a.json'),
    label: '2024 Tramitación (Modelo A)',
  },
]

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(dryRun ? '🏃 DRY RUN — no DB writes' : '💾 LIVE — writing to DB')
  console.log(`Oposición ID (Tramitación): ${OPOSICION_ID_TRAMITACION}\n`)

  let totalInsertedBank = 0
  let totalSkippedBank = 0
  let freeInserted = false

  // Collect all supuestos from all sources
  const allSupuestos: { supuesto: RawSupuesto; anno: number; label: string }[] = []

  for (const source of DATA_SOURCES) {
    if (!fs.existsSync(source.filePath)) {
      console.error(`❌ File not found: ${source.filePath}`)
      process.exit(1)
    }
    const raw: RawFile = JSON.parse(fs.readFileSync(source.filePath, 'utf-8'))
    console.log(`Loaded ${raw.supuestos.length} supuestos from ${source.label} (${raw.anno})`)

    for (const supuesto of raw.supuestos) {
      allSupuestos.push({ supuesto, anno: raw.anno, label: source.label })
    }
  }

  console.log(`\nTotal supuestos to process: ${allSupuestos.length}\n`)

  // ── 1. Insert first supuesto into free_supuesto_bank ──────────────────────
  const firstSupuesto = allSupuestos[0]
  if (!firstSupuesto) {
    console.error('❌ No supuestos found')
    process.exit(1)
  }

  const freeRecord = {
    oposicion_id: OPOSICION_ID_TRAMITACION,
    caso: transformCaso(firstSupuesto.supuesto),
    preguntas: transformPreguntas(firstSupuesto.supuesto),
    es_oficial: true,
    fuente: buildFuente(firstSupuesto.anno, firstSupuesto.supuesto.id),
  }

  const nonAnuladasFree = freeRecord.preguntas.length
  console.log(`📋 free_supuesto_bank: "${firstSupuesto.supuesto.titulo}" (${nonAnuladasFree} preguntas, ${firstSupuesto.supuesto.preguntas.length - nonAnuladasFree} anuladas filtered)`)

  if (!dryRun) {
    const { error } = await supabase
      .from('free_supuesto_bank')
      .upsert(freeRecord, { onConflict: 'oposicion_id' })
    if (error) {
      console.error('  ❌ Error inserting free_supuesto_bank:', error.message)
    } else {
      console.log('  ✅ Inserted into free_supuesto_bank')
      freeInserted = true
    }
  } else {
    freeInserted = true
  }

  // ── 2. Insert ALL supuestos into supuesto_bank (premium) ──────────────────
  console.log()
  for (const { supuesto, anno, label } of allSupuestos) {
    const fuente = buildFuente(anno, supuesto.id)
    const preguntas = transformPreguntas(supuesto)
    const bankRecord = {
      oposicion_id: OPOSICION_ID_TRAMITACION,
      caso: transformCaso(supuesto),
      preguntas,
      es_oficial: true,
      fuente,
    }

    const anuladas = supuesto.preguntas.length - preguntas.length
    console.log(`📋 supuesto_bank: "${supuesto.titulo}" [${anno}] (${preguntas.length} preguntas${anuladas > 0 ? `, ${anuladas} anuladas filtered` : ''})`)
    console.log(`   fuente: ${fuente}`)

    if (!dryRun) {
      // Dedup by fuente
      const { data: existing } = await supabase
        .from('supuesto_bank')
        .select('id')
        .eq('fuente', fuente)
        .maybeSingle()

      if (existing) {
        console.log('  ⏭️  Already exists, skipping')
        totalSkippedBank++
        continue
      }

      const { error } = await supabase
        .from('supuesto_bank')
        .insert(bankRecord)
      if (error) {
        console.error('  ❌ Error inserting supuesto_bank:', error.message)
      } else {
        console.log('  ✅ Inserted into supuesto_bank')
        totalInsertedBank++
      }
    } else {
      totalInsertedBank++
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n─── Summary ───')
  console.log(`free_supuesto_bank: ${freeInserted ? '✅ 1 record' : '❌ failed'}`)
  console.log(`supuesto_bank: ${totalInsertedBank} inserted, ${totalSkippedBank} skipped (dedup)`)
  console.log('\n✅ Done!')
  if (dryRun) console.log('Re-run without --dry-run to write to DB')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
