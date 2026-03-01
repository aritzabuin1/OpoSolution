/**
 * execution/check-mapping-coverage.ts — OPTEK §1.1.12
 *
 * Verifica la cobertura del mapeo tema → artículos:
 *   1. Lee data/legislacion/*.json (artículos scrapeados localmente)
 *   2. Lee data/mapeo_temas_legislacion.json (informe generado por auto-map-themes.ts)
 *   3. Consulta la BD para verificar que tema_ids están poblados
 *   4. Genera alertas: artículos sin tema asignado y temas sin artículos
 *
 * Ejecutar:
 *   pnpm tsx --env-file=.env.local execution/check-mapping-coverage.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  OPTEK check-mapping-coverage.ts — §1.1.12                 ║')
  console.log('║  Verificación de cobertura tema → artículos                ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  const dataDir = join(process.cwd(), '..', 'data')
  const legDir = join(dataDir, 'legislacion')
  const mappingPath = join(dataDir, 'mapeo_temas_legislacion.json')

  // ── 1. Contar artículos locales ───────────────────────────────────────────

  console.log('📁 Leyendo archivos de data/legislacion/*.json...')

  if (!existsSync(legDir)) {
    console.error(`❌ No existe ${legDir}`)
    process.exit(1)
  }

  const jsonFiles = readdirSync(legDir).filter(f => f.endsWith('.json'))
  let totalLocal = 0
  const leyesPorArchivo: Record<string, number> = {}

  for (const file of jsonFiles) {
    const data = JSON.parse(readFileSync(join(legDir, file), 'utf-8'))
    const count = (data.articulos ?? []).length
    leyesPorArchivo[data.ley_codigo ?? file] = count
    totalLocal += count
    console.log(`  ${file.padEnd(50, '.')} ${String(count).padStart(4)} artículos`)
  }

  console.log(`\n  Total local: ${totalLocal} artículos en ${jsonFiles.length} archivos`)
  console.log()

  // ── 2. Verificar BD ───────────────────────────────────────────────────────

  console.log('🗄️  Consultando BD...')

  const { count: totalBD } = await supabase
    .from('legislacion')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  const { count: conTemaIds } = await supabase
    .from('legislacion')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)
    .not('tema_ids', 'eq', '{}')

  const { count: sinTemaIds } = await supabase
    .from('legislacion')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)
    .eq('tema_ids', '{}')

  console.log(`  Total BD:        ${totalBD}`)
  console.log(`  Con tema_ids:    ${conTemaIds}`)
  console.log(`  Sin tema_ids:    ${sinTemaIds}`)
  console.log()

  if ((sinTemaIds ?? 0) > 0) {
    console.log(`  ⚠️  ${sinTemaIds} artículos SIN tema_ids — ejecutar auto-map-themes.ts`)

    // Mostrar qué leyes tienen artículos sin mapear
    const { data: sinMapear } = await supabase
      .from('legislacion')
      .select('ley_nombre, ley_codigo')
      .eq('activo', true)
      .eq('tema_ids', '{}')
      .limit(200)

    if (sinMapear) {
      const leyesSinMapear: Record<string, number> = {}
      for (const a of sinMapear) {
        const key = `${a.ley_nombre} (${a.ley_codigo})`
        leyesSinMapear[key] = (leyesSinMapear[key] ?? 0) + 1
      }
      console.log('  Leyes con artículos sin mapear:')
      for (const [ley, count] of Object.entries(leyesSinMapear).sort()) {
        console.log(`    ${ley.padEnd(55, '.')} ${count}`)
      }
    }
    console.log()
  }

  // ── 3. Verificar cobertura por tema ───────────────────────────────────────

  console.log('🗺️  Verificando cobertura por tema en BD...')

  // IDs de los 16 temas Bloque I (los que tienen legislación)
  const temaIds = Array.from({ length: 16 }, (_, i) =>
    `b0000000-0000-0000-0001-${String(i + 1).padStart(12, '0')}`
  )

  const temasSinCobertura: string[] = []
  const coberturaPorTema: Record<number, number> = {}

  for (let i = 0; i < temaIds.length; i++) {
    const temaId = temaIds[i]
    const temaNum = i + 1
    const { count } = await supabase
      .from('legislacion')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)
      .contains('tema_ids', [temaId])

    coberturaPorTema[temaNum] = count ?? 0
    if ((count ?? 0) === 0) {
      temasSinCobertura.push(`Tema ${temaNum}`)
    }
  }

  console.log('  Artículos por tema (Bloque I):')
  for (const [temaNum, count] of Object.entries(coberturaPorTema)) {
    const indicator = count === 0 ? '❌' : count < 5 ? '⚠️ ' : '✅'
    console.log(`  ${indicator} Tema ${String(temaNum).padStart(2, '0')}: ${String(count).padStart(4)} artículos`)
  }
  console.log()

  // ── 4. Leer informe de mapeo si existe ────────────────────────────────────

  if (existsSync(mappingPath)) {
    console.log('📄 Leyendo data/mapeo_temas_legislacion.json...')
    const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8'))
    console.log(`  Generado: ${mapping._generado}`)
    console.log(`  Cobertura: ${mapping.resumen.cobertura_pct}%`)
    console.log(`  Artículos mapeados: ${mapping.resumen.articulos_mapeados}/${mapping.resumen.total_articulos}`)
    if (mapping.temas_sin_contenido?.length > 0) {
      console.log('  ⚠️  Temas sin contenido:')
      for (const t of mapping.temas_sin_contenido) {
        console.log(`     - ${t}`)
      }
    }
    console.log()
  } else {
    console.log('  ⚠️  data/mapeo_temas_legislacion.json no existe aún — ejecutar auto-map-themes.ts')
    console.log()
  }

  // ── 5. Resumen ────────────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  RESULTADO:')

  const todoOK = (sinTemaIds ?? 0) === 0 && temasSinCobertura.length === 0
  if (todoOK) {
    console.log('  ✅ Cobertura completa — tema_ids mapeados correctamente')
  } else {
    if ((sinTemaIds ?? 0) > 0) {
      console.log(`  ❌ ${sinTemaIds} artículos sin tema_ids`)
      console.log('     → Ejecutar: pnpm tsx --env-file=.env.local execution/auto-map-themes.ts')
    }
    if (temasSinCobertura.length > 0) {
      console.log(`  ⚠️  Temas sin artículos: ${temasSinCobertura.join(', ')}`)
      console.log('     → Puede requerir ingesta adicional (§1.1.6E para Tema 10 UE)')
    }
  }
  console.log('═══════════════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
