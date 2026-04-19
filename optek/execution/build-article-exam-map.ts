/**
 * execution/build-article-exam-map.ts — PlanSEO F1.T2
 *
 * Genera `data/seo/article-exam-map.json` con el mapeo:
 *   "leyNombre:articuloNumero" → Array<{ examenId, preguntaId, anio, oposicionId, enunciadoSnippet }>
 *
 * Sólo usa citas explícitas (Path A del radar): "art. X de la Y".
 * Alimenta `ArticleExamQuestions.tsx` (listado de preguntas oficiales en la página
 * de cada artículo) y `ArticleFrequencyBadge.tsx` ("Aparece en 3 de últimas 5
 * convocatorias").
 *
 * Re-ejecutar tras `pnpm ingest:examenes` o cambios en legislación.
 *
 * Uso:
 *   pnpm tsx --env-file=.env.local execution/build-article-exam-map.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { extractCitations } from '../lib/ai/verification.js'
import { CITATION_ALIASES } from '../lib/ai/citation-aliases.js'

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

interface PreguntaRow {
  id: string
  enunciado: string
  opciones: string[]
  examenes_oficiales: { id: string; anio: number; oposicion_id: string }
}

interface LegRow {
  id: string
  ley_nombre: string
  ley_codigo: string | null
  articulo_numero: string
}

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

async function fetchAll<T>(buildQ: (f: number, t: number) => any): Promise<T[]> {
  const all: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await buildQ(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

function resolveLeyCodigo(rawLey: string): string | null {
  const lower = rawLey.toLowerCase().trim()
  if (CITATION_ALIASES[lower]) return CITATION_ALIASES[lower]
  for (const [alias, codigo] of Object.entries(CITATION_ALIASES)) {
    if (lower.includes(alias)) return codigo
  }
  return null
}

function snippet(text: string, maxChars = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > maxChars ? clean.slice(0, maxChars - 1) + '…' : clean
}

async function main() {
  console.log('📥 Cargando preguntas oficiales…')
  const preguntas = await fetchAll<PreguntaRow>((f, t) =>
    supabase
      .from('preguntas_oficiales')
      .select('id, enunciado, opciones, examenes_oficiales!inner(id, anio, oposicion_id)')
      .order('id')
      .range(f, t),
  )
  console.log(`   → ${preguntas.length} preguntas`)

  console.log('📚 Cargando legislación…')
  const legRows = await fetchAll<LegRow>((f, t) =>
    supabase.from('legislacion').select('id, ley_nombre, ley_codigo, articulo_numero').eq('activo', true).range(f, t),
  )
  console.log(`   → ${legRows.length} artículos`)

  // Índice: "leyNombre:articuloNumero" → entry
  // CITATION_ALIASES mapea a ley_nombre (NO ley_codigo), así que usamos ley_nombre
  // como clave para que el resolve coincida.
  const legIndex = new Map<string, { leyNombre: string; articuloNumero: string }>()
  for (const r of legRows) {
    const entry = { leyNombre: r.ley_nombre, articuloNumero: r.articulo_numero }
    legIndex.set(`${r.ley_nombre}:${r.articulo_numero.trim()}`, entry)
    const base = r.articulo_numero.split('.')[0].trim()
    const baseKey = `${r.ley_nombre}:${base}`
    if (!legIndex.has(baseKey)) legIndex.set(baseKey, entry)
  }

  // Acumular entradas
  const map = new Map<string, MapEntry[]>()
  let resolved = 0
  let citasTotal = 0

  for (const p of preguntas) {
    const fullText = `${p.enunciado} ${(p.opciones ?? []).join(' ')}`
    const citas = extractCitations(fullText)
    if (citas.length === 0) continue

    const seen = new Set<string>()
    for (const c of citas) {
      citasTotal++
      const code = resolveLeyCodigo(c.ley)
      if (!code) continue
      const artNum = c.articulo.replace(/\s+/g, '').trim()
      const exact = legIndex.get(`${code}:${artNum}`)
      const base = legIndex.get(`${code}:${artNum.split('.')[0]}`)
      const hit = exact ?? base
      if (!hit) continue

      const key = `${hit.leyNombre}:${hit.articuloNumero}`
      // Dedup: a single pregunta can cite the same article in both enunciado + opciones
      if (seen.has(key)) continue
      seen.add(key)

      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({
        examenId: p.examenes_oficiales.id,
        preguntaId: p.id,
        anio: p.examenes_oficiales.anio,
        oposicionId: p.examenes_oficiales.oposicion_id,
        enunciadoSnippet: snippet(p.enunciado),
      })
    }
    if (seen.size > 0) resolved++
  }

  // Ordenar cada lista por año descendente
  for (const arr of map.values()) {
    arr.sort((a, b) => b.anio - a.anio)
  }

  const obj: Record<string, MapEntry[]> = {}
  for (const [k, v] of [...map.entries()].sort()) obj[k] = v

  const payload = {
    generatedAt: new Date().toISOString(),
    preguntasTotal: preguntas.length,
    preguntasResueltas: resolved,
    citasTotal,
    articulosCubiertos: map.size,
    map: obj,
  }

  const outPath = path.join(__dirname, '..', 'data', 'seo', 'article-exam-map.json')
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1)

  console.log('')
  console.log(`✅ Escrito ${outPath} (${sizeKB} KB)`)
  console.log(`   Preguntas con cita explícita: ${resolved}/${preguntas.length} (${Math.round((resolved / preguntas.length) * 100)}%)`)
  console.log(`   Artículos cubiertos: ${map.size}`)
  console.log(`   Citas totales detectadas: ${citasTotal}`)

  // Top 10
  const top = [...map.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10)
  console.log('\n📊 Top 10 artículos con más apariciones:')
  for (const [k, arr] of top) {
    console.log(`   ${arr.length}x — ${k} (años: ${[...new Set(arr.map(a => a.anio))].sort().join(', ')})`)
  }
}

main().catch(err => {
  console.error('❌ Fallo:', err)
  process.exit(1)
})
