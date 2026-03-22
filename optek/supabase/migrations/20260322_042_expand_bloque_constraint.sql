-- =============================================================================
-- OPTEK Migration 042: Expand temas.bloque CHECK constraint for multi-oposición
-- Autor: Claude / Aritz | Fecha: 2026-03-22
--
-- Original constraint (migration 010): bloque IN ('I', 'II')
-- A2 GACE has 6 bloques (I-VI). Future oposiciones may have more.
-- FIX: Drop old constraint, add expanded one.
-- =============================================================================

-- Drop the old restrictive constraint
ALTER TABLE temas DROP CONSTRAINT IF EXISTS temas_bloque_check;

-- Add expanded constraint supporting up to 10 bloques
ALTER TABLE temas ADD CONSTRAINT temas_bloque_check
  CHECK (bloque IN ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'));
