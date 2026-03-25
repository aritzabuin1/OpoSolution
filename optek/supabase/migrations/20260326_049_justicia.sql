-- =============================================================================
-- Migration 049: 3 oposiciones de Justicia (Auxilio C2, Tramitación C1, Gestión A2)
-- Autor: Claude / Aritz | Fecha: 2026-03-25
--
-- Temarios verificados contra BOE-A-2025-27053, administraciondejusticia.com,
-- opositatest.com, formacion.ninja, cejusticia.es.
--
-- PENALIZACIÓN JUSTICIA = 1/4 del acierto (NO 1/3 como AGE)
-- Gestión Ej.2 tiene ratio anómalo: 1/5
--
-- Temario base = MISMO para convocatoria Ministerio y CCAA con competencias.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUXILIO JUDICIAL (C2) — 26 temas, 2 ejercicios
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Auxilio Judicial (C2)',
  'auxilio-judicial',
  'Cuerpo de Auxilio Judicial. 26 temas, 2 ejercicios tipo test. Funciones de apoyo en juzgados: actos de comunicación, ejecuciones, guardia.',
  26,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'justicia',
  'C2',
  1,
  425,
  '2026-09-26',
  '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 100, "reserva": 4, "minutos": 100, "acierto": 0.60, "error": 0.15, "max": 60, "min_aprobado": 30, "penaliza": true},
      {"nombre": "Supuesto práctico", "preguntas": 40, "reserva": 2, "minutos": 60, "acierto": 1.00, "error": 0.25, "max": 40, "min_aprobado": 20, "penaliza": true}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Auxilio: 26 temas (Bloque I: 1-15, Bloque II: 16-26)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion) VALUES
  ('e0000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978', 'Estructura y contenido. Atribuciones de la Corona. Cortes Generales. Elaboración de leyes. Tribunal Constitucional.'),
  ('e0000000-0000-0000-0000-000000000001', 2, 'Derecho de igualdad y no discriminación', 'LO 3/2007 Igualdad. LO 1/2004 Violencia de Género. Ley 15/2022. Ley 4/2023 LGTBI.'),
  ('e0000000-0000-0000-0000-000000000001', 3, 'El Gobierno y la Administración', 'Organización administrativa: Ministros, Secretarios de Estado, Subsecretarios, Directores Generales.'),
  ('e0000000-0000-0000-0000-000000000001', 4, 'Organización territorial del Estado', 'Las CCAA. Estatutos de Autonomía. Administración Local: provincia y municipio.'),
  ('e0000000-0000-0000-0000-000000000001', 5, 'La Unión Europea', 'Competencias. Parlamento Europeo, Consejo, Comisión, TJUE, Tribunal de Cuentas.'),
  ('e0000000-0000-0000-0000-000000000001', 6, 'El Poder Judicial', 'CGPJ. Jueces y Magistrados. Independencia judicial. El Ministerio Fiscal.'),
  ('e0000000-0000-0000-0000-000000000001', 7, 'Organización y competencia (I)', 'TS, AN, TSJ y Audiencias Provinciales.'),
  ('e0000000-0000-0000-0000-000000000001', 8, 'Organización y competencia (II)', 'Tribunales de Instancia y Tribunal Central de Instancia. Oficinas de Justicia. Juzgados de Paz. [LO 1/2025]'),
  ('e0000000-0000-0000-0000-000000000001', 9, 'Carta de Derechos de los Ciudadanos ante la Justicia', 'Derechos de información, atención, gestión. Derecho a justicia gratuita.'),
  ('e0000000-0000-0000-0000-000000000001', 10, 'Modernización de la Oficina Judicial', 'La nueva oficina judicial (LOPJ + LO 1/2025). Nuevas tecnologías. Presentación telemática.'),
  ('e0000000-0000-0000-0000-000000000001', 11, 'El Letrado de la Administración de Justicia', 'Funciones y competencias en la LOPJ.'),
  ('e0000000-0000-0000-0000-000000000001', 12, 'Cuerpos de funcionarios de la Administración de Justicia', 'Funciones y formas de acceso en los cuerpos generales.'),
  ('e0000000-0000-0000-0000-000000000001', 13, 'Los Cuerpos Generales (I)', 'Derechos y deberes de los funcionarios. Situaciones administrativas.'),
  ('e0000000-0000-0000-0000-000000000001', 14, 'Los Cuerpos Generales (II)', 'Régimen disciplinario. Delitos y penas: clases.'),
  ('e0000000-0000-0000-0000-000000000001', 15, 'Libertad sindical', 'El sindicato en la CE. Elecciones sindicales (LOPJ y TREBEP). PRL.'),
  ('e0000000-0000-0000-0000-000000000001', 16, 'Procedimientos declarativos en la LEC', 'Juicio ordinario y verbal. Procedimientos especiales. MASC. [LO 1/2025]'),
  ('e0000000-0000-0000-0000-000000000001', 17, 'Procedimientos de ejecución en la LEC', 'Ejecución dineraria y no dineraria. Medidas cautelares. Embargo, lanzamiento.'),
  ('e0000000-0000-0000-0000-000000000001', 18, 'Procedimientos penales en la LECrim', 'Proceso ordinario, abreviado, delitos leves, jurado, rápidos. Habeas Corpus.'),
  ('e0000000-0000-0000-0000-000000000001', 19, 'Procedimientos contencioso-administrativos', 'Ley 29/1998. Órganos y competencias. Recurso contencioso-administrativo.'),
  ('e0000000-0000-0000-0000-000000000001', 20, 'El proceso laboral', 'Ley 36/2011. Jurisdicción social. Procesos ordinarios, despido, seguridad social.'),
  ('e0000000-0000-0000-0000-000000000001', 21, 'Los actos procesales', 'Requisitos. Nulidad, anulabilidad, irregularidad. Plazos y términos.'),
  ('e0000000-0000-0000-0000-000000000001', 22, 'Resoluciones de los órganos judiciales', 'Clases, contenido. Resoluciones de órganos colegiados. Resoluciones del LAJ.'),
  ('e0000000-0000-0000-0000-000000000001', 23, 'Actos de comunicación con Tribunales y Autoridades', 'Oficios y mandamientos. Auxilio judicial: exhortos. Cooperación jurídica internacional.'),
  ('e0000000-0000-0000-0000-000000000001', 24, 'Actos de comunicación a las partes', 'Notificaciones, requerimientos, citaciones y emplazamientos. Nuevas tecnologías.'),
  ('e0000000-0000-0000-0000-000000000001', 25, 'El Registro Civil', 'Estructura. Oficinas: Central, Generales y Consulares. Funciones.'),
  ('e0000000-0000-0000-0000-000000000001', 26, 'Archivo judicial y documentación judicial', 'Formas de remisión. Nuevas tecnologías en archivos. Juntas de expurgo.')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRAMITACIÓN PROCESAL (C1) — 37 temas, 3 ejercicios
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'Tramitación Procesal y Administrativa (C1)',
  'tramitacion-procesal',
  'Cuerpo de Tramitación Procesal. 37 temas (15 org + 16 procesal + 6 ofimática), 3 ejercicios tipo test. Incluye ofimática Word 365.',
  37,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": true}'::jsonb,
  'justicia',
  'C1',
  2,
  1155,
  '2026-09-26',
  '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 100, "reserva": 4, "minutos": 100, "acierto": 0.60, "error": 0.15, "max": 60, "min_aprobado": 30, "penaliza": true},
      {"nombre": "Supuesto práctico", "preguntas": 10, "reserva": 2, "minutos": 30, "acierto": 2.00, "error": 0.50, "max": 20, "min_aprobado": 10, "penaliza": true},
      {"nombre": "Ofimática", "preguntas": 20, "reserva": 4, "minutos": 40, "acierto": 1.00, "error": 0.25, "max": 20, "min_aprobado": 10, "penaliza": true}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Tramitación: 37 temas (Bloque I: 1-15, Bloque II: 16-31, Bloque III: 32-37)
-- Bloque I es idéntico a Auxilio (temas 1-15 compartidos)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion) VALUES
  ('e1000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978', 'Estructura y contenido. Atribuciones de la Corona. Cortes Generales. Tribunal Constitucional.'),
  ('e1000000-0000-0000-0000-000000000001', 2, 'Derecho de igualdad y no discriminación', 'LO 3/2007 Igualdad. LO 1/2004 VG. Ley 15/2022. Ley 4/2023 LGTBI.'),
  ('e1000000-0000-0000-0000-000000000001', 3, 'El Gobierno y la Administración', 'Organización administrativa española.'),
  ('e1000000-0000-0000-0000-000000000001', 4, 'Organización territorial del Estado', 'CCAA. Estatutos de Autonomía. Administración Local.'),
  ('e1000000-0000-0000-0000-000000000001', 5, 'La Unión Europea', 'Competencias. Instituciones.'),
  ('e1000000-0000-0000-0000-000000000001', 6, 'El Poder Judicial', 'CGPJ. Ministerio Fiscal.'),
  ('e1000000-0000-0000-0000-000000000001', 7, 'Organización y competencia (I)', 'TS, AN, TSJ, Audiencias Provinciales.'),
  ('e1000000-0000-0000-0000-000000000001', 8, 'Organización y competencia (II)', 'Tribunales de Instancia. [LO 1/2025]'),
  ('e1000000-0000-0000-0000-000000000001', 9, 'Carta de Derechos de los Ciudadanos ante la Justicia', 'Derechos de información, atención, gestión.'),
  ('e1000000-0000-0000-0000-000000000001', 10, 'Modernización de la Oficina Judicial', 'Nueva oficina judicial. Nuevas tecnologías. [LO 1/2025]'),
  ('e1000000-0000-0000-0000-000000000001', 11, 'El LAJ', 'Funciones y competencias.'),
  ('e1000000-0000-0000-0000-000000000001', 12, 'Cuerpos de Funcionarios', 'Funciones y formas de acceso.'),
  ('e1000000-0000-0000-0000-000000000001', 13, 'Los Cuerpos Generales (I)', 'Derechos y deberes. Situaciones administrativas.'),
  ('e1000000-0000-0000-0000-000000000001', 14, 'Los Cuerpos Generales (II)', 'Régimen disciplinario.'),
  ('e1000000-0000-0000-0000-000000000001', 15, 'Libertad sindical', 'Elecciones sindicales. PRL.'),
  ('e1000000-0000-0000-0000-000000000001', 16, 'Procedimientos declarativos LEC', 'MASC. Juicio ordinario y verbal. [LO 1/2025]'),
  ('e1000000-0000-0000-0000-000000000001', 17, 'Procedimientos de ejecución LEC', 'Embargos, subastas. Medidas cautelares.'),
  ('e1000000-0000-0000-0000-000000000001', 18, 'Procesos especiales LEC', 'Matrimoniales, monitorio, cambiario.'),
  ('e1000000-0000-0000-0000-000000000001', 19, 'Jurisdicción voluntaria', 'Ley 15/2015.'),
  ('e1000000-0000-0000-0000-000000000001', 20, 'Procedimientos penales LECrim', 'Habeas Corpus. Ordinario, abreviado.'),
  ('e1000000-0000-0000-0000-000000000001', 21, 'Juicio sobre delitos leves', 'Procedimiento.'),
  ('e1000000-0000-0000-0000-000000000001', 22, 'Recurso contencioso-administrativo', 'Ley 29/1998.'),
  ('e1000000-0000-0000-0000-000000000001', 23, 'El proceso laboral', 'Ley 36/2011.'),
  ('e1000000-0000-0000-0000-000000000001', 24, 'Recursos', 'Civiles, penales, contencioso-administrativos, laborales.'),
  ('e1000000-0000-0000-0000-000000000001', 25, 'Actos procesales', 'Requisitos. Plazos y términos.'),
  ('e1000000-0000-0000-0000-000000000001', 26, 'Resoluciones de órganos judiciales', 'Clases. Resoluciones del LAJ.'),
  ('e1000000-0000-0000-0000-000000000001', 27, 'Comunicación con otros Tribunales', 'Oficios, mandamientos, exhortos. Cooperación internacional.'),
  ('e1000000-0000-0000-0000-000000000001', 28, 'Comunicación a las partes', 'Notificaciones, requerimientos, citaciones, emplazamientos.'),
  ('e1000000-0000-0000-0000-000000000001', 29, 'El Registro Civil', 'Estructura.'),
  ('e1000000-0000-0000-0000-000000000001', 30, 'Las inscripciones', 'Tipos de asientos registrales.'),
  ('e1000000-0000-0000-0000-000000000001', 31, 'Archivo judicial y documentación judicial', 'Formas de remisión. Juntas de expurgo.'),
  ('e1000000-0000-0000-0000-000000000001', 32, 'Informática básica', 'Conceptos fundamentales.'),
  ('e1000000-0000-0000-0000-000000000001', 33, 'El entorno Windows', 'Windows 10 y 11.'),
  ('e1000000-0000-0000-0000-000000000001', 34, 'El explorador de Windows', 'Gestión de archivos y carpetas.'),
  ('e1000000-0000-0000-0000-000000000001', 35, 'Word 365', 'Procesador de textos Microsoft 365.'),
  ('e1000000-0000-0000-0000-000000000001', 36, 'Outlook 365', 'Correo electrónico y agenda.'),
  ('e1000000-0000-0000-0000-000000000001', 37, 'La Red Internet', 'Navegación, búsqueda, servicios web.')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GESTIÓN PROCESAL (A2) — 68 temas, 3 ejercicios (incl. desarrollo escrito)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'e2000000-0000-0000-0000-000000000001',
  'Gestión Procesal y Administrativa (A2)',
  'gestion-procesal',
  'Cuerpo de Gestión Procesal. 68 temas, 3 ejercicios (test + caso práctico + desarrollo escrito). Requiere grado universitario.',
  68,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": true, "ofimatica": false}'::jsonb,
  'justicia',
  'A2',
  3,
  725,
  '2026-09-26',
  '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 100, "reserva": 4, "minutos": 100, "acierto": 0.60, "error": 0.15, "max": 60, "min_aprobado": 30, "penaliza": true},
      {"nombre": "Caso práctico", "preguntas": 10, "reserva": 2, "minutos": 30, "acierto": 1.50, "error": 0.30, "max": 15, "min_aprobado": 7.5, "penaliza": true, "ratio_penalizacion": "1/5"},
      {"nombre": "Desarrollo escrito", "preguntas": 5, "reserva": 0, "minutos": 45, "acierto": 5.0, "error": 0, "max": 25, "min_aprobado": 12.5, "penaliza": false, "tipo": "tribunal"}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Gestión: 68 temas (solo insertamos los primeros 16 de organización + nota de que faltan 52 procesales)
-- Los 52 temas procesales se insertarán cuando se prepare el contenido de legislación
INSERT INTO temas (oposicion_id, numero, titulo, descripcion) VALUES
  ('e2000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978', 'Estructura y contenido.'),
  ('e2000000-0000-0000-0000-000000000001', 2, 'Derecho de igualdad y no discriminación', 'LO 3/2007, LO 1/2004, Ley 15/2022, Ley 4/2023.'),
  ('e2000000-0000-0000-0000-000000000001', 3, 'El Gobierno y la Administración', 'Organización administrativa.'),
  ('e2000000-0000-0000-0000-000000000001', 4, 'Organización territorial del Estado', 'CCAA. Administración Local.'),
  ('e2000000-0000-0000-0000-000000000001', 5, 'La Unión Europea', 'Competencias. Instituciones.'),
  ('e2000000-0000-0000-0000-000000000001', 6, 'El Poder Judicial', 'CGPJ. Ministerio Fiscal.'),
  ('e2000000-0000-0000-0000-000000000001', 7, 'TS, AN, TSJ, Audiencias Provinciales', 'Organización y competencia.'),
  ('e2000000-0000-0000-0000-000000000001', 8, 'Tribunales de Instancia', 'Tribunal Central de Instancia. [LO 1/2025]'),
  ('e2000000-0000-0000-0000-000000000001', 9, 'La Justicia de Paz', 'Juzgados de Paz. Oficinas de Justicia en municipios. [Exclusivo Gestión]'),
  ('e2000000-0000-0000-0000-000000000001', 10, 'Carta de Derechos de los Ciudadanos ante la Justicia', 'Derechos de información, atención.'),
  ('e2000000-0000-0000-0000-000000000001', 11, 'Modernización de la Oficina Judicial', 'Nueva oficina judicial. [LO 1/2025]'),
  ('e2000000-0000-0000-0000-000000000001', 12, 'El LAJ', 'Funciones y competencias.'),
  ('e2000000-0000-0000-0000-000000000001', 13, 'Cuerpos de Funcionarios', 'Funciones y acceso.'),
  ('e2000000-0000-0000-0000-000000000001', 14, 'Los Cuerpos Generales (I)', 'Derechos, deberes, situaciones.'),
  ('e2000000-0000-0000-0000-000000000001', 15, 'Los Cuerpos Generales (II)', 'Régimen disciplinario.'),
  ('e2000000-0000-0000-0000-000000000001', 16, 'Libertad sindical', 'Elecciones sindicales. PRL.')
-- TODO: Insertar temas 17-68 cuando se prepare contenido procesal de Gestión
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion;
