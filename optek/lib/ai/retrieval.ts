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
  strategy: 'tema_ids' | 'semantic' | 'hybrid' | 'weakness-weighted'
  /** true cuando el tema usa conocimiento_tecnico (Bloque II ofimática, Correos operativo, etc.) */
  esBloqueII: boolean
  /** Número del tema (17-28 para Bloque II, 1-16 para Bloque I) */
  temaNumero: number | null
  /** Tipo de bloque de conocimiento: 'ofimatica' | 'correos' | null (legislación) */
  bloqueType: string | null
  /** Número de artículos débiles del usuario incluidos al inicio del contexto (§2.11) */
  weakArticulosCount?: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Límite de tokens para el contexto enviado a la IA.
// text-embedding-3-small promedio: ~4 chars/token.
// 4000 tokens ≈ 16.000 chars — suficiente para 8-10 artículos relevantes.
// Reducido de 32k: contextos más pequeños → AI responde 2× más rápido.
const MAX_CONTEXT_CHARS = 16_000
const DEFAULT_RETRIEVAL_LIMIT = 10

// ─── Cliente Supabase singleton (service role para bypass RLS en retrieval) ───
// Reutilizar el mismo cliente en todas las operaciones de retrieval
// (antes se creaba uno nuevo en cada función → N clientes por request)

let _supabase: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseClient() {
  if (_supabase) return _supabase
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  _supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _supabase
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _untypedSupabase: ReturnType<typeof createClient<any>> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUntypedClient(): ReturnType<typeof createClient<any>> {
  if (_untypedSupabase) return _untypedSupabase
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _untypedSupabase = createClient<any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _untypedSupabase
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
  bloque: string,
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

// ─── 6b. retrieveExamples — preguntas oficiales como ejemplos de estilo ───────

/** Map oposición rama to tribunal label for the prompt header */
function getTribunalLabel(oposicionSlug?: string): string {
  if (!oposicionSlug) return 'TRIBUNAL'
  if (oposicionSlug.includes('correos')) return 'CORREOS'
  if (['auxilio-judicial', 'tramitacion-procesal', 'gestion-procesal'].includes(oposicionSlug))
    return 'MJU (Ministerio de Justicia)'
  if (oposicionSlug === 'hacienda-aeat') return 'AEAT (Agencia Tributaria)'
  if (oposicionSlug === 'penitenciarias') return 'SGIP (Instituciones Penitenciarias)'
  if (oposicionSlug === 'ertzaintza') return 'Dept. Seguridad Gobierno Vasco'
  if (oposicionSlug === 'guardia-civil') return 'Guardia Civil (Ministerio del Interior)'
  if (oposicionSlug === 'policia-nacional') return 'DGP (Policía Nacional)'
  return 'INAP'
}

/**
 * Recupera preguntas de exámenes oficiales para un tema dado.
 * Se usan como ejemplos de estilo en el prompt de generación — para que el
 * modelo entienda cómo pregunta realmente el tribunal (nivel, redacción, trampas).
 *
 * Filtra por oposición para no mezclar estilos entre ramas (INAP vs MJU vs Correos).
 * Si no hay preguntas por tema, intenta fallback por oposición ranked by text similarity
 * to the tema title (TF-IDF-lite scoring) — gives topic-relevant style examples without
 * needing tema_id assigned on every question.
 *
 * @param temaId       UUID del tema del temario
 * @param limit        Máximo de ejemplos (default: 3)
 * @param oposicionId  UUID de la oposición (para filtrar por rama)
 * @param oposicionSlug Slug de la oposición (para el header del prompt)
 * @returns            Texto formateado listo para insertar en el prompt, o '' si no hay datos
 */

// ─── TF-IDF-lite: rank questions by word overlap with tema title ─────────────

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'y', 'o', 'a', 'al',
  'por', 'para', 'con', 'que', 'se', 'es', 'lo', 'su', 'como', 'no', 'más', 'mas',
  'son', 'sobre', 'entre', 'este', 'esta', 'estos', 'estas', 'fue', 'ser', 'ha',
  'han', 'según', 'segun', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros',
  'cual', 'cuál', 'cuando', 'donde', 'sino', 'también', 'si', 'sin', 'cada', 'muy',
  'respuesta', 'correcta', 'incorrecta', 'señale', 'indique', 'siguiente', 'siguientes',
  'artículo', 'articulo', 'ley', 'real', 'decreto',
])

function tokenize(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for matching
    .replace(/[^a-z0-9áéíóúüñ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
}

function rankByTextSimilarity(
  pool: { numero: number; enunciado: string; opciones: string[]; correcta: number }[],
  temaTitulo: string,
  limit: number,
): { numero: number; enunciado: string; opciones: string[]; correcta: number }[] {
  const titleTokens = tokenize(temaTitulo)
  if (titleTokens.length === 0) {
    // Can't rank — shuffle instead
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, limit)
  }

  // Build IDF: words that appear in fewer questions are more discriminative
  const docFreq = new Map<string, number>()
  const questionTexts = pool.map(p => {
    const opcArr = Array.isArray(p.opciones) ? p.opciones : (p.opciones ? Object.values(p.opciones as Record<string, unknown>) : [])
    return `${p.enunciado ?? ''} ${opcArr.map(String).join(' ')}`
  })
  for (const text of questionTexts) {
    const unique = new Set(tokenize(text))
    for (const w of unique) docFreq.set(w, (docFreq.get(w) ?? 0) + 1)
  }
  const N = pool.length

  // Score each question: sum of TF-IDF for matching title tokens
  const scored = pool.map((p, idx) => {
    const qTokens = tokenize(questionTexts[idx])
    const qFreq = new Map<string, number>()
    for (const w of qTokens) qFreq.set(w, (qFreq.get(w) ?? 0) + 1)

    let score = 0
    for (const titleWord of titleTokens) {
      const tf = qFreq.get(titleWord) ?? 0
      if (tf > 0) {
        const df = docFreq.get(titleWord) ?? 1
        const idf = Math.log(N / df)
        score += tf * idf
      }
    }
    // Add small random jitter to break ties and add variety across calls
    score += Math.random() * 0.1
    return { question: p, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Take top results but add light diversity: from top 2*limit, pick limit with some shuffle
  const topCandidates = scored.slice(0, Math.min(limit * 2, scored.length))
  // Shuffle top candidates lightly then take limit
  for (let i = topCandidates.length - 1; i > 0; i--) {
    // Only swap within nearby positions (preserves rough ranking)
    const j = Math.max(0, i - Math.floor(Math.random() * 3))
    ;[topCandidates[i], topCandidates[j]] = [topCandidates[j], topCandidates[i]]
  }
  return topCandidates.slice(0, limit).map(s => s.question)
}
export async function retrieveExamples(
  temaId: string,
  limit = 3,
  oposicionId?: string,
  oposicionSlug?: string,
): Promise<string> {
  const supabase = getUntypedClient()

  // Primary: by tema_id (most relevant)
  let query = supabase
    .from('preguntas_oficiales')
    .select('numero, enunciado, opciones, correcta')
    .eq('tema_id', temaId)
    .limit(limit)

  const { data, error } = await query

  let preguntas = (!error && data && (data as unknown[]).length > 0)
    ? data as { numero: number; enunciado: string; opciones: string[]; correcta: number }[]
    : null

  // Fallback: if no tema-specific questions, try broader sample from same oposición
  // Ranked by text similarity to tema title (TF-IDF-like scoring) for topic relevance
  if (!preguntas && oposicionId) {
    try {
      // Fetch tema title for similarity ranking
      const { data: temaData } = await supabase
        .from('temas')
        .select('titulo')
        .eq('id', temaId)
        .single()
      const temaTitulo = (temaData as { titulo?: string } | null)?.titulo ?? ''

      const poolSize = Math.max(limit * 8, 60) // Fetch larger pool for better ranking
      const { data: fallbackData } = await supabase
        .from('preguntas_oficiales')
        .select('numero, enunciado, opciones, correcta, examenes_oficiales!inner(oposicion_id)')
        .eq('examenes_oficiales.oposicion_id', oposicionId)
        .limit(poolSize)

      if (fallbackData && (fallbackData as unknown[]).length > 0) {
        const pool = fallbackData as unknown as { numero: number; enunciado: string; opciones: string[]; correcta: number }[]

        if (temaTitulo) {
          // Rank by word overlap with tema title (TF-IDF-lite)
          preguntas = rankByTextSimilarity(pool, temaTitulo, limit)
        } else {
          // No title available — Fisher-Yates shuffle as before
          const shuffled = [...pool]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }
          preguntas = shuffled.slice(0, limit)
        }
      }
    } catch {
      // If ranking fails for any reason, don't break the generation — just skip examples
    }
  }

  if (!preguntas || preguntas.length === 0) return ''

  const letras = ['A', 'B', 'C', 'D']

  const formatted = preguntas
    .map((p, i) => {
      const opcArr = Array.isArray(p.opciones) ? p.opciones : Object.values(p.opciones as Record<string, unknown>)
      const opcLines = opcArr
        .map((op, idx) => `   ${letras[idx]}) ${String(op)}`)
        .join('\n')
      const respuesta = letras[p.correcta] ?? '?'
      return `${i + 1}. ${p.enunciado}\n${opcLines}\n   [Respuesta: ${respuesta}]`
    })
    .join('\n\n')

  const label = getTribunalLabel(oposicionSlug)
  return `EJEMPLOS REALES DEL ${label} (replica EXACTAMENTE este estilo — misma longitud, misma formulación, mismos tipos de pregunta):\n${formatted}`
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
 * Bloque II detection: uses the `bloque` column from `temas` table (migration 010).
 * No more hardcoded tema numbers — works for any oposición (C2: 17-28, C1: 38-45).
 */

/** Mapeo tema_numero → bloque BD para conocimiento_tecnico */
function getBloqueForTema(temaNumero: number): string {
  // Todos los JSONs de Bloque II se ingestan con bloque='ofimatica' en conocimiento_tecnico.
  // El mapeo debe coincidir con lo almacenado en BD para que el filtro eq('bloque', bloque) funcione.
  void temaNumero
  return 'ofimatica'
}

/**
 * Detects if a tema has conocimiento_tecnico content (not Bloque II).
 * Used for Correos operational temas that have content in conocimiento_tecnico
 * but don't have bloque='II' in the temas table.
 * Returns the bloque string if found, null otherwise.
 */
async function detectConocimientoBloque(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  temaId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('conocimiento_tecnico')
    .select('bloque')
    .eq('tema_id', temaId)
    .limit(1)
    .maybeSingle()
  return (data as { bloque?: string } | null)?.bloque ?? null
}

export async function buildContext(
  temaId: string,
  query?: string,
  userId?: string
): Promise<RetrievalContext> {
  const start = Date.now()
  const supabase = getSupabaseClient()

  // Detectar si el tema es Bloque II consultando la columna bloque (migration 010)
  // Cast needed: `bloque` column exists in DB (migration 010) but not yet in generated TS types
  const { data: temaData } = await (supabase as ReturnType<typeof createClient>)
    .from('temas')
    .select('numero, bloque' as 'numero')
    .eq('id', temaId)
    .maybeSingle()

  const temaRow = temaData as { numero: number; bloque: string | null } | null
  const temaNumero: number | null = temaRow?.numero ?? null
  const esBloqueII = temaRow?.bloque === 'II'

  // Check if this tema has conocimiento_tecnico content (Bloque II ofimatica OR Correos operativo)
  const conocimientoBloque = esBloqueII
    ? getBloqueForTema(temaNumero!)
    : await detectConocimientoBloque(supabase, temaId)

  let articulos: ArticuloContext[] = []
  let strategy: RetrievalContext['strategy'] = 'tema_ids'
  let weakArticulosCount = 0

  if (conocimientoBloque) {
    // ── Conocimiento técnico: buscar en conocimiento_tecnico ─────────────────
    // Aplica a Bloque II (ofimática AGE) y temas operativos (Correos, etc.)
    const secciones = await retrieveByBloque(temaId, conocimientoBloque, 15)

    if (secciones.length > 0) {
      // Adaptar SeccionContext → ArticuloContext para reutilizar el formateo
      articulos = secciones.map((s) => ({
        id: s.id,
        ley_nombre: `[${conocimientoBloque.toUpperCase()}]`,
        ley_codigo: conocimientoBloque,
        articulo_numero: '',
        apartado: null,
        titulo_capitulo: s.titulo_seccion,
        texto_integro: s.contenido,
        similarity: s.similarity,
      }))
      strategy = 'hybrid'
    }

    logger.info(
      { temaId, temaNumero, bloque: conocimientoBloque, secciones: articulos.length },
      '[retrieval] buildContext conocimiento_tecnico'
    )
  } else {
    // ── Bloque I: buscar en legislacion ──────────────────────────────────────

    // §2.11 Weakness-Weighted RAG: artículos donde el usuario ha fallado más
    let weakArticulos: ArticuloContext[] = []
    if (userId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: weakData } = await (supabase as any).rpc('get_user_weak_articles', {
          p_user_id: userId,
          p_tema_id: temaId,
          p_limit: 5,
        })

        if (weakData && Array.isArray(weakData) && weakData.length > 0) {
          // Tomar los 3 más fallados y recuperar su contenido completo
          const topWeakIds = (weakData as Array<{ legislacion_id: string; fallos: number }>)
            .slice(0, 3)
            .map((w) => w.legislacion_id)

          const { data: byId } = await supabase
            .from('legislacion')
            .select(
              'id, ley_nombre, ley_codigo, articulo_numero, apartado, titulo_capitulo, texto_integro'
            )
            .in('id', topWeakIds)
            .eq('activo', true)
            .limit(topWeakIds.length)

          if (byId && byId.length > 0) {
            weakArticulos = byId as ArticuloContext[]
            weakArticulosCount = weakArticulos.length
          }
        }
      } catch (err) {
        // Degradación elegante: si el RPC falla, seguir con retrieval normal
        logger.warn(
          { userId, temaId, err },
          '[retrieval] get_user_weak_articles falló — continuando sin weakness boost'
        )
      }
    }

    // Retrieval normal
    const [byTema, bySemantic] = await Promise.all([
      retrieveByTema(temaId, 15),
      query ? retrieveBySemantic(query, 8) : Promise.resolve([]),
    ])

    // Dedup: artículos débiles primero; luego resultados normales excluyendo duplicados
    const weakIds = new Set(weakArticulos.map((a) => a.id))
    const normalSeen = new Set<string>()
    const normalDeduped: ArticuloContext[] = []
    for (const art of [...byTema, ...bySemantic]) {
      if (!weakIds.has(art.id) && !normalSeen.has(art.id)) {
        normalSeen.add(art.id)
        normalDeduped.push(art)
      }
    }

    const hasWeak = weakArticulos.length > 0
    strategy = hasWeak
      ? 'weakness-weighted'
      : byTema.length > 0 && bySemantic.length > 0
        ? 'hybrid'
        : bySemantic.length > 0
          ? 'semantic'
          : 'tema_ids'

    articulos = [...weakArticulos, ...normalDeduped]
  }

  // Fisher-Yates shuffle de artículos para variar el contexto RAG entre llamadas.
  // Sin shuffle, mismo tema → mismo orden de artículos → mismo prompt → preguntas idénticas.
  // Weak articles (primeros weakArticulosCount) se mantienen al inicio (son prioritarios).
  const normalStart = weakArticulosCount
  for (let i = articulos.length - 1; i > normalStart; i--) {
    const j = normalStart + Math.floor(Math.random() * (i - normalStart + 1));
    [articulos[i], articulos[j]] = [articulos[j], articulos[i]]
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

  // esBloqueII is true for any tema using conocimiento_tecnico (Bloque II ofimatica, Correos operativo, etc.)
  const usesConocimientoTecnico = !!conocimientoBloque

  logger.info(
    {
      temaId,
      temaNumero,
      esBloqueII: usesConocimientoTecnico,
      userId: userId ? userId.slice(0, 8) : undefined,
      query: query?.slice(0, 50),
      articulos: articulosTruncados.length,
      weakArticulosCount,
      tokensEstimados,
      strategy,
      durationMs: Date.now() - start,
    },
    '[retrieval] buildContext completado'
  )

  return {
    articulos: articulosTruncados,
    tokensEstimados,
    strategy,
    esBloqueII: usesConocimientoTecnico,
    bloqueType: conocimientoBloque,
    temaNumero,
    weakArticulosCount,
  }
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
