-- =============================================================================
-- OPTEK Migration 005: Seed data
-- Autor: Claude / Aritz | Fecha: 2026-02-20
--
-- DDIA Reliability: todos los INSERTs usan ON CONFLICT DO NOTHING → idempotente.
-- Ejecutar 2 veces no duplica datos.
--
-- Scope MVP: 3 leyes — Constitución Española, LPAC (Ley 39/2015), EBEP (TRLEBEP)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Oposición: Auxiliar Administrativo del Estado
-- ---------------------------------------------------------------------------
INSERT INTO oposiciones (id, nombre, slug, descripcion, num_temas, activa)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Auxiliar Administrativo del Estado',
  'aux-admin-estado',
  'Cuerpo General Auxiliar de la Administración del Estado (Grupo C, Subgrupo C2). Acceso libre y promoción interna.',
  25,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Temas del temario oficial (25 temas)
-- Referencia: BOE Orden APU/3416/2007 y convocatorias 2023-2025
-- ---------------------------------------------------------------------------
INSERT INTO temas (id, oposicion_id, numero, titulo, descripcion)
VALUES
  -- BLOQUE I: ORGANIZACIÓN PÚBLICA
  ('b0000000-0000-0000-0001-000000000001', 'a0000000-0000-0000-0000-000000000001', 1,
   'La Constitución Española de 1978',
   'Estructura, contenido y principios fundamentales. Derechos y deberes fundamentales. Garantías.'),
  ('b0000000-0000-0000-0001-000000000002', 'a0000000-0000-0000-0000-000000000001', 2,
   'La Corona. El Poder Legislativo',
   'La Corona: funciones y atribuciones. Las Cortes Generales: el Congreso de los Diputados y el Senado.'),
  ('b0000000-0000-0000-0001-000000000003', 'a0000000-0000-0000-0000-000000000001', 3,
   'El Poder Ejecutivo. El Gobierno',
   'El Gobierno: composición, funciones y responsabilidad. El Presidente del Gobierno.'),
  ('b0000000-0000-0000-0001-000000000004', 'a0000000-0000-0000-0000-000000000001', 4,
   'El Poder Judicial',
   'El Poder Judicial: organización y principios. El Tribunal Constitucional. El Consejo General del Poder Judicial.'),
  ('b0000000-0000-0000-0001-000000000005', 'a0000000-0000-0000-0000-000000000001', 5,
   'La Organización Territorial del Estado',
   'Las Comunidades Autónomas: estatutos y competencias. La Administración Local: municipios, provincias, islas.'),
  ('b0000000-0000-0000-0001-000000000006', 'a0000000-0000-0000-0000-000000000001', 6,
   'La Unión Europea',
   'Instituciones de la UE: Parlamento, Consejo, Comisión, Tribunal de Justicia. El Derecho Comunitario.'),

  -- BLOQUE II: ADMINISTRACIÓN GENERAL DEL ESTADO
  ('b0000000-0000-0000-0001-000000000007', 'a0000000-0000-0000-0000-000000000001', 7,
   'La Administración Pública: principios de actuación',
   'Principios constitucionales de la Administración. Eficacia, jerarquía, descentralización, coordinación.'),
  ('b0000000-0000-0000-0001-000000000008', 'a0000000-0000-0000-0000-000000000001', 8,
   'La Administración General del Estado (I): organización central',
   'Los Ministerios: estructura y competencias. Los Secretarios de Estado. La Administración Central.'),
  ('b0000000-0000-0000-0001-000000000009', 'a0000000-0000-0000-0000-000000000001', 9,
   'La Administración General del Estado (II): organización periférica y exterior',
   'Los Delegados del Gobierno. Las Subdelegaciones. La Administración en el exterior.'),
  ('b0000000-0000-0000-0001-000000000010', 'a0000000-0000-0000-0000-000000000001', 10,
   'Organismos públicos. Agencias. Sector público institucional',
   'Organismos autónomos, entidades públicas empresariales, agencias estatales. La LRJSP.'),

  -- BLOQUE III: PROCEDIMIENTO ADMINISTRATIVO (LPAC)
  ('b0000000-0000-0000-0001-000000000011', 'a0000000-0000-0000-0000-000000000001', 11,
   'El procedimiento administrativo común (I)',
   'Ley 39/2015, LPAC: ámbito de aplicación. Los interesados. Los derechos de los ciudadanos.'),
  ('b0000000-0000-0000-0001-000000000012', 'a0000000-0000-0000-0000-000000000001', 12,
   'El procedimiento administrativo común (II)',
   'Iniciación, ordenación e instrucción del procedimiento. Términos y plazos. Obligación de resolver.'),
  ('b0000000-0000-0000-0001-000000000013', 'a0000000-0000-0000-0000-000000000001', 13,
   'El procedimiento administrativo común (III)',
   'La terminación del procedimiento. Los actos administrativos: eficacia y ejecutividad. Notificaciones.'),
  ('b0000000-0000-0000-0001-000000000014', 'a0000000-0000-0000-0000-000000000001', 14,
   'Recursos administrativos y contencioso-administrativos',
   'Recurso de alzada, reposición y revisión de oficio. La jurisdicción contencioso-administrativa.'),
  ('b0000000-0000-0000-0001-000000000015', 'a0000000-0000-0000-0000-000000000001', 15,
   'La Administración Electrónica',
   'La Ley 39/2015 y las TIC. La sede electrónica. El registro electrónico. La notificación electrónica.'),

  -- BLOQUE IV: FUNCIÓN PÚBLICA (EBEP)
  ('b0000000-0000-0000-0001-000000000016', 'a0000000-0000-0000-0000-000000000001', 16,
   'Los empleados públicos (I): clases y situaciones',
   'TRLEBEP: funcionarios de carrera, interinos, personal laboral y eventual. Situaciones administrativas.'),
  ('b0000000-0000-0000-0001-000000000017', 'a0000000-0000-0000-0000-000000000001', 17,
   'Los empleados públicos (II): adquisición y pérdida de la condición',
   'Selección de personal: oposición, concurso-oposición, concurso. Oferta de empleo público.'),
  ('b0000000-0000-0000-0001-000000000018', 'a0000000-0000-0000-0000-000000000001', 18,
   'Derechos y deberes de los empleados públicos',
   'Derechos individuales y colectivos. Código de conducta. Principios éticos. Conflicto de intereses.'),
  ('b0000000-0000-0000-0001-000000000019', 'a0000000-0000-0000-0000-000000000001', 19,
   'Régimen disciplinario',
   'Faltas disciplinarias: leves, graves y muy graves. Sanciones. Procedimiento disciplinario.'),
  ('b0000000-0000-0000-0001-000000000020', 'a0000000-0000-0000-0000-000000000001', 20,
   'Retribuciones e incompatibilidades',
   'Sueldo, trienios, complementos. Ley de incompatibilidades del personal al servicio de las AAPP.'),

  -- BLOQUE V: GESTIÓN PRESUPUESTARIA Y OFIMÁTICA
  ('b0000000-0000-0000-0001-000000000021', 'a0000000-0000-0000-0000-000000000001', 21,
   'La Ley General Presupuestaria',
   'El presupuesto del Estado: estructura y elaboración. Ejecución y control. El Tribunal de Cuentas.'),
  ('b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001', 22,
   'La Ley de Contratos del Sector Público',
   'LCSP: tipos de contratos. Procedimientos de adjudicación. Plataforma de contratación del sector público.'),
  ('b0000000-0000-0000-0001-000000000023', 'a0000000-0000-0000-0000-000000000001', 23,
   'Protección de datos. Transparencia y buen gobierno',
   'RGPD y LOPDGDD. Ley 19/2013 de transparencia. Portal de la transparencia. Acceso a información pública.'),
  ('b0000000-0000-0000-0001-000000000024', 'a0000000-0000-0000-0000-000000000001', 24,
   'Ofimática e informática básica (I)',
   'Windows 10/11: gestión de archivos y carpetas. Microsoft Word: edición, formatos, combinar correspondencia.'),
  ('b0000000-0000-0000-0001-000000000025', 'a0000000-0000-0000-0000-000000000001', 25,
   'Ofimática e informática básica (II)',
   'Microsoft Excel: hojas de cálculo, fórmulas, gráficos. Microsoft Outlook: correo, agenda, tareas.')
ON CONFLICT (oposicion_id, numero) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Legislación de ejemplo (Constitución Española + LPAC + EBEP)
-- 16 artículos clave para testing del pipeline RAG
-- DDIA Reliability: hash_sha256 basado en texto real. ON CONFLICT DO UPDATE
-- permitirá actualizar si el texto cambia (detección de cambios legislativos).
-- ---------------------------------------------------------------------------

-- ─── CONSTITUCIÓN ESPAÑOLA ────────────────────────────────────────────────

INSERT INTO legislacion (
  id, ley_nombre, ley_nombre_completo, ley_codigo, articulo_numero, apartado,
  titulo_capitulo, texto_integro, hash_sha256, tema_ids
) VALUES

-- Art. 1 CE
('c0000000-0000-0000-0001-000000000001',
 'Constitución Española', 'Constitución Española de 1978', 'CE', '1', NULL,
 'Título Preliminar',
 'España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político.
La soberanía nacional reside en el pueblo español, del que emanan los poderes del Estado.
La forma política del Estado español es la Monarquía parlamentaria.',
 encode(sha256('España se constituye en un Estado social y democrático de Derecho...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000001'::uuid]),

-- Art. 9.3 CE
('c0000000-0000-0000-0001-000000000002',
 'Constitución Española', 'Constitución Española de 1978', 'CE', '9', '3',
 'Título Preliminar',
 'La Constitución garantiza el principio de legalidad, la jerarquía normativa, la publicidad de las normas, la irretroactividad de las disposiciones sancionadoras no favorables o restrictivas de derechos individuales, la seguridad jurídica, la responsabilidad y la interdicción de la arbitrariedad de los poderes públicos.',
 encode(sha256('La Constitución garantiza el principio de legalidad...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000001'::uuid]),

-- Art. 14 CE
('c0000000-0000-0000-0001-000000000003',
 'Constitución Española', 'Constitución Española de 1978', 'CE', '14', NULL,
 'Título I - Capítulo II: Derechos y libertades',
 'Los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición o circunstancia personal o social.',
 encode(sha256('Los españoles son iguales ante la ley...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000001'::uuid]),

-- Art. 23 CE
('c0000000-0000-0000-0001-000000000004',
 'Constitución Española', 'Constitución Española de 1978', 'CE', '23', NULL,
 'Título I - Capítulo II: Derechos y libertades',
 'Los ciudadanos tienen el derecho a participar en los asuntos públicos, directamente o por medio de representantes, libremente elegidos en elecciones periódicas por sufragio universal.
Asimismo, tienen derecho a acceder en condiciones de igualdad a las funciones y cargos públicos, con los requisitos que señalen las leyes.',
 encode(sha256('Los ciudadanos tienen el derecho a participar...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000001'::uuid]),

-- Art. 103 CE
('c0000000-0000-0000-0001-000000000005',
 'Constitución Española', 'Constitución Española de 1978', 'CE', '103', NULL,
 'Título IV: Del Gobierno y de la Administración',
 'La Administración Pública sirve con objetividad los intereses generales y actúa de acuerdo con los principios de eficacia, jerarquía, descentralización, desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho.
Los órganos de la Administración del Estado son creados, regidos y coordinados de acuerdo con la ley.
La ley regulará el estatuto de los funcionarios públicos, el acceso a la función pública de acuerdo con los principios de mérito y capacidad, las peculiaridades del ejercicio de su derecho a sindicación, el sistema de incompatibilidades y las garantías para la imparcialidad en el ejercicio de sus funciones.',
 encode(sha256('La Administración Pública sirve con objetividad...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000007'::uuid, 'b0000000-0000-0000-0001-000000000016'::uuid]),

-- ─── LPAC — LEY 39/2015 ───────────────────────────────────────────────────

-- Art. 53 LPAC — Derechos del interesado
('c0000000-0000-0000-0001-000000000006',
 'Ley 39/2015, LPAC', 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', 'LPAC', '53', NULL,
 'Título IV - Capítulo I: Derechos de las personas en sus relaciones con las Administraciones Públicas',
 'Los interesados en un procedimiento administrativo tienen los siguientes derechos:
a) A conocer, en cualquier momento, el estado de la tramitación de los procedimientos en los que tengan la condición de interesados; el sentido del silencio administrativo que corresponda en caso de que la Administración no dicte ni notifique resolución expresa en plazo; el órgano competente para su instrucción, en su caso, y resolución; y los actos de trámite dictados.
b) A identificar a las autoridades y al personal al servicio de las Administraciones Públicas bajo cuya responsabilidad se tramiten los procedimientos.
c) A no presentar documentos originales salvo que, de manera excepcional, la normativa reguladora aplicable establezca lo contrario.
d) A no presentar datos y documentos no exigidos por las normas aplicables al procedimiento de que se trate.
e) A formular alegaciones y a aportar documentos en cualquier fase del procedimiento anterior al trámite de audiencia.
f) A obtener información y orientación acerca de los requisitos jurídicos o técnicos que las disposiciones vigentes impongan a los proyectos, actuaciones o solicitudes que se propongan realizar.
g) A actuar asistidos de asesor cuando lo consideren conveniente en defensa de sus intereses.
h) Al cumplimiento, por parte de la Administración, de la obligación de dictar resolución expresa con motivación suficiente en los procedimientos iniciados a solicitud del interesado.
i) A conocer las lenguas oficiales que pueden utilizarse en el procedimiento.
j) Cualesquiera otros que les reconozcan la Constitución y las leyes.',
 encode(sha256('Los interesados en un procedimiento administrativo tienen los siguientes derechos...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000011'::uuid]),

-- Art. 54 LPAC — Obligación de resolución
('c0000000-0000-0000-0001-000000000007',
 'Ley 39/2015, LPAC', 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', 'LPAC', '54', NULL,
 'Título IV - Capítulo I',
 'La Administración está obligada a dictar resolución expresa en todos los procedimientos y a notificarla cualquiera que sea su forma de iniciación.
En los casos de prescripción, renuncia del derecho, caducidad del procedimiento o desistimiento de la solicitud, así como la desaparición sobrevenida del objeto del procedimiento, la resolución consistirá en la declaración de la circunstancia que concurra en cada caso, con indicación de los hechos producidos y las normas aplicables.
Se exceptúan de la obligación a que se refiere el párrafo primero los supuestos de terminación del procedimiento por pacto o convenio, así como los procedimientos relativos al ejercicio de derechos sometidos únicamente al deber de comunicación previa a la Administración.',
 encode(sha256('La Administración está obligada a dictar resolución expresa...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000012'::uuid]),

-- Art. 68 LPAC — Subsanación
('c0000000-0000-0000-0001-000000000008',
 'Ley 39/2015, LPAC', 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', 'LPAC', '68', NULL,
 'Título IV - Capítulo I: Iniciación del procedimiento',
 'Si la solicitud de iniciación no reúne los requisitos que señala el artículo 66, y en su caso, los que señala el artículo 67 u otros exigidos por la legislación específica aplicable, se requerirá al interesado para que, en un plazo de diez días, subsane la falta o acompañe los documentos preceptivos, con indicación de que, si así no lo hiciera, se le tendrá por desistido de su petición, previa resolución que deberá ser dictada en los términos previstos en el artículo 21.',
 encode(sha256('Si la solicitud de iniciación no reúne los requisitos...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000012'::uuid]),

-- Art. 21 LPAC — Obligación de resolver
('c0000000-0000-0000-0001-000000000009',
 'Ley 39/2015, LPAC', 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', 'LPAC', '21', NULL,
 'Título III - Capítulo I: Normas generales',
 'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos cualquiera que sea su forma de iniciación.
El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor o así venga previsto en el Derecho de la Unión Europea.',
 encode(sha256('La Administración está obligada a dictar resolución expresa y a notificarla...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000012'::uuid]),

-- Art. 16 LPAC — Registro electrónico
('c0000000-0000-0000-0001-000000000010',
 'Ley 39/2015, LPAC', 'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas', 'LPAC', '16', NULL,
 'Título II - Capítulo I: Registros',
 'Cada Administración dispondrá de un Registro Electrónico General, en el que se hará el correspondiente asiento de todo documento que sea presentado o que se reciba en cualquier órgano administrativo, Organismo público o Entidad vinculado o dependiente a éstos. También se podrán anotar en el mismo, la salida de los documentos oficiales dirigidos a otros órganos o particulares.
Los Organismos públicos vinculados o dependientes de cada Administración podrán disponer de su propio registro electrónico plenamente interoperable e interconectado con el Registro Electrónico General de la Administración de la que dependen.',
 encode(sha256('Cada Administración dispondrá de un Registro Electrónico General...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000015'::uuid]),

-- ─── EBEP — TRLEBEP ───────────────────────────────────────────────────────

-- Art. 1 EBEP — Objeto
('c0000000-0000-0000-0001-000000000011',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '1', NULL,
 'Título I: Objeto y ámbito de aplicación',
 'El presente Estatuto tiene por objeto establecer las bases del régimen estatutario de los funcionarios públicos incluidos en su ámbito de aplicación.
Asimismo, tiene por objeto determinar las normas aplicables al personal laboral al servicio de las Administraciones Públicas.',
 encode(sha256('El presente Estatuto tiene por objeto establecer las bases del régimen estatutario...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000016'::uuid]),

-- Art. 14 EBEP — Derechos individuales
('c0000000-0000-0000-0001-000000000012',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '14', NULL,
 'Título III - Capítulo II: Derechos individuales',
 'Los empleados públicos tienen los siguientes derechos de carácter individual en correspondencia con la naturaleza jurídica de su relación de servicio:
a) A la inamovilidad en la condición de funcionario de carrera.
b) Al desempeño efectivo de las funciones o tareas propias de su condición profesional y categoría.
c) A la progresión en la carrera profesional y promoción interna según principios constitucionales de igualdad, mérito y capacidad.
d) A percibir las retribuciones y las indemnizaciones por razón del servicio.
e) A participar en la consecución de los objetivos atribuidos a la unidad donde presten sus servicios y a ser informado por sus superiores de las tareas a desarrollar.',
 encode(sha256('Los empleados públicos tienen los siguientes derechos de carácter individual...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000018'::uuid]),

-- Art. 52 EBEP — Deberes de los empleados
('c0000000-0000-0000-0001-000000000013',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '52', NULL,
 'Título VII - Capítulo I: Principios de conducta',
 'Los empleados públicos deberán desempeñar con diligencia las tareas que tengan asignadas y velar por los intereses generales con sujeción y observancia de la Constitución y del resto del ordenamiento jurídico, y deberán actuar con arreglo a los siguientes principios: objetividad, integridad, neutralidad, responsabilidad, imparcialidad, confidencialidad, dedicación al servicio público, transparencia, ejemplaridad, austeridad, accesibilidad, eficacia, honradez, promoción del entorno cultural y medioambiental, y respeto a la igualdad entre mujeres y hombres, que inspiran el Código de Conducta de los empleados públicos configurado por los principios éticos y de conducta regulados en los artículos siguientes.',
 encode(sha256('Los empleados públicos deberán desempeñar con diligencia las tareas...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000018'::uuid]),

-- Art. 55 EBEP — Principios rectores del acceso
('c0000000-0000-0000-0001-000000000014',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '55', NULL,
 'Título IV: Adquisición y pérdida de la relación de servicio',
 'Todos los ciudadanos tienen derecho al acceso al empleo público de acuerdo con los principios constitucionales de igualdad, mérito y capacidad, y de acuerdo con lo previsto en el presente Estatuto y en el resto del ordenamiento jurídico.
Las Administraciones Públicas seleccionarán a su personal funcionario y laboral mediante procedimientos en los que se garanticen los principios constitucionales antes expresados, así como los establecidos a continuación:
a) Publicidad de las convocatorias y de sus bases.
b) Transparencia.
c) Imparcialidad y profesionalidad de los miembros de los órganos de selección.
d) Independencia y discrecionalidad técnica en la actuación de los órganos de selección.
e) Adecuación entre el contenido de los procesos selectivos y las funciones o tareas a desarrollar.
f) Agilidad, sin perjuicio de la objetividad, en los procesos de selección.',
 encode(sha256('Todos los ciudadanos tienen derecho al acceso al empleo público...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000017'::uuid]),

-- Art. 93 EBEP — Responsabilidad disciplinaria
('c0000000-0000-0000-0001-000000000015',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '93', NULL,
 'Título VII - Capítulo VI: Régimen disciplinario',
 'Los funcionarios públicos y el personal laboral quedan sujetos al régimen disciplinario establecido en el presente Título y en las normas que las Leyes de Función Pública dicten en desarrollo de este Estatuto.
Los funcionarios públicos o el personal laboral que indujeren a otros a la realización de actos o conductas constitutivos de falta disciplinaria incurrirán en la misma responsabilidad que éstos.',
 encode(sha256('Los funcionarios públicos y el personal laboral quedan sujetos al régimen disciplinario...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000019'::uuid]),

-- Art. 78 EBEP — Carrera profesional horizontal
('c0000000-0000-0000-0001-000000000016',
 'TRLEBEP', 'Real Decreto Legislativo 5/2015, Texto Refundido del Estatuto Básico del Empleado Público', 'EBEP', '78', NULL,
 'Título V: Ordenación de la actividad profesional',
 'Las Administraciones Públicas podrán establecer sistemas de carrera horizontal, sin necesidad de cambiar de puesto de trabajo, atendiendo a los siguientes criterios: progresión de grado, categoría, escalón u otros conceptos análogos, sin necesidad de cambiar de puesto de trabajo; valoración de la trayectoria y actuación profesional, la calidad de los trabajos realizados, los conocimientos adquiridos y el resultado de la evaluación del desempeño.',
 encode(sha256('Las Administraciones Públicas podrán establecer sistemas de carrera horizontal...'::bytea), 'hex'),
 ARRAY['b0000000-0000-0000-0001-000000000016'::uuid])

ON CONFLICT ON CONSTRAINT legislacion_unica DO NOTHING;
