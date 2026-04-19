/**
 * lib/seo/blog-autolinker.ts — PlanSEO F2.T3
 *
 * Auto-linker controlado de referencias a artículos de ley dentro de HTML
 * de posts del blog. Detecta patrones como "art. 14 CE" o "artículo 103
 * LRJSP" y los convierte en <a href="/ley/{slug}/articulo-{num}"> cuando
 * el artículo es indexable.
 *
 * Reglas:
 *  - No toca texto dentro de <a>, <code>, <pre>.
 *  - Sólo la primera aparición de cada (ley, artículo) por post.
 *  - Máximo MAX_LINKS_PER_POST para no saturar.
 *  - Funciona sobre HTML "plano" (p/ul/li/h2/strong) — no necesita parser DOM.
 */

import { LEY_REGISTRY } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { isArticleIndexable } from '@/lib/seo/indexability'

const MAX_LINKS_PER_POST = 12

/** Mapa alias (lowercase) → leyNombre canónico. */
const ALIAS_TO_LEY: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const ley of LEY_REGISTRY) {
    if (!ley.enabled) continue
    map[ley.shortName.toLowerCase()] = ley.leyNombre
    map[ley.leyNombre.toLowerCase()] = ley.leyNombre
  }
  // Alias comunes por nombre largo frecuente en copy.
  map['constitución'] = 'CE'
  map['constitucion'] = 'CE'
  map['constitución española'] = 'CE'
  map['constitucion española'] = 'CE'
  return map
})()

/** Construye pattern alternativo de alias, ordenado por longitud desc. */
const ALIAS_PATTERN = Object.keys(ALIAS_TO_LEY)
  .sort((a, b) => b.length - a.length)
  .map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

/**
 * Matches:
 *  - "art. 14", "art 14", "Art. 14"
 *  - "artículo 14", "articulo 14"
 *  - opcional ".X" (apartado)
 *  - seguido de " de la <alias>" o " <alias>"
 */
const ARTICLE_REGEX = new RegExp(
  `\\b(art(?:[íi]culo|\\.?))\\s+(\\d+(?:\\.\\d+)?)(?:\\s+(?:de\\s+la\\s+|del\\s+|de\\s+))?\\s*(${ALIAS_PATTERN})\\b`,
  'gi',
)

/**
 * Convierte referencias legales en enlaces. Opera sobre un string HTML,
 * respetando tags <a>/<code>/<pre>.
 */
export function autolinkLegalReferences(html: string): string {
  if (!html || !ALIAS_PATTERN) return html

  // Segmentar HTML: entra fuera de zonas prohibidas
  const forbiddenOpen = /<(a|code|pre)\b[^>]*>/gi
  const segments: Array<{ text: string; linkable: boolean }> = []
  let lastIdx = 0
  let depth = 0
  let forbiddenTag: string | null = null

  const tagRegex = /<(\/?)(a|code|pre)\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = tagRegex.exec(html)) !== null) {
    const chunk = html.slice(lastIdx, m.index)
    segments.push({ text: chunk, linkable: depth === 0 })
    segments.push({ text: m[0], linkable: false })
    const isClosing = m[1] === '/'
    const tagName = m[2].toLowerCase()
    if (isClosing) {
      if (forbiddenTag === tagName && depth > 0) {
        depth--
        if (depth === 0) forbiddenTag = null
      }
    } else {
      if (forbiddenTag === null) forbiddenTag = tagName
      if (forbiddenTag === tagName) depth++
    }
    lastIdx = m.index + m[0].length
  }
  segments.push({ text: html.slice(lastIdx), linkable: depth === 0 })

  // Aplicar auto-link sólo en segmentos linkables
  const seen = new Set<string>()
  let linksUsed = 0

  const result = segments
    .map(seg => {
      if (!seg.linkable || linksUsed >= MAX_LINKS_PER_POST) return seg.text
      return seg.text.replace(ARTICLE_REGEX, (match, _art, numero: string, alias: string) => {
        if (linksUsed >= MAX_LINKS_PER_POST) return match
        const leyNombre = ALIAS_TO_LEY[alias.toLowerCase()]
        if (!leyNombre) return match
        const artNum = numero.split('.')[0] // stripping subsección para indexabilidad
        const key = `${leyNombre}:${artNum}`
        if (seen.has(key)) return match
        if (!isArticleIndexable(leyNombre, artNum)) return match
        const ley = LEY_REGISTRY.find(l => l.leyNombre === leyNombre)
        if (!ley) return match
        seen.add(key)
        linksUsed++
        return `<a href="/ley/${ley.slug}/${slugifyArticulo(artNum)}" class="text-blue-700 hover:underline">${match}</a>`
      })
    })
    .join('')

  return result
}
