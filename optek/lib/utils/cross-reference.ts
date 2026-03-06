/**
 * lib/utils/cross-reference.ts — §2.25.3
 *
 * Obtiene los años de convocatoria INAP en los que ha aparecido un tema,
 * consultando preguntas_oficiales JOIN examenes_oficiales.
 *
 * Zero-cost: usa datos ya existentes en BD sin migrations adicionales.
 */

import { createServiceClient } from '@/lib/supabase/server'

/**
 * Retorna los años de convocatoria INAP en los que aparecen preguntas
 * del tema dado. Útil para mostrar "Apareció en: 2019, 2022, 2024".
 *
 * @param temaId - UUID del tema
 * @returns array de años ordenado ascendente (puede estar vacío)
 */
export async function getAniosConvocatoria(temaId: string): Promise<number[]> {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('preguntas_oficiales')
    .select('examen_id, examenes_oficiales!inner(anio)')
    .eq('tema_id', temaId)
    .limit(200)

  if (!data) return []

  const years = new Set<number>()
  for (const row of data as Array<{ examenes_oficiales: { anio: number } | null }>) {
    const anio = row.examenes_oficiales?.anio
    if (anio) years.add(anio)
  }

  return [...years].sort((a, b) => a - b)
}

/**
 * Batch version: obtiene años para múltiples temaIds en una sola query.
 *
 * @param temaIds - Array de UUIDs de temas
 * @returns Map<temaId, number[]> con los años por tema
 */
export async function getAniosConvocatoriaBatch(
  temaIds: string[]
): Promise<Map<string, number[]>> {
  if (temaIds.length === 0) return new Map()

  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('preguntas_oficiales')
    .select('tema_id, examen_id, examenes_oficiales!inner(anio)')
    .in('tema_id', temaIds)
    .limit(500)

  const sets = new Map<string, Set<number>>()
  if (!data) return new Map()

  for (const row of data as Array<{
    tema_id: string
    examenes_oficiales: { anio: number } | null
  }>) {
    const { tema_id, examenes_oficiales } = row
    const anio = examenes_oficiales?.anio
    if (!tema_id || !anio) continue
    if (!sets.has(tema_id)) sets.set(tema_id, new Set<number>())
    sets.get(tema_id)!.add(anio)
  }

  // Convert Sets to sorted arrays
  const result = new Map<string, number[]>()
  for (const [id, s] of sets) result.set(id, [...s].sort((a, b) => a - b))

  return result
}
