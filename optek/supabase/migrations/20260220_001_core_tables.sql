-- =============================================================================
-- OPTEK Migration 001: Tablas core
-- Autor: Claude / Aritz | Fecha: 2026-02-20
--
-- DDIA Principles aplicados:
--   Reliability    → CREATE IF NOT EXISTS, triggers con manejo de errores
--   Scalability    → Vector HNSW index (mejor que IVFFLAT para alta concurrencia)
--                    GIN index para full-text y array searches
--   Consistency    → UNIQUE constraints para prevenir duplicados en re-ejecución
--   Observability  → Campos created_at/updated_at en todas las tablas
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensiones
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ---------------------------------------------------------------------------
-- 1. oposiciones — catálogo de oposiciones disponibles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oposiciones (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      text NOT NULL,
  slug        text NOT NULL UNIQUE,  -- e.g. 'aux-admin-estado'
  descripcion text,
  num_temas   int  NOT NULL DEFAULT 0,
  activa      bool NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE oposiciones IS 'Catálogo de oposiciones disponibles en OPTEK';
COMMENT ON COLUMN oposiciones.slug IS 'Identificador URL-friendly único por oposición';

-- ---------------------------------------------------------------------------
-- 2. temas — temas del temario de cada oposición
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS temas (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  oposicion_id uuid NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  numero       int  NOT NULL,
  titulo       text NOT NULL,
  descripcion  text,
  UNIQUE (oposicion_id, numero)  -- Previene números de tema duplicados por oposición
);

COMMENT ON TABLE temas IS 'Temas del temario oficial de cada oposición';

-- ---------------------------------------------------------------------------
-- 3. profiles — perfil de usuario (extiende auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   text NOT NULL,
  full_name               text,                        -- NUNCA enviar a Claude (PII)
  oposicion_id            uuid REFERENCES oposiciones(id),
  fecha_examen            date,
  horas_diarias_estudio   int,
  -- Límites free tier
  free_tests_used         int NOT NULL DEFAULT 0 CHECK (free_tests_used >= 0),
  free_corrector_used     int NOT NULL DEFAULT 0 CHECK (free_corrector_used >= 0),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfil extendido del usuario. full_name es PII — no enviar a Claude API.';
COMMENT ON COLUMN profiles.free_tests_used IS 'Tests gratuitos usados. Máx 5. Lock por pg_advisory_xact_lock en generación.';
COMMENT ON COLUMN profiles.free_corrector_used IS 'Correcciones gratuitas usadas. Máx 2.';

-- Trigger para auto-crear profile al registrarse un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;  -- DDIA Reliability: idempotente
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- DDIA Reliability: log el error pero NO fallar el registro del usuario
  RAISE WARNING 'handle_new_user: error creando profile para %, %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 4. legislacion — artículos de leyes con verificación determinista
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legislacion (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ley_nombre                text NOT NULL,              -- e.g. 'Constitución Española'
  ley_nombre_completo       text NOT NULL,              -- Nombre oficial completo
  ley_codigo                text NOT NULL,              -- e.g. 'CE', 'LPAC', 'EBEP'
  articulo_numero           text NOT NULL,              -- e.g. '14', '53.1', '103'
  apartado                  text,                       -- e.g. 'a', 'b', NULL si no aplica
  titulo_capitulo           text NOT NULL,              -- Título o Capítulo al que pertenece
  texto_integro             text NOT NULL,              -- Texto completo del artículo/apartado
  hash_sha256               text NOT NULL,              -- SHA-256 del texto para detección de cambios
  fecha_ultima_verificacion timestamptz NOT NULL DEFAULT now(),
  tema_ids                  uuid[] NOT NULL DEFAULT '{}',  -- Temas que referencian este artículo
  activo                    bool NOT NULL DEFAULT true,
  embedding                 vector(1536),               -- OpenAI text-embedding-3-small
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),

  -- DDIA Consistency: previene duplicados si script ingesta se ejecuta 2 veces
  -- Usar ON CONFLICT (ley_codigo, articulo_numero, apartado) DO UPDATE en ingesta
  CONSTRAINT legislacion_unica UNIQUE (ley_codigo, articulo_numero, apartado)
);

COMMENT ON TABLE legislacion IS 'Artículos de legislación para verificación determinista. Usar ON CONFLICT DO UPDATE en ingesta.';
COMMENT ON COLUMN legislacion.hash_sha256 IS 'SHA-256 del texto_integro. Cambio → trigger de alerta en cambios_legislativos.';
COMMENT ON COLUMN legislacion.tema_ids IS 'Array de UUIDs de temas que referencian este artículo. Índice GIN para búsqueda eficiente.';
COMMENT ON COLUMN legislacion.embedding IS 'Vector 1536d de OpenAI text-embedding-3-small para búsqueda semántica RAG.';

DROP TRIGGER IF EXISTS legislacion_updated_at ON legislacion;
CREATE TRIGGER legislacion_updated_at
  BEFORE UPDATE ON legislacion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 5. examenes_oficiales — exámenes históricos de oposiciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS examenes_oficiales (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  oposicion_id uuid NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  anio         int  NOT NULL,
  convocatoria text NOT NULL,  -- e.g. 'ordinaria', 'libre'
  preguntas    jsonb NOT NULL DEFAULT '[]',
  UNIQUE (oposicion_id, anio, convocatoria)
);

COMMENT ON TABLE examenes_oficiales IS 'Exámenes oficiales históricos para enriquecer generación de tests';

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO (DDIA Scalability)
-- =============================================================================

-- Embedding vectorial — HNSW es mejor que IVFFLAT para:
-- · Alta concurrencia (no requiere lock exclusivo durante inserción)
-- · Consultas con filtro combinado (cosine + WHERE activo = true)
-- · Sin necesidad de pre-entrenamiento (IVFFLAT necesita datos previos)
CREATE INDEX IF NOT EXISTS idx_legislacion_embedding_hnsw
  ON legislacion USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text en español — para búsqueda léxica combinada con vector
CREATE INDEX IF NOT EXISTS idx_legislacion_fulltext
  ON legislacion USING gin(to_tsvector('spanish', texto_integro));

-- Lookups de verificación determinista (verificar cita legal en <5ms)
CREATE INDEX IF NOT EXISTS idx_legislacion_ley_art
  ON legislacion(ley_codigo, articulo_numero);

-- Búsqueda por tema (retrieveByTema en pipeline RAG)
CREATE INDEX IF NOT EXISTS idx_legislacion_temas
  ON legislacion USING gin(tema_ids);

-- Búsqueda por oposición activa
CREATE INDEX IF NOT EXISTS idx_legislacion_activo
  ON legislacion(activo) WHERE activo = true;

-- Temas por oposición
CREATE INDEX IF NOT EXISTS idx_temas_oposicion
  ON temas(oposicion_id, numero);
