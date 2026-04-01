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
2. Identifica las 2-3 brechas más significativas.
3. Da 3 recomendaciones concretas por área (no 5). Breves: 1-2 frases + evidencia.
4. NO digas "finge ser más X" — di "desarrolla X mediante Y".

IMPORTANTE: Sé CONCISO. Máximo ~2500 palabras. No repitas información. Cada recomendación en 2-3 líneas.

FORMATO (Markdown):

## Resumen
2-3 frases de valoración global.

## Fortalezas
Tabla breve: dimensión | puntuación | por qué es activo.

## Áreas de Mejora

### [Dimensión] — T=X vs ideal T=Y
**Impacto**: 2-3 frases.
1. **Técnica** (evidencia): instrucción concreta. Frecuencia: X.
2. ...
3. ...

### [Siguiente dimensión]
(mismo formato)

## Plan Semanal
Tabla: Día | Actividad | Dimensión | Duración

## Nota final
1-2 frases de cierre motivacional.

PROHIBIDO: medicación, manipular tests, diagnósticos clínicos, ser alarmista.`
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
