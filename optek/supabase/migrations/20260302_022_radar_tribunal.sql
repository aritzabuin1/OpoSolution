-- §2.14: Radar del Tribunal — frecuencias de artículos en exámenes INAP
-- Tabla que almacena cuántas veces aparece cada artículo de legislación
-- en los exámenes oficiales históricos. Fuente de la verdad para el ranking.

-- 1. Tabla principal
CREATE TABLE IF NOT EXISTS frecuencias_articulos (
  legislacion_id    uuid          NOT NULL PRIMARY KEY REFERENCES legislacion(id) ON DELETE CASCADE,
  num_apariciones   integer       NOT NULL DEFAULT 0,
  pct_total         numeric(5, 2) NOT NULL DEFAULT 0.00,  -- % sobre total preguntas analizadas
  anios             integer[]     NOT NULL DEFAULT '{}',  -- años en que apareció
  ultima_aparicion  integer,                              -- año más reciente
  updated_at        timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE frecuencias_articulos IS
  'Frecuencia de cada artículo de legislación en exámenes INAP históricos. '
  'Populada por execution/build-radar-tribunal.ts. Fuente del Radar del Tribunal.';

-- 2. Índice para ordenar rápido por frecuencia descendente
CREATE INDEX IF NOT EXISTS idx_frecuencias_num_apariciones
  ON frecuencias_articulos (num_apariciones DESC);

-- 3. Vista desnormalizada que une con `legislacion` para mostrar en UI
CREATE OR REPLACE VIEW radar_tribunal_view AS
  SELECT
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

-- 4. RLS: lectura pública (el radar es visible con restricción en UI, no en BD)
ALTER TABLE frecuencias_articulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frecuencias_articulos_read_all"
  ON frecuencias_articulos FOR SELECT
  USING (true);

-- 5. Solo service role puede escribir (el script usa service key)
CREATE POLICY "frecuencias_articulos_service_write"
  ON frecuencias_articulos FOR ALL
  USING (auth.role() = 'service_role');
