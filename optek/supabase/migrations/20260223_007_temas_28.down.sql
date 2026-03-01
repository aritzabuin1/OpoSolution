-- Rollback migration 007: revertir a 25 temas
-- Nota: no elimina los temas actualizados (solo revierte num_temas)
UPDATE oposiciones
SET num_temas = 25
WHERE slug = 'aux-admin-estado';

-- Los temas con numero > 25 se eliminan (los 3 nuevos de Bloque II)
DELETE FROM temas
WHERE
  oposicion_id = (SELECT id FROM oposiciones WHERE slug = 'aux-admin-estado')
  AND numero > 25;
