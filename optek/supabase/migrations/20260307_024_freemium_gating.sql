-- Migration 024: Freemium gating — track psicotécnicos y simulacros free
-- Adds columns + RPCs for per-feature free usage tracking

-- New columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS free_psico_used INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_simulacro_used INT NOT NULL DEFAULT 0;

-- RPC: use_free_psico — atomic increment, returns false if limit reached
CREATE OR REPLACE FUNCTION use_free_psico(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET free_psico_used = free_psico_used + 1
  WHERE id = p_user_id
    AND free_psico_used < 3;

  RETURN FOUND;
END;
$$;

-- RPC: use_free_simulacro — atomic increment, returns false if limit reached
CREATE OR REPLACE FUNCTION use_free_simulacro(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET free_simulacro_used = free_simulacro_used + 1
  WHERE id = p_user_id
    AND free_simulacro_used < 1;

  RETURN FOUND;
END;
$$;
