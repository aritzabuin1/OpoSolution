-- =============================================================================
-- OPTEK Migration 016: Logros avanzados — §2.8.2
-- Autor: Claude / Aritz | Fecha: 2026-02-28
--
-- Añade 3 logros avanzados al CHECK constraint de logros
-- y actualiza check_and_grant_logros para detectarlos.
--
-- Nuevos logros:
--   500_preguntas       — 500 preguntas respondidas total
--   10_temas_completados — al menos 1 test completado en ≥10 temas distintos
--   todas_notas_sobre_7  — todos los temas con tests tienen nota media ≥70
-- =============================================================================

-- 1. Actualizar CHECK constraint de la tabla logros
--    (Recrear: no se puede ADD a un CHECK existente en Postgres, solo DROP + ADD)
ALTER TABLE public.logros
  DROP CONSTRAINT IF EXISTS logros_tipo_check;

ALTER TABLE public.logros
  ADD CONSTRAINT logros_tipo_check CHECK (tipo IN (
    'primer_test',
    'racha_3',
    'racha_7',
    'racha_30',
    '50_preguntas',
    '100_preguntas',
    '500_preguntas',
    'nota_perfecta',
    'primer_corrector',
    'todos_los_temas',
    '10_temas_completados',
    'todas_notas_sobre_7'
  ));

-- 2. Actualizar RPC check_and_grant_logros para incluir los nuevos logros
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
  v_temas_usados         INTEGER;
  v_total_temas          INTEGER;
  v_todas_sobre_7        BOOLEAN;
  v_nuevos_logros        TEXT[] := '{}';
  v_tipo                 TEXT;
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

  -- Temas únicos con ≥1 test completado
  SELECT COUNT(DISTINCT tema_id)
    INTO v_temas_usados
    FROM tests_generados
   WHERE user_id = p_user_id AND completado = true AND tema_id IS NOT NULL;

  -- Total temas de la oposición del usuario
  SELECT COALESCE(num_temas, 0)
    INTO v_total_temas
    FROM oposiciones o
    JOIN profiles p ON p.oposicion_id = o.id
   WHERE p.id = p_user_id;

  -- Todas las notas sobre 7 (≥70): todos los temas con tests tienen avg ≥70
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

  -- Verificar y conceder cada logro
  FOR v_tipo IN
    SELECT t.tipo FROM (VALUES
      ('primer_test'),
      ('racha_3'),
      ('racha_7'),
      ('racha_30'),
      ('50_preguntas'),
      ('100_preguntas'),
      ('500_preguntas'),
      ('nota_perfecta'),
      ('primer_corrector'),
      ('todos_los_temas'),
      ('10_temas_completados'),
      ('todas_notas_sobre_7')
    ) AS t(tipo)
  LOOP
    IF EXISTS (SELECT 1 FROM logros WHERE user_id = p_user_id AND tipo = v_tipo) THEN
      CONTINUE;
    END IF;

    DECLARE
      v_cumple BOOLEAN := false;
    BEGIN
      v_cumple := CASE v_tipo
        WHEN 'primer_test'          THEN v_tests_total >= 1
        WHEN 'racha_3'              THEN v_profile.racha_maxima >= 3
        WHEN 'racha_7'              THEN v_profile.racha_maxima >= 7
        WHEN 'racha_30'             THEN v_profile.racha_maxima >= 30
        WHEN '50_preguntas'         THEN v_preguntas_total >= 50
        WHEN '100_preguntas'        THEN v_preguntas_total >= 100
        WHEN '500_preguntas'        THEN v_preguntas_total >= 500
        WHEN 'nota_perfecta'        THEN v_nota_perfecta
        WHEN 'primer_corrector'     THEN EXISTS (
                                      SELECT 1 FROM desarrollos
                                       WHERE user_id = p_user_id LIMIT 1
                                    )
        WHEN 'todos_los_temas'      THEN v_total_temas > 0
                                         AND v_temas_usados >= v_total_temas
        WHEN '10_temas_completados' THEN v_temas_usados >= 10
        WHEN 'todas_notas_sobre_7'  THEN v_temas_usados >= 1 AND v_todas_sobre_7
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
