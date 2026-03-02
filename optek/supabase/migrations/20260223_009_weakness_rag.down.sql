-- §2.11 Weakness-Weighted RAG — DOWN migration
-- Revierte la migration 20260223_009_weakness_rag.sql

DROP FUNCTION IF EXISTS public.get_user_weak_articles(UUID, UUID, INT);

DROP INDEX IF EXISTS public.idx_tests_generados_user_tema_incorrectas;

ALTER TABLE public.tests_generados
  DROP COLUMN IF EXISTS preguntas_incorrectas;
