-- 072: Add personalidad feature to seguridad oposiciones
-- The module is built (FASE 11) but features JSONB didn't include it

UPDATE oposiciones
SET features = features || '{"personalidad": true}'::jsonb
WHERE rama = 'seguridad';
