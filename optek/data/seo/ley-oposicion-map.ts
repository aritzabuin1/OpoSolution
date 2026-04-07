/**
 * data/seo/ley-oposicion-map.ts — Mapeo ley <-> oposicion para pSEO
 *
 * Define que oposiciones examinan cada ley, usado para generar
 * badges de oposiciones en las paginas de legislacion.
 */

export interface OpoLink {
  slug: string
  name: string
  path: string
}

// All 12 oposiciones
const OPO = {
  AUX: { slug: 'auxiliar-administrativo', name: 'Auxiliar Administrativo (C2)', path: '/oposiciones/administracion' },
  ADM: { slug: 'administrativo-estado', name: 'Administrativo del Estado (C1)', path: '/oposiciones/administracion' },
  GACE: { slug: 'gace', name: 'Gestion AGE (A2)', path: '/oposiciones/administracion' },
  CORREOS: { slug: 'correos', name: 'Personal Laboral Correos', path: '/oposiciones/correos' },
  HACIENDA: { slug: 'hacienda-aeat', name: 'Agente de Hacienda Publica', path: '/oposiciones/hacienda' },
  IIPP: { slug: 'penitenciarias', name: 'Instituciones Penitenciarias', path: '/oposiciones/penitenciarias' },
  AUXJ: { slug: 'auxilio-judicial', name: 'Auxilio Judicial (C2)', path: '/oposiciones/justicia/auxilio-judicial' },
  TRAM: { slug: 'tramitacion-procesal', name: 'Tramitacion Procesal (C1)', path: '/oposiciones/justicia/tramitacion-procesal' },
  GESTP: { slug: 'gestion-procesal', name: 'Gestion Procesal (A2)', path: '/oposiciones/justicia/gestion-procesal' },
  GC: { slug: 'guardia-civil', name: 'Guardia Civil', path: '/oposiciones/seguridad/guardia-civil' },
  PN: { slug: 'policia-nacional', name: 'Policia Nacional', path: '/oposiciones/seguridad/policia-nacional' },
  ERTZ: { slug: 'ertzaintza', name: 'Ertzaintza', path: '/oposiciones/seguridad/ertzaintza' },
} as const satisfies Record<string, OpoLink>

/**
 * Mapa: ley_nombre -> oposiciones que la examinan.
 * Clave = valor exacto de `legislacion.ley_nombre` en Supabase.
 */
export const LEY_OPOSICION_MAP: Record<string, OpoLink[]> = {
  // --- Derecho constitucional ---
  'CE': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.CORREOS, OPO.HACIENDA, OPO.IIPP, OPO.AUXJ, OPO.TRAM, OPO.GESTP, OPO.GC, OPO.PN, OPO.ERTZ],

  // --- Derecho administrativo ---
  'LPAC': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.HACIENDA, OPO.IIPP, OPO.AUXJ, OPO.TRAM, OPO.GESTP],
  'LRJSP': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.TRAM, OPO.GESTP],
  'TREBEP': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.CORREOS, OPO.HACIENDA, OPO.IIPP],
  'GOBIERNO': [OPO.AUX, OPO.ADM, OPO.GACE],
  'TRANSPARENCIA': [OPO.AUX, OPO.ADM, OPO.GACE],
  'INCOMPATIBILIDADES': [OPO.AUX, OPO.ADM, OPO.GACE],
  'LBRL': [OPO.ADM, OPO.GACE],
  'SUBVENCIONES': [OPO.ADM, OPO.GACE],

  // --- Proteccion de datos e igualdad ---
  'LOPDGDD': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.CORREOS, OPO.HACIENDA, OPO.IIPP, OPO.AUXJ, OPO.TRAM, OPO.GESTP],
  'LOIGUALDAD': [OPO.AUX, OPO.ADM, OPO.GACE, OPO.GC, OPO.PN],

  // --- Presupuestos y contratacion ---
  'LGP': [OPO.ADM, OPO.GACE, OPO.GESTP],
  'LCSP': [OPO.ADM, OPO.GACE, OPO.GESTP],

  // --- Seguridad social y funcion publica ---
  'LGSS': [OPO.ADM, OPO.GACE],
  'CONVENIO_UNICO_IV': [OPO.ADM, OPO.GACE],
  'MUFACE': [OPO.GACE],

  // --- Hacienda y tributario ---
  'LGT': [OPO.HACIENDA],
  'LIRPF': [OPO.HACIENDA],
  'LIVA': [OPO.HACIENDA],
  'LIS': [OPO.HACIENDA],
  'LIEE': [OPO.HACIENDA],
  'RGR': [OPO.HACIENDA],
  'RGAGI': [OPO.HACIENDA],
  'LEY23_2014': [OPO.HACIENDA],
  'BLANQUEO_CAPITALES': [OPO.HACIENDA],

  // --- Correos ---
  'LEY_POSTAL': [OPO.CORREOS],
  'REGLAMENTO_POSTAL': [OPO.CORREOS],
  'PRL': [OPO.CORREOS, OPO.GC, OPO.PN],

  // --- Penitenciario ---
  'CP': [OPO.IIPP, OPO.AUXJ, OPO.TRAM, OPO.GESTP, OPO.GC, OPO.PN],
  'LOGP': [OPO.IIPP],
  'RP': [OPO.IIPP],
  'RD840': [OPO.IIPP],
  'ESTATUTO_VICTIMA': [OPO.IIPP],

  // --- Justicia ---
  'LOPJ': [OPO.AUXJ, OPO.TRAM, OPO.GESTP],
  'LEC': [OPO.AUXJ, OPO.TRAM, OPO.GESTP],
  'LECrim': [OPO.AUXJ, OPO.TRAM, OPO.GESTP],
  'LO 1/2025': [OPO.AUXJ, OPO.TRAM, OPO.GESTP],

  // --- Seguridad ciudadana y fuerzas ---
  'FCSE': [OPO.GC, OPO.PN, OPO.ERTZ],
  'SEG_CIUDADANA': [OPO.GC, OPO.PN, OPO.ERTZ],
  'LOEX': [OPO.GC, OPO.PN],
  'SEG_PRIVADA': [OPO.GC, OPO.PN],
  'LGTBI': [OPO.GC, OPO.PN],
  'DERECHO_REUNION': [OPO.GC],

  // --- Ertzaintza (normativa vasca) ---
  'ESTATUTO_GERNIKA': [OPO.ERTZ],
  'LEY_SEG_EUSKADI': [OPO.ERTZ],
  'DL_POLICIA_PV': [OPO.ERTZ],
  'DL_IGUALDAD_CAV': [OPO.ERTZ],
  'D_VIDEOCAMARAS': [OPO.ERTZ],
  'D_COORDINACION': [OPO.ERTZ],
}

/**
 * Reverse lookup: returns the oposiciones that test a given law.
 * Returns empty array if law not found.
 */
export function getOposicionesForLey(leyNombre: string): OpoLink[] {
  return LEY_OPOSICION_MAP[leyNombre] ?? []
}
