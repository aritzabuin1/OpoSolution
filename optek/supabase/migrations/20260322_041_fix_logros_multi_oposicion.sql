-- =============================================================================
-- OPTEK Migration 041: Fix check_and_grant_logros for multi-oposición
-- Autor: Claude / Aritz | Fecha: 2026-03-22
--
-- BUG: bloque1_completo used BETWEEN 1 AND 16 (C2 only), wrong for C1/A2.
-- FIX: Use temas.bloque field to count per-bloque completion dynamically.
-- Also scopes tests query by user's oposicion_id.
-- =============================================================================

CREATE OR REPLACE FUNCTION check_and_grant_logros(p_user_id UUID)
RETURNS SETOF logros
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tipo TEXT;
  v_cumple BOOLEAN;
  v_racha INT;
  v_total_tests INT;
  v_preguntas_total INT;
  v_nota_perfecta BOOLEAN;
  v_nota_90 BOOLEAN;
  v_count_perfectos INT;
  v_simulacros_total INT;
  v_total_temas INT;
  v_temas_usados INT;
  v_todas_sobre_7 BOOLEAN;
  v_temas_bloque1 INT;
  v_temas_bloque2 INT;
  v_total_bloque1 INT;
  v_total_bloque2 INT;
  v_user_oposicion_id UUID;
BEGIN
  -- Get user's active oposicion
  SELECT oposicion_id INTO v_user_oposicion_id
    FROM profiles WHERE id = p_user_id;

  -- Racha actual
  SELECT COALESCE(racha_actual, 0) INTO v_racha
    FROM profiles WHERE id = p_user_id;

  -- Total tests completados (scoped by oposicion)
  SELECT COUNT(*) INTO v_total_tests
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true
     AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL);

  -- Total preguntas respondidas
  SELECT COALESCE(SUM(jsonb_array_length(preguntas)), 0) INTO v_preguntas_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true
     AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL);

  -- Nota perfecta (100%)
  SELECT EXISTS(
    SELECT 1 FROM tests_generados
     WHERE user_id = p_user_id AND completado = true AND puntuacion = 100
       AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL)
  ) INTO v_nota_perfecta;

  -- Nota >= 90%
  SELECT EXISTS(
    SELECT 1 FROM tests_generados
     WHERE user_id = p_user_id AND completado = true AND puntuacion >= 90
       AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL)
  ) INTO v_nota_90;

  -- Tests con 100% (count)
  SELECT COUNT(*) INTO v_count_perfectos
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND puntuacion = 100
     AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL);

  -- Temas totales de la oposición del usuario
  SELECT COUNT(*) INTO v_total_temas
    FROM temas WHERE oposicion_id = v_user_oposicion_id;

  -- Temas distintos usados
  SELECT COUNT(DISTINCT tema_id) INTO v_temas_usados
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tema_id IS NOT NULL
     AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL);

  -- Todos los temas con nota >= 7
  SELECT NOT EXISTS(
    SELECT 1 FROM temas t
     WHERE t.oposicion_id = v_user_oposicion_id
       AND NOT EXISTS (
         SELECT 1 FROM tests_generados tg
          WHERE tg.tema_id = t.id AND tg.user_id = p_user_id
            AND tg.completado = true AND tg.puntuacion >= 70
       )
  ) INTO v_todas_sobre_7;

  -- Simulacros completados
  SELECT COUNT(*) INTO v_simulacros_total
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tipo = 'simulacro'
     AND (oposicion_id = v_user_oposicion_id OR oposicion_id IS NULL);

  -- Temas Bloque I completados (using bloque field, NOT hardcoded numbers)
  SELECT COUNT(*) INTO v_total_bloque1
    FROM temas WHERE oposicion_id = v_user_oposicion_id AND bloque = 'I';

  SELECT COUNT(DISTINCT t.id) INTO v_temas_bloque1
    FROM tests_generados tg
    JOIN temas t ON t.id = tg.tema_id
   WHERE tg.user_id = p_user_id AND tg.completado = true AND t.bloque = 'I'
     AND t.oposicion_id = v_user_oposicion_id;

  -- Temas Bloque II completados
  SELECT COUNT(*) INTO v_total_bloque2
    FROM temas WHERE oposicion_id = v_user_oposicion_id AND bloque = 'II';

  SELECT COUNT(DISTINCT t.id) INTO v_temas_bloque2
    FROM tests_generados tg
    JOIN temas t ON t.id = tg.tema_id
   WHERE tg.user_id = p_user_id AND tg.completado = true AND t.bloque = 'II'
     AND t.oposicion_id = v_user_oposicion_id;

  -- Verificar y conceder cada logro
  FOR v_tipo IN
    SELECT t.tipo FROM (VALUES
      ('primer_test'),
      ('racha_3'),
      ('racha_7'),
      ('racha_14'),
      ('racha_30'),
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
    v_cumple := CASE v_tipo
      WHEN 'primer_test'           THEN v_total_tests >= 1
      WHEN 'racha_3'               THEN v_racha >= 3
      WHEN 'racha_7'               THEN v_racha >= 7
      WHEN 'racha_14'              THEN v_racha >= 14
      WHEN 'racha_30'              THEN v_racha >= 30
      WHEN '100_preguntas'         THEN v_preguntas_total >= 100
      WHEN '500_preguntas'         THEN v_preguntas_total >= 500
      WHEN '1000_preguntas'        THEN v_preguntas_total >= 1000
      WHEN 'nota_perfecta'         THEN v_nota_perfecta
      WHEN 'nota_90'               THEN v_nota_90
      WHEN '3_perfectos'           THEN v_count_perfectos >= 3
      WHEN 'primer_corrector'      THEN EXISTS (
                                     SELECT 1 FROM desarrollos
                                      WHERE user_id = p_user_id LIMIT 1
                                   )
      WHEN 'primer_simulacro'      THEN v_simulacros_total >= 1
      WHEN '5_simulacros'          THEN v_simulacros_total >= 5
      WHEN 'todos_los_temas'       THEN v_total_temas > 0
                                        AND v_temas_usados >= v_total_temas
      WHEN '10_temas_completados'  THEN v_temas_usados >= 10
      WHEN 'todas_notas_sobre_7'   THEN v_temas_usados >= 1 AND v_todas_sobre_7
      WHEN 'bloque1_completo'      THEN v_total_bloque1 > 0
                                        AND v_temas_bloque1 >= v_total_bloque1
      WHEN 'bloque2_completo'      THEN v_total_bloque2 > 0
                                        AND v_temas_bloque2 >= v_total_bloque2
      ELSE false
    END;

    IF v_cumple THEN
      INSERT INTO logros (user_id, tipo)
      VALUES (p_user_id, v_tipo)
      ON CONFLICT (user_id, tipo) DO NOTHING;

      IF FOUND THEN
        RETURN QUERY SELECT * FROM logros
         WHERE user_id = p_user_id AND tipo = v_tipo;
      END IF;
    END IF;
  END LOOP;

  RETURN;
END;
$$;
