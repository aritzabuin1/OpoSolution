-- =============================================================================
-- OPTEK Migration 004: Funciones SQL y RPCs
-- Autor: Claude / Aritz | Fecha: 2026-02-20
--
-- DDIA Principles:
--   Reliability    → SECURITY DEFINER + search_path fijo (previene privilege escalation)
--   Consistency    → Advisory lock documentado para generación concurrente de tests
--   Scalability    → match_legislacion usa HNSW (sin locks durante búsqueda vectorial)
--   Observability  → get_user_stats agrega directamente en BD (evita N+1 queries)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. match_legislacion — búsqueda vectorial semántica (RAG pipeline)
--
-- Uso: SELECT * FROM match_legislacion(embedding, 5, oposicion_uuid);
-- Retorna artículos más similares al query del usuario, filtrados por oposición.
--
-- DDIA Scalability: HNSW permite búsquedas paralelas sin lock exclusivo.
-- ef_search=80 es el trade-off calidad/velocidad para producción (default=40).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_legislacion(
  query_embedding    vector(1536),
  match_count        int     DEFAULT 5,
  filter_oposicion   uuid    DEFAULT NULL
)
RETURNS TABLE (
  id                  uuid,
  ley_nombre          text,
  ley_codigo          text,
  articulo_numero     text,
  apartado            text,
  titulo_capitulo     text,
  texto_integro       text,
  similarity          float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Configurar ef_search para balance calidad/latencia en producción
  -- ef_search=80 → mayor calidad que default (40), latencia ~2x pero aún <50ms
  SET LOCAL hnsw.ef_search = 80;

  RETURN QUERY
  SELECT
    l.id,
    l.ley_nombre,
    l.ley_codigo,
    l.articulo_numero,
    l.apartado,
    l.titulo_capitulo,
    l.texto_integro,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM legislacion l
  WHERE
    l.activo = true
    AND l.embedding IS NOT NULL
    -- Filtro por oposición: si se proporciona, buscar artículos con ese tema_ids
    AND (
      filter_oposicion IS NULL
      OR EXISTS (
        SELECT 1 FROM temas t
        WHERE t.oposicion_id = filter_oposicion
          AND t.id = ANY(l.tema_ids)
      )
    )
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_legislacion IS
  'Búsqueda vectorial RAG. ef_search=80 para balance calidad/latencia. Usa índice HNSW (sin lock).';

-- ---------------------------------------------------------------------------
-- 2. search_legislacion — búsqueda full-text (fallback cuando no hay embedding)
--
-- Retorna artículos ordenados por relevancia textual en español.
-- Combinar con match_legislacion para búsqueda híbrida (lexical + semántica).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_legislacion(
  query_text    text,
  match_count   int DEFAULT 10
)
RETURNS TABLE (
  id              uuid,
  ley_nombre      text,
  ley_codigo      text,
  articulo_numero text,
  apartado        text,
  titulo_capitulo text,
  texto_integro   text,
  rank            float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.ley_nombre,
    l.ley_codigo,
    l.articulo_numero,
    l.apartado,
    l.titulo_capitulo,
    l.texto_integro,
    ts_rank(
      to_tsvector('spanish', l.texto_integro),
      plainto_tsquery('spanish', query_text)
    )::float AS rank
  FROM legislacion l
  WHERE
    l.activo = true
    AND to_tsvector('spanish', l.texto_integro) @@ plainto_tsquery('spanish', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_legislacion IS
  'Búsqueda full-text en español con ts_rank. Fallback cuando embedding no está disponible.';

-- ---------------------------------------------------------------------------
-- 3. get_user_stats — estadísticas del usuario para el dashboard
--
-- DDIA Scalability: una sola query agrega todo en BD → evita N+1 desde la app.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE (
  tests_completados     bigint,
  media_puntuacion      float,
  temas_cubiertos       bigint,
  desarrollos_enviados  bigint,
  racha_dias            int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(t.id) FILTER (WHERE t.completado = true)         AS tests_completados,
    AVG(t.puntuacion) FILTER (WHERE t.completado = true)   AS media_puntuacion,
    COUNT(DISTINCT t.tema_id) FILTER (WHERE t.completado = true) AS temas_cubiertos,
    (SELECT COUNT(*) FROM desarrollos d WHERE d.user_id = p_user_id) AS desarrollos_enviados,
    -- Racha: días consecutivos con al menos un test completado hasta hoy
    (
      WITH daily_activity AS (
        SELECT DISTINCT date_trunc('day', created_at AT TIME ZONE 'UTC') AS day
        FROM tests_generados
        WHERE user_id = p_user_id AND completado = true
      ),
      consecutive AS (
        SELECT day,
               day - (ROW_NUMBER() OVER (ORDER BY day) * INTERVAL '1 day') AS grp
        FROM daily_activity
      )
      SELECT COALESCE(MAX(cnt), 0)::int FROM (
        SELECT COUNT(*) AS cnt
        FROM consecutive
        GROUP BY grp
        HAVING MAX(day) >= CURRENT_DATE - INTERVAL '1 day'
      ) racha
    ) AS racha_dias
  FROM tests_generados t
  WHERE t.user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION get_user_stats IS
  'Estadísticas del dashboard agregadas en BD. Evita N+1 queries desde la app.';

-- ---------------------------------------------------------------------------
-- 4. increment_free_usage — incremento atómico con lock de advisory
--
-- DDIA Consistency: previene race condition en límites de free tier.
-- Llamar DENTRO de una transacción con pg_advisory_xact_lock activo.
--
-- Returns: TRUE si se incrementó, FALSE si ya llegó al límite.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_free_tests(p_user_id uuid, p_max int DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  -- Advisory lock por user_id — garantiza atomicidad sin lock de tabla
  PERFORM pg_advisory_xact_lock(('x' || md5(p_user_id::text))::bit(64)::bigint);

  SELECT free_tests_used INTO current_count
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;  -- Lock de fila adicional por seguridad

  IF current_count IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  IF current_count >= p_max THEN
    RETURN false;  -- Límite alcanzado
  END IF;

  UPDATE profiles
  SET free_tests_used = free_tests_used + 1
  WHERE id = p_user_id;

  RETURN true;  -- Éxito
END;
$$;

COMMENT ON FUNCTION increment_free_tests IS
  'Incremento atómico con advisory lock. Previene race condition en límite free tier. Ver DDIA §2.';

-- Función equivalente para corrector
CREATE OR REPLACE FUNCTION increment_free_corrector(p_user_id uuid, p_max int DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  PERFORM pg_advisory_xact_lock(('x' || md5(p_user_id::text || '_corrector'))::bit(64)::bigint);

  SELECT free_corrector_used INTO current_count
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_count IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  IF current_count >= p_max THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET free_corrector_used = free_corrector_used + 1
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION increment_free_corrector IS
  'Incremento atómico del contador de correcciones gratuitas con advisory lock.';
