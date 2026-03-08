-- Migration 027 — Fix puntuacion CHECK constraint
--
-- BUG: La constraint original era CHECK (puntuacion BETWEEN 0 AND 10) pensando en nota
-- escolar. Pero TODO el código (cliente, RPCs, logros) usa puntuacion como porcentaje 0-100.
-- Resultado: cualquier test con nota > 10% falla al finalizar.
--
-- Fix: ampliar el rango a 0-100 para alinear con el código.

ALTER TABLE tests_generados
  DROP CONSTRAINT IF EXISTS tests_generados_puntuacion_check;

ALTER TABLE tests_generados
  ADD CONSTRAINT tests_generados_puntuacion_check
    CHECK (puntuacion BETWEEN 0 AND 100);
