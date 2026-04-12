-- Migration 082: Add 'radar' and 'flash' to tests_generados.tipo CHECK constraint
-- These types were used in code but missing from the DB constraint.
-- 'radar' = Radar del Tribunal tests (§2.14.4)
-- 'flash' = BOE flash tests (§2.13.5)

ALTER TABLE tests_generados DROP CONSTRAINT IF EXISTS tests_generados_tipo_check;
ALTER TABLE tests_generados ADD CONSTRAINT tests_generados_tipo_check
  CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores', 'psicotecnico', 'supuesto_test', 'radar', 'flash'));
