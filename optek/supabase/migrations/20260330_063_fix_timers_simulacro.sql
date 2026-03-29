-- Migration 063: Fix simulacro timers for multi-exercise oposiciones
--
-- C1 AGE: ejercicios have minutos=null → add minutos_total=100
-- A2 GACE: 240 min total includes 150 min desarrollo (not simulable) → keep as-is,
--          the code will handle excluding non-test exercises from timer
-- Gestión Procesal: 175 min includes 45 min desarrollo → same approach
--
-- Idempotent: safe to re-run.

-- C1 AGE: add minutos_total since individual exercises have null minutos
UPDATE oposiciones
SET scoring_config = scoring_config || '{"minutos_total": 100}'::jsonb
WHERE slug = 'administrativo-estado';

-- A2 GACE: mark supuesto práctico as tipo='tribunal' (desarrollo escrito, 150 min)
-- so simulacro timer excludes it (only 90 min for test teórico)
UPDATE oposiciones
SET scoring_config = jsonb_set(
  scoring_config,
  '{ejercicios,1,tipo}',
  '"tribunal"'::jsonb
)
WHERE slug = 'gestion-estado';
