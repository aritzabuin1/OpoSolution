'use client'

interface DimensionData {
  dimension: string
  raw: number
  t_score: number
  facets: Array<{ faceta: number; raw: number; items_count: number }>
}

interface Session {
  id: string
  tipo: string
  completed: boolean
  scores: Record<string, unknown> | null
  created_at: string
}

interface Props {
  profile: Record<string, unknown>
  sessions: Session[]
}

const DIM_LABELS: Record<string, { name: string; desc: string; icon: string }> = {
  O: { name: 'Apertura', desc: 'Curiosidad intelectual, creatividad', icon: '🔭' },
  C: { name: 'Responsabilidad', desc: 'Organización, disciplina, fiabilidad', icon: '📋' },
  E: { name: 'Extroversión', desc: 'Sociabilidad, asertividad, energía', icon: '🗣️' },
  A: { name: 'Amabilidad', desc: 'Cooperación, empatía, confianza', icon: '🤝' },
  N: { name: 'Neuroticismo', desc: 'Reactividad emocional, estrés', icon: '⚡' },
}

const IDEAL_T: Record<string, number> = { O: 45, C: 60, E: 55, A: 50, N: 40 }

function getBarColor(dim: string, tScore: number): string {
  const ideal = IDEAL_T[dim]
  const delta = Math.abs(tScore - ideal)
  if (delta <= 5) return 'bg-green-500'
  if (delta <= 10) return 'bg-sky-500'
  if (delta <= 15) return 'bg-amber-500'
  return 'bg-red-500'
}

function getFitLabel(dim: string, tScore: number): { text: string; color: string } {
  const ideal = IDEAL_T[dim]
  const delta = Math.abs(tScore - ideal)
  if (delta <= 5) return { text: 'Excelente', color: 'text-green-600' }
  if (delta <= 10) return { text: 'Bueno', color: 'text-sky-600' }
  if (delta <= 15) return { text: 'Moderado', color: 'text-amber-600' }
  return { text: 'A mejorar', color: 'text-red-600' }
}

export function PerfilRadar({ profile, sessions }: Props) {
  const dimensions = (profile as { dimensions?: DimensionData[] }).dimensions ?? []
  const policeFit = (profile as { police_fit?: { overall_fit: number } }).police_fit

  return (
    <div className="space-y-6">
      {/* Overall fit */}
      {policeFit && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-500">Ajuste al perfil policial ideal</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">
            {policeFit.overall_fit.toFixed(0)}
            <span className="text-lg text-gray-400">/100</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Basado en {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
          </p>
        </div>
      )}

      {/* Dimension cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dimensions.map((d: DimensionData) => {
          const info = DIM_LABELS[d.dimension] ?? { name: d.dimension, desc: '', icon: '📊' }
          const fit = getFitLabel(d.dimension, d.t_score)
          const ideal = IDEAL_T[d.dimension]

          return (
            <div key={d.dimension} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{info.name}</h4>
                    <p className="text-xs text-gray-400">{info.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${fit.color}`}>{fit.text}</span>
              </div>

              {/* T-score bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>T = {d.t_score.toFixed(0)}</span>
                  <span className="text-gray-400">Ideal: {ideal}</span>
                </div>
                <div className="relative h-3 rounded-full bg-gray-100">
                  {/* User score */}
                  <div
                    className={`absolute top-0 left-0 h-3 rounded-full ${getBarColor(d.dimension, d.t_score)} transition-all`}
                    style={{ width: `${Math.min(100, (d.t_score / 80) * 100)}%` }}
                  />
                  {/* Ideal marker */}
                  <div
                    className="absolute top-0 h-3 w-0.5 bg-gray-800"
                    style={{ left: `${(ideal / 80) * 100}%` }}
                    title={`Ideal: T=${ideal}`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Session history */}
      {sessions.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Historial de sesiones</h4>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-gray-400">
                  {s.completed ? 'Completado' : 'En progreso'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
