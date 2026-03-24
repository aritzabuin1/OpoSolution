import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface BlogCTAProps {
  variant: 'inline' | 'bottom'
  diasParaExamen?: number
}

export function BlogCTA({ variant, diasParaExamen }: BlogCTAProps) {
  if (variant === 'inline') {
    return (
      <div className="not-prose my-8 rounded-xl border-2 border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">
            Pon a prueba lo que acabas de leer
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Test gratuito de 10 preguntas con verificación BOE — sin tarjeta.
          </p>
        </div>
        <Link href="/register">
          <Button size="sm" className="gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-500 text-white">
            Hacer test gratis
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    )
  }

  // variant === 'bottom'
  return (
    <div className="not-prose mt-12 rounded-xl bg-gradient-to-br from-[#0f2b46] via-[#1a4a7a] to-[#2563eb] p-6 sm:p-8 text-center text-white">
      {diasParaExamen != null && diasParaExamen > 0 && (
        <p className="text-xl sm:text-2xl font-bold mb-1">
          Quedan {diasParaExamen} días para el examen del 23 de mayo
        </p>
      )}
      <p className="text-base sm:text-lg font-medium opacity-90">
        4.200+ plazas · Examen único · ¿Estás preparado?
      </p>
      <p className="text-sm opacity-70 mt-2 mb-5">
        Prueba OpoRuta gratis: Todos los temas · Verificación BOE · Análisis INAP
      </p>
      <Link href="/register">
        <Button
          size="lg"
          className="bg-amber-500 hover:bg-amber-400 text-[#0f2b46] font-bold shadow-lg shadow-amber-500/20"
        >
          Empieza gratis — sin tarjeta →
        </Button>
      </Link>
    </div>
  )
}

/**
 * Renders BlogCTA inline variant as HTML string for injection into blog content.
 * Used server-side only.
 */
export function getInlineCTAHtml(): string {
  return `<div class="not-prose my-8 rounded-xl border-2 border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/40 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
  <div class="flex-1">
    <p class="font-semibold text-sm text-foreground">Pon a prueba lo que acabas de leer</p>
    <p class="text-xs text-muted-foreground mt-1">Test gratuito de 10 preguntas con verificación BOE — sin tarjeta.</p>
  </div>
  <a href="/register" class="inline-flex items-center gap-1.5 shrink-0 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 transition-colors">
    Hacer test gratis →
  </a>
</div>`
}

/**
 * Injects an inline CTA before the 3rd <h2> in the HTML content.
 * If there are fewer than 3 h2 tags, returns the original HTML unchanged.
 */
export function injectMidArticleCTA(html: string): string {
  const h2Matches = [...html.matchAll(/<h2[\s>]/g)]
  if (h2Matches.length < 3 || h2Matches[2].index == null) return html

  const insertAt = h2Matches[2].index
  return html.slice(0, insertAt) + getInlineCTAHtml() + html.slice(insertAt)
}
