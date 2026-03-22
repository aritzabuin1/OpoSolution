-- =============================================================================
-- OPTEK Migration 039: Multi-oposición data isolation
-- Autor: Claude / Aritz | Fecha: 2026-03-22
--
-- Fixes critical data isolation bugs for multi-oposición support:
-- 1. Adds oposicion_id to tests_generados + backfill from tema_id or profiles
-- 2. Adds oposicion_id to flashcards + backfill
-- 3. Adds features JSONB to oposiciones (dynamic sidebar per oposición)
--
-- DDIA Reliability: all operations are idempotent (IF NOT EXISTS, ON CONFLICT).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. tests_generados: add oposicion_id + backfill + index
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tests_generados' AND column_name = 'oposicion_id'
  ) THEN
    ALTER TABLE tests_generados
      ADD COLUMN oposicion_id UUID REFERENCES oposiciones(id);
  END IF;
END $$;

-- Backfill from tema_id → temas.oposicion_id (for tests with tema)
UPDATE tests_generados t
SET oposicion_id = tm.oposicion_id
FROM temas tm
WHERE t.tema_id = tm.id
  AND t.oposicion_id IS NULL;

-- Backfill from examen_oficial_id → examenes_oficiales.oposicion_id (for simulacros)
UPDATE tests_generados t
SET oposicion_id = eo.oposicion_id
FROM examenes_oficiales eo
WHERE t.examen_oficial_id = eo.id
  AND t.oposicion_id IS NULL;

-- Fallback: backfill from user's profile (for psicotécnicos and tests without tema)
UPDATE tests_generados t
SET oposicion_id = p.oposicion_id
FROM profiles p
WHERE t.user_id = p.id
  AND t.oposicion_id IS NULL;

-- Index for filtered queries (user_id + oposicion_id)
CREATE INDEX IF NOT EXISTS idx_tests_generados_user_oposicion
  ON tests_generados(user_id, oposicion_id);

-- ---------------------------------------------------------------------------
-- 2. flashcards: add oposicion_id + backfill + index
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flashcards' AND column_name = 'oposicion_id'
  ) THEN
    ALTER TABLE flashcards
      ADD COLUMN oposicion_id UUID REFERENCES oposiciones(id);
  END IF;
END $$;

-- Backfill from tema_id → temas.oposicion_id
UPDATE flashcards f
SET oposicion_id = tm.oposicion_id
FROM temas tm
WHERE f.tema_id = tm.id
  AND f.oposicion_id IS NULL;

-- Fallback from profile
UPDATE flashcards f
SET oposicion_id = p.oposicion_id
FROM profiles p
WHERE f.user_id = p.id
  AND f.oposicion_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_flashcards_user_oposicion
  ON flashcards(user_id, oposicion_id);

-- ---------------------------------------------------------------------------
-- 3. oposiciones.features: dynamic sidebar configuration
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oposiciones' AND column_name = 'features'
  ) THEN
    ALTER TABLE oposiciones
      ADD COLUMN features JSONB DEFAULT '{
        "psicotecnicos": true,
        "cazatrampas": true,
        "supuesto_practico": false,
        "ofimatica": true
      }'::jsonb;
  END IF;
END $$;

-- C2 Auxiliar: psicotécnicos + ofimática, sin supuesto práctico
UPDATE oposiciones
SET features = '{
  "psicotecnicos": true,
  "cazatrampas": true,
  "supuesto_practico": false,
  "ofimatica": true
}'::jsonb
WHERE slug = 'aux-admin-estado';

-- C1 Administrativo: sin psicotécnicos, sin ofimática específica, sin supuesto práctico escrito
UPDATE oposiciones
SET features = '{
  "psicotecnicos": false,
  "cazatrampas": true,
  "supuesto_practico": false,
  "ofimatica": false
}'::jsonb
WHERE slug = 'administrativo-estado';
