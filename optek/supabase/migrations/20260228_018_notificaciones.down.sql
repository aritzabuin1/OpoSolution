-- ============================================================================
-- Rollback migration 018 — notificaciones + extensiones cambios_legislativos
-- ============================================================================

ALTER TABLE public.cambios_legislativos
  DROP COLUMN IF EXISTS flash_test_id,
  DROP COLUMN IF EXISTS notificacion_enviada;

DROP TABLE IF EXISTS public.notificaciones CASCADE;
