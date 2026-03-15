-- =============================================================================
-- Migration 035: cost_estimated_cents int → numeric(10,2)
-- Autor: Claude / Aritz | Fecha: 2026-03-15
--
-- Con Anthropic Haiku como provider primario, el coste por llamada es ~0.22
-- céntimos. La columna `int` rechaza decimales → INSERT falla silenciosamente.
-- Cambiamos a numeric(10,2) para registrar costes reales con precisión.
-- =============================================================================

ALTER TABLE api_usage_log
  ALTER COLUMN cost_estimated_cents TYPE numeric(10,2)
  USING cost_estimated_cents::numeric(10,2);
