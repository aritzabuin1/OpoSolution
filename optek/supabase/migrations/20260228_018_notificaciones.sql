-- ============================================================================
-- Migration 018 — notificaciones + extensiones cambios_legislativos
-- Ref: §2.13.1
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla notificaciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id          uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        text          NOT NULL CHECK (tipo IN ('boe_cambio', 'daily_brief', 'racha_riesgo', 'logro')),
  titulo      text          NOT NULL,
  mensaje     text          NOT NULL,
  url_accion  text,
  leida       boolean       NOT NULL DEFAULT false,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Índice para reads frecuentes (badge de notificaciones no leídas)
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_leida
  ON public.notificaciones(user_id, leida)
  WHERE leida = false;

-- RLS: usuario solo ve sus propias notificaciones
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_select_own"
  ON public.notificaciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notificaciones_update_own"
  ON public.notificaciones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Extender cambios_legislativos con campos de notificación y flash test
-- ---------------------------------------------------------------------------
ALTER TABLE public.cambios_legislativos
  ADD COLUMN IF NOT EXISTS notificacion_enviada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flash_test_id uuid REFERENCES public.tests_generados(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.cambios_legislativos.notificacion_enviada IS
  'true = usuarios ya notificados del cambio';
COMMENT ON COLUMN public.cambios_legislativos.flash_test_id IS
  'UUID del flash test generado para este cambio legislativo (nullable)';
