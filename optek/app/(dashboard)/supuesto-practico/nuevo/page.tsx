'use client'

/**
 * /supuesto-practico/nuevo — Genera un nuevo supuesto práctico con IA.
 *
 * Flow:
 * 1. User clicks "Generar supuesto"
 * 2. POST /api/ai/generate-supuesto
 * 3. Redirect to /supuesto-practico/[id] to write answers
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Loader2, FileText, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoSupuestoPracticoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-supuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.status === 402) {
        toast.error('No tienes supuestos prácticos disponibles. Compra el Pack A2 o una recarga.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Error al generar el supuesto práctico.')
        setLoading(false)
        return
      }

      const data = await res.json()
      toast.success('Supuesto generado — ¡a escribir!')
      router.push(`/supuesto-practico/${data.id}`)
    } catch {
      toast.error('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Supuesto Práctico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          La IA genera un caso práctico realista tipo INAP con 5 cuestiones
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Info sobre qué va a pasar */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Caso práctico tipo INAP</p>
                <p className="text-xs text-muted-foreground">
                  Un escenario realista de funcionario A2 con 5 cuestiones mezclando contratación, presupuestos y RRHH — como en el examen real.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Sin límite de tiempo</p>
                <p className="text-xs text-muted-foreground">
                  Escribe tus respuestas a tu ritmo. En el examen real tendrás 150 minutos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Corrección con rúbrica INAP</p>
                <p className="text-xs text-muted-foreground">
                  Al enviar, la IA corrige usando los 4 criterios oficiales: conocimiento aplicado (60%), análisis (20%), sistemática (10%) y expresión (10%).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Generar un supuesto consume 1 crédito de tu balance. La corrección se realiza al enviar tus respuestas.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando caso práctico...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generar supuesto práctico
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
