-- Add num_supuestos to scoring_config ejercicio "supuesto" for each oposición
-- This tells generate-simulacro EXACTLY how many supuestos to load from the bank
-- Matches the real exam structure: Auxilio=2, Penitenciarias=8, others=1

-- Auxilio Judicial: 2 supuestos × 20 preguntas = 40q (confirmed from exam PDFs)
UPDATE oposiciones SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,num_supuestos}',
  '2'::jsonb
) WHERE slug = 'auxilio-judicial';

-- Penitenciarias: 8 supuestos × 5 preguntas = 40q (confirmed from BOE)
UPDATE oposiciones SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,num_supuestos}',
  '8'::jsonb
) WHERE slug = 'penitenciarias';

-- Administrativo C1: 1 supuesto × 20 preguntas = 20q
UPDATE oposiciones SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,num_supuestos}',
  '1'::jsonb
) WHERE slug = 'administrativo-estado';

-- Tramitación: 1 supuesto × 10 preguntas = 10q (ejercicio 2)
UPDATE oposiciones SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,num_supuestos}',
  '1'::jsonb
) WHERE slug = 'tramitacion-procesal';

-- Gestión Procesal: 1 supuesto × 10 preguntas = 10q (ejercicio 2)
UPDATE oposiciones SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,num_supuestos}',
  '1'::jsonb
) WHERE slug = 'gestion-procesal';
