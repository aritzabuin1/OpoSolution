/**
 * lib/seo/law-queries.ts — Queries Supabase para páginas de legislación pSEO
 *
 * Usa createServiceClient() (bypass RLS, sin cookies) — patrón idéntico a
 * examenes-oficiales/[examen]/page.tsx.
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ArticuloRow {
  articulo_numero: string
  titulo_articulo: string | null
  titulo_capitulo: string | null
  texto_integro: string
  apartado: string | null
}

export interface ArticuloSummary {
  articulo_numero: string
  titulo_articulo: string | null
  titulo_capitulo: string | null
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch all articles for a law (for law index page).
 * Returns one row per distinct (articulo_numero, apartado) — may include
 * multi-provision articles.
 */
export async function getLawArticles(leyNombre: string): Promise<ArticuloSummary[]> {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('legislacion')
    .select('articulo_numero, titulo_articulo, titulo_capitulo')
    .eq('ley_nombre', leyNombre)
    .eq('activo', true)
    .order('articulo_numero')

  if (error) {
    console.error(`[law-queries] getLawArticles error for ${leyNombre}:`, error.message)
    return []
  }

  return data ?? []
}

/**
 * Fetch all provisions for a specific article (for article detail page).
 * Returns 1-N rows (multi-provision articles have >1 row).
 */
export async function getArticleProvisions(
  leyNombre: string,
  articuloNumero: string,
): Promise<ArticuloRow[]> {
  const supabase = await createServiceClient()

  // Try exact match first
  let { data, error } = await (supabase as any)
    .from('legislacion')
    .select('articulo_numero, titulo_articulo, titulo_capitulo, texto_integro, apartado')
    .eq('ley_nombre', leyNombre)
    .eq('articulo_numero', articuloNumero)
    .eq('activo', true)
    .order('apartado')

  if (error) {
    console.error(`[law-queries] getArticleProvisions error:`, error.message)
    return []
  }

  // If no exact match, try case-insensitive / diacritics-stripped match
  if (!data || data.length === 0) {
    const normalized = articuloNumero
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const allArticles = await getLawArticles(leyNombre)
    const match = allArticles.find(a => {
      const norm = a.articulo_numero
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return norm === normalized
    })

    if (match) {
      const result = await (supabase as any)
        .from('legislacion')
        .select('articulo_numero, titulo_articulo, titulo_capitulo, texto_integro, apartado')
        .eq('ley_nombre', leyNombre)
        .eq('articulo_numero', match.articulo_numero)
        .eq('activo', true)
        .order('apartado')

      data = result.data
    }
  }

  return data ?? []
}

/**
 * Fetch related articles from the same section/chapter.
 * Used for "Artículos relacionados" on article pages.
 */
export async function getRelatedArticles(
  leyNombre: string,
  tituloCapitulo: string | null,
  excludeNumero: string,
  limit = 5,
): Promise<ArticuloSummary[]> {
  if (!tituloCapitulo) return []

  const supabase = await createServiceClient()

  // Extract the first section identifier (e.g., "TÍTULO I" or "CAPÍTULO I")
  const sectionPrefix = tituloCapitulo.split('|')[0]?.split('—')[0]?.trim()
  if (!sectionPrefix || sectionPrefix.length < 5) return []

  const { data, error } = await (supabase as any)
    .from('legislacion')
    .select('articulo_numero, titulo_articulo, titulo_capitulo')
    .eq('ley_nombre', leyNombre)
    .eq('activo', true)
    .ilike('titulo_capitulo', `${sectionPrefix}%`)
    .neq('articulo_numero', excludeNumero)
    .limit(limit * 2) // fetch extra to deduplicate

  if (error) {
    console.error(`[law-queries] getRelatedArticles error:`, error.message)
    return []
  }

  // Deduplicate by articulo_numero (multi-provision may return dupes)
  const seen = new Set<string>()
  const unique: ArticuloSummary[] = []
  for (const row of data ?? []) {
    if (!seen.has(row.articulo_numero)) {
      seen.add(row.articulo_numero)
      unique.push(row)
    }
    if (unique.length >= limit) break
  }

  return unique
}

/**
 * Get total article count for a law (for metadata).
 */
export async function getLawArticleCount(leyNombre: string): Promise<number> {
  const supabase = await createServiceClient()

  const { count, error } = await (supabase as any)
    .from('legislacion')
    .select('articulo_numero', { count: 'exact', head: true })
    .eq('ley_nombre', leyNombre)
    .eq('activo', true)

  if (error) return 0
  return count ?? 0
}
