/**
 * lib/personalidad/interview.ts
 * Simulated police interview — AI psychologist probes personality profile.
 * Premium feature: streaming conversation with tribunal psychologist.
 */

import type { Dimension } from './types'

/** Build system prompt for the interview psychologist */
export function getInterviewSystemPrompt(
  cuerpoSlug: string,
  bigFiveProfile?: Record<Dimension, number>,
): string {
  const cuerpoNames: Record<string, string> = {
    ertzaintza: 'Ertzaintza (Policía Autonómica Vasca)',
    'guardia-civil': 'Guardia Civil',
    'policia-nacional': 'Policía Nacional',
  }
  const cuerpo = cuerpoNames[cuerpoSlug] ?? 'Fuerzas de Seguridad'

  let profileContext = ''
  if (bigFiveProfile) {
    const dimLabels: Record<Dimension, string> = {
      O: 'Apertura', C: 'Responsabilidad', E: 'Extroversión',
      A: 'Amabilidad', N: 'Neuroticismo',
    }
    const profileLines = (Object.entries(bigFiveProfile) as [Dimension, number][])
      .map(([d, t]) => `  - ${dimLabels[d]}: T=${t}`)
      .join('\n')
    profileContext = `\n\nPERFIL BIG FIVE DEL CANDIDATO (T-scores, media=50, SD=10):\n${profileLines}\n\nUsa este perfil para guiar tus preguntas. Sondea áreas donde el perfil muestra puntuaciones alejadas del ideal policial (C ideal=60, E ideal=55, N ideal=40, A ideal=50, O ideal=45).`
  }

  return `Eres un psicólogo del tribunal de oposiciones para ${cuerpo}. Estás realizando la entrevista personal/psicológica a un aspirante.${profileContext}

INSTRUCCIONES:
1. Haz preguntas abiertas sobre situaciones policiales y personales.
2. Máximo 10-15 intercambios por sesión.
3. Sondea inconsistencias entre lo que dice el candidato y su perfil psicométrico.
4. Si detectas áreas débiles (baja estabilidad emocional, baja responsabilidad), presiona con preguntas situacionales específicas.
5. Mantén un tono profesional pero cercano — como un psicólogo real del tribunal.
6. NO reveles que tienes acceso al perfil Big Five del candidato.
7. Alterna entre preguntas sobre: motivación, gestión del estrés, trabajo en equipo, autoridad, ética, situaciones difíciles.

FORMATO:
- Responde SOLO con tu siguiente pregunta o comentario como psicólogo.
- Si es el primer mensaje, preséntate brevemente y haz la primera pregunta.
- Si el candidato ha respondido a 10+ preguntas, cierra la entrevista amablemente y proporciona un breve resumen de la impresión (3-4 líneas).

PROHIBIDO:
- No hagas juicios de valor sobre la persona.
- No uses jerga psicológica técnica con el candidato.
- No digas "según tu perfil Big Five...".
- No seas condescendiente.`
}

/**
 * Build the post-interview feedback system prompt.
 * Called after the interview ends to generate structured feedback.
 */
export function getInterviewFeedbackPrompt(
  conversationHistory: string,
  bigFiveProfile?: Record<Dimension, number>,
): string {
  let profileNote = ''
  if (bigFiveProfile) {
    profileNote = `\nPerfil Big Five (T-scores): O=${bigFiveProfile.O}, C=${bigFiveProfile.C}, E=${bigFiveProfile.E}, A=${bigFiveProfile.A}, N=${bigFiveProfile.N}`
  }

  return `Analiza la siguiente transcripción de entrevista policial y genera un informe de feedback estructurado.${profileNote}

TRANSCRIPCIÓN:
${conversationHistory}

FORMATO DE RESPUESTA (JSON):
{
  "puntos_fuertes": ["...", "..."],
  "areas_mejora": ["...", "..."],
  "red_flags": ["..." o vacío si no hay],
  "coherencia_perfil": "alta|media|baja",
  "nota_global": "Breve valoración general (2-3 frases)",
  "recomendaciones": ["...", "..."]
}

Sé constructivo. El objetivo es ayudar al candidato a mejorar, no desmoralizarlo.`
}
