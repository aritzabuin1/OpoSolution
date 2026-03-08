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
  keywords: string[]
  content: string      // HTML
}

export const blogPosts: BlogPost[] = [
  // ─── Post 1 ────────────────────────────────────────────────────────────────
  {
    slug: 'penalizacion-examen-auxiliar-administrativo',
    title: 'Cómo funciona la penalización -1/3 en el examen Auxiliar Administrativo del Estado',
    description:
      'Guía completa sobre el sistema de puntuación con penalización del examen de Auxiliar: cuándo dejar en blanco, cómo calcular tu nota y cómo practicarlo con simulacros.',
    date: '2026-03-01',
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
  30 de teoria, 30 psicotecnicas y 50 de ofimatica.
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
  exacto del examen: 100 preguntas, 90 minutos, y la misma penalizacion.
  OpoRuta ofrece simulacros basados en exámenes oficiales del INAP con el sistema de
  puntuación idéntico al real.
</p>
    `.trim(),
  },

  // ─── Post 2 ────────────────────────────────────────────────────────────────
  {
    slug: 'articulos-lpac-que-mas-caen-examen-inap',
    title: 'Los artículos de la LPAC que más caen en los exámenes del INAP (Auxiliar Administrativo)',
    description:
      'Análisis de los artículos de la Ley 39/2015 LPAC con más frecuencia en exámenes oficiales del INAP. Incluye ejemplos de preguntas tipo test y consejos para estudiarlos.',
    date: '2026-03-01',
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
    `.trim(),
  },

  // ─── Post 4 ────────────────────────────────────────────────────────────────
  {
    slug: 'psicotecnicas-examen-auxiliar-administrativo-estado',
    title: 'Psicotécnicas en el examen del Auxiliar Administrativo del Estado: tipos, ejemplos y cómo practicarlas',
    description:
      'Guía completa sobre las pruebas psicotécnicas del examen de Auxiliar: ortografía, sinónimos, series numéricas, comprensión verbal y razonamiento. Con ejemplos reales y estrategias de resolución.',
    date: '2026-03-03',
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
    `.trim(),
  },

  // ─── Post 5 ────────────────────────────────────────────────────────────────
  {
    slug: 'temario-auxiliar-administrativo-estado-2025-2026',
    title: 'Temario completo del Auxiliar Administrativo del Estado 2025-2026: los 28 temas de Auxiliar',
    description:
      'Resumen del temario oficial del Cuerpo General Auxiliar de la AGE: Bloque I — Organización pública (16 temas) y Bloque II — Actividad administrativa y ofimática (12 temas). Qué estudiar primero y cómo organizarlo.',
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
    `.trim(),
  },

  // ─── Post 3 ────────────────────────────────────────────────────────────────
  {
    slug: 'diferencias-lpac-lrjsp-auxiliar-administrativo',
    title: 'Diferencias entre LPAC y LRJSP para el examen Auxiliar Administrativo del Estado',
    description:
      'Guía clara para distinguir la Ley 39/2015 (LPAC) y la Ley 40/2015 (LRJSP) en el examen de Auxiliar: qué regula cada una y las preguntas trampa más frecuentes.',
    date: '2026-03-01',
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
    `.trim(),
  },

  // ─── Post 6 ────────────────────────────────────────────────────────────────
  {
    slug: 'constitucion-espanola-preguntas-examen-auxiliar-administrativo',
    title: 'La Constitución Española en el examen de Auxiliar: artículos clave y preguntas más frecuentes',
    description:
      'Los artículos de la Constitución Española que más se examinan en las oposiciones del Auxiliar Administrativo del Estado: derechos fundamentales, órganos constitucionales y estructura del Estado.',
    date: '2026-03-03',
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
    `.trim(),
  },

  // ─── Post 7 ────────────────────────────────────────────────────────────────
  {
    slug: 'trebep-articulos-clave-examen-auxiliar-administrativo',
    title: 'TREBEP en el examen de Auxiliar: artículos del Estatuto Básico del Empleado Público que más caen',
    description:
      'Los artículos del TREBEP que más se examinan en el Auxiliar Administrativo del Estado: derechos, deberes, código ético, situaciones administrativas y acceso a la función pública.',
    date: '2026-03-03',
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
    `.trim(),
  },

  // ─── Post 8 ────────────────────────────────────────────────────────────────
  {
    slug: 'lopdgdd-proteccion-datos-examen-auxiliar-administrativo',
    title: 'LOPDGDD y RGPD en el examen de Auxiliar: protección de datos para el Auxiliar Administrativo',
    description:
      'Lo que necesitas saber de la LOPDGDD y el RGPD para el examen del Auxiliar Administrativo del Estado: derechos ARCO, bases jurídicas, AEPD y artículos más frecuentes.',
    date: '2026-03-03',
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
    `.trim(),
  },

  // ─── Post 9 ────────────────────────────────────────────────────────────────
  {
    slug: 'como-preparar-oposicion-auxiliar-administrativo-estado-guia',
    title: 'Cómo preparar la oposición al Cuerpo General Auxiliar del Estado: guía completa 2025-2026',
    description:
      'Guía paso a paso para preparar las oposiciones al Auxiliar Administrativo del Estado en 2025-2026: temario, estructura del examen, métodos de estudio y herramientas útiles.',
    date: '2026-03-03',
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
    `.trim(),
  },
]
