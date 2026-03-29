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

  // Default: AGE (INAP)
  return {
    organismo: 'INAP',
    simulacroLabel: 'Simulacro Oficial INAP',
    badgeLabel: 'INAP Oficial',
    tribunalDe: 'del INAP',
  }
}
