-- Fix: Penitenciarias needs supuesto_test=true (exercise 2 = 40 supuestos tipo test)
-- Same pattern as Auxilio Judicial which has supuesto_test=true for its 2nd exercise
-- Without this, simulacro only shows cuestionario (120q) and ignores supuestos (40q)

UPDATE oposiciones SET
  features = '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "supuesto_test": true, "ofimatica": false}'::jsonb
WHERE slug = 'penitenciarias';
