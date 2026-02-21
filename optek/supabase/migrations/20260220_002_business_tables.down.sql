-- =============================================================================
-- ROLLBACK Migration 002: Business tables
-- =============================================================================

DROP TABLE IF EXISTS api_usage_log CASCADE;
DROP TABLE IF EXISTS cambios_legislativos CASCADE;
DROP TABLE IF EXISTS suscripciones CASCADE;
DROP TABLE IF EXISTS stripe_events_processed CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS desarrollos CASCADE;
DROP TABLE IF EXISTS preguntas_reportadas CASCADE;
DROP TABLE IF EXISTS tests_generados CASCADE;
