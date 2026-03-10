'use client'

/**
 * components/dashboard/EvolutionChart.tsx — §1.13.2
 *
 * Gráfico SVG de evolución de puntuación (últimos 30 días).
 * SVG puro + tooltip interactivo con hover.
 */

import { useState, useCallback } from 'react'

interface DataPoint {
  fecha: string // ISO date
  puntuacion: number // 0-100
  tema: string
}

interface EvolutionChartProps {
  data: DataPoint[]
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  })
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const handleMouseEnter = useCallback((i: number) => setHoveredIdx(i), [])
  const handleMouseLeave = useCallback(() => setHoveredIdx(null), [])

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

  // X-axis labels: pick unique dates spread evenly, max 5 labels to avoid crowding
  const MAX_LABELS = 5
  const allLabels = points.map((p, i) => ({ idx: i, label: formatDateLabel(data[i].fecha) }))

  // Deduplicate: only keep first occurrence of each date label
  const uniqueLabels: typeof allLabels = []
  const seenLabels = new Set<string>()
  for (const item of allLabels) {
    if (!seenLabels.has(item.label)) {
      seenLabels.add(item.label)
      uniqueLabels.push(item)
    }
  }

  // If more than MAX_LABELS unique dates, subsample evenly
  let displayLabels: typeof allLabels
  if (uniqueLabels.length <= MAX_LABELS) {
    displayLabels = uniqueLabels
  } else {
    displayLabels = []
    for (let i = 0; i < MAX_LABELS; i++) {
      const idx = Math.round((i / (MAX_LABELS - 1)) * (uniqueLabels.length - 1))
      displayLabels.push(uniqueLabels[idx])
    }
  }

  // Tooltip data
  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null

  // Tooltip positioning: flip left if too close to right edge
  const tooltipW = 140
  const tooltipFlip = hovered && hovered.x > W - PAD.right - tooltipW

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 200 }}
        aria-label="Gráfico de evolución de puntuación"
        onMouseLeave={handleMouseLeave}
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

        {/* Hover vertical line */}
        {hovered && (
          <line
            x1={hovered.x}
            y1={PAD.top}
            x2={hovered.x}
            y2={PAD.top + chartH}
            stroke="#1B4F72"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
          />
        )}

        {/* Data points — with invisible larger hit targets */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Invisible hit target for easier hover */}
            <circle
              cx={p.x}
              cy={p.y}
              r={12}
              fill="transparent"
              onMouseEnter={() => handleMouseEnter(i)}
              onTouchStart={() => handleMouseEnter(i)}
              style={{ cursor: 'pointer' }}
            />
            {/* Visible dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === i ? 5 : 3.5}
              fill={p.puntuacion >= 70 ? '#22c55e' : p.puntuacion >= 50 ? '#f59e0b' : '#ef4444'}
              stroke="white"
              strokeWidth={hoveredIdx === i ? 2 : 1.5}
              style={{ transition: 'r 150ms ease, stroke-width 150ms ease' }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hovered && hoveredIdx !== null && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Tooltip background */}
            <rect
              x={tooltipFlip ? hovered.x - tooltipW - 8 : hovered.x + 8}
              y={Math.max(PAD.top, hovered.y - 28)}
              width={tooltipW}
              height={44}
              rx={6}
              fill="#1e293b"
              opacity={0.95}
            />
            {/* Score */}
            <text
              x={tooltipFlip ? hovered.x - tooltipW - 8 + 10 : hovered.x + 18}
              y={Math.max(PAD.top, hovered.y - 28) + 17}
              fontSize={13}
              fontWeight="bold"
              fill={hovered.puntuacion >= 70 ? '#4ade80' : hovered.puntuacion >= 50 ? '#fbbf24' : '#f87171'}
            >
              {hovered.puntuacion}%
            </text>
            {/* Date + tema */}
            <text
              x={tooltipFlip ? hovered.x - tooltipW - 8 + 10 : hovered.x + 18}
              y={Math.max(PAD.top, hovered.y - 28) + 34}
              fontSize={9}
              fill="#94a3b8"
            >
              {formatDateLabel(data[hoveredIdx].fecha)} · {data[hoveredIdx].tema.length > 18
                ? data[hoveredIdx].tema.slice(0, 18) + '…'
                : data[hoveredIdx].tema}
            </text>
          </g>
        )}

        {/* X-axis labels */}
        {displayLabels.map(({ idx, label }) => {
          const p = points[idx]
          return (
            <text key={`x-${idx}`} x={p.x} y={H - 6} fontSize={9} textAnchor="middle" fill="#9ca3af">
              {label}
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
        Línea verde = objetivo 70%. Pasa el dedo o cursor sobre los puntos para ver detalles.
      </p>
    </div>
  )
}
