-- =============================================================================
-- OPTEK Migration 007: Actualizar a 28 temas — Convocatoria 2025-2026
-- Autor: Claude / Aritz | Fecha: 2026-02-23
--
-- Motivo: El seed inicial tenía 25 temas con estructura diferente.
-- Esta migración actualiza al temario oficial 2025-2026 (BOE convocatoria):
--   Bloque I  (temas 1-16): Organización Pública
--   Bloque II (temas 17-28): Actividad Administrativa y Ofimática
--
-- DDIA Reliability: ON CONFLICT DO UPDATE → idempotente. Ejecutable N veces.
-- =============================================================================

-- 1. Actualizar número de temas en la oposición
UPDATE oposiciones
SET num_temas = 28
WHERE slug = 'aux-admin-estado';

-- 2. Upsert de los 28 temas oficiales
-- ON CONFLICT (oposicion_id, numero): si ya existe ese tema en esa posición → actualiza título y descripción.
INSERT INTO temas (id, oposicion_id, numero, titulo, descripcion)
SELECT
  t.id,
  (SELECT id FROM oposiciones WHERE slug = 'aux-admin-estado'),
  t.numero,
  t.titulo,
  t.descripcion
FROM (VALUES
  -- ── BLOQUE I: ORGANIZACIÓN PÚBLICA (16 temas) ─────────────────────────────
  ('b0000000-0000-0000-0001-000000000001'::uuid, 1,
   'La Constitución Española de 1978',
   'Estructura y contenido. Principios fundamentales. Derechos y deberes fundamentales. Garantías constitucionales. Reforma constitucional.'),
  ('b0000000-0000-0000-0001-000000000002'::uuid, 2,
   'El Tribunal Constitucional y la reforma constitucional',
   'El Tribunal Constitucional: composición, organización y atribuciones. El procedimiento de reforma de la Constitución.'),
  ('b0000000-0000-0000-0001-000000000003'::uuid, 3,
   'Las Cortes Generales',
   'El Congreso de los Diputados y el Senado: composición, atribuciones y funcionamiento. El estatuto de los parlamentarios.'),
  ('b0000000-0000-0000-0001-000000000004'::uuid, 4,
   'El Poder Judicial',
   'La organización judicial española. El Consejo General del Poder Judicial. El Ministerio Fiscal.'),
  ('b0000000-0000-0000-0001-000000000005'::uuid, 5,
   'El Gobierno y la Administración',
   'El Gobierno: composición, nombramiento y cese. Funciones del Presidente del Gobierno. Relaciones Gobierno-Cortes.'),
  ('b0000000-0000-0000-0001-000000000006'::uuid, 6,
   'Gobierno Abierto',
   'Concepto y principios del Gobierno Abierto. Participación ciudadana. Datos abiertos. Rendición de cuentas.'),
  ('b0000000-0000-0000-0001-000000000007'::uuid, 7,
   'La Transparencia y el buen gobierno',
   'Ley 19/2013, de transparencia, acceso a la información pública y buen gobierno. El Portal de la Transparencia. El Consejo de Transparencia.'),
  ('b0000000-0000-0000-0001-000000000008'::uuid, 8,
   'La Administración General del Estado',
   'Organización central: Ministerios, Secretarías de Estado, Subsecretarías. Organización periférica: Delegados del Gobierno. Administración en el exterior.'),
  ('b0000000-0000-0000-0001-000000000009'::uuid, 9,
   'La organización territorial del Estado',
   'Las Comunidades Autónomas: estatutos y competencias. La Administración Local: municipios, provincias e islas. Los principios de autonomía local.'),
  ('b0000000-0000-0000-0001-000000000010'::uuid, 10,
   'La Unión Europea: instituciones',
   'Parlamento Europeo, Consejo de la UE, Comisión Europea, Tribunal de Justicia, Banco Central Europeo. El Derecho Comunitario y su primacía.'),
  ('b0000000-0000-0000-0001-000000000011'::uuid, 11,
   'El procedimiento administrativo común (LPAC/LRJSP)',
   'Ley 39/2015 y Ley 40/2015: ámbito de aplicación, interesados, derechos, plazos, actos administrativos, notificaciones, recursos, silencio administrativo.'),
  ('b0000000-0000-0000-0001-000000000012'::uuid, 12,
   'La protección de datos personales',
   'RGPD (Reglamento UE 2016/679) y LOPDGDD (LO 3/2018): principios, derechos de los interesados, obligaciones del responsable del tratamiento, la AEPD.'),
  ('b0000000-0000-0000-0001-000000000013'::uuid, 13,
   'El personal funcionario: el TREBEP',
   'Real Decreto Legislativo 5/2015 (TREBEP): clases de empleados públicos, acceso a la función pública, carrera profesional, situaciones administrativas.'),
  ('b0000000-0000-0000-0001-000000000014'::uuid, 14,
   'Derechos y deberes de los empleados públicos',
   'Derechos individuales y colectivos. Código de conducta: principios éticos. Régimen de incompatibilidades. Régimen disciplinario: faltas y sanciones.'),
  ('b0000000-0000-0000-0001-000000000015'::uuid, 15,
   'El Presupuesto del Estado',
   'Ley General Presupuestaria (Ley 47/2003): concepto y principios. Elaboración, aprobación y ejecución. Control interno (IGAE) y externo (Tribunal de Cuentas).'),
  ('b0000000-0000-0000-0001-000000000016'::uuid, 16,
   'Políticas de igualdad: LGTBI',
   'Ley 4/2023, para la igualdad real y efectiva de las personas trans y para la garantía de los derechos de las personas LGTBI. Planes de igualdad. Diversidad e inclusión en las AAPP.'),

  -- ── BLOQUE II: ACTIVIDAD ADMINISTRATIVA Y OFIMÁTICA (12 temas) ────────────
  ('b0000000-0000-0000-0002-000000000001'::uuid, 17,
   'La atención al público',
   'Técnicas de comunicación oral y escrita. Atención al ciudadano: principios y derechos. Quejas y sugerencias. Accesibilidad y atención a personas con discapacidad.'),
  ('b0000000-0000-0000-0002-000000000002'::uuid, 18,
   'Los servicios de información administrativa',
   'La información administrativa: tipos y canales. Las oficinas de información y atención al ciudadano. El punto de acceso general (PAGe). La Carpeta Ciudadana.'),
  ('b0000000-0000-0000-0002-000000000003'::uuid, 19,
   'El documento, el registro y el archivo',
   'El documento administrativo: concepto y clases. El registro: concepto y clases. El archivo: tipos y gestión documental. Transferencias y expurgo.'),
  ('b0000000-0000-0000-0002-000000000004'::uuid, 20,
   'La Administración Electrónica',
   'La sede electrónica. El registro electrónico. La notificación electrónica. El DNI electrónico y la firma digital. Cl@ve: sistemas de identificación.'),
  ('b0000000-0000-0000-0002-000000000005'::uuid, 21,
   'La Informática básica',
   'Conceptos básicos de hardware y software. Sistemas operativos. Redes: Internet, intranet, correo electrónico. Seguridad informática básica.'),
  ('b0000000-0000-0000-0002-000000000006'::uuid, 22,
   'Windows 11 y Copilot',
   'Características de Windows 11. Configuración del sistema. Copilot en Windows: funcionalidades e integración. Accesibilidad en Windows 11.'),
  ('b0000000-0000-0000-0002-000000000007'::uuid, 23,
   'El Explorador de Windows',
   'Gestión de archivos y carpetas. Operaciones básicas: copiar, mover, eliminar, buscar. Propiedades de archivos. Carpetas especiales. Compresión de archivos.'),
  ('b0000000-0000-0000-0002-000000000008'::uuid, 24,
   'Microsoft Word 365',
   'Edición y formato de documentos. Estilos y plantillas. Tablas e imágenes. Revisión ortográfica. Combinar correspondencia. Compartir y exportar documentos.'),
  ('b0000000-0000-0000-0002-000000000009'::uuid, 25,
   'Microsoft Excel 365',
   'Hojas de cálculo: conceptos básicos. Fórmulas y funciones. Formato condicional. Gráficos. Tablas dinámicas. Filtros y ordenación. Importar/exportar datos.'),
  ('b0000000-0000-0000-0002-000000000010'::uuid, 26,
   'Microsoft Access 365',
   'Bases de datos relacionales: conceptos. Tablas, consultas, formularios e informes. Relaciones entre tablas. Importar y exportar datos. Macros básicas.'),
  ('b0000000-0000-0000-0002-000000000011'::uuid, 27,
   'Microsoft Outlook 365',
   'Correo electrónico: redacción, respuesta y organización. Contactos y grupos. Calendario y tareas. Reglas y categorías. Configuración de cuentas.'),
  ('b0000000-0000-0000-0002-000000000012'::uuid, 28,
   'La Red Internet',
   'Conceptos básicos de Internet: protocolos, navegadores, URL. Buscadores y estrategias de búsqueda. Seguridad en Internet: phishing, malware. Servicios en la nube.')
) AS t(id, numero, titulo, descripcion)
ON CONFLICT (oposicion_id, numero)
DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descripcion = EXCLUDED.descripcion;

-- 3. Eliminar temas obsoletos que ya no están en el temario (si los hubiera)
-- Los temas del seed original (num 1-25 con estructura antigua) se actualizan arriba.
-- Temas con número > 28 son residuales — limpiar solo si no tienen datos.
DELETE FROM temas
WHERE
  oposicion_id = (SELECT id FROM oposiciones WHERE slug = 'aux-admin-estado')
  AND numero > 28
  AND id NOT IN (SELECT DISTINCT tema_id FROM tests_generados WHERE tema_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT tema_id FROM desarrollos);
