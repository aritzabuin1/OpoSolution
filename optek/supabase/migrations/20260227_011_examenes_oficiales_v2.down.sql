-- Rollback: Migration 011 — revertir examenes_oficiales_v2

-- 4. RLS
DROP POLICY IF EXISTS "preguntas_oficiales_service_write" ON preguntas_oficiales;
DROP POLICY IF EXISTS "preguntas_oficiales_select" ON preguntas_oficiales;

-- 3. FK en tests_generados
DROP INDEX IF EXISTS idx_tests_examen_oficial;
ALTER TABLE tests_generados DROP COLUMN IF EXISTS examen_oficial_id;

-- 2. Tabla preguntas_oficiales
DROP INDEX IF EXISTS idx_preguntas_oficiales_tema;
DROP INDEX IF EXISTS idx_preguntas_oficiales_examen;
DROP TABLE IF EXISTS preguntas_oficiales;

-- 1. Columnas en examenes_oficiales
ALTER TABLE examenes_oficiales
  DROP COLUMN IF EXISTS activo,
  DROP COLUMN IF EXISTS fuente_url,
  DROP COLUMN IF EXISTS convocatoria,
  DROP COLUMN IF EXISTS anio;
