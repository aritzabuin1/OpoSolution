-- Migration 044: Enable RLS on supuestos_practicos
-- Fixes critical Supabase security advisory: RLS Disabled in Public

-- Enable RLS
ALTER TABLE public.supuestos_practicos ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own supuestos
CREATE POLICY "Users can view own supuestos"
  ON public.supuestos_practicos
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert rows with their own user_id
CREATE POLICY "Users can insert own supuestos"
  ON public.supuestos_practicos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own supuestos
CREATE POLICY "Users can update own supuestos"
  ON public.supuestos_practicos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — supuestos are not deletable by users
-- (GDPR delete handled via cascade from auth.users)
