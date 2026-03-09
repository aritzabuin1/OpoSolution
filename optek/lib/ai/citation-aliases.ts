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
