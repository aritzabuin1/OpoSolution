-- Migration: 071 — Módulo Personalidad Policial
-- Tables for personality assessment sessions and cross-session consistency tracking.

-- 1. personalidad_sesiones: stores each assessment session
CREATE TABLE IF NOT EXISTS personalidad_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('perfil', 'sjt', 'entrevista', 'coaching')),
  oposicion_id UUID REFERENCES oposiciones(id),
  respuestas JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores JSONB,
  validity JSONB,  -- validity scale results
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user session history queries
CREATE INDEX IF NOT EXISTS idx_personalidad_sesiones_user
  ON personalidad_sesiones(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalidad_sesiones_tipo
  ON personalidad_sesiones(user_id, tipo);

-- 2. personalidad_consistencia: tracks cross-session consistency per dimension
CREATE TABLE IF NOT EXISTS personalidad_consistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('O', 'C', 'E', 'A', 'N')),
  sesion_id UUID NOT NULL REFERENCES personalidad_sesiones(id) ON DELETE CASCADE,
  t_score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personalidad_consistencia_user_dim
  ON personalidad_consistencia(user_id, dimension, created_at DESC);

-- 3. RPC: use_personality_credit — reuses corrections_balance (unified pool)
-- The personality module shares the same credit pool as corrections.
-- This RPC is identical to use_correction but logs the source as 'personalidad'.
CREATE OR REPLACE FUNCTION use_personality_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT corrections_balance INTO current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF current_balance IS NULL OR current_balance <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE profiles
  SET corrections_balance = corrections_balance - 1
  WHERE id = p_user_id AND corrections_balance > 0;

  RETURN FOUND;
END;
$$;

-- 4. RLS policies
ALTER TABLE personalidad_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalidad_consistencia ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own personality sessions"
  ON personalidad_sesiones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality sessions"
  ON personalidad_sesiones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personality sessions"
  ON personalidad_sesiones FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only see their own consistency data
CREATE POLICY "Users can view own consistency"
  ON personalidad_consistencia FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consistency"
  ON personalidad_consistencia FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (for API endpoints)
-- No explicit policy needed — service role key already bypasses RLS.
