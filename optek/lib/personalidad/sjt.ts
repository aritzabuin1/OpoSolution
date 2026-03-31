/**
 * lib/personalidad/sjt.ts
 * Situational Judgment Test — generates police scenarios with ranked options.
 * Adapted per cuerpo: Ertzaintza (Basque context), GC (rural/military), PN (urban).
 */

import type { Dimension } from './types'

/** SJT scenario structure */
export interface SJTScenario {
  escenario: string
  opciones: string[]
  ranking_ideal: number[]  // ideal ranking of options (0-indexed)
  dimension_focus: Dimension
  cuerpo_context: string
}

/** SJT response and scoring */
export interface SJTResponse {
  user_ranking: number[]  // user's ranking of options
}

export interface SJTResult {
  concordancia: number  // 0-100, how well user ranking matches ideal
  dimension_focus: Dimension
  feedback: string
}

/** Context descriptions per cuerpo for prompt injection */
const CUERPO_CONTEXT: Record<string, string> = {
  ertzaintza: 'Ertzaintza (Policía Autonómica Vasca). Contexto: comunidad bilingüe (euskera/castellano), policía de proximidad, coordinación con policías municipales del País Vasco, sensibilidad cultural vasca.',
  'guardia-civil': 'Guardia Civil. Contexto: naturaleza militar, despliegue rural y periurbano, tráfico, medio ambiente, costas, control de fronteras, disciplina jerárquica estricta.',
  'policia-nacional': 'Policía Nacional. Contexto: ámbito urbano, investigación criminal, extranjería, documentación, orden público en grandes ciudades, trabajo en comisarías.',
}

/**
 * Build the system prompt for SJT scenario generation.
 * Called by the API endpoint with the user's cuerpo.
 */
export function getSJTSystemPrompt(cuerpoSlug: string): string {
  const context = CUERPO_CONTEXT[cuerpoSlug] ?? CUERPO_CONTEXT['policia-nacional']

  return `Eres un psicólogo experto en selección policial española. Tu tarea es crear escenarios de Juicio Situacional (SJT) realistas para aspirantes a ${context}

INSTRUCCIONES:
1. Crea UN escenario policial realista y específico al cuerpo indicado.
2. Proporciona exactamente 5 opciones de respuesta, ordenadas de mejor (1) a peor (5).
3. Las opciones deben cubrir un espectro: la ideal (profesional, proporcionada), buenas alternativas, opciones mediocres, y una claramente inadecuada.
4. Indica qué dimensión Big Five evalúa principalmente: O (Apertura), C (Responsabilidad), E (Extroversión), A (Amabilidad), N (Neuroticismo/Estabilidad emocional).

FORMATO DE RESPUESTA (JSON estricto):
{
  "escenario": "Descripción detallada de la situación (3-4 frases)",
  "opciones": ["Opción 1 (mejor)", "Opción 2", "Opción 3", "Opción 4", "Opción 5 (peor)"],
  "ranking_ideal": [0, 1, 2, 3, 4],
  "dimension_focus": "C",
  "explicacion": "Por qué este ranking es el ideal desde la perspectiva policial"
}

REGLAS:
- Escenarios REALISTAS que un agente podría encontrar en su primer año.
- NO situaciones extremas (tiroteos, terrorismo) — enfócate en el día a día.
- Las opciones NO deben ser obvias — deben requerir juicio real.
- Adapta el escenario al contexto específico del cuerpo.
- Responde SOLO con el JSON, sin texto adicional.`
}

/**
 * Build the user prompt requesting a specific dimension focus.
 */
export function getSJTUserPrompt(dimensionFocus?: Dimension): string {
  if (dimensionFocus) {
    const dimNames: Record<Dimension, string> = {
      O: 'Apertura a la experiencia',
      C: 'Responsabilidad/Consciencia',
      E: 'Extroversión',
      A: 'Amabilidad/Cooperación',
      N: 'Estabilidad emocional (bajo Neuroticismo)',
    }
    return `Genera un escenario SJT que evalúe principalmente la dimensión: ${dimNames[dimensionFocus]}.`
  }
  return 'Genera un escenario SJT que evalúe la dimensión que consideres más relevante para el perfil policial.'
}

/**
 * Score user's ranking against the ideal ranking.
 * Uses Spearman's footrule distance normalized to 0-100.
 * 100 = perfect match, 0 = worst possible.
 */
export function scoreSJTResponse(idealRanking: number[], userRanking: number[]): number {
  if (idealRanking.length !== userRanking.length) return 0
  const n = idealRanking.length

  // Create position maps
  const idealPos = new Map<number, number>()
  const userPos = new Map<number, number>()
  for (let i = 0; i < n; i++) {
    idealPos.set(idealRanking[i], i)
    userPos.set(userRanking[i], i)
  }

  // Spearman's footrule: sum of |ideal_position - user_position|
  let footrule = 0
  for (let item = 0; item < n; item++) {
    footrule += Math.abs((idealPos.get(item) ?? 0) - (userPos.get(item) ?? 0))
  }

  // Maximum possible footrule for n items = floor(n²/2)
  const maxFootrule = Math.floor(n * n / 2)

  // Normalize to 0-100 (inverted: 0 distance = 100 score)
  return Math.round((1 - footrule / maxFootrule) * 100)
}

/**
 * Generate feedback based on SJT score.
 */
export function getSJTFeedback(score: number): string {
  if (score >= 90) return 'Excelente juicio situacional. Tu criterio se alinea muy bien con el perfil policial ideal.'
  if (score >= 70) return 'Buen juicio situacional. Algunas opciones podrían priorizarse mejor, pero tu criterio general es sólido.'
  if (score >= 50) return 'Juicio situacional moderado. Hay margen de mejora en la priorización de respuestas. Reflexiona sobre la proporcionalidad y el protocolo.'
  return 'Tu priorización difiere significativamente del ideal. Te recomendamos repasar los principios de actuación policial y proporcionalidad.'
}
