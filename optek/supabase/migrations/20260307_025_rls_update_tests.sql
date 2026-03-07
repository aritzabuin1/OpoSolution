-- Migration 025: Add UPDATE RLS policy for tests_generados
--
-- Bug: El endpoint /api/tests/[id]/finalizar no podia marcar tests como
-- completados porque solo existian policies SELECT e INSERT.
-- El UPDATE fallaba silenciosamente → el usuario veia 404 en resultados.

CREATE POLICY "tests_update_own"
  ON tests_generados
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
