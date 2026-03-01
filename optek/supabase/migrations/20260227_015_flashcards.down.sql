-- =============================================================================
-- OPTEK Migration 015 ROLLBACK: §2.1.1 — Tabla flashcards
-- =============================================================================

DROP TABLE IF EXISTS flashcards CASCADE;
DROP FUNCTION IF EXISTS update_flashcards_updated_at() CASCADE;
