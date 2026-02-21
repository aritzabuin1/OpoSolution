-- =============================================================================
-- OPTEK Migration 003: Row Level Security (RLS)
-- Autor: Claude / Aritz | Fecha: 2026-02-20
--
-- DDIA Consistency: RLS garantiza aislamiento de datos por usuario a nivel BD.
-- Incluso si hay un bug en la aplicación, la BD no filtrará datos entre usuarios.
--
-- Principio: least privilege — cada tabla solo permite lo mínimo necesario.
-- Las operaciones de servidor usan service_role (bypass RLS explícito).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles — usuario solo puede ver/editar su propio perfil
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT lo hace el trigger handle_new_user con SECURITY DEFINER — no necesita política
-- UPDATE de free_tests_used lo hace el server con service_role — no necesita política RLS

-- ---------------------------------------------------------------------------
-- 2. tests_generados — usuario solo ve sus propios tests
-- ---------------------------------------------------------------------------
ALTER TABLE tests_generados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tests_select_own" ON tests_generados;
CREATE POLICY "tests_select_own"
  ON tests_generados FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tests_insert_own" ON tests_generados;
CREATE POLICY "tests_insert_own"
  ON tests_generados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE: solo server con service_role (para correcciones y admin)

-- ---------------------------------------------------------------------------
-- 3. desarrollos — usuario solo ve sus propios desarrollos
-- ---------------------------------------------------------------------------
ALTER TABLE desarrollos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "desarrollos_select_own" ON desarrollos;
CREATE POLICY "desarrollos_select_own"
  ON desarrollos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "desarrollos_insert_own" ON desarrollos;
CREATE POLICY "desarrollos_insert_own"
  ON desarrollos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. compras — usuario puede VER sus compras, SOLO server puede INSERTAR
-- ---------------------------------------------------------------------------
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compras_select_own" ON compras;
CREATE POLICY "compras_select_own"
  ON compras FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: solo service_role (webhook de Stripe) — no hay política para INSERT client-side

-- ---------------------------------------------------------------------------
-- 5. suscripciones — usuario solo puede ver sus suscripciones
-- ---------------------------------------------------------------------------
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suscripciones_select_own" ON suscripciones;
CREATE POLICY "suscripciones_select_own"
  ON suscripciones FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE: solo service_role (webhook de Stripe)

-- ---------------------------------------------------------------------------
-- 6. preguntas_reportadas — usuario puede insertar sus reports, admins ven todo
-- ---------------------------------------------------------------------------
ALTER TABLE preguntas_reportadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reportadas_insert_own" ON preguntas_reportadas;
CREATE POLICY "reportadas_insert_own"
  ON preguntas_reportadas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reportadas_select_own" ON preguntas_reportadas;
CREATE POLICY "reportadas_select_own"
  ON preguntas_reportadas FOR SELECT
  USING (auth.uid() = user_id);
-- SELECT para admins: usar service_role en panel admin (bypass RLS)

-- ---------------------------------------------------------------------------
-- 7. Tablas públicas (lectura para usuarios autenticados, sin RLS restrictivo)
-- oposiciones, temas, legislacion — datos de referencia, no PII
-- ---------------------------------------------------------------------------
ALTER TABLE oposiciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oposiciones_select_authenticated" ON oposiciones;
CREATE POLICY "oposiciones_select_authenticated"
  ON oposiciones FOR SELECT
  TO authenticated
  USING (activa = true);

ALTER TABLE temas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "temas_select_authenticated" ON temas;
CREATE POLICY "temas_select_authenticated"
  ON temas FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE legislacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "legislacion_select_authenticated" ON legislacion;
CREATE POLICY "legislacion_select_authenticated"
  ON legislacion FOR SELECT
  TO authenticated
  USING (activo = true);

-- ---------------------------------------------------------------------------
-- 8. Tablas internas — solo service_role (sin acceso client-side)
-- ---------------------------------------------------------------------------
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas → solo service_role puede acceder (comportamiento por defecto con RLS)

ALTER TABLE stripe_events_processed ENABLE ROW LEVEL SECURITY;
-- Sin políticas → solo service_role

ALTER TABLE cambios_legislativos ENABLE ROW LEVEL SECURITY;
-- Sin políticas → solo service_role

ALTER TABLE examenes_oficiales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "examenes_select_authenticated" ON examenes_oficiales;
CREATE POLICY "examenes_select_authenticated"
  ON examenes_oficiales FOR SELECT
  TO authenticated
  USING (true);
