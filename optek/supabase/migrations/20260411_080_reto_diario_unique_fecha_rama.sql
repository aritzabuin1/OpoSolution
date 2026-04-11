-- Migration 080: Fix reto_diario UNIQUE constraint
-- The original UNIQUE(fecha) only allows 1 reto per day globally.
-- With multi-oposicion, we need 1 reto per day PER RAMA.

ALTER TABLE reto_diario
  DROP CONSTRAINT IF EXISTS reto_diario_fecha_unique;

ALTER TABLE reto_diario
  ADD CONSTRAINT reto_diario_fecha_rama_unique UNIQUE(fecha, rama);
