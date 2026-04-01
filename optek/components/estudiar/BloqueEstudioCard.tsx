'use client'

/**
 * components/estudiar/BloqueEstudioCard.tsx
 *
 * Individual study block: shows content if generated, or a generate button.
 * Includes "Profundizar" button per section.
 */

import { useState, useCallback } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Loader2, Lock, Search, Sparkles } from 'lucide-react'
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
  const [showPaywall, setShowPaywall] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90_000) // 90s timeout

      const res = await fetch('/api/estudiar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ley: bloque.ley, rango: bloque.rango }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 402) {
          setShowPaywall(true)
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
      if (!data.contenido) {
        toast.error('Error', { description: 'El resumen se generó vacío. Inténtalo de nuevo.' })
        return
      }
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
              setShowPaywall(true)
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
            {generado ? '✓ Disponible' : generating ? 'Generando (~30s)...' : 'Generar'}
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

      {/* Paywall modal — centrado, llamativo */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPaywall(false)}>
          <div className="bg-background rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Material de estudio Premium</h3>
            <p className="text-sm text-muted-foreground">
              Los resúmenes didácticos te ayudan a preparar cada tema antes de hacer tests.
              Generados por IA, con mnemotécnicas, trampas frecuentes y artículos clave.
            </p>
            <div className="space-y-2 pt-2">
              <a
                href="/precios"
                className="block w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ver planes y precios
              </a>
              <button
                onClick={() => setShowPaywall(false)}
                className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
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
