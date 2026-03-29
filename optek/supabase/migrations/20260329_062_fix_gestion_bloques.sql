-- Migration 062: Fix bloque assignments for Gestión Procesal
--
-- Problem: All temas 17-68 were incorrectly assigned to Bloque II.
-- This migration corrects them to match the official temario structure
-- defined in migration 055.
--
-- Idempotent: safe to re-run (UPDATE is a no-op if values already correct).

UPDATE temas SET bloque = 'II'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 17 AND 22;

UPDATE temas SET bloque = 'III'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 23 AND 39;

UPDATE temas SET bloque = 'IV'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 40 AND 55;

UPDATE temas SET bloque = 'V'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 56 AND 62;

UPDATE temas SET bloque = 'VI'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001'
  AND numero BETWEEN 63 AND 68;
