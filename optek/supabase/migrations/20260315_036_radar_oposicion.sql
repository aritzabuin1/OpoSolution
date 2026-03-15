-- =============================================================================
-- Migration 036: Radar filtrado por oposición (C1 vs C2)
-- Autor: Claude / Aritz | Fecha: 2026-03-15
--
-- Problema: frecuencias_articulos y frecuencias_temas eran globales (C1+C2
-- mezclados). Un usuario C2 veía artículos frecuentes de exámenes C1 y viceversa.
--
-- Solución: añadir oposicion_id a ambas tablas. PK compuesta para tener
-- un índice por oposición. Views filtran por oposicion_id.
-- El builder genera índices separados por oposición.
-- =============================================================================

-- ─── 1. frecuencias_articulos ─────────────────────────────────────────────────

-- Drop old primary key (legislacion_id only)
ALTER TABLE frecuencias_articulos DROP CONSTRAINT IF EXISTS frecuencias_articulos_pkey;

-- Add oposicion_id column (nullable temporarily for migration)
ALTER TABLE frecuencias_articulos
  ADD COLUMN IF NOT EXISTS oposicion_id uuid REFERENCES oposiciones(id) ON DELETE CASCADE;

-- Backfill: assign existing rows to C2 (all current data is from C2 exams)
UPDATE frecuencias_articulos
  SET oposicion_id = (SELECT id FROM oposiciones WHERE codigo = 'C2_AUX' LIMIT 1)
  WHERE oposicion_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE frecuencias_articulos
  ALTER COLUMN oposicion_id SET NOT NULL;

-- New composite primary key
ALTER TABLE frecuencias_articulos
  ADD PRIMARY KEY (oposicion_id, legislacion_id);

-- Index for filtering by oposicion + ordering by frequency
DROP INDEX IF EXISTS idx_frecuencias_num_apariciones;
CREATE INDEX idx_frecuencias_oposicion_apariciones
  ON frecuencias_articulos (oposicion_id, num_apariciones DESC);

-- Update view to include oposicion_id
CREATE OR REPLACE VIEW radar_tribunal_view AS
  SELECT
    f.oposicion_id,
    f.legislacion_id,
    f.num_apariciones,
    f.pct_total,
    f.anios,
    f.ultima_aparicion,
    f.updated_at,
    l.articulo_numero,
    l.ley_nombre,
    l.ley_codigo,
    l.titulo_capitulo,
    LEFT(l.texto_integro, 200) AS resumen
  FROM frecuencias_articulos f
  JOIN legislacion l ON l.id = f.legislacion_id
  WHERE l.activo = true
  ORDER BY f.num_apariciones DESC, l.ley_codigo, l.articulo_numero;

-- ─── 2. frecuencias_temas ────────────────────────────────────────────────────

-- Drop old primary key (tema_id only)
ALTER TABLE frecuencias_temas DROP CONSTRAINT IF EXISTS frecuencias_temas_pkey;

-- Add oposicion_id column
ALTER TABLE frecuencias_temas
  ADD COLUMN IF NOT EXISTS oposicion_id uuid REFERENCES oposiciones(id) ON DELETE CASCADE;

-- Backfill: assign existing rows to C2
UPDATE frecuencias_temas
  SET oposicion_id = (SELECT id FROM oposiciones WHERE codigo = 'C2_AUX' LIMIT 1)
  WHERE oposicion_id IS NULL;

-- Make NOT NULL
ALTER TABLE frecuencias_temas
  ALTER COLUMN oposicion_id SET NOT NULL;

-- New composite primary key
ALTER TABLE frecuencias_temas
  ADD PRIMARY KEY (oposicion_id, tema_id);

-- Index
DROP INDEX IF EXISTS idx_frecuencias_temas_apariciones;
CREATE INDEX idx_frecuencias_temas_oposicion_apariciones
  ON frecuencias_temas (oposicion_id, num_apariciones DESC);

-- Update view to include oposicion_id
CREATE OR REPLACE VIEW radar_temas_view AS
  SELECT
    f.oposicion_id,
    f.tema_id,
    f.num_apariciones,
    f.pct_total,
    f.anios,
    f.ultima_aparicion,
    f.updated_at,
    t.numero AS tema_numero,
    t.titulo AS tema_titulo
  FROM frecuencias_temas f
  JOIN temas t ON t.id = f.tema_id
  ORDER BY f.num_apariciones DESC, t.numero;
