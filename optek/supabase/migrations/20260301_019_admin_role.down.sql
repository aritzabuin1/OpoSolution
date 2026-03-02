-- Down migration 019: Admin Role
-- Reverts §2.18.1

DROP INDEX IF EXISTS public.idx_profiles_admin;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
