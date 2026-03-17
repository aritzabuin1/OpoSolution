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
    title: 'Cómo funciona la penalización -1/3 en el examen Auxiliar Administrativo del Estado',
    description:
      'Guía completa sobre el sistema de puntuación con penalización del examen de Auxiliar: cuándo dejar en blanco, cómo calcular tu nota y cómo practicarlo con simulacros.',
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
  },

  // ─── Post 5 ────────────────────────────────────────────────────────────────
  {
    slug: 'temario-auxiliar-administrativo-estado-2025-2026',
    title: 'Temario Auxiliar Administrativo del Estado 2025-2026: los 28 temas desglosados',
    description:
      'Los 28 temas del Auxiliar Administrativo del Estado: Bloque I (16 temas de organización pública) y Bloque II (12 temas de ofimática). Qué estudiar primero y cómo priorizar.',
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
  },

  // ─── Post 10 ───────────────────────────────────────────────────────────────
  {
    slug: 'plazas-auxiliar-administrativo-2026',
    title: '1.700 plazas Auxiliar Administrativo 2026: la mayor convocatoria de la historia',
    description:
      '1.700 plazas de acceso libre en la convocatoria 2025-2026 del Auxiliar Administrativo del Estado. Histórico de plazas, tendencia al alza y qué significa para tu oposición.',
    date: '2026-03-12',
    keywords: [
      'plazas auxiliar administrativo 2026',
      'convocatoria auxiliar administrativo estado 2026',
      'cuántas plazas auxiliar administrativo',
      'oposiciones auxiliar administrativo 2026 plazas',
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
  },

  // ─── Post 11 ───────────────────────────────────────────────────────────────
  {
    slug: 'nota-corte-auxiliar-administrativo-estado',
    title: 'Nota de corte Auxiliar Administrativo del Estado 2024: 30 y 26,33 puntos',
    description:
      'La nota de corte de la última convocatoria del Auxiliar Administrativo fue 30 puntos (parte 1) y 26,33 (parte 2). Cómo se calcula con la penalización -1/3 + calculadora gratis.',
    date: '2026-03-12',
    keywords: [
      'nota de corte auxiliar administrativo estado',
      'nota corte auxiliar administrativo 2024',
      'puntuación mínima auxiliar administrativo estado',
      'cómo calcular nota examen auxiliar administrativo',
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
    title: '¿Cuántos temas tiene el Auxiliar Administrativo del Estado? 28 temas en 2 bloques',
    description:
      'El examen del Auxiliar Administrativo del Estado tiene 28 temas: 16 de organización pública y 12 de ofimática. Desglose completo, cuáles son más fáciles y por dónde empezar.',
    date: '2026-03-16',
    keywords: [
      'cuántos temas auxiliar administrativo estado',
      'temario auxiliar administrativo cuántos temas',
      'número temas oposición auxiliar administrativo',
      'temas examen auxiliar administrativo 2026',
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
  },

  // ─── Post 18 ───────────────────────────────────────────────────────────────
  {
    slug: 'diferencias-auxiliar-c2-administrativo-c1-estado',
    title: 'Diferencias entre Auxiliar (C2) y Administrativo (C1) del Estado: plazas, sueldo y temario',
    description:
      'Comparativa completa entre Auxiliar Administrativo (C2) y Administrativo del Estado (C1): requisitos, temario, plazas, sueldo, examen y cuál elegir según tu perfil.',
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
  },

  // ─── Post 21 ───────────────────────────────────────────────────────────────
  {
    slug: 'administrativo-estado-c1-2026-plazas-temario-nota-corte',
    title: 'Administrativo del Estado (C1) 2026: 2.512 plazas, temario completo y nota de corte',
    description:
      'Todo sobre las oposiciones de Administrativo del Estado (C1) 2026: 2.512 plazas, temario de 45 temas, estructura del examen, notas de corte históricas y sueldo.',
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

<h2>Plan de entrenamiento para el supuesto práctico</h2>
<ol>
  <li><strong>Meses 1-3:</strong> estudia la legislación base (LPAC, LRJSP, TREBEP). No hagas supuestos aún</li>
  <li><strong>Meses 4-6:</strong> empieza a resolver 1 supuesto por semana. Usa los de convocatorias anteriores del INAP</li>
  <li><strong>Meses 7-9:</strong> 2-3 supuestos por semana, cronometrados. Focaliza en tus bloques débiles</li>
</ol>
<p>
  Calcula tu nota con nuestra
  <a href="/herramientas/calculadora-nota-administrativo-estado">calculadora de nota del C1</a>
  y practica con los
  <a href="/examenes-oficiales">simulacros INAP oficiales</a>.
</p>

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">Preparar C1 por libre</a> — plan de estudio 6-9 meses</li>
  <li><a href="/blog/administrativo-estado-c1-2026-plazas-temario-nota-corte">Administrativo C1 2026</a> — plazas, temario y nota de corte</li>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias C2 vs C1</a> — ¿cuál elegir?</li>
</ul>
    `.trim(),
  },

  // ─── Post 24 — C1: Nota de corte ──────────────────────────────────────────
  {
    slug: 'nota-corte-administrativo-estado-c1-como-se-calcula',
    title: 'Nota de corte del Administrativo del Estado (C1): cómo se calcula y datos 2024',
    description:
      'Cómo funciona la nota de corte del examen C1 de Administrativo del Estado: datos reales de 2024, por qué varía en cada convocatoria y cómo calcular si la superas.',
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

<h2>Sigue preparando tu oposición</h2>
<ul>
  <li><a href="/blog/preparar-oposiciones-administrativo-estado-c1-por-libre">Preparar C1 por libre</a> — plan de estudio 6-9 meses</li>
  <li><a href="/blog/supuesto-practico-administrativo-estado-c1-estrategia">Supuesto práctico del C1</a> — estrategia y ejemplos</li>
  <li><a href="/blog/diferencias-auxiliar-c2-administrativo-c1-estado">Diferencias C2 vs C1</a> — ¿cuál elegir?</li>
  <li><a href="/herramientas/calculadora-nota-administrativo-estado">Calculadora de nota C1</a> — calcula tu puntuación</li>
</ul>
    `.trim(),
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
  },
  // ─── Post 28: Comparativa plataformas IA oposiciones ──────────────────────
  {
    slug: 'mejores-plataformas-ia-oposiciones-2026-comparativa',
    title: 'Mejores Plataformas con IA para Oposiciones en 2026 — Comparativa Real con Precios',
    description:
      'Analizamos las principales plataformas con IA para preparar oposiciones: OpositaTest, OpoRuta, Toposiciones, Testualia, Opositor.ai y más. Funciones, precios reales y para quién es cada una.',
    date: '2026-03-17',
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
    title: 'OpoRuta vs OpositaTest para Oposiciones 2026 — Diferencias Reales',
    description:
      'Comparamos OpoRuta y OpositaTest para preparar Auxiliar Administrativo (C2) y Administrativo del Estado (C1). Funciones, precios, verificación legal y cuál te conviene según tu forma de estudiar.',
    date: '2026-03-17',
    keywords: [
      'OpoRuta vs OpositaTest',
      'OpositaTest opiniones',
      'OpositaTest alternativa',
      'comparativa OpositaTest',
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
]
