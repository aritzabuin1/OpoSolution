/**
 * app/api/og/route.tsx — §2.16.2 (OpenGraph dinámico)
 *
 * Genera imágenes OG 1200×630 on-demand para compartir resultados
 * en WhatsApp, Telegram, Twitter/X, Discord, etc.
 *
 * Query params:
 *   score       — puntuación 0-100 (para tipos test/simulacro/cazatrampas)
 *   tema        — nombre del tema (opcional)
 *   nombre      — nombre del usuario (opcional)
 *   tipo        — 'test' | 'simulacro' | 'cazatrampas' | 'logro' | 'blog' | 'reto_diario' (default: 'test')
 *   logro_nombre — nombre del logro desbloqueado (solo para tipo=logro)
 *   aciertos    — trampas encontradas (solo para tipo=reto_diario)
 *   total       — total de trampas (solo para tipo=reto_diario)
 *   fecha       — fecha del reto 'YYYY-MM-DD' (solo para tipo=reto_diario)
 *
 * Ejemplos:
 *   /api/og?score=87&tema=LPAC&nombre=Aritz&tipo=test
 *   /api/og?tipo=logro&logro_nombre=Racha+7+días&nombre=Aritz
 *   /api/og?tipo=blog&tema=Guía+LPAC+2025
 *   /api/og?tipo=reto_diario&aciertos=2&total=3&fecha=2026-03-01&nombre=Aritz
 *
 * Nota: usa next/og (ImageResponse) — nativo en Next.js 13+, sin paquete extra.
 */

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

// Paleta OpoRuta
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
  if (tipo === 'logro') return 'Logro desbloqueado'
  if (tipo === 'blog') return 'Artículo del blog'
  if (tipo === 'reto_diario') return 'Reto Diario'
  return 'Test de práctica'
}

function generarGridOG(aciertos: number, total: number): string {
  const cuadrados: string[] = []
  for (let i = 0; i < total; i++) cuadrados.push(i < aciertos ? '🟩' : '⬛')
  return cuadrados.join('')
}

function formatFechaOG(fecha: string): string {
  try {
    const d = new Date(fecha + 'T12:00:00')
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return fecha }
}

// Paleta para logros
const AMBER = '#f59e0b'
const AMBER_BG = '#fffbeb'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const scoreRaw = searchParams.get('score')
  const tema = searchParams.get('tema') ?? ''
  const nombre = searchParams.get('nombre') ?? ''
  const tipo = searchParams.get('tipo') ?? 'test'
  const logroNombre = searchParams.get('logro_nombre') ?? ''
  const aciertosRaw = searchParams.get('aciertos')
  const totalRaw = searchParams.get('total')
  const fecha = searchParams.get('fecha') ?? ''

  const score = Math.max(0, Math.min(100, parseInt(scoreRaw ?? '0', 10) || 0))
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const tipoLabel = getTipoLabel(tipo)

  // Texto a mostrar para el tema (truncado si es largo)
  const temaDisplay = tema.length > 40 ? tema.slice(0, 37) + '…' : tema

  // ── Diseño especial para logros ─────────────────────────────────────────────
  const isLogro = tipo === 'logro'
  const isRetoDiario = tipo === 'reto_diario'
  const bgColor = isLogro ? AMBER_BG : isRetoDiario ? '#0f172a' : GRAY_50

  // ── Reto Diario: valores específicos ──────────────────────────────────────
  const retoAciertos = Math.max(0, parseInt(aciertosRaw ?? '0', 10) || 0)
  const retoTotal = Math.max(1, parseInt(totalRaw ?? '3', 10) || 3)
  const retoGrid = isRetoDiario ? generarGridOG(retoAciertos, retoTotal) : ''
  const retoPct = isRetoDiario ? Math.round((retoAciertos / retoTotal) * 100) : 0
  const retoFecha = isRetoDiario && fecha ? formatFechaOG(fecha) : ''

  const headerBg = isLogro ? AMBER : isRetoDiario ? '#1e293b' : NAVY
  const footerBg = isLogro ? AMBER : isRetoDiario ? '#1e293b' : NAVY

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: bgColor,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header OpoRuta */}
        <div
          style={{
            background: headerBg,
            padding: '32px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: WHITE, fontSize: 42, fontWeight: 700, letterSpacing: '-1px' }}>
              OpoRuta
            </span>
            <span style={{ color: isLogro ? 'rgba(255,255,255,0.8)' : LIGHT_BLUE, fontSize: 18, marginTop: 4 }}>
              El camino más corto hacia el aprobado
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
          {isRetoDiario ? (
            /* Diseño para Reto Diario: grid + score */
            <>
              {retoFecha && (
                <span style={{ color: '#94a3b8', fontSize: 22 }}>
                  {retoFecha}
                </span>
              )}
              <span style={{ fontSize: 80, letterSpacing: 4 }}>
                {retoGrid}
              </span>
              <span
                style={{
                  color: retoPct >= 80 ? '#4ade80' : retoPct >= 50 ? '#fbbf24' : '#f87171',
                  fontSize: 80,
                  fontWeight: 900,
                  letterSpacing: '-2px',
                  lineHeight: 1,
                }}
              >
                {retoAciertos}/{retoTotal}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: 24 }}>
                trampas encontradas — {retoPct}%
              </span>
              {nombre && (
                <span style={{ color: '#64748b', fontSize: 20, marginTop: 8 }}>
                  {nombre} · oporuta.es
                </span>
              )}
            </>
          ) : isLogro ? (
            /* Diseño para logros: icono trofeo + nombre del logro */
            <>
              <span style={{ fontSize: 80 }}>🏆</span>
              {nombre && (
                <span style={{ color: GRAY_500, fontSize: 24 }}>
                  {nombre} ha desbloqueado
                </span>
              )}
              <span
                style={{
                  color: NAVY,
                  fontSize: logroNombre.length > 30 ? 36 : 48,
                  fontWeight: 700,
                  textAlign: 'center',
                  maxWidth: 800,
                }}
              >
                {logroNombre || 'Nuevo logro'}
              </span>
            </>
          ) : (
            /* Diseño estándar para tests/simulacros */
            <>
              {nombre && (
                <span style={{ color: GRAY_500, fontSize: 24 }}>
                  {nombre} ha completado
                </span>
              )}

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

              {/* Score — solo si hay puntuación real (no logros ni blog) */}
              {tipo !== 'blog' && (
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
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            background: footerBg,
            padding: '20px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: isLogro ? 'rgba(255,255,255,0.9)' : LIGHT_BLUE, fontSize: 18 }}>
            oporuta.es — El camino más corto hacia el aprobado
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
