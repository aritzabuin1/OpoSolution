/**
 * lib/ai/prompts.ts — OPTEK §1.7.1, §1.7.2
 *
 * System prompts y user prompt builders para los pipelines de IA.
 *
 * Decisiones de diseño:
 *   - System prompts como constantes de módulo: inmutables, fáciles de versionar
 *   - User prompts como funciones tipadas: previenen errores de interpolación
 *   - Temperaturas definidas en claude.ts → importadas aquí si fuera necesario
 *
 * Temperaturas recomendadas (ver TEMPERATURES en claude.ts):
 *   GENERATE_TEST     → 0.3  (reproducibilidad: preguntas consistentes)
 *   CORRECT_DESARROLLO → 0.4  (algo de variedad en feedback sin inventar datos)
 */

// ─── System Prompts ───────────────────────────────────────────────────────────

/**
 * System prompt para generación de tests MCQ.
 *
 * Temperatura recomendada: 0.3 — reproducible para preguntas bien determinadas
 * por el texto legal. Alta temperatura produciría respuestas inconsistentes.
 *
 * REGLA CRÍTICA: SOLO usa el contexto legislativo proporcionado en el user prompt.
 * No completar con conocimiento general del modelo.
 */
export const SYSTEM_GENERATE_TEST = `Eres un experto en oposiciones a la Administración General del Estado española.
Tu tarea es generar preguntas tipo test de opción múltiple (MCQ) para el examen de Auxiliar Administrativo del Estado.

REGLAS OBLIGATORIAS:
1. SOLO usa información del CONTEXTO LEGISLATIVO proporcionado. Nunca inventes artículos ni datos.
2. Cada pregunta DEBE citar el artículo exacto de la ley que la fundamenta (campo "cita").
3. Las opciones incorrectas (distractores) deben ser plausibles pero claramente erróneas según el texto legal.
4. El campo "textoExacto" de la cita debe ser una frase literal copiada del artículo, máximo 100 caracteres.
5. Responde ÚNICAMENTE con JSON válido siguiendo el schema indicado.
6. Dificultad: sigue las instrucciones del usuario (fácil/media/difícil).
7. Los plazos, números y porcentajes deben ser EXACTAMENTE los del texto legal.

FORMATO DE RESPUESTA (JSON estricto):
{
  "preguntas": [
    {
      "enunciado": "Según el artículo X de la Ley Y, ...",
      "opciones": ["opción A", "opción B", "opción C", "opción D"],
      "correcta": 0,
      "explicacion": "La respuesta correcta es A porque el artículo X establece que...",
      "dificultad": "media",
      "cita": {
        "ley": "LPAC",
        "articulo": "53",
        "textoExacto": "Los interesados en un procedimiento..."
      }
    }
  ]
}

El campo "dificultad" debe coincidir con el nivel solicitado para el test ("facil", "media" o "dificil").` as const

/**
 * System prompt para generación de tests MCQ de Bloque II (ofimática e informática).
 *
 * Diferencias respecto a SYSTEM_GENERATE_TEST (Bloque I legal):
 *   - NO se citan artículos de leyes — se referencia la funcionalidad del software
 *   - Guardrail crítico: SOLO rutas de menú y atajos que aparezcan LITERALMENTE en el contexto
 *   - El campo "cita" se omite; la explicación debe ser autosuficiente
 *
 * Temperatura recomendada: 0.3 — determinismo alto para evitar inventar rutas de menú
 */
export const SYSTEM_GENERATE_TEST_BLOQUE2 = `Eres un experto en oposiciones a la Administración General del Estado española.
Tu tarea es generar preguntas tipo test (MCQ) sobre ofimática e informática para el examen de Auxiliar Administrativo.

REGLAS OBLIGATORIAS:
1. SOLO usa información del CONTEXTO TÉCNICO proporcionado. Nunca inventes rutas de menú, atajos de teclado ni funcionalidades.
2. Las rutas de menú deben existir LITERALMENTE en el contexto (ej: "Pestaña Inicio > Fuente > Negrita").
3. Los atajos de teclado deben aparecer en el contexto (ej: "Ctrl+B para negrita").
4. Las opciones incorrectas deben ser plausibles pero erróneas según el contexto — no inventes comandos o rutas falsas.
5. Responde ÚNICAMENTE con JSON válido siguiendo el schema indicado.
6. NO incluyas el campo "cita" — no aplica para preguntas de ofimática.
7. Nivel de dificultad BÁSICO: operaciones cotidianas de oficina, no funcionalidades avanzadas.

FORMATO DE RESPUESTA (JSON estricto, SIN campo "cita"):
{
  "preguntas": [
    {
      "enunciado": "¿Cuál es el atajo de teclado para...",
      "opciones": ["Ctrl+B", "Ctrl+I", "Ctrl+U", "Ctrl+N"],
      "correcta": 0,
      "explicacion": "El atajo Ctrl+B aplica el formato Negrita en Word 365.",
      "dificultad": "facil"
    }
  ]
}

El campo "dificultad" debe coincidir con el nivel solicitado ("facil", "media" o "dificil").` as const

/**
 * System prompt para corrección de desarrollos escritos.
 *
 * Temperatura recomendada: 0.4 — permite algo de variedad en el feedback
 * sin comprometer la precisión jurídica de la evaluación.
 *
 * Evalúa tres dimensiones independientes para dar feedback granular
 * y accionable al opositor.
 */
export const SYSTEM_CORRECT_DESARROLLO = `Eres un corrector experto en oposiciones a la Administración General del Estado española.
Tu tarea es evaluar un desarrollo escrito de un opositor sobre un tema jurídico-administrativo.

CRITERIOS DE EVALUACIÓN (puntuación 0-10 cada dimensión):
- dimension_juridica: corrección de los fundamentos legales citados
- dimension_argumentacion: coherencia y profundidad del razonamiento
- dimension_estructura: organización, claridad y presentación

REGLAS:
1. Si el opositor cita un artículo, verifica que la afirmación sea coherente con ese artículo.
2. Señala errores jurídicos concretos (confusión de plazos, órganos incorrectos, etc.).
3. Las "mejoras" deben ser accionables y específicas (máximo 5).
4. "citas_usadas" son las citas legales que TÚ usas para fundamentar la corrección.
5. Responde ÚNICAMENTE con JSON válido.

FORMATO DE RESPUESTA (JSON estricto):
{
  "puntuacion": 7.5,
  "feedback": "El desarrollo demuestra buen conocimiento...",
  "mejoras": ["Especificar el plazo del art. 21 LPAC", "..."],
  "citas_usadas": [{"ley": "LPAC", "articulo": "21", "textoExacto": "..."}],
  "dimension_juridica": 8,
  "dimension_argumentacion": 7,
  "dimension_estructura": 8
}` as const

// ─── User Prompt Builders ─────────────────────────────────────────────────────

/**
 * Construye el user prompt para generación de tests MCQ.
 *
 * @param params.contextoLegislativo  - Fragmentos de artículos extraídos por RAG
 * @param params.numPreguntas         - Número de preguntas a generar (1–30)
 * @param params.dificultad           - Nivel de dificultad solicitado
 * @param params.temaTitulo           - Título del tema (para contextualizar enunciados)
 */
export function buildGenerateTestPrompt(params: {
  contextoLegislativo: string
  numPreguntas: number
  dificultad: 'facil' | 'media' | 'dificil'
  temaTitulo: string
}): string {
  const { contextoLegislativo, numPreguntas, dificultad, temaTitulo } = params

  const dificultadLabel: Record<typeof dificultad, string> = {
    facil: 'FÁCIL — preguntas directas sobre definiciones y conceptos básicos',
    media: 'MEDIA — preguntas que requieren comprensión de relaciones entre artículos',
    dificil:
      'DIFÍCIL — preguntas sobre excepciones, plazos específicos y casos complejos',
  }

  return `TEMA: ${temaTitulo}
NÚMERO DE PREGUNTAS: ${numPreguntas}
DIFICULTAD: ${dificultadLabel[dificultad]}

CONTEXTO LEGISLATIVO (usa ÚNICAMENTE este texto para formular las preguntas):
---
${contextoLegislativo}
---

Genera exactamente ${numPreguntas} pregunta(s) basándote SOLO en el contexto legislativo anterior.`
}

/**
 * Construye el user prompt para generación de tests MCQ de Bloque II (ofimática).
 * Usa "CONTEXTO TÉCNICO" en lugar de "CONTEXTO LEGISLATIVO" para evitar confusión.
 *
 * @param params.contextoTecnico  - Secciones de conocimiento_tecnico (Microsoft Support, etc.)
 * @param params.numPreguntas     - Número de preguntas a generar (1–30)
 * @param params.dificultad       - Nivel de dificultad solicitado
 * @param params.temaTitulo       - Título del tema (ej: "Word 365", "Excel 365")
 */
export function buildGenerateTestBloque2Prompt(params: {
  contextoTecnico: string
  numPreguntas: number
  dificultad: 'facil' | 'media' | 'dificil'
  temaTitulo: string
}): string {
  const { contextoTecnico, numPreguntas, dificultad, temaTitulo } = params

  const dificultadLabel: Record<typeof dificultad, string> = {
    facil: 'FÁCIL — operaciones básicas cotidianas, menús principales, atajos comunes',
    media: 'MEDIA — funcionalidades intermedias, opciones de formato, configuración básica',
    dificil: 'DIFÍCIL — funcionalidades avanzadas, combinaciones de herramientas, casos de uso específicos',
  }

  return `TEMA: ${temaTitulo}
NÚMERO DE PREGUNTAS: ${numPreguntas}
DIFICULTAD: ${dificultadLabel[dificultad]}

CONTEXTO TÉCNICO (usa ÚNICAMENTE este texto — no inventes rutas de menú ni atajos):
---
${contextoTecnico}
---

Genera exactamente ${numPreguntas} pregunta(s) basándote SOLO en el contexto técnico anterior.
NO incluyas el campo "cita" en las respuestas.`
}

/**
 * Construye el user prompt para corrección de desarrollos escritos.
 *
 * @param params.contextoLegislativo  - Fragmentos de artículos relevantes para el tema
 * @param params.textoUsuario         - Texto del desarrollo escrito por el opositor
 * @param params.temaTitulo           - Título del tema evaluado
 */
export function buildCorrectDesarrolloPrompt(params: {
  contextoLegislativo: string
  textoUsuario: string
  temaTitulo: string
}): string {
  const { contextoLegislativo, textoUsuario, temaTitulo } = params

  return `TEMA A EVALUAR: ${temaTitulo}

MARCO LEGISLATIVO DE REFERENCIA (para verificar citas del opositor):
---
${contextoLegislativo}
---

DESARROLLO DEL OPOSITOR:
---
${textoUsuario}
---

Evalúa el desarrollo anterior según los criterios indicados. Proporciona feedback constructivo y accionable.`
}

// ─── §2.12 Caza-Trampas ───────────────────────────────────────────────────────

/**
 * System prompt para el modo Caza-Trampas.
 * Instruye al modelo a inyectar N errores sutiles en un fragmento legal.
 *
 * Reglas críticas:
 *   - valor_original debe ser una subcadena literal del texto_original
 *   - valor_trampa reemplaza valor_original en texto_trampa
 *   - Los errores deben ser sutiles: plazos, porcentajes, sujetos jurídicos, verbos
 *   - NO inventar artículos, NO cambiar la estructura del texto
 */
export const SYSTEM_CAZATRAMPAS = `Eres un experto en derecho administrativo español especializado en la preparación de opositores a la Administración General del Estado.

Tu tarea es crear un ejercicio de "Caza-Trampas": recibirás un fragmento de un artículo legal y deberás inyectar exactamente N errores sutiles para que el opositor los detecte y corrija.

REGLAS ABSOLUTAS que DEBES cumplir:
1. Cada error.valor_original debe ser una subcadena LITERAL del texto_original que te proporciono (case-sensitive, sin modificar espacios ni puntuación alrededor).
2. En el texto_trampa, sustituye exactamente valor_original por valor_trampa (sin cambiar nada más a su alrededor).
3. Los errores deben ser SUTILES y REALISTAS:
   - Cambiar plazos: "10 días hábiles" → "15 días hábiles"
   - Cambiar porcentajes: "un tercio" → "un cuarto"
   - Cambiar sujetos jurídicos: "el ciudadano" → "el administrado"
   - Cambiar verbos deónticos: "podrá" → "deberá"
   - Cambiar cifras: "tres meses" → "seis meses"
4. NO inventes contenido nuevo. Solo modifica valores ya existentes.
5. Asegúrate de que texto_trampa contenga EXACTAMENTE los errores descritos, sin errores adicionales.

Responde ÚNICAMENTE con JSON válido en este formato exacto:
{
  "texto_trampa": "El texto con los errores inyectados (debe ser casi idéntico al original salvo los cambios exactos)",
  "errores_reales": [
    {
      "tipo": "plazo|porcentaje|sujeto|verbo|cifra|otro",
      "valor_original": "subcadena literal del texto original",
      "valor_trampa": "lo que aparece en texto_trampa en su lugar",
      "explicacion": "Por qué este es un error y cuál es el valor correcto"
    }
  ]
}`

/**
 * User prompt para generar un ejercicio Caza-Trampas.
 */
export function buildCazaTrampasPrompt(params: {
  textoOriginal: string
  leyNombre: string
  articuloNumero: string
  numErrores: number
}): string {
  const { textoOriginal, leyNombre, articuloNumero, numErrores } = params

  return `Texto original del ${leyNombre}, Artículo ${articuloNumero}:

---
${textoOriginal}
---

Inyecta exactamente ${numErrores} error${numErrores !== 1 ? 'es' : ''} sutil${numErrores !== 1 ? 'es' : ''} en el texto anterior siguiendo las reglas indicadas. Recuerda: valor_original debe ser una subcadena literal del texto.`
}
