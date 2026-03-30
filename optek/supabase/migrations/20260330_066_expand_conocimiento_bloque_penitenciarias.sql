-- Expand conocimiento_tecnico.bloque CHECK to include 'penitenciarias'
-- Needed for Bloque IV (Conducta Humana, temas 48-50) which is not BOE legislation

ALTER TABLE conocimiento_tecnico DROP CONSTRAINT IF EXISTS conocimiento_tecnico_bloque_check;
ALTER TABLE conocimiento_tecnico ADD CONSTRAINT conocimiento_tecnico_bloque_check
  CHECK (bloque IN ('ofimatica', 'informatica', 'admin_electronica', 'correos', 'penitenciarias'));
