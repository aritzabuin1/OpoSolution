/**
 * lib/ai/citation-aliases.ts — OPTEK §1.5.12
 *
 * Diccionario de aliases para resolver nombres y abreviaturas de leyes
 * al valor exacto de ley_nombre almacenado en la tabla `legislacion` de Supabase.
 *
 * Valores válidos en BD: CE, LPAC, LRJSP, TREBEP, LOPDGDD, LOIGUALDAD,
 *                        LOVIGEN, LGTBI, LOTC, LOPJ, LGP, LGOB, TRANSPARENCIA, LCSP
 */

// Mapa: texto en minúsculas → ley_nombre exacto en BD
export const CITATION_ALIASES: Record<string, string> = {
  // Constitución Española
  'ce': 'CE',
  'constitución': 'CE',
  'constitucion': 'CE',
  'constitución española': 'CE',
  'constitucion española': 'CE',
  'constitución española de 1978': 'CE',
  'carta magna': 'CE',

  // LPAC — Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común
  'lpac': 'LPAC',
  'ley 39/2015': 'LPAC',
  'ley39/2015': 'LPAC',
  'procedimiento administrativo': 'LPAC',
  'ley de procedimiento': 'LPAC',
  'ley de procedimiento administrativo': 'LPAC',
  'procedimiento administrativo común': 'LPAC',

  // LRJSP — Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público
  'lrjsp': 'LRJSP',
  'ley 40/2015': 'LRJSP',
  'régimen jurídico': 'LRJSP',
  'regimen juridico': 'LRJSP',
  'régimen jurídico del sector público': 'LRJSP',
  'sector público': 'LRJSP',

  // TREBEP — Real Decreto Legislativo 5/2015, Estatuto Básico del Empleado Público
  'trebep': 'TREBEP',
  'ebep': 'TREBEP',
  'estatuto básico': 'TREBEP',
  'estatuto basico': 'TREBEP',
  'rdl 5/2015': 'TREBEP',
  'estatuto del empleado': 'TREBEP',
  'estatuto básico del empleado público': 'TREBEP',
  'estatuto basico del empleado publico': 'TREBEP',

  // LOPDGDD — LO 3/2018, de Protección de Datos Personales y garantía de los derechos digitales
  'lopdgdd': 'LOPDGDD',
  'lo 3/2018': 'LOPDGDD',
  'protección de datos': 'LOPDGDD',
  'proteccion de datos': 'LOPDGDD',
  'rgpd': 'LOPDGDD',
  'lopd': 'LOPDGDD',
  'derechos digitales': 'LOPDGDD',

  // LOIGUALDAD — LO 3/2007, para la igualdad efectiva de mujeres y hombres
  'loigualdad': 'LOIGUALDAD',
  'lo 3/2007': 'LOIGUALDAD',
  'ley de igualdad': 'LOIGUALDAD',
  'igualdad efectiva': 'LOIGUALDAD',
  'igualdad efectiva de mujeres y hombres': 'LOIGUALDAD',

  // LOVIGEN — LO 1/2004, de Medidas de Protección Integral contra la Violencia de Género
  'lovigen': 'LOVIGEN',
  'lo 1/2004': 'LOVIGEN',
  'violencia de género': 'LOVIGEN',
  'violencia de genero': 'LOVIGEN',
  'violencia doméstica': 'LOVIGEN',
  'violencia domestica': 'LOVIGEN',

  // LGTBI — Ley 4/2023, para la igualdad real y efectiva de las personas trans y LGTBI+
  'lgtbi': 'LGTBI',
  'ley 4/2023': 'LGTBI',
  'ley trans': 'LGTBI',
  'ley lgtbi': 'LGTBI',

  // LOTC — LO 2/1979, del Tribunal Constitucional
  'lotc': 'LOTC',
  'lo 2/1979': 'LOTC',
  'tribunal constitucional': 'LOTC',

  // LOPJ — LO 6/1985, del Poder Judicial
  'lopj': 'LOPJ',
  'lo 6/1985': 'LOPJ',
  'poder judicial': 'LOPJ',

  // LGP — Ley 47/2003, General Presupuestaria
  'lgp': 'LGP',
  'ley 47/2003': 'LGP',
  'ley general presupuestaria': 'LGP',
  'presupuestaria': 'LGP',

  // LGOB — Ley 50/1997, del Gobierno
  'lgob': 'LGOB',
  'ley 50/1997': 'LGOB',
  'ley del gobierno': 'LGOB',

  // TRANSPARENCIA — Ley 19/2013, de transparencia, acceso a la información y buen gobierno
  'transparencia': 'TRANSPARENCIA',
  'ley 19/2013': 'TRANSPARENCIA',
  'acceso a la información': 'TRANSPARENCIA',
  'acceso a la informacion': 'TRANSPARENCIA',
  'buen gobierno': 'TRANSPARENCIA',
  'ley de transparencia': 'TRANSPARENCIA',

  // LCSP — Ley 9/2017, de Contratos del Sector Público
  'lcsp': 'LCSP',
  'ley 9/2017': 'LCSP',
  'contratos del sector público': 'LCSP',
  'contratos del sector publico': 'LCSP',
  'contratación pública': 'LCSP',
  'contratacion publica': 'LCSP',

  // LEY_POSTAL — Ley 43/2010, del servicio postal universal
  'ley postal': 'LEY_POSTAL',
  'ley_postal': 'LEY_POSTAL',
  'ley 43/2010': 'LEY_POSTAL',
  'servicio postal universal': 'LEY_POSTAL',
  'servicio postal': 'LEY_POSTAL',
  'ley del servicio postal': 'LEY_POSTAL',

  // RD_POSTAL — RD 1829/1999, Reglamento de servicios postales
  'rd postal': 'RD_POSTAL',
  'rd_postal': 'RD_POSTAL',
  'rd 1829/1999': 'RD_POSTAL',
  'reglamento postal': 'RD_POSTAL',
  'reglamento de servicios postales': 'RD_POSTAL',
  'reglamento servicios postales': 'RD_POSTAL',

  // LEC — Ley 1/2000, de Enjuiciamiento Civil
  'lec': 'LEC',
  'ley 1/2000': 'LEC',
  'enjuiciamiento civil': 'LEC',
  'ley de enjuiciamiento civil': 'LEC',

  // LECrim — LECrim 1882, de Enjuiciamiento Criminal
  'lecrim': 'LECrim',
  'lecriminal': 'LECrim',
  'ley de enjuiciamiento criminal': 'LECrim',
  'enjuiciamiento criminal': 'LECrim',

  // PRL — Ley 31/1995, de Prevención de Riesgos Laborales
  'prl': 'PRL',
  'ley 31/1995': 'PRL',
  'prevención de riesgos': 'PRL',
  'prevencion de riesgos': 'PRL',
  'riesgos laborales': 'PRL',
  'prevención de riesgos laborales': 'PRL',

  // LO_SPJ — LO 1/2025, del Servicio Público de Justicia
  'lo_spj': 'LO_SPJ',
  'lo 1/2025': 'LO_SPJ',
  'servicio público de justicia': 'LO_SPJ',
  'servicio publico de justicia': 'LO_SPJ',

  // SUBVENCIONES — Ley 38/2003, General de Subvenciones
  'subvenciones': 'SUBVENCIONES',
  'ley 38/2003': 'SUBVENCIONES',
  'ley de subvenciones': 'SUBVENCIONES',
  'ley general de subvenciones': 'SUBVENCIONES',

  // LGSS — RDL 8/2015, Ley General de la Seguridad Social
  'lgss': 'LGSS',
  'rdl 8/2015': 'LGSS',
  'seguridad social': 'LGSS',
  'ley general de la seguridad social': 'LGSS',

  // ─── Hacienda ─────────────────────────────────────────────────────────────
  // LGT — Ley 58/2003, General Tributaria
  'lgt': 'LGT',
  'ley 58/2003': 'LGT',
  'ley general tributaria': 'LGT',
  'general tributaria': 'LGT',

  // LIRPF — Ley 35/2006, IRPF
  'lirpf': 'LIRPF',
  'irpf': 'LIRPF',
  'ley 35/2006': 'LIRPF',
  'impuesto sobre la renta': 'LIRPF',

  // LIS — Ley 27/2014, Impuesto de Sociedades
  'lis': 'LIS',
  'ley 27/2014': 'LIS',
  'impuesto de sociedades': 'LIS',
  'impuesto sobre sociedades': 'LIS',

  // LIVA — Ley 37/1992, IVA
  'liva': 'LIVA',
  'ley 37/1992': 'LIVA',
  'iva': 'LIVA',
  'impuesto sobre el valor añadido': 'LIVA',
  'impuesto sobre el valor anadido': 'LIVA',

  // LIEE — Ley 38/1992, Impuestos Especiales
  'liee': 'LIEE',
  'ley 38/1992': 'LIEE',
  'impuestos especiales': 'LIEE',

  // RGR — RD 939/2005, Rgto. General de Recaudación
  'rgr': 'RGR',
  'rd 939/2005': 'RGR',
  'reglamento general de recaudación': 'RGR',
  'reglamento general de recaudacion': 'RGR',

  // RGAGI — RD 1065/2007, Rgto. Gestión e Inspección
  'rgagi': 'RGAGI',
  'rd 1065/2007': 'RGAGI',
  'reglamento de gestión e inspección': 'RGAGI',

  // ─── Penitenciarias ───────────────────────────────────────────────────────
  // CP — LO 10/1995, Código Penal
  'cp': 'CP',
  'código penal': 'CP',
  'codigo penal': 'CP',
  'lo 10/1995': 'CP',
  'ley orgánica 10/1995': 'CP',

  // LOGP — LO 1/1979, General Penitenciaria
  'logp': 'LOGP',
  'lo 1/1979': 'LOGP',
  'ley general penitenciaria': 'LOGP',
  'ley orgánica general penitenciaria': 'LOGP',

  // RP — RD 190/1996, Reglamento Penitenciario
  'rp': 'RP',
  'rd 190/1996': 'RP',
  'reglamento penitenciario': 'RP',

  // RD 840/2011 — Medidas alternativas
  'rd 840/2011': 'RD840',
  'medidas alternativas': 'RD840',

  // Voluntariado — Ley 45/2015
  'ley 45/2015': 'VOLUNTARIADO',
  'voluntariado': 'VOLUNTARIADO',
  'ley del voluntariado': 'VOLUNTARIADO',

  // Dependencia — Ley 39/2006
  'ley 39/2006': 'DEPENDENCIA',
  'dependencia': 'DEPENDENCIA',
  'ley de dependencia': 'DEPENDENCIA',

  // Incompatibilidades — Ley 53/1984
  'ley 53/1984': 'INCOMPATIBILIDADES',
  'incompatibilidades': 'INCOMPATIBILIDADES',

  // LOEX — LO 4/2000 Extranjería
  'loex': 'LOEX',
  'lo 4/2000': 'LOEX',
  'extranjería': 'LOEX',
  'extranjeria': 'LOEX',
  'ley de extranjería': 'LOEX',

  // ─── Seguridad ────────────────────────────────────────────────────────────
  // LO 2/1986 FCSE
  'lo 2/1986': 'FCSE',
  'fcse': 'FCSE',
  'ley orgánica 2/1986': 'FCSE',
  'fuerzas y cuerpos de seguridad': 'FCSE',
  'fuerzas y cuerpos de seguridad del estado': 'FCSE',
  'ley de fuerzas y cuerpos': 'FCSE',
  'lofcse': 'FCSE',
  'lo fcse': 'FCSE',

  // LO 4/2015 Seguridad Ciudadana
  'lo 4/2015': 'SEG_CIUDADANA',
  'seguridad ciudadana': 'SEG_CIUDADANA',
  'ley de seguridad ciudadana': 'SEG_CIUDADANA',
  'ley orgánica 4/2015': 'SEG_CIUDADANA',
  'lopsc': 'SEG_CIUDADANA',

  // Ley 5/2014 Seguridad Privada
  'ley 5/2014': 'SEG_PRIVADA',
  'seguridad privada': 'SEG_PRIVADA',
  'ley de seguridad privada': 'SEG_PRIVADA',

  // RDL 6/2015 Seguridad Vial
  'rdl 6/2015': 'LSV',
  'lsv': 'LSV',
  'seguridad vial': 'LSV',
  'ley de seguridad vial': 'LSV',
  'tráfico': 'LSV',
  'trafico': 'LSV',

  // LO 3/1979 Estatuto de Gernika
  'lo 3/1979': 'ESTATUTO_GERNIKA',
  'estatuto de gernika': 'ESTATUTO_GERNIKA',
  'estatuto de autonomía del país vasco': 'ESTATUTO_GERNIKA',
  'estatuto de autonomia del pais vasco': 'ESTATUTO_GERNIKA',
  'estatuto vasco': 'ESTATUTO_GERNIKA',

  // LO 9/1983 Derecho de Reunión
  'lo 9/1983': 'DERECHO_REUNION',
  'derecho de reunión': 'DERECHO_REUNION',
  'derecho de reunion': 'DERECHO_REUNION',

  // Ley 4/2015 Estatuto de la Víctima
  'ley 4/2015': 'ESTATUTO_VICTIMA',
  'estatuto de la víctima': 'ESTATUTO_VICTIMA',
  'estatuto de la victima': 'ESTATUTO_VICTIMA',

  // ─── Leyes vascas (Ertzaintza) ────────────────────────────────────────────
  // DL 1/2023 Igualdad CAV
  'dl 1/2023': 'DL_IGUALDAD_CAV',
  'decreto legislativo 1/2023': 'DL_IGUALDAD_CAV',
  'igualdad de mujeres y hombres cav': 'DL_IGUALDAD_CAV',
  'ley de igualdad del país vasco': 'DL_IGUALDAD_CAV',
  'ley de igualdad del pais vasco': 'DL_IGUALDAD_CAV',
  'igualdad cav': 'DL_IGUALDAD_CAV',

  // DL 1/2020 Ley Policía País Vasco
  'dl 1/2020': 'DL_POLICIA_PV',
  'decreto legislativo 1/2020': 'DL_POLICIA_PV',
  'ley de policía del país vasco': 'DL_POLICIA_PV',
  'ley de policia del pais vasco': 'DL_POLICIA_PV',
  'policía del país vasco': 'DL_POLICIA_PV',

  // Ley 15/2012 Seguridad Pública Euskadi
  'ley 15/2012': 'LEY_SEG_EUSKADI',
  'seguridad pública euskadi': 'LEY_SEG_EUSKADI',
  'seguridad publica euskadi': 'LEY_SEG_EUSKADI',
  'ley de seguridad pública de euskadi': 'LEY_SEG_EUSKADI',

  // Ley 23/2014 Reconocimiento mutuo
  'ley 23/2014': 'LEY23_2014',
  'reconocimiento mutuo': 'LEY23_2014',
}

// Mapa compacto: "número/año" → ley_nombre en BD
// Cubre variantes que la IA escribe como "Ley 39/2015", "LO 3/2018", "RDLeg 5/2015"
const LEY_POR_NUMERO: Record<string, string> = {
  '39/2015': 'LPAC',
  '40/2015': 'LRJSP',
  '5/2015': 'TREBEP',
  '3/2018': 'LOPDGDD',
  '3/2007': 'LOIGUALDAD',
  '1/2004': 'LOVIGEN',
  '4/2023': 'LGTBI',
  '2/1979': 'LOTC',
  '6/1985': 'LOPJ',
  '47/2003': 'LGP',
  '50/1997': 'LGOB',
  '19/2013': 'TRANSPARENCIA',
  '9/2017': 'LCSP',
  '43/2010': 'LEY_POSTAL',
  '1829/1999': 'RD_POSTAL',
  '1/2000': 'LEC',
  '31/1995': 'PRL',
  '1/2025': 'LO_SPJ',
  '38/2003': 'SUBVENCIONES',
  '8/2015': 'LGSS',
  // Hacienda
  '58/2003': 'LGT',
  '35/2006': 'LIRPF',
  '27/2014': 'LIS',
  '37/1992': 'LIVA',
  '38/1992': 'LIEE',
  '939/2005': 'RGR',
  '1065/2007': 'RGAGI',
  // Penitenciarias
  '10/1995': 'CP',
  '1/1979': 'LOGP',
  '190/1996': 'RP',
  '840/2011': 'RD840',
  '45/2015': 'VOLUNTARIADO',
  '39/2006': 'DEPENDENCIA',
  '53/1984': 'INCOMPATIBILIDADES',
  '4/2000': 'LOEX',
  '23/2014': 'LEY23_2014',
  // Seguridad
  '2/1986': 'FCSE',
  '4/2015': 'SEG_CIUDADANA',
  '5/2014': 'SEG_PRIVADA',
  '6/2015': 'LSV',
  '3/1979': 'ESTATUTO_GERNIKA',
  '9/1983': 'DERECHO_REUNION',
  // Leyes vascas
  '1/2023': 'DL_IGUALDAD_CAV',
  '1/2020': 'DL_POLICIA_PV',
  '15/2012': 'LEY_SEG_EUSKADI',
}

// Regex para extraer patrón "X/YYYY" de cadenas como "Ley 39/2015", "LO 3/2018", "RDLeg 5/2015"
const LEY_NUMERO_RE = /(\d+\/\d{4})/

/**
 * Resuelve un nombre o abreviatura de ley al ley_nombre exacto de la BD.
 * Retorna null si no se reconoce.
 *
 * Estrategia (en orden):
 *   1. Lookup exacto en CITATION_ALIASES (case-insensitive, trimmed)
 *   2. Regex fallback: extraer "X/YYYY" y buscar en LEY_POR_NUMERO
 *      → cubre "Ley 39/2015", "ley orgánica 3/2018", "rdleg 5/2015", "LPACAP" etc.
 */
export function resolveLeyNombre(rawLey: string): string | null {
  const key = rawLey.toLowerCase().trim()

  // 1. Exact alias lookup
  const exact = CITATION_ALIASES[key]
  if (exact) return exact

  // 2. Regex fallback: extract "X/YYYY" pattern
  const match = LEY_NUMERO_RE.exec(key)
  if (match) {
    const numero = match[1]
    const resolved = LEY_POR_NUMERO[numero]
    if (resolved) return resolved
  }

  // 3. Common AI variations not in the alias map
  // "lpacap" → LPAC, "ce 1978" → CE, "ce1978" → CE
  if (key === 'lpacap') return 'LPAC'
  if (key === 'lrjpac') return 'LPAC'  // old name the AI sometimes uses
  if (/^ce\s*1978$/.test(key)) return 'CE'

  return null
}
