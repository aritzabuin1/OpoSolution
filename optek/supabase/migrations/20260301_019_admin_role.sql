-- Migration 019: Admin Role
-- §2.18.1 — Add is_admin column to profiles for admin dashboard access control
--
-- Usage: UPDATE profiles SET is_admin = true WHERE id = '<aritz-user-id>';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Partial index: fast lookup for admin users (expected < 5 rows)
CREATE INDEX IF NOT EXISTS idx_profiles_admin
  ON public.profiles(id)
  WHERE is_admin = true;

COMMENT ON COLUMN public.profiles.is_admin IS
  'Admin flag — grants access to /admin/* routes (Unit Economics Dashboard §2.18)';
