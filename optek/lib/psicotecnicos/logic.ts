/**
 * lib/psicotecnicos/logic.ts
 *
 * Generador determinista de problemas de lógica deductiva.
 * Usado en psicotécnicos de oposiciones de seguridad (Ertzaintza, GC, PN).
 *
 * Tipos implementados:
 *   - silogismo: premisas y conclusión (Todos A son B, X es A → ¿X es B?)
 *   - condicional: si P entonces Q, relación causa-efecto
 *   - conjuntos: pertenencia y operaciones entre grupos
 *   - negacion: negar proposiciones y evaluar equivalencias lógicas
 *
 * 100% determinista. Sin IA, sin BD.
 */

import { randomUUID } from 'node:crypto'
import { rnd, pick, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Bancos de datos ──────────────────────────────────────────────────────────

/** Categorías y ejemplos para silogismos. */
const CATEGORIAS = [
  { grupo: 'policías', miembros: ['agentes', 'inspectores', 'comisarios'], ejemplo: 'Ana' },
  { grupo: 'vehículos', miembros: ['coches', 'motos', 'furgonetas'], ejemplo: 'el vehículo X' },
  { grupo: 'animales', miembros: ['perros', 'gatos', 'pájaros'], ejemplo: 'Rex' },
  { grupo: 'deportistas', miembros: ['futbolistas', 'nadadores', 'ciclistas'], ejemplo: 'Carlos' },
  { grupo: 'estudiantes', miembros: ['universitarios', 'bachilleres', 'opositores'], ejemplo: 'María' },
  { grupo: 'profesionales', miembros: ['médicos', 'abogados', 'ingenieros'], ejemplo: 'Pedro' },
  { grupo: 'ciudades', miembros: ['capitales', 'costeras', 'interiores'], ejemplo: 'Bilbao' },
  { grupo: 'frutas', miembros: ['cítricos', 'tropicales', 'rojas'], ejemplo: 'la naranja' },
] as const

/** Propiedades para silogismos. */
const PROPIEDADES = [
  'tienen formación universitaria',
  'pasan una prueba física',
  'llevan uniforme',
  'siguen un protocolo estricto',
  'requieren autorización',
  'están sujetos a evaluación periódica',
  'tienen un código deontológico',
  'necesitan licencia',
] as const

/** Contextos para condicionales. */
const CONDICIONALES = [
  { p: 'llueve', q: 'el suelo está mojado', noQ: 'el suelo está seco', noP: 'no llueve' },
  { p: 'es de día', q: 'hay luz solar', noQ: 'no hay luz solar', noP: 'es de noche' },
  { p: 'apruebas el examen', q: 'obtienes la plaza', noQ: 'no obtienes la plaza', noP: 'no apruebas el examen' },
  { p: 'hay alarma de incendio', q: 'se evacúa el edificio', noQ: 'no se evacúa el edificio', noP: 'no hay alarma de incendio' },
  { p: 'el sospechoso huye', q: 'se inicia la persecución', noQ: 'no se inicia la persecución', noP: 'el sospechoso no huye' },
  { p: 'hay orden judicial', q: 'se puede registrar el domicilio', noQ: 'no se puede registrar el domicilio', noP: 'no hay orden judicial' },
  { p: 'el semáforo está en rojo', q: 'los vehículos se detienen', noQ: 'los vehículos no se detienen', noP: 'el semáforo no está en rojo' },
  { p: 'se presenta denuncia', q: 'se abre investigación', noQ: 'no se abre investigación', noP: 'no se presenta denuncia' },
] as const

// ─── Generadores por tipo ─────────────────────────────────────────────────────

/**
 * Silogismo categórico: Todos A son B. X es A. → ¿Qué se concluye?
 * Nivel 1: silogismos directos (Barbara). Nivel 2-3: con negación o cuantificador parcial.
 */
function generateSilogismo(dificultad: Dificultad): PsicotecnicoQuestion {
  const cat = pick(CATEGORIAS)
  const prop = pick(PROPIEDADES)
  const miembro = pick(cat.miembros)

  if (dificultad === 1) {
    // Barbara: Todos A son B. X es A → X es B.
    const enunciado =
      `Premisa 1: Todos los ${cat.grupo} ${prop}.\n` +
      `Premisa 2: ${cat.ejemplo} es ${miembro} (un tipo de ${cat.grupo}).\n` +
      `¿Qué se puede concluir?`

    const correctAnswer = `${cat.ejemplo} ${prop}`
    const dist1 = `${cat.ejemplo} no ${prop}`
    const dist2 = `No se puede concluir nada`
    const dist3 = `Solo algunos ${cat.grupo} ${prop}`

    const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

    return {
      id: randomUUID(),
      categoria: 'logica',
      subtipo: 'silogismo',
      enunciado,
      opciones,
      correcta,
      explicacion:
        `Silogismo categórico (Barbara): Si TODOS los ${cat.grupo} ${prop}, ` +
        `y ${cat.ejemplo} pertenece al grupo de ${cat.grupo}, entonces ${cat.ejemplo} ${prop}.`,
      dificultad,
    }
  }

  if (dificultad === 2) {
    // Algunos A son B. X es A → No se puede concluir con certeza.
    const enunciado =
      `Premisa 1: Algunos ${cat.grupo} ${prop}.\n` +
      `Premisa 2: ${cat.ejemplo} es ${miembro} (un tipo de ${cat.grupo}).\n` +
      `¿Qué se puede concluir?`

    const correctAnswer = `No se puede concluir con certeza si ${cat.ejemplo} ${prop}`
    const dist1 = `${cat.ejemplo} ${prop}`
    const dist2 = `${cat.ejemplo} no ${prop}`
    const dist3 = `Todos los ${miembro} ${prop}`

    const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

    return {
      id: randomUUID(),
      categoria: 'logica',
      subtipo: 'silogismo',
      enunciado,
      opciones,
      correcta,
      explicacion:
        `"Algunos" no implica "todos". Que algunos ${cat.grupo} ${prop} no permite ` +
        `concluir que ${cat.ejemplo} en particular lo haga. Se necesitaría un cuantificador universal.`,
      dificultad,
    }
  }

  // Dificultad 3: Ningún A es B. X es A → X no es B.
  const prop2 = PROPIEDADES[(PROPIEDADES.indexOf(prop) + 1) % PROPIEDADES.length]
  const enunciado =
    `Premisa 1: Ningún ${miembro} ${prop2}.\n` +
    `Premisa 2: ${cat.ejemplo} es ${miembro}.\n` +
    `Premisa 3: Todos los que ${prop2} ${prop}.\n` +
    `¿Qué se puede concluir sobre ${cat.ejemplo}?`

  const correctAnswer = `${cat.ejemplo} no ${prop2}`
  const dist1 = `${cat.ejemplo} ${prop}`
  const dist2 = `${cat.ejemplo} ${prop2}`
  const dist3 = `No se puede concluir nada`

  const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

  return {
    id: randomUUID(),
    categoria: 'logica',
    subtipo: 'silogismo',
    enunciado,
    opciones,
    correcta,
    explicacion:
      `"Ningún ${miembro} ${prop2}" + "${cat.ejemplo} es ${miembro}" → ` +
      `${cat.ejemplo} no ${prop2}. La premisa 3 no aplica porque ${cat.ejemplo} no cumple la condición.`,
    dificultad,
  }
}

/**
 * Condicional: Si P entonces Q. Se da una situación → evaluar la conclusión.
 * Cubre: modus ponens, modus tollens, falacia de afirmación del consecuente,
 * falacia de negación del antecedente.
 */
function generateCondicional(dificultad: Dificultad): PsicotecnicoQuestion {
  const cond = pick(CONDICIONALES)

  if (dificultad === 1) {
    // Modus ponens: Si P → Q, y P → Q
    const enunciado =
      `Si ${cond.p}, entonces ${cond.q}.\n` +
      `Se sabe que ${cond.p}.\n` +
      `¿Qué se puede concluir?`

    const correctAnswer = `${cond.q.charAt(0).toUpperCase() + cond.q.slice(1)}`
    const dist1 = `${cond.noQ.charAt(0).toUpperCase() + cond.noQ.slice(1)}`
    const dist2 = `No se puede concluir nada`
    const dist3 = `${cond.noP.charAt(0).toUpperCase() + cond.noP.slice(1)}`

    const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

    return {
      id: randomUUID(),
      categoria: 'logica',
      subtipo: 'condicional',
      enunciado,
      opciones,
      correcta,
      explicacion:
        `Modus ponens: Si P→Q y se cumple P, entonces se cumple Q. ` +
        `Como "${cond.p}", entonces "${cond.q}".`,
      dificultad,
    }
  }

  if (dificultad === 2) {
    // Modus tollens: Si P → Q, y NO Q → NO P
    const enunciado =
      `Si ${cond.p}, entonces ${cond.q}.\n` +
      `Se observa que ${cond.noQ}.\n` +
      `¿Qué se puede concluir?`

    const correctAnswer = `${cond.noP.charAt(0).toUpperCase() + cond.noP.slice(1)}`
    const dist1 = `${cond.p.charAt(0).toUpperCase() + cond.p.slice(1)}`
    const dist2 = `No se puede concluir nada`
    const dist3 = `${cond.q.charAt(0).toUpperCase() + cond.q.slice(1)}`

    const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

    return {
      id: randomUUID(),
      categoria: 'logica',
      subtipo: 'condicional',
      enunciado,
      opciones,
      correcta,
      explicacion:
        `Modus tollens (contrapositivo): Si P→Q y NO Q, entonces NO P. ` +
        `Como "${cond.noQ}", entonces "${cond.noP}".`,
      dificultad,
    }
  }

  // Dificultad 3: Falacia de afirmación del consecuente: Si P→Q, y Q → ¿P? NO NECESARIAMENTE
  const enunciado =
    `Si ${cond.p}, entonces ${cond.q}.\n` +
    `Se observa que ${cond.q}.\n` +
    `¿Qué se puede concluir?`

  const correctAnswer = `No se puede concluir con certeza que ${cond.p}`
  const dist1 = `${cond.p.charAt(0).toUpperCase() + cond.p.slice(1)}`
  const dist2 = `${cond.noP.charAt(0).toUpperCase() + cond.noP.slice(1)}`
  const dist3 = `${cond.noQ.charAt(0).toUpperCase() + cond.noQ.slice(1)}`

  const { opciones, correcta } = shuffleOptions(correctAnswer, [dist1, dist2, dist3])

  return {
    id: randomUUID(),
    categoria: 'logica',
    subtipo: 'condicional',
    enunciado,
    opciones,
    correcta,
    explicacion:
      `Falacia de afirmación del consecuente: Si P→Q y se cumple Q, ` +
      `NO se puede concluir P. Puede haber otras causas que produzcan Q. ` +
      `Que "${cond.q}" no implica necesariamente que "${cond.p}".`,
    dificultad,
  }
}

/**
 * Conjuntos: operaciones entre grupos (intersección, unión, diferencia).
 * ¿Cuántos elementos en A∩B? ¿Cuántos en A∪B? etc.
 */
function generateConjuntos(dificultad: Dificultad): PsicotecnicoQuestion {
  const contextos = [
    { A: 'hablan inglés', B: 'hablan francés' },
    { A: 'practican deporte', B: 'tocan un instrumento' },
    { A: 'tienen coche', B: 'tienen moto' },
    { A: 'aprobaron el teórico', B: 'aprobaron el práctico' },
    { A: 'tienen título universitario', B: 'tienen experiencia laboral' },
  ]

  const ctx = pick(contextos)
  const total = rnd(dificultad === 1 ? 20 : 30, dificultad === 3 ? 60 : 40)
  const soloA = rnd(5, Math.floor(total * 0.35))
  const soloB = rnd(5, Math.floor(total * 0.35))
  const ambos = rnd(2, Math.min(soloA, soloB, Math.floor(total * 0.2)))
  const ninguno = total - soloA - soloB - ambos

  if (ninguno < 0) {
    // Fallback: recalcular con valores seguros
    return generateConjuntos(dificultad)
  }

  const totalA = soloA + ambos
  const totalB = soloB + ambos

  type PreguntaConj = { pregunta: string; resp: number; expl: string }
  const preguntas: PreguntaConj[] = [
    {
      pregunta: `¿Cuántas personas ${ctx.A} Y ${ctx.B} (ambas cosas)?`,
      resp: ambos,
      expl: `La intersección A∩B = ${ambos} personas.`,
    },
    {
      pregunta: `¿Cuántas personas ${ctx.A} O ${ctx.B} (al menos una)?`,
      resp: totalA + soloB,
      expl: `A∪B = soloA + soloB + ambos = ${soloA} + ${soloB} + ${ambos} = ${totalA + soloB}.`,
    },
    {
      pregunta: `¿Cuántas personas SOLO ${ctx.A} (pero no ${ctx.B})?`,
      resp: soloA,
      expl: `A − B = ${soloA} personas (${ctx.A} pero no ${ctx.B}).`,
    },
    {
      pregunta: `¿Cuántas personas no ${ctx.A} ni ${ctx.B}?`,
      resp: ninguno,
      expl: `Complemento de A∪B = total − A∪B = ${total} − ${totalA + soloB} = ${ninguno}.`,
    },
  ]

  const selected = dificultad === 1
    ? preguntas[0]  // intersección (más fácil)
    : dificultad === 2
      ? pick(preguntas.slice(0, 3))
      : pick(preguntas)

  const enunciado =
    `En un grupo de ${total} personas:\n` +
    `- ${totalA} ${ctx.A}\n` +
    `- ${totalB} ${ctx.B}\n` +
    `- ${ambos} ${ctx.A} y ${ctx.B}\n\n` +
    selected.pregunta

  const resp = selected.resp
  const offsets = [1, 2, 3, 5, ambos]
  const distractors: number[] = []
  for (const off of offsets) {
    for (const v of [resp + off, resp - off]) {
      if (v > 0 && v !== resp && v <= total && !distractors.includes(v)) distractors.push(v)
      if (distractors.length >= 3) break
    }
    if (distractors.length >= 3) break
  }
  while (distractors.length < 3) distractors.push(resp + distractors.length + 1)

  const { opciones, correcta } = shuffleOptions(
    String(resp),
    distractors.slice(0, 3).map(String) as [string, string, string]
  )

  return {
    id: randomUUID(),
    categoria: 'logica',
    subtipo: 'conjuntos',
    enunciado,
    opciones,
    correcta,
    explicacion: selected.expl,
    dificultad,
  }
}

/**
 * Negación: dada una proposición, ¿cuál es su negación lógica correcta?
 * Cubre: De Morgan, negación de cuantificadores, doble negación.
 */
function generateNegacion(dificultad: Dificultad): PsicotecnicoQuestion {
  type NegItem = { prop: string; neg: string; expl: string; falsa1: string; falsa2: string; falsa3: string }

  const items: NegItem[] = [
    // Nivel 1 — negación simple
    {
      prop: 'Todos los agentes llevan uniforme',
      neg: 'Al menos un agente no lleva uniforme',
      expl: 'La negación de "todos" es "al menos uno no" (¬∀x P(x) = ∃x ¬P(x)).',
      falsa1: 'Ningún agente lleva uniforme',
      falsa2: 'Algunos agentes llevan uniforme',
      falsa3: 'Los agentes a veces llevan uniforme',
    },
    {
      prop: 'Ningún vehículo superó el límite de velocidad',
      neg: 'Al menos un vehículo superó el límite de velocidad',
      expl: 'La negación de "ninguno" es "al menos uno" (¬(¬∃x P(x)) = ∃x P(x)).',
      falsa1: 'Todos los vehículos superaron el límite',
      falsa2: 'La mayoría no superó el límite',
      falsa3: 'Algunos vehículos no superaron el límite',
    },
    // Nivel 2 — De Morgan
    {
      prop: 'El sospechoso es alto Y rubio',
      neg: 'El sospechoso no es alto O no es rubio (o ambas)',
      expl: 'Ley de De Morgan: ¬(A ∧ B) = ¬A ∨ ¬B.',
      falsa1: 'El sospechoso no es alto Y no es rubio',
      falsa2: 'El sospechoso es bajo Y moreno',
      falsa3: 'El sospechoso no es alto NI rubio',
    },
    {
      prop: 'El testigo vio al ladrón O escuchó ruido',
      neg: 'El testigo no vio al ladrón NI escuchó ruido',
      expl: 'Ley de De Morgan: ¬(A ∨ B) = ¬A ∧ ¬B.',
      falsa1: 'El testigo no vio al ladrón O no escuchó ruido',
      falsa2: 'El testigo vio al ladrón Y escuchó ruido',
      falsa3: 'El testigo no vio nada pero escuchó algo',
    },
    // Nivel 3 — cuantificador + composición
    {
      prop: 'Todos los detenidos tienen abogado Y han sido informados de sus derechos',
      neg: 'Al menos un detenido no tiene abogado O no ha sido informado de sus derechos',
      expl: '¬∀x(A(x) ∧ B(x)) = ∃x(¬A(x) ∨ ¬B(x)). Se combinan negación de cuantificador universal y De Morgan.',
      falsa1: 'Ningún detenido tiene abogado ni ha sido informado',
      falsa2: 'Algunos detenidos no tienen abogado Y no han sido informados',
      falsa3: 'Al menos un detenido tiene abogado pero no ha sido informado',
    },
    {
      prop: 'Existe algún turno en el que todos los agentes están disponibles',
      neg: 'En todos los turnos, al menos un agente no está disponible',
      expl: '¬∃x∀y P(x,y) = ∀x∃y ¬P(x,y). Negación de cuantificador existencial + universal.',
      falsa1: 'En ningún turno hay agentes disponibles',
      falsa2: 'Existe algún turno en el que ningún agente está disponible',
      falsa3: 'En todos los turnos todos los agentes están no disponibles',
    },
  ]

  // Seleccionar según dificultad
  const pool = dificultad === 1
    ? items.slice(0, 2)
    : dificultad === 2
      ? items.slice(2, 4)
      : items.slice(4, 6)
  const item = pick(pool)

  const { opciones, correcta } = shuffleOptions(item.neg, [item.falsa1, item.falsa2, item.falsa3])

  return {
    id: randomUUID(),
    categoria: 'logica',
    subtipo: 'negacion',
    enunciado: `¿Cuál es la negación lógica correcta de: "${item.prop}"?`,
    opciones,
    correcta,
    explicacion: item.expl,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

const SUBTIPOS_LOGICA = [
  generateSilogismo,
  generateCondicional,
  generateConjuntos,
  generateNegacion,
] as const

/**
 * Genera N preguntas de lógica deductiva con subtipo aleatorio.
 */
export function generateLogic(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(SUBTIPOS_LOGICA)(dificultad))
}

export { generateSilogismo, generateCondicional, generateConjuntos, generateNegacion }
