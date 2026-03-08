-- Fix: free simulacro limit was 1, should be 3 (matching FREE_LIMITS.simulacros)
-- The RPC use_free_simulacro had `free_simulacro_used < 1` but freemium.ts says 3

CREATE OR REPLACE FUNCTION use_free_simulacro(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET free_simulacro_used = free_simulacro_used + 1
  WHERE id = p_user_id
    AND free_simulacro_used < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
