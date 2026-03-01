-- Migration 009 — §1.3B.11
-- Añadir 'psicotecnico' como tipo válido en tests_generados
-- Los tests psicotécnicos no tienen tema_id (NULL permitido desde el inicio)

ALTER TABLE tests_generados
  DROP CONSTRAINT IF EXISTS tests_generados_tipo_check;

ALTER TABLE tests_generados
  ADD CONSTRAINT tests_generados_tipo_check
    CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores', 'psicotecnico'));
