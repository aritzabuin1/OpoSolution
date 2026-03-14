-- Migration 033: Logros RLS INSERT + UPDATE policies
-- BUG: logros table had RLS enabled (migration 008) with only SELECT policy.
-- The RPC check_and_grant_logros() inserts into logros → RLS blocks → ON CONFLICT
-- DO NOTHING absorbs the error → returns [] → no toast. This affects ALL logros.

CREATE POLICY "logros_insert_own" ON public.logros
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logros_update_own" ON public.logros
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
