-- Migration 077: Activate features for seguridad oposiciones
-- psicotecnicos: true (FASE 6 created spatial/logic/perception modules)
-- cazatrampas: true (shared feature)
-- personalidad: true (FASE 11)

UPDATE oposiciones
SET features = '{"psicotecnicos": true, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false, "personalidad": true}'::jsonb
WHERE rama = 'seguridad';
