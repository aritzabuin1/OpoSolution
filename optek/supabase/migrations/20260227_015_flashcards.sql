-- =============================================================================
-- OPTEK Migration 015: §2.1.1 — Tabla flashcards
-- Autor: Claude / Aritz | Fecha: 2026-02-27
--
-- Flashcards de repaso espaciado auto-generadas desde errores de tests.
-- Algoritmo: intervalos fijos (§2.1.3 MVP simplificado: 1, 3, 7, 14, 30 días).
-- Origen: 'error_test' (auto) | 'manual' (futuro post-MVP).
--
-- §2.1.1: CREATE TABLE flashcards + RLS + índices
-- =============================================================================

CREATE TABLE IF NOT EXISTS flashcards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id         uuid REFERENCES temas(id) ON DELETE SET NULL,
  frente          text NOT NULL,
  reverso         text NOT NULL,
  cita_legal      jsonb,                    -- { ley, articulo, texto_ref }
  intervalo_dias  int NOT NULL DEFAULT 1,
  facilidad       float NOT NULL DEFAULT 2.5,
  siguiente_repaso date NOT NULL DEFAULT CURRENT_DATE,
  veces_acertada  int NOT NULL DEFAULT 0,
  veces_fallada   int NOT NULL DEFAULT 0,
  origen          text NOT NULL DEFAULT 'error_test'
                  CHECK (origen IN ('error_test', 'manual')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcards_select_own" ON flashcards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "flashcards_insert_own" ON flashcards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcards_update_own" ON flashcards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "flashcards_delete_own" ON flashcards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_flashcards_user_repaso
  ON flashcards(user_id, siguiente_repaso);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_tema
  ON flashcards(user_id, tema_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_flashcards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_flashcards_updated_at();

COMMENT ON TABLE flashcards IS
  'Flashcards de repaso espaciado auto-generadas desde errores de tests de práctica.';

COMMENT ON COLUMN flashcards.intervalo_dias IS
  'Número de días hasta el próximo repaso. Algoritmo MVP: 1→3→7→14→30.';

COMMENT ON COLUMN flashcards.siguiente_repaso IS
  'Fecha del próximo repaso (DATE). Actualizada después de cada sesión de repaso.';
