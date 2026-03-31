-- 073: Fix scoring_config tiempos para simulacros seguridad
-- Ertzaintza: 50 min → null (tiempo no confirmado, variable por convocatoria)
-- Guardia Civil: 60 min → 140 min compartidos (ortografía+gramática+conocimientos+inglés)
--   OpoRuta solo cubre conocimientos: marcamos minutos=null en ejercicio individual
--   pero minutos_total=140 para referencia
-- Policía Nacional: 50 min correcto, no cambia
-- También actualiza plazas GC: 2091 → 3118

-- Ertzaintza: quitar minutos del ejercicio (variable/no confirmado)
UPDATE oposiciones
SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,0}',
  (scoring_config->'ejercicios'->0) - 'minutos'
)
WHERE slug = 'ertzaintza';

-- Guardia Civil: minutos_total=140, ejercicio individual sin minutos propios
-- (el bloque de conocimientos no tiene tiempo segregado del resto)
UPDATE oposiciones
SET scoring_config = jsonb_set(
  (jsonb_set(
    scoring_config,
    '{ejercicios,0}',
    (scoring_config->'ejercicios'->0) - 'minutos'
  )),
  '{minutos_total}',
  '140'
),
plazas = 3118
WHERE slug = 'guardia-civil';
