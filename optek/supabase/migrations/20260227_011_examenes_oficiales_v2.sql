-- =============================================================================
-- OPTEK Migration 011: §0.5.10A — Exámenes oficiales v2
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Amplía el esquema de exámenes oficiales para soportar preguntas
-- individuales asociadas a cada examen (necesario para comparativa de
-- resultados del usuario vs. promedio histórico en simulacros).
--
-- Cambios:
--   1. ALTER examenes_oficiales — añadir columnas año, convocatoria, fuente_url
--   2. CREATE preguntas_oficiales — preguntas individuales de examen oficial
--   3. ALTER tests_generados — FK opcional a examen_oficial_id
--   4. RLS en preguntas_oficiales (lectura pública autenticada)
--
-- §0.5.10A: examenes_oficiales_v2
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ampliar examenes_oficiales (columnas opcionales para retrocompatibilidad)
-- ---------------------------------------------------------------------------
ALTER TABLE examenes_oficiales
  ADD COLUMN IF NOT EXISTS anio         int,
  ADD COLUMN IF NOT EXISTS convocatoria text,         -- 'libre', 'promocion_interna'
  ADD COLUMN IF NOT EXISTS fuente_url   text,         -- URL BOE/fuente oficial
  ADD COLUMN IF NOT EXISTS activo       bool NOT NULL DEFAULT true;

COMMENT ON COLUMN examenes_oficiales.anio IS 'Año de la convocatoria oficial';
COMMENT ON COLUMN examenes_oficiales.convocatoria IS 'Tipo: libre | promocion_interna';
COMMENT ON COLUMN examenes_oficiales.fuente_url IS 'URL al BOE u otra fuente oficial';
COMMENT ON COLUMN examenes_oficiales.activo IS 'false = examen archivado, no visible en UI';

-- ---------------------------------------------------------------------------
-- 2. Tabla preguntas_oficiales — preguntas individuales de cada examen
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_oficiales (
  id              uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  examen_id       uuid    NOT NULL REFERENCES examenes_oficiales(id) ON DELETE CASCADE,
  numero          int     NOT NULL,                     -- Número de pregunta en el examen (1-based)
  enunciado       text    NOT NULL,
  opciones        jsonb   NOT NULL DEFAULT '[]',         -- text[] serializado como JSONB
  correcta        int     NOT NULL CHECK (correcta BETWEEN 0 AND 3),
  tema_id         uuid    REFERENCES temas(id),          -- NULL si no se puede mapear
  dificultad      text    CHECK (dificultad IN ('facil', 'media', 'dificil')),
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (examen_id, numero)                             -- Unicidad por examen
);

COMMENT ON TABLE preguntas_oficiales IS
  'Preguntas individuales de exámenes oficiales. Permite análisis y comparativa con tests generados.';
COMMENT ON COLUMN preguntas_oficiales.opciones IS
  'Array de 4 strings serializado como JSONB. Índice 0-3 igual que en tests_generados.preguntas.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_preguntas_oficiales_examen
  ON preguntas_oficiales(examen_id, numero);

CREATE INDEX IF NOT EXISTS idx_preguntas_oficiales_tema
  ON preguntas_oficiales(tema_id)
  WHERE tema_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. FK opcional en tests_generados (simulacros basados en examen oficial)
-- ---------------------------------------------------------------------------
ALTER TABLE tests_generados
  ADD COLUMN IF NOT EXISTS examen_oficial_id uuid
    REFERENCES examenes_oficiales(id) ON DELETE SET NULL;

COMMENT ON COLUMN tests_generados.examen_oficial_id IS
  'Si el test es un simulacro de examen oficial, referencia al examen. NULL para tests libres.';

CREATE INDEX IF NOT EXISTS idx_tests_examen_oficial
  ON tests_generados(examen_oficial_id)
  WHERE examen_oficial_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. RLS en preguntas_oficiales
-- ---------------------------------------------------------------------------
ALTER TABLE preguntas_oficiales ENABLE ROW LEVEL SECURITY;

-- Lectura pública para usuarios autenticados (contenido educativo)
CREATE POLICY "preguntas_oficiales_select" ON preguntas_oficiales
  FOR SELECT TO authenticated
  USING (true);

-- Solo service_role puede insertar/modificar (carga de datos vía scripts)
CREATE POLICY "preguntas_oficiales_service_write" ON preguntas_oficiales
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
