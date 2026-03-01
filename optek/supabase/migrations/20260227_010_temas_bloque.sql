-- =============================================================================
-- OPTEK Migration 010: §0.8.5B — Columna bloque en temas (Bloque I / II)
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Añade la columna `bloque` a la tabla `temas` para distinguir entre
-- Bloque I (temas 1-16, materias jurídicas) y Bloque II (temas 17-28,
-- ofimática e informática). Permite filtrar tests por bloque temático.
--
-- §0.8.5B: ADD COLUMN bloque + UPDATE filas existentes
-- =============================================================================

-- Añadir columna bloque (idempotente)
ALTER TABLE temas
  ADD COLUMN IF NOT EXISTS bloque text CHECK (bloque IN ('I', 'II'));

-- Poblar bloque para los 28 temas ya insertados en migration 007
UPDATE temas
SET bloque = CASE
  WHEN numero BETWEEN 1 AND 16 THEN 'I'
  ELSE 'II'
END
WHERE oposicion_id = (SELECT id FROM oposiciones WHERE slug = 'aux-admin-estado')
  AND bloque IS NULL;

-- Índice para filtrar tests por bloque
CREATE INDEX IF NOT EXISTS idx_temas_bloque
  ON temas(oposicion_id, bloque);

COMMENT ON COLUMN temas.bloque IS
  'Bloque temático de la oposición: I = Materias jurídicas (temas 1-16), II = Ofimática/Informática (temas 17-28)';
