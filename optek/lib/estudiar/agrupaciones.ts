/**
 * lib/estudiar/agrupaciones.ts
 *
 * Mapa estático que define cómo agrupar artículos de cada ley en bloques lógicos de estudio.
 * Se deriva de los títulos/capítulos de la propia ley.
 *
 * Clave del mapa: ley_codigo (tal como aparece en la tabla legislacion).
 * Los rangos son strings que representan artículos: "14-29", "Preliminar-9", etc.
 */

export interface BloqueEstudio {
  ley: string            // ley_codigo: 'CE', 'BOE-A-2015-10565', etc.
  rango: string          // '14-29' (usado como clave única junto con ley)
  titulo: string         // 'Derechos Fundamentales'
  articulosAprox: number // estimación para UI
}

/**
 * Mapa: ley_codigo → bloques de estudio.
 * Usa los mismos códigos que CODE_MAP en tag-legislacion-temas.ts.
 * Algunas leyes tienen múltiples ley_codigo (ej: CE tiene 'CE' y 'BOE-A-1978-31229'),
 * pero aquí usamos el código canónico (el primero en CODE_MAP).
 */
export const AGRUPACIONES: Record<string, BloqueEstudio[]> = {
  // ─── Constitución Española ──────────────────────────────────────────────────
  CE: [
    { ley: 'CE', rango: 'Preliminar-9', titulo: 'Título Preliminar y valores superiores', articulosAprox: 9 },
    { ley: 'CE', rango: '10-13', titulo: 'Derechos y Libertades — Principios generales', articulosAprox: 4 },
    { ley: 'CE', rango: '14-29', titulo: 'Derechos Fundamentales y Libertades Públicas', articulosAprox: 16 },
    { ley: 'CE', rango: '30-38', titulo: 'Derechos y deberes de los ciudadanos', articulosAprox: 9 },
    { ley: 'CE', rango: '39-52', titulo: 'Principios rectores de la política social', articulosAprox: 14 },
    { ley: 'CE', rango: '53-55', titulo: 'Garantías de las libertades y derechos', articulosAprox: 3 },
    { ley: 'CE', rango: '56-65', titulo: 'La Corona', articulosAprox: 10 },
    { ley: 'CE', rango: '66-96', titulo: 'Las Cortes Generales y el Gobierno', articulosAprox: 31 },
    { ley: 'CE', rango: '97-107', titulo: 'Gobierno y Administración', articulosAprox: 11 },
    { ley: 'CE', rango: '108-116', titulo: 'Relaciones Gobierno-Cortes y estados excepcionales', articulosAprox: 9 },
    { ley: 'CE', rango: '117-127', titulo: 'Poder Judicial', articulosAprox: 11 },
    { ley: 'CE', rango: '128-136', titulo: 'Economía y Hacienda', articulosAprox: 9 },
    { ley: 'CE', rango: '137-158', titulo: 'Organización Territorial del Estado', articulosAprox: 22 },
    { ley: 'CE', rango: '159-165', titulo: 'Tribunal Constitucional', articulosAprox: 7 },
    { ley: 'CE', rango: '166-169', titulo: 'Reforma Constitucional', articulosAprox: 4 },
  ],

  // ─── LPAC (Ley 39/2015) ─────────────────────────────────────────────────────
  'BOE-A-2015-10565': [
    { ley: 'BOE-A-2015-10565', rango: '1-12', titulo: 'Disposiciones generales y derechos', articulosAprox: 12 },
    { ley: 'BOE-A-2015-10565', rango: '13-28', titulo: 'Actividad de las Administraciones', articulosAprox: 16 },
    { ley: 'BOE-A-2015-10565', rango: '29-33', titulo: 'Obligación de resolver y silencio', articulosAprox: 5 },
    { ley: 'BOE-A-2015-10565', rango: '34-52', titulo: 'Acto administrativo (requisitos, eficacia, nulidad)', articulosAprox: 19 },
    { ley: 'BOE-A-2015-10565', rango: '53-67', titulo: 'Procedimiento administrativo común', articulosAprox: 15 },
    { ley: 'BOE-A-2015-10565', rango: '68-95', titulo: 'Iniciación, ordenación, instrucción, finalización', articulosAprox: 28 },
    { ley: 'BOE-A-2015-10565', rango: '96-105', titulo: 'Ejecución forzosa y sancionador', articulosAprox: 10 },
    { ley: 'BOE-A-2015-10565', rango: '106-126', titulo: 'Revisión de actos y recursos', articulosAprox: 21 },
  ],

  // ─── LRJSP (Ley 40/2015) ────────────────────────────────────────────────────
  'BOE-A-2015-10566': [
    { ley: 'BOE-A-2015-10566', rango: '1-4', titulo: 'Disposiciones generales y principios', articulosAprox: 4 },
    { ley: 'BOE-A-2015-10566', rango: '5-18', titulo: 'Órganos administrativos', articulosAprox: 14 },
    { ley: 'BOE-A-2015-10566', rango: '19-33', titulo: 'Abstención, recusación, responsabilidad patrimonial', articulosAprox: 15 },
    { ley: 'BOE-A-2015-10566', rango: '34-46', titulo: 'Funcionamiento electrónico y convenios', articulosAprox: 13 },
    { ley: 'BOE-A-2015-10566', rango: '47-53', titulo: 'Gobierno y Administración General', articulosAprox: 7 },
    { ley: 'BOE-A-2015-10566', rango: '54-80', titulo: 'Organización administrativa (Ministros, Secretarios)', articulosAprox: 27 },
    { ley: 'BOE-A-2015-10566', rango: '81-98', titulo: 'Organismos públicos y sociedades', articulosAprox: 18 },
    { ley: 'BOE-A-2015-10566', rango: '140-158', titulo: 'Relaciones interadministrativas', articulosAprox: 19 },
  ],

  // ─── TREBEP (RDL 5/2015 Empleados Públicos) ────────────────────────────────
  'BOE-A-2015-11719': [
    { ley: 'BOE-A-2015-11719', rango: '1-13', titulo: 'Objeto, ámbito y derechos individuales', articulosAprox: 13 },
    { ley: 'BOE-A-2015-11719', rango: '14-20', titulo: 'Derechos colectivos y negociación', articulosAprox: 7 },
    { ley: 'BOE-A-2015-11719', rango: '21-30', titulo: 'Derecho a jornada, permisos y vacaciones', articulosAprox: 10 },
    { ley: 'BOE-A-2015-11719', rango: '31-54', titulo: 'Acceso al empleo público', articulosAprox: 24 },
    { ley: 'BOE-A-2015-11719', rango: '55-68', titulo: 'Ordenación de la actividad y provisión', articulosAprox: 14 },
    { ley: 'BOE-A-2015-11719', rango: '69-84', titulo: 'Situaciones administrativas y régimen disciplinario', articulosAprox: 16 },
    { ley: 'BOE-A-2015-11719', rango: '85-100', titulo: 'Régimen disciplinario y cooperación', articulosAprox: 16 },
  ],

  // ─── LOPDGDD (LO 3/2018 Protección Datos) ──────────────────────────────────
  'BOE-A-2018-16673': [
    { ley: 'BOE-A-2018-16673', rango: '1-10', titulo: 'Disposiciones generales y principios', articulosAprox: 10 },
    { ley: 'BOE-A-2018-16673', rango: '11-18', titulo: 'Derechos del interesado', articulosAprox: 8 },
    { ley: 'BOE-A-2018-16673', rango: '19-32', titulo: 'Situaciones específicas de tratamiento', articulosAprox: 14 },
    { ley: 'BOE-A-2018-16673', rango: '33-42', titulo: 'Responsable y encargado', articulosAprox: 10 },
    { ley: 'BOE-A-2018-16673', rango: '43-50', titulo: 'Transferencias internacionales', articulosAprox: 8 },
    { ley: 'BOE-A-2018-16673', rango: '51-69', titulo: 'AEPD, sanciones y procedimiento', articulosAprox: 19 },
    { ley: 'BOE-A-2018-16673', rango: '79-97', titulo: 'Derechos digitales', articulosAprox: 19 },
  ],

  // ─── LO Igualdad (LO 3/2007) ───────────────────────────────────────────────
  'BOE-A-2007-6115': [
    { ley: 'BOE-A-2007-6115', rango: '1-14', titulo: 'Objeto, principios y tutela', articulosAprox: 14 },
    { ley: 'BOE-A-2007-6115', rango: '15-29', titulo: 'Políticas públicas de igualdad', articulosAprox: 15 },
    { ley: 'BOE-A-2007-6115', rango: '30-50', titulo: 'Igualdad en el empleo', articulosAprox: 21 },
    { ley: 'BOE-A-2007-6115', rango: '51-68', titulo: 'Principio de igualdad en la Administración y FCSE', articulosAprox: 18 },
  ],

  // ─── LO Violencia de Género (LO 1/2004) ────────────────────────────────────
  'BOE-A-2004-21760': [
    { ley: 'BOE-A-2004-21760', rango: '1-16', titulo: 'Medidas de sensibilización, prevención y detección', articulosAprox: 16 },
    { ley: 'BOE-A-2004-21760', rango: '17-28', titulo: 'Derechos de las mujeres víctimas', articulosAprox: 12 },
    { ley: 'BOE-A-2004-21760', rango: '29-42', titulo: 'Tutela institucional y penal', articulosAprox: 14 },
    { ley: 'BOE-A-2004-21760', rango: '43-72', titulo: 'Tutela judicial y Juzgados de VG', articulosAprox: 30 },
  ],

  // ─── PRL (Ley 31/1995 Prevención Riesgos Laborales) ────────────────────────
  'BOE-A-1995-24292': [
    { ley: 'BOE-A-1995-24292', rango: '1-13', titulo: 'Objeto, ámbito y derechos', articulosAprox: 13 },
    { ley: 'BOE-A-1995-24292', rango: '14-25', titulo: 'Obligaciones del empresario', articulosAprox: 12 },
    { ley: 'BOE-A-1995-24292', rango: '26-40', titulo: 'Servicios de prevención y consulta', articulosAprox: 15 },
    { ley: 'BOE-A-1995-24292', rango: '41-54', titulo: 'Responsabilidades y sanciones', articulosAprox: 14 },
  ],

  // ─── LECrim (RD 14-sep-1882) ────────────────────────────────────────────────
  'BOE-A-1882-6036': [
    { ley: 'BOE-A-1882-6036', rango: '1-100', titulo: 'Disposiciones generales y competencia', articulosAprox: 100 },
    { ley: 'BOE-A-1882-6036', rango: '101-300', titulo: 'Sumario e instrucción', articulosAprox: 200 },
    { ley: 'BOE-A-1882-6036', rango: '301-500', titulo: 'Prueba y juicio oral', articulosAprox: 200 },
    { ley: 'BOE-A-1882-6036', rango: '501-700', titulo: 'Recursos y ejecución', articulosAprox: 200 },
    { ley: 'BOE-A-1882-6036', rango: '701-999', titulo: 'Procedimientos especiales', articulosAprox: 200 },
  ],

  // ─── LGT (Ley 58/2003 General Tributaria) ──────────────────────────────────
  'BOE-A-2003-23186': [
    { ley: 'BOE-A-2003-23186', rango: '1-16', titulo: 'Principios generales', articulosAprox: 16 },
    { ley: 'BOE-A-2003-23186', rango: '17-48', titulo: 'Tributos — elementos y obligaciones', articulosAprox: 32 },
    { ley: 'BOE-A-2003-23186', rango: '49-82', titulo: 'Aplicación de los tributos', articulosAprox: 34 },
    { ley: 'BOE-A-2003-23186', rango: '83-115', titulo: 'Gestión tributaria', articulosAprox: 33 },
    { ley: 'BOE-A-2003-23186', rango: '116-159', titulo: 'Inspección y recaudación', articulosAprox: 44 },
    { ley: 'BOE-A-2003-23186', rango: '160-177', titulo: 'Potestad sancionadora', articulosAprox: 18 },
    { ley: 'BOE-A-2003-23186', rango: '178-240', titulo: 'Revisión en vía administrativa', articulosAprox: 63 },
  ],

  // ─── Código Penal (LO 10/1995) ─────────────────────────────────────────────
  'BOE-A-1995-25444': [
    { ley: 'BOE-A-1995-25444', rango: '1-9', titulo: 'Garantías penales y aplicación de la ley', articulosAprox: 9 },
    { ley: 'BOE-A-1995-25444', rango: '10-26', titulo: 'Personas responsables — autoría y participación', articulosAprox: 17 },
    { ley: 'BOE-A-1995-25444', rango: '27-60', titulo: 'Penas — clases, extensión y reglas', articulosAprox: 34 },
    { ley: 'BOE-A-1995-25444', rango: '61-94', titulo: 'Medidas de seguridad y extinción', articulosAprox: 34 },
    { ley: 'BOE-A-1995-25444', rango: '95-137', titulo: 'Responsabilidad civil y consecuencias accesorias', articulosAprox: 43 },
    { ley: 'BOE-A-1995-25444', rango: '138-197', titulo: 'Delitos contra las personas', articulosAprox: 60 },
    { ley: 'BOE-A-1995-25444', rango: '234-304', titulo: 'Delitos patrimoniales y socioeconómicos', articulosAprox: 71 },
    { ley: 'BOE-A-1995-25444', rango: '368-400', titulo: 'Delitos contra la salud pública y tráfico de drogas', articulosAprox: 33 },
    { ley: 'BOE-A-1995-25444', rango: '404-445', titulo: 'Delitos contra la Administración Pública', articulosAprox: 42 },
    { ley: 'BOE-A-1995-25444', rango: '468-580', titulo: 'Delitos contra la Administración de Justicia y orden público', articulosAprox: 113 },
  ],

  // ─── LO 2/1986 FCSE ────────────────────────────────────────────────────────
  'BOE-A-1986-6859': [
    { ley: 'BOE-A-1986-6859', rango: '1-8', titulo: 'Disposiciones generales y principios básicos', articulosAprox: 8 },
    { ley: 'BOE-A-1986-6859', rango: '9-25', titulo: 'Fuerzas y Cuerpos de Seguridad del Estado', articulosAprox: 17 },
    { ley: 'BOE-A-1986-6859', rango: '26-36', titulo: 'Distribución de competencias CNP y GC', articulosAprox: 11 },
    { ley: 'BOE-A-1986-6859', rango: '37-44', titulo: 'Policías de las Comunidades Autónomas', articulosAprox: 8 },
    { ley: 'BOE-A-1986-6859', rango: '45-54', titulo: 'Coordinación y policías locales', articulosAprox: 10 },
  ],

  // ─── LO 4/2015 Seguridad Ciudadana ─────────────────────────────────────────
  'BOE-A-2015-3442': [
    { ley: 'BOE-A-2015-3442', rango: '1-8', titulo: 'Disposiciones generales y ámbito', articulosAprox: 8 },
    { ley: 'BOE-A-2015-3442', rango: '9-15', titulo: 'Documentación e identificación', articulosAprox: 7 },
    { ley: 'BOE-A-2015-3442', rango: '16-22', titulo: 'Actuaciones para el mantenimiento de la seguridad ciudadana', articulosAprox: 7 },
    { ley: 'BOE-A-2015-3442', rango: '23-31', titulo: 'Potestades de policía', articulosAprox: 9 },
    { ley: 'BOE-A-2015-3442', rango: '32-45', titulo: 'Régimen sancionador', articulosAprox: 14 },
    { ley: 'BOE-A-2015-3442', rango: '46-54', titulo: 'Infracciones y sanciones', articulosAprox: 9 },
  ],

  // ─── Ley 5/2014 Seguridad Privada ──────────────────────────────────────────
  'BOE-A-2014-3649': [
    { ley: 'BOE-A-2014-3649', rango: '1-12', titulo: 'Disposiciones generales', articulosAprox: 12 },
    { ley: 'BOE-A-2014-3649', rango: '13-30', titulo: 'Empresas y personal de seguridad', articulosAprox: 18 },
    { ley: 'BOE-A-2014-3649', rango: '31-50', titulo: 'Servicios y medidas de seguridad', articulosAprox: 20 },
    { ley: 'BOE-A-2014-3649', rango: '51-85', titulo: 'Régimen sancionador y control', articulosAprox: 35 },
  ],

  // ─── RDL 6/2015 Seguridad Vial ─────────────────────────────────────────────
  'BOE-A-2015-11722': [
    { ley: 'BOE-A-2015-11722', rango: '1-20', titulo: 'Disposiciones generales y competencias', articulosAprox: 20 },
    { ley: 'BOE-A-2015-11722', rango: '21-50', titulo: 'Vehículos y circulación', articulosAprox: 30 },
    { ley: 'BOE-A-2015-11722', rango: '51-80', titulo: 'Señalización y autorizaciones', articulosAprox: 30 },
    { ley: 'BOE-A-2015-11722', rango: '81-110', titulo: 'Infracciones y sanciones', articulosAprox: 30 },
    { ley: 'BOE-A-2015-11722', rango: '111-147', titulo: 'Permiso por puntos y procedimiento', articulosAprox: 37 },
  ],

  // ─── LO 3/1979 Estatuto de Gernika ─────────────────────────────────────────
  'BOE-A-1979-30177': [
    { ley: 'BOE-A-1979-30177', rango: '1-12', titulo: 'Disposiciones generales y competencias', articulosAprox: 12 },
    { ley: 'BOE-A-1979-30177', rango: '13-25', titulo: 'Poderes del País Vasco (Parlamento, Gobierno)', articulosAprox: 13 },
    { ley: 'BOE-A-1979-30177', rango: '26-41', titulo: 'Hacienda y economía', articulosAprox: 16 },
    { ley: 'BOE-A-1979-30177', rango: '42-47', titulo: 'Control y reforma del Estatuto', articulosAprox: 6 },
  ],

  // ─── LO 9/1983 Derecho de Reunión ──────────────────────────────────────────
  'BOE-A-1983-19946': [
    { ley: 'BOE-A-1983-19946', rango: '1-11', titulo: 'Derecho de reunión y manifestación', articulosAprox: 11 },
  ],

  // ─── Ley 4/2015 Estatuto de la Víctima ─────────────────────────────────────
  'BOE-A-2015-4606': [
    { ley: 'BOE-A-2015-4606', rango: '1-10', titulo: 'Disposiciones generales y derechos básicos', articulosAprox: 10 },
    { ley: 'BOE-A-2015-4606', rango: '11-25', titulo: 'Participación en el proceso y protección', articulosAprox: 15 },
    { ley: 'BOE-A-2015-4606', rango: '26-45', titulo: 'Oficinas de asistencia y medidas especiales', articulosAprox: 20 },
  ],

  // ─── LO 4/2000 Extranjería (LOEX) ──────────────────────────────────────────
  'BOE-A-2000-544': [
    { ley: 'BOE-A-2000-544', rango: '1-15', titulo: 'Derechos y libertades de los extranjeros', articulosAprox: 15 },
    { ley: 'BOE-A-2000-544', rango: '16-35', titulo: 'Régimen jurídico — entrada, estancia, residencia', articulosAprox: 20 },
    { ley: 'BOE-A-2000-544', rango: '36-60', titulo: 'Infracciones y régimen sancionador', articulosAprox: 25 },
    { ley: 'BOE-A-2000-544', rango: '61-80', titulo: 'Coordinación y cooperación', articulosAprox: 20 },
  ],

  // ─── LOGP (LO 1/1979 General Penitenciaria) ────────────────────────────────
  'BOE-A-1979-23708': [
    { ley: 'BOE-A-1979-23708', rango: '1-24', titulo: 'Disposiciones generales y derechos', articulosAprox: 24 },
    { ley: 'BOE-A-1979-23708', rango: '25-45', titulo: 'Régimen penitenciario y clasificación', articulosAprox: 21 },
    { ley: 'BOE-A-1979-23708', rango: '46-75', titulo: 'Tratamiento, trabajo y asistencia', articulosAprox: 30 },
    { ley: 'BOE-A-1979-23708', rango: '76-80', titulo: 'Juez de vigilancia y disposiciones finales', articulosAprox: 5 },
  ],

  // ─── RP (RD 190/1996 Reglamento Penitenciario) ─────────────────────────────
  'BOE-A-1996-3307': [
    { ley: 'BOE-A-1996-3307', rango: '1-30', titulo: 'Disposiciones generales y organización', articulosAprox: 30 },
    { ley: 'BOE-A-1996-3307', rango: '31-75', titulo: 'Régimen, internamiento y permisos', articulosAprox: 45 },
    { ley: 'BOE-A-1996-3307', rango: '76-130', titulo: 'Tratamiento, trabajo y libertad condicional', articulosAprox: 55 },
    { ley: 'BOE-A-1996-3307', rango: '131-190', titulo: 'Personal, infraestructura y comunicaciones', articulosAprox: 60 },
  ],

  // ─── Leyes BOPV (Ertzaintza) ────────────────────────────────────────────────
  'BOE-A-2023-9168': [  // DL 1/2023 Igualdad CAV
    { ley: 'BOE-A-2023-9168', rango: '1-30', titulo: 'Disposiciones generales e igualdad', articulosAprox: 30 },
    { ley: 'BOE-A-2023-9168', rango: '31-60', titulo: 'Políticas públicas de igualdad', articulosAprox: 30 },
    { ley: 'BOE-A-2023-9168', rango: '61-94', titulo: 'Medidas en ámbitos específicos', articulosAprox: 34 },
  ],

  'BOE-A-2020-9740': [  // DL 1/2020 Ley Policía País Vasco
    { ley: 'BOE-A-2020-9740', rango: '1-30', titulo: 'Modelo policial vasco y organización', articulosAprox: 30 },
    { ley: 'BOE-A-2020-9740', rango: '31-70', titulo: 'Personal policial y régimen estatutario', articulosAprox: 40 },
    { ley: 'BOE-A-2020-9740', rango: '71-120', titulo: 'Formación, acceso y carrera profesional', articulosAprox: 50 },
    { ley: 'BOE-A-2020-9740', rango: '121-172', titulo: 'Régimen disciplinario y disposiciones finales', articulosAprox: 52 },
  ],

  'BOE-A-2012-9665': [  // Ley 15/2012 Seguridad Pública Euskadi
    { ley: 'BOE-A-2012-9665', rango: '1-20', titulo: 'Disposiciones generales y modelo de seguridad', articulosAprox: 20 },
    { ley: 'BOE-A-2012-9665', rango: '21-50', titulo: 'Coordinación policial y competencias', articulosAprox: 30 },
    { ley: 'BOE-A-2012-9665', rango: '51-74', titulo: 'Participación ciudadana y disposiciones finales', articulosAprox: 24 },
  ],

  'BOPV-1998-003495': [  // D 168/1998 Videocámaras
    { ley: 'BOPV-1998-003495', rango: '1-22', titulo: 'Videocámaras en la Policía del País Vasco', articulosAprox: 22 },
  ],

  'BOPV-2015-002023': [  // D 57/2015 Coordinación
    { ley: 'BOPV-2015-002023', rango: '1-8', titulo: 'Coordinación policial local en Euskadi', articulosAprox: 8 },
  ],

  // ─── Leyes Hacienda ─────────────────────────────────────────────────────────
  'BOE-A-2006-20764': [  // IRPF
    { ley: 'BOE-A-2006-20764', rango: '1-14', titulo: 'Naturaleza, ámbito y hecho imponible', articulosAprox: 14 },
    { ley: 'BOE-A-2006-20764', rango: '15-33', titulo: 'Rendimientos del trabajo y capital', articulosAprox: 19 },
    { ley: 'BOE-A-2006-20764', rango: '34-50', titulo: 'Actividades económicas y ganancias patrimoniales', articulosAprox: 17 },
    { ley: 'BOE-A-2006-20764', rango: '51-80', titulo: 'Base imponible y liquidable', articulosAprox: 30 },
    { ley: 'BOE-A-2006-20764', rango: '81-101', titulo: 'Cuota, deducciones y tributación conjunta', articulosAprox: 21 },
  ],

  'BOE-A-2014-12328': [  // Impuesto Sociedades
    { ley: 'BOE-A-2014-12328', rango: '1-14', titulo: 'Naturaleza y hecho imponible', articulosAprox: 14 },
    { ley: 'BOE-A-2014-12328', rango: '15-30', titulo: 'Base imponible', articulosAprox: 16 },
    { ley: 'BOE-A-2014-12328', rango: '31-50', titulo: 'Tipo y cuota', articulosAprox: 20 },
    { ley: 'BOE-A-2014-12328', rango: '51-130', titulo: 'Regímenes especiales', articulosAprox: 80 },
  ],

  'BOE-A-1992-28740': [  // IVA
    { ley: 'BOE-A-1992-28740', rango: '1-16', titulo: 'Naturaleza y ámbito', articulosAprox: 16 },
    { ley: 'BOE-A-1992-28740', rango: '17-40', titulo: 'Hecho imponible y exenciones', articulosAprox: 24 },
    { ley: 'BOE-A-1992-28740', rango: '41-80', titulo: 'Base imponible y tipo', articulosAprox: 40 },
    { ley: 'BOE-A-1992-28740', rango: '81-120', titulo: 'Deducciones y devoluciones', articulosAprox: 40 },
    { ley: 'BOE-A-1992-28740', rango: '121-164', titulo: 'Regímenes especiales', articulosAprox: 44 },
  ],

  // ─── Otras leyes compartidas ────────────────────────────────────────────────
  'BOE-A-1984-25031': [  // Incompatibilidades
    { ley: 'BOE-A-1984-25031', rango: '1-20', titulo: 'Régimen de incompatibilidades del personal al servicio de las AA.PP.', articulosAprox: 20 },
  ],

  'BOE-A-2006-21990': [  // Dependencia
    { ley: 'BOE-A-2006-21990', rango: '1-14', titulo: 'Disposiciones generales y derechos', articulosAprox: 14 },
    { ley: 'BOE-A-2006-21990', rango: '15-33', titulo: 'Prestaciones y catálogo de servicios', articulosAprox: 19 },
    { ley: 'BOE-A-2006-21990', rango: '34-50', titulo: 'Valoración, financiación y calidad', articulosAprox: 17 },
  ],

  'BOE-A-2015-11072': [  // Voluntariado
    { ley: 'BOE-A-2015-11072', rango: '1-20', titulo: 'Voluntariado — derechos, deberes y organización', articulosAprox: 20 },
  ],

  'BOE-A-2011-10598': [  // RD 840/2011 Medidas alternativas
    { ley: 'BOE-A-2011-10598', rango: '1-20', titulo: 'Medidas alternativas a penas privativas de libertad', articulosAprox: 20 },
  ],
}

/**
 * Buscar agrupaciones para un ley_codigo dado.
 * Primero intenta match directo, si no encuentra prueba aliases.
 */
export function getAgrupaciones(leyCodigo: string): BloqueEstudio[] {
  return AGRUPACIONES[leyCodigo] ?? []
}

/**
 * Todas las leyes que tienen agrupaciones definidas.
 */
export function getLeyesConAgrupaciones(): string[] {
  return Object.keys(AGRUPACIONES)
}
