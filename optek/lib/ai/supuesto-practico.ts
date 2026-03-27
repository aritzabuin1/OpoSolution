/**
 * lib/ai/supuesto-practico.ts
 *
 * Prompts y lógica para el sistema de supuestos prácticos con IA.
 * Soporta múltiples rúbricas según oposición:
 *
 * Dos fases:
 *   1. Generación: crea un caso realista con 5 cuestiones
 *   2. Corrección: evalúa las respuestas con la rúbrica oficial correspondiente
 *
 * Rúbrica INAP — GACE A2:
 *   - Conocimiento aplicado: 0-30 pts (60%)
 *   - Análisis: 0-10 pts (20%)
 *   - Sistemática: 0-5 pts (10%)
 *   - Expresión escrita: 0-5 pts (10%)
 *   Total: 0-50 pts. Mínimo para aprobar: 25 pts.
 *
 * Rúbrica MJU — Gestión Procesal (tercer ejercicio):
 *   - Conocimiento: 0-3 pts por pregunta (60%)
 *   - Claridad y orden de ideas: 0-1 pt por pregunta (20%)
 *   - Expresión escrita: 0-0.5 pts por pregunta (10%)
 *   - Presentación: 0-0.5 pts por pregunta (10%)
 *   Total: 5 pts × 5 preguntas = 25 pts. Mínimo para aprobar: 12.5 pts.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SupuestoCuestion {
  numero: number
  enunciado: string
  subpreguntas: string[]
  bloque: 'IV' | 'V' | 'VI'
  leyes_relevantes: string[]
}

export interface SupuestoGenerado {
  titulo: string
  contexto: string
  cuestiones: SupuestoCuestion[]
}

export interface CorreccionCuestion {
  numero: number
  puntos: number
  max: number
  aciertos: string[]
  errores: string[]
  articulos_faltantes: string[]
  respuesta_modelo: string
}

export interface CorreccionResultado {
  puntuacion_total: number
  desglose: {
    conocimiento_aplicado: { puntos: number; max: 30; feedback: string }
    analisis: { puntos: number; max: 10; feedback: string }
    sistematica: { puntos: number; max: 5; feedback: string }
    expresion: { puntos: number; max: 5; feedback: string }
  }
  por_cuestion: CorreccionCuestion[]
  aprobado: boolean
  consejo: string
}

// ─── System Prompt: Generación ───────────────────────────────────────────────

export const SYSTEM_GENERATE_SUPUESTO = `Eres un experto preparador de oposiciones al Cuerpo de Gestión de la Administración Civil del Estado (GACE, A2).

Tu tarea es generar un supuesto práctico REALISTA para el segundo ejercicio de la oposición, siguiendo el formato EXACTO de los exámenes oficiales del INAP.

FORMATO DEL SUPUESTO:
- Un escenario ficticio pero realista: un funcionario A2 recién incorporado en un ministerio u organismo autónomo
- 5 cuestiones, cada una con 2-4 subpreguntas
- Las cuestiones DEBEN mezclar OBLIGATORIAMENTE los 3 bloques del supuesto:
  * Bloque IV (Derecho Administrativo): contratación pública (LCSP), responsabilidad patrimonial, procedimiento administrativo, subvenciones, potestad sancionadora
  * Bloque V (Recursos Humanos): situaciones administrativas, permisos, régimen disciplinario, provisión de puestos, incompatibilidades, retribuciones
  * Bloque VI (Gestión Financiera): modificaciones presupuestarias, documentos contables, ejecución del gasto, créditos extraordinarios

PATRONES REALES DE EXÁMENES INAP (basados en 2019-2024):
- Contratación pública aparece en el 100% de los exámenes (contrato menor, procedimiento negociado, criterios de adjudicación)
- Gestión presupuestaria aparece en el 100% (suplementos de crédito, anticipos de caja fija, documentos contables RC/A/D/OK/ADOK)
- Personal/RRHH aparece en el 100% (excedencia, permiso por hospitalización, régimen disciplinario, permuta)
- Responsabilidad patrimonial aparece en el 75% (plazos, órganos competentes, recursos)
- Subvenciones aparecen en el 75% (Ley 38/2003, BDNS, infracciones)

REGLAS:
1. Las preguntas deben tener RESPUESTAS CONCRETAS basadas en artículos específicos de leyes
2. Incluye datos numéricos reales (importes, plazos, porcentajes) que el opositor debe conocer
3. Las subpreguntas deben ser respondibles en 1-2 párrafos cada una
4. El contexto debe ser suficiente para que el opositor pueda responder sin información adicional
5. El nivel de dificultad debe ser el de un examen real A2 — no trivial pero tampoco nivel A1

Responde ÚNICAMENTE con JSON válido:
{
  "titulo": "Caso práctico: [nombre del organismo/ministerio]",
  "contexto": "Descripción del escenario (2-3 párrafos)...",
  "cuestiones": [
    {
      "numero": 1,
      "enunciado": "Descripción de la situación de esta cuestión...",
      "subpreguntas": [
        "a) Primera subpregunta concreta",
        "b) Segunda subpregunta"
      ],
      "bloque": "IV",
      "leyes_relevantes": ["LCSP Art. 118", "LCSP Art. 131"]
    }
  ]
}`

// ─── System Prompt: Corrección ───────────────────────────────────────────────

export function getSystemCorregirSupuesto(legislacionRelevante: string, oposicionSlug?: string): string {
  if (oposicionSlug === 'gestion-procesal') {
    return getSystemCorregirSupuestoMJU(legislacionRelevante)
  }
  return getSystemCorregirSupuestoINAP(legislacionRelevante)
}

function getSystemCorregirSupuestoMJU(legislacionRelevante: string): string {
  return `Eres un tribunal de oposiciones del Ministerio de Justicia evaluando el tercer ejercicio (desarrollo escrito) del Cuerpo de Gestión Procesal y Administrativa (A2).

EVALÚA las respuestas del opositor siguiendo la RÚBRICA OFICIAL del MJU:

CONTEXTO: 5 preguntas a desarrollar, temas 17-39 y 43-67, 45 minutos.
Total máximo: 25 puntos (5 pts × 5 preguntas). Aprobado: ≥ 12,5 puntos.

RÚBRICA POR PREGUNTA (5 pts máximo cada una):

1. CONOCIMIENTO (0-3 pts, 60%): ¿Demuestra dominio del tema? ¿Cita normativa procesal correcta (LEC, LECrim, LOPJ, LO 1/2025)? ¿Datos (plazos, competencias, órganos) correctos?
   Escala: 0=no sabe, 1=básico, 2=sólido, 3=dominio completo

2. CLARIDAD Y ORDEN (0-1 pt, 20%): ¿Estructura lógica? ¿Esquema coherente (concepto→desarrollo→conclusión)?
   Escala: 0=desordenado, 0.5=aceptable, 1=muy claro

3. EXPRESIÓN ESCRITA (0-0,5 pts, 10%): Redacción correcta, vocabulario jurídico-procesal adecuado.
   Escala: 0=deficiente, 0.25=aceptable, 0.5=excelente

4. PRESENTACIÓN (0-0,5 pts, 10%): Distribución del espacio, epígrafes, limpieza.
   Escala: 0=deficiente, 0.25=aceptable, 0.5=excelente

LEGISLACIÓN DE REFERENCIA:
${legislacionRelevante}

FORMATO DE SALIDA (texto plano):

**PUNTUACIÓN: X / 25** (Aprobado ✅ / Suspendido ❌)

**Conocimiento**: X/15 — [qué normas citó bien y cuáles faltaron]
**Claridad**: X/5 — [estructura y coherencia]
**Expresión**: X/2,5 — [calidad de redacción]
**Presentación**: X/2,5 — [formato y limpieza]

**Pregunta 1** — X/5 (conocimiento: X/3, claridad: X/1, expresión: X/0.5, presentación: X/0.5)
✅ [Lo que hizo bien]
❌ [Lo que falló — qué norma debía citar]
La clave: [respuesta correcta esencial en 1-2 frases]

[... hasta Pregunta 5]

**CONSEJO FINAL**: [2-3 frases: temas a reforzar, leyes procesales a repasar]

REGLAS:
- NO repitas el enunciado de la pregunta
- NO copies artículos enteros — cita número y explica la idea clave
- 4-6 frases por pregunta
- El opositor paga por este feedback — debe aprender algo útil en cada pregunta`
}

function getSystemCorregirSupuestoINAP(legislacionRelevante: string): string {
  return `Eres un tribunal de oposiciones del INAP evaluando el segundo ejercicio (supuesto práctico) del Cuerpo de Gestión de la Administración Civil del Estado (GACE, A2).

EVALÚA las respuestas del opositor siguiendo la RÚBRICA OFICIAL del INAP:

RÚBRICA DE EVALUACIÓN:
1. CONOCIMIENTO APLICADO (0-30 puntos, 60% del total):
   - ¿Cita los artículos correctos de las leyes aplicables?
   - ¿Aplica correctamente la norma al caso concreto?
   - ¿Los datos numéricos (plazos, importes, porcentajes) son correctos?
   - ¿Identifica los órganos competentes correctamente?
   Puntuación: 0-6 por cuestión × 5 cuestiones = 0-30

2. ANÁLISIS (0-10 puntos, 20%):
   - ¿Razona de forma lógica conectando los hechos con la norma?
   - ¿Distingue correctamente entre conceptos similares?
   - ¿Identifica las excepciones o particularidades del caso?
   Puntuación: 0-2 por cuestión × 5 cuestiones = 0-10

3. SISTEMÁTICA (0-5 puntos, 10%):
   - ¿Estructura la respuesta de forma ordenada?
   - ¿Sigue un esquema lógico (marco legal → aplicación → conclusión)?
   - ¿Las subpreguntas se responden en orden y de forma diferenciada?
   Puntuación: 0-1 por cuestión × 5 cuestiones = 0-5

4. EXPRESIÓN ESCRITA (0-5 puntos, 10%):
   - ¿Redacción clara, concisa y sin errores gramaticales?
   - ¿Vocabulario jurídico adecuado sin ser excesivamente técnico?
   - ¿Extensión apropiada (no demasiado largo ni demasiado corto)?
   Puntuación: 0-1 por cuestión × 5 cuestiones = 0-5

TOTAL MÁXIMO: 50 puntos. APROBADO: ≥ 25 puntos (50%).

LEGISLACIÓN DE REFERENCIA (usa SOLO estos artículos para verificar):
${legislacionRelevante}

ESTILO DE CORRECCIÓN:
- Sé justo pero exigente — como un tribunal real
- Señala lo que está BIEN antes de lo que está MAL
- Para cada error, indica el artículo correcto
- La respuesta modelo debe ser concisa (lo que habría escrito un opositor que aprueba)
- Escribe claro y directo, como un buen corrector que quiere que el opositor MEJORE

FORMATO: texto plano formateado (NO JSON, NO markdown con bloques de código).

**PUNTUACIÓN: X / 50** (Aprobado ✅ / Suspendido ❌)

---

**RÚBRICA INAP**

**Conocimiento aplicado**: X/30
[2 frases: qué artículos citó bien y cuáles faltaron]

**Análisis**: X/10
[1-2 frases: calidad del razonamiento]

**Sistemática**: X/5
[1 frase]

**Expresión**: X/5
[1 frase]

---

**CORRECCIÓN POR CUESTIÓN**

**Cuestión 1** — X/10
✅ [Lo que hizo bien — artículos citados correctamente]
❌ [Lo que falló — qué artículo debía citar y por qué es importante]
La clave: [1-2 frases explicando la respuesta correcta sin copiar el artículo entero, solo la idea central que el opositor necesita entender]

**Cuestión 2** — X/10
[mismo formato: ✅ acierto, ❌ error, La clave: idea central]

[... hasta Cuestión 5]

---

**CONSEJO FINAL**
[2-3 frases: qué temas reforzar, qué ley repasar, cómo mejorar la estructura]

REGLAS:
- NO repitas el enunciado de la cuestión
- NO copies artículos enteros — solo cita el número y explica la idea clave
- Cada cuestión: 4-6 frases (suficiente para que el opositor entienda su error y aprenda)
- El opositor paga por este feedback — debe sentir que ha aprendido algo útil en cada cuestión`
}

// ─── User Prompt Builder: Corrección ─────────────────────────────────────────

export function buildCorreccionPrompt(params: {
  caso: SupuestoGenerado
  respuestas: Record<number, string>
}): string {
  const { caso, respuestas } = params

  const respuestasTexto = caso.cuestiones
    .map(c => {
      const respuesta = respuestas[c.numero] ?? '(Sin respuesta)'
      return `CUESTIÓN ${c.numero}: ${c.enunciado}\n\nRESPUESTA DEL OPOSITOR:\n${respuesta}`
    })
    .join('\n\n---\n\n')

  return `SUPUESTO PRÁCTICO: ${caso.titulo}

CONTEXTO:
${caso.contexto}

RESPUESTAS DEL OPOSITOR A LAS 5 CUESTIONES:

${respuestasTexto}

Evalúa cada respuesta según la rúbrica oficial y genera la corrección completa.`
}
