'use client'

/**
 * /supuesto-practico/[id] — View and write answers for a generated supuesto.
 *
 * Shows the caso + 5 cuestiones with text areas for each answer.
 * Submit button sends to /api/ai/corregir-supuesto/stream for AI correction.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, FileText, ArrowLeft, Clock, AlertTriangle } from 'lucide-react'
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

/** Simple markdown → HTML for streaming correction display */
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr class="my-4 border-emerald-200"/>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>')
    .replace(/✅/g, '<span class="text-green-600">✅</span>')
    .replace(/❌/g, '<span class="text-red-600">❌</span>')
    .replace(/📚/g, '<span>📚</span>')
    .replace(/📝/g, '<span>📝</span>')
    .replace(/\n/g, '<br/>')
}

export default function SupuestoPracticoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [caso, setCaso] = useState<SupuestoCaso | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [correctionStream, setCorrectionStream] = useState('')
  const [corrected, setCorrected] = useState(false)
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})

  // Timer mode: ?timer=150 (minutes) from simulacros page
  const timerMinutes = searchParams.get('timer') ? parseInt(searchParams.get('timer')!, 10) : null
  const [secondsLeft, setSecondsLeft] = useState<number | null>(timerMinutes ? timerMinutes * 60 : null)
  const timerExpired = secondsLeft !== null && secondsLeft <= 0

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || corrected || submitting) return
    const interval = setInterval(() => setSecondsLeft(s => (s !== null && s > 0) ? s - 1 : 0), 1000)
    return () => clearInterval(interval)
  }, [secondsLeft, corrected, submitting])

  // Auto-submit when timer expires
  const handleSubmitRef = useCallback(() => {
    if (timerExpired && !corrected && !submitting && caso) {
      toast.warning('Tiempo agotado — enviando respuestas automáticamente')
    }
  }, [timerExpired, corrected, submitting, caso])

  useEffect(() => { handleSubmitRef() }, [handleSubmitRef])

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
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            {caso.titulo}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 cuestiones · Corrección con rúbrica oficial
            {timerMinutes && ' · Modo examen'}
          </p>
        </div>
        {/* Timer countdown */}
        {secondsLeft !== null && !corrected && (
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold ${
            secondsLeft <= 300 ? 'bg-red-100 text-red-700 animate-pulse' :
            secondsLeft <= 900 ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            <Clock className="h-4 w-4" />
            {Math.floor(secondsLeft / 3600) > 0 && `${Math.floor(secondsLeft / 3600)}:`}
            {String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')}:
            {String(secondsLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Timer mode banner */}
      {timerMinutes && !corrected && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <strong>Modo examen</strong> — {timerMinutes} minutos como en el examen real.
            Distribuye el tiempo entre las 5 cuestiones. Al agotarse el tiempo, tus respuestas se enviarán automáticamente.
          </p>
        </div>
      )}

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
              Corrigiendo con rúbrica oficial...
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
            <div
              className="text-sm leading-relaxed space-y-1 [&_strong]:font-semibold [&_hr]:my-4 [&_hr]:border-emerald-200"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(correctionStream) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
