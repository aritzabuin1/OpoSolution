/**
 * lib/utils/dashboard-phase.ts
 *
 * Calcula la fase del dashboard según la actividad del usuario.
 * Función pura, sin side effects — fácil de testear.
 */

export type DashboardPhase = 'new' | 'starting' | 'active' | 'lapsed'

export function getDashboardPhase(
  totalTests: number,
  rachaActual: number,
  ultimoTestDia: string | null,
): DashboardPhase {
  if (totalTests === 0) return 'new'

  if (totalTests < 3) return 'starting'

  // 3+ tests: check if lapsed
  if (rachaActual === 0 && ultimoTestDia) {
    const daysSince = Math.floor(
      (Date.now() - new Date(ultimoTestDia).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSince >= 7) return 'lapsed'
  }

  return 'active'
}
