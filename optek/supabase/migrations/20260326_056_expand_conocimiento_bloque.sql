-- Expand conocimiento_tecnico.bloque CHECK constraint to include 'correos'
-- Needed for operational content (productos, logística, distribución) of Correos oposición

ALTER TABLE conocimiento_tecnico DROP CONSTRAINT IF EXISTS conocimiento_tecnico_bloque_check;
ALTER TABLE conocimiento_tecnico ADD CONSTRAINT conocimiento_tecnico_bloque_check
  CHECK (bloque IN ('ofimatica', 'informatica', 'admin_electronica', 'correos'));
