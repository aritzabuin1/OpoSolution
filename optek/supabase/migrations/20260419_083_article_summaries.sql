-- Migration 083: article_summaries — TL;DR IA cacheadas por (ley, articulo)
-- PlanSEO F1.T5. Evita regenerar en cada render; script offline las materializa.
-- Se muestran en /ley/:law/:art como "information gain" frente a la réplica del BOE.

CREATE TABLE IF NOT EXISTS article_summaries (
  ley_nombre text NOT NULL,
  articulo_numero text NOT NULL,
  tldr text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL DEFAULT '1.0.0',
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ley_nombre, articulo_numero)
);

-- Lectura pública (server component, no RLS required)
ALTER TABLE article_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_summaries_public_read" ON article_summaries
  FOR SELECT USING (true);

-- Escritura solo service role (script offline)
CREATE POLICY "article_summaries_service_write" ON article_summaries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_article_summaries_ley ON article_summaries (ley_nombre);
