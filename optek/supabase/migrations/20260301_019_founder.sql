-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 019: Founder Pricing — §1.21.3
--
-- Añade columna is_founder a profiles para identificar a los primeros 50
-- compradores del Pack Fundador (24,99€ one-time, 30 correcciones).
--
-- El badge "Miembro Fundador" es permanente una vez otorgado.
-- El webhook de Stripe lo activa cuando tipo = 'fundador'.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT FALSE NOT NULL;

-- Comentario para documentar en el schema
COMMENT ON COLUMN public.profiles.is_founder IS
  'TRUE si el usuario compró el Pack Fundador (primeros 50 compradores, 24,99€). Badge permanente.';
