-- §FASE 2.5c: Add supuesto_test feature flag to oposiciones that have supuesto test format
-- C1 AGE, Auxilio C2, Tramitación C1, Gestión Procesal A2

-- C1 Administrativo del Estado
UPDATE oposiciones
SET features = features || '{"supuesto_test": true}'::jsonb
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Auxilio Judicial C2
UPDATE oposiciones
SET features = features || '{"supuesto_test": true}'::jsonb
WHERE slug = 'auxilio-judicial';

-- Tramitación Procesal C1
UPDATE oposiciones
SET features = features || '{"supuesto_test": true}'::jsonb
WHERE slug = 'tramitacion-procesal';

-- Gestión Procesal A2
UPDATE oposiciones
SET features = features || '{"supuesto_test": true}'::jsonb
WHERE slug = 'gestion-procesal';
