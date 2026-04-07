/**
 * lib/seo/slugify.ts — Utilidades de slugificación para pSEO de legislación
 *
 * Genera slugs deterministas y sin colisiones para artículos y leyes.
 */

/**
 * Convierte un número de artículo en slug URL-safe.
 *
 * "14"            → "articulo-14"
 * "14 bis"        → "articulo-14-bis"
 * "163 quinquies" → "articulo-163-quinquies"
 * "DA-primera"    → "da-primera"
 * "DT-única"      → "dt-unica"
 * "DF-primera."   → "df-primera"
 */
export function slugifyArticulo(numero: string): string {
  const cleaned = numero
    .trim()
    .replace(/\.+$/, '') // trim trailing dots
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '-')    // non-alphanumeric → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '')          // trim leading/trailing hyphens

  // Disposiciones (DA, DT, DF, DU, DD) already start with "d*-" after cleaning
  const isDisposicion = /^d[aftud]-/.test(cleaned)
  if (isDisposicion) return cleaned

  return `articulo-${cleaned}`
}

/**
 * Extrae un título limpio de `titulo_articulo` para uso en metadata SEO.
 *
 * "Artículo 14. Igualdad ante la ley" → "Igualdad ante la ley"
 * "Artículo 205. 1, a partir de..." → "" (fallback: título vacío)
 * "Disposición adicional primera."  → "Disposición adicional primera"
 */
export function extractCleanTitle(tituloArticulo: string): string {
  if (!tituloArticulo) return ''

  // Remove trailing dots
  let title = tituloArticulo.trim().replace(/\.+$/, '')

  // Pattern: "Artículo N. Title" or "Artículo N Title"
  const artMatch = title.match(/^Art[ií]culo\s+\S+\.\s*(.+)$/i)
  if (artMatch) {
    const candidate = artMatch[1].trim()
    // If the extracted title looks like a fragment (starts with digit, lowercase, or is very long),
    // it's likely not a real title
    if (candidate.length > 100 || /^[0-9a-záéíóú,]/.test(candidate)) {
      return ''
    }
    return candidate
  }

  // Pattern: "Disposición adicional/transitoria/final/derogatoria primera/segunda/..."
  if (/^Disposici[oó]n/i.test(title)) {
    return title
  }

  return ''
}

/**
 * Genera un slug URL-safe desde un texto libre (para nombres de ley).
 *
 * "Constitución Española de 1978" → "constitucion-espanola-de-1978"
 */
export function slugifyText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
