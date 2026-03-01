'use client'

/**
 * components/shared/FeedbackButton.tsx — §2.7.4
 *
 * Botón flotante (💬) visible en todas las páginas del dashboard.
 * Al hacer clic → modal con formulario (tipo + textarea).
 *
 * Llama a POST /api/user/feedback
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoFeedback = 'sugerencia' | 'error' | 'funcionalidad' | 'otro'

const TIPOS: { value: TipoFeedback; label: string; emoji: string }[] = [
  { value: 'error', label: 'Reportar un error', emoji: '🐛' },
  { value: 'sugerencia', label: 'Sugerencia de mejora', emoji: '💡' },
  { value: 'funcionalidad', label: 'Solicitar funcionalidad', emoji: '✨' },
  { value: 'otro', label: 'Otro', emoji: '💬' },
]

// ─── Componente ──────────────────────────────────────────────────────────────

export function FeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoFeedback>('sugerencia')
  const [mensaje, setMensaje] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mensaje.trim().length < 10) {
      toast.error('El mensaje debe tener al menos 10 caracteres.')
      return
    }
    setIsSending(true)

    try {
      const res = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          mensaje: mensaje.trim(),
          pagina_origen: pathname,
        }),
      })

      if (res.ok) {
        toast.success('¡Gracias por tu feedback!', {
          description: 'Lo tendremos en cuenta para mejorar OPTEK.',
        })
        setMensaje('')
        setTipo('sugerencia')
        setOpen(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      toast.error('No se pudo enviar', {
        description: data?.error ?? 'Inténtalo de nuevo.',
      })
    } catch {
      toast.error('Error de conexión', {
        description: 'Comprueba tu conexión a internet.',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Enviar feedback"
        title="¿Tienes alguna sugerencia?"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Enviar feedback
              </DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de feedback */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left
                      ${tipo === t.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                      }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mensaje */}
            <div className="space-y-2">
              <label htmlFor="feedback-mensaje" className="text-sm font-medium">
                Mensaje
              </label>
              <textarea
                id="feedback-mensaje"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={5}
                placeholder={
                  tipo === 'error'
                    ? 'Describe el error que encontraste: qué hiciste, qué pasó...'
                    : tipo === 'funcionalidad'
                    ? 'Describe la funcionalidad que te gustaría tener...'
                    : 'Comparte tu sugerencia o comentario...'
                }
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={2000}
                required
                minLength={10}
              />
              <p className="text-right text-xs text-muted-foreground">
                {mensaje.length}/2000
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSending || mensaje.trim().length < 10}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
