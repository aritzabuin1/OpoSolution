-- =============================================================================
-- OPTEK Migration 030: Oposición C1 — Administrativo del Estado
-- Autor: Claude / Aritz | Fecha: 2026-03-13
--
-- Añade la oposición C1 (Administrativo del Estado) con 45 temas oficiales.
-- CRÍTICO: activa = FALSE → invisible para usuarios hasta activación manual.
--
-- Fuente temario: BOE-A-2025-26262, INAP sede electrónica.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Oposición C1 (INACTIVA hasta activación manual)
-- ---------------------------------------------------------------------------
INSERT INTO oposiciones (id, nombre, slug, descripcion, num_temas, activa)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Administrativo del Estado',
  'administrativo-estado',
  'Cuerpo General Administrativo de la AGE (C1). 2.512 plazas 2026. 45 temas en 6 bloques.',
  45,
  false  -- ← INVISIBLE hasta UPDATE manual
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. 45 temas oficiales del temario C1
-- Fuente: BOE-A-2025-26262 (22/12/2025)
-- Bloque I (temas 1-37): Materias jurídicas y gestión
-- Bloque II (temas 38-45): Informática y ofimática
-- ---------------------------------------------------------------------------
INSERT INTO temas (id, oposicion_id, numero, titulo, descripcion, bloque)
VALUES
  -- ─── BLOQUE I: ORGANIZACIÓN DEL ESTADO (11 temas) ───────────────────────
  ('c1000000-0000-0000-0001-000000000001', 'b0000000-0000-0000-0000-000000000001', 1,
   'La Constitución Española de 1978',
   'Estructura, derechos fundamentales, Tribunal Constitucional, Defensor del Pueblo.', 'I'),
  ('c1000000-0000-0000-0001-000000000002', 'b0000000-0000-0000-0000-000000000001', 2,
   'La Corona',
   'La Corona: funciones constitucionales, sucesión, refrendo.', 'I'),
  ('c1000000-0000-0000-0001-000000000003', 'b0000000-0000-0000-0000-000000000001', 3,
   'Las Cortes Generales',
   'Congreso y Senado: composición, funciones legislativas, control al Gobierno.', 'I'),
  ('c1000000-0000-0000-0001-000000000004', 'b0000000-0000-0000-0000-000000000001', 4,
   'El Poder Judicial',
   'Organización judicial española, CGPJ, Tribunal Constitucional.', 'I'),
  ('c1000000-0000-0000-0001-000000000005', 'b0000000-0000-0000-0000-000000000001', 5,
   'El Gobierno y la Administración',
   'Presidente, Consejo de Ministros, funciones del Gobierno. Ley 50/1997.', 'I'),
  ('c1000000-0000-0000-0001-000000000006', 'b0000000-0000-0000-0000-000000000001', 6,
   'Gobierno abierto y sostenibilidad',
   'Concepto, principios, Agenda 2030, objetivos de desarrollo sostenible.', 'I'),
  ('c1000000-0000-0000-0001-000000000007', 'b0000000-0000-0000-0000-000000000001', 7,
   'Transparencia y Buen Gobierno',
   'Ley 19/2013: publicidad activa, derecho de acceso, Consejo de Transparencia.', 'I'),
  ('c1000000-0000-0000-0001-000000000008', 'b0000000-0000-0000-0000-000000000001', 8,
   'La Administración General del Estado',
   'Organización y funcionamiento de la AGE. LRJSP.', 'I'),
  ('c1000000-0000-0000-0001-000000000009', 'b0000000-0000-0000-0000-000000000001', 9,
   'La organización territorial del Estado',
   'Comunidades Autónomas, distribución de competencias.', 'I'),
  ('c1000000-0000-0000-0001-000000000010', 'b0000000-0000-0000-0000-000000000001', 10,
   'La Administración Local',
   'Provincias, municipios, islas: organización y competencias.', 'I'),
  ('c1000000-0000-0000-0001-000000000011', 'b0000000-0000-0000-0000-000000000001', 11,
   'La Unión Europea',
   'Instituciones y organización de la UE: Parlamento, Consejo, Comisión, TJUE.', 'I'),

  -- ─── BLOQUE II: ORGANIZACIÓN DE OFICINAS PÚBLICAS (4 temas) ────────────
  ('c1000000-0000-0000-0001-000000000012', 'b0000000-0000-0000-0000-000000000001', 12,
   'Atención al ciudadano',
   'Discapacidad, servicios de información, quejas y sugerencias.', 'I'),
  ('c1000000-0000-0000-0001-000000000013', 'b0000000-0000-0000-0000-000000000001', 13,
   'Documentación, registro y archivo',
   'Funciones, clases de documentos, ordenación y archivo.', 'I'),
  ('c1000000-0000-0000-0001-000000000014', 'b0000000-0000-0000-0000-000000000001', 14,
   'Administración electrónica',
   'Análisis web, teleservicios, ventanilla única, PAGe.', 'I'),
  ('c1000000-0000-0000-0001-000000000015', 'b0000000-0000-0000-0000-000000000001', 15,
   'Protección de datos personales',
   'RGPD, principios, derechos, responsable y encargado del tratamiento. LOPDGDD.', 'I'),

  -- ─── BLOQUE III: DERECHO ADMINISTRATIVO GENERAL (7 temas) ──────────────
  ('c1000000-0000-0000-0001-000000000016', 'b0000000-0000-0000-0000-000000000001', 16,
   'Las fuentes del Derecho Administrativo',
   'Ley, reglamento, costumbre, principios generales. Jerarquía normativa.', 'I'),
  ('c1000000-0000-0000-0001-000000000017', 'b0000000-0000-0000-0000-000000000001', 17,
   'El acto administrativo',
   'Concepto, clases, elementos, eficacia, validez, notificación.', 'I'),
  ('c1000000-0000-0000-0001-000000000018', 'b0000000-0000-0000-0000-000000000001', 18,
   'Procedimiento administrativo común',
   'LPAC + LRJSP: iniciación, instrucción, terminación, recursos.', 'I'),
  ('c1000000-0000-0000-0001-000000000019', 'b0000000-0000-0000-0000-000000000001', 19,
   'Los contratos del sector público',
   'LCSP (Ley 9/2017): tipos de contratos, procedimientos de adjudicación.', 'I'),
  ('c1000000-0000-0000-0001-000000000020', 'b0000000-0000-0000-0000-000000000001', 20,
   'Formas de la actividad administrativa',
   'Limitación, arbitral, servicio público, fomento.', 'I'),
  ('c1000000-0000-0000-0001-000000000021', 'b0000000-0000-0000-0000-000000000001', 21,
   'Responsabilidad patrimonial de las Administraciones Públicas',
   'Requisitos, procedimiento, indemnización.', 'I'),
  ('c1000000-0000-0000-0001-000000000022', 'b0000000-0000-0000-0000-000000000001', 22,
   'Políticas de igualdad y contra la discriminación',
   'Igualdad efectiva, violencia de género, LGTBI.', 'I'),

  -- ─── BLOQUE IV: GESTIÓN DE PERSONAL (9 temas) ─────────────────────────
  ('c1000000-0000-0000-0001-000000000023', 'b0000000-0000-0000-0000-000000000001', 23,
   'El personal al servicio de las Administraciones Públicas',
   'Clasificación y tipos: funcionarios, laborales, eventuales.', 'I'),
  ('c1000000-0000-0000-0001-000000000024', 'b0000000-0000-0000-0000-000000000001', 24,
   'Selección de personal y provisión de puestos',
   'Oposición, concurso-oposición, concurso. Oferta de empleo público.', 'I'),
  ('c1000000-0000-0000-0001-000000000025', 'b0000000-0000-0000-0000-000000000001', 25,
   'Derechos y deberes de los funcionarios',
   'Estatuto, régimen de derechos individuales y colectivos.', 'I'),
  ('c1000000-0000-0000-0001-000000000026', 'b0000000-0000-0000-0000-000000000001', 26,
   'Adquisición y pérdida de la condición de funcionario',
   'Requisitos, nombramiento, toma de posesión, jubilación.', 'I'),
  ('c1000000-0000-0000-0001-000000000027', 'b0000000-0000-0000-0000-000000000001', 27,
   'Provisión de puestos y carrera administrativa',
   'Concurso, libre designación, comisiones de servicios.', 'I'),
  ('c1000000-0000-0000-0001-000000000028', 'b0000000-0000-0000-0000-000000000001', 28,
   'Régimen de incompatibilidades y régimen disciplinario',
   'Ley 53/1984 de incompatibilidades. Faltas y sanciones.', 'I'),
  ('c1000000-0000-0000-0001-000000000029', 'b0000000-0000-0000-0000-000000000001', 29,
   'Seguridad Social de los funcionarios',
   'MUFACE, Clases Pasivas, prestaciones.', 'I'),
  ('c1000000-0000-0000-0001-000000000030', 'b0000000-0000-0000-0000-000000000001', 30,
   'Personal laboral: IV Convenio Único',
   'Régimen del personal laboral de la AGE. Resolución 17/11/2022.', 'I'),
  ('c1000000-0000-0000-0001-000000000031', 'b0000000-0000-0000-0000-000000000001', 31,
   'Seguridad Social del personal laboral',
   'LGSS (RDL 8/2015): régimen general, prestaciones.', 'I'),

  -- ─── BLOQUE V: GESTIÓN FINANCIERA (6 temas) ───────────────────────────
  ('c1000000-0000-0000-0001-000000000032', 'b0000000-0000-0000-0000-000000000001', 32,
   'El presupuesto: concepto y principios presupuestarios',
   'Principios: unidad, universalidad, anualidad, especialidad.', 'I'),
  ('c1000000-0000-0000-0001-000000000033', 'b0000000-0000-0000-0000-000000000001', 33,
   'Estructura del Presupuesto del Estado',
   'Clasificación orgánica, funcional y económica. LGP.', 'I'),
  ('c1000000-0000-0000-0001-000000000034', 'b0000000-0000-0000-0000-000000000001', 34,
   'El procedimiento de ejecución del presupuesto',
   'Créditos extraordinarios y suplementarios. Modificaciones presupuestarias.', 'I'),
  ('c1000000-0000-0000-0001-000000000035', 'b0000000-0000-0000-0000-000000000001', 35,
   'Retribuciones e indemnizaciones del personal',
   'Sueldo, trienios, complementos, indemnizaciones por razón del servicio.', 'I'),
  ('c1000000-0000-0000-0001-000000000036', 'b0000000-0000-0000-0000-000000000001', 36,
   'Gastos y pagos por operaciones de bienes y servicios',
   'Procedimiento de gasto, autorización, disposición, obligación, pago.', 'I'),
  ('c1000000-0000-0000-0001-000000000037', 'b0000000-0000-0000-0000-000000000001', 37,
   'Gestión económica de contratos y subvenciones',
   'Ejecución económica de contratos. Ley 38/2003 General de Subvenciones.', 'I'),

  -- ─── BLOQUE VI: INFORMÁTICA Y OFIMÁTICA (8 temas) ─────────────────────
  ('c1000000-0000-0000-0001-000000000038', 'b0000000-0000-0000-0000-000000000001', 38,
   'Informática básica',
   'Hardware, software, almacenamiento, seguridad informática.', 'II'),
  ('c1000000-0000-0000-0001-000000000039', 'b0000000-0000-0000-0000-000000000001', 39,
   'Sistema operativo Windows 11',
   'Escritorio, configuración, administración básica.', 'II'),
  ('c1000000-0000-0000-0001-000000000040', 'b0000000-0000-0000-0000-000000000001', 40,
   'El explorador de archivos de Windows 11',
   'Gestión de archivos y carpetas, búsqueda, accesos directos.', 'II'),
  ('c1000000-0000-0000-0001-000000000041', 'b0000000-0000-0000-0000-000000000001', 41,
   'Procesador de textos Word 365',
   'Edición, formatos, estilos, tablas, combinar correspondencia.', 'II'),
  ('c1000000-0000-0000-0001-000000000042', 'b0000000-0000-0000-0000-000000000001', 42,
   'Hoja de cálculo Excel 365',
   'Fórmulas, funciones, gráficos, tablas dinámicas.', 'II'),
  ('c1000000-0000-0000-0001-000000000043', 'b0000000-0000-0000-0000-000000000001', 43,
   'Base de datos Access 365',
   'Tablas, consultas, formularios, informes.', 'II'),
  ('c1000000-0000-0000-0001-000000000044', 'b0000000-0000-0000-0000-000000000001', 44,
   'Correo electrónico Outlook 365',
   'Correo, calendario, contactos, tareas.', 'II'),
  ('c1000000-0000-0000-0001-000000000045', 'b0000000-0000-0000-0000-000000000001', 45,
   'Fundamentos de Internet',
   'Navegadores, buscadores, protocolos, seguridad web.', 'II')
ON CONFLICT (oposicion_id, numero) DO NOTHING;
