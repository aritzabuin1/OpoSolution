/**
 * execution/build-radar-tribunal.ts — OPTEK §2.14.2
 *
 * Analiza preguntas_oficiales para construir el ranking de artículos más frecuentes.
 *
 * Estrategia:
 *   1. Lee todas las preguntas de preguntas_oficiales (join con examenes_oficiales para año)
 *   2. Extrae citas legales del enunciado de cada pregunta usando extractCitations()
 *   3. Resuelve cada cita → legislacion_id (lookup por ley_nombre + articulo_numero)
 *   4. Acumula apariciones por legislacion_id + lista de años
 *   5. UPSERT en frecuencias_articulos con porcentaje calculado
 *
 * Script idempotente: puede re-ejecutarse sin efecto secundario.
 * No requiere ANTHROPIC_API_KEY — solo SQL + regex determinista.
 *
 * Uso:
 *   pnpm build:radar
 *
 * Variables de entorno requeridas:
 *   SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { extractCitations } from '../lib/ai/verification.js'
import { CITATION_ALIASES } from '../lib/ai/citation-aliases.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Carga .env.local ─────────────────────────────────────────────────────────

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PreguntaRow {
  id: string
  enunciado: string
  correcta: number
  opciones: string[]
  examenes_oficiales: { anio: number }
}

interface LegislacionLookup {
  id: string
  ley_nombre: string
  articulo_numero: string
}

interface Acumulador {
  count: number
  anios: Set<number>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('SUPABASE_URL no configurada')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Normaliza el nombre de una ley extrayendo alias a ley_nombre canónico.
 * Reutiliza CITATION_ALIASES para consistencia con el resto del sistema.
 */
function resolveLeyCodigo(rawLey: string): string | null {
  const lower = rawLey.toLowerCase().trim()

  // Búsqueda directa en aliases
  if (CITATION_ALIASES[lower]) return CITATION_ALIASES[lower]

  // Búsqueda por prefijo (ej: "ley 39/2015 del procedimiento" → "ley 39/2015")
  for (const [alias, codigo] of Object.entries(CITATION_ALIASES)) {
    if (lower.includes(alias)) return codigo
  }

  return null
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📡 OPTEK — Radar del Tribunal Builder §2.14')
  console.log('============================================\n')

  const supabase = buildSupabaseClient()

  // 1. Cargar todas las preguntas de preguntas_oficiales + año del examen
  console.log('📥 Cargando preguntas oficiales...')
  const { data: preguntas, error: pregErr } = await supabase
    .from('preguntas_oficiales')
    .select('id, enunciado, correcta, opciones, examenes_oficiales!inner(anio)')
    .order('id')

  if (pregErr || !preguntas) {
    console.error('❌ Error cargando preguntas:', pregErr?.message)
    process.exit(1)
  }

  const preguntasRows = preguntas as unknown as PreguntaRow[]
  console.log(`   ${preguntasRows.length} preguntas encontradas\n`)

  // 2. Cargar toda la tabla legislacion en memoria para lookup rápido
  console.log('📚 Cargando legislación en memoria...')
  const { data: legislacion, error: legErr } = await supabase
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero')
    .eq('activo', true)

  if (legErr || !legislacion) {
    console.error('❌ Error cargando legislación:', legErr?.message)
    process.exit(1)
  }

  const legRows = legislacion as LegislacionLookup[]

  // Índice: "LPAC:21" → legislacion_id
  const legIndex = new Map<string, string>()
  for (const row of legRows) {
    const key = `${row.ley_nombre}:${row.articulo_numero.trim()}`
    legIndex.set(key, row.id)
    // También indexar sin apartado: "LPAC:21.2" → también intenta "LPAC:21"
    const numeroBase = row.articulo_numero.split('.')[0].trim()
    const keyBase = `${row.ley_nombre}:${numeroBase}`
    if (!legIndex.has(keyBase)) legIndex.set(keyBase, row.id)
  }

  console.log(`   ${legRows.length} artículos indexados\n`)

  // 3. Extraer citas de cada pregunta y acumular frecuencias
  console.log('🔍 Extrayendo citas de preguntas...')

  const frecuencias = new Map<string, Acumulador>()
  let citasEncontradas = 0
  let citasResueltas = 0

  for (const pregunta of preguntasRows) {
    const anio = pregunta.examenes_oficiales.anio

    // Extraer del enunciado
    const textoAnalizar = pregunta.enunciado

    const citas = extractCitations(textoAnalizar)
    citasEncontradas += citas.length

    for (const cita of citas) {
      // Resolver ley
      const leyCodigo = resolveLeyCodigo(cita.ley)
      if (!leyCodigo) continue

      // Buscar en índice con número exacto
      const artNumero = cita.articulo.replace(/\s+/g, '').trim()
      const key = `${leyCodigo}:${artNumero}`
      const keyBase = `${leyCodigo}:${artNumero.split('.')[0]}`

      const legislacionId = legIndex.get(key) ?? legIndex.get(keyBase)
      if (!legislacionId) continue

      citasResueltas++

      if (!frecuencias.has(legislacionId)) {
        frecuencias.set(legislacionId, { count: 0, anios: new Set() })
      }
      const acc = frecuencias.get(legislacionId)!
      acc.count++
      acc.anios.add(anio)
    }
  }

  console.log(`   Citas encontradas: ${citasEncontradas}`)
  console.log(`   Citas resueltas: ${citasResueltas} (${Math.round((citasResueltas / Math.max(citasEncontradas, 1)) * 100)}%)`)
  console.log(`   Artículos únicos con frecuencia: ${frecuencias.size}\n`)

  if (frecuencias.size === 0) {
    console.warn('⚠️  Sin frecuencias — verifica que preguntas_oficiales tiene datos y legislación está ingestada')
    return
  }

  // 4. Calcular porcentajes y preparar upsert
  const totalPreguntas = preguntasRows.length
  const rows = Array.from(frecuencias.entries()).map(([legislacionId, acc]) => ({
    legislacion_id: legislacionId,
    num_apariciones: acc.count,
    pct_total: parseFloat(((acc.count / totalPreguntas) * 100).toFixed(2)),
    anios: [...acc.anios].sort(),
    ultima_aparicion: Math.max(...acc.anios),
    updated_at: new Date().toISOString(),
  }))

  // Ordenar para logging: top artículos primero
  const topRows = [...rows].sort((a, b) => b.num_apariciones - a.num_apariciones)

  console.log('📊 Top 10 artículos más frecuentes:')
  for (const row of topRows.slice(0, 10)) {
    const legEntry = legRows.find((l) => l.id === row.legislacion_id)
    const nombre = legEntry ? `${legEntry.ley_nombre} Art. ${legEntry.articulo_numero}` : row.legislacion_id
    console.log(`   ${row.num_apariciones}x — ${nombre} (${row.anios.join(', ')})`)
  }
  console.log()

  // 5. UPSERT en frecuencias_articulos
  console.log(`💾 Escribiendo ${rows.length} registros en frecuencias_articulos...`)

  const BATCH_SIZE = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error: upsertErr } = await (supabase as ReturnType<typeof createClient>)
      .from('frecuencias_articulos')
      .upsert(batch, { onConflict: 'legislacion_id' })

    if (upsertErr) {
      console.error(`❌ Error en batch ${i / BATCH_SIZE + 1}:`, upsertErr.message)
      continue
    }
    inserted += batch.length
    process.stdout.write(`   Progreso: ${inserted}/${rows.length}\r`)
  }

  console.log(`\n\n✅ Radar del Tribunal actualizado: ${inserted} artículos`)
  console.log('\n📌 Siguiente paso: verificar radar en /radar del dashboard')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
