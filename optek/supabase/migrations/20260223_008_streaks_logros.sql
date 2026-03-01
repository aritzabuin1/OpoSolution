-- =============================================================================
-- OPTEK Migration 008: Rachas y logros — §1.13B Gamificación básica
-- Autor: Claude / Aritz | Fecha: 2026-02-23
--
-- Añade:
--   1. Columnas racha_actual + racha_maxima a profiles
--   2. Tabla logros (achievements desbloqueados por usuario)
--   3. RPC update_streak: actualiza la racha del usuario tras completar test
--   4. RPC check_and_grant_logros: detecta y concede logros automáticamente
-- =============================================================================

-- 1. Añadir columnas de racha a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS racha_actual    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS racha_maxima    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_test_dia DATE;   -- Para detectar si ya jugó hoy

COMMENT ON COLUMN public.profiles.racha_actual  IS 'Días consecutivos con ≥1 test completado';
COMMENT ON COLUMN public.profiles.racha_maxima  IS 'Mejor racha histórica del usuario';
COMMENT ON COLUMN public.profiles.ultimo_test_dia IS 'Fecha del último día con test completado (para cálculo de racha)';

-- 2. Tabla logros
CREATE TABLE IF NOT EXISTS public.logros (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            text        NOT NULL CHECK (tipo IN (
                                'primer_test',
                                'racha_3',
                                'racha_7',
                                'racha_30',
                                '50_preguntas',
                                '100_preguntas',
                                'nota_perfecta',
                                'primer_corrector',
                                'todos_los_temas'
                              )),
  desbloqueado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)  -- Un logro solo se desbloquea una vez por usuario
);

COMMENT ON TABLE public.logros IS 'Logros/achievements desbloqueados por cada usuario';

-- RLS: cada usuario solo ve sus propios logros
ALTER TABLE public.logros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logros_select_own"
  ON public.logros FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. RPC: update_streak — actualiza racha tras completar un test
--    Lógica:
--      - Si último test fue HOY → no hacer nada (ya contado)
--      - Si último test fue AYER → racha += 1
--      - Si último test fue antes de ayer (o NULL) → racha = 1 (reinicio)
--      - Actualizar racha_maxima si procede
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ultimo_test_dia  DATE;
  v_racha_actual     INTEGER;
  v_racha_maxima     INTEGER;
  v_today            DATE := CURRENT_DATE;
  v_nueva_racha      INTEGER;
BEGIN
  SELECT ultimo_test_dia, racha_actual, racha_maxima
    INTO v_ultimo_test_dia, v_racha_actual, v_racha_maxima
    FROM profiles
   WHERE id = p_user_id;

  -- Si ya registramos un test hoy → no modificar racha
  IF v_ultimo_test_dia = v_today THEN
    RETURN;
  END IF;

  -- Calcular nueva racha
  IF v_ultimo_test_dia = v_today - INTERVAL '1 day' THEN
    -- Ayer → continúa la racha
    v_nueva_racha := v_racha_actual + 1;
  ELSE
    -- Más de 1 día de diferencia o primer test → reinicio
    v_nueva_racha := 1;
  END IF;

  UPDATE profiles
  SET
    racha_actual    = v_nueva_racha,
    racha_maxima    = GREATEST(v_racha_maxima, v_nueva_racha),
    ultimo_test_dia = v_today
  WHERE id = p_user_id;
END;
$$;

-- 4. RPC: check_and_grant_logros — concede logros si se cumplen condiciones
--    Retorna array de tipos de logros nuevamente desbloqueados (para toast en UI)
CREATE OR REPLACE FUNCTION public.check_and_grant_logros(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile          RECORD;
  v_tests_total      INTEGER;
  v_preguntas_total  BIGINT;
  v_nota_perfecta    BOOLEAN;
  v_temas_usados     INTEGER;
  v_total_temas      INTEGER;
  v_nuevos_logros    TEXT[] := '{}';
  v_tipo             TEXT;
BEGIN
  -- Cargar datos del perfil
  SELECT racha_actual, racha_maxima
    INTO v_profile
    FROM profiles
   WHERE id = p_user_id;

  -- Estadísticas de tests
  SELECT COUNT(*)
    INTO v_tests_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true;

  -- Total de preguntas respondidas
  SELECT COALESCE(SUM(jsonb_array_length(preguntas)), 0)
    INTO v_preguntas_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true;

  -- Nota perfecta (100)
  SELECT EXISTS (
    SELECT 1 FROM tests_generados
     WHERE user_id = p_user_id AND completado = true AND puntuacion = 100
  ) INTO v_nota_perfecta;

  -- Temas únicos con al menos 1 test completado
  SELECT COUNT(DISTINCT tema_id)
    INTO v_temas_usados
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tema_id IS NOT NULL;

  -- Total de temas de la oposición del usuario
  SELECT COALESCE(num_temas, 0)
    INTO v_total_temas
    FROM oposiciones o
    JOIN profiles p ON p.oposicion_id = o.id
   WHERE p.id = p_user_id;

  -- Verificar y conceder cada logro si no existe ya
  FOR v_tipo IN
    SELECT t.tipo FROM (VALUES
      ('primer_test'),
      ('racha_3'),
      ('racha_7'),
      ('racha_30'),
      ('50_preguntas'),
      ('100_preguntas'),
      ('nota_perfecta'),
      ('primer_corrector'),
      ('todos_los_temas')
    ) AS t(tipo)
  LOOP
    -- Comprobar si ya tiene este logro
    IF EXISTS (SELECT 1 FROM logros WHERE user_id = p_user_id AND tipo = v_tipo) THEN
      CONTINUE;
    END IF;

    -- Comprobar si cumple la condición
    DECLARE
      v_cumple BOOLEAN := false;
    BEGIN
      v_cumple := CASE v_tipo
        WHEN 'primer_test'      THEN v_tests_total >= 1
        WHEN 'racha_3'          THEN v_profile.racha_maxima >= 3
        WHEN 'racha_7'          THEN v_profile.racha_maxima >= 7
        WHEN 'racha_30'         THEN v_profile.racha_maxima >= 30
        WHEN '50_preguntas'     THEN v_preguntas_total >= 50
        WHEN '100_preguntas'    THEN v_preguntas_total >= 100
        WHEN 'nota_perfecta'    THEN v_nota_perfecta
        WHEN 'primer_corrector' THEN EXISTS (
                                  SELECT 1 FROM desarrollos
                                   WHERE user_id = p_user_id LIMIT 1
                                )
        WHEN 'todos_los_temas'  THEN v_total_temas > 0
                                     AND v_temas_usados >= v_total_temas
        ELSE false
      END;
    END;

    IF v_cumple THEN
      INSERT INTO logros (user_id, tipo)
      VALUES (p_user_id, v_tipo)
      ON CONFLICT (user_id, tipo) DO NOTHING;

      IF FOUND THEN
        v_nuevos_logros := array_append(v_nuevos_logros, v_tipo);
      END IF;
    END IF;
  END LOOP;

  RETURN v_nuevos_logros;

  
END;
$$;
