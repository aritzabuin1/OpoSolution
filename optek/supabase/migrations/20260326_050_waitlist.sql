-- =============================================================================
-- Migration 050: Tabla waitlist para "Avísame cuando esté disponible"
-- Autor: Claude / Aritz | Fecha: 2026-03-26
--
-- Captura emails de usuarios interesados en oposiciones que aún no están activas.
-- Al activar una oposición → enviar email masivo a los waitlisted.
-- GDPR: opt-in explícito requerido en frontend.
-- =============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            text NOT NULL,
  oposicion_slug   text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  notified_at      timestamptz,  -- NULL = no notificado, timestamp = notificado

  CONSTRAINT waitlist_unique UNIQUE (email, oposicion_slug)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_slug ON waitlist (oposicion_slug) WHERE notified_at IS NULL;

-- RLS: solo service role puede leer/escribir (API route usa service client)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE waitlist IS 'Lista de espera para oposiciones próximamente. GDPR: opt-in explícito.';
