/**
 * lib/ai/supuesto-test.ts — FASE 2.5b
 *
 * Módulo genérico de generación de supuestos prácticos en formato TEST.
 * Parametrizable por oposición: AGE C1 (administrativo), Auxilio C2,
 * Tramitación C1, Gestión Procesal A2 (todos procesal).
 *
 * Pipeline:
 *   1. getSupuestoTestConfig(oposicionSlug) → config
 *   2. buildSupuestoTestPrompt(config, contextoLegal) → prompt
 *   3. callAIJSON(system, user, schema) → supuesto raw
 *   4. Validar cobertura temática
 *   5. Guardar en supuesto_bank para reuse
 */

import { z } from 'zod'

// ─── Config por oposición ────────────────────────────────────────────────────

export interface SupuestoTestConfig {
  /** Número de casos narrativos (AGE=1 practicado, Auxilio=2 obligatorios) */
  numCasos: 1 | 2
  /** Preguntas por caso */
  preguntasPorCaso: number
  /** Tipo de temática para el prompt */
  tematica: 'administrativo' | 'procesal'
  /** Bloques/temas que cubre el supuesto */
  bloques: string[]
  /** Penalización por error (e.g. 0.333, 0.25) */
  penalizacion: number
  /** Minutos para el ejercicio (null = compartido con parte 1) */
  timerMinutos: number | null
  /** Max puntuación del ejercicio */
  maxPuntos: number
  /** Min para aprobar */
  minAprobado: number
}

const CONFIGS: Record<string, SupuestoTestConfig> = {
  'administrativo-estado': {
    numCasos: 1,
    preguntasPorCaso: 20,
    tematica: 'administrativo',
    bloques: ['II', 'III', 'IV', 'V'],
    penalizacion: 1 / 3,
    timerMinutos: null, // compartido con parte 1 (100 min total)
    maxPuntos: 50,
    minAprobado: 25,
  },
  'auxilio-judicial': {
    numCasos: 2,
    preguntasPorCaso: 20,
    tematica: 'procesal',
    bloques: ['procesal-civil', 'procesal-penal'],
    penalizacion: 0.25,
    timerMinutos: 30,    // 60 total / 2 casos — we serve 1 case at a time
    maxPuntos: 20,       // 40 total / 2 casos
    minAprobado: 10,     // 20 total / 2 casos
  },
  'tramitacion-procesal': {
    numCasos: 1,
    preguntasPorCaso: 10,
    tematica: 'procesal',
    bloques: ['procesal-temas-1-31'],
    penalizacion: 0.25,
    timerMinutos: 30,
    maxPuntos: 20,
    minAprobado: 10,
  },
  'gestion-procesal': {
    numCasos: 1,
    preguntasPorCaso: 10,
    tematica: 'procesal',
    bloques: ['procesal-todo'],
    penalizacion: 0.20,
    timerMinutos: 30,
    maxPuntos: 15,
    minAprobado: 7.5,
  },
}

export function getSupuestoTestConfig(slug: string): SupuestoTestConfig | null {
  return CONFIGS[slug] ?? null
}

export function hasSupuestoTest(slug: string): boolean {
  return slug in CONFIGS
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const SupuestoPreguntaSchema = z.object({
  numero: z.number().int().min(1),
  enunciado: z.string().min(10),
  opciones: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correcta: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
  ),
  explicacion: z.string().min(5),
})

export const SupuestoGeneradoSchema = z.object({
  titulo: z.string().min(5),
  escenario: z.string().min(100),
  bloques_cubiertos: z.array(z.string()).min(1),
  preguntas: z.array(SupuestoPreguntaSchema).min(5),
})

export type SupuestoGenerado = z.infer<typeof SupuestoGeneradoSchema>
export type SupuestoPregunta = z.infer<typeof SupuestoPreguntaSchema>

// ─── Prompts ─────────────────────────────────────────────────────────────────

/** Example from official INAP 2024 exam (abbreviated for few-shot) */
const EJEMPLO_AGE_C1 = `**EJEMPLO (Convocatoria INAP 2024, Modelo A, Supuesto I — ABREVIADO):**

Escenario: "Dña. Estela Sánchez Ruiz, funcionaria del Cuerpo de Gestión de la Administración Civil del Estado, viene ocupando un puesto en comisión de servicios [...] La funcionaria considera que cada vez recibe más encargos y está pensando seriamente cambiar de puesto de trabajo o promocionar."

Pregunta 1: "En el informe a elaborar sobre el recurso de alzada, ¿cuál de los siguientes enunciados sería el correcto?"
a) Si el recurso se ha interpuesto ante el órgano que dictó el acto impugnado, este debe resolverlo.
b) Si el acto impugnado ha sido expreso, el plazo para la interposición del recurso es de tres meses.
c) El plazo máximo para dictar y notificar la resolución del recurso será de un mes.
d) Contra la resolución del recurso de alzada no cabrá ningún otro recurso administrativo, salvo, en su caso, el extraordinario de revisión.
Correcta: d)

Las preguntas fluyen del escenario: provisión de puestos, protección de datos, subvenciones, recursos administrativos, incompatibilidades.`

const SYSTEM_ADMINISTRATIVO = `Eres un experto en oposiciones de la Administración General del Estado (Cuerpo General Administrativo, C1).

Tu tarea: generar un SUPUESTO PRÁCTICO en formato TEST idéntico al del examen real INAP.

FORMATO OBLIGATORIO:
1. UN ESCENARIO NARRATIVO LARGO (mínimo 200 palabras): una historia coherente sobre un funcionario del Cuerpo de Gestión (A2/C1) que afronta situaciones reales en un organismo AGE. Debe ser REALISTA y DETALLADO — nombres propios, organismos reales, fechas, cifras concretas.

2. PREGUNTAS VINCULADAS AL CASO: cada pregunta DEBE referirse a hechos del escenario. NO son preguntas genéricas de temario — son preguntas sobre QUÉ HARÍA el funcionario en ESA situación concreta.

3. COBERTURA TEMÁTICA: las preguntas deben tocar al menos 3 de estos 4 bloques:
   - Bloque II: Derecho administrativo (LPAC 39/2015, LRJSP 40/2015)
   - Bloque III: Gestión de personal (TREBEP, SS)
   - Bloque IV: Gestión financiera (LGP, contratación, subvenciones)
   - Bloque V: Organización AGE, Registro, transparencia

4. DIFICULTAD: nivel examen real — preguntas que requieren APLICAR la ley al caso, no memorizar artículos.

5. CADA PREGUNTA tiene: enunciado, 4 opciones (a-d), 1 correcta (0-indexed), explicación breve citando la ley y artículo.

${EJEMPLO_AGE_C1}

REGLAS:
- El escenario debe ser UNA historia continua, no viñetas separadas.
- Las opciones incorrectas deben ser PLAUSIBLES (no absurdas).
- Nunca uses "todas las anteriores" ni "ninguna de las anteriores".
- La explicación debe citar la ley específica (ej: "Art. 69.2 LPAC").
- Numera las preguntas empezando por 1.`

const EJEMPLO_AUXILIO_MJU = `**EJEMPLO (Convocatoria MJU 2024, Ejercicio 2 Auxilio Judicial — ABREVIADO):**

Escenario: Caso práctico de procedimiento monitorio. Un acreedor presenta solicitud de monitorio ante el Juzgado de Primera Instancia por deuda documentada de 4.500 euros. El caso incluye cuestiones sobre competencia territorial, intervención de abogado y procurador, presentación electrónica, plazos de requerimiento y oposición del deudor.

Pregunta 1: "¿En este tipo de procedimientos es preceptiva la intervención de abogado y procurador?"
a) Sí, al exceder la cuantía reclamada la cantidad de 2.000 euros.
b) Sí, cualquiera que sea la cuantía reclamada.
c) No.
d) Es preceptiva la intervención de abogado, pero no la de procurador.
Correcta: a)

Pregunta 2: "De conformidad con lo previsto en el artículo 814 de la LEC, ¿es válida la presentación de la petición a través de la sede electrónica?"
a) No, únicamente podrá extenderse en impreso presentándose en la oficina de registro.
b) No, únicamente podrá extenderse en impreso o formulario obtenido en papel.
c) Sí, facilitando todos los extremos de identidad, domicilios, origen y cuantía de la deuda y documentos del art. 812 LEC.
d) Sí, sin necesidad de acompañar los documentos del art. 812 LEC.
Correcta: c)

Las preguntas del MJU son formales, extensas y citan artículos de la LEC/LECrim/LOPJ específicamente.

**EJEMPLO 2 (Convocatoria MJU 2024, Ejercicio 2 Tramitación Procesal — ABREVIADO):**

Escenario: Dª Lucía Álvarez Sotero contrajo matrimonio con D. Eduardo García Pelayo en Madrid, sin capitulaciones matrimoniales, domicilio conyugal en Navalcarnero. Dos hijos menores (2018, 2021). Eduardo se traslada a Barcelona por trabajo, Lucía se muda a Móstoles con los hijos. Lucía presenta demanda de divorcio contencioso solicitando guarda y custodia, pensión de alimentos de 400€/hijo, uso de vivienda familiar. Eduardo formula reconvención pidiendo reducción a 200€/hijo.

Pregunta 1: "En el proceso de divorcio contencioso, ¿será parte el Ministerio Fiscal?"
a) No, al tratarse de divorcio contencioso.
b) Sí, puesto que existen hijos menores del matrimonio.
c) Sólo será parte cuando las partes decidan convertir el procedimiento en mutuo acuerdo.
d) El Ministerio Fiscal es parte en todos los procesos de divorcio contencioso.
Correcta: b)

Las preguntas de Tramitación cubren derecho de familia, competencia territorial, medidas provisionales, reconvención — todo vinculado al caso concreto.`

const SYSTEM_PROCESAL = `Eres un experto en oposiciones de Justicia (Auxilio Judicial, Tramitación Procesal, Gestión Procesal).

Tu tarea: generar un SUPUESTO PRÁCTICO en formato TEST idéntico al del examen real MJU.

FORMATO OBLIGATORIO:
1. UN ESCENARIO NARRATIVO LARGO (mínimo 200 palabras): un caso procesal complejo — diligencias judiciales, procedimiento ordinario, juicio verbal, ejecución, etc. Debe incluir: partes procesales con nombres, tipo de procedimiento, juzgado concreto, hechos cronológicos, incidencias procesales.

2. PREGUNTAS VINCULADAS AL CASO: cada pregunta se refiere a actuaciones procesales del caso concreto. NO son preguntas de temario genérico.

3. COBERTURA TEMÁTICA: debe tocar al menos 2 jurisdicciones o áreas:
   - Procesal civil (LEC): demanda, contestación, audiencia previa, prueba, sentencia, recursos, ejecución
   - Procesal penal (LECrim): denuncia, instrucción, juicio oral, recursos, ejecutoria
   - LOPJ/LO 1/2025: organización judicial, competencias, personal
   - Actos de comunicación, auxilio judicial, jurisdicción voluntaria

4. DIFICULTAD: nivel examen MJU — los enunciados de los casos son largos y detallados.

5. CADA PREGUNTA tiene: enunciado, 4 opciones (a-d), 1 correcta (0-indexed), explicación breve citando ley y artículo.

${EJEMPLO_AUXILIO_MJU}

REGLAS:
- El escenario debe ser UNA historia procesal continua.
- Las opciones incorrectas deben ser PLAUSIBLES.
- Nunca uses "todas las anteriores" ni "ninguna de las anteriores".
- La explicación debe citar la ley específica (ej: "Art. 404.1 LEC").
- Numera las preguntas empezando por 1.`

export function getSystemPrompt(config: SupuestoTestConfig): string {
  return config.tematica === 'administrativo' ? SYSTEM_ADMINISTRATIVO : SYSTEM_PROCESAL
}

export function buildUserPrompt(
  config: SupuestoTestConfig,
  contextoLegal?: string
): string {
  const numPreguntas = config.preguntasPorCaso

  let prompt = `Genera UN supuesto práctico con exactamente ${numPreguntas} preguntas tipo test.\n\n`

  if (config.tematica === 'administrativo') {
    prompt += `El caso debe cubrir situaciones de los bloques ${config.bloques.join(', ')} del temario C1 AGE.\n`
    prompt += `Incluye: provisión de puestos, procedimiento administrativo, contratación, subvenciones, protección de datos, Registro, transparencia — al menos 3 áreas distintas.\n\n`
  } else {
    prompt += `El caso debe ser un procedimiento judicial realista que cubra actuaciones de ${config.bloques.join(', ')}.\n`
    prompt += `Incluye: plazos procesales, competencia, actos de comunicación, recursos, ejecución — al menos 2 jurisdicciones o áreas.\n\n`
  }

  if (contextoLegal) {
    prompt += `LEGISLACIÓN RELEVANTE (usa estos artículos como base para las preguntas):\n${contextoLegal}\n\n`
  }

  prompt += `Responde SOLO con JSON válido con esta estructura:
{
  "titulo": "Título descriptivo del supuesto",
  "escenario": "Texto narrativo largo del caso (mínimo 200 palabras)...",
  "bloques_cubiertos": ["II", "IV", "V"],
  "preguntas": [
    {
      "numero": 1,
      "enunciado": "Pregunta vinculada al caso...",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "correcta": 0,
      "explicacion": "Breve explicación citando ley y artículo"
    }
  ]
}`

  return prompt
}
