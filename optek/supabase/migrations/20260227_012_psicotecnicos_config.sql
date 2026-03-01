-- =============================================================================
-- OPTEK Migration 012: §1.3B.1 — Tabla psicotecnicos_config
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Configuración de plantillas para el motor de psicotécnicos.
-- Permite personalizar rangos de variables, patrones y dificultad
-- por categoría sin necesidad de cambiar código.
--
-- §1.3B.1: psicotecnicos_config
-- =============================================================================

CREATE TABLE IF NOT EXISTS psicotecnicos_config (
  id              uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria       text    NOT NULL CHECK (categoria IN ('numerico','series','verbal','organizacion')),
  subtipo         text    NOT NULL,                -- e.g. 'regla_tres', 'porcentaje', 'fibonacci'
  dificultad      int     NOT NULL CHECK (dificultad BETWEEN 1 AND 3),
  template_config jsonb   NOT NULL DEFAULT '{}',  -- rangos de variables, patrones, pesos
  activo          bool    NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (categoria, subtipo, dificultad)          -- Una config por (categoría, subtipo, nivel)
);

COMMENT ON TABLE psicotecnicos_config IS
  'Plantillas de configuración para el motor determinista de psicotécnicos. template_config define rangos y patrones por subtipo y dificultad.';
COMMENT ON COLUMN psicotecnicos_config.template_config IS
  'JSON libre con parámetros del generador. Ej: {"rango_min":1,"rango_max":100,"num_pasos":2}';

-- Índice para lookup por categoría + dificultad (query del generador)
CREATE INDEX IF NOT EXISTS idx_psicotecnicos_config_active
  ON psicotecnicos_config(categoria, dificultad)
  WHERE activo = true;

-- RLS
ALTER TABLE psicotecnicos_config ENABLE ROW LEVEL SECURITY;

-- Lectura pública para usuarios autenticados (el motor la lee en runtime)
CREATE POLICY "psicotecnicos_config_select" ON psicotecnicos_config
  FOR SELECT TO authenticated
  USING (activo = true);

-- Solo service_role puede gestionar configs
CREATE POLICY "psicotecnicos_config_service" ON psicotecnicos_config
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Seed: configuraciones base para cada subtipo
-- =============================================================================

INSERT INTO psicotecnicos_config (categoria, subtipo, dificultad, template_config) VALUES
  -- Numérico: regla de tres
  ('numerico', 'regla_tres', 1, '{"rango_min":1,"rango_max":50,"num_pasos":1}'),
  ('numerico', 'regla_tres', 2, '{"rango_min":5,"rango_max":200,"num_pasos":2}'),
  ('numerico', 'regla_tres', 3, '{"rango_min":10,"rango_max":999,"num_pasos":2}'),
  -- Numérico: porcentajes
  ('numerico', 'porcentaje', 1, '{"pct_max":50,"base_max":200}'),
  ('numerico', 'porcentaje', 2, '{"pct_max":99,"base_max":1000}'),
  ('numerico', 'porcentaje', 3, '{"pct_max":99,"base_max":9999,"doble_paso":true}'),
  -- Numérico: fracciones
  ('numerico', 'fraccion', 1, '{"denom_max":10,"mixto":false}'),
  ('numerico', 'fraccion', 2, '{"denom_max":20,"mixto":true}'),
  ('numerico', 'fraccion', 3, '{"denom_max":50,"mixto":true}'),
  -- Series: aritméticas
  ('series', 'aritmetica', 1, '{"longitud":5,"paso_max":10}'),
  ('series', 'aritmetica', 2, '{"longitud":6,"paso_max":25}'),
  ('series', 'aritmetica', 3, '{"longitud":7,"paso_max":50}'),
  -- Series: geométricas
  ('series', 'geometrica', 1, '{"longitud":5,"ratio_max":3}'),
  ('series', 'geometrica', 2, '{"longitud":5,"ratio_max":5}'),
  ('series', 'geometrica', 3, '{"longitud":6,"ratio_max":7}'),
  -- Series: fibonacci-like
  ('series', 'fibonacci', 1, '{"longitud":6,"semilla_max":5}'),
  ('series', 'fibonacci', 2, '{"longitud":7,"semilla_max":10}'),
  ('series', 'fibonacci', 3, '{"longitud":8,"semilla_max":20}'),
  -- Series: alternancia
  ('series', 'alternancia', 1, '{"longitud":6,"paso_a_max":5,"paso_b_max":3}'),
  ('series', 'alternancia', 2, '{"longitud":7,"paso_a_max":10,"paso_b_max":7}'),
  ('series', 'alternancia', 3, '{"longitud":8,"paso_a_max":20,"paso_b_max":15}'),
  -- Verbal: sinonimos
  ('verbal', 'sinonimo', 1, '{"min_opciones":4}'),
  ('verbal', 'sinonimo', 2, '{"min_opciones":4}'),
  ('verbal', 'sinonimo', 3, '{"min_opciones":4}'),
  -- Verbal: antonimos
  ('verbal', 'antonimo', 1, '{"min_opciones":4}'),
  ('verbal', 'antonimo', 2, '{"min_opciones":4}'),
  ('verbal', 'antonimo', 3, '{"min_opciones":4}'),
  -- Organización: ordenar datos
  ('organizacion', 'ordenar_datos', 1, '{"num_elementos":4}'),
  ('organizacion', 'ordenar_datos', 2, '{"num_elementos":5}'),
  ('organizacion', 'ordenar_datos', 3, '{"num_elementos":6}'),
  -- Organización: detectar errores
  ('organizacion', 'detectar_error', 1, '{"filas":3,"columnas":3}'),
  ('organizacion', 'detectar_error', 2, '{"filas":4,"columnas":4}'),
  ('organizacion', 'detectar_error', 3, '{"filas":5,"columnas":5}')
ON CONFLICT (categoria, subtipo, dificultad) DO NOTHING;
