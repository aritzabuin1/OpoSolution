-- =============================================================================
-- ROLLBACK Migration 001: Core tables
-- Ejecutar SOLO en emergencia. Elimina TODOS los datos.
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS legislacion_updated_at ON legislacion;

DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS examenes_oficiales CASCADE;
DROP TABLE IF EXISTS legislacion CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS temas CASCADE;
DROP TABLE IF EXISTS oposiciones CASCADE;

DROP EXTENSION IF EXISTS vector;
