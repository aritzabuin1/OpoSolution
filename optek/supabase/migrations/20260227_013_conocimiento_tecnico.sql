-- =============================================================================
-- OPTEK Migration 013: §1.3A.1-3 — Tabla conocimiento_tecnico (Bloque II)
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Almacena el conocimiento técnico de ofimática e informática (Bloque II del
-- temario: temas 17-28) para ser usado en RAG de generación de tests.
--
-- Diferencia con `legislacion`:
--   - No hay artículos numerados, sino secciones/procedimientos
--   - Las fuentes son Microsoft Learn/Support y normativa de administración electrónica
--   - El chunking es por objeto funcional (ej: "Cómo insertar tabla en Word") no por párrafo
--
-- §1.3A.1: CREATE TABLE conocimiento_tecnico
-- §1.3A.2: RLS
-- §1.3A.3: RPC match_conocimiento
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla conocimiento_tecnico
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conocimiento_tecnico (
  id              uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloque          text    NOT NULL CHECK (bloque IN ('ofimatica','informatica','admin_electronica')),
  tema_id         uuid    REFERENCES temas(id),              -- FK al tema oficial (nullable si no mapea)
  titulo_seccion  text    NOT NULL,                           -- Ej: "Insertar tabla en Word"
  contenido       text    NOT NULL,                           -- Texto íntegro de la sección (chunk)
  fuente_url      text,                                       -- URL de origen (Microsoft Support, etc.)
  hash_sha256     text    NOT NULL,                           -- Para deduplicación en re-ingesta
  embedding       vector(1536),                               -- text-embedding-3-small
  activo          bool    NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (bloque, tema_id, titulo_seccion)                    -- Unicidad por contexto funcional
);

COMMENT ON TABLE conocimiento_tecnico IS
  'Conocimiento técnico de Bloque II (ofimática, informática, administración electrónica) para RAG. Chunking por objeto funcional, no por párrafo.';
COMMENT ON COLUMN conocimiento_tecnico.titulo_seccion IS
  'Título del chunk funcional. Ej: "Atajos de teclado de Word 365", "Cómo crear tabla dinámica en Excel". Debe ser autosuficiente como query de búsqueda.';
COMMENT ON COLUMN conocimiento_tecnico.contenido IS
  'Texto íntegro del chunk. Máx ~2000 tokens. Preserva jerarquías de menú completas (Pestaña > Grupo > Comando).';

-- Índices
CREATE INDEX IF NOT EXISTS idx_conocimiento_bloque_tema
  ON conocimiento_tecnico(bloque, tema_id)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_conocimiento_hash
  ON conocimiento_tecnico(hash_sha256);

-- Índice HNSW para búsqueda semántica (igual que legislacion)
CREATE INDEX IF NOT EXISTS idx_conocimiento_embedding
  ON conocimiento_tecnico
  USING hnsw (embedding vector_cosine_ops);

-- Índice full-text en contenido
CREATE INDEX IF NOT EXISTS idx_conocimiento_fts
  ON conocimiento_tecnico
  USING gin(to_tsvector('spanish', contenido));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_conocimiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conocimiento_updated_at
  BEFORE UPDATE ON conocimiento_tecnico
  FOR EACH ROW EXECUTE FUNCTION update_conocimiento_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RLS en conocimiento_tecnico
-- ---------------------------------------------------------------------------
ALTER TABLE conocimiento_tecnico ENABLE ROW LEVEL SECURITY;

-- Lectura pública para usuarios autenticados (contenido educativo como legislacion)
CREATE POLICY "conocimiento_tecnico_select" ON conocimiento_tecnico
  FOR SELECT TO authenticated
  USING (activo = true);

-- Solo service_role puede insertar/modificar (scripts de ingesta)
CREATE POLICY "conocimiento_tecnico_service_write" ON conocimiento_tecnico
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. RPC match_conocimiento — búsqueda semántica filtrada por bloque
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_conocimiento(
  query_embedding  vector(1536),
  match_count      int     DEFAULT 10,
  filter_bloque    text    DEFAULT NULL
)
RETURNS TABLE (
  id              uuid,
  bloque          text,
  tema_id         uuid,
  titulo_seccion  text,
  contenido       text,
  fuente_url      text,
  similarity      float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kt.id,
    kt.bloque,
    kt.tema_id,
    kt.titulo_seccion,
    kt.contenido,
    kt.fuente_url,
    1 - (kt.embedding <=> query_embedding) AS similarity
  FROM conocimiento_tecnico kt
  WHERE
    kt.activo = true
    AND kt.embedding IS NOT NULL
    AND (filter_bloque IS NULL OR kt.bloque = filter_bloque)
  ORDER BY kt.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_conocimiento IS
  'Búsqueda semántica en conocimiento_tecnico usando HNSW cosine similarity. filter_bloque NULL = busca en todos.';

-- RPC de búsqueda full-text (fallback sin embeddings)
CREATE OR REPLACE FUNCTION search_conocimiento(
  query_text   text,
  match_count  int  DEFAULT 10,
  filter_bloque text DEFAULT NULL
)
RETURNS TABLE (
  id             uuid,
  bloque         text,
  tema_id        uuid,
  titulo_seccion text,
  contenido      text,
  fuente_url     text,
  rank           float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kt.id,
    kt.bloque,
    kt.tema_id,
    kt.titulo_seccion,
    kt.contenido,
    kt.fuente_url,
    ts_rank(to_tsvector('spanish', kt.contenido), plainto_tsquery('spanish', query_text)) AS rank
  FROM conocimiento_tecnico kt
  WHERE
    kt.activo = true
    AND (filter_bloque IS NULL OR kt.bloque = filter_bloque)
    AND to_tsvector('spanish', kt.contenido) @@ plainto_tsquery('spanish', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
$$;
