/**
 * lib/estudiar/resolver.ts
 *
 * Dado un temaId, devuelve los bloques de estudio disponibles con su estado.
 *
 * Arquitectura: presentar por tema, almacenar por ley.
 * - legislacion.tema_ids[] → leyes del tema
 * - AGRUPACIONES[ley_codigo] → bloques lógicos
 * - resumen_legislacion → contenido ya generado
 * - conocimiento_tecnico → temas sin legislación (ya tienen resúmenes)
 */

import { getAgrupaciones, type BloqueEstudio } from './agrupaciones'

export interface BloqueConEstado {
  ley: string              // ley_codigo
  rango: string
  titulo: string
  tituloCompleto: string   // 'Constitución Española — Derechos Fundamentales (arts. 14-29)'
  generado: boolean
  contenido?: string       // solo si generado=true
  articulosCount: number   // artículos reales en BD para este bloque
  tipo: 'legislacion' | 'conocimiento_tecnico'
}

/** Parse rango string "14-29" into [min, max] numbers */
function parseRango(rango: string): [number, number] | null {
  // Handle special ranges like "Preliminar-9"
  const match = rango.match(/(\d+)\s*-\s*(\d+)/)
  if (!match) {
    // Single-section range like "1-11" not matching? Try just numbers
    const singleMatch = rango.match(/^(\d+)$/)
    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10)
      return [n, n]
    }
    return null
  }
  return [parseInt(match[1], 10), parseInt(match[2], 10)]
}

/** Check if an articulo_numero falls within a rango */
function articuloInRango(articuloNumero: string, rango: string): boolean {
  const parsed = parseRango(rango)
  if (!parsed) {
    // For ranges like "Preliminar-9", include articles 1-9
    if (rango.startsWith('Preliminar')) {
      const max = parseInt(rango.split('-')[1], 10)
      const num = parseInt(articuloNumero, 10)
      return !isNaN(num) && num >= 1 && num <= max
    }
    return false
  }
  const [min, max] = parsed
  // articulo_numero might be "14", "53.1", "103 bis"
  const num = parseInt(articuloNumero, 10)
  return !isNaN(num) && num >= min && num <= max
}

/**
 * Resolver bloques de estudio para un tema.
 *
 * @param supabase - Service client (bypass RLS)
 * @param temaId - UUID del tema
 * @returns Array de bloques con estado (generado o no)
 */
export async function resolverBloquesPorTema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  temaId: string
): Promise<BloqueConEstado[]> {
  const resultado: BloqueConEstado[] = []

  // 1. Get distinct ley_codigos that are tagged for this tema
  const { data: leyRows } = await supabase
    .from('legislacion')
    .select('ley_codigo, ley_nombre, articulo_numero')
    .contains('tema_ids', [temaId])

  if (leyRows && leyRows.length > 0) {
    // Group articles by ley_codigo
    const articulosPorLey = new Map<string, { leyNombre: string; articulos: string[] }>()
    for (const row of leyRows) {
      const existing = articulosPorLey.get(row.ley_codigo)
      if (existing) {
        existing.articulos.push(row.articulo_numero)
      } else {
        articulosPorLey.set(row.ley_codigo, {
          leyNombre: row.ley_nombre,
          articulos: [row.articulo_numero],
        })
      }
    }

    // 2. For each ley, find matching agrupaciones
    const leyCodigos = [...articulosPorLey.keys()]

    // 3. Fetch existing resúmenes for these leyes
    const { data: resumenes } = await supabase
      .from('resumen_legislacion')
      .select('ley_codigo, rango, contenido')
      .in('ley_codigo', leyCodigos)

    const resumenMap = new Map<string, string>()
    if (resumenes) {
      for (const r of resumenes) {
        resumenMap.set(`${r.ley_codigo}:${r.rango}`, r.contenido)
      }
    }

    // 4. Build blocks
    for (const [leyCodigo, info] of articulosPorLey) {
      const bloques = getAgrupaciones(leyCodigo)

      if (bloques.length === 0) {
        // No agrupaciones defined — create a single fallback block
        const contenido = resumenMap.get(`${leyCodigo}:all`)
        resultado.push({
          ley: leyCodigo,
          rango: 'all',
          titulo: info.leyNombre,
          tituloCompleto: info.leyNombre,
          generado: !!contenido,
          contenido: contenido || undefined,
          articulosCount: info.articulos.length,
          tipo: 'legislacion',
        })
        continue
      }

      // Filter to only blocks that have articles tagged for this tema
      for (const bloque of bloques) {
        const articulosEnBloque = info.articulos.filter(
          artNum => articuloInRango(artNum, bloque.rango)
        )
        if (articulosEnBloque.length === 0) continue

        const key = `${leyCodigo}:${bloque.rango}`
        const contenido = resumenMap.get(key)

        resultado.push({
          ley: leyCodigo,
          rango: bloque.rango,
          titulo: bloque.titulo,
          tituloCompleto: `${info.leyNombre} — ${bloque.titulo} (arts. ${bloque.rango})`,
          generado: !!contenido,
          contenido: contenido || undefined,
          articulosCount: articulosEnBloque.length,
          tipo: 'legislacion',
        })
      }
    }
  }

  // 5. Also check conocimiento_tecnico for non-legislative content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ctRows } = await (supabase as any)
    .from('conocimiento_tecnico')
    .select('id, titulo, contenido')
    .contains('tema_ids', [temaId])

  if (ctRows && ctRows.length > 0) {
    for (const ct of ctRows) {
      resultado.push({
        ley: 'conocimiento_tecnico',
        rango: ct.id,
        titulo: ct.titulo,
        tituloCompleto: ct.titulo,
        generado: true,  // conocimiento_tecnico already has content
        contenido: ct.contenido,
        articulosCount: 1,
        tipo: 'conocimiento_tecnico',
      })
    }
  }

  return resultado
}
