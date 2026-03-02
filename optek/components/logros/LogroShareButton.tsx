'use client'

/**
 * components/logros/LogroShareButton.tsx — §2.16.9B
 *
 * Botón de compartir logro desbloqueado.
 * Usa Web Share API si disponible (móvil), clipboard como fallback.
 *
 * OG image URL: /api/og?tipo=logro&logro_nombre=[nombre]&nombre=[usuario]
 *
 * Por qué compartir logros > compartir scores (Antigravity):
 * Las personas comparten hitos de identidad ("soy alguien que progresa"),
 * no métricas de rendimiento (que generan comparación y vergüenza).
 */

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogroShareButtonProps {
  logroTitulo: string
  logroEmoji: string
  userName?: string
}

export function LogroShareButton({ logroTitulo, logroEmoji, userName }: LogroShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

  const ogParams = new URLSearchParams({
    tipo: 'logro',
    logro_nombre: logroTitulo,
    ...(userName ? { nombre: userName } : {}),
  })
  const ogImageUrl = `${appUrl}/api/og?${ogParams.toString()}`
  const shareUrl = `${appUrl}/logros`

  const shareText =
    `${logroEmoji} He conseguido el logro "${logroTitulo}" preparando mis oposiciones con OpoRuta.\n` +
    `Prepara el TAC con IA verificada: ${shareUrl}`

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${logroEmoji} ${logroTitulo} — OpoRuta`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // usuario canceló o no soportado — caer al fallback
      }
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nImagen: ${ogImageUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(waUrl, '_blank', 'noopener')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground mt-1"
      onClick={handleShare}
      aria-label={`Compartir logro ${logroTitulo}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">¡Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3 w-3" />
          Compartir
        </>
      )}
    </Button>
  )
}
