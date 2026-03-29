#!/usr/bin/env tsx
/**
 * Quick script: copy ofimática questions from free_question_bank to question_bank.
 * The seed script populated free_question_bank but NOT question_bank.
 * The simulacro endpoint reads from question_bank.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envLines = readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
for (const l of envLines) {
  const eq = l.indexOf('=')
  if (eq > 0 && !process.env[l.slice(0, eq).trim()]) {
    process.env[l.slice(0, eq).trim()] = l.slice(eq + 1).trim()
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const TRAMITACION_ID = 'e1000000-0000-0000-0000-000000000001'
const OFI_TEMAS = [32, 33, 34, 35, 36, 37]

async function main() {
  console.log('Copying ofimática questions from free_question_bank → question_bank\n')

  // Get tema IDs
  const { data: temas } = await supabase
    .from('temas')
    .select('id, numero')
    .eq('oposicion_id', TRAMITACION_ID)
    .in('numero', OFI_TEMAS)

  if (!temas?.length) { console.error('No temas found'); return }

  for (const tema of temas as { id: string; numero: number }[]) {
    // Get free bank questions
    const { data: freeBank } = await supabase
      .from('free_question_bank')
      .select('preguntas')
      .eq('oposicion_id', TRAMITACION_ID)
      .eq('tema_id', tema.id)
      .maybeSingle()

    if (!freeBank?.preguntas) {
      console.log(`  ⚠️ Tema ${tema.numero}: no free bank`)
      continue
    }

    const preguntas = freeBank.preguntas as Array<{
      enunciado: string; opciones: Array<{ texto: string }>; correcta: number;
      explicacion?: string; cita?: { ley?: string; articulo?: string }
    }>

    let inserted = 0
    for (const p of preguntas) {
      const hash = createHash('md5').update(p.enunciado).digest('hex')
      const correctaChar = ['a', 'b', 'c', 'd'][p.correcta] ?? 'a'
      const opciones = p.opciones.map(o => typeof o === 'string' ? o : o.texto)

      const { error } = await supabase
        .from('question_bank')
        .upsert({
          oposicion_id: TRAMITACION_ID,
          tema_id: tema.id,
          dificultad: 'media',
          enunciado: p.enunciado,
          opciones,
          correcta: correctaChar,
          explicacion: p.explicacion ?? null,
          cita_ley: p.cita?.ley ?? null,
          cita_articulo: p.cita?.articulo ?? null,
          enunciado_hash: hash,
          legal_key: null,
        }, { onConflict: 'enunciado_hash', ignoreDuplicates: true })

      if (!error) inserted++
    }
    console.log(`  ✅ Tema ${tema.numero}: ${inserted}/${preguntas.length} preguntas → question_bank`)
  }

  console.log('\nDone. Simulacro 3 partes debería funcionar ahora.')
}

main().catch(console.error)
