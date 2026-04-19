/**
 * execution/diagnose-seo-coverage.ts — PlanSEO F0.T1
 *
 * Diagnóstico de cruzabilidad artículos ↔ preguntas_oficiales.
 * Output: CSV con (ley, articulo, num_apariciones) y resumen agregado.
 *
 * Fuente: tabla `frecuencias_articulos` (populada por build-radar-tribunal.ts).
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local execution/diagnose-seo-coverage.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface RadarRow {
  legislacion_id: string
  num_apariciones: number
  pct_total: number
  anios: number[]
  ultima_aparicion: number | null
  articulo_numero: string
  ley_nombre: string
  ley_codigo: string
}

async function fetchAllPaginated<T>(
  table: string,
  columns: string,
  filter?: (q: ReturnType<ReturnType<typeof supabase.from>['select']>) => typeof q,
): Promise<T[]> {
  const PAGE = 1000
  const all: T[] = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (filter) q = filter(q) as typeof q
    const { data, error } = await q
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  console.log('🔎 Consultando legislacion (paginado)...')

  const allArts = await fetchAllPaginated<{ id: string; ley_nombre: string; ley_codigo: string; articulo_numero: string; activo: boolean }>(
    'legislacion',
    'id, ley_nombre, ley_codigo, articulo_numero, activo',
    (q) => q.eq('activo', true),
  )
  console.log(`   → ${allArts.length} artículos totales en legislacion (activo=true).`)

  console.log('🔎 Consultando frecuencias_articulos con num_apariciones > 0...')
  const freqs = await fetchAllPaginated<{ legislacion_id: string; num_apariciones: number; pct_total: number; anios: number[]; ultima_aparicion: number | null }>(
    'frecuencias_articulos',
    'legislacion_id, num_apariciones, pct_total, anios, ultima_aparicion',
    (q) => q.gt('num_apariciones', 0),
  )
  console.log(`   → ${freqs.length} artículos con num_apariciones > 0.`)

  const freqMap = new Map(freqs.map(f => [f.legislacion_id, f]))

  const combined: RadarRow[] = allArts.map(a => {
    const f = freqMap.get(a.id)
    return {
      legislacion_id: a.id,
      num_apariciones: f?.num_apariciones ?? 0,
      pct_total: f?.pct_total ?? 0,
      anios: f?.anios ?? [],
      ultima_aparicion: f?.ultima_aparicion ?? null,
      articulo_numero: a.articulo_numero,
      ley_nombre: a.ley_nombre,
      ley_codigo: a.ley_codigo,
    }
  })

  await writeDiagnosis(combined, allArts.length)
}

async function writeDiagnosis(rows: RadarRow[], totalArts: number) {
  const articlesWithFreq = rows.filter(r => r.num_apariciones > 0)

  // Breakdown per law
  const perLaw = new Map<string, { total: number; conFreq: number; articulosConFreq: string[] }>()
  for (const row of rows) {
    const cur = perLaw.get(row.ley_nombre) ?? { total: 0, conFreq: 0, articulosConFreq: [] }
    cur.total++
    if (row.num_apariciones > 0) {
      cur.conFreq++
      cur.articulosConFreq.push(row.articulo_numero)
    }
    perLaw.set(row.ley_nombre, cur)
  }

  // Write CSV
  const tmpDir = path.join(__dirname, '..', '..', '.tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const csvPath = path.join(tmpDir, 'article-exam-coverage.csv')
  const header = 'ley_nombre,articulo_numero,num_apariciones,ultima_aparicion,anios,legislacion_id\n'
  const lines = rows
    .sort((a, b) => b.num_apariciones - a.num_apariciones)
    .map(r =>
      `"${r.ley_nombre}","${r.articulo_numero}",${r.num_apariciones},${r.ultima_aparicion ?? ''},"${(r.anios ?? []).join('|')}","${r.legislacion_id}"`,
    )
  fs.writeFileSync(csvPath, header + lines.join('\n') + '\n')

  const summaryPath = path.join(tmpDir, 'article-exam-coverage-summary.md')
  const summary: string[] = []
  summary.push('# Cobertura artículos ↔ preguntas_oficiales')
  summary.push('')
  summary.push(`**Fecha:** ${new Date().toISOString()}`)
  summary.push(`**Total artículos activos:** ${totalArts}`)
  summary.push(`**Con ≥1 pregunta oficial (num_apariciones > 0):** ${articlesWithFreq.length}`)
  summary.push(`**Cobertura:** ${((articlesWithFreq.length / Math.max(totalArts, 1)) * 100).toFixed(1)}%`)
  summary.push('')
  summary.push('## Desglose por ley')
  summary.push('')
  summary.push('| Ley | Total arts | Con freq > 0 | Cobertura |')
  summary.push('|---|---|---|---|')
  for (const [ley, stats] of [...perLaw.entries()].sort((a, b) => b[1].conFreq - a[1].conFreq)) {
    const pct = stats.total > 0 ? ((stats.conFreq / stats.total) * 100).toFixed(0) : '0'
    summary.push(`| ${ley} | ${stats.total} | ${stats.conFreq} | ${pct}% |`)
  }
  fs.writeFileSync(summaryPath, summary.join('\n') + '\n')

  console.log('')
  console.log('✅ Diagnóstico completado')
  console.log(`   → CSV: ${csvPath}`)
  console.log(`   → Resumen: ${summaryPath}`)
  console.log('')
  console.log(`📊 Total artículos: ${totalArts}`)
  console.log(`📊 Con ≥1 aparición: ${articlesWithFreq.length} (${((articlesWithFreq.length / Math.max(totalArts, 1)) * 100).toFixed(1)}%)`)
  console.log('')
  console.log('TOP 10 artículos más frecuentes:')
  for (const row of articlesWithFreq.slice(0, 10)) {
    console.log(`  ${row.ley_nombre} art. ${row.articulo_numero}  →  ${row.num_apariciones} apariciones (últ. ${row.ultima_aparicion})`)
  }
}

main().catch(err => {
  console.error('❌ Fallo fatal:', err)
  process.exit(1)
})
