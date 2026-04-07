/**
 * components/seo/ArticleText.tsx — Renderiza texto legal con formato
 *
 * Server Component. Parsea texto_integro y lo renderiza con:
 * - Párrafos separados por saltos de línea
 * - Listas numeradas (1., 2., 3.)
 * - Sublistas con letras (a), b), c))
 * - Soporte multi-provisión (múltiples secciones del mismo artículo)
 */

import type { ArticuloRow } from '@/lib/seo/law-queries'

interface ArticleTextProps {
  provisions: ArticuloRow[]
}

export function ArticleText({ provisions }: ArticleTextProps) {
  if (provisions.length === 0) return null

  const isMulti = provisions.length > 1

  return (
    <div className="space-y-8">
      {isMulti && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">
            Este artículo aparece en {provisions.length} secciones de la ley:
          </p>
          <ul className="mt-2 space-y-1">
            {provisions.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500">▸</span>
                <span>{extractSectionName(p.titulo_capitulo)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {provisions.map((provision, idx) => (
        <div key={idx}>
          {isMulti && (
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {extractSectionName(provision.titulo_capitulo)}
            </h3>
          )}
          <div className="prose prose-gray max-w-none text-gray-700">
            {renderTexto(provision.texto_integro)}
          </div>
        </div>
      ))}
    </div>
  )
}

function extractSectionName(tituloCapitulo: string | null): string {
  if (!tituloCapitulo) return 'Sección principal'
  // Take the most specific part (last segment after | or —)
  const parts = tituloCapitulo.split(/[|—]/).map(s => s.trim()).filter(Boolean)
  return parts[parts.length - 1] || tituloCapitulo
}

function renderTexto(texto: string) {
  if (!texto) return null

  const lines = texto.split('\n').filter(l => l.trim())
  const elements: React.ReactNode[] = []
  let currentList: string[] = []
  let listType: 'number' | 'letter' | null = null

  function flushList() {
    if (currentList.length === 0) return
    const Tag = listType === 'number' ? 'ol' : 'ul'
    const className = listType === 'number'
      ? 'list-decimal pl-6 space-y-2'
      : 'list-[lower-alpha] pl-6 space-y-1'
    elements.push(
      <Tag key={`list-${elements.length}`} className={className}>
        {currentList.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </Tag>
    )
    currentList = []
    listType = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Numbered list item: "1. text", "2. text", etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      if (listType !== 'number') flushList()
      listType = 'number'
      currentList.push(numMatch[2])
      continue
    }

    // Letter list item: "a) text", "b) text", etc.
    const letterMatch = trimmed.match(/^([a-zñ])\)\s*(.+)/i)
    if (letterMatch) {
      if (listType !== 'letter') flushList()
      listType = 'letter'
      currentList.push(letterMatch[2])
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={`p-${elements.length}`}>{trimmed}</p>
    )
  }

  flushList()

  return elements
}
