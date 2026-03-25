-- =============================================================================
-- Migration 047: rama + scoring_config + metadata para expansión multi-oposición
-- Autor: Claude / Aritz | Fecha: 2026-03-26
--
-- Prepara la tabla oposiciones para soportar múltiples ramas (AGE, Justicia,
-- Correos) con scoring configurable por ejercicio.
-- =============================================================================

-- ─── Nuevas columnas ─────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'rama') THEN
    ALTER TABLE oposiciones ADD COLUMN rama TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'scoring_config') THEN
    ALTER TABLE oposiciones ADD COLUMN scoring_config JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'nivel') THEN
    ALTER TABLE oposiciones ADD COLUMN nivel TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'orden') THEN
    ALTER TABLE oposiciones ADD COLUMN orden INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'plazas') THEN
    ALTER TABLE oposiciones ADD COLUMN plazas INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oposiciones' AND column_name = 'fecha_examen_aprox') THEN
    ALTER TABLE oposiciones ADD COLUMN fecha_examen_aprox DATE;
  END IF;
END $$;

-- ─── Backfill AGE existentes ─────────────────────────────────────────────────

-- C2 Auxiliar Administrativo del Estado
UPDATE oposiciones SET
  rama = 'age',
  nivel = 'C2',
  orden = 1,
  plazas = 1700,
  fecha_examen_aprox = '2026-05-23',
  scoring_config = '{
    "ejercicios": [{
      "nombre": "Test teórico",
      "preguntas": 100,
      "minutos": 70,
      "acierto": 1.0,
      "error": 0.333,
      "max": 100,
      "min_aprobado": null,
      "penaliza": true
    }]
  }'::jsonb
WHERE slug = 'aux-admin-estado';

-- C1 Administrativo del Estado
UPDATE oposiciones SET
  rama = 'age',
  nivel = 'C1',
  orden = 2,
  plazas = 2512,
  fecha_examen_aprox = '2026-06-20',
  scoring_config = '{
    "ejercicios": [{
      "nombre": "Test teórico",
      "preguntas": 100,
      "minutos": 90,
      "acierto": 1.0,
      "error": 0.333,
      "max": 100,
      "min_aprobado": null,
      "penaliza": true
    }]
  }'::jsonb
WHERE slug = 'administrativo-estado';

-- A2 Gestión de la Administración Civil del Estado (GACE)
UPDATE oposiciones SET
  rama = 'age',
  nivel = 'A2',
  orden = 3,
  plazas = 1356,
  fecha_examen_aprox = '2026-07-11',
  scoring_config = '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 100, "minutos": 90, "acierto": 1.0, "error": 0.333, "max": 100, "min_aprobado": null, "penaliza": true},
      {"nombre": "Supuesto práctico", "preguntas": 5, "minutos": 150, "acierto": null, "error": null, "max": 50, "min_aprobado": 25, "penaliza": false}
    ]
  }'::jsonb
WHERE slug = 'gestion-estado';

-- ─── Index para queries por rama ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_oposiciones_rama ON oposiciones (rama);
