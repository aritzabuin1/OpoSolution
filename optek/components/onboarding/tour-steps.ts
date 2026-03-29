/**
 * components/onboarding/tour-steps.ts
 *
 * Definición de pasos del onboarding tour.
 * Cubre TODAS las features diferenciadoras de OpoRuta.
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
  /** Organismo that administers the exam: 'INAP', 'MJU', 'Correos' */
  organismo?: string
  /** Number of questions in the official exam (first exercise) */
  preguntasExamen?: number
  /** Time in minutes for the official exam */
  minutosExamen?: number
}

export function buildTourSteps(config: TourConfig): TourStep[] {
  const { diasParaExamen, isMobile, organismo = 'INAP', preguntasExamen = 100, minutosExamen = 90 } = config
  const navSide = isMobile ? 'bottom' as const : 'right' as const

  const diasText = diasParaExamen !== null && diasParaExamen > 0
    ? `Quedan ${diasParaExamen} días para el examen.`
    : ''

  const steps: TourStep[] = [
    // ── Step 0: Welcome overlay ──────────────────────────────────────
    {
      popover: {
        title: '¡Bienvenido a OpoRuta!',
        description: `${diasText ? diasText + ' ' : ''}Vas a descubrir las herramientas que te van a ayudar a aprobar. Te lo enseñamos en 2 minutos.`,
      },
    },
  ]

  // ── Step 1: Countdown ──────────────────────────────────────────────
  if (diasParaExamen !== null) {
    steps.push({
      element: '[data-tour="countdown"]',
      popover: {
        title: 'Tu cuenta atrás',
        description: 'Se actualiza cada día. Los que aprueban entrenan con constancia. Desde aquí puedes lanzar un test rápido en cualquier momento.',
        side: 'bottom',
      },
    })
  }

  // ── Step 2: Tests IA ───────────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-tests"]',
    popover: {
      title: 'Tests de IA verificados contra el BOE',
      description: 'Genera tests por tema con preguntas originales. Lo que nos hace únicos: cada cita legal se verifica automáticamente contra la legislación oficial. Si un artículo cambió, lo detectamos. Ninguna otra plataforma hace esto.',
      side: navSide,
    },
  })

  // ── Step 3: Psicotécnicos ─────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-psicotecnicos"]',
    popover: {
      title: 'Psicotécnicos por categoría',
      description: 'Series numéricas, alfabéticas, analogías, razonamiento lógico, comprensión verbal y cálculo mental. Generados algorítmicamente con dificultad adaptativa.',
      side: navSide,
    },
  })

  // ── Step 4: Simulacros ────────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-simulacros"]',
    popover: {
      title: `Simulacros con exámenes ${organismo} reales`,
      description: `${preguntasExamen} preguntas, ${minutosExamen} minutos, con penalización oficial. Exactamente como el examen real. Usamos preguntas de convocatorias anteriores. Al terminar, te decimos si habrías superado la nota de corte.`,
      side: navSide,
    },
  })

  // ── Step 5: Flashcards ────────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-flashcards"]',
    popover: {
      title: 'Flashcards con repetición espaciada',
      description: 'Cada vez que fallas una pregunta, OpoRuta crea una flashcard automáticamente. El algoritmo de repetición espaciada te muestra cada concepto justo antes de que lo olvides. Memorizas más con menos esfuerzo.',
      side: navSide,
    },
  })

  // ── Step 6: Caza-Trampas ─────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-cazatrampas"]',
    popover: {
      title: 'Caza-Trampas — Detecta errores en artículos',
      description: 'La IA introduce errores sutiles en artículos de ley reales. Tu misión: encontrarlos. Es la forma más efectiva de aprender los detalles que el tribunal pregunta. Ideal para dominar artículos clave.',
      side: navSide,
    },
  })

  // ── Step 7: Reto Diario ──────────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-reto-diario"]',
    popover: {
      title: 'Reto Diario — 3 minutos al día',
      description: 'Cada día, un nuevo reto rápido con trampas en artículos legales. La forma más fácil de mantener tu racha activa. Incluso los días que no puedas estudiar mucho, haz el reto diario.',
      side: navSide,
    },
  })

  // ── Step 8: Radar del Tribunal ────────────────────────────────────
  steps.push({
    element: '[data-tour="nav-radar"]',
    popover: {
      title: 'Radar del Tribunal — Tu arma secreta',
      description: `Hemos analizado TODOS los exámenes ${organismo} disponibles. Este ranking te dice exactamente qué temas y artículos caen más. Así priorizas tu estudio en lo que realmente importa.`,
      side: navSide,
    },
  })

  // ── Step 9: Stats cards (dashboard) ───────────────────────────────
  steps.push({
    element: '[data-tour="stats"]',
    popover: {
      title: 'Tu progreso en tiempo real',
      description: 'Tests realizados, nota media, racha de días consecutivos y créditos IA disponibles. Todo se actualiza automáticamente. A medida que practiques, desbloquearás el dashboard completo con gráficos de evolución, mapa de temario e IPR.',
      side: 'bottom',
    },
  })

  // ── Step 10: Análisis con IA ────────────────────────────────────────
  steps.push({
    element: '[data-tour="stats"]',
    popover: {
      title: 'Tu Tutor IA personal',
      description: 'Cuando fallas una pregunta, tu Tutor IA no te da la respuesta. '
        + 'Te hace preguntas para que llegues tú al artículo correcto, '
        + 'y te da un truco de memoria para no olvidarlo. '
        + 'Tienes 2 sesiones gratis — úsalas en tu primer test.',
      side: 'bottom',
    },
  })

  // ── Step 11: Final CTA ────────────────────────────────────────────
  steps.push({
    popover: {
      title: '¡Estás listo para empezar!',
      description: 'Genera tu primer test de 10 preguntas sobre el Tema 1 de tu oposición. Al terminar, prueba el Tutor IA para que te explique cada error paso a paso.',
    },
  })

  return steps
}
