-- =============================================================================
-- OPTEK Migration 014: §2.7.1 — Tabla sugerencias
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Canal de feedback de usuarios: sugerencias, reportes de errores y
-- solicitudes de funcionalidades. Complementa preguntas_reportadas (§0.6.2)
-- con feedback general de producto.
--
-- §2.7.1: CREATE TABLE sugerencias + RLS + índices
-- =============================================================================

CREATE TABLE IF NOT EXISTS sugerencias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo        text NOT NULL CHECK (tipo IN ('sugerencia', 'error', 'funcionalidad', 'otro')),
  mensaje     text NOT NULL,
  pagina_origen text,
  estado      text NOT NULL DEFAULT 'recibida'
              CHECK (estado IN ('recibida', 'leida', 'implementada', 'descartada')),
  respuesta_admin text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Constraint: mensaje entre 10 y 2000 caracteres
ALTER TABLE sugerencias
  ADD CONSTRAINT sugerencias_mensaje_length
  CHECK (char_length(mensaje) BETWEEN 10 AND 2000);

-- RLS
ALTER TABLE sugerencias ENABLE ROW LEVEL SECURITY;

-- INSERT: cualquier usuario autenticado puede enviar
CREATE POLICY "sugerencias_insert" ON sugerencias
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT: solo puede ver las propias
CREATE POLICY "sugerencias_select_own" ON sugerencias
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE: solo admin (service role) — para respuesta_admin y estado
-- (no se expone a usuarios normales)

-- Índices
CREATE INDEX IF NOT EXISTS idx_sugerencias_user_id
  ON sugerencias(user_id);

CREATE INDEX IF NOT EXISTS idx_sugerencias_estado
  ON sugerencias(estado, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_sugerencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sugerencias_updated_at
  BEFORE UPDATE ON sugerencias
  FOR EACH ROW EXECUTE FUNCTION update_sugerencias_updated_at();

COMMENT ON TABLE sugerencias IS
  'Canal de feedback de usuarios: sugerencias, reportes de errores, solicitudes de funcionalidades.';
