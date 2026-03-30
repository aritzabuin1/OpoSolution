#!/usr/bin/env tsx
/**
 * execution/seed-supuesto-bank-iipp.ts
 *
 * Seeds supuesto_bank for Penitenciarias with pre-built supuestos.
 * Each supuesto: 1 scenario + 5 test questions from the free bank.
 * Creates 8 supuestos (matching the exam format: 8 supuestos × 5 preguntas = 40).
 *
 * Usage: pnpm seed:supuestos-iipp [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

const PENITENCIARIAS_ID = 'f1000000-0000-0000-0000-000000000001'
const dryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pre-built supuesto scenarios for Penitenciarias
const SUPUESTOS = [
  {
    titulo: 'Supuesto 1: Ingreso y clasificación',
    escenario: 'Un interno ingresa por primera vez en un centro penitenciario tras sentencia firme. El equipo técnico debe proceder a su clasificación inicial.',
    bloques_cubiertos: ['III'],
    temas: [30, 32, 34, 36], // Relación jurídica, Régimen, Establecimientos, Tratamiento
  },
  {
    titulo: 'Supuesto 2: Régimen disciplinario',
    escenario: 'Un interno protagoniza un altercado en el patio del módulo, causando lesiones leves a otro interno y daños materiales.',
    bloques_cubiertos: ['III'],
    temas: [33, 42, 43], // Seguridad, Régimen disciplinario, JVP
  },
  {
    titulo: 'Supuesto 3: Permisos de salida',
    escenario: 'Un interno clasificado en segundo grado solicita un permiso ordinario de salida. Tiene dos sanciones canceladas y lleva cumplida la cuarta parte de la condena.',
    bloques_cubiertos: ['III'],
    temas: [34, 36, 39, 40], // Establecimientos, Tratamiento, Permisos, Libertad
  },
  {
    titulo: 'Supuesto 4: Libertad condicional',
    escenario: 'La Junta de Tratamiento estudia la propuesta de tercer grado y posterior libertad condicional de un interno que ha cumplido tres cuartas partes de la condena.',
    bloques_cubiertos: ['III'],
    temas: [36, 38, 40, 43], // Tratamiento, Relación laboral, Libertad, JVP
  },
  {
    titulo: 'Supuesto 5: Suspensión de pena y alternativas',
    escenario: 'Un condenado a 2 años de prisión por un delito de lesiones solicita la suspensión de la ejecución de la pena. No tiene antecedentes penales.',
    bloques_cubiertos: ['II', 'III'],
    temas: [19, 20, 21, 41], // Penas, Formas sustitutivas, Suspensión, Formas especiales
  },
  {
    titulo: 'Supuesto 6: Asistencia sanitaria y prevención',
    escenario: 'El servicio médico del centro penitenciario detecta que un interno presenta signos de consumo activo de sustancias y conducta autolesiva.',
    bloques_cubiertos: ['III', 'IV'],
    temas: [31, 47, 48, 50], // Prestaciones, Prevención suicidios (ahora régimen admin), Conducta
  },
  {
    titulo: 'Supuesto 7: Delitos y responsabilidad funcionarial',
    escenario: 'Durante un cacheo rutinario, un funcionario de prisiones encuentra sustancias prohibidas en la celda de un interno.',
    bloques_cubiertos: ['I', 'II'],
    temas: [9, 22, 23, 25], // TREBEP, Delitos patrimonio, Drogas, Delitos funcionarios
  },
  {
    titulo: 'Supuesto 8: Organización y régimen económico',
    escenario: 'La Junta de Tratamiento y el Consejo de Dirección deben adoptar medidas ante la llegada de un grupo numeroso de internos preventivos por traslado.',
    bloques_cubiertos: ['I', 'III'],
    temas: [7, 8, 32, 44, 45], // Min Interior, Personal IIPP, Régimen, Organización, Régimen económico
  },
]

async function main() {
  console.log(`\n📚 Seed supuesto_bank — Penitenciarias (8 supuestos × 5 preguntas)`)
  console.log(`   Dry run: ${dryRun}\n`)

  // Fetch free bank questions for Penitenciarias
  const { data: bankData } = await supabase
    .from('free_question_bank')
    .select('tema_numero, preguntas')
    .eq('oposicion_id', PENITENCIARIAS_ID)

  if (!bankData?.length) {
    console.error('ERROR: No free_question_bank found for Penitenciarias')
    process.exit(1)
  }

  const questionsByTema = new Map<number, unknown[]>()
  for (const row of bankData as { tema_numero: number; preguntas: unknown[] }[]) {
    questionsByTema.set(row.tema_numero, row.preguntas)
  }

  let inserted = 0

  for (const sup of SUPUESTOS) {
    // Pick 5 questions from the temas listed in this supuesto
    const questions: unknown[] = []
    for (const tema of sup.temas) {
      const temaQs = questionsByTema.get(tema) ?? []
      if (temaQs.length > 0) {
        // Pick 1-2 questions from each tema
        const pick = temaQs.slice(0, Math.ceil(5 / sup.temas.length))
        questions.push(...pick)
      }
    }
    // Ensure exactly 5 questions
    const final5 = questions.slice(0, 5)
    while (final5.length < 5) {
      // Fill with questions from any available tema
      for (const [, qs] of questionsByTema) {
        if (final5.length >= 5) break
        if ((qs as unknown[]).length > final5.length) {
          final5.push((qs as unknown[])[final5.length])
        }
      }
    }

    console.log(`  ${sup.titulo} — ${final5.length} preguntas`)

    if (dryRun) continue

    const { error } = await supabase
      .from('supuesto_bank')
      .insert({
        oposicion_id: PENITENCIARIAS_ID,
        caso: {
          titulo: sup.titulo,
          escenario: sup.escenario,
          bloques_cubiertos: sup.bloques_cubiertos,
        },
        preguntas: final5,
        fuente: `seed-iipp-${sup.titulo.split(':')[0].trim().toLowerCase().replace(/\s+/g, '-')}`,
      })

    if (error) {
      console.error(`  ❌ Error:`, error.message)
    } else {
      inserted++
    }
  }

  // Also add first supuesto to free_supuesto_bank (for free users)
  if (!dryRun && inserted > 0) {
    const firstQuestions: unknown[] = []
    for (const tema of SUPUESTOS[0].temas) {
      const temaQs = questionsByTema.get(tema) ?? []
      firstQuestions.push(...(temaQs as unknown[]).slice(0, 2))
    }
    const free5 = firstQuestions.slice(0, 5)
    const { error: freeErr } = await supabase
      .from('free_supuesto_bank')
      .insert({
        oposicion_id: PENITENCIARIAS_ID,
        caso: {
          titulo: SUPUESTOS[0].titulo,
          escenario: SUPUESTOS[0].escenario,
          bloques_cubiertos: SUPUESTOS[0].bloques_cubiertos,
        },
        preguntas: free5,
        fuente: 'seed-iipp-free-supuesto-1',
      })
    if (freeErr) console.error('  ❌ free_supuesto_bank error:', freeErr.message)
    else console.log('  ✅ free_supuesto_bank: 1 supuesto gratuito')
  }

  console.log(`\n✅ Done. Inserted ${inserted} supuestos in supuesto_bank.`)
}

main().catch(console.error)
