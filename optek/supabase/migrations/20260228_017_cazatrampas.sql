-- =============================================================================
-- OPTEK Migration 017: Modo Caza-Trampas — §2.12
-- Autor: Claude / Aritz | Fecha: 2026-02-28
--
-- El usuario recibe un fragmento legal con N errores sutiles inyectados por IA.
-- Su misión: identificar y corregir cada error.
-- Evaluación 100% determinista (string comparison).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cazatrampas_sesiones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legislacion_id    uuid        NOT NULL REFERENCES public.legislacion(id) ON DELETE CASCADE,

  -- El texto con errores mostrado al usuario
  texto_trampa      text        NOT NULL,

  -- Errores reales (secreto hasta que el usuario completa)
  -- [{tipo, posicion_inicio, posicion_fin, valor_original, valor_trampa, explicacion}]
  errores_reales    jsonb       NOT NULL DEFAULT '[]',

  -- Respuestas del usuario (se rellenan al completar)
  -- [{valor_original_detectado, valor_trampa_detectado, correcto}]
  errores_detectados jsonb      DEFAULT NULL,

  -- Resultado
  puntuacion        numeric(5,2) DEFAULT NULL,  -- 0.00 - 100.00
  completada_at     timestamptz DEFAULT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cazatrampas_sesiones IS 'Sesiones del modo Caza-Trampas (§2.12): artículo legal con errores inyectados por IA';
COMMENT ON COLUMN public.cazatrampas_sesiones.errores_reales IS '[{tipo, valor_original, valor_trampa, explicacion}] — no exponer al cliente hasta completar';
COMMENT ON COLUMN public.cazatrampas_sesiones.puntuacion IS 'Porcentaje de errores detectados correctamente (0-100)';

-- Índices
CREATE INDEX IF NOT EXISTS cazatrampas_user_id_idx ON public.cazatrampas_sesiones(user_id, created_at DESC);

-- RLS
ALTER TABLE public.cazatrampas_sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cazatrampas_select_own"
  ON public.cazatrampas_sesiones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cazatrampas_insert_own"
  ON public.cazatrampas_sesiones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cazatrampas_update_own"
  ON public.cazatrampas_sesiones FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
