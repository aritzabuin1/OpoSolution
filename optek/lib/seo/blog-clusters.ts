/**
 * lib/seo/blog-clusters.ts
 *
 * Clasifica cada blog post en una "oposición" (cluster temático) y permite
 * recuperar siblings del mismo cluster para enlazado interno automático.
 *
 * Por qué:
 *   Google premia páginas con autoridad temática. Sin internal linking,
 *   el PageRank se diluye y los posts huérfanos no rankean. Este módulo
 *   evita editar 162 posts a mano: clasifica por slug y renderiza siblings
 *   al final de cada artículo.
 *
 * Fuente de verdad:
 *   - Las 8 oposiciones con archivo `posts-{op}.ts` exportan su array
 *     ya etiquetado (cada slug pertenece a su cluster por construcción).
 *   - El resto (corePosts en posts.ts: auxiliar C2, admin C1, GACE, correos,
 *     justicia mixto, transversal) se clasifica por substring del slug.
 */

import type { BlogPost } from '@/content/blog/posts'
import { auxilioJudicialPosts } from '@/content/blog/posts-auxilio-judicial'
import { ertzaintzaPosts } from '@/content/blog/posts-ertzaintza'
import { gestionProcesalPosts } from '@/content/blog/posts-gestion-procesal'
import { guardiaCivilPosts } from '@/content/blog/posts-guardia-civil'
import { haciendaPosts } from '@/content/blog/posts-hacienda'
import { penitenciariasPosts } from '@/content/blog/posts-penitenciarias'
import { policiaNacionalPosts } from '@/content/blog/posts-policia-nacional'
import { tramitacionProcesalPosts } from '@/content/blog/posts-tramitacion-procesal'
import { blogPosts } from '@/content/blog/posts'

export type ClusterId =
  | 'auxiliar-c2'
  | 'administrativo-c1'
  | 'gace-a2'
  | 'correos'
  | 'auxilio-judicial'
  | 'tramitacion-procesal'
  | 'gestion-procesal'
  | 'hacienda'
  | 'penitenciarias'
  | 'guardia-civil'
  | 'policia-nacional'
  | 'ertzaintza'
  | 'transversal'

export const CLUSTER_LABELS: Record<ClusterId, string> = {
  'auxiliar-c2': 'Auxiliar Administrativo C2',
  'administrativo-c1': 'Administrativo C1',
  'gace-a2': 'Gestión del Estado A2 (GACE)',
  'correos': 'Correos',
  'auxilio-judicial': 'Auxilio Judicial',
  'tramitacion-procesal': 'Tramitación Procesal',
  'gestion-procesal': 'Gestión Procesal',
  'hacienda': 'Agente de Hacienda',
  'penitenciarias': 'Instituciones Penitenciarias',
  'guardia-civil': 'Guardia Civil',
  'policia-nacional': 'Policía Nacional',
  'ertzaintza': 'Ertzaintza',
  'transversal': 'Oposiciones (transversal)',
}

export const CLUSTER_PILLAR_PATH: Record<ClusterId, string | null> = {
  'auxiliar-c2': '/oposiciones/administracion',
  'administrativo-c1': '/oposiciones/administracion',
  'gace-a2': '/oposiciones/administracion',
  'correos': '/oposiciones/correos',
  'auxilio-judicial': '/oposiciones/justicia/auxilio-judicial',
  'tramitacion-procesal': '/oposiciones/justicia/tramitacion-procesal',
  'gestion-procesal': '/oposiciones/justicia/gestion-procesal',
  'hacienda': '/oposiciones/hacienda',
  'penitenciarias': '/oposiciones/penitenciarias',
  'guardia-civil': '/oposiciones/seguridad/guardia-civil',
  'policia-nacional': '/oposiciones/seguridad/policia-nacional',
  'ertzaintza': '/oposiciones/seguridad/ertzaintza',
  'transversal': '/oposiciones',
}

// --- Cluster authoritativos: vienen de los archivos por oposición -------------
const FILE_CLUSTERS: Array<{ id: ClusterId; posts: BlogPost[] }> = [
  { id: 'auxilio-judicial', posts: auxilioJudicialPosts },
  { id: 'ertzaintza', posts: ertzaintzaPosts },
  { id: 'gestion-procesal', posts: gestionProcesalPosts },
  { id: 'guardia-civil', posts: guardiaCivilPosts },
  { id: 'hacienda', posts: haciendaPosts },
  { id: 'penitenciarias', posts: penitenciariasPosts },
  { id: 'policia-nacional', posts: policiaNacionalPosts },
  { id: 'tramitacion-procesal', posts: tramitacionProcesalPosts },
]

const SLUG_TO_CLUSTER = new Map<string, ClusterId>()
for (const { id, posts } of FILE_CLUSTERS) {
  for (const p of posts) SLUG_TO_CLUSTER.set(p.slug, id)
}

// --- Clasificador heurístico para slugs no-archivo (corePosts) ---------------
function classifyBySlug(slug: string): ClusterId {
  const s = slug.toLowerCase()

  // Justicia (mixto / sin archivo propio aún)
  if (/auxilio.*judicial/.test(s)) return 'auxilio-judicial'
  if (/tramitacion.*procesal/.test(s)) return 'tramitacion-procesal'
  if (/gestion.*procesal/.test(s)) return 'gestion-procesal'

  // Forces
  if (/ertzaintza/.test(s)) return 'ertzaintza'
  if (/guardia-civil/.test(s)) return 'guardia-civil'
  if (/policia-nacional|oposiciones-policia|examen-policia/.test(s)) return 'policia-nacional'
  if (/penitenciaria|prisiones/.test(s)) return 'penitenciarias'
  if (/hacienda/.test(s)) return 'hacienda'

  // AGE específicas
  if (/gace|gestion-estado|gestion-age/.test(s)) return 'gace-a2'
  if (/administrativo-(estado-)?c1|administrativo-c1/.test(s)) return 'administrativo-c1'
  if (/correos/.test(s)) return 'correos'
  if (/auxiliar-administrativo|examen-auxiliar/.test(s)) return 'auxiliar-c2'

  // Justicia genérico
  if (/justicia|cuerpo.*justicia|funcionario-justicia|trienios-funcionarios/.test(s)) {
    return 'auxilio-judicial' // pillar de justicia más buscado; el TOC del pillar enlazará a los 3
  }

  return 'transversal'
}

/** Devuelve el cluster al que pertenece un slug. */
export function getCluster(slug: string): ClusterId {
  const direct = SLUG_TO_CLUSTER.get(slug)
  if (direct) return direct
  return classifyBySlug(slug)
}

/**
 * Devuelve hasta `limit` siblings del cluster (excluyendo el slug pasado).
 * Ordenados por fecha (los más recientes primero).
 */
export function getClusterSiblings(
  slug: string,
  limit = 5,
): { slug: string; title: string; description: string; date: string; cluster: ClusterId }[] {
  const cluster = getCluster(slug)
  const siblings = blogPosts
    .filter((p) => p.slug !== slug && getCluster(p.slug) === cluster)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit)
  return siblings.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    cluster,
  }))
}

/** Devuelve TODOS los posts de un cluster (para los pillar pages). */
export function getClusterPosts(cluster: ClusterId): BlogPost[] {
  return blogPosts
    .filter((p) => getCluster(p.slug) === cluster)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** Diagnóstico: distribución de posts por cluster. */
export function clusterDistribution(): Record<ClusterId, number> {
  const counts = {} as Record<ClusterId, number>
  for (const c of Object.keys(CLUSTER_LABELS) as ClusterId[]) counts[c] = 0
  for (const p of blogPosts) counts[getCluster(p.slug)]++
  return counts
}
