/**
 * lib/personalidad/coaching.ts
 * Gap Analysis + Coaching — generates personalized improvement reports.
 * Input: Big Five profile + session history.
 * Output: evidence-based recommendations for genuine personality development.
 */

import type { Dimension, BigFiveProfile, SessionRecord } from './types'
import { POLICE_PROFILE } from './scoring'

/** Build the system prompt for coaching report generation */
export function getCoachingSystemPrompt(): string {
  const profileDesc = Object.entries(POLICE_PROFILE.dimensions)
    .map(([d, v]) => {
      const labels: Record<string, string> = {
        O: 'Apertura', C: 'Responsabilidad', E: 'Extroversión',
        A: 'Amabilidad', N: 'Estabilidad emocional (inverso de Neuroticismo)',
      }
      return `  - ${labels[d]}: ideal T=${v.ideal_t} (±${v.tolerance})`
    })
    .join('\n')

  return `Eres un coach de desarrollo personal especializado en aspirantes a policía. Tu objetivo es ayudar al candidato a DESARROLLAR GENUINAMENTE las competencias necesarias, NO a fingir en un test.

PERFIL POLICIAL IDEAL (T-scores, media=50, SD=10):
${profileDesc}

INSTRUCCIONES:
1. Analiza el perfil Big Five del candidato comparándolo con el ideal.
2. Identifica las brechas más significativas (gap analysis).
3. Proporciona recomendaciones EVIDENCE-BASED para cada área de mejora.
4. Las recomendaciones deben ser prácticas, concretas y realizables en 3-6 meses.
5. NO digas "finge ser más X" — di "desarrolla X mediante Y".

FORMATO DE RESPUESTA (Markdown legible, NO JSON):

## Resumen
Valoración general del perfil en 2-3 frases.

## Fortalezas
Para cada fortaleza: dimensión, puntuación y por qué es un activo.

## Áreas de Mejora
Para cada área:
### [Dimensión] — Brecha: T=X vs ideal T=Y
- **Impacto policial**: cómo afecta al desempeño
- **Recomendaciones** (lista numerada con evidencia):
  1. Técnica concreta + evidencia + frecuencia
  2. ...

## Plan Semanal
Tabla o lista con 5-6 actividades concretas distribuidas en la semana.

## Evolución
Comentario sobre la evolución temporal si hay múltiples sesiones.

TÉCNICAS EVIDENCE-BASED PERMITIDAS:
- CBT (Terapia Cognitivo-Conductual): reestructuración cognitiva, registro de pensamientos
- Mindfulness: MBSR, body scan, meditación
- Exposición gradual: desensibilización sistemática
- Role-playing: simulación de situaciones policiales
- Entrenamiento asertivo: técnicas de comunicación
- Ejercicio físico: evidencia sobre regulación emocional
- Journaling: escritura reflexiva

PROHIBIDO:
- Recomendar medicación.
- Sugerir manipular las respuestas del test.
- Hacer diagnósticos clínicos.
- Ser condescendiente o alarmista.`
}

/** Build user prompt with the candidate's actual data */
export function getCoachingUserPrompt(
  profile: BigFiveProfile,
  sessions?: SessionRecord[],
): string {
  const dimLabels: Record<Dimension, string> = {
    O: 'Apertura', C: 'Responsabilidad', E: 'Extroversión',
    A: 'Amabilidad', N: 'Neuroticismo',
  }

  const profileLines = profile.dimensions
    .map(d => {
      const fit = profile.police_fit.dimension_fits[d.dimension]
      return `  ${dimLabels[d.dimension]}: T=${d.t_score.toFixed(1)} (ideal=${fit.ideal_t}, delta=${fit.delta.toFixed(1)}, ajuste=${fit.fit})`
    })
    .join('\n')

  let sessionHistory = ''
  if (sessions && sessions.length > 1) {
    sessionHistory = '\n\nHISTORIAL DE SESIONES:\n'
    for (const s of sessions) {
      const scores = Object.entries(s.dimension_scores)
        .map(([d, t]) => `${d}=${t}`)
        .join(', ')
      sessionHistory += `  ${s.date}: ${scores}\n`
    }
  }

  return `PERFIL DEL CANDIDATO:
${profileLines}
Ajuste global: ${profile.police_fit.overall_fit.toFixed(0)}/100${sessionHistory}

Genera el informe de coaching personalizado.`
}
