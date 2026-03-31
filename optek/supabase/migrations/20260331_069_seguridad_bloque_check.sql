-- Expand conocimiento_tecnico.bloque CHECK to include 'seguridad'
-- Needed for non-legislative content: Ertzaintza (historia/geografía PV),
-- Guardia Civil (topografía, telecoms, armamento, etc.),
-- Policía Nacional (DDHH, sociología, ciberseguridad, etc.)

ALTER TABLE conocimiento_tecnico DROP CONSTRAINT IF EXISTS conocimiento_tecnico_bloque_check;
ALTER TABLE conocimiento_tecnico ADD CONSTRAINT conocimiento_tecnico_bloque_check
  CHECK (bloque IN ('ofimatica', 'informatica', 'admin_electronica', 'correos', 'penitenciarias', 'seguridad'));
