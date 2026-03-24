-- Migration 045: Question banks for free tier + progressive premium
-- Free bank: fixed 10 questions/tema, identical for all free users
-- Premium bank: grows with usage, dedup, cost → €0

-- ─── Free Question Bank ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS free_question_bank (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id uuid NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  tema_id      uuid NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  tema_numero  int NOT NULL,
  preguntas    jsonb NOT NULL,  -- array of 10 questions (same schema as generate-test output)
  validated    boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (oposicion_id, tema_id)
);

ALTER TABLE free_question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read free bank"
  ON free_question_bank FOR SELECT TO authenticated USING (true);

-- ─── Premium Question Bank ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS question_bank (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id    uuid NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  tema_id         uuid NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  dificultad      text NOT NULL CHECK (dificultad IN ('facil','media','dificil')),
  enunciado       text NOT NULL,
  opciones        jsonb NOT NULL,
  correcta        char(1) NOT NULL CHECK (correcta IN ('a','b','c','d')),
  explicacion     text,
  cita_ley        text,
  cita_articulo   text,
  -- Dedup fields
  enunciado_hash  text NOT NULL,
  legal_key       text,
  -- Metrics
  times_served    int DEFAULT 0,
  correct_count   int DEFAULT 0,
  error_reports   int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT unique_enunciado_hash UNIQUE (enunciado_hash)
);

CREATE INDEX idx_qbank_tema ON question_bank (oposicion_id, tema_id, dificultad);
CREATE INDEX idx_qbank_legal ON question_bank (legal_key) WHERE legal_key IS NOT NULL;

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read question bank"
  ON question_bank FOR SELECT TO authenticated USING (true);

-- ─── User Questions Seen (tracking) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_questions_seen (
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  answered_correctly boolean,
  seen_at         timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_uqs_user ON user_questions_seen (user_id);

ALTER TABLE user_questions_seen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own question history"
  ON user_questions_seen FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own question history"
  ON user_questions_seen FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Optimized index for free tier gating ────────────────────────────────────
-- Used by canTakeFreeTemaTest(): check if user already completed a test for a tema

CREATE INDEX IF NOT EXISTS idx_tests_free_tema
  ON tests_generados (user_id, tema_id)
  WHERE completado = true AND tema_id IS NOT NULL;
