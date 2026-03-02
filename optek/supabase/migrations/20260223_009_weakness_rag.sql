-- §2.11 Weakness-Weighted RAG
-- Migration: 20260223_009_weakness_rag.sql
--
-- Añade `preguntas_incorrectas` a tests_generados y la RPC
-- `get_user_weak_articles` para recuperar artículos débiles por usuario/tema.
--
-- `preguntas_incorrectas` almacena [{legislacion_id, articulo_numero, ley_codigo}]
-- de las preguntas respondidas incorrectamente en cada test (Bloque I con cita legal).
-- Estos datos permiten al RAG boostar artículos donde el usuario falla más.

-- ─── 1. Columna preguntas_incorrectas ────────────────────────────────────────

ALTER TABLE public.tests_generados
  ADD COLUMN IF NOT EXISTS preguntas_incorrectas JSONB NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.tests_generados.preguntas_incorrectas IS
  'Array de objetos {legislacion_id: uuid, articulo_numero: text, ley_codigo: text} '
  'correspondientes a las preguntas Bloque I respondidas incorrectamente. '
  'Usado por get_user_weak_articles para el Weakness-Weighted RAG (§2.11).';

-- ─── 2. Índice para acelerar el jsonb lookup en el RPC ───────────────────────

CREATE INDEX IF NOT EXISTS idx_tests_generados_user_tema_incorrectas
  ON public.tests_generados (user_id, tema_id)
  WHERE preguntas_incorrectas != '[]'::JSONB;

-- ─── 3. RPC get_user_weak_articles ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_weak_articles(
  p_user_id UUID,
  p_tema_id UUID,
  p_limit    INT DEFAULT 10
)
RETURNS TABLE(legislacion_id UUID, fallos BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (elem ->> 'legislacion_id')::UUID AS legislacion_id,
    COUNT(*)                          AS fallos
  FROM public.tests_generados tg,
       jsonb_array_elements(tg.preguntas_incorrectas) AS elem
  WHERE tg.user_id = p_user_id
    AND tg.tema_id = p_tema_id
    AND (elem ->> 'legislacion_id') IS NOT NULL
  GROUP BY elem ->> 'legislacion_id'
  ORDER BY fallos DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_user_weak_articles(UUID, UUID, INT) IS
  '§2.11 — Retorna los artículos legales donde un usuario ha fallado más veces '
  'en un tema dado. Ordenados por número de fallos DESC. '
  'Usado por buildContext para boostar artículos débiles en el contexto RAG.';
