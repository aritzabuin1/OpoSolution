'use client'

import { useState } from 'react'
import { Brain, MessageCircle, Target, TrendingUp, Zap, Lock } from 'lucide-react'
import { PersonalidadAssessment } from './PersonalidadAssessment'
import { PerfilRadar } from './PerfilRadar'
import { SJTCard } from './SJTCard'

type Tab = 'assessment' | 'perfil' | 'sjt' | 'entrevista' | 'coaching'

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
  const [activeTab, setActiveTab] = useState<Tab>(hasProfile ? 'perfil' : 'assessment')

  const tabs: { id: Tab; label: string; icon: typeof Brain; locked: boolean; description: string }[] = [
    { id: 'assessment', label: 'Assessment', icon: Brain, locked: false, description: 'Cuestionario Big Five' },
    { id: 'perfil', label: 'Mi Perfil', icon: TrendingUp, locked: !hasProfile, description: 'Radar de personalidad' },
    { id: 'sjt', label: 'Juicio Situacional', icon: Target, locked: false, description: 'Escenarios policiales' },
    { id: 'entrevista', label: 'Entrevista', icon: MessageCircle, locked: !hasProfile, description: 'Psicólogo IA' },
    { id: 'coaching', label: 'Coaching', icon: Zap, locked: !hasProfile, description: 'Plan de mejora' },
  ]

  return (
    <div className="space-y-6">
      {/* Credits banner */}
      <div className="flex items-center justify-between rounded-lg bg-sky-50 px-4 py-3">
        <span className="text-sm text-sky-700">
          <strong>{credits}</strong> créditos IA disponibles
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
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={tab.locked}
          >
            {tab.locked ? <Lock className="h-4 w-4" /> : <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'assessment' && (
        <PersonalidadAssessment cuerpoSlug={cuerpoSlug} />
      )}
      {activeTab === 'perfil' && latestProfile && (
        <PerfilRadar profile={latestProfile} sessions={sessions.filter(s => s.tipo === 'perfil' && s.completed)} />
      )}
      {activeTab === 'sjt' && (
        <SJTCard cuerpoSlug={cuerpoSlug} credits={credits} />
      )}
      {activeTab === 'entrevista' && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-sky-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Entrevista con Psicólogo IA</h3>
          <p className="mt-2 text-sm text-gray-500">
            Practica la entrevista personal con un psicólogo simulado que conoce tu perfil.
            Recibirás feedback detallado al finalizar.
          </p>
          <p className="mt-1 text-xs text-gray-400">Consume 1 crédito por sesión</p>
          <button
            className="mt-4 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            disabled={credits < 1}
            onClick={() => window.location.href = '/personalidad-policial/entrevista'}
          >
            Iniciar entrevista
          </button>
        </div>
      )}
      {activeTab === 'coaching' && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <Zap className="mx-auto h-12 w-12 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Coaching Personalizado</h3>
          <p className="mt-2 text-sm text-gray-500">
            Informe detallado con gap analysis, plan semanal y recomendaciones evidence-based
            para desarrollar las competencias del perfil policial ideal.
          </p>
          <p className="mt-1 text-xs text-gray-400">Consume 1 crédito por informe</p>
          <button
            className="mt-4 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            disabled={credits < 1}
          >
            Generar informe
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-gray-400">
        Herramienta de práctica y autoconocimiento. No sustituye la evaluación profesional.
        Items basados en IPIP (dominio público).
      </p>
    </div>
  )
}
