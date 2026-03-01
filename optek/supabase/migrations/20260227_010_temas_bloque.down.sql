-- Rollback: Migration 010 — eliminar columna bloque de temas
DROP INDEX IF EXISTS idx_temas_bloque;
ALTER TABLE temas DROP COLUMN IF EXISTS bloque;
