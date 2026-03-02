'use client'

/**
 * components/shared/ShareButton.tsx — §Idea B (viral loop), §2.16.8
 *
 * Botón de compartir resultado de test o sesión de Caza-Trampas.
 * Usa Web Share API si el navegador la soporta (móvil/Android/iOS).
 * Fallback: copia el enlace al portapapeles y muestra confirmación.
 *
 * testId: para tests/simulacros (construye URL /tests/[id]/resultados)
 * resultUrl: override de URL (para cazatrampas y otros sin página de resultado)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
  score: number
  tema: string
  nombre?: string
  tipo?: 'test' | 'simulacro' | 'cazatrampas'
  testId?: string
  resultUrl?: string
}

export function ShareButton({ score, tema, nombre, tipo = 'test', testId, resultUrl: resultUrlProp }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

  // URL de la imagen OG
  const ogParams = new URLSearchParams({
    score: String(score),
    tema,
    ...(nombre ? { nombre } : {}),
    tipo,
  })
  const ogImageUrl = `${appUrl}/api/og?${ogParams.toString()}`

  // URL del resultado — override > testId path > app root
  const resultUrl =
    resultUrlProp ??
    (testId ? `${appUrl}/tests/${testId}/resultados` : appUrl)

  const tipoLabel =
    tipo === 'simulacro' ? 'Simulacro Oficial INAP' :
    tipo === 'cazatrampas' ? 'Caza-Trampas' :
    'test'

  const shareText =
    `He sacado ${score}% en ${tema ? `"${tema}"` : `un ${tipoLabel}`} en OpoRuta 🎯\n` +
    `Prepara tus oposiciones con IA verificada: ${resultUrl}`

  async function handleShare() {
    // Web Share API — soportada en móvil y Chrome/Edge en escritorio
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${score}% en OpoRuta — ${tema || tipoLabel}`,
          text: shareText,
          url: resultUrl,
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
      // Último recurso: abrir WhatsApp Web
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(waUrl, '_blank', 'noopener')
    }
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleShare}
      aria-label="Compartir resultado"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-600">¡Copiado!</span>
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
