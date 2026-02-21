-- =============================================================================
-- OPTEK Migration 002: Tablas de negocio
-- Autor: Claude / Aritz | Fecha: 2026-02-20
--
-- DDIA Principles aplicados:
--   Reliability    → Idempotency keys (stripe_events_processed para deduplicación)
--   Consistency    → Advisory locks documentados para prevenir colisiones en generación
--                    UNIQUE en stripe_checkout_session_id (lost update prevention)
--   Scalability    → Índices compuestos optimizados para queries de acceso frecuente
--   Observability  → api_usage_log para tracking de coste en tiempo real
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. tests_generados — tests creados por usuarios
--
-- DDIA CRÍTICO — Prevención de colisiones en generación concurrente:
-- ─────────────────────────────────────────────────────────────────
-- Problema: dos requests simultáneos del mismo usuario pueden leer
-- free_tests_used = 4 antes de que el otro haga UPDATE → ambos pasan,
-- llegando a 6 tests gratuitos en lugar de 5.
--
-- Solución: Advisory Lock en el endpoint de generación de tests:
--
--   BEGIN;
--   -- Lock por user_id (hash como bigint para pg_advisory_xact_lock)
--   SELECT pg_advisory_xact_lock(('x' || md5(user_id::text))::bit(64)::bigint);
--
--   -- Ahora sí: leer, validar y actualizar de forma atómica
--   SELECT free_tests_used FROM profiles WHERE id = user_id FOR UPDATE;
--   IF free_tests_used >= 5 THEN RAISE EXCEPTION 'limit_reached'; END IF;
--   INSERT INTO tests_generados ...;
--   UPDATE profiles SET free_tests_used = free_tests_used + 1 WHERE id = user_id;
--   COMMIT;
--
-- El advisory lock es por user_id, por lo que usuarios distintos no se bloquean.
-- Ver implementación en: lib/ai/generate-test.ts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tests_generados (
  id                uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id           uuid    REFERENCES temas(id),       -- NULL para simulacros multi-tema
  tipo              text    NOT NULL CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores')),
  preguntas         jsonb   NOT NULL DEFAULT '[]',       -- Array de objetos Pregunta
  respuestas_usuario jsonb,                              -- NULL hasta completar el test
  puntuacion        float   CHECK (puntuacion BETWEEN 0 AND 10),
  tiempo_segundos   int,
  completado        bool    NOT NULL DEFAULT false,
  prompt_version    text    NOT NULL,                    -- Versionado de prompts para debugging
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tests_generados IS 'Tests generados por IA para cada usuario. Ver advisory lock en lib/ai/generate-test.ts';
COMMENT ON COLUMN tests_generados.prompt_version IS 'Versión del prompt usado. Permite rollback si hay regresión en calidad.';

-- ---------------------------------------------------------------------------
-- 2. preguntas_reportadas — preguntas marcadas como incorrectas por usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preguntas_reportadas (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id         uuid NOT NULL REFERENCES tests_generados(id) ON DELETE CASCADE,
  pregunta_index  int  NOT NULL,                         -- Índice en tests_generados.preguntas[]
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo          text NOT NULL,
  estado          text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'revisada', 'retirada')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. desarrollos — correcciones de desarrollos escritos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS desarrollos (
  id                uuid  PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema_id           uuid  NOT NULL REFERENCES temas(id),
  texto_usuario     text  NOT NULL,                      -- Sanitizado antes de guardar (sanitizeHtml)
  evaluacion        jsonb,                               -- CorreccionDesarrollo JSON
  citas_verificadas jsonb,                               -- Array de VerificationResult
  prompt_version    text  NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN desarrollos.texto_usuario IS 'Sanitizado con sanitizeHtml() + sanitizeUserText() antes de guardar. Ver OPTEK_security.md §1';

-- ---------------------------------------------------------------------------
-- 4. compras — registro de pagos únicos (tema/pack)
--
-- DDIA Consistency: stripe_checkout_session_id UNIQUE previene insertar la
-- misma compra dos veces si el webhook de Stripe llega duplicado (idempotency key)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id  text NOT NULL UNIQUE,      -- Idempotency key
  tipo                        text NOT NULL CHECK (tipo IN ('tema', 'pack_oposicion', 'subscription')),
  tema_id                     text,                      -- NULL para pack/subscription
  oposicion_id                text NOT NULL,
  amount_paid                 int  NOT NULL,              -- En céntimos: 499 = 4.99€
  created_at                  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE compras IS 'Pagos únicos. stripe_checkout_session_id como idempotency key contra duplicados de webhook.';

-- ---------------------------------------------------------------------------
-- 5. stripe_events_processed — deduplicación de webhooks de Stripe
--
-- DDIA Reliability: Stripe puede enviar el mismo evento 2+ veces (at-least-once).
-- Esta tabla actúa como idempotency store — insertar con ON CONFLICT DO NOTHING
-- en el webhook handler y verificar si la fila ya existía antes de procesar.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events_processed (
  id              uuid   PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id text   NOT NULL UNIQUE,                -- Idempotency key de Stripe
  event_type      text   NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE stripe_events_processed IS
  'Idempotency store para webhooks de Stripe. INSERT ON CONFLICT DO NOTHING antes de procesar cada evento.';

-- ---------------------------------------------------------------------------
-- 6. suscripciones — subscripciones recurrentes Premium
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suscripciones (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id  text NOT NULL UNIQUE,
  estado                  text NOT NULL CHECK (estado IN ('activa', 'cancelada', 'expirada')),
  fecha_inicio            timestamptz NOT NULL,
  fecha_fin               timestamptz,                   -- NULL = indefinida (hasta cancelación)
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. cambios_legislativos — audit trail de cambios en legislación
--
-- DDIA Observability: detección automática de cambios en BOE.
-- Si hash_sha256 cambia → INSERT aquí → alerta a Aritz → revisión humana
-- antes de actualizar texto en legislacion.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cambios_legislativos (
  id              uuid   PRIMARY KEY DEFAULT uuid_generate_v4(),
  legislacion_id  uuid   NOT NULL REFERENCES legislacion(id) ON DELETE CASCADE,
  texto_anterior  text   NOT NULL,
  texto_nuevo     text   NOT NULL,
  hash_anterior   text   NOT NULL,
  hash_nuevo      text   NOT NULL,
  fecha_deteccion timestamptz NOT NULL DEFAULT now(),
  tipo_cambio     text   NOT NULL,                       -- e.g. 'modificacion', 'derogacion'
  procesado       bool   NOT NULL DEFAULT false          -- false = pendiente revisión humana
);

COMMENT ON TABLE cambios_legislativos IS
  'Audit trail de cambios detectados en legislación. procesado=false = requiere revisión humana.';

-- ---------------------------------------------------------------------------
-- 8. api_usage_log — tracking de coste de API en tiempo real
--
-- DDIA Observability: INSERT tras cada llamada a Claude API.
-- Cron diario suma cost_estimated_cents → alerta si supera $10/día
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_usage_log (
  id                   uuid   PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp            timestamptz NOT NULL DEFAULT now(),
  endpoint             text   NOT NULL,                  -- e.g. 'generate-test', 'correct-desarrollo', 'verification'
  user_id              uuid   REFERENCES auth.users(id), -- NULL para operaciones de sistema
  tokens_in            int    NOT NULL DEFAULT 0,
  tokens_out           int    NOT NULL DEFAULT 0,
  cost_estimated_cents int    NOT NULL DEFAULT 0,        -- coste en céntimos de €
  model                text   NOT NULL                   -- e.g. 'claude-sonnet-4-6'
);

COMMENT ON TABLE api_usage_log IS
  'Coste de API por llamada. Cron en /api/cron/check-costs agrega y alerta si >$10/día.';

-- =============================================================================
-- ÍNDICES (DDIA Scalability)
-- =============================================================================

-- tests_generados: historial del usuario paginado (query más frecuente del dashboard)
CREATE INDEX IF NOT EXISTS idx_tests_user_date
  ON tests_generados(user_id, created_at DESC);

-- tests_generados: filtro por tipo y estado (repaso de errores)
CREATE INDEX IF NOT EXISTS idx_tests_tipo_completado
  ON tests_generados(user_id, tipo, completado);

-- compras: verificar acceso a tema por usuario
CREATE INDEX IF NOT EXISTS idx_compras_user
  ON compras(user_id);

CREATE INDEX IF NOT EXISTS idx_compras_user_tema
  ON compras(user_id, tema_id);

-- suscripciones: check de acceso activo (query en cada render del dashboard)
CREATE INDEX IF NOT EXISTS idx_suscripciones_user
  ON suscripciones(user_id, estado);

-- api_usage_log: agregación por día para cron de costes
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp
  ON api_usage_log(timestamp, endpoint);

-- cambios_legislativos: pendientes de revisión
CREATE INDEX IF NOT EXISTS idx_cambios_pendientes
  ON cambios_legislativos(procesado) WHERE procesado = false;
