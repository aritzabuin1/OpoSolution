/**
 * components/dashboard/EvolutionChart.tsx — §1.13.2
 *
 * Gráfico SVG de evolución de puntuación (últimos 30 días).
 * Implementado sin librería externa — SVG puro para máxima ligereza.
 *
 * Server Component — no requiere estado cliente.
 */

interface DataPoint {
  fecha: string // ISO date
  puntuacion: number // 0-100
  tema: string
}

interface EvolutionChartProps {
  data: DataPoint[]
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        Completa tu primer test para ver tu evolución
      </div>
    )
  }

  const W = 600
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = 100
  const minVal = 0

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - ((d.puntuacion - minVal) / (maxVal - minVal)) * chartH,
    ...d,
  }))

  // Build polyline path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  // Build fill area
  const fillD = [
    `M ${points[0].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    ...points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)}`,
    'Z',
  ].join(' ')

  // Y-axis grid lines (0, 50, 70, 100)
  const gridValues = [0, 50, 70, 100]

  // X-axis labels: first, middle, last (avoid crowding)
  const labelIndices = data.length <= 3
    ? data.map((_, i) => i)
    : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 200 }}
        aria-label="Gráfico de evolución de puntuación"
      >
        {/* Grid lines */}
        {gridValues.map((val) => {
          const cy = PAD.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
          const isTarget = val === 70
          return (
            <g key={val}>
              <line
                x1={PAD.left}
                y1={cy}
                x2={W - PAD.right}
                y2={cy}
                stroke={isTarget ? '#22c55e' : '#e5e7eb'}
                strokeWidth={isTarget ? 1 : 0.5}
                strokeDasharray={isTarget ? '4 3' : undefined}
              />
              <text
                x={PAD.left - 6}
                y={cy + 4}
                fontSize={9}
                textAnchor="end"
                fill="#9ca3af"
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Fill area */}
        {data.length > 1 && (
          <path d={fillD} fill="url(#chartGradient)" opacity={0.3} />
        )}

        {/* Line */}
        {data.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#1B4F72"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill={p.puntuacion >= 70 ? '#22c55e' : p.puntuacion >= 50 ? '#f59e0b' : '#ef4444'}
            stroke="white"
            strokeWidth={1.5}
          >
            <title>{`${p.tema}: ${p.puntuacion}%`}</title>
          </circle>
        ))}

        {/* X-axis labels */}
        {labelIndices.map((i) => {
          const p = points[i]
          const fecha = new Date(data[i].fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          })
          return (
            <text key={i} x={p.x} y={H - 6} fontSize={9} textAnchor="middle" fill="#9ca3af">
              {fecha}
            </text>
          )
        })}

        {/* Gradient def */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B4F72" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#1B4F72" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <p className="text-xs text-center text-muted-foreground mt-1">
        Línea verde = objetivo 70%. Cada punto = un test completado.
      </p>
    </div>
  )
}
