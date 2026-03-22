/**
 * lib/constants/demo-analysis.ts
 *
 * Contenido hardcodeado para el demo de análisis con IA.
 * Pregunta real basada en Art. 14.2 Ley 39/2015 (LPACAP).
 * Reutilizado en: landing page, dashboard nudge, onboarding tour.
 *
 * Formato v2: diagnóstico → explicación → truco → acción
 * (reemplaza el antiguo 4-step socrático: empatía/pregunta/revelación/anclaje)
 */

export const DEMO_QUESTION = {
  enunciado:
    'Según la Ley 39/2015, ¿quiénes están obligados a relacionarse electrónicamente con las Administraciones Públicas?',
  opciones: [
    'Todas las personas físicas',
    'Solo las personas jurídicas',
    'Personas jurídicas, entidades sin personalidad jurídica, profesionales colegiados y empleados públicos',
    'Solo los empleados de las Administraciones Públicas',
  ],
  correcta: 2,
  respuestaUsuario: 1,
  cita: 'Art. 14.2 Ley 39/2015',
} as const

export interface DemoAnalysisStep {
  type: 'diagnostico' | 'explicacion' | 'truco' | 'accion'
  label: string
  text: string
}

export const DEMO_ANALYSIS_STEPS: DemoAnalysisStep[] = [
  {
    type: 'diagnostico',
    label: 'Diagnóstico',
    text: 'Tu error es un clásico del INAP: la lista de obligados a tramitar electrónicamente parece obvia, pero tiene 4 grupos que la gente reduce a 1.',
  },
  {
    type: 'explicacion',
    label: 'Por qué fallas esto',
    text: 'Art. 14.2 Ley 39/2015 enumera 4 obligados: personas jurídicas, entidades sin personalidad jurídica, profesionales con colegiación obligatoria y empleados públicos. Elegiste solo personas jurídicas — es el grupo más visible, pero la ley amplía a todos los que ya usan firma electrónica en su día a día.',
  },
  {
    type: 'truco',
    label: 'Truco de memoria',
    text: 'Los 4 obligados son quienes ya firman digitalmente: empresas, asociaciones, abogados/arquitectos y funcionarios. Si ya usan firma electrónica, ¿por qué iban a tramitar en papel?',
  },
  {
    type: 'accion',
    label: 'Qué hacer ahora',
    text: 'Repasa las flashcards del Tema 15 (La Administración Electrónica) — este artículo cae en casi todas las convocatorias.',
  },
]
