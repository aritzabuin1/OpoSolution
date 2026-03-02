-- =============================================================================
-- OPTEK Migration 020: Reto Diario Comunitario — §2.20
-- Autor: Claude / Aritz | Fecha: 2026-03-01
--
-- El mismo reto de Caza-Trampas para todos los usuarios cada día.
-- Mecánica Wordle: 1 reto/día, se resetea a medianoche, solo juegas una vez.
--
-- Tablas:
--   1. reto_diario — contenido del reto (generado por cron a las 00:05 UTC)
--   2. reto_diario_resultados — resultado de cada usuario en el reto del día
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. reto_diario — el reto del día (contenido compartido para todos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reto_diario (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha           date        NOT NULL,          -- fecha del reto (UTC)
  ley_nombre      text        NOT NULL,
  articulo_numero text        NOT NULL,
  texto_trampa    text        NOT NULL,          -- texto con errores inyectados
  errores_reales  jsonb       NOT NULL DEFAULT '[]', -- [{tipo, valor_original, valor_trampa, explicacion}]
  num_errores     int         NOT NULL DEFAULT 3,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reto_diario_fecha_unique UNIQUE(fecha)
);

COMMENT ON TABLE public.reto_diario IS
  'Reto diario de Caza-Trampas compartido por todos los usuarios (§2.20). Un registro por día.';
COMMENT ON COLUMN public.reto_diario.errores_reales IS
  'Secreto hasta que el usuario completa el reto. Igual que cazatrampas_sesiones.errores_reales.';

-- Índice para fetch del día actual
CREATE INDEX IF NOT EXISTS idx_reto_diario_fecha ON public.reto_diario(fecha DESC);

-- ---------------------------------------------------------------------------
-- 2. reto_diario_resultados — un resultado por usuario por reto
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reto_diario_resultados (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reto_diario_id        uuid        NOT NULL REFERENCES public.reto_diario(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intentos_usados       int         NOT NULL DEFAULT 1,
  trampas_encontradas   int         NOT NULL DEFAULT 0,
  completado            bool        NOT NULL DEFAULT false,
  puntuacion            numeric(5,2) DEFAULT NULL,   -- 0.00 - 100.00
  detecciones           jsonb       DEFAULT NULL,    -- respuestas del usuario (archivado)
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reto_resultados_unique UNIQUE(reto_diario_id, user_id)
);

COMMENT ON TABLE public.reto_diario_resultados IS
  'Resultado de cada usuario en cada reto diario. UNIQUE por (reto_diario_id, user_id) — 1 intento/día.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_reto_resultados_user ON public.reto_diario_resultados(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reto_resultados_reto ON public.reto_diario_resultados(reto_diario_id);

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------

-- reto_diario: lectura pública (autenticados) — el contenido del reto es público
ALTER TABLE public.reto_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reto_diario_select_auth"
  ON public.reto_diario FOR SELECT
  TO authenticated
  USING (true);

-- Solo service_role puede insertar (el cron usa service client)
CREATE POLICY "reto_diario_insert_service"
  ON public.reto_diario FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- reto_diario_resultados: cada usuario ve sus propios resultados + puede ver stats del día (conteos)
ALTER TABLE public.reto_diario_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reto_resultados_select_own"
  ON public.reto_diario_resultados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "reto_resultados_insert_own"
  ON public.reto_diario_resultados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reto_resultados_service_all"
  ON public.reto_diario_resultados FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
