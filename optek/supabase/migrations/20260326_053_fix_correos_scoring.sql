-- Fix scoring_config de Correos (migration 048)
-- Fuentes: BOE-A-2023-126, CSIF bases definitivas 7.757 plazas, OpositaTest, MAD editorial
--
-- Discrepancias corregidas:
-- 1. reserva: 0 → 10 (cuadernillo real = 110 preguntas: 100 puntuables + 10 reserva)
-- 2. min_aprobado: null → objeto con umbrales por puesto (55 Reparto, 60 ATC)

UPDATE oposiciones SET
  scoring_config = '{
    "ejercicios": [{
      "nombre": "Test",
      "preguntas": 100,
      "preguntas_temario": 90,
      "preguntas_psicotecnicos": 10,
      "reserva": 10,
      "minutos": 110,
      "acierto": 0.60,
      "error": 0,
      "max": 60,
      "min_aprobado": {"reparto": 33, "atc": 36},
      "min_aprobado_preguntas": {"reparto": 55, "atc": 60},
      "penaliza": false
    }],
    "sistema": "concurso-oposicion",
    "meritos_max": 40
  }'::jsonb
WHERE slug = 'correos';
