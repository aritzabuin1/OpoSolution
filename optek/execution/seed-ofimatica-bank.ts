#!/usr/bin/env tsx
/**
 * execution/seed-ofimatica-bank.ts
 *
 * Seeds question_bank + free_question_bank with ofimática questions
 * for Tramitación Procesal (temas 32-37).
 *
 * Uses the existing generate-test pipeline (AI + verification).
 * Requires: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: pnpm seed:ofimatica
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envLines = readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
const env: Record<string, string> = {}
for (const l of envLines) {
  const eq = l.indexOf('=')
  if (eq > 0) {
    const key = l.slice(0, eq).trim()
    const val = l.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
    env[key] = val
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const TRAMITACION_ID = 'e1000000-0000-0000-0000-000000000001'
const OFIMATICA_TEMAS = [32, 33, 34, 35, 36, 37]

async function main() {
  console.log('\n🖥️  Seed Ofimática Bank — Tramitación Procesal')
  console.log('================================================\n')

  // Get admin user_id
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single()

  if (!admin?.id) {
    console.error('No admin user found in profiles (is_admin=true)')
    process.exit(1)
  }
  console.log(`Admin user: ${admin.id}\n`)

  // Get ofimática temas
  const { data: temas } = await supabase
    .from('temas')
    .select('id, numero, titulo')
    .eq('oposicion_id', TRAMITACION_ID)
    .in('numero', OFIMATICA_TEMAS)
    .order('numero')

  if (!temas?.length) {
    console.error('No ofimática temas found for Tramitación')
    process.exit(1)
  }

  console.log(`Found ${temas.length} temas: ${temas.map(t => `${t.numero}`).join(', ')}\n`)

  // Check what's already in the banks
  const { data: existingFree } = await supabase
    .from('free_question_bank')
    .select('tema_id')
    .eq('oposicion_id', TRAMITACION_ID)

  const existingFreeSet = new Set((existingFree ?? []).map((r: { tema_id: string }) => r.tema_id))

  const { data: existingBank } = await supabase
    .from('question_bank')
    .select('tema_id')
    .eq('oposicion_id', TRAMITACION_ID)

  const existingBankTemas = new Set((existingBank ?? []).map((r: { tema_id: string }) => r.tema_id))

  // Dynamic import of generateTest (ESM module)
  const { generateTest } = await import('../lib/ai/generate-test.js')

  let generated = 0
  let skipped = 0

  for (const tema of temas as { id: string; numero: number; titulo: string }[]) {
    const hasFree = existingFreeSet.has(tema.id)
    const hasBank = existingBankTemas.has(tema.id)

    if (hasFree && hasBank) {
      console.log(`✓ Tema ${tema.numero} "${tema.titulo}" — ya existe en ambos bancos`)
      skipped++
      continue
    }

    console.log(`⏳ Tema ${tema.numero} "${tema.titulo}" — generando 10 preguntas...`)

    try {
      const result = await generateTest({
        temaId: tema.id,
        numPreguntas: 10,
        dificultad: 'media',
        userId: admin.id,
        requestId: `seed-ofi-${tema.numero}`,
        oposicionId: TRAMITACION_ID,
      })

      if (!result?.preguntas?.length) {
        console.log(`  ❌ No se generaron preguntas`)
        continue
      }

      // Save to free_question_bank if not exists
      if (!hasFree) {
        const { error } = await supabase
          .from('free_question_bank')
          .upsert({
            oposicion_id: TRAMITACION_ID,
            tema_id: tema.id,
            tema_numero: tema.numero,
            preguntas: result.preguntas,
            validated: true,
          }, { onConflict: 'oposicion_id,tema_id' })

        if (error) console.log(`  ⚠️ free_bank insert error: ${error.message}`)
        else console.log(`  ✅ free_question_bank: ${result.preguntas.length} preguntas`)
      }

      // question_bank gets populated automatically by generateTest() pipeline
      // (the route auto-fills it after AI generation)

      // Clean up the tests_generados entry (we only wanted the bank data)
      if (result.id) {
        await supabase.from('tests_generados').delete().eq('id', result.id)
      }

      generated++
      console.log(`  ✅ Tema ${tema.numero} done (${result.preguntas.length} preguntas)`)

      // Rate limit
      await new Promise(r => setTimeout(r, 3000))
    } catch (err) {
      console.error(`  ❌ Error: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n================================================`)
  console.log(`✅ Generados: ${generated} | Existentes: ${skipped}`)
  console.log(`\nEl simulacro de 3 partes de Tramitación ahora incluirá ofimática.`)
}

main().catch(err => { console.error(err); process.exit(1) })
