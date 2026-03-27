-- =============================================================================
-- Migration 058: Correos — disable separate psicotécnicos module
-- Autor: Claude / Aritz | Fecha: 2026-03-28
--
-- Correos has 10 psicotécnicos EMBEDDED in the 100-question exam.
-- They are NOT a separate exercise like C2 Auxiliar (which has 30 at the start).
-- Setting psicotecnicos=false hides:
--   - /psicotecnicos module in sidebar/navbar
--   - "Incluir psicotécnicos" toggle in simulacros
-- The embedded psicotécnicos in the exam are still covered by the test questions.
-- =============================================================================

UPDATE oposiciones
SET features = features || '{"psicotecnicos": false}'::jsonb
WHERE slug = 'correos';
