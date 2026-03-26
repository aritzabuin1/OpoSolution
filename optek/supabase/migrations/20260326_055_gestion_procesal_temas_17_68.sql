-- =============================================================================
-- Migration 055: Gestión Procesal A2 — temas 17-68
-- Autor: Claude / Aritz | Fecha: 2026-03-26
--
-- Completa el temario de Gestión Procesal y Administrativa (A2).
-- Migration 049 insertó temas 1-16 (Bloque I: Organización).
-- Esta migration añade temas 17-68 (Bloques II-VI).
--
-- Fuente: BOE-A-2025-27053, Anexo VI.a
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- GESTIÓN PROCESAL (A2) — temas 17-68
-- Bloque II:  Derecho Civil y Mercantil (17-22)
-- Bloque III: Derecho Procesal Civil (23-39)
-- Bloque IV:  Derecho Procesal Penal (40-55)
-- Bloque V:   Derecho Procesal Contencioso y Laboral (56-62)
-- Bloque VI:  Organización y Gestión (63-68)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO temas (oposicion_id, numero, titulo, descripcion) VALUES
  -- Bloque II: Derecho Civil y Mercantil (17-22)
  ('e2000000-0000-0000-0000-000000000001', 17, 'Derecho Civil (I): La persona', 'Capacidad. Estado civil. Domicilio. Registro Civil.'),
  ('e2000000-0000-0000-0000-000000000001', 18, 'Derecho Civil (II): Obligaciones y contratos', 'La obligación. Contratos. Clases. Compraventa. Arrendamiento.'),
  ('e2000000-0000-0000-0000-000000000001', 19, 'Derecho Civil (III): Derechos reales', 'Propiedad. Posesión. Hipoteca. Registro de la Propiedad.'),
  ('e2000000-0000-0000-0000-000000000001', 20, 'Derecho Civil (IV): Derecho de familia', 'Matrimonio. Separación y divorcio. Filiación. Tutela.'),
  ('e2000000-0000-0000-0000-000000000001', 21, 'Derecho Civil (V): Sucesiones', 'Testamento. Herencia. Legítimas.'),
  ('e2000000-0000-0000-0000-000000000001', 22, 'Derecho Mercantil', 'Empresa. Sociedades. Concurso de acreedores.'),

  -- Bloque III: Derecho Procesal Civil (23-39)
  ('e2000000-0000-0000-0000-000000000001', 23, 'La jurisdicción civil', 'Competencia objetiva, funcional y territorial.'),
  ('e2000000-0000-0000-0000-000000000001', 24, 'Las partes en el proceso civil', 'Capacidad procesal. Legitimación. Representación.'),
  ('e2000000-0000-0000-0000-000000000001', 25, 'El juicio ordinario (I)', 'Demanda. Contestación. Audiencia previa.'),
  ('e2000000-0000-0000-0000-000000000001', 26, 'El juicio ordinario (II)', 'Prueba. Sentencia. Costas.'),
  ('e2000000-0000-0000-0000-000000000001', 27, 'El juicio verbal', 'Ámbito. Procedimiento. Sentencia.'),
  ('e2000000-0000-0000-0000-000000000001', 28, 'Procesos especiales (I)', 'Capacidad. Filiación. Matrimonio. Menores.'),
  ('e2000000-0000-0000-0000-000000000001', 29, 'Procesos especiales (II)', 'Monitorio. Cambiario.'),
  ('e2000000-0000-0000-0000-000000000001', 30, 'Los recursos en el proceso civil', 'Reposición. Apelación. Casación. Extraordinario por infracción procesal.'),
  ('e2000000-0000-0000-0000-000000000001', 31, 'La ejecución civil (I)', 'Títulos ejecutivos. Despacho de ejecución.'),
  ('e2000000-0000-0000-0000-000000000001', 32, 'La ejecución civil (II)', 'Ejecución dineraria. Embargo. Subasta.'),
  ('e2000000-0000-0000-0000-000000000001', 33, 'La ejecución civil (III)', 'Ejecución no dineraria. Lanzamientos.'),
  ('e2000000-0000-0000-0000-000000000001', 34, 'Medidas cautelares en el proceso civil', 'Concepto, tipos y procedimiento.'),
  ('e2000000-0000-0000-0000-000000000001', 35, 'Jurisdicción voluntaria', 'Concepto y procedimientos.'),
  ('e2000000-0000-0000-0000-000000000001', 36, 'MASC', 'Mediación, conciliación, negociación. [LO 1/2025]'),
  ('e2000000-0000-0000-0000-000000000001', 37, 'Actos de comunicación procesal', 'Notificaciones, citaciones, emplazamientos, requerimientos.'),
  ('e2000000-0000-0000-0000-000000000001', 38, 'Cooperación jurídica internacional en materia civil', 'Reglamentos europeos. Convenios internacionales.'),
  ('e2000000-0000-0000-0000-000000000001', 39, 'Costas procesales', 'Tasación de costas. Jura de cuentas.'),

  -- Bloque IV: Derecho Procesal Penal (40-55)
  ('e2000000-0000-0000-0000-000000000001', 40, 'La jurisdicción penal', 'Competencia.'),
  ('e2000000-0000-0000-0000-000000000001', 41, 'Las partes en el proceso penal', 'Ministerio Fiscal. Acción popular y particular.'),
  ('e2000000-0000-0000-0000-000000000001', 42, 'Proceso ordinario por delitos graves: Instrucción', 'Sumario.'),
  ('e2000000-0000-0000-0000-000000000001', 43, 'Proceso ordinario por delitos graves: Juicio oral', 'Sentencia.'),
  ('e2000000-0000-0000-0000-000000000001', 44, 'Procedimiento abreviado: Instrucción', 'Fase de instrucción.'),
  ('e2000000-0000-0000-0000-000000000001', 45, 'Procedimiento abreviado: Juicio oral', 'Fase de juicio oral.'),
  ('e2000000-0000-0000-0000-000000000001', 46, 'Juicio sobre delitos leves', 'Procedimiento.'),
  ('e2000000-0000-0000-0000-000000000001', 47, 'Procedimiento para el enjuiciamiento rápido', 'Ámbito y tramitación.'),
  ('e2000000-0000-0000-0000-000000000001', 48, 'Proceso ante el Tribunal del Jurado', 'Ley Orgánica del Tribunal del Jurado.'),
  ('e2000000-0000-0000-0000-000000000001', 49, 'Procedimiento de Habeas Corpus', 'LO 6/1984. Garantía de la libertad individual.'),
  ('e2000000-0000-0000-0000-000000000001', 50, 'La prisión provisional y otras medidas cautelares penales', 'Presupuestos. Duración. Otras medidas.'),
  ('e2000000-0000-0000-0000-000000000001', 51, 'Recursos en el proceso penal', 'Reforma. Apelación. Casación. Revisión.'),
  ('e2000000-0000-0000-0000-000000000001', 52, 'La ejecución penal', 'Liquidación de condenas. Beneficios penitenciarios.'),
  ('e2000000-0000-0000-0000-000000000001', 53, 'Registro e investigación de delitos', 'Entrada y registro. Intervención de comunicaciones.'),
  ('e2000000-0000-0000-0000-000000000001', 54, 'La víctima en el proceso penal', 'Estatuto de la víctima.'),
  ('e2000000-0000-0000-0000-000000000001', 55, 'Cooperación jurídica internacional en materia penal', 'Euroorden.'),

  -- Bloque V: Derecho Procesal Contencioso y Laboral (56-62)
  ('e2000000-0000-0000-0000-000000000001', 56, 'La jurisdicción contencioso-administrativa', 'Órganos. Competencia.'),
  ('e2000000-0000-0000-0000-000000000001', 57, 'Las partes en el proceso contencioso', 'Legitimación.'),
  ('e2000000-0000-0000-0000-000000000001', 58, 'Procedimiento contencioso-administrativo', 'Ordinario y abreviado.'),
  ('e2000000-0000-0000-0000-000000000001', 59, 'Recursos en la jurisdicción contencioso-administrativa', 'Apelación. Casación. Revisión.'),
  ('e2000000-0000-0000-0000-000000000001', 60, 'Ejecución de sentencias contencioso-administrativas', 'Ejecución provisional y definitiva.'),
  ('e2000000-0000-0000-0000-000000000001', 61, 'La jurisdicción social', 'Órganos. Competencia.'),
  ('e2000000-0000-0000-0000-000000000001', 62, 'Proceso laboral', 'Ordinario. Despido. Seguridad Social.'),

  -- Bloque VI: Organización y Gestión (63-68)
  ('e2000000-0000-0000-0000-000000000001', 63, 'Gestión de personal en la Administración de Justicia', 'Registro de Personal.'),
  ('e2000000-0000-0000-0000-000000000001', 64, 'Estadística judicial', 'Carga de trabajo. Módulos.'),
  ('e2000000-0000-0000-0000-000000000001', 65, 'Gestión de depósitos y consignaciones judiciales', 'Régimen jurídico. Cuenta de depósitos.'),
  ('e2000000-0000-0000-0000-000000000001', 66, 'La cuenta de depósitos y consignaciones judiciales', 'Operaciones. Destino de los depósitos.'),
  ('e2000000-0000-0000-0000-000000000001', 67, 'El archivo judicial', 'Expurgo. Nuevas tecnologías.'),
  ('e2000000-0000-0000-0000-000000000001', 68, 'Protección de datos en la Administración de Justicia', 'RGPD. LOPDGDD.')
ON CONFLICT (oposicion_id, numero) DO UPDATE SET titulo = EXCLUDED.titulo, descripcion = EXCLUDED.descripcion;

-- Ensure num_temas is correct (should already be 68 from migration 049, but enforce)
UPDATE oposiciones
SET num_temas = 68
WHERE id = 'e2000000-0000-0000-0000-000000000001';
