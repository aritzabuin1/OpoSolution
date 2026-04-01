'use client'

import { useState, useCallback, useEffect } from 'react'
import { Brain, MessageCircle, Target, TrendingUp, Zap, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PersonalidadAssessment } from './PersonalidadAssessment'
import { PerfilRadar } from './PerfilRadar'
import { SJTCard } from './SJTCard'
import { markdownToHtml } from '@/lib/utils/simple-markdown'

type Tab = 'evaluacion' | 'perfil' | 'sjt' | 'entrevista' | 'coaching'

interface Session {
  id: string
  tipo: string
  completed: boolean
  scores: Record<string, unknown> | null
  created_at: string
}

interface Props {
  cuerpoSlug: string
  credits: number
  sessions: Session[]
  hasProfile: boolean
  latestProfile: Record<string, unknown> | null
}

export function PersonalidadHub({ cuerpoSlug, credits, sessions, hasProfile, latestProfile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(hasProfile ? 'perfil' : 'evaluacion')

  const tabs: { id: Tab; label: string; icon: typeof Brain; locked: boolean; description: string }[] = [
    { id: 'evaluacion', label: 'Evaluación', icon: Brain, locked: false, description: 'Cuestionario Big Five' },
    { id: 'perfil', label: 'Mi Perfil', icon: TrendingUp, locked: !hasProfile, description: 'Radar de personalidad' },
    { id: 'sjt', label: 'Juicio Situacional', icon: Target, locked: false, description: 'Escenarios policiales' },
    { id: 'entrevista', label: 'Entrevista', icon: MessageCircle, locked: !hasProfile, description: 'Psicólogo IA' },
    { id: 'coaching', label: 'Coaching', icon: Zap, locked: !hasProfile, description: 'Plan de mejora' },
  ]

  return (
    <div className="space-y-6">
      {/* Credits banner */}
      <div className="flex items-center justify-between rounded-lg bg-sky-50 dark:bg-sky-950/30 px-4 py-3">
        <span className="text-sm text-sky-700 dark:text-sky-300">
          <strong>{credits >= 999 ? '∞' : credits}</strong> créditos IA disponibles
        </span>
        <a href="/cuenta" className="text-xs font-medium text-sky-600 hover:text-sky-800">
          Recargar →
        </a>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.locked && setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white'
                : tab.locked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
            disabled={tab.locked}
          >
            {tab.locked ? <Lock className="h-4 w-4" /> : <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'evaluacion' && (
        <PersonalidadAssessment cuerpoSlug={cuerpoSlug} />
      )}
      {activeTab === 'perfil' && latestProfile && (
        <PerfilRadar profile={latestProfile} sessions={sessions.filter(s => s.tipo === 'perfil' && s.completed)} />
      )}
      {activeTab === 'sjt' && (
        <SJTCard cuerpoSlug={cuerpoSlug} credits={credits} />
      )}
      {activeTab === 'entrevista' && (
        <EntrevistaInline cuerpoSlug={cuerpoSlug} credits={credits} hasProfile={hasProfile} />
      )}
      {activeTab === 'coaching' && (
        <CoachingInline cuerpoSlug={cuerpoSlug} credits={credits} />
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400">
        Herramienta de práctica y autoconocimiento. No sustituye la evaluación profesional.
        Items basados en IPIP (dominio público).
      </p>
    </div>
  )
}

// ─── Entrevista inline ──────────────────────────────────────────────────────

const INTERVIEW_DURATION_MS = 30 * 60 * 1000 // 30 minutes

function EntrevistaInline({ cuerpoSlug, credits, hasProfile }: { cuerpoSlug: string; credits: number; hasProfile: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'streaming' | 'done'>('idle')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [sesionId, setSesionId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [sessionEnded, setSessionEnded] = useState(false)

  // Timer
  useEffect(() => {
    if (!startTime) return
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, INTERVIEW_DURATION_MS - elapsed)
      if (remaining === 0) {
        setSessionEnded(true)
        clearInterval(interval)
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || state === 'loading' || state === 'streaming') return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setState('loading')

    try {
      // Send full history so the AI has conversation context
      const history = messages.map(m => ({ role: m.role, content: m.text }))
      const res = await fetch('/api/personalidad/interview/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuerpo_slug: cuerpoSlug,
          message: userMsg,
          history,
          ...(sesionId ? { sesion_id: sesionId } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Error al conectar con el entrevistador')
        setState('idle')
        return
      }

      // Extract sesion_id from header if present
      const newSesionId = res.headers.get('x-sesion-id')
      if (newSesionId) setSesionId(newSesionId)

      if (!res.body) { setState('idle'); return }
      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', text: accumulated }]
          }
          return [...prev, { role: 'assistant', text: accumulated }]
        })
      }
      setState('done')
    } catch {
      toast.error('Error de conexión')
      setState('idle')
    }
  }, [input, state, cuerpoSlug, sesionId])

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-sky-400" />
        <h3 className="mt-4 text-lg font-semibold">Entrevista con Psicólogo IA</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Practica la entrevista personal con un psicólogo simulado que conoce tu perfil.
          Recibirás feedback detallado.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Consume 2 créditos por sesión de 30 minutos</p>
        <button
          onClick={() => {
            setStartTime(Date.now())
            setInput('Hola, estoy preparando la entrevista de personalidad.')
            setTimeout(() => sendMessage(), 100)
          }}
          disabled={credits < 2}
          className="mt-4 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          Iniciar entrevista
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card flex flex-col" style={{ maxHeight: '600px' }}>
      {/* Timer bar */}
      {startTime && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 text-xs">
          <span className="text-muted-foreground">Entrevista en curso</span>
          <span className={`font-mono font-medium ${sessionEnded ? 'text-red-500' : timeLeft && parseInt(timeLeft) < 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {sessionEnded ? 'Tiempo agotado' : `⏱ ${timeLeft}`}
          </span>
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-sky-600 text-white'
                : 'bg-muted'
            }`}>
              {msg.role === 'assistant' ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }}
                />
              ) : msg.text}
            </div>
          </div>
        ))}
        {state === 'loading' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {sessionEnded ? (
        <div className="border-t p-4 text-center text-sm text-muted-foreground">
          Sesión finalizada. Puedes iniciar otra sesión (2 créditos).
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="flex-1 rounded-md border px-3 py-1.5 text-sm bg-background"
            disabled={state === 'loading' || state === 'streaming'}
          />
          <button
            type="submit"
            disabled={!input.trim() || state === 'loading' || state === 'streaming'}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Coaching inline ────────────────────────────────────────────────────────

function CoachingInline({ cuerpoSlug, credits }: { cuerpoSlug: string; credits: number }) {
  const [state, setState] = useState<'idle' | 'loading' | 'streaming' | 'done'>('idle')
  const [text, setText] = useState('')

  const generate = useCallback(async () => {
    if (state === 'loading' || state === 'streaming') return
    setState('loading')
    setText('')

    try {
      const res = await fetch('/api/personalidad/coaching/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuerpo_slug: cuerpoSlug }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Error al generar informe')
        setState('idle')
        return
      }

      if (!res.body) { setState('idle'); return }
      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setText(accumulated)
      }
      setState('done')
    } catch {
      toast.error('Error de conexión')
      setState('idle')
    }
  }, [cuerpoSlug, state])

  if (!text && (state === 'idle' || state === 'loading')) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <Zap className="mx-auto h-12 w-12 text-amber-400" />
        <h3 className="mt-4 text-lg font-semibold">Coaching Personalizado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe detallado con gap analysis, plan semanal y recomendaciones evidence-based
          para desarrollar las competencias del perfil policial ideal.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Consume 1 crédito por informe</p>
        <button
          onClick={generate}
          disabled={credits < 1}
          className="mt-4 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {state === 'loading' ? 'Conectando...' : 'Generar informe'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generando informe de coaching...</span>
        </div>
      )}
      <div
        className="prose prose-sm dark:prose-invert max-w-none
          prose-headings:text-base prose-headings:mt-4 prose-headings:mb-2
          prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}
      />
      {state === 'done' && (
        <button
          onClick={generate}
          disabled={credits < 1}
          className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
        >
          Regenerar informe
        </button>
      )}
    </div>
  )
}
