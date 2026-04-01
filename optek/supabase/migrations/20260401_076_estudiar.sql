-- Migration 076: Feature "Estudiar" — resúmenes de legislación cacheados
-- Tabla para almacenar resúmenes generados por IA, compartidos entre oposiciones.

CREATE TABLE IF NOT EXISTS resumen_legislacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ley_codigo TEXT NOT NULL,            -- e.g. 'CE', 'BOE-A-2015-10565' (matches legislacion.ley_codigo)
  rango TEXT NOT NULL,                -- e.g. '14-29'
  titulo TEXT NOT NULL,               -- e.g. 'Derechos Fundamentales (CE arts. 14-29)'
  contenido TEXT NOT NULL,            -- ~2000 palabras, markdown
  generated_by UUID REFERENCES auth.users(id),
  prompt_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ley_codigo, rango)
);

CREATE INDEX IF NOT EXISTS idx_resumen_ley ON resumen_legislacion(ley_codigo);

-- RLS: cualquier autenticado puede leer. INSERT/UPDATE solo service role.
ALTER TABLE resumen_legislacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_authenticated"
  ON resumen_legislacion FOR SELECT
  TO authenticated
  USING (true);
