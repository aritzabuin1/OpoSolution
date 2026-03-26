#!/usr/bin/env tsx
/**
 * execution/generate-supuesto-bank.ts
 *
 * Pre-generates supuestos prácticos with AI and saves them to the supuesto_bank table.
 * Each supuesto includes a narrative scenario + N test questions, ready for instant serving.
 *
 * Usage: pnpm seed:supuestos --oposicion administrativo-estado --count 5 [--dry-run]
 *
 * Cost estimate: ~€0.50 per supuesto (heavy model, ~16K output tokens).
 */

import { createClient } from '@supabase/supabase-js'
import {
  getSupuestoTestConfig,
  getSystemPrompt,
  buildUserPrompt,
  SupuestoGeneradoSchema,
} from '../lib/ai/supuesto-test'
import { callAIJSON } from '../lib/ai/provider'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  // --oposicion (required)
  const opoIdx = args.indexOf('--oposicion')
  if (opoIdx === -1 || !args[opoIdx + 1]) {
    console.error('ERROR: --oposicion <slug> is required')
    console.error('Usage: pnpm seed:supuestos --oposicion administrativo-estado --count 5 [--dry-run]')
    process.exit(1)
  }
  const opoSlug = args[opoIdx + 1]

  // --count (default 5)
  const countIdx = args.indexOf('--count')
  const count = countIdx !== -1 && args[countIdx + 1] ? parseInt(args[countIdx + 1], 10) : 5
  if (isNaN(count) || count < 1) {
    console.error('ERROR: --count must be a positive integer')
    process.exit(1)
  }

  console.log(`\n📝 Generate Supuesto Bank`)
  console.log(`   Oposicion: ${opoSlug}`)
  console.log(`   Count: ${count}`)
  console.log(`   Dry run: ${dryRun}\n`)

  // 1. Validate supuesto config exists for this slug
  const config = getSupuestoTestConfig(opoSlug)
  if (!config) {
    console.error(`ERROR: No supuesto test config found for slug "${opoSlug}"`)
    console.error('Available slugs: administrativo-estado, auxilio-judicial, tramitacion-procesal, gestion-procesal')
    process.exit(1)
  }

  // 2. Get oposicion_id from slug
  const { data: oposicion, error: opoError } = await supabase
    .from('oposiciones')
    .select('id, nombre, slug')
    .eq('slug', opoSlug)
    .single()

  if (opoError || !oposicion) {
    console.error(`ERROR: Oposicion with slug "${opoSlug}" not found in database`)
    if (opoError) console.error(opoError.message)
    process.exit(1)
  }

  console.log(`   Oposicion ID: ${oposicion.id}`)
  console.log(`   Nombre: ${oposicion.nombre}`)
  console.log(`   Preguntas por caso: ${config.preguntasPorCaso}`)
  console.log(`   Tematica: ${config.tematica}\n`)

  const fuente = `ai-supuesto-test-${opoSlug}-1.0`
  const systemPrompt = getSystemPrompt(config)
  const userPrompt = buildUserPrompt(config)

  let generated = 0
  let errors = 0

  for (let i = 1; i <= count; i++) {
    console.log(`  [${i}/${count}] Generating supuesto...`)

    if (dryRun) {
      console.log(`  ○ WOULD generate supuesto ${i} with ${config.preguntasPorCaso} preguntas`)
      continue
    }

    try {
      // a. Call AI
      const result = await callAIJSON(
        systemPrompt,
        userPrompt,
        SupuestoGeneradoSchema,
        {
          maxTokens: 16000,
          useHeavyModel: true,
          requestId: `seed-supuesto-${opoSlug}-${i}`,
          endpoint: 'generate-supuesto-bank',
        }
      )

      console.log(`  ✅ "${result.titulo}" — ${result.preguntas.length} preguntas, bloques: ${result.bloques_cubiertos.join(', ')}`)

      // b. Transform and insert into supuesto_bank
      const row = {
        oposicion_id: oposicion.id,
        caso: {
          titulo: result.titulo,
          escenario: result.escenario,
          bloques_cubiertos: result.bloques_cubiertos,
        },
        preguntas: result.preguntas,
        es_oficial: false,
        fuente,
      }

      const { error: insertError } = await supabase
        .from('supuesto_bank')
        .insert(row)

      if (insertError) {
        console.error(`  ❌ Insert error for supuesto ${i}:`, insertError.message)
        errors++
        continue
      }

      generated++

      // e. 3 second delay between generations (skip after last one)
      if (i < count) {
        console.log(`  ⏳ Waiting 3s...`)
        await new Promise(r => setTimeout(r, 3000))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ Supuesto ${i} failed: ${msg}`)
      errors++
    }
  }

  // 7. Print summary
  console.log(`\n📊 Summary:`)
  console.log(`   Generated: ${generated}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total attempted: ${count}`)
  if (dryRun) console.log(`   (dry run — nothing was saved)`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
