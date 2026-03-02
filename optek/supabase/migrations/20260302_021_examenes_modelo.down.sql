-- Rollback: §1.3.2A examenes_modelo
DROP INDEX IF EXISTS examenes_oficiales_unique_idx;

ALTER TABLE examenes_oficiales
  DROP COLUMN IF EXISTS modelo;

ALTER TABLE examenes_oficiales
  ADD CONSTRAINT examenes_oficiales_oposicion_id_anio_convocatoria_key
  UNIQUE (oposicion_id, anio, convocatoria);
