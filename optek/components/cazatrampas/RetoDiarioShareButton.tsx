'use client'

/**
 * components/cazatrampas/RetoDiarioShareButton.tsx — §2.20.8
 *
 * Botones de compartición por canal para el Reto Diario.
 * Cada canal (WhatsApp, X, Email, Copiar) formatea el contenido
 * de forma óptima para ese medio — sin depender de Web Share API.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, Mail } from 'lucide-react'

interface RetoDiarioShareButtonProps {
  fecha: string          // 'YYYY-MM-DD'
  aciertos: number
  total: number
  puntuacion: number
  leyNombre?: string
  userName?: string
}

function generarGrid(aciertos: number, total: number): string {
  const cuadrados = []
  for (let i = 0; i < total; i++) {
    cuadrados.push(i < aciertos ? '🟩' : '⬛')
  }
  return cuadrados.join('')
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getEmoji(puntuacion: number): string {
  if (puntuacion === 100) return '🏆'
  if (puntuacion >= 66) return '🎯'
  if (puntuacion >= 33) return '💪'
  return '📚'
}

// WhatsApp icon inline SVG (no dependency needed)
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function RetoDiarioShareButton({
  fecha,
  aciertos,
  total,
  puntuacion,
  leyNombre,
  userName,
}: RetoDiarioShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
  const retoUrl = `${appUrl}/reto-diario`
  const fechaFmt = formatFecha(fecha)
  const emoji = getEmoji(puntuacion)
  const grid = generarGrid(aciertos, total)
  const pctStr = `${Math.round(puntuacion)}%`

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const text = [
      `${emoji} Reto OpoRuta — ${fechaFmt}`,
      '',
      `${aciertos}/${total} trampas encontradas (${pctStr})`,
      grid,
      leyNombre ? `Ley: ${leyNombre}` : '',
      '',
      `Prueba el reto de hoy: ${retoUrl}`,
      userName ? `— ${userName} con OpoRuta` : '— OpoRuta: El camino mas corto hacia el aprobado',
    ].filter(Boolean).join('\n')

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  // ── X (Twitter) ───────────────────────────────────────────────────────────
  const handleTwitter = () => {
    const text = [
      `${emoji} Reto OpoRuta ${fechaFmt}`,
      `${aciertos}/${total} trampas encontradas ${grid}`,
      leyNombre ? `(${leyNombre})` : '',
      `Prueba el reto de hoy:`,
    ].filter(Boolean).join('\n')

    const params = new URLSearchParams({ text, url: retoUrl })
    window.open(`https://twitter.com/intent/tweet?${params.toString()}`, '_blank', 'noopener')
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  const handleEmail = () => {
    const subject = `${emoji} Reto OpoRuta ${fechaFmt} — ${aciertos}/${total} trampas (${pctStr})`
    const body = [
      `He completado el Reto Diario de OpoRuta del ${fechaFmt}.`,
      '',
      `Resultado: ${aciertos}/${total} trampas encontradas (${pctStr})`,
      grid,
      '',
      leyNombre ? `Ley del reto: ${leyNombre}` : '',
      '',
      `OpoRuta es una plataforma de entrenamiento con IA para opositores al cuerpo de Auxiliar Administrativo del Estado (C2).`,
      '',
      `Prueba el reto de hoy: ${retoUrl}`,
      '',
      '---',
      'OpoRuta — El camino mas corto hacia el aprobado',
      appUrl,
    ].filter(Boolean).join('\n')

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  // ── Copiar ────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    const text = [
      `${emoji} Reto OpoRuta — ${fechaFmt}`,
      `${aciertos}/${total} trampas encontradas (${pctStr})`,
      grid,
      leyNombre ? `Ley: ${leyNombre}` : '',
      '',
      `Prueba el reto de hoy: ${retoUrl}`,
      'OpoRuta — El camino mas corto hacia el aprobado',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-center text-muted-foreground font-medium">Compartir resultado</p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsApp}
          className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
          aria-label="Compartir por WhatsApp"
        >
          <WhatsAppIcon className="h-4 w-4" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitter}
          className="gap-1.5"
          aria-label="Compartir en X"
        >
          <XIcon className="h-3.5 w-3.5" />
          X
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleEmail}
          className="gap-1.5"
          aria-label="Compartir por email"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
          aria-label="Copiar al portapapeles"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
