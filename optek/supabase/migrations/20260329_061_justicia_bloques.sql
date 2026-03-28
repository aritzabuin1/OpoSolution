-- Migration 061: Assign bloques to Justicia temas
-- Auxilio: Bloque I (1-15), Bloque II (16-26)
-- Tramitación: Bloque I (1-15), Bloque II (16-31), Bloque III (32-37)
-- Gestión: Bloque I (1-16), Bloque II (17-68)

-- ── Auxilio Judicial ────────────────────────────────────────────────────────
UPDATE temas SET bloque = 'I'
WHERE oposicion_id = 'e0000000-0000-0000-0000-000000000001' AND numero BETWEEN 1 AND 15;

UPDATE temas SET bloque = 'II'
WHERE oposicion_id = 'e0000000-0000-0000-0000-000000000001' AND numero BETWEEN 16 AND 26;

-- ── Tramitación Procesal ────────────────────────────────────────────────────
UPDATE temas SET bloque = 'I'
WHERE oposicion_id = 'e1000000-0000-0000-0000-000000000001' AND numero BETWEEN 1 AND 15;

UPDATE temas SET bloque = 'II'
WHERE oposicion_id = 'e1000000-0000-0000-0000-000000000001' AND numero BETWEEN 16 AND 31;

UPDATE temas SET bloque = 'III'
WHERE oposicion_id = 'e1000000-0000-0000-0000-000000000001' AND numero BETWEEN 32 AND 37;

-- ── Gestión Procesal ────────────────────────────────────────────────────────
UPDATE temas SET bloque = 'I'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001' AND numero BETWEEN 1 AND 16;

UPDATE temas SET bloque = 'II'
WHERE oposicion_id = 'e2000000-0000-0000-0000-000000000001' AND numero BETWEEN 17 AND 68;
