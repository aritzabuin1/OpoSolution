/**
 * lib/constants/demo-analysis.ts
 *
 * Contenido hardcodeado para el demo de análisis con IA.
 * Pregunta real basada en Art. 14.2 Ley 39/2015 (LPACAP).
 * Reutilizado en: landing page, dashboard nudge, onboarding tour.
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
  type: 'empatia' | 'pregunta' | 'revelacion' | 'anclaje'
  label: string
  text: string
}

export const DEMO_ANALYSIS_STEPS: DemoAnalysisStep[] = [
  {
    type: 'empatia',
    label: 'Empatía',
    text: 'Pensaste solo las personas jurídicas — es lógico, son las más evidentes. Pero la ley amplía la obligación a más colectivos.',
  },
  {
    type: 'pregunta',
    label: 'Pregunta guía',
    text: '¿Qué otros grupos manejan documentación profesional a diario y ya usan firma electrónica?',
  },
  {
    type: 'revelacion',
    label: 'Revelación',
    text: 'Art. 14.2 Ley 39/2015 enumera 4 obligados: a) personas jurídicas, b) entidades sin personalidad jurídica, c) profesionales con colegiación obligatoria, d) empleados de las AAPP.',
  },
  {
    type: 'anclaje',
    label: 'Truco de memoria',
    text: 'Los 4 obligados son quienes ya firman digitalmente en su día a día — empresas, asociaciones, abogados/arquitectos y funcionarios. Si ya usan firma electrónica, ¿por qué iban a tramitar en papel?',
  },
]
