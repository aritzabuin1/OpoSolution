-- =============================================================================
-- Migration 064: Hacienda AEAT (C1) + Penitenciarias (C1)
-- Autor: Claude / Aritz | Fecha: 2026-03-30
--
-- Fuente Hacienda: BOE nº 313, 30/12/2025 (conv. OEP 2025). 32 temas, 3 bloques.
-- Fuente Penitenciarias: BOE 09/10/2025 (conv. OEP 2025). 50 temas, 4 bloques.
--
-- AMBAS oposiciones: ejercicios son tipo TEST (no desarrollo escrito).
-- activa = false → no visible hasta free bank + legislación + Stripe listos.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- AGENTES DE LA HACIENDA PÚBLICA (C1) — 32 temas, 2 ejercicios test
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'Agente de Hacienda Pública (C1)',
  'hacienda-aeat',
  'Cuerpo General Administrativo AGE, especialidad Agentes de la Hacienda Pública. 32 temas, 2 ejercicios tipo test. Funciones de gestión, inspección y recaudación tributaria en la AEAT.',
  32,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'hacienda',
  'C1',
  1,
  1000,
  '2027-03-01',
  '{
    "ejercicios": [
      {"nombre": "Test teórico", "preguntas": 80, "reserva": 0, "minutos": 90, "acierto": 0.125, "error": 0.03125, "max": 10, "min_aprobado": 5, "penaliza": true, "ratio_penalizacion": "1/4"},
      {"nombre": "Supuestos prácticos", "preguntas": 10, "reserva": 0, "minutos": 60, "acierto": 1.0, "error": 0.25, "max": 10, "min_aprobado": 5, "penaliza": true, "ratio_penalizacion": "1/4"}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Hacienda: 32 temas (Bloque I: 1-7, Bloque II: 8-12, Bloque III: 13-32)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion, bloque) VALUES
  -- Bloque I — Organización del Estado y Funcionamiento AGE (7 temas)
  ('f0000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978', 'Estructura y contenido. Derechos y deberes fundamentales. Su garantía y suspensión. La Corona. El Tribunal Constitucional.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 2, 'Las Cortes Generales', 'Composición, atribuciones y funcionamiento. El Defensor del Pueblo.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 3, 'El Gobierno', 'Composición. Nombramiento y cese. Las funciones del Gobierno.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 4, 'La Administración Pública', 'Principios constitucionales. La AGE: organización y funcionamiento. Órganos superiores y directivos. Administración periférica. Organización territorial del Estado. Las CCAA.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 5, 'La Unión Europea', 'Instituciones. Libertades básicas. Principales políticas comunes.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 6, 'Protección de Datos Personales', 'LO 3/2018 LOPDGDD. RGPD UE 2016/679. Garantía de derechos digitales.', 'I'),
  ('f0000000-0000-0000-0000-000000000001', 7, 'Políticas de igualdad de género', 'LO 3/2007 Igualdad. Violencia de género: LO 1/2004.', 'I'),
  -- Bloque II — Derecho Administrativo General (5 temas)
  ('f0000000-0000-0000-0000-000000000001', 8, 'Las fuentes del Derecho Administrativo', 'Jerarquía de fuentes. La Ley. Disposiciones del ejecutivo con fuerza de ley. El Reglamento.', 'II'),
  ('f0000000-0000-0000-0000-000000000001', 9, 'El acto administrativo', 'Concepto, clases y elementos. Motivación y notificación. Eficacia y validez.', 'II'),
  ('f0000000-0000-0000-0000-000000000001', 10, 'El procedimiento administrativo común', 'Fases del procedimiento. Los recursos administrativos.', 'II'),
  ('f0000000-0000-0000-0000-000000000001', 11, 'Los contratos del sector público', 'Clases de contratos. Procedimiento de adjudicación. Ley 9/2017 LCSP.', 'II'),
  ('f0000000-0000-0000-0000-000000000001', 12, 'La responsabilidad patrimonial', 'Responsabilidad patrimonial de la Administración Pública. Ley 40/2015 LRJSP.', 'II'),
  -- Bloque III — Organización Hacienda Pública y Derecho Tributario (20 temas)
  ('f0000000-0000-0000-0000-000000000001', 13, 'El sistema fiscal español', 'Principios impositivos en la CE (art. 31, 133, 134). Impuestos estatales. HP Estatal, Autonómica y Local.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 14, 'La AEAT', 'Creación (Ley 31/1990), naturaleza, objetivos, funciones y organización de la Agencia Estatal de Administración Tributaria.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 15, 'Derecho Tributario: conceptos generales', 'Concepto y contenido. Fuentes. Los tributos: concepto y clasificación. Obligación tributaria. Hecho imponible. Devengo. Base imponible y liquidable. Cuota y deuda.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 16, 'Derechos y garantías de los obligados tributarios', 'LGT Título III. Ley 1/1998 de Derechos y Garantías de los Contribuyentes.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 17, 'Obligaciones formales de los contribuyentes', 'Libros registros y facturas. Gestión censal. NIF. RD 1065/2007. RD 1619/2012 Reglamento de facturación.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 18, 'Información y asistencia tributaria', 'La consulta tributaria. Colaboración social en la gestión tributaria. Tecnologías informáticas. LGT arts. 85-91.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 19, 'Las declaraciones tributarias', 'Concepto y clases. Autoliquidaciones. Comunicaciones de datos. Retenciones. Pagos fraccionados. LGT arts. 119-122.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 20, 'La deuda tributaria', 'Extinción de la deuda tributaria. Aplazamientos y fraccionamientos. LGT Título II Cap. IV.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 21, 'Garantías de la deuda tributaria', 'Medidas cautelares. Recaudación en período voluntario y ejecutivo. Procedimiento de apremio. LGT; RGR RD 939/2005.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 22, 'La gestión tributaria', 'Procedimientos de gestión. Comprobación de valores. LGT Título III Cap. III.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 23, 'La Inspección de los Tributos', 'Funciones y facultades. Actuaciones inspectoras. Procedimiento de inspección. LGT Título III Cap. IV.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 24, 'Potestad sancionadora en materia tributaria', 'Infracciones y sanciones tributarias. Procedimiento sancionador. LGT Título IV.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 25, 'Revisión en vía administrativa', 'Recurso de reposición. Reclamaciones económico-administrativas. Tribunales Económico-Administrativos. LGT Título V.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 26, 'IRPF (I)', 'Naturaleza, objeto y ámbito de aplicación. Hecho imponible. Contribuyente. Base imponible. Ley 35/2006.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 27, 'IRPF (II)', 'Base liquidable. Cuota íntegra. Deducciones. Cuota diferencial. Retenciones. Obligación de declarar. Ley 35/2006.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 28, 'Impuesto sobre Sociedades', 'Naturaleza y ámbito. Hecho imponible. Sujeto pasivo. Base imponible. Tipo de gravamen. Cuota íntegra. Deducciones y bonificaciones. Ley 27/2014.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 29, 'IVA (I)', 'Naturaleza y ámbito. Hecho imponible. Lugar de realización. Sujeto pasivo. Base imponible. Ley 37/1992.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 30, 'IVA (II)', 'Tipo impositivo. Deducciones y devoluciones. Regímenes especiales. Ley 37/1992.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 31, 'Impuestos Especiales', 'Concepto y naturaleza. Principales figuras impositivas. Ley 38/1992.', 'III'),
  ('f0000000-0000-0000-0000-000000000001', 32, 'Aduanas', 'Normativa aduanera. Introducción y salida de mercancías. Regímenes aduaneros. Reglamento UE 952/2013.', 'III')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, bloque = EXCLUDED.bloque;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AYUDANTES DE INSTITUCIONES PENITENCIARIAS (C1) — 50 temas, 2 ejercicios test
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO oposiciones (
  id, nombre, slug, descripcion, num_temas, activa, features,
  rama, nivel, orden, plazas, fecha_examen_aprox, scoring_config
) VALUES (
  'f1000000-0000-0000-0000-000000000001',
  'Ayudante de Instituciones Penitenciarias (C1)',
  'penitenciarias',
  'Cuerpo de Ayudantes de Instituciones Penitenciarias. 50 temas, 2 ejercicios tipo test (150 + 50 preguntas). Funciones de vigilancia, custodia y tratamiento en centros penitenciarios.',
  50,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}'::jsonb,
  'penitenciarias',
  'C1',
  1,
  900,
  '2027-01-15',
  '{
    "ejercicios": [
      {"nombre": "Cuestionario", "preguntas": 150, "reserva": 10, "minutos": 120, "acierto": 0.20, "error": 0.0667, "max": 30, "min_aprobado": 15, "penaliza": true, "ratio_penalizacion": "1/3"},
      {"nombre": "Supuestos prácticos", "preguntas": 50, "reserva": 0, "minutos": 75, "acierto": 0.40, "error": 0.1333, "max": 20, "min_aprobado": 10, "penaliza": true, "ratio_penalizacion": "1/3"}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre, slug = EXCLUDED.slug, descripcion = EXCLUDED.descripcion,
  num_temas = EXCLUDED.num_temas, features = EXCLUDED.features, rama = EXCLUDED.rama,
  nivel = EXCLUDED.nivel, orden = EXCLUDED.orden, plazas = EXCLUDED.plazas,
  fecha_examen_aprox = EXCLUDED.fecha_examen_aprox, scoring_config = EXCLUDED.scoring_config;

-- Penitenciarias: 50 temas (Bloque I: 1-17, Bloque II: 18-27, Bloque III: 28-47, Bloque IV: 48-50)
INSERT INTO temas (oposicion_id, numero, titulo, descripcion, bloque) VALUES
  -- Bloque I — Organización del Estado, Dcho. Admin., Gestión Personal y Financiera (17 temas)
  ('f1000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978', 'Principios generales, estructura y contenido. Derechos y deberes fundamentales. La Corona.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 2, 'Las Cortes Generales', 'Elaboración de las leyes. El Defensor del Pueblo.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 3, 'El Poder Judicial', 'Organización judicial. El CGPJ. El Tribunal Constitucional. El Ministerio Fiscal.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 4, 'El Gobierno', 'Consejo de Ministros, Presidente, Ministros. Administración Periférica: Delegados, Subdelegados.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 5, 'Organización Territorial del Estado', 'Instituciones fundamentales de las CCAA. Competencias en materia penitenciaria.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 6, 'La Unión Europea', 'Tratados. Instituciones Comunitarias. Efectos sobre organización del Estado español.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 7, 'Estructura orgánica del Ministerio del Interior', 'La Secretaría General de Instituciones Penitenciarias. EPPFETFE.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 8, 'El personal de Instituciones Penitenciarias', 'Cuerpos de funcionarios. Cuerpo de Ayudantes: funciones generales y en las distintas unidades. Personal laboral.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 9, 'Régimen jurídico del personal al servicio de las AAPP', 'TREBEP. Derechos y deberes. Régimen de incompatibilidades. Régimen disciplinario.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 10, 'Acceso al empleo público', 'Sistemas selectivos. Adquisición y pérdida de la condición de funcionario. Provisión de puestos. Situaciones administrativas.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 11, 'Prevención de Riesgos Laborales', 'Ley 31/1995 PRL. Derechos y obligaciones. Servicios de prevención. Consulta y participación.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 12, 'Las fuentes del Derecho Administrativo', 'Jerarquía de fuentes. La Ley. El Reglamento.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 13, 'El acto administrativo', 'Motivación y notificación. Eficacia y validez. Silencio administrativo. Revisión de actos. Recursos administrativos.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 14, 'El procedimiento administrativo común', 'Fases del procedimiento. Ley 39/2015 LPAC.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 15, 'Gobierno abierto', 'Transparencia y acceso a información pública. Administración electrónica. Ley 19/2013.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 16, 'El presupuesto del Estado', 'Concepto, principios, estructura. El gasto público. Contratación administrativa. Estabilidad presupuestaria.', 'I'),
  ('f1000000-0000-0000-0000-000000000001', 17, 'Políticas públicas', 'Igualdad de género: LO 3/2007. Violencia de género: LO 1/2004. Dependencia: Ley 39/2006. Voluntariado: Ley 45/2015.', 'I'),
  -- Bloque II — Derecho Penal (10 temas)
  ('f1000000-0000-0000-0000-000000000001', 18, 'El Derecho Penal', 'Concepto, principios generales. La infracción penal. Personas criminalmente responsables.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 19, 'Las penas', 'Clases y efectos. Reglas generales para la aplicación de las penas.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 20, 'Formas sustitutivas de ejecución', 'Formas sustitutivas de ejecución de penas privativas de libertad.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 21, 'Suspensión de ejecución de penas', 'Penas privativas de derechos. Trabajos en beneficio de la comunidad. Medidas de seguridad. Extinción responsabilidad criminal.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 22, 'Principales delitos (1)', 'Homicidio y sus formas. Lesiones. Violencia de género y doméstica. Delitos contra el patrimonio: hurto y robos.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 23, 'Delitos contra la libertad', 'Detención ilegal, secuestros, amenazas, coacciones. Delitos contra la salud pública: tráfico de drogas.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 24, 'Principales delitos (2)', 'Torturas y delitos contra integridad moral. Delitos contra libertad sexual. Delitos contra el honor. Falsedades.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 25, 'Delitos cometidos por funcionarios públicos', 'Atentados contra la autoridad. Quebrantamiento de condena.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 26, 'La responsabilidad civil derivada de delitos', 'Responsabilidad civil ex delicto. Código Civil aplicable.', 'II'),
  ('f1000000-0000-0000-0000-000000000001', 27, 'Derecho Procesal Penal', 'Concepto. El proceso penal. Procedimientos. Medidas cautelares. LECrim.', 'II'),
  -- Bloque III — Derecho Penitenciario (20 temas)
  ('f1000000-0000-0000-0000-000000000001', 28, 'Regulación supranacional penitenciaria', 'Convenios, Tratados, Pactos. Organismos ONU, Consejo de Europa. Ley 23/2014 reconocimiento mutuo resoluciones penales UE.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 29, 'El Derecho Penitenciario', 'Concepto, contenido, fuentes. Evolución histórica. Art. 25.2 CE. Normativa vigente (LOGP + RP).', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 30, 'Relación jurídico-penitenciaria', 'Derechos de los internos: clases, límites, protección y garantías.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 31, 'Prestaciones de la Administración Penitenciaria', 'Asistencia sanitaria. Higiene y alimentación. Asistencia religiosa. Acción social penitenciaria.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 32, 'El Régimen Penitenciario (1)', 'Concepto y principios. Organización del centro. Ingreso. Relaciones con exterior. Participación internos. Conducciones y traslados.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 33, 'El Régimen Penitenciario (2)', 'Seguridad en establecimientos. Seguridad exterior e interior. Medios coercitivos.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 34, 'Clasificación de establecimientos', 'Tipos de establecimientos. Régimen ordinario. Régimen abierto. Régimen cerrado.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 35, 'Formas especiales de ejecución', 'Departamentos de jóvenes, madres, extranjeros. Centros de Inserción Social. Unidades dependientes.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 36, 'El tratamiento penitenciario (1)', 'Concepto, fines, principios. Clasificación en grados. Programas de tratamiento. Permisos de salida.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 37, 'El tratamiento penitenciario (2)', 'Actividades educativas, culturales, deportivas. Formación, trabajo y empleo.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 38, 'Libertad condicional y beneficios penitenciarios', 'LOGP arts. 72-78. CP arts. 90-93. Régimen de los Jueces de Vigilancia Penitenciaria.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 39, 'Mujeres y personas trans en ámbito penitenciario', 'Igualdad y no discriminación. Programas específicos. LO 3/2007. Instrucciones SGIP.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 40, 'Extranjeros en el sistema penitenciario', 'Marco normativo. Expulsión. Traslado. LO 4/2000 LOEX. Ley 23/2014.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 41, 'Internos con enfermedad mental y drogodependientes', 'Actuación con personas con enfermedad mental. Programas de intervención con drogodependientes.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 42, 'Penas y medidas alternativas a la prisión', 'Trabajos en beneficio de la comunidad. Localización permanente. Suspensión y sustitución. RD 840/2011.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 43, 'Organización de centros penitenciarios', 'Órganos colegiados y unipersonales. LOGP. RP Título IX. RD 1201/1981.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 44, 'Procedimiento disciplinario penitenciario', 'Faltas y sanciones. Ejecución y cancelación. LOGP Título IV Cap. IV. RP Título X.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 45, 'Régimen económico de establecimientos penitenciarios', 'RP Título XI. Ley General Presupuestaria.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 46, 'Protección de datos en Instituciones Penitenciarias', 'LOPDGDD. RGPD. Sistema de Información Penitenciaria (SIP-SP). Registro y gestión de información.', 'III'),
  ('f1000000-0000-0000-0000-000000000001', 47, 'Prevención de suicidios en centros penitenciarios', 'Protocolos de actuación ante riesgo vital. Instrucciones SGIP. Protocolo PAS.', 'III'),
  -- Bloque IV — Conducta Humana (3 temas)
  ('f1000000-0000-0000-0000-000000000001', 48, 'Elementos de la conducta humana', 'Estímulos y respuestas. Refuerzo y castigo. Técnicas de evaluación: observación, auto-registro, auto-informes. Integración de datos e informes.', 'IV'),
  ('f1000000-0000-0000-0000-000000000001', 49, 'Organización social de la prisión', 'Control formal e informal. Código del recluso. Subculturas carcelarias. Hacinamiento. Efectos psicológicos de la reclusión. Prisionización.', 'IV'),
  ('f1000000-0000-0000-0000-000000000001', 50, 'Comportamiento social y conducta adictiva', 'Asertividad. Habilidades sociales. Evaluación y medida. Programas de entrenamiento HHSS. La conducta adictiva en prisión.', 'IV')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion, bloque = EXCLUDED.bloque;
