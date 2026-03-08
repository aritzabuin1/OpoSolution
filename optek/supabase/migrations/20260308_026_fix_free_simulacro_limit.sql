-- Fix: free simulacro limit was 1, should be 3 (matching FREE_LIMITS.simulacros)
-- The RPC use_free_simulacro had `free_simulacro_used < 1` but freemium.ts says 3
-- Must DROP first because original returns BOOLEAN, cannot change return type in-place

DROP FUNCTION IF EXISTS use_free_simulacro(UUID);

CREATE OR REPLACE FUNCTION use_free_simulacro(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET free_simulacro_used = free_simulacro_used + 1
  WHERE id = p_user_id
    AND free_simulacro_used < 3;

  RETURN FOUND;
END;
$$;
