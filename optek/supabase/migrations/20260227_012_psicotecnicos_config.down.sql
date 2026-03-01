-- Rollback: Migration 012 — eliminar tabla psicotecnicos_config
DROP POLICY IF EXISTS "psicotecnicos_config_service" ON psicotecnicos_config;
DROP POLICY IF EXISTS "psicotecnicos_config_select" ON psicotecnicos_config;
DROP INDEX IF EXISTS idx_psicotecnicos_config_active;
DROP TABLE IF EXISTS psicotecnicos_config;
