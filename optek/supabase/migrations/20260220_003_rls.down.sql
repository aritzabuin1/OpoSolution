-- =============================================================================
-- ROLLBACK Migration 003: RLS policies
-- =============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tests_generados DISABLE ROW LEVEL SECURITY;
ALTER TABLE desarrollos DISABLE ROW LEVEL SECURITY;
ALTER TABLE compras DISABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas_reportadas DISABLE ROW LEVEL SECURITY;
ALTER TABLE oposiciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE temas DISABLE ROW LEVEL SECURITY;
ALTER TABLE legislacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events_processed DISABLE ROW LEVEL SECURITY;
ALTER TABLE cambios_legislativos DISABLE ROW LEVEL SECURITY;
ALTER TABLE examenes_oficiales DISABLE ROW LEVEL SECURITY;
