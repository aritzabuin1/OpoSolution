-- §1.3.2A: Añadir columna `modelo` a examenes_oficiales
-- Necesario para exámenes con modelo A y B (e.g., TAC 2024 convocatoria PI).
-- NULL = examen sin modelo (2019, 2022). 'A'/'B' = modelo específico (2024).
--
-- Se actualiza el UNIQUE constraint para incluir modelo (NULL-safe con COALESCE).

-- 1. Añadir columna (opcional, nullable)
ALTER TABLE examenes_oficiales
  ADD COLUMN IF NOT EXISTS modelo text;

COMMENT ON COLUMN examenes_oficiales.modelo IS
  'Modelo del examen si la convocatoria tiene varios (A, B...). NULL si no aplica.';

-- 2. Eliminar constraint antigua (sin modelo)
ALTER TABLE examenes_oficiales
  DROP CONSTRAINT IF EXISTS examenes_oficiales_oposicion_id_anio_convocatoria_key;

-- 3. Crear nuevo constraint que incluye modelo.
--    COALESCE(..., '') para que NULL == NULL en el check de unicidad (los NULL
--    normales no son iguales entre sí en PostgreSQL, lo que permitiría duplicados).
CREATE UNIQUE INDEX IF NOT EXISTS examenes_oficiales_unique_idx
  ON examenes_oficiales (oposicion_id, anio, convocatoria, COALESCE(modelo, ''));
