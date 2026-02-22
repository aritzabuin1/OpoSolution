-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Pricing credits — corrections_balance + RPCs
--
-- Modelo de pricing OPTEK (ADR-0010):
--   Free:  2 correcciones (free_corrector_used ya en profiles)
--   Tema:  +5 correcciones al comprar
--   Pack:  +20 correcciones al comprar
--   Recarga: +15 correcciones al comprar
--
-- Los tests son ilimitados (coste < 0.005€/test con Haiku).
-- El límite de 20 tests/día es silencioso vía Upstash (no en BD).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Añadir balance de correcciones a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS corrections_balance INTEGER DEFAULT 0 NOT NULL;

-- 2. RPC: grant_corrections — suma créditos al comprar (idempotente: siempre suma)
CREATE OR REPLACE FUNCTION public.grant_corrections(
  p_user_id UUID,
  p_amount  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET corrections_balance = corrections_balance + p_amount
  WHERE id = p_user_id;
END;
$$;

-- 3. RPC: use_correction — decremento atómico (retorna TRUE si había saldo)
--    Previene race conditions en alta concurrencia (DDIA Consistency).
CREATE OR REPLACE FUNCTION public.use_correction(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.profiles
  SET corrections_balance = corrections_balance - 1
  WHERE id = p_user_id
    AND corrections_balance > 0;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- 4. RPC: use_free_test — incremento atómico para usuarios free (retorna TRUE si < 5)
CREATE OR REPLACE FUNCTION public.use_free_test(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.profiles
  SET free_tests_used = free_tests_used + 1
  WHERE id = p_user_id
    AND free_tests_used < 5;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- 5. RPC: use_free_correction — incremento atómico para usuarios free (retorna TRUE si < 2)
CREATE OR REPLACE FUNCTION public.use_free_correction(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.profiles
  SET free_corrector_used = free_corrector_used + 1
  WHERE id = p_user_id
    AND free_corrector_used < 2;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;
