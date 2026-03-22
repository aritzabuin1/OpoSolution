-- Migration 040: A2 GACE (Gestión de la Administración Civil del Estado)
-- Inserta oposición + 58 temas + tabla supuestos_practicos + supuestos_balance

BEGIN;

-- ─── 1. Oposición A2 GACE ─────────────────────────────────────────────────────
INSERT INTO oposiciones (id, nombre, slug, descripcion, num_temas, activa, features)
VALUES (
  'c2000000-0000-0000-0000-000000000001',
  'Gestión de la Administración Civil del Estado',
  'gestion-estado',
  'Cuerpo de Gestión de la Administración Civil del Estado (GACE, Grupo A2). 1.356 plazas 2026. 58 temas en 6 bloques. Incluye supuesto práctico.',
  58,
  false,
  '{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": true, "ofimatica": false}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ─── 2. 58 Temas ──────────────────────────────────────────────────────────────

-- BLOQUE I — Constitución y organización del Estado (temas 1-11)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000001-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 1, 'La Constitución Española de 1978: estructura y contenido. La reforma de la Constitución.', 'I'),
  ('c2000002-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 2, 'Derechos y deberes fundamentales. Su garantía y suspensión. El Defensor del Pueblo.', 'I'),
  ('c2000003-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 3, 'El Tribunal Constitucional. Organización, composición y atribuciones.', 'I'),
  ('c2000004-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 4, 'La Corona. Funciones constitucionales del Rey. Sucesión y regencia. El refrendo.', 'I'),
  ('c2000005-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 5, 'El poder legislativo. Las Cortes Generales. Composición y atribuciones del Congreso y del Senado.', 'I'),
  ('c2000006-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 6, 'El poder ejecutivo. El Presidente del Gobierno y el Consejo de Ministros. Relaciones Gobierno-Cortes. El Consejo de Estado.', 'I'),
  ('c2000007-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 7, 'El poder judicial. Principio de unidad jurisdiccional. CGPJ. Organización judicial española.', 'I'),
  ('c2000008-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 8, 'La AGE. Principios de organización. Órganos centrales, superiores y directivos. Servicios comunes. Órganos territoriales. Administración exterior.', 'I'),
  ('c2000009-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 9, 'El sector público institucional: entidades que lo integran y régimen jurídico.', 'I'),
  ('c2000010-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 10, 'Organización territorial (I): las CCAA. Estatutos de Autonomía. Delimitación competencias Estado-CCAA.', 'I'),
  ('c2000011-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 11, 'Organización territorial (II): la Administración local. Autonomía local. Municipio y provincia.', 'I')
ON CONFLICT (id) DO NOTHING;

-- BLOQUE II — Unión Europea (temas 12-17)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000012-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 12, 'La UE: antecedentes, objetivos, naturaleza jurídica. Tratados. TUE y TFUE. Ampliación. Cooperaciones reforzadas.', 'II'),
  ('c2000013-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 13, 'Organización UE (I): Consejo Europeo, Consejo, Comisión. Procedimiento decisorio.', 'II'),
  ('c2000014-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 14, 'Organización UE (II): Parlamento Europeo. TJUE. Tribunal de Cuentas. BCE.', 'II'),
  ('c2000015-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 15, 'Fuentes del derecho UE. Derecho originario y derivado. Relaciones Derecho UE / ordenamiento nacional.', 'II'),
  ('c2000016-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 16, 'El presupuesto comunitario. Fondos europeos. Cohesión económica y social.', 'II'),
  ('c2000017-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 17, 'Políticas UE: mercado interior, política económica y monetaria, PESC, espacio seguridad/libertad/justicia, competencia, PAC.', 'II')
ON CONFLICT (id) DO NOTHING;

-- BLOQUE III — Políticas públicas (temas 18-27)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000018-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 18, 'Políticas de modernización AGE. Administración electrónica. Agenda Digital. Calidad servicios públicos. Mejora Regulatoria.', 'III'),
  ('c2000019-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 19, 'Política económica actual. Política presupuestaria. Gasto público. Política fiscal. Unidad de mercado.', 'III'),
  ('c2000020-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 20, 'Política ambiental. Distribución de competencias. Biodiversidad. Cambio climático.', 'III'),
  ('c2000021-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 21, 'La Seguridad Social: estructura y financiación. Régimen general y especiales. Acción protectora. Prestaciones.', 'III'),
  ('c2000022-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 22, 'Empleo en España. Servicios públicos de empleo. Prestaciones y políticas de empleo.', 'III'),
  ('c2000023-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 23, 'Política de inmigración. Régimen de extranjeros. Derecho de asilo y refugiado.', 'III'),
  ('c2000024-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 24, 'Gobierno Abierto. Ley 19/2013 Transparencia, acceso información y buen gobierno.', 'III'),
  ('c2000025-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 25, 'Protección de datos personales. Principios, derechos, responsable/encargado. Derechos digitales.', 'III'),
  ('c2000026-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 26, 'Políticas de igualdad y contra la violencia de género. Igualdad LGTBI. Discapacidad y dependencia.', 'III'),
  ('c2000027-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 27, 'La Agenda 2030 y los ODS.', 'III')
ON CONFLICT (id) DO NOTHING;

-- BLOQUE IV — Derecho administrativo (temas 28-40)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000028-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 28, 'Fuentes del derecho administrativo. Jerarquía. La ley. Decreto-ley, decreto legislativo. El reglamento. Principios generales. Tratados internacionales.', 'IV'),
  ('c2000029-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 29, 'El acto administrativo: concepto, clases, elementos. Eficacia y validez.', 'IV'),
  ('c2000030-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 30, 'Leyes 39/2015 y 40/2015. Procedimiento administrativo común: iniciación, ordenación, instrucción, terminación. Silencio administrativo.', 'IV'),
  ('c2000031-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 31, 'Derechos de los ciudadanos en el procedimiento. Garantías. Revisión de actos: revisión de oficio, recursos administrativos.', 'IV'),
  ('c2000032-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 32, 'Jurisdicción contencioso-administrativa: funciones, órganos, competencias. Recurso contencioso-administrativo. Partes.', 'IV'),
  ('c2000033-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 33, 'Contratos del sector público. Ley 9/2017. Tipos. Procedimientos de adjudicación. Ejecución y modificación.', 'IV'),
  ('c2000034-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 34, 'Formas de la actividad administrativa: intervención, arbitral, servicio público, fomento.', 'IV'),
  ('c2000035-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 35, 'La expropiación forzosa. Procedimientos. Garantías jurisdiccionales.', 'IV'),
  ('c2000036-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 36, 'Régimen patrimonial de las AAPP. Dominio público. Bienes patrimoniales. Patrimonio Nacional. Bienes comunales.', 'IV'),
  ('c2000037-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 37, 'Responsabilidad patrimonial de las AAPP. Procedimiento.', 'IV'),
  ('c2000038-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 38, 'Subvenciones públicas. Procedimiento de concesión. Gestión, justificación. Control financiero. Reintegro.', 'IV'),
  ('c2000039-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 39, 'Potestad sancionadora: principios, procedimiento, garantías.', 'IV'),
  ('c2000040-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 40, 'Contratos del sector público (II): contratos administrativos especiales. Encomiendas de gestión. Convenios de colaboración.', 'IV')
ON CONFLICT (id) DO NOTHING;

-- BLOQUE V — Empleo público (temas 41-50)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000041-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 41, 'Personal al servicio de las AAPP: concepto, clases. Adquisición y pérdida. Régimen jurídico.', 'V'),
  ('c2000042-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 42, 'Derechos y deberes del personal. Régimen disciplinario.', 'V'),
  ('c2000043-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 43, 'Planificación de RRHH. OEP. Selección de personal. Competencias en materia de personal.', 'V'),
  ('c2000044-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 44, 'Provisión de puestos y movilidad. Promoción interna y carrera profesional.', 'V'),
  ('c2000045-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 45, 'Situaciones administrativas. Incompatibilidades.', 'V'),
  ('c2000046-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 46, 'Sistema de retribuciones. Retribuciones básicas y complementarias.', 'V'),
  ('c2000047-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 47, 'Personal laboral. IV Convenio Único para personal laboral AGE.', 'V'),
  ('c2000048-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 48, 'Negociación colectiva, representación y participación institucional. Derecho de huelga.', 'V'),
  ('c2000049-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 49, 'Seguridad Social de funcionarios civiles. MUFACE y clases pasivas.', 'V'),
  ('c2000050-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 50, 'Acceso al empleo público de personas con discapacidad.', 'V')
ON CONFLICT (id) DO NOTHING;

-- BLOQUE VI — Gestión financiera (temas 51-58)
INSERT INTO temas (id, oposicion_id, numero, titulo, bloque) VALUES
  ('c2000051-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 51, 'El presupuesto: concepto y clases. Ley General Presupuestaria.', 'VI'),
  ('c2000052-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 52, 'Leyes anuales de presupuestos. Ciclo presupuestario. Elaboración y aprobación.', 'VI'),
  ('c2000053-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 53, 'Modificaciones presupuestarias. Créditos extraordinarios, suplementos, transferencias, generaciones, ampliaciones, anticipos de tesorería.', 'VI'),
  ('c2000054-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 54, 'Control del gasto público. IGAE. Función interventora, control financiero permanente, auditoría pública.', 'VI'),
  ('c2000055-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 55, 'Procedimiento de ejecución del presupuesto de gasto. Fases. Gastos plurianuales. Tramitación anticipada.', 'VI'),
  ('c2000056-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 56, 'Gastos para compra de bienes y servicios. Retribuciones de empleados públicos.', 'VI'),
  ('c2000057-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 57, 'Ingresos públicos. Sistema tributario español: principios constitucionales.', 'VI'),
  ('c2000058-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 58, 'Contabilidad pública. Plan General de Contabilidad Pública. Cuenta General del Estado.', 'VI')
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Tabla supuestos_practicos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supuestos_practicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  oposicion_id UUID REFERENCES oposiciones(id) NOT NULL,
  caso JSONB NOT NULL,
  respuestas_usuario JSONB,
  correccion JSONB,
  puntuacion_total NUMERIC(4,1),
  completado BOOLEAN DEFAULT false,
  corregido BOOLEAN DEFAULT false,
  tiempo_segundos INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supuestos_user ON supuestos_practicos(user_id);
CREATE INDEX IF NOT EXISTS idx_supuestos_oposicion ON supuestos_practicos(user_id, oposicion_id);

-- ─── 4. supuestos_balance en profiles ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'supuestos_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN supuestos_balance INT DEFAULT 0;
  END IF;
END $$;

COMMIT;
