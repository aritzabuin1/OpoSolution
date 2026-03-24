#!/usr/bin/env tsx
/**
 * execution/generate-free-bank.ts
 *
 * Generates the fixed free question bank: 10 questions per tema per oposición.
 * All free users see the SAME questions — €0 after initial generation.
 *
 * Usage: pnpm generate:free-bank [--oposicion <slug>] [--dry-run]
 *
 * Cost estimate: ~€5 total for all oposiciones (one-time).
 */

import { createClient } from '@supabase/supabase-js'
import { generateTest } from '../lib/ai/generate-test'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// We need a real admin user_id because generateTest() inserts into tests_generados
// which has a FK to auth.users. Pass --user-id <uuid> or set ADMIN_USER_ID env var.
const ADMIN_USER_ID = process.env.ADMIN_USER_ID ?? (() => {
  const idx = process.argv.indexOf('--user-id')
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  console.error('ERROR: Need admin user_id. Pass --user-id <uuid> or set ADMIN_USER_ID env var.')
  console.error('Find your user_id in Supabase Dashboard → Authentication → Users')
  process.exit(1)
})()

interface Tema {
  id: string
  numero: number
  titulo: string
  oposicion_id: string
  bloque: string | null
}

interface Oposicion {
  id: string
  nombre: string
  slug: string
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const opoFilter = args.indexOf('--oposicion') !== -1
    ? args[args.indexOf('--oposicion') + 1]
    : null

  console.log(`\n🏦 Generate Free Question Bank`)
  console.log(`   Dry run: ${dryRun}`)
  console.log(`   Filter: ${opoFilter ?? 'all oposiciones'}\n`)

  // Fetch oposiciones
  const { data: oposiciones } = await supabase
    .from('oposiciones')
    .select('id, nombre, slug')

  if (!oposiciones?.length) {
    console.error('No oposiciones found')
    process.exit(1)
  }

  const activeOpos = opoFilter
    ? (oposiciones as Oposicion[]).filter(o => o.slug === opoFilter)
    : oposiciones as Oposicion[]

  console.log(`Found ${activeOpos.length} oposicion(es)\n`)

  // Fetch all temas
  const { data: allTemas } = await supabase
    .from('temas')
    .select('id, numero, titulo, oposicion_id, bloque')
    .order('numero')

  if (!allTemas?.length) {
    console.error('No temas found')
    process.exit(1)
  }

  // Check existing bank entries
  const { data: existingBank } = await supabase
    .from('free_question_bank')
    .select('oposicion_id, tema_id')

  const existingSet = new Set(
    (existingBank ?? []).map((e: { oposicion_id: string; tema_id: string }) =>
      `${e.oposicion_id}:${e.tema_id}`
    )
  )

  let generated = 0
  let skipped = 0
  let errors = 0

  for (const opo of activeOpos) {
    const temas = (allTemas as Tema[]).filter(t => t.oposicion_id === opo.id)
    console.log(`\n📚 ${opo.nombre} (${opo.slug}) — ${temas.length} temas`)

    for (const tema of temas) {
      const key = `${opo.id}:${tema.id}`

      if (existingSet.has(key)) {
        console.log(`  ✓ Tema ${tema.numero} "${tema.titulo}" — ya existe, skip`)
        skipped++
        continue
      }

      if (dryRun) {
        console.log(`  ○ Tema ${tema.numero} "${tema.titulo}" — WOULD generate`)
        continue
      }

      try {
        console.log(`  ⏳ Tema ${tema.numero} "${tema.titulo}" — generando...`)

        // Generate test using existing pipeline (AI + verification)
        const test = await generateTest({
          temaId: tema.id,
          numPreguntas: 10,
          dificultad: 'media',
          userId: ADMIN_USER_ID,
          requestId: `free-bank-${opo.slug}-${tema.numero}`,
          oposicionId: opo.id,
        })

        // Save to free_question_bank
        const { error: insertError } = await supabase
          .from('free_question_bank')
          .insert({
            oposicion_id: opo.id,
            tema_id: tema.id,
            tema_numero: tema.numero,
            preguntas: test.preguntas,
            validated: true,
          })

        if (insertError) {
          console.error(`  ❌ Insert error for tema ${tema.numero}:`, insertError.message)
          errors++
          continue
        }

        // Delete the tests_generados entry created by generateTest (it's for SYSTEM_USER)
        await supabase
          .from('tests_generados')
          .delete()
          .eq('id', test.id)

        console.log(`  ✅ Tema ${tema.numero} — ${test.preguntas.length} preguntas guardadas`)
        generated++

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  ❌ Tema ${tema.numero} — ${msg}`)
        errors++
      }
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Generados: ${generated}`)
  console.log(`   Existentes (skip): ${skipped}`)
  console.log(`   Errores: ${errors}`)
  console.log(`   Total temas procesados: ${generated + skipped + errors}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
