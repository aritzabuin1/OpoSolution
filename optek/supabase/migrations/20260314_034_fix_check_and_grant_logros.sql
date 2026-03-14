-- =============================================================================
-- Migration 034: Fix check_and_grant_logros variable scoping bug
-- Autor: Claude / Aritz | Fecha: 2026-03-14
--
-- BUG: Migration 029 declared v_cumple inside a nested DECLARE...BEGIN...END
-- block within the FOR loop. After END, v_cumple goes out of scope.
-- Line 217 tries IF v_cumple THEN → PL/pgSQL compilation error → function
-- never created → logros NEVER work.
--
-- FIX: v_cumple moved to the outer DECLARE block.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_and_grant_logros(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile              RECORD;
  v_tests_total          INTEGER;
  v_preguntas_total      BIGINT;
  v_nota_perfecta        BOOLEAN;
  v_nota_90              BOOLEAN;
  v_count_perfectos      INTEGER;
  v_temas_usados         INTEGER;
  v_total_temas          INTEGER;
  v_todas_sobre_7        BOOLEAN;
  v_simulacros_total     INTEGER;
  v_temas_bloque1        INTEGER;
  v_temas_bloque2        INTEGER;
  v_nuevos_logros        TEXT[] := '{}';
  v_tipo                 TEXT;
  v_cumple               BOOLEAN;
BEGIN
  -- Cargar datos del perfil
  SELECT racha_actual, racha_maxima
    INTO v_profile
    FROM profiles
   WHERE id = p_user_id;

  -- Tests completados
  SELECT COUNT(*)
    INTO v_tests_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true;

  -- Total preguntas respondidas
  SELECT COALESCE(SUM(jsonb_array_length(preguntas)), 0)
    INTO v_preguntas_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true;

  -- Nota perfecta (100)
  SELECT EXISTS (
    SELECT 1 FROM tests_generados
     WHERE user_id = p_user_id AND completado = true AND puntuacion = 100
  ) INTO v_nota_perfecta;

  -- Nota >=90
  SELECT EXISTS (
    SELECT 1 FROM tests_generados
     WHERE user_id = p_user_id AND completado = true AND puntuacion >= 90
  ) INTO v_nota_90;

  -- Cuantos tests perfectos
  SELECT COUNT(*)
    INTO v_count_perfectos
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND puntuacion = 100;

  -- Temas unicos con >=1 test completado
  SELECT COUNT(DISTINCT tema_id)
    INTO v_temas_usados
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tema_id IS NOT NULL;

  -- Total temas de la oposicion del usuario
  SELECT COALESCE(num_temas, 0)
    INTO v_total_temas
    FROM oposiciones o
    JOIN profiles p ON p.oposicion_id = o.id
   WHERE p.id = p_user_id;

  -- Todas las notas sobre 7 (>=70)
  SELECT COALESCE(
    (
      SELECT bool_and(avg_puntaje >= 70)
      FROM (
        SELECT AVG(puntuacion) AS avg_puntaje
        FROM tests_generados
        WHERE user_id = p_user_id
          AND completado = true
          AND tema_id IS NOT NULL
          AND puntuacion IS NOT NULL
        GROUP BY tema_id
      ) sub
    ),
    false
  ) INTO v_todas_sobre_7;

  -- Simulacros completados
  SELECT COUNT(*)
    INTO v_simulacros_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tipo = 'simulacro';

  -- Temas Bloque I (1-16) con >=1 test
  SELECT COUNT(DISTINCT t.numero)
    INTO v_temas_bloque1
    FROM tests_generados tg
    JOIN temas t ON t.id = tg.tema_id
   WHERE tg.user_id = p_user_id AND tg.completado = true AND t.numero BETWEEN 1 AND 16;

  -- Temas Bloque II (17-28) con >=1 test
  SELECT COUNT(DISTINCT t.numero)
    INTO v_temas_bloque2
    FROM tests_generados tg
    JOIN temas t ON t.id = tg.tema_id
   WHERE tg.user_id = p_user_id AND tg.completado = true AND t.numero BETWEEN 17 AND 28;

  -- Verificar y conceder cada logro
  FOR v_tipo IN
    SELECT t.tipo FROM (VALUES
      ('primer_test'),
      ('racha_3'),
      ('racha_7'),
      ('racha_14'),
      ('racha_30'),
      ('50_preguntas'),
      ('100_preguntas'),
      ('500_preguntas'),
      ('1000_preguntas'),
      ('nota_perfecta'),
      ('nota_90'),
      ('3_perfectos'),
      ('primer_corrector'),
      ('primer_simulacro'),
      ('5_simulacros'),
      ('todos_los_temas'),
      ('10_temas_completados'),
      ('todas_notas_sobre_7'),
      ('bloque1_completo'),
      ('bloque2_completo')
    ) AS t(tipo)
  LOOP
    -- Skip if already granted
    IF EXISTS (SELECT 1 FROM logros WHERE user_id = p_user_id AND tipo = v_tipo) THEN
      CONTINUE;
    END IF;

    -- Check condition
    v_cumple := CASE v_tipo
      WHEN 'primer_test'          THEN v_tests_total >= 1
      WHEN 'racha_3'              THEN v_profile.racha_maxima >= 3
      WHEN 'racha_7'              THEN v_profile.racha_maxima >= 7
      WHEN 'racha_14'             THEN v_profile.racha_maxima >= 14
      WHEN 'racha_30'             THEN v_profile.racha_maxima >= 30
      WHEN '50_preguntas'         THEN v_preguntas_total >= 50
      WHEN '100_preguntas'        THEN v_preguntas_total >= 100
      WHEN '500_preguntas'        THEN v_preguntas_total >= 500
      WHEN '1000_preguntas'       THEN v_preguntas_total >= 1000
      WHEN 'nota_perfecta'        THEN v_nota_perfecta
      WHEN 'nota_90'              THEN v_nota_90
      WHEN '3_perfectos'          THEN v_count_perfectos >= 3
      WHEN 'primer_corrector'     THEN EXISTS (
                                    SELECT 1 FROM desarrollos
                                     WHERE user_id = p_user_id LIMIT 1
                                  )
      WHEN 'primer_simulacro'     THEN v_simulacros_total >= 1
      WHEN '5_simulacros'         THEN v_simulacros_total >= 5
      WHEN 'todos_los_temas'      THEN v_total_temas > 0
                                       AND v_temas_usados >= v_total_temas
      WHEN '10_temas_completados' THEN v_temas_usados >= 10
      WHEN 'todas_notas_sobre_7'  THEN v_temas_usados >= 1 AND v_todas_sobre_7
      WHEN 'bloque1_completo'     THEN v_temas_bloque1 >= 16
      WHEN 'bloque2_completo'     THEN v_temas_bloque2 >= 12
      ELSE false
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
