-- Migration 079: Fix PN psicotécnicos — add preguntas count (was undefined)
-- Standard for aptitudes intelectuales in police oposiciones: ~50 preguntas

UPDATE oposiciones
SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,3,preguntas}',
  '50'::jsonb
)
WHERE slug = 'policia-nacional';
