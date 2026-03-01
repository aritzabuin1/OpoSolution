-- =============================================================================
-- OPTEK Migration 016 ROLLBACK: Logros avanzados — §2.8.2
-- =============================================================================

-- Revertir CHECK constraint (eliminar los 3 nuevos logros)
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
    'nota_perfecta',
    'primer_corrector',
    'todos_los_temas'
  ));

-- Eliminar logros avanzados de usuarios si existen
DELETE FROM public.logros
WHERE tipo IN ('500_preguntas', '10_temas_completados', 'todas_notas_sobre_7');

-- Restaurar RPC original (sin los nuevos logros)
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
  SELECT racha_actual, racha_maxima INTO v_profile FROM profiles WHERE id = p_user_id;
  SELECT COUNT(*) INTO v_tests_total FROM tests_generados WHERE user_id = p_user_id AND completado = true;
  SELECT COALESCE(SUM(jsonb_array_length(preguntas)), 0) INTO v_preguntas_total FROM tests_generados WHERE user_id = p_user_id AND completado = true;
  SELECT EXISTS (SELECT 1 FROM tests_generados WHERE user_id = p_user_id AND completado = true AND puntuacion = 100) INTO v_nota_perfecta;
  SELECT COUNT(DISTINCT tema_id) INTO v_temas_usados FROM tests_generados WHERE user_id = p_user_id AND completado = true AND tema_id IS NOT NULL;
  SELECT COALESCE(num_temas, 0) INTO v_total_temas FROM oposiciones o JOIN profiles p ON p.oposicion_id = o.id WHERE p.id = p_user_id;

  FOR v_tipo IN SELECT t.tipo FROM (VALUES ('primer_test'),('racha_3'),('racha_7'),('racha_30'),('50_preguntas'),('100_preguntas'),('nota_perfecta'),('primer_corrector'),('todos_los_temas')) AS t(tipo) LOOP
    IF EXISTS (SELECT 1 FROM logros WHERE user_id = p_user_id AND tipo = v_tipo) THEN CONTINUE; END IF;
    DECLARE v_cumple BOOLEAN := false;
    BEGIN
      v_cumple := CASE v_tipo
        WHEN 'primer_test' THEN v_tests_total >= 1
        WHEN 'racha_3' THEN v_profile.racha_maxima >= 3
        WHEN 'racha_7' THEN v_profile.racha_maxima >= 7
        WHEN 'racha_30' THEN v_profile.racha_maxima >= 30
        WHEN '50_preguntas' THEN v_preguntas_total >= 50
        WHEN '100_preguntas' THEN v_preguntas_total >= 100
        WHEN 'nota_perfecta' THEN v_nota_perfecta
        WHEN 'primer_corrector' THEN EXISTS (SELECT 1 FROM desarrollos WHERE user_id = p_user_id LIMIT 1)
        WHEN 'todos_los_temas' THEN v_total_temas > 0 AND v_temas_usados >= v_total_temas
        ELSE false
      END;
    END;
    IF v_cumple THEN
      INSERT INTO logros (user_id, tipo) VALUES (p_user_id, v_tipo) ON CONFLICT (user_id, tipo) DO NOTHING;
      IF FOUND THEN v_nuevos_logros := array_append(v_nuevos_logros, v_tipo); END IF;
    END IF;
  END LOOP;
  RETURN v_nuevos_logros;
END;
$$;
