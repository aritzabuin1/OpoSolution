-- Migration 078: Scoring config completo para las 3 oposiciones de seguridad
-- Incluye TODOS los ejercicios que se pueden simular digitalmente en OpoRuta.

-- ═══ ERTZAINTZA ═══
-- 5 pruebas: psicotécnicos + conocimientos + personalidad + físicas + entrevista
-- OpoRuta simula: psicotécnicos, conocimientos, personalidad, entrevista
UPDATE oposiciones
SET scoring_config = '{
  "num_opciones": 4,
  "ejercicios": [
    {
      "nombre": "Psicotécnicos de aptitudes",
      "tipo_ejercicio": "psicotecnicos",
      "preguntas": 40,
      "minutos": 45,
      "descripcion": "Razonamiento, aptitudes verbales, espaciales e interpretación de datos",
      "puntuacion_max": 120,
      "min_aprobado": 60,
      "penaliza": false,
      "simulable": true
    },
    {
      "nombre": "Conocimientos (temario)",
      "tipo_ejercicio": "conocimientos",
      "preguntas": 40,
      "preguntas_variable": true,
      "minutos": 50,
      "acierto": 3.75,
      "error": 1.25,
      "max": 150,
      "min_aprobado": 75,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "simulable": true
    },
    {
      "nombre": "Personalidad policial",
      "tipo_ejercicio": "personalidad",
      "descripcion": "Test personalidad general + conductas laborales policiales",
      "puntuacion_max": 150,
      "min_aprobado": 75,
      "simulable": true,
      "ruta_practica": "/personalidad-policial"
    },
    {
      "nombre": "Pruebas físicas",
      "tipo_ejercicio": "fisicas",
      "descripcion": "Natación 50m, press banca, circuito agilidad, course navette",
      "puntuacion_max": 80,
      "min_aprobado": 40,
      "simulable": false
    },
    {
      "nombre": "Entrevista personal",
      "tipo_ejercicio": "entrevista",
      "descripcion": "Idoneidad conductual y competencial",
      "puntuacion_max": 50,
      "min_aprobado": 25,
      "simulable": true,
      "ruta_practica": "/personalidad-policial"
    }
  ],
  "puntuacion_max_oposicion": 550,
  "fase_concurso_max": 80
}'::jsonb
WHERE slug = 'ertzaintza';

-- ═══ GUARDIA CIVIL ═══
-- Prueba teórico-práctica (140 min) + psicotécnicos (55 min) + físicas + entrevista + médico
UPDATE oposiciones
SET scoring_config = '{
  "num_opciones": 4,
  "minutos_total": 140,
  "ejercicios": [
    {
      "nombre": "Ortografía",
      "tipo_ejercicio": "ortografia",
      "preguntas": 5,
      "descripcion": "5 frases con errores. Apto/No apto (6+ errores = no apto)",
      "apto_no_apto": true,
      "simulable": true
    },
    {
      "nombre": "Gramática",
      "tipo_ejercicio": "gramatica",
      "preguntas": 5,
      "descripcion": "5 preguntas. Apto/No apto",
      "apto_no_apto": true,
      "simulable": true
    },
    {
      "nombre": "Conocimientos generales",
      "tipo_ejercicio": "conocimientos",
      "preguntas": 100,
      "reserva": 5,
      "minutos": 0,
      "acierto": 1.0,
      "error": 0.333,
      "max": 100,
      "min_aprobado": 50,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "simulable": true
    },
    {
      "nombre": "Lengua extranjera (Inglés)",
      "tipo_ejercicio": "ingles",
      "preguntas": 20,
      "reserva": 1,
      "max": 20,
      "min_aprobado": 8,
      "penaliza": true,
      "ratio_penalizacion": "1/3",
      "simulable": true
    },
    {
      "nombre": "Psicotécnicos",
      "tipo_ejercicio": "psicotecnicos",
      "preguntas": 80,
      "minutos": 55,
      "descripcion": "Aptitudes intelectuales (0-30, mín. 12) + perfil de personalidad",
      "max": 30,
      "min_aprobado": 12,
      "simulable": true
    },
    {
      "nombre": "Pruebas físicas",
      "tipo_ejercicio": "fisicas",
      "descripcion": "Circuito agilidad, carrera 2000m, flexiones, natación 50m",
      "simulable": false
    },
    {
      "nombre": "Entrevista personal",
      "tipo_ejercicio": "entrevista",
      "descripcion": "Con cuestionario BIODATA previo",
      "simulable": true,
      "ruta_practica": "/personalidad-policial"
    }
  ],
  "puntuacion_max_oposicion": 150,
  "fase_concurso_max": 45
}'::jsonb
WHERE slug = 'guardia-civil';

-- ═══ POLICÍA NACIONAL ═══
-- Oposición libre: conocimientos + físicas + médico + entrevista + psicotécnicos
UPDATE oposiciones
SET scoring_config = '{
  "num_opciones": 3,
  "ejercicios": [
    {
      "nombre": "Cuestionario de conocimientos",
      "tipo_ejercicio": "conocimientos",
      "preguntas": 100,
      "minutos": 50,
      "acierto": 0.1,
      "error": 0.05,
      "max": 10,
      "min_aprobado": 3,
      "penaliza": true,
      "ratio_penalizacion": "1/2",
      "simulable": true
    },
    {
      "nombre": "Pruebas físicas",
      "tipo_ejercicio": "fisicas",
      "descripcion": "Circuito agilidad, dominadas/suspensión, carrera resistencia",
      "simulable": false
    },
    {
      "nombre": "Entrevista personal y profesional",
      "tipo_ejercicio": "entrevista",
      "simulable": true,
      "ruta_practica": "/personalidad-policial"
    },
    {
      "nombre": "Psicotécnicos",
      "tipo_ejercicio": "psicotecnicos",
      "descripcion": "Aptitudes intelectuales + personalidad",
      "simulable": true
    }
  ],
  "puntuacion_max_oposicion": 10,
  "fase_concurso_max": 0
}'::jsonb
WHERE slug = 'policia-nacional';
