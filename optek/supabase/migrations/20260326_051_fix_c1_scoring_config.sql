-- §BUG-SP5: Fix scoring_config C1 Administrativo del Estado
-- Migration 047 tenía 1 ejercicio (100q, 90min). Real (verificado contra PDF INAP 2024):
-- - Ejercicio único, 2 partes eliminatorias, 100 minutos total
-- - Parte 1: Cuestionario 70 preguntas (40 legislación + 30 ofimática), 0-50 pts, min 25
-- - Parte 2: Supuesto práctico 20 preguntas (bloques II,III,IV,V), 0-50 pts, min 25
-- - Penalización: -1/3 en ambas partes
-- - Las 2 partes tienen valor por pregunta distinto: 50/70=0.714 vs 50/20=2.50

UPDATE oposiciones SET
  scoring_config = '{
    "ejercicios": [
      {
        "nombre": "Cuestionario",
        "preguntas": 70,
        "minutos": null,
        "acierto": 0.714,
        "error": 0.238,
        "max": 50,
        "min_aprobado": 25,
        "penaliza": true
      },
      {
        "nombre": "Supuesto práctico",
        "preguntas": 20,
        "minutos": null,
        "acierto": 2.50,
        "error": 0.833,
        "max": 50,
        "min_aprobado": 25,
        "penaliza": true
      }
    ],
    "minutos_total": 100
  }'::jsonb
WHERE slug = 'administrativo-estado';
