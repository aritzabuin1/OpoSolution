-- Down migration: §2.20 Reto Diario Comunitario
-- Reversa de 20260301_020_reto_diario.sql

DROP TABLE IF EXISTS public.reto_diario_resultados CASCADE;
DROP TABLE IF EXISTS public.reto_diario CASCADE;
