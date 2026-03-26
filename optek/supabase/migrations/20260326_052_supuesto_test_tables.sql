-- §FASE 2.5a: Tablas para supuesto práctico tipo test (módulo genérico)
-- Soporta AGE C1, Auxilio C2, Tramitación C1, Gestión Procesal A2

-- ─── 1. free_supuesto_bank (free tier — 1 supuesto fijo por oposición) ───────

CREATE TABLE IF NOT EXISTS free_supuesto_bank (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id  uuid NOT NULL REFERENCES oposiciones(id),
  caso          jsonb NOT NULL,     -- {titulo, escenario, bloques_cubiertos}
  preguntas     jsonb NOT NULL,     -- Pregunta[] (20 preguntas, mismo schema)
  es_oficial    boolean DEFAULT false,
  fuente        text,               -- 'INAP-2024-ADVO-L-ModeloA-SupuestoI'
  created_at    timestamptz DEFAULT now(),
  UNIQUE (oposicion_id)             -- Solo 1 por oposición (free = todos ven el mismo)
);

-- ─── 2. supuesto_bank (premium tier — banco progresivo) ─────────────────────

CREATE TABLE IF NOT EXISTS supuesto_bank (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id   uuid NOT NULL REFERENCES oposiciones(id),
  caso           jsonb NOT NULL,     -- {titulo, escenario, bloques_cubiertos}
  preguntas      jsonb NOT NULL,     -- Pregunta[] (20 preguntas)
  es_oficial     boolean DEFAULT false,
  fuente         text,               -- 'ai-supuesto-c1-1.0' | 'INAP-2024-...'
  times_served   int DEFAULT 0,
  avg_score      numeric(4,1),
  error_reports  int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sbank_opo ON supuesto_bank (oposicion_id);

-- ─── 3. user_supuestos_seen (tracking qué supuestos ha visto cada usuario) ──

CREATE TABLE IF NOT EXISTS user_supuestos_seen (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supuesto_id  uuid NOT NULL REFERENCES supuesto_bank(id) ON DELETE CASCADE,
  score        numeric(4,1),
  seen_at      timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, supuesto_id)
);

-- ─── 4. tests_generados: añadir tipo 'supuesto_test' + columna supuesto_caso ─

-- Ampliar check constraint para incluir supuesto_test
ALTER TABLE tests_generados DROP CONSTRAINT IF EXISTS tests_generados_tipo_check;
ALTER TABLE tests_generados ADD CONSTRAINT tests_generados_tipo_check
  CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores', 'psicotecnico', 'supuesto_test'));

-- Columna para caso del supuesto (NULL para otros tipos de test)
ALTER TABLE tests_generados ADD COLUMN IF NOT EXISTS supuesto_caso jsonb;
-- Contiene: {titulo, escenario, bloques_cubiertos} — solo cuando tipo='supuesto_test'

-- ─── 5. RLS policies ────────────────────────────────────────────────────────

ALTER TABLE free_supuesto_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE supuesto_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supuestos_seen ENABLE ROW LEVEL SECURITY;

-- free_supuesto_bank: lectura pública (todos pueden ver el supuesto free)
CREATE POLICY "free_supuesto_bank_select" ON free_supuesto_bank
  FOR SELECT USING (true);

-- supuesto_bank: solo lectura autenticada
CREATE POLICY "supuesto_bank_select" ON supuesto_bank
  FOR SELECT TO authenticated USING (true);

-- user_supuestos_seen: cada usuario solo ve/escribe sus registros
CREATE POLICY "user_supuestos_seen_select" ON user_supuestos_seen
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_supuestos_seen_insert" ON user_supuestos_seen
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
