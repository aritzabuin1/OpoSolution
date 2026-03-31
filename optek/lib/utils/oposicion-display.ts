/**
 * lib/utils/oposicion-display.ts
 *
 * Maps oposición metadata to user-facing display strings.
 * Avoids hardcoding "INAP" / "MJU" / "Correos" across UI components.
 */

/** Display info derived from oposición rama/slug */
export interface OposicionDisplay {
  /** Organismo oficial: "INAP", "MJU", "Correos" */
  organismo: string
  /** Label for simulacros: "Simulacro Oficial INAP", etc. */
  simulacroLabel: string
  /** Short badge text: "INAP Oficial", "MJU Oficial", etc. */
  badgeLabel: string
  /** Full tribunal name for longer text: "del INAP", "del MJU", etc. */
  tribunalDe: string
}

/**
 * Derives display strings from the oposición's rama or slug.
 * Works with any combination of available data.
 */
export function getOposicionDisplay(opts: {
  rama?: string | null
  slug?: string | null
  nombre?: string | null
}): OposicionDisplay {
  const { rama, slug, nombre } = opts
  const lower = (slug ?? nombre ?? '').toLowerCase()

  // Justicia (MJU)
  if (
    rama === 'justicia' ||
    lower.includes('auxilio') ||
    lower.includes('tramitaci') ||
    lower.includes('gestión procesal') ||
    lower.includes('gestion procesal') ||
    lower.includes('gestion-procesal') ||
    lower.includes('tramitacion-procesal')
  ) {
    return {
      organismo: 'MJU',
      simulacroLabel: 'Simulacro Oficial MJU',
      badgeLabel: 'MJU Oficial',
      tribunalDe: 'del MJU',
    }
  }

  // Correos
  if (rama === 'correos' || lower.includes('correos')) {
    return {
      organismo: 'Correos',
      simulacroLabel: 'Simulacro Oficial Correos',
      badgeLabel: 'Correos Oficial',
      tribunalDe: 'de Correos',
    }
  }

  // Hacienda (AEAT)
  if (rama === 'hacienda' || lower.includes('hacienda') || lower.includes('aeat')) {
    return {
      organismo: 'AEAT',
      simulacroLabel: 'Simulacro Oficial AEAT',
      badgeLabel: 'AEAT Oficial',
      tribunalDe: 'de la AEAT',
    }
  }

  // Instituciones Penitenciarias (SGIP)
  if (rama === 'penitenciarias' || lower.includes('penitenciari') || lower.includes('iipp')) {
    return {
      organismo: 'SGIP',
      simulacroLabel: 'Simulacro Oficial IIPP',
      badgeLabel: 'IIPP Oficial',
      tribunalDe: 'de la SGIP',
    }
  }

  // Seguridad — Fuerzas y Cuerpos de Seguridad
  if (rama === 'seguridad' || lower.includes('ertzaintza')) {
    return {
      organismo: 'Dept. Seguridad GV',
      simulacroLabel: 'Simulacro Ertzaintza',
      badgeLabel: 'Ertzaintza',
      tribunalDe: 'de Seguridad del Gobierno Vasco',
    }
  }
  if (lower.includes('guardia-civil') || lower.includes('guardia civil')) {
    return {
      organismo: 'Guardia Civil',
      simulacroLabel: 'Simulacro Guardia Civil',
      badgeLabel: 'GC Oficial',
      tribunalDe: 'de la Guardia Civil',
    }
  }
  if (lower.includes('policia-nacional') || lower.includes('policia nacional') || lower.includes('policía nacional')) {
    return {
      organismo: 'DGP',
      simulacroLabel: 'Simulacro Policía Nacional',
      badgeLabel: 'PN Oficial',
      tribunalDe: 'de la DGP',
    }
  }

  // Default: AGE (INAP)
  return {
    organismo: 'INAP',
    simulacroLabel: 'Simulacro Oficial INAP',
    badgeLabel: 'INAP Oficial',
    tribunalDe: 'del INAP',
  }
}
