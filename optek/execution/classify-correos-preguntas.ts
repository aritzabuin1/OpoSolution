#!/usr/bin/env tsx
/**
 * execution/classify-correos-preguntas.ts
 *
 * Classifies Correos preguntas_oficiales by tema_id using keyword matching.
 * Most questions (454/500) lack a tema_id — this script assigns one based on
 * enunciado + opciones text matched against per-tema keyword lists.
 *
 * Usage: pnpm classify:correos [--dry-run]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
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

// ─── Tema keywords ───────────────────────────────────────────────────────────

const TEMA_KEYWORDS: Record<number, string[]> = {
  1: [
    'SPU', 'servicio postal universal', 'Ley 43/2010', 'RD 437/2024', 'UPU',
    'grupo Correos', 'sociedad estatal', 'SEPI', 'carta certificada',
    'carta ordinaria', 'paquete azul', 'línea básica', 'línea urgente',
    'Correos Express', 'publicorreo',
  ],
  2: [
    'igualdad', 'acoso', 'diversidad', 'PRL', 'riesgo laboral', 'ODS', 'RSC',
    'sostenibilidad', 'prevención', 'salud laboral', 'plan de igualdad',
    'LO 3/2007', 'Ley 31/1995', 'género', 'conciliación',
  ],
  3: [
    'paquetería', 'e-commerce', 'CityPaq', 'Paq 10', 'Paq 14', 'Paq 24',
    'Paq 48', 'Paq 72', 'Homepaq', 'Correos Express', 'logística inversa',
    'devolución', 'retorno', 'marketplace', 'Comandia',
  ],
  4: [
    'giro', 'SEDI', 'financiero', 'monetario', 'transferencia', 'western union',
    'seguro', 'burofax', 'telegrama', 'filatelia', 'MoneyGram', 'Correos Cash',
    'servicio bancario',
  ],
  5: [
    'Correos Labs', 'nueva línea', 'Correos Frío', 'web comercial',
    'tienda online', 'Camino de Santiago', 'innovación', 'logística inversa',
    'fulfilment',
  ],
  6: [
    'IRIS', 'SGIE', 'SGEI', 'PDA', 'SICER', 'SIE', 'QUENDA', 'SIGUA',
    'CONECTA', 'TAURO', 'HERA', 'herramienta corporativa', 'buzón electrónico',
    'aplicación móvil',
  ],
  7: [
    'admisión', 'franqueo', 'etiquetado', 'registro', 'imposición',
    'facturación', 'prerregistr', 'T€nvío', 'recogida a domicilio',
    'mercancía peligrosa', 'lista de correos', 'apartado postal',
  ],
  8: [
    'clasificación', 'CTA', 'centro de tratamiento', 'transporte',
    'encaminamiento', 'despacho', 'ruta', 'máquina clasificadora', 'OCR',
    'ITV postal',
  ],
  9: [
    'distribución', 'entrega', 'reparto', 'cartero', 'buzón',
    'aviso de llegada', 'notificación', 'liquidación', 'sección',
    'unidad de reparto', 'intento de entrega',
  ],
  10: [
    'reclamación', 'atención al cliente', 'queja', 'protocolo',
    'indemnización', 'KPI', 'calidad', 'Línea 900',
  ],
  11: [
    'internacional', 'UPU', 'aduana', 'CN22', 'CN23', 'EMS', 'postal express',
    'zona tarifaria', 'extranjero', 'importación', 'exportación',
  ],
  12: [
    'RGPD', 'LOPD', 'protección de datos', 'blanqueo', 'cumplimiento', 'ética',
    'canal de denuncia', 'ciberseguridad', 'Ley 10/2010', 'SEPBLAC',
    'compliance',
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Count keyword matches in the given text for each tema.
 * Returns a map of temaNumero -> match count (only entries > 0).
 */
function countMatches(text: string): Map<number, number> {
  const lower = text.toLowerCase()
  const scores = new Map<number, number>()
  for (const [temaStr, keywords] of Object.entries(TEMA_KEYWORDS)) {
    const temaNum = Number(temaStr)
    let count = 0
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        count++
      }
    }
    if (count > 0) scores.set(temaNum, count)
  }
  return scores
}

/**
 * Build the full searchable text from enunciado + opciones.
 */
function buildSearchText(
  enunciado: string,
  opciones: Record<string, string> | string[] | null,
): string {
  let text = enunciado
  if (opciones) {
    if (Array.isArray(opciones)) {
      text += ' ' + opciones.join(' ')
    } else {
      text += ' ' + Object.values(opciones).join(' ')
    }
  }
  return text
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  console.log(dryRun ? '🔍 DRY RUN — no DB updates' : '🚀 LIVE MODE — will update DB')
  console.log()

  // 1. Fetch Correos temas
  const { data: temas, error: temasErr } = await supabase
    .from('temas')
    .select('id, numero, titulo')
    .eq('oposicion_id', CORREOS_OPOSICION_ID)
    .order('numero')

  if (temasErr || !temas) {
    console.error('Error fetching temas:', temasErr)
    process.exit(1)
  }
  console.log(`📚 Found ${temas.length} Correos temas`)

  // Build numero -> id lookup
  const temaIdByNumero = new Map<number, string>()
  for (const t of temas) {
    temaIdByNumero.set(t.numero, t.id)
    console.log(`   Tema ${t.numero}: ${t.titulo}`)
  }
  console.log()

  // 2. Fetch unclassified preguntas
  // First get Correos exam IDs
  const { data: examenes, error: examenesErr } = await supabase
    .from('examenes_oficiales')
    .select('id')
    .eq('oposicion_id', CORREOS_OPOSICION_ID)

  if (examenesErr || !examenes) {
    console.error('Error fetching examenes:', examenesErr)
    process.exit(1)
  }

  const examenIds = examenes.map((e: { id: string }) => e.id)
  if (examenIds.length === 0) {
    console.log('No Correos examenes found.')
    process.exit(0)
  }

  const { data: preguntas, error: preguntasErr } = await (supabase as any)
    .from('preguntas_oficiales')
    .select('id, enunciado, opciones')
    .is('tema_id', null)
    .in('examen_id', examenIds)

  if (preguntasErr || !preguntas) {
    console.error('Error fetching preguntas:', preguntasErr)
    process.exit(1)
  }

  console.log(`❓ Found ${preguntas.length} unclassified Correos questions`)
  console.log()

  // 3. Classify each question
  const summary: Record<number | 'unclassified', number> = { unclassified: 0 }
  for (const tema of temas) {
    summary[tema.numero] = 0
  }

  let classified = 0
  let unclassified = 0
  const updates: { id: string; tema_id: string; temaNum: number }[] = []

  for (const pregunta of preguntas) {
    const searchText = buildSearchText(pregunta.enunciado, pregunta.opciones)
    const scores = countMatches(searchText)

    if (scores.size === 0) {
      unclassified++
      summary['unclassified']++
      console.log(`   ⚠️  Unclassified — "${pregunta.enunciado.slice(0, 80)}..."`)
      continue
    }

    // Find tema with highest match count
    let bestTema = 0
    let bestScore = 0
    for (const [temaNum, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestTema = temaNum
      }
    }

    const temaId = temaIdByNumero.get(bestTema)
    if (!temaId) {
      unclassified++
      summary['unclassified']++
      console.log(`   ⚠️  Matched tema ${bestTema} but no DB entry — "${pregunta.enunciado.slice(0, 80)}..."`)
      continue
    }

    classified++
    summary[bestTema] = (summary[bestTema] || 0) + 1
    updates.push({ id: pregunta.id, tema_id: temaId, temaNum: bestTema })
    console.log(`   ✅ Classified: tema ${bestTema} (${bestScore} matches) — "${pregunta.enunciado.slice(0, 80)}..."`)
  }

  console.log()

  // 4. Update DB (unless dry-run)
  if (!dryRun && updates.length > 0) {
    console.log(`💾 Updating ${updates.length} questions in DB...`)
    let updated = 0
    let errors = 0

    // Batch updates in groups of 50
    const BATCH_SIZE = 50
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((u) =>
          (supabase as any)
            .from('preguntas_oficiales')
            .update({ tema_id: u.tema_id })
            .eq('id', u.id),
        ),
      )
      for (const res of results) {
        if (res.error) {
          errors++
          console.error(`   ❌ Update error:`, res.error.message)
        } else {
          updated++
        }
      }
    }
    console.log(`   Updated: ${updated}, Errors: ${errors}`)
  } else if (dryRun) {
    console.log(`💾 Dry run — would update ${updates.length} questions`)
  }

  // 5. Summary
  console.log()
  console.log('═══════════════════════════════════════')
  console.log('  CLASSIFICATION SUMMARY')
  console.log('═══════════════════════════════════════')
  for (const tema of temas) {
    const count = summary[tema.numero] || 0
    const bar = '█'.repeat(Math.min(count, 40))
    console.log(`  Tema ${String(tema.numero).padStart(2)}: ${String(count).padStart(4)} ${bar} ${tema.titulo}`)
  }
  console.log(`  ───────────────────────────────────`)
  console.log(`  Classified:   ${classified}`)
  console.log(`  Unclassified: ${unclassified}`)
  console.log(`  Total:        ${preguntas.length}`)
  console.log('═══════════════════════════════════════')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
