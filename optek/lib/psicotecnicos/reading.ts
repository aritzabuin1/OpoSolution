/**
 * lib/psicotecnicos/reading.ts
 *
 * Generador de comprensión lectora para psicotécnicos de Correos.
 * Presenta un texto corto (contexto postal/laboral) + preguntas sobre el contenido.
 *
 * Tipos:
 *   - lectura_texto: texto general + preguntas de comprensión
 *   - lectura_normativa: texto normativo/legal + preguntas de interpretación
 *
 * Banco: data/psicotecnicos/banco_lectura_correos.json
 * Cada entrada tiene: texto + 3-4 preguntas vinculadas con opciones y correcta.
 */

import { randomUUID } from 'node:crypto'
import { rnd, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Banco inline (evita dependencia de archivo JSON durante desarrollo) ─────
// En producción se puede migrar a JSON como banco_verbal.json

interface LecturaEntry {
  texto: string
  preguntas: {
    enunciado: string
    correcta: string
    distractores: [string, string, string]
    subtipo: 'lectura_texto' | 'lectura_normativa'
  }[]
  dificultad: 1 | 2 | 3
}

const BANCO_LECTURA: LecturaEntry[] = [
  {
    texto: 'Correos ha implementado un nuevo sistema de seguimiento de envíos denominado SGIE 4.0. Este sistema permite al usuario consultar el estado de su envío en tiempo real a través de la web, la app móvil o llamando al 902 197 197. El seguimiento incluye información sobre la admisión, clasificación, transporte y entrega del envío. En caso de incidencia, el sistema genera automáticamente una alerta que se envía al remitente por SMS o correo electrónico, según la preferencia configurada.',
    preguntas: [
      { enunciado: 'Según el texto, ¿cuántos canales de consulta ofrece el sistema SGIE 4.0?', correcta: 'Tres: web, app móvil y teléfono', distractores: ['Dos: web y app móvil', 'Cuatro: web, app, teléfono y oficina', 'Uno: solo la web'], subtipo: 'lectura_texto' },
      { enunciado: '¿Qué ocurre cuando se produce una incidencia en un envío?', correcta: 'Se genera una alerta automática al remitente', distractores: ['El envío se devuelve al origen', 'Se notifica al destinatario por carta', 'Se paraliza el envío hasta resolución'], subtipo: 'lectura_texto' },
      { enunciado: '¿Qué fases del proceso postal cubre el seguimiento según el texto?', correcta: 'Admisión, clasificación, transporte y entrega', distractores: ['Solo admisión y entrega', 'Clasificación y transporte únicamente', 'Admisión, transporte y reclamación'], subtipo: 'lectura_texto' },
    ],
    dificultad: 1,
  },
  {
    texto: 'La Ley 43/2010, de 30 de diciembre, del servicio postal universal, establece en su artículo 3 que el servicio postal universal comprende las siguientes prestaciones: la recogida, admisión, clasificación, transporte, distribución y entrega de envíos postales nacionales y transfronterizos de hasta 2 kg para cartas y de hasta 20 kg para paquetes. Asimismo, incluye el servicio de certificado y el servicio de giros postales. El operador designado para la prestación del servicio postal universal es la Sociedad Estatal Correos y Telégrafos, S.A.',
    preguntas: [
      { enunciado: '¿Cuál es el peso máximo para cartas dentro del servicio postal universal?', correcta: '2 kg', distractores: ['1 kg', '5 kg', '500 gramos'], subtipo: 'lectura_normativa' },
      { enunciado: 'Según el texto, ¿qué servicios adicionales incluye el servicio postal universal?', correcta: 'Certificado y giros postales', distractores: ['Solo certificado', 'Burofax y certificado', 'Giros y paquetería express'], subtipo: 'lectura_normativa' },
      { enunciado: '¿Quién es el operador designado del servicio postal universal?', correcta: 'La Sociedad Estatal Correos y Telégrafos, S.A.', distractores: ['El Ministerio de Transportes', 'La CNMC', 'Cualquier operador postal autorizado'], subtipo: 'lectura_normativa' },
    ],
    dificultad: 1,
  },
  {
    texto: 'El Programa Experiencia de Empleado de Correos se articula en torno a tres fases: la fase de acogida, donde el nuevo empleado recibe formación sobre la cultura corporativa y los valores de la empresa durante sus primeras semanas; la fase de desarrollo, que incluye planes de formación continua, evaluación del desempeño y oportunidades de movilidad interna; y la fase de reconocimiento, que contempla incentivos por objetivos, programas de bienestar laboral y medidas de conciliación. El programa busca mejorar la satisfacción y retención del talento en un contexto de transformación digital.',
    preguntas: [
      { enunciado: '¿Cuántas fases tiene el Programa Experiencia de Empleado?', correcta: 'Tres fases', distractores: ['Dos fases', 'Cuatro fases', 'Cinco fases'], subtipo: 'lectura_texto' },
      { enunciado: '¿Qué incluye la fase de desarrollo según el texto?', correcta: 'Formación continua, evaluación y movilidad interna', distractores: ['Solo formación inicial', 'Incentivos económicos y bienestar', 'Acogida y cultura corporativa'], subtipo: 'lectura_texto' },
      { enunciado: '¿Cuál es el objetivo principal del programa?', correcta: 'Mejorar la satisfacción y retención del talento', distractores: ['Reducir costes operativos', 'Aumentar las ventas de productos', 'Digitalizar todos los procesos'], subtipo: 'lectura_texto' },
    ],
    dificultad: 2,
  },
  {
    texto: 'El Real Decreto 1829/1999, por el que se aprueba el Reglamento de prestación de los servicios postales, establece que los envíos certificados son aquellos que, previo pago de una cantidad fija, proporcionan al remitente una prueba del depósito del envío postal y, a petición de este, una prueba de la entrega al destinatario. La indemnización por pérdida, sustracción o deterioro de un envío certificado será la que se establezca reglamentariamente, con un mínimo equivalente a la tarifa abonada multiplicada por cinco.',
    preguntas: [
      { enunciado: '¿Qué garantía ofrece el envío certificado al remitente?', correcta: 'Prueba del depósito y, a petición, prueba de entrega', distractores: ['Solo prueba de entrega', 'Seguimiento en tiempo real', 'Devolución del importe si no se entrega'], subtipo: 'lectura_normativa' },
      { enunciado: '¿Cuál es la indemnización mínima por pérdida de un envío certificado?', correcta: 'La tarifa abonada multiplicada por cinco', distractores: ['El doble de la tarifa', 'Un máximo de 30 euros', 'La tarifa abonada más gastos de gestión'], subtipo: 'lectura_normativa' },
    ],
    dificultad: 2,
  },
  {
    texto: 'Correos ha puesto en marcha el proyecto "Correos Verde", una iniciativa de sostenibilidad ambiental que incluye la renovación progresiva de su flota de reparto con vehículos eléctricos y bicicletas de carga, la instalación de paneles solares en los centros logísticos principales, y la eliminación gradual del plástico de un solo uso en el embalaje de productos. En 2023, el 28% de la flota urbana ya era de bajas emisiones, y el objetivo es alcanzar el 50% en 2025. Además, Correos compensa las emisiones de CO2 generadas por el transporte aéreo de envíos internacionales mediante la inversión en proyectos de reforestación.',
    preguntas: [
      { enunciado: '¿Qué porcentaje de la flota urbana era de bajas emisiones en 2023?', correcta: '28%', distractores: ['50%', '15%', '35%'], subtipo: 'lectura_texto' },
      { enunciado: '¿Cómo compensa Correos las emisiones del transporte aéreo internacional?', correcta: 'Invirtiendo en proyectos de reforestación', distractores: ['Reduciendo el número de vuelos', 'Cobrando un suplemento ecológico', 'Utilizando combustible sostenible'], subtipo: 'lectura_texto' },
      { enunciado: '¿Cuál es el objetivo de flota de bajas emisiones para 2025?', correcta: '50%', distractores: ['75%', '100%', '28%'], subtipo: 'lectura_texto' },
    ],
    dificultad: 3,
  },
  {
    texto: 'La normativa de prevención de blanqueo de capitales obliga a Correos a aplicar medidas de diligencia debida en determinadas operaciones de giro. Cuando el importe de un giro nacional supere los 1.000 euros, o el acumulado de giros enviados por un mismo cliente en un mes natural supere los 2.500 euros, se deberá solicitar la identificación formal del ordenante mediante documento oficial vigente (DNI, pasaporte o tarjeta de residencia) y registrar la operación en el sistema SICER. Para giros internacionales, el umbral se reduce a 150 euros por operación individual.',
    preguntas: [
      { enunciado: '¿A partir de qué importe se requiere identificación formal en un giro nacional?', correcta: '1.000 euros por operación o 2.500 euros acumulados al mes', distractores: ['500 euros por operación', '2.500 euros por operación individual', '150 euros por operación'], subtipo: 'lectura_normativa' },
      { enunciado: '¿Cuál es el umbral para giros internacionales?', correcta: '150 euros por operación individual', distractores: ['1.000 euros como en los nacionales', '500 euros por operación', '2.500 euros acumulados al mes'], subtipo: 'lectura_normativa' },
      { enunciado: '¿En qué sistema se registran las operaciones sujetas a diligencia debida?', correcta: 'SICER', distractores: ['SGIE', 'IRIS', 'CRM'], subtipo: 'lectura_normativa' },
    ],
    dificultad: 3,
  },
]

// ─── Generador ──────────────────────────────────────────────────────────────

export function generateReading(count: number, dificultad: Dificultad): PsicotecnicoQuestion[] {
  // Filter by difficulty range
  const available = BANCO_LECTURA.filter(e =>
    dificultad === 1 ? e.dificultad <= 2 :
    dificultad === 2 ? true :
    e.dificultad >= 2
  )

  if (available.length === 0) return []

  const result: PsicotecnicoQuestion[] = []
  const usedTexts = new Set<number>()

  while (result.length < count) {
    // Pick a random text we haven't used yet
    let textIdx: number
    if (usedTexts.size >= available.length) {
      // All texts used — recycle
      usedTexts.clear()
    }
    do {
      textIdx = rnd(0, available.length - 1)
    } while (usedTexts.has(textIdx))
    usedTexts.add(textIdx)

    const entry = available[textIdx]
    // Pick questions from this text
    const shuffledPreguntas = [...entry.preguntas].sort(() => Math.random() - 0.5)
    const needed = Math.min(count - result.length, shuffledPreguntas.length)

    for (let i = 0; i < needed; i++) {
      const p = shuffledPreguntas[i]
      const { opciones, correcta } = shuffleOptions(p.correcta, p.distractores)

      result.push({
        id: randomUUID(),
        categoria: 'comprension_lectora',
        subtipo: p.subtipo,
        enunciado: `📖 Lee el siguiente texto:\n\n"${entry.texto}"\n\n${p.enunciado}`,
        opciones,
        correcta,
        explicacion: `La respuesta correcta es "${p.correcta}" según la información del texto.`,
        dificultad,
      })
    }
  }

  return result.slice(0, count)
}
