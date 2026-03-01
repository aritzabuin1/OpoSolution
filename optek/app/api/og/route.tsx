/**
 * app/api/og/route.tsx — §Idea B (OpenGraph dinámico)
 *
 * Genera imágenes OG 1200×630 on-demand para compartir resultados
 * en WhatsApp, Telegram, Twitter/X, Discord, etc.
 *
 * Query params:
 *   score   — puntuación 0-100 (requerido)
 *   tema    — nombre del tema (opcional)
 *   nombre  — nombre del usuario (opcional)
 *   tipo    — 'test' | 'simulacro' | 'cazatrampas' (default: 'test')
 *
 * Ejemplo:
 *   /api/og?score=87&tema=LPAC&nombre=Aritz&tipo=test
 *
 * Nota: usa next/og (ImageResponse) — nativo en Next.js 13+, sin paquete extra.
 */

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

// Paleta OPTEK
const NAVY = '#1B4F72'
const LIGHT_BLUE = '#A9CCE3'
const WHITE = '#FFFFFF'
const GRAY_50 = '#F9FAFB'
const GRAY_500 = '#6B7280'

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a'  // green-600
  if (score >= 60) return '#d97706'  // amber-600
  return '#dc2626'                    // red-600
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '¡Perfecto!'
  if (score >= 80) return 'Excelente'
  if (score >= 70) return 'Bueno'
  if (score >= 60) return 'Aprobado'
  if (score >= 40) return 'Mejorable'
  return 'A practicar más'
}

function getTipoLabel(tipo: string): string {
  if (tipo === 'simulacro') return 'Simulacro Oficial INAP'
  if (tipo === 'cazatrampas') return 'Caza-Trampas'
  return 'Test de práctica'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const scoreRaw = searchParams.get('score')
  const tema = searchParams.get('tema') ?? ''
  const nombre = searchParams.get('nombre') ?? ''
  const tipo = searchParams.get('tipo') ?? 'test'

  const score = Math.max(0, Math.min(100, parseInt(scoreRaw ?? '0', 10) || 0))
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const tipoLabel = getTipoLabel(tipo)

  // Texto a mostrar para el tema (truncado si es largo)
  const temaDisplay = tema.length > 40 ? tema.slice(0, 37) + '…' : tema

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: GRAY_50,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header OPTEK */}
        <div
          style={{
            background: NAVY,
            padding: '32px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: WHITE, fontSize: 42, fontWeight: 700, letterSpacing: '-1px' }}>
              OPTEK
            </span>
            <span style={{ color: LIGHT_BLUE, fontSize: 18, marginTop: 4 }}>
              Tu Entrenador Personal de Oposiciones con IA
            </span>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '8px 20px',
              color: WHITE,
              fontSize: 16,
            }}
          >
            {tipoLabel}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 64px',
            gap: 16,
          }}
        >
          {/* Nombre del usuario */}
          {nombre && (
            <span style={{ color: GRAY_500, fontSize: 24 }}>
              {nombre} ha completado
            </span>
          )}

          {/* Tema */}
          {temaDisplay && (
            <span
              style={{
                color: NAVY,
                fontSize: temaDisplay.length > 30 ? 26 : 30,
                fontWeight: 600,
                textAlign: 'center',
                maxWidth: 800,
              }}
            >
              {temaDisplay}
            </span>
          )}

          {/* Score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              margin: '16px 0',
            }}
          >
            <span
              style={{
                fontSize: 140,
                fontWeight: 900,
                color: scoreColor,
                lineHeight: 1,
                letterSpacing: '-4px',
              }}
            >
              {score}%
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: scoreColor,
              }}
            >
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: NAVY,
            padding: '20px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: LIGHT_BLUE, fontSize: 18 }}>
            optek.es — Prepara tus oposiciones con IA verificada
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
            Empieza gratis · Sin tarjeta
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
