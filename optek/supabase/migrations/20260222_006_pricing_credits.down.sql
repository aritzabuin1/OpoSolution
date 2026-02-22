-- Rollback migration 006: Pricing credits
DROP FUNCTION IF EXISTS public.use_free_correction(UUID);
DROP FUNCTION IF EXISTS public.use_free_test(UUID);
DROP FUNCTION IF EXISTS public.use_correction(UUID);
DROP FUNCTION IF EXISTS public.grant_corrections(UUID, INTEGER);
ALTER TABLE public.profiles DROP COLUMN IF EXISTS corrections_balance;
