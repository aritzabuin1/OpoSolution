-- =============================================================================
-- OPTEK Migration 014 ROLLBACK: §2.7.1 — Tabla sugerencias
-- =============================================================================

DROP TABLE IF EXISTS sugerencias CASCADE;
DROP FUNCTION IF EXISTS update_sugerencias_updated_at() CASCADE;
