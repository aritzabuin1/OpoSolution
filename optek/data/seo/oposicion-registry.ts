/**
 * data/seo/oposicion-registry.ts — PlanSEO F1.T3
 *
 * Registry estático de oposiciones (UUID → metadatos). Se usa en componentes
 * server-side que renderizan badges con el nombre de la oposición a partir
 * del `oposicion_id` almacenado en BD.
 *
 * Mantener sincronizado con la tabla `oposiciones` de Supabase.
 * Última actualización: 2026-04-19.
 */

export interface OposicionRegistryEntry {
  id: string
  nombre: string
  slug: string
  /** Nombre corto para badges compactos (UI). */
  shortName: string
  /** Path público de la oposición (link). */
  path: string
}

const ENTRIES: OposicionRegistryEntry[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', nombre: 'Auxiliar Administrativo del Estado', shortName: 'Auxiliar C2', slug: 'aux-admin-estado', path: '/oposiciones/administracion' },
  { id: 'b0000000-0000-0000-0000-000000000001', nombre: 'Administrativo del Estado', shortName: 'Administrativo C1', slug: 'administrativo-estado', path: '/oposiciones/administracion' },
  { id: 'c2000000-0000-0000-0000-000000000001', nombre: 'Gestión de la Administración Civil del Estado', shortName: 'GACE A2', slug: 'gestion-estado', path: '/oposiciones/administracion' },
  { id: 'd0000000-0000-0000-0000-000000000001', nombre: 'Correos — Personal Laboral Fijo', shortName: 'Correos', slug: 'correos', path: '/oposiciones/correos' },
  { id: 'e0000000-0000-0000-0000-000000000001', nombre: 'Auxilio Judicial (C2)', shortName: 'Auxilio Judicial', slug: 'auxilio-judicial', path: '/oposiciones/justicia/auxilio-judicial' },
  { id: 'e1000000-0000-0000-0000-000000000001', nombre: 'Tramitación Procesal (C1)', shortName: 'Tramitación', slug: 'tramitacion-procesal', path: '/oposiciones/justicia/tramitacion-procesal' },
  { id: 'e2000000-0000-0000-0000-000000000001', nombre: 'Gestión Procesal (A2)', shortName: 'Gestión Procesal', slug: 'gestion-procesal', path: '/oposiciones/justicia/gestion-procesal' },
  { id: 'f0000000-0000-0000-0000-000000000001', nombre: 'Agente de Hacienda Pública (C1)', shortName: 'Hacienda', slug: 'hacienda-aeat', path: '/oposiciones/hacienda' },
  { id: 'f1000000-0000-0000-0000-000000000001', nombre: 'Ayudante Instituciones Penitenciarias', shortName: 'Penitenciarias', slug: 'penitenciarias', path: '/oposiciones/penitenciarias' },
  { id: 'ac000000-0000-0000-0000-000000000001', nombre: 'Guardia Civil — Cabos y Guardias', shortName: 'Guardia Civil', slug: 'guardia-civil', path: '/oposiciones/seguridad/guardia-civil' },
  { id: 'ad000000-0000-0000-0000-000000000001', nombre: 'Policía Nacional — Escala Básica', shortName: 'Policía Nacional', slug: 'policia-nacional', path: '/oposiciones/seguridad/policia-nacional' },
  { id: 'ab000000-0000-0000-0000-000000000001', nombre: 'Agente de la Ertzaintza', shortName: 'Ertzaintza', slug: 'ertzaintza', path: '/oposiciones/seguridad/ertzaintza' },
]

const BY_ID = new Map<string, OposicionRegistryEntry>(ENTRIES.map(e => [e.id, e]))

export function getOposicionById(id: string): OposicionRegistryEntry | undefined {
  return BY_ID.get(id)
}

export const ALL_OPOSICIONES: readonly OposicionRegistryEntry[] = ENTRIES
