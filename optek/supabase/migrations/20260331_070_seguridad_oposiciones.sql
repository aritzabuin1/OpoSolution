-- =============================================================================
-- Migration 070: Rama Seguridad — Ertzaintza + Guardia Civil + Policía Nacional
-- Autor: Claude / Aritz | Fecha: 2026-03-31
--
-- Fuentes:
--   Ertzaintza: BOPV nº 226, 24/11/2025 (Promoción 35). 54 temas, 11 bloques.
--   Guardia Civil: BOE-A-2025-10521. 25 temas, 3 bloques (A/B/C).
--   Policía Nacional: BOE-A-2025-16610. 45 temas, 3 bloques (I/II/III).
--
-- Display name de la rama: "Fuerzas y Cuerpos de Seguridad" (FCS, no FCSE,
-- porque Ertzaintza es policía autonómica, no FCSE).
--
-- activa = false → no visible hasta free bank + legislación + Stripe listos.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- ERTZAINTZA — Agente Escala Básica (C1) — 54 temas, 1 ejercicio test
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'ab000000-0000-0000-0000-000000000001',
  'Agente de la Ertzaintza (C1)',
  'ertzaintza',
  'Escala Básica del Cuerpo de la Ertzaintza - Policía del País Vasco. 54 temas en 11 bloques. Prueba de conocimientos tipo test con número variable de preguntas (decide el tribunal).',
  54,
  false,
  '{"psicotecnicos": false, "cazatrampas": false, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'seguridad',
  'C1',
  1,
  400,
  '2027-06-01',
  '{
    "num_opciones": 4,
    "ejercicios": [{
      "nombre": "Prueba conocimientos",
      "preguntas": 40,
      "preguntas_variable": true,
      "reserva": 0,
      "minutos": 50,
      "acierto": 3.75,
      "error": 1.25,
      "max": 150,
      "min_aprobado": 75,
      "penaliza": true,
      "ratio_penalizacion": "1/3"
    }]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Ertzaintza: 54 temas, 11 bloques
INSERT INTO temas (oposicion_id, numero, titulo, descripcion, bloque) VALUES
  -- Bloque I — Derechos de la Ciudadanía (temas 1–5)
  ('ab000000-0000-0000-0000-000000000001', 1, 'Derechos humanos', 'Aspectos generales de los DDHH. Declaración Universal de DDHH. Sistema Europeo de Protección de los DDHH.', 'I'),
  ('ab000000-0000-0000-0000-000000000001', 2, 'Derechos y libertades en la Constitución', 'Derechos fundamentales y Libertades Públicas. Garantías de las libertades y derechos fundamentales.', 'I'),
  ('ab000000-0000-0000-0000-000000000001', 3, 'DL 1/2023 Igualdad de Mujeres y Hombres (I)', 'Decreto Legislativo 1/2023, texto refundido de la Ley para la Igualdad de Mujeres y Hombres y Vidas Libres de Violencia Machista: Título Preliminar.', 'I'),
  ('ab000000-0000-0000-0000-000000000001', 4, 'DL 1/2023 Igualdad de Mujeres y Hombres (II)', 'Título I, Título II, Título III del DL 1/2023.', 'I'),
  ('ab000000-0000-0000-0000-000000000001', 5, 'DL 1/2023 Igualdad de Mujeres y Hombres (III)', 'Título IV, Título V del DL 1/2023.', 'I'),
  -- Bloque II — Organización Político-Administrativa (temas 6–10)
  ('ab000000-0000-0000-0000-000000000001', 6, 'La Constitución española', 'Estructura, principios generales de la CE 1978.', 'II'),
  ('ab000000-0000-0000-0000-000000000001', 7, 'La Corona, las Cortes Generales, el Gobierno', 'Instituciones del Estado: Corona, Cortes Generales y Gobierno.', 'II'),
  ('ab000000-0000-0000-0000-000000000001', 8, 'El Poder Judicial, el Tribunal Constitucional', 'Organización del Poder Judicial y funciones del Tribunal Constitucional.', 'II'),
  ('ab000000-0000-0000-0000-000000000001', 9, 'El Estatuto de Autonomía del País Vasco', 'Estatuto de Gernika (LO 3/1979). Instituciones de la CAV: Parlamento Vasco, Gobierno Vasco, Lehendakari.', 'II'),
  ('ab000000-0000-0000-0000-000000000001', 10, 'Organización territorial', 'Territorios Históricos, municipios, administración local del País Vasco.', 'II'),
  -- Bloque III — Fuentes del Derecho y Procedimiento Administrativo (temas 11–14)
  ('ab000000-0000-0000-0000-000000000001', 11, 'Las fuentes del derecho administrativo', 'Jerarquía normativa. La Ley. El Reglamento. Otras fuentes.', 'III'),
  ('ab000000-0000-0000-0000-000000000001', 12, 'Ley 39/2015 LPAC (I)', 'Interesados en el procedimiento. El acto administrativo: concepto, clases, eficacia y validez.', 'III'),
  ('ab000000-0000-0000-0000-000000000001', 13, 'Ley 39/2015 LPAC (II)', 'Fases del procedimiento administrativo. Revisión de actos en vía administrativa.', 'III'),
  ('ab000000-0000-0000-0000-000000000001', 14, 'Ley 40/2015 LRJSP', 'Principios de la organización administrativa. Funcionamiento de los órganos colegiados.', 'III'),
  -- Bloque IV — Derecho Penal. Parte General (temas 15–21)
  ('ab000000-0000-0000-0000-000000000001', 15, 'Principios generales del Derecho Penal', 'Concepto, fuentes y principios del Derecho Penal.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 16, 'La infracción penal', 'Delito y falta. Concepto, elementos, grados de ejecución.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 17, 'Circunstancias modificativas', 'Circunstancias atenuantes, agravantes y mixtas de la responsabilidad criminal.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 18, 'Las penas', 'Concepto y clasificación de las penas. Formas sustitutivas de ejecución.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 19, 'Delitos contra la vida y la integridad física', 'Homicidio, asesinato, lesiones. Código Penal Título I del Libro II.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 20, 'Delitos contra la libertad y la libertad sexual', 'Detención ilegal, secuestro, amenazas, coacciones. Delitos contra la libertad e indemnidad sexual.', 'IV'),
  ('ab000000-0000-0000-0000-000000000001', 21, 'Delitos contra el patrimonio', 'Hurto, robo, estafa, daños. Delitos contra el orden socioeconómico.', 'IV'),
  -- Bloque V — Seguridad Vial (temas 22–29)
  ('ab000000-0000-0000-0000-000000000001', 22, 'LSV: Conceptos básicos', 'Ley de Seguridad Vial: Anexo I. Conceptos básicos (del 1 al 9, del 12 al 24 y del 54 al 73).', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 23, 'LSV: Infracciones', 'Título V, Capítulo I de la Ley de Seguridad Vial.', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 24, 'LSV: Sanciones', 'Título V, Capítulo II de la Ley de Seguridad Vial.', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 25, 'LSV: Responsabilidad', 'Título V, Capítulo III de la Ley de Seguridad Vial.', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 26, 'LSV: Procedimiento Sancionador', 'Título V, Capítulo IV de la Ley de Seguridad Vial.', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 27, 'LSV: Normas de comportamiento en la circulación', 'Título II, Capítulo I de la Ley de Seguridad Vial.', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 28, 'LSV: Pérdida de puntos', 'Infracciones que llevan aparejada la pérdida de puntos (Anexo II LSV).', 'V'),
  ('ab000000-0000-0000-0000-000000000001', 29, 'LSV: Autorizaciones para conducir', 'Título IV, Capítulo II de la Ley de Seguridad Vial.', 'V'),
  -- Bloque VI — Prevención de Riesgos (temas 30–31)
  ('ab000000-0000-0000-0000-000000000001', 30, 'Prevención de Riesgos Laborales', 'Ley 31/1995 PRL: Objeto, ámbito de aplicación. Derechos y obligaciones.', 'VI'),
  ('ab000000-0000-0000-0000-000000000001', 31, 'Evacuación de edificios', 'Introducción a los planes de autoprotección. Procedimientos de evacuación.', 'VI'),
  -- Bloque VII — Historia, Medio Natural y Demografía del PV (temas 32–36)
  ('ab000000-0000-0000-0000-000000000001', 32, 'Geografía e historia del País Vasco', 'Características geográficas e historia del País Vasco.', 'VII'),
  ('ab000000-0000-0000-0000-000000000001', 33, 'Medio natural del País Vasco', 'Espacios naturales protegidos, flora, fauna, clima.', 'VII'),
  ('ab000000-0000-0000-0000-000000000001', 34, 'Demografía del País Vasco', 'Población, estructura demográfica, distribución territorial.', 'VII'),
  ('ab000000-0000-0000-0000-000000000001', 35, 'Economía del País Vasco', 'Sectores económicos, PIB, Concierto Económico.', 'VII'),
  ('ab000000-0000-0000-0000-000000000001', 36, 'Cultura e identidad vasca', 'Patrimonio cultural, lengua vasca, tradiciones.', 'VII'),
  -- Bloque VIII — Policía de Servicio a la Ciudadanía (temas 37–43)
  ('ab000000-0000-0000-0000-000000000001', 37, 'Origen y desarrollo de la policía del País Vasco', 'Origen histórico de la Ertzaintza. Arts. 17 y 36 del Estatuto de Gernika. DL 1/2020 Ley de Policía del País Vasco.', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 38, 'Ley 15/2012 Seguridad Pública de Euskadi', 'Ley 15/2012 de Ordenación del Sistema de Seguridad Pública de Euskadi.', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 39, 'El uso correcto del lenguaje', 'Comunicación y calidad del servicio. Proceso de comunicación. Pautas para redacción de documentos administrativos. Lenguaje respetuoso y no sexista.', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 40, 'Plan de Normalización del Euskera', 'Plan General de Normalización del Uso del Euskera en el Gobierno Vasco (VI Planificación 2018-2022).', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 41, 'LO 4/2015 Seguridad Ciudadana', 'Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana.', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 42, 'LO 9/1983 Derecho de Reunión', 'Ley Orgánica 9/1983 reguladora del Derecho de Reunión y Manifestación.', 'VIII'),
  ('ab000000-0000-0000-0000-000000000001', 43, 'Decreto 168/1998 Videocámaras', 'Régimen de autorización y utilización de videocámaras por la Policía del País Vasco en lugares públicos.', 'VIII'),
  -- Bloque IX — Coordinación Policial y Normativa Local (temas 44–48)
  ('ab000000-0000-0000-0000-000000000001', 44, 'Decreto 57/2015 Coordinación Policial Local', 'Composición y régimen de funcionamiento de las Comisiones de Coordinación Policial de Ámbito Local.', 'IX'),
  ('ab000000-0000-0000-0000-000000000001', 45, 'Juntas de Seguridad', 'Juntas de Seguridad del País Vasco. Competencias y funcionamiento.', 'IX'),
  ('ab000000-0000-0000-0000-000000000001', 46, 'Policía Local del País Vasco', 'Régimen jurídico de las Policías Locales en Euskadi. Coordinación con la Ertzaintza.', 'IX'),
  ('ab000000-0000-0000-0000-000000000001', 47, 'Régimen disciplinario de la Ertzaintza', 'Faltas y sanciones del personal de la Ertzaintza. Procedimiento disciplinario.', 'IX'),
  ('ab000000-0000-0000-0000-000000000001', 48, 'Régimen de personal de la Ertzaintza', 'Derechos y deberes. Situaciones administrativas. Provisión de puestos.', 'IX'),
  -- Bloque X — Atención a víctimas (temas 49–52)
  ('ab000000-0000-0000-0000-000000000001', 49, 'Estatuto de la víctima del delito', 'Ley 4/2015 del Estatuto de la víctima del delito. Derechos fundamentales de las víctimas.', 'X'),
  ('ab000000-0000-0000-0000-000000000001', 50, 'Protocolos de atención a víctimas', 'Protocolo de actuación policial ante víctimas de delitos. Atención inmediata.', 'X'),
  ('ab000000-0000-0000-0000-000000000001', 51, 'Víctimas de delitos de odio', 'Marco normativo contra delitos de odio. Protocolos de actuación e identificación.', 'X'),
  ('ab000000-0000-0000-0000-000000000001', 52, 'Víctimas menores y vulnerables', 'Protección de menores y personas en situación de vulnerabilidad. LO 8/2021.', 'X'),
  -- Bloque XI — Violencia de Género (temas 53–54)
  ('ab000000-0000-0000-0000-000000000001', 53, 'LO 1/2004 Violencia de Género', 'Ley Orgánica 1/2004 de Medidas de Protección Integral contra la Violencia de Género: elementos principales.', 'XI'),
  ('ab000000-0000-0000-0000-000000000001', 54, 'Protocolos de actuación en violencia de género', 'Protocolo de actuación policial en materia de violencia de género. Orden de protección.', 'XI')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, bloque = EXCLUDED.bloque;


-- ═══════════════════════════════════════════════════════════════════════════════
-- GUARDIA CIVIL — Escala de Cabos y Guardias (C2) — 25 temas, 1 ejercicio test
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'ac000000-0000-0000-0000-000000000001',
  'Guardia Civil — Escala de Cabos y Guardias (C2)',
  'guardia-civil',
  'Ingreso en la Escala de Cabos y Guardias del Cuerpo de la Guardia Civil. 25 temas en 3 bloques. 100 preguntas + 5 de reserva, 60 minutos.',
  25,
  false,
  '{"psicotecnicos": false, "cazatrampas": false, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'seguridad',
  'C2',
  2,
  2091,
  '2027-05-01',
  '{
    "num_opciones": 4,
    "ejercicios": [{
      "nombre": "Conocimientos",
      "preguntas": 100,
      "reserva": 5,
      "minutos": 60,
      "acierto": 1.0,
      "error": 0.333,
      "max": 100,
      "min_aprobado": 50,
      "penaliza": true,
      "ratio_penalizacion": "1/3"
    }]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Guardia Civil: 25 temas, 3 bloques (A: Ciencias Jurídicas, B: Socioculturales, C: Técnico-Científicas)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion, bloque) VALUES
  -- Bloque A — Ciencias Jurídicas (temas 1–15)
  ('ac000000-0000-0000-0000-000000000001', 1, 'Derechos Humanos', 'Carta ONU, DUDH, Convenio Europeo DDHH (TEDH), Carta Social Europea, Pactos Internacionales, CPI, Defensor del Pueblo.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 2, 'Igualdad efectiva de mujeres y hombres', 'LO 3/2007 Igualdad. Normativa sobre igualdad, discriminación y violencia de género.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 3, 'Prevención de Riesgos Laborales', 'Ley 31/1995. RD 67/2010 y RD 179/2005 PRL en la Guardia Civil.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 4, 'Derecho Constitucional', 'CE 1978 completa. Defensor del Pueblo (LO 3/1981). Honor, intimidad e imagen (LO 1/1982).', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 5, 'Derecho de la Unión Europea', 'TUE: instituciones, PESC/PCSD. TFUE: políticas internas, ELSJ, medio ambiente, protección civil.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 6, 'Instituciones internacionales', 'ONU, Consejo de Europa, UE, OTAN, INTERPOL, EUROPOL, EUROJUST, FRONTEX, CEPOL.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 7, 'Derecho Civil', 'Persona, capacidad, nacionalidad, domicilio, registro civil, matrimonio, filiación, tutela.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 8, 'Derecho Penal', 'Principios generales, delito, penas, responsabilidad criminal. Delitos contra personas, patrimonio, libertad, seguridad colectiva, administración pública.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 9, 'Derecho Procesal Penal', 'Jurisdicción, competencia, denuncia, detención, habeas corpus, derechos del detenido, Ministerio Fiscal, Policía Judicial.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 10, 'Derecho Administrativo', 'Procedimiento administrativo, acto administrativo, revisión de actos, responsabilidad patrimonial.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 11, 'Protección de datos', 'LOPDGDD y RGPD.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 12, 'Extranjería e inmigración', 'LO 4/2000, régimen de entrada, estancia, residencia, trabajo, infracciones.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 13, 'Seguridad pública y seguridad privada', 'LO 4/2015 Seguridad Ciudadana. Ley 5/2014 Seguridad Privada.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 14, 'Ministerio del Interior y Ministerio de Defensa', 'Estructura orgánica, competencias, Secretaría de Estado de Seguridad.', 'A'),
  ('ac000000-0000-0000-0000-000000000001', 15, 'Fuerzas y Cuerpos de Seguridad — Guardia Civil', 'LO 2/1986 FCSE. Naturaleza militar, funciones, estructura, especialidades de la Guardia Civil.', 'A'),
  -- Bloque B — Materias Socioculturales (temas 16–18)
  ('ac000000-0000-0000-0000-000000000001', 16, 'Protección Civil y Desarrollo Sostenible', 'Normativa de protección civil, planes de emergencia, medio ambiente, eficiencia energética.', 'B'),
  ('ac000000-0000-0000-0000-000000000001', 17, 'Topografía', 'Cartografía, escalas, coordenadas, orientación, GPS.', 'B'),
  ('ac000000-0000-0000-0000-000000000001', 18, 'Sociología', 'Conceptos básicos, grupos sociales, fenómenos sociales relevantes para la seguridad.', 'B'),
  -- Bloque C — Materias Técnico-Científicas (temas 19–25)
  ('ac000000-0000-0000-0000-000000000001', 19, 'Tecnologías de la información', 'Informática básica, redes, internet, ciberseguridad.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 20, 'Telecomunicaciones', 'Sistemas de comunicación, radiofrecuencia, equipos.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 21, 'Automovilismo', 'Mecánica básica, seguridad vial aplicada.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 22, 'Armamento y tiro', 'Armas reglamentarias, balística, normativa.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 23, 'Primeros auxilios', 'Soporte vital básico, hemorragias, fracturas, quemaduras, protocolo PAS.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 24, 'Seguridad vial', 'Normas de circulación, señalización, accidentes de tráfico.', 'C'),
  ('ac000000-0000-0000-0000-000000000001', 25, 'Medio ambiente', 'Normativa medioambiental, delitos ecológicos, SEPRONA.', 'C')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, bloque = EXCLUDED.bloque;


-- ═══════════════════════════════════════════════════════════════════════════════
-- POLICÍA NACIONAL — Escala Básica (C1) — 45 temas, 1 ejercicio test (3 opciones)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'ad000000-0000-0000-0000-000000000001',
  'Policía Nacional — Escala Básica (C1)',
  'policia-nacional',
  'Ingreso en la Escala Básica del Cuerpo Nacional de Policía. 45 temas en 3 bloques. 100 preguntas con 3 opciones (A/B/C), penalización -1/2. Nota sobre 10.',
  45,
  false,
  '{"psicotecnicos": false, "cazatrampas": false, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'seguridad',
  'C1',
  3,
  2218,
  '2027-04-01',
  '{
    "num_opciones": 3,
    "ejercicios": [{
      "nombre": "Cuestionario",
      "preguntas": 100,
      "reserva": 0,
      "minutos": 50,
      "acierto": 0.1,
      "error": 0.05,
      "max": 10,
      "min_aprobado": 3,
      "penaliza": true,
      "ratio_penalizacion": "1/2"
    }]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Policía Nacional: 45 temas, 3 bloques (I: Ciencias Jurídicas, II: Ciencias Sociales, III: Técnico-Científicas)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion, bloque) VALUES
  -- Bloque I — Ciencias Jurídicas (temas 1–26)
  ('ad000000-0000-0000-0000-000000000001', 1, 'El derecho', 'Concepto, fuentes, jerarquía normativa, la Constitución, el Tribunal Constitucional.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 2, 'Derechos fundamentales (I)', 'Igualdad, derechos individuales, tutela judicial.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 3, 'Derechos fundamentales (II)', 'Garantías, suspensión, Defensor del Pueblo.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 4, 'La Corona', 'Funciones del Rey, sucesión, refrendo.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 5, 'Las Cortes Generales', 'Composición, funcionamiento, Congreso y Senado.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 6, 'El Gobierno', 'Composición, funciones, responsabilidad, relaciones Gobierno-Cortes.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 7, 'El Ministerio del Interior', 'Estructura orgánica básica. Secretaría de Estado de Seguridad.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 8, 'Cuerpos y Fuerzas de Seguridad del Estado', 'LO 2/1986 FCSE. Principios básicos de actuación. Disposiciones estatutarias. Policía Nacional: estructura y funciones.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 9, 'El Poder Judicial', 'Principios constitucionales, CGPJ, organización judicial.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 10, 'Derecho Administrativo (I)', 'Procedimiento administrativo común (Ley 39/2015 LPAC).', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 11, 'Derecho Administrativo (II)', 'Personal al servicio de las AAPP (TREBEP).', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 12, 'Derecho de la Unión Europea', 'Tratados, instituciones, fuentes, libertades.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 13, 'Organizaciones internacionales', 'ONU, Consejo de Europa, OTAN, OSCE.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 14, 'Derecho Penal (I)', 'Principios, delito, responsabilidad criminal, penas.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 15, 'Derecho Penal (II)', 'Delitos contra la vida, integridad, libertad, indemnidad sexual.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 16, 'Derecho Penal (III)', 'Delitos contra el patrimonio, orden socioeconómico.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 17, 'Derecho Penal (IV)', 'Delitos contra la Constitución, orden público, Administración.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 18, 'Derecho Penal (V)', 'Delitos contra la seguridad colectiva: tráfico de drogas, medio ambiente.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 19, 'Delitos contra la seguridad vial', 'Conducción bajo influencia, exceso velocidad, conducción temeraria.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 20, 'Delitos informáticos', 'Derecho a la intimidad, prueba digital en el proceso penal.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 21, 'Derecho Procesal Penal', 'Jurisdicción, denuncia, detención, habeas corpus, Policía Judicial.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 22, 'Estatuto de la víctima del delito', 'Ley 4/2015 del Estatuto de la víctima del delito.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 23, 'Igualdad y no discriminación', 'LO 3/2007 Igualdad, políticas de igualdad en la AGE.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 24, 'Violencia de género', 'LO 1/2004 de Medidas de Protección Integral contra la Violencia de Género.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 25, 'Extranjería', 'LO 4/2000, régimen jurídico, protección internacional.', 'I'),
  ('ad000000-0000-0000-0000-000000000001', 26, 'Protección de datos', 'RGPD, LOPDGDD, videovigilancia.', 'I'),
  -- Bloque II — Ciencias Sociales (temas 27–37)
  ('ad000000-0000-0000-0000-000000000001', 27, 'Derechos Humanos', 'Declaraciones y convenios internacionales de DDHH.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 28, 'Globalización y sociedad de la información', 'Conceptos básicos, redes sociales, impacto en la seguridad.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 29, 'Sociología', 'Socialización, estructura social, estratificación.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 30, 'Psicología', 'Comportamiento, motivación, percepción, aprendizaje.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 31, 'Comunicación', 'Proceso comunicativo, tipos, comunicación interpersonal.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 32, 'Inmigración', 'Fenómeno migratorio, marco normativo, integración.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 33, 'Cooperación policial internacional', 'Europol, Interpol, FRONTEX, CEPOL.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 34, 'Ortografía de la lengua española', 'Reglas generales de acentuación, puntuación, grafías.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 35, 'Terrorismo', 'Marco legal, prevención, organizaciones terroristas.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 36, 'Seguridad ciudadana', 'LO 4/2015 Seguridad Ciudadana, intervención policial, atestado.', 'II'),
  ('ad000000-0000-0000-0000-000000000001', 37, 'Deontología policial', 'Ética, código de conducta, uso de la fuerza.', 'II'),
  -- Bloque III — Materias Técnico-Científicas (temas 38–45)
  ('ad000000-0000-0000-0000-000000000001', 38, 'Tecnologías de la información', 'Hardware, software, redes, internet.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 39, 'Ciberseguridad y ciberdelincuencia', 'Amenazas, delitos informáticos, protección de sistemas.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 40, 'Transmisiones', 'Sistemas de comunicación policial.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 41, 'Automoción', 'Mecánica básica, mantenimiento, seguridad en vehículos.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 42, 'Armamento', 'Armas reglamentarias, balística, normativa.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 43, 'Primeros auxilios', 'Soporte vital básico, actuación ante emergencias.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 44, 'Seguridad vial', 'Normativa, señalización, accidentología.', 'III'),
  ('ad000000-0000-0000-0000-000000000001', 45, 'Prevención de riesgos laborales', 'Ley 31/1995 PRL aplicada a funciones policiales.', 'III')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, bloque = EXCLUDED.bloque;
