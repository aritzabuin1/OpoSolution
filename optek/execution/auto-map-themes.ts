/**
 * execution/auto-map-themes.ts — OPTEK §1.1.9, §1.1.11
 *
 * Mapea los artículos de la tabla `legislacion` a los tema_ids
 * correspondientes del temario oficial de TODAS las oposiciones.
 *
 * Oposiciones soportadas:
 *   - C2 Auxiliar (16 temas, prefix b0000000)
 *   - A2 GACE (58 temas, prefix c2000000)
 *
 * Estrategia:
 *   Mapping determinista por ley_codigo + titulo_capitulo.
 *   No gasta tokens de IA — 100% reglas explícitas.
 *   Un artículo puede mapearse a temas de MÚLTIPLES oposiciones.
 *
 * Salidas:
 *   1. UPDATE legislacion SET tema_ids = [...] para cada artículo (DB)
 *   2. data/mapeo_temas_legislacion.json — informe de cobertura (§1.1.11)
 *
 * Ejecutar:
 *   pnpm tsx --env-file=.env.local execution/auto-map-themes.ts
 *
 * Rollback (si se necesita revertir):
 *   UPDATE legislacion SET tema_ids = '{}';
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

// ─── Supabase ─────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

// ─── IDs de temas (de migration 007 — §0.8.5A) ───────────────────────────────

const TEMAS = {
  T1:  'b0000000-0000-0000-0001-000000000001', // La Constitución Española de 1978
  T2:  'b0000000-0000-0000-0001-000000000002', // El Tribunal Constitucional y la reforma constitucional
  T3:  'b0000000-0000-0000-0001-000000000003', // Las Cortes Generales
  T4:  'b0000000-0000-0000-0001-000000000004', // El Poder Judicial
  T5:  'b0000000-0000-0000-0001-000000000005', // El Gobierno y la Administración
  T6:  'b0000000-0000-0000-0001-000000000006', // Gobierno Abierto
  T7:  'b0000000-0000-0000-0001-000000000007', // La Transparencia y el buen gobierno
  T8:  'b0000000-0000-0000-0001-000000000008', // La Administración General del Estado
  T9:  'b0000000-0000-0000-0001-000000000009', // La organización territorial del Estado
  T10: 'b0000000-0000-0000-0001-000000000010', // La Unión Europea: instituciones
  T11: 'b0000000-0000-0000-0001-000000000011', // El procedimiento administrativo común (LPAC/LRJSP)
  T12: 'b0000000-0000-0000-0001-000000000012', // La protección de datos personales
  T13: 'b0000000-0000-0000-0001-000000000013', // El personal funcionario: el TREBEP
  T14: 'b0000000-0000-0000-0001-000000000014', // Derechos y deberes de los empleados públicos
  T15: 'b0000000-0000-0000-0001-000000000015', // El Presupuesto del Estado
  T16: 'b0000000-0000-0000-0001-000000000016', // Políticas de igualdad: LGTBI
} as const

// ─── IDs de temas A2 GACE (de migration 040) ────────────────────────────────

const TEMAS_A2 = {
  T1:  'c2000001-0000-0000-0000-000000000001', // CE: estructura y contenido
  T2:  'c2000002-0000-0000-0000-000000000001', // Derechos y deberes fundamentales
  T3:  'c2000003-0000-0000-0000-000000000001', // Tribunal Constitucional
  T4:  'c2000004-0000-0000-0000-000000000001', // La Corona
  T5:  'c2000005-0000-0000-0000-000000000001', // Cortes Generales
  T6:  'c2000006-0000-0000-0000-000000000001', // Poder ejecutivo, Gobierno, Consejo de Estado
  T7:  'c2000007-0000-0000-0000-000000000001', // Poder judicial, CGPJ, LOPJ
  T8:  'c2000008-0000-0000-0000-000000000001', // AGE: organización
  T9:  'c2000009-0000-0000-0000-000000000001', // Sector público institucional
  T10: 'c2000010-0000-0000-0000-000000000001', // CCAA, Estatutos, competencias
  T11: 'c2000011-0000-0000-0000-000000000001', // Administración local, LBRL
  T12: 'c2000012-0000-0000-0000-000000000001', // UE: antecedentes, tratados
  T13: 'c2000013-0000-0000-0000-000000000001', // UE: Consejo Europeo, Comisión
  T14: 'c2000014-0000-0000-0000-000000000001', // UE: Parlamento, TJUE
  T15: 'c2000015-0000-0000-0000-000000000001', // Fuentes derecho UE
  T16: 'c2000016-0000-0000-0000-000000000001', // Presupuesto comunitario
  T17: 'c2000017-0000-0000-0000-000000000001', // Políticas UE
  T18: 'c2000018-0000-0000-0000-000000000001', // Modernización AGE, admin electrónica
  T19: 'c2000019-0000-0000-0000-000000000001', // Política económica, presupuestaria
  T20: 'c2000020-0000-0000-0000-000000000001', // Política ambiental
  T21: 'c2000021-0000-0000-0000-000000000001', // Seguridad Social: estructura
  T22: 'c2000022-0000-0000-0000-000000000001', // Empleo en España
  T23: 'c2000023-0000-0000-0000-000000000001', // Inmigración, extranjeros
  T24: 'c2000024-0000-0000-0000-000000000001', // Gobierno Abierto, Transparencia
  T25: 'c2000025-0000-0000-0000-000000000001', // Protección de datos, LOPDGDD
  T26: 'c2000026-0000-0000-0000-000000000001', // Igualdad, violencia género, LGTBI
  T27: 'c2000027-0000-0000-0000-000000000001', // Agenda 2030, ODS
  T28: 'c2000028-0000-0000-0000-000000000001', // Fuentes derecho administrativo
  T29: 'c2000029-0000-0000-0000-000000000001', // Acto administrativo
  T30: 'c2000030-0000-0000-0000-000000000001', // LPAC + LRJSP procedimiento
  T31: 'c2000031-0000-0000-0000-000000000001', // Derechos ciudadanos, recursos
  T32: 'c2000032-0000-0000-0000-000000000001', // Jurisdicción contencioso-admin
  T33: 'c2000033-0000-0000-0000-000000000001', // Contratos sector público (I)
  T34: 'c2000034-0000-0000-0000-000000000001', // Actividad administrativa
  T35: 'c2000035-0000-0000-0000-000000000001', // Expropiación forzosa
  T36: 'c2000036-0000-0000-0000-000000000001', // Régimen patrimonial AAPP
  T37: 'c2000037-0000-0000-0000-000000000001', // Responsabilidad patrimonial
  T38: 'c2000038-0000-0000-0000-000000000001', // Subvenciones públicas
  T39: 'c2000039-0000-0000-0000-000000000001', // Potestad sancionadora
  T40: 'c2000040-0000-0000-0000-000000000001', // Contratos (II), convenios
  T41: 'c2000041-0000-0000-0000-000000000001', // Personal AAPP: concepto, clases
  T42: 'c2000042-0000-0000-0000-000000000001', // Derechos/deberes, disciplinario
  T43: 'c2000043-0000-0000-0000-000000000001', // Planificación RRHH, OEP, selección
  T44: 'c2000044-0000-0000-0000-000000000001', // Provisión puestos, promoción
  T45: 'c2000045-0000-0000-0000-000000000001', // Situaciones admin, incompatibilidades
  T46: 'c2000046-0000-0000-0000-000000000001', // Retribuciones
  T47: 'c2000047-0000-0000-0000-000000000001', // Personal laboral, IV Convenio
  T48: 'c2000048-0000-0000-0000-000000000001', // Negociación colectiva, huelga
  T49: 'c2000049-0000-0000-0000-000000000001', // SS funcionarios, MUFACE
  T50: 'c2000050-0000-0000-0000-000000000001', // Empleo público discapacidad
  T51: 'c2000051-0000-0000-0000-000000000001', // Presupuesto, LGP
  T52: 'c2000052-0000-0000-0000-000000000001', // Leyes anuales presupuestos
  T53: 'c2000053-0000-0000-0000-000000000001', // Modificaciones presupuestarias
  T54: 'c2000054-0000-0000-0000-000000000001', // Control gasto público, IGAE
  T55: 'c2000055-0000-0000-0000-000000000001', // Ejecución presupuesto gasto
  T56: 'c2000056-0000-0000-0000-000000000001', // Gastos compra bienes/servicios
  T57: 'c2000057-0000-0000-0000-000000000001', // Ingresos públicos, tributario
  T58: 'c2000058-0000-0000-0000-000000000001', // Contabilidad pública
} as const

// ─── Leyes cubiertas (ley_codigo → nombres para informe) ─────────────────────

const LEY_NOMBRES: Record<string, string> = {
  'BOE-A-1978-31229': 'CE — Constitución Española',
  'BOE-A-1979-23709': 'LOTC — LO 2/1979 Tribunal Constitucional',
  'BOE-A-2015-10565': 'LPAC — Ley 39/2015',
  'BOE-A-2015-10566': 'LRJSP — Ley 40/2015',
  'BOE-A-2015-11719': 'TREBEP — RDL 5/2015',
  'BOE-A-2018-16673': 'LOPDGDD — LO 3/2018',
  'BOE-A-2013-12887': 'Ley 19/2013 Transparencia',
  'BOE-A-1997-25336': 'Ley 50/1997 Gobierno',
  'BOE-A-2023-5366':  'Ley 4/2023 LGTBI',
  'BOE-A-2007-6115':  'LO 3/2007 Igualdad',
  'BOE-A-2004-21760': 'LO 1/2004 Violencia de Género',
  'BOE-A-2003-21614': 'LGP — Ley 47/2003',
  'BOE-A-1985-12666': 'LOPJ — LO 6/1985',
  'BOE-A-2017-12902': 'LCSP — Ley 9/2017',
  'BOE-A-1985-5392':  'LBRL — Ley 7/1985',
  'BOE-A-2015-11724': 'LGSS — RDL 8/2015',
  'BOE-A-2003-20977': 'Ley 38/2003 Subvenciones',
  'BOE-A-1985-151':   'Ley 53/1984 Incompatibilidades',
  'BOE-A-2003-7527':  'RD 375/2003 MUFACE',
  'BOE-A-2019-7414':  'IV Convenio Único AGE',
}

const TEMA_NOMBRES: Record<string, string> = {
  // ── C2 Auxiliar ──
  [TEMAS.T1]:  '[C2] Tema 1 — La Constitución Española de 1978',
  [TEMAS.T2]:  '[C2] Tema 2 — El Tribunal Constitucional y la reforma constitucional',
  [TEMAS.T3]:  '[C2] Tema 3 — Las Cortes Generales',
  [TEMAS.T4]:  '[C2] Tema 4 — El Poder Judicial',
  [TEMAS.T5]:  '[C2] Tema 5 — El Gobierno y la Administración',
  [TEMAS.T6]:  '[C2] Tema 6 — Gobierno Abierto',
  [TEMAS.T7]:  '[C2] Tema 7 — La Transparencia y el buen gobierno',
  [TEMAS.T8]:  '[C2] Tema 8 — La Administración General del Estado',
  [TEMAS.T9]:  '[C2] Tema 9 — La organización territorial del Estado',
  [TEMAS.T10]: '[C2] Tema 10 — La Unión Europea: instituciones',
  [TEMAS.T11]: '[C2] Tema 11 — El procedimiento administrativo común (LPAC/LRJSP)',
  [TEMAS.T12]: '[C2] Tema 12 — La protección de datos personales',
  [TEMAS.T13]: '[C2] Tema 13 — El personal funcionario: el TREBEP',
  [TEMAS.T14]: '[C2] Tema 14 — Derechos y deberes de los empleados públicos',
  [TEMAS.T15]: '[C2] Tema 15 — El Presupuesto del Estado',
  [TEMAS.T16]: '[C2] Tema 16 — Políticas de igualdad: LGTBI',
  // ── A2 GACE ──
  [TEMAS_A2.T1]:  '[A2] Tema 1 — La CE: estructura y contenido',
  [TEMAS_A2.T2]:  '[A2] Tema 2 — Derechos y deberes fundamentales',
  [TEMAS_A2.T3]:  '[A2] Tema 3 — El Tribunal Constitucional',
  [TEMAS_A2.T4]:  '[A2] Tema 4 — La Corona',
  [TEMAS_A2.T5]:  '[A2] Tema 5 — Cortes Generales',
  [TEMAS_A2.T6]:  '[A2] Tema 6 — Poder ejecutivo, Gobierno',
  [TEMAS_A2.T7]:  '[A2] Tema 7 — Poder judicial, LOPJ',
  [TEMAS_A2.T8]:  '[A2] Tema 8 — AGE: organización',
  [TEMAS_A2.T9]:  '[A2] Tema 9 — Sector público institucional',
  [TEMAS_A2.T10]: '[A2] Tema 10 — CCAA, competencias',
  [TEMAS_A2.T11]: '[A2] Tema 11 — Administración local, LBRL',
  [TEMAS_A2.T21]: '[A2] Tema 21 — Seguridad Social',
  [TEMAS_A2.T24]: '[A2] Tema 24 — Gobierno Abierto, Transparencia',
  [TEMAS_A2.T25]: '[A2] Tema 25 — Protección de datos',
  [TEMAS_A2.T26]: '[A2] Tema 26 — Igualdad, violencia género, LGTBI',
  [TEMAS_A2.T28]: '[A2] Tema 28 — Fuentes derecho administrativo',
  [TEMAS_A2.T30]: '[A2] Tema 30 — LPAC + LRJSP procedimiento',
  [TEMAS_A2.T31]: '[A2] Tema 31 — Derechos ciudadanos, recursos',
  [TEMAS_A2.T33]: '[A2] Tema 33 — Contratos sector público (I)',
  [TEMAS_A2.T38]: '[A2] Tema 38 — Subvenciones públicas',
  [TEMAS_A2.T40]: '[A2] Tema 40 — Contratos (II), convenios',
  [TEMAS_A2.T41]: '[A2] Tema 41 — Personal AAPP: concepto, clases',
  [TEMAS_A2.T42]: '[A2] Tema 42 — Derechos/deberes, disciplinario',
  [TEMAS_A2.T43]: '[A2] Tema 43 — Planificación RRHH, OEP',
  [TEMAS_A2.T44]: '[A2] Tema 44 — Provisión puestos, promoción',
  [TEMAS_A2.T45]: '[A2] Tema 45 — Situaciones admin, incompatibilidades',
  [TEMAS_A2.T46]: '[A2] Tema 46 — Retribuciones',
  [TEMAS_A2.T47]: '[A2] Tema 47 — Personal laboral, IV Convenio',
  [TEMAS_A2.T48]: '[A2] Tema 48 — Negociación colectiva, huelga',
  [TEMAS_A2.T49]: '[A2] Tema 49 — SS funcionarios, MUFACE',
  [TEMAS_A2.T50]: '[A2] Tema 50 — Empleo público discapacidad',
  [TEMAS_A2.T51]: '[A2] Tema 51 — Presupuesto, LGP',
  [TEMAS_A2.T52]: '[A2] Tema 52 — Leyes anuales presupuestos',
  [TEMAS_A2.T53]: '[A2] Tema 53 — Modificaciones presupuestarias',
  [TEMAS_A2.T54]: '[A2] Tema 54 — Control gasto público, IGAE',
  [TEMAS_A2.T55]: '[A2] Tema 55 — Ejecución presupuesto gasto',
  [TEMAS_A2.T56]: '[A2] Tema 56 — Gastos compra bienes/servicios',
}

// ─── Lógica de mapping ────────────────────────────────────────────────────────

/**
 * Determina los tema_ids C2 (Auxiliar) para un artículo dado.
 *
 * Reglas por ley (basadas en el temario oficial 2025-2026):
 *
 *   CE       → Varía por Título constitucional (ver switch interno)
 *   LPAC     → Tema 11 (procedimiento administrativo)
 *   LRJSP    → Temas 8 + 11 (organización AGE + régimen jurídico)
 *   TREBEP   → Tema 13 o 14 según Título (derechos/deberes → T14, resto → T13)
 *   LOPDGDD  → Tema 12
 *   Ley 19/2013 → Temas 6 + 7 (Gobierno Abierto + Transparencia)
 *   Ley 50/1997 → Tema 5 (Gobierno)
 *   Ley 4/2023  → Tema 16 (LGTBI)
 *   LO 3/2007   → Tema 16 (Igualdad)
 *   LO 1/2004   → Tema 16 (Violencia de Género)
 *   LGP        → Tema 15 (Presupuesto)
 *   LOTC       → Tema 2 (Tribunal Constitucional)
 *   LOPJ       → Tema 4 (Poder Judicial)
 *   LCSP       → Tema 8 (Contratos del sector público → AGE)
 */
function computeTemaIdsC2(ley_codigo: string, titulo_capitulo: string | null): string[] {
  const s = titulo_capitulo ?? ''

  switch (ley_codigo) {
    // ── Constitución Española ─────────────────────────────────────────────────
    // Mapeo por Título constitucional. Arts 1-9 (Título Preliminar) → Tema 1.
    case 'BOE-A-1978-31229':
      if (s.includes('TÍTULO IX'))   return [TEMAS.T2]   // Tribunal Constitucional
      if (s.includes('TÍTULO VIII')) return [TEMAS.T9]   // Organización Territorial
      if (s.includes('TÍTULO VII'))  return [TEMAS.T15]  // Economía y Hacienda → Presupuesto
      if (s.includes('TÍTULO VI'))   return [TEMAS.T4]   // Poder Judicial
      if (s.includes('TÍTULO V'))    return [TEMAS.T5]   // Relaciones Gobierno-Cortes
      if (s.includes('TÍTULO IV'))   return [TEMAS.T5]   // Gobierno y Administración
      if (s.includes('TÍTULO III'))  return [TEMAS.T3]   // Cortes Generales
      // TÍTULO I (Derechos y Deberes), TÍTULO II (Corona), sin sección (Prelim) → T1
      return [TEMAS.T1]

    // ── LPAC — Ley 39/2015 ────────────────────────────────────────────────────
    case 'BOE-A-2015-10565':
      return [TEMAS.T11]

    // ── LRJSP — Ley 40/2015 ───────────────────────────────────────────────────
    // Cubre tanto la organización del sector público (T8) como el régimen jurídico
    // que complementa el procedimiento administrativo (T11).
    case 'BOE-A-2015-10566':
      return [TEMAS.T8, TEMAS.T11]

    // ── TREBEP — RDL 5/2015 ───────────────────────────────────────────────────
    // Título III (Derechos, Deberes, Código de Conducta) + Título VII (Disciplinario) → T14
    // Resto (acceso, carrera, situaciones administrativas) → T13
    case 'BOE-A-2015-11719':
      if (s.includes('TÍTULO III') || s.includes('TÍTULO VII')) return [TEMAS.T14]
      return [TEMAS.T13]

    // ── LOPDGDD — LO 3/2018 ───────────────────────────────────────────────────
    case 'BOE-A-2018-16673':
      return [TEMAS.T12]

    // ── Ley 19/2013 Transparencia ─────────────────────────────────────────────
    // Cubre Gobierno Abierto (T6) y Transparencia propiamente (T7) — temas gemelos.
    case 'BOE-A-2013-12887':
      return [TEMAS.T6, TEMAS.T7]

    // ── Ley 50/1997 del Gobierno ──────────────────────────────────────────────
    case 'BOE-A-1997-25336':
      return [TEMAS.T5]

    // ── Ley 4/2023 LGTBI ──────────────────────────────────────────────────────
    case 'BOE-A-2023-5366':
      return [TEMAS.T16]

    // ── LO 3/2007 Igualdad ────────────────────────────────────────────────────
    case 'BOE-A-2007-6115':
      return [TEMAS.T16]

    // ── LO 1/2004 Violencia de Género ─────────────────────────────────────────
    case 'BOE-A-2004-21760':
      return [TEMAS.T16]

    // ── LGP — Ley 47/2003 ─────────────────────────────────────────────────────
    case 'BOE-A-2003-21614':
      return [TEMAS.T15]

    // ── LOTC — LO 2/1979 ──────────────────────────────────────────────────────
    case 'BOE-A-1979-23709':
      return [TEMAS.T2]

    // ── LOPJ — LO 6/1985 ──────────────────────────────────────────────────────
    case 'BOE-A-1985-12666':
      return [TEMAS.T4]

    // ── LCSP — Ley 9/2017 ─────────────────────────────────────────────────────
    // Contratos del sector público → administración pública activa → T8
    case 'BOE-A-2017-12902':
      return [TEMAS.T8]

    default:
      return []
  }
}

/**
 * Determina los tema_ids A2 GACE (Gestión) para un artículo dado.
 *
 * El temario A2 tiene 58 temas en 6 bloques. Muchas leyes se comparten
 * con C2 pero mapean a temas diferentes (más granulares).
 *
 * Reglas por ley:
 *   CE         → Temas 1-7 según Título constitucional
 *   LPAC       → Temas 30-31
 *   LRJSP      → Temas 8, 30
 *   TREBEP     → Temas 41-50 según Título
 *   LOPDGDD    → Tema 25
 *   Ley 19/2013 → Tema 24
 *   Ley 50/1997 → Tema 6
 *   LCSP       → Temas 33, 40
 *   LGP        → Temas 51-56 según Título
 *   Subvenciones → Tema 38
 *   MUFACE     → Tema 49
 *   IV Convenio → Tema 47
 *   LOPJ       → Tema 7
 *   LOTC       → Tema 3
 *   LO Igualdad/Violencia/LGTBI → Tema 26
 *   Incompatibilidades → Tema 45
 *   LBRL       → Tema 11
 *   LGSS       → Temas 21, 49
 */
function computeTemaIdsA2(ley_codigo: string, titulo_capitulo: string | null): string[] {
  const s = titulo_capitulo ?? ''

  switch (ley_codigo) {
    // ── Constitución Española ─────────────────────────────────────────────────
    // A2 tiene temas separados por cada poder + Corona + Derechos fundamentales
    case 'BOE-A-1978-31229':
      if (s.includes('TÍTULO X'))    return [TEMAS_A2.T1]   // Reforma constitucional → T1 (estructura CE)
      if (s.includes('TÍTULO IX'))   return [TEMAS_A2.T3]   // Tribunal Constitucional
      if (s.includes('TÍTULO VIII')) return [TEMAS_A2.T10]  // Organización Territorial → CCAA
      if (s.includes('TÍTULO VII'))  return [TEMAS_A2.T51]  // Economía y Hacienda → Presupuesto
      if (s.includes('TÍTULO VI'))   return [TEMAS_A2.T7]   // Poder Judicial
      if (s.includes('TÍTULO V'))    return [TEMAS_A2.T6]   // Relaciones Gobierno-Cortes
      if (s.includes('TÍTULO IV'))   return [TEMAS_A2.T6]   // Gobierno y Administración
      if (s.includes('TÍTULO III'))  return [TEMAS_A2.T5]   // Cortes Generales
      if (s.includes('TÍTULO II'))   return [TEMAS_A2.T4]   // La Corona
      if (s.includes('TÍTULO I'))    return [TEMAS_A2.T2]   // Derechos y Deberes Fundamentales
      // Título Preliminar → T1 (estructura CE general)
      return [TEMAS_A2.T1]

    // ── LPAC — Ley 39/2015 ────────────────────────────────────────────────────
    // Procedimiento (T30) + recursos y derechos ciudadanos (T31)
    case 'BOE-A-2015-10565':
      // Título V (Revisión de actos) → T31 (recursos administrativos)
      if (s.includes('TÍTULO V')) return [TEMAS_A2.T31]
      // Título II, III, IV (procedimiento iniciación, ordenación, terminación) → T30
      return [TEMAS_A2.T30]

    // ── LRJSP — Ley 40/2015 ───────────────────────────────────────────────────
    // Organización AGE (T8) + complementa procedimiento (T30)
    case 'BOE-A-2015-10566':
      return [TEMAS_A2.T8, TEMAS_A2.T30]

    // ── TREBEP — RDL 5/2015 ───────────────────────────────────────────────────
    // A2 tiene 10 temas de empleo público (41-50), mapeo granular por Título
    case 'BOE-A-2015-11719':
      // Título II (Clases de personal) → T41
      if (s.includes('TÍTULO II'))  return [TEMAS_A2.T41]
      // Título III (Derechos, Deberes, Código de Conducta) → T42
      if (s.includes('TÍTULO III')) return [TEMAS_A2.T42]
      // Título IV (Selección, OEP) → T43
      if (s.includes('TÍTULO IV'))  return [TEMAS_A2.T43]
      // Título V (Provisión puestos, movilidad) → T44
      if (s.includes('TÍTULO V'))   return [TEMAS_A2.T44]
      // Título VI (Situaciones administrativas) → T45
      if (s.includes('TÍTULO VI'))  return [TEMAS_A2.T45]
      // Título VII (Régimen disciplinario) → T42 (derechos/deberes + disciplinario)
      if (s.includes('TÍTULO VII')) return [TEMAS_A2.T42]
      // Título VIII (Negociación colectiva) → T48
      if (s.includes('TÍTULO VIII')) return [TEMAS_A2.T48]
      // Título I o general → T41 (concepto, clases personal)
      return [TEMAS_A2.T41]

    // ── LOPDGDD — LO 3/2018 ───────────────────────────────────────────────────
    case 'BOE-A-2018-16673':
      return [TEMAS_A2.T25]

    // ── Ley 19/2013 Transparencia ─────────────────────────────────────────────
    case 'BOE-A-2013-12887':
      return [TEMAS_A2.T24]

    // ── Ley 50/1997 del Gobierno ──────────────────────────────────────────────
    case 'BOE-A-1997-25336':
      return [TEMAS_A2.T6]

    // ── Ley 4/2023 LGTBI ──────────────────────────────────────────────────────
    case 'BOE-A-2023-5366':
      return [TEMAS_A2.T26]

    // ── LO 3/2007 Igualdad ────────────────────────────────────────────────────
    case 'BOE-A-2007-6115':
      return [TEMAS_A2.T26]

    // ── LO 1/2004 Violencia de Género ─────────────────────────────────────────
    case 'BOE-A-2004-21760':
      return [TEMAS_A2.T26]

    // ── LGP — Ley 47/2003 ─────────────────────────────────────────────────────
    // A2 tiene 6 temas de gestión financiera (51-56), mapeo granular por Título
    case 'BOE-A-2003-21614':
      // Título I (Ámbito, PGE) → T51
      if (s.includes('TÍTULO I') && !s.includes('TÍTULO II') && !s.includes('TÍTULO IV'))
        return [TEMAS_A2.T51]
      // Título II (Presupuestos: elaboración, aprobación, estructura) → T52
      if (s.includes('TÍTULO II'))  return [TEMAS_A2.T52]
      // Título III (Modificaciones presupuestarias) → T53
      if (s.includes('TÍTULO III')) return [TEMAS_A2.T53]
      // Título IV (Gastos, ejecución) → T55
      if (s.includes('TÍTULO IV'))  return [TEMAS_A2.T55]
      // Título V (Tesorería), Título VI (Control, IGAE) → T54
      if (s.includes('TÍTULO V') || s.includes('TÍTULO VI'))  return [TEMAS_A2.T54]
      // Título VII (Contabilidad) → T58
      // (no está en TEMAS_A2 nombres pero se puede mapear — T58 is contabilidad)
      // Default → T51 (concepto general presupuesto)
      return [TEMAS_A2.T51]

    // ── LOTC — LO 2/1979 ──────────────────────────────────────────────────────
    case 'BOE-A-1979-23709':
      return [TEMAS_A2.T3]

    // ── LOPJ — LO 6/1985 ──────────────────────────────────────────────────────
    case 'BOE-A-1985-12666':
      return [TEMAS_A2.T7]

    // ── LCSP — Ley 9/2017 ─────────────────────────────────────────────────────
    // Contratos del sector público → T33 (tipos, adjudicación) + T40 (especiales, convenios)
    case 'BOE-A-2017-12902':
      return [TEMAS_A2.T33, TEMAS_A2.T40]

    // ── LBRL — Ley 7/1985 ─────────────────────────────────────────────────────
    // Bases del Régimen Local → T11 (Administración local)
    case 'BOE-A-1985-5392':
      return [TEMAS_A2.T11]

    // ── LGSS — RDL 8/2015 ─────────────────────────────────────────────────────
    // Seguridad Social → T21 (estructura SS) + T49 (SS funcionarios/MUFACE)
    case 'BOE-A-2015-11724':
      return [TEMAS_A2.T21, TEMAS_A2.T49]

    // ── Ley 38/2003 Subvenciones ──────────────────────────────────────────────
    case 'BOE-A-2003-20977':
      return [TEMAS_A2.T38]

    // ── Ley 53/1984 Incompatibilidades ────────────────────────────────────────
    case 'BOE-A-1985-151':
      return [TEMAS_A2.T45]

    // ── RD 375/2003 MUFACE ────────────────────────────────────────────────────
    case 'BOE-A-2003-7527':
      return [TEMAS_A2.T49]

    // ── IV Convenio Único AGE ─────────────────────────────────────────────────
    case 'BOE-A-2019-7414':
      return [TEMAS_A2.T47]

    default:
      return []
  }
}

/**
 * Computa tema_ids para TODAS las oposiciones.
 * Combina C2 + A2 mappings y deduplica.
 */
function computeTemaIds(ley_codigo: string, titulo_capitulo: string | null): string[] {
  const c2 = computeTemaIdsC2(ley_codigo, titulo_capitulo)
  const a2 = computeTemaIdsA2(ley_codigo, titulo_capitulo)
  // Deduplicate (no debería haber overlap — IDs son distintos por oposición)
  const combined = [...c2, ...a2]
  return [...new Set(combined)]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ArticuloRow {
  id: string
  ley_codigo: string
  ley_nombre: string
  articulo_numero: string
  titulo_capitulo: string | null
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  OPTEK auto-map-themes.ts — §1.1.9 + §1.1.11               ║')
  console.log('║  Mapeo determinista de artículos a tema_ids                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  // ── 1. Leer todos los artículos de la BD ─────────────────────────────────

  console.log('📥 Leyendo artículos de legislacion...')
  const { data: articulos, error } = await supabase
    .from('legislacion')
    .select('id, ley_codigo, ley_nombre, articulo_numero, titulo_capitulo')
    .eq('activo', true)
    .order('ley_codigo')
    .order('articulo_numero')

  if (error) {
    console.error('❌ Error leyendo legislacion:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${articulos.length} artículos leídos`)
  console.log()

  // ── 2. Computar tema_ids para cada artículo ───────────────────────────────

  console.log('🗺️  Computando tema_ids (mapping determinista)...')

  const updates: Array<{ id: string; tema_ids: string[] }> = []
  const statsPerLey: Record<string, { total: number; porTema: Record<string, number> }> = {}
  const statsPerTema: Record<string, number> = {}
  let sinTema = 0

  for (const art of articulos as ArticuloRow[]) {
    const temaIds = computeTemaIds(art.ley_codigo, art.titulo_capitulo)
    updates.push({ id: art.id, tema_ids: temaIds })

    // Stats por ley
    const leyNombre = LEY_NOMBRES[art.ley_codigo] ?? art.ley_codigo
    if (!statsPerLey[leyNombre]) statsPerLey[leyNombre] = { total: 0, porTema: {} }
    statsPerLey[leyNombre].total++

    if (temaIds.length === 0) {
      sinTema++
      statsPerLey[leyNombre].porTema['SIN_TEMA'] =
        (statsPerLey[leyNombre].porTema['SIN_TEMA'] ?? 0) + 1
    } else {
      for (const tId of temaIds) {
        const tNombre = TEMA_NOMBRES[tId] ?? tId
        statsPerLey[leyNombre].porTema[tNombre] =
          (statsPerLey[leyNombre].porTema[tNombre] ?? 0) + 1
        statsPerTema[tNombre] = (statsPerTema[tNombre] ?? 0) + 1
      }
    }
  }

  console.log(`✅ ${updates.length} artículos procesados (${sinTema} sin tema asignado)`)
  console.log()

  // ── 3. Actualizar BD en batches ───────────────────────────────────────────

  const BATCH_SIZE = 100
  const batches = Math.ceil(updates.length / BATCH_SIZE)
  let updated = 0
  let errors = 0

  console.log(`📤 Actualizando BD en ${batches} batches de ${BATCH_SIZE}...`)

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    // Actualizar cada artículo del batch
    for (const upd of batch) {
      const { error: updateError } = await supabase
        .from('legislacion')
        .update({ tema_ids: upd.tema_ids })
        .eq('id', upd.id)

      if (updateError) {
        console.error(`  ❌ Error actualizando ${upd.id}: ${updateError.message}`)
        errors++
      } else {
        updated++
      }
    }

    const pct = Math.round((batchNum / batches) * 100)
    process.stdout.write(`\r  Batch ${batchNum}/${batches} (${pct}%) — ${updated} actualizados`)
  }

  console.log()
  console.log()
  console.log(`✅ BD actualizada: ${updated} OK / ${errors} errores`)
  console.log()

  // ── 4. Generar informe JSON (§1.1.11) ─────────────────────────────────────

  console.log('📄 Generando data/mapeo_temas_legislacion.json (§1.1.11)...')

  const mapeadosSinTema = updates.filter(u => u.tema_ids.length === 0).length
  const informe = {
    _generado: new Date().toISOString(),
    _descripcion: 'Mapeo determinista de artículos de legislacion a tema_ids (convocatoria 2025-2026)',
    _script: 'execution/auto-map-themes.ts',
    resumen: {
      total_articulos: updates.length,
      articulos_mapeados: updates.length - mapeadosSinTema,
      articulos_sin_tema: mapeadosSinTema,
      cobertura_pct: Number(((updates.length - mapeadosSinTema) / updates.length * 100).toFixed(1)),
      errores_bd: errors,
    },
    por_ley: statsPerLey,
    articulos_por_tema: statsPerTema,
    temas_cubiertos: Object.keys(statsPerTema).length,
    temas_sin_contenido: Object.values(TEMAS).filter(tId => !statsPerTema[TEMA_NOMBRES[tId]]).map(
      tId => TEMA_NOMBRES[tId]
    ),
  }

  const outputPath = join(process.cwd(), '..', 'data', 'mapeo_temas_legislacion.json')
  writeFileSync(outputPath, JSON.stringify(informe, null, 2), 'utf-8')
  console.log(`✅ Informe guardado en data/mapeo_temas_legislacion.json`)
  console.log()

  // ── 5. Resumen final ──────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  RESUMEN — Artículos por tema:')
  console.log('═══════════════════════════════════════════════════════════════')

  const temasOrdenados = Object.entries(statsPerTema).sort(([a], [b]) => a.localeCompare(b))
  for (const [tema, count] of temasOrdenados) {
    console.log(`  ${tema.padEnd(60, '.')} ${String(count).padStart(4)}`)
  }

  if (informe.temas_sin_contenido.length > 0) {
    console.log()
    console.log('  ⚠️  TEMAS SIN CONTENIDO (requieren ingesta adicional §1.1.6E):')
    for (const t of informe.temas_sin_contenido) {
      console.log(`     ${t}`)
    }
  }

  console.log()
  console.log(`  Total: ${informe.resumen.articulos_mapeados}/${informe.resumen.total_articulos} artículos mapeados (${informe.resumen.cobertura_pct}%)`)
  console.log()

  if (errors > 0) {
    console.log(`⚠️  ${errors} errores en BD — revisar logs`)
    process.exit(1)
  }

  console.log('✅ §1.1.9 completado — tema_ids mapeados en BD')
  console.log('✅ §1.1.11 completado — data/mapeo_temas_legislacion.json generado')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
