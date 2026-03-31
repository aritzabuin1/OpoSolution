-- =============================================================================
-- Migration 075: Guardia Civil — scoring_config con 4 ejercicios
-- Autor: Claude / Aritz | Fecha: 2026-04-01
--
-- El examen de Guardia Civil (BOE-A-2025-10521) tiene 4 pruebas en 140 minutos:
--   1. Ortografía (~25 preguntas)
--   2. Conocimientos (100 preguntas + 5 reserva)
--   3. Inglés (~20 preguntas)
--
-- Nota: "Ortografía + Gramática" se fusionan en un solo ejercicio "Ortografía"
-- que cubre acentuación, b/v, h, g/j, puntuación, mayúsculas, homófonos.
--
-- Los 4 ejercicios comparten 140 minutos (no hay tiempo segregado por prueba).
-- La nota final es la suma ponderada de las 3 partes.
--
-- Puntuación oficial GC (BOE):
--   - Conocimientos: 100 preguntas, +1/-0.333, max 100, min aprobado 50
--   - Ortografía: 25 preguntas, +1/-0.333, max 25
--   - Inglés: 20 preguntas, +1/-0.333, max 20
--
-- Total max = 145 puntos (100 + 25 + 20)
-- =============================================================================

UPDATE oposiciones
SET scoring_config = '{
  "num_opciones": 4,
  "minutos_total": 140,
  "ejercicios": [
    {
      "nombre": "Ortografía y gramática",
      "preguntas": 25,
      "reserva": 0,
      "acierto": 1.0,
      "error": 0.333,
      "max": 25,
      "min_aprobado": null,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "tipo_ejercicio": "ortografia"
    },
    {
      "nombre": "Conocimientos",
      "preguntas": 100,
      "reserva": 5,
      "acierto": 1.0,
      "error": 0.333,
      "max": 100,
      "min_aprobado": 50,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "tipo_ejercicio": "conocimientos"
    },
    {
      "nombre": "Lengua extranjera (Inglés)",
      "preguntas": 20,
      "reserva": 0,
      "acierto": 1.0,
      "error": 0.333,
      "max": 20,
      "min_aprobado": null,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "tipo_ejercicio": "ingles"
    }
  ]
}'::jsonb,
features = jsonb_set(
  jsonb_set(
    features,
    '{ortografia}',
    'true'
  ),
  '{ingles}',
  'true'
)
WHERE slug = 'guardia-civil';
