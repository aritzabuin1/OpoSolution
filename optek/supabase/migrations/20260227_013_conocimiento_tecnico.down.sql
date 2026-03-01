-- Rollback: Migration 013 — eliminar conocimiento_tecnico
DROP FUNCTION IF EXISTS search_conocimiento(text, int, text);
DROP FUNCTION IF EXISTS match_conocimiento(vector, int, text);
DROP TRIGGER IF EXISTS trg_conocimiento_updated_at ON conocimiento_tecnico;
DROP FUNCTION IF EXISTS update_conocimiento_updated_at();
DROP POLICY IF EXISTS "conocimiento_tecnico_service_write" ON conocimiento_tecnico;
DROP POLICY IF EXISTS "conocimiento_tecnico_select" ON conocimiento_tecnico;
DROP INDEX IF EXISTS idx_conocimiento_fts;
DROP INDEX IF EXISTS idx_conocimiento_embedding;
DROP INDEX IF EXISTS idx_conocimiento_hash;
DROP INDEX IF EXISTS idx_conocimiento_bloque_tema;
DROP TABLE IF EXISTS conocimiento_tecnico;
