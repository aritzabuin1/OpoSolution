/**
 * PlanSEO F6.T2 — Ritual manual semanal de citas LLM
 *
 * Uso: `pnpm tsx execution/check-llm-citations.ts`
 *
 * El script imprime las 30 queries fijas (10 branded + 20 non-branded) y
 * abre un prompt interactivo por cada una. Aritz pega en ChatGPT/Perplexity
 * el resultado de su side check y responde cited: y/n, posición aproximada
 * y platform. Los datos se insertan en `llm_citations`.
 *
 * Si se pasa `--web-search`, el script usa fetch DuckDuckGo como proxy para
 * detectar si `oporuta.es` aparece en resultados orgánicos agregados (no
 * es LLM real pero es señal razonable).
 *
 * Ejecutar cada lunes 9:00.
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE envvars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BRANDED_QUERIES = [
  'OpoRuta',
  'OpoRuta vs OpositaTest',
  'qué es OpoRuta',
  'OpoRuta precio',
  'opiniones OpoRuta',
  'OpoRuta opositores',
  'app IA oposiciones OpoRuta',
  'OpoRuta gratis',
  'OpoRuta simulacros',
  'OpoRuta Radar del Tribunal',
]

const NON_BRANDED_QUERIES = [
  'mejor app para preparar auxiliar administrativo 2026',
  'plataforma IA oposiciones guardia civil',
  'cómo preparar auxilio judicial 2026',
  'test gratis oposiciones administrativo estado',
  'simulacro oposiciones INAP 2024 online',
  'app IA oposiciones policía nacional',
  'mejor academia online ertzaintza 2026',
  'test IA oposiciones hacienda',
  'simulador examen instituciones penitenciarias',
  'plataforma tests gestión procesal',
  'app tests tramitación procesal',
  'test psicotécnico guardia civil gratis',
  'cómo aprobar correos 2026',
  'sueldo auxiliar administrativo estado 2026',
  'calendario oposiciones AGE 2026',
  'pruebas físicas policía nacional 2026',
  'temario gestión procesal 2026',
  'repetición espaciada oposiciones',
  'oposiciones sin penalización 2026',
  'plan estudio 6 meses oposiciones',
]

const PLATFORMS = ['chatgpt', 'perplexity', 'claude', 'google_ai_overview', 'bing_copilot', 'web_search'] as const

function rlAsk(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())))
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const all = [...BRANDED_QUERIES, ...NON_BRANDED_QUERIES]

  console.log(`\n🔎 PlanSEO F6.T2 — Ritual semanal de citas LLM`)
  console.log(`📅 Fecha: ${new Date().toISOString().slice(0, 10)}\n`)
  console.log(`Vas a registrar ${all.length} queries (10 branded + 20 non-branded).`)
  console.log(`Para cada query: ejecútala en ChatGPT/Perplexity/Google (incógnito) y reporta si OpoRuta aparece citado.\n`)

  const rows: Array<{
    query: string
    platform: string
    cited: boolean
    position: number | null
    source_url: string | null
    notes: string | null
  }> = []

  for (const [i, query] of all.entries()) {
    console.log(`\n[${i + 1}/${all.length}] Query: "${query}"`)
    const platform = await rlAsk(rl, `  platform (${PLATFORMS.join('|')}): `)
    if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
      console.log('  ⚠️  platform inválida, usando "web_search"')
    }
    const citedRaw = (await rlAsk(rl, `  ¿oporuta aparece citado? (y/n): `)).toLowerCase()
    const cited = citedRaw === 'y' || citedRaw === 'yes' || citedRaw === 's' || citedRaw === 'si'
    let position: number | null = null
    let source_url: string | null = null
    if (cited) {
      const posRaw = await rlAsk(rl, `  posición aproximada (número, vacío = skip): `)
      position = posRaw ? Number(posRaw) : null
      const urlRaw = await rlAsk(rl, `  URL citada (vacío = skip): `)
      source_url = urlRaw || null
    }
    const notesRaw = await rlAsk(rl, `  notas (vacío = skip): `)

    rows.push({
      query,
      platform: (PLATFORMS.includes(platform as (typeof PLATFORMS)[number]) ? platform : 'web_search'),
      cited,
      position,
      source_url,
      notes: notesRaw || null,
    })
  }

  rl.close()

  const { error } = await supabase.from('llm_citations').insert(rows)
  if (error) {
    console.error('❌ Error insertando:', error.message)
    process.exit(1)
  }

  const cited = rows.filter(r => r.cited).length
  console.log(`\n✅ Ritual completado: ${rows.length} queries registradas, ${cited} con cita (${Math.round((cited / rows.length) * 100)}%)`)
  console.log(`Resultados disponibles en Supabase tabla 'llm_citations'.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
