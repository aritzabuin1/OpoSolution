/**
 * execution/auto-map-themes.ts — OPTEK §1.1.9, §1.1.11
 *
 * Mapea los 2.782 artículos de la tabla `legislacion` a los tema_ids
 * correspondientes del temario oficial (28 temas, convocatoria 2025-2026).
 *
 * Estrategia:
 *   Mapping determinista por ley_codigo + titulo_seccion.
 *   No gasta tokens de IA — 100% reglas explícitas.
 *
 * Salidas:
 *   1. UPDATE legislacion SET tema_ids = [...] para cada artículo (DB)
 *   2. data/mapeo_temas_legislacion.json — informe de cobertura (§1.1.11)
 *
 * Ejecutar:
 *   pnpm tsx --env-file=.env.local execution/auto-map-themes.ts
 *
 * Rollback (si se necesita revertir):
 *   UPDATE legislacion SET tema_ids = '{}';
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// ─── IDs de temas (de migration 007 — §0.8.5A) ───────────────────────────────

const TEMAS = {
  T1:  'b0000000-0000-0000-0001-000000000001', // La Constitución Española de 1978
  T2:  'b0000000-0000-0000-0001-000000000002', // El Tribunal Constitucional y la reforma constitucional
  T3:  'b0000000-0000-0000-0001-000000000003', // Las Cortes Generales
  T4:  'b0000000-0000-0000-0001-000000000004', // El Poder Judicial
  T5:  'b0000000-0000-0000-0001-000000000005', // El Gobierno y la Administración
  T6:  'b0000000-0000-0000-0001-000000000006', // Gobierno Abierto
  T7:  'b0000000-0000-0000-0001-000000000007', // La Transparencia y el buen gobierno
  T8:  'b0000000-0000-0000-0001-000000000008', // La Administración General del Estado
  T9:  'b0000000-0000-0000-0001-000000000009', // La organización territorial del Estado
  T10: 'b0000000-0000-0000-0001-000000000010', // La Unión Europea: instituciones
  T11: 'b0000000-0000-0000-0001-000000000011', // El procedimiento administrativo común (LPAC/LRJSP)
  T12: 'b0000000-0000-0000-0001-000000000012', // La protección de datos personales
  T13: 'b0000000-0000-0000-0001-000000000013', // El personal funcionario: el TREBEP
  T14: 'b0000000-0000-0000-0001-000000000014', // Derechos y deberes de los empleados públicos
  T15: 'b0000000-0000-0000-0001-000000000015', // El Presupuesto del Estado
  T16: 'b0000000-0000-0000-0001-000000000016', // Políticas de igualdad: LGTBI
} as const

// ─── Leyes cubiertas (ley_codigo → nombres para informe) ─────────────────────

const LEY_NOMBRES: Record<string, string> = {
  'BOE-A-1978-31229': 'CE — Constitución Española',
  'BOE-A-1979-23709': 'LOTC — LO 2/1979 Tribunal Constitucional',
  'BOE-A-2015-10565': 'LPAC — Ley 39/2015',
  'BOE-A-2015-10566': 'LRJSP — Ley 40/2015',
  'BOE-A-2015-11719': 'TREBEP — RDL 5/2015',
  'BOE-A-2018-16673': 'LOPDGDD — LO 3/2018',
  'BOE-A-2013-12887': 'Ley 19/2013 Transparencia',
  'BOE-A-1997-25336': 'Ley 50/1997 Gobierno',
  'BOE-A-2023-5366':  'Ley 4/2023 LGTBI',
  'BOE-A-2007-6115':  'LO 3/2007 Igualdad',
  'BOE-A-2004-21760': 'LO 1/2004 Violencia de Género',
  'BOE-A-2003-21614': 'LGP — Ley 47/2003',
  'BOE-A-1985-12666': 'LOPJ — LO 6/1985',
  'BOE-A-2017-12902': 'LCSP — Ley 9/2017',
}

const TEMA_NOMBRES: Record<string, string> = {
  [TEMAS.T1]:  'Tema 1 — La Constitución Española de 1978',
  [TEMAS.T2]:  'Tema 2 — El Tribunal Constitucional y la reforma constitucional',
  [TEMAS.T3]:  'Tema 3 — Las Cortes Generales',
  [TEMAS.T4]:  'Tema 4 — El Poder Judicial',
  [TEMAS.T5]:  'Tema 5 — El Gobierno y la Administración',
  [TEMAS.T6]:  'Tema 6 — Gobierno Abierto',
  [TEMAS.T7]:  'Tema 7 — La Transparencia y el buen gobierno',
  [TEMAS.T8]:  'Tema 8 — La Administración General del Estado',
  [TEMAS.T9]:  'Tema 9 — La organización territorial del Estado',
  [TEMAS.T10]: 'Tema 10 — La Unión Europea: instituciones',
  [TEMAS.T11]: 'Tema 11 — El procedimiento administrativo común (LPAC/LRJSP)',
  [TEMAS.T12]: 'Tema 12 — La protección de datos personales',
  [TEMAS.T13]: 'Tema 13 — El personal funcionario: el TREBEP',
  [TEMAS.T14]: 'Tema 14 — Derechos y deberes de los empleados públicos',
  [TEMAS.T15]: 'Tema 15 — El Presupuesto del Estado',
  [TEMAS.T16]: 'Tema 16 — Políticas de igualdad: LGTBI',
}

// ─── Lógica de mapping ────────────────────────────────────────────────────────

/**
 * Determina los tema_ids para un artículo dado.
 *
 * Reglas por ley (basadas en el temario oficial 2025-2026):
 *
 *   CE       → Varía por Título constitucional (ver switch interno)
 *   LPAC     → Tema 11 (procedimiento administrativo)
 *   LRJSP    → Temas 8 + 11 (organización AGE + régimen jurídico)
 *   TREBEP   → Tema 13 o 14 según Título (derechos/deberes → T14, resto → T13)
 *   LOPDGDD  → Tema 12
 *   Ley 19/2013 → Temas 6 + 7 (Gobierno Abierto + Transparencia)
 *   Ley 50/1997 → Tema 5 (Gobierno)
 *   Ley 4/2023  → Tema 16 (LGTBI)
 *   LO 3/2007   → Tema 16 (Igualdad)
 *   LO 1/2004   → Tema 16 (Violencia de Género)
 *   LGP        → Tema 15 (Presupuesto)
 *   LOTC       → Tema 2 (Tribunal Constitucional)
 *   LOPJ       → Tema 4 (Poder Judicial)
 *   LCSP       → Tema 8 (Contratos del sector público → AGE)
 */
function computeTemaIds(ley_codigo: string, titulo_seccion: string | null): string[] {
  const s = titulo_seccion ?? ''

  switch (ley_codigo) {
    // ── Constitución Española ─────────────────────────────────────────────────
    // Mapeo por Título constitucional. Arts 1-9 (Título Preliminar) → Tema 1.
    case 'BOE-A-1978-31229':
      if (s.includes('TÍTULO IX'))   return [TEMAS.T2]   // Tribunal Constitucional
      if (s.includes('TÍTULO VIII')) return [TEMAS.T9]   // Organización Territorial
      if (s.includes('TÍTULO VII'))  return [TEMAS.T15]  // Economía y Hacienda → Presupuesto
      if (s.includes('TÍTULO VI'))   return [TEMAS.T4]   // Poder Judicial
      if (s.includes('TÍTULO V'))    return [TEMAS.T5]   // Relaciones Gobierno-Cortes
      if (s.includes('TÍTULO IV'))   return [TEMAS.T5]   // Gobierno y Administración
      if (s.includes('TÍTULO III'))  return [TEMAS.T3]   // Cortes Generales
      // TÍTULO I (Derechos y Deberes), TÍTULO II (Corona), sin sección (Prelim) → T1
      return [TEMAS.T1]

    // ── LPAC — Ley 39/2015 ────────────────────────────────────────────────────
    case 'BOE-A-2015-10565':
      return [TEMAS.T11]

    // ── LRJSP — Ley 40/2015 ───────────────────────────────────────────────────
    // Cubre tanto la organización del sector público (T8) como el régimen jurídico
    // que complementa el procedimiento administrativo (T11).
    case 'BOE-A-2015-10566':
      return [TEMAS.T8, TEMAS.T11]

    // ── TREBEP — RDL 5/2015 ───────────────────────────────────────────────────
    // Título III (Derechos, Deberes, Código de Conducta) + Título VII (Disciplinario) → T14
    // Resto (acceso, carrera, situaciones administrativas) → T13
    case 'BOE-A-2015-11719':
      if (s.includes('TÍTULO III') || s.includes('TÍTULO VII')) return [TEMAS.T14]
      return [TEMAS.T13]

    // ── LOPDGDD — LO 3/2018 ───────────────────────────────────────────────────
    case 'BOE-A-2018-16673':
      return [TEMAS.T12]

    // ── Ley 19/2013 Transparencia ─────────────────────────────────────────────
    // Cubre Gobierno Abierto (T6) y Transparencia propiamente (T7) — temas gemelos.
    case 'BOE-A-2013-12887':
      return [TEMAS.T6, TEMAS.T7]

    // ── Ley 50/1997 del Gobierno ──────────────────────────────────────────────
    case 'BOE-A-1997-25336':
      return [TEMAS.T5]

    // ── Ley 4/2023 LGTBI ──────────────────────────────────────────────────────
    case 'BOE-A-2023-5366':
      return [TEMAS.T16]

    // ── LO 3/2007 Igualdad ────────────────────────────────────────────────────
    case 'BOE-A-2007-6115':
      return [TEMAS.T16]

    // ── LO 1/2004 Violencia de Género ─────────────────────────────────────────
    case 'BOE-A-2004-21760':
      return [TEMAS.T16]

    // ── LGP — Ley 47/2003 ─────────────────────────────────────────────────────
    case 'BOE-A-2003-21614':
      return [TEMAS.T15]

    // ── LOTC — LO 2/1979 ──────────────────────────────────────────────────────
    case 'BOE-A-1979-23709':
      return [TEMAS.T2]

    // ── LOPJ — LO 6/1985 ──────────────────────────────────────────────────────
    case 'BOE-A-1985-12666':
      return [TEMAS.T4]

    // ── LCSP — Ley 9/2017 ─────────────────────────────────────────────────────
    // Contratos del sector público → administración pública activa → T8
    case 'BOE-A-2017-12902':
      return [TEMAS.T8]

    default:
      return []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ArticuloRow {
  id: string
  ley_codigo: string
  ley_nombre: string
  articulo_numero: string
  titulo_seccion: string | null
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  OPTEK auto-map-themes.ts — §1.1.9 + §1.1.11               ║')
  console.log('║  Mapeo determinista de artículos a tema_ids                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  // ── 1. Leer todos los artículos de la BD ─────────────────────────────────

  console.log('📥 Leyendo artículos de legislacion...')
  const { data: articulos, error } = await supabase
    .from('legislacion')
    .select('id, ley_codigo, ley_nombre, articulo_numero, titulo_seccion')
    .eq('activo', true)
    .order('ley_codigo')
    .order('articulo_numero')

  if (error) {
    console.error('❌ Error leyendo legislacion:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${articulos.length} artículos leídos`)
  console.log()

  // ── 2. Computar tema_ids para cada artículo ───────────────────────────────

  console.log('🗺️  Computando tema_ids (mapping determinista)...')

  const updates: Array<{ id: string; tema_ids: string[] }> = []
  const statsPerLey: Record<string, { total: number; porTema: Record<string, number> }> = {}
  const statsPerTema: Record<string, number> = {}
  let sinTema = 0

  for (const art of articulos as ArticuloRow[]) {
    const temaIds = computeTemaIds(art.ley_codigo, art.titulo_seccion)
    updates.push({ id: art.id, tema_ids: temaIds })

    // Stats por ley
    const leyNombre = LEY_NOMBRES[art.ley_codigo] ?? art.ley_codigo
    if (!statsPerLey[leyNombre]) statsPerLey[leyNombre] = { total: 0, porTema: {} }
    statsPerLey[leyNombre].total++

    if (temaIds.length === 0) {
      sinTema++
      statsPerLey[leyNombre].porTema['SIN_TEMA'] =
        (statsPerLey[leyNombre].porTema['SIN_TEMA'] ?? 0) + 1
    } else {
      for (const tId of temaIds) {
        const tNombre = TEMA_NOMBRES[tId] ?? tId
        statsPerLey[leyNombre].porTema[tNombre] =
          (statsPerLey[leyNombre].porTema[tNombre] ?? 0) + 1
        statsPerTema[tNombre] = (statsPerTema[tNombre] ?? 0) + 1
      }
    }
  }

  console.log(`✅ ${updates.length} artículos procesados (${sinTema} sin tema asignado)`)
  console.log()

  // ── 3. Actualizar BD en batches ───────────────────────────────────────────

  const BATCH_SIZE = 100
  const batches = Math.ceil(updates.length / BATCH_SIZE)
  let updated = 0
  let errors = 0

  console.log(`📤 Actualizando BD en ${batches} batches de ${BATCH_SIZE}...`)

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    // Actualizar cada artículo del batch
    for (const upd of batch) {
      const { error: updateError } = await supabase
        .from('legislacion')
        .update({ tema_ids: upd.tema_ids })
        .eq('id', upd.id)

      if (updateError) {
        console.error(`  ❌ Error actualizando ${upd.id}: ${updateError.message}`)
        errors++
      } else {
        updated++
      }
    }

    const pct = Math.round((batchNum / batches) * 100)
    process.stdout.write(`\r  Batch ${batchNum}/${batches} (${pct}%) — ${updated} actualizados`)
  }

  console.log()
  console.log()
  console.log(`✅ BD actualizada: ${updated} OK / ${errors} errores`)
  console.log()

  // ── 4. Generar informe JSON (§1.1.11) ─────────────────────────────────────

  console.log('📄 Generando data/mapeo_temas_legislacion.json (§1.1.11)...')

  const mapeadosSinTema = updates.filter(u => u.tema_ids.length === 0).length
  const informe = {
    _generado: new Date().toISOString(),
    _descripcion: 'Mapeo determinista de artículos de legislacion a tema_ids (convocatoria 2025-2026)',
    _script: 'execution/auto-map-themes.ts',
    resumen: {
      total_articulos: updates.length,
      articulos_mapeados: updates.length - mapeadosSinTema,
      articulos_sin_tema: mapeadosSinTema,
      cobertura_pct: Number(((updates.length - mapeadosSinTema) / updates.length * 100).toFixed(1)),
      errores_bd: errors,
    },
    por_ley: statsPerLey,
    articulos_por_tema: statsPerTema,
    temas_cubiertos: Object.keys(statsPerTema).length,
    temas_sin_contenido: Object.values(TEMAS).filter(tId => !statsPerTema[TEMA_NOMBRES[tId]]).map(
      tId => TEMA_NOMBRES[tId]
    ),
  }

  const outputPath = join(process.cwd(), '..', 'data', 'mapeo_temas_legislacion.json')
  writeFileSync(outputPath, JSON.stringify(informe, null, 2), 'utf-8')
  console.log(`✅ Informe guardado en data/mapeo_temas_legislacion.json`)
  console.log()

  // ── 5. Resumen final ──────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  RESUMEN — Artículos por tema:')
  console.log('═══════════════════════════════════════════════════════════════')

  const temasOrdenados = Object.entries(statsPerTema).sort(([a], [b]) => a.localeCompare(b))
  for (const [tema, count] of temasOrdenados) {
    console.log(`  ${tema.padEnd(60, '.')} ${String(count).padStart(4)}`)
  }

  if (informe.temas_sin_contenido.length > 0) {
    console.log()
    console.log('  ⚠️  TEMAS SIN CONTENIDO (requieren ingesta adicional §1.1.6E):')
    for (const t of informe.temas_sin_contenido) {
      console.log(`     ${t}`)
    }
  }

  console.log()
  console.log(`  Total: ${informe.resumen.articulos_mapeados}/${informe.resumen.total_articulos} artículos mapeados (${informe.resumen.cobertura_pct}%)`)
  console.log()

  if (errors > 0) {
    console.log(`⚠️  ${errors} errores en BD — revisar logs`)
    process.exit(1)
  }

  console.log('✅ §1.1.9 completado — tema_ids mapeados en BD')
  console.log('✅ §1.1.11 completado — data/mapeo_temas_legislacion.json generado')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
