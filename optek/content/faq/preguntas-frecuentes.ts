/**
 * content/faq/preguntas-frecuentes.ts
 *
 * Datos de la página FAQ. Separados del rendering para facilitar testing
 * y generación de JSON-LD.
 */

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqSection {
  id: string
  title: string
  items: FaqItem[]
}

export const faqSections: FaqSection[] = [
  {
    id: 'sobre-oporuta',
    title: 'Sobre OpoRuta',
    items: [
      {
        question: '¿Qué es OpoRuta?',
        answer: 'OpoRuta es una plataforma web de preparación de oposiciones para Auxiliar Administrativo del Estado (C2) y Administrativo del Estado (C1). Utiliza inteligencia artificial para generar tests personalizados, verificar cada cita legal contra el BOE y analizar tus errores con el método socrático. No es una academia: es una herramienta de entrenamiento con pago único de 49,99€.',
      },
      {
        question: '¿Las preguntas de OpoRuta están verificadas?',
        answer: 'Sí. Cada pregunta generada por la IA incluye una cita legal (ley + artículo) que se verifica automáticamente contra la legislación oficial del BOE. Si un artículo ha sido modificado o derogado, el sistema lo detecta y no genera preguntas sobre contenido desactualizado. Ninguna otra plataforma de oposiciones ofrece esta verificación automática.',
      },
      {
        question: '¿Cuánto cuesta OpoRuta?',
        answer: 'OpoRuta ofrece un test gratuito en cada tema (todos los temas de tu oposición) sin tarjeta para que pruebes la plataforma. El Pack Oposición cuesta 49,99€ (pago único, sin suscripción) e incluye tests ilimitados, simulacros completos, flashcards, Radar del Tribunal y 20 análisis detallados con IA. El Pack Doble (C1 + C2) cuesta 79,99€. También existe una recarga de 10 análisis adicionales por 8,99€.',
      },
      {
        question: '¿OpoRuta sustituye a una academia de oposiciones?',
        answer: 'No directamente. OpoRuta es una herramienta de entrenamiento, no una academia con temario ni clases. Lo ideal es combinar un temario actualizado (libro o academia) con OpoRuta para practicar. Muchos opositores que preparan por libre usan un temario de 30-40€ más OpoRuta (49,99€) y consiguen resultados comparables a opositores de academia que pagan 100-250€/mes.',
      },
      {
        question: '¿Qué diferencia hay entre OpoRuta y usar ChatGPT directamente?',
        answer: 'ChatGPT puede generar preguntas tipo test, pero no verifica si las citas legales son correctas. Según estudios, los LLMs "alucinan" artículos inexistentes con frecuencia. OpoRuta verifica cada cita contra el BOE, usa preguntas de exámenes INAP reales para calibrar la dificultad, y ofrece un sistema de repetición espaciada y análisis de errores que ChatGPT no tiene.',
      },
      {
        question: '¿Puedo probar OpoRuta gratis?',
        answer: 'Sí. Al registrarte obtienes 1 test gratuito en cada uno de los temas de tu oposición, 1 simulacro oficial de 20 preguntas, 3 sesiones de Caza-Trampas y 2 análisis detallados con IA. No se requiere tarjeta de crédito.',
      },
    ],
  },
  {
    id: 'auxiliar-c2',
    title: 'Oposición Auxiliar Administrativo del Estado (C2)',
    items: [
      {
        question: '¿Cuántas plazas hay de Auxiliar Administrativo del Estado en 2026?',
        answer: 'Se han convocado 1.700 plazas de ingreso libre en la OEP 2025 para Auxiliar Administrativo del Estado (subgrupo C2). Es la mayor oferta para este cuerpo en los últimos años. El examen está previsto para el 23 de mayo de 2026.',
      },
      {
        question: '¿Cuántos temas tiene el temario de Auxiliar Administrativo del Estado?',
        answer: 'El temario consta de 28 temas divididos en 2 bloques: Bloque I — Organización Pública (16 temas) que abarca Constitución, administración, régimen jurídico y empleo público; y Bloque II — Actividad Administrativa y Ofimática (12 temas) que cubre atención al público, gestión documental, Word, Excel y administración electrónica.',
      },
      {
        question: '¿Cómo es el examen de Auxiliar Administrativo del Estado?',
        answer: 'El examen consiste en un ejercicio único con dos partes: un cuestionario de 100 preguntas tipo test (más 10 de reserva) con 4 opciones de respuesta y penalización de -1/3 por error, más una prueba práctica de ofimática (Word y Excel). Se dispone de 90 minutos para el cuestionario. Se necesita un mínimo de 25 puntos en cada parte (máximo 50 por parte, 100 total) para superar.',
      },
      {
        question: '¿Qué temas caen más en el examen de Auxiliar Administrativo?',
        answer: 'Según el análisis de exámenes INAP 2018-2024 de OpoRuta (Radar del Tribunal), los temas más preguntados son: T1 La Constitución Española (50 apariciones), T8 La Administración General del Estado (33 apariciones), y T13 El personal funcionario al servicio de la AGE (29 apariciones). Concentrar el estudio en los 5-6 temas más frecuentes puede cubrir hasta el 40% del examen.',
      },
      {
        question: '¿Cómo funciona la penalización de -1/3 en el examen?',
        answer: 'Por cada respuesta incorrecta se descuenta 1/3 del valor de una respuesta correcta. Esto significa que de cada 3 errores, se pierde el equivalente a 1 acierto. Las preguntas no contestadas no descuentan. Estadísticamente, merece la pena responder si puedes descartar al menos 1 de las 4 opciones.',
      },
      {
        question: '¿Se necesita bachillerato para ser Auxiliar Administrativo del Estado?',
        answer: 'No. Para Auxiliar Administrativo del Estado (subgrupo C2), el requisito académico mínimo es el título de Graduado en ESO, Graduado Escolar o equivalente. El bachillerato es requisito para Administrativo del Estado (subgrupo C1), que es un nivel superior.',
      },
      {
        question: '¿Qué sueldo tiene un Auxiliar Administrativo del Estado?',
        answer: 'Los Auxiliares Administrativos del Estado (C2) cobran entre 1.300 y 1.700€ brutos al mes con 14 pagas anuales. El salario exacto depende del destino (Madrid suele tener complemento de productividad mayor), los complementos específicos del puesto y la antigüedad. A esto se suman beneficios como horario fijo, vacaciones amplias y estabilidad laboral.',
      },
      {
        question: '¿Hay psicotécnicos en el examen de Auxiliar Administrativo?',
        answer: 'No como prueba independiente, pero el examen incluye preguntas de razonamiento lógico, series numéricas y comprensión verbal dentro del cuestionario tipo test. OpoRuta incluye un módulo específico de psicotécnicos con 6 categorías: series numéricas, series alfabéticas, analogías, razonamiento lógico, comprensión verbal y cálculo mental.',
      },
    ],
  },
  {
    id: 'administrativo-c1',
    title: 'Oposición Administrativo del Estado (C1)',
    items: [
      {
        question: '¿Cuántas plazas hay de Administrativo del Estado (C1) en 2026?',
        answer: 'Se han convocado 2.500+ plazas de Administrativo del Estado (subgrupo C1) en la OEP 2025. El examen se celebra el mismo día que el de Auxiliar (C2), el 23 de mayo de 2026, por lo que solo puedes presentarte a uno de los dos.',
      },
      {
        question: '¿Cuántos temas tiene el temario de Administrativo del Estado (C1)?',
        answer: 'El temario de Administrativo del Estado consta de 45 temas divididos en 4 bloques: Organización del Estado y de la UE, Administración General del Estado, Gestión de personal, y Gestión financiera y contratación pública. Es significativamente más amplio que el de Auxiliar (28 temas).',
      },
      {
        question: '¿Cuál es la diferencia entre Auxiliar (C2) y Administrativo (C1)?',
        answer: 'La principal diferencia es el nivel de responsabilidad y requisitos: C1 requiere bachillerato (C2 solo ESO), C1 tiene 45 temas (C2 tiene 28), C1 incluye supuesto práctico (C2 no), y C1 tiene sueldo más alto (~1.500-2.100€ vs ~1.300-1.700€). Ambos exámenes son el mismo día, así que debes elegir uno.',
      },
      {
        question: '¿Qué es el supuesto práctico del Administrativo C1?',
        answer: 'El supuesto práctico es la segunda parte del examen de Administrativo del Estado. Consiste en resolver un caso práctico relacionado con las funciones del puesto: tramitación de expedientes, elaboración de documentos administrativos, gestión presupuestaria, etc. Requiere conocer los procedimientos administrativos en profundidad, no solo la teoría.',
      },
      {
        question: '¿Merece la pena preparar C1 en vez de C2?',
        answer: 'Depende de tu perfil. Si tienes bachillerato y tiempo suficiente para 45 temas, C1 ofrece mejor sueldo y más proyección profesional. Si prefieres un temario más corto y una primera oportunidad más accesible, C2 es una buena puerta de entrada con posibilidad de promoción interna posterior. En OpoRuta puedes preparar ambas oposiciones con el Pack Doble (79,99€).',
      },
      {
        question: '¿Cuánto cobra un Administrativo del Estado (C1) al mes?',
        answer: 'El sueldo bruto mensual de un Administrativo del Estado (C1) oscila entre 1.500 y 2.100€ con 14 pagas anuales. Incluye sueldo base (731,76€), complemento de destino nivel 18 (527,04€), complemento específico (variable, 300-600€ según ministerio) y productividad. Los destinos mejor pagados son SEPE, Interior y Hacienda. Con trienios (42,24€ cada 3 años), el sueldo aumenta progresivamente.',
      },
      {
        question: '¿Cuándo es el examen de Administrativo del Estado (C1) 2026?',
        answer: 'El examen está previsto para el 23 de mayo de 2026. IMPORTANTE: los exámenes de Administrativo (C1) y Auxiliar (C2) se celebran el mismo día y hora, por lo que solo puedes presentarte a uno. Consta de 70 preguntas test + 20 de supuesto práctico, con 100 minutos de duración total.',
      },
      {
        question: '¿Se puede teletrabajar como Administrativo del Estado (C1)?',
        answer: 'Sí. Los funcionarios de la AGE pueden teletrabajar hasta 3 días por semana (60% de la jornada), y hasta el 90% en casos especiales (discapacidad, cuidado de familiares). La disponibilidad varía según ministerio y puesto, pero la tendencia es creciente desde 2021. Es uno de los atractivos principales del puesto junto a la estabilidad y el horario.',
      },
      {
        question: '¿Se puede aprobar el C1 preparando por libre en 2 meses?',
        answer: 'Es difícil pero no imposible si ya tienes base de oposiciones (por ejemplo, si has preparado C2 antes). Los 45 temas comparten un 70-75% de contenido con C2. Con 3-4 horas diarias de estudio intenso, enfoque en los bloques de mayor peso (III y V) y práctica con simulacros reales, opositores con base previa han aprobado con 60-90 días de preparación intensiva.',
      },
    ],
  },
  {
    id: 'preparacion',
    title: 'Preparación y estrategia',
    items: [
      {
        question: '¿Se puede preparar la oposición de Auxiliar Administrativo por libre?',
        answer: 'Sí, y cada vez más opositores lo hacen con éxito. Se necesita: un temario oficial actualizado (~30-40€), una plataforma de práctica con tests tipo test y simulacros, y disciplina para mantener un plan de estudio de 4-6 meses. El ahorro respecto a una academia (100-250€/mes) es significativo: un opositor por libre con OpoRuta gasta unos 90€ en total frente a los 1.200-3.000€/año de una academia.',
      },
      {
        question: '¿Cuánto tiempo se necesita para preparar la oposición?',
        answer: 'Depende de tu dedicación. Con estudio intenso (3-4 horas/día), 4-5 meses suelen ser suficientes para el temario de Auxiliar (C2). Con dedicación moderada (1-2 horas/día), cuenta con 6-8 meses. Para Administrativo (C1), añade 2-3 meses más por los 17 temas adicionales y el supuesto práctico. Lo más importante es la constancia diaria, no las sesiones largas esporádicas.',
      },
      {
        question: '¿Cuál es la mejor estrategia para aprobar?',
        answer: 'Según los datos de OpoRuta, los opositores que aprueban comparten 3 hábitos: (1) priorizan los temas más preguntados — el Radar del Tribunal muestra que 5-6 temas concentran el 40% de las preguntas; (2) practican con simulacros completos bajo condiciones reales (100 preguntas, 90 min, penalización); (3) repasan errores activamente — la repetición espaciada es más efectiva que releer el temario.',
      },
      {
        question: '¿Son fiables las apps con IA para preparar oposiciones?',
        answer: 'Depende de la app. Las principales plataformas con IA para oposiciones en España en 2026 son: OpoRuta (verificación legal contra el BOE + análisis de exámenes INAP, pago único 49,99€), OpositaTest (banco de 303.000 preguntas curadas por expertos, desde 7,99€/mes), Toposiciones (genera tests desde tu PDF, suscripción), y Testualia (respaldada por Lanzadera/SPRI). La clave es que la IA esté respaldada por verificación contra fuentes oficiales.',
      },
      {
        question: '¿Qué errores comunes cometen los opositores?',
        answer: 'Los 5 errores más frecuentes son: (1) estudiar todos los temas por igual en vez de priorizar los más preguntados; (2) no practicar con simulacros bajo condiciones reales; (3) releer el temario pasivamente en vez de hacer tests activos; (4) no gestionar la penalización de -1/3 (dejar en blanco cuando no se puede descartar ninguna opción); (5) no mantener constancia — estudiar 5 horas un día y 0 los siguientes es menos efectivo que 1 hora todos los días.',
      },
      {
        question: '¿Cómo sé si estoy preparado para el examen?',
        answer: 'OpoRuta calcula tu Índice de Preparación (IPR) basándose en tu rendimiento en tests, constancia y progresión. Como referencia: si consigues >70% en simulacros completos de 100 preguntas bajo condiciones reales (con penalización y tiempo limitado), tienes opciones reales de superar la nota de corte. El nivel "preparado" del IPR (80+) indica que tus datos son similares a los de opositores que superaron convocatorias anteriores.',
      },
    ],
  },
]

/** Returns all FAQs flattened for JSON-LD */
export function getAllFaqs(): FaqItem[] {
  return faqSections.flatMap((s) => s.items)
}
