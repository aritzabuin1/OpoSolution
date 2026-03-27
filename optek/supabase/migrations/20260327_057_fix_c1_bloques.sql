-- =============================================================================
-- Migration 057: Fix C1 Administrativo bloque assignments
-- Autor: Claude / Aritz | Fecha: 2026-03-27
--
-- BUG: Migration 030 set bloque='I' for temas 1-37 and 'II' for 38-45.
-- The real C1 temario has 6 bloques per BOE-A-2025-26262:
--   I   (1-11):  Organización del Estado
--   II  (12-15): Organización de Oficinas Públicas
--   III (16-22): Derecho Administrativo General
--   IV  (23-31): Gestión de Personal
--   V   (32-37): Gestión Financiera
--   VI  (38-45): Informática y Ofimática
-- =============================================================================

-- Bloque II: Organización de Oficinas Públicas (temas 12-15)
UPDATE temas SET bloque = 'II'
WHERE oposicion_id = 'b0000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 12 AND 15;

-- Bloque III: Derecho Administrativo General (temas 16-22)
UPDATE temas SET bloque = 'III'
WHERE oposicion_id = 'b0000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 16 AND 22;

-- Bloque IV: Gestión de Personal (temas 23-31)
UPDATE temas SET bloque = 'IV'
WHERE oposicion_id = 'b0000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 23 AND 31;

-- Bloque V: Gestión Financiera (temas 32-37)
UPDATE temas SET bloque = 'V'
WHERE oposicion_id = 'b0000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 32 AND 37;

-- Bloque VI: Informática y Ofimática (temas 38-45)
UPDATE temas SET bloque = 'VI'
WHERE oposicion_id = 'b0000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 38 AND 45;

-- Bloque I stays as-is (temas 1-11 already correct)
