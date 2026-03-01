/**
 * lib/ai/retrieval.ts — OPTEK §1.4
 *
 * Módulo RAG de recuperación de contexto legislativo.
 *
 * Estrategia híbrida:
 *   1. retrieveByTema    → lookup por tema_ids (cuando estén mapeados)
 *   2. retrieveBySemantic → búsqueda vectorial HNSW (siempre disponible)
 *   3. retrieveByArticle → lookup exacto para verificación determinista
 *   4. buildContext      → combina 1+2, formatea para Claude (~8k tokens)
 *
 * Nota sobre tema_ids: actualmente vacíos (mapeo pendiente §1.1.9-1.1.11).
 * retrieveByTema hace fallback automático a búsqueda semántica con el título del tema.
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ArticuloContext {
  id: string
  ley_nombre: string
  ley_codigo: string
  articulo_numero: string
  apartado: string | null
  titulo_capitulo: string
  texto_integro: string
  similarity?: number // presente en resultados semánticos
}

export interface RetrievalContext {
  articulos: ArticuloContext[]
  tokensEstimados: number
  strategy: 'tema_ids' | 'semantic' | 'hybrid'
  /** true cuando el tema pertenece al Bloque II (temas 17-28: ofimática, informática, admin electrónica) */
  esBloqueII: boolean
  /** Número del tema (17-28 para Bloque II, 1-16 para Bloque I) */
  temaNumero: number | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Límite de tokens para el contexto enviado a Claude.
// text-embedding-3-small promedio: ~4 chars/token.
// 8000 tokens ≈ 32.000 chars de contexto legislativo.
const MAX_CONTEXT_CHARS = 32_000
const DEFAULT_RETRIEVAL_LIMIT = 20

// ─── Cliente Supabase (service role para bypass RLS en retrieval) ─────────────

function getSupabaseClient() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Cliente sin tipo para tablas nuevas aún no en types/database.ts
 * (migrations pendientes de aplicar en Supabase remoto).
 * Se elimina este helper cuando se regeneren los tipos.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUntypedClient(): ReturnType<typeof createClient<any>> {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─── 1. Recuperación por tema (usa tema_ids cuando estén mapeados) ────────────

/**
 * Recupera artículos asociados a un tema por su UUID.
 * Si tema_ids está vacío → fallback automático a búsqueda semántica
 * usando el título del tema como query.
 */
export async function retrieveByTema(
  temaId: string,
  limit = DEFAULT_RETRIEVAL_LIMIT
): Promise<ArticuloContext[]> {
  const supabase = getSupabaseClient()

  // Intentar lookup directo por tema_ids
  const { data: byTema, error } = await supabase
    .from('legislacion')
    .select(
      'id, ley_nombre, ley_codigo, articulo_numero, apartado, titulo_capitulo, texto_integro'
    )
    .contains('tema_ids', [temaId])
    .eq('activo', true)
    .limit(limit)

  if (error) {
    logger.warn({ temaId, error: error.message }, '[retrieval] retrieveByTema error')
  }

  if (byTema && byTema.length > 0) {
    return byTema as ArticuloContext[]
  }

  // Fallback: obtener título del tema y hacer búsqueda semántica
  logger.info({ temaId }, '[retrieval] tema_ids vacío, fallback a búsqueda semántica')

  const { data: tema } = await supabase
    .from('temas')
    .select('titulo, descripcion')
    .eq('id', temaId)
    .single()

  if (!tema) {
    logger.warn({ temaId }, '[retrieval] Tema no encontrado en BD')
    return []
  }

  const query = `${tema.titulo}. ${tema.descripcion ?? ''}`.trim()
  return retrieveBySemantic(query, limit)
}

// ─── 2. Recuperación semántica (embedding + HNSW) ─────────────────────────────

/**
 * Recupera artículos por similitud semántica con la query.
 * Llama a OpenAI para generar el embedding de la query, luego RPC match_legislacion.
 */
export async function retrieveBySemantic(
  query: string,
  limit = 10
): Promise<ArticuloContext[]> {
  const supabase = getSupabaseClient()

  // Resilient embedding generation: if OpenAI fails (bad key, billing, network),
  // fall back immediately to full-text search instead of propagating a 500.
  let embedding: number[]
  try {
    embedding = await generateEmbedding(query)
  } catch (err) {
    logger.warn(
      { query: query.slice(0, 50), err },
      '[retrieval] generateEmbedding falló — fallback full-text'
    )
    return retrieveByFullText(query, limit)
  }

  const { data, error } = await supabase.rpc('match_legislacion', {
    query_embedding: embedding as unknown as string,
    match_count: limit,
    filter_oposicion: undefined,
  })

  if (error) {
    logger.error({ query, error: error.message }, '[retrieval] match_legislacion RPC error')
    return retrieveByFullText(query, limit)
  }

  // Si no hay resultados semánticos (embeddings no generados aún), usar full-text
  if (!data || data.length === 0) {
    logger.info({ query: query.slice(0, 50) }, '[retrieval] match_legislacion vacío — fallback full-text')
    return retrieveByFullText(query, limit)
  }

  return data as ArticuloContext[]
}

// ─── 3. Recuperación full-text (fallback sin OpenAI) ─────────────────────────

/**
 * Búsqueda full-text en texto_integro usando ts_rank español.
 * Usado como fallback cuando match_legislacion falla.
 */
export async function retrieveByFullText(
  query: string,
  limit = 10
): Promise<ArticuloContext[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('search_legislacion', {
    query_text: query,
    match_count: limit,
  })

  if (error) {
    logger.error({ query, error: error.message }, '[retrieval] search_legislacion RPC error')
    return []
  }

  return (data ?? []) as ArticuloContext[]
}

// ─── 4. Recuperación exacta por artículo (verificación determinista) ──────────

/**
 * Lookup exacto por ley_codigo + articulo_numero.
 * Usado en el pipeline de verificación determinista de citas.
 */
export async function retrieveByArticle(
  leyCodigo: string,
  articuloNumero: string
): Promise<ArticuloContext | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('legislacion')
    .select(
      'id, ley_nombre, ley_codigo, articulo_numero, apartado, titulo_capitulo, texto_integro'
    )
    .eq('ley_codigo', leyCodigo)
    .eq('articulo_numero', articuloNumero)
    .eq('activo', true)
    .single()

  if (error) {
    // PGRST116 = no rows found (normal en verificación)
    if (error.code !== 'PGRST116') {
      logger.warn(
        { leyCodigo, articuloNumero, error: error.message },
        '[retrieval] retrieveByArticle error'
      )
    }
    return null
  }

  return data as ArticuloContext
}

// ─── 5. Recuperación Bloque II — conocimiento_tecnico ─────────────────────────

/**
 * Recupera secciones de conocimiento técnico (Bloque II) para un tema.
 * Estrategia: búsqueda directa por tema_id + fallback semántico.
 *
 * @param temaId  UUID del tema (17-28 del temario)
 * @param bloque  Filtro de bloque BD ('ofimatica' | 'informatica' | 'admin_electronica')
 * @param limit   Número máximo de secciones
 */
export interface SeccionContext {
  id: string
  bloque: string
  tema_id: string | null
  titulo_seccion: string
  contenido: string
  fuente_url: string | null
  similarity?: number
}

export async function retrieveByBloque(
  temaId: string,
  bloque: 'ofimatica' | 'informatica' | 'admin_electronica',
  limit = DEFAULT_RETRIEVAL_LIMIT
): Promise<SeccionContext[]> {
  // Nota: usa cliente sin tipo porque conocimiento_tecnico aún no está en types/database.ts
  // (migration 013 pendiente de aplicar en Supabase remoto)
  const supabase = getUntypedClient()
  const typedSupabase = getSupabaseClient()

  // Lookup directo por tema_id + bloque
  const { data: byTema, error } = await supabase
    .from('conocimiento_tecnico')
    .select('id, bloque, tema_id, titulo_seccion, contenido, fuente_url')
    .eq('tema_id', temaId)
    .eq('bloque', bloque)
    .eq('activo', true)
    .limit(limit)

  if (error) {
    logger.warn({ temaId, bloque, error: error.message }, '[retrieval] retrieveByBloque error')
  }

  if (byTema && (byTema as unknown[]).length > 0) {
    return byTema as SeccionContext[]
  }

  // Fallback semántico: obtener título del tema + buscar en conocimiento_tecnico
  logger.info({ temaId, bloque }, '[retrieval] conocimiento_tecnico vacío, fallback semántico')

  const { data: tema } = await typedSupabase
    .from('temas')
    .select('titulo, descripcion')
    .eq('id', temaId)
    .single()

  if (!tema) return []

  const query = `${tema.titulo}. ${(tema as { descripcion?: string }).descripcion ?? ''}`.trim()

  try {
    const embedding = await generateEmbedding(query)

    const { data: semantic } = await supabase.rpc('match_conocimiento', {
      query_embedding: embedding as unknown as string,
      match_count: limit,
      filter_bloque: bloque,
    })

    return ((semantic ?? []) as unknown[]) as SeccionContext[]
  } catch {
    logger.warn({ temaId, bloque }, '[retrieval] match_conocimiento RPC error — sin fallback adicional')
    return []
  }
}

// ─── 6. Recuperación por examen oficial ───────────────────────────────────────

/**
 * Recupera preguntas de un examen oficial, opcionalmente filtradas por tema.
 * Usado en generate-simulacro para incluir preguntas históricas.
 *
 * @param examenId    UUID del examen oficial
 * @param temaNumero  Filtro opcional por número de tema del temario
 * @param limit       Máximo de preguntas a recuperar
 */
export interface PreguntaOficialContext {
  id: string
  examen_id: string
  numero: number
  enunciado: string
  opciones: string[]
  correcta: number
  tema_id: string | null
}

export async function retrieveByExamenOficial(
  examenId: string,
  temaNumero?: number,
  limit = 30
): Promise<PreguntaOficialContext[]> {
  // Nota: usa cliente sin tipo porque preguntas_oficiales aún no está en types/database.ts
  const supabase = getUntypedClient()
  const typedSupabase = getSupabaseClient()

  let temaId: string | undefined

  if (temaNumero !== undefined) {
    const { data: tema } = await typedSupabase
      .from('temas')
      .select('id')
      .eq('numero', temaNumero)
      .maybeSingle()

    if (tema) temaId = (tema as { id: string }).id
  }

  let qb = supabase
    .from('preguntas_oficiales')
    .select('id, examen_id, numero, enunciado, opciones, correcta, tema_id')
    .eq('examen_id', examenId)
    .order('numero', { ascending: true })
    .limit(limit)

  if (temaId) {
    qb = qb.eq('tema_id', temaId)
  }

  const { data, error } = await qb

  if (error) {
    logger.error({ examenId, error: error.message }, '[retrieval] retrieveByExamenOficial error')
    return []
  }

  return ((data ?? []) as unknown[]) as PreguntaOficialContext[]
}

// ─── 7. buildContext — contexto completo para Claude ─────────────────────────

/**
 * Construye el contexto legislativo para enviar a Claude.
 *
 * Estrategia:
 *   - retrieveByTema (usa tema_ids o fallback semántico)
 *   - Si se pasa query: añadir retrieveBySemantic con esa query
 *   - Deduplicar por id
 *   - Formatear como texto estructurado
 *   - Truncar a MAX_CONTEXT_CHARS
 *
 * @param temaId  UUID del tema del temario oficial
 * @param query   Pregunta o concepto específico (opcional, mejora relevancia)
 * @returns       { articulos, tokensEstimados, strategy }
 */
/**
 * Temas 17-28 son Bloque II (ofimática/informática).
 * buildContext detecta el bloque del tema y usa la fuente de conocimiento correcta.
 */
const BLOQUE_II_NUMEROS = new Set([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28])

/** Mapeo tema_numero → bloque BD para conocimiento_tecnico */
function getBloqueForTema(temaNumero: number): 'ofimatica' | 'informatica' | 'admin_electronica' {
  if ([17, 18, 19, 20].includes(temaNumero)) return 'admin_electronica'
  if ([21, 28].includes(temaNumero)) return 'informatica'
  return 'ofimatica' // temas 22-27
}

export async function buildContext(
  temaId: string,
  query?: string
): Promise<RetrievalContext> {
  const start = Date.now()
  const supabase = getSupabaseClient()

  // Detectar si el tema es Bloque II consultando el número de tema
  const { data: temaData } = await supabase
    .from('temas')
    .select('numero')
    .eq('id', temaId)
    .maybeSingle()

  const temaNumero: number | null = temaData?.numero ?? null
  const esBloqueII = temaNumero !== null && BLOQUE_II_NUMEROS.has(temaNumero)

  let articulos: ArticuloContext[] = []
  let strategy: RetrievalContext['strategy'] = 'tema_ids'

  if (esBloqueII) {
    // ── Bloque II: buscar en conocimiento_tecnico ─────────────────────────────
    const bloque = getBloqueForTema(temaNumero!)
    const secciones = await retrieveByBloque(temaId, bloque, 15)

    if (secciones.length > 0) {
      // Adaptar SeccionContext → ArticuloContext para reutilizar el formateo
      articulos = secciones.map((s) => ({
        id: s.id,
        ley_nombre: `[${bloque.toUpperCase()}]`,
        ley_codigo: bloque,
        articulo_numero: '',
        apartado: null,
        titulo_capitulo: s.titulo_seccion,
        texto_integro: s.contenido,
        similarity: s.similarity,
      }))
      strategy = 'hybrid'
    }

    logger.info(
      { temaId, temaNumero, bloque, secciones: articulos.length },
      '[retrieval] buildContext Bloque II'
    )
  } else {
    // ── Bloque I: buscar en legislacion (comportamiento original) ─────────────
    const [byTema, bySemantic] = await Promise.all([
      retrieveByTema(temaId, 15),
      query ? retrieveBySemantic(query, 8) : Promise.resolve([]),
    ])

    const seen = new Set<string>()
    const combined: ArticuloContext[] = []
    for (const art of [...byTema, ...bySemantic]) {
      if (!seen.has(art.id)) {
        seen.add(art.id)
        combined.push(art)
      }
    }

    strategy =
      byTema.length > 0 && bySemantic.length > 0
        ? 'hybrid'
        : bySemantic.length > 0
          ? 'semantic'
          : 'tema_ids'

    articulos = combined
  }

  // Truncar para no exceder el límite de contexto
  let totalChars = 0
  const articulosTruncados: ArticuloContext[] = []

  for (const art of articulos) {
    const artChars = formatArticulo(art).length
    if (totalChars + artChars > MAX_CONTEXT_CHARS) break
    articulosTruncados.push(art)
    totalChars += artChars
  }

  const tokensEstimados = Math.ceil(totalChars / 4)

  logger.info(
    {
      temaId,
      temaNumero,
      esBloqueII,
      query: query?.slice(0, 50),
      articulos: articulosTruncados.length,
      tokensEstimados,
      strategy,
      durationMs: Date.now() - start,
    },
    '[retrieval] buildContext completado'
  )

  return { articulos: articulosTruncados, tokensEstimados, strategy, esBloqueII, temaNumero }
}

// ─── Helpers de formateo ──────────────────────────────────────────────────────

/**
 * Formatea un artículo como bloque de texto para el contexto de Claude.
 *
 * Formato:
 *   === [LPAC] Artículo 53 — TÍTULO I | CAPÍTULO II ===
 *   [texto íntegro del artículo]
 */
export function formatArticulo(art: ArticuloContext): string {
  const header = `=== [${art.ley_nombre}] Artículo ${art.articulo_numero}${art.titulo_capitulo ? ` — ${art.titulo_capitulo}` : ''} ===`
  return `${header}\n${art.texto_integro}\n`
}

/**
 * Formatea el contexto completo como string para incluir en el prompt de Claude.
 */
export function formatContext(ctx: RetrievalContext): string {
  if (ctx.articulos.length === 0) {
    return '[Sin contexto legislativo disponible para este tema]'
  }

  const lines = [
    `--- CONTEXTO LEGISLATIVO (${ctx.articulos.length} artículos, ~${ctx.tokensEstimados} tokens) ---`,
    '',
    ...ctx.articulos.map(formatArticulo),
    '--- FIN DEL CONTEXTO ---',
  ]

  return lines.join('\n')
}
