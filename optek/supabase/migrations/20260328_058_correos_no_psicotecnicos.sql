-- =============================================================================
-- Migration 058: Correos — keep psicotécnicos enabled with correct type
-- Autor: Claude / Aritz | Fecha: 2026-03-28
--
-- Correos has 10 psicotécnicos EMBEDDED in the 100-question exam.
-- Types are DIFFERENT from AGE C2:
--   - Correos: comprensión lectora, interpretación de gráficos, series de figuras
--   - AGE C2: series numéricas, analogías verbales, organización
-- The motor determinista now has Correos-specific generators.
-- psicotecnicos=true → users can practice in /psicotecnicos module.
-- The app auto-detects the oposición and generates the correct type.
-- =============================================================================

-- Ensure psicotecnicos is true for Correos (was set in migration 048, confirm)
UPDATE oposiciones
SET features = features || '{"psicotecnicos": true}'::jsonb
WHERE slug = 'correos';
