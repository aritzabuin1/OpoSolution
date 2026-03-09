-- §2.14 extension: Radar por Temas — frecuencias de cada tema en exámenes INAP
-- Complementa frecuencias_articulos con una vista de nivel superior (28 temas).
-- Populada por execution/build-radar-tribunal.ts via keyword classification.

-- 1. Tabla principal
CREATE TABLE IF NOT EXISTS frecuencias_temas (
  tema_id           uuid          NOT NULL PRIMARY KEY REFERENCES temas(id) ON DELETE CASCADE,
  num_apariciones   integer       NOT NULL DEFAULT 0,
  pct_total         numeric(5, 2) NOT NULL DEFAULT 0.00,
  anios             integer[]     NOT NULL DEFAULT '{}',
  ultima_aparicion  integer,
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE frecuencias_temas IS
  'Frecuencia de cada tema (1-28) en exámenes INAP históricos. '
  'Populada por execution/build-radar-tribunal.ts con clasificación por keywords.';

-- 2. Índice para ordenar rápido por frecuencia descendente
CREATE INDEX idx_frecuencias_temas_apariciones
  ON frecuencias_temas (num_apariciones DESC);

-- 3. Vista desnormalizada que une con temas para UI
CREATE OR REPLACE VIEW radar_temas_view AS
  SELECT
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

-- 4. RLS: lectura pública (gating en UI, no en BD)
ALTER TABLE frecuencias_temas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frecuencias_temas_read_all"
  ON frecuencias_temas FOR SELECT
  USING (true);

-- 5. Solo service role puede escribir
CREATE POLICY "frecuencias_temas_service_write"
  ON frecuencias_temas FOR ALL
  USING (auth.role() = 'service_role');
