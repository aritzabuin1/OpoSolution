/**
 * data/seo/ley-registry.ts — Registry de leyes para pSEO
 *
 * Fuente unica de verdad para todas las leyes con sus slugs SEO,
 * metadata y prioridad de generacion de paginas.
 *
 * IMPORTANTE: `leyNombre` DEBE coincidir exactamente con `legislacion.ley_nombre` en Supabase.
 */

export type LawCategory =
  | 'constitucional'
  | 'administrativo'
  | 'penal'
  | 'procesal'
  | 'tributario'
  | 'laboral'
  | 'seguridad'
  | 'postal'
  | 'autonomico'
  | 'social'
  | 'derechos'

export interface LeyEntry {
  leyNombre: string
  slug: string
  shortName: string
  fullName: string
  officialRef: string
  boeCode: string
  category: LawCategory
  priority: 'high' | 'medium' | 'low'
  enabled: boolean
}

export const LEY_REGISTRY: LeyEntry[] = [
  // ─── CONSTITUCIONAL ───────────────────────────────────────────────
  {
    leyNombre: 'CE',
    slug: 'constitucion-espanola',
    shortName: 'CE',
    fullName: 'Constitucion Española',
    officialRef: 'Constitucion Española, de 27 de diciembre de 1978',
    boeCode: 'BOE-A-1978-31229',
    category: 'constitucional',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LOTC',
    slug: 'ley-organica-tribunal-constitucional',
    shortName: 'LOTC',
    fullName: 'Ley Organica del Tribunal Constitucional',
    officialRef: 'LO 2/1979, del Tribunal Constitucional',
    boeCode: 'BOE-A-1979-23709',
    category: 'constitucional',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'ESTATUTO_GERNIKA',
    slug: 'estatuto-autonomia-pais-vasco',
    shortName: 'Estatuto de Gernika',
    fullName: 'Estatuto de Autonomia para el Pais Vasco',
    officialRef: 'LO 3/1979, Estatuto de Autonomia para el Pais Vasco',
    boeCode: 'BOE-A-1979-30177',
    category: 'constitucional',
    priority: 'medium',
    enabled: true,
  },

  // ─── ADMINISTRATIVO ───────────────────────────────────────────────
  {
    leyNombre: 'LPAC',
    slug: 'ley-39-2015-lpac',
    shortName: 'LPAC',
    fullName: 'Ley del Procedimiento Administrativo Comun',
    officialRef: 'Ley 39/2015, del Procedimiento Administrativo Comun',
    boeCode: 'BOE-A-2015-10565',
    category: 'administrativo',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LRJSP',
    slug: 'ley-40-2015-lrjsp',
    shortName: 'LRJSP',
    fullName: 'Ley de Regimen Juridico del Sector Publico',
    officialRef: 'Ley 40/2015, de Regimen Juridico del Sector Publico',
    boeCode: 'BOE-A-2015-10566',
    category: 'administrativo',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'TREBEP',
    slug: 'estatuto-basico-empleado-publico',
    shortName: 'TREBEP',
    fullName: 'Estatuto Basico del Empleado Publico',
    officialRef: 'RDL 5/2015, del Estatuto Basico del Empleado Publico',
    boeCode: 'BOE-A-2015-11719',
    category: 'administrativo',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'GOBIERNO',
    slug: 'ley-50-1997-gobierno',
    shortName: 'Ley del Gobierno',
    fullName: 'Ley del Gobierno',
    officialRef: 'Ley 50/1997, del Gobierno',
    boeCode: 'BOE-A-1997-25336',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'INCOMPATIBILIDADES',
    slug: 'ley-incompatibilidades-funcionarios',
    shortName: 'Ley de Incompatibilidades',
    fullName: 'Ley de Incompatibilidades del personal al servicio de las Administraciones Publicas',
    officialRef: 'Ley 53/1984, de Incompatibilidades del personal al servicio de las Administraciones Publicas',
    boeCode: 'BOE-A-1985-151',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LBRL',
    slug: 'ley-bases-regimen-local',
    shortName: 'LBRL',
    fullName: 'Ley Reguladora de las Bases del Regimen Local',
    officialRef: 'Ley 7/1985, Reguladora de las Bases del Regimen Local',
    boeCode: 'BOE-A-1985-5392',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'SUBVENCIONES',
    slug: 'ley-general-subvenciones',
    shortName: 'Ley de Subvenciones',
    fullName: 'Ley General de Subvenciones',
    officialRef: 'Ley 38/2003, General de Subvenciones',
    boeCode: 'BOE-A-2003-20977',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LGP',
    slug: 'ley-general-presupuestaria',
    shortName: 'LGP',
    fullName: 'Ley General Presupuestaria',
    officialRef: 'Ley 47/2003, General Presupuestaria',
    boeCode: 'BOE-A-2003-21614',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'MUFACE',
    slug: 'reglamento-mutualismo-administrativo',
    shortName: 'MUFACE',
    fullName: 'Reglamento General del Mutualismo Administrativo',
    officialRef: 'RD 375/2003, Reglamento General del Mutualismo Administrativo',
    boeCode: 'BOE-A-2003-7527',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'CONVENIO_UNICO_IV',
    slug: 'iv-convenio-colectivo-personal-laboral-age',
    shortName: 'IV Convenio Unico AGE',
    fullName: 'IV Convenio Colectivo Unico del personal laboral de la AGE',
    officialRef: 'IV Convenio Colectivo Unico personal laboral AGE',
    boeCode: 'BOE-A-2019-7414',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'TRANSPARENCIA',
    slug: 'ley-transparencia-acceso-informacion',
    shortName: 'Ley de Transparencia',
    fullName: 'Ley de transparencia, acceso a la informacion publica y buen gobierno',
    officialRef: 'Ley 19/2013, de transparencia, acceso a la informacion publica',
    boeCode: 'BOE-A-2013-12887',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'VOLUNTARIADO',
    slug: 'ley-voluntariado',
    shortName: 'Ley de Voluntariado',
    fullName: 'Ley de Voluntariado',
    officialRef: 'Ley 45/2015, de Voluntariado',
    boeCode: 'BOE-A-2015-11072',
    category: 'administrativo',
    priority: 'low',
    enabled: true,
  },
  {
    leyNombre: 'DEPENDENCIA',
    slug: 'ley-dependencia',
    shortName: 'Ley de Dependencia',
    fullName: 'Ley de Promocion de la Autonomia Personal y Atencion a la Dependencia',
    officialRef: 'Ley 39/2006, de Promocion de la Autonomia Personal y Atencion a la Dependencia',
    boeCode: 'BOE-A-2006-21990',
    category: 'administrativo',
    priority: 'medium',
    enabled: true,
  },

  // ─── PENAL ────────────────────────────────────────────────────────
  {
    leyNombre: 'CP',
    slug: 'codigo-penal',
    shortName: 'Codigo Penal',
    fullName: 'Codigo Penal',
    officialRef: 'LO 10/1995, del Codigo Penal',
    boeCode: 'BOE-A-1995-25444',
    category: 'penal',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LOGP',
    slug: 'ley-organica-general-penitenciaria',
    shortName: 'LOGP',
    fullName: 'Ley Organica General Penitenciaria',
    officialRef: 'LO 1/1979, General Penitenciaria',
    boeCode: 'BOE-A-1979-23708',
    category: 'penal',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'RP',
    slug: 'reglamento-penitenciario',
    shortName: 'Reglamento Penitenciario',
    fullName: 'Reglamento Penitenciario',
    officialRef: 'RD 190/1996, Reglamento Penitenciario',
    boeCode: 'BOE-A-1996-3307',
    category: 'penal',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'RD840',
    slug: 'rd-840-2011-medidas-alternativas',
    shortName: 'RD 840/2011',
    fullName: 'Medidas alternativas y libertad condicional',
    officialRef: 'RD 840/2011, medidas alternativas y libertad condicional',
    boeCode: 'BOE-A-2011-10598',
    category: 'penal',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'ESTATUTO_VICTIMA',
    slug: 'estatuto-victima-delito',
    shortName: 'Estatuto de la Victima',
    fullName: 'Ley del Estatuto de la victima del delito',
    officialRef: 'Ley 4/2015, del Estatuto de la victima del delito',
    boeCode: 'BOE-A-2015-4606',
    category: 'penal',
    priority: 'medium',
    enabled: true,
  },

  // ─── PROCESAL ─────────────────────────────────────────────────────
  {
    leyNombre: 'LEC',
    slug: 'ley-enjuiciamiento-civil',
    shortName: 'LEC',
    fullName: 'Ley de Enjuiciamiento Civil',
    officialRef: 'Ley 1/2000, de Enjuiciamiento Civil',
    boeCode: 'BOE-A-2000-323',
    category: 'procesal',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LECrim',
    slug: 'ley-enjuiciamiento-criminal',
    shortName: 'LECrim',
    fullName: 'Ley de Enjuiciamiento Criminal',
    officialRef: 'Ley de Enjuiciamiento Criminal de 1882',
    boeCode: 'BOE-A-1882-6036',
    category: 'procesal',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LOPJ',
    slug: 'ley-organica-poder-judicial',
    shortName: 'LOPJ',
    fullName: 'Ley Organica del Poder Judicial',
    officialRef: 'LO 6/1985, del Poder Judicial',
    boeCode: 'BOE-A-1985-12666',
    category: 'procesal',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LO 1/2025',
    slug: 'lo-1-2025-eficiencia-justicia',
    shortName: 'LO 1/2025',
    fullName: 'Medidas en materia de eficiencia del Servicio Publico de Justicia',
    officialRef: 'LO 1/2025, de medidas en materia de eficiencia del Servicio Publico de Justicia',
    boeCode: 'BOE-A-2025-76',
    category: 'procesal',
    priority: 'medium',
    enabled: true,
  },

  // ─── TRIBUTARIO ───────────────────────────────────────────────────
  {
    leyNombre: 'LGT',
    slug: 'ley-general-tributaria',
    shortName: 'LGT',
    fullName: 'Ley General Tributaria',
    officialRef: 'Ley 58/2003, General Tributaria',
    boeCode: 'BOE-A-2003-23186',
    category: 'tributario',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LIRPF',
    slug: 'ley-irpf',
    shortName: 'LIRPF',
    fullName: 'Ley del Impuesto sobre la Renta de las Personas Fisicas',
    officialRef: 'Ley 35/2006, del Impuesto sobre la Renta de las Personas Fisicas',
    boeCode: 'BOE-A-2006-20764',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LIVA',
    slug: 'ley-iva',
    shortName: 'LIVA',
    fullName: 'Ley del Impuesto sobre el Valor Añadido',
    officialRef: 'Ley 37/1992, del Impuesto sobre el Valor Añadido',
    boeCode: 'BOE-A-1992-28740',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LIS',
    slug: 'ley-impuesto-sociedades',
    shortName: 'LIS',
    fullName: 'Ley del Impuesto sobre Sociedades',
    officialRef: 'Ley 27/2014, del Impuesto sobre Sociedades',
    boeCode: 'BOE-A-2014-12328',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LIEE',
    slug: 'ley-impuestos-especiales',
    shortName: 'LIEE',
    fullName: 'Ley de Impuestos Especiales',
    officialRef: 'Ley 38/1992, de Impuestos Especiales',
    boeCode: 'BOE-A-1992-28741',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'RGR',
    slug: 'reglamento-general-recaudacion',
    shortName: 'RGR',
    fullName: 'Reglamento General de Recaudacion',
    officialRef: 'RD 939/2005, Reglamento General de Recaudacion',
    boeCode: 'BOE-A-2005-14803',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'RGAGI',
    slug: 'reglamento-gestion-inspeccion-tributaria',
    shortName: 'RGAGI',
    fullName: 'Reglamento General de Gestion e Inspeccion tributaria',
    officialRef: 'RD 1065/2007, Reglamento General de Gestion e Inspeccion tributaria',
    boeCode: 'BOE-A-2007-15984',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'BLANQUEO_CAPITALES',
    slug: 'ley-prevencion-blanqueo-capitales',
    shortName: 'Ley de Blanqueo',
    fullName: 'Ley de prevencion del blanqueo de capitales y de la financiacion del terrorismo',
    officialRef: 'Ley 10/2010, prevencion del blanqueo de capitales',
    boeCode: 'BOE-A-2010-6737',
    category: 'tributario',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LCSP',
    slug: 'ley-contratos-sector-publico',
    shortName: 'LCSP',
    fullName: 'Ley de Contratos del Sector Publico',
    officialRef: 'Ley 9/2017, de Contratos del Sector Publico',
    boeCode: 'BOE-A-2017-12902',
    category: 'tributario',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LEY23_2014',
    slug: 'ley-reconocimiento-mutuo-resoluciones-penales-ue',
    shortName: 'Ley 23/2014',
    fullName: 'Ley de reconocimiento mutuo de resoluciones penales en la UE',
    officialRef: 'Ley 23/2014, de reconocimiento mutuo de resoluciones penales en la UE',
    boeCode: 'BOE-A-2014-12029',
    category: 'tributario',
    priority: 'low',
    enabled: true,
  },

  // ─── LABORAL ──────────────────────────────────────────────────────
  {
    leyNombre: 'LGSS',
    slug: 'ley-general-seguridad-social',
    shortName: 'LGSS',
    fullName: 'Ley General de la Seguridad Social',
    officialRef: 'RDL 8/2015, Ley General de la Seguridad Social',
    boeCode: 'BOE-A-2015-11724',
    category: 'laboral',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'PRL',
    slug: 'ley-prevencion-riesgos-laborales',
    shortName: 'LPRL',
    fullName: 'Ley de Prevencion de Riesgos Laborales',
    officialRef: 'Ley 31/1995, de Prevencion de Riesgos Laborales',
    boeCode: 'BOE-A-1995-24292',
    category: 'laboral',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LSV',
    slug: 'ley-trafico-seguridad-vial',
    shortName: 'LSV',
    fullName: 'Ley sobre Trafico, Circulacion de Vehiculos a Motor y Seguridad Vial',
    officialRef: 'RDL 6/2015, Ley sobre Trafico, Circulacion de Vehiculos a Motor y Seguridad Vial',
    boeCode: 'BOE-A-2015-11722',
    category: 'laboral',
    priority: 'medium',
    enabled: true,
  },

  // ─── SEGURIDAD ────────────────────────────────────────────────────
  {
    leyNombre: 'FCSE',
    slug: 'ley-fuerzas-cuerpos-seguridad',
    shortName: 'LOFCS',
    fullName: 'Ley Organica de Fuerzas y Cuerpos de Seguridad',
    officialRef: 'LO 2/1986, de Fuerzas y Cuerpos de Seguridad',
    boeCode: 'BOE-A-1986-6859',
    category: 'seguridad',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'SEG_CIUDADANA',
    slug: 'ley-seguridad-ciudadana',
    shortName: 'LOPSC',
    fullName: 'Ley Organica de proteccion de la seguridad ciudadana',
    officialRef: 'LO 4/2015, de proteccion de la seguridad ciudadana',
    boeCode: 'BOE-A-2015-3442',
    category: 'seguridad',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'SEG_PRIVADA',
    slug: 'ley-seguridad-privada',
    shortName: 'Ley de Seguridad Privada',
    fullName: 'Ley de Seguridad Privada',
    officialRef: 'Ley 5/2014, de Seguridad Privada',
    boeCode: 'BOE-A-2014-3649',
    category: 'seguridad',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'DERECHO_REUNION',
    slug: 'ley-organica-derecho-reunion',
    shortName: 'LO Derecho de Reunion',
    fullName: 'Ley Organica reguladora del derecho de reunion',
    officialRef: 'LO 9/1983, reguladora del derecho de reunion',
    boeCode: 'BOE-A-1983-19946',
    category: 'seguridad',
    priority: 'low',
    enabled: true,
  },

  // ─── POSTAL ───────────────────────────────────────────────────────
  {
    leyNombre: 'LEY_POSTAL',
    slug: 'ley-servicio-postal-universal',
    shortName: 'Ley Postal',
    fullName: 'Ley del servicio postal universal, de los derechos de los usuarios y del mercado postal',
    officialRef: 'Ley 43/2010, del servicio postal universal',
    boeCode: 'BOE-A-2010-20139',
    category: 'postal',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'REGLAMENTO_POSTAL',
    slug: 'reglamento-servicios-postales',
    shortName: 'Reglamento Postal',
    fullName: 'Reglamento de prestacion de servicios postales',
    officialRef: 'RD 437/2024, Reglamento de prestacion de servicios postales',
    boeCode: 'BOE-A-2024-10010',
    category: 'postal',
    priority: 'low',
    enabled: true,
  },

  // ─── AUTONOMICO ───────────────────────────────────────────────────
  {
    leyNombre: 'LEY_SEG_EUSKADI',
    slug: 'ley-seguridad-publica-euskadi',
    shortName: 'Ley Seguridad Euskadi',
    fullName: 'Ley de Ordenacion del Sistema de Seguridad Publica de Euskadi',
    officialRef: 'Ley 15/2012, Ordenacion del Sistema de Seguridad Publica de Euskadi',
    boeCode: 'BOE-A-2012-9665',
    category: 'autonomico',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'DL_POLICIA_PV',
    slug: 'ley-policia-pais-vasco',
    shortName: 'Ley de Policia del PV',
    fullName: 'Texto refundido de la Ley de Policia del Pais Vasco',
    officialRef: 'DL 1/2020, texto refundido Ley de Policia del Pais Vasco',
    boeCode: 'BOE-A-2020-9740',
    category: 'autonomico',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'DL_IGUALDAD_CAV',
    slug: 'ley-igualdad-comunidad-autonoma-vasca',
    shortName: 'Ley Igualdad CAV',
    fullName: 'Texto refundido de la Ley para la igualdad de mujeres y hombres de la CAV',
    officialRef: 'DL 1/2023, texto refundido igualdad CAV',
    boeCode: 'BOE-A-2023-9168',
    category: 'autonomico',
    priority: 'low',
    enabled: true,
  },
  {
    leyNombre: 'D_VIDEOCAMARAS',
    slug: 'decreto-videocamaras-pais-vasco',
    shortName: 'Decreto Videocamaras PV',
    fullName: 'Decreto de regimen de autorizacion para videocamaras en el Pais Vasco',
    officialRef: 'Decreto 168/1998, regimen de autorizacion para videocamaras en PV',
    boeCode: 'BOPV-1998-003495',
    category: 'autonomico',
    priority: 'low',
    enabled: true,
  },
  {
    leyNombre: 'D_COORDINACION',
    slug: 'decreto-coordinacion-policial-pais-vasco',
    shortName: 'Decreto Coordinacion Policial PV',
    fullName: 'Decreto de composicion y regimen de funcionamiento de la coordinacion policial del Pais Vasco',
    officialRef: 'Decreto 57/2015, composicion y regimen de funcionamiento coordinacion policial PV',
    boeCode: 'BOPV-2015-002023',
    category: 'autonomico',
    priority: 'low',
    enabled: true,
  },

  // ─── DERECHOS ─────────────────────────────────────────────────────
  {
    leyNombre: 'LOPDGDD',
    slug: 'ley-proteccion-datos',
    shortName: 'LOPDGDD',
    fullName: 'Ley Organica de Proteccion de Datos Personales y garantia de los derechos digitales',
    officialRef: 'LO 3/2018, de Proteccion de Datos Personales',
    boeCode: 'BOE-A-2018-16673',
    category: 'derechos',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LOIGUALDAD',
    slug: 'ley-igualdad-efectiva-mujeres-hombres',
    shortName: 'LOI',
    fullName: 'Ley Organica para la igualdad efectiva de mujeres y hombres',
    officialRef: 'LO 3/2007, para la igualdad efectiva de mujeres y hombres',
    boeCode: 'BOE-A-2007-6115',
    category: 'derechos',
    priority: 'high',
    enabled: true,
  },
  {
    leyNombre: 'LGTBI',
    slug: 'ley-igualdad-trans-lgtbi',
    shortName: 'Ley LGTBI',
    fullName: 'Ley para la igualdad real y efectiva de las personas trans y LGTBI',
    officialRef: 'Ley 4/2023, para la igualdad real y efectiva de las personas trans y LGTBI',
    boeCode: 'BOE-A-2023-5366',
    category: 'derechos',
    priority: 'medium',
    enabled: true,
  },
  {
    leyNombre: 'LOEX',
    slug: 'ley-extranjeria',
    shortName: 'LOEX',
    fullName: 'Ley Organica sobre derechos y libertades de los extranjeros en España',
    officialRef: 'LO 4/2000, sobre derechos y libertades de los extranjeros',
    boeCode: 'BOE-A-2000-544',
    category: 'derechos',
    priority: 'medium',
    enabled: true,
  },

  // ─── DISABLED ─────────────────────────────────────────────────────
  {
    leyNombre: 'LOVIGEN',
    slug: 'ley-violencia-genero',
    shortName: 'LOVIGEN',
    fullName: 'Ley Organica de Medidas de Proteccion Integral contra la Violencia de Genero',
    officialRef: 'LO 1/2004, de Medidas de Proteccion Integral contra la Violencia de Genero',
    boeCode: '',
    category: 'derechos',
    priority: 'medium',
    enabled: false, // Partial file — incomplete law data
  },
  {
    leyNombre: 'LOEX',
    slug: 'ley-extranjeria-duplicate',
    shortName: 'LOEX (extranjeria)',
    fullName: 'Ley Organica sobre derechos y libertades de los extranjeros en España',
    officialRef: 'LO 4/2000, sobre derechos y libertades de los extranjeros',
    boeCode: 'BOE-A-2000-544',
    category: 'derechos',
    priority: 'medium',
    enabled: false, // Duplicate — lo_4_2000_extranjeria.json, use LOEX entry instead
  },
]

// ─── Lookup helpers (index-based for O(1)) ──────────────────────────

const bySlug = new Map<string, LeyEntry>()
const byNombre = new Map<string, LeyEntry>()
for (const entry of LEY_REGISTRY) {
  if (entry.enabled) {
    bySlug.set(entry.slug, entry)
    byNombre.set(entry.leyNombre, entry)
  }
}

export function getLeyBySlug(slug: string): LeyEntry | undefined {
  return bySlug.get(slug)
}

export function getLeyByNombre(nombre: string): LeyEntry | undefined {
  return byNombre.get(nombre)
}

export function getEnabledLaws(): LeyEntry[] {
  return LEY_REGISTRY.filter(l => l.enabled)
}

export function getHighPriorityLaws(): LeyEntry[] {
  return LEY_REGISTRY.filter(l => l.enabled && l.priority === 'high')
}

export function getLawsByCategory(category: LawCategory): LeyEntry[] {
  return LEY_REGISTRY.filter(l => l.enabled && l.category === category)
}

export function getAllSlugs(): string[] {
  return LEY_REGISTRY.filter(l => l.enabled).map(l => l.slug)
}
