'use client'

/**
 * /supuesto-practico/[id] — View and write answers for a generated supuesto.
 *
 * Shows the caso + 5 cuestiones with text areas for each answer.
 * Submit button sends to /api/ai/corregir-supuesto/stream for AI correction.
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, FileText, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Cuestion {
  numero: number
  enunciado: string
  subpreguntas: string[]
  bloque: string
  leyes_relevantes: string[]
}

interface SupuestoCaso {
  titulo: string
  contexto: string
  cuestiones: Cuestion[]
}

export default function SupuestoPracticoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [caso, setCaso] = useState<SupuestoCaso | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [correctionStream, setCorrectionStream] = useState('')
  const [corrected, setCorrected] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})

  // Load supuesto data
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await (supabase as ReturnType<typeof createClient>)
        .from('supuestos_practicos' as 'profiles')
        .select('caso, corregido, respuestas_usuario')
        .eq('id', id)
        .single()

      if (data) {
        const row = data as unknown as { caso: SupuestoCaso; corregido: boolean; respuestas_usuario: Record<string, string> | null }
        setCaso(row.caso)
        setCorrected(row.corregido)
        if (row.respuestas_usuario) {
          setRespuestas(row.respuestas_usuario)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit() {
    if (!caso) return

    // Validate at least 1 answer written
    const answered = Object.values(respuestas).filter(v => v.trim().length > 0)
    if (answered.length === 0) {
      toast.error('Escribe al menos una respuesta antes de enviar.')
      return
    }

    setSubmitting(true)
    setCorrectionStream('')

    try {
      const res = await fetch('/api/ai/corregir-supuesto/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supuestoId: id, respuestas }),
      })

      if (res.status === 402) {
        toast.error('No tienes correcciones de supuesto disponibles.')
        setSubmitting(false)
        return
      }

      if (!res.ok || !res.body) {
        toast.error('Error al corregir el supuesto.')
        setSubmitting(false)
        return
      }

      // Stream the correction
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setCorrectionStream(fullText)
      }

      setCorrected(true)
      toast.success('Supuesto corregido')
    } catch {
      toast.error('Error de conexión.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!caso) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <p className="text-muted-foreground">Supuesto no encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/supuesto-practico">Volver</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/supuesto-practico"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            {caso.titulo}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 cuestiones · Bloques IV, V y VI · Rúbrica INAP
          </p>
        </div>
      </div>

      {/* Contexto */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Contexto del caso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-line">{caso.contexto}</p>
        </CardContent>
      </Card>

      {/* Cuestiones */}
      {caso.cuestiones.map((cuestion) => (
        <Card key={cuestion.numero} className="border-l-4 border-l-emerald-400">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Cuestión {cuestion.numero}</CardTitle>
              <Badge variant="outline" className="text-[10px]">Bloque {cuestion.bloque}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{cuestion.enunciado}</p>

            {cuestion.subpreguntas.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground pl-1">
                {cuestion.subpreguntas.map((sp, i) => (
                  <li key={i}>{sp}</li>
                ))}
              </ul>
            )}

            <textarea
              className="w-full min-h-[150px] rounded-lg border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              placeholder="Escribe tu respuesta aquí..."
              value={respuestas[String(cuestion.numero)] ?? ''}
              onChange={(e) => setRespuestas(prev => ({ ...prev, [String(cuestion.numero)]: e.target.value }))}
              disabled={corrected || submitting}
            />
          </CardContent>
        </Card>
      ))}

      {/* Submit / Correction */}
      {!corrected && !correctionStream && (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Corrigiendo con rúbrica INAP...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar para corrección IA
            </>
          )}
        </Button>
      )}

      {/* Streaming correction */}
      {correctionStream && (
        <Card className="border-emerald-300/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Corrección del tribunal IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
              {correctionStream}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
