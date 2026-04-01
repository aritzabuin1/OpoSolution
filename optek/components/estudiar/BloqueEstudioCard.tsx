'use client'

/**
 * components/estudiar/BloqueEstudioCard.tsx
 *
 * Individual study block: shows content if generated, or a generate button.
 * Includes "Profundizar" button per section.
 */

import { useState, useCallback } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Loader2, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProfundizarDrawer } from './ProfundizarDrawer'

interface BloqueData {
  ley: string
  rango: string
  titulo: string
  tituloCompleto: string
  generado: boolean
  contenido?: string
  articulosCount: number
  tipo: 'legislacion' | 'conocimiento_tecnico'
}

interface Props {
  bloque: BloqueData
  temaId: string
  isPremium: boolean
}

export function BloqueEstudioCard({ bloque, temaId, isPremium }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [contenido, setContenido] = useState(bloque.contenido ?? '')
  const [generado, setGenerado] = useState(bloque.generado)
  const [generating, setGenerating] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerArticulo, setDrawerArticulo] = useState('')

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)

    try {
      const res = await fetch('/api/estudiar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ley: bloque.ley, rango: bloque.rango }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 402) {
          toast.error('Función premium', {
            description: 'Desbloquea el pack para generar resúmenes de estudio.',
          })
        } else if (res.status === 429) {
          toast.error('Límite alcanzado', {
            description: data?.error ?? 'Has alcanzado el límite de generaciones por hoy.',
          })
        } else {
          toast.error('Error', { description: data?.error ?? 'No se pudo generar el resumen.' })
        }
        return
      }

      const data = await res.json()
      setContenido(data.contenido)
      setGenerado(true)
      setExpanded(true)
      toast.success('Resumen generado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setGenerating(false)
    }
  }, [bloque.ley, bloque.rango, generating])

  const openProfundizar = (articuloRef: string) => {
    setDrawerArticulo(articuloRef)
    setDrawerOpen(true)
  }

  return (
    <>
      <div className="rounded-md border bg-background">
        <button
          onClick={() => {
            if (generado) {
              setExpanded(!expanded)
            } else if (isPremium) {
              handleGenerate()
            } else {
              toast.error('Función premium', {
                description: 'Desbloquea el pack para generar resúmenes de estudio.',
              })
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
        >
          {generado ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )
          ) : generating ? (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}

          <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          <span className="flex-1 text-sm">
            {bloque.tituloCompleto}
          </span>

          <span className={cn(
            'text-xs shrink-0',
            generado ? 'text-green-600' : 'text-muted-foreground'
          )}>
            {generado ? '✓ Disponible' : generating ? 'Generando...' : 'Generar'}
          </span>
        </button>

        {/* Expanded content */}
        {expanded && generado && contenido && (
          <div className="border-t px-4 py-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:text-base prose-headings:mt-4 prose-headings:mb-2
                prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(contenido) }}
            />

            {/* Profundizar CTA — only for legislacion blocks */}
            {bloque.tipo === 'legislacion' && (
              <div className="mt-4 pt-3 border-t">
                <button
                  onClick={() => openProfundizar('')}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Search className="h-3 w-3" />
                  Profundizar en un artículo concreto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profundizar drawer */}
      {drawerOpen && (
        <ProfundizarDrawer
          ley={bloque.ley}
          defaultArticulo={drawerArticulo}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}

/**
 * Simple markdown → HTML for prose rendering.
 * Handles: headers, bold, italic, lists, code blocks.
 * NOT a full parser — for display of AI-generated study content.
 */
function markdownToHtml(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    // Remove duplicate <ul> wrapping
    .replace(/<\/ul>\s*<ul>/g, '')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks for paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Clean empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>(<h[1-4]>)/g, '$1')
    .replace(/(<\/h[1-4]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<pre>)/g, '$1')
    .replace(/(<\/pre>)<\/p>/g, '$1')
}
