-- Rollback migration 008: eliminar rachas y logros
DROP TABLE IF EXISTS public.logros;

DROP FUNCTION IF EXISTS public.check_and_grant_logros(UUID);
DROP FUNCTION IF EXISTS public.update_streak(UUID);

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS racha_actual,
  DROP COLUMN IF EXISTS racha_maxima,
  DROP COLUMN IF EXISTS ultimo_test_dia;
