-- =============================================================================
-- OPTEK Migration 031: oposicion_id en api_usage_log
-- Autor: Claude / Aritz | Fecha: 2026-03-13
--
-- Añade columna oposicion_id a api_usage_log para atribuir costes AI por oposición.
-- Columna nullable para retrocompatibilidad con registros existentes.
-- =============================================================================

ALTER TABLE api_usage_log ADD COLUMN IF NOT EXISTS oposicion_id text;

CREATE INDEX IF NOT EXISTS idx_api_usage_log_oposicion
  ON api_usage_log(oposicion_id);
