/**
 * execution/build-indexable-set.ts — PlanSEO F0.T5
 *
 * Produce `data/seo/indexable-cross-ref.json`: set of "leyNombre:articuloNumero"
 * keys for articles with ≥1 cross-reference in frecuencias_articulos. Used by
 * lib/seo/indexability.ts to decide which /ley/* URLs are indexable.
 *
 * Re-run whenever frecuencias_articulos changes (after pnpm build:radar).
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local execution/build-indexable-set.ts
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
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PAGE = 1000

async function fetchAllIds<T>(
  table: string,
  columns: string,
  filter?: (q: any) => any,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (filter) q = filter(q)
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
  console.log('🔎 Cargando frecuencias_articulos (num_apariciones > 0)...')
  const freqs = await fetchAllIds<{ legislacion_id: string; num_apariciones: number }>(
    'frecuencias_articulos',
    'legislacion_id, num_apariciones',
    (q) => q.gt('num_apariciones', 0),
  )
  const freqIds = new Set(freqs.map(f => f.legislacion_id))
  console.log(`   → ${freqIds.size} legislacion_id únicos con apariciones.`)

  console.log('🔎 Cargando legislacion (activo=true)...')
  const rows = await fetchAllIds<{ id: string; ley_nombre: string; articulo_numero: string }>(
    'legislacion',
    'id, ley_nombre, articulo_numero',
    (q) => q.eq('activo', true),
  )
  console.log(`   → ${rows.length} artículos activos.`)

  const keys: string[] = []
  for (const r of rows) {
    if (freqIds.has(r.id)) {
      keys.push(`${r.ley_nombre}:${r.articulo_numero}`)
    }
  }
  const uniqueKeys = Array.from(new Set(keys)).sort()

  const outPath = path.join(__dirname, '..', 'data', 'seo', 'indexable-cross-ref.json')
  const payload = {
    generatedAt: new Date().toISOString(),
    totalKeys: uniqueKeys.length,
    keys: uniqueKeys,
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  console.log(`\n✅ Escrito ${outPath} (${uniqueKeys.length} keys)`)
}

main().catch(err => {
  console.error('❌ Fallo:', err)
  process.exit(1)
})
