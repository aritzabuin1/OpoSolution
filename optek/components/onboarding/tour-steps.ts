/**
 * components/onboarding/tour-steps.ts
 *
 * Definición de pasos del onboarding tour.
 * Separado del componente para facilitar testing.
 */

export interface TourStep {
  element?: string        // CSS selector (undefined = overlay/modal)
  popover: {
    title: string
    description: string
    side?: 'top' | 'bottom' | 'left' | 'right'
  }
}

interface TourConfig {
  diasParaExamen: number | null
  isMobile: boolean
}

export function buildTourSteps(config: TourConfig): TourStep[] {
  const { diasParaExamen, isMobile } = config

  const diasText = diasParaExamen !== null && diasParaExamen > 0
    ? `Quedan ${diasParaExamen} días para el examen. `
    : ''

  const steps: TourStep[] = [
    // Step 0: Welcome overlay
    {
      popover: {
        title: '¡Bienvenido a OpoRuta!',
        description: `${diasText}OpoRuta te ayuda a prepararte con preguntas verificadas contra el BOE, análisis de exámenes reales INAP, y un sistema de estudio que se adapta a ti.\n\nTe enseñamos lo esencial en 1 minuto.`,
      },
    },
  ]

  // Step 1: Countdown (if visible)
  if (diasParaExamen !== null) {
    steps.push({
      element: '[data-tour="countdown"]',
      popover: {
        title: 'Tu cuenta atrás',
        description: 'Este contador se actualiza cada día. Los que aprueban son los que entrenan consistentemente.',
        side: 'bottom',
      },
    })
  }

  // Step 2-3: Nav items (Tests + Simulacros)
  // On mobile, these target Navbar items; on desktop, Sidebar items
  // Both use the same data-tour selectors
  steps.push({
    element: '[data-tour="nav-tests"]',
    popover: {
      title: 'Tests verificados contra el BOE',
      description: 'Genera tests por tema. Lo que nos hace únicos: cada cita legal se verifica contra la legislación oficial. Si un artículo cambió, lo detectamos.',
      side: isMobile ? 'bottom' : 'right',
    },
  })

  steps.push({
    element: '[data-tour="nav-simulacros"]',
    popover: {
      title: 'Simulacros con exámenes reales',
      description: '100 preguntas, 90 minutos, penalización de -1/3. Exactamente como el examen real. Usamos preguntas de exámenes INAP reales (2018–2024).',
      side: isMobile ? 'bottom' : 'right',
    },
  })

  // Step 4: Reto Diario (dashboard widget)
  steps.push({
    element: '[data-tour="reto-diario"]',
    popover: {
      title: 'Reto Diario — 3 minutos al día',
      description: 'Cada día, un reto nuevo y rápido. Es la forma más fácil de mantener tu racha activa sin necesitar una hora de estudio.',
      side: 'top',
    },
  })

  // Step 5: Stats cards
  steps.push({
    element: '[data-tour="stats"]',
    popover: {
      title: 'Tu progreso en números',
      description: 'Tests realizados, nota media, racha de días consecutivos y análisis disponibles. Todo se actualiza en tiempo real.',
      side: 'bottom',
    },
  })

  // Step 6: Final CTA overlay
  steps.push({
    popover: {
      title: '¡Todo listo!',
      description: 'Empecemos con un test rápido de 10 preguntas sobre el tema más preguntado en exámenes: La Constitución Española.\n\nAl terminar, la IA te explicará cada error con el método socrático.',
    },
  })

  return steps
}
