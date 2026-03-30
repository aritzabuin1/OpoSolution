-- =============================================================================
-- Migration 065: FIX Hacienda + Penitenciarias — datos incorrectos en 064
-- Autor: Claude / Aritz | Fecha: 2026-03-30
--
-- HACIENDA:
--   - Ejercicio 2 es DESARROLLO ESCRITO (no tipo test) → supuesto_practico = true
--   - Scoring ej.2: 0-30, mín 15, 2h30min (no 0-10 mín 5)
--   - Plazas: 1000 libre (correcto), históricas: 851/823/787
--   - BOE nº 314 (no 313), resolución 22 dic (no 20)
--
-- PENITENCIARIAS:
--   - Ejercicio 1: 120 preguntas (no 150), scoring 0-20 mín 10, 1h45min
--   - Ejercicio 2: 8×5=40 preguntas (no 50), scoring 0-20 mín 10, 1h20min
--   - Temas 35, 38-47: títulos oficiales del BOE (12 temas estaban incorrectos)
--
-- Fuentes: BOE-A-2025-27056 (Hacienda), BOE-A-2025-20101 (IIPP)
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX HACIENDA: ej.2 = desarrollo escrito, scoring 0-30, supuesto_practico=true
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE oposiciones SET
  features = '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": true, "ofimatica": false}'::jsonb,
  scoring_config = '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 80, "reserva": 0, "minutos": 90, "acierto": 0.125, "error": 0.03125, "max": 10, "min_aprobado": 5, "penaliza": true, "ratio_penalizacion": "1/4"},
      {"nombre": "Supuestos prácticos", "preguntas": 10, "reserva": 0, "minutos": 150, "acierto": 3.0, "error": 0, "max": 30, "min_aprobado": 15, "penaliza": false, "tipo": "tribunal"}
    ]
  }'::jsonb
WHERE slug = 'hacienda-aeat';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PENITENCIARIAS: 120+40 preguntas, scoring 0-20 + 0-20
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE oposiciones SET
  scoring_config = '{
    "ejercicios": [
      {"nombre": "Cuestionario", "preguntas": 120, "reserva": 3, "minutos": 105, "acierto": 0.1667, "error": 0.0556, "max": 20, "min_aprobado": 10, "penaliza": true, "ratio_penalizacion": "1/3"},
      {"nombre": "Supuestos prácticos", "preguntas": 40, "reserva": 0, "minutos": 80, "acierto": 0.50, "error": 0.1667, "max": 20, "min_aprobado": 10, "penaliza": true, "ratio_penalizacion": "1/3"}
    ]
  }'::jsonb
WHERE slug = 'penitenciarias';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX PENITENCIARIAS: temas 34-47 títulos oficiales BOE-A-2025-20101
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE temas SET
  titulo = 'Clasificación de establecimientos y régimen ordinario',
  descripcion = 'Tipos de establecimientos penitenciarios y sus características. El régimen ordinario.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 34;

UPDATE temas SET
  titulo = 'El régimen cerrado y el régimen abierto',
  descripcion = 'Objetivos y criterios de aplicación del régimen cerrado y del régimen abierto.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 35;

UPDATE temas SET
  titulo = 'La relación laboral en el medio penitenciario',
  descripcion = 'Características de la relación laboral penitenciaria. Los distintos tipos de trabajo productivo y ocupacional.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 38;

UPDATE temas SET
  titulo = 'Los permisos de salida',
  descripcion = 'Concepto y naturaleza. Clases de permisos: ordinarios y extraordinarios. Duración y requisitos.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 39;

UPDATE temas SET
  titulo = 'Libertad y excarcelación',
  descripcion = 'Libertad y excarcelación en sus distintas formas. Suspensión de la ejecución y libertad condicional.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 40;

UPDATE temas SET
  titulo = 'Formas especiales de ejecución de la pena de prisión',
  descripcion = 'Modos de internamiento. Departamentos de jóvenes, madres. Centros de Inserción Social. Unidades dependientes.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 41;

UPDATE temas SET
  titulo = 'El régimen disciplinario',
  descripcion = 'Principios generales y ámbito de aplicación. Faltas, sanciones, ejecución y cancelación.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 42;

UPDATE temas SET
  titulo = 'El control de la actividad penitenciaria por el Juez de Vigilancia',
  descripcion = 'Competencias y funciones del Juez de Vigilancia Penitenciaria.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 43;

UPDATE temas SET
  titulo = 'El modelo organizativo penitenciario',
  descripcion = 'Estructura y régimen jurídico. Órganos colegiados y unipersonales.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 44;

UPDATE temas SET
  titulo = 'El régimen administrativo (1)',
  descripcion = 'La oficina de gestión penitenciaria. El expediente personal del interno.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 45;

UPDATE temas SET
  titulo = 'El régimen administrativo (2)',
  descripcion = 'Funcionamiento administrativo de la oficina de servicio interior.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 46;

UPDATE temas SET
  titulo = 'El régimen económico de los Establecimientos Penitenciarios',
  descripcion = 'Contabilidad general. Presupuesto del centro. Peculio de los internos.'
WHERE oposicion_id = 'f1000000-0000-0000-0000-000000000001' AND numero = 47;
