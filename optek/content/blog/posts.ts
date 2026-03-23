/**
 * Contenido del blog OpoRuta (§1.21.7)
 *
 * Posts como datos TypeScript — sin dependencias MDX.
 * El HTML se renderiza con dangerouslySetInnerHTML (contenido interno controlado).
 *
 * Workflow: Claude genera el draft → Aritz revisa → añadir aquí.
 * Para añadir un nuevo post: copiar la estructura de BlogPost y pegar al final del array.
 */

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string         // ISO 8601
  dateModified?: string // ISO 8601 — defaults to date if omitted
  keywords: string[]
  content: string      // HTML
  faqs?: { question: string; answer: string }[]  // renders FAQPage JSON-LD for rich snippets
}

export const blogPosts: BlogPost[] = [
  // ─── Post 1 ────────────────────────────────────────────────────────────────
  {
    slug: 'penalizacion-examen-auxiliar-administrativo',
    title: 'Penalización -1/3 en el examen Auxiliar Administrativo: ¿cuándo dejar en blanco?',
    description:
      'La regla clave: solo responde si puedes descartar al menos 2 opciones. Fórmula de la penalización -1/3 con ejemplos numéricos, cuándo arriesgar y simulacros con corrección automática.',
    date: '2026-02-25',
    keywords: [
      'penalización examen auxiliar administrativo',
      'auxiliar administrativo penalización -1/3',
      'puntuación examen INAP',
      'cómo calcular nota oposición',
    ],
    content: `
<h2>¿Qué es la penalización en el examen del Auxiliar Administrativo del Estado?</h2>
<p>
  El examen del Cuerpo General Auxiliar de la Administración del Estado (C2) aplica un
  sistema de penalización por respuestas incorrectas. Esto significa que no todas las
  respuestas tienen el mismo valor: acertar suma puntos, pero fallar también resta.
</p>
<p>La fórmula oficial es:</p>
<ul>
  <li><strong>Respuesta correcta:</strong> +1 punto</li>
  <li><strong>Respuesta incorrecta:</strong> -1/3 punto (−0,333…)</li>
  <li><strong>Respuesta en blanco:</strong> 0 puntos</li>
</ul>
<p>
  El examen consta de <strong>100 preguntas puntuables</strong> (+ 10 de reserva) de tipo test en 90 minutos:
  30 de teoría, 30 psicotécnicas y 50 de ofimática.
</p>

<h2>¿Cuándo dejar una pregunta en blanco?</h2>
<p>
  La regla matemática es sencilla: si no tienes seguridad de que tu respuesta es correcta,
  el valor esperado de responder es negativo cuando desconoces totalmente la respuesta (probabilidad 1/4 de acertar entre 4 opciones):
</p>
<ul>
  <li>Valor esperado de responder al azar: (1/4 × 1) + (3/4 × −1/3) = 0,25 − 0,25 = <strong>0</strong></li>
  <li>Valor de dejar en blanco: <strong>0</strong></li>
</ul>
<p>
  Estadísticamente, responder al azar y dejar en blanco tienen el mismo valor esperado.
  <strong>Sin embargo</strong>, si puedes eliminar una o dos opciones incorrectas, la probabilidad
  de acertar sube y deberías responder.
</p>
<p>
  La regla práctica que usan los mejores opositores: <strong>responde si puedes descartar al menos
  una opción</strong>. Si no sabes nada del tema, deja en blanco.
</p>

<h2>Ejemplo práctico de cálculo de nota</h2>
<p>Supongamos que en el examen respondes así:</p>
<ul>
  <li>70 preguntas correctas: 70 × 1 = +70 puntos</li>
  <li>15 preguntas incorrectas: 15 × (−1/3) = −5 puntos</li>
  <li>15 preguntas en blanco: 0 puntos</li>
</ul>
<p><strong>Nota final: 70 − 5 = 65 puntos sobre 100.</strong></p>
<p>
  Compara con dejar esas 15 preguntas incorrectas en blanco:
  70 − 0 = 70 puntos. La diferencia es de 5 puntos en la nota final.
</p>

<h2>¿Cómo entrenar con la penalización?</h2>
<p>
  El error más común de los opositores es estudiar con tests sin penalización y luego
  enfrentarse al examen real sin haber interiorizado cuándo no responder.
</p>
<p>
  OpoRuta aplica la penalización exacta del examen oficial en todos sus simulacros.
  Al completar un simulacro verás:
</p>
<ul>
  <li>Tu nota bruta (aciertos sin penalización)</li>
  <li>Tu nota real con penalización (la que cuenta)</li>
  <li>Cuántos puntos perdiste por respuestas incorrectas</li>
</ul>
<p>
  Con el tiempo, desarrollas el instinto de cuándo responder y cuándo no.
  Los examinadores diseñan las preguntas sabiendo que los opositores no entrenados
  "se la juegan" en las que dudan.
</p>

<h2>Estrategia para el día del examen</h2>
<ol>
  <li>Primera pasada: responde solo las que sabes con seguridad (sin dudas).</li>
  <li>Segunda pasada: revisa las que dejaste en blanco y aplica descarte.</li>
  <li>No cambies las respuestas marcadas como seguras en la primera pasada.</li>
  <li>En la última revisión: deja en blanco las que aún no estás seguro.</li>
</ol>
<p>
  La mayoría de los aprobados de Auxiliar obtienen entre 60 y 75 puntos.
  Con 70 preguntas correctas y buena gestión del blanco, estás en ese rango.
</p>

<h2>Practica con simulacros reales</h2>
<p>
  La única forma de entrenar la penalización correctamente es practicando con el formato
  exacto del examen: 100 preguntas, 90 minutos, y la misma penalización.
  OpoRuta ofrece simulacros basados en exámenes oficiales del INAP con el sistema de
  puntuación idéntico al real.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">Los artículos de la LPAC que más caen en el INAP</a> — para saber qué estudiar primero</li>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación 2025-2026</a> — temario, planificación y métodos de estudio</li>
  <li><a href="/examenes-oficiales">Simulacros oficiales INAP</a> — practica con las preguntas reales del tribunal</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuánto descuenta cada error en el examen de Auxiliar Administrativo?', answer: 'Cada respuesta incorrecta descuenta 1/3 del valor de un acierto (−0,333 puntos). Es decir, por cada 3 errores pierdes el equivalente a 1 acierto. Las preguntas en blanco no descuentan nada.' },
      { question: '¿Merece la pena responder si dudo entre dos opciones?', answer: 'Sí. Si puedes descartar al menos 1 de las 4 opciones, la probabilidad de acertar sube al 33% y el valor esperado es positivo. La regla de oro: responde si puedes eliminar alguna opción, deja en blanco si no sabes nada del tema.' },
      { question: '¿Cuántos puntos necesito para aprobar el examen de Auxiliar Administrativo?', answer: 'Necesitas un mínimo de 25 puntos sobre 50 en el cuestionario tipo test. La nota de corte real suele situarse entre 57 y 65 puntos sobre 100 según la convocatoria (2019: 57,5; 2022: 60; 2024: 65).' },
      { question: '¿Cómo practicar la penalización antes del examen?', answer: 'La forma más efectiva es hacer simulacros completos con penalización activada y tiempo limitado a 90 minutos. OpoRuta aplica la penalización exacta del examen oficial (-1/3) en todos sus simulacros con preguntas de exámenes INAP reales.' },
    ],
  },

  // ─── Post 2 ────────────────────────────────────────────────────────────────
  {
    slug: 'articulos-lpac-que-mas-caen-examen-inap',
    title: 'Los artículos de la LPAC que más caen en los exámenes del INAP (Auxiliar Administrativo)',
    description:
      'Análisis de los artículos de la Ley 39/2015 LPAC con más frecuencia en exámenes oficiales del INAP. Incluye ejemplos de preguntas tipo test y consejos para estudiarlos.',
    date: '2026-02-27',
    keywords: [
      'LPAC artículos más importantes examen',
      'preguntas LPAC examen INAP',
      'ley 39/2015 auxiliar administrativo',
      'artículos LPAC tipo test',
    ],
    content: `
<h2>¿Por qué la LPAC es fundamental en la oposición de Auxiliar?</h2>
<p>
  La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones
  Públicas (LPAC) es, junto con la CE, la ley que más preguntas genera en el examen del
  Cuerpo General Auxiliar del Estado. En exámenes recientes del INAP, entre 8 y 12 preguntas
  del Bloque I corresponden directamente a la LPAC.
</p>
<p>
  Dominar los artículos clave de la LPAC no es solo memorizar: es entender la lógica del
  procedimiento administrativo. Una vez que entiendes por qué el legislador estableció un plazo
  o una forma de notificación, la pregunta tipo test se vuelve evidente.
</p>

<h2>Los 8 artículos más frecuentes en exámenes INAP</h2>

<h3>Artículo 14 — Derecho y obligación de relacionarse electrónicamente</h3>
<p>
  Establece quiénes están <em>obligados</em> a relacionarse por medios electrónicos con la
  Administración (personas jurídicas, entidades sin personalidad, empleados públicos en
  el ejercicio de sus funciones...) y quiénes pueden elegir. Pregunta tipo test frecuente:
  "¿Están obligados los autónomos a relacionarse electrónicamente con la Administración?"
  (Respuesta: <strong>sí, por ser personas físicas que ejerzan actividad profesional con
  empleados a su cargo</strong> — aunque la redacción exacta ha cambiado con el RD 203/2021).
</p>

<h3>Artículo 21 — Obligación de resolver y plazo máximo</h3>
<p>
  La Administración tiene la obligación de resolver expresamente en todos los procedimientos.
  El <strong>plazo máximo general es 3 meses</strong> si la norma no establece uno específico.
  El incumplimiento genera silencio administrativo (art. 24-25).
</p>

<h3>Artículo 22 — Suspensión del plazo máximo</h3>
<p>
  Causas tasadas de suspensión del cómputo de plazos: requerimiento de documentación al
  interesado (máx. 3 meses), informes preceptivos y vinculantes (máx. 3 meses), actuaciones
  de órganos de la UE, situaciones de fuerza mayor, etc.
  Muy frecuente en test: confundir "suspensión" (art. 22) con "ampliación" (art. 23).
</p>

<h3>Artículo 30 — Cómputo de plazos</h3>
<p>
  Reglas de cómputo: días hábiles vs. días naturales; inicio del cómputo (día siguiente
  al de la notificación o publicación); sábados como días hábiles o no según el tipo
  de plazo. Pregunta frecuente: "Si el plazo es de 10 días hábiles y la notificación
  se recibe un viernes, ¿cuándo empieza a correr?"
</p>

<h3>Artículo 68 — Subsanación y mejora de solicitudes</h3>
<p>
  Si la solicitud de iniciación no reúne los requisitos: la Administración requerirá
  al interesado para que subsane en un plazo de <strong>10 días</strong>, con indicación
  de que si no lo hace se le tendrá por desistido. Plazo ampliable hasta 5 días más
  en circunstancias especiales.
</p>

<h3>Artículos 82-85 — Audiencia y alegaciones</h3>
<p>
  El trámite de audiencia (art. 82): antes de la propuesta de resolución, se da traslado
  al interesado por un plazo no inferior a 10 días ni superior a 15 días.
  Si el interesado formula alegaciones, deben ser respondidas en la resolución.
</p>

<h3>Artículo 103 — Revisión de oficio</h3>
<p>
  Las Administraciones pueden declarar de oficio la nulidad de sus propios actos
  en los supuestos del art. 47 (nulidad de pleno derecho) mediante dictamen del
  Consejo de Estado u órgano consultivo autonómico equivalente. Plazo: no hay plazo
  para iniciarla (a diferencia de la lesividad del art. 107, que tiene 4 años).
</p>

<h3>Artículos 40-46 — Notificaciones</h3>
<p>
  El régimen de notificaciones es uno de los temas más examinados:
</p>
<ul>
  <li>Práctica preferente: notificación electrónica para los obligados (art. 41)</li>
  <li>Intentos de notificación: 2 intentos en días y horas distintas (art. 42)</li>
  <li>Publicación en BOE como sustitutivo (art. 44): cuando no se conoce el domicilio
    o tras dos intentos fallidos en lugar físico</li>
  <li>Notificación en papel para no obligados: por correo certificado o en sede (art. 41)</li>
</ul>

<h2>Cómo estudiar la LPAC para el examen</h2>
<ol>
  <li>
    <strong>Lee el texto íntegro una vez</strong> (no es tan largo: 133 artículos).
    Entiende la estructura: Título I (interesados), II (actividad administrativa),
    III (actos administrativos), IV (disposiciones).
  </li>
  <li>
    <strong>Aprende los plazos concretos</strong>: son la fuente de preguntas más fácil
    para el examinador. Crea una tabla con todos los plazos.
  </li>
  <li>
    <strong>Practica con preguntas tipo test</strong> sobre artículos específicos.
    Las preguntas del INAP suelen ser literales ("según el artículo X de la LPAC...").
  </li>
  <li>
    <strong>Distingue LPAC (procedimiento) de LRJSP (organización)</strong>.
    La confusión entre ambas leyes es la trampa más habitual en el examen.
  </li>
</ol>

<h2>Practica con OpoRuta</h2>
<p>
  OpoRuta genera preguntas tipo test sobre artículos específicos de la LPAC con verificación
  determinista: cada pregunta cita el artículo exacto y OpoRuta verifica que ese artículo
  existe en la ley antes de mostrártela. Sin inventos. Sin alucinaciones.
</p>
<p>
  Puedes generar tests específicos del Tema 11 (LPAC/LRJSP) con 5 preguntas gratuitas
  sin tarjeta de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/diferencias-lpac-lrjsp-auxiliar-administrativo">Diferencias entre LPAC y LRJSP</a> — las preguntas trampa más frecuentes del examen</li>
  <li><a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">La Constitución en el examen</a> — artículos clave que más se preguntan</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Cómo funciona la penalización -1/3</a> — cuándo arriesgar y cuándo dejar en blanco</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué artículos de la LPAC caen más en el examen del INAP?', answer: 'Los artículos más preguntados de la Ley 39/2015 son: art. 53 (derechos del interesado), art. 21 (obligación de resolver), art. 31 (concepto de interesado), art. 66 (solicitudes de iniciación) y arts. 112-122 (recursos administrativos). Concentran más del 60% de las preguntas LPAC en exámenes INAP 2018-2024.' },
      { question: '¿Cuántas preguntas de la LPAC caen en el examen de Auxiliar Administrativo?', answer: 'Entre 8 y 12 preguntas del cuestionario tipo test suelen versar sobre la LPAC (Ley 39/2015). Es una de las leyes con más peso en el examen, junto con la Constitución y el TREBEP.' },
      { question: '¿La LPAC y la LRJSP se confunden en el examen?', answer: 'Sí, es una de las trampas más habituales del INAP. La LPAC (Ley 39/2015) regula el procedimiento administrativo desde el punto de vista del ciudadano, mientras que la LRJSP (Ley 40/2015) regula la organización interna de la Administración. Muchas preguntas mezclan artículos de ambas leyes.' },
      { question: '¿Cómo estudiar los artículos de la LPAC de forma eficiente?', answer: 'Prioriza los artículos más preguntados según el análisis de frecuencia de exámenes INAP. Estudia primero los títulos IV (procedimiento) y V (recursos), que concentran la mayoría de preguntas. Hacer tests específicos por tema ayuda a fijar los artículos clave.' },
    ],
  },

  // ─── Post 4 ────────────────────────────────────────────────────────────────
  {
    slug: 'psicotecnicas-examen-auxiliar-administrativo-estado',
    title: 'Psicotécnicas en el examen del Auxiliar Administrativo del Estado: tipos, ejemplos y cómo practicarlas',
    description:
      'Guía completa sobre las pruebas psicotécnicas del examen de Auxiliar: ortografía, sinónimos, series numéricas, comprensión verbal y razonamiento. Con ejemplos reales y estrategias de resolución.',
    date: '2026-03-01',
    keywords: [
      'psicotécnicas auxiliar administrativo estado',
      'test psicotécnico auxiliar administrativo',
      'pruebas psicotécnicas oposición auxiliar estado',
      'series numéricas oposición auxiliar administrativo',
      'ortografía examen auxiliar administrativo',
    ],
    content: `
<h2>¿Qué son las pruebas psicotécnicas en el examen de Auxiliar?</h2>
<p>
  El examen del Cuerpo General Auxiliar de la Administración del Estado (C2) incluye
  una prueba de conocimientos prácticos que combina dos bloques: el Bloque I (legislación)
  y el Bloque II (conocimientos prácticos de ofimática y psicotécnicas).
  Dentro del Bloque II, los ejercicios psicotécnicos evalúan capacidades cognitivas
  que se consideran necesarias para el puesto: razonamiento verbal, numérico y perceptivo.
</p>
<p>
  A diferencia del Bloque I (donde el estudio es principalmente memorístico), las
  psicotécnicas se mejoran principalmente con <strong>práctica repetida</strong>.
  No se "estudia" la regla del término siguiente de una serie — se automatiza el
  proceso resolviendo cientos de ellas.
</p>

<h2>Tipos de psicotécnicas en el examen de Auxiliar</h2>

<h3>1. Ortografía y uso del lenguaje</h3>
<p>
  Son las más fáciles de mejorar con práctica. El examinador presenta frases o palabras
  con posibles errores ortográficos y el opositor debe identificar la opción correcta.
  Errores frecuentes:
</p>
<ul>
  <li>Uso de <em>b/v</em>: "absorber" vs "abzorber", "volver" vs "bolber"</li>
  <li>Uso de <em>h</em>: "habitar" vs "avitar", "ahora" vs "aora"</li>
  <li>Tildación de palabras esdrújulas, llanas y agudas</li>
  <li>Uso correcto de <em>g/j</em>: "gerente" vs "jerente"</li>
</ul>
<p>
  Estrategia: lee en voz alta la opción que dudas. Nuestro oído suele detectar lo que
  el ojo pasa por alto. Para las tildes, recuerda siempre la regla antes de mirar las opciones.
</p>

<h3>2. Sinónimos y antónimos</h3>
<p>
  El examinador presenta una palabra y pide identificar su sinónimo o antónimo entre
  cuatro opciones. No es un test de vocabulario avanzado — las palabras suelen ser de
  uso común pero con significados sutilmente distintos.
</p>
<p>
  Ejemplo: "Sinónimo de RETICENTE: a) Entusiasta  b) Reluctante  c) Decidido  d) Nervioso"
  — Respuesta: <strong>b) Reluctante</strong>.
</p>
<p>
  Estrategia: si no conoces la palabra exacta, elimina las opciones que claramente
  están en la dirección contraria. En este caso, "Entusiasta" y "Decidido" tienen
  connotación positiva/activa mientras que "reticente" es negativo → descarta.
</p>

<h3>3. Series numéricas</h3>
<p>
  Se presenta una secuencia de números con un patrón oculto y hay que encontrar
  el siguiente (o el que falta). Los patrones más frecuentes son:
</p>
<ul>
  <li><strong>Progresiones aritméticas:</strong> 2, 5, 8, 11, __ (diferencia constante +3 → 14)</li>
  <li><strong>Progresiones geométricas:</strong> 3, 6, 12, 24, __ (×2 → 48)</li>
  <li><strong>Series de diferencias:</strong> 1, 2, 4, 7, 11, __ (diferencias: +1, +2, +3, +4 → +5 → 16)</li>
  <li><strong>Series alternadas:</strong> 1, 10, 2, 9, 3, 8, __ (dos series entrelazadas → 4)</li>
  <li><strong>Series cuadráticas:</strong> 1, 4, 9, 16, 25, __ (n² → 36)</li>
</ul>
<p>
  Estrategia: calcula siempre las diferencias entre términos consecutivos primero.
  Si las diferencias no son constantes, calcula las diferencias de las diferencias
  (segunda derivada). En un 80% de los casos esto revela el patrón.
</p>

<h3>4. Comprensión verbal y razonamiento analógico</h3>
<p>
  "LIBRO es a BIBLIOTECA como CUADRO es a ___": a) Museo  b) Pintor  c) Lienzo  d) Arte
  — Respuesta: <strong>a) Museo</strong> (lugar donde se conserva/exhibe).
</p>
<p>
  El razonamiento analógico mide la capacidad de identificar relaciones entre conceptos.
  Las categorías más frecuentes son: continente/contenido, parte/todo, creador/obra,
  herramienta/uso, antónimos, jerarquía.
</p>

<h3>5. Razonamiento espacial y series de figuras</h3>
<p>
  Aunque menos frecuente que las numéricas, pueden aparecer secuencias de figuras
  geométricas que siguen un patrón de rotación, reflexión o transformación. Aquí
  la práctica visual es fundamental: el cerebro aprende a reconocer estos patrones
  de forma automática tras resolver suficientes ejemplos.
</p>

<h2>Cuánto tiempo dedicar a cada tipo</h2>
<ul>
  <li><strong>Ortografía:</strong> 15 min/día durante 2 semanas → mejora rápida garantizada</li>
  <li><strong>Sinónimos:</strong> 10 min/día de lectura de textos variados + tests específicos</li>
  <li><strong>Series numéricas:</strong> 20 min/día durante 3-4 semanas (el progreso es exponencial)</li>
  <li><strong>Razonamiento analógico:</strong> 10 min/día, más fácil de dominar que las series</li>
</ul>
<p>
  La clave es la <strong>práctica diaria y constante</strong>, no las sesiones maratonianas.
  El cerebro necesita repetición distribuida para automatizar los patrones.
</p>

<h2>Practica psicotécnicas con OpoRuta</h2>
<p>
  OpoRuta incluye un motor específico de psicotécnicas que genera ejercicios al nivel
  del examen de Auxiliar: ortografía con distractores realistas, series numéricas con los
  patrones más frecuentes en exámenes INAP, y razonamiento analógico con las
  categorías habituales.
</p>
<p>
  Empieza gratis con tests en 3 temas de muestra. Sin tarjeta de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas del Auxiliar</a> — qué estudiar y en qué orden</li>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación</a> — planificación, métodos de estudio y herramientas</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Cómo funciona la penalización -1/3</a> — estrategia de respuesta para el examen</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Hay psicotécnicos en el examen de Auxiliar Administrativo del Estado?', answer: 'Sí. Aproximadamente 30 de las 100 preguntas puntuables son de carácter psicotécnico: series numéricas, series alfabéticas, analogías, razonamiento lógico y comprensión verbal. No es una prueba separada, sino que se integran en el cuestionario tipo test.' },
      { question: '¿Qué tipos de psicotécnicos caen en el examen del INAP?', answer: 'Los más frecuentes son series numéricas (identificar el patrón de una secuencia), analogías verbales, razonamiento lógico (silogismos y deducciones) y comprensión lectora de textos administrativos. Las series alfabéticas y el cálculo mental también aparecen, aunque con menor frecuencia.' },
      { question: '¿Cómo preparar los psicotécnicos de la oposición de Auxiliar?', answer: 'La clave es practicar a diario con ejercicios cronometrados. Empieza por las categorías más frecuentes (series numéricas y razonamiento lógico) y dedica 15-20 minutos diarios. OpoRuta genera psicotécnicos específicos por categoría con dificultad adaptativa.' },
      { question: '¿Cuánto tiempo tengo para cada pregunta psicotécnica?', answer: 'El examen completo dura 90 minutos para 100 preguntas, lo que da una media de 54 segundos por pregunta. Se recomienda dedicar menos tiempo a las psicotécnicas fáciles (30-40 s) para reservar más para las de razonamiento lógico complejo.' },
    ],
  },

  // ─── Post 5 ────────────────────────────────────────────────────────────────
  {
    slug: 'temario-auxiliar-administrativo-estado-2025-2026',
    title: 'Temario Auxiliar Administrativo del Estado 2025-2026: los 28 temas desglosados',
    description:
      'Los 28 temas desglosados: Bloque I (Constitución, LPAC, TREBEP...) y Bloque II (Word, Excel, Access). Cuáles caen más según exámenes INAP reales, cuáles son más fáciles y plan de estudio por bloques.',
    date: '2026-03-03',
    keywords: [
      'temario auxiliar administrativo estado 2025',
      'temas oposición auxiliar administrativo estado',
      'bloque I bloque II auxiliar administrativo',
      'cuerpo general auxiliar AGE temario',
      'oposiciones auxiliar administrativo estado 2026',
    ],
    content: `
<h2>El temario oficial del Auxiliar Administrativo del Estado</h2>
<p>
  El temario del Cuerpo General Auxiliar de la Administración del Estado (C2) se divide
  en <strong>dos bloques</strong> con un total de 28 temas. El examen consta de <strong>100 preguntas
  puntuables</strong> tipo test (30 teoría + 30 psicotécnicos + 40 ofimática), más 10 de reserva, en 90 minutos, con penalización −1/3. El temario es el mismo para las convocatorias de
  2025 y 2026 (salvo modificación del BOE).
</p>
<p>
  Aquí tienes el resumen completo de los 28 temas, con indicación de su peso habitual
  en los exámenes oficiales del INAP.
</p>

<h2>Bloque I — Organización pública (16 temas)</h2>
<p>
  Estos 16 temas generan las 30 preguntas teóricas de la primera parte del examen.
  Son los que más peso tienen junto con las psicotécnicas.
</p>
<ul>
  <li><strong>T1:</strong> La Constitución Española de 1978. Principios constitucionales y valores superiores. Derechos y deberes fundamentales. Su garantía y suspensión.</li>
  <li><strong>T2:</strong> El Tribunal Constitucional. La reforma de la Constitución. La Corona: funciones constitucionales del Rey. Sucesión y regencia.</li>
  <li><strong>T3:</strong> Las Cortes Generales: composición, atribuciones y funcionamiento del Congreso de los Diputados y Senado. El Defensor del Pueblo.</li>
  <li><strong>T4:</strong> El Poder Judicial. El Consejo General del Poder Judicial. El Tribunal Supremo. La organización judicial española.</li>
  <li><strong>T5:</strong> El Gobierno y la Administración. El Presidente del Gobierno. El Consejo de Ministros. Designación, causas de cese y responsabilidad del Gobierno.</li>
  <li><strong>T6:</strong> El Gobierno Abierto: concepto y principios informadores. La Agenda 2030 y los Objetivos de Desarrollo Sostenible.</li>
  <li><strong>T7:</strong> La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno.</li>
  <li><strong>T8:</strong> La Administración General del Estado. Órganos centrales, superiores y directivos. Órganos territoriales. Otros órganos administrativos. La Administración del Estado en el exterior.</li>
  <li><strong>T9:</strong> La Organización territorial del Estado. Las Comunidades Autónomas. La Administración local: provincia, municipio e isla.</li>
  <li><strong>T10:</strong> La organización de la Unión Europea. El Consejo Europeo, el Consejo, el Parlamento Europeo, la Comisión Europea y el Tribunal de Justicia de la UE.</li>
  <li><strong>T11:</strong> Las Leyes del Procedimiento Administrativo Común (LPAC) y del Régimen Jurídico del Sector Público (LRJSP). El procedimiento administrativo común y sus fases. Revisión de actos. Recursos administrativos. El recurso contencioso-administrativo.</li>
  <li><strong>T12:</strong> La protección de datos personales y su régimen jurídico: principios, derechos y obligaciones.</li>
  <li><strong>T13:</strong> El personal funcionario al servicio de las Administraciones públicas: concepto y clases. Régimen jurídico. Registro Central de Personal. OEP. Selección. Provisión de puestos. Situaciones administrativas.</li>
  <li><strong>T14:</strong> Derechos y deberes de los funcionarios. La carrera administrativa. Promoción interna. Retribuciones e indemnizaciones. Régimen disciplinario. Seguridad Social de los funcionarios.</li>
  <li><strong>T15:</strong> El presupuesto del Estado en España. Contenido, elaboración y estructura. Fases del ciclo presupuestario.</li>
  <li><strong>T16:</strong> Políticas de igualdad y contra la violencia de género. Políticas de igualdad de trato y no discriminación de las personas LGTBI. Discapacidad y dependencia: régimen jurídico.</li>
</ul>

<h2>Bloque II — Actividad administrativa y ofimática (12 temas)</h2>
<p>
  Estos 12 temas generan las 50 preguntas de la segunda parte. Las preguntas sobre
  Windows y Office se refieren a <strong>Windows 11 y Microsoft 365 versión de escritorio</strong>.
</p>
<ul>
  <li><strong>T17:</strong> Atención al público: acogida e información al ciudadano. Atención de personas con discapacidad.</li>
  <li><strong>T18:</strong> Los servicios de información administrativa. Información general y particular al ciudadano. Iniciativas. Reclamaciones. Quejas. Peticiones.</li>
  <li><strong>T19:</strong> Concepto de documento, registro y archivo. Funciones del registro y del archivo. Clases de archivo y criterios de ordenación.</li>
  <li><strong>T20:</strong> Administración electrónica y servicios al ciudadano. Páginas web de carácter público. Servicios telemáticos. Oficinas integradas. Ventanilla única empresarial. El Punto de Acceso General de la AGE.</li>
  <li><strong>T21:</strong> Informática básica: conceptos fundamentales sobre el hardware y el software. Sistemas de almacenamiento de datos. Sistemas operativos. Nociones básicas de seguridad informática.</li>
  <li><strong>T22:</strong> Introducción al sistema operativo: el entorno Windows. Ventanas, iconos, menús contextuales, cuadros de diálogo. El escritorio y sus elementos. El menú inicio. Copilot.</li>
  <li><strong>T23:</strong> El explorador de Windows. Gestión de carpetas y archivos. Operaciones de búsqueda. Herramientas "Este equipo" y "Acceso rápido". Accesorios. Herramientas del sistema.</li>
  <li><strong>T24:</strong> Procesadores de texto: Word 365. Principales funciones y utilidades. Creación y estructuración del documento. Gestión, grabación, recuperación e impresión de ficheros.</li>
  <li><strong>T25:</strong> Hojas de cálculo: Excel 365. Principales funciones y utilidades. Libros, hojas y celdas. Fórmulas y funciones. Gráficos. Gestión de datos.</li>
  <li><strong>T26:</strong> Bases de datos: Access 365. Principales funciones y utilidades. Tablas. Consultas. Formularios. Informes. Relaciones. Importación, vinculación y exportación de datos.</li>
  <li><strong>T27:</strong> Correo electrónico: Outlook 365. Conceptos elementales y funcionamiento. Enviar, recibir, responder y reenviar mensajes. Reglas de mensaje. Libreta de direcciones.</li>
  <li><strong>T28:</strong> La Red Internet: origen, evolución y estado actual. Conceptos elementales sobre protocolos y servicios en Internet. Funcionalidades básicas de los navegadores web.</li>
</ul>
<p>
  <em>Nota: las pruebas psicotécnicas (30 preguntas en la primera parte) no forman parte
  del temario como tal — evalúan aptitudes administrativas, numéricas y verbales propias
  del cuerpo. Se preparan con práctica, no con estudio de temas.</em>
</p>

<h2>Cómo organizar el estudio</h2>
<ol>
  <li>
    <strong>Empieza por los temas de alto rendimiento:</strong> T1-T3 (CE), T11 (LPAC/LRJSP)
    y T13-T14 (TREBEP). Estos temas representan entre el 40% y el 50% de las preguntas
    teóricas en exámenes recientes.
  </li>
  <li>
    <strong>Paraleliza el Bloque II:</strong> Dedica 15-20 minutos al día a psicotécnicas
    y a repasar funciones concretas de Word/Excel (T24-T25). El Bloque II no se
    estudia — se practica.
  </li>
  <li>
    <strong>Temas de menor rendimiento:</strong> T6 (Gobierno Abierto), T10 (UE) y T15 (Presupuesto)
    suelen generar menos preguntas. Estúdialos en la fase final, cuando tengas los temas clave dominados.
  </li>
  <li>
    <strong>Haz tests por tema desde el día 1:</strong> Leer sin testar es la forma más
    lenta de preparar una oposición. Cada vez que terminas un tema, genera 10 preguntas
    tipo test sobre él.
  </li>
</ol>

<h2>Practica el temario completo con OpoRuta</h2>
<p>
  OpoRuta cubre los 28 temas de Auxiliar con preguntas tipo test generadas por IA y verificadas
  con cita legal exacta. Puedes generar tests por tema, por bloque, o simular el examen
  completo con 100 preguntas puntuables y penalización real.
</p>
<p>
  Los primeros 5 tests son completamente gratuitos — sin tarjeta de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">Artículos de la LPAC que más caen</a> — análisis de frecuencia en exámenes INAP</li>
  <li><a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">Constitución Española en el examen</a> — los artículos clave</li>
  <li><a href="/blog/psicotecnicas-examen-auxiliar-administrativo-estado">Psicotécnicas del examen</a> — tipos, ejemplos y cómo practicarlas</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuántos temas tiene el temario de Auxiliar Administrativo del Estado?', answer: 'El temario consta de 28 temas divididos en 2 bloques: Bloque I (Organización Pública, 16 temas) que abarca Constitución, administración y empleo público; y Bloque II (Actividad Administrativa y Ofimática, 12 temas) que cubre gestión documental, Word, Excel y administración electrónica.' },
      { question: '¿Ha cambiado el temario de Auxiliar Administrativo para 2025-2026?', answer: 'El temario se actualizó con la OEP 2024 e incorpora cambios legislativos recientes: actualización del TREBEP, la Ley 4/2022 de consumidores y las modificaciones de la LPAC. Para la convocatoria de mayo 2026 se mantiene este temario vigente.' },
      { question: '¿Qué bloque del temario es más importante para el examen?', answer: 'El Bloque I (Organización Pública) tiene más peso en el cuestionario teórico, con especial énfasis en Constitución, LPAC y TREBEP. El Bloque II (Ofimática) es crucial para la prueba práctica de Word y Excel. Ambos son necesarios para aprobar.' },
      { question: '¿Por qué temas debo empezar a estudiar?', answer: 'Se recomienda empezar por los temas más preguntados en exámenes INAP: T1 (Constitución), T8 (AGE), T13 (Empleo público) y T5 (LPAC). Según el análisis de frecuencia de OpoRuta, estos 4 temas concentran más del 30% de las preguntas históricas.' },
    ],
  },

  // ─── Post 3 ────────────────────────────────────────────────────────────────
  {
    slug: 'diferencias-lpac-lrjsp-auxiliar-administrativo',
    title: 'Diferencias entre LPAC y LRJSP para el examen Auxiliar Administrativo del Estado',
    description:
      'Guía clara para distinguir la Ley 39/2015 (LPAC) y la Ley 40/2015 (LRJSP) en el examen de Auxiliar: qué regula cada una y las preguntas trampa más frecuentes.',
    date: '2026-03-05',
    keywords: [
      'diferencia LPAC LRJSP',
      'ley 39/2015 ley 40/2015 auxiliar administrativo',
      'LPAC vs LRJSP examen de Auxiliar',
      'tema 11 auxiliar administrativo',
    ],
    content: `
<h2>La confusión más frecuente en el examen de Auxiliar</h2>
<p>
  La distinción entre la Ley 39/2015 (LPAC) y la Ley 40/2015 (LRJSP) es una de las
  trampas más frecuentes en el examen del Auxiliar Administrativo del Estado. Ambas
  leyes se aprobaron el mismo día, están íntimamente relacionadas, y regulan materias
  que el legislador separó deliberadamente.
</p>
<p>
  Entender la lógica de esa separación te permite responder preguntas tipo test
  incluso sin memorizar el artículo exacto.
</p>

<h2>La regla mnemotécnica fundamental</h2>
<p>
  <strong>LPAC (Ley 39/2015) = el procedimiento</strong> (cómo actúa la Administración
  con los ciudadanos y empresas)<br/>
  <strong>LRJSP (Ley 40/2015) = la organización</strong> (cómo se estructura la
  Administración internamente)
</p>
<p>
  Si la pregunta habla de <em>cómo</em> tramita la Administración una solicitud,
  una notificación, un recurso o un silencio → LPAC.<br/>
  Si la pregunta habla de <em>cómo se organiza</em> la Administración (órganos,
  delegación, competencias, relaciones entre Administraciones) → LRJSP.
</p>

<h2>Qué regula la LPAC (Ley 39/2015)</h2>
<ul>
  <li>Derechos de los ciudadanos ante la Administración (art. 13)</li>
  <li>Capacidad de obrar y representación (arts. 3-6)</li>
  <li>Registro electrónico general (art. 16)</li>
  <li>Plazos: cómputo, suspensión, ampliación (arts. 30-32)</li>
  <li>Procedimiento administrativo: inicio, instrucción, terminación (arts. 54-98)</li>
  <li>Notificaciones y publicaciones (arts. 40-46)</li>
  <li>Actos administrativos: requisitos, motivación, silencio (arts. 34-52)</li>
  <li>Recursos administrativos: alzada, reposición (arts. 112-126)</li>
  <li>Revisión de oficio y declaración de lesividad (arts. 106-111)</li>
  <li>Iniciativa legislativa y potestad reglamentaria (arts. 127-133)</li>
</ul>

<h2>Qué regula la LRJSP (Ley 40/2015)</h2>
<ul>
  <li>Principios de actuación de las Administraciones Públicas (arts. 3-7)</li>
  <li>Órganos administrativos: creación, competencia, delegación, avocación (arts. 8-19)</li>
  <li>Funcionamiento electrónico del sector público (arts. 38-46)</li>
  <li>Relaciones entre Administraciones: cooperación, conflictos (arts. 47-60)</li>
  <li>Convenios administrativos (arts. 47-53)</li>
  <li>Conferencias sectoriales y órganos de cooperación (arts. 147-160)</li>
  <li>Responsabilidad patrimonial de las Administraciones (arts. 32-37)</li>
  <li>Organización de la AGE: ministerios, secretarías, subsecretarías (arts. 55-74)</li>
  <li>Organismos públicos: agencias, empresas públicas, fundaciones (arts. 84-158)</li>
</ul>

<h2>Preguntas trampa más frecuentes en el examen</h2>

<h3>Trampa 1: Responsabilidad patrimonial</h3>
<p>
  "El régimen de responsabilidad patrimonial de las Administraciones está regulado en la..."
  — Muchos opositores dicen LPAC (porque trata de "ciudadanos y Administración").
  <strong>Respuesta correcta: LRJSP (arts. 32-37)</strong>.
</p>

<h3>Trampa 2: Silencio administrativo</h3>
<p>
  "El silencio administrativo está regulado en la..."
  <strong>Respuesta: LPAC (arts. 24-25)</strong>.
  El silencio es consecuencia del incumplimiento del deber de resolver, que es
  materia de procedimiento → LPAC.
</p>

<h3>Trampa 3: Delegación de competencias</h3>
<p>
  "La delegación de competencias entre órganos administrativos se regula en..."
  <strong>Respuesta: LRJSP (art. 9)</strong>.
  Las competencias son atributo de los órganos → organización → LRJSP.
</p>

<h3>Trampa 4: Principio de eficacia</h3>
<p>
  "El principio de eficacia al que están sometidas las Administraciones Públicas
  está recogido en..."
  <strong>Respuesta: CE art. 103 y LRJSP art. 3</strong>.
  Los principios de actuación de la Administración son materia de LRJSP.
</p>

<h2>La tabla de diferencias en 30 segundos</h2>
<table>
  <thead>
    <tr>
      <th>LPAC (39/2015)</th>
      <th>LRJSP (40/2015)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Procedimiento administrativo</td><td>Organización y régimen jurídico</td></tr>
    <tr><td>Actos administrativos</td><td>Órganos y competencias</td></tr>
    <tr><td>Notificaciones</td><td>Delegación y avocación</td></tr>
    <tr><td>Plazos</td><td>Conferencias sectoriales</td></tr>
    <tr><td>Recursos (alzada, reposición)</td><td>Responsabilidad patrimonial</td></tr>
    <tr><td>Revisión de oficio</td><td>Organismos públicos (OOAA, Agencias...)</td></tr>
    <tr><td>Silencio administrativo</td><td>Convenios administrativos</td></tr>
    <tr><td>Iniciativa legislativa</td><td>Relaciones interadministrativas</td></tr>
  </tbody>
</table>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">Artículos de la LPAC que más caen en el INAP</a> — desglose por artículo y convocatoria</li>
  <li><a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">La Constitución en el examen</a> — artículos clave del Bloque I</li>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas</a> — organización y prioridades</li>
  <li><a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">¿También preparas el C1?</a> — los 45 temas del Administrativo desglosados</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuál es la diferencia entre la LPAC y la LRJSP?', answer: 'La LPAC (Ley 39/2015) regula la relación ciudadano-Administración: procedimiento administrativo, plazos, recursos y silencio administrativo. La LRJSP (Ley 40/2015) regula la organización interna: órganos colegiados, delegación de competencias, convenios y responsabilidad patrimonial.' },
      { question: '¿Preguntan en el examen diferencias entre LPAC y LRJSP?', answer: 'Sí, es una de las trampas más frecuentes del INAP. Las preguntas suelen atribuir artículos de una ley a la otra (p. ej., ubicar los órganos colegiados en la LPAC cuando están en la LRJSP). Distinguir qué regula cada ley es fundamental para no caer en estos errores.' },
      { question: '¿Qué artículos de la LRJSP son más importantes para el examen?', answer: 'Los más preguntados son: arts. 5-8 (órganos administrativos), arts. 15-18 (delegación y avocación de competencias), arts. 19-22 (órganos colegiados) y arts. 32-37 (responsabilidad patrimonial). Estos artículos aparecen recurrentemente en exámenes INAP.' },
      { question: '¿Es más difícil la LPAC o la LRJSP?', answer: 'La LPAC suele considerarse más extensa y con más artículos memorísticos (plazos, recursos), mientras que la LRJSP es más conceptual (organización, competencias). La dificultad real está en no confundirlas entre sí. Estudiarlas en paralelo ayuda a fijar las diferencias.' },
    ],
  },

  // ─── Post 6 ────────────────────────────────────────────────────────────────
  {
    slug: 'constitucion-espanola-preguntas-examen-auxiliar-administrativo',
    title: 'La Constitución Española en el examen de Auxiliar: artículos clave y preguntas más frecuentes',
    description:
      'Los artículos de la Constitución Española que más se examinan en las oposiciones del Auxiliar Administrativo del Estado: derechos fundamentales, órganos constitucionales y estructura del Estado.',
    date: '2026-03-06',
    keywords: [
      'Constitución española examen auxiliar administrativo',
      'artículos CE oposición auxiliar administrativo',
      'preguntas Constitución española INAP',
      'derechos fundamentales examen auxiliar administrativo',
      'tema 1 auxiliar administrativo estado',
    ],
    content: `
<h2>La Constitución Española: el punto de partida del temario de Auxiliar</h2>
<p>
  La Constitución Española de 1978 es la norma suprema del ordenamiento jurídico español
  y también el punto de partida del temario del Cuerpo General Auxiliar del Estado.
  Los Temas 1, 2 y 3 del temario oficial giran en torno a ella, y en exámenes recientes
  del INAP entre <strong>8 y 14 preguntas</strong> de las 100 totales provienen
  directamente de la CE.
</p>
<p>
  La CE tiene 169 artículos organizados en un Título Preliminar y diez Títulos.
  No es necesario memorizar todos — pero sí dominar con precisión los artículos
  que el INAP examina de forma sistemática.
</p>

<h2>Artículos de la CE más examinados en la oposición de Auxiliar</h2>

<h3>Artículo 1 — España como Estado social y democrático de Derecho</h3>
<p>
  "España se constituye en un Estado social y democrático de Derecho, que propugna
  como valores superiores de su ordenamiento jurídico la libertad, la justicia, la
  igualdad y el pluralismo político."
</p>
<p>
  Pregunta frecuente: "¿Cuáles son los valores superiores del ordenamiento jurídico
  español según el Art. 1.1 CE?" — Los cuatro valores en el orden exacto.
</p>

<h3>Artículo 2 — La nación española y las Comunidades Autónomas</h3>
<p>
  "La Constitución se fundamenta en la indisoluble unidad de la Nación española,
  patria común e indivisible de todos los españoles, y reconoce y garantiza el derecho
  a la autonomía de las nacionalidades y regiones que la integran."
</p>
<p>
  Trampa clásica: la CE "reconoce" la autonomía, no la "crea". La potestad de
  autonomía preexiste a la Constitución.
</p>

<h3>Artículos 14-29 — Derechos fundamentales y libertades públicas</h3>
<p>
  Esta sección (Sección 1.ª del Capítulo II del Título I) contiene los derechos
  con mayor protección jurídica: recurso de amparo ante el Tribunal Constitucional
  y desarrollo mediante Ley Orgánica. Los más examinados:
</p>
<ul>
  <li><strong>Art. 14:</strong> Igualdad ante la ley. Prohibición de discriminación.</li>
  <li><strong>Art. 16:</strong> Libertad ideológica, religiosa y de culto. Aconfesionalidad del Estado.</li>
  <li><strong>Art. 18:</strong> Derecho al honor, intimidad, propia imagen e inviolabilidad del domicilio.</li>
  <li><strong>Art. 20:</strong> Libertad de expresión, información, cátedra y producción artística.</li>
  <li><strong>Art. 23:</strong> Derecho de participación política y acceso a cargos públicos.</li>
  <li><strong>Art. 24:</strong> Tutela judicial efectiva. Derecho a no declarar contra uno mismo.</li>
  <li><strong>Art. 28:</strong> Libertad sindical y derecho de huelga.</li>
</ul>

<h3>Artículos 30-38 — Derechos y deberes de los ciudadanos</h3>
<p>
  Con protección inferior (refuerzo legislativo pero no Ley Orgánica ni amparo):
</p>
<ul>
  <li><strong>Art. 30:</strong> Deber de defender España. Objeción de conciencia.</li>
  <li><strong>Art. 31:</strong> Deber de contribuir al sostenimiento del gasto público.</li>
  <li><strong>Art. 35:</strong> Derecho y deber al trabajo. Libre elección de profesión u oficio.</li>
  <li><strong>Art. 38:</strong> Libertad de empresa en el marco de la economía de mercado.</li>
</ul>

<h3>Artículo 56 — El Rey</h3>
<p>
  "El Rey es el Jefe del Estado, símbolo de su unidad y permanencia, arbitra y modera
  el funcionamiento regular de las instituciones, asume la más alta representación del
  Estado español en las relaciones internacionales..."
</p>
<p>
  El artículo 62 CE enumera las funciones del Rey. El artículo 65 regula el presupuesto
  de la Casa Real. Ambos son fuente habitual de preguntas.
</p>

<h3>Artículos 66-80 — Las Cortes Generales</h3>
<ul>
  <li><strong>Art. 66:</strong> Las Cortes representan al pueblo español y están formadas por el Congreso y el Senado.</li>
  <li><strong>Art. 68:</strong> Congreso: entre 300 y 400 diputados (<strong>actualmente 350</strong>), mandato de 4 años.</li>
  <li><strong>Art. 69:</strong> Senado: Cámara de representación territorial.</li>
  <li><strong>Art. 72:</strong> Autonomía de las Cámaras: reglamentos propios, presupuesto autónomo.</li>
</ul>

<h3>Artículo 97 — El Gobierno</h3>
<p>
  "El Gobierno dirige la política interior y exterior, la Administración civil y militar
  y la defensa del Estado. Ejerce la función ejecutiva y la potestad reglamentaria de
  acuerdo con la Constitución y las leyes."
</p>
<p>
  El artículo 98 establece la composición del Gobierno (Presidente, Vicepresidentes,
  Ministros y demás miembros que establezca la ley). Muy examinado junto con el
  artículo 100 (nombramiento de Ministros: a propuesta del Presidente, por el Rey).
</p>

<h3>Artículo 103 — La Administración Pública</h3>
<p>
  "La Administración Pública sirve con objetividad los intereses generales y actúa
  de acuerdo con los principios de eficacia, jerarquía, descentralización,
  desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho."
</p>
<p>
  Este artículo es el fundamento constitucional de toda la LRJSP. Memoriza los
  cinco principios en orden: eficacia, jerarquía, descentralización,
  desconcentración y coordinación.
</p>

<h3>Artículo 117 — El Poder Judicial</h3>
<p>
  "La justicia emana del pueblo y se administra en nombre del Rey por Jueces y
  Magistrados integrantes del Poder Judicial, independientes, inamovibles, responsables
  y sometidos únicamente al imperio de la ley."
</p>
<p>
  El Tribunal Supremo (art. 123) y el Tribunal Constitucional (arts. 159-165)
  son fuente de preguntas frecuentes. El TC tiene <strong>12 magistrados</strong>
  con mandato de <strong>9 años</strong>, renovándose por tercios cada 3 años.
</p>

<h2>Técnica de estudio para la CE en el examen de Auxiliar</h2>
<ol>
  <li>
    <strong>Aprende la estructura primero:</strong> Título Preliminar + 10 Títulos.
    Saber en qué Título está cada materia te permite descartar opciones incorrectas
    aunque no recuerdes el artículo exacto.
  </li>
  <li>
    <strong>Memoriza números clave:</strong> 350 diputados (art. 68), 12 magistrados
    TC (art. 159), mandato 4 años (Congreso/Presidente), 9 años (magistrados TC).
  </li>
  <li>
    <strong>Distingue la Sección 1.ª (derechos fundamentales) de la Sección 2.ª
    (derechos y deberes):</strong> la diferencia de protección jurídica es pregunta
    directa habitual.
  </li>
  <li>
    <strong>Practica preguntas literales:</strong> el INAP suele pedir el artículo
    exacto o la redacción exacta de la CE. No te conformes con "entender" el concepto:
    memoriza las frases clave.
  </li>
</ol>

<h2>Practica los temas constitucionales con OpoRuta</h2>
<p>
  OpoRuta genera preguntas tipo test sobre artículos específicos de la Constitución
  Española con la misma dificultad y formato que los exámenes oficiales del INAP.
  Cada pregunta incluye la cita del artículo exacto para que puedas verificar
  la fuente y reforzar la memorización.
</p>
<p>
  Puedes empezar con los Temas 1-3 (CE) de forma completamente gratuita.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">Artículos de la LPAC que más caen</a> — la otra ley estrella del examen</li>
  <li><a href="/blog/trebep-articulos-clave-examen-auxiliar-administrativo">TREBEP: artículos clave</a> — derechos, deberes y situaciones administrativas</li>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas</a> — cómo organizarlos y priorizarlos</li>
  <li><a href="/blog/constitucion-espanola-oposiciones-age-articulos-clave">Constitución para C1 y C2</a> — los mismos artículos clave sirven para ambas oposiciones</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué artículos de la Constitución caen más en el examen de Auxiliar Administrativo?', answer: 'Los más preguntados son: art. 1 (Estado social y democrático), art. 9 (principio de legalidad), art. 14 (igualdad), arts. 15-29 (derechos fundamentales), art. 103 (principios de la Administración), art. 106 (control judicial) y el Título VIII (organización territorial). El Tema 1 (Constitución) es el más preguntado históricamente en exámenes INAP.' },
      { question: '¿Cuántas preguntas de la Constitución caen en el examen?', answer: 'Entre 8 y 15 preguntas del cuestionario versan directa o indirectamente sobre la Constitución. Es el tema con más peso en el examen, con 50 apariciones en los exámenes INAP analizados (2018-2024).' },
      { question: '¿Hay que memorizar todos los artículos de la Constitución?', answer: 'No. La Constitución tiene 169 artículos, pero para el examen de Auxiliar basta con dominar unos 40-50 artículos clave. Céntrate en el Título Preliminar, los derechos fundamentales (Título I), la Corona y las Cortes (Títulos II-III), el Gobierno y la Administración (Título IV) y la organización territorial (Título VIII).' },
      { question: '¿Preguntan sobre la reforma de la Constitución en el examen?', answer: 'Sí, el procedimiento de reforma (arts. 166-169) aparece con cierta frecuencia. Hay que distinguir la reforma ordinaria (art. 167, mayoría 3/5) de la agravada (art. 168, 2/3 + disolución + referéndum). Solo se ha reformado dos veces: en 1992 (art. 13.2, Maastricht) y en 2011 (art. 135, estabilidad presupuestaria).' },
    ],
  },

  // ─── Post 7 ────────────────────────────────────────────────────────────────
  {
    slug: 'trebep-articulos-clave-examen-auxiliar-administrativo',
    title: 'TREBEP en el examen de Auxiliar: artículos del Estatuto Básico del Empleado Público que más caen',
    description:
      'Los artículos del TREBEP que más se examinan en el Auxiliar Administrativo del Estado: derechos, deberes, código ético, situaciones administrativas y acceso a la función pública.',
    date: '2026-03-08',
    keywords: [
      'TREBEP preguntas examen auxiliar administrativo',
      'estatuto básico empleado público auxiliar estado',
      'artículos TREBEP tipo test INAP',
      'derechos funcionarios examen oposición',
      'tema 13 14 auxiliar administrativo estado',
    ],
    content: `
<h2>Por qué el TREBEP es imprescindible para el examen de Auxiliar</h2>
<p>
  El Real Decreto Legislativo 5/2015, de 30 de octubre, por el que se aprueba el texto
  refundido de la Ley del Estatuto Básico del Empleado Público (TREBEP) es la norma marco
  que regula la relación de empleo público en España. Para el Cuerpo General Auxiliar del
  Estado, los <strong>Temas 13 y 14</strong> del temario oficial desarrollan en profundidad
  el TREBEP: personal al servicio de las Administraciones Públicas, derechos, deberes,
  código de conducta y régimen disciplinario.
</p>
<p>
  En exámenes recientes del INAP, entre <strong>6 y 10 preguntas</strong> de las 100
  totales provienen directamente del TREBEP. A diferencia de la LPAC o la CE, las preguntas
  del TREBEP son habitualmente más conceptuales: piden identificar qué tipo de personal
  es un funcionario interino, cuáles son los deberes del empleado público, o qué situaciones
  administrativas existen.
</p>

<h2>Estructura del TREBEP: lo que necesitas saber</h2>
<p>El TREBEP tiene 10 Títulos. Para el examen de Auxiliar, los más relevantes son:</p>
<table>
  <thead><tr><th>Título</th><th>Contenido clave</th></tr></thead>
  <tbody>
    <tr><td>Título I (Arts. 1-7)</td><td>Objeto, ámbito de aplicación, clases de personal</td></tr>
    <tr><td>Título II (Arts. 8-19)</td><td>Personal funcionario, laboral, eventual e interino</td></tr>
    <tr><td>Título III (Arts. 20-26)</td><td>Derechos individuales y colectivos</td></tr>
    <tr><td>Título V (Arts. 52-54)</td><td>Deberes de los empleados públicos y código ético</td></tr>
    <tr><td>Título VI (Arts. 55-62)</td><td>Acceso al empleo público</td></tr>
    <tr><td>Título VII (Arts. 63-84)</td><td>Ordenación de la actividad profesional</td></tr>
    <tr><td>Título VIII (Arts. 85-92)</td><td>Situaciones administrativas</td></tr>
  </tbody>
</table>

<h2>Los artículos del TREBEP más frecuentes en exámenes INAP</h2>

<h3>Artículo 8 — Concepto y clases de empleados públicos</h3>
<p>
  Los empleados públicos se clasifican en cuatro tipos:
</p>
<ul>
  <li><strong>Funcionarios de carrera:</strong> vinculación permanente mediante nombramiento</li>
  <li><strong>Funcionarios interinos:</strong> nombramiento temporal por razones de necesidad y urgencia</li>
  <li><strong>Personal laboral:</strong> contrato de trabajo, fijo o temporal</li>
  <li><strong>Personal eventual:</strong> cargos de confianza o asesoramiento especial, siempre temporal</li>
</ul>
<p>
  Pregunta tipo test habitual: "¿El personal eventual puede acceder a la condición de
  funcionario de carrera?" — <strong>No</strong>. El puesto eventual cesa automáticamente
  cuando cesa quien lo nombró.
</p>

<h3>Artículo 9 — Funcionarios de carrera</h3>
<p>
  "Son funcionarios de carrera quienes, en virtud de nombramiento legal, están vinculados
  a una Administración Pública por una relación estatutaria regulada por el Derecho
  Administrativo para el desempeño de servicios profesionales retribuidos de carácter
  permanente."
</p>
<p>
  Importante: la relación es <em>estatutaria</em> (no contractual) y regida por el
  Derecho Administrativo (no el laboral). Esta distinción es fuente frecuente de trampas.
</p>

<h3>Artículo 14 — Derechos individuales de los empleados públicos</h3>
<p>
  El artículo 14 enumera los derechos individuales. Los más preguntados:
</p>
<ul>
  <li>Derecho a la inamovilidad en la condición de funcionario de carrera</li>
  <li>Derecho a la carrera profesional y a la promoción interna</li>
  <li>Derecho a la formación continua y actualización permanente</li>
  <li>Derecho a recibir protección eficaz en materia de seguridad y salud</li>
  <li>Derecho a la negociación colectiva y participación en la determinación de condiciones de trabajo</li>
  <li>Derecho a la jornada de trabajo, permisos y vacaciones</li>
</ul>

<h3>Artículos 52-54 — Deberes y código de conducta</h3>
<p>
  El artículo 52 establece los <strong>deberes básicos</strong>: los empleados públicos
  deberán desempeñar con diligencia las tareas que tengan asignadas y velar por los
  intereses generales con sujeción y observancia de la CE y del resto del ordenamiento jurídico.
</p>
<p>
  El <strong>Código de Conducta</strong> (arts. 53-54) incluye los principios éticos
  (art. 53: objetividad, integridad, neutralidad, responsabilidad, imparcialidad,
  confidencialidad, dedicación, transparencia, ejemplaridad, austeridad, accesibilidad,
  honradez, promoción del entorno cultural, medioambiental, igualdad) y los principios
  de conducta (art. 54).
</p>
<p>
  Trampa frecuente: ¿Los principios éticos y de conducta son lo mismo?
  <strong>No</strong>: los principios éticos están en el art. 53 y los de conducta en el art. 54.
</p>

<h3>Artículos 55-62 — Acceso al empleo público</h3>
<p>
  El artículo 55 establece los principios de acceso: igualdad, mérito, capacidad y
  publicidad. El artículo 61 regula los sistemas selectivos: <strong>oposición</strong>
  (ejercicios eliminatorios), <strong>concurso-oposición</strong> (fase de concurso
  no eliminatoria + fase de oposición) y <strong>concurso</strong> (solo para promoción interna).
</p>
<p>
  Pregunta tipo test: "¿Cuál es el sistema selectivo ordinario para ingreso en Cuerpos
  de la Administración General del Estado?" — La <strong>oposición libre</strong>
  (excepto cuando se justifique la naturaleza de las funciones o se motive en una ley).
</p>

<h3>Artículos 85-92 — Situaciones administrativas</h3>
<p>
  Las situaciones administrativas del funcionario de carrera son fundamentales para el examen:
</p>
<ul>
  <li><strong>Servicio activo (art. 86):</strong> situación ordinaria; presta servicios en su
    Administración, Cuerpo y puesto</li>
  <li><strong>Servicios en otras Administraciones (art. 87):</strong> adscripción a otra
    Administración por comisión de servicios, traslado o transferencia</li>
  <li><strong>Servicios especiales (art. 88):</strong> cargos de elección popular, altos
    cargos, organismos internacionales, etc. — reserva del puesto</li>
  <li><strong>Servicio activo en otro cuerpo (art. 88 bis)</strong></li>
  <li><strong>Excedencia (art. 89):</strong> voluntaria por interés particular, por cuidado de
    familiares, por violencia de género, forzosa, etc.</li>
  <li><strong>Suspensión de funciones (art. 90):</strong> provisional (durante expediente
    disciplinario) o firme (sanción disciplinaria)</li>
</ul>
<p>
  La excedencia <strong>voluntaria por interés particular</strong> requiere haber prestado
  servicios efectivos durante los 5 años inmediatamente anteriores y no genera derecho
  a reserva de puesto (a diferencia de la excedencia por cuidado de familiares).
</p>

<h2>Tabla resumen: los números que el INAP más examina</h2>
<table>
  <thead><tr><th>Dato</th><th>Valor</th><th>Artículo</th></tr></thead>
  <tbody>
    <tr><td>Reserva puesto — excedencia por cuidado hijo/familiar</td><td>3 años (hijo) / 2 años (familiar)</td><td>Art. 89.4</td></tr>
    <tr><td>Permanencia mínima para excedencia voluntaria</td><td>5 años de servicio efectivo</td><td>Art. 89.2</td></tr>
    <tr><td>Duración suspensión provisional</td><td>Máx. 6 meses (prorrogable si hay causa penal)</td><td>Art. 98</td></tr>
    <tr><td>Principios de acceso</td><td>Igualdad, mérito, capacidad, publicidad</td><td>Art. 55</td></tr>
    <tr><td>Tipos de sistemas selectivos</td><td>Oposición / Concurso-oposición / Concurso</td><td>Art. 61</td></tr>
  </tbody>
</table>

<h2>Estrategia de estudio para el TREBEP</h2>
<ol>
  <li>
    <strong>Distingue los 4 tipos de personal</strong> (arts. 8-12): es la primera
    trampa. El personal eventual no es interino ni laboral.
  </li>
  <li>
    <strong>Memoriza los principios éticos del art. 53</strong>: el examen pide a veces
    si un principio concreto está en el art. 53 o en el art. 54.
  </li>
  <li>
    <strong>Domina las situaciones administrativas</strong> (arts. 85-92): el examen
    presenta casos prácticos ("¿En qué situación se encuentra un funcionario que...?").
  </li>
  <li>
    <strong>Practica los plazos</strong>: 5 años para excedencia voluntaria, 3 años
    de reserva de puesto para cuidado de hijos, duración máxima de la suspensión provisional.
  </li>
</ol>

<h2>Practica los temas del TREBEP con OpoRuta</h2>
<p>
  OpoRuta genera preguntas tipo test sobre artículos específicos del TREBEP con el
  mismo nivel de detalle que los exámenes oficiales del INAP. Cada pregunta cita el
  artículo exacto verificado — sin inventos, sin alucinaciones.
</p>
<p>
  Puedes empezar con los Temas 13 y 14 (TREBEP) de forma completamente gratuita.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">Constitución Española en el examen</a> — artículos clave y preguntas más frecuentes</li>
  <li><a href="/blog/lopdgdd-proteccion-datos-examen-auxiliar-administrativo">LOPDGDD y RGPD</a> — protección de datos en el examen de Auxiliar</li>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas</a> — cómo priorizarlos</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué artículos del TREBEP son más importantes para el examen de Auxiliar?', answer: 'Los más preguntados son: art. 8 (concepto de empleado público), arts. 9-12 (clases de personal), art. 14 (derechos individuales), arts. 52-54 (deberes y código de conducta), arts. 56-62 (acceso al empleo público) y arts. 89-92 (situaciones administrativas). Estos artículos concentran la mayoría de preguntas INAP sobre empleo público.' },
      { question: '¿Qué es el TREBEP y por qué es tan importante en la oposición?', answer: 'El TREBEP (Real Decreto Legislativo 5/2015) es el Estatuto Básico del Empleado Público. Regula los derechos, deberes, situaciones administrativas y régimen disciplinario de todos los funcionarios. Es una de las 3 leyes con más peso en el examen junto con la Constitución y la LPAC.' },
      { question: '¿Qué diferencia hay entre funcionario de carrera e interino según el TREBEP?', answer: 'El funcionario de carrera (art. 9) tiene nombramiento legal con carácter permanente y ha superado una oposición. El interino (art. 10) cubre plazas vacantes temporalmente por razones de necesidad o urgencia, con un máximo de 3 años (ampliable 1 año más tras la reforma de 2021).' },
      { question: '¿Preguntan sobre el régimen disciplinario del TREBEP en el examen?', answer: 'Sí. Los artículos 93-98 sobre faltas y sanciones aparecen con frecuencia. Es clave distinguir las faltas muy graves (art. 95: abandono de servicio, discriminación, acoso) de las graves y leves, así como los plazos de prescripción: 3 años las muy graves, 2 las graves y 6 meses las leves.' },
    ],
  },

  // ─── Post 8 ────────────────────────────────────────────────────────────────
  {
    slug: 'lopdgdd-proteccion-datos-examen-auxiliar-administrativo',
    title: 'LOPDGDD y RGPD en el examen de Auxiliar: protección de datos para el Auxiliar Administrativo',
    description:
      'Lo que necesitas saber de la LOPDGDD y el RGPD para el examen del Auxiliar Administrativo del Estado: derechos ARCO, bases jurídicas, AEPD y artículos más frecuentes.',
    date: '2026-03-10',
    keywords: [
      'LOPDGDD examen auxiliar administrativo',
      'protección datos RGPD examen INAP',
      'derechos ARCO examen de Auxiliar',
      'AEPD funcionarios examen oposición',
      'tema 12 auxiliar administrativo estado protección datos',
    ],
    content: `
<h2>La protección de datos en el temario del Auxiliar Administrativo del Estado</h2>
<p>
  La protección de datos personales es el <strong>Tema 12</strong> del temario oficial del
  Cuerpo General Auxiliar del Estado. Lo regula principalmente la
  <strong>Ley Orgánica 3/2018, de 5 de diciembre</strong>, de Protección de Datos Personales
  y garantía de los derechos digitales (LOPDGDD), que adapta al ordenamiento español el
  Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD o GDPR en inglés).
</p>
<p>
  En exámenes recientes del INAP, <strong>entre 3 y 6 preguntas</strong> provienen
  directamente de este bloque. Las preguntas suelen versar sobre los derechos de los
  interesados, las bases jurídicas del tratamiento, el Delegado de Protección de Datos
  y el papel de la Agencia Española de Protección de Datos (AEPD).
</p>

<h2>El RGPD: marco general europeo</h2>
<p>
  El RGPD es el reglamento europeo aplicable desde el <strong>25 de mayo de 2018</strong>
  en todos los Estados miembros de la UE. Al ser un Reglamento (no una Directiva),
  es directamente aplicable sin necesidad de transposición nacional. La LOPDGDD lo
  complementa y adapta a la realidad española.
</p>
<p>
  Concepto central del RGPD: <em>dato personal</em> es "toda información sobre una
  persona física identificada o identificable". La identificabilidad puede ser directa
  (nombre, DNI) o indirecta (número de matrícula, dirección IP, datos de localización).
</p>

<h2>Principios del tratamiento de datos (Art. 5 RGPD)</h2>
<p>
  El artículo 5 del RGPD establece los principios que rigen cualquier tratamiento:
</p>
<ul>
  <li><strong>Licitud, lealtad y transparencia:</strong> el interesado debe conocer el tratamiento</li>
  <li><strong>Limitación de finalidad:</strong> los datos solo pueden usarse para el fin declarado</li>
  <li><strong>Minimización de datos:</strong> solo recoger lo estrictamente necesario</li>
  <li><strong>Exactitud:</strong> los datos deben ser correctos y actualizados</li>
  <li><strong>Limitación del plazo de conservación:</strong> no conservar más tiempo del necesario</li>
  <li><strong>Integridad y confidencialidad:</strong> garantizar la seguridad del tratamiento</li>
  <li><strong>Responsabilidad proactiva (accountability):</strong> el responsable debe demostrar el cumplimiento</li>
</ul>

<h2>Bases jurídicas del tratamiento (Art. 6 RGPD)</h2>
<p>
  Todo tratamiento de datos personales debe apoyarse en <strong>al menos una</strong> base jurídica:
</p>
<ol>
  <li>Consentimiento del interesado</li>
  <li>Ejecución de un contrato del que el interesado es parte</li>
  <li>Cumplimiento de una obligación legal</li>
  <li>Protección de intereses vitales</li>
  <li>Misión realizada en interés público o ejercicio de poderes públicos</li>
  <li>Interés legítimo del responsable (salvo que prevalezcan los derechos del interesado)</li>
</ol>
<p>
  Pregunta tipo test habitual: "¿Qué base jurídica utiliza la Administración Pública
  cuando trata datos de ciudadanos para prestarles un servicio?" —
  <strong>Misión realizada en interés público o ejercicio de poderes públicos</strong>
  (base 5), o cumplimiento de obligación legal (base 3), según el caso.
</p>

<h2>Categorías especiales de datos (Art. 9 RGPD)</h2>
<p>
  El RGPD prohíbe tratar ciertos datos salvo que concurran excepciones específicas:
</p>
<ul>
  <li>Origen étnico o racial</li>
  <li>Opiniones políticas</li>
  <li>Convicciones religiosas o filosóficas</li>
  <li>Afiliación sindical</li>
  <li>Datos genéticos y biométricos con propósito identificativo</li>
  <li>Datos relativos a la salud</li>
  <li>Vida u orientación sexual</li>
</ul>
<p>
  Trampa clásica: los datos de salud <strong>siempre</strong> son categoría especial
  (sensibles), independientemente de quién los trate.
</p>

<h2>Derechos de los interesados (Arts. 15-22 RGPD)</h2>
<p>
  El RGPD reconoce los siguientes derechos — popularmente conocidos como "derechos ARCO+"
  (expansión de los clásicos Acceso, Rectificación, Cancelación, Oposición):
</p>
<table>
  <thead><tr><th>Derecho</th><th>Artículo RGPD</th><th>Descripción</th></tr></thead>
  <tbody>
    <tr><td>Acceso</td><td>Art. 15</td><td>Conocer si se tratan datos propios y obtener copia</td></tr>
    <tr><td>Rectificación</td><td>Art. 16</td><td>Corregir datos inexactos o completar los incompletos</td></tr>
    <tr><td>Supresión ("olvido")</td><td>Art. 17</td><td>Eliminar datos cuando ya no sean necesarios</td></tr>
    <tr><td>Limitación del tratamiento</td><td>Art. 18</td><td>Suspender temporalmente el tratamiento</td></tr>
    <tr><td>Portabilidad</td><td>Art. 20</td><td>Recibir datos en formato estructurado y transferirlos</td></tr>
    <tr><td>Oposición</td><td>Art. 21</td><td>Oponerse al tratamiento basado en interés legítimo</td></tr>
    <tr><td>Decisiones automatizadas</td><td>Art. 22</td><td>No ser objeto de decisiones basadas solo en perfilado</td></tr>
  </tbody>
</table>
<p>
  El plazo general para responder a estos derechos es <strong>1 mes</strong>, prorrogable
  hasta 3 meses en casos complejos. Es fuente habitual de preguntas.
</p>

<h2>El Delegado de Protección de Datos (DPD/DPO)</h2>
<p>
  El Delegado de Protección de Datos (DPD o DPO en inglés) es figura obligatoria en
  determinados supuestos establecidos en el artículo 37 del RGPD, entre ellos:
  autoridades u organismos públicos (excepto tribunales en funciones jurisdiccionales),
  tratamientos a gran escala de datos sensibles o seguimiento sistemático a gran escala.
</p>
<p>
  Para las Administraciones Públicas, el DPD es <strong>siempre obligatorio</strong>.
  Sus funciones principales (art. 39 RGPD):
</p>
<ul>
  <li>Informar y asesorar al responsable y a los empleados</li>
  <li>Supervisar el cumplimiento del RGPD y la política interna</li>
  <li>Cooperar con la autoridad de control (AEPD en España)</li>
  <li>Actuar como punto de contacto con la AEPD</li>
</ul>
<p>
  El DPD <strong>no es el responsable del tratamiento</strong> ni toma decisiones sobre
  los datos: asesora y supervisa. Esta distinción es fuente de trampa.
</p>

<h2>La Agencia Española de Protección de Datos (AEPD)</h2>
<p>
  La AEPD es la autoridad de control independiente en España (art. 45 LOPDGDD),
  encargada de supervisar el cumplimiento del RGPD y la LOPDGDD. Sus competencias:
  investigar infracciones, imponer sanciones, tramitar reclamaciones de ciudadanos
  y dictar resoluciones vinculantes.
</p>
<p>
  La LOPDGDD establece un régimen sancionador con tres niveles:
</p>
<ul>
  <li><strong>Infracciones leves:</strong> hasta 40.000 € para entidades privadas; <em>apercibimiento</em> para Administraciones Públicas</li>
  <li><strong>Infracciones graves:</strong> hasta 300.000 € (privadas); apercibimiento + publicación en BOE (públicas)</li>
  <li><strong>Infracciones muy graves:</strong> hasta 20.000.000 € o 4% volumen de negocio mundial (privadas); apercibimiento + comunicación al Parlamento (públicas)</li>
</ul>
<p>
  Dato importante: las Administraciones Públicas <strong>no pueden ser sancionadas con multa</strong>
  (solo con apercibimiento). Esta excepción es pregunta habitual.
</p>

<h2>Brechas de seguridad (Arts. 33-34 RGPD)</h2>
<p>
  Si se produce una violación de seguridad de datos personales, el responsable debe:
</p>
<ul>
  <li>Notificar a la AEPD en un plazo <strong>máximo de 72 horas</strong> desde que tenga
    conocimiento (si es probable que suponga riesgo para los interesados)</li>
  <li>Si entraña alto riesgo para los interesados: notificar también a los propios interesados
    "sin dilación indebida"</li>
</ul>
<p>
  El plazo de 72 horas es uno de los datos más preguntados de todo el bloque de protección de datos.
</p>

<h2>Estrategia de estudio</h2>
<ol>
  <li>
    <strong>Distingue RGPD y LOPDGDD:</strong> el RGPD es el marco europeo (directamente aplicable);
    la LOPDGDD lo complementa en España. Las preguntas del INAP suelen indicar de cuál ley se pregunta.
  </li>
  <li>
    <strong>Memoriza los 7 principios del art. 5 RGPD</strong> y los 6 derechos de los interesados
    (con sus artículos).
  </li>
  <li>
    <strong>Las 72 horas</strong> para notificar brechas y el <strong>1 mes</strong> para
    responder derechos son plazos clave.
  </li>
  <li>
    <strong>Administraciones Públicas ≠ multa</strong>: este matiz diferencia al conocedor
    del tema del que solo lo ha leído por encima.
  </li>
</ol>

<h2>Practica protección de datos con OpoRuta</h2>
<p>
  OpoRuta genera preguntas tipo test específicas del Tema 12 (Protección de datos) con
  el mismo nivel de dificultad que los exámenes oficiales del INAP. Cada pregunta está
  verificada contra el texto íntegro del RGPD y la LOPDGDD.
</p>
<p>
  Empieza gratis — sin tarjeta de crédito — y descubre cuántas preguntas de protección
  de datos eres capaz de acertar a la primera.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/trebep-articulos-clave-examen-auxiliar-administrativo">TREBEP: artículos clave</a> — derechos, deberes y código ético de los empleados públicos</li>
  <li><a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">Constitución Española</a> — los artículos que más se examinan</li>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación</a> — planificación y estrategia de estudio</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Preguntan sobre protección de datos en el examen de Auxiliar Administrativo?', answer: 'Sí. La LOPDGDD (Ley Orgánica 3/2018) y el RGPD (Reglamento UE 2016/679) aportan entre 3 y 5 preguntas por examen. Es un tema relativamente nuevo en el temario y el INAP lo pregunta cada vez más, especialmente en relación con la administración electrónica.' },
      { question: '¿Qué diferencia hay entre la LOPDGDD y el RGPD?', answer: 'El RGPD es el reglamento europeo de aplicación directa en todos los países de la UE. La LOPDGDD es la ley orgánica española que adapta y complementa el RGPD al ordenamiento jurídico español. En el examen preguntan sobre ambas normas, con especial atención a los derechos ARCOPOL y las bases de legitimación.' },
      { question: '¿Qué son los derechos ARCOPOL en protección de datos?', answer: 'ARCOPOL es el acrónimo de los derechos del interesado: Acceso, Rectificación, Cancelación (supresión), Oposición, Portabilidad, Olvido y Limitación del tratamiento. Son los derechos que cualquier ciudadano puede ejercer ante el responsable del tratamiento de sus datos personales.' },
      { question: '¿Quién es la autoridad de control en protección de datos en España?', answer: 'La Agencia Española de Protección de Datos (AEPD) es la autoridad de control independiente (art. 44 LOPDGDD). Tiene potestad sancionadora y puede imponer multas de hasta 20 millones de euros. En el examen preguntan frecuentemente sobre sus funciones y su independencia.' },
    ],
  },

  // ─── Post 9 ────────────────────────────────────────────────────────────────
  {
    slug: 'como-preparar-oposicion-auxiliar-administrativo-estado-guia',
    title: 'Cómo preparar la oposición al Cuerpo General Auxiliar del Estado: guía completa 2025-2026',
    description:
      'Guía paso a paso para preparar las oposiciones al Auxiliar Administrativo del Estado en 2025-2026: temario, estructura del examen, métodos de estudio y herramientas útiles.',
    date: '2026-02-23',
    keywords: [
      'cómo preparar oposición auxiliar administrativo estado',
      'oposición auxiliar administrativo 2025 2026 guía',
      'temario auxiliar administrativo preparación',
      'cuánto tiempo estudiar auxiliar administrativo estado',
      'método estudio oposición auxiliar estado',
    ],
    content: `
<h2>¿Qué es el Cuerpo General Auxiliar del Estado (C2)?</h2>
<p>
  El Cuerpo General Auxiliar de la Administración del Estado, perteneciente al grupo C2
  (Técnico Auxiliar del Estado), es uno de los cuerpos de funcionarios de la Administración
  General del Estado más solicitados de España. Pertenece al <strong>Subgrupo C2</strong>
  de clasificación profesional (titulación mínima: Graduado Escolar, ESO o equivalente)
  y ofrece estabilidad laboral, jornada de 37,5 horas semanales y un sueldo base de
  aproximadamente 1.200-1.400 € mensuales brutos, más complementos según destino.
</p>
<p>
  La convocatoria 2025-2026 (RD 651/2025) ofrece <strong>1.700 plazas</strong> (código 1146,
  156 reservadas para discapacidad). El sistema de selección es de <strong>concurso-oposición</strong>
  (examen + valoración de méritos). El proceso selectivo consta de un ejercicio único con un
  <strong>máximo de 100 preguntas puntuables tipo test</strong> (más 10 de reserva) en <strong>90 minutos</strong>,
  con penalización de -1/3 por respuesta incorrecta. Dispones de menos de un minuto por pregunta.
</p>

<h2>Estructura del examen de Auxiliar 2025-2026</h2>
<table>
  <thead><tr><th>Parte</th><th>Nº preguntas</th><th>Contenido</th><th>Puntuación máxima</th></tr></thead>
  <tbody>
    <tr><td>Primera parte</td><td>Máx. 60 preguntas (+ 5 reserva)</td><td>30 teóricas (Bloque I) + 30 psicotécnicas</td><td>50 puntos (mín. 25)</td></tr>
    <tr><td>Segunda parte</td><td>Máx. 50 preguntas (+ 5 reserva)</td><td>Informática y Ofimática (Bloque II: Windows 11, Word/Excel/Access/Outlook 365)</td><td>50 puntos (mín. 25)</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>100 preguntas puntuables (+ 10 reserva)</strong></td><td>Ejercicio único · 90 minutos</td><td><strong>100 puntos</strong></td></tr>
  </tbody>
</table>
<p>
  Ambas partes son <strong>obligatorias y eliminatorias</strong>.
  Cada parte se califica de 0 a 50 puntos, y es necesario obtener un <strong>mínimo de 25 puntos
  en cada parte</strong> para superarla. La Comisión Permanente de Selección fijará la puntuación
  directa mínima (nunca inferior al 30% de la máxima obtenible).
</p>
<p>
  En caso de empate, el orden de prelación es: 1º mayor calificación en la segunda parte;
  2º mayor número de correctas en la segunda parte; 3º mayor número de correctas en la primera;
  4º menor número de erróneas en la segunda; 5º menor número de erróneas en la primera.
</p>

<h2>El temario oficial: 28 temas en 2 bloques</h2>

<h3>Bloque I — Organización Pública (16 temas)</h3>
<p>
  Este bloque cubre el marco jurídico y organizativo de la Administración española y de la UE:
</p>
<ul>
  <li>Temas 1-3: Constitución Española (CE)</li>
  <li>Temas 4-5: Poder Judicial y Cortes Generales</li>
  <li>Tema 6: Gobierno y Administración del Estado</li>
  <li>Tema 7: Gobierno Abierto y Transparencia (Ley 19/2013)</li>
  <li>Tema 8: Administración General del Estado (AGE)</li>
  <li>Tema 9: Organización territorial del Estado</li>
  <li>Tema 10: Unión Europea (instituciones y funcionamiento)</li>
  <li>Temas 11-12: LPAC + LRJSP + Protección de datos</li>
  <li>Temas 13-14: TREBEP (personal funcionario)</li>
  <li>Tema 15: Presupuesto General del Estado</li>
  <li>Tema 16: Políticas de igualdad y LGTBI</li>
</ul>

<h3>Bloque II — Actividad Administrativa y Ofimática (12 temas)</h3>
<p>
  Este bloque es eminentemente práctico y tiene el mismo peso que el Bloque I en el examen:
</p>
<ul>
  <li>Temas 17-20: Atención al público, información administrativa, registro y administración electrónica</li>
  <li>Temas 21-23: Informática básica, Windows 11 y gestión de archivos</li>
  <li>Temas 24-27: Word 365, Excel 365, Access 365, Outlook 365</li>
  <li>Tema 28: Red Internet</li>
</ul>

<h2>¿Cuánto tiempo se necesita para preparar la oposición de Auxiliar?</h2>
<p>
  La preparación media de quienes aprueban la oposición de Auxiliar oscila entre <strong>6 y 18 meses</strong>,
  con una dedicación diaria de 3 a 5 horas. El tiempo varía enormemente según:
</p>
<ul>
  <li>Formación jurídica previa: quienes tienen estudios en Derecho o Ciencias Políticas
    pueden reducir el tiempo de Bloque I en un 30-40%</li>
  <li>Familiaridad con ofimática: quienes usan Word y Excel en su trabajo diario tienen
    ventaja en el Bloque II</li>
  <li>Método de estudio: preparar con academia, de forma autodidacta o con herramientas
    adaptativas marca diferencias significativas</li>
</ul>
<p>
  Una distribución realista para un preparador sin experiencia previa:
</p>
<table>
  <thead><tr><th>Fase</th><th>Duración</th><th>Actividad</th></tr></thead>
  <tbody>
    <tr><td>Fase 1</td><td>Meses 1-3</td><td>Primera lectura del temario completo + esquemas</td></tr>
    <tr><td>Fase 2</td><td>Meses 4-6</td><td>Repaso temario + primeros test por tema</td></tr>
    <tr><td>Fase 3</td><td>Meses 7-9</td><td>Consolidación: test intensivos + simulacros oficiales</td></tr>
    <tr><td>Fase 4</td><td>Mes 10+</td><td>Repaso final + simulacros completos cronometrados</td></tr>
  </tbody>
</table>

<h2>Método de estudio más eficiente para Auxiliar del Estado</h2>

<h3>1. Aprendizaje espaciado (Spaced Repetition)</h3>
<p>
  El método más validado científicamente para memorizar grandes volúmenes de información
  normativa es el aprendizaje espaciado: repasar cada concepto justo antes de olvidarlo,
  con intervalos que se amplían progresivamente (1 día → 3 días → 7 días → 2 semanas → 1 mes).
  Las flashcards implementan este método de forma óptima.
</p>

<h3>2. Test tipo test desde el día 1</h3>
<p>
  Muchos opositores cometen el error de estudiar durante meses antes de hacer su primer
  test. El retrieval practice (recordar activamente) es más eficaz que releer:
  hacer una pregunta de test sobre un artículo consolida la memoria mucho más que
  leerlo tres veces. El objetivo es hacer tests desde la primera semana, aunque
  se fallen todas las preguntas.
</p>

<h3>3. Simulacros cronometrados en la recta final</h3>
<p>
  Las últimas 6-8 semanas antes del examen deben incluir al menos 1 simulacro completo
  (100 preguntas, 90 minutos) por semana. La presión del tiempo y la penalización -1/3
  son factores que solo se aprenden practicando, no estudiando.
</p>

<h3>4. Enfócate en los artículos de alta frecuencia</h3>
<p>
  No todos los artículos de la CE, LPAC o TREBEP tienen la misma probabilidad de
  aparecer en el examen. El análisis de convocatorias pasadas del INAP muestra que
  ciertos artículos aparecen en más del 60% de los exámenes. Concentrar el estudio
  en esos artículos antes de abordar el temario completo aumenta el rendimiento.
</p>

<h2>Las trampas más comunes en el examen de Auxiliar</h2>
<ul>
  <li>
    <strong>Confundir LPAC (Ley 39/2015) y LRJSP (Ley 40/2015):</strong> el examen
    suele preguntar expresamente "¿En qué ley está regulado...?" Recuerda: LPAC =
    procedimiento (relación ciudadano-Administración), LRJSP = organización interna.
  </li>
  <li>
    <strong>No aplicar la penalización en los simulacros:</strong> estudiar sin
    penalización genera estrategias de respuesta incorrectas para el examen real.
  </li>
  <li>
    <strong>Descuidar los psicotécnicos:</strong> representan 30 de las 60 preguntas
    de la Parte 1 (50% de la parte). Muchos opositores los trabajan tarde porque
    "no hay que estudiar normativa". Pero las series numéricas, razonamiento abstracto
    y comprensión verbal requieren práctica sistemática.
  </li>
  <li>
    <strong>Subestimar el Bloque II:</strong> Word, Excel y Access no son "fáciles"
    si no los practicas con preguntas de nivel examen. La ofimática tiene su propio
    vocabulario específico que el INAP pregunta de forma muy técnica.
  </li>
</ul>

<h2>Herramientas de preparación recomendadas</h2>
<p>
  La preparación más eficaz combina varias herramientas:
</p>
<ul>
  <li><strong>Temario oficial o manual de academia:</strong> como base de estudio para la lectura inicial</li>
  <li><strong>Exámenes oficiales del INAP:</strong> las convocatorias de 2019, 2022 y 2024 son el
    mejor indicador del nivel y estilo de preguntas real</li>
  <li><strong>Plataforma de tests adaptativos:</strong> OpoRuta genera preguntas verificadas
    sobre artículos específicos, detecta tus puntos débiles y refuerza exactamente lo que más necesitas</li>
  <li><strong>Simulacros cronometrados:</strong> OpoRuta incluye simulacros basados en
    exámenes reales del INAP con penalización -1/3 real (primer simulacro gratis)</li>
</ul>

<h2>Empieza a preparar la oposición de Auxiliar con OpoRuta</h2>
<p>
  OpoRuta es la plataforma de preparación para opositores de Auxiliar que genera preguntas tipo test
  verificadas artículo por artículo: cada pregunta cita el artículo exacto de la ley y OpoRuta
  verifica que ese artículo existe antes de mostrártela.
</p>
<p>
  Puedes hacer tus primeros 5 tests de forma completamente gratuita, sin tarjeta de crédito.
  Si la plataforma te ayuda a consolidar conceptos que te cuestan — regístralo.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas</a> — qué estudiar y en qué orden</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Cómo funciona la penalización -1/3</a> — estrategia de respuesta para el día del examen</li>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">Artículos de la LPAC que más caen</a> — empieza por lo que más pregunta el tribunal</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuánto tiempo necesito para preparar la oposición de Auxiliar Administrativo?', answer: 'Con dedicación intensiva (3-4 horas/día), entre 4 y 5 meses son suficientes para los 28 temas. Con dedicación moderada (1-2 horas/día), cuenta con 6-8 meses. La clave es la constancia diaria: es mejor 1 hora todos los días que 5 horas un solo día.' },
      { question: '¿Necesito academia para aprobar el Auxiliar Administrativo?', answer: 'No es imprescindible. Muchos opositores aprueban por libre con un buen temario (30-40€) y una plataforma de tests como OpoRuta (49,99€ pago único). El ahorro frente a una academia (100-250€/mes durante 6-12 meses) es significativo. La academia aporta rutina y resolución de dudas, pero no es el único camino.' },
      { question: '¿Cuál es el mejor método de estudio para oposiciones?', answer: 'El estudio activo (hacer tests y simulacros) es significativamente más efectivo que la lectura pasiva del temario. Se recomienda el ciclo: leer tema → hacer tests del tema → repasar errores → repetir. La repetición espaciada y los simulacros con penalización completan la preparación.' },
      { question: '¿Qué material necesito para preparar la oposición de Auxiliar?', answer: 'Lo esencial: un temario actualizado a la última convocatoria (editorial MAD, Adams o CEP, 30-50€), la Constitución Española, y acceso a tests tipo examen. Complementos recomendados: legislación actualizada del BOE y una plataforma con simulacros oficiales para practicar con penalización.' },
      { question: '¿Cómo organizar el plan de estudio para los 28 temas?', answer: 'Una estrategia eficaz: divide los 28 temas en 3 ciclos. Primer ciclo (2 meses): lectura completa de todos los temas. Segundo ciclo (1,5 meses): estudio profundo priorizando los temas más preguntados. Tercer ciclo (1 mes): simulacros completos y repaso de errores.' },
    ],
  },

  // ─── Post 10 ───────────────────────────────────────────────────────────────
  {
    slug: 'plazas-auxiliar-administrativo-2026',
    title: '1.700 plazas Auxiliar Administrativo 2026: cifra récord y ratio aspirante/plaza',
    description:
      'La mayor convocatoria de la historia: 1.700 plazas de acceso libre. ¿Cuál es el ratio aspirante/plaza real? Histórico de plazas, fechas clave y por qué 2026 es tu mejor oportunidad.',
    date: '2026-03-12',
    keywords: [
      'plazas auxiliar administrativo 2026',
      'convocatoria auxiliar administrativo estado 2026',
      'cuántas plazas auxiliar administrativo',
      'oposiciones auxiliar administrativo 2026 plazas',
      'plazas auxiliar administrativo del estado',
      'plazas auxiliar administrativo estado 2026',
      'fecha examen auxiliar administrativo 2026',
    ],
    content: `
<h2>1.700 plazas de acceso libre en la convocatoria 2025-2026</h2>
<p>
  La convocatoria vigente del Cuerpo General Auxiliar de la Administración del Estado (C2) ofrece
  <strong>1.700 plazas de acceso libre</strong>, publicadas en el BOE del 22 de diciembre de 2025
  (Real Decreto 651/2025). Es la mayor oferta de los últimos años para esta oposición.
</p>

<h2>Histórico de plazas por convocatoria</h2>
<table>
  <thead>
    <tr><th>Convocatoria</th><th>Plazas acceso libre</th><th>Tendencia</th></tr>
  </thead>
  <tbody>
    <tr><td>2018</td><td>530</td><td>—</td></tr>
    <tr><td>2019</td><td>652</td><td>+23%</td></tr>
    <tr><td>2022</td><td>893</td><td>+37%</td></tr>
    <tr><td>2024</td><td>1.150</td><td>+29%</td></tr>
    <tr><td><strong>2025-2026</strong></td><td><strong>1.700</strong></td><td><strong>+48%</strong></td></tr>
  </tbody>
</table>
<p>
  La tendencia es clara: <strong>cada convocatoria ofrece más plazas que la anterior</strong>.
  En 8 años se ha triplicado la oferta, pasando de 530 a 1.700 plazas. Esto refleja las
  jubilaciones masivas en la Administración General del Estado y la necesidad de renovar plantillas.
</p>

<h2>¿Qué significa esto para ti?</h2>
<p>
  Más plazas implica que <strong>la nota de corte tiende a ser más accesible</strong>, aunque también
  atrae a más opositores. La clave no es cuántos se presentan, sino tu nivel de preparación.
  En la última convocatoria la nota de corte fue de 30 puntos en la primera parte y 26,33 en la segunda.
</p>
<p>
  Con 1.700 plazas, un opositor bien preparado tiene más opciones que nunca de conseguir su puesto.
  La diferencia la marca la calidad del estudio, no la cantidad de horas.
</p>

<h2>Estructura del examen</h2>
<p>
  El ejercicio es único: <strong>100 preguntas puntuables</strong> (más 10 de reserva) en
  <strong>90 minutos</strong>. Se divide en dos partes, ambas eliminatorias:
</p>
<ul>
  <li><strong>Primera parte</strong> (máx. 60 preguntas): 30 de teoría (Bloque I) + 30 psicotécnicas. Mínimo 25 de 50 puntos.</li>
  <li><strong>Segunda parte</strong> (máx. 50 preguntas): Ofimática (Windows 11, Microsoft 365). Mínimo 25 de 50 puntos.</li>
</ul>
<p>
  Las respuestas incorrectas penalizan <strong>-1/3 del valor de un acierto</strong>.
  Las respuestas en blanco no penalizan. Aprende más sobre
  <a href="/blog/penalizacion-examen-auxiliar-administrativo">cómo funciona la penalización y cuándo dejar en blanco</a>.
</p>

<h2>¿Cuándo es el examen?</h2>
<p>
  La fecha exacta del examen no ha sido publicada oficialmente. Según el calendario habitual del INAP
  y la convocatoria vigente, se espera para <strong>mayo-junio de 2026</strong>. OpoRuta actualiza
  esta información automáticamente cuando se publica en el BOE.
</p>

<h2>Empieza a prepararte hoy</h2>
<p>
  En OpoRuta puedes practicar con tests generados desde la legislación vigente, con
  <strong>verificación determinista de cada cita legal</strong>. Cada pregunta te dice el artículo exacto
  de la ley — y OpoRuta verifica que ese artículo existe antes de mostrártelo. También puedes practicar
  con <a href="/examenes-oficiales">simulacros basados en exámenes reales del INAP</a> (2018, 2019, 2022, 2024)
  con penalización real y cronómetro.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación 2025-2026</a> — temario, planificación y métodos de estudio</li>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas</a> — qué estudiar y en qué orden</li>
  <li><a href="/blog/nota-corte-auxiliar-administrativo-estado">Nota de corte de la última convocatoria</a> — qué puntuación necesitas para aprobar</li>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">¿C2 o C1?</a> — compara plazas, sueldo y temario antes de decidir</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuántas plazas de Auxiliar Administrativo del Estado hay en 2026?', answer: 'Se han convocado 1.700 plazas de ingreso libre en la OEP 2025 para el Cuerpo General Auxiliar (subgrupo C2). Es la mayor convocatoria para este cuerpo en los últimos años. El examen está previsto para el 23 de mayo de 2026.' },
      { question: '¿Cuántos opositores se presentan por plaza de Auxiliar Administrativo?', answer: 'La ratio histórica oscila entre 15 y 25 opositores por plaza. Sin embargo, muchos no se presentan al examen (tasa de absentismo del 30-40%) y otros van sin preparar. La competencia real efectiva es menor de lo que parece: con buena preparación, las posibilidades son razonables.' },
      { question: '¿Cuándo sale la convocatoria de Auxiliar Administrativo 2026?', answer: 'La OEP 2025 fue publicada en el BOE en noviembre de 2025 con 1.700 plazas de Auxiliar. La convocatoria específica del INAP se publicó a principios de 2026, con fecha de examen prevista para el 23 de mayo de 2026.' },
      { question: '¿Dónde se puede trabajar como Auxiliar Administrativo del Estado?', answer: 'Los Auxiliares Administrativos del Estado trabajan en ministerios, delegaciones y subdelegaciones del Gobierno, organismos autónomos y otros centros de la AGE en toda España. Al aprobar, eliges destino según tu nota: Madrid concentra más plazas, pero también hay puestos en capitales de provincia.' },
    ],
  },

  // ─── Post 11 ───────────────────────────────────────────────────────────────
  {
    slug: 'nota-corte-auxiliar-administrativo-estado',
    title: 'Nota de corte Auxiliar Administrativo 2024: 30 puntos — ¿La superarías?',
    description:
      'Nota de corte 2024: 30 puntos (parte 1) y 26,33 (parte 2) sobre 100. Histórico de cortes desde 2019, cómo se calcula con la penalización -1/3 y calculadora gratis para estimar tu nota.',
    date: '2026-03-12',
    keywords: [
      'nota de corte auxiliar administrativo estado',
      'nota corte auxiliar administrativo 2024',
      'puntuación mínima auxiliar administrativo estado',
      'cómo calcular nota examen auxiliar administrativo',
      'nota corte auxiliar administrativo estado',
      'notas de corte auxiliar administrativo del estado',
      'nota de corte auxiliar administrativo del estado 2024',
    ],
    content: `
<h2>Nota de corte de la última convocatoria: 30 y 26,33 puntos</h2>
<p>
  En la última convocatoria del Cuerpo General Auxiliar de la Administración del Estado, las
  <strong>notas de corte</strong> (puntuación mínima para superar cada parte) fueron:
</p>
<ul>
  <li><strong>Primera parte</strong> (teoría + psicotécnicos): <strong>30 puntos</strong> sobre 50</li>
  <li><strong>Segunda parte</strong> (ofimática): <strong>26,33 puntos</strong> sobre 50</li>
</ul>
<p>
  Ambas partes son eliminatorias: si no llegas al mínimo en una de las dos, no apruebas
  aunque la otra sea excelente. La nota final es la suma de ambas partes.
</p>

<h2>Cómo se calcula tu nota con penalización -1/3</h2>
<p>
  El examen del Auxiliar aplica una <strong>penalización de -1/3</strong> por cada respuesta incorrecta.
  La fórmula es:
</p>
<p><strong>Puntuación = Aciertos − (Errores / 3)</strong></p>
<p>Ejemplo práctico para la primera parte (60 preguntas, 50 puntos máximo):</p>
<table>
  <thead>
    <tr><th>Escenario</th><th>Aciertos</th><th>Errores</th><th>En blanco</th><th>Puntuación</th><th>¿Aprueba?</th></tr>
  </thead>
  <tbody>
    <tr><td>Conservador</td><td>40</td><td>10</td><td>10</td><td>40 − 3,33 = 36,67</td><td>Sí</td></tr>
    <tr><td>Ajustado</td><td>35</td><td>15</td><td>10</td><td>35 − 5 = 30,00</td><td>Justo</td></tr>
    <tr><td>Arriesgado</td><td>38</td><td>22</td><td>0</td><td>38 − 7,33 = 30,67</td><td>Sí</td></tr>
    <tr><td>Insuficiente</td><td>30</td><td>20</td><td>10</td><td>30 − 6,67 = 23,33</td><td>No</td></tr>
  </tbody>
</table>

<h2>La regla de oro: descartar al menos 1 opción</h2>
<p>
  <strong>Si puedes descartar al menos 1 de las 4 opciones, estadísticamente te compensa arriesgar.</strong>
  Si no puedes descartar ninguna, déjala en blanco. Las respuestas en blanco no penalizan.
</p>
<p>
  Lee nuestra <a href="/blog/penalizacion-examen-auxiliar-administrativo">guía completa sobre la penalización -1/3</a>
  para entender cuándo arriesgar, cuándo dejar en blanco y cómo practicarlo desde el primer día.
</p>

<h2>¿Qué nota necesitas para la convocatoria 2026?</h2>
<p>
  La nota de corte de 2026 dependerá del nivel de los opositores y la dificultad del examen.
  Con <strong>1.700 plazas</strong> (la mayor oferta histórica), es razonable esperar una nota
  de corte similar o ligeramente inferior a convocatorias anteriores. Pero no te confíes:
  prepárate para superar los 30 puntos en ambas partes con margen.
</p>

<h2>Cómo practicar con penalización real</h2>
<p>
  La mayoría de opositores estudian sin penalización durante meses y llegan al examen sin haber
  calibrado su estrategia de respuesta. En OpoRuta, los
  <a href="/examenes-oficiales">simulacros oficiales del INAP</a> aplican la penalización -1/3
  exactamente como en el examen real, con cronómetro de 90 minutos.
  Al terminar, te mostramos si habrías aprobado comparando tu nota con la nota de corte histórica.
</p>
<p>
  En OpoRuta, cada pregunta incluye el <strong>artículo exacto de la ley</strong> que la respalda,
  verificado contra la legislación oficial. Tus primeros 5 tests son gratis, sin tarjeta de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas en la convocatoria 2026</a> — histórico y tendencia</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Penalización -1/3 explicada</a> — fórmula, ejemplos y estrategia</li>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación</a> — temario, planificación y métodos de estudio</li>
  <li><a href="/blog/nota-corte-administrativo-estado-c1-como-se-calcula">Nota de corte del C1</a> — si te planteas subir al Administrativo del Estado</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuál es la nota de corte del examen de Auxiliar Administrativo del Estado?', answer: 'La nota de corte varía en cada convocatoria: 57,5 puntos en 2019, 60 en 2022 y 65 en 2024 (sobre 100). La tendencia es ascendente debido al aumento de opositores preparados. Para la convocatoria 2026, se estima una nota de corte en torno a 63-67 puntos.' },
      { question: '¿Cómo se calcula la nota final en el examen de Auxiliar Administrativo?', answer: 'La nota del cuestionario se calcula como: aciertos - (errores / 3). Las preguntas en blanco no puntúan. El resultado se escala sobre 50 puntos (la parte teórica vale 50% del total). La prueba práctica de ofimática aporta los otros 50 puntos. Se necesita un mínimo de 25 en cada parte.' },
      { question: '¿Es difícil aprobar la oposición de Auxiliar Administrativo?', answer: 'Con 1.700 plazas y una ratio real de 10-15 opositores preparados por plaza, es una oposición accesible si te preparas bien. Los que superan la nota de corte suelen haber dedicado entre 4 y 8 meses de estudio constante. La clave es practicar con simulacros bajo condiciones reales.' },
      { question: '¿La nota de corte incluye la penalización?', answer: 'Sí. La nota de corte ya refleja la puntuación neta tras aplicar la penalización de -1/3 por error. Es decir, para obtener 65 puntos netos necesitas más de 65 aciertos, ya que los errores restan. Por eso es fundamental gestionar bien las preguntas dudosas.' },
    ],
  },

  // ─── Post 12 — ARTÍCULO ESTRELLA (linkable asset) ─────────────────────────
  {
    slug: 'analisis-frecuencia-articulos-inap-auxiliar-administrativo',
    title: 'Qué artículos pregunta el INAP en el examen de Auxiliar: análisis de 4 convocatorias (2018-2024)',
    description:
      'Análisis de frecuencia de los artículos más preguntados en exámenes INAP del Auxiliar Administrativo (2018, 2019, 2022, 2024). Datos originales, tablas por ley y ejemplos de cómo los pregunta el tribunal.',
    date: '2026-03-12',
    keywords: [
      'artículos más preguntados examen auxiliar administrativo INAP',
      'análisis frecuencia exámenes INAP auxiliar',
      'qué preguntan en el examen auxiliar administrativo',
      'temas más importantes examen INAP 2024',
      'radar tribunal auxiliar administrativo',
    ],
    content: `
<h2>Los artículos que más se repiten en los exámenes del INAP</h2>
<p>
  Hemos analizado las <strong>4 últimas convocatorias del Auxiliar Administrativo del Estado</strong>
  (INAP 2018, 2019, 2022 y 2024) para identificar qué artículos de la legislación pregunta el tribunal
  con más frecuencia. Estos datos son originales de OpoRuta y se basan en el análisis de más de
  <strong>400 preguntas oficiales</strong>.
</p>
<p>
  La conclusión es clara: <strong>no todos los artículos pesan igual</strong>. Un grupo reducido
  de artículos aparece en casi todas las convocatorias, mientras que otros nunca se han preguntado.
  Saber cuáles son te permite priorizar tu estudio de forma inteligente.
</p>

<h2>Top 15 artículos más preguntados (todas las leyes)</h2>
<table>
  <thead>
    <tr><th>Artículo</th><th>Ley</th><th>Apariciones (de 4)</th><th>Tema clave</th></tr>
  </thead>
  <tbody>
    <tr><td>Art. 21</td><td>LPAC (Ley 39/2015)</td><td><strong>4 de 4</strong></td><td>Obligación de resolver y notificar</td></tr>
    <tr><td>Art. 53</td><td>LPAC</td><td><strong>3 de 4</strong></td><td>Derechos del interesado</td></tr>
    <tr><td>Art. 58</td><td>LPAC</td><td><strong>3 de 4</strong></td><td>Práctica de notificaciones</td></tr>
    <tr><td>Art. 14</td><td>CE 1978</td><td><strong>3 de 4</strong></td><td>Igualdad y no discriminación</td></tr>
    <tr><td>Art. 103</td><td>CE 1978</td><td><strong>3 de 4</strong></td><td>Principios de la Administración</td></tr>
    <tr><td>Art. 9.3</td><td>CE 1978</td><td>3 de 4</td><td>Principio de legalidad</td></tr>
    <tr><td>Art. 54</td><td>TREBEP</td><td>3 de 4</td><td>Principios de conducta</td></tr>
    <tr><td>Art. 52</td><td>TREBEP</td><td>3 de 4</td><td>Código de conducta — deberes</td></tr>
    <tr><td>Art. 35</td><td>LPAC</td><td>2 de 4</td><td>Motivación de actos</td></tr>
    <tr><td>Art. 112</td><td>LPAC</td><td>2 de 4</td><td>Recurso de alzada</td></tr>
    <tr><td>Art. 5</td><td>LOPDGDD</td><td>2 de 4</td><td>Delegado de protección de datos</td></tr>
    <tr><td>Art. 13</td><td>LOPDGDD</td><td>2 de 4</td><td>Derechos de los interesados (ARCO)</td></tr>
    <tr><td>Art. 1.1</td><td>CE 1978</td><td>2 de 4</td><td>Estado social y democrático de derecho</td></tr>
    <tr><td>Art. 137</td><td>CE 1978</td><td>2 de 4</td><td>Organización territorial del Estado</td></tr>
    <tr><td>Art. 3</td><td>LRJSP (Ley 40/2015)</td><td>2 de 4</td><td>Principios de actuación de las AAPP</td></tr>
  </tbody>
</table>

<h2>Desglose por ley: dónde poner el foco</h2>

<h3>Constitución Española (CE 1978)</h3>
<p>
  La Constitución aporta entre <strong>8-12 preguntas</strong> por convocatoria.
  Los artículos estrella son el 14 (igualdad), 103 (principios de la Administración),
  9.3 (legalidad) y 1.1 (Estado social). El Título I (derechos fundamentales) y el
  Título VIII (organización territorial) concentran la mayoría.
</p>
<p>
  Profundiza en nuestra <a href="/blog/constitucion-espanola-preguntas-examen-auxiliar-administrativo">guía de la Constitución en el examen</a>.
</p>

<h3>LPAC — Ley 39/2015 (Procedimiento Administrativo Común)</h3>
<p>
  La LPAC es la <strong>ley estrella del examen</strong>: aporta entre <strong>5-8 preguntas</strong>
  por convocatoria. Los artículos 21 (obligación de resolver), 53 (derechos del interesado),
  58 (notificaciones) y 112 (recurso de alzada) son los más repetidos.
</p>
<p>
  Ve el desglose completo en <a href="/blog/articulos-lpac-que-mas-caen-examen-inap">artículos de la LPAC que más caen en el INAP</a>.
</p>

<h3>TREBEP — RDL 5/2015 (Estatuto del Empleado Público)</h3>
<p>
  El TREBEP aporta <strong>3-5 preguntas</strong> por convocatoria.
  Los artículos 52 y 54 (código de conducta y principios de conducta) aparecen de forma
  constante. También se preguntan los artículos sobre situaciones administrativas y
  acceso a la función pública.
</p>
<p>
  Más detalles en <a href="/blog/trebep-articulos-clave-examen-auxiliar-administrativo">TREBEP: artículos clave para el examen</a>.
</p>

<h3>LOPDGDD — LO 3/2018 (Protección de Datos)</h3>
<p>
  La LOPDGDD es <strong>relativamente nueva en el temario</strong> y aporta 2-3 preguntas.
  Los artículos 5 (DPO) y 13 (derechos ARCO) son los favoritos del tribunal.
</p>
<p>
  Consulta <a href="/blog/lopdgdd-proteccion-datos-examen-auxiliar-administrativo">LOPDGDD y RGPD en el examen</a>.
</p>

<h3>LRJSP — Ley 40/2015 (Régimen Jurídico del Sector Público)</h3>
<p>
  La LRJSP aporta <strong>2-4 preguntas</strong>. El artículo 3 (principios de actuación)
  es el más repetido. Es importante no confundirla con la LPAC —
  consulta <a href="/blog/diferencias-lpac-lrjsp-auxiliar-administrativo">diferencias entre LPAC y LRJSP</a>.
</p>

<h2>Cómo pregunta el tribunal: patrones que se repiten</h2>
<p>
  El INAP tiene un estilo propio. Estos son los patrones más frecuentes:
</p>
<ul>
  <li><strong>Pregunta de enumeración:</strong> "Según el art. X de la Ley Y, ¿cuál de los siguientes NO es...?" — Necesitas memorizar listas concretas.</li>
  <li><strong>Pregunta de plazos:</strong> "¿Cuál es el plazo máximo para resolver y notificar un procedimiento iniciado de oficio?" — Los plazos de la LPAC son un clásico.</li>
  <li><strong>Pregunta trampa LPAC/LRJSP:</strong> Mezclan conceptos de ambas leyes. El tribunal sabe que se confunden.</li>
  <li><strong>Pregunta de principios:</strong> "Los principios de actuación de las AAPP incluyen..." — Aparecen tanto en CE (art. 103) como en LRJSP (art. 3).</li>
</ul>

<h2>Metodología: de dónde salen estos datos</h2>
<p>
  En OpoRuta hemos digitalizado y clasificado las preguntas de los exámenes oficiales del INAP
  de 2018, 2019, 2022 y 2024 (convocatorias del Cuerpo General Auxiliar de la AGE).
  Cada pregunta ha sido mapeada al artículo de ley que la respalda.
  Estos datos alimentan el <strong>Radar del Tribunal</strong>, una herramienta de OpoRuta
  que ordena los artículos por frecuencia para que priorices tu estudio.
</p>
<p>
  En OpoRuta, cada pregunta de test incluye el artículo exacto verificado contra la legislación oficial.
  Tus primeros 5 tests son gratis, sin tarjeta de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo: los 28 temas del Auxiliar</a> — estructura y priorización</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Penalización -1/3 explicada</a> — cuándo arriesgar y cuándo dejar en blanco</li>
  <li><a href="/examenes-oficiales">Simulacros INAP oficiales</a> — practica con preguntas reales del tribunal</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué leyes se preguntan más en el examen de Auxiliar Administrativo del INAP?', answer: 'Según el análisis de exámenes INAP 2018-2024, las leyes más preguntadas son: Constitución Española (50+ preguntas acumuladas), LPAC - Ley 39/2015 (35+), TREBEP - RDLeg 5/2015 (29+), LRJSP - Ley 40/2015 (20+) y LOPDGDD - LO 3/2018 (15+). Juntas concentran más del 70% del cuestionario teórico.' },
      { question: '¿El INAP repite preguntas de convocatorias anteriores?', answer: 'No repite preguntas literales, pero sí los mismos artículos y conceptos. El análisis de frecuencia muestra que ciertos artículos (como el art. 53 LPAC o el art. 103 CE) aparecen en casi todas las convocatorias, aunque con enunciados distintos. Por eso practicar con exámenes anteriores es tan efectivo.' },
      { question: '¿Cómo usar el análisis de frecuencia para estudiar mejor?', answer: 'Prioriza los artículos que aparecen en 3 o más convocatorias: son los que el INAP considera fundamentales. Dedica más tiempo de estudio a los temas con mayor frecuencia de aparición y haz tests específicos sobre ellos. OpoRuta ofrece un Radar del Tribunal que ordena los temas por frecuencia de preguntas.' },
      { question: '¿Cuántas preguntas del examen puedo acertar solo con los temas más frecuentes?', answer: 'Estudiando a fondo los 6-8 temas más preguntados (según el análisis de frecuencia) puedes cubrir el 40-50% del cuestionario teórico. Esto no garantiza el aprobado, pero sí una base sólida. Combinar estos temas prioritarios con un repaso general del resto es la estrategia óptima.' },
    ],
  },

  // ─── Post 13 ───────────────────────────────────────────────────────────────
  {
    slug: 'preparar-oposicion-auxiliar-administrativo-por-libre',
    title: 'Preparar oposiciones Auxiliar Administrativo por libre en 2026: guía completa',
    description:
      'Sí, se puede aprobar sin academia. Guía paso a paso para preparar el Auxiliar Administrativo del Estado por libre: temario, planificación, herramientas gratuitas y errores a evitar.',
    date: '2026-03-14',
    dateModified: '2026-03-17',
    keywords: [
      'preparar oposición auxiliar administrativo por libre',
      'auxiliar administrativo sin academia',
      'estudiar oposiciones por libre auxiliar estado',
      'preparar auxiliar administrativo por tu cuenta',
    ],
    faqs: [
      {
        question: '¿Se puede aprobar el Auxiliar Administrativo sin academia?',
        answer: 'Sí. Muchos opositores aprueban por libre cada convocatoria. Necesitas: temario actualizado (manual ~40€), plataforma de tests con verificación legal (OpoRuta: 49,99€ pago único), exámenes oficiales INAP (gratis) y disciplina. El ahorro frente a academia presencial es de 1.000-3.000€/año.',
      },
      {
        question: '¿Cuánto tiempo se necesita para preparar el Auxiliar Administrativo por libre?',
        answer: 'Entre 4 y 8 meses de preparación seria, dependiendo de tus horas disponibles. Con 2-3 horas diarias, un plan de 6 meses es realista: 2 meses primera vuelta, 2 meses segunda vuelta con simulacros, 2 meses repaso intensivo.',
      },
      {
        question: '¿Cuánto cuesta preparar oposiciones por libre?',
        answer: 'El coste mínimo es de 80-100€: manual de temario (30-50€) + plataforma de tests verificada como OpoRuta (49,99€ pago único). Comparado con una academia presencial (1.200-3.000€/año), es 10-20 veces más barato.',
      },
    ],
    content: `
<h2>Sí, puedes aprobar el Auxiliar Administrativo sin academia</h2>
<p>
  <strong>Sí, se puede preparar la oposición de Auxiliar Administrativo del Estado por libre</strong> y
  muchos opositores lo hacen cada convocatoria. No necesitas una academia para aprobar: necesitas
  el temario correcto, una planificación realista y herramientas de práctica con el formato del examen.
</p>
<p>
  Lo que sí necesitas es disciplina. Sin la estructura de una academia, tú eres tu propio planificador.
  Pero la ventaja es enorme: estudias a tu ritmo, sin horarios fijos, sin desplazamientos y ahorrando
  entre 1.000€ y 3.000€ al año.
</p>

<h2>Qué necesitas para prepararte por libre</h2>

<h3>1. El temario actualizado</h3>
<p>
  El <a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">temario oficial consta de 28 temas</a>:
  16 de Organización Pública (Bloque I) y 12 de Ofimática (Bloque II).
  Puedes usar un manual de academia (Adams, MAD, CEP) como base de lectura — cuestan entre 30-50€ y
  están bien como texto de referencia. Pero no dependas solo de la lectura: el examen es tipo test
  y necesitas practicar con ese formato desde el primer día.
</p>

<h3>2. Exámenes oficiales del INAP</h3>
<p>
  Los exámenes de convocatorias anteriores son dominio público. Tienes los de
  <a href="/examenes-oficiales">2018, 2019, 2022 y 2024 en OpoRuta</a> en formato interactivo
  con explicaciones de cada respuesta. Practicar con exámenes reales es el mejor indicador
  de tu nivel real.
</p>

<h3>3. Tests tipo test con verificación</h3>
<p>
  El error más común al estudiar por libre es solo leer y subrayar. El examen es de 100 preguntas
  tipo test en 90 minutos — necesitas practicar la velocidad y la precisión. Lo crítico es que las
  preguntas citen artículos reales. ChatGPT y herramientas genéricas inventan referencias legales.
  En OpoRuta, cada cita legal se verifica contra la legislación oficial antes de mostrártela.
</p>

<h3>4. Una planificación semanal</h3>
<p>
  Un plan realista para preparar por libre con 4-6 meses de margen:
</p>
<ul>
  <li><strong>Mes 1-2:</strong> Lectura del temario completo (2 temas/semana) + tests diarios de lo estudiado</li>
  <li><strong>Mes 3-4:</strong> Segunda vuelta rápida + simulacros semanales con penalización</li>
  <li><strong>Mes 5-6:</strong> Repaso intensivo de tus temas débiles + simulacros cronometrados</li>
</ul>
<p>
  Lo más importante: <strong>haz tests desde el primer día</strong>. No esperes a "terminar el temario"
  para empezar a practicar. El formato tipo test tiene su propia lógica y necesitas dominarla.
</p>

<h2>Ventajas de preparar por libre</h2>
<ul>
  <li><strong>Ahorro:</strong> Academia = 100-250€/mes (1.200-3.000€/año). Por libre + OpoRuta = manual (40€) + plataforma (49,99€ pago único)</li>
  <li><strong>Flexibilidad:</strong> Estudias a tu ritmo, en tu horario, sin desplazamientos</li>
  <li><strong>Personalización:</strong> Te centras en tus temas débiles, no en el ritmo de una clase</li>
</ul>

<h2>Errores comunes al preparar por libre (y cómo evitarlos)</h2>
<ul>
  <li><strong>Solo leer, no practicar:</strong> Dedica mínimo 30% del tiempo a tests tipo test desde la semana 1</li>
  <li><strong>No practicar con penalización:</strong> El examen penaliza -1/3. Si estudias sin penalización, tu estrategia de respuesta será incorrecta.
    Lee sobre <a href="/blog/penalizacion-examen-auxiliar-administrativo">cómo funciona la penalización</a></li>
  <li><strong>Estudiar todo por igual:</strong> No todos los artículos pesan igual. Consulta el
    <a href="/blog/analisis-frecuencia-articulos-inap-auxiliar-administrativo">análisis de frecuencia de artículos INAP</a> para priorizar</li>
  <li><strong>No hacer simulacros completos:</strong> Necesitas acostumbrarte a 100 preguntas en 90 minutos. Haz al menos 1 simulacro/semana los últimos 2 meses</li>
</ul>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación 2025-2026</a> — todo lo que necesitas saber</li>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas en 2026</a> — la mejor convocatoria de la historia</li>
  <li><a href="/blog/psicotecnicas-examen-auxiliar-administrativo-estado">Psicotécnicos del examen</a> — no los dejes para el final</li>
</ul>
    `.trim(),
  },

  // ─── Post 14 ───────────────────────────────────────────────────────────────
  {
    slug: 'cuantos-temas-examen-auxiliar-administrativo-estado',
    title: '¿Cuántos temas tiene el Auxiliar Administrativo? 28, pero no todos pesan igual',
    description:
      '28 temas en 2 bloques: 16 de organización pública y 12 de ofimática. Pero no todos caen igual en el examen — te mostramos cuáles pregunta más el INAP según datos reales y por cuáles empezar.',
    date: '2026-03-16',
    keywords: [
      'cuántos temas auxiliar administrativo estado',
      'temario auxiliar administrativo cuántos temas',
      'número temas oposición auxiliar administrativo',
      'temas examen auxiliar administrativo 2026',
      'cuantos temas tiene la oposicion de auxiliar administrativo',
      'cuantos temas son auxiliar administrativo del estado',
      'cuantos temas tiene auxiliar administrativo del estado',
      'temario auxiliar administrativo del estado numero de temas',
    ],
    content: `
<h2>28 temas divididos en 2 bloques</h2>
<p>
  El temario del Cuerpo General Auxiliar de la Administración del Estado (C2) consta de
  <strong>28 temas</strong> organizados en dos bloques:
</p>
<ul>
  <li><strong>Bloque I — Organización Pública:</strong> 16 temas de derecho constitucional,
  administrativo y organización del Estado</li>
  <li><strong>Bloque II — Ofimática:</strong> 12 temas de Windows 11, Microsoft 365
  (Word, Excel, Access, Outlook) e Internet</li>
</ul>

<h2>Bloque I — Organización Pública (16 temas)</h2>
<table>
  <thead>
    <tr><th>Tema</th><th>Contenido</th><th>Ley principal</th></tr>
  </thead>
  <tbody>
    <tr><td>1-3</td><td>Constitución Española: principios, derechos, Cortes, Gobierno, Poder Judicial</td><td>CE 1978</td></tr>
    <tr><td>4-5</td><td>Organización territorial, Unión Europea</td><td>CE 1978, Tratados UE</td></tr>
    <tr><td>6-7</td><td>Gobierno y Administración General del Estado</td><td>Ley 50/1997, LOFAGE</td></tr>
    <tr><td>8-10</td><td>Procedimiento administrativo común</td><td>LPAC (Ley 39/2015)</td></tr>
    <tr><td>11</td><td>Régimen jurídico del sector público</td><td>LRJSP (Ley 40/2015)</td></tr>
    <tr><td>12</td><td>Presupuestos Generales del Estado</td><td>Ley 47/2003</td></tr>
    <tr><td>13-14</td><td>Función pública: TREBEP</td><td>RDL 5/2015</td></tr>
    <tr><td>15</td><td>Protección de datos</td><td>LOPDGDD (LO 3/2018)</td></tr>
    <tr><td>16</td><td>Igualdad, violencia de género, LGTBI</td><td>LO 3/2007, LO 1/2004, LO 4/2023</td></tr>
  </tbody>
</table>

<h2>Bloque II — Ofimática (12 temas)</h2>
<table>
  <thead>
    <tr><th>Tema</th><th>Contenido</th></tr>
  </thead>
  <tbody>
    <tr><td>17-18</td><td>Informática básica, redes, Internet</td></tr>
    <tr><td>19-20</td><td>Windows 11</td></tr>
    <tr><td>21-23</td><td>Microsoft Word 365</td></tr>
    <tr><td>24-25</td><td>Microsoft Excel 365</td></tr>
    <tr><td>26</td><td>Microsoft Access 365</td></tr>
    <tr><td>27</td><td>Microsoft Outlook 365</td></tr>
    <tr><td>28</td><td>Correo electrónico y seguridad</td></tr>
  </tbody>
</table>

<h2>¿Por dónde empezar a estudiar?</h2>
<p>
  Recomendación basada en el <a href="/blog/analisis-frecuencia-articulos-inap-auxiliar-administrativo">análisis de frecuencia de exámenes INAP</a>:
</p>
<ol>
  <li><strong>LPAC (temas 8-10):</strong> La ley con más preguntas en cada convocatoria (5-8 preguntas)</li>
  <li><strong>Constitución (temas 1-3):</strong> 8-12 preguntas por convocatoria</li>
  <li><strong>TREBEP (temas 13-14):</strong> 3-5 preguntas, artículos repetitivos</li>
  <li><strong>Ofimática (temas 17-28):</strong> 50 preguntas en el examen — no puedes descuidarla</li>
  <li><strong>Resto del Bloque I:</strong> Completar con LOPDGDD, LRJSP, igualdad, presupuestos</li>
</ol>
<p>
  <strong>Error típico:</strong> Empezar por el tema 1 y seguir en orden. Los temas 8-10 (LPAC) y
  ofimática deberían ser tu prioridad desde las primeras semanas.
</p>

<h2>¿Cuánto tiempo se necesita para estudiar 28 temas?</h2>
<p>
  Depende de tu dedicación, pero una referencia realista:
</p>
<ul>
  <li><strong>4-6 horas/día (dedicación completa):</strong> 3-4 meses</li>
  <li><strong>2-3 horas/día (compatibilizando trabajo):</strong> 6-8 meses</li>
  <li><strong>1-2 horas/día (mínimo):</strong> 9-12 meses</li>
</ul>
<p>
  Lo importante no es cuántas horas lees, sino cuántas preguntas tipo test practicas.
  Lee más en nuestra <a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">guía completa de preparación</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo detallado</a> — desglose tema por tema</li>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas en 2026</a> — la mayor oferta histórica</li>
  <li><a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">Preparar por libre</a> — sin academia, a tu ritmo</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuántos temas entran en el examen de Auxiliar Administrativo del Estado?', answer: 'El temario oficial consta de 28 temas: 16 del Bloque I (Organización Pública) y 12 del Bloque II (Actividad Administrativa y Ofimática). Todos los temas pueden ser preguntados, pero la frecuencia de aparición varía mucho de unos a otros.' },
      { question: '¿Es posible aprobar sin estudiar todos los temas?', answer: 'Teóricamente sí, pero es arriesgado. Los 6-8 temas más frecuentes cubren un 40-50% de las preguntas, pero el 50% restante se reparte entre los 20 temas restantes. Lo recomendable es estudiar todos, priorizando los más preguntados para dominarlos a fondo.' },
      { question: '¿Cuántos temas hay que estudiar por semana para llegar al examen?', answer: 'Con 5 meses de preparación y 28 temas, necesitas cubrir unos 1,5 temas por semana en la primera vuelta. En la segunda vuelta puedes repasar 3-4 temas semanales. Reserva el último mes exclusivamente para simulacros y repaso de errores.' },
      { question: '¿El Bloque II de ofimática entra en el cuestionario tipo test?', answer: 'Sí. El Bloque II (Word, Excel, administración electrónica) aporta preguntas tanto al cuestionario tipo test como a la prueba práctica de ofimática. No conviene descuidarlo: dominar Word y Excel puede ser la diferencia entre aprobar y suspender.' },
    ],
  },

  // ─── Post 15 ───────────────────────────────────────────────────────────────
  {
    slug: 'lpac-articulos-clave-estrategia-estudio-oposiciones',
    title: 'Cómo estudiar la LPAC para oposiciones: artículos clave y estrategia',
    description:
      'Guía práctica para estudiar la Ley 39/2015 (LPAC) en oposiciones: los 20 artículos clave que más pregunta el INAP, estrategia de estudio y ejemplos reales de preguntas.',
    date: '2026-03-15',
    keywords: [
      'estudiar LPAC oposiciones',
      'artículos clave ley 39/2015',
      'LPAC estrategia estudio auxiliar administrativo',
      'procedimiento administrativo oposiciones',
    ],
    content: `
<p>
  La <strong>Ley 39/2015, de Procedimiento Administrativo Común</strong> (LPAC) es, junto con la
  Constitución, la norma más preguntada en el examen de Auxiliar Administrativo del Estado. En cada
  convocatoria aparecen entre <strong>5 y 8 preguntas directas</strong> sobre esta ley, y muchas más
  que la mencionan de forma indirecta. Si no la dominas, estás regalando puntos.
</p>
<p>
  Pero la LPAC tiene 133 artículos. ¿Hay que memorizarlos todos? <strong>No.</strong> La clave es
  saber cuáles caen siempre y cuáles casi nunca aparecen. En esta guía te explicamos exactamente
  qué estudiar y cómo.
</p>

<h2>¿Por qué la LPAC es tan importante?</h2>
<p>
  La LPAC regula cómo la Administración se relaciona con los ciudadanos: cómo se inicia un
  procedimiento, los plazos, los recursos, las notificaciones electrónicas... Es la columna vertebral
  de la actuación administrativa. Para un Auxiliar Administrativo, que tramita expedientes a diario,
  es conocimiento de uso directo.
</p>
<p>
  En el temario del Auxiliar (C2), la LPAC aparece en los <strong>temas 18 a 23 del Bloque I</strong>.
  Son 6 temas completos dedicados a esta ley, lo que da una idea de su peso.
</p>

<h2>Los 20 artículos que más caen en el examen</h2>
<p>
  Tras analizar los exámenes INAP de 2019, 2022 y 2024, estos son los artículos con mayor frecuencia
  de aparición:
</p>
<ul>
  <li><strong>Art. 21 — Obligación de resolver:</strong> plazos de resolución (3 meses por defecto si la norma no dice otro), silencio administrativo positivo/negativo</li>
  <li><strong>Art. 53 — Derechos del interesado:</strong> acceso al expediente, copia de documentos, identificación de autoridades</li>
  <li><strong>Art. 66-68 — Solicitudes:</strong> contenido mínimo, subsanación de defectos (10 días), mejora de la solicitud</li>
  <li><strong>Art. 82 — Trámite de audiencia:</strong> plazo mínimo 10 días / máximo 15 días, cuándo se puede omitir</li>
  <li><strong>Art. 112-113 — Recursos administrativos:</strong> recurso de alzada (1 mes / 3 meses) y recurso de reposición (1 mes / 1 mes)</li>
  <li><strong>Art. 121-122 — Revisión de oficio y declaración de lesividad:</strong> actos nulos vs anulables, plazos (4 años lesividad)</li>
  <li><strong>Art. 39-40 — Eficacia y notificaciones:</strong> la notificación electrónica como norma, plazo 10 días para publicación</li>
  <li><strong>Art. 41-43 — Práctica de notificaciones:</strong> electrónicas obligatorias para personas jurídicas, comparecencia electrónica</li>
  <li><strong>Art. 9-10 — Identificación y firma electrónica:</strong> sistemas de firma admitidos, cl@ve</li>
  <li><strong>Art. 14 — Derecho y obligación de relación electrónica:</strong> quiénes están obligados</li>
</ul>

<h2>Cómo pregunta el INAP sobre la LPAC</h2>
<p>
  Las preguntas del INAP sobre la LPAC siguen patrones muy reconocibles:
</p>
<ul>
  <li><strong>Plazos concretos:</strong> "¿Cuál es el plazo para interponer recurso de alzada?" → 1 mes (acto expreso) o 3 meses (silencio)</li>
  <li><strong>Artículos trampa:</strong> mezclan plazos de leyes distintas (LPAC vs LRJSP) en las opciones</li>
  <li><strong>Obligaciones electrónicas:</strong> quiénes están obligados a relacionarse electrónicamente (art. 14.2)</li>
  <li><strong>Diferencias sutil:</strong> actos nulos (art. 47) vs anulables (art. 48) — siempre hay una pregunta</li>
</ul>
<p>
  Recuerda que el examen tiene <a href="/blog/penalizacion-examen-auxiliar-administrativo">penalización -1/3</a>,
  así que si no estás seguro de un plazo concreto, es mejor dejar en blanco.
</p>

<h2>Estrategia de estudio: no memorices los 133 artículos</h2>
<p>
  El error más común es intentar memorizar la LPAC entera. Es una pérdida de tiempo. En su lugar:
</p>
<ol>
  <li><strong>Estudia los 20 artículos clave</strong> que hemos listado arriba. Representan el 80% de las preguntas</li>
  <li><strong>Haz una tabla de plazos:</strong> recurso de alzada, reposición, extraordinario de revisión, silencio... Los plazos son el 50% de las preguntas LPAC</li>
  <li><strong>Practica con preguntas tipo test:</strong> no basta con leer el artículo; necesitas ver cómo lo pregunta el INAP para detectar las trampas</li>
  <li><strong>Compara con la LRJSP:</strong> muchas preguntas mezclan artículos de ambas leyes para confundirte</li>
  <li><strong>Repasa las notificaciones electrónicas:</strong> es un tema reciente que el INAP está preguntando cada vez más</li>
</ol>
<p>
  Si quieres profundizar en los artículos LPAC más preguntados, consulta nuestra
  <a href="/blog/articulos-lpac-mas-preguntados-auxiliar-administrativo">guía específica de artículos LPAC</a>.
  Y para la otra gran ley del temario, revisa
  <a href="/blog/constitucion-espanola-preguntas-oposicion-auxiliar">las preguntas de Constitución que más caen</a>.
</p>

<h2>Practica con preguntas reales INAP</h2>
<p>
  La mejor forma de dominar la LPAC es enfrentarte a preguntas tipo test basadas en convocatorias
  anteriores. En OpoRuta puedes hacer <a href="/examenes-oficiales">simulacros con preguntas oficiales INAP</a>
  de 2018, 2019, 2022 y 2024, con penalización real y corrección automática.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/articulos-lpac-mas-preguntados-auxiliar-administrativo">Artículos LPAC más preguntados</a> — análisis detallado artículo por artículo</li>
  <li><a href="/blog/constitucion-espanola-preguntas-oposicion-auxiliar">Constitución: preguntas que más caen</a> — la otra ley estrella del examen</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Penalización -1/3</a> — cómo gestionar las preguntas dudosas</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué estrategia de estudio es más efectiva para la LPAC?', answer: 'La estrategia más efectiva es el estudio activo: leer los artículos clave, hacer tests inmediatamente después, y repasar los errores con repetición espaciada. Releer pasivamente la ley es mucho menos eficiente que hacer 20 preguntas tipo test sobre los mismos artículos.' },
      { question: '¿Los artículos de la LPAC cambian de una convocatoria a otra?', answer: 'La LPAC (Ley 39/2015) ha sufrido pocas modificaciones desde su entrada en vigor. Las más relevantes afectan a la administración electrónica y los plazos de notificación. OpoRuta verifica cada cita contra la legislación vigente del BOE para asegurar que no estudias artículos derogados o modificados.' },
      { question: '¿Cuántos artículos tiene la LPAC y cuántos hay que saber?', answer: 'La LPAC tiene 133 artículos, pero para el examen de Auxiliar basta con dominar unos 30-35 artículos clave. Los que más caen son: art. 2 (ámbito de aplicación), arts. 13 y 53 (derechos), art. 21 (obligación de resolver), arts. 53-56 (interesados), art. 66 (solicitudes), arts. 112-126 (recursos) y arts. 77-92 (procedimiento).' },
      { question: '¿La LPAC es la misma para C1 y C2?', answer: 'Sí, la LPAC (Ley 39/2015) es la misma ley para ambas oposiciones. La diferencia es que en C1 (Administrativo) se exige un conocimiento más profundo y se pregunta en relación con el supuesto práctico, mientras que en C2 (Auxiliar) las preguntas son más directas sobre artículos concretos.' },
    ],
  },

  // ─── Post 16 ───────────────────────────────────────────────────────────────
  {
    slug: 'psicotecnicos-auxiliar-administrativo-tipos-trucos',
    title: 'Psicotécnicos auxiliar administrativo: tipos, ejemplos y trucos',
    description:
      'Guía completa de psicotécnicos para el examen de Auxiliar Administrativo del Estado: tipos de ejercicios, trucos para resolverlos rápido y errores comunes que evitar.',
    date: '2026-03-17',
    keywords: [
      'psicotécnicos auxiliar administrativo',
      'test psicotécnicos oposiciones',
      'ejercicios psicotécnicos examen INAP',
      'trucos psicotécnicos oposiciones',
    ],
    content: `
<p>
  El examen de Auxiliar Administrativo del Estado incluye <strong>30 preguntas de psicotécnicos</strong>
  en la parte de ofimática y actividad administrativa. Aunque muchos opositores los subestiman, estas
  preguntas pueden marcar la diferencia entre aprobar y suspender. La buena noticia: con práctica
  diaria, son las más fáciles de mejorar.
</p>

<h2>¿Qué son los psicotécnicos y por qué importan?</h2>
<p>
  Los psicotécnicos miden capacidades cognitivas: razonamiento lógico, atención, velocidad de
  procesamiento y capacidad numérica. No requieren memorizar leyes ni artículos, sino
  <strong>entrenar tu mente</strong> para resolver patrones bajo presión de tiempo.
</p>
<p>
  En el examen INAP, las 30 preguntas psicotécnicas se mezclan con las de ofimática dentro del
  mismo bloque de 50 preguntas (Bloque II). Tienes aproximadamente <strong>90 segundos por pregunta</strong>,
  así que la velocidad es clave.
</p>

<h2>Tipos de psicotécnicos que caen en el examen</h2>

<h3>1. Series numéricas</h3>
<p>
  Te dan una secuencia de números y debes encontrar el siguiente. Las más comunes:
  sumas/restas progresivas, multiplicaciones, series alternadas (una regla para posiciones pares,
  otra para impares) y series con operaciones combinadas.
</p>
<p>
  <strong>Truco:</strong> calcula siempre la diferencia entre cada par de números consecutivos.
  Si las diferencias forman un patrón, has encontrado la regla.
</p>

<h3>2. Series de letras</h3>
<p>
  Secuencias alfabéticas con saltos regulares. Ejemplo: A, D, G, J... (saltos de 3).
  Las variantes incluyen series inversas, series con doble letra y series que combinan
  mayúsculas y minúsculas.
</p>
<p>
  <strong>Truco:</strong> numera las letras del alfabeto (A=1, B=2...) y convierte la serie
  de letras en serie numérica. Es más fácil ver el patrón con números.
</p>

<h3>3. Analogías y relaciones</h3>
<p>
  "A es a B como C es a ___". Pueden ser relaciones semánticas (sinónimos, antónimos, categorías),
  numéricas o visuales. El INAP suele usar analogías de categoría (animal:mamífero :: rosa:___).
</p>

<h3>4. Razonamiento lógico</h3>
<p>
  Silogismos, deducciones y problemas de lógica proposicional. "Si todos los A son B, y algunos B
  son C, ¿qué podemos afirmar?" Son las que más tiempo consumen, así que déjalas para el final
  si no las ves claras.
</p>

<h3>5. Atención y percepción</h3>
<p>
  Contar elementos, encontrar diferencias, detectar errores en secuencias. Requieren concentración
  máxima pero poca reflexión. Son puntos "fáciles" si no te precipitas.
</p>

<h2>Trucos para resolver psicotécnicos más rápido</h2>
<ul>
  <li><strong>Practica a diario:</strong> 15-20 minutos de psicotécnicos cada día son más efectivos que 2 horas el fin de semana. Tu cerebro necesita repetición espaciada</li>
  <li><strong>Gestiona el tiempo:</strong> si en 60 segundos no ves el patrón, marca la pregunta y sigue. Vuelve al final si queda tiempo</li>
  <li><strong>Cuidado con las trampas:</strong> el INAP pone opciones que "casi" encajan. Verifica siempre que tu respuesta cumple la regla para TODOS los elementos de la serie, no solo los últimos</li>
  <li><strong>Empieza por las fáciles:</strong> las series simples y las de atención primero. Las de lógica compleja al final</li>
  <li><strong>No adivines:</strong> con <a href="/blog/penalizacion-examen-auxiliar-administrativo">penalización -1/3</a>, responder al azar te perjudica. Si no puedes descartar al menos una opción, déjala en blanco</li>
</ul>

<h2>Errores comunes en psicotécnicos</h2>
<ul>
  <li><strong>No practicar suficiente:</strong> los psicotécnicos son pura práctica. Leer teoría sobre "cómo resolver series" no sirve si no haces cientos de ejercicios</li>
  <li><strong>Precipitarse:</strong> un error de cálculo en el primer paso invalida toda la serie. Comprueba siempre</li>
  <li><strong>Ignorar las instrucciones:</strong> a veces piden "el anterior" en vez de "el siguiente". Lee el enunciado completo</li>
  <li><strong>Bloqueo mental:</strong> si te atascas, pasa a la siguiente. Un minuto perdido en una pregunta imposible son puntos que no ganas en otras fáciles</li>
</ul>

<h2>Practica psicotécnicos con OpoRuta</h2>
<p>
  En OpoRuta tienes un <a href="/psicotecnicos">generador ilimitado de psicotécnicos</a> con los 5 tipos
  que caen en el examen. Cada ejercicio incluye explicación detallada de la solución para que entiendas
  el patrón, no solo la respuesta.
</p>
<p>
  Para una visión más amplia de las pruebas psicotécnicas en oposiciones, lee nuestro artículo sobre
  <a href="/blog/pruebas-psicotecnicas-examen-auxiliar-administrativo">pruebas psicotécnicas en el examen</a>.
  Y si estás empezando a prepararte, nuestra
  <a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">guía completa de preparación</a>
  te ayudará a organizar tu estudio.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/pruebas-psicotecnicas-examen-auxiliar-administrativo">Pruebas psicotécnicas en detalle</a> — qué evalúan y cómo puntuarlas</li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Penalización -1/3</a> — cuándo dejar en blanco en psicotécnicos</li>
  <li><a href="/blog/como-preparar-oposicion-auxiliar-administrativo-estado-guia">Guía completa de preparación</a> — organiza tu estudio de principio a fin</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué tipos de psicotécnicos caen en la oposición de Auxiliar Administrativo?', answer: 'Los 6 tipos principales son: series numéricas (encontrar el patrón), series alfabéticas, analogías verbales (relaciones entre palabras), razonamiento lógico (silogismos y deducciones), comprensión verbal (textos administrativos) y cálculo mental. Las series numéricas y el razonamiento lógico son los más frecuentes.' },
      { question: '¿Cuántas preguntas psicotécnicas hay en el examen de Auxiliar?', answer: 'Aproximadamente 30 de las 100 preguntas puntuables son de carácter psicotécnico. Se integran en el cuestionario tipo test junto con las preguntas teóricas y de ofimática, no es una prueba aparte.' },
      { question: '¿Cómo mejorar en series numéricas rápidamente?', answer: 'Practica identificando patrones comunes: sumas/restas constantes, multiplicaciones, potencias, Fibonacci, y combinaciones de dos series alternadas. Empieza con series fáciles y aumenta la dificultad. Con 15-20 minutos diarios de práctica durante 1 mes notarás una mejora significativa.' },
      { question: '¿Los psicotécnicos se pueden preparar o dependen de la inteligencia?', answer: 'Se pueden preparar y mejorar con práctica. Los psicotécnicos de oposiciones siguen patrones repetitivos que se aprenden con entrenamiento. Opositores que al principio fallan el 60% de psicotécnicos suelen alcanzar un 80-85% de acierto tras 2-3 meses de práctica diaria.' },
      { question: '¿Qué trucos hay para resolver psicotécnicos más rápido?', answer: 'Los trucos más útiles: en series numéricas, calcula las diferencias entre términos consecutivos. En analogías, identifica la relación (sinónimo, antónimo, parte-todo) antes de mirar las opciones. En razonamiento lógico, dibuja diagramas de Venn. Y siempre: si llevas más de 1 minuto en una pregunta, márcala y sigue adelante.' },
    ],
  },

  // ─── Post 17 ───────────────────────────────────────────────────────────────
  {
    slug: 'ofimatica-word-excel-examen-auxiliar-administrativo-2026',
    title: 'Ofimática Word y Excel para el examen auxiliar administrativo 2026',
    description:
      'Todo sobre las preguntas de Word y Excel en el examen de Auxiliar Administrativo del Estado: qué temas caen, cómo estudiar ofimática y los atajos más preguntados por el INAP.',
    date: '2026-03-19',
    keywords: [
      'ofimática examen auxiliar administrativo',
      'Word Excel oposiciones',
      'preguntas ofimática INAP 2026',
      'temario ofimática auxiliar estado',
    ],
    content: `
<p>
  El Bloque II del examen de Auxiliar Administrativo del Estado dedica <strong>50 preguntas a
  actividad administrativa y ofimática</strong>. De esas 50, aproximadamente la mitad son de
  ofimática pura: Word, Excel, correo electrónico y sistemas operativos. Es el bloque donde
  más puntos puedes ganar con menos esfuerzo si estudias de forma inteligente.
</p>

<h2>¿Qué peso tiene la ofimática en el examen?</h2>
<p>
  El examen tiene 100 preguntas puntuables: 50 del Bloque I (Organización del Estado y Derecho
  Administrativo) y 50 del Bloque II (Actividad Administrativa e Informática). Dentro del Bloque II,
  los temas 24-28 son de ofimática. El INAP suele repartir así:
</p>
<ul>
  <li><strong>Word:</strong> 8-12 preguntas (procesador de textos)</li>
  <li><strong>Excel:</strong> 8-12 preguntas (hoja de cálculo)</li>
  <li><strong>Correo electrónico y navegación:</strong> 3-5 preguntas</li>
  <li><strong>Sistema operativo Windows:</strong> 3-5 preguntas</li>
  <li><strong>Psicotécnicos y actividad administrativa:</strong> el resto</li>
</ul>

<h2>Word: lo que más pregunta el INAP</h2>
<p>
  Las preguntas de Word no piden que redactes un documento, sino que conozcas funcionalidades
  específicas del programa. Los temas estrella:
</p>
<ul>
  <li><strong>Combinación de correspondencia (Mail Merge):</strong> cómo crear un documento base, seleccionar origen de datos, insertar campos de combinación. Cae en TODOS los exámenes</li>
  <li><strong>Estilos y formato:</strong> diferencia entre formato directo y estilos, cómo modificar un estilo, Galería de estilos rápidos</li>
  <li><strong>Secciones y saltos:</strong> salto de sección (página siguiente, continua, par/impar), diferencia con salto de página</li>
  <li><strong>Encabezados y pies de página:</strong> vincular a la sección anterior, campos automáticos (número de página, fecha)</li>
  <li><strong>Tablas:</strong> insertar, combinar/dividir celdas, ordenar datos, convertir texto en tabla</li>
  <li><strong>Revisión:</strong> control de cambios, comparar documentos, comentarios</li>
</ul>
<p>
  <strong>Truco clave:</strong> el INAP pregunta por las <strong>rutas de menú exactas</strong>.
  No basta saber que existe la combinación de correspondencia; necesitas saber que está en
  la pestaña <em>Correspondencia</em> y los pasos del asistente.
</p>

<h2>Excel: fórmulas y funciones que debes dominar</h2>
<p>
  Excel es donde más suspenden los opositores, porque requiere conocer funciones específicas.
  Lo imprescindible:
</p>
<ul>
  <li><strong>Fórmulas básicas:</strong> SUMA, PROMEDIO, MAX, MIN, CONTAR, CONTARA</li>
  <li><strong>Funciones lógicas:</strong> SI, Y, O, SI.ERROR — el INAP adora preguntar la sintaxis exacta de SI</li>
  <li><strong>BUSCARV / BUSCARX:</strong> argumentos, diferencia entre coincidencia exacta y aproximada</li>
  <li><strong>Referencias:</strong> relativas (A1), absolutas ($A$1), mixtas ($A1, A$1). Cae siempre</li>
  <li><strong>Gráficos:</strong> tipos (columnas, barras, circular, líneas), cómo cambiar el tipo, elementos del gráfico</li>
  <li><strong>Formato condicional:</strong> reglas, escalas de color, barras de datos</li>
  <li><strong>Filtros y ordenación:</strong> autofiltro, filtro avanzado, ordenar por múltiples criterios</li>
</ul>

<h2>Cómo estudiar ofimática (sin morir en el intento)</h2>
<ol>
  <li><strong>No memorices cada menú:</strong> céntrate en los 20 comandos más preguntados, no en las 500 opciones que tiene Word</li>
  <li><strong>Practica con el programa abierto:</strong> lee la teoría y ve comprobando en Word/Excel real. La memoria muscular ayuda</li>
  <li><strong>Haz capturas de pantalla:</strong> de los menús que más caen (Correspondencia, Datos, Fórmulas) y repásalas como flashcards</li>
  <li><strong>Practica con tests tipo INAP:</strong> las preguntas tienen un estilo muy reconocible que solo se aprende practicando</li>
  <li><strong>Atajos de teclado:</strong> no te obsesiones, pero memoriza los 10 más comunes (Ctrl+C/V/X/Z, Ctrl+N, Ctrl+G, Ctrl+1 en Excel)</li>
</ol>

<h2>Errores que evitar en ofimática</h2>
<ul>
  <li><strong>Estudiar versiones antiguas:</strong> el INAP pregunta sobre Microsoft 365 / Office 2019-2021. Si tu manual habla de Office 2010, actualízalo</li>
  <li><strong>Ignorar el correo electrónico:</strong> Outlook tiene 3-5 preguntas fáciles si dedicas 2 horas a estudiarlo</li>
  <li><strong>Confundir Word y Excel:</strong> el INAP pone opciones de un programa mezcladas con otro para despistarte</li>
</ul>
<p>
  Si necesitas una visión global de los 28 temas, consulta el
  <a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">temario completo</a>. Y para saber
  cuántos temas priorizar, mira
  <a href="/blog/cuantos-temas-examen-auxiliar-administrativo-estado">cuántos temas tiene el examen</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo 2025-2026</a> — desglose de los 28 temas</li>
  <li><a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">Preparar por libre</a> — organiza tu estudio sin academia</li>
  <li><a href="/blog/cuantos-temas-examen-auxiliar-administrativo-estado">¿Cuántos temas tiene el examen?</a> — priorización y bloques</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué nivel de Word y Excel se pide en el examen de Auxiliar Administrativo?', answer: 'Se exige un nivel intermedio-avanzado. En Word: formato de texto y párrafo, estilos, tablas, encabezados/pies de página, secciones y combinación de correspondencia. En Excel: fórmulas básicas (SUMA, PROMEDIO, SI), referencias absolutas/relativas, formato condicional, ordenar/filtrar y gráficos.' },
      { question: '¿Cómo es la prueba práctica de ofimática del examen?', answer: 'La prueba práctica consiste en ejercicios sobre un ordenador con Word y Excel (versiones de Microsoft 365 o similar). Se pide reproducir documentos con formato específico, aplicar funciones en hojas de cálculo y gestionar datos. Dura entre 30 y 45 minutos y vale 50 puntos (50% de la nota total).' },
      { question: '¿Qué funciones de Excel caen más en el examen de Auxiliar?', answer: 'Las funciones más preguntadas son: SUMA, PROMEDIO, SI, CONTAR.SI, BUSCARV, MAX, MIN y las de fecha (HOY, AÑO). También preguntan sobre referencias absolutas ($A$1) vs relativas (A1), formato condicional y la creación de gráficos a partir de datos.' },
      { question: '¿Vale la pena estudiar ofimática si ya uso Word y Excel a diario?', answer: 'Sí. El examen pregunta funciones y opciones específicas que muchos usuarios habituales desconocen: combinación de correspondencia en Word, macros básicas, funciones anidadas en Excel y atajos de teclado. No basta con saber usar los programas; hay que conocer la teoría y las opciones avanzadas.' },
    ],
  },

  // ─── Post 18 ───────────────────────────────────────────────────────────────
  {
    slug: 'diferencias-auxiliar-c2-administrativo-c1-estado',
    title: 'C1 vs C2: ¿Auxiliar o Administrativo del Estado? Sueldo, plazas y cuál elegir',
    description:
      'Auxiliar (C2): 1.700 plazas, 28 temas, ~23.000€/año. Administrativo (C1): 2.512 plazas, 45 temas, ~28.000€/año. Tabla comparativa completa + criterios para decidir cuál te conviene.',
    date: '2026-03-21',
    keywords: [
      'diferencias auxiliar administrativo estado',
      'C1 vs C2 oposiciones AGE',
      'auxiliar o administrativo del estado',
      'sueldo auxiliar administrativo estado',
    ],
    content: `
<p>
  Si estás pensando en opositar a la Administración General del Estado (AGE), probablemente te
  hayas preguntado: <strong>¿Auxiliar (C2) o Administrativo (C1)?</strong> Son los dos cuerpos más
  demandados, con miles de plazas cada convocatoria, pero tienen diferencias importantes en
  requisitos, temario, examen y sueldo. Aquí las comparamos punto por punto.
</p>

<h2>Tabla comparativa: Auxiliar (C2) vs Administrativo (C1)</h2>
<table>
  <thead>
    <tr>
      <th></th>
      <th><strong>Auxiliar (C2)</strong></th>
      <th><strong>Administrativo (C1)</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Titulación</strong></td>
      <td>ESO / equivalente</td>
      <td>Bachillerato / equivalente</td>
    </tr>
    <tr>
      <td><strong>Plazas 2026</strong></td>
      <td>1.700</td>
      <td>2.512</td>
    </tr>
    <tr>
      <td><strong>Temas</strong></td>
      <td>28 temas (2 bloques)</td>
      <td>45 temas (6 bloques)</td>
    </tr>
    <tr>
      <td><strong>Examen</strong></td>
      <td>1 ejercicio: 100 preguntas tipo test (90 min)</td>
      <td>2 partes: 60 preguntas teóricas + caso práctico 50 preguntas (90 min total)</td>
    </tr>
    <tr>
      <td><strong>Penalización</strong></td>
      <td>Sí, -1/3 por error</td>
      <td>Sí, -1/3 por error</td>
    </tr>
    <tr>
      <td><strong>Sueldo neto aprox.</strong></td>
      <td>~1.600 €/mes</td>
      <td>~2.100 €/mes</td>
    </tr>
    <tr>
      <td><strong>Sueldo bruto anual</strong></td>
      <td>~22.000 €</td>
      <td>~28.000 €</td>
    </tr>
    <tr>
      <td><strong>Grupo/Subgrupo</strong></td>
      <td>C2</td>
      <td>C1</td>
    </tr>
  </tbody>
</table>

<h2>Temario: ¿qué se comparte y qué no?</h2>
<p>
  La buena noticia: aproximadamente el <strong>75% de la legislación es compartida</strong>.
  Constitución Española, LPAC, LRJSP, TREBEP y LOPDGDD aparecen en ambas oposiciones. Si
  preparas una, llevas mucho adelantado para la otra.
</p>
<p>
  Las diferencias principales del C1:
</p>
<ul>
  <li><strong>Bloque III — Derecho Administrativo:</strong> profundiza mucho más en contratación pública, subvenciones y responsabilidad patrimonial</li>
  <li><strong>Bloque IV — Gestión de personal:</strong> 9 temas sobre función pública, nóminas, Seguridad Social (en C2 solo hay 3 temas de personal)</li>
  <li><strong>Bloque V — Gestión financiera:</strong> presupuestos del Estado, contabilidad pública, control de gasto</li>
  <li><strong>Bloque VI — Informática:</strong> más profundo que en C2 (redes, bases de datos, administración electrónica avanzada)</li>
</ul>
<p>
  El C2, en cambio, dedica más peso relativo a ofimática práctica (Word, Excel) y psicotécnicos.
</p>

<h2>El examen: estructura y dificultad</h2>
<p>
  El examen de <strong>Auxiliar (C2)</strong> es un único ejercicio de 100 preguntas tipo test en
  90 minutos. Directo: estudias, practicas, apruebas.
</p>
<p>
  El examen de <strong>Administrativo (C1)</strong> tiene dos partes:
</p>
<ol>
  <li><strong>Primera parte:</strong> 60 preguntas teóricas sobre los 45 temas</li>
  <li><strong>Segunda parte:</strong> un supuesto práctico con 50 preguntas sobre un caso real de gestión administrativa</li>
</ol>
<p>
  El caso práctico del C1 es lo que más asusta a los opositores, pero en realidad es legislación
  aplicada: te dan un expediente y preguntan qué artículos aplican. Si dominas la ley, lo resuelves.
</p>

<h2>Nota de corte histórica</h2>
<ul>
  <li><strong>Auxiliar C2:</strong> 2024 → 6,50 | 2022 → 6,00 | 2019 → 5,75</li>
  <li><strong>Administrativo C1:</strong> 2024 → ~47 puntos | 2023 → ~46 | 2019 → ~54</li>
</ul>
<p>
  Las notas de corte del C1 se expresan en puntos (no sobre 10) porque el cálculo combina
  las dos partes del examen. Para el C2, puedes calcular tu nota con nuestra
  <a href="/calculadora-nota-oposicion">calculadora de nota con penalización</a>.
</p>

<h2>¿Cuál elegir?</h2>
<p>
  Depende de tu perfil:
</p>
<ul>
  <li><strong>Elige C2 si:</strong> tienes poco tiempo, prefieres un temario más corto, no tienes Bachillerato, o quieres entrar rápido y luego promocionar internamente</li>
  <li><strong>Elige C1 si:</strong> tienes Bachillerato, puedes dedicar 6-9 meses, quieres un sueldo ~500€/mes mayor, y no te asusta el caso práctico</li>
  <li><strong>Prepara ambas:</strong> muchos opositores se presentan a C2 y C1 simultáneamente. El 75% del temario es compartido, así que si preparas C1, el C2 lo llevas casi hecho</li>
</ul>

<h2>Progresión de carrera</h2>
<p>
  Como <strong>Auxiliar (C2)</strong>, puedes promocionar internamente a C1 tras 2 años de servicio
  (promoción interna, con examen reducido). Muchos opositores entran por C2 y suben a C1 desde dentro,
  que es más fácil que la oposición libre.
</p>
<p>
  Como <strong>Administrativo (C1)</strong>, puedes aspirar a A2 (Gestión) por promoción interna,
  aunque requiere titulación universitaria.
</p>
<p>
  Para saber más sobre las plazas de Auxiliar, lee nuestro artículo sobre
  <a href="/blog/plazas-auxiliar-administrativo-2026">las 1.700 plazas en 2026</a>. Y si quieres
  saber la nota que necesitas, consulta
  <a href="/blog/nota-corte-auxiliar-administrativo-estado">la nota de corte histórica</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas C2 en 2026</a> — la mayor oferta histórica</li>
  <li><a href="/blog/temario-auxiliar-administrativo-estado-2025-2026">Temario completo C2</a> — los 28 temas desglosados</li>
  <li><a href="/blog/nota-corte-auxiliar-administrativo-estado">Nota de corte Auxiliar</a> — qué nota necesitas para aprobar</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué diferencia hay entre Auxiliar Administrativo (C2) y Administrativo del Estado (C1)?', answer: 'Las principales diferencias: C2 requiere ESO y tiene 28 temas, C1 requiere bachillerato y tiene 45 temas. C1 incluye supuesto práctico (C2 no). El sueldo de C1 es mayor (~1.500-2.100€ vs ~1.300-1.700€). Ambos exámenes se celebran el mismo día (23 mayo 2026), así que debes elegir uno.' },
      { question: '¿Es mejor presentarse al C1 o al C2?', answer: 'Depende de tu formación y disponibilidad. Si tienes bachillerato y puedes dedicar 6-10 meses de estudio, C1 ofrece mejor sueldo y proyección. Si prefieres un temario más corto y una primera oportunidad más accesible, C2 es una excelente puerta de entrada con posibilidad de promoción interna posterior a C1.' },
      { question: '¿Se puede promocionar de C2 a C1 una vez dentro?', answer: 'Sí. Los funcionarios C2 pueden acceder al C1 por promoción interna, que tiene plazas reservadas y un temario reducido. Es una vía muy utilizada: entras como Auxiliar (C2) y en 2-3 años puedes presentarte al C1 con ventaja (conocimiento de la Administración + plazas reservadas).' },
      { question: '¿El Pack Doble de OpoRuta incluye C1 y C2?', answer: 'Sí. El Pack Doble cuesta 79,99€ (pago único) e incluye acceso completo a los temarios, tests, simulacros y herramientas de IA tanto para Auxiliar (C2, 28 temas) como para Administrativo (C1, 45 temas). Si solo preparas una oposición, el Pack individual cuesta 49,99€.' },
    ],
  },

  // ─── Post 19 ───────────────────────────────────────────────────────────────
  {
    slug: 'constitucion-espanola-oposiciones-age-articulos-clave',
    title: 'Constitución Española para oposiciones AGE: artículos que más caen',
    description:
      'Los artículos de la Constitución Española que más pregunta el INAP en oposiciones AGE: análisis por frecuencia, estrategia de estudio y trampas habituales del examen.',
    date: '2026-03-23',
    keywords: [
      'Constitución Española oposiciones AGE',
      'artículos Constitución examen oposiciones',
      'estudiar Constitución oposiciones',
      'CE preguntas más frecuentes',
    ],
    content: `
<p>
  La Constitución Española de 1978 es la <strong>norma más preguntada</strong> en las oposiciones
  a la Administración General del Estado, tanto en Auxiliar (C2) como en Administrativo (C1). En
  cada examen aparecen entre <strong>8 y 12 preguntas directas</strong> sobre la CE, más otras
  tantas que la mencionan indirectamente. Dominar los artículos clave es obligatorio para aprobar.
</p>

<h2>¿Por qué la Constitución tiene tanto peso?</h2>
<p>
  La CE es la norma suprema del ordenamiento jurídico español. Todas las leyes que estudias en
  oposiciones (LPAC, LRJSP, TREBEP, LOPDGDD) derivan de ella. Para el INAP, comprobar que
  conoces la CE es comprobar que entiendes los <strong>fundamentos del sistema</strong>.
</p>
<p>
  En el temario del Auxiliar (C2), la CE ocupa los <strong>temas 1 a 6 del Bloque I</strong>:
  principios generales, derechos fundamentales, Corona, Cortes, Gobierno y Poder Judicial,
  organización territorial. Son 6 de los 28 temas (más del 20% del temario).
</p>

<h2>Artículos que más caen en el examen INAP</h2>
<p>
  Tras analizar los exámenes de 2018, 2019, 2022 y 2024, estos son los artículos con mayor
  frecuencia de aparición:
</p>

<h3>Título Preliminar (arts. 1-9)</h3>
<ul>
  <li><strong>Art. 1:</strong> España como Estado social y democrático de Derecho. Valores superiores: libertad, justicia, igualdad, pluralismo político</li>
  <li><strong>Art. 2:</strong> Unidad de la Nación, derecho a la autonomía</li>
  <li><strong>Art. 9.1:</strong> Sujeción de ciudadanos y poderes públicos a la Constitución</li>
  <li><strong>Art. 9.3:</strong> Principios: legalidad, jerarquía normativa, publicidad, irretroactividad de disposiciones sancionadoras, seguridad jurídica, responsabilidad, interdicción de la arbitrariedad</li>
</ul>

<h3>Derechos fundamentales (arts. 14-29)</h3>
<ul>
  <li><strong>Art. 14:</strong> Igualdad ante la ley (sin discriminación por nacimiento, raza, sexo, religión, opinión)</li>
  <li><strong>Art. 23:</strong> Derecho a participar en asuntos públicos y acceder a funciones y cargos públicos en condiciones de igualdad</li>
  <li><strong>Art. 27:</strong> Derecho a la educación</li>
  <li><strong>Art. 28:</strong> Derecho de sindicación y huelga</li>
</ul>

<h3>Principios rectores (arts. 39-52)</h3>
<ul>
  <li><strong>Art. 43:</strong> Derecho a la protección de la salud</li>
  <li><strong>Art. 47:</strong> Derecho a la vivienda (no es derecho fundamental, pregunta trampa frecuente)</li>
</ul>

<h3>Título IV — Gobierno y Administración (arts. 97-107)</h3>
<ul>
  <li><strong>Art. 97:</strong> Funciones del Gobierno (dirige política interior/exterior, civil/militar, defensa)</li>
  <li><strong>Art. 103:</strong> La Administración sirve con objetividad a los intereses generales (mérito, capacidad, imparcialidad)</li>
  <li><strong>Art. 106:</strong> Los tribunales controlan la potestad reglamentaria y la legalidad de la actuación administrativa</li>
</ul>

<h3>Título VIII — Organización territorial (arts. 137-158)</h3>
<ul>
  <li><strong>Art. 137:</strong> El Estado se organiza en municipios, provincias y CCAA</li>
  <li><strong>Art. 140:</strong> Autonomía de los municipios, alcaldes elegidos por concejales o vecinos</li>
  <li><strong>Art. 143-144:</strong> Acceso a la autonomía</li>
  <li><strong>Art. 148-149:</strong> Competencias de las CCAA vs competencias exclusivas del Estado</li>
</ul>

<h2>Cómo estudiar la Constitución (estrategia inteligente)</h2>
<ol>
  <li><strong>Entiende los principios, no memorices números:</strong> el INAP no pregunta "¿qué dice el artículo 103?", sino "¿qué principios rigen la Administración Pública?" Si entiendes el concepto, identificas la respuesta</li>
  <li><strong>Haz una tabla de "quién hace qué":</strong> Rey (sanciona leyes, nombra), Presidente (disuelve Cortes, propone referéndum), Cortes (legislan, aprueban presupuestos). Las preguntas mezclan funciones para confundirte</li>
  <li><strong>Distingue derechos fundamentales de principios rectores:</strong> los arts. 14-29 tienen protección máxima (amparo ante TC). Los arts. 39-52 son principios rectores (solo ante jurisdicción ordinaria). El INAP pregunta la diferencia</li>
  <li><strong>El Título VIII es trampa:</strong> las competencias Estado/CCAA (arts. 148-149) son listas largas. Memoriza solo las competencias exclusivas del Estado más importantes (defensa, justicia, hacienda, comercio exterior)</li>
  <li><strong>Practica con preguntas tipo test:</strong> la CE parece fácil cuando la lees, pero las opciones del examen están diseñadas para confundir. Solo practicando aprendes a detectar las trampas</li>
</ol>

<h2>Trampas habituales del INAP con la Constitución</h2>
<ul>
  <li><strong>Valores vs principios:</strong> valores superiores (art. 1.1: libertad, justicia, igualdad, pluralismo) vs principios del art. 9.3. El INAP los mezcla en las opciones</li>
  <li><strong>Vivienda como "derecho fundamental":</strong> el art. 47 es un principio rector, no un derecho fundamental. Opción trampa clásica</li>
  <li><strong>Reforma constitucional:</strong> procedimiento ordinario (art. 167, 3/5 de cada Cámara) vs agravado (art. 168, 2/3 + referéndum). Siempre hay una pregunta</li>
  <li><strong>Quién nombra a quién:</strong> el Rey nombra al Presidente del Gobierno a propuesta del Congreso, NO del Senado</li>
</ul>
<p>
  Para profundizar en las preguntas de CE que más caen, consulta nuestra
  <a href="/blog/constitucion-espanola-preguntas-oposicion-auxiliar">guía específica de preguntas de Constitución</a>.
  Y para la otra ley estrella del examen, lee cómo estudiar
  <a href="/blog/articulos-lpac-mas-preguntados-auxiliar-administrativo">los artículos LPAC más preguntados</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/constitucion-espanola-preguntas-oposicion-auxiliar">Preguntas de Constitución que más caen</a> — análisis por convocatoria</li>
  <li><a href="/blog/articulos-lpac-mas-preguntados-auxiliar-administrativo">Artículos LPAC más preguntados</a> — la otra ley imprescindible</li>
  <li><a href="/blog/trebep-articulos-clave-oposiciones">TREBEP: artículos clave</a> — el Estatuto del Empleado Público</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué artículos de la Constitución son comunes para C1 y C2?', answer: 'Los artículos fundamentales son los mismos para ambas oposiciones: Título Preliminar (arts. 1-9), derechos fundamentales (arts. 14-29), Gobierno y Administración (arts. 97-107) y organización territorial (arts. 137-158). C1 profundiza más en la Corona, las Cortes y el Tribunal Constitucional.' },
      { question: '¿Cómo memorizar los artículos de la Constitución para el examen?', answer: 'Técnicas probadas: agrupa artículos por títulos temáticos (no por número), usa reglas mnemotécnicas para los plazos y cifras, y haz tests activos después de cada sesión de estudio. La repetición espaciada (repasar a intervalos crecientes) es más eficaz que releer varias veces seguidas.' },
      { question: '¿Preguntan sobre la organización territorial en el examen AGE?', answer: 'Sí. El Título VIII de la Constitución (arts. 137-158) sobre Comunidades Autónomas, provincias y municipios aparece con frecuencia. Las preguntas típicas versan sobre las competencias del Estado (art. 149), las competencias autonómicas (art. 148) y la organización municipal (art. 140).' },
      { question: '¿Qué derechos fundamentales preguntan más en el examen?', answer: 'Los más preguntados son: art. 14 (igualdad), art. 15 (derecho a la vida), art. 16 (libertad religiosa), art. 18 (intimidad y protección de datos), art. 20 (libertad de expresión), art. 23 (participación en asuntos públicos) y art. 28 (libertad sindical y huelga). Es clave saber cuáles necesitan ley orgánica para su desarrollo (arts. 15-29).' },
    ],
  },

  // ─── Post 20 ───────────────────────────────────────────────────────────────
  {
    slug: 'trebep-oposiciones-guia-estatuto-empleado-publico',
    title: 'TREBEP para oposiciones: guía del Estatuto del Empleado Público',
    description:
      'Guía práctica del TREBEP (RDL 5/2015) para oposiciones: artículos más preguntados, clases de empleados públicos, régimen disciplinario y estrategia de estudio.',
    date: '2026-03-25',
    keywords: [
      'TREBEP oposiciones',
      'Estatuto Básico Empleado Público examen',
      'artículos TREBEP más importantes',
      'estudiar TREBEP auxiliar administrativo',
    ],
    content: `
<p>
  El <strong>TREBEP</strong> (Texto Refundido del Estatuto Básico del Empleado Público, aprobado
  por Real Decreto Legislativo 5/2015) es la norma que regula a todos los empleados públicos en
  España. En el examen de Auxiliar Administrativo (C2) aparecen entre <strong>3 y 5 preguntas
  directas</strong>, y en el de Administrativo (C1) puede haber hasta 8-10 por su bloque de personal.
</p>
<p>
  Como futuro funcionario, el TREBEP es "tu ley": regula tus derechos, deberes, retribuciones,
  permisos, situaciones administrativas y régimen disciplinario. Conocerlo no es solo aprobar
  el examen, sino entender tu futuro laboral.
</p>

<h2>¿Qué es el TREBEP y por qué se estudia?</h2>
<p>
  El TREBEP (RDL 5/2015, de 30 de octubre) refunde el antiguo Estatuto Básico del Empleado Público
  (Ley 7/2007) con sus modificaciones posteriores. Tiene <strong>100 artículos</strong> organizados
  en 8 títulos, y regula todo lo relativo a la función pública.
</p>
<p>
  En el temario del Auxiliar (C2), el TREBEP se estudia en los <strong>temas 14, 15 y 16</strong>
  del Bloque I: clases de personal, derechos y deberes, y régimen disciplinario. En el C1, se
  amplía con 9 temas adicionales sobre gestión de personal.
</p>

<h2>Artículos TREBEP más preguntados por el INAP</h2>

<h3>Clases de empleados públicos (arts. 8-12)</h3>
<ul>
  <li><strong>Art. 8:</strong> Concepto y clases — funcionarios de carrera, funcionarios interinos, personal laboral, personal eventual</li>
  <li><strong>Art. 9:</strong> Funcionarios de carrera — nombrados legalmente, con carácter permanente</li>
  <li><strong>Art. 10:</strong> Funcionarios interinos — razones de urgencia o necesidad (4 supuestos: plazas vacantes, sustitución, exceso/acumulación, programas temporales)</li>
  <li><strong>Art. 11:</strong> Personal laboral — contrato de trabajo (fijo, indefinido, temporal)</li>
  <li><strong>Art. 12:</strong> Personal eventual — funciones de confianza o asesoramiento especial, cesa cuando cesa la autoridad que lo nombró</li>
</ul>
<p>
  <strong>Pregunta trampa clásica:</strong> el personal eventual NO es funcionario interino.
  El INAP mezcla las definiciones para confundirte. Clave: el eventual = confianza política,
  el interino = necesidad administrativa temporal.
</p>

<h3>Derechos individuales (art. 14)</h3>
<ul>
  <li>Inamovilidad en la condición de funcionario de carrera</li>
  <li>Retribuciones e indemnizaciones</li>
  <li>Participación en logro de objetivos (evaluación del desempeño)</li>
  <li>Defensa jurídica y protección social</li>
  <li>Formación continua y actualización permanente</li>
  <li>Respeto a la intimidad, orientación sexual, imagen propia</li>
  <li>No discriminación, conciliación vida personal/laboral, libertad de expresión</li>
</ul>

<h3>Deberes y código de conducta (arts. 52-54)</h3>
<ul>
  <li><strong>Art. 52:</strong> Deberes básicos — desempeñar con diligencia, cumplir la CE y el ordenamiento jurídico</li>
  <li><strong>Art. 53:</strong> Principios éticos — actuar con integridad, neutralidad, responsabilidad, imparcialidad, confidencialidad, dedicación al servicio público, transparencia, ejemplaridad, honradez</li>
  <li><strong>Art. 54:</strong> Principios de conducta — trato respetuoso, informar a los ciudadanos, guardar secreto profesional</li>
</ul>

<h3>Selección de empleados públicos (art. 55)</h3>
<ul>
  <li>Principios constitucionales: <strong>igualdad, mérito, capacidad</strong></li>
  <li>Principios adicionales: publicidad, transparencia, imparcialidad, profesionalidad, independencia, discrecionalidad técnica, adecuación, agilidad</li>
</ul>
<p>
  <strong>Pregunta frecuente:</strong> "¿Cuáles son los principios constitucionales de acceso
  al empleo público?" Respuesta: igualdad, mérito y capacidad (art. 55.1 TREBEP + art. 103.3 CE).
  Los demás son principios "adicionales" del TREBEP, no constitucionales.
</p>

<h3>Régimen disciplinario (arts. 93-98)</h3>
<ul>
  <li><strong>Art. 93:</strong> Responsabilidad disciplinaria — faltas muy graves, graves y leves</li>
  <li><strong>Art. 95:</strong> Faltas muy graves — incumplimiento deber constitucional, discriminación, abandono de servicio, notoria falta de rendimiento, desobediencia abierta</li>
  <li><strong>Art. 96:</strong> Sanciones — separación del servicio (solo falta muy grave), despido disciplinario (laboral), suspensión de funciones (máx. 6 años grave, 3 años leve)</li>
</ul>

<h2>Estrategia de estudio del TREBEP</h2>
<ol>
  <li><strong>Memoriza las 4 clases de empleados:</strong> funcionario de carrera, interino, laboral, eventual. Sus definiciones caen siempre</li>
  <li><strong>Haz una tabla comparativa:</strong> cada clase con sus requisitos, duración y cese. El INAP mezcla características de una clase con otra</li>
  <li><strong>Principios constitucionales vs TREBEP:</strong> igualdad-mérito-capacidad = CE. Los demás (publicidad, transparencia, agilidad...) = solo TREBEP</li>
  <li><strong>Régimen disciplinario:</strong> memoriza las faltas muy graves (son pocas y siempre caen) y la sanción máxima de cada tipo de falta</li>
  <li><strong>Practica con preguntas tipo test:</strong> el TREBEP tiene un vocabulario muy específico y el INAP lo explota en las opciones</li>
</ol>
<p>
  Para profundizar en los artículos clave del TREBEP, consulta nuestra
  <a href="/blog/trebep-articulos-clave-oposiciones">guía detallada de artículos TREBEP</a>.
  Y para completar tu visión de la legislación del examen, lee sobre
  <a href="/blog/lopdgdd-proteccion-datos-oposiciones">la LOPDGDD en oposiciones</a> y
  <a href="/blog/diferencias-lpac-lrjsp-oposiciones">las diferencias entre LPAC y LRJSP</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/trebep-articulos-clave-oposiciones">Artículos TREBEP más importantes</a> — análisis artículo por artículo</li>
  <li><a href="/blog/lopdgdd-proteccion-datos-oposiciones">LOPDGDD para oposiciones</a> — protección de datos en el examen</li>
  <li><a href="/blog/diferencias-lpac-lrjsp-oposiciones">LPAC vs LRJSP</a> — cómo distinguir las dos leyes administrativas</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué regula el TREBEP exactamente?', answer: 'El TREBEP (Real Decreto Legislativo 5/2015) es el Estatuto Básico del Empleado Público. Regula las clases de personal (funcionarios, laborales, eventuales), derechos y deberes, acceso al empleo público, situaciones administrativas, retribuciones y régimen disciplinario. Es la norma marco del empleo público en España.' },
      { question: '¿El TREBEP se aplica igual a todas las administraciones?', answer: 'El TREBEP es legislación básica estatal que se aplica a todas las Administraciones Públicas (AGE, CCAA y entidades locales). Sin embargo, cada Administración puede desarrollarlo con su propia legislación complementaria. Para el examen AGE, se pregunta sobre el TREBEP general y su aplicación específica en la AGE.' },
      { question: '¿Qué situaciones administrativas del TREBEP preguntan más?', answer: 'Las más preguntadas son: servicio activo (art. 86), servicios especiales (art. 87), servicio en otras Administraciones (art. 88), excedencia voluntaria (art. 89) y suspensión de funciones (art. 90). Es clave saber qué derechos se conservan en cada situación y los plazos de reingreso.' },
      { question: '¿Cuántas preguntas del TREBEP caen en el examen de Auxiliar?', answer: 'Entre 5 y 8 preguntas del cuestionario versan sobre el TREBEP. Es la tercera ley más preguntada tras la Constitución y la LPAC. El INAP suele combinar preguntas sobre clases de personal, derechos y régimen disciplinario.' },
    ],
  },

  // ─── Post 21 ───────────────────────────────────────────────────────────────
  {
    slug: 'administrativo-estado-c1-2026-plazas-temario-nota-corte',
    title: 'Administrativo del Estado (C1) 2026: 2.512 plazas, temario y nota de corte',
    description:
      '2.512 plazas convocadas, 45 temas en 3 bloques, test + supuesto práctico. Nota de corte histórica, sueldo ~28.000€/año y cómo prepararlo. Datos actualizados 2026.',
    date: '2026-03-27',
    keywords: [
      'administrativo del estado 2026',
      'oposiciones C1 AGE 2026',
      'plazas administrativo estado 2026',
      'temario administrativo estado',
    ],
    content: `
<p>
  La convocatoria de <strong>Administrativo del Estado (C1) 2026</strong> ofrece
  <strong>2.512 plazas</strong> (BOE-A-2025-26262), la cifra más alta de los últimos años. Es una
  oportunidad histórica para conseguir un puesto fijo en la Administración General del Estado con
  un sueldo de ~2.100 €/mes netos y todas las ventajas del empleo público.
</p>

<h2>Datos clave de la convocatoria 2026</h2>
<ul>
  <li><strong>Plazas:</strong> 2.512 (acceso libre + promoción interna)</li>
  <li><strong>Organismo convocante:</strong> INAP (Instituto Nacional de Administración Pública)</li>
  <li><strong>Titulación requerida:</strong> Bachillerato o equivalente</li>
  <li><strong>Grupo/Subgrupo:</strong> C1</li>
  <li><strong>Sueldo neto aproximado:</strong> ~2.100 €/mes (14 pagas)</li>
  <li><strong>Sueldo bruto anual:</strong> ~28.000 €</li>
  <li><strong>Nacionalidad:</strong> española o UE</li>
  <li><strong>Edad:</strong> mínimo 16 años, sin máximo</li>
</ul>

<h2>Estructura del examen</h2>
<p>
  El examen de Administrativo (C1) consta de <strong>un único ejercicio con dos partes</strong>,
  que se realizan en la misma sesión (90 minutos en total):
</p>
<ol>
  <li><strong>Primera parte (60 preguntas):</strong> preguntas teóricas tipo test sobre los 45 temas del temario. Penalización: cada 3 errores descuenta 1 acierto</li>
  <li><strong>Segunda parte (caso práctico, 50 preguntas):</strong> un supuesto práctico de gestión administrativa. Te dan un expediente real y preguntan qué normativa aplica, plazos, trámites, recursos...</li>
</ol>
<p>
  Ambas partes suman para la nota final. La <a href="/blog/penalizacion-examen-auxiliar-administrativo">penalización -1/3</a>
  se aplica en ambas partes, así que la estrategia de dejar en blanco las dudosas sigue siendo válida.
</p>

<h2>Notas de corte históricas</h2>
<p>
  Las notas de corte del Administrativo (C1) se expresan en puntos totales (no sobre 10),
  ya que combinan las dos partes del examen:
</p>
<ul>
  <li><strong>2024:</strong> ~47 puntos</li>
  <li><strong>2023:</strong> ~46 puntos</li>
  <li><strong>2021:</strong> ~62 puntos</li>
  <li><strong>2019:</strong> ~54 puntos</li>
</ul>
<p>
  La variación entre convocatorias se debe al número de plazas y a la dificultad del examen.
  Con 2.512 plazas en 2026, se espera una nota de corte en el rango medio-bajo.
</p>

<h2>Temario completo: 45 temas en 6 bloques</h2>

<h3>Bloque I — Organización del Estado y de la UE (temas 1-10)</h3>
<p>
  Constitución Española, Corona, Cortes Generales, Gobierno, Poder Judicial, organización
  territorial, Tribunal Constitucional, Unión Europea. Compartido en un 80% con el C2.
</p>

<h3>Bloque II — Organización de la AGE (temas 11-14)</h3>
<p>
  Ley 40/2015 (LRJSP), organización ministerial, organismos públicos, administración periférica
  (Delegaciones y Subdelegaciones del Gobierno).
</p>

<h3>Bloque III — Derecho Administrativo General (temas 15-24)</h3>
<p>
  LPAC (Ley 39/2015), acto administrativo, procedimiento, recursos, revisión de oficio,
  responsabilidad patrimonial, contratación del sector público, subvenciones. Es el bloque
  más extenso y de mayor peso en el examen.
</p>

<h3>Bloque IV — Gestión de Recursos Humanos (temas 25-33)</h3>
<p>
  TREBEP, clases de personal, provisión de puestos, retribuciones, Seguridad Social, MUFACE,
  prevención de riesgos laborales, igualdad efectiva. <strong>9 temas</strong> que no existen
  en el C2 (donde solo hay 3 de personal).
</p>

<h3>Bloque V — Gestión Financiera (temas 34-39)</h3>
<p>
  Ley General Presupuestaria, presupuestos del Estado, ciclo presupuestario, gastos, contabilidad
  pública, control del gasto (IGAE, Tribunal de Cuentas). Bloque técnico que requiere memorización.
</p>

<h3>Bloque VI — Informática y Administración Electrónica (temas 40-45)</h3>
<p>
  Administración electrónica, firma electrónica, protección de datos (RGPD + LOPDGDD), esquemas
  nacionales (ENS, ENI), redes, bases de datos. Más profundo que la ofimática del C2.
</p>

<h2>¿Cuánto tiempo necesitas para prepararlo?</h2>
<p>
  El C1 tiene 45 temas frente a los 28 del C2, más el caso práctico. Una estimación realista:
</p>
<ul>
  <li><strong>Dedicación completa (5-6h/día):</strong> 6-7 meses</li>
  <li><strong>Compatibilizando trabajo (2-3h/día):</strong> 9-12 meses</li>
  <li><strong>Ritmo mínimo (1-2h/día):</strong> 12-18 meses</li>
</ul>
<p>
  Si ya te has preparado el C2, puedes restar 2-3 meses gracias al temario compartido.
</p>

<h2>¿C1 o C2? ¿Cuál elegir?</h2>
<p>
  Si no lo tienes claro, hemos hecho una
  <a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">comparativa completa entre C2 y C1</a>
  con plazas, sueldo, temario y examen. Y si te interesa la Constitución (que pesa mucho en ambos),
  lee nuestro artículo sobre
  <a href="/blog/constitucion-espanola-oposiciones-age-articulos-clave">los artículos de CE que más caen</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">C2 vs C1: comparativa completa</a> — plazas, sueldo, temario y examen</li>
  <li><a href="/blog/constitucion-espanola-oposiciones-age-articulos-clave">Constitución para oposiciones AGE</a> — los artículos que más caen</li>
  <li><a href="/blog/trebep-oposiciones-guia-estatuto-empleado-publico">TREBEP para oposiciones</a> — guía del Estatuto del Empleado Público</li>
  <li><a href="/blog/nota-corte-auxiliar-administrativo-estado">Nota de corte del C2</a> — si también preparas el Auxiliar Administrativo</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuántas plazas de Administrativo del Estado (C1) hay en 2026?', answer: 'Se han convocado más de 2.500 plazas de Administrativo del Estado (subgrupo C1) en la OEP 2025. El examen se celebra el 23 de mayo de 2026, el mismo día que el de Auxiliar (C2), por lo que solo puedes presentarte a uno.' },
      { question: '¿Cuántos temas tiene el temario de Administrativo del Estado C1?', answer: 'El temario consta de 45 temas repartidos en 4 bloques: Organización del Estado y UE, Administración General del Estado, Gestión de personal y empleo público, y Gestión financiera y contratación pública. Es un 60% más extenso que el de Auxiliar (28 temas).' },
      { question: '¿Qué nota se necesita para aprobar el Administrativo C1?', answer: 'La nota de corte del C1 suele situarse entre 55 y 65 puntos sobre 100, dependiendo de la convocatoria. El examen tiene dos partes: cuestionario tipo test (60 preguntas, penalización -1/3) y supuesto práctico. Se necesita superar ambas partes por separado.' },
      { question: '¿Cuál es el sueldo de un Administrativo del Estado C1?', answer: 'El sueldo oscila entre 1.500 y 2.100€ brutos mensuales (14 pagas), dependiendo del destino y complementos. Es entre un 15% y un 25% superior al de Auxiliar (C2). Los puestos en Madrid y con complemento específico alto pueden superar los 2.000€ netos.' },
      { question: '¿Se puede preparar el C1 en menos de un año?', answer: 'Sí, aunque requiere dedicación. Con estudio intensivo (3-4 horas/día), 6-8 meses son suficientes para los 45 temas. Con dedicación moderada (1-2 horas/día), cuenta con 10-12 meses. La clave es priorizar los bloques con más peso en el examen y hacer simulacros desde el tercer mes.' },
    ],
  },

  // ─── Post 22 ───────────────────────────────────────────────────────────────
  {
    slug: 'preparar-oposiciones-administrativo-estado-c1-por-libre',
    title: 'Cómo preparar oposiciones Administrativo del Estado (C1) por libre',
    description:
      'Plan de estudio completo para preparar el Administrativo del Estado (C1) por libre: orden de bloques, recursos, estrategia para el caso práctico y errores que evitar.',
    date: '2026-03-29',
    keywords: [
      'preparar oposiciones administrativo estado por libre',
      'estudiar C1 sin academia',
      'plan estudio administrativo estado',
      'oposiciones administrativo estado por libre',
    ],
    content: `
<p>
  Preparar las oposiciones de <strong>Administrativo del Estado (C1) por libre</strong> es
  perfectamente posible. Miles de opositores lo han hecho y han sacado su plaza sin academia.
  La clave es tener un <strong>plan estructurado</strong>, los recursos correctos y mucha
  disciplina con los tests de práctica.
</p>
<p>
  Si ya te has preparado el Auxiliar (C2) o has leído nuestra
  <a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">guía de preparar C2 por libre</a>,
  el método es similar pero con más material. Aquí adaptamos la estrategia a los 45 temas del C1.
</p>

<h2>45 temas vs 28: más material, mismo método</h2>
<p>
  El C1 tiene 45 temas frente a los 28 del C2, organizados en 6 bloques. Pero no todo es nuevo:
  si ya conoces la CE, LPAC y TREBEP del C2, llevas un <strong>60-70% del Bloque I y III ya
  estudiado</strong>. Los bloques realmente nuevos son el IV (Personal), V (Financiera) y VI
  (Informática avanzada).
</p>

<h2>Plan de estudio: 6-9 meses por libre</h2>
<p>
  Un plan realista para alguien que dedica 3-4 horas diarias:
</p>

<h3>Fase 1 (Meses 1-3): Derecho Administrativo + Constitución</h3>
<p>
  Empieza por el <strong>Bloque III (Derecho Administrativo General)</strong>: es el más extenso
  (10 temas) y el que más peso tiene en el examen, tanto en la parte teórica como en el caso
  práctico. LPAC, acto administrativo, procedimiento, recursos, contratación pública.
</p>
<p>
  En paralelo, repasa el <strong>Bloque I (Organización del Estado)</strong>: Constitución, Corona,
  Cortes, Gobierno. Si vienes del C2, será un repaso rápido.
</p>
<p>
  <strong>Desde el día 1:</strong> haz 10-20 preguntas tipo test diarias sobre lo estudiado.
  No esperes a "terminar el temario".
</p>

<h3>Fase 2 (Meses 3-5): Personal + Financiera</h3>
<p>
  <strong>Bloque IV (Gestión de RRHH):</strong> 9 temas sobre función pública, TREBEP ampliado,
  retribuciones, Seguridad Social, MUFACE. Es el bloque más "nuevo" si vienes del C2.
</p>
<p>
  <strong>Bloque V (Gestión Financiera):</strong> 6 temas de presupuestos, contabilidad pública
  y control del gasto. Requiere memorización de cifras y procedimientos, pero son preguntas
  directas (no interpretativas).
</p>

<h3>Fase 3 (Meses 5-7): Informática + Repaso general</h3>
<p>
  <strong>Bloque VI (Informática):</strong> 6 temas de administración electrónica, firma digital,
  LOPDGDD, ENS/ENI. Si dominas la ofimática del C2, gran parte ya la conoces.
</p>
<p>
  <strong>Bloque II (Organización AGE):</strong> 4 temas de LRJSP y organización ministerial.
  Déjalo para esta fase porque es legislación que cambia con frecuencia y conviene estudiarla
  cerca del examen.
</p>

<h3>Fase 4 (Meses 7-9): Simulacros + Caso práctico</h3>
<p>
  Dedica los últimos 2 meses a:
</p>
<ul>
  <li><strong>Simulacros completos cronometrados:</strong> 60 preguntas teóricas en 45 minutos. Entrena el ritmo del examen</li>
  <li><strong>Práctica del caso práctico:</strong> resuelve supuestos de convocatorias anteriores. El caso práctico no requiere conocimientos nuevos, sino saber aplicar la legislación a un expediente concreto</li>
  <li><strong>Repaso de temas débiles:</strong> los simulacros te dirán dónde fallas. Focaliza el repaso final en esos temas</li>
</ul>

<h2>Priorización de bloques (por peso en el examen)</h2>
<ol>
  <li><strong>Bloque III — Derecho Administrativo General:</strong> el más extenso y el que más aparece en el caso práctico. Prioridad máxima</li>
  <li><strong>Bloque I — Organización del Estado y UE:</strong> 8-12 preguntas siempre. Comparte mucho con C2</li>
  <li><strong>Bloque IV — Gestión de Personal:</strong> 9 temas exclusivos del C1. Alto peso</li>
  <li><strong>Bloque V — Gestión Financiera:</strong> preguntas directas de memorización. Puntos "fáciles" si estudias las tablas</li>
  <li><strong>Bloque VI — Informática:</strong> comparte base con C2. LOPDGDD y firma electrónica son los temas clave</li>
  <li><strong>Bloque II — Organización AGE:</strong> 4 temas, poco peso relativo. Estudiar al final</li>
</ol>

<h2>Recursos para preparar C1 por libre</h2>
<ul>
  <li><strong>Temario actualizado:</strong> Adams o MAD edición 2025-2026 (~50-70€). Imprescindible que incluya las últimas reformas legislativas</li>
  <li><strong>Legislación oficial:</strong> BOE para consultar artículos en su versión vigente (siempre gratis)</li>
  <li><strong>Exámenes anteriores INAP:</strong> disponibles en la web del INAP o en <a href="/examenes-oficiales">nuestros simulacros con preguntas oficiales</a></li>
  <li><strong>Tests tipo test:</strong> practica a diario con preguntas adaptadas al temario del C1</li>
  <li><strong>Comunidad de opositores:</strong> foros y grupos de Telegram para resolver dudas y mantener la motivación</li>
</ul>

<h2>El caso práctico: cómo prepararlo</h2>
<p>
  El caso práctico del C1 asusta, pero tiene truco: el 90% de las preguntas son legislación
  aplicada. Te dan un expediente (por ejemplo, una solicitud de subvención) y preguntan:
</p>
<ul>
  <li>¿Qué plazo tiene la Administración para resolver?</li>
  <li>¿Qué recurso puede interponer el interesado?</li>
  <li>¿Quién es el órgano competente?</li>
  <li>¿Qué artículo de la LPAC/LRJSP aplica?</li>
</ul>
<p>
  Si dominas el Bloque III (LPAC + LRJSP + contratación), el caso práctico es simplemente
  "encontrar el artículo correcto". Practica con supuestos de convocatorias anteriores para
  familiarizarte con el formato.
</p>

<h2>Errores comunes al preparar C1 por libre</h2>
<ul>
  <li><strong>Empezar por el Bloque I:</strong> la Constitución es "cómoda" pero tiene menos peso que el Derecho Administrativo. Empieza por el Bloque III</li>
  <li><strong>Ignorar el caso práctico hasta el final:</strong> empieza a practicar supuestos desde el mes 4, no esperes al último mes</li>
  <li><strong>No cronometrar:</strong> 90 minutos para 100 preguntas = menos de 55 segundos por pregunta. Sin práctica cronometrada, te faltará tiempo</li>
  <li><strong>Estudiar bloques aislados:</strong> muchas preguntas cruzan bloques (ej: TREBEP + LPAC en un caso de expediente disciplinario). Haz simulacros completos</li>
</ul>
<p>
  Si aún no tienes claro si ir a C1 o C2, lee nuestra
  <a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">comparativa C2 vs C1</a>.
  Y para el detalle del temario y las plazas, consulta nuestro artículo sobre
  <a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">el Administrativo del Estado 2026</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">Preparar C2 por libre</a> — la guía para Auxiliar Administrativo</li>
  <li><a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">Administrativo C1 2026</a> — 2.512 plazas, temario y nota de corte</li>
  <li><a href="/blog/constitucion-espanola-oposiciones-age-articulos-clave">Constitución para oposiciones AGE</a> — artículos que más caen</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Se puede aprobar el Administrativo C1 sin academia?', answer: 'Sí. Con un buen temario actualizado (50-70€), una plataforma de tests como OpoRuta (49,99€) y disciplina de estudio, muchos opositores aprueban el C1 por libre. El ahorro frente a una academia (150-300€/mes) es de más de 1.500€/año. La clave es mantener una rutina de estudio constante.' },
      { question: '¿Qué material necesito para preparar el C1 por libre?', answer: 'Lo esencial: temario actualizado de los 45 temas (editorial Adams, MAD o CEP), legislación vigente del BOE, y acceso a simulacros con supuesto práctico. Complementos recomendados: esquemas por tema, tests tipo INAP con penalización, y una herramienta de repetición espaciada para repasar.' },
      { question: '¿Cómo preparar el supuesto práctico del C1 por libre?', answer: 'El supuesto práctico requiere aplicar la legislación a casos reales. Practica con supuestos de convocatorias anteriores, identifica los procedimientos administrativos más habituales (LPAC, LCSP, LGP) y redacta resoluciones modelo. Es la parte donde más opositores fallan por falta de práctica.' },
      { question: '¿Cuántas horas de estudio diarias necesito para el C1?', answer: 'Se recomiendan 3-4 horas diarias con dedicación intensiva (6-8 meses) o 2 horas diarias con preparación más larga (10-12 meses). La constancia es más importante que las sesiones largas: 2 horas cada día son más efectivas que 8 horas un sábado.' },
    ],
  },

  // ─── Post 23 — C1: Supuesto Práctico ─────────────────────────────────────
  {
    slug: 'supuesto-practico-administrativo-estado-c1-estrategia',
    title: 'Supuesto práctico del Administrativo del Estado (C1): estrategia, ejemplos y consejos',
    description:
      'Guía completa sobre el supuesto práctico del examen C1: en qué consiste, cómo elegir entre los dos casos, qué legislación repasar y errores frecuentes. Con ejemplos reales.',
    date: '2026-03-15',
    keywords: [
      'supuesto práctico administrativo estado',
      'caso práctico C1 oposiciones',
      'segunda parte examen administrativo estado',
      'supuesto práctico INAP C1',
      'cómo preparar caso práctico oposiciones',
    ],
    content: `
<p>
  La <strong>segunda parte del examen de Administrativo del Estado (C1)</strong> es un supuesto
  práctico: te presentan dos casos y eliges uno. Cada caso tiene <strong>20 preguntas tipo test
  puntuables</strong> (más 5 de reserva) sobre un expediente administrativo real. Se califica de
  0 a 50 puntos y necesitas al menos 25 para aprobar.
</p>
<p>
  Muchos opositores le tienen miedo al caso práctico, pero en realidad es <strong>legislación aplicada</strong>.
  No te piden redactar nada: solo responder preguntas tipo test sobre un expediente concreto.
</p>

<h2>¿En qué consiste exactamente?</h2>
<p>
  Te dan un documento de 2-3 páginas describiendo un caso administrativo (por ejemplo, un procedimiento
  de contratación pública, un expediente disciplinario o una solicitud de subvención). Después te
  hacen 20 preguntas sobre ese caso:
</p>
<ul>
  <li><strong>¿Qué plazo tiene la Administración para resolver?</strong> → LPAC, art. 21</li>
  <li><strong>¿Qué recurso puede interponer el interesado?</strong> → LPAC, arts. 112-126</li>
  <li><strong>¿Quién es el órgano competente?</strong> → LRJSP, arts. 5-9</li>
  <li><strong>¿Qué documentación debe aportar?</strong> → LPAC, art. 66</li>
</ul>
<p>
  Las preguntas cubren los <strong>bloques II a V</strong> del temario: organización de oficinas,
  derecho administrativo, gestión de personal y gestión financiera.
</p>

<h2>Cómo elegir entre los dos supuestos</h2>
<p>
  Tienes unos minutos para leer ambos supuestos antes de decidir. Consejos:
</p>
<ul>
  <li><strong>Lee las preguntas primero, no el texto.</strong> Las preguntas te dicen qué legislación necesitas. Si reconoces más artículos en un supuesto que en otro, elige ese</li>
  <li><strong>Busca tu bloque fuerte.</strong> Si dominas contratación pública (Bloque III), elige el supuesto de contratación. Si tu fuerte es gestión de personal (Bloque IV), elige ese</li>
  <li><strong>No cambies a mitad.</strong> Una vez que empiezas un supuesto, no pierdas tiempo dudando. El cambio te costará 10-15 minutos irrecuperables</li>
</ul>

<h2>El peso del supuesto práctico: cada pregunta vale 2,50 puntos</h2>
<p>
  Este dato es crucial: cada pregunta del supuesto práctico vale <strong>2,50 puntos</strong>
  (50 puntos / 20 preguntas), frente a los 0,71 puntos de cada pregunta del cuestionario
  (50 / 70). Un solo error en el práctico penaliza <strong>0,83 puntos</strong>, más que un
  acierto completo en la primera parte.
</p>
<p>
  <strong>Regla de oro:</strong> en el supuesto práctico, si no estás seguro, déjala en blanco.
  La penalización es demasiado alta para arriesgar.
</p>

<h2>Legislación imprescindible para el caso práctico</h2>
<p>
  El 80% de los supuestos prácticos giran alrededor de estas normas:
</p>
<ul>
  <li><strong>Ley 39/2015 (LPAC):</strong> procedimiento común, plazos, notificaciones, recursos, silencio administrativo</li>
  <li><strong>Ley 40/2015 (LRJSP):</strong> órganos colegiados, competencias, delegación, avocación</li>
  <li><strong>Ley 9/2017 (LCSP):</strong> contratos del sector público, tipos, adjudicación, modificación</li>
  <li><strong>RDL 5/2015 (TREBEP):</strong> selección, situaciones administrativas, régimen disciplinario</li>
  <li><strong>Ley 47/2003 (LGP):</strong> presupuestos, créditos extraordinarios, gastos plurianuales</li>
</ul>

<h2>Errores frecuentes en el supuesto práctico</h2>
<ul>
  <li><strong>No leer el enunciado completo:</strong> el caso práctico tiene detalles trampa (fechas, plazos que ya han vencido, órganos que cambian de competencia). Lee todo antes de responder</li>
  <li><strong>Confundir plazos similares:</strong> 10 días hábiles vs 1 mes vs 3 meses. El INAP juega con esto</li>
  <li><strong>Aplicar legislación derogada:</strong> asegúrate de estudiar la versión vigente de cada ley. La LCSP de 2017 derogó la anterior</li>
  <li><strong>No cronometrar:</strong> tienes 100 minutos para las dos partes juntas. Si dedicas 70 minutos al cuestionario, solo te quedan 30 para el práctico</li>
</ul>

<h2>Ejemplos reales de supuestos prácticos INAP</h2>
<p>
  Para que veas cómo son de verdad, aquí tienes la estructura de supuestos que han caído en
  convocatorias recientes:
</p>
<table>
  <thead>
    <tr><th>Convocatoria</th><th>Supuesto A</th><th>Supuesto B</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>2024</td>
      <td>Expediente de contratación menor (LCSP): adjudicación directa, documentación, umbrales</td>
      <td>Gestión presupuestaria (LGP): fases ADOP, crédito extraordinario, anticipo de caja fija</td>
    </tr>
    <tr>
      <td>2022</td>
      <td>Procedimiento sancionador (LPAC + LRJSP): plazos, audiencia, resolución, recursos</td>
      <td>Selección de personal (TREBEP): bases, comisión, impugnación, bolsa de interinos</td>
    </tr>
    <tr>
      <td>2019</td>
      <td>Subvención pública (Ley 38/2003): solicitud, justificación, reintegro</td>
      <td>Recurso administrativo (LPAC): alzada vs reposición, plazos, silencio administrativo</td>
    </tr>
  </tbody>
</table>
<p>
  <strong>Patrón clave:</strong> el INAP alterna bloques. Si un caso es de Bloque III (derecho administrativo),
  el otro suele ser de Bloque IV o V. Dominar dos bloques diferentes te garantiza poder elegir siempre
  el que mejor se adapte a ti.
</p>

<h2>Plan de entrenamiento para el supuesto práctico</h2>
<p>
  Si te quedan <strong>menos de 3 meses</strong> (como ahora, con el examen el 23 de mayo de 2026),
  adapta el plan:
</p>
<ol>
  <li><strong>Semanas 1-3:</strong> repasa la legislación base enfocándote SOLO en los artículos de aplicación práctica (plazos, recursos, competencias, fases). Ignora la teoría general</li>
  <li><strong>Semanas 4-6:</strong> resuelve 2 supuestos por semana. Practica con <a href="/examenes-oficiales">los exámenes INAP reales de OpoRuta</a> (2019, 2022, 2024)</li>
  <li><strong>Semanas 7-8:</strong> 3-4 supuestos por semana, cronometrados a 45 minutos. Revisa cada error con el <a href="/blog/contratacion-publica-lcsp-administrativo-estado-c1">detalle de LCSP</a> o <a href="/blog/gestion-financiera-presupuestos-administrativo-estado-c1">gestión financiera</a></li>
</ol>
<p>
  Calcula tu nota con nuestra
  <a href="/herramientas/calculadora-nota-administrativo-estado">calculadora de nota del C1</a>
  y practica con los
  <a href="/examenes-oficiales">simulacros INAP oficiales</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/ultimos-60-dias-administrativo-estado-c1-plan-estudio">Últimos 60 días para el C1</a> — plan intensivo semana a semana</li>
  <li><a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">Preparar C1 por libre</a> — plan de estudio completo</li>
  <li><a href="/blog/nota-corte-administrativo-estado-c1-como-se-calcula">Nota de corte C1</a> — datos 2024 y previsión 2026</li>
  <li><a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">Administrativo C1 2026</a> — plazas, temario y nota de corte</li>
  <li><a href="/blog/errores-examen-administrativo-estado-c1">Errores comunes en el examen C1</a> — los 10 fallos que más opositores cometen</li>
</ul>
    `.trim(),
    dateModified: '2026-03-20',
    faqs: [
      { question: '¿En qué consiste el supuesto práctico del Administrativo C1?', answer: 'Es la segunda parte del examen: 20 preguntas tipo test sobre un caso práctico real (expediente administrativo, contratación, gestión presupuestaria). Eliges 1 de 2 supuestos. Cada pregunta vale 2,50 puntos (total 50 puntos). Necesitas al menos 25 para aprobar esta parte.' },
      { question: '¿Cuánto tiempo tengo para el supuesto práctico?', answer: 'El examen completo (cuestionario + supuesto) dura 100 minutos en total. La estrategia recomendada es dedicar 55 minutos al cuestionario (70 preguntas) y 45 minutos al supuesto práctico (20 preguntas). No se puede consultar legislación durante el examen.' },
      { question: '¿Qué leyes caen más en el supuesto práctico del C1?', answer: 'Las leyes más relevantes son: LPAC (Ley 39/2015) para tramitación de procedimientos — aparece en el 90% de los supuestos. LRJSP (Ley 40/2015) para organización administrativa. LCSP (Ley 9/2017) para contratación pública. LGP (Ley 47/2003) para gestión presupuestaria. TREBEP (RDL 5/2015) para gestión de personal.' },
      { question: '¿Se puede aprobar el supuesto práctico sin experiencia en Administración?', answer: 'Sí. El supuesto práctico no requiere experiencia real, sino conocimiento de la legislación aplicada. Los opositores que practican con exámenes INAP reales (2019, 2022, 2024) obtienen 5-10 puntos más que los que solo estudian teoría. En OpoRuta puedes practicar con simulacros oficiales con penalización real.' },
      { question: '¿Cómo elegir entre los dos supuestos del examen?', answer: 'Lee las preguntas antes que el enunciado: te dirán qué legislación necesitas. Si reconoces más artículos en un supuesto, elige ese. No cambies a mitad — el cambio te costará 10-15 minutos irrecuperables. Si dominas LCSP, elige contratación; si dominas TREBEP, elige personal.' },
      { question: '¿Cuántas preguntas en blanco puedo dejar en el supuesto práctico?', answer: 'No hay límite, pero recuerda que cada error penaliza 0,83 puntos (1/3 de 2,50). Estadísticamente, solo merece la pena responder si puedes descartar al menos 2 de las 4 opciones. Para obtener 25/50 (mínimo para aprobar), necesitas acertar al menos 10 preguntas limpias sin errores.' },
    ],
  },

  // ─── Post 24 — C1: Nota de corte ──────────────────────────────────────────
  {
    slug: 'nota-corte-administrativo-estado-c1-como-se-calcula',
    title: 'Nota de corte Administrativo del Estado (C1) 2024 — ¿Cuánto necesitas?',
    description:
      'Datos reales de corte 2024 para el C1. Cómo se calcula, por qué varía cada convocatoria, histórico de notas y cómo estimar si la superarías hoy con la penalización -1/3.',
    date: '2026-03-15',
    keywords: [
      'nota de corte administrativo estado C1',
      'nota corte C1 2024',
      'puntuación mínima administrativo estado',
      'nota corte oposiciones AGE C1',
      'aprobados administrativo estado',
    ],
    content: `
<p>
  La <strong>nota de corte del Administrativo del Estado (C1)</strong> no es un valor fijo: varía
  en cada convocatoria según el número de aprobados y las plazas ofertadas. En la convocatoria
  de 2024, la nota de corte general fue de <strong>47,33 puntos sobre 100</strong>.
</p>

<h2>¿Qué es la nota de corte?</h2>
<p>
  La nota de corte es la <strong>puntuación del último opositor que obtuvo plaza</strong>. No es
  un mínimo establecido de antemano: se conoce después del examen, cuando se ordenan todos los
  aprobados de mayor a menor nota y se traza la línea en la plaza número 2.512 (o el número de
  plazas ofertadas).
</p>
<p>
  Esto significa que la nota de corte depende de:
</p>
<ul>
  <li><strong>Número de plazas:</strong> más plazas = nota de corte más baja</li>
  <li><strong>Dificultad del examen:</strong> un examen más difícil baja la nota media y el corte</li>
  <li><strong>Nivel de los opositores:</strong> más gente preparada = corte más alto</li>
</ul>

<h2>Datos reales de la convocatoria 2024</h2>
<p>
  En 2024, el último aprobado con plaza obtuvo:
</p>
<ul>
  <li><strong>Primera parte (Cuestionario):</strong> 33 puntos sobre 50</li>
  <li><strong>Segunda parte (Supuesto Práctico):</strong> 14 puntos sobre 50</li>
  <li><strong>Total:</strong> 47,33 puntos sobre 100</li>
</ul>
<p>
  <strong>¿Por qué 14 en la segunda parte?</strong> El supuesto práctico del C1 es la parte
  más difícil del examen. Cada pregunta vale 2,50 puntos y la penalización por error es de 0,83.
  En 2024, pocos opositores obtuvieron puntuaciones altas en el caso práctico, lo que bajó
  significativamente el corte de esa parte.
</p>
<p>
  Recuerda que <strong>necesitas al menos 25 puntos en cada parte para aprobar</strong>. La nota
  de corte de 14 en la segunda parte refleja que el último aprobado con plaza sacó 14, no que
  puedas aprobar con 14. Para aprobar necesitas ≥25 en ambas partes; para obtener plaza,
  además necesitas superar la nota de corte total.
</p>

<h2>Cómo calcular si superas la nota de corte</h2>
<p>
  Usa nuestra <a href="/herramientas/calculadora-nota-administrativo-estado">calculadora de nota
  del C1 con penalización -1/3</a>. Introduce tus aciertos y errores de cada parte y verás
  al instante si superarías el corte de 2024.
</p>

<h2>¿Cómo será la nota de corte en 2026?</h2>
<p>
  La convocatoria 2025-2026 ofrece <strong>2.512 plazas</strong>, una cifra históricamente alta.
  Más plazas implica que la nota de corte podría ser similar o ligeramente inferior a 2024,
  siempre que el número de presentados no aumente proporcionalmente.
</p>
<p>
  La novedad de esta convocatoria es que el examen es un <strong>ejercicio único</strong> (antes
  eran dos pruebas en días distintos). Esto podría favorecer a los opositores bien preparados
  que rinden mejor en una sola sesión intensa.
</p>

<h2>Consejos para superar la nota de corte</h2>
<ul>
  <li><strong>No te conformes con el mínimo (25+25):</strong> necesitas al menos 47-50 puntos totales para tener opciones reales de plaza</li>
  <li><strong>Maximiza la primera parte:</strong> el cuestionario es más predecible. Apunta a 35-40 puntos para tener margen en el práctico</li>
  <li><strong>Practica el supuesto:</strong> es la parte más difícil y la que más te diferencia. Los opositores que practican casos reales obtienen 5-10 puntos más que los que solo estudian teoría</li>
  <li><strong>Gestiona el tiempo:</strong> 100 minutos para las dos partes. Planifica 55 minutos para el cuestionario (70 preguntas) y 45 para el práctico (20 preguntas)</li>
</ul>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Supuesto práctico del C1</a> — estrategia y ejemplos</li>
  <li><a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">Preparar C1 por libre</a> — plan de estudio completo</li>
  <li><a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora de nota C1</a> — calcula tu puntuación</li>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas C2 en 2026</a> — si también preparas el Auxiliar Administrativo</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Cuál es la nota de corte del Administrativo del Estado C1?', answer: 'La nota de corte varía por convocatoria, pero suele situarse entre 55 y 65 puntos sobre 100. La tendencia es ligeramente ascendente conforme aumentan los opositores preparados. Para 2026, con más de 2.500 plazas, se espera una nota de corte moderada en torno a 58-63 puntos.' },
      { question: '¿Cómo se calcula la nota del examen de Administrativo C1?', answer: 'El examen tiene dos partes: cuestionario tipo test (60 preguntas con penalización -1/3, vale 60% de la nota) y supuesto práctico (vale 40%). Se necesita superar el mínimo en cada parte por separado. La nota final es la suma ponderada de ambas partes.' },
      { question: '¿Cuánto puntúa el supuesto práctico respecto al test?', answer: 'El cuestionario tipo test suele pesar un 60% y el supuesto práctico un 40% de la nota total. Ambas partes son eliminatorias: no basta con compensar una parte mala con otra buena. Por eso es imprescindible preparar ambas específicamente.' },
      { question: '¿La nota de corte del C1 es más alta que la del C2?', answer: 'Generalmente no. Aunque el C1 es más difícil (45 temas + supuesto práctico), la ratio opositores/plaza es similar y la nota de corte suele ser parecida o incluso algo inferior a la del C2, porque el examen es objetivamente más exigente y hay más dispersión en las notas.' },
    ],
  },

  // ─── Post 25 — C1: Temario 45 temas priorización ─────────────────────────
  {
    slug: 'temario-administrativo-estado-c1-45-temas-como-priorizar',
    title: 'Temario Administrativo del Estado (C1): 45 temas en 6 bloques — cómo priorizar el estudio',
    description:
      'Desglose completo de los 45 temas del Administrativo del Estado C1 organizados por bloques, con estrategia de priorización según peso en el examen y dificultad relativa.',
    date: '2026-03-15',
    keywords: [
      'temario administrativo estado C1',
      '45 temas administrativo estado',
      'bloques temario C1 AGE',
      'temario oposiciones administrativo estado 2026',
      'priorizar estudio administrativo estado',
    ],
    content: `
<p>
  El temario del <strong>Administrativo del Estado (C1)</strong> tiene <strong>45 temas repartidos
  en 6 bloques</strong>. Es más extenso que el del Auxiliar (C2, 28 temas), pero con una buena
  estrategia de priorización puedes prepararlo en 6-9 meses.
</p>

<h2>Los 6 bloques del temario C1</h2>

<h3>Bloque I — Organización del Estado y Administración Pública (11 temas)</h3>
<p>
  Constitución Española, la Corona, Cortes Generales, Poder Judicial, Gobierno y Administración,
  Gobierno Abierto y Agenda 2030, Transparencia (Ley 19/2013), la AGE, organización territorial
  (CC.AA.), Administración Local y Unión Europea.
</p>
<p>
  <strong>Peso en el examen:</strong> 8-12 preguntas en la primera parte. Si vienes del C2,
  ya conoces la mayoría. Los temas nuevos son Gobierno Abierto (tema 6) y Transparencia (tema 7).
</p>

<h3>Bloque II — Organización de Oficinas Públicas (4 temas)</h3>
<p>
  Atención al ciudadano, documentación/registro/archivo, administración electrónica y protección
  de datos (LOPDGDD + RGPD).
</p>
<p>
  <strong>Peso:</strong> 3-5 preguntas en la primera parte + posible aparición en el supuesto
  práctico. Bloque corto pero denso en legislación (LOPDGDD, ENS, ENI).
</p>

<h3>Bloque III — Derecho Administrativo General (7 temas)</h3>
<p>
  Fuentes del derecho, acto administrativo, procedimiento administrativo común (LPAC),
  contratos del sector público (LCSP), actividad administrativa, responsabilidad patrimonial
  y políticas de igualdad.
</p>
<p>
  <strong>Peso:</strong> el bloque más importante. 10-15 preguntas en la primera parte Y es la
  base del supuesto práctico. <strong>Prioridad máxima</strong> en tu plan de estudio.
</p>

<h3>Bloque IV — Gestión de Personal (9 temas)</h3>
<p>
  Personal de las AA.PP. (TREBEP), selección y provisión, derechos y deberes, adquisición y
  pérdida de condición, carrera y promoción, incompatibilidades y disciplina, Seguridad Social
  (MUFACE), personal laboral (IV Convenio Único) y SS del personal laboral.
</p>
<p>
  <strong>Peso:</strong> 8-10 preguntas + aparece en casos prácticos (expedientes disciplinarios,
  procesos de selección). <strong>Bloque exclusivo del C1</strong> — no lo has visto si vienes del C2.
</p>

<h3>Bloque V — Gestión Financiera (6 temas)</h3>
<p>
  Presupuestos (concepto, principios, ciclo), estructura del PGE, ejecución del gasto, retribuciones
  e indemnizaciones, gastos por operaciones corrientes y gestión económica de contratos y subvenciones.
</p>
<p>
  <strong>Peso:</strong> 5-8 preguntas + aparece en casos prácticos. Preguntas directas de
  memorización (cifras, fases del gasto, documentos contables). Puntos "fáciles" si memorizas
  las tablas.
</p>

<h3>Bloque VI — Informática Básica y Ofimática (8 temas)</h3>
<p>
  Hardware y software, <strong>Windows 11</strong> (incluye <strong>Copilot</strong> como novedad 2026),
  Explorador de archivos, Word 365, Excel 365, Access 365, Outlook 365 e Internet.
</p>
<p>
  <strong>Peso:</strong> 30 preguntas en la primera parte (de 70 totales). Si dominas la ofimática
  del C2, llevas el 80% hecho. Las novedades son Windows 11 y Copilot.
</p>

<h2>Estrategia de priorización (de más a menos peso)</h2>
<ol>
  <li><strong>Bloque III (Derecho Administrativo):</strong> prioridad máxima. 7 temas, peso total ~35% (cuestionario + práctico)</li>
  <li><strong>Bloque VI (Informática):</strong> 30 de 70 preguntas del cuestionario = 43% de la primera parte. Puntos seguros si practicas</li>
  <li><strong>Bloque IV (Personal):</strong> 9 temas exclusivos del C1 + aparece en prácticos</li>
  <li><strong>Bloque I (Organización Estado):</strong> 11 temas, comparte mucho con C2, repasar rápido</li>
  <li><strong>Bloque V (Financiera):</strong> preguntas de memorización, estudiar al final para retener datos</li>
  <li><strong>Bloque II (Oficinas Públicas):</strong> 4 temas, menor peso relativo. Estudiar último</li>
</ol>

<h2>Novedades del temario 2025-2026</h2>
<ul>
  <li><strong>Windows 11:</strong> sustituye a Windows 10 en el Bloque VI</li>
  <li><strong>Copilot:</strong> se incluye como novedad en el tema de Windows 11</li>
  <li><strong>Microsoft 365 (versión escritorio):</strong> la referencia oficial para ofimática</li>
  <li><strong>Gobierno Abierto + Agenda 2030:</strong> tema relativamente nuevo en Bloque I</li>
</ul>

<h2>¿Cuántas horas necesitas?</h2>
<p>
  Estimación para 45 temas estudiando 3-4 horas diarias:
</p>
<ul>
  <li><strong>Primera vuelta:</strong> 4-5 meses (estudiar + hacer tests por tema)</li>
  <li><strong>Segunda vuelta:</strong> 2-3 meses (repasar + simulacros completos)</li>
  <li><strong>Fase final:</strong> 1-2 meses (supuestos prácticos + simulacros cronometrados)</li>
</ul>
<p>
  Practica desde el día 1 con tests tipo test. No esperes a terminar el temario para empezar
  a hacer preguntas.
</p>

<h2>Resumen: peso de cada bloque en el examen</h2>
<table>
  <thead>
    <tr><th>Bloque</th><th>Temas</th><th>Preguntas cuestionario</th><th>¿Aparece en supuesto?</th><th>Prioridad</th></tr>
  </thead>
  <tbody>
    <tr><td>III — Derecho Administrativo</td><td>7</td><td>10-15</td><td>Sí (base principal)</td><td>Máxima</td></tr>
    <tr><td>VI — Informática</td><td>8</td><td>30</td><td>No</td><td>Alta</td></tr>
    <tr><td>IV — Gestión de Personal</td><td>9</td><td>8-10</td><td>Sí (frecuente)</td><td>Alta</td></tr>
    <tr><td>I — Organización Estado</td><td>11</td><td>8-12</td><td>Raro</td><td>Media</td></tr>
    <tr><td>V — Gestión Financiera</td><td>6</td><td>5-8</td><td>Sí (frecuente)</td><td>Media-Alta</td></tr>
    <tr><td>II — Oficinas Públicas</td><td>4</td><td>3-5</td><td>Posible</td><td>Media-Baja</td></tr>
  </tbody>
</table>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/ultimos-60-dias-administrativo-estado-c1-plan-estudio">Últimos 60 días para el C1</a> — plan intensivo si empiezas en marzo</li>
  <li><a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">Preparar C1 por libre</a> — plan de estudio 6-9 meses</li>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Supuesto práctico del C1</a> — estrategia y ejemplos reales</li>
  <li><a href="/blog/contratacion-publica-lcsp-administrativo-estado-c1">LCSP para el C1</a> — artículos clave de contratación pública</li>
  <li><a href="/blog/gestion-financiera-presupuestos-administrativo-estado-c1">Gestión financiera C1</a> — Bloque V completo con fases ADOP</li>
  <li><a href="/blog/trebep-gestion-personal-administrativo-estado-c1">TREBEP y gestión de personal C1</a> — Bloque IV completo</li>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias C2 vs C1</a> — ¿cuál elegir?</li>
  <li><a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora de nota C1</a> — calcula tu puntuación</li>
</ul>
    `.trim(),
    dateModified: '2026-03-20',
    faqs: [
      { question: '¿Cómo priorizar los 45 temas del Administrativo C1?', answer: 'Divide los temas en 3 niveles: prioritarios (los que más caen en examen: Constitución, LPAC, LRJSP, TREBEP, LCSP y LGP), importantes (UE, organización territorial, empleo público) y complementarios (el resto). Dedica el 50% del tiempo a los prioritarios, 30% a los importantes y 20% a los complementarios.' },
      { question: '¿Cuáles son los bloques del temario de Administrativo C1?', answer: 'Los 4 bloques son: Bloque I - Organización del Estado y UE (12 temas), Bloque II - AGE y gestión de recursos humanos (11 temas), Bloque III - Gestión financiera (12 temas), y Bloque IV - Contratación pública y gestión de servicios (10 temas). Los Bloques III y IV son los más técnicos y específicos del C1.' },
      { question: '¿Puedo estudiar el temario del C1 con el mismo libro que el C2?', answer: 'No. Aunque comparten temas comunes (Constitución, LPAC, TREBEP), el C1 tiene 17 temas adicionales de gestión financiera, contratación pública y UE que no están en el temario de C2. Necesitas un temario específico de Administrativo del Estado (C1).' },
      { question: '¿Cuánto tiempo dedicar a cada tema del C1?', answer: 'Primera lectura: 2-3 horas por tema. Estudio profundo: 4-5 horas para temas prioritarios, 2-3 horas para complementarios. Repasos: 1 hora por tema. En total, con 45 temas, necesitas unas 200-250 horas de estudio efectivo para cubrir todo el temario una vez, más 100-150 horas de repasos y simulacros.' },
      { question: '¿Qué temas del C1 son exclusivos respecto al C2?', answer: 'Los temas exclusivos del C1 incluyen: Unión Europea (instituciones y derecho comunitario), contratación pública (LCSP), gestión financiera y presupuestaria (LGP), subvenciones, gestión de recursos humanos avanzada, y responsabilidad patrimonial de la Administración. Estos temas requieren un nivel de profundidad mayor.' },
    ],
  },

  // ─── Post 26 — C1: Contratación pública LCSP ─────────────────────────────
  {
    slug: 'contratacion-publica-lcsp-administrativo-estado-c1',
    title: 'Contratación pública (LCSP) para el Administrativo del Estado (C1): artículos clave',
    description:
      'Los artículos de la Ley 9/2017 de Contratos del Sector Público (LCSP) que más caen en el examen C1. Tipos de contratos, procedimientos de adjudicación y preguntas trampa frecuentes.',
    date: '2026-03-15',
    keywords: [
      'LCSP oposiciones administrativo estado',
      'contratos sector público examen C1',
      'ley contratos sector público oposiciones',
      'tipos contratos administrativos',
      'LCSP artículos clave examen',
    ],
    content: `
<p>
  La <strong>Ley 9/2017 de Contratos del Sector Público (LCSP)</strong> es una de las normas
  con más peso en el examen de Administrativo del Estado (C1). Aparece tanto en las preguntas
  del cuestionario (Bloque III, tema 19) como en los supuestos prácticos. Dominarla puede ser
  la diferencia entre obtener plaza o no.
</p>

<h2>¿Por qué la LCSP es tan importante en el C1?</h2>
<p>
  A diferencia del C2 (Auxiliar), donde la contratación se ve de forma superficial, el C1
  exige conocer <strong>procedimientos de adjudicación, plazos, garantías y tipos de contratos</strong>
  en detalle. Es una de las materias más preguntadas en el supuesto práctico.
</p>

<h2>Tipos de contratos del sector público</h2>
<p>
  La LCSP distingue los siguientes tipos de contratos administrativos (art. 12):
</p>
<ul>
  <li><strong>Contrato de obras:</strong> ejecución de obras de construcción, reforma o reparación</li>
  <li><strong>Contrato de suministro:</strong> adquisición, arrendamiento o mantenimiento de bienes muebles</li>
  <li><strong>Contrato de servicios:</strong> prestaciones de hacer que no sean obras ni suministros</li>
  <li><strong>Contrato de concesión de obras:</strong> el contratista asume el riesgo operacional</li>
  <li><strong>Contrato de concesión de servicios:</strong> gestión de un servicio público con riesgo</li>
</ul>
<p>
  <strong>Pregunta trampa frecuente:</strong> los contratos de concesión NO son contratos de servicios.
  La diferencia clave es la <strong>transferencia de riesgo operacional</strong> al contratista.
</p>

<h2>Procedimientos de adjudicación</h2>
<ul>
  <li><strong>Abierto (arts. 156-165):</strong> cualquier empresario puede presentar una oferta. El más habitual</li>
  <li><strong>Abierto simplificado (art. 159):</strong> para contratos menores. Plazos reducidos</li>
  <li><strong>Restringido (arts. 160-165):</strong> solo pueden presentar ofertas los invitados tras selección previa</li>
  <li><strong>Negociado sin publicidad (art. 168):</strong> supuestos tasados (urgencia extrema, razones técnicas). Las causas están en lista cerrada</li>
  <li><strong>Diálogo competitivo (arts. 172-176):</strong> para contratos especialmente complejos</li>
  <li><strong>Asociación para la innovación (arts. 177-182):</strong> novedad de la LCSP 2017</li>
</ul>

<h2>Artículos que más caen en el examen</h2>
<ul>
  <li><strong>Art. 12 — Tipos de contratos:</strong> la base. Siempre aparece</li>
  <li><strong>Art. 28 — Necesidad e idoneidad:</strong> justificación previa obligatoria</li>
  <li><strong>Art. 116 — Pliego de cláusulas administrativas:</strong> contenido mínimo</li>
  <li><strong>Art. 118 — Contratos menores:</strong> límites cuantitativos (40.000€ obras, 15.000€ servicios/suministros). Pregunta recurrente</li>
  <li><strong>Art. 131 — Procedimiento de adjudicación:</strong> cuándo usar cada tipo</li>
  <li><strong>Art. 202 — Condiciones especiales de ejecución:</strong> cláusulas sociales y medioambientales</li>
  <li><strong>Art. 211 — Resolución del contrato:</strong> causas y consecuencias</li>
</ul>

<h2>Preguntas trampa habituales</h2>
<ul>
  <li><strong>"¿Puede adjudicarse un contrato menor de 50.000€ de servicios?"</strong> — No. El límite es 15.000€ para servicios. 40.000€ es solo para obras</li>
  <li><strong>"¿El procedimiento negociado sin publicidad es libre?"</strong> — No. Solo procede en los supuestos del art. 168 (lista cerrada)</li>
  <li><strong>"¿Quién aprueba el expediente de contratación?"</strong> — El órgano de contratación, no el secretario general técnico</li>
</ul>

<h2>La LCSP en el supuesto práctico</h2>
<p>
  En los casos prácticos, la LCSP aparece típicamente así: te dan un expediente de contratación
  y te preguntan sobre plazos, procedimientos, requisitos de solvencia, criterios de adjudicación
  o causas de resolución. La clave es conocer los artículos de referencia para cada fase del proceso.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Supuesto práctico del C1</a> — estrategia completa</li>
  <li><a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">45 temas del C1</a> — cómo priorizar</li>
  <li><a href="/blog/articulos-lpac-que-mas-caen-examen-inap">LPAC: artículos que más caen</a> — la otra ley clave del Bloque III</li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué es la LCSP y por qué es importante para el C1?', answer: 'La LCSP (Ley 9/2017) es la Ley de Contratos del Sector Público. Regula cómo la Administración contrata obras, servicios y suministros. Es uno de los temas exclusivos del C1 y suele aportar 3-5 preguntas al cuestionario tipo test, además de aparecer frecuentemente en el supuesto práctico.' },
      { question: '¿Qué tipos de contratos regula la LCSP?', answer: 'Los contratos administrativos típicos son: contrato de obras, contrato de suministro, contrato de servicios y contrato de concesión (de obras y de servicios). La LCSP también regula los contratos mixtos y establece los umbrales para la regulación armonizada (contratos sujetos a directivas europeas).' },
      { question: '¿Cuáles son los procedimientos de adjudicación de la LCSP?', answer: 'Los principales procedimientos son: abierto (cualquier empresa puede licitar), restringido (preselección de candidatos), negociado (sin publicidad para contratos menores), diálogo competitivo (proyectos complejos) y asociación para la innovación. El procedimiento abierto es el más frecuente y el más preguntado.' },
      { question: '¿Qué es un contrato menor en la LCSP?', answer: 'Es un contrato de importe inferior a 40.000€ en obras o 15.000€ en servicios/suministros (IVA excluido). No requiere publicidad ni licitación formal. Es el procedimiento más ágil pero tiene limitaciones: no se pueden fraccionar contratos para eludir los umbrales. Es un concepto muy preguntado en el examen.' },
    ],
  },

  // ─── Post 27 — C1: Gestión financiera ─────────────────────────────────────
  {
    slug: 'gestion-financiera-presupuestos-administrativo-estado-c1',
    title: 'Gestión financiera y presupuestos para Administrativo del Estado (C1): guía del Bloque V',
    description:
      'Guía del Bloque V del temario C1: presupuestos del Estado, ejecución del gasto, retribuciones, nóminas y gestión económica. Los 6 temas más "técnicos" del C1 explicados.',
    date: '2026-03-15',
    keywords: [
      'gestión financiera administrativo estado',
      'presupuestos generales estado oposiciones',
      'bloque V administrativo estado C1',
      'fases ejecución gasto público',
      'retribuciones funcionarios oposiciones',
    ],
    content: `
<p>
  El <strong>Bloque V (Gestión Financiera)</strong> del temario C1 tiene 6 temas sobre presupuestos,
  gasto público y retribuciones. Es el bloque más "técnico" y el que más asusta a los opositores
  que vienen de letras. Pero tiene una ventaja: las preguntas son directas y de memorización.
  Si estudias las tablas y las fases, son puntos seguros.
</p>

<h2>Los 6 temas del Bloque V</h2>

<h3>Tema 32: El presupuesto — concepto y principios</h3>
<p>
  Los <strong>principios presupuestarios</strong> aparecen siempre: unidad, universalidad, anualidad,
  no afectación, especialidad (cualitativa, cuantitativa y temporal), estabilidad presupuestaria.
  Memoriza qué significa cada uno y cuándo se puede excepcionar.
</p>
<p>
  <strong>Pregunta frecuente:</strong> "¿Qué principio impide que los ingresos se asignen a gastos
  concretos?" → No afectación (art. 27 LGP).
</p>

<h3>Tema 33: Estructura del Presupuesto del Estado</h3>
<p>
  El PGE se estructura en:
</p>
<ul>
  <li><strong>Clasificación orgánica:</strong> quién gasta (ministerio, organismo)</li>
  <li><strong>Clasificación funcional/por programas:</strong> para qué se gasta</li>
  <li><strong>Clasificación económica:</strong> en qué se gasta (capítulos 1-9)</li>
</ul>
<p>
  Memoriza los <strong>9 capítulos de gasto</strong>: 1-Personal, 2-Bienes y servicios,
  3-Gastos financieros, 4-Transferencias corrientes, 5-(no existe en gasto), 6-Inversiones reales,
  7-Transferencias de capital, 8-Activos financieros, 9-Pasivos financieros.
</p>

<h3>Tema 34: Ejecución del presupuesto de gasto</h3>
<p>
  Las <strong>fases de ejecución del gasto</strong> son el tema estrella del Bloque V:
</p>
<ol>
  <li><strong>A — Autorización (Aprobación del gasto):</strong> reserva de crédito</li>
  <li><strong>D — Disposición (Compromiso):</strong> se contrae la obligación con un tercero</li>
  <li><strong>O — Obligación (Reconocimiento):</strong> se reconoce el derecho del acreedor</li>
  <li><strong>P — Pago (Propuesta de pago):</strong> se expide la orden de pago</li>
</ol>
<p>
  <strong>Regla mnemotécnica:</strong> A-D-O-P. Cada fase tiene su documento contable correspondiente
  (A, D, O, P o combinaciones como AD, ADO).
</p>

<h3>Tema 35: Retribuciones e indemnizaciones</h3>
<p>
  Las <strong>retribuciones de los funcionarios</strong> se dividen en:
</p>
<ul>
  <li><strong>Básicas:</strong> sueldo base (según grupo A1/A2/B/C1/C2) + trienios + pagas extraordinarias</li>
  <li><strong>Complementarias:</strong> complemento de destino (nivel), complemento específico (puesto), complemento de productividad, gratificaciones</li>
</ul>
<p>
  <strong>Pregunta trampa:</strong> "¿Los trienios son retribución básica o complementaria?" → Básica.
  "¿El complemento de productividad es fijo?" → No, es variable y no genera derechos adquiridos.
</p>

<h3>Tema 36: Gastos por operaciones corrientes</h3>
<p>
  Gestión de caja fija, anticipos de caja fija y pagos a justificar. Memoriza los <strong>límites
  cuantitativos</strong> y los plazos de justificación (3 meses para pagos a justificar).
</p>

<h3>Tema 37: Gestión económica de contratos y subvenciones</h3>
<p>
  Enlaza con la LCSP (Bloque III). Abarca garantías, revisión de precios, pagos a cuenta,
  penalidades y el régimen de subvenciones (Ley 38/2003 General de Subvenciones).
</p>

<h2>Estrategia de estudio para el Bloque V</h2>
<ul>
  <li><strong>Haz fichas de las fases ADOP:</strong> cada fase con su documento, órgano competente y efecto jurídico</li>
  <li><strong>Memoriza los 9 capítulos:</strong> aparecen en casi todos los exámenes</li>
  <li><strong>Practica con tests temáticos:</strong> las preguntas del Bloque V son muy repetitivas. Si haces 100 preguntas, habrás visto el 80% de lo que puede caer</li>
  <li><strong>Estudia este bloque al final:</strong> es pura memorización y se olvida rápido. Mejor estudiarlo 2-3 meses antes del examen</li>
</ul>

<h2>El Bloque V en el supuesto práctico</h2>
<p>
  En el caso práctico puede aparecer un expediente de gasto: te dan un contrato y preguntan
  en qué fase está, qué documento contable corresponde, quién es el órgano competente para
  autorizar, o si procede una modificación de crédito.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">45 temas del C1</a> — cómo priorizar por bloques</li>
  <li><a href="/blog/contratacion-publica-lcsp-administrativo-estado-c1">LCSP para el C1</a> — artículos clave de contratación</li>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Supuesto práctico</a> — estrategia y consejos</li>
  <li><a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora de nota C1</a></li>
</ul>
    `.trim(),
    dateModified: '2026-03-19',
    faqs: [
      { question: '¿Qué es la Ley General Presupuestaria (LGP)?', answer: 'La LGP (Ley 47/2003) regula el régimen presupuestario, de contabilidad y de control financiero del sector público estatal. Es la norma fundamental de gestión financiera de la AGE y uno de los temas más técnicos del temario de Administrativo C1.' },
      { question: '¿Qué fases tiene el ciclo presupuestario?', answer: 'El ciclo presupuestario tiene 4 fases: elaboración (el Gobierno prepara el proyecto), aprobación (las Cortes aprueban la Ley de PGE), ejecución (la AGE gestiona los créditos) y control (la IGAE y el Tribunal de Cuentas fiscalizan). Cada fase tiene artículos específicos de la LGP que se preguntan en el examen.' },
      { question: '¿Qué son los créditos presupuestarios y cómo se modifican?', answer: 'Los créditos presupuestarios son las autorizaciones de gasto incluidas en los PGE. Se pueden modificar mediante: transferencias de crédito (entre partidas), créditos extraordinarios y suplementos de crédito (aprobados por las Cortes), ampliaciones de crédito y generaciones de crédito. Las modificaciones presupuestarias son muy preguntadas.' },
      { question: '¿Cuántas preguntas de gestión financiera caen en el examen C1?', answer: 'El Bloque de gestión financiera (LGP, presupuestos, subvenciones) suele aportar entre 8 y 12 preguntas de las 60 del cuestionario tipo test. Es un bloque técnico que muchos opositores descuidan, lo cual es un error: dominarlo puede marcar la diferencia en la nota final.' },
    ],
  },
  // ─── Post 28: Comparativa plataformas IA oposiciones ──────────────────────
  {
    slug: 'mejores-plataformas-ia-oposiciones-2026-comparativa',
    title: 'Mejores Plataformas con IA para Oposiciones en 2026 — Comparativa Real con Precios',
    description:
      'Analizamos las principales plataformas con IA para preparar oposiciones: OpositaTest, OpoRuta, Toposiciones, Testualia, Opositor.ai y más. Funciones, precios reales y para quién es cada una.',
    date: '2026-03-17',
    dateModified: '2026-03-19',
    keywords: [
      'mejores plataformas IA oposiciones',
      'plataformas oposiciones inteligencia artificial',
      'estudiar oposiciones con IA',
      'alternativas OpositaTest',
      'apps oposiciones 2026',
      'preparar oposiciones con inteligencia artificial',
    ],
    faqs: [
      {
        question: '¿Merece la pena usar IA para estudiar oposiciones en 2026?',
        answer: 'Sí, pero con matices. La IA ahorra tiempo generando tests personalizados y explicaciones, pero no sustituye al estudio del temario. Lo más importante es que la plataforma verifique las citas legales: las IA generativas como ChatGPT pueden inventar artículos de ley. Plataformas especializadas como OpoRuta verifican cada cita contra la legislación oficial del BOE.',
      },
      {
        question: '¿Cuál es la mejor app gratuita para preparar oposiciones?',
        answer: 'OpositaTest ofrece un plan gratuito con tests limitados y es la opción más conocida. OpoRuta permite 5 tests gratuitos con verificación legal. Para complementar, los exámenes oficiales del INAP son gratuitos y están disponibles en formato interactivo en OpoRuta.',
      },
      {
        question: '¿Las plataformas de IA para oposiciones son fiables?',
        answer: 'Depende de la plataforma. Las que usan IA generativa sin verificación pueden generar preguntas con citas legales incorrectas (alucinaciones). Las que verifican las citas contra la legislación real (como OpoRuta con su verificación determinista del BOE) son fiables. Siempre contrasta cualquier cita legal con la fuente oficial.',
      },
      {
        question: '¿Puedo aprobar oposiciones estudiando solo con una app?',
        answer: 'No recomendamos depender únicamente de una app. La preparación ideal combina: un manual de temario actualizado (Adams, MAD, CEP), una plataforma de tests para practicar el formato del examen, y simulacros con condiciones reales (tiempo + penalización). Las apps son el mejor complemento, no un sustituto del estudio del temario.',
      },
      {
        question: '¿Qué diferencia hay entre pago único y suscripción mensual en plataformas de oposiciones?',
        answer: 'Con suscripción mensual (típico: 10-30€/mes) pagas mientras estudies — si tardas 12 meses son 120-360€. Con pago único (OpoRuta: 49,99€ por oposición) pagas una vez y tienes acceso permanente. La suscripción conviene si apruebas rápido; el pago único conviene si tu preparación es larga.',
      },
    ],
    content: `
<p>
  <strong>Las mejores plataformas con IA para preparar oposiciones en 2026 son OpositaTest (banco de 303.000 preguntas curadas), OpoRuta (verificación legal contra el BOE + análisis de exámenes INAP), Testualia (generación de tests desde tus documentos), Typed AI (flashcards + tests desde PDFs) y Opositor.ai (ecosistema completo con OCR y planificador).</strong>
  Cada una tiene un enfoque diferente y conviene según tu forma de estudiar.
</p>
<p>
  Según el Observatorio del Opositor 2026 de OpositaTest, <strong>el 27% de los opositores ya usa IA</strong>
  en su preparación, y el 87% de ellos usa ChatGPT. Pero hay diferencias enormes entre usar
  ChatGPT directamente y usar una plataforma especializada.
</p>
<p>
  Esta comparativa es honesta: incluimos nuestras fortalezas y nuestras debilidades.
  OpoRuta es una de las plataformas analizadas y creemos que la transparencia genera más confianza
  que el autobombo. Si otra plataforma es mejor que nosotros en algo, lo decimos.
</p>

<h2>Tabla comparativa: plataformas para oposiciones 2026</h2>

<table>
  <thead>
    <tr>
      <th>Plataforma</th>
      <th>Enfoque</th>
      <th>Verificación legal</th>
      <th>Precio</th>
      <th>Modelo</th>
      <th>Oposiciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>OpositaTest</strong></td>
      <td>Banco curado 303K preguntas</td>
      <td>No (curación manual)</td>
      <td>7,99-15,99€/mes</td>
      <td>Suscripción</td>
      <td>+100 oposiciones</td>
    </tr>
    <tr>
      <td><strong>OpoRuta</strong></td>
      <td>IA verificada + análisis INAP</td>
      <td>Sí (determinista vs BOE)</td>
      <td>49,99€ / 79,99€</td>
      <td>Pago único</td>
      <td>C1 + C2 AGE</td>
    </tr>
    <tr>
      <td><strong>Testualia</strong></td>
      <td>Tests IA desde tus documentos</td>
      <td>No</td>
      <td>~90€ / 60 días</td>
      <td>Pago por período</td>
      <td>Cualquiera (upload)</td>
    </tr>
    <tr>
      <td><strong>Typed AI</strong></td>
      <td>Tests + flashcards desde PDFs</td>
      <td>No</td>
      <td>8,99-11,99€/mes</td>
      <td>Suscripción</td>
      <td>Cualquiera (upload)</td>
    </tr>
    <tr>
      <td><strong>Opositor.ai</strong></td>
      <td>Ecosistema completo con OCR</td>
      <td>Parcial (monitoriza BOE)</td>
      <td>No publicado</td>
      <td>Suscripción</td>
      <td>Docentes principalmente</td>
    </tr>
    <tr>
      <td><strong>Elaia</strong></td>
      <td>Tests adaptativos desde PDFs</td>
      <td>No</td>
      <td>8,99-16,99€/mes</td>
      <td>Suscripción</td>
      <td>Cualquiera (upload)</td>
    </tr>
    <tr>
      <td><strong>Toposiciones</strong></td>
      <td>Generación IA móvil-first</td>
      <td>No</td>
      <td>No publicado</td>
      <td>Freemium</td>
      <td>Cualquiera (upload)</td>
    </tr>
    <tr>
      <td><strong>Liceia.ai</strong></td>
      <td>IA para academias (B2B)</td>
      <td>Sí (actualizaciones auto)</td>
      <td>Presupuesto</td>
      <td>B2B por academia</td>
      <td>Todas (vía academias)</td>
    </tr>
  </tbody>
</table>

<h2>OpositaTest — El líder del mercado con 303.000 preguntas</h2>
<p>
  OpositaTest es la plataforma de tests de oposiciones más consolidada de España.
  Fundada en 2015 en Galicia, cuenta con <strong>más de 1,6 millones de usuarios registrados</strong>
  y más de 70.000 suscriptores de pago. Su modelo es el banco de preguntas curado:
  303.000 preguntas redactadas por expertos (no generadas por IA), de las cuales
  el 80% son originales y el resto provienen de exámenes oficiales.
</p>
<h3>Para quién es ideal</h3>
<p>Opositores que preparan varias oposiciones simultáneamente y quieren volumen de práctica con una plataforma consolidada.</p>
<h3>Pros</h3>
<ul>
  <li><strong>Banco masivo:</strong> 303.000 preguntas curadas por expertos, actualizadas a diario</li>
  <li><strong>Cobertura amplísima:</strong> más de 100 oposiciones (AGE, Justicia, Hacienda, SAS, Policía, Correos...)</li>
  <li><strong>Comunidad activa:</strong> foros, encuestas de nota de corte, rankings entre usuarios</li>
  <li><strong>App móvil consolidada:</strong> iOS y Android con buenas valoraciones</li>
  <li><strong>Precio competitivo:</strong> desde 7,99€/mes en plan anual</li>
  <li><strong>Cursos integrales:</strong> temario + tests + tutor personal + clases en directo (295-945€/año)</li>
</ul>
<h3>Contras</h3>
<ul>
  <li><strong>Preguntas a veces más fáciles que el examen real:</strong> usuarios en foros reportan que la dificultad no siempre refleja el nivel del INAP</li>
  <li><strong>Suscripción mensual:</strong> en 12 meses de plan mensual pagas ~192€ (15,99€ × 12)</li>
  <li><strong>Sin verificación legal automática:</strong> las preguntas dependen de la calidad del redactor</li>
  <li><strong>Preguntas repetidas:</strong> a medida que avanzas, especialmente en oposiciones menos populares</li>
  <li><strong>No genera preguntas nuevas con IA:</strong> estás limitado al banco existente</li>
</ul>
<h3>Precio</h3>
<p><strong>Solo tests:</strong> 15,99€/mes | 11,99€/mes (semestral, 71,94€) | 7,99€/mes (anual, 95,88€). <strong>Cursos integrales:</strong> 295-945€/año. Plan gratuito con tests de muestra limitados.</p>

<h2>OpoRuta — IA con verificación legal del BOE</h2>
<p>
  OpoRuta genera tests con inteligencia artificial
  y verifica cada cita legal contra la legislación oficial del BOE de forma determinista.
  Si la IA cita el artículo 35 de la Ley 39/2015, el sistema comprueba que ese artículo
  existe y dice lo que la IA afirma, antes de mostrarte la pregunta.
  Es la única plataforma que combina generación IA + exámenes oficiales INAP + verificación legislativa.
</p>
<h3>Para quién es ideal</h3>
<p>Opositores de Auxiliar Administrativo (C2) o Administrativo del Estado (C1) que quieren
  certeza en las citas legales y análisis basado en exámenes reales del INAP.</p>
<h3>Pros</h3>
<ul>
  <li><strong>Verificación determinista del BOE:</strong> cada artículo citado se valida contra la legislación real — no hay alucinaciones</li>
  <li><strong>Radar del Tribunal:</strong> análisis de frecuencia de artículos en exámenes INAP 2018-2024, para saber qué estudiar primero</li>
  <li><strong>Pago único:</strong> 49,99€ por oposición o 79,99€ C1+C2 — sin suscripción mensual</li>
  <li><strong>Simulacros con exámenes reales:</strong> convocatorias 2018, 2019, 2022 y 2024 en formato interactivo con penalización y explicaciones</li>
  <li><strong>Análisis detallados con IA:</strong> explicaciones paso a paso de cada error, con método socrático</li>
  <li><strong>Flashcards con repetición espaciada, psicotécnicos y Caza-Trampas</strong></li>
</ul>
<h3>Contras</h3>
<ul>
  <li><strong>Solo cubre C1 y C2 AGE:</strong> si preparas Justicia, SAS, docentes u otras oposiciones, no es para ti</li>
  <li><strong>Plataforma nueva (2026):</strong> menos historial y comunidad que OpositaTest</li>
  <li><strong>Sin app móvil nativa:</strong> funciona en navegador móvil (responsive), pero no hay app en App Store / Play Store</li>
  <li><strong>Sin foro de comunidad:</strong> no tiene la interacción social de OpositaTest</li>
</ul>
<h3>Precio</h3>
<p>Gratis (5 tests) / Pack C1 o C2: <strong>49,99€ pago único</strong> / Pack Doble C1+C2: <strong>79,99€ pago único</strong>.</p>

<h2>Testualia — Genera tests desde tus documentos (Bilbao)</h2>
<p>
  Testualia es una startup bilbaína respaldada por Lanzadera (aceleradora de Juan Roig) y SPRI
  (Gobierno Vasco). Su modelo: subes tus propios documentos (PDF, Word, PowerPoint) y la IA
  genera tests ilimitados a partir de ellos. No tiene contenido propio — todo depende de lo que
  tú subas.
</p>
<h3>Para quién es ideal</h3>
<p>Opositores que ya tienen su temario en PDF y quieren generar preguntas ilimitadas sobre él.</p>
<h3>Pros</h3>
<ul>
  <li><strong>Generación ilimitada:</strong> sube un documento y genera todos los tests que quieras</li>
  <li><strong>Sirve para cualquier oposición:</strong> si tienes el temario en digital, funciona</li>
  <li><strong>Estadísticas por tema:</strong> muestra tu dominio por sección del documento</li>
  <li><strong>Respaldo institucional:</strong> Lanzadera + SPRI</li>
</ul>
<h3>Contras</h3>
<ul>
  <li><strong>Sin contenido propio:</strong> tú debes aportar todo el material</li>
  <li><strong>Sin verificación legal:</strong> no comprueba que las citas generadas sean correctas</li>
  <li><strong>Solo preguntas tipo test:</strong> no flashcards, no simulacros, no explicaciones detalladas</li>
  <li><strong>Calidad depende del documento:</strong> textos descriptivos funcionan bien, pero gráficos e imágenes no se procesan</li>
</ul>
<h3>Precio</h3>
<p>Demo gratuita (hasta 3 documentos). Planes de pago desde ~90€ por 60 días.</p>

<h2>Typed AI — Tests y flashcards desde PDFs</h2>
<p>
  Typed AI es una plataforma de IA que genera tests, flashcards, resúmenes y mapas mentales
  a partir de documentos que subas. No es específica de oposiciones, pero se ha posicionado
  fuertemente en ese nicho con marketing en TikTok. Interfaz sencilla y precio agresivo.
</p>
<h3>Para quién es ideal</h3>
<p>Opositores que quieren una herramienta todo-en-uno barata para generar material de estudio desde sus PDFs.</p>
<h3>Pros</h3>
<ul>
  <li><strong>Precio agresivo:</strong> desde 8,99€/mes, con descuentos del 20-40% en planes largos</li>
  <li><strong>Variedad de formatos:</strong> genera tests, flashcards, resúmenes y mapas mentales</li>
  <li><strong>Material editable:</strong> puedes modificar lo que genera la IA</li>
  <li><strong>Chat IA integrado:</strong> resuelve dudas sobre el contenido subido</li>
</ul>
<h3>Contras</h3>
<ul>
  <li><strong>Herramienta genérica:</strong> no tiene conocimiento específico de legislación ni de oposiciones</li>
  <li><strong>Sin verificación legal:</strong> puede generar citas incorrectas</li>
  <li><strong>Sin exámenes oficiales ni simulacros:</strong> no tiene datos del INAP</li>
  <li><strong>Sin seguimiento de progreso adaptativo:</strong> no detecta tus temas débiles</li>
</ul>
<h3>Precio</h3>
<p>Gratis (3 documentos, 40 páginas/doc). Basic: <strong>8,99€/mes</strong>. Premium: <strong>11,99€/mes</strong>.</p>

<h2>Opositor.ai — El más completo, pero enfocado en docentes</h2>
<p>
  Opositor.ai es la plataforma con más funcionalidades del mercado: OCR de escritura a mano,
  monitorización diaria del BOE, planificador de estudio adaptativo, corrector ortográfico
  jurídico, temporizador Pomodoro y simulador adaptativo. Sin embargo, su enfoque principal
  son las <strong>oposiciones de docentes</strong> (Infantil, Primaria, Pedagogía Terapéutica),
  no las de Administración General del Estado.
</p>
<h3>Para quién es ideal</h3>
<p>Opositores de docentes que buscan un ecosistema completo de preparación con IA.</p>
<h3>Pros</h3>
<ul>
  <li><strong>OCR de escritura a mano:</strong> escanea apuntes manuscritos y la IA los evalúa</li>
  <li><strong>Monitorización del BOE:</strong> escanea diariamente el BOE y boletines autonómicos para detectar cambios legislativos</li>
  <li><strong>Planificador adaptativo:</strong> reorganiza tu plan de estudio si te saltas un día</li>
  <li><strong>Corrector jurídico:</strong> detecta terminología desfasada o normativa derogada</li>
</ul>
<h3>Contras</h3>
<ul>
  <li><strong>Enfocado en docentes:</strong> la profundidad para AGE (C1/C2) no está clara</li>
  <li><strong>Precios opacos:</strong> no publican tarifas (mala señal para la confianza)</li>
  <li><strong>Sin exámenes oficiales INAP:</strong> no tiene base de datos de exámenes reales de AGE</li>
  <li><strong>Muy nuevo:</strong> sin reseñas independientes verificables</li>
</ul>
<h3>Precio</h3>
<p>No publicado. Planes por suscripción. Programa de referidos (2 amigos = 30 días gratis).</p>

<h2>Elaia — Tests adaptativos con repetición espaciada</h2>
<p>
  Elaia genera tests y flashcards desde documentos PDF con un sistema de repetición espaciada
  integrado. Procesa hasta 800 páginas en 10-20 minutos. Compatible con cualquier oposición.
</p>
<h3>Precio</h3>
<p>Gratis (100 páginas para siempre). Academia: <strong>8,99€/mes</strong> (1.000 páginas). Liceo: <strong>16,99€/mes</strong> (2.000 páginas).</p>

<h2>Liceia.ai — IA para academias (B2B)</h2>
<p>
  Liceia.ai no vende a opositores individuales. Vende infraestructura de IA a academias de
  oposiciones: tutores IA 24/7, examinadores automáticos, actualización legislativa automática
  y planificación inteligente. Si tu academia usa Liceia, tú accedes a sus funciones IA
  como parte de la matrícula. No puedes contratar Liceia directamente.
</p>

<h2>El problema de la alucinación en IA jurídica</h2>
<p>
  Todas las IAs generativas (ChatGPT, Gemini, Claude) pueden inventar citas legales.
  Esto se llama <strong>alucinación</strong> y es especialmente peligroso en oposiciones,
  donde una cita incorrecta te lleva a memorizar algo falso.
</p>
<p>
  <strong>Ejemplo real:</strong> si le pides a ChatGPT "genera 10 preguntas sobre la LPAC", puede
  inventar un artículo 47.3 que no existe, o atribuir contenido del artículo 35 al artículo 53.
  Tú memorizas eso, y en el examen fallas una pregunta que creías saber.
</p>
<p>
  La diferencia entre plataformas es cómo manejan este riesgo:
</p>
<ul>
  <li><strong>OpositaTest:</strong> evita el problema usando preguntas curadas manualmente (no genera con IA)</li>
  <li><strong>OpoRuta:</strong> genera con IA pero verifica cada cita contra el BOE antes de mostrarte la pregunta</li>
  <li><strong>Testualia / Typed AI / Elaia / Toposiciones:</strong> generan con IA desde tus documentos, sin verificación legal contra la fuente oficial</li>
  <li><strong>Opositor.ai:</strong> monitoriza el BOE para actualizaciones, pero no documenta verificación de citas en preguntas</li>
</ul>
<p>
  <strong>Consejo:</strong> independientemente de la plataforma que uses, siempre que una pregunta cite
  un artículo de ley, compruébalo tú también en la fuente oficial (BOE.es). Es un hábito que te
  protege y te ayuda a memorizar mejor.
</p>

<h2>¿Cuál elegir según tu situación?</h2>
<ul>
  <li><strong>Si preparas Auxiliar (C2) o Administrativo (C1) AGE:</strong> OpoRuta — verificación legal + Radar del Tribunal + exámenes INAP reales + pago único</li>
  <li><strong>Si preparas varias oposiciones y quieres volumen:</strong> OpositaTest — 303.000 preguntas, +100 oposiciones, desde 7,99€/mes</li>
  <li><strong>Si quieres generar tests de tu propio temario:</strong> Testualia o Typed AI — subes tu PDF y listo</li>
  <li><strong>Si preparas oposiciones de docentes:</strong> Opositor.ai — el ecosistema más completo para ese nicho</li>
  <li><strong>Si tu academia usa IA:</strong> pregunta si trabajan con Liceia.ai — puede que ya tengas funciones IA incluidas</li>
  <li><strong>Si buscas lo más barato:</strong> Typed AI (8,99€/mes) o el plan gratuito de OpoRuta / OpositaTest</li>
</ul>

<h2>¿Se pueden usar varias plataformas a la vez?</h2>
<p>
  <strong>Sí, y es recomendable.</strong> Ninguna plataforma es perfecta ni completa.
  Una combinación habitual entre opositores de Auxiliar/Administrativo:
</p>
<ul>
  <li><strong>OpoRuta</strong> como plataforma principal (verificación legal + simulacros INAP + Radar del Tribunal)</li>
  <li><strong>OpositaTest</strong> como complemento (volumen de tests + comunidad)</li>
  <li><strong>Manual de academia</strong> (Adams, MAD, CEP) como temario de lectura</li>
</ul>
<p>
  El coste total de esta combinación: manual (~40€) + OpoRuta (49,99€ pago único) +
  OpositaTest (7,99€/mes anual) = <strong>~186€ el primer año</strong>. Un mes de academia presencial
  cuesta entre 100€ y 250€.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026. Precios verificados en las webs oficiales de cada plataforma (marzo 2026). Dato "27% de opositores usan IA": Observatorio del Opositor 2026, OpositaTest. Si detectas algún error, escríbenos a hola@oporuta.es.</em></p>
    `.trim(),
  },
  // ─── Post 29: OpoRuta vs OpositaTest ──────────────────────────────────────
  {
    slug: 'oporuta-vs-opositatest-auxiliar-administrativo-2026',
    title: 'OpositaTest vs OpoRuta (2026): precios, funciones y verificación legal',
    description:
      '¿Buscas OpositaTest o una alternativa? Comparamos precio (12€/mes vs 49,99€ pago único), banco de preguntas, verificación de citas legales contra el BOE y análisis con IA. Tabla punto por punto.',
    date: '2026-03-17',
    dateModified: '2026-03-19',
    keywords: [
      'OpositaTest vs OpoRuta',
      'OpositaTest opiniones',
      'OpositaTest alternativas',
      'OpositaTest precio',
      'comparativa OpositaTest 2026',
      'OpositaTest auxiliar administrativo',
      'mejor plataforma oposiciones auxiliar administrativo',
    ],
    faqs: [
      {
        question: '¿Es mejor OpoRuta o OpositaTest para Auxiliar Administrativo?',
        answer: 'Depende de lo que busques. OpoRuta es mejor si quieres verificación legal de cada pregunta contra el BOE, análisis de exámenes INAP y pago único (49,99€). OpositaTest es mejor si quieres un banco masivo de preguntas, comunidad activa y cobertura de múltiples oposiciones. Son complementarias.',
      },
      {
        question: '¿OpositaTest tiene inteligencia artificial?',
        answer: 'OpositaTest usa un banco de 303.000 preguntas curadas manualmente por expertos, no IA generativa. Tiene un algoritmo adaptativo que detecta tus temas débiles, pero no genera preguntas nuevas con IA. OpoRuta genera preguntas con IA y las verifica contra la legislación del BOE.',
      },
      {
        question: '¿Cuánto cuesta OpositaTest al mes?',
        answer: 'OpositaTest cuesta 15,99€/mes (mensual), 11,99€/mes (semestral, 71,94€) o 7,99€/mes (anual, 95,88€). También ofrece cursos integrales con temario y tutor desde 295€/año. OpoRuta cobra un pago único de 49,99€ por oposición (C1 o C2) o 79,99€ por ambas.',
      },
      {
        question: '¿Se pueden usar OpoRuta y OpositaTest a la vez?',
        answer: 'Sí, y muchos opositores lo hacen. Son complementarias: OpoRuta para verificación legal y análisis de exámenes INAP, OpositaTest para volumen de práctica y comunidad. El coste combinado (49,99€ + ~15€/mes) sigue siendo menor que una academia presencial.',
      },
    ],
    content: `
<p>
  <strong>OpoRuta y OpositaTest son las dos principales opciones para preparar oposiciones de Auxiliar Administrativo (C2) y Administrativo del Estado (C1) en 2026, pero tienen enfoques muy diferentes:</strong>
  OpositaTest es un banco de 303.000 preguntas curadas por expertos, fundado en 2015 en Galicia, con más de 1,6 millones de usuarios;
  OpoRuta genera preguntas con IA y las verifica contra la legislación oficial del BOE.
</p>
<p>
  Esta comparativa analiza las diferencias reales, sin marketing. OpoRuta es nuestra plataforma,
  así que seremos especialmente críticos con nosotros mismos para que te fíes de lo que decimos
  sobre los demás.
</p>

<h2>Resumen rápido: OpoRuta vs OpositaTest</h2>

<table>
  <thead>
    <tr>
      <th>Característica</th>
      <th>OpoRuta</th>
      <th>OpositaTest</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Enfoque</strong></td>
      <td>IA verificada + análisis INAP</td>
      <td>Banco de preguntas curado</td>
    </tr>
    <tr>
      <td><strong>Verificación legal BOE</strong></td>
      <td>Sí (determinista, automática)</td>
      <td>No (curación manual)</td>
    </tr>
    <tr>
      <td><strong>Nº de preguntas</strong></td>
      <td>Generación ilimitada con IA</td>
      <td>303.000 preguntas curadas</td>
    </tr>
    <tr>
      <td><strong>Análisis exámenes INAP</strong></td>
      <td>Sí (Radar del Tribunal 2018-2024)</td>
      <td>Encuestas de nota de corte</td>
    </tr>
    <tr>
      <td><strong>Oposiciones cubiertas</strong></td>
      <td>C1 + C2 AGE</td>
      <td>+100 oposiciones</td>
    </tr>
    <tr>
      <td><strong>Precio</strong></td>
      <td>49,99€ pago único (79,99€ C1+C2)</td>
      <td>7,99-15,99€/mes suscripción</td>
    </tr>
    <tr>
      <td><strong>Coste en 12 meses</strong></td>
      <td>49,99€</td>
      <td>95,88€ (anual) — 191,88€ (mensual)</td>
    </tr>
    <tr>
      <td><strong>Simulacros oficiales</strong></td>
      <td>2018, 2019, 2022, 2024 interactivos</td>
      <td>Exámenes recopilados</td>
    </tr>
    <tr>
      <td><strong>App móvil nativa</strong></td>
      <td>No (web responsive)</td>
      <td>Sí (iOS + Android)</td>
    </tr>
    <tr>
      <td><strong>Comunidad / foro</strong></td>
      <td>No</td>
      <td>Sí (activa)</td>
    </tr>
    <tr>
      <td><strong>Años en mercado</strong></td>
      <td>2026 (nuevo)</td>
      <td>Desde 2015 (11 años)</td>
    </tr>
    <tr>
      <td><strong>Plan gratuito</strong></td>
      <td>5 tests con verificación</td>
      <td>Tests limitados</td>
    </tr>
  </tbody>
</table>

<h2>Dónde gana OpositaTest</h2>

<h3>1. Banco de 303.000 preguntas curadas por expertos</h3>
<p>
  OpositaTest tiene 303.000 preguntas (80% originales, 20% de exámenes oficiales),
  redactadas por profesionales y actualizadas a diario cuando cambia la legislación.
  Para el Auxiliar Administrativo tienen miles de preguntas organizadas por tema.
  Este volumen puro es difícil de igualar: puedes hacer cientos de tests
  sin repetir preguntas. Trustpilot: 4,2/5.
</p>

<h3>2. Cobertura de +100 oposiciones</h3>
<p>
  Si además del Auxiliar/Administrativo preparas Justicia, SAS, Bomberos o cualquier
  otra oposición, OpositaTest tiene contenido para casi todas. OpoRuta solo cubre
  C1 y C2 de la AGE.
</p>

<h3>3. Comunidad activa</h3>
<p>
  Los foros de OpositaTest, las encuestas de nota de corte y los rankings entre usuarios
  crean una sensación de comunidad que motiva. Cuando estás estudiando solo,
  saber que otros están en lo mismo ayuda.
</p>

<h3>4. App móvil nativa</h3>
<p>
  Tienen app para iOS y Android bien valorada. OpoRuta funciona en el navegador
  del móvil (es responsive) pero no tiene app nativa.
</p>

<h2>Dónde gana OpoRuta</h2>

<h3>1. Verificación legal contra el BOE</h3>
<p>
  Este es el diferenciador más importante. Cada pregunta generada por la IA de OpoRuta
  pasa por un proceso de verificación determinista: si la pregunta cita el artículo 35
  de la Ley 39/2015, el sistema comprueba que ese artículo existe en la base de datos
  legislativa y que el contenido es correcto.
</p>
<p>
  <strong>¿Por qué importa?</strong> Porque si estudias con preguntas que citan artículos incorrectos,
  memorizas información falsa. En el examen, esa pregunta que creías saber la fallas.
  Es peor que no haberla estudiado.
</p>

<h3>2. Radar del Tribunal — Análisis de exámenes INAP</h3>
<p>
  OpoRuta analiza todos los exámenes oficiales del INAP (2018, 2019, 2022, 2024) y calcula
  qué artículos, leyes y temas aparecen con más frecuencia. Esto te dice dónde poner
  el foco de estudio: no todos los artículos de la LPAC se preguntan igual.
</p>

<h3>3. Pago único vs suscripción</h3>
<p>
  OpoRuta cuesta <strong>49,99€ una vez</strong> (o 79,99€ por C1+C2). No hay suscripción mensual.
  Si tu preparación dura 12 meses, con OpositaTest en plan mensual habrás pagado 191,88€
  (15,99€ × 12). Incluso con el plan anual más barato (95,88€), OpoRuta sale a la mitad.
  Con OpoRuta, siempre 49,99€.
</p>

<h3>4. Simulacros oficiales interactivos</h3>
<p>
  Los exámenes reales de 2018, 2019, 2022 y 2024 están disponibles en formato interactivo,
  con cronómetro, penalización -1/3 y explicaciones de cada respuesta.
</p>

<h3>5. Análisis detallados con método socrático</h3>
<p>
  Cuando fallas una pregunta, la IA no te da la respuesta directamente: te guía
  con preguntas para que llegues tú al razonamiento correcto. Esto genera aprendizaje
  real, no memorización mecánica.
</p>

<h2>¿Para quién es cada una?</h2>

<h3>Elige OpositaTest si:</h3>
<ul>
  <li>Preparas varias oposiciones a la vez (no solo C1/C2 AGE)</li>
  <li>Quieres volumen puro de preguntas</li>
  <li>Valoras una comunidad activa de opositores</li>
  <li>Necesitas app móvil nativa</li>
</ul>

<h3>Elige OpoRuta si:</h3>
<ul>
  <li>Preparas Auxiliar Administrativo (C2) o Administrativo del Estado (C1)</li>
  <li>Quieres certeza en las citas legales (verificación BOE)</li>
  <li>Quieres saber qué artículos caen más en el INAP (Radar del Tribunal)</li>
  <li>Prefieres pago único sin suscripción mensual</li>
  <li>Quieres practicar con exámenes reales en formato interactivo</li>
</ul>

<h2>¿Se pueden usar las dos? Sí</h2>
<p>
  OpoRuta y OpositaTest no son excluyentes. De hecho, son complementarias:
</p>
<ul>
  <li><strong>OpoRuta</strong> para verificación legal, Radar del Tribunal y simulacros INAP</li>
  <li><strong>OpositaTest</strong> para volumen de práctica y comunidad</li>
</ul>
<p>
  El coste combinado (49,99€ + 7,99€/mes plan anual = ~146€/año) sigue siendo significativamente
  menor que una academia presencial (100-250€/mes = 1.200-3.000€/año).
</p>

<h2>Nuestra recomendación honesta</h2>
<p>
  Si solo puedes elegir una y preparas C1 o C2 de la AGE, te recomendamos OpoRuta —
  pero somos parte interesada, así que prueba las dos. Ambas tienen plan gratuito.
  Haz 5 tests en cada una y decide cuál se adapta mejor a tu forma de estudiar.
</p>
<p>
  Si preparas otra oposición diferente a C1/C2 AGE, OpoRuta no es para ti.
  En ese caso, OpositaTest o Testualia son mejores opciones.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
  },
  // ─── Post 30: Recursos gratuitos oposiciones ──────────────────────────────
  {
    slug: 'recursos-gratuitos-auxiliar-administrativo-estado-2026',
    title: 'Recursos Gratuitos Auxiliar Administrativo del Estado 2026 — Tests, Temarios y Herramientas',
    description:
      'Recopilación completa de recursos gratuitos para preparar el Auxiliar Administrativo del Estado en 2026: exámenes oficiales, tests online, temario BOE, calculadoras de nota y comunidades de opositores.',
    date: '2026-03-17',
    dateModified: '2026-03-19',
    keywords: [
      'recursos gratuitos oposiciones auxiliar administrativo',
      'test gratis auxiliar administrativo estado',
      'material gratis oposiciones auxiliar',
      'exámenes anteriores auxiliar administrativo INAP',
      'temario gratis auxiliar administrativo',
    ],
    faqs: [
      {
        question: '¿Dónde puedo encontrar exámenes anteriores del Auxiliar Administrativo del Estado?',
        answer: 'Los exámenes oficiales del INAP de convocatorias anteriores son dominio público. OpoRuta los ofrece en formato interactivo (2018, 2019, 2022, 2024) con explicaciones de cada respuesta, cronómetro y penalización -1/3. También puedes descargar los PDFs originales desde la web del INAP.',
      },
      {
        question: '¿Hay tests gratis de Auxiliar Administrativo del Estado online?',
        answer: 'Sí. OpoRuta ofrece 5 tests gratuitos con verificación legal del BOE. OpositaTest tiene un plan gratuito con tests limitados. Además, los exámenes oficiales del INAP están disponibles gratuitamente como simulacros interactivos en OpoRuta.',
      },
      {
        question: '¿Es posible preparar el Auxiliar Administrativo sin pagar nada?',
        answer: 'Es posible pero difícil. El temario oficial (BOE) es gratuito, los exámenes del INAP son públicos, y hay tests gratuitos en OpoRuta y OpositaTest. Lo que falta sin pagar: un manual estructurado del temario (30-50€) y tests ilimitados. La inversión mínima recomendada: manual + plataforma de tests = ~90€.',
      },
    ],
    content: `
<p>
  <strong>Estos son los mejores recursos gratuitos para preparar el Auxiliar Administrativo del Estado en 2026:</strong>
  exámenes oficiales del INAP, tests online gratuitos, temario en el BOE, calculadoras de nota con penalización
  y comunidades de opositores. Todo lo que puedes conseguir sin pagar un euro.
</p>

<h2>1. Exámenes oficiales del INAP (gratis)</h2>
<p>
  Los exámenes de convocatorias anteriores son el recurso más valioso que existe y son <strong>completamente gratuitos</strong>.
  Te muestran exactamente qué pregunta el tribunal, cómo formula las preguntas y qué artículos prioriza.
</p>
<p>Convocatorias disponibles:</p>
<ul>
  <li><strong>2024:</strong> la más reciente — 100 preguntas puntuables + 10 reserva</li>
  <li><strong>2022:</strong> primera convocatoria post-COVID con nuevo formato</li>
  <li><strong>2019:</strong> última convocatoria con el formato anterior</li>
  <li><strong>2018:</strong> incluye psicotécnicos</li>
</ul>
<p>
  En <a href="/examenes-oficiales">OpoRuta los tienes en formato interactivo</a> con cronómetro,
  penalización -1/3 y explicación de cada respuesta. También puedes descargar los PDFs
  originales desde la web del INAP (inap.es).
</p>

<h2>2. Tests tipo test online (gratuitos)</h2>
<p>Varias plataformas ofrecen tests gratuitos, con diferentes niveles de calidad:</p>

<table>
  <thead>
    <tr>
      <th>Plataforma</th>
      <th>Tests gratis</th>
      <th>Verificación legal</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>OpoRuta</strong></td>
      <td>5 tests</td>
      <td>Sí (BOE)</td>
      <td>Temas 1, 11 y 17 en plan gratuito</td>
    </tr>
    <tr>
      <td><strong>OpositaTest</strong></td>
      <td>Limitados</td>
      <td>No (curadas)</td>
      <td>Plan free con restricciones</td>
    </tr>
    <tr>
      <td><strong>Daypo</strong></td>
      <td>Ilimitados</td>
      <td>No</td>
      <td>Tests de la comunidad, calidad variable</td>
    </tr>
    <tr>
      <td><strong>Tests-gratis.com</strong></td>
      <td>Varios</td>
      <td>No</td>
      <td>Cuestionarios básicos sin explicaciones</td>
    </tr>
  </tbody>
</table>

<p>
  <strong>Advertencia sobre tests gratuitos sin verificar:</strong> plataformas como Daypo tienen tests
  creados por usuarios anónimos. Las preguntas pueden citar legislación derogada o artículos incorrectos.
  Un test con citas erróneas es peor que no hacer tests, porque memorizas información falsa.
</p>

<h2>3. Temario oficial en el BOE (gratis)</h2>
<p>
  El programa oficial del examen se publica en el BOE con cada convocatoria. Las leyes que componen
  el temario son todas públicas:
</p>
<ul>
  <li><strong>Constitución Española 1978:</strong> <a href="https://www.boe.es/eli/es/c/1978/12/27/(1)/con" rel="nofollow noopener" target="_blank">BOE</a></li>
  <li><strong>Ley 39/2015 (LPAC):</strong> <a href="https://www.boe.es/eli/es/l/2015/10/01/39/con" rel="nofollow noopener" target="_blank">BOE</a></li>
  <li><strong>Ley 40/2015 (LRJSP):</strong> <a href="https://www.boe.es/eli/es/l/2015/10/01/40/con" rel="nofollow noopener" target="_blank">BOE</a></li>
  <li><strong>RDL 5/2015 (TREBEP):</strong> <a href="https://www.boe.es/eli/es/rdlg/2015/10/30/5/con" rel="nofollow noopener" target="_blank">BOE</a></li>
  <li><strong>LO 3/2018 (LOPDGDD):</strong> <a href="https://www.boe.es/eli/es/lo/2018/12/05/3/con" rel="nofollow noopener" target="_blank">BOE</a></li>
</ul>
<p>
  El problema: las leyes en el BOE no están organizadas como un temario de estudio.
  Por eso la mayoría de opositores compran un manual de academia (Adams, MAD, CEP: 30-50€)
  que estructura los artículos por temas.
</p>

<h2>4. Calculadoras de nota (gratis)</h2>
<p>
  Saber cuánto necesitas acertar para aprobar es fundamental. OpoRuta tiene calculadoras
  gratuitas que aplican la penalización -1/3:
</p>
<ul>
  <li><a href="/herramientas/calculadora-nota-auxiliar-administrativo">Calculadora nota Auxiliar (C2)</a> — 60+50 preguntas, 90 min</li>
  <li><a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora nota Administrativo (C1)</a> — 70+20 preguntas, 100 min</li>
</ul>

<h2>5. Comunidades de opositores (gratis)</h2>
<p>
  Estudiar solo puede ser duro. Estas comunidades te conectan con otros opositores:
</p>
<ul>
  <li><strong>Foros de OpositaTest:</strong> encuestas de nota de corte, debates sobre convocatorias</li>
  <li><strong>Reddit r/oposiciones:</strong> experiencias, dudas, recursos compartidos</li>
  <li><strong>Grupos de Telegram/WhatsApp:</strong> búscalos en redes sociales por "auxiliar administrativo 2026"</li>
  <li><strong>YouTube:</strong> canales como "Opositora por libre" con técnicas de estudio</li>
</ul>

<h2>6. Herramientas de IA gratuitas (con precauciones)</h2>
<p>
  Puedes usar ChatGPT, Gemini o Claude para complementar tu estudio:
</p>
<ul>
  <li><strong>Resumir artículos largos:</strong> pídele que resuma un artículo del BOE en 3 puntos clave</li>
  <li><strong>Generar flashcards:</strong> "Genera 10 flashcards sobre el Título I de la Constitución"</li>
  <li><strong>Explicar conceptos:</strong> "Explícame la diferencia entre silencio positivo y negativo en la LPAC"</li>
</ul>
<p>
  <strong>Precaución importante:</strong> estas IAs pueden inventar citas legales (alucinaciones).
  <strong>NUNCA memorices un artículo que cite una IA sin comprobarlo en el BOE.</strong>
  Lee nuestro análisis de
  <a href="/blog/mejores-plataformas-ia-oposiciones-2026-comparativa">plataformas IA para oposiciones</a>
  para entender el riesgo.
</p>

<h2>Presupuesto mínimo recomendado</h2>
<p>
  Si quieres maximizar tus posibilidades con el menor gasto posible:
</p>
<table>
  <thead>
    <tr>
      <th>Recurso</th>
      <th>Coste</th>
      <th>Imprescindible</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Manual de temario (Adams/MAD/CEP)</td>
      <td>30-50€</td>
      <td>Recomendado</td>
    </tr>
    <tr>
      <td>OpoRuta Pack (C2)</td>
      <td>49,99€</td>
      <td>Recomendado</td>
    </tr>
    <tr>
      <td>Exámenes INAP (OpoRuta/INAP)</td>
      <td>Gratis</td>
      <td>Imprescindible</td>
    </tr>
    <tr>
      <td>Calculadora nota</td>
      <td>Gratis</td>
      <td>Útil</td>
    </tr>
    <tr>
      <td><strong>TOTAL</strong></td>
      <td><strong>80-100€</strong></td>
      <td></td>
    </tr>
  </tbody>
</table>
<p>
  Compara con una academia presencial (100-250€/mes × 12 meses = 1.200-3.000€).
  Preparar por libre con las herramientas adecuadas cuesta <strong>10-20 veces menos</strong>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">Guía completa para preparar por libre</a></li>
  <li><a href="/blog/penalizacion-examen-auxiliar-administrativo">Cómo funciona la penalización -1/3</a></li>
  <li><a href="/blog/mejores-plataformas-ia-oposiciones-2026-comparativa">Comparativa de plataformas IA para oposiciones</a></li>
  <li><a href="/blog/plazas-auxiliar-administrativo-2026">1.700 plazas en la convocatoria 2026</a></li>
</ul>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
  },
  // ─── Post 31: IA para oposiciones ¿merece la pena? ────────────────────────
  {
    slug: 'inteligencia-artificial-oposiciones-merece-la-pena',
    title: '¿Merece la pena usar Inteligencia Artificial para preparar oposiciones en 2026?',
    description:
      'Análisis honesto sobre el uso de IA (ChatGPT, plataformas especializadas) para preparar oposiciones. Qué puede hacer, qué no puede hacer, riesgos de alucinación y cómo usarla sin que te perjudique.',
    date: '2026-03-17',
    dateModified: '2026-03-19',
    keywords: [
      'inteligencia artificial oposiciones',
      'ChatGPT oposiciones',
      'IA para estudiar oposiciones',
      'preparar oposiciones con IA',
      'ChatGPT para oposiciones auxiliar administrativo',
      'riesgos IA oposiciones',
    ],
    faqs: [
      {
        question: '¿Puedo usar ChatGPT para preparar oposiciones?',
        answer: 'Sí, pero con precauciones. ChatGPT es útil para resumir textos largos, explicar conceptos y generar flashcards. Pero puede inventar citas legales (alucinaciones): si te dice que el artículo 53 de la LPAC dice algo, compruébalo siempre en el BOE. Para tests tipo test con citas verificadas, usa plataformas especializadas como OpoRuta.',
      },
      {
        question: '¿La IA puede inventar artículos de ley?',
        answer: 'Sí, es un problema conocido llamado "alucinación". Las IAs generativas (ChatGPT, Gemini, Claude) pueden inventar artículos que no existen, atribuir contenido incorrecto a artículos reales, o citar leyes derogadas. En oposiciones esto es especialmente peligroso porque memorizas información falsa.',
      },
      {
        question: '¿Qué plataformas de IA verifican las citas legales?',
        answer: 'OpoRuta es la única plataforma de oposiciones que verifica cada cita legal de forma determinista contra la legislación oficial del BOE antes de mostrarte la pregunta. OpositaTest evita el problema usando preguntas curadas manualmente. El resto de plataformas IA no documentan un proceso de verificación legal.',
      },
      {
        question: '¿La IA sustituye a una academia para oposiciones?',
        answer: 'No sustituye a una academia, pero reduce la necesidad de una. La IA no te da disciplina, comunidad ni un tutor humano. Pero sí te da tests personalizados, explicaciones inmediatas y análisis de progreso. Muchos opositores combinan estudio por libre + IA + recursos gratuitos con excelentes resultados.',
      },
    ],
    content: `
<p>
  <strong>Sí, usar inteligencia artificial para preparar oposiciones merece la pena en 2026, pero con condiciones:</strong>
  debes entender qué puede hacer la IA, qué no puede hacer, y cómo evitar sus riesgos.
  Según el Observatorio del Opositor 2026 de OpositaTest, <strong>el 27% de los opositores ya usa IA</strong>
  en su preparación (el 87% de ellos, ChatGPT). La tendencia es clara, pero el mayor peligro es
  la alucinación: las IAs generativas pueden inventar citas legales que tú memorizas como verdaderas.
</p>

<h2>Qué puede hacer la IA por un opositor</h2>

<h3>1. Generar tests tipo test personalizados</h3>
<p>
  En vez de hacer siempre los mismos tests de un banco fijo, la IA puede generar preguntas
  nuevas sobre el tema que estés estudiando. Esto evita que memorices las respuestas
  en vez de aprender el contenido.
</p>

<h3>2. Explicar errores de forma inmediata</h3>
<p>
  Cuando fallas una pregunta, la IA puede explicarte por qué la respuesta correcta es esa,
  citando el artículo exacto de la ley. Sin IA, tendrías que buscar tú el artículo
  en el BOE — con IA, la explicación es instantánea.
</p>

<h3>3. Adaptar la dificultad a tu nivel</h3>
<p>
  Si aciertas el 90% de las preguntas de la Constitución, la IA puede generar preguntas
  más difíciles sobre ese tema y centrarse en los temas donde fallas más. Esto es
  más eficiente que hacer tests aleatorios.
</p>

<h3>4. Resumir y esquematizar legislación</h3>
<p>
  Una ley como la LPAC tiene 133 artículos. La IA puede resumirte los artículos clave
  en fichas de estudio, esquemas o flashcards en segundos.
</p>

<h2>Qué NO puede hacer la IA</h2>

<h3>1. Sustituir el estudio del temario</h3>
<p>
  La IA genera tests y explicaciones, pero no puede estudiar por ti. Necesitas leer
  y comprender la legislación. Los tests son para practicar y consolidar, no para
  aprender desde cero.
</p>

<h3>2. Garantizar que sus citas legales son correctas</h3>
<p>
  <strong>Este es el riesgo más importante.</strong> Las IAs generativas (ChatGPT, Gemini, Claude)
  pueden inventar artículos de ley. A esto se le llama <strong>alucinación</strong>.
</p>
<p>Ejemplos reales de alucinación en oposiciones:</p>
<ul>
  <li>Citar un "artículo 47.3 de la LPAC" que no existe (la LPAC no tiene artículo 47.3)</li>
  <li>Atribuir el contenido del artículo 35 al artículo 53</li>
  <li>Citar la "Ley 30/1992" (derogada en 2015) como si estuviera vigente</li>
  <li>Inventar un plazo de "15 días" cuando el artículo real dice "10 días"</li>
</ul>
<p>
  Si memorizas una cita inventada, en el examen fallarás una pregunta que creías saber.
  Es peor que no haberla estudiado, porque tu confianza te lleva a elegir la respuesta
  incorrecta sin dudar.
</p>

<h3>3. Darte disciplina ni motivación</h3>
<p>
  Una academia presencial te obliga a asistir, te pone fechas y te da un grupo de estudio.
  La IA no hace nada de eso. Si no tienes disciplina para estudiar por libre,
  la IA sola no resolverá el problema.
</p>

<h2>Cómo usar la IA de forma segura para oposiciones</h2>

<h3>Regla 1: Nunca memorices una cita legal sin comprobarla</h3>
<p>
  Si la IA te dice que "según el artículo 53 de la LPAC, el plazo de resolución es de 3 meses",
  ve al <a href="https://www.boe.es/eli/es/l/2015/10/01/39/con" rel="nofollow noopener" target="_blank">BOE</a>
  y compruébalo. Debería ser un hábito automático.
</p>

<h3>Regla 2: Usa plataformas que verifiquen las citas</h3>
<p>
  Plataformas como <a href="/">OpoRuta</a> verifican cada cita legal contra la legislación
  del BOE de forma automática antes de mostrarte la pregunta. Esto elimina el riesgo
  de alucinación en las preguntas tipo test.
</p>

<h3>Regla 3: No dependas solo de la IA</h3>
<p>
  La IA es un complemento, no un sustituto. La combinación ideal:
</p>
<ul>
  <li><strong>Manual de temario</strong> (Adams, MAD, CEP) para lectura y comprensión</li>
  <li><strong>Plataforma de tests con IA verificada</strong> para practicar el formato del examen</li>
  <li><strong>Exámenes oficiales del INAP</strong> para medir tu nivel real</li>
  <li><strong>ChatGPT/Gemini</strong> como complemento para dudas puntuales y resúmenes (siempre verificando)</li>
</ul>

<h3>Regla 4: Practica con penalización desde el principio</h3>
<p>
  El examen del Auxiliar penaliza -1/3 por respuesta incorrecta. Si practicas sin penalización,
  tu estrategia de respuesta será incorrecta el día del examen. Cualquier plataforma que uses,
  asegúrate de que <a href="/blog/penalizacion-examen-auxiliar-administrativo">aplica la penalización real</a>.
</p>

<h2>Comparativa: IA genérica vs IA especializada en oposiciones</h2>

<table>
  <thead>
    <tr>
      <th>Característica</th>
      <th>ChatGPT / Gemini</th>
      <th>OpoRuta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Genera preguntas</strong></td>
      <td>Sí</td>
      <td>Sí</td>
    </tr>
    <tr>
      <td><strong>Formato examen real</strong></td>
      <td>No (formato libre)</td>
      <td>Sí (4 opciones, penalización)</td>
    </tr>
    <tr>
      <td><strong>Verifica citas legales</strong></td>
      <td>No</td>
      <td>Sí (contra BOE)</td>
    </tr>
    <tr>
      <td><strong>Simulacros cronometrados</strong></td>
      <td>No</td>
      <td>Sí (con exámenes INAP reales)</td>
    </tr>
    <tr>
      <td><strong>Seguimiento de progreso</strong></td>
      <td>No</td>
      <td>Sí (por tema y ley)</td>
    </tr>
    <tr>
      <td><strong>Análisis exámenes INAP</strong></td>
      <td>No</td>
      <td>Sí (Radar del Tribunal)</td>
    </tr>
    <tr>
      <td><strong>Precio</strong></td>
      <td>Gratis / 20€/mes (Plus)</td>
      <td>Gratis (5 tests) / 49,99€</td>
    </tr>
    <tr>
      <td><strong>Riesgo de alucinación</strong></td>
      <td>Alto</td>
      <td>Eliminado (verificación)</td>
    </tr>
  </tbody>
</table>

<h2>Conclusión: la IA es una herramienta, no una solución mágica</h2>
<p>
  La IA para oposiciones en 2026 es como una calculadora para matemáticas: te ahorra tiempo
  y te permite practicar más, pero no sustituye el entendimiento. El opositor que usa IA
  de forma inteligente (verificando citas, combinando con estudio del temario, practicando
  con penalización) tiene ventaja sobre el que solo lee y subraya.
</p>
<p>
  La clave no es SI usar IA, sino CÓMO usarla. Y el cómo más importante es: <strong>verifica
  siempre las citas legales</strong>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/mejores-plataformas-ia-oposiciones-2026-comparativa">Comparativa de plataformas IA para oposiciones 2026</a></li>
  <li><a href="/blog/recursos-gratuitos-auxiliar-administrativo-estado-2026">Recursos gratuitos para Auxiliar Administrativo</a></li>
  <li><a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">Preparar oposiciones por libre en 2026</a></li>
  <li><a href="/blog/oporuta-vs-opositatest-auxiliar-administrativo-2026">OpoRuta vs OpositaTest — diferencias reales</a></li>
</ul>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
  },

  // ─── Post 32 ───────────────────────────────────────────────────────────────
  {
    slug: 'calendario-oposiciones-age-2026-fechas-auxiliar-administrativo',
    title: 'Calendario oposiciones AGE 2026: fechas clave auxiliar y administrativo del estado',
    description:
      'Todas las fechas clave de las oposiciones AGE 2026: convocatoria BOE, inscripción, admitidos, examen 23 mayo, resultados y elección de destinos.',
    date: '2026-03-19',
    dateModified: '2026-03-19',
    keywords: [
      'calendario oposiciones 2026',
      'fechas examen auxiliar administrativo 2026',
      'cuando es el examen auxiliar administrativo estado',
      'oposiciones AGE 2026 calendario',
      'fecha examen C2 auxiliar 2026',
      'plazos inscripcion oposiciones AGE',
    ],
    content: `
<h2>Calendario completo de las oposiciones AGE 2026</h2>
<p>
  El examen de Auxiliar Administrativo del Estado (C2) está convocado para el <strong>23 de mayo de 2026</strong>.
  Este calendario recoge todas las fechas clave desde la publicación en el BOE hasta la toma de posesión,
  para que no pierdas ningún plazo.
</p>

<table>
  <thead>
    <tr>
      <th>Fase</th>
      <th>Fecha estimada</th>
      <th>Qué hacer</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Convocatoria BOE</td>
      <td>Noviembre 2025</td>
      <td>Verificar requisitos, revisar bases</td>
    </tr>
    <tr>
      <td>Plazo de inscripción</td>
      <td>Diciembre 2025 – Enero 2026</td>
      <td>Rellenar solicitud + pagar tasa (11,32€ o exenta)</td>
    </tr>
    <tr>
      <td>Lista provisional de admitidos</td>
      <td>Marzo 2026</td>
      <td>Comprobar tu nombre, reclamar si no apareces</td>
    </tr>
    <tr>
      <td>Lista definitiva de admitidos</td>
      <td>Abril 2026</td>
      <td>Confirmar sede y hora del examen</td>
    </tr>
    <tr>
      <td><strong>Examen tipo test</strong></td>
      <td><strong>23 de mayo de 2026</strong></td>
      <td>100 preguntas + 10 reserva, 90 minutos</td>
    </tr>
    <tr>
      <td>Publicación de respuestas</td>
      <td>Mayo – Junio 2026</td>
      <td>Cotejar respuestas, calcular nota provisional</td>
    </tr>
    <tr>
      <td>Plazo de alegaciones</td>
      <td>Junio 2026 (5 días hábiles)</td>
      <td>Impugnar preguntas si corresponde</td>
    </tr>
    <tr>
      <td>Notas definitivas</td>
      <td>Julio – Agosto 2026</td>
      <td>Verificar nota y posición</td>
    </tr>
    <tr>
      <td>Elección de destinos</td>
      <td>Septiembre – Octubre 2026</td>
      <td>Seleccionar ministerio y localidad</td>
    </tr>
    <tr>
      <td>Toma de posesión</td>
      <td>Noviembre – Diciembre 2026</td>
      <td>Incorporarse al puesto</td>
    </tr>
  </tbody>
</table>

<h2>Fase 1: convocatoria y publicación en el BOE</h2>
<p>
  La Oferta de Empleo Público (OEP) se aprobó con <strong>1.700 plazas para Auxiliar Administrativo (C2)</strong>.
  La convocatoria se publica en el Boletín Oficial del Estado (BOE) y abre el plazo de inscripción.
  Es fundamental leer las bases completas porque especifican los requisitos, temario oficial y formato del examen.
</p>
<p>
  <strong>Consejo:</strong> activa las alertas del BOE o usa herramientas como el
  <a href="/blog/analisis-frecuencia-preguntas-inap-auxiliar-administrativo">análisis de frecuencia INAP</a>
  de OpoRuta para recibir novedades legislativas relevantes.
</p>

<h2>Fase 2: inscripción y pago de tasas</h2>
<p>
  El plazo de inscripción suele ser de <strong>20 días hábiles</strong> desde la publicación.
  La solicitud se presenta telemáticamente a través del Portal 060. La tasa general es de
  <strong>11,32€</strong>, aunque hay exenciones para familias numerosas, personas con discapacidad
  ≥33%, víctimas de terrorismo y demandantes de empleo de larga duración.
</p>
<p>
  Documentación necesaria: DNI/NIE en vigor, título de ESO (o equivalente), justificante de pago
  de tasas y, en su caso, certificado de exención. Consulta la
  <a href="/blog/requisitos-oposiciones-auxiliar-administrativo-estado-2026">guía completa de requisitos</a>
  para verificar que cumples todo antes de inscribirte.
</p>

<h2>Fase 3: listas de admitidos y excluidos</h2>
<p>
  Tras cerrar el plazo, el Tribunal publica la lista provisional de admitidos y excluidos.
  Si no apareces o estás excluido, dispones de <strong>10 días hábiles</strong> para subsanar
  errores. La lista definitiva se publica unas semanas después y confirma tu sede de examen.
</p>

<h2>Fase 4: el examen (23 de mayo de 2026)</h2>
<p>
  El ejercicio consiste en un cuestionario de <strong>100 preguntas tipo test</strong> (más 10 de reserva)
  con 4 opciones de respuesta y <strong>penalización de -1/3</strong> por error. Duración: <strong>90 minutos</strong>.
  El temario abarca Bloque I (derecho administrativo, Constitución, LPAC, TREBEP) y Bloque II
  (ofimática: Word, Excel, correo electrónico, Windows).
</p>
<p>
  Para llegar preparado, practica con
  <a href="/blog/penalizacion-examen-auxiliar-administrativo">simulacros con penalización real</a>
  y gestiona bien el tiempo. La nota de corte histórica oscila entre 57,5 y 65 sobre 100.
</p>

<h2>Fase 5: resultados, alegaciones y nota de corte</h2>
<p>
  El Tribunal publica la plantilla de respuestas correctas el mismo día o al siguiente.
  Se abre un plazo de <strong>5 días hábiles</strong> para alegar contra preguntas ambiguas o erróneas.
  Tras resolver las alegaciones, se publican las notas definitivas y la nota de corte real.
</p>

<h2>Fase 6: elección de destinos y toma de posesión</h2>
<p>
  Los aprobados eligen destino por orden de puntuación. Los destinos incluyen ministerios en Madrid,
  delegaciones del gobierno en provincias y organismos autónomos. El plazo para incorporarse suele
  ser de un mes desde la resolución. Consulta nuestra
  <a href="/blog/elegir-destino-auxiliar-administrativo-estado">guía de elección de destinos</a>
  para preparar esta fase con antelación.
</p>

<h2>¿Cuánto tiempo tienes para prepararte?</h2>
<p>
  Si lees esto en marzo de 2026, quedan aproximadamente <strong>2 meses</strong> hasta el examen.
  Es tiempo suficiente para un repaso intensivo si ya llevas base, pero ajustado para empezar desde cero.
  En OpoRuta puedes hacer tests por tema, simulacros completos y repasos de errores para optimizar
  cada hora de estudio en esta recta final.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026. Fechas sujetas a posibles cambios del Tribunal.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuándo es el examen de Auxiliar Administrativo del Estado 2026?', answer: 'El examen está convocado para el 23 de mayo de 2026. Es un ejercicio único tipo test de 100 preguntas (más 10 de reserva) con 90 minutos de duración y penalización de -1/3 por error.' },
      { question: '¿Cuánto cuesta la tasa de inscripción para las oposiciones AGE 2026?', answer: 'La tasa general es de 11,32€. Están exentos de pago las familias numerosas de categoría general (50% de descuento) y especial (exenta), personas con discapacidad ≥33%, víctimas de terrorismo y demandantes de empleo de larga duración.' },
      { question: '¿Cuándo se publican los resultados del examen de auxiliar administrativo?', answer: 'La plantilla de respuestas correctas se publica el mismo día del examen o al día siguiente. Las notas definitivas se publican entre julio y agosto de 2026, tras resolver las alegaciones presentadas.' },
      { question: '¿Cuántas plazas de auxiliar administrativo hay en 2026?', answer: 'La convocatoria 2026 ofrece aproximadamente 1.700 plazas de Auxiliar Administrativo del Estado (C2), el mayor volumen de los últimos años. Estas plazas se reparten entre ministerios, delegaciones del gobierno y organismos autónomos.' },
    ],
  },

  // ─── Post 33 ───────────────────────────────────────────────────────────────
  {
    slug: 'elegir-destino-auxiliar-administrativo-estado',
    title: 'Cómo elegir destino como auxiliar administrativo del estado: guía completa',
    description:
      'Guía para elegir destino tras aprobar las oposiciones de auxiliar administrativo: ministerios, ciudades, complementos salariales y teletrabajo.',
    date: '2026-03-19',
    dateModified: '2026-03-19',
    keywords: [
      'elegir destino auxiliar administrativo',
      'destinos auxiliar administrativo estado',
      'ministerios auxiliar administrativo',
      'destinos oposiciones AGE',
      'donde trabajar auxiliar administrativo estado',
      'eleccion destino funcionario',
    ],
    content: `
<h2>Cómo funciona la elección de destinos</h2>
<p>
  Tras aprobar la oposición de Auxiliar Administrativo del Estado, los aprobados eligen destino
  <strong>por estricto orden de puntuación</strong>: quien mejor nota saque, elige primero.
  El Ministerio de Hacienda y Función Pública publica la relación de puestos ofertados y cada
  opositor indica sus preferencias a través de la sede electrónica.
</p>

<h2>¿Qué destinos existen para auxiliar administrativo?</h2>
<p>
  Los puestos de auxiliar administrativo C2 se reparten por toda la Administración General del Estado.
  Los principales destinos son:
</p>

<table>
  <thead>
    <tr>
      <th>Tipo de destino</th>
      <th>Ejemplos</th>
      <th>Ubicación habitual</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ministerios (servicios centrales)</td>
      <td>Hacienda, Interior, Justicia, Trabajo</td>
      <td>Madrid</td>
    </tr>
    <tr>
      <td>Delegaciones del Gobierno</td>
      <td>Delegación en Andalucía, País Vasco, Cataluña…</td>
      <td>Capitales de provincia</td>
    </tr>
    <tr>
      <td>Subdelegaciones del Gobierno</td>
      <td>Subdelegación en Bilbao, Alicante, Málaga…</td>
      <td>Ciudades medianas</td>
    </tr>
    <tr>
      <td>Organismos autónomos</td>
      <td>SEPE, DGT, AEAT, Seguridad Social</td>
      <td>Toda España</td>
    </tr>
    <tr>
      <td>Otros organismos</td>
      <td>Muface, INSS, Catastro</td>
      <td>Varias ciudades</td>
    </tr>
  </tbody>
</table>

<h2>Factores clave para elegir bien tu destino</h2>
<p>
  No todos los destinos son iguales. Estos son los factores que más impactan en tu día a día como funcionario:
</p>

<h3>1. Ciudad y coste de vida</h3>
<p>
  Madrid concentra la mayoría de plazas en servicios centrales, pero el coste de vida es alto.
  Ciudades como Valladolid, Zaragoza o Sevilla ofrecen puestos en delegaciones con menor coste
  de vivienda y buena calidad de vida. Compara el <strong>complemento de destino</strong> con
  el coste real de la ciudad.
</p>

<h3>2. Complementos salariales por destino</h3>
<p>
  El sueldo base es idéntico en toda España, pero los <strong>complementos específicos y de productividad</strong>
  varían según el ministerio y la unidad. Algunos organismos como la AEAT o la Seguridad Social
  tienen complementos más altos que la media. Consulta nuestra
  <a href="/blog/sueldo-auxiliar-administrativo-estado-2026-nomina-desglosada">guía de sueldo desglosado</a>
  para ver las diferencias reales.
</p>

<h3>3. Tipo de trabajo y funciones</h3>
<p>
  Las funciones varían mucho según el destino. En un registro general harás atención al público y
  tramitación. En una unidad de gestión económica manejarás presupuestos y contabilidad. En el SEPE
  atenderás prestaciones por desempleo. Pregunta a funcionarios en activo sobre el día a día real.
</p>

<h3>4. Posibilidad de teletrabajo</h3>
<p>
  Desde 2021, la AGE permite el teletrabajo parcial en muchos puestos. No todos los destinos lo ofrecen
  por igual: los ministerios en Madrid suelen ser más flexibles que las oficinas de atención al público.
  La tendencia es de <strong>2-3 días presenciales + 2-3 días teletrabajo</strong> por semana,
  aunque depende de cada unidad.
</p>

<h3>5. Opciones de movilidad futura</h3>
<p>
  Tu primer destino no es para siempre. Tras dos años puedes participar en concursos de traslados
  para cambiar de ciudad o ministerio. También puedes solicitar comisiones de servicio (temporales)
  o promoción interna a C1. Elegir un destino con buena nota facilita futuros movimientos.
</p>

<h2>Destinos más solicitados (y menos)</h2>
<p>
  <strong>Más solicitados:</strong> AEAT (buen complemento), Seguridad Social (estabilidad),
  ministerios en Madrid (promoción), delegaciones en ciudades grandes (calidad de vida).
</p>
<p>
  <strong>Menos solicitados:</strong> subdelegaciones en ciudades pequeñas, organismos con mucha
  atención al público, destinos en localidades con poca conexión. Paradójicamente, estos destinos
  tienen <strong>ventajas ocultas</strong>: menos estrés, facilidad de parking, buen ambiente
  y más posibilidades de teletrabajo.
</p>

<h2>Consejos prácticos para la elección</h2>
<ul>
  <li><strong>Investiga antes de aprobar:</strong> no esperes a tener la nota para decidir. Haz una lista de preferencias con antelación.</li>
  <li><strong>Habla con funcionarios:</strong> los foros de oposiciones y grupos de Telegram tienen información real sobre cada destino.</li>
  <li><strong>Calcula la nómina neta por ciudad:</strong> un complemento alto en Madrid puede equivaler a un complemento medio en una ciudad con alquiler 400€ más barato.</li>
  <li><strong>Piensa a 3-5 años:</strong> tu primer destino condiciona tus opciones de traslado futuras.</li>
</ul>
<p>
  Lo primero es aprobar. Si estás preparando el examen del <strong>23 de mayo de 2026</strong>,
  consulta el <a href="/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo">calendario completo</a>
  y practica con <a href="/blog/errores-comunes-examen-auxiliar-administrativo-estado">los errores más frecuentes</a>
  para llegar al examen con la mejor nota posible.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Puedo elegir ciudad como auxiliar administrativo del estado?', answer: 'Sí. Tras aprobar, eliges destino por orden de puntuación entre los puestos ofertados. Hay plazas en Madrid (servicios centrales) y en todas las provincias (delegaciones, subdelegaciones, organismos autónomos). Quien mejor nota saque, elige primero.' },
      { question: '¿Puedo cambiar de destino después de tomar posesión?', answer: 'Sí. Tras dos años en tu primer destino puedes participar en concursos de traslados para cambiar de ciudad o ministerio. También existen comisiones de servicio (temporales) y adscripciones provisionales. La movilidad es una de las grandes ventajas de ser funcionario AGE.' },
      { question: '¿Qué ministerio paga mejor al auxiliar administrativo?', answer: 'El sueldo base es idéntico, pero los complementos específicos varían. Organismos como la AEAT, la Seguridad Social y algunos ministerios (Hacienda, Interior) suelen tener complementos más altos, con diferencias de 100-300€ mensuales respecto a la media.' },
      { question: '¿Hay teletrabajo para auxiliares administrativos del estado?', answer: 'Sí, desde 2021 la AGE permite teletrabajo parcial. La modalidad habitual es 2-3 días presenciales y 2-3 días en remoto. No todos los puestos lo ofrecen: depende del ministerio y del tipo de funciones. Los puestos de atención al público suelen ser más presenciales.' },
      { question: '¿Cuánto tarda todo el proceso desde el examen hasta incorporarse?', answer: 'Desde el examen (23 mayo 2026) hasta la toma de posesión suelen pasar entre 5 y 7 meses. Las notas definitivas se publican en julio-agosto, la elección de destinos en septiembre-octubre, y la incorporación entre noviembre y diciembre de 2026.' },
    ],
  },

  // ─── Post 34 ───────────────────────────────────────────────────────────────
  {
    slug: 'errores-comunes-examen-auxiliar-administrativo-estado',
    title: 'Errores más comunes en el examen de auxiliar administrativo del estado (y cómo evitarlos)',
    description:
      'Los 10 errores que más opositores cometen en el examen de auxiliar administrativo AGE y estrategias concretas para evitarlos el 23 de mayo.',
    date: '2026-03-19',
    dateModified: '2026-03-19',
    keywords: [
      'errores examen auxiliar administrativo',
      'fallos comunes oposiciones',
      'errores oposiciones AGE',
      'consejos examen auxiliar administrativo',
      'trucos examen tipo test oposiciones',
      'como aprobar auxiliar administrativo estado',
    ],
    content: `
<h2>Los 10 errores que más opositores cometen en el examen</h2>
<p>
  Cada convocatoria, miles de opositores bien preparados suspenden no por falta de estudio,
  sino por <strong>errores evitables</strong> en la estrategia de examen. Tras analizar las
  convocatorias 2019, 2022 y 2024, estos son los 10 fallos más frecuentes y cómo evitarlos
  en el examen del <strong>23 de mayo de 2026</strong>.
</p>

<h2>Error 1: mala gestión del tiempo</h2>
<p>
  Tienes <strong>90 minutos para 110 preguntas</strong> (100 puntuables + 10 reserva).
  Eso son 49 segundos por pregunta. El error clásico: quedarte 3-4 minutos en una pregunta
  difícil y llegar con prisas a las últimas 30.
</p>
<p>
  <strong>Solución:</strong> marca las preguntas que te cuesten más de 1 minuto y sigue adelante.
  Vuelve a ellas al final. Practica con simulacros cronometrados —
  <a href="/blog/penalizacion-examen-auxiliar-administrativo">con penalización real</a> — para
  interiorizar el ritmo.
</p>

<h2>Error 2: no entender la penalización -1/3</h2>
<p>
  Muchos opositores responden todo "porque algo suena" o, al contrario, dejan demasiadas en blanco
  por miedo. Ambas estrategias son incorrectas.
</p>
<p>
  <strong>La regla matemática:</strong> si puedes descartar al menos 1 de las 4 opciones, responde.
  Si no puedes descartar ninguna, deja en blanco. Esta estrategia maximiza tu nota esperada.
</p>

<h2>Error 3: estudiar todos los temas por igual</h2>
<p>
  No todos los temas tienen el mismo peso en el examen. El
  <a href="/blog/analisis-frecuencia-preguntas-inap-auxiliar-administrativo">análisis de frecuencia INAP</a>
  muestra que la Constitución, la LPAC y el TREBEP concentran más del 40% de las preguntas.
  Ofimática (Bloque II) aporta otro 25-30%.
</p>
<p>
  <strong>Solución:</strong> prioriza los temas con más peso histórico. Dedica el 60% de tu
  tiempo a los 10 temas más frecuentes y el 40% restante a completar el temario.
</p>

<h2>Error 4: no practicar con exámenes reales</h2>
<p>
  Estudiar la ley "de memoria" no es lo mismo que resolver preguntas tipo test del INAP.
  El tribunal tiene un estilo propio: preguntas con doble negación, opciones muy similares
  entre sí, artículos poco habituales como "trampa".
</p>
<p>
  <strong>Solución:</strong> haz al menos 5-10 simulacros completos con preguntas de exámenes
  reales (2019, 2022, 2024). OpoRuta incluye simulacros con las preguntas oficiales exactas
  del INAP, con penalización y cronómetro.
</p>

<h2>Error 5: memorizar sin comprender</h2>
<p>
  Memorizar el artículo 21 de la LPAC de carrerilla no sirve si no entiendes cuándo se aplica
  el silencio administrativo positivo y cuándo el negativo. El tribunal formula preguntas de
  <strong>aplicación práctica</strong>, no de recitado.
</p>
<p>
  <strong>Solución:</strong> después de leer un artículo, intenta explicarlo con tus palabras.
  Si no puedes, no lo has entendido. Haz tests por tema para detectar qué conceptos confundes.
</p>

<h2>Error 6: ignorar el Bloque II (ofimática)</h2>
<p>
  Muchos opositores de letras subestiman el bloque de ofimática (Word, Excel, Windows, correo).
  Error grave: aporta un <strong>25-30% de las preguntas</strong> y es más fácil de preparar
  que el Bloque I. Un aprobado puede decidirse aquí.
</p>
<p>
  <strong>Solución:</strong> dedica al menos 3-4 semanas a ofimática. Practica con los menús
  reales de las aplicaciones. Las preguntas suelen ser sobre ubicación de opciones en la cinta
  de opciones, atajos de teclado y funciones de Excel.
</p>

<h2>Error 7: estudiar a última hora (cramming)</h2>
<p>
  Repasar todo el temario la noche anterior genera <strong>interferencia retroactiva</strong>:
  la información nueva borra la anterior. Tu cerebro necesita sueño para consolidar la memoria.
</p>
<p>
  <strong>Solución:</strong> planifica repasos espaciados durante semanas. La
  <a href="/blog/preparar-oposicion-auxiliar-administrativo-por-libre">preparación por libre</a>
  funciona si sigues un calendario con repetición espaciada y tests frecuentes.
</p>

<h2>Error 8: no leer bien el enunciado</h2>
<p>
  Preguntas con "NO es correcto", "EXCEPTO", "según el artículo X" o "en todo caso" son trampas
  habituales. Leer demasiado rápido lleva a confundir lo que se pregunta.
</p>
<p>
  <strong>Solución:</strong> subraya la palabra clave del enunciado antes de leer las opciones.
  Si pregunta "cuál NO es correcta", marca las correctas y elige la que sobre.
</p>

<h2>Error 9: cambiar respuestas sin motivo</h2>
<p>
  Estudios psicológicos muestran que la primera intuición suele ser correcta. Cambiar una
  respuesta "porque me suena raro" sin un argumento claro acierta menos del 30% de las veces.
</p>
<p>
  <strong>Solución:</strong> solo cambia una respuesta si encuentras un motivo concreto
  (recuerdas el artículo exacto, detectas un error de lectura). Nunca por "sensación".
</p>

<h2>Error 10: no cuidar la logística del día del examen</h2>
<p>
  Llegar tarde, olvidar el DNI, no llevar bolígrafos de repuesto o no saber la ubicación del
  aula generan un estrés que reduce tu rendimiento cognitivo.
</p>
<p>
  <strong>Solución:</strong> prepara todo la noche anterior (DNI, bolígrafos, reloj analógico,
  botella de agua). Llega <strong>45 minutos antes</strong>. Localiza tu aula con calma.
  El examen empieza antes de sentarte.
</p>

<h2>Resumen: checklist anti-errores</h2>
<table>
  <thead>
    <tr>
      <th>Error</th>
      <th>Solución rápida</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Gestión del tiempo</td><td>49 seg/pregunta, marca y sigue</td></tr>
    <tr><td>Penalización</td><td>Descarta 1 opción → responde</td></tr>
    <tr><td>Temas iguales</td><td>60% tiempo en top 10 temas</td></tr>
    <tr><td>Sin exámenes reales</td><td>5-10 simulacros INAP completos</td></tr>
    <tr><td>Memorizar sin entender</td><td>Explícalo con tus palabras</td></tr>
    <tr><td>Ignorar ofimática</td><td>3-4 semanas dedicadas</td></tr>
    <tr><td>Cramming</td><td>Repaso espaciado + tests</td></tr>
    <tr><td>No leer enunciado</td><td>Subraya palabra clave</td></tr>
    <tr><td>Cambiar respuestas</td><td>Solo con motivo concreto</td></tr>
    <tr><td>Logística</td><td>Todo preparado la noche antes</td></tr>
  </tbody>
</table>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuál es el error más grave en el examen de auxiliar administrativo?', answer: 'La mala gestión del tiempo. Con 90 minutos para 110 preguntas (49 segundos cada una), quedarse bloqueado en preguntas difíciles impide llegar a preguntas fáciles que sí sabrías responder. La solución es marcar las difíciles y seguir adelante.' },
      { question: '¿Debo responder todas las preguntas del examen?', answer: 'No. Con la penalización de -1/3, solo debes responder si puedes descartar al menos 1 de las 4 opciones. Si no tienes ninguna idea, deja en blanco. Responder al azar reduce tu nota esperada.' },
      { question: '¿Es más importante estudiar leyes u ofimática?', answer: 'Ambos bloques son necesarios. El Bloque I (leyes) pesa un 70-75% y el Bloque II (ofimática) un 25-30%. Muchos opositores descuidan ofimática, pero es más fácil de preparar y puede marcar la diferencia entre aprobar y suspender.' },
      { question: '¿Cuántos simulacros debo hacer antes del examen?', answer: 'Recomendamos un mínimo de 5-10 simulacros completos con preguntas reales del INAP, penalización activa y cronómetro de 90 minutos. Esto entrena tanto el conocimiento como la gestión del tiempo y la estrategia de respuesta.' },
      { question: '¿Funciona estudiar a última hora para oposiciones?', answer: 'No. El cramming (estudio intensivo de última hora) genera interferencia retroactiva: la información nueva borra la anterior. El cerebro necesita sueño para consolidar la memoria. La repetición espaciada durante semanas es mucho más efectiva.' },
    ],
  },

  // ─── Post 35 ───────────────────────────────────────────────────────────────
  {
    slug: 'sueldo-auxiliar-administrativo-estado-2026-nomina-desglosada',
    title: 'Sueldo auxiliar administrativo del estado 2026: nómina real desglosada',
    description:
      'Nómina desglosada del auxiliar administrativo del estado en 2026: sueldo base, complementos, pagas extra, neto mensual y progresión con trienios.',
    date: '2026-03-19',
    dateModified: '2026-03-19',
    keywords: [
      'sueldo auxiliar administrativo estado',
      'cuanto cobra auxiliar administrativo',
      'nomina auxiliar administrativo estado 2026',
      'sueldo funcionario C2',
      'salario auxiliar administrativo AGE',
      'sueldo oposiciones auxiliar administrativo',
    ],
    content: `
<h2>¿Cuánto cobra un auxiliar administrativo del estado en 2026?</h2>
<p>
  Un auxiliar administrativo del estado (grupo C2) cobra entre <strong>1.400€ y 1.650€ netos al mes</strong>
  en 14 pagas, dependiendo del destino y la antigüedad. El sueldo bruto anual oscila entre
  <strong>22.000€ y 26.000€</strong>. A continuación, la nómina desglosada concepto por concepto.
</p>

<h2>Nómina desglosada: conceptos retributivos</h2>
<table>
  <thead>
    <tr>
      <th>Concepto</th>
      <th>Importe mensual bruto</th>
      <th>Notas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sueldo base (C2)</td>
      <td>737,16€</td>
      <td>Fijado por PGE, igual en toda España</td>
    </tr>
    <tr>
      <td>Complemento de destino (nivel 15-18)</td>
      <td>421,26€ – 525,60€</td>
      <td>Nivel 15 al inicio, sube con concursos</td>
    </tr>
    <tr>
      <td>Complemento específico</td>
      <td>250€ – 500€</td>
      <td>Varía según ministerio y puesto</td>
    </tr>
    <tr>
      <td>Pagas extra (junio + diciembre)</td>
      <td>~1.200€ cada una</td>
      <td>Sueldo base + complemento destino</td>
    </tr>
    <tr>
      <td>Trienios (antigüedad)</td>
      <td>+42,24€ por trienio</td>
      <td>Se suma cada 3 años de servicio</td>
    </tr>
  </tbody>
</table>

<h2>Del bruto al neto: deducciones</h2>
<p>
  Las deducciones principales son:
</p>
<ul>
  <li><strong>IRPF:</strong> entre el 12% y el 16% según comunidad autónoma y situación personal (soltero sin hijos: ~14%)</li>
  <li><strong>Muface:</strong> 1,69% (mutualidad de funcionarios, sustituye a la Seguridad Social)</li>
  <li><strong>Derechos pasivos:</strong> 3,86% (pensión de jubilación)</li>
</ul>
<p>
  Total deducciones: aproximadamente un <strong>19-21%</strong> del bruto. Esto deja un neto
  mensual de entre 1.400€ y 1.650€ en 14 pagas.
</p>

<h2>Ejemplo de nómina real: auxiliar administrativo recién aprobado</h2>
<table>
  <thead>
    <tr>
      <th>Concepto</th>
      <th>Importe</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sueldo base</td>
      <td>737,16€</td>
    </tr>
    <tr>
      <td>Complemento destino (nivel 15)</td>
      <td>421,26€</td>
    </tr>
    <tr>
      <td>Complemento específico (media)</td>
      <td>350,00€</td>
    </tr>
    <tr>
      <td><strong>Total bruto</strong></td>
      <td><strong>1.508,42€</strong></td>
    </tr>
    <tr>
      <td>IRPF (~14%)</td>
      <td>-211,18€</td>
    </tr>
    <tr>
      <td>Muface (1,69%)</td>
      <td>-25,49€</td>
    </tr>
    <tr>
      <td>Derechos pasivos (3,86%)</td>
      <td>-58,23€</td>
    </tr>
    <tr>
      <td><strong>Total neto</strong></td>
      <td><strong>1.213,52€</strong></td>
    </tr>
  </tbody>
</table>
<p>
  <strong>Nota:</strong> este ejemplo refleja un puesto con complemento específico medio.
  Con 14 pagas, el neto anual sería de aproximadamente <strong>16.989€</strong>.
  En puestos con complemento específico alto (AEAT, Seguridad Social), el neto mensual
  puede superar los 1.500€.
</p>

<h2>Comparativa de sueldo por destino</h2>
<table>
  <thead>
    <tr>
      <th>Destino</th>
      <th>Complemento específico</th>
      <th>Neto mensual estimado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ministerio (servicios centrales, Madrid)</td>
      <td>350€ – 450€</td>
      <td>1.250€ – 1.400€</td>
    </tr>
    <tr>
      <td>AEAT</td>
      <td>400€ – 550€</td>
      <td>1.350€ – 1.550€</td>
    </tr>
    <tr>
      <td>Seguridad Social / INSS</td>
      <td>380€ – 500€</td>
      <td>1.300€ – 1.500€</td>
    </tr>
    <tr>
      <td>Delegación del Gobierno (provincia)</td>
      <td>300€ – 400€</td>
      <td>1.200€ – 1.350€</td>
    </tr>
    <tr>
      <td>Subdelegación (ciudad mediana)</td>
      <td>250€ – 350€</td>
      <td>1.150€ – 1.300€</td>
    </tr>
  </tbody>
</table>

<h2>Progresión salarial: trienios y carrera</h2>
<p>
  El sueldo de funcionario crece automáticamente con la <strong>antigüedad</strong>. Cada 3 años
  de servicio se cobra un trienio de 42,24€ brutos/mes. Además, puedes subir de nivel de
  complemento de destino participando en concursos de traslados (del nivel 15 al 18).
</p>
<table>
  <thead>
    <tr>
      <th>Antigüedad</th>
      <th>Trienios acumulados</th>
      <th>Incremento mensual bruto</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>0-2 años</td><td>0</td><td>0€</td></tr>
    <tr><td>3-5 años</td><td>1</td><td>+42,24€</td></tr>
    <tr><td>6-8 años</td><td>2</td><td>+84,48€</td></tr>
    <tr><td>9-11 años</td><td>3</td><td>+126,72€</td></tr>
    <tr><td>15+ años</td><td>5+</td><td>+211,20€+</td></tr>
  </tbody>
</table>
<p>
  Además, con la <strong>promoción interna</strong> puedes presentarte a C1 (Administrativo)
  tras dos años como C2, lo que supone un salto salarial de unos 200-400€ netos al mes.
  Consulta las <a href="/blog/diferencias-c1-c2-auxiliar-administrativo-estado">diferencias entre C1 y C2</a>
  para valorar esta opción.
</p>

<h2>Ventajas económicas más allá del sueldo</h2>
<ul>
  <li><strong>Estabilidad total:</strong> puesto vitalicio, no sujeto a despido ni ERE</li>
  <li><strong>14 pagas:</strong> dos pagas extra completas (junio y diciembre)</li>
  <li><strong>Muface:</strong> seguro médico privado + público a elegir, extensible a familia</li>
  <li><strong>Vacaciones:</strong> 22 días laborables + moscosos + asuntos propios (~30 días reales)</li>
  <li><strong>Horario:</strong> jornada de 37,5 horas semanales, muchos puestos con horario de 7:30 a 15:00</li>
  <li><strong>Permisos:</strong> paternidad/maternidad ampliada, cuidado de hijos, formación</li>
  <li><strong>Plan de pensiones:</strong> derechos pasivos + posibilidad de plan complementario</li>
</ul>

<p>
  Si estás decidido a presentarte, consulta los
  <a href="/blog/requisitos-oposiciones-auxiliar-administrativo-estado-2026">requisitos completos</a>
  y el <a href="/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo">calendario de fechas</a>
  para no perder ningún plazo antes del examen del 23 de mayo de 2026.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026. Importes basados en PGE 2025-2026 y nóminas reales de funcionarios C2.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuánto cobra un auxiliar administrativo del estado al mes?', answer: 'Entre 1.400€ y 1.650€ netos mensuales en 14 pagas, dependiendo del destino y la antigüedad. El sueldo bruto mensual oscila entre 1.500€ y 1.900€. Los organismos con mejor complemento específico (AEAT, Seguridad Social) están en la parte alta de la horquilla.' },
      { question: '¿Cuánto es el sueldo bruto anual de un auxiliar administrativo del estado?', answer: 'El sueldo bruto anual se sitúa entre 22.000€ y 26.000€ aproximadamente, incluyendo las 14 pagas. Con trienios de antigüedad y posibles subidas de nivel, puede superar los 28.000€ brutos tras 10 años de servicio.' },
      { question: '¿Los auxiliares administrativos cobran pagas extra?', answer: 'Sí, cobran 14 pagas al año: 12 mensuales + 2 pagas extraordinarias (junio y diciembre). Cada paga extra equivale aproximadamente al sueldo base más el complemento de destino, unos 1.150-1.260€ brutos.' },
      { question: '¿Qué son los trienios de un funcionario?', answer: 'Los trienios son un complemento salarial por antigüedad que se cobra automáticamente cada 3 años de servicio activo. Para un auxiliar administrativo (C2), cada trienio supone 42,24€ brutos mensuales adicionales que se acumulan indefinidamente.' },
      { question: '¿Cobran igual los auxiliares administrativos en toda España?', answer: 'El sueldo base y el complemento de destino son iguales en toda España. Lo que varía es el complemento específico, que depende del ministerio u organismo. La diferencia entre el puesto peor y mejor pagado puede ser de 200-400€ netos al mes.' },
    ],
  },

  // ─── Post 36 ───────────────────────────────────────────────────────────────
  {
    slug: 'requisitos-oposiciones-auxiliar-administrativo-estado-2026',
    title: 'Requisitos oposiciones auxiliar administrativo del estado 2026: edad, titulación y documentación',
    description:
      'Todos los requisitos para presentarse a auxiliar administrativo del estado en 2026: nacionalidad, edad, estudios, documentación y cómo inscribirse.',
    date: '2026-03-19',
    dateModified: '2026-03-19',
    keywords: [
      'requisitos auxiliar administrativo estado',
      'quien puede presentarse auxiliar administrativo',
      'requisitos oposiciones AGE 2026',
      'titulacion auxiliar administrativo estado',
      'edad maxima oposiciones auxiliar administrativo',
      'como inscribirse oposiciones auxiliar administrativo',
    ],
    content: `
<h2>Requisitos para presentarse a auxiliar administrativo del estado en 2026</h2>
<p>
  Para presentarte a las oposiciones de Auxiliar Administrativo del Estado (grupo C2) necesitas
  cumplir <strong>5 requisitos obligatorios</strong> en la fecha de finalización del plazo de
  inscripción. Son accesibles: no hay límite de edad y basta con el título de ESO.
</p>

<h2>1. Nacionalidad</h2>
<p>
  Pueden presentarse:
</p>
<ul>
  <li><strong>Ciudadanos españoles</strong></li>
  <li><strong>Nacionales de la Unión Europea</strong> y del Espacio Económico Europeo (Noruega, Islandia, Liechtenstein)</li>
  <li><strong>Cónyuges de ciudadanos UE</strong> (no separados de derecho) y sus descendientes menores de 21 años o dependientes</li>
  <li><strong>Personas incluidas en tratados internacionales</strong> ratificados por España que permitan libre circulación de trabajadores</li>
</ul>
<p>
  En la práctica, cualquier ciudadano de la UE o con derecho de residencia y trabajo en España
  puede presentarse. Se necesita DNI o NIE en vigor.
</p>

<h2>2. Edad</h2>
<p>
  <strong>No hay límite máximo de edad</strong> para las oposiciones de auxiliar administrativo.
  El único requisito es tener al menos <strong>16 años cumplidos</strong> y no haber alcanzado
  la edad de jubilación forzosa (actualmente 65 años, ampliable según normativa de pensiones).
</p>
<p>
  Esto convierte a estas oposiciones en una de las opciones más accesibles del empleo público:
  puedes presentarte con 18 años recién graduado o con 55 años buscando estabilidad laboral.
</p>

<h2>3. Titulación</h2>
<p>
  Se exige estar en posesión del <strong>título de Graduado en Educación Secundaria Obligatoria (ESO)</strong>
  o equivalente. Títulos equivalentes aceptados:
</p>
<ul>
  <li>Graduado Escolar (EGB, plan antiguo)</li>
  <li>Técnico (FP Grado Medio)</li>
  <li>Bachiller elemental</li>
  <li>Cualquier título de nivel superior (Bachillerato, Grado universitario, etc.)</li>
  <li>Certificado de haber superado las pruebas de acceso a FP de Grado Medio</li>
</ul>
<p>
  Si obtuviste tu título en el extranjero, necesitas la <strong>homologación oficial</strong>
  del Ministerio de Educación. Este trámite puede tardar varios meses, así que solicítalo con antelación.
</p>

<h2>4. Capacidad funcional</h2>
<p>
  Debes poseer la <strong>capacidad funcional</strong> para el desempeño de las tareas del puesto.
  No se exige un reconocimiento médico específico para la inscripción, pero el tribunal puede
  requerir un certificado médico si hay dudas.
</p>
<p>
  Las personas con discapacidad reconocida ≥33% pueden optar al cupo de reserva de plazas
  (normalmente un 7% de las plazas convocadas) y tienen derecho a adaptaciones en el examen
  (tiempo adicional, formato ampliado, etc.).
</p>

<h2>5. Habilitación: no haber sido separado del servicio</h2>
<p>
  No puedes presentarte si has sido <strong>separado del servicio</strong> de cualquier
  administración pública mediante expediente disciplinario, ni si estás inhabilitado para
  el ejercicio de funciones públicas. Este requisito afecta a muy pocas personas.
</p>

<h2>Resumen de requisitos</h2>
<table>
  <thead>
    <tr>
      <th>Requisito</th>
      <th>Detalle</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Nacionalidad</td>
      <td>Española, UE, EEE o con derecho de libre circulación</td>
    </tr>
    <tr>
      <td>Edad</td>
      <td>Mínimo 16 años, sin límite máximo (hasta jubilación forzosa)</td>
    </tr>
    <tr>
      <td>Titulación</td>
      <td>ESO, Graduado Escolar, FP Grado Medio o superior</td>
    </tr>
    <tr>
      <td>Capacidad funcional</td>
      <td>Apta para las tareas del puesto</td>
    </tr>
    <tr>
      <td>Habilitación</td>
      <td>No separado del servicio ni inhabilitado</td>
    </tr>
  </tbody>
</table>

<h2>Cómo inscribirse: paso a paso</h2>

<h3>Paso 1: obtener certificado digital o Cl@ve</h3>
<p>
  La inscripción es telemática. Necesitas un <strong>certificado digital</strong> (FNMT),
  <strong>DNI electrónico</strong> o sistema <strong>Cl@ve permanente</strong>.
  Si no tienes ninguno, solicita Cl@ve en tu oficina de la Seguridad Social o Hacienda
  (lleva DNI, tardan 5 minutos).
</p>

<h3>Paso 2: acceder al Portal 060</h3>
<p>
  Entra en <strong>administracion.gob.es</strong> → Empleo Público → Inscripción pruebas selectivas.
  Busca la convocatoria de "Auxiliar Administrativo del Estado" o el código del cuerpo (C2).
</p>

<h3>Paso 3: rellenar la solicitud (modelo 790)</h3>
<p>
  Completa el formulario con tus datos personales, titulación, provincia de examen preferida
  y si solicitas exención o reducción de tasa. Selecciona la forma de pago.
</p>

<h3>Paso 4: pagar la tasa de inscripción</h3>
<table>
  <thead>
    <tr>
      <th>Situación</th>
      <th>Tasa</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>General</td>
      <td>11,32€</td>
    </tr>
    <tr>
      <td>Familia numerosa categoría general</td>
      <td>5,66€ (50%)</td>
    </tr>
    <tr>
      <td>Familia numerosa categoría especial</td>
      <td>Exenta</td>
    </tr>
    <tr>
      <td>Discapacidad ≥33%</td>
      <td>Exenta</td>
    </tr>
    <tr>
      <td>Víctimas de terrorismo</td>
      <td>Exenta</td>
    </tr>
    <tr>
      <td>Demandantes de empleo de larga duración</td>
      <td>Exenta</td>
    </tr>
  </tbody>
</table>
<p>
  El pago se realiza online con tarjeta bancaria o generando un documento para pagar en entidad
  bancaria. <strong>Guarda el justificante:</strong> sin él, la inscripción no es válida.
</p>

<h3>Paso 5: confirmar y guardar resguardo</h3>
<p>
  Tras enviar la solicitud y pagar, descarga el <strong>resguardo de inscripción</strong> en PDF.
  Guárdalo en un lugar seguro — lo necesitarás si hay incidencias con la lista de admitidos.
</p>

<h2>Documentación necesaria el día del examen</h2>
<ul>
  <li><strong>DNI o NIE</strong> en vigor (obligatorio, sin él no puedes examinarte)</li>
  <li><strong>Resguardo de inscripción</strong> (recomendable, por si hay dudas)</li>
  <li>Bolígrafo negro o azul (suelen proporcionar la hoja de respuestas)</li>
  <li>Reloj analógico (los smartwatches no están permitidos)</li>
  <li>Botella de agua transparente sin etiqueta</li>
</ul>

<h2>Plazos clave para la convocatoria 2026</h2>
<p>
  El examen está fijado para el <strong>23 de mayo de 2026</strong>. Consulta el
  <a href="/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo">calendario completo</a>
  para conocer todas las fechas de inscripción, admitidos y resultados. Si aún no has empezado
  a estudiar, la <a href="/blog/guia-completa-oposicion-auxiliar-administrativo-estado-2026">guía completa
  de la oposición</a> te orienta sobre temario, estrategia y recursos.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026. Basado en las bases de convocatorias AGE vigentes.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Hay límite de edad para presentarse a auxiliar administrativo del estado?', answer: 'No. No hay límite máximo de edad. Solo necesitas tener al menos 16 años y no haber alcanzado la edad de jubilación forzosa (actualmente 65 años). Puedes presentarte con 18, 35, 50 o 60 años sin restricciones.' },
      { question: '¿Qué estudios necesito para ser auxiliar administrativo del estado?', answer: 'El título mínimo es Graduado en ESO (o equivalente: Graduado Escolar, FP Grado Medio, Bachiller elemental). También vale cualquier título superior (Bachillerato, Grado universitario). Si tu título es extranjero, necesitas homologación del Ministerio de Educación.' },
      { question: '¿Cuánto cuesta inscribirse en las oposiciones de auxiliar administrativo?', answer: 'La tasa general es de 11,32€. Hay descuento del 50% para familias numerosas de categoría general (5,66€) y exención total para familias numerosas especiales, discapacidad ≥33%, víctimas de terrorismo y demandantes de empleo de larga duración.' },
      { question: '¿Pueden presentarse extranjeros a las oposiciones de auxiliar administrativo?', answer: 'Sí, los nacionales de la Unión Europea, del Espacio Económico Europeo y sus familiares directos pueden presentarse en las mismas condiciones que los españoles. Se necesita NIE en vigor.' },
      { question: '¿Cómo me inscribo en las oposiciones de auxiliar administrativo 2026?', answer: 'La inscripción es telemática a través del Portal 060 (administracion.gob.es). Necesitas certificado digital, DNI electrónico o Cl@ve permanente. Rellenas el modelo 790, pagas la tasa (11,32€ o exenta) y guardas el resguardo. El plazo suele ser de 20 días hábiles desde la publicación en el BOE.' },
    ],
  },

  // ─── Post 37 ───────────────────────────────────────────────────────────────
  {
    slug: 'ultimos-60-dias-administrativo-estado-c1-plan-estudio',
    title: 'Últimos 60 días para el Administrativo del Estado (C1): plan de estudio intensivo',
    description:
      'Plan semana a semana para preparar el examen de Administrativo del Estado C1 del 23 de mayo de 2026. Priorización de bloques, simulacros y supuesto práctico en 60 días.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'plan estudio administrativo estado c1',
      'últimos 60 días oposición c1',
      'preparar administrativo estado 2 meses',
      'plan intensivo oposiciones c1',
      'sprint final administrativo estado',
      'examen administrativo estado mayo 2026',
      'cómo aprobar c1 en poco tiempo',
    ],
    content: `
<h2>¿Se puede aprobar el Administrativo del Estado (C1) en 60 días?</h2>
<p>
  Quedan menos de dos meses para el <strong>23 de mayo de 2026</strong>. Con <strong>2.512 plazas</strong>
  convocadas y un examen que combina 70 preguntas tipo test + 20 de supuesto práctico (100 minutos en total),
  la pregunta es inevitable: ¿da tiempo?
</p>
<p>
  La respuesta honesta: <strong>depende de tu punto de partida</strong>. Si ya has estudiado parte del temario
  (los 45 temas), 60 días bien planificados pueden ser suficientes para superar la nota de corte (47,33 puntos
  en la última convocatoria de 2024). Si empiezas de cero, será un reto extremo — pero no imposible si
  priorizas con inteligencia.
</p>
<p>
  Este plan asume que puedes dedicar <strong>4-6 horas diarias</strong> (incluyendo fines de semana) y que
  tienes acceso al temario actualizado. Si ya has cubierto algún bloque, ajusta las semanas para reforzar
  donde más fallas. Consulta nuestra
  <a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">guía de priorización de los 45 temas</a>
  para entender la lógica de pesos por bloque.
</p>

<h2>¿Qué bloques priorizar en un sprint de 60 días?</h2>
<p>
  El temario del C1 tiene <strong>6 bloques</strong>, pero no todos pesan igual en el examen. Basándonos en
  las convocatorias anteriores, la distribución aproximada de preguntas es:
</p>

<table>
  <thead>
    <tr>
      <th>Bloque</th>
      <th>Temas</th>
      <th>Peso estimado</th>
      <th>Prioridad sprint</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>I — Organización del Estado</td>
      <td>12 temas</td>
      <td>~20%</td>
      <td>Media-alta</td>
    </tr>
    <tr>
      <td>II — Administración General del Estado</td>
      <td>7 temas</td>
      <td>~12%</td>
      <td>Media</td>
    </tr>
    <tr>
      <td>III — Derecho Administrativo</td>
      <td>11 temas</td>
      <td>~25%</td>
      <td><strong>Máxima</strong></td>
    </tr>
    <tr>
      <td>IV — Gestión de personal</td>
      <td>5 temas</td>
      <td>~10%</td>
      <td>Media</td>
    </tr>
    <tr>
      <td>V — Gestión financiera</td>
      <td>7 temas</td>
      <td>~20%</td>
      <td><strong>Alta</strong></td>
    </tr>
    <tr>
      <td>VI — Informática</td>
      <td>3 temas</td>
      <td>~13%</td>
      <td>Alta (rentable)</td>
    </tr>
  </tbody>
</table>

<p>
  La estrategia es clara: <strong>Bloque III (Derecho Administrativo) es tu prioridad absoluta</strong>.
  Concentra la mayor cantidad de preguntas y es la base del supuesto práctico. Le sigue el
  <strong>Bloque V (Gestión financiera)</strong>, que aporta muchos puntos con temas relativamente
  acotados (Ley General Presupuestaria, contratación, subvenciones). El <strong>Bloque VI (Informática)</strong>
  es el más rentable en ratio puntos/horas: solo 3 temas pero ~13% del examen.
</p>

<h2>Plan semana a semana: las 8 semanas clave</h2>

<h3>Semanas 1-2 (23 marzo — 5 abril): Bloque III completo</h3>
<p>
  Dedica estas dos semanas exclusivamente al <strong>Derecho Administrativo</strong>: Ley 39/2015 (procedimiento
  administrativo común), Ley 40/2015 (régimen jurídico), recursos administrativos, revisión de oficio,
  responsabilidad patrimonial. Son 11 temas densos pero fundamentales.
</p>
<ul>
  <li><strong>Mañana (3h):</strong> estudio teórico de 1 tema completo con esquemas</li>
  <li><strong>Tarde (2h):</strong> test de 15-20 preguntas del tema estudiado + repaso del tema anterior</li>
  <li><strong>Sábados:</strong> simulacro parcial (solo Bloque III) cronometrado</li>
  <li><strong>Domingos:</strong> repaso de errores + fichas de artículos clave</li>
</ul>

<h3>Semanas 3-4 (6-19 abril): Bloque V + Bloque VI</h3>
<p>
  <strong>Gestión financiera</strong> (7 temas): Ley General Presupuestaria (arts. 32-52 son clave),
  Ley de Contratos del Sector Público, Ley General de Subvenciones. Combina con el
  <strong>Bloque VI (Informática)</strong>, que al ser solo 3 temas se puede integrar sin perder ritmo.
</p>
<ul>
  <li><strong>L-V:</strong> 1 tema de Bloque V por día (mañana) + tests (tarde)</li>
  <li><strong>Viernes tarde:</strong> 1 tema de Bloque VI (más ligero, buen cierre de semana)</li>
  <li><strong>Fines de semana:</strong> simulacro completo de 70 preguntas + corrección</li>
</ul>

<h3>Semana 5 (20-26 abril): Bloque I — lo esencial</h3>
<p>
  <strong>Organización del Estado</strong> tiene 12 temas, pero en una semana solo puedes cubrir
  los más rentables: Constitución (Título Preliminar, derechos fundamentales, Tribunal Constitucional),
  Corona, Cortes Generales y Gobierno. Deja los temas de organización territorial y UE para repaso
  superficial la última semana.
</p>

<h3>Semana 6 (27 abril — 3 mayo): Bloques II + IV</h3>
<p>
  <strong>AGE</strong> (7 temas) y <strong>Gestión de personal</strong> (5 temas). Son 12 temas con
  contenido muy memorístico (EBEP, situaciones administrativas, incompatibilidades). Prioriza los
  artículos que más preguntan: permisos, excedencias, faltas disciplinarias.
</p>

<h3>Semanas 7-8 (4-22 mayo): Supuesto práctico + simulacros finales</h3>
<p>
  Las dos últimas semanas son para <strong>consolidar y simular</strong>:
</p>
<ul>
  <li><strong>Cada mañana:</strong> 1 supuesto práctico cronometrado (20 preguntas sobre un caso, ~30 min)</li>
  <li><strong>Cada tarde:</strong> repaso de bloques débiles según resultados de simulacros</li>
  <li><strong>Miércoles y sábados:</strong> simulacro completo (70 test + 20 supuesto, 100 min)</li>
  <li><strong>Últimos 3 días:</strong> solo repaso de esquemas y fichas. Nada nuevo.</li>
</ul>
<p>
  Para la estrategia completa del supuesto práctico, consulta nuestra
  <a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">guía de supuesto práctico del C1</a>.
</p>

<h2>¿Cuántas horas diarias necesito para aprobar en 60 días?</h2>
<p>
  Un cálculo realista: 45 temas × 5 horas de estudio efectivo por tema = <strong>225 horas de estudio puro</strong>.
  Añade 75 horas para simulacros, repasos y supuestos prácticos = <strong>300 horas totales</strong>.
</p>
<p>
  300 horas ÷ 60 días = <strong>5 horas diarias</strong>, sin descanso. Si descansas 1 día por semana
  (recomendable), necesitas ~5,8 horas los días de estudio. Es exigente pero viable si tienes
  dedicación exclusiva o jornada laboral reducida.
</p>
<p>
  Si trabajas a jornada completa, el plan se complica. Necesitarás <strong>3 horas mañana + 2 horas noche</strong>
  entre semana y sesiones largas los fines de semana. Lee nuestra guía sobre
  <a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">cómo preparar el C1 por libre</a>
  para más estrategias de compatibilización.
</p>

<h2>¿Qué temas puedo saltarme sin arriesgar demasiado?</h2>
<p>
  En un sprint de 60 días, intentar dominar los 45 temas es un error. La estrategia inteligente es
  <strong>cubrir el 80% del temario a un nivel suficiente</strong> en lugar del 100% de forma superficial.
  Los temas que puedes dejar para un repaso ligero (no eliminar):
</p>
<ul>
  <li><strong>Organización territorial del Estado</strong> (temas 10-12 del Bloque I): comunidades autónomas, administración local — suelen caer 2-3 preguntas como máximo</li>
  <li><strong>Unión Europea</strong> (tema 12 o similar): aparece poco y es muy extenso</li>
  <li><strong>Convenios y colaboración interadministrativa</strong>: baja frecuencia</li>
</ul>
<p>
  <strong>Nunca saltes:</strong> Ley 39/2015, Ley 40/2015, Constitución (Título Preliminar + derechos fundamentales),
  Ley General Presupuestaria ni EBEP. Son el núcleo duro del examen.
</p>

<h2>¿Cómo preparar el supuesto práctico en solo 2-3 semanas?</h2>
<p>
  El supuesto práctico son 20 preguntas tipo test sobre un caso práctico (normalmente un expediente
  administrativo). La clave es que <strong>el 80% de las preguntas se basan en el Bloque III</strong>
  (procedimiento administrativo, plazos, recursos, notificaciones).
</p>
<p>
  Si has seguido el plan y has empezado por el Bloque III, ya tienes la base. Lo que necesitas
  practicar es el <strong>formato</strong>: leer un caso de 1-2 páginas, identificar los hechos
  jurídicos relevantes y contestar bajo presión de tiempo.
</p>
<ul>
  <li>Practica <strong>al menos 10 supuestos</strong> antes del examen</li>
  <li>Cronométrate siempre (30 minutos para 20 preguntas)</li>
  <li>Analiza cada error: ¿fue fallo de conocimiento o de lectura del caso?</li>
  <li>Los supuestos de convocatorias anteriores son oro puro</li>
</ul>

<h2>¿Merece la pena presentarse aunque no esté todo estudiado?</h2>
<p>
  <strong>Sí, siempre.</strong> Presentarse al examen es una inversión, no un gasto:
</p>
<ul>
  <li><strong>Experiencia real de examen</strong> que ningún simulacro iguala</li>
  <li><strong>Control del estrés:</strong> la primera vez es la peor. Si ya conoces el formato, la segunda será mejor</li>
  <li><strong>Efecto lista:</strong> ver dónde te quedas respecto a la nota de corte te da un objetivo concreto</li>
  <li><strong>Las plazas no se pierden:</strong> con 2.512 plazas, la nota de corte puede ser más baja que en convocatorias más restrictivas</li>
</ul>
<p>
  Con la nota de corte de 2024 en <strong>47,33 puntos sobre 90</strong>, necesitas acertar
  aproximadamente el 53% de las preguntas (descontando penalización). Es ambicioso pero alcanzable
  con un sprint bien ejecutado.
</p>

<h2>Herramientas para maximizar el rendimiento en 60 días</h2>
<p>
  El tiempo es tu recurso más escaso. Cada minuto debe generar el máximo aprendizaje posible:
</p>
<ul>
  <li><strong>Tests por tema:</strong> haz al menos 20 preguntas por tema estudiado para fijar conceptos</li>
  <li><strong>Simulacros cronometrados:</strong> mínimo 1 por semana, 2 en las últimas semanas</li>
  <li><strong>Repaso de errores:</strong> los fallos repetidos son la señal de dónde poner el foco</li>
  <li><strong>Flashcards de artículos clave:</strong> plazos, cuantías y porcentajes que siempre preguntan</li>
</ul>
<p>
  En <a href="/">OpoRuta</a> puedes generar tests específicos por tema con corrección detallada,
  hacer simulacros con preguntas de convocatorias reales y revisar tus errores con explicaciones
  artículo por artículo. Los datos de
  <a href="/blog/nota-corte-administrativo-estado-c1-como-se-calcula">nota de corte del C1</a>
  te ayudan a saber exactamente cuánto necesitas.
</p>
<p>
  <strong>Quedan 60 días. Es suficiente para marcar la diferencia entre aprobar y quedarse fuera.</strong>
  <a href="/register">Empieza tu plan intensivo ahora</a> y llega al 23 de mayo con la mejor preparación posible.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Se puede aprobar el Administrativo del Estado C1 en 2 meses?', answer: 'Es posible pero exigente. Con 4-6 horas diarias de estudio efectivo (unas 300 horas totales), un plan bien priorizado y experiencia previa con el temario jurídico, puedes alcanzar la nota de corte (47,33 en 2024). La clave es priorizar los bloques con más peso (Derecho Administrativo, Gestión financiera) y no intentar dominar los 45 temas por igual.' },
      { question: '¿Cuántas horas al día necesito para preparar el C1 en 60 días?', answer: 'Un mínimo de 5 horas diarias si estudias todos los días, o 5-6 horas con un día de descanso semanal. Esto suma unas 300 horas: 225 de estudio teórico (5h × 45 temas) + 75 de simulacros, repasos y supuestos prácticos. Si trabajas a jornada completa, necesitarás repartir entre mañana y noche.' },
      { question: '¿Qué temas puedo saltarme del C1 si no tengo tiempo?', answer: 'Puedes hacer un repaso superficial (no eliminar) de: organización territorial del Estado, Unión Europea y convenios interadministrativos. Nunca saltes Ley 39/2015, Ley 40/2015, Constitución (Título Preliminar y derechos fundamentales), Ley General Presupuestaria ni EBEP — son el núcleo del examen y del supuesto práctico.' },
      { question: '¿Cuál es la mejor estrategia para el supuesto práctico del C1 en poco tiempo?', answer: 'El 80% del supuesto práctico se basa en el Bloque III (procedimiento administrativo). Si priorizas ese bloque las dos primeras semanas, ya tienes la base. Luego practica al menos 10 supuestos cronometrados (30 min para 20 preguntas) en las 2-3 últimas semanas. Analiza cada error: distingue fallos de conocimiento vs. fallos de lectura del caso.' },
      { question: '¿Merece la pena presentarse al C1 sin haber terminado de estudiar?', answer: 'Sí, siempre. Te da experiencia real de examen, control del estrés y una referencia de tu nivel respecto a la nota de corte. Con 2.512 plazas convocadas, la nota de corte puede ser más accesible. Además, acertar el 53% de las preguntas (descontando penalización) puede ser suficiente para aprobar.' },
      { question: '¿Es mejor estudiar todos los temas superficialmente o pocos en profundidad?', answer: 'Ni uno ni otro: la estrategia óptima es cubrir el 80% del temario a nivel suficiente para acertar la mayoría de preguntas, y profundizar en los bloques de mayor peso (Bloque III y V). Un tema dominado al 70% aporta más puntos que dos temas estudiados al 30%.' },
    ],
  },

  // ─── Post 38 ───────────────────────────────────────────────────────────────
  {
    slug: 'sueldo-administrativo-estado-c1-2026-nomina',
    title: 'Sueldo Administrativo del Estado (C1) en 2026: nómina real desglosada',
    description:
      'Desglose completo de la nómina de un Administrativo del Estado C1 en 2026: sueldo base, complementos, trienios, pagas extras y salario neto mensual.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'sueldo administrativo estado c1',
      'nómina administrativo estado 2026',
      'cuánto cobra administrativo estado',
      'salario funcionario c1',
      'complementos administrativo estado',
      'trienios funcionario c1',
      'sueldo neto administrativo estado',
    ],
    content: `
<h2>¿Cuánto cobra un Administrativo del Estado (C1) en 2026?</h2>
<p>
  El sueldo de un funcionario del Cuerpo General Administrativo de la Administración del Estado (subgrupo C1)
  se compone de varias partidas fijas y variables. No es un "salario" único como en el sector privado:
  es una <strong>retribución estructurada</strong> regulada por los Presupuestos Generales del Estado
  y el Real Decreto Legislativo 5/2015 (TREBEP).
</p>
<p>
  La buena noticia: el salario es <strong>público, predecible y crece con la antigüedad</strong>.
  Veamos la nómina real desglosada.
</p>

<h2>¿Cuál es el desglose de la nómina de un Administrativo C1?</h2>
<p>
  Las retribuciones se dividen en <strong>básicas</strong> (iguales para todos los C1) y
  <strong>complementarias</strong> (varían según destino y puesto). Estos son los importes
  vigentes en 2026 según los PGE:
</p>

<table>
  <thead>
    <tr>
      <th>Concepto</th>
      <th>Mensual (€)</th>
      <th>Anual (€)</th>
      <th>Tipo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sueldo base (grupo C1)</td>
      <td>731,76</td>
      <td>10.244,64</td>
      <td>Básica</td>
    </tr>
    <tr>
      <td>Complemento de destino (nivel 18)</td>
      <td>527,04</td>
      <td>6.324,48</td>
      <td>Complementaria</td>
    </tr>
    <tr>
      <td>Complemento específico</td>
      <td>300 — 600</td>
      <td>4.200 — 8.400</td>
      <td>Complementaria</td>
    </tr>
    <tr>
      <td>Productividad</td>
      <td>50 — 200</td>
      <td>700 — 2.800</td>
      <td>Variable</td>
    </tr>
    <tr>
      <td><strong>Total bruto (sin trienios)</strong></td>
      <td><strong>1.609 — 2.059</strong></td>
      <td><strong>21.469 — 27.769</strong></td>
      <td></td>
    </tr>
  </tbody>
</table>

<p>
  <strong>Nota importante:</strong> el nivel 18 es el nivel de complemento de destino de entrada
  para un C1. Puede subir hasta el nivel 22 con la carrera profesional (cambio de puesto,
  concursos de traslados, promoción).
</p>

<h2>¿Qué son las pagas extras y cuántas cobra un funcionario C1?</h2>
<p>
  Los funcionarios cobran <strong>14 pagas al año</strong>: 12 mensuales + 2 pagas extraordinarias
  (junio y diciembre). Las pagas extras incluyen el sueldo base + complemento de destino,
  pero <strong>no</strong> incluyen el complemento específico ni la productividad.
</p>
<p>
  Cada paga extra equivale a: 731,76€ (sueldo base) + 527,04€ (complemento destino nivel 18) =
  <strong>1.258,80€ brutos</strong> por paga extra. Total pagas extras: 2.517,60€/año.
</p>
<p>
  Esto significa que el <strong>bruto anual real</strong> (con pagas extras) oscila entre
  <strong>23.987€ y 30.287€</strong> dependiendo del complemento específico y la productividad del puesto.
</p>

<h2>¿Qué son los trienios y cuánto suman?</h2>
<p>
  Los <strong>trienios</strong> son un complemento de antigüedad que se cobra por cada 3 años
  de servicio activo como funcionario. Para el subgrupo C1, cada trienio vale
  <strong>42,24€/mes</strong> (según PGE vigentes).
</p>

<table>
  <thead>
    <tr>
      <th>Antigüedad</th>
      <th>Trienios</th>
      <th>Incremento mensual</th>
      <th>Incremento anual</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>3 años</td>
      <td>1</td>
      <td>+42,24€</td>
      <td>+591,36€</td>
    </tr>
    <tr>
      <td>6 años</td>
      <td>2</td>
      <td>+84,48€</td>
      <td>+1.182,72€</td>
    </tr>
    <tr>
      <td>9 años</td>
      <td>3</td>
      <td>+126,72€</td>
      <td>+1.774,08€</td>
    </tr>
    <tr>
      <td>15 años</td>
      <td>5</td>
      <td>+211,20€</td>
      <td>+2.956,80€</td>
    </tr>
    <tr>
      <td>30 años</td>
      <td>10</td>
      <td>+422,40€</td>
      <td>+5.913,60€</td>
    </tr>
  </tbody>
</table>

<p>
  Un Administrativo con 15 años de antigüedad cobra <strong>~211€/mes más</strong> que uno que acaba de
  entrar, solo por trienios. A los 30 años, son 422€ extra mensuales — un incremento significativo
  que no existe en la mayoría de empleos privados.
</p>

<h2>¿Cuánto queda neto al mes como Administrativo C1?</h2>
<p>
  Las deducciones principales son IRPF (que depende de la comunidad autónoma y la situación personal)
  y cotizaciones a Muface (derechos pasivos + cuota de mutualidad, ~3,5% del sueldo base).
  Una estimación realista del <strong>salario neto mensual</strong>:
</p>

<table>
  <thead>
    <tr>
      <th>Perfil</th>
      <th>Bruto mensual</th>
      <th>IRPF + Muface</th>
      <th>Neto estimado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Entrada (nivel 18, sin trienios)</td>
      <td>~1.609€</td>
      <td>~15%</td>
      <td><strong>~1.370€</strong></td>
    </tr>
    <tr>
      <td>5 años (1 trienio, nivel 18)</td>
      <td>~1.700€</td>
      <td>~16%</td>
      <td><strong>~1.430€</strong></td>
    </tr>
    <tr>
      <td>Puesto medio (nivel 20, comp. específico alto)</td>
      <td>~2.100€</td>
      <td>~18%</td>
      <td><strong>~1.720€</strong></td>
    </tr>
    <tr>
      <td>Senior (nivel 22, 5 trienios)</td>
      <td>~2.450€</td>
      <td>~20%</td>
      <td><strong>~1.960€</strong></td>
    </tr>
  </tbody>
</table>

<p>
  El rango neto real va de <strong>1.370€ a 2.100€ mensuales</strong> dependiendo de la antigüedad,
  el nivel del puesto y el organismo. Las 14 pagas distribuyen el ingreso anual de forma más homogénea
  que los 12 meses del sector privado.
</p>

<h2>¿Cuánto más cobra un C1 que un C2 (Auxiliar)?</h2>
<p>
  La diferencia salarial entre un Administrativo (C1) y un Auxiliar Administrativo (C2) es
  significativa — y crece con el tiempo:
</p>

<table>
  <thead>
    <tr>
      <th>Concepto</th>
      <th>C1 (Administrativo)</th>
      <th>C2 (Auxiliar)</th>
      <th>Diferencia</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sueldo base</td>
      <td>731,76€</td>
      <td>625,33€</td>
      <td>+106,43€</td>
    </tr>
    <tr>
      <td>Complemento destino entrada</td>
      <td>527,04€ (nivel 18)</td>
      <td>440,81€ (nivel 15)</td>
      <td>+86,23€</td>
    </tr>
    <tr>
      <td>Trienio</td>
      <td>42,24€</td>
      <td>33,79€</td>
      <td>+8,45€</td>
    </tr>
    <tr>
      <td>Neto entrada estimado</td>
      <td>~1.370€</td>
      <td>~1.180€</td>
      <td><strong>+190€/mes</strong></td>
    </tr>
    <tr>
      <td>Neto 15 años estimado</td>
      <td>~1.720€</td>
      <td>~1.400€</td>
      <td><strong>+320€/mes</strong></td>
    </tr>
  </tbody>
</table>

<p>
  A la entrada, la diferencia ronda los <strong>190€ netos mensuales</strong>. Pero con los años se amplía
  por la diferencia en trienios y niveles máximos alcanzables (22 para C1 vs. 18 para C2). A los 15 años
  puede superar los <strong>300€/mes</strong> — más de 4.000€ anuales.
  Si te interesa conocer más a fondo las diferencias entre ambos cuerpos, consulta nuestro
  <a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">análisis detallado C1 vs. C2</a>.
</p>

<h2>¿Qué destinos pagan mejor al Administrativo C1?</h2>
<p>
  El sueldo base y el complemento de destino son idénticos en toda España, pero el
  <strong>complemento específico</strong> varía enormemente según el organismo:
</p>
<ul>
  <li><strong>AEAT (Agencia Tributaria):</strong> complementos específicos entre los más altos de la AGE. Un C1 en AEAT puede cobrar 400-600€/mes más en específico que la media.</li>
  <li><strong>Ministerio del Interior:</strong> algunos puestos tienen complementos de penosidad y peligrosidad que suman 200-400€ adicionales.</li>
  <li><strong>SEPE:</strong> complementos competitivos, aunque alta carga de trabajo en oficinas de empleo.</li>
  <li><strong>Seguridad Social (TGSS, INSS):</strong> específicos altos y estabilidad, uno de los destinos más solicitados.</li>
  <li><strong>Ministerios pequeños (Cultura, Ciencia):</strong> complementos más modestos, pero a menudo mejor conciliación y teletrabajo.</li>
</ul>
<p>
  La diferencia entre el destino que mejor paga y el que peor paga puede superar los
  <strong>500€ mensuales netos</strong>. Merece la pena investigar antes de elegir. Toda la información
  relevante sobre plazas, temario y nota de corte está en nuestra
  <a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">guía completa del C1 2026</a>.
</p>

<h2>¿Es el sueldo de un C1 suficiente para vivir en Madrid?</h2>
<p>
  Madrid concentra la mayoría de las plazas en servicios centrales. Con un neto de entrada de
  ~1.370€ y alquileres medios de 900-1.200€ para un piso compartido (500-700€ por habitación),
  <strong>es justo pero viable</strong> — especialmente si compartes piso los primeros años.
</p>
<p>
  La clave está en la <strong>progresión</strong>: a los 5-10 años, con trienios y subida de nivel,
  el neto alcanza los 1.600-1.800€. Y el funcionario tiene ventajas que no cotizan en nómina:
</p>
<ul>
  <li><strong>Estabilidad absoluta:</strong> plaza vitalicia, sin EREs ni despidos</li>
  <li><strong>Muface:</strong> cobertura sanitaria pública + opción de seguro privado (Adeslas, DKV, etc.) sin coste adicional</li>
  <li><strong>Horario:</strong> jornada de 37,5h/semana con flexibilidad horaria real (entrada 7:30-9:00 en muchos centros)</li>
  <li><strong>Vacaciones:</strong> 22 días hábiles + hasta 6 días de asuntos propios + festivos + puentes</li>
  <li><strong>Teletrabajo:</strong> 2-3 días/semana en muchos puestos desde 2021</li>
  <li><strong>Excedencias y permisos:</strong> excedencia por cuidado de hijos hasta 3 años con reserva de puesto</li>
</ul>
<p>
  Sumando estos beneficios, el paquete retributivo real de un C1 equivale a un salario bruto privado
  de <strong>30.000-38.000€</strong> — significativamente por encima de lo que sugiere la nómina a primera vista.
</p>

<h2>Progresión salarial: cómo crece tu nómina como Administrativo</h2>
<p>
  El salario de un funcionario C1 no se estanca. Estas son las principales vías de crecimiento:
</p>
<ul>
  <li><strong>Trienios automáticos:</strong> +42,24€/mes cada 3 años, sin hacer nada</li>
  <li><strong>Cambio de nivel de destino:</strong> del 18 inicial puedes subir al 20, 21 o 22 mediante concursos de méritos</li>
  <li><strong>Cambio a puesto con mayor específico:</strong> concursos de traslados a organismos con complementos más altos</li>
  <li><strong>Promoción interna a A2:</strong> con titulación universitaria puedes opositar internamente al subgrupo A2 (Gestión), con sueldo base de 907,44€/mes</li>
</ul>
<p>
  Un C1 que comienza con ~1.370€ netos puede alcanzar los <strong>2.000-2.100€ netos</strong> en 15-20 años
  sin promocionar — solo con trienios y cambios de nivel y puesto. Si promociona a A2, el techo
  sube considerablemente.
</p>

<h2>¿Es un buen sueldo para una oposición de subgrupo C1?</h2>
<p>
  El C1 ofrece la mejor relación <strong>requisitos de acceso vs. retribución</strong> de toda la AGE.
  Solo necesitas Bachillerato o equivalente para acceder a un empleo público con 14 pagas, estabilidad
  total y progresión garantizada. Comparado con el sector privado, donde un perfil administrativo
  con Bachillerato raramente supera los 18.000-22.000€ brutos anuales, el C1 parte de
  <strong>~24.000€ brutos con techo superior a 30.000€</strong>.
</p>
<p>
  Si estás pensando en presentarte a la convocatoria de <strong>2.512 plazas</strong> del 23 de mayo de 2026,
  ahora es el momento de empezar a preparar. Con el temario priorizado y simulacros reales,
  puedes optimizar tu estudio para llegar con la mejor preparación posible.
</p>
<p>
  <strong><a href="/register">Empieza gratis en OpoRuta</a></strong> y practica con tests específicos
  por tema, simulacros de convocatorias reales y análisis detallados de tus errores.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuánto cobra un Administrativo del Estado C1 al mes?', answer: 'El salario neto mensual de un Administrativo C1 de entrada oscila entre 1.370€ y 1.500€, dependiendo del complemento específico del puesto. Con antigüedad y subida de nivel puede alcanzar los 1.700-2.100€ netos. Cobra 14 pagas al año (12 mensuales + 2 extras en junio y diciembre).' },
      { question: '¿Cuál es la diferencia de sueldo entre un C1 y un C2?', answer: 'A la entrada, un Administrativo C1 cobra aproximadamente 190€ netos más al mes que un Auxiliar C2 (1.370€ vs. 1.180€). La diferencia crece con los años: a los 15 años puede superar los 320€/mes (más de 4.000€ anuales) por la diferencia en trienios y niveles máximos alcanzables.' },
      { question: '¿Qué son los trienios de un funcionario C1?', answer: 'Los trienios son un complemento de antigüedad de 42,24€ mensuales por cada 3 años de servicio. Se cobran automáticamente, sin necesidad de solicitarlos. A los 15 años de servicio suman 211,20€/mes extra; a los 30 años, 422,40€/mes. Se incluyen también en las pagas extras.' },
      { question: '¿Qué destinos pagan mejor al Administrativo del Estado?', answer: 'Los organismos con mejores complementos específicos son la AEAT (Agencia Tributaria), la Seguridad Social (TGSS, INSS), el Ministerio del Interior y el SEPE. La diferencia entre el destino mejor y peor pagado puede superar los 500€ netos mensuales. El sueldo base y complemento de destino son idénticos en toda España.' },
      { question: '¿Se puede vivir en Madrid con el sueldo de un C1?', answer: 'Es justo pero viable al inicio (~1.370€ netos, con habitaciones a 500-700€). La progresión mejora: a los 5-10 años el neto alcanza 1.600-1.800€. Además, el paquete real incluye Muface (sanidad privada gratis), 22 días de vacaciones + asuntos propios, teletrabajo 2-3 días/semana y estabilidad total. El paquete equivale a 30.000-38.000€ brutos privados.' },
      { question: '¿Cuánto sube el sueldo de un Administrativo C1 con los años?', answer: 'Un C1 que entra con ~1.370€ netos puede alcanzar 2.000-2.100€ en 15-20 años sin promocionar, solo con trienios automáticos (+42,24€/mes cada 3 años) y cambios de nivel de destino (del 18 al 20-22). Si promociona internamente a A2 (con título universitario), el techo sube significativamente.' },
    ],
  },
  // ─── Post 39 ───────────────────────────────────────────────────────────────
  {
    slug: 'requisitos-administrativo-estado-c1-2026',
    title: 'Requisitos para opositar a Administrativo del Estado (C1) en 2026: guía completa',
    description:
      'Todos los requisitos para presentarte al Cuerpo General Administrativo C1 en 2026: titulación, edad, nacionalidad, inscripción, tasas y documentos necesarios.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'requisitos administrativo estado c1',
      'requisitos oposiciones c1 2026',
      'titulacion administrativo estado',
      'inscripcion oposiciones AGE c1',
      'requisitos age c1 2026',
    ],
    content: `
<h2>Requisitos generales para opositar a Administrativo del Estado (C1)</h2>
<p>
  Para acceder al Cuerpo General Administrativo de la Administración General del Estado (subgrupo C1),
  debes cumplir una serie de requisitos establecidos en el <strong>Real Decreto Legislativo 5/2015 (TREBEP)</strong>
  y especificados en la convocatoria publicada en el BOE. Estos requisitos deben cumplirse
  <strong>en la fecha de finalización del plazo de solicitudes</strong> y mantenerse hasta la toma de posesión.
</p>

<h2>1. Nacionalidad</h2>
<p>
  Puedes presentarte si tienes:
</p>
<ul>
  <li><strong>Nacionalidad española.</strong></li>
  <li>Nacionalidad de un <strong>Estado miembro de la UE</strong> o del Espacio Económico Europeo (Noruega, Islandia, Liechtenstein).</li>
  <li>Nacionalidad <strong>suiza</strong> (acuerdo bilateral con la UE).</li>
  <li>Ser <strong>cónyuge o descendiente menor de 21 años</strong> de un ciudadano UE/EEE (independientemente de tu nacionalidad).</li>
</ul>
<p>
  <strong>Importante:</strong> los nacionales de países no UE/EEE <strong>no pueden presentarse</strong> a esta oposición,
  salvo que tengan vínculo familiar directo con un ciudadano europeo.
</p>

<h2>2. Edad</h2>
<p>
  Debes tener al menos <strong>16 años</strong> y no haber alcanzado la <strong>edad de jubilación forzosa</strong>
  (actualmente 65 años, ampliable a 67 según la Ley 21/2021 de pensiones). En la práctica,
  si tienes entre 16 y 65 años, cumples este requisito.
</p>

<h2>3. Titulación: Bachillerato o equivalente</h2>
<p>
  Este es el requisito que más dudas genera. Para el subgrupo C1 necesitas <strong>una de estas titulaciones</strong>:
</p>
<ul>
  <li>Título de <strong>Bachillerato</strong> (LOE, LOGSE o anterior: BUP + COU).</li>
  <li><strong>Técnico Superior</strong> de Formación Profesional (FP Grado Superior / CFGS).</li>
  <li><strong>Técnico Especialista</strong> (FP2 del plan antiguo).</li>
  <li>Título universitario de <strong>Grado, Diplomatura o Licenciatura</strong> (cualquier titulación superior cubre C1).</li>
  <li>Títulos extranjeros <strong>homologados</strong> por el Ministerio de Educación al nivel equivalente.</li>
</ul>
<p>
  <strong>No vale</strong> con la ESO ni con un ciclo medio de FP (eso es para C2 Auxiliar). Si tienes dudas,
  consulta el <a href="https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/catalogo/gestion-titulos/estudios-no-universitarios/titulos-espanoles/equivalencia-titulos.html" target="_blank" rel="noopener">
  servicio de equivalencia de títulos</a> del Ministerio de Educación.
</p>

<h3>Diferencia clave con C2 Auxiliar</h3>
<table>
  <thead><tr><th>Requisito</th><th>C1 Administrativo</th><th>C2 Auxiliar</th></tr></thead>
  <tbody>
    <tr><td>Titulación mínima</td><td>Bachillerato / FP Superior</td><td>ESO / FP Medio</td></tr>
    <tr><td>Sueldo entrada (neto)</td><td>~1.370 €/mes</td><td>~1.180 €/mes</td></tr>
    <tr><td>Temario</td><td>~70 temas</td><td>~30 temas</td></tr>
    <tr><td>Plazas 2026</td><td>2.512</td><td>1.700</td></tr>
  </tbody>
</table>
<p>
  Consulta la guía completa de diferencias en
  <a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias entre Auxiliar C2 y Administrativo C1</a>.
</p>

<h2>4. Capacidad funcional</h2>
<p>
  Debes poseer la <strong>capacidad funcional</strong> para el desempeño de las tareas del cuerpo.
  No se exige una prueba médica previa, pero si en el reconocimiento médico posterior se detecta
  una incapacidad total para las funciones administrativas, podrían revocarte la plaza.
  Las personas con discapacidad reconocida ≥ 33 % pueden optar al <strong>cupo de reserva</strong>
  (normalmente un 7-10 % de las plazas).
</p>

<h2>5. Habilitación: no haber sido separado ni condenado</h2>
<p>No puedes presentarte si:</p>
<ul>
  <li>Has sido <strong>separado del servicio</strong> de cualquier Administración Pública mediante expediente disciplinario.</li>
  <li>Estás <strong>inhabilitado</strong> por sentencia judicial firme para el ejercicio de funciones públicas.</li>
</ul>
<p>
  En la práctica, los antecedentes penales cancelados <strong>no impiden</strong> presentarse.
  Solo la inhabilitación activa es excluyente.
</p>

<h2>6. Tasas de examen y exenciones</h2>
<p>
  La tasa de derechos de examen para C1 Administrativo es de <strong>11,32 €</strong> (convocatoria 2024-2026).
  Existen exenciones y bonificaciones:
</p>
<table>
  <thead><tr><th>Colectivo</th><th>Tasa</th></tr></thead>
  <tbody>
    <tr><td>Personas con discapacidad ≥ 33 %</td><td>0,00 € (exención total)</td></tr>
    <tr><td>Familias numerosas categoría especial</td><td>0,00 € (exención total)</td></tr>
    <tr><td>Familias numerosas categoría general</td><td>5,66 € (50 %)</td></tr>
    <tr><td>Víctimas de terrorismo (y cónyuges/hijos)</td><td>0,00 € (exención total)</td></tr>
    <tr><td>Demandantes de empleo (mín. 1 mes inscrito, sin rechazar oferta)</td><td>0,00 € (exención total)</td></tr>
    <tr><td>Resto de aspirantes</td><td>11,32 €</td></tr>
  </tbody>
</table>
<p>
  La exención debe acreditarse documentalmente. Si eres demandante de empleo, necesitas un
  <strong>certificado del SEPE</strong> que confirme tu inscripción y que no has rechazado ninguna oferta adecuada
  en el último mes.
</p>

<h2>7. Cómo inscribirse: Portal 060 y Cl@ve</h2>
<p>
  La inscripción se realiza <strong>exclusivamente online</strong> a través del
  <a href="https://ips.redsara.es/IPSC/secure/buscarConvocatorias" target="_blank" rel="noopener">Portal Funciona (060)</a>.
  Necesitas:
</p>
<ol>
  <li><strong>Certificado digital</strong>, <strong>DNI electrónico</strong> o <strong>Cl@ve permanente/PIN</strong>.</li>
  <li>Rellenar el formulario 790 (modelo de solicitud).</li>
  <li>Pagar la tasa (si procede) mediante cargo en cuenta o tarjeta.</li>
  <li>Descargar y guardar el <strong>justificante de presentación</strong>.</li>
</ol>
<p>
  <strong>Consejo:</strong> si no tienes Cl@ve, solicítala <strong>antes</strong> de que se abra el plazo de inscripción.
  El proceso de obtención puede tardar varios días si lo haces por vídeo-identificación.
</p>

<h2>8. Documentos necesarios</h2>
<ul>
  <li><strong>DNI/NIE</strong> en vigor (o pasaporte si eres ciudadano UE sin NIE).</li>
  <li><strong>Título académico</strong> o resguardo de haberlo solicitado.</li>
  <li><strong>Justificante de pago</strong> de la tasa (o documento acreditativo de la exención).</li>
  <li><strong>Certificado de discapacidad</strong> (si solicitas cupo de reserva o exención de tasa).</li>
  <li><strong>Certificado de familia numerosa</strong> (si solicitas bonificación).</li>
</ul>
<p>
  No es necesario presentar estos documentos en el momento de la inscripción; se presentan
  <strong>cuando se solicita</strong> o cuando pasas a la fase de acreditación de requisitos (tras aprobar).
</p>

<h2>9. ¿Se puede optar a C1 y C2 a la vez?</h2>
<p>
  <strong>No en 2026.</strong> El examen de Administrativo C1 y el de Auxiliar C2 se celebran el
  <strong>mismo día (23 de mayo de 2026)</strong>, a la misma hora. Debes elegir uno. No puedes inscribirte
  en ambos. Consulta las
  <a href="/blog/calendario-oposiciones-administrativo-estado-c1-2026">fechas completas del calendario C1</a>
  para planificar.
</p>

<h2>10. Plazos de la convocatoria 2026</h2>
<p>
  La convocatoria de <strong>2.512 plazas</strong> para Administrativo C1 fue publicada en el BOE.
  El plazo de inscripción ya ha cerrado. El examen está fijado para el <strong>23 de mayo de 2026</strong>.
  Consulta todos los detalles en nuestra
  <a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">guía completa de la convocatoria C1 2026</a>.
</p>

<h2>Resumen de requisitos</h2>
<table>
  <thead><tr><th>Requisito</th><th>Detalle</th></tr></thead>
  <tbody>
    <tr><td>Nacionalidad</td><td>España, UE/EEE, Suiza o familiar directo</td></tr>
    <tr><td>Edad</td><td>16-65 años</td></tr>
    <tr><td>Titulación</td><td>Bachillerato, FP Superior, Grado universitario o equivalente</td></tr>
    <tr><td>Capacidad funcional</td><td>Para desempeñar las tareas del cuerpo</td></tr>
    <tr><td>Habilitación</td><td>No separado ni inhabilitado</td></tr>
    <tr><td>Tasa</td><td>11,32 € (exenciones disponibles)</td></tr>
  </tbody>
</table>

<p>
  Si cumples todos los requisitos y quieres empezar a preparar con tests del temario real,
  <strong><a href="/register">prueba OpoRuta gratis</a></strong>: tests por tema, simulacros de convocatorias
  pasadas y análisis detallados de tus errores.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Qué título necesito para opositar a Administrativo del Estado C1?', answer: 'Necesitas como mínimo el título de Bachillerato, Técnico Superior de FP (Grado Superior) o equivalente. También vale cualquier titulación universitaria (Grado, Diplomatura o Licenciatura). No es suficiente con la ESO ni con un ciclo medio de FP.' },
      { question: '¿Puedo presentarme a C1 Administrativo y C2 Auxiliar a la vez?', answer: 'No en la convocatoria 2026. Ambos exámenes se celebran el mismo día (23 de mayo de 2026) a la misma hora. Debes elegir uno u otro.' },
      { question: '¿Cuánto cuesta la tasa de examen para Administrativo C1?', answer: 'La tasa es de 11,32 €. Hay exención total para personas con discapacidad ≥ 33 %, familias numerosas de categoría especial, víctimas de terrorismo y demandantes de empleo. Las familias numerosas de categoría general pagan la mitad (5,66 €).' },
      { question: '¿Pueden presentarse extranjeros a Administrativo del Estado?', answer: 'Sí, si son ciudadanos de la UE, EEE (Noruega, Islandia, Liechtenstein), Suiza, o cónyuges/descendientes menores de 21 años de ciudadanos europeos. Los nacionales de otros países no pueden presentarse salvo vínculo familiar directo con ciudadano UE.' },
      { question: '¿Hay límite de edad para opositar a C1?', answer: 'Debes tener al menos 16 años y no haber alcanzado la edad de jubilación forzosa (65 años, ampliable a 67 según normativa de pensiones). No hay límite de intentos ni de convocatorias presentadas.' },
      { question: '¿Qué pasa si tengo antecedentes penales?', answer: 'Los antecedentes penales cancelados no impiden presentarse. Solo te excluye haber sido separado del servicio mediante expediente disciplinario o estar inhabilitado por sentencia judicial firme para funciones públicas.' },
    ],
  },
  // ─── Post 40 ───────────────────────────────────────────────────────────────
  {
    slug: 'calendario-oposiciones-administrativo-estado-c1-2026',
    title: 'Calendario Administrativo del Estado (C1) 2026: todas las fechas clave',
    description:
      'Calendario completo de la oposición a Administrativo del Estado C1 en 2026: fecha de examen, plazos de inscripción, listas provisionales, resultados y toma de posesión.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'calendario administrativo estado c1 2026',
      'fecha examen administrativo estado 2026',
      'cuando examen c1 2026',
      'fechas oposiciones AGE c1',
      'plazos administrativo estado 2026',
    ],
    content: `
<h2>Examen el 23 de mayo de 2026: quedan 64 días</h2>
<p>
  El examen del Cuerpo General Administrativo de la Administración del Estado (C1) está fijado para
  el <strong>sábado 23 de mayo de 2026</strong>. Es la misma fecha que el examen de Auxiliar Administrativo (C2),
  lo que significa que <strong>no puedes presentarte a ambos</strong>. Si estás leyendo esto, el reloj corre:
  quedan aproximadamente <strong>64 días</strong> para el examen.
</p>
<p>
  A continuación, el cronograma completo desde la publicación en el BOE hasta la toma de posesión,
  con las fechas reales y las estimadas según el patrón histórico de convocatorias anteriores.
</p>

<h2>Cronograma completo: todas las fases</h2>
<table>
  <thead><tr><th>Fase</th><th>Fecha / Período</th><th>Estado</th></tr></thead>
  <tbody>
    <tr><td>Publicación OPE en BOE</td><td>Junio 2024</td><td>✅ Completado</td></tr>
    <tr><td>Publicación convocatoria en BOE</td><td>Diciembre 2024</td><td>✅ Completado</td></tr>
    <tr><td>Plazo de inscripción (20 días hábiles)</td><td>Enero – Febrero 2025</td><td>✅ Cerrado</td></tr>
    <tr><td>Lista provisional de admitidos</td><td>Septiembre – Octubre 2025</td><td>✅ Publicada</td></tr>
    <tr><td>Plazo de subsanación (10 días hábiles)</td><td>Octubre 2025</td><td>✅ Cerrado</td></tr>
    <tr><td>Lista definitiva de admitidos</td><td>Febrero – Marzo 2026</td><td>✅ Publicada</td></tr>
    <tr><td>Fecha del examen (primer ejercicio)</td><td><strong>23 de mayo de 2026</strong></td><td>⏳ Pendiente</td></tr>
    <tr><td>Publicación de respuestas correctas</td><td>Junio 2026 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Plazo de impugnaciones (5 días hábiles)</td><td>Junio 2026 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Notas provisionales primer ejercicio</td><td>Julio 2026 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Segundo ejercicio (caso práctico)</td><td>Septiembre – Octubre 2026 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Notas finales y lista de aprobados</td><td>Noviembre – Diciembre 2026 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Curso selectivo (INAP)</td><td>Enero – Marzo 2027 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Elección de destinos</td><td>Abril – Mayo 2027 (estimado)</td><td>⏳ Pendiente</td></tr>
    <tr><td>Toma de posesión</td><td>Mayo – Junio 2027 (estimado)</td><td>⏳ Pendiente</td></tr>
  </tbody>
</table>
<p>
  <strong>Nota:</strong> las fechas posteriores al examen son estimaciones basadas en convocatorias anteriores
  (2019, 2022, 2024). El Tribunal puede alterar los plazos. Consulta siempre el
  <a href="https://www.boe.es" target="_blank" rel="noopener">BOE</a> para confirmaciones oficiales.
</p>

<h2>El día del examen: qué esperar</h2>
<p>
  El primer ejercicio consiste en un <strong>test de 100 preguntas</strong> (+ 10 de reserva) con
  <strong>4 opciones de respuesta</strong>. Tienes <strong>90 minutos</strong>. Las respuestas incorrectas
  penalizan (1/3 del valor de una correcta). El temario abarca aproximadamente 70 temas divididos en
  dos bloques: Bloque I (Organización del Estado, Derecho Administrativo) y Bloque II
  (Actividad administrativa, Gestión de personal y financiera).
</p>
<ul>
  <li><strong>Hora de convocatoria:</strong> normalmente a las 10:00 (se confirma en la resolución del Tribunal).</li>
  <li><strong>Lugar:</strong> Madrid capital (sedes universitarias habitualmente). Se publica en la lista definitiva de admitidos.</li>
  <li><strong>Documentación:</strong> DNI/NIE original en vigor + justificante de inscripción.</li>
  <li><strong>Material prohibido:</strong> teléfonos, smartwatches, auriculares, cualquier dispositivo electrónico.</li>
</ul>

<h2>Segundo ejercicio: caso práctico</h2>
<p>
  Solo lo realizan quienes superen el primer ejercicio (nota de corte). Consiste en resolver uno o varios
  <strong>supuestos prácticos</strong> relacionados con el temario, en un tiempo de entre 60 y 90 minutos.
  Se evalúa la capacidad de aplicar los conocimientos a situaciones reales de trabajo administrativo.
  Históricamente, entre el primer y el segundo ejercicio pasan <strong>3-5 meses</strong>.
</p>

<h2>Nota de corte: ¿qué puntuación necesitas?</h2>
<p>
  La nota de corte varía en cada convocatoria según el número de aspirantes y la dificultad del examen.
  En convocatorias recientes:
</p>
<ul>
  <li><strong>2019:</strong> nota de corte ~5,75/10 (convocatoria más competida).</li>
  <li><strong>2022:</strong> nota de corte ~6,00/10.</li>
  <li><strong>2024:</strong> nota de corte ~6,50/10 (tendencia al alza).</li>
</ul>
<p>
  Consulta el análisis detallado en
  <a href="/blog/nota-corte-administrativo-estado-c1-como-se-calcula">Nota de corte Administrativo C1: cómo se calcula</a>.
</p>

<h2>Después del examen: los plazos que nadie cuenta</h2>
<p>
  Muchos opositores se centran solo en la fecha del examen y se sorprenden del <strong>largo proceso posterior</strong>.
  Desde que haces el examen hasta que tomas posesión pueden pasar <strong>12-14 meses</strong>. Es importante saberlo
  para planificar tu situación laboral y personal.
</p>
<ol>
  <li><strong>Publicación de respuestas</strong> (1-2 semanas tras el examen): el Tribunal publica la plantilla de respuestas correctas.</li>
  <li><strong>Impugnaciones</strong> (5 días hábiles): puedes impugnar preguntas que consideres incorrectas o ambiguas.</li>
  <li><strong>Resolución de impugnaciones</strong> (1-2 meses): el Tribunal revisa y puede anular preguntas.</li>
  <li><strong>Notas provisionales</strong> (2-3 meses tras el examen): se publican con plazo de alegaciones.</li>
  <li><strong>Segundo ejercicio</strong> (3-5 meses tras el primer ejercicio): solo para aprobados del primero.</li>
  <li><strong>Lista definitiva de aprobados</strong> (6-8 meses tras el examen).</li>
  <li><strong>Curso selectivo en el INAP</strong> (2-3 meses): obligatorio, eliminatorio.</li>
  <li><strong>Elección de destinos</strong>: por orden de puntuación final.</li>
  <li><strong>Toma de posesión</strong>: ~12-14 meses después del examen.</li>
</ol>

<h2>C1 y C2 el mismo día: ¿cuál elegir?</h2>
<p>
  Esta es la gran pregunta de 2026. Ambas oposiciones se celebran el <strong>23 de mayo</strong>.
  Si tienes titulación de Bachillerato o superior, puedes optar a C1 (más sueldo, más temario)
  o a C2 (menos temario, más plazas por aspirante). Consulta la comparativa completa en
  <a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias entre C2 Auxiliar y C1 Administrativo</a>.
</p>

<h2>Plan de estudio: 64 días para el examen</h2>
<p>
  Si aún no has empezado o llevas pocas semanas, la estrategia es clave. Con 64 días puedes
  cubrir los temas más rentables (los que más preguntan) y practicar con simulacros reales.
  Consulta nuestro plan intensivo en
  <a href="/blog/ultimos-60-dias-administrativo-estado-c1-plan-estudio">Últimos 60 días para el C1: plan de estudio</a>.
</p>
<p>
  <strong><a href="/register">Empieza gratis en OpoRuta</a></strong> y practica con tests del temario oficial,
  simulacros de convocatorias pasadas (2019, 2022, 2024) y análisis detallados de tus errores.
  Cada día que pasa es un día menos para preparar.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026. Quedan ~64 días para el examen.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuándo es el examen de Administrativo del Estado C1 en 2026?', answer: 'El examen está fijado para el sábado 23 de mayo de 2026. Es la misma fecha que el examen de Auxiliar Administrativo C2, por lo que no puedes presentarte a ambos.' },
      { question: '¿Todavía estoy a tiempo de inscribirme en la oposición C1 2026?', answer: 'No. El plazo de inscripción se cerró en febrero de 2025 (20 días hábiles desde la publicación de la convocatoria). Para esta convocatoria ya no es posible inscribirse. La próxima convocatoria se publicará previsiblemente en 2027-2028.' },
      { question: '¿Cuánto tiempo pasa desde el examen hasta la toma de posesión?', answer: 'Aproximadamente 12-14 meses. Tras el examen hay publicación de plantillas, impugnaciones, notas provisionales, segundo ejercicio, lista definitiva, curso selectivo en el INAP y elección de destinos antes de la toma de posesión.' },
      { question: '¿Dónde se celebra el examen de Administrativo C1?', answer: 'El examen se celebra en Madrid capital, normalmente en sedes universitarias (Facultades de la UCM, UNED, etc.). La ubicación exacta se comunica en la resolución del Tribunal publicada en el BOE y en la sede electrónica del INAP.' },
      { question: '¿Qué pasa si apruebo el primer ejercicio?', answer: 'Si superas la nota de corte del test (primer ejercicio), pasas al segundo ejercicio: un caso práctico. Suele celebrarse entre 3 y 5 meses después del primero. Solo quienes aprueben ambos ejercicios acceden a la lista de aprobados y al curso selectivo del INAP.' },
      { question: '¿Puedo presentarme a C1 Administrativo y C2 Auxiliar el mismo año?', answer: 'En 2026 no es posible porque ambos exámenes son el mismo día (23 de mayo). Debes elegir uno. En convocatorias donde las fechas no coinciden, sí puedes inscribirte en ambos procesos selectivos.' },
    ],
  },

  // ─── Post 41 ───────────────────────────────────────────────────────────────
  {
    slug: 'errores-examen-administrativo-estado-c1',
    title: 'Errores más comunes en el examen de Administrativo del Estado (C1) y cómo evitarlos',
    description:
      'Los 10 fallos que más puntos cuestan en el examen C1 de la AGE: penalización, gestión del tiempo, supuesto práctico y confusiones legales. Con tabla resumen y estrategias correctoras.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'errores examen administrativo estado c1',
      'fallos oposiciones administrativo',
      'errores comunes examen c1 AGE',
      'penalizacion examen c1',
      'como aprobar administrativo estado',
    ],
    content: `
<h2>Por qué conocer los errores más frecuentes puede darte el aprobado</h2>
<p>
  El examen del Cuerpo General Administrativo de la Administración del Estado (C1) tiene una tasa de aprobados cercana al 8-12%. Eso significa que la mayoría de opositores suspenden, y no siempre por falta de estudio. Muchos pierden puntos por errores evitables: mala gestión del tiempo, confusiones legales recurrentes o una estrategia de penalización inadecuada.
</p>
<p>
  En este artículo analizamos <strong>los 10 errores más comunes</strong> que cometen los aspirantes al C1 y cómo puedes corregir cada uno. Si estás preparando esta oposición, esta guía puede ahorrarte meses de frustración y decenas de puntos en el examen real.
</p>

<h2>El formato del examen C1: lo que debes tener claro</h2>
<p>
  Antes de entrar en los errores, repasemos la estructura del examen:
</p>
<ul>
  <li><strong>Primera parte (test):</strong> 70 preguntas tipo test sobre el temario (45 temas en 5 bloques), 70 minutos.</li>
  <li><strong>Segunda parte (supuesto práctico):</strong> 20 preguntas tipo test sobre un caso práctico, 30 minutos.</li>
  <li><strong>Penalización:</strong> cada respuesta incorrecta resta 1/3 del valor de una correcta (−0,333).</li>
  <li><strong>Total:</strong> 90 preguntas en 100 minutos. Cada segundo cuenta.</li>
</ul>
<p>
  Esta estructura crea trampas específicas que vemos a continuación.
</p>

<h2>Error 1: No calibrar la penalización −1/3</h2>
<p>
  El error más costoso es responder preguntas sin criterio. La penalización de −1/3 está diseñada para que responder al azar tenga valor esperado cero. Sin embargo, muchos opositores cometen dos errores opuestos:
</p>
<ul>
  <li><strong>Responder todo:</strong> Marcan las 90 preguntas "por no dejar nada en blanco". Con 15-20 respuestas al azar, pierden 5-7 puntos netos que les habrían bastado para aprobar.</li>
  <li><strong>Dejar demasiado en blanco:</strong> Otros opositores, por miedo a la penalización, dejan sin responder preguntas en las que podrían haber descartado 1-2 opciones. Cada pregunta en blanco con dos opciones descartadas es un 50% de acertar (+1) contra un 50% de perder (−0,33): valor esperado +0,33.</li>
</ul>
<p>
  <strong>La regla de oro:</strong> responde si puedes descartar al menos una opción. Si no tienes ni idea de la materia, deja en blanco.
</p>

<h2>Error 2: Repartir mal el tiempo entre test y supuesto</h2>
<p>
  Tienes 70 minutos para 70 preguntas de test y 30 minutos para 20 preguntas de supuesto práctico. Un error frecuente es quedarse atrapado en preguntas difíciles del test y llegar al supuesto con 15-20 minutos, insuficientes para leer el caso con calma.
</p>
<p>
  El supuesto práctico es un texto de 2-3 páginas con un caso administrativo complejo. Las preguntas se responden aplicando la legislación al caso, no de memoria. Necesitas tiempo para leerlo completo antes de responder ninguna pregunta.
</p>
<p>
  <strong>Estrategia:</strong> marca un checkpoint a los 60 minutos. Si no has terminado el test, marca las que te falten rápidamente (solo si puedes descartar algo) y pasa al supuesto. Nunca sacrifiques el supuesto: sus 20 preguntas pesan igual que 20 del test.
</p>

<h2>Error 3: Leer el supuesto práctico a medias</h2>
<p>
  El supuesto práctico es donde más opositores pierden puntos innecesariamente. El error típico: leer el caso por encima, ir directamente a las preguntas e intentar responderlas buscando datos en el texto.
</p>
<p>
  El caso suele incluir detalles clave escondidos en párrafos intermedios: plazos que ya han vencido, recursos mal interpuestos, competencias de un órgano específico. Si no lees el caso completo primero, te pierdes matices que cambian la respuesta correcta.
</p>
<p>
  <strong>Método correcto:</strong> dedica 8-10 minutos a leer el caso completo, subrayando fechas, órganos, procedimientos y legislación mencionada. Solo entonces empieza a responder. Te quedan 20 minutos para 20 preguntas: un minuto por pregunta es más que suficiente cuando ya dominas el caso.
</p>

<h2>Error 4: Confundir LPAC (Ley 39/2015) con LRJSP (Ley 40/2015)</h2>
<p>
  Es el error de contenido más frecuente del examen C1. Ambas leyes regulan la Administración Pública, pero desde ángulos distintos:
</p>
<ul>
  <li><strong>LPAC (Ley 39/2015):</strong> Procedimiento administrativo común. Regula cómo se tramita un expediente, los plazos, los recursos, las notificaciones, el silencio administrativo.</li>
  <li><strong>LRJSP (Ley 40/2015):</strong> Régimen jurídico del sector público. Regula los órganos administrativos, la responsabilidad patrimonial, los convenios, la potestad sancionadora.</li>
</ul>
<p>
  El tribunal pone preguntas diseñadas para confundir ambas leyes. Por ejemplo: ¿los plazos de recurso están en la LPAC o en la LRJSP? (LPAC). ¿La responsabilidad patrimonial? (LRJSP). ¿La abstención y recusación? (LRJSP, no LPAC).
</p>
<p>
  <strong>Consejo:</strong> haz un cuadro comparativo de ambas leyes tema por tema y repásalo la semana antes del examen. Te puede dar 3-5 puntos extra.
</p>

<h2>Error 5: Sobre-estudiar el Bloque I e infra-estudiar el Bloque V</h2>
<p>
  El Bloque I (Organización del Estado y Constitución) es el más "intuitivo" y donde los opositores empiezan a estudiar. Muchos le dedican el 40% del tiempo. El Bloque V (Informática, ofimática y actividad administrativa), en cambio, parece menos relevante y se deja para el final.
</p>
<p>
  Sin embargo, los exámenes recientes muestran que <strong>los bloques III y IV concentran el 50-60% de las preguntas</strong> del test (procedimiento administrativo, gestión financiera, contratación, función pública). El Bloque V aporta entre 8 y 12 preguntas, lo que puede ser la diferencia entre aprobar y suspender.
</p>
<p>
  <strong>Distribución óptima del estudio:</strong>
</p>
<ul>
  <li>Bloque I (Constitución, organización): 15-18% del tiempo</li>
  <li>Bloque II (Unión Europea, organización territorial): 10-12%</li>
  <li>Bloque III (Derecho Administrativo, LPAC, LRJSP): 30-35%</li>
  <li>Bloque IV (Gestión financiera, contratación, RRHH): 20-25%</li>
  <li>Bloque V (Informática, actividad administrativa): 10-15%</li>
</ul>

<h2>Error 6: No practicar con penalización real</h2>
<p>
  Muchos opositores estudian con tests sin penalización o con apps que simplemente marcan "correcto/incorrecto". Esto genera una falsa sensación de seguridad: en el examen real, un 70% de aciertos con un 20% de fallos no es un 70, sino un <strong>63,3</strong> (70 − 20/3 = 63,3).
</p>
<p>
  Si solo practicas sin penalización, tu nota real será entre 5 y 10 puntos menor de lo que esperas. Esa diferencia separa al aprobado del suspenso.
</p>
<p>
  <strong>Solución:</strong> practica siempre con simulacros que apliquen la penalización −1/3. En <a href="/">OpoRuta</a> todos los simulacros aplican penalización real calculada exactamente como en el examen INAP.
</p>

<h2>Error 7: Memorizar artículos sin entender su aplicación</h2>
<p>
  El examen C1 no es un examen de memoria pura: es un examen de aplicación. Las preguntas del test y, especialmente, del supuesto práctico requieren que entiendas cuándo y cómo se aplica cada artículo.
</p>
<p>
  Ejemplo real: saber que el plazo de recurso de alzada es de 1 mes no basta. Necesitas saber cuándo empieza a contar (desde la notificación o desde el día siguiente), ante qué órgano se interpone (el superior jerárquico) y qué ocurre si no se resuelve (silencio negativo).
</p>
<p>
  <strong>Método:</strong> por cada artículo clave, plantéate 3 preguntas: ¿cuándo se aplica?, ¿quién lo aplica?, ¿qué pasa si no se cumple?
</p>

<h2>Error 8: Ignorar las preguntas de reserva</h2>
<p>
  El examen incluye preguntas de reserva (normalmente 5-10) que sustituyen a preguntas anuladas. Algunos opositores no las responden pensando que "no cuentan". Error: si se anula una pregunta del test principal, la de reserva correspondiente pasa a ser puntuable. Si la dejaste en blanco, pierdes un punto potencial.
</p>
<p>
  <strong>Regla:</strong> responde siempre las preguntas de reserva con el mismo criterio que las demás.
</p>

<h2>Error 9: No cronometrar los simulacros de práctica</h2>
<p>
  Estudiar tests tema por tema sin límite de tiempo es útil para aprender, pero no te prepara para la presión del examen. El C1 exige responder <strong>una pregunta cada 67 segundos</strong> de media. Si no has entrenado ese ritmo, el día del examen irás con retraso.
</p>
<p>
  <strong>Plan de entrenamiento:</strong> al menos las 4 últimas semanas, haz un simulacro cronometrado completo (90 preguntas en 100 minutos) cada semana. Analiza no solo tus fallos sino tu gestión del tiempo: ¿te sobraron minutos o te faltaron?
</p>

<h2>Error 10: No revisar los errores de simulacros anteriores</h2>
<p>
  Hacer simulacros sin analizar los fallos es como entrenar sin mirar los resultados. El patrón habitual: un opositor hace 10 simulacros, repite los mismos errores en la LPAC y se presenta al examen sin haberlos corregido.
</p>
<p>
  <strong>Sistema efectivo:</strong> después de cada simulacro, clasifica tus errores en tres categorías: (1) no sabía el tema, (2) sabía el tema pero confundí el dato, (3) leí mal la pregunta. Cada categoría requiere una solución distinta: más estudio, más práctica con preguntas trampa, o más atención a las dobles negaciones.
</p>

<h2>Tabla resumen: los 10 errores y cómo corregirlos</h2>
<table>
  <thead>
    <tr><th>Error</th><th>Consecuencia</th><th>Solución</th></tr>
  </thead>
  <tbody>
    <tr><td>No calibrar la penalización</td><td>Perder 5-7 puntos por respuestas al azar</td><td>Responder solo si descartas ≥1 opción</td></tr>
    <tr><td>Mala gestión del tiempo test/supuesto</td><td>Llegar al supuesto sin tiempo</td><td>Checkpoint a los 60 min, nunca sacrificar supuesto</td></tr>
    <tr><td>Leer el supuesto a medias</td><td>Fallar preguntas por no ver detalles clave</td><td>8-10 min leyendo y subrayando antes de responder</td></tr>
    <tr><td>Confundir LPAC con LRJSP</td><td>3-5 preguntas mal en el test</td><td>Cuadro comparativo y repasar la semana previa</td></tr>
    <tr><td>Sobre-estudiar Bloque I, infra-estudiar V</td><td>Perder 4-8 puntos en bloques de peso real</td><td>Distribuir estudio según peso real en examen</td></tr>
    <tr><td>Practicar sin penalización real</td><td>Nota real 5-10 puntos menor de lo esperado</td><td>Simulacros siempre con penalización −1/3</td></tr>
    <tr><td>Memorizar sin entender la aplicación</td><td>Fallar supuesto práctico y preguntas aplicadas</td><td>Por cada artículo: ¿cuándo, quién, qué pasa si no?</td></tr>
    <tr><td>Ignorar preguntas de reserva</td><td>Perder puntos si se anulan preguntas</td><td>Responder siempre las preguntas de reserva</td></tr>
    <tr><td>No cronometrar simulacros</td><td>Gestión del tiempo deficiente en examen real</td><td>1 simulacro cronometrado completo por semana</td></tr>
    <tr><td>No revisar errores de simulacros</td><td>Repetir los mismos fallos en el examen</td><td>Clasificar errores: no sabía / confundí / leí mal</td></tr>
  </tbody>
</table>

<h2>Plan de acción: las últimas 4 semanas antes del examen</h2>
<p>
  Si aplicas las correcciones de esta tabla en tus últimas semanas de preparación, puedes ganar entre 8 y 15 puntos en el examen real. Un plan semanal mínimo:
</p>
<ul>
  <li><strong>Semana 1:</strong> Cuadro comparativo LPAC/LRJSP. Redistribuir horas de estudio por bloque según peso real.</li>
  <li><strong>Semana 2:</strong> Primer simulacro cronometrado completo (90 preguntas, 100 min, penalización). Análisis de errores por categoría.</li>
  <li><strong>Semana 3:</strong> Segundo simulacro. Práctica específica de supuestos prácticos (3-4 casos, 30 min cada uno). Repaso de Bloque V.</li>
  <li><strong>Semana 4:</strong> Tercer simulacro. Repaso de errores acumulados de los tres simulacros. Lectura rápida de temas débiles. Descanso el día antes.</li>
</ul>

<h2>Artículos relacionados</h2>
<ul>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Cómo preparar el supuesto práctico del C1</a> — estrategia completa para los 20 puntos más valiosos</li>
  <li><a href="/blog/nota-corte-administrativo-estado-c1-como-se-calcula">Nota de corte del C1</a> — datos históricos y previsión 2026</li>
  <li><a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">Los 45 temas del C1: cómo priorizar</a> — distribución óptima del estudio</li>
  <li><a href="/blog/contratacion-publica-lcsp-administrativo-estado-c1">Contratación pública (LCSP) en el C1</a> — uno de los bloques que más preguntas aporta</li>
  <li><a href="/blog/ultimos-60-dias-administrativo-estado-c1-plan-estudio">Últimos 60 días para el C1</a> — plan de estudio intensivo semana a semana</li>
</ul>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuántas preguntas tiene el examen de Administrativo del Estado C1?', answer: 'El examen consta de 90 preguntas tipo test en total: 70 preguntas sobre el temario (45 temas en 5 bloques) y 20 preguntas sobre un supuesto práctico. Se dispone de 100 minutos: 70 para el test y 30 para el supuesto. Además hay preguntas de reserva (5-10) que sustituyen a las anuladas.' },
      { question: '¿Cómo funciona la penalización en el examen C1?', answer: 'Cada respuesta correcta suma 1 punto. Cada respuesta incorrecta resta 1/3 de punto (−0,333). Las preguntas en blanco no puntúan. La regla óptima es responder cuando puedes descartar al menos una opción: si descartas una de cuatro, tu valor esperado es positivo (+0,11 por pregunta).' },
      { question: '¿Cuál es el error más frecuente en el examen C1?', answer: 'El error más costoso es la mala gestión del tiempo entre test y supuesto práctico. Muchos opositores se atascan en preguntas difíciles del test y llegan al supuesto con menos de 20 minutos, insuficientes para leer el caso completo. El supuesto práctico vale 20 puntos y requiere lectura atenta del caso.' },
      { question: '¿Cómo evitar confundir la LPAC con la LRJSP?', answer: 'La clave es un cuadro comparativo: LPAC (Ley 39/2015) regula el procedimiento (plazos, recursos, notificaciones, silencio). LRJSP (Ley 40/2015) regula los órganos y su funcionamiento (responsabilidad patrimonial, convenios, abstención, potestad sancionadora). Repasa el cuadro la semana antes del examen.' },
      { question: '¿Cuántos simulacros debo hacer antes del examen C1?', answer: 'Al menos 4-6 simulacros cronometrados completos (90 preguntas, 100 minutos, con penalización) en las últimas 4-6 semanas. Lo crítico no es la cantidad sino el análisis posterior: clasifica cada error (no sabía / confundí dato / leí mal la pregunta) y trabaja específicamente en cada categoría.' },
      { question: '¿Es mejor responder todas las preguntas o dejar en blanco las dudosas?', answer: 'Ni una cosa ni la otra. La estrategia óptima es responder cuando puedes descartar al menos una opción (valor esperado positivo: +0,11 a +0,33 según cuántas descartes) y dejar en blanco solo cuando no tienes ninguna pista sobre la materia. Responder las 90 al azar no te da ventaja; dejar 20 en blanco por miedo te quita puntos seguros.' },
    ],
  },

  // ─── Post 42 ───────────────────────────────────────────────────────────────
  {
    slug: 'elegir-destino-administrativo-estado-c1',
    title: 'Cómo elegir destino como Administrativo del Estado (C1): ministerios, sueldo y teletrabajo',
    description:
      'Guía completa para elegir destino tras aprobar el C1: ministerios con mejor complemento específico, teletrabajo, opciones geográficas, progresión de carrera y tabla comparativa de destinos.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'destinos administrativo estado c1',
      'elegir destino oposiciones c1',
      'teletrabajo funcionarios AGE',
      'mejor ministerio administrativo',
      'complemento especifico administrativo c1',
    ],
    content: `
<h2>El momento más importante después de aprobar: elegir destino</h2>
<p>
  Has aprobado el examen de Administrativo del Estado (C1). Enhorabuena. Ahora llega una decisión que marcará tu carrera los próximos años — posiblemente décadas: <strong>la elección de destino</strong>. Este es el momento en que tu nota de examen se convierte en poder real de elección.
</p>
<p>
  El proceso es sencillo en teoría: los aprobados eligen destino por orden de puntuación. El primero de la lista elige entre todos los puestos vacantes; el último se queda con lo que sobra. En la práctica, la diferencia entre un buen y un mal destino puede suponer <strong>más de 500€ netos al mes</strong> de diferencia y la posibilidad (o imposibilidad) de teletrabajar.
</p>
<p>
  En este artículo te explicamos cómo funciona el proceso, qué ministerios pagan mejor, dónde hay teletrabajo real y cómo pensar a largo plazo.
</p>

<h2>Cómo funciona el proceso de elección de destino</h2>
<p>
  Tras la publicación de la lista definitiva de aprobados, el Ministerio de Hacienda publica la <strong>relación de puestos vacantes</strong>. Cada opositor presenta una lista de preferencias (habitualmente unas 50 opciones, ordenadas de más a menos deseada).
</p>
<p>
  La asignación se hace por estricto orden de puntuación del examen. Si eres el número 1, obtienes tu primera preferencia. Si eres el 500, eliges entre lo que queda tras las 499 elecciones anteriores.
</p>
<p>
  <strong>Factores que determinan la oferta:</strong>
</p>
<ul>
  <li><strong>Organismo:</strong> ministerio, agencia, organismo autónomo o delegación provincial.</li>
  <li><strong>Ubicación geográfica:</strong> Madrid (servicios centrales) o provincias (delegaciones, subdelegaciones).</li>
  <li><strong>Nivel del puesto:</strong> normalmente nivel 18 de entrada, con posibilidad de ascender hasta 22-26.</li>
  <li><strong>Complemento específico:</strong> la parte variable del sueldo que depende del puesto, no del cuerpo.</li>
</ul>

<h2>Los ministerios y organismos que mejor pagan</h2>
<p>
  El sueldo base de un Administrativo C1 es idéntico en toda España y en todos los ministerios: <strong>~910€ brutos/mes</strong> (sueldo base + complemento de destino). La diferencia real está en el <strong>complemento específico</strong>, que varía enormemente según el organismo.
</p>
<p>
  Este complemento refleja la "dificultad técnica, dedicación, responsabilidad o peligrosidad" del puesto. En la práctica, los organismos con más presupuesto y mayor carga de trabajo ofrecen complementos superiores.
</p>

<h3>Tabla: Top 5 destinos por complemento específico (C1, nivel 18-20)</h3>
<table>
  <thead>
    <tr><th>Organismo</th><th>Complemento específico (€/mes bruto)</th><th>Sueldo neto estimado (€/mes)</th><th>Teletrabajo</th></tr>
  </thead>
  <tbody>
    <tr><td>AEAT (Agencia Tributaria)</td><td>550-650€</td><td>1.450-1.550€</td><td>Sí (2-3 días/semana)</td></tr>
    <tr><td>Seguridad Social (TGSS, INSS)</td><td>500-600€</td><td>1.400-1.500€</td><td>Sí (2 días/semana)</td></tr>
    <tr><td>Ministerio del Interior</td><td>480-580€</td><td>1.380-1.480€</td><td>Limitado (según unidad)</td></tr>
    <tr><td>SEPE (Servicio Público de Empleo)</td><td>450-550€</td><td>1.350-1.450€</td><td>Sí (2 días/semana)</td></tr>
    <tr><td>Ministerio de Hacienda (servicios centrales)</td><td>420-520€</td><td>1.320-1.420€</td><td>Sí (2-3 días/semana)</td></tr>
  </tbody>
</table>
<p>
  <em>*Los rangos varían según la unidad concreta dentro del organismo y el nivel del puesto. Datos orientativos 2025-2026 basados en RPT publicadas.</em>
</p>
<p>
  En contraste, los ministerios con complementos más bajos (Cultura, Ciencia, algunos organismos autónomos pequeños) pueden pagar 300-350€ de complemento específico, lo que supone unos <strong>1.180-1.250€ netos</strong>. La diferencia con la AEAT puede superar los 300€ al mes — más de 4.200€ al año.
</p>

<h2>Madrid vs. provincias: ¿dónde elegir destino?</h2>
<p>
  Aproximadamente el 60-65% de los puestos ofertados están en Madrid (servicios centrales de ministerios). El resto se distribuye en delegaciones y subdelegaciones del Gobierno, oficinas de la Seguridad Social, de Hacienda o del SEPE en capitales de provincia.
</p>
<p>
  <strong>Ventajas de Madrid:</strong>
</p>
<ul>
  <li>Mayor variedad de puestos y organismos.</li>
  <li>Más opciones de complemento específico alto.</li>
  <li>Mejor acceso a formación, comisiones de servicio y movilidad.</li>
  <li>Más posibilidades de teletrabajo (los servicios centrales suelen ser los primeros en implementarlo).</li>
</ul>
<p>
  <strong>Ventajas de provincias:</strong>
</p>
<ul>
  <li>Coste de vida significativamente menor (alquiler 40-60% más barato que Madrid).</li>
  <li>Menor competencia por los puestos (tu posición en la lista rinde más).</li>
  <li>Calidad de vida: menos desplazamientos, ciudades más manejables.</li>
  <li>Organismos como la AEAT y la Seguridad Social tienen delegaciones provinciales con buenos complementos.</li>
</ul>
<p>
  <strong>Clave:</strong> un Administrativo C1 con 1.400€ netos en una ciudad media (alquiler 500€) tiene más capacidad adquisitiva real que uno con 1.500€ en Madrid (alquiler 900-1.100€).
</p>

<h2>Teletrabajo en la AGE: la realidad en 2026</h2>
<p>
  El teletrabajo en la Administración General del Estado se regula por el <strong>Real Decreto 589/2024</strong> y los acuerdos específicos de cada organismo. La norma general permite hasta un <strong>60% de jornada en teletrabajo</strong> (3 días por semana), pero la aplicación varía mucho:
</p>
<ul>
  <li><strong>AEAT:</strong> modelo más avanzado. Hasta 3 días/semana de teletrabajo para puestos administrativos, con herramientas digitales propias.</li>
  <li><strong>Seguridad Social (TGSS, INSS):</strong> 2 días/semana en la mayoría de oficinas. Algunas unidades de gestión permiten 3 días.</li>
  <li><strong>Ministerios con atención al público:</strong> teletrabajo más limitado (1-2 días) en puestos de ventanilla.</li>
  <li><strong>Delegaciones y subdelegaciones:</strong> depende del delegado y la carga presencial del puesto.</li>
</ul>
<p>
  <strong>Requisitos generales:</strong> haber superado el periodo de prácticas (6 meses), disponer de conexión a internet adecuada y que el puesto sea "teletrabajable" según la RPT. Los puestos de atención directa al ciudadano raramente permiten teletrabajo completo.
</p>
<p>
  <strong>Consejo:</strong> si el teletrabajo es prioritario para ti, investiga el organismo concreto antes de incluirlo en tu lista de preferencias. Pregunta en foros de opositores o sindicatos por la política real (no la teórica) de cada unidad.
</p>

<h2>Progresión de carrera: del nivel 18 al 26</h2>
<p>
  Como Administrativo C1, entras en <strong>nivel 18</strong> de complemento de destino. El rango del grupo C1 es del nivel 15 al 22, pero con comisiones de servicio y concursos de traslados puedes alcanzar niveles superiores:
</p>
<ul>
  <li><strong>Nivel 18 (entrada):</strong> complemento de destino ~478€/mes.</li>
  <li><strong>Nivel 20 (2-4 años):</strong> ~540€/mes. Accesible mediante concurso interno o consolidación de grado.</li>
  <li><strong>Nivel 22 (5-10 años):</strong> ~600€/mes. Puesto de jefatura de negociado o similar.</li>
  <li><strong>Nivel 24-26:</strong> requiere promoción interna a A2 (con título universitario). Jefatura de sección o superior.</li>
</ul>
<p>
  Cada salto de nivel supone entre 40 y 80€ mensuales adicionales de complemento de destino. Además, el complemento específico suele ser mayor en puestos de nivel superior. Un C1 en nivel 22 con buen complemento específico puede superar los <strong>1.700-1.800€ netos/mes</strong>.
</p>

<h2>Delegaciones provinciales: una opción infravalorada</h2>
<p>
  Las delegaciones y subdelegaciones del Gobierno en provincias son destinos que muchos opositores pasan por alto. Sin embargo, ofrecen ventajas específicas:
</p>
<ul>
  <li><strong>Menor competencia:</strong> los opositores con mejores notas suelen elegir Madrid. En provincias, con una nota media puedes acceder a organismos con buenos complementos (AEAT, Seguridad Social).</li>
  <li><strong>Estabilidad:</strong> las plantillas provinciales son más pequeñas y estables. Hay menos rotación y más previsibilidad.</li>
  <li><strong>Conciliación:</strong> ciudades más pequeñas permiten cercanía al trabajo, menos transporte y más tiempo real de vida.</li>
  <li><strong>Movilidad futura:</strong> una vez consolidado el puesto (2 años), puedes solicitar traslado a Madrid o a otro organismo mediante concurso de méritos. Partir desde provincias no te cierra puertas.</li>
</ul>
<p>
  <strong>Organismos con buena red provincial:</strong> AEAT (delegaciones en todas las provincias), Seguridad Social (TGSS e INSS), SEPE, Delegaciones del Gobierno, Confederaciones Hidrográficas, Demarcaciones de Costas.
</p>

<h2>Errores comunes al elegir destino</h2>
<p>
  Los errores más frecuentes que cometen los nuevos administrativos al elegir destino:
</p>
<ul>
  <li><strong>Elegir solo por sueldo:</strong> un complemento específico alto no compensa si el puesto tiene mala conciliación, nulo teletrabajo o un ambiente laboral tóxico.</li>
  <li><strong>No investigar el organismo:</strong> cada unidad dentro de un ministerio es un mundo. Pide referencias concretas de la unidad, no del ministerio en general.</li>
  <li><strong>Despreciar provincias por inercia:</strong> "todos quieren Madrid" es un sesgo. Calcula tu poder adquisitivo real (sueldo menos alquiler) antes de decidir.</li>
  <li><strong>No incluir suficientes opciones:</strong> con 50 preferencias disponibles, rellena las 50. Si te quedas sin opciones y te asignan un puesto residual, estarás 2 años atrapado hasta poder pedir traslado.</li>
  <li><strong>Olvidar la comisión de servicios:</strong> tu primer destino no es definitivo. Tras 2 años puedes solicitar comisión de servicios a cualquier puesto vacante de tu nivel en toda España.</li>
</ul>

<h2>Checklist para elegir bien tu destino</h2>
<p>
  Antes de presentar tu lista de preferencias, responde estas preguntas:
</p>
<ul>
  <li>¿Cuánto necesito cobrar para cubrir mis gastos en la ciudad elegida?</li>
  <li>¿Es el teletrabajo un factor decisivo o un extra?</li>
  <li>¿Estoy dispuesto/a a vivir en una provincia diferente a la mía durante al menos 2 años?</li>
  <li>¿Quiero un puesto con proyección (jefatura, promoción a A2) o estabilidad máxima?</li>
  <li>¿He investigado la unidad concreta (no solo el ministerio) donde voy a pedir destino?</li>
</ul>

<h2>Artículos relacionados</h2>
<ul>
  <li><a href="/blog/sueldo-administrativo-estado-c1-2026-nomina">Sueldo Administrativo C1 en 2026: nómina desglosada</a> — complementos, trienios y progresión salarial</li>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias entre Auxiliar (C2) y Administrativo (C1)</a> — plazas, sueldo, temario y examen</li>
  <li><a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">Administrativo del Estado C1 en 2026</a> — plazas, temario y nota de corte</li>
  <li><a href="/blog/calendario-oposiciones-age-2026-fechas-auxiliar-administrativo">Calendario de oposiciones AGE 2026</a> — fechas clave de convocatoria y examen</li>
</ul>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cómo se elige destino tras aprobar el Administrativo del Estado C1?', answer: 'Los aprobados eligen por orden de puntuación del examen. El Ministerio publica una relación de puestos vacantes y cada opositor presenta una lista de unas 50 preferencias ordenadas. El primero de la lista elige entre todos los puestos; el último se queda con lo que sobra. Tu nota determina directamente tu poder de elección.' },
      { question: '¿Cuáles son los ministerios que mejor pagan al Administrativo C1?', answer: 'Los organismos con mayor complemento específico son la AEAT (Agencia Tributaria) con 550-650€/mes, la Seguridad Social (TGSS, INSS) con 500-600€, el Ministerio del Interior con 480-580€ y el SEPE con 450-550€. La diferencia entre el organismo mejor y peor pagado puede superar los 300€ netos al mes (más de 4.000€ anuales).' },
      { question: '¿Se puede teletrabajar como Administrativo del Estado?', answer: 'Sí, desde el RD 589/2024 se permite hasta un 60% de jornada en teletrabajo (3 días/semana). La AEAT es el organismo más avanzado (hasta 3 días). La Seguridad Social y el SEPE suelen permitir 2 días. Los puestos de atención directa al público tienen teletrabajo más limitado. Requiere haber superado el periodo de prácticas (6 meses).' },
      { question: '¿Es mejor elegir destino en Madrid o en provincias?', answer: 'Depende de tus prioridades. Madrid ofrece más variedad de puestos, complementos más altos y más teletrabajo, pero el coste de vida es mucho mayor (alquiler 900-1.100€). En provincias, con el mismo sueldo tienes más poder adquisitivo real, menos competencia por buenos puestos y mejor conciliación. Un C1 con 1.400€ en una ciudad media vive mejor que con 1.500€ en Madrid.' },
      { question: '¿Se puede cambiar de destino después de elegir?', answer: 'Sí. Tras 2 años en el puesto puedes solicitar comisión de servicios a cualquier vacante de tu nivel en toda España, o participar en concursos de traslados. El primer destino no es definitivo: es tu punto de partida. Muchos funcionarios cambian de destino 2-3 veces en su carrera para mejorar sueldo, ubicación o teletrabajo.' },
      { question: '¿Qué nivel de complemento de destino tiene un Administrativo C1?', answer: 'Entras en nivel 18 (complemento de destino ~478€/mes). Puedes ascender a nivel 20 (540€/mes) en 2-4 años mediante concurso interno, y a nivel 22 (600€/mes) en 5-10 años con puestos de jefatura de negociado. Para niveles 24-26 necesitas promoción interna a A2 (requiere título universitario).' },
    ],
  },
  // ─── Post 43 ───────────────────────────────────────────────────────────────
  {
    slug: 'ley-transparencia-buen-gobierno-administrativo-c1',
    title: 'Ley de Transparencia y Buen Gobierno para el Administrativo del Estado (C1): artículos clave',
    description:
      'Guía completa de la Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información y buen gobierno: artículos clave, trampas de examen y estructura del Consejo de Transparencia para opositores C1.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'ley transparencia oposiciones c1',
      'ley 19/2013 examen administrativo',
      'buen gobierno oposiciones',
      'transparencia articulos clave c1',
      'consejo transparencia oposiciones',
    ],
    content: `
<h2>¿Por qué la Ley 19/2013 es clave en el examen C1?</h2>
<p>
  La <strong>Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública
  y buen gobierno</strong> es una de las normas más preguntadas en el Bloque I del temario de
  Administrativo del Estado (C1). A diferencia del C2, donde apenas aparece, en el C1 pueden
  dedicarle <strong>2-4 preguntas directas</strong> y varias más cruzadas con la Ley 39/2015
  (procedimiento administrativo) y la Ley 40/2015 (sector público).
</p>
<p>
  La ley se estructura en tres grandes pilares: <strong>publicidad activa</strong> (qué debe
  publicar la Administración sin que nadie lo pida), <strong>derecho de acceso</strong> (qué
  puede pedir el ciudadano y cómo) y <strong>buen gobierno</strong> (principios éticos y sanciones
  para altos cargos). El examen explota las diferencias entre estos tres bloques, así que
  dominarlos por separado es imprescindible.
</p>
<p>
  En esta guía te desglosamos los artículos que más caen, las trampas clásicas del tribunal
  y una tabla de referencia rápida para repasar antes del examen.
</p>

<h2>Estructura de la Ley 19/2013: los tres pilares</h2>
<p>
  La ley tiene <strong>40 artículos</strong> distribuidos en un título preliminar y tres títulos:
</p>
<ul>
  <li><strong>Título I — Transparencia de la actividad pública</strong> (arts. 5-24): publicidad activa + derecho de acceso.</li>
  <li><strong>Título II — Buen gobierno</strong> (arts. 25-32): principios éticos y de actuación, infracciones y sanciones.</li>
  <li><strong>Título III — Consejo de Transparencia y Buen Gobierno</strong> (arts. 33-40): órgano de control independiente.</li>
</ul>
<p>
  El <strong>Título Preliminar</strong> (arts. 1-4) define el objeto, ámbito subjetivo y otros
  sujetos obligados. Ojo: el artículo 2 amplía la transparencia a partidos políticos, sindicatos,
  organizaciones empresariales y entidades que reciban subvenciones. Es una pregunta recurrente.
</p>

<h2>Publicidad activa (arts. 5-11): lo que la Administración debe publicar</h2>
<p>
  La publicidad activa es la obligación de las Administraciones de publicar <strong>de oficio</strong>
  (sin solicitud) información institucional, organizativa, de planificación, económica y estadística.
  Los artículos clave son:
</p>
<ul>
  <li><strong>Art. 5</strong> — Principios generales: la información debe ser <em>clara, estructurada
  y entendible</em>. Se publicará en las sedes electrónicas o páginas web, preferiblemente en
  <strong>formatos reutilizables</strong>.</li>
  <li><strong>Art. 6</strong> — Información institucional y organizativa: funciones, normativa aplicable,
  estructura organizativa, <em>responsables de los órganos</em> y su perfil.</li>
  <li><strong>Art. 7</strong> — Información de relevancia jurídica: directrices, instrucciones, acuerdos,
  circulares, respuestas a consultas, <em>memorias e informes de los anteproyectos de ley</em>.</li>
  <li><strong>Art. 8</strong> — Información económica, presupuestaria y estadística: contratos (con
  indicación del procedimiento), convenios, subvenciones, presupuestos, cuentas anuales, retribuciones
  de altos cargos, declaraciones anuales de bienes, resoluciones de compatibilidad, información
  estadística para valorar la calidad de los servicios.</li>
  <li><strong>Art. 10</strong> — Portal de la Transparencia: plataforma centralizada del Gobierno
  de España (<code>transparencia.gob.es</code>). Incluye la información de publicidad activa de la AGE
  y acceso al derecho de acceso.</li>
  <li><strong>Art. 11</strong> — Principios técnicos: accesibilidad, interoperabilidad, reutilización.</li>
</ul>
<p>
  <strong>Trampa frecuente</strong>: el art. 6 obliga a publicar el <em>organigrama actualizado</em>,
  pero <strong>no</strong> las retribuciones de todo el personal — solo las de <em>altos cargos</em>
  (art. 8.1.f). El tribunal mezcla ambos artículos para confundir.
</p>

<h2>Derecho de acceso a la información pública (arts. 12-22)</h2>
<p>
  Cualquier persona (no solo ciudadanos españoles) puede ejercer el <strong>derecho de acceso</strong>
  a la información pública. No es necesario motivar la solicitud, aunque si se motiva puede facilitar
  la ponderación de límites. Los artículos más preguntados:
</p>
<ul>
  <li><strong>Art. 12</strong> — Derecho de acceso: todas las personas tienen derecho. Se ejerce sin
  necesidad de acreditar interés legítimo.</li>
  <li><strong>Art. 13</strong> — Información pública: contenidos o documentos, <em>cualquiera que sea
  su formato o soporte</em>, elaborados o adquiridos en el ejercicio de funciones públicas.</li>
  <li><strong>Art. 14</strong> — Límites al derecho de acceso: seguridad nacional, defensa, relaciones
  exteriores, seguridad pública, investigación de infracciones penales/administrativas, igualdad de
  partes en procesos judiciales, funciones administrativas de vigilancia e inspección, intereses
  económicos y comerciales, política económica y monetaria, secreto profesional, propiedad intelectual,
  garantía de la confidencialidad en toma de decisiones, protección del medio ambiente.
  <strong>OJO</strong>: estos límites son <em>tasados</em> (lista cerrada) y deben aplicarse de forma
  <em>proporcionada y justificada</em>.</li>
  <li><strong>Art. 15</strong> — Protección de datos personales: si la información contiene datos
  especialmente protegidos (art. 9.2 LOPDGDD), se requiere consentimiento expreso <strong>y por
  escrito</strong> del afectado, salvo que se hubiesen hecho manifiestamente públicos. Para datos
  meramente identificativos relacionados con la organización del órgano, se concede el acceso.</li>
  <li><strong>Art. 17</strong> — Solicitud de acceso: por cualquier medio que permita tener constancia
  de la identidad del solicitante, la información solicitada, dirección de contacto (preferiblemente
  electrónica) y modalidad de acceso preferida.</li>
  <li><strong>Art. 20</strong> — Resolución: plazo máximo de <strong>un mes</strong> desde la recepción
  de la solicitud por el órgano competente. Si no se resuelve, el <strong>silencio es negativo</strong>
  (desestimatorio).</li>
  <li><strong>Art. 24</strong> — Reclamación ante el Consejo de Transparencia: sustitutiva del recurso
  de alzada (potestativo). Plazo: <strong>un mes</strong> desde la notificación de la resolución o
  desde el silencio. El Consejo resuelve en <strong>tres meses</strong>.</li>
</ul>
<p>
  <strong>Trampa frecuente</strong>: el silencio en derecho de acceso es <strong>negativo</strong>
  (art. 20.4), a diferencia de la regla general de la Ley 39/2015 donde el silencio suele ser
  positivo. El tribunal lo pregunta comparando ambas leyes.
</p>

<h2>Buen gobierno (arts. 25-32): principios y sanciones para altos cargos</h2>
<p>
  El Título II se aplica a los <strong>altos cargos</strong> de la AGE, CCAA y Entidades Locales,
  así como a los de entidades del sector público. Distingue dos tipos de principios:
</p>
<ul>
  <li><strong>Art. 26.2.a</strong> — Principios de actuación: transparencia en la gestión, dedicación
  al servicio público, imparcialidad, no aceptación de regalos, austeridad, <em>accesibilidad</em>,
  eficacia, promoción del entorno cultural y medioambiental, igualdad de trato.</li>
  <li><strong>Art. 26.2.b</strong> — Principios éticos: actuar con integridad, objetividad, no
  intervenir cuando hay conflicto de intereses, no aceptar trato de favor, declarar bienes y
  derechos, ejercer los poderes para la finalidad prevista.</li>
</ul>
<p>
  Las <strong>infracciones</strong> (arts. 28-29) se clasifican en disciplinarias (muy graves y graves,
  derivadas del incumplimiento de la Ley 3/2015 de altos cargos), en materia de gestión
  económico-presupuestaria (comprometer gastos sin crédito, incumplir la Ley de Estabilidad) y en
  materia de conflicto de intereses. Las <strong>sanciones</strong> (art. 30) incluyen destitución,
  no percepción de pensión indemnizatoria, inhabilitación de 5-10 años, y publicación en el BOE.
</p>
<p>
  <strong>Trampa frecuente</strong>: los principios de buen gobierno se aplican a <strong>altos
  cargos</strong>, no a todos los funcionarios. El régimen disciplinario general de los funcionarios
  está en el <a href="/blog/trebep-oposiciones-guia-estatuto-empleado-publico">TREBEP</a>
  (arts. 93-98). El tribunal mezcla ambos ámbitos.
</p>

<h2>El Consejo de Transparencia y Buen Gobierno (arts. 33-40)</h2>
<p>
  El <strong>Consejo de Transparencia y Buen Gobierno</strong> (CTBG) es un organismo público
  independiente, con personalidad jurídica propia, adscrito al <strong>Ministerio de Hacienda</strong>
  (art. 33). Sus funciones principales:
</p>
<ul>
  <li>Resolver las reclamaciones de acceso a la información (art. 24).</li>
  <li>Adoptar recomendaciones para mejorar la transparencia.</li>
  <li>Asesorar en materia de transparencia y buen gobierno.</li>
  <li>Evaluar el grado de cumplimiento de la ley.</li>
  <li>Elaborar una <strong>memoria anual</strong> que presenta a las Cortes Generales (art. 40).</li>
</ul>
<p>
  El CTBG está compuesto por una <strong>Comisión</strong> (órgano colegiado) y un
  <strong>Presidente</strong> (nombrado por un período de <strong>5 años no renovable</strong>,
  por Real Decreto a propuesta del Ministerio de Hacienda, con ratificación por mayoría absoluta
  de la Comisión competente del Congreso — art. 37). El Presidente solo puede ser cesado por causas
  tasadas (renuncia, incapacidad, condena, incumplimiento grave).
</p>
<p>
  <strong>Trampa frecuente</strong>: el mandato del Presidente del CTBG es de <strong>5 años no
  renovables</strong>, no 4 ni 6. Y es ratificado por el <strong>Congreso</strong>, no por el Senado.
</p>

<h2>Tabla de artículos clave por sección</h2>
<table>
  <thead>
    <tr><th>Sección</th><th>Artículos</th><th>Contenido clave</th></tr>
  </thead>
  <tbody>
    <tr><td>Ámbito subjetivo</td><td>2-4</td><td>Sujetos obligados (incluye partidos, sindicatos, entidades subvencionadas)</td></tr>
    <tr><td>Publicidad activa</td><td>5-11</td><td>Información institucional, jurídica, económica. Portal de Transparencia (art. 10)</td></tr>
    <tr><td>Derecho de acceso</td><td>12-22</td><td>Titularidad universal, sin motivar. Límites tasados (art. 14). Silencio negativo (art. 20)</td></tr>
    <tr><td>Reclamación CTBG</td><td>24</td><td>Sustitutiva de alzada. 1 mes para reclamar, 3 meses para resolver</td></tr>
    <tr><td>Buen gobierno — Principios</td><td>25-26</td><td>Éticos y de actuación. Solo altos cargos</td></tr>
    <tr><td>Buen gobierno — Infracciones</td><td>27-29</td><td>Disciplinarias, económico-presupuestarias, conflicto de intereses</td></tr>
    <tr><td>Buen gobierno — Sanciones</td><td>30</td><td>Destitución, inhabilitación 5-10 años, publicación BOE</td></tr>
    <tr><td>Consejo de Transparencia</td><td>33-40</td><td>Organismo independiente. Presidente: 5 años no renovable, ratificación Congreso</td></tr>
  </tbody>
</table>

<h2>Las 6 trampas más comunes del tribunal en la Ley 19/2013</h2>
<ol>
  <li><strong>Silencio negativo vs. positivo</strong>: en derecho de acceso, si la Administración no contesta en 1 mes, la solicitud se entiende <em>desestimada</em>. El tribunal lo compara con la Ley 39/2015.</li>
  <li><strong>Motivación de la solicitud</strong>: NO es obligatorio motivar la solicitud de acceso (art. 17). Si el examen dice que "es requisito motivar", es falso.</li>
  <li><strong>Límites del art. 14</strong>: la lista es <em>cerrada</em> (no se pueden inventar límites). Pero el tribunal añade opciones que suenan plausibles (p.ej., "secreto bancario" no está en el art. 14).</li>
  <li><strong>Publicidad activa vs. derecho de acceso</strong>: publicidad activa es de oficio (sin solicitud); derecho de acceso requiere solicitud. El tribunal las mezcla.</li>
  <li><strong>Buen gobierno = solo altos cargos</strong>: las sanciones del Título II no se aplican a funcionarios de carrera. El régimen disciplinario general está en el TREBEP.</li>
  <li><strong>Presidente CTBG</strong>: 5 años no renovable, ratificación por el Congreso (mayoría absoluta de comisión competente), no por el Senado ni por el Gobierno.</li>
</ol>

<h2>Cómo estudiar la Ley 19/2013 para el examen C1</h2>
<p>
  La Ley de Transparencia tiene la ventaja de ser <strong>corta</strong> (40 artículos) y
  <strong>estructurada</strong>. Te recomendamos:
</p>
<ol>
  <li><strong>Estudia por bloques</strong>: publicidad activa, derecho de acceso y buen gobierno son
  tres mundos distintos. No los mezcles.</li>
  <li><strong>Memoriza los plazos</strong>: 1 mes para resolver acceso, 1 mes para reclamar al CTBG,
  3 meses para que el CTBG resuelva, 5 años del mandato del Presidente.</li>
  <li><strong>Practica con tests cruzados</strong>: las preguntas más difíciles cruzan esta ley con la
  39/2015 y la 40/2015. Practica comparando silencio administrativo, recursos y plazos.</li>
  <li><strong>Usa la tabla de artículos</strong> como chuleta de repaso rápido antes del examen.</li>
</ol>
<p>
  Si ya tienes el <a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">temario
  priorizado por bloques</a>, la Ley de Transparencia debería estar en tu top 10 de temas por
  frecuencia de aparición.
</p>

<p>
  <strong><a href="/register">Empieza gratis en OpoRuta</a></strong> y practica con tests específicos
  de la Ley 19/2013, simulacros de convocatorias reales y análisis detallados de tus errores.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿La Ley de Transparencia entra en el examen de Auxiliar Administrativo (C2)?', answer: 'No de forma directa. La Ley 19/2013 es contenido específico del temario de Administrativo del Estado (C1), dentro del Bloque I. En el C2 puede aparecer alguna referencia tangencial, pero no se exige su estudio detallado.' },
      { question: '¿Cuántos artículos tiene la Ley 19/2013?', answer: 'La ley tiene 40 artículos distribuidos en un título preliminar y tres títulos: Título I (Transparencia, arts. 5-24), Título II (Buen gobierno, arts. 25-32) y Título III (Consejo de Transparencia, arts. 33-40).' },
      { question: '¿Qué es el silencio negativo en el derecho de acceso?', answer: 'Si la Administración no resuelve una solicitud de acceso a la información en el plazo de un mes, se entiende desestimada (silencio negativo, art. 20.4). Esto es una excepción a la regla general de la Ley 39/2015, donde el silencio suele ser positivo.' },
      { question: '¿Es obligatorio motivar la solicitud de acceso a la información?', answer: 'No. El artículo 17 de la Ley 19/2013 establece que no es necesario motivar la solicitud de acceso. Cualquier persona puede solicitar información sin justificar su interés. Sin embargo, si se motiva, puede ayudar a la ponderación cuando hay límites aplicables (art. 14).' },
      { question: '¿Qué es el Portal de Transparencia?', answer: 'Es la plataforma centralizada del Gobierno de España (transparencia.gob.es), regulada en el artículo 10 de la Ley 19/2013. Concentra la información de publicidad activa de la AGE y permite ejercer el derecho de acceso a la información pública de forma electrónica.' },
      { question: '¿Quién es el Presidente del Consejo de Transparencia y cómo se nombra?', answer: 'El Presidente del CTBG se nombra por Real Decreto a propuesta del Ministerio de Hacienda, previa ratificación por mayoría absoluta de la comisión competente del Congreso de los Diputados. Su mandato es de 5 años no renovable y solo puede ser cesado por causas tasadas (art. 37).' },
    ],
  },
  // ─── Post 44 ───────────────────────────────────────────────────────────────
  {
    slug: 'trebep-gestion-personal-administrativo-estado-c1',
    title: 'TREBEP y gestión de personal para Administrativo del Estado (C1): Bloque IV completo',
    description:
      'Guía completa del Bloque IV de Administrativo del Estado (C1): TREBEP, clases de personal, situaciones administrativas, régimen disciplinario, carrera profesional, incompatibilidades y MUFACE. Artículos clave y trampas de examen.',
    date: '2026-03-20',
    dateModified: '2026-03-20',
    keywords: [
      'TREBEP oposiciones administrativo c1',
      'gestion personal administrativo estado',
      'bloque IV administrativo c1',
      'situaciones administrativas funcionarios',
      'regimen disciplinario TREBEP',
    ],
    content: `
<h2>Bloque IV: el más extenso del temario C1</h2>
<p>
  El <strong>Bloque IV (Gestión de personal)</strong> del temario de Administrativo del Estado (C1)
  comprende <strong>9 temas</strong>, lo que lo convierte en el bloque más largo del programa de
  45 temas. Representa aproximadamente un <strong>15% del examen</strong> (unas 15 preguntas de 100),
  con el <strong>Real Decreto Legislativo 5/2015</strong> (TREBEP) como eje vertebrador.
</p>
<p>
  A diferencia del temario C2 donde el TREBEP se estudia de forma resumida, en el C1 se exige un
  conocimiento <strong>detallado artículo por artículo</strong>: clases de personal, adquisición y
  pérdida de la condición de funcionario, situaciones administrativas, derechos retributivos, carrera
  profesional, provisión de puestos, régimen disciplinario, incompatibilidades (Ley 53/1984) y MUFACE.
</p>
<p>
  Esta guía te ofrece un mapa completo del bloque con los artículos clave, las trampas más frecuentes
  del tribunal y una tabla de referencia rápida.
</p>

<h2>Clases de personal al servicio de las Administraciones Públicas (arts. 8-12)</h2>
<p>
  El TREBEP distingue cuatro clases de <strong>empleados públicos</strong> (art. 8):
</p>
<ul>
  <li><strong>Funcionarios de carrera</strong> (art. 9): vinculados por relación estatutaria, nombrados
  legalmente para el desempeño de servicios profesionales retribuidos de carácter permanente.</li>
  <li><strong>Funcionarios interinos</strong> (art. 10): nombrados por razones expresamente justificadas
  de necesidad y urgencia para el desempeño de funciones de funcionarios de carrera. Causas tasadas:
  plazas vacantes, sustitución transitoria, exceso o acumulación de tareas, ejecución de programas
  temporales. <strong>Trampa</strong>: el interino NO tiene derecho a carrera profesional ni a
  promoción interna.</li>
  <li><strong>Personal laboral</strong> (art. 11): contratado por la Administración con contrato
  de trabajo (legislación laboral). Puede ser fijo, por tiempo indefinido o temporal.</li>
  <li><strong>Personal eventual</strong> (art. 12): funciones de confianza o asesoramiento especial.
  Su nombramiento y cese son <strong>libres</strong>. Cesa automáticamente cuando cesa la autoridad
  que lo nombró. <strong>NO puede constituir mérito</strong> para acceso a la función pública.</li>
</ul>
<p>
  <strong>Trampa clásica</strong>: confundir <em>funcionario interino</em> con <em>personal
  eventual</em>. El interino ocupa una plaza de funcionario de carrera por causas justificadas;
  el eventual desempeña funciones de confianza y su cese es libre. El tribunal pregunta
  habitualmente qué pasa cuando cesa la autoridad que nombró al eventual (respuesta: cesa
  automáticamente, art. 12.3).
</p>

<h2>Adquisición y pérdida de la condición de funcionario (arts. 56-68)</h2>
<p>
  La <strong>adquisición</strong> de la condición de funcionario de carrera requiere (art. 62):
</p>
<ol>
  <li>Superar el proceso selectivo.</li>
  <li>Nombramiento por el órgano competente (publicación en BOE).</li>
  <li>Acatamiento de la Constitución y del resto del ordenamiento jurídico.</li>
  <li>Toma de posesión en el plazo establecido.</li>
</ol>
<p>
  Los <strong>requisitos generales</strong> para participar en procesos selectivos (art. 56) incluyen:
  nacionalidad española (con excepciones para nacionales UE), edad mínima de 16 años (sin límite
  máximo salvo jubilación forzosa), titulación exigida, capacidad funcional y no haber sido separado
  del servicio.
</p>
<p>
  La <strong>pérdida</strong> de la condición (arts. 63-68) se produce por: renuncia, pérdida de
  nacionalidad, jubilación (forzosa a los 65 años, con posibilidad de prórroga hasta los 70),
  sanción disciplinaria de separación del servicio y pena principal o accesoria de inhabilitación
  absoluta o especial.
</p>
<p>
  <strong>Trampa frecuente</strong>: la jubilación forzosa es a los <strong>65 años</strong> (art. 67),
  no a los 67 (que es la edad de jubilación en el Régimen General de la Seguridad Social). MUFACE
  tiene su propio régimen.
</p>

<h2>Situaciones administrativas (arts. 85-92)</h2>
<p>
  Las situaciones administrativas son uno de los temas <strong>más preguntados</strong> del Bloque IV.
  El TREBEP regula seis situaciones:
</p>
<ul>
  <li><strong>Servicio activo</strong> (art. 86): el funcionario desempeña su puesto habitual o uno
  de igual nivel. Goza de todos los derechos.</li>
  <li><strong>Servicios especiales</strong> (art. 87): cuando es designado miembro del Gobierno,
  elegido para cargo representativo, nombrado en organismos internacionales, etc. Se le reserva el
  puesto de origen. Computa a efectos de trienios y promoción.</li>
  <li><strong>Servicio en otras AAPP</strong> (art. 88): cuando obtiene puesto en otra Administración
  por transferencia o concurso.</li>
  <li><strong>Excedencia voluntaria por interés particular</strong> (art. 89.2): requiere haber
  prestado servicios efectivos durante al menos <strong>5 años</strong> inmediatamente anteriores.
  No devenga retribuciones ni computa antigüedad. Duración mínima de <strong>2 años</strong>.</li>
  <li><strong>Excedencia voluntaria por agrupación familiar</strong> (art. 89.3): cuando el cónyuge
  reside en otra localidad por obtener puesto de trabajo. No requiere periodo mínimo de servicios.
  Duración mínima: 2 años, máxima: 15 años.</li>
  <li><strong>Excedencia por cuidado de familiares</strong> (art. 89.4): para cuidado de hijos
  (máximo <strong>3 años</strong> desde nacimiento/adopción) o de familiar hasta 2.o grado
  (máximo <strong>3 años</strong>). Reserva de puesto los 2 primeros años; después, puesto en
  la misma localidad e igual retribución.</li>
  <li><strong>Excedencia por razón de violencia de género/terrorismo</strong> (art. 89.5): sin
  necesidad de haber prestado tiempo mínimo. Los 6 primeros meses: reserva de puesto. Computa a
  efectos de trienios, carrera y derechos de la Seguridad Social.</li>
  <li><strong>Suspensión de funciones</strong> (art. 90): provisional (durante procedimiento
  disciplinario o penal, máximo 6 meses) o firme (como consecuencia de sanción o sentencia).</li>
</ul>
<p>
  <strong>Trampa clásica</strong>: confundir <em>excedencia voluntaria por interés particular</em>
  (5 años de servicio previo, no reserva de puesto) con <em>excedencia por cuidado de familiares</em>
  (no requiere servicio previo, sí reserva de puesto los 2 primeros años). El tribunal pregunta
  los requisitos de una poniendo las condiciones de la otra.
</p>

<h2>Derechos y deberes de los funcionarios (arts. 14-15, 52-54)</h2>
<p>
  Los <strong>derechos individuales</strong> (art. 14) incluyen: inamovilidad en la condición de
  funcionario, desempeño de funciones del puesto, progresión en la carrera, retribuciones,
  vacaciones (mínimo <strong>22 días hábiles</strong>), formación continua, respeto a la intimidad,
  libertad de expresión, no discriminación, conciliación, jubilación, asistencia social y libre
  asociación profesional.
</p>
<p>
  Los <strong>derechos colectivos</strong> (art. 15) incluyen: libertad sindical, negociación
  colectiva, huelga (con mantenimiento de servicios esenciales) y reunión.
</p>
<p>
  El <strong>código de conducta</strong> (arts. 52-54) establece principios éticos (art. 53) y
  principios de conducta (art. 54). Los principios éticos incluyen: objetividad, integridad,
  neutralidad, responsabilidad, imparcialidad, confidencialidad, dedicación, transparencia,
  ejemplaridad, austeridad, accesibilidad y eficacia. Los principios de conducta incluyen: tratar
  con atención y respeto a los ciudadanos, desempeñar las tareas con diligencia, cumplir la jornada,
  mantener actualizada su formación y observar las normas de seguridad y salud laboral.
</p>

<h2>Régimen disciplinario (arts. 93-98)</h2>
<p>
  El régimen disciplinario del TREBEP clasifica las <strong>faltas</strong> en muy graves,
  graves y leves:
</p>
<ul>
  <li><strong>Faltas muy graves</strong> (art. 95.2): incumplimiento del deber de fidelidad a la
  Constitución, discriminación, abandono de servicio, adopción de acuerdos manifiestamente ilegales,
  publicación o uso indebido de documentación, negligencia grave en custodia de secretos, notorio
  incumplimiento de funciones, desobediencia abierta a órdenes, acoso laboral/sexual, y otras
  previstas en ley.</li>
  <li><strong>Faltas graves y leves</strong>: se regulan por ley de desarrollo (no directamente
  en el TREBEP).</li>
</ul>
<p>
  Las <strong>sanciones</strong> (art. 96) incluyen: separación del servicio (solo para faltas muy
  graves, irrevocable), despido disciplinario (para laborales), suspensión firme de funciones
  (máximo <strong>6 años</strong> para faltas muy graves, máximo <strong>3 años</strong> para graves),
  traslado forzoso y apercibimiento (para leves).
</p>
<p>
  <strong>Prescripción</strong> (art. 97): las faltas muy graves prescriben a los <strong>3 años</strong>,
  las graves a los <strong>2 años</strong> y las leves a los <strong>6 meses</strong>. Las sanciones:
  muy graves 3 años, graves 2 años, leves 1 año. <strong>Trampa</strong>: la prescripción de sanciones
  leves (1 año) no coincide con la de faltas leves (6 meses).
</p>

<h2>Carrera profesional y provisión de puestos (arts. 16-20, 78-84)</h2>
<p>
  El TREBEP regula cuatro modalidades de <strong>carrera profesional</strong> (art. 16):
</p>
<ul>
  <li><strong>Carrera horizontal</strong>: progresión de grado, categoría o escalón sin cambio de
  puesto de trabajo. Basada en competencias, formación y antigüedad.</li>
  <li><strong>Carrera vertical</strong>: ascenso en la estructura de puestos mediante provisión
  (concurso o libre designación).</li>
  <li><strong>Promoción interna vertical</strong>: ascenso al cuerpo inmediato superior (ej. C2 a C1).</li>
  <li><strong>Promoción interna horizontal</strong>: acceso a cuerpos del mismo subgrupo.</li>
</ul>
<p>
  La <strong>provisión de puestos</strong> (arts. 78-84) se realiza por dos procedimientos:
</p>
<ul>
  <li><strong>Concurso</strong> (art. 79): procedimiento <em>normal</em> de provisión. Valora méritos
  (antigüedad, formación, grado personal). Es la regla general.</li>
  <li><strong>Libre designación</strong> (art. 80): para puestos de especial responsabilidad
  y confianza. Convocatoria pública, pero la resolución es discrecional. El funcionario puede ser
  cesado libremente.</li>
</ul>
<p>
  <strong>Trampa frecuente</strong>: el concurso es el procedimiento <em>normal</em> (regla general)
  y la libre designación es <em>excepcional</em>. El tribunal invierte los términos.
</p>

<h2>Incompatibilidades (Ley 53/1984) y MUFACE</h2>
<p>
  La <strong>Ley 53/1984, de 26 de diciembre, de Incompatibilidades</strong> establece el principio
  general de <strong>dedicación a un solo puesto</strong> en el sector público, con excepciones
  tasadas. Los puntos más preguntados:
</p>
<ul>
  <li>El personal al servicio de las AAPP no podrá compatibilizar sus actividades con el desempeño
  de un <strong>segundo puesto público</strong>, salvo excepciones (docencia universitaria,
  sanitarios en determinados supuestos).</li>
  <li>Las actividades <strong>privadas</strong> requieren autorización de compatibilidad y no pueden
  estar relacionadas directamente con las funciones del puesto público.</li>
  <li>La <strong>pertenencia a consejos de administración</strong> de empresas privadas es
  incompatible (art. 12).</li>
  <li>Quedan excepcionadas: producción literaria, artística, científica; participación ocasional
  en congresos; administración del patrimonio personal.</li>
</ul>
<p>
  <strong>MUFACE</strong> (Mutualidad General de Funcionarios Civiles del Estado) proporciona
  asistencia sanitaria a los funcionarios de la AGE. Los puntos clave para el examen: MUFACE ofrece
  la opción de elegir entre <strong>sanidad pública (INSS)</strong> y <strong>entidades de seguro
  privadas</strong>; la elección se realiza en enero de cada año; los funcionarios interinos con
  nombramiento superior a un año también pueden acogerse; y la jubilación forzosa en Clases Pasivas
  es a los <strong>65 años</strong> (no 67).
</p>

<h2>Tabla de artículos clave del Bloque IV</h2>
<table>
  <thead>
    <tr><th>Tema</th><th>Norma</th><th>Artículos</th><th>Contenido clave</th></tr>
  </thead>
  <tbody>
    <tr><td>Clases de personal</td><td>TREBEP</td><td>8-12</td><td>Funcionario carrera, interino, laboral, eventual</td></tr>
    <tr><td>Derechos individuales</td><td>TREBEP</td><td>14</td><td>Inamovilidad, retribuciones, 22 días vacaciones</td></tr>
    <tr><td>Derechos colectivos</td><td>TREBEP</td><td>15</td><td>Sindicación, negociación, huelga, reunión</td></tr>
    <tr><td>Carrera profesional</td><td>TREBEP</td><td>16-19</td><td>Horizontal, vertical, promoción interna</td></tr>
    <tr><td>Código de conducta</td><td>TREBEP</td><td>52-54</td><td>Principios éticos y de conducta</td></tr>
    <tr><td>Acceso función pública</td><td>TREBEP</td><td>56-62</td><td>Requisitos, procesos selectivos, adquisición condición</td></tr>
    <tr><td>Pérdida condición</td><td>TREBEP</td><td>63-68</td><td>Renuncia, jubilación 65 años, separación servicio</td></tr>
    <tr><td>Provisión puestos</td><td>TREBEP</td><td>78-84</td><td>Concurso (normal) vs. libre designación (excepcional)</td></tr>
    <tr><td>Situaciones administrativas</td><td>TREBEP</td><td>85-92</td><td>Activo, especiales, excedencias, suspensión</td></tr>
    <tr><td>Régimen disciplinario</td><td>TREBEP</td><td>93-98</td><td>Faltas, sanciones, prescripción (3/2/0,5 años)</td></tr>
    <tr><td>Incompatibilidades</td><td>Ley 53/1984</td><td>—</td><td>Un solo puesto público, actividades privadas autorizadas</td></tr>
    <tr><td>MUFACE</td><td>RDL 4/2000</td><td>—</td><td>Sanidad pública o privada, elección anual enero</td></tr>
  </tbody>
</table>

<h2>Estrategia de estudio para el Bloque IV</h2>
<p>
  Con 9 temas y un 15% del examen, el Bloque IV exige una estrategia eficiente:
</p>
<ol>
  <li><strong>Prioriza situaciones administrativas y régimen disciplinario</strong>: son los temas
  con más preguntas directas. Memoriza plazos de prescripción y requisitos de cada excedencia.</li>
  <li><strong>Domina las clases de personal</strong>: interino vs. eventual es una pregunta casi
  segura. Aprende los matices del art. 10 (causas de interinidad) y del art. 12 (cese automático
  del eventual).</li>
  <li><strong>No subestimes incompatibilidades</strong>: la Ley 53/1984 suele caer con 1-2 preguntas
  sobre excepciones (docencia, patrimonio personal, producción literaria).</li>
  <li><strong>Usa tablas comparativas</strong>: excedencia voluntaria vs. por cuidado de familiares;
  concurso vs. libre designación; faltas muy graves vs. graves.</li>
  <li><strong>Practica con tests cruzados</strong>: el tribunal cruza el TREBEP con la Ley 39/2015
  (interesados, plazos) y con la Ley de Transparencia (principios de actuación vs. código de
  conducta).</li>
</ol>
<p>
  Si necesitas priorizar los 45 temas del temario, consulta nuestra
  <a href="/blog/temario-administrativo-estado-c1-45-temas-como-priorizar">guía de priorización
  por bloques</a>. Para una visión general del TREBEP más allá del C1, revisa la
  <a href="/blog/trebep-oposiciones-guia-estatuto-empleado-publico">guía completa del TREBEP
  para oposiciones</a>.
</p>

<p>
  <strong><a href="/register">Empieza gratis en OpoRuta</a></strong> y practica con tests específicos
  del Bloque IV, simulacros de convocatorias reales y análisis detallados de tus errores.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuántos temas tiene el Bloque IV de Administrativo del Estado C1?', answer: 'El Bloque IV (Gestión de recursos humanos) tiene 9 temas, lo que lo convierte en el bloque más extenso del temario de 45 temas. Representa aproximadamente un 15% del examen (unas 15 preguntas de 100 puntuables).' },
      { question: '¿Cuál es la diferencia entre funcionario interino y personal eventual?', answer: 'El funcionario interino (art. 10 TREBEP) ocupa una plaza de funcionario de carrera por causas justificadas (vacante, sustitución, acumulación de tareas). El personal eventual (art. 12) desempeña funciones de confianza o asesoramiento especial, su nombramiento y cese son libres, y cesa automáticamente cuando cesa la autoridad que lo nombró.' },
      { question: '¿Cuánto tiempo de servicio previo se necesita para la excedencia voluntaria por interés particular?', answer: 'Se requiere haber prestado servicios efectivos durante al menos 5 años inmediatamente anteriores a la solicitud (art. 89.2 TREBEP). La duración mínima de la excedencia es de 2 años continuados. Durante la excedencia no se devengan retribuciones ni computa antigüedad.' },
      { question: '¿En cuánto tiempo prescriben las faltas disciplinarias de los funcionarios?', answer: 'Según el artículo 97 del TREBEP: las faltas muy graves prescriben a los 3 años, las graves a los 2 años y las leves a los 6 meses. Atención: la prescripción de las sanciones no coincide exactamente (leves: 1 año vs. faltas leves: 6 meses).' },
      { question: '¿Qué es la provisión de puestos por concurso?', answer: 'El concurso (art. 79 TREBEP) es el procedimiento normal (regla general) de provisión de puestos de trabajo. Valora los méritos y capacidades de los candidatos: antigüedad, formación, grado personal consolidado. La libre designación (art. 80) es el procedimiento excepcional, reservado a puestos de especial responsabilidad y confianza.' },
      { question: '¿A qué edad es la jubilación forzosa de los funcionarios?', answer: 'La jubilación forzosa es a los 65 años (art. 67 TREBEP), con posibilidad de prórroga hasta los 70 años en determinados supuestos. No debe confundirse con la edad de jubilación del Régimen General de la Seguridad Social (67 años). Los funcionarios de la AGE cotizan a MUFACE/Clases Pasivas, no al INSS.' },
    ],
  },

  // ─── Post 45 — GACE A2: Guía informativa ───────────────────────────────────
  {
    slug: 'oposiciones-gestion-estado-gace-a2-2026-plazas-temario-fechas',
    title: 'Oposiciones Gestión del Estado (GACE A2) 2026: plazas, temario, nota de corte y fechas',
    description:
      'Todo lo que necesitas saber sobre la oposición GACE A2 2026: 1.356 plazas, 58 temas en 6 bloques, examen el 23 de mayo de 2026 y nota de corte histórica. Incluye sueldo, requisitos y cómo preparar el supuesto práctico.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'oposiciones gestión del estado 2026',
      'GACE A2 plazas 2026',
      'gestión administración civil del estado',
      'oposiciones A2 AGE',
      'temario GACE 2026',
      'nota de corte GACE',
      'sueldo gestión del estado',
    ],
    content: `
<h2>1.356 plazas para Gestión del Estado (A2) en 2026</h2>
<p>
  La convocatoria GACE 2026 ofrece <strong>1.356 plazas</strong> para el Cuerpo de Gestión de la
  Administración Civil del Estado, subgrupo A2. Es una de las mayores ofertas de empleo público
  en la AGE, solo por detrás de Auxiliar Administrativo (C2). El examen se celebra el
  <strong>23 de mayo de 2026</strong>, el mismo día que las pruebas de C1 (Administrativo) y
  C2 (Auxiliar) — lo que obliga a elegir una sola oposición.
</p>

<h2>Requisitos para presentarse</h2>
<ul>
  <li><strong>Titulación:</strong> Grado universitario, diplomatura, ingeniería técnica o equivalente.</li>
  <li><strong>Nacionalidad:</strong> Española o de un Estado miembro de la UE.</li>
  <li><strong>Edad:</strong> Mayor de 16 años, sin límite superior (salvo jubilación forzosa a los 65).</li>
  <li><strong>No estar inhabilitado</strong> para funciones públicas ni separado del servicio.</li>
</ul>

<h2>Estructura del examen GACE</h2>
<p>
  El proceso selectivo consta de <strong>dos ejercicios</strong>, ambos eliminatorios:
</p>
<ol>
  <li>
    <strong>Primer ejercicio (tipo test):</strong> 50 preguntas con 4 opciones de respuesta
    sobre los 58 temas del programa. Penalización de 1/3 por respuesta incorrecta.
    Duración: 60 minutos. Se puntúa de 0 a 50.
  </li>
  <li>
    <strong>Segundo ejercicio (supuesto práctico):</strong> Elegir 1 de 2 supuestos prácticos.
    Cada supuesto tiene 5 preguntas a desarrollar sobre los Bloques IV, V y VI del temario
    (contratación pública, gestión financiera y recursos humanos). Duración: 150 minutos.
    Se puntúa de 0 a 50.
  </li>
</ol>
<p>
  La <strong>nota final</strong> es la suma de ambos ejercicios (máximo 100 puntos).
  Históricamente, la nota de corte se sitúa entre <strong>49 y 52 puntos</strong> sobre 100.
</p>

<h2>Los 58 temas en 6 bloques</h2>
<ul>
  <li><strong>Bloque I — Organización del Estado (9 temas):</strong> Constitución, Corona, Cortes, Gobierno, Poder Judicial, organización territorial.</li>
  <li><strong>Bloque II — Administración Pública (11 temas):</strong> LRJSP, LPAC, administración electrónica, contratos menores.</li>
  <li><strong>Bloque III — Unión Europea (5 temas):</strong> Instituciones, derecho comunitario, presupuesto UE.</li>
  <li><strong>Bloque IV — Gestión financiera (12 temas):</strong> LGP, Ley General Tributaria, contabilidad pública, Seguridad Social.</li>
  <li><strong>Bloque V — Contratación pública (10 temas):</strong> LCSP, tipos de contratos, procedimientos de adjudicación, recursos especiales.</li>
  <li><strong>Bloque VI — Recursos humanos (11 temas):</strong> TREBEP, situaciones administrativas, retribuciones, Seguridad Social de funcionarios.</li>
</ul>
<p>
  Los bloques IV, V y VI son especialmente críticos: además de caer en el test, son la base del
  <strong>supuesto práctico</strong>, que vale el 50% de la nota final.
</p>

<h2>Sueldo de un Gestor del Estado (A2)</h2>
<p>
  Un funcionario del Cuerpo de Gestión de la AGE percibe entre <strong>1.900€ y 3.000€ netos/mes</strong>
  (14 pagas), dependiendo del complemento específico del puesto, destino y antigüedad.
  El sueldo base A2 más complemento de destino nivel 18 ronda los 1.900€ netos; con nivel 24-26
  y trienios, puede superar los 2.800€.
</p>
<ul>
  <li>Sueldo base A2: ~960€/mes</li>
  <li>Complemento de destino (nivel 18-26): ~460-720€/mes</li>
  <li>Complemento específico: variable según puesto (400-1.000€/mes)</li>
  <li>14 pagas + trienios (~42€/trienio mensual)</li>
</ul>

<h2>¿Por qué preparar la GACE con OpoRuta?</h2>
<p>
  OpoRuta es la <strong>única plataforma online que corrige el supuesto práctico con IA</strong>,
  usando la rúbrica oficial del INAP (conocimiento aplicado 60%, análisis 20%, sistemática 10%,
  expresión 10%). Las academias presenciales cobran <strong>140€/mes</strong> solo por la corrección
  de supuestos — OpoRuta lo incluye por <strong>69,99€ de pago único</strong>.
</p>
<p>
  Además, tienes tests para los 58 temas del temario, simulacros con preguntas oficiales,
  flashcards con repetición espaciada y análisis detallados de tus errores.
</p>
<p>
  <strong><a href="/register">Empieza a preparar tu oposición GACE con OpoRuta</a></strong> — incluye
  corrección de supuesto práctico con IA, tests por tema y simulacros oficiales.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuántas plazas hay para Gestión del Estado (GACE A2) en 2026?', answer: 'La convocatoria 2026 ofrece 1.356 plazas para el Cuerpo de Gestión de la Administración Civil del Estado (subgrupo A2). Es una de las mayores ofertas en la AGE.' },
      { question: '¿Cuándo es el examen GACE 2026?', answer: 'El examen está convocado para el 23 de mayo de 2026. Coincide con las pruebas de C1 (Administrativo) y C2 (Auxiliar), por lo que no puedes presentarte a más de una el mismo día.' },
      { question: '¿Qué título necesito para presentarme a la GACE?', answer: 'Necesitas un título de Grado universitario, Diplomatura, Ingeniería Técnica, Arquitectura Técnica o equivalente. Es una oposición del subgrupo A2, que exige titulación universitaria.' },
      { question: '¿Cuánto cobra un Gestor del Estado?', answer: 'El sueldo neto oscila entre 1.900€ y 3.000€ mensuales en 14 pagas, dependiendo del nivel del puesto (18-26), complemento específico y antigüedad. El sueldo base A2 es de unos 960€/mes, al que se suman complementos.' },
      { question: '¿Cuántos temas tiene el temario GACE?', answer: 'El temario consta de 58 temas distribuidos en 6 bloques: Organización del Estado (9), Administración Pública (11), Unión Europea (5), Gestión financiera (12), Contratación pública (10) y Recursos humanos (11).' },
    ],
  },

  // ─── Post 46 — GACE: Temario y priorización ────────────────────────────────
  {
    slug: 'temario-gace-2026-58-temas-6-bloques-como-priorizar',
    title: 'Temario GACE 2026: 58 temas en 6 bloques — cómo priorizar tu estudio',
    description:
      'Análisis completo de los 58 temas del temario de Gestión del Estado (A2) 2026. Cómo priorizar los 6 bloques, cuáles pesan más en el supuesto práctico y estrategia de estudio eficiente.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'temario GACE 2026',
      'temario gestión del estado A2',
      '58 temas GACE',
      'bloques temario GACE',
      'cómo estudiar GACE',
      'priorizar temario oposiciones A2',
    ],
    content: `
<h2>Los 58 temas del temario GACE: visión general</h2>
<p>
  El temario oficial del Cuerpo de Gestión de la Administración Civil del Estado (GACE, subgrupo A2)
  consta de <strong>58 temas</strong> organizados en <strong>6 bloques</strong>. No todos los bloques
  tienen el mismo peso: los bloques IV, V y VI no solo aparecen en el examen tipo test, sino que son
  la base exclusiva del <strong>supuesto práctico</strong> (50% de la nota final).
</p>
<p>
  Esto significa que si priorizas mal, puedes aprobar el test y suspender el supuesto — o viceversa.
  La clave es una estrategia de estudio que cubra todo el temario pero ponga el foco en los bloques
  que más puntos aportan.
</p>

<h2>Bloque I — Organización del Estado y Constitución (9 temas)</h2>
<p>
  Temas 1 a 9. Constitución Española, Corona, Cortes Generales, Gobierno y Administración,
  Poder Judicial, organización territorial del Estado, Comunidades Autónomas y Administración Local.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~15% (7-8 preguntas de 50).</li>
  <li><strong>Peso en el supuesto:</strong> No aparece directamente.</li>
  <li><strong>Estrategia:</strong> Estudiar sólido pero sin obsesionarse. La CE es pura memoria — usa flashcards con repetición espaciada.</li>
</ul>

<h2>Bloque II — Administración Pública (11 temas)</h2>
<p>
  Temas 10 a 20. LRJSP, LPAC (procedimiento administrativo común), administración electrónica,
  protección de datos (LOPDGDD), transparencia y buen gobierno, atención al ciudadano.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~20% (10-11 preguntas).</li>
  <li><strong>Peso en el supuesto:</strong> Indirecto — la LPAC aparece como procedimiento base en muchos supuestos.</li>
  <li><strong>Leyes clave:</strong> LPAC (Ley 39/2015) representa el 17,5% del temario total. Es la ley transversal por excelencia.</li>
  <li><strong>Estrategia:</strong> Dominar LPAC es rentabilísimo — cae en test Y en supuesto. Prioridad alta.</li>
</ul>

<h2>Bloque III — Unión Europea (5 temas)</h2>
<p>
  Temas 21 a 25. Instituciones de la UE, derecho comunitario, presupuesto de la UE, fondos europeos.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~8% (4-5 preguntas).</li>
  <li><strong>Peso en el supuesto:</strong> No aparece.</li>
  <li><strong>Estrategia:</strong> Es el bloque más pequeño y con menor retorno. Estudiar para asegurar las 4-5 preguntas del test, sin profundizar en exceso.</li>
</ul>

<h2>Bloque IV — Gestión financiera (12 temas) ⚡ CRÍTICO</h2>
<p>
  Temas 26 a 37. Ley General Presupuestaria (LGP), presupuestos generales del Estado,
  gasto público, Ley General Tributaria, contabilidad pública, Seguridad Social, TRLGSS.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~20% (10-11 preguntas).</li>
  <li><strong>Peso en el supuesto:</strong> ALTO — los supuestos SIEMPRE incluyen cuestiones de gestión presupuestaria y financiera.</li>
  <li><strong>Leyes clave:</strong> LGP (Ley 47/2003), Ley General Tributaria (Ley 58/2003).</li>
  <li><strong>Estrategia:</strong> Prioridad máxima. Cada hora invertida aquí rinde doble: en test y en supuesto.</li>
</ul>

<h2>Bloque V — Contratación pública (10 temas) ⚡ CRÍTICO</h2>
<p>
  Temas 38 a 47. Ley de Contratos del Sector Público (LCSP), tipos de contratos, preparación
  y adjudicación, ejecución, modificación y resolución, recursos especiales, encargos a medios propios.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~17% (8-9 preguntas).</li>
  <li><strong>Peso en el supuesto:</strong> MUY ALTO — la contratación es el pilar central de la mayoría de supuestos INAP.</li>
  <li><strong>Leyes clave:</strong> LCSP (Ley 9/2017) — representa el 9,9% del temario total pero aparece en el 90% de los supuestos prácticos.</li>
  <li><strong>Estrategia:</strong> PRIORIDAD ABSOLUTA. Dominar LCSP es la diferencia entre aprobar y suspender el supuesto práctico.</li>
</ul>

<h2>Bloque VI — Recursos humanos (11 temas) ⚡ CRÍTICO</h2>
<p>
  Temas 48 a 58. TREBEP, selección de personal, provisión de puestos, situaciones administrativas,
  retribuciones, régimen disciplinario, Seguridad Social de funcionarios (MUFACE/Clases Pasivas),
  prevención de riesgos laborales, negociación colectiva.
</p>
<ul>
  <li><strong>Peso en el test:</strong> ~20% (10-11 preguntas).</li>
  <li><strong>Peso en el supuesto:</strong> ALTO — siempre hay al menos 1-2 preguntas de RRHH en el supuesto.</li>
  <li><strong>Leyes clave:</strong> TREBEP (RDLeg 5/2015).</li>
  <li><strong>Estrategia:</strong> Prioridad alta. El TREBEP comparte estructura con el temario C1 — si vienes de preparar C1, tienes ventaja.</li>
</ul>

<h2>Distribución de horas recomendada</h2>
<p>
  Basado en el análisis del peso de cada bloque en test + supuesto práctico:
</p>
<ul>
  <li><strong>Bloques IV + V + VI (contratación, finanzas, RRHH):</strong> 55-60% del tiempo total de estudio.</li>
  <li><strong>Bloque II (Administración Pública / LPAC):</strong> 20% del tiempo.</li>
  <li><strong>Bloque I (Constitución):</strong> 12-15% del tiempo.</li>
  <li><strong>Bloque III (UE):</strong> 5-8% del tiempo.</li>
</ul>
<p>
  Un opositor que dedique 8 meses a tiempo parcial (2-3 horas/día) puede cubrir los 58 temas
  si prioriza correctamente. A tiempo completo (6-8 horas/día), 4-5 meses son suficientes.
</p>

<h2>OpoRuta tiene tests para los 58 temas</h2>
<p>
  En OpoRuta puedes practicar test por test para cada uno de los 58 temas del temario GACE.
  Además, la plataforma es la <strong>única que corrige el supuesto práctico con IA</strong>,
  evaluando tu respuesta con la misma rúbrica que usa el INAP (conocimiento aplicado, análisis,
  sistemática, expresión escrita).
</p>
<p>
  Las academias cobran <strong>140€/mes</strong> solo por corregir supuestos. OpoRuta incluye
  todo — tests, simulacros, supuesto práctico y corrección IA — por <strong>69,99€ de pago único</strong>.
</p>
<p>
  <strong><a href="/register">Empieza a estudiar los 58 temas del GACE con OpoRuta</a></strong>
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cuántos temas tiene el temario GACE 2026?', answer: 'El temario consta de 58 temas distribuidos en 6 bloques: Organización del Estado (9), Administración Pública (11), Unión Europea (5), Gestión financiera (12), Contratación pública (10) y Recursos humanos (11).' },
      { question: '¿Cuáles son los bloques más importantes del temario GACE?', answer: 'Los bloques IV (Gestión financiera), V (Contratación pública) y VI (Recursos humanos) son los más importantes porque, además de caer en el examen tipo test, son la base exclusiva del supuesto práctico, que vale el 50% de la nota final.' },
      { question: '¿Cuánto tiempo necesito para preparar los 58 temas?', answer: 'A tiempo parcial (2-3 horas/día), unos 8 meses. A tiempo completo (6-8 horas/día), 4-5 meses. La clave es priorizar: dedica el 55-60% del tiempo a los bloques IV, V y VI (contratación, finanzas y RRHH) porque pesan doble (test + supuesto práctico).' },
      { question: '¿Qué ley es la más importante del temario GACE?', answer: 'La LCSP (Ley 9/2017 de Contratos del Sector Público) es la ley más determinante: aunque solo ocupa el 9,9% del temario, aparece en el 90% de los supuestos prácticos. Le siguen la LGP (gestión financiera) y el TREBEP (recursos humanos).' },
      { question: '¿Puedo preparar la GACE si ya he estudiado el temario C1?', answer: 'Sí, hay solapamiento significativo en bloques I, II y parcialmente en el VI (TREBEP). Sin embargo, el GACE añade bloques específicos de contratación pública (LCSP), gestión financiera (LGP) y un supuesto práctico a desarrollar que no existe en el C1.' },
    ],
  },

  // ─── Post 47 — Supuesto práctico GACE (POST CLAVE) ─────────────────────────
  {
    slug: 'supuesto-practico-gace-que-es-como-se-evalua-como-prepararlo',
    title: 'Supuesto práctico GACE: qué es, cómo se evalúa y cómo prepararlo con IA',
    description:
      'Guía completa del supuesto práctico de Gestión del Estado (A2): formato, rúbrica oficial del INAP con 4 criterios, patrones de exámenes reales y cómo practicarlo con corrección de IA en OpoRuta.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'supuesto práctico GACE',
      'supuesto práctico gestión del estado',
      'rúbrica INAP supuesto práctico',
      'cómo preparar supuesto práctico A2',
      'corrección supuesto práctico IA',
      'supuesto práctico oposiciones con IA',
      'OpoRuta supuesto práctico',
    ],
    content: `
<h2>¿Qué es el supuesto práctico del GACE?</h2>
<p>
  El supuesto práctico es el <strong>segundo ejercicio</strong> de la oposición de Gestión del Estado
  (A2) y vale <strong>50 puntos sobre 100</strong> — exactamente la mitad de la nota final.
  Muchos opositores aprueban el test y suspenden el supuesto, porque nadie les ha enseñado a
  estructurar la respuesta ni les ha dado feedback real sobre sus escritos.
</p>
<p>
  El formato es el siguiente:
</p>
<ul>
  <li>Se presentan <strong>2 supuestos</strong> y debes elegir 1.</li>
  <li>Cada supuesto contiene <strong>5 preguntas a desarrollar</strong> sobre un caso práctico.</li>
  <li>Dispones de <strong>150 minutos</strong> (2 horas y media).</li>
  <li>Se permite el uso del programa de la oposición (los 58 temas), pero NO legislación.</li>
  <li>Las preguntas versan sobre los <strong>Bloques IV, V y VI</strong>: contratación pública, gestión financiera y recursos humanos.</li>
</ul>

<h2>Patrón de los supuestos INAP: siempre mezclan 3 áreas</h2>
<p>
  Tras analizar los supuestos de convocatorias anteriores, hay un patrón claro: el INAP
  <strong>siempre combina</strong> al menos 3 de estas áreas en un mismo supuesto:
</p>
<ol>
  <li><strong>Contratación pública (LCSP):</strong> Tipo de contrato, procedimiento de adjudicación, criterios de selección, mesa de contratación.</li>
  <li><strong>Gestión presupuestaria (LGP):</strong> Créditos presupuestarios, fases del gasto (autorización, disposición, obligación, pago), modificaciones de crédito.</li>
  <li><strong>Gestión de personal (TREBEP):</strong> Selección, provisión de puestos, situaciones administrativas, régimen disciplinario, retribuciones.</li>
</ol>
<p>
  Un supuesto típico plantea un escenario como: <em>"El Ministerio X necesita contratar un servicio Y.
  Determine el tipo de contrato, el procedimiento de adjudicación, la tramitación presupuestaria
  necesaria y las implicaciones en materia de personal."</em> Las 5 preguntas recorren las 3 áreas.
</p>

<h2>La rúbrica oficial del INAP: 4 criterios de evaluación</h2>
<p>
  El tribunal del INAP evalúa cada supuesto práctico según <strong>4 criterios ponderados</strong>:
</p>
<ul>
  <li>
    <strong>Conocimiento aplicado (0-30 puntos, 60% del peso):</strong>
    Dominio de la legislación aplicable al caso. Cita correcta de artículos, leyes y procedimientos.
    No basta con nombrar la ley — hay que aplicarla al supuesto concreto.
  </li>
  <li>
    <strong>Capacidad de análisis (0-10 puntos, 20% del peso):</strong>
    Identificar los problemas jurídicos del caso, relacionar normas entre sí,
    detectar conflictos o lagunas legales. El tribunal valora que identifiques matices,
    no que respondas de forma genérica.
  </li>
  <li>
    <strong>Sistemática y organización (0-5 puntos, 10% del peso):</strong>
    Estructura de la respuesta: introducción breve, desarrollo ordenado por puntos,
    conclusión. Uso de epígrafes y numeración. El tribunal lee decenas de exámenes —
    una respuesta bien organizada destaca inmediatamente.
  </li>
  <li>
    <strong>Expresión escrita (0-5 puntos, 10% del peso):</strong>
    Corrección gramatical, ortografía, claridad expositiva. Uso adecuado del lenguaje
    jurídico-administrativo. Las faltas de ortografía restan puntos directamente.
  </li>
</ul>
<p>
  <strong>Total: 50 puntos.</strong> Para aprobar el supuesto necesitas un mínimo de 25/50.
  Con una nota de 30-35 en el supuesto, combinada con un buen test, sueles superar la nota de corte.
</p>

<h2>El problema: nadie corrige tu supuesto (hasta ahora)</h2>
<p>
  Esta es la gran frustración de los opositores GACE: puedes estudiar los 58 temas, hacer tests
  hasta memorizarlos, pero <strong>no hay forma de practicar el supuesto práctico</strong> si nadie
  te lo corrige.
</p>
<ul>
  <li><strong>Estudiar solo:</strong> Puedes escribir supuestos, pero sin feedback no sabes si tu estructura es correcta, si citas bien la legislación o si te dejas puntos por mala expresión.</li>
  <li><strong>Academias presenciales:</strong> Ofrecen corrección humana, pero cobran <strong>140€/mes</strong> y tardan <strong>1-2 semanas</strong> en devolverte el supuesto corregido. En 6 meses de preparación, son 840€ solo en correcciones.</li>
  <li><strong>Plataformas online (OpositaTest, etc.):</strong> Tienen tests tipo test, pero <strong>ninguna corrige supuestos prácticos</strong>. Es su gran limitación.</li>
</ul>

<h2>OpoRuta: la única plataforma que corrige el supuesto con IA</h2>
<p>
  OpoRuta ha desarrollado un sistema de <strong>corrección de supuesto práctico con inteligencia artificial</strong>
  que replica la evaluación del tribunal INAP. Así funciona:
</p>
<ol>
  <li><strong>Genera un caso práctico:</strong> La IA crea un supuesto realista basado en los patrones del INAP (contratación + presupuestos + personal).</li>
  <li><strong>Escribe tu respuesta:</strong> Respondes las 5 preguntas como en el examen real, con tiempo libre o con cronómetro.</li>
  <li><strong>Corrección automática:</strong> La IA evalúa tu respuesta usando los <strong>mismos 4 criterios del INAP</strong>:
    <ul>
      <li>Conocimiento aplicado: 0-30 puntos</li>
      <li>Análisis: 0-10 puntos</li>
      <li>Sistemática: 0-5 puntos</li>
      <li>Expresión: 0-5 puntos</li>
    </ul>
  </li>
  <li><strong>Feedback detallado:</strong> Recibes una nota sobre 50, desglose por criterio, artículos que faltaron en tu respuesta, y una respuesta modelo para comparar.</li>
</ol>
<p>
  El feedback es <strong>instantáneo</strong> — no esperas 1-2 semanas como en una academia.
  Y el coste es radicalmente diferente:
</p>
<ul>
  <li><strong>Academia presencial:</strong> 140€/mes × 6 meses = 840€</li>
  <li><strong>OpoRuta:</strong> 69,99€ pago único (incluye tests, simulacros, supuesto práctico y corrección IA)</li>
</ul>

<h2>Cómo preparar el supuesto práctico: 5 consejos</h2>
<ol>
  <li><strong>Domina las 3 leyes del supuesto:</strong> LCSP, LGP y TREBEP. El 90% de las preguntas del supuesto se resuelven con estas 3 leyes.</li>
  <li><strong>Practica la estructura:</strong> Cada respuesta debe tener: fundamento legal → aplicación al caso → conclusión. El tribunal penaliza respuestas desordenadas.</li>
  <li><strong>Cita artículos concretos:</strong> No basta con decir "según la LCSP". El tribunal quiere ver "art. 131.2 LCSP" o "art. 22.1 LGP". El conocimiento aplicado vale 30 de 50 puntos.</li>
  <li><strong>Escribe supuestos completos con cronómetro:</strong> 150 minutos para 5 preguntas = 30 minutos por pregunta. Si no gestionas el tiempo, la última pregunta queda en blanco.</li>
  <li><strong>Busca feedback real:</strong> Escribir sin corrección es como estudiar sin examinarte. Usa OpoRuta para obtener corrección instantánea con la rúbrica del INAP.</li>
</ol>

<p>
  <strong><a href="/register">Practica tu supuesto práctico con corrección IA en OpoRuta</a></strong> — la
  única plataforma que evalúa tu respuesta con los 4 criterios del tribunal INAP, por 69,99€
  de pago único.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cómo se evalúa el supuesto práctico del GACE?', answer: 'El tribunal del INAP evalúa según 4 criterios: conocimiento aplicado (0-30 puntos, 60%), capacidad de análisis (0-10 puntos, 20%), sistemática y organización (0-5 puntos, 10%) y expresión escrita (0-5 puntos, 10%). Total: 50 puntos. Se necesitan al menos 25 para aprobar.' },
      { question: '¿Qué pasa si no apruebo el supuesto práctico?', answer: 'El supuesto práctico es eliminatorio: si no alcanzas 25/50, quedas eliminado aunque hayas aprobado el test con buena nota. Por eso es fundamental practicar y recibir corrección — el test se puede preparar con memorización, pero el supuesto requiere práctica de escritura y feedback.' },
      { question: '¿Puedo practicar el supuesto práctico online?', answer: 'Hasta ahora no existía ninguna plataforma online que corrigiera supuestos prácticos para GACE. OpoRuta es la primera que ofrece corrección con IA usando la rúbrica oficial del INAP: genera un caso práctico, tú escribes la respuesta, y la IA te evalúa al instante con los 4 criterios del tribunal.' },
      { question: '¿Cuánto cuesta la corrección de supuestos prácticos?', answer: 'Las academias presenciales cobran unos 140€/mes solo por la corrección de supuestos (840€ en 6 meses de preparación). OpoRuta incluye la corrección con IA del supuesto práctico, tests por tema, simulacros y flashcards por 69,99€ de pago único.' },
      { question: '¿Sobre qué temas versa el supuesto práctico GACE?', answer: 'El supuesto práctico cubre exclusivamente los Bloques IV (gestión financiera/LGP), V (contratación pública/LCSP) y VI (recursos humanos/TREBEP). Los supuestos del INAP siempre mezclan al menos 2-3 de estas áreas en un mismo caso práctico.' },
      { question: '¿Es fiable la corrección del supuesto práctico con IA?', answer: 'La IA de OpoRuta usa exactamente los mismos 4 criterios y ponderaciones que el tribunal INAP. Evalúa conocimiento aplicado (citas legales correctas), análisis, estructura y expresión escrita. No sustituye al tribunal, pero te permite practicar ilimitadamente y recibir feedback instantáneo para mejorar antes del examen.' },
    ],
  },

  // ─── Post 48 — Comparativa OpoRuta vs OpositaTest vs academias ─────────────
  {
    slug: 'oporuta-vs-opositatest-vs-academias-comparativa-gace-a2',
    title: 'OpoRuta vs OpositaTest vs academias: comparativa para GACE (A2) 2026',
    description:
      'Comparativa detallada entre OpoRuta, OpositaTest y academias presenciales para preparar la oposición de Gestión del Estado A2. Quién corrige el supuesto práctico, precios y funcionalidades.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'OpoRuta vs OpositaTest',
      'comparativa plataformas oposiciones GACE',
      'mejor plataforma oposiciones A2',
      'academia vs plataforma online oposiciones',
      'corrección supuesto práctico IA',
      'preparar GACE online',
    ],
    content: `
<h2>¿Cómo preparar la GACE online en 2026?</h2>
<p>
  La oposición de Gestión del Estado (A2) tiene una particularidad que la diferencia del C1 y el C2:
  el <strong>supuesto práctico</strong>. Mientras que el Auxiliar (C2) y el Administrativo (C1) se
  examinan solo con test tipo test, el GACE exige redactar respuestas a un caso práctico que vale
  el 50% de la nota.
</p>
<p>
  Esto cambia radicalmente la ecuación de preparación: <strong>no basta con una plataforma de tests</strong>.
  Necesitas alguien (o algo) que corrija tus escritos. Veamos las opciones disponibles en 2026.
</p>

<h2>Tabla comparativa: OpoRuta vs OpositaTest vs academias</h2>
<table>
  <thead>
    <tr>
      <th>Característica</th>
      <th>OpositaTest</th>
      <th>Academias (SKR, LOGRA)</th>
      <th>OpoRuta</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tests tipo test</strong></td>
      <td>✅ Sí</td>
      <td>❌ No (solo presencial)</td>
      <td>✅ Sí (58 temas)</td>
    </tr>
    <tr>
      <td><strong>Supuesto práctico</strong></td>
      <td>❌ No</td>
      <td>✅ Sí (corrección humana)</td>
      <td>✅ Sí (corrección IA)</td>
    </tr>
    <tr>
      <td><strong>Corrección con rúbrica INAP</strong></td>
      <td>❌ No</td>
      <td>⚠️ Depende del preparador</td>
      <td>✅ Sí (4 criterios oficiales)</td>
    </tr>
    <tr>
      <td><strong>Tiempo de corrección</strong></td>
      <td>—</td>
      <td>1-2 semanas</td>
      <td>Instantáneo</td>
    </tr>
    <tr>
      <td><strong>Simulacros oficiales</strong></td>
      <td>✅ Sí</td>
      <td>⚠️ Algunos</td>
      <td>✅ Sí (con penalización)</td>
    </tr>
    <tr>
      <td><strong>Flashcards</strong></td>
      <td>❌ No</td>
      <td>❌ No</td>
      <td>✅ Sí (repetición espaciada)</td>
    </tr>
    <tr>
      <td><strong>Análisis detallado de errores</strong></td>
      <td>⚠️ Básico</td>
      <td>✅ Sí (del preparador)</td>
      <td>✅ Sí (IA explica cada error)</td>
    </tr>
    <tr>
      <td><strong>Precio</strong></td>
      <td>~15-30€/mes</td>
      <td>140-200€/mes</td>
      <td>69,99€ pago único</td>
    </tr>
    <tr>
      <td><strong>Acceso</strong></td>
      <td>100% online</td>
      <td>Presencial + material</td>
      <td>100% online</td>
    </tr>
  </tbody>
</table>

<h2>OpositaTest: buena para tests, incompleta para GACE</h2>
<p>
  OpositaTest es una plataforma consolidada con buena base de preguntas tipo test para múltiples
  oposiciones. Para el C2 (Auxiliar), donde el examen es solo test, puede ser suficiente.
</p>
<p>
  Sin embargo, para la GACE tiene una <strong>limitación fundamental</strong>: no ofrece práctica
  ni corrección del supuesto práctico. Puedes preparar el primer ejercicio (test) con OpositaTest,
  pero llegarás al segundo ejercicio (50% de la nota) sin haber practicado nunca.
</p>

<h2>Academias presenciales: corrección humana a precio elevado</h2>
<p>
  Las academias especializadas (SKR en Madrid, LOGRA, Adams, CEF) ofrecen lo que las plataformas
  online no: <strong>corrección humana del supuesto práctico</strong>. Un preparador lee tu respuesta,
  te señala errores y te da feedback personalizado.
</p>
<p>
  El problema es el coste y la velocidad:
</p>
<ul>
  <li><strong>Precio:</strong> 140-200€/mes, solo por la corrección de supuestos (sin tests online). En 6 meses: 840-1.200€.</li>
  <li><strong>Tiempo de corrección:</strong> 1-2 semanas por supuesto. En ese tiempo, has olvidado por qué escribiste lo que escribiste.</li>
  <li><strong>Escalabilidad:</strong> Un preparador humano puede corregir 10-15 supuestos/semana. Si necesitas practicar 3 supuestos/semana, el feedback se acumula.</li>
</ul>

<h2>OpoRuta: tests + supuesto práctico + corrección IA</h2>
<p>
  OpoRuta es la <strong>única plataforma que combina tests tipo test con corrección del supuesto práctico</strong>
  para la GACE. La corrección usa inteligencia artificial entrenada con la rúbrica oficial del INAP:
</p>
<ul>
  <li><strong>Conocimiento aplicado (60%):</strong> ¿Citas los artículos correctos? ¿Aplicas la ley al caso concreto?</li>
  <li><strong>Análisis (20%):</strong> ¿Identificas los problemas jurídicos? ¿Relacionas normas?</li>
  <li><strong>Sistemática (10%):</strong> ¿Tu respuesta tiene estructura clara?</li>
  <li><strong>Expresión (10%):</strong> ¿Escribes con corrección y claridad?</li>
</ul>
<p>
  El resultado es un <strong>feedback instantáneo</strong> con nota sobre 50, desglose por criterio,
  artículos que faltaron y respuesta modelo. Todo por <strong>69,99€ de pago único</strong> — sin
  suscripción, sin cuotas mensuales.
</p>

<h2>¿Cuál es la mejor opción para la GACE?</h2>
<p>
  Depende de tu situación:
</p>
<ul>
  <li><strong>Si solo necesitas tests:</strong> OpositaTest o OpoRuta. Ambas cubren el primer ejercicio.</li>
  <li><strong>Si quieres corrección humana y presupuesto no es problema:</strong> Academia + OpoRuta para tests.</li>
  <li><strong>Si quieres preparación completa (test + supuesto) a precio razonable:</strong> OpoRuta es la única opción que cubre ambos ejercicios por 69,99€.</li>
</ul>
<p>
  Ninguna otra plataforma online corrige supuestos prácticos para GACE.
  <strong>Ninguna.</strong> OpoRuta es la primera y, a día de hoy, la única.
</p>

<p>
  <strong><a href="/register">Prueba OpoRuta gratis</a></strong> — tests por tema + corrección de
  supuesto práctico con IA. Sin compromiso, sin tarjeta de crédito.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Qué plataforma es mejor para preparar la GACE (A2)?', answer: 'Depende de lo que necesites. Para solo tests tipo test, OpositaTest y OpoRuta son similares. Pero para la preparación completa de la GACE (test + supuesto práctico), OpoRuta es la única plataforma online que corrige el supuesto práctico con IA usando la rúbrica del INAP, por 69,99€ de pago único.' },
      { question: '¿Merece la pena pagar una academia para la GACE?', answer: 'Las academias ofrecen corrección humana del supuesto (140-200€/mes, ~840€ en 6 meses) y contacto presencial. Si tu presupuesto lo permite, pueden complementar bien la preparación. Sin embargo, OpoRuta ofrece corrección con IA instantánea por 69,99€ de pago único, cubriendo los mismos 4 criterios del INAP. Puedes practicar tantos supuestos como quieras sin esperar semanas.' },
      { question: '¿OpositaTest tiene supuesto práctico para GACE?', answer: 'No. OpositaTest ofrece tests tipo test para múltiples oposiciones, pero no incluye práctica ni corrección del supuesto práctico. Para la GACE, esto significa que solo cubre el primer ejercicio (test), que vale el 50% de la nota. El segundo ejercicio (supuesto práctico, otro 50%) queda sin preparar.' },
      { question: '¿La corrección de OpoRuta es tan buena como la de un preparador humano?', answer: 'OpoRuta usa IA entrenada con la rúbrica oficial del INAP (4 criterios: conocimiento aplicado, análisis, sistemática, expresión). Evalúa citas legales, estructura y claridad expositiva de forma consistente e instantánea. Un preparador humano puede ofrecer matices adicionales, pero OpoRuta permite practicar ilimitadamente sin esperar semanas para el feedback.' },
    ],
  },

  // ─── Post 49 — GACE vs C1 Administrativo ───────────────────────────────────
  {
    slug: 'gace-a2-vs-administrativo-c1-cual-preparar-2026',
    title: 'GACE (A2) vs Administrativo del Estado (C1): ¿cuál preparar en 2026?',
    description:
      'Comparativa entre Gestión del Estado (GACE A2) y Administrativo del Estado (C1): plazas, temario, sueldo, dificultad y tipo de examen. Mismo día de examen — elige bien.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'GACE vs Administrativo del Estado',
      'A2 vs C1 oposiciones',
      'gestión del estado vs administrativo',
      'oposiciones A2 o C1',
      'cuál oposición preparar 2026',
      'sueldo A2 vs C1',
    ],
    content: `
<h2>Misma fecha, distinta oposición: 23 de mayo de 2026</h2>
<p>
  Tanto la GACE (Gestión del Estado, A2) como el Administrativo del Estado (C1) se examinan el
  <strong>23 de mayo de 2026</strong>. Coinciden en fecha con el Auxiliar (C2). Esto significa que
  <strong>debes elegir una sola oposición</strong> — no puedes presentarte a las tres el mismo día.
</p>
<p>
  Si tienes título universitario y dudas entre A2 y C1, esta comparativa te ayudará a decidir.
</p>

<h2>Comparativa rápida: GACE (A2) vs Administrativo (C1)</h2>
<table>
  <thead>
    <tr>
      <th>Criterio</th>
      <th>GACE (A2)</th>
      <th>Administrativo (C1)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Plazas 2026</strong></td>
      <td>1.356</td>
      <td>~1.200</td>
    </tr>
    <tr>
      <td><strong>Titulación</strong></td>
      <td>Grado universitario</td>
      <td>Bachillerato / FP Superior</td>
    </tr>
    <tr>
      <td><strong>Temas</strong></td>
      <td>58 temas, 6 bloques</td>
      <td>45 temas, 5 bloques</td>
    </tr>
    <tr>
      <td><strong>Tipo de examen</strong></td>
      <td>Test (50 pts) + Supuesto práctico (50 pts)</td>
      <td>Test (100 preguntas + 10 reserva)</td>
    </tr>
    <tr>
      <td><strong>Supuesto práctico</strong></td>
      <td>✅ Sí, a desarrollar (5 preguntas, 150 min)</td>
      <td>❌ No (solo test tipo test)</td>
    </tr>
    <tr>
      <td><strong>Sueldo neto/mes</strong></td>
      <td>1.900-3.000€</td>
      <td>1.400-2.300€</td>
    </tr>
    <tr>
      <td><strong>Nota de corte</strong></td>
      <td>~49-52/100</td>
      <td>~57-65/100</td>
    </tr>
    <tr>
      <td><strong>Opositores por plaza</strong></td>
      <td>~8-12</td>
      <td>~15-20</td>
    </tr>
    <tr>
      <td><strong>Fecha examen</strong></td>
      <td>23 mayo 2026</td>
      <td>23 mayo 2026</td>
    </tr>
  </tbody>
</table>

<h2>El factor clave: el supuesto práctico</h2>
<p>
  La gran diferencia entre A2 y C1 no es solo el temario — es el <strong>tipo de examen</strong>.
  El C1 es 100% tipo test: 100 preguntas con penalización -1/3. Pura memorización y descarte.
</p>
<p>
  El A2 tiene un test más corto (50 preguntas) pero añade un <strong>supuesto práctico a desarrollar</strong>
  que vale el 50% de la nota. Debes redactar respuestas argumentadas citando legislación concreta
  (LCSP, LGP, TREBEP). Esto exige un nivel de comprensión y capacidad de redacción que el C1 no requiere.
</p>
<p>
  Para muchos opositores, el supuesto práctico es la barrera: no saben cómo estructurarlo, no
  reciben corrección y acaban suspendiendo un ejercicio que vale la mitad de la nota.
</p>

<h2>¿Quién debería elegir el A2?</h2>
<ul>
  <li><strong>Tienes título universitario</strong> — requisito imprescindible.</li>
  <li><strong>Quieres mejor sueldo:</strong> 500-700€/mes más que un C1 en puestos equivalentes.</li>
  <li><strong>Te expresas bien por escrito</strong> — el supuesto práctico premia la buena redacción.</li>
  <li><strong>Prefieres menos competencia:</strong> 8-12 opositores/plaza vs. 15-20 en C1.</li>
  <li><strong>Tienes tiempo para preparar 58 temas</strong> (13 más que el C1).</li>
</ul>

<h2>¿Quién debería elegir el C1?</h2>
<ul>
  <li><strong>No tienes título universitario</strong> — el C1 solo exige bachillerato.</li>
  <li><strong>Prefieres examen 100% test:</strong> Sin supuesto práctico, todo es memorización y descarte.</li>
  <li><strong>Llevas menos tiempo preparando</strong> — 45 temas vs. 58 del A2.</li>
  <li><strong>Te sientes más cómodo con preguntas tipo test</strong> que con redacción libre.</li>
</ul>

<h2>¿Y si tengo el título pero me da miedo el supuesto?</h2>
<p>
  El supuesto práctico asusta porque históricamente no había forma de practicarlo sin pagar
  una academia (140€/mes). Pero con <strong>OpoRuta</strong> puedes practicar tantos supuestos
  como quieras con <strong>corrección de IA instantánea</strong> usando la rúbrica oficial del INAP.
</p>
<p>
  El supuesto práctico no es más difícil — es diferente. Requiere práctica y feedback, no más
  memorización. Y con el feedback adecuado, muchos opositores descubren que el supuesto es su
  mejor baza frente a opositores que solo saben memorizar.
</p>

<h2>Prepara ambas oposiciones con OpoRuta</h2>
<p>
  OpoRuta cubre tanto la GACE (A2) como el Administrativo (C1) y el Auxiliar (C2). Si dudas
  entre varias, puedes explorar los temarios y decidir antes de comprometerte.
  Para la GACE, OpoRuta es la <strong>única plataforma que corrige el supuesto práctico con IA</strong>.
</p>
<p>
  <strong><a href="/register">Empieza gratis en OpoRuta</a></strong> — tests para los 58 temas GACE,
  simulacros oficiales y corrección de supuesto práctico con IA por 69,99€.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Puedo presentarme a la GACE (A2) y al Administrativo (C1) el mismo año?', answer: 'No, si ambas se examinan el mismo día. En 2026, tanto la GACE (A2) como el Administrativo (C1) y el Auxiliar (C2) se examinan el 23 de mayo. Debes elegir una sola oposición. Si se celebraran en fechas distintas, sí podrías presentarte a ambas.' },
      { question: '¿Cuál es más fácil, la GACE (A2) o el Administrativo (C1)?', answer: 'Depende de tu perfil. El C1 tiene menos temas (45 vs 58) y es solo tipo test — más accesible si tu fuerte es la memorización. El A2 tiene supuesto práctico (requiere redacción y argumentación jurídica) pero menos opositores por plaza (8-12 vs 15-20) y mejor sueldo. Si te expresas bien por escrito y tienes título universitario, el A2 puede tener mejor ratio esfuerzo/recompensa.' },
      { question: '¿Cuánto más cobra un Gestor (A2) que un Administrativo (C1)?', answer: 'En media, un Gestor del Estado (A2) cobra entre 500€ y 700€ más al mes que un Administrativo (C1). El A2 oscila entre 1.900-3.000€ netos/mes y el C1 entre 1.400-2.300€. La diferencia se amplía con antigüedad y complementos específicos del puesto.' },
      { question: '¿El temario del A2 y del C1 se solapan?', answer: 'Parcialmente. Ambos comparten temas de Constitución (Bloque I), Administración Pública y LPAC (Bloque II) y parte del TREBEP (Bloque IV del C1 / Bloque VI del A2). Sin embargo, el A2 añade bloques específicos de contratación pública (LCSP, 10 temas) y gestión financiera (LGP, 12 temas) que no existen en el C1.' },
      { question: '¿Qué es el Pack Triple AGE de OpoRuta?', answer: 'OpoRuta ofrece packs para cada oposición (C2, C1, A2) y la posibilidad de combinar acceso a varias. Si estás decidiendo entre el C1 y el A2, puedes explorar ambos temarios en la versión gratuita antes de comprometerte. Para la GACE, OpoRuta incluye corrección del supuesto práctico con IA — algo que ninguna otra plataforma online ofrece.' },
    ],
  },

  // ─── Post 50 — Rúbrica oficial INAP supuesto práctico ──────────────────────
  {
    slug: 'rubrica-oficial-inap-supuesto-practico-gace-4-criterios',
    title: 'Rúbrica oficial INAP para el supuesto práctico GACE: los 4 criterios que evalúa el tribunal',
    description:
      'Desglose de los 4 criterios de evaluación del tribunal INAP para el supuesto práctico de Gestión del Estado (A2): conocimiento aplicado, análisis, sistemática y expresión. Cómo mejorar la nota en cada uno.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'rúbrica INAP supuesto práctico',
      'criterios evaluación supuesto GACE',
      'cómo evalúa el tribunal INAP',
      'nota supuesto práctico oposiciones',
      'mejorar nota supuesto práctico',
      'conocimiento aplicado supuesto práctico',
    ],
    content: `
<h2>Los 4 criterios que usa el tribunal INAP</h2>
<p>
  El supuesto práctico de la GACE (Gestión del Estado, A2) no se califica con una nota genérica.
  El tribunal del INAP utiliza una <strong>rúbrica oficial con 4 criterios ponderados</strong>
  que suman 50 puntos. Conocer estos criterios y entender qué valora el tribunal en cada uno
  es la diferencia entre un 25/50 (aprobado raspado) y un 35-40/50 (nota competitiva).
</p>
<p>
  OpoRuta es la única plataforma que replica esta rúbrica exacta en su corrección con IA.
  A continuación, desglosamos cada criterio con ejemplos y consejos para maximizar tu puntuación.
</p>

<h2>1. Conocimiento aplicado (0-30 puntos) — 60% del peso</h2>
<p>
  Este es el criterio más importante y donde se ganan o pierden los supuestos.
  El tribunal evalúa:
</p>
<ul>
  <li><strong>Cita de legislación correcta:</strong> No vale decir "según la ley de contratos". El tribunal quiere ver "conforme al artículo 131.2 de la Ley 9/2017, de Contratos del Sector Público (LCSP)".</li>
  <li><strong>Aplicación al caso concreto:</strong> No basta con reproducir el texto de la ley. Debes explicar cómo se aplica al supuesto planteado. "En el caso que nos ocupa, al tratarse de un contrato de servicios por importe superior a 139.000€, el procedimiento de adjudicación será el abierto (art. 156 LCSP)".</li>
  <li><strong>Precisión jurídica:</strong> Citar el artículo correcto. Confundir el art. 131 con el 132 de la LCSP puede costarte 3-5 puntos.</li>
  <li><strong>Completitud:</strong> Abordar todos los aspectos jurídicos del caso. Si el supuesto pregunta por la tramitación presupuestaria de un contrato, debes cubrir las fases del gasto (art. 73-79 LGP), no solo el tipo de contrato.</li>
</ul>
<p>
  <strong>Ejemplo de respuesta mala (15/30):</strong><br>
  <em>"Para este contrato se usaría un procedimiento abierto porque el importe es alto y la ley así lo dice."</em>
</p>
<p>
  <strong>Ejemplo de respuesta buena (26/30):</strong><br>
  <em>"El contrato descrito es un contrato de servicios (art. 17 LCSP) cuyo valor estimado, 250.000€, supera el umbral de 139.000€ establecido en el art. 22.1.b LCSP para contratos sujetos a regulación armonizada. Por tanto, el procedimiento de adjudicación será el abierto (art. 156 LCSP), con publicación en el DOUE (art. 135 LCSP) y en la Plataforma de Contratación del Sector Público (art. 347 LCSP). La mesa de contratación se constituirá conforme al art. 326 LCSP."</em>
</p>

<h2>2. Capacidad de análisis (0-10 puntos) — 20% del peso</h2>
<p>
  Aquí el tribunal evalúa tu capacidad de <strong>pensar como un gestor</strong>, no solo de memorizar:
</p>
<ul>
  <li><strong>Identificar problemas jurídicos:</strong> ¿Hay un conflicto entre normas? ¿Una laguna legal? ¿Un caso límite?</li>
  <li><strong>Relacionar normas entre sí:</strong> El supuesto combina LCSP + LGP + TREBEP. El tribunal valora que conectes las tres — por ejemplo, que la modificación de un contrato puede requerir modificación de crédito presupuestario.</li>
  <li><strong>Valorar alternativas:</strong> Si la pregunta admite más de una solución, expón ambas y justifica cuál es preferible.</li>
  <li><strong>Detectar matices:</strong> "Aunque la regla general es X, en este caso concreto podría aplicarse la excepción del art. Y porque…"</li>
</ul>
<p>
  <strong>Consejo:</strong> No respondas como un manual. El tribunal busca que razones sobre el caso,
  no que copies el BOE. Usa expresiones como: <em>"en el supuesto planteado, la cuestión clave es…"</em>,
  <em>"cabe distinguir dos supuestos…"</em>, <em>"la jurisprudencia del TACRC ha establecido que…"</em>.
</p>

<h2>3. Sistemática y organización (0-5 puntos) — 10% del peso</h2>
<p>
  La forma importa. El tribunal lee decenas de supuestos en una semana.
  Una respuesta bien organizada se lee más rápido, transmite más profesionalidad
  y obtiene mejor nota:
</p>
<ul>
  <li><strong>Estructura recomendada por pregunta:</strong>
    <ol>
      <li><em>Fundamento jurídico:</em> Ley y artículos aplicables (1-2 líneas).</li>
      <li><em>Aplicación al caso:</em> Cómo se aplica al supuesto concreto (cuerpo principal).</li>
      <li><em>Conclusión:</em> Respuesta directa a la pregunta (1-2 líneas).</li>
    </ol>
  </li>
  <li><strong>Usa epígrafes y numeración:</strong> "Primero: …", "Segundo: …" o apartados a), b), c).</li>
  <li><strong>Sé conciso:</strong> Una respuesta de 1 página bien estructurada puntúa más que 3 páginas de texto corrido.</li>
</ul>
<p>
  <strong>Error frecuente:</strong> Empezar a escribir sin un esquema previo. Dedica 3-5 minutos
  por pregunta a planificar la estructura antes de redactar.
</p>

<h2>4. Expresión escrita (0-5 puntos) — 10% del peso</h2>
<p>
  El criterio aparentemente más sencillo, pero donde muchos opositores pierden puntos innecesarios:
</p>
<ul>
  <li><strong>Ortografía:</strong> Las faltas de ortografía restan puntos directamente. Vigila tildes (artículo, jurídico, crédito), mayúsculas (Ley, Ministerio, Tribunal) y concordancias.</li>
  <li><strong>Lenguaje jurídico-administrativo:</strong> Usa la terminología correcta: "procedimiento de adjudicación" (no "proceso de compra"), "crédito presupuestario" (no "dinero asignado"), "funcionario interino" (no "trabajador temporal").</li>
  <li><strong>Claridad:</strong> Frases cortas y directas. Evita subordinadas interminables que pierdan al lector.</li>
  <li><strong>Coherencia:</strong> No contradigas en el párrafo 3 lo que afirmaste en el párrafo 1.</li>
</ul>

<h2>Cómo OpoRuta replica esta rúbrica con IA</h2>
<p>
  La IA de OpoRuta evalúa tu supuesto práctico usando <strong>exactamente estos 4 criterios</strong>
  con las mismas ponderaciones:
</p>
<ul>
  <li>Conocimiento aplicado: 0-30 puntos (verifica citas legales contra la legislación vigente)</li>
  <li>Análisis: 0-10 puntos (evalúa la profundidad de tu razonamiento jurídico)</li>
  <li>Sistemática: 0-5 puntos (analiza la estructura de tu respuesta)</li>
  <li>Expresión: 0-5 puntos (detecta errores gramaticales, terminología incorrecta)</li>
</ul>
<p>
  Además, la corrección incluye los artículos que faltaron en tu respuesta y una
  <strong>respuesta modelo</strong> para que compares tu enfoque con el óptimo.
</p>
<p>
  Las academias cobran <strong>140€/mes</strong> por esta corrección (1-2 semanas de espera).
  OpoRuta lo hace <strong>al instante por 69,99€ de pago único</strong>.
</p>

<p>
  <strong><a href="/register">Practica con la rúbrica del INAP en OpoRuta</a></strong> — corrección
  instantánea de tu supuesto práctico con los 4 criterios oficiales del tribunal.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Cómo puedo mejorar la nota del supuesto práctico GACE?', answer: 'Concéntrate en el criterio de mayor peso: conocimiento aplicado (60%). Cita artículos concretos (no solo la ley genérica), aplica la legislación al caso concreto y cubre todos los aspectos jurídicos de la pregunta. Después, trabaja la estructura (epígrafes, numeración, conclusión) y la expresión escrita (lenguaje jurídico correcto, sin faltas de ortografía).' },
      { question: '¿Qué valora más el tribunal INAP en el supuesto práctico?', answer: 'El conocimiento aplicado, con 30 de 50 puntos (60% del peso). El tribunal quiere ver que conoces la legislación y sabes aplicarla al caso concreto, citando artículos específicos. El análisis jurídico vale 10 puntos (20%), la sistemática 5 puntos (10%) y la expresión escrita 5 puntos (10%).' },
      { question: '¿Cuántos puntos necesito en el supuesto para aprobar?', answer: 'Necesitas un mínimo de 25 sobre 50 para superar el ejercicio (es eliminatorio). Para ser competitivo con la nota de corte (49-52/100 sumando test + supuesto), lo ideal es obtener al menos 30/50 en el supuesto, lo que te deja un margen cómodo en el test.' },
      { question: '¿La rúbrica del INAP es pública?', answer: 'Los criterios generales de evaluación se publican en la convocatoria y en las bases del proceso selectivo. Los 4 criterios (conocimiento aplicado, análisis, sistemática, expresión) son estándar en los supuestos prácticos del INAP para cuerpos A2. OpoRuta ha modelado su corrección IA sobre esta rúbrica oficial.' },
      { question: '¿Qué leyes debo citar en el supuesto práctico?', answer: 'Las 3 leyes fundamentales son: LCSP (Ley 9/2017 de Contratos del Sector Público), LGP (Ley 47/2003 General Presupuestaria) y TREBEP (RDLeg 5/2015 del Estatuto Básico del Empleado Público). Los supuestos INAP siempre combinan al menos 2 de estas 3 áreas. Complementariamente, la LPAC (Ley 39/2015) aparece como procedimiento base.' },
    ],
  },

  // ─── Post 51 — Corrección supuesto práctico con IA ─────────────────────────
  {
    slug: 'correccion-supuesto-practico-con-ia-como-funciona-oporuta',
    title: 'Corrección de supuesto práctico con IA: cómo funciona en OpoRuta',
    description:
      'Así funciona la corrección de supuesto práctico con inteligencia artificial en OpoRuta: genera un caso, escribe tu respuesta, la IA te evalúa con la rúbrica INAP y recibes feedback instantáneo.',
    date: '2026-03-22',
    dateModified: '2026-03-22',
    keywords: [
      'corrección supuesto práctico IA',
      'supuesto práctico inteligencia artificial',
      'OpoRuta corrección IA',
      'preparar supuesto práctico online',
      'feedback supuesto práctico oposiciones',
      'corrección automática oposiciones',
    ],
    content: `
<h2>El problema que resuelve OpoRuta</h2>
<p>
  Si preparas la GACE (Gestión del Estado, A2), sabes que el supuesto práctico vale el
  <strong>50% de la nota final</strong>. También sabes que hasta ahora había dos opciones para practicarlo:
</p>
<ul>
  <li><strong>Escribir supuestos solo:</strong> Sin nadie que te corrija, no sabes si tu estructura es buena, si citas los artículos correctos o si te dejas puntos por mala expresión. Es como preparar un examen oral sin hablar nunca en voz alta.</li>
  <li><strong>Pagar una academia:</strong> Corrección humana por 140-200€/mes, con 1-2 semanas de espera entre cada supuesto corregido. En 6 meses de preparación: 840-1.200€ solo en correcciones.</li>
</ul>
<p>
  OpoRuta ofrece una tercera opción: <strong>corrección instantánea con inteligencia artificial</strong>
  usando la rúbrica oficial del INAP, por 69,99€ de pago único.
</p>

<h2>Paso 1: Genera un caso práctico</h2>
<p>
  La IA de OpoRuta genera un supuesto práctico basado en los patrones del INAP.
  Cada caso:
</p>
<ul>
  <li>Plantea un <strong>escenario realista</strong> de un organismo de la AGE.</li>
  <li>Incluye <strong>5 preguntas a desarrollar</strong> que mezclan contratación (LCSP), gestión presupuestaria (LGP) y recursos humanos (TREBEP) — exactamente como en el examen real.</li>
  <li>Tiene la <strong>complejidad adecuada</strong>: ni trivial ni imposible. Diseñado para que un opositor con 3-4 meses de preparación pueda afrontarlo.</li>
</ul>
<p>
  Cada vez que generas un caso, es diferente. Puedes practicar tantos supuestos como necesites
  sin repetir escenarios.
</p>

<h2>Paso 2: Escribe tu respuesta</h2>
<p>
  Respondes las 5 preguntas en un editor de texto dentro de la plataforma.
  Puedes:
</p>
<ul>
  <li><strong>Escribir con cronómetro</strong> (150 minutos, como en el examen) para simular la presión del día real.</li>
  <li><strong>Escribir sin límite de tiempo</strong> cuando estés aprendiendo la estructura y quieras consultar legislación.</li>
  <li><strong>Guardar y continuar</strong> más tarde si necesitas partir la sesión.</li>
</ul>
<p>
  Escribe como escribirías en el examen: cita artículos concretos, estructura tu respuesta
  con epígrafes y redacta con lenguaje jurídico-administrativo. La IA evalúa todo esto.
</p>

<h2>Paso 3: La IA corrige con la rúbrica del INAP</h2>
<p>
  Una vez envías tu respuesta, la IA la evalúa en segundos usando los
  <strong>4 criterios oficiales del tribunal INAP</strong>:
</p>
<ol>
  <li>
    <strong>Conocimiento aplicado (0-30 puntos):</strong>
    Verifica que citas los artículos correctos de la LCSP, LGP y TREBEP.
    Comprueba que aplicas la ley al caso concreto, no que la reproduces de memoria.
    Detecta artículos relevantes que no mencionaste.
  </li>
  <li>
    <strong>Capacidad de análisis (0-10 puntos):</strong>
    Evalúa si identificas los problemas jurídicos del caso, si relacionas normas entre sí
    y si valoras alternativas cuando la pregunta lo permite.
  </li>
  <li>
    <strong>Sistemática (0-5 puntos):</strong>
    Analiza si tu respuesta tiene estructura clara: fundamento legal, aplicación al caso
    y conclusión. Penaliza el texto corrido sin epígrafes.
  </li>
  <li>
    <strong>Expresión escrita (0-5 puntos):</strong>
    Detecta errores gramaticales, faltas de ortografía y uso incorrecto de la terminología
    jurídico-administrativa.
  </li>
</ol>

<h2>Paso 4: Recibes feedback detallado</h2>
<p>
  El informe de corrección incluye:
</p>
<ul>
  <li><strong>Nota total: X/50</strong> con desglose por cada uno de los 4 criterios.</li>
  <li><strong>Nota por pregunta:</strong> Para cada una de las 5 preguntas, puntuación parcial y comentarios específicos.</li>
  <li><strong>Artículos que faltaron:</strong> Lista de artículos relevantes que no mencionaste, con explicación de por qué eran necesarios.</li>
  <li><strong>Respuesta modelo:</strong> Una respuesta óptima redactada por la IA para que compares tu enfoque con el ideal.</li>
  <li><strong>Consejos de mejora:</strong> Recomendaciones personalizadas basadas en tus errores más frecuentes.</li>
</ul>

<h2>¿Es fiable la corrección con IA?</h2>
<p>
  La IA de OpoRuta está diseñada para replicar la evaluación del tribunal INAP:
</p>
<ul>
  <li><strong>Verificación legislativa:</strong> La IA cruza tus citas de artículos contra la legislación vigente. Si citas el art. 131 LCSP pero el correcto es el 132, lo detecta.</li>
  <li><strong>Consistencia:</strong> A diferencia de un preparador humano (que puede variar su criterio según el día), la IA aplica los mismos estándares en cada corrección.</li>
  <li><strong>Velocidad:</strong> Feedback en segundos, no en semanas. Esto te permite iterar rápido: escribir → corregir → mejorar → repetir.</li>
</ul>
<p>
  La IA no sustituye al tribunal del INAP — el examen real lo corrigen personas. Pero te permite
  <strong>practicar ilimitadamente</strong> y llegar al examen habiendo escrito y corregido docenas
  de supuestos, en lugar de 3-4 que corrigiría una academia en el mismo tiempo.
</p>

<h2>Privacidad: tus respuestas son tuyas</h2>
<p>
  Tus respuestas se procesan para generar el feedback y no se comparten con terceros ni se
  usan para entrenar modelos. OpoRuta cumple con el RGPD y la LOPDGDD. Puedes solicitar
  la eliminación de tus datos en cualquier momento.
</p>

<h2>Comparativa de tiempos y costes</h2>
<table>
  <thead>
    <tr>
      <th></th>
      <th>Academia presencial</th>
      <th>OpoRuta (IA)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tiempo de corrección</strong></td>
      <td>1-2 semanas</td>
      <td>Segundos</td>
    </tr>
    <tr>
      <td><strong>Supuestos corregidos/mes</strong></td>
      <td>2-4</td>
      <td>Ilimitados</td>
    </tr>
    <tr>
      <td><strong>Coste mensual</strong></td>
      <td>140-200€/mes</td>
      <td>69,99€ pago único</td>
    </tr>
    <tr>
      <td><strong>Coste en 6 meses</strong></td>
      <td>840-1.200€</td>
      <td>69,99€</td>
    </tr>
    <tr>
      <td><strong>Rúbrica INAP</strong></td>
      <td>Depende del preparador</td>
      <td>4 criterios oficiales</td>
    </tr>
    <tr>
      <td><strong>Respuesta modelo</strong></td>
      <td>A veces</td>
      <td>Siempre</td>
    </tr>
  </tbody>
</table>

<h2>Empieza a practicar hoy</h2>
<p>
  Cada día que pasa sin practicar el supuesto práctico es un día que tus competidores pueden
  estar aprovechando. El examen es el <strong>23 de mayo de 2026</strong>.
</p>
<p>
  <strong><a href="/register">Regístrate en OpoRuta</a></strong> y prueba la corrección de supuesto
  práctico con IA — la única plataforma online que te da feedback real sobre tus escritos, al instante,
  con la rúbrica del tribunal INAP. Todo por 69,99€ de pago único.
</p>

<p class="text-sm text-muted-foreground"><em>Última actualización: marzo 2026.</em></p>
    `.trim(),
    faqs: [
      { question: '¿Es fiable la corrección del supuesto práctico con IA?', answer: 'La IA de OpoRuta usa los mismos 4 criterios y ponderaciones que el tribunal INAP: conocimiento aplicado (60%), análisis (20%), sistemática (10%) y expresión (10%). Verifica tus citas legales contra la legislación vigente y ofrece feedback consistente. No sustituye al tribunal real, pero te permite practicar ilimitadamente con feedback instantáneo — algo que ninguna academia puede ofrecer.' },
      { question: '¿Puedo confiar en la nota que me da la IA?', answer: 'La nota de la IA es una referencia orientativa muy útil para medir tu progreso. Aplica los mismos criterios del tribunal de forma consistente, lo que te permite ver si mejoras con cada supuesto. La nota real del tribunal puede variar ligeramente, pero la estructura de la evaluación (qué valoran y cuánto pesa cada criterio) es idéntica.' },
      { question: '¿Cuántos supuestos puedo practicar con OpoRuta?', answer: 'Con el Pack GACE (69,99€ pago único), puedes generar y practicar tantos supuestos como necesites. Cada caso es diferente, generado por IA con los patrones del INAP. No hay límite mensual de supuestos — solo de análisis detallados (que consumen créditos de corrección).' },
      { question: '¿Mis respuestas se comparten o se usan para entrenar modelos?', answer: 'No. Tus respuestas se procesan exclusivamente para generar tu feedback y no se comparten con terceros ni se utilizan para entrenar modelos de IA. OpoRuta cumple con el RGPD y la LOPDGDD. Puedes solicitar la eliminación completa de tus datos en cualquier momento desde tu cuenta.' },
      { question: '¿Qué diferencia hay entre la corrección de OpoRuta y la de una academia?', answer: 'La principal diferencia es velocidad y coste. Una academia tarda 1-2 semanas en devolverte un supuesto corregido y cobra 140-200€/mes. OpoRuta te da feedback en segundos por 69,99€ de pago único. Además, la IA aplica la rúbrica de forma consistente en cada corrección, mientras que un preparador humano puede variar su criterio.' },
    ],
  },
]
