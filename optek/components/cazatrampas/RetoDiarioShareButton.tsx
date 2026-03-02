'use client'

/**
 * components/cazatrampas/RetoDiarioShareButton.tsx — §2.20.8
 *
 * Genera texto de compartición estilo Wordle para el Reto Diario.
 * Web Share API en móvil, clipboard en desktop.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface RetoDiarioShareButtonProps {
  fecha: string          // 'YYYY-MM-DD'
  aciertos: number
  total: number
  puntuacion: number
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

export function RetoDiarioShareButton({
  fecha,
  aciertos,
  total,
  puntuacion,
  userName,
}: RetoDiarioShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

  const shareText = [
    `Reto OpoRuta — ${formatFecha(fecha)}`,
    `🎯 ${aciertos}/${total} trampas encontradas (${Math.round(puntuacion)}%)`,
    generarGrid(aciertos, total),
    `${appUrl}/reto-diario`,
    userName ? `Preparando el TAC con @OpoRuta` : 'Preparando el TAC con OpoRuta',
  ].join('\n')

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Reto OpoRuta — ${formatFecha(fecha)}`,
          text: shareText,
          url: `${appUrl}/reto-diario`,
        })
        return
      } catch {
        // Fallback a clipboard si el usuario cancela o hay error
      }
    }

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback final: seleccionar texto
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="gap-2"
      aria-label="Compartir resultado del reto"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Compartir resultado
        </>
      )}
    </Button>
  )
}
