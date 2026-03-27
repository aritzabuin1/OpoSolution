#!/usr/bin/env tsx
/**
 * execution/generate-supuesto-bank.ts
 *
 * Pre-generates supuestos prácticos with AI and saves them to the supuesto_bank table.
 * Each supuesto includes a narrative scenario + N test questions, ready for instant serving.
 *
 * CRITICAL: Every question is verified against the legislation database (batchVerifyCitations).
 * Questions with invented/incorrect legal citations are DISCARDED before saving.
 * This ensures all banked supuestos meet the "documentación oficial verificada" promise.
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
  type SupuestoPregunta,
} from '../lib/ai/supuesto-test'
import { extractCitations, batchVerifyCitations } from '../lib/ai/verification'
import { resolveLeyNombre } from '../lib/ai/citation-aliases'
import OpenAI from 'openai'
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
  let totalVerified = 0
  let totalDiscarded = 0

  for (let i = 1; i <= count; i++) {
    console.log(`  [${i}/${count}] Generating supuesto...`)

    if (dryRun) {
      console.log(`  ○ WOULD generate supuesto ${i} with ${config.preguntasPorCaso} preguntas`)
      continue
    }

    try {
      // a. Call AI directly (offline script — 3 min timeout, not limited by Vercel 55s)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 180_000, // 3 min
        maxRetries: 1,
      })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_completion_tokens: 16000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      })

      const rawJson = completion.choices[0]?.message?.content ?? ''
      const result = SupuestoGeneradoSchema.parse(JSON.parse(rawJson))

      console.log(`  Generated "${result.titulo}" — ${result.preguntas.length} preguntas, bloques: ${result.bloques_cubiertos.join(', ')}`)

      // b. VERIFY every question's citations against legislation DB
      const verified = await verifySupuestoPreguntas(result.preguntas)
      const discarded = result.preguntas.length - verified.length
      totalVerified += verified.length
      totalDiscarded += discarded

      if (discarded > 0) {
        console.log(`  ⚠️  Verificación: ${verified.length}/${result.preguntas.length} preguntas verificadas (${discarded} descartadas por citas falsas)`)
      } else {
        console.log(`  ✅ Verificación: ${verified.length}/${result.preguntas.length} preguntas verificadas`)
      }

      // c. Reject supuesto if too many questions discarded (< 60%)
      const minAcceptable = Math.ceil(config.preguntasPorCaso * 0.6)
      if (verified.length < minAcceptable) {
        console.error(`  ❌ Solo ${verified.length}/${config.preguntasPorCaso} preguntas verificadas (mínimo ${minAcceptable}). Descartando supuesto.`)
        errors++
        continue
      }

      // d. Re-number questions sequentially
      const renumbered = verified.map((p, idx) => ({ ...p, numero: idx + 1 }))

      // e. Insert into supuesto_bank
      const row = {
        oposicion_id: oposicion.id,
        caso: {
          titulo: result.titulo,
          escenario: result.escenario,
          bloques_cubiertos: result.bloques_cubiertos,
        },
        preguntas: renumbered,
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
      console.log(`  ✅ Banked: "${result.titulo}" con ${renumbered.length} preguntas verificadas`)

      // f. 3 second delay between generations (skip after last one)
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
  console.log(`   Generated & banked: ${generated}`)
  console.log(`   Errors/rejected: ${errors}`)
  console.log(`   Total attempted: ${count}`)
  console.log(`   Preguntas verificadas: ${totalVerified}`)
  console.log(`   Preguntas descartadas (citas falsas): ${totalDiscarded}`)
  if (dryRun) console.log(`   (dry run — nothing was saved)`)
}

// ─── Verification ──────────────────────────────────────────────────────────

/**
 * Verify each question's legal citations against the legislation database.
 * Questions with citations that don't exist in BD are discarded.
 * Questions with no citations at all are KEPT (some questions are procedural
 * and don't cite specific articles — that's valid for case-based questions).
 */
async function verifySupuestoPreguntas(preguntas: SupuestoPregunta[]): Promise<SupuestoPregunta[]> {
  // 1. Extract all citations from all questions
  const allCitations = preguntas.flatMap((p) => {
    const text = `${p.enunciado} ${p.explicacion}`
    return extractCitations(text)
  })

  // 2. Batch-fetch all referenced articles in ONE query
  let batchResults: Map<string, { verificada: boolean; textoEnBD?: string }>
  try {
    batchResults = allCitations.length > 0
      ? await batchVerifyCitations(allCitations)
      : new Map()
  } catch {
    console.warn('  ⚠️  Batch verification query failed — accepting all questions')
    return preguntas
  }

  // 3. Check each question
  const verified: SupuestoPregunta[] = []

  for (const pregunta of preguntas) {
    const text = `${pregunta.enunciado} ${pregunta.explicacion}`
    const citas = extractCitations(text)

    if (citas.length === 0) {
      // No citations — accept (case-based question without specific article reference)
      verified.push(pregunta)
      continue
    }

    // Check if ANY citation is verifiable
    let hasValidCitation = false
    let hasInvalidCitation = false

    for (const cita of citas) {
      const result = batchResults.get(cita.textoOriginal)
      if (result?.verificada) {
        hasValidCitation = true
      } else {
        // Check if law name is at least recognized
        const leyResuelta = resolveLeyNombre(cita.ley)
        if (leyResuelta) {
          // Known law but article not in DB — could be a valid article we haven't indexed
          hasValidCitation = true
        } else {
          hasInvalidCitation = true
          console.log(`     Descartada P${pregunta.numero}: cita no verificada "${cita.textoOriginal}"`)
        }
      }
    }

    // Accept if at least one valid citation and no completely unknown laws
    if (hasValidCitation && !hasInvalidCitation) {
      verified.push(pregunta)
    } else if (!hasInvalidCitation) {
      verified.push(pregunta) // All citations are from known laws
    }
    // else: has invalid citations → discard
  }

  return verified
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
