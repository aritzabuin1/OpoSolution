/**
 * lib/utils/ipr.ts — §2.5 (simplificado, sin migration)
 *
 * Índice Personal de Rendimiento (IPR) — puntuación 0–100 que resume
 * el nivel de preparación del usuario a partir de sus últimos tests.
 *
 * NO requiere tabla ipr_snapshots (esa es la versión completa POST-MVP).
 * Se calcula en tiempo de render desde tests_generados ya disponibles.
 *
 * Fórmula (3 componentes):
 *   - Rendimiento (60%): nota media de los últimos 10 tests (0-100)
 *   - Constancia (25%): factor basado en racha actual (0-100)
 *   - Progresión (15%): comparación últimos 5 tests vs anteriores 5 (0-100)
 *
 * Output:
 *   - score: número 0–100 (redondeado a entero)
 *   - nivel: 'iniciando' | 'aprendiendo' | 'avanzado' | 'preparado'
 *   - tendencia: 'subiendo' | 'estable' | 'bajando'
 *   - mensaje: texto motivacional breve
 */

export interface IPRResult {
  score: number
  nivel: 'iniciando' | 'aprendiendo' | 'avanzado' | 'preparado'
  tendencia: 'subiendo' | 'estable' | 'bajando'
  mensaje: string
  /** Desglose de componentes (útil para debugging / futura página detalle) */
  components: {
    rendimiento: number  // 0-100 (nota media últimos 10)
    constancia: number   // 0-100 (basado en racha)
    progresion: number   // 0-100 (tendencia reciente)
  }
}

interface TestSnapshot {
  puntuacion: number   // 0-100
  created_at: string
}

/**
 * Calcula el IPR a partir de historial de tests y racha actual.
 *
 * @param tests - Tests completados ordenados por fecha DESC (más reciente primero).
 *                Solo se procesan los primeros 20.
 * @param rachaActual - Días consecutivos de actividad (de profiles.racha_actual).
 */
export function calcularIPR(tests: TestSnapshot[], rachaActual: number): IPRResult | null {
  // Sin tests: no calculamos (mostrar estado vacío)
  if (tests.length === 0) return null

  // ── Componente 1: Rendimiento (60%) ─────────────────────────────────────────
  const ultimos10 = tests.slice(0, 10)
  const rendimiento = ultimos10.reduce((sum, t) => sum + t.puntuacion, 0) / ultimos10.length

  // ── Componente 2: Constancia (25%) ──────────────────────────────────────────
  // racha 0 = 0, racha 7+ = 100, interpolación lineal
  const constancia = Math.min(100, (rachaActual / 7) * 100)

  // ── Componente 3: Progresión (15%) ──────────────────────────────────────────
  let progresion = 50 // neutro si no hay suficiente historial
  if (tests.length >= 6) {
    const recientes = tests.slice(0, 5)
    const anteriores = tests.slice(5, 10)
    if (anteriores.length > 0) {
      const mediaReciente = recientes.reduce((s, t) => s + t.puntuacion, 0) / recientes.length
      const mediaAnterior = anteriores.reduce((s, t) => s + t.puntuacion, 0) / anteriores.length
      const diferencia = mediaReciente - mediaAnterior
      // diferencia +10 → 100, diferencia -10 → 0, 0 → 50
      progresion = Math.max(0, Math.min(100, 50 + diferencia * 5))
    }
  }

  // ── Score final ponderado ────────────────────────────────────────────────────
  const scoreRaw = rendimiento * 0.6 + constancia * 0.25 + progresion * 0.15
  const score = Math.round(Math.max(0, Math.min(100, scoreRaw)))

  // ── Nivel cualitativo ────────────────────────────────────────────────────────
  const nivel: IPRResult['nivel'] =
    score >= 80 ? 'preparado'
    : score >= 60 ? 'avanzado'
    : score >= 35 ? 'aprendiendo'
    : 'iniciando'

  // ── Tendencia ────────────────────────────────────────────────────────────────
  const tendencia: IPRResult['tendencia'] =
    progresion > 60 ? 'subiendo'
    : progresion < 40 ? 'bajando'
    : 'estable'

  // ── Mensaje motivacional ─────────────────────────────────────────────────────
  const mensaje = buildMensaje(score, tendencia, rachaActual, rendimiento)

  return {
    score,
    nivel,
    tendencia,
    mensaje,
    components: {
      rendimiento: Math.round(rendimiento),
      constancia: Math.round(constancia),
      progresion: Math.round(progresion),
    },
  }
}

function buildMensaje(
  score: number,
  tendencia: IPRResult['tendencia'],
  racha: number,
  rendimiento: number
): string {
  if (score >= 85) return '¡Excelente preparación! Estás listo para el examen.'
  if (score >= 70 && tendencia === 'subiendo') return 'Vas muy bien — ¡sigue así!'
  if (score >= 70) return 'Buen nivel. Mantén la constancia para llegar al 80+.'
  if (score >= 55 && rendimiento >= 65) return 'Buen rendimiento. La constancia diaria marcará la diferencia.'
  if (score >= 55) return 'Progresando bien. Practica más seguido para acelerar.'
  if (racha === 0) return 'Retoma el estudio hoy — cada día cuenta.'
  if (tendencia === 'subiendo') return '¡Vas mejorando! Mantén el ritmo.'
  if (rendimiento < 50) return 'Identifica los temas débiles y atácalos uno a uno.'
  return 'Sigue practicando — la constancia es clave para el aprobado.'
}
