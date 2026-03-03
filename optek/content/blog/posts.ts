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
      'Guía completa sobre el sistema de puntuación con penalización del examen TAC: cuándo dejar en blanco, cómo calcular tu nota y cómo practicarlo con simulacros.',
    date: '2026-03-01',
    keywords: [
      'penalización examen auxiliar administrativo',
      'TAC penalización -1/3',
      'puntuación examen INAP',
      'cómo calcular nota oposición',
    ],
    content: `
<h2>¿Qué es la penalización en el examen del Auxiliar Administrativo del Estado?</h2>
<p>
  El examen del Cuerpo General Auxiliar de la Administración del Estado (TAC) aplica un
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
  El examen tiene <strong>100 preguntas</strong> de tipo test. La puntuación máxima es 100 puntos.
  La nota mínima para aprobar cada parte es generalmente 25 puntos sobre 50.
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
  La mayoría de los aprobados del TAC obtienen entre 60 y 75 puntos.
  Con 70 preguntas correctas y buena gestión del blanco, estás en ese rango.
</p>

<h2>Practica con simulacros reales</h2>
<p>
  La única forma de entrenar la penalización correctamente es practicando con el formato
  exacto del examen: 100 preguntas, tiempo limitado, y la misma penalización.
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
<h2>¿Por qué la LPAC es fundamental en el TAC?</h2>
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
      'Guía completa sobre las pruebas psicotécnicas del examen TAC: ortografía, sinónimos, series numéricas, comprensión verbal y razonamiento. Con ejemplos reales y estrategias de resolución.',
    date: '2026-03-03',
    keywords: [
      'psicotécnicas auxiliar administrativo estado',
      'test psicotécnico TAC',
      'pruebas psicotécnicas oposición TAC',
      'series numéricas oposición auxiliar administrativo',
      'ortografía examen auxiliar administrativo',
    ],
    content: `
<h2>¿Qué son las pruebas psicotécnicas en el examen TAC?</h2>
<p>
  El examen del Cuerpo General Auxiliar de la Administración del Estado (TAC) incluye
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

<h2>Tipos de psicotécnicas en el examen TAC</h2>

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
  del examen TAC: ortografía con distractores realistas, series numéricas con los
  patrones más frecuentes en exámenes INAP, y razonamiento analógico con las
  categorías habituales.
</p>
<p>
  Los primeros 5 tests son completamente gratuitos. Sin tarjeta de crédito.
</p>
    `.trim(),
  },

  // ─── Post 5 ────────────────────────────────────────────────────────────────
  {
    slug: 'temario-auxiliar-administrativo-estado-2025-2026',
    title: 'Temario completo del Auxiliar Administrativo del Estado 2025-2026: los 28 temas del TAC',
    description:
      'Resumen del temario oficial del Cuerpo General Auxiliar de la AGE: Bloque I (legislación, 24 temas) y Bloque II (ofimática y psicotécnicas, 4 temas). Qué estudiar primero y cómo organizarlo.',
    date: '2026-03-03',
    keywords: [
      'temario auxiliar administrativo estado 2025',
      'temas oposición TAC auxiliar administrativo',
      'bloque I bloque II auxiliar administrativo',
      'cuerpo general auxiliar AGE temario',
      'oposiciones auxiliar administrativo estado 2026',
    ],
    content: `
<h2>El temario oficial del Auxiliar Administrativo del Estado</h2>
<p>
  El temario del Cuerpo General Auxiliar de la Administración del Estado (TAC/AGE) se divide
  en <strong>dos bloques</strong> con un total de 28 temas. El examen consta de 100 preguntas
  tipo test con penalización −1/3, y el temario es el mismo para las convocatorias de
  2025 y 2026 (salvo modificación del BOE).
</p>
<p>
  Aquí tienes el resumen completo de los 28 temas, con indicación de su peso habitual
  en los exámenes oficiales del INAP.
</p>

<h2>Bloque I — Organización pública (24 temas)</h2>

<h3>Grupo 1: Constitución Española (Temas 1-3)</h3>
<ul>
  <li><strong>T1:</strong> La Constitución Española de 1978. Principios generales. Derechos y deberes fundamentales.</li>
  <li><strong>T2:</strong> La Corona. Las Cortes Generales. El Gobierno y la Administración. El Poder Judicial.</li>
  <li><strong>T3:</strong> La organización territorial del Estado. Las Comunidades Autónomas.</li>
</ul>
<p>
  <em>Peso estimado: 8-12 preguntas en exámenes recientes del INAP. La CE es la fuente
  más examinada junto con la LPAC.</em>
</p>

<h3>Grupo 2: Administración General del Estado (Temas 4-7)</h3>
<ul>
  <li><strong>T4:</strong> La Administración General del Estado. La Ley 40/2015 (LRJSP). Principios de actuación.</li>
  <li><strong>T5:</strong> Los órganos superiores y directivos de la AGE. Ministerios, Secretarías de Estado, Subsecretarías.</li>
  <li><strong>T6:</strong> Los organismos públicos: Organismos Autónomos, Entidades Públicas Empresariales, Agencias Estatales.</li>
  <li><strong>T7:</strong> La Administración periférica del Estado. Delegaciones del Gobierno. Subdelegaciones.</li>
</ul>

<h3>Grupo 3: Procedimiento Administrativo (Temas 8-11)</h3>
<ul>
  <li><strong>T8:</strong> El acto administrativo. Concepto, clases, elementos y eficacia.</li>
  <li><strong>T9:</strong> El procedimiento administrativo común (LPAC). Iniciación, ordenación, instrucción y terminación.</li>
  <li><strong>T10:</strong> Los recursos administrativos: alzada, reposición y extraordinario de revisión.</li>
  <li><strong>T11:</strong> Las notificaciones. La revisión de oficio. La responsabilidad patrimonial.</li>
</ul>
<p>
  <em>Peso estimado: 10-15 preguntas. El Bloque LPAC/LRJSP suele ser el mayor grupo
  de preguntas en cualquier convocatoria TAC.</em>
</p>

<h3>Grupo 4: Función Pública (Temas 12-15)</h3>
<ul>
  <li><strong>T12:</strong> Los funcionarios públicos. El Real Decreto Legislativo 5/2015 (TREBEP). Clases de personal.</li>
  <li><strong>T13:</strong> Adquisición y pérdida de la condición de funcionario. Situaciones administrativas.</li>
  <li><strong>T14:</strong> Derechos y deberes de los funcionarios. Código de conducta.</li>
  <li><strong>T15:</strong> Régimen disciplinario. Infracciones y sanciones. Incompatibilidades.</li>
</ul>

<h3>Grupo 5: Unión Europea (Temas 16-18)</h3>
<ul>
  <li><strong>T16:</strong> La Unión Europea. Instituciones y órganos principales.</li>
  <li><strong>T17:</strong> El Derecho de la Unión Europea. Reglamentos, Directivas, Decisiones.</li>
  <li><strong>T18:</strong> Políticas de la UE. Fondos estructurales. El presupuesto europeo.</li>
</ul>

<h3>Grupo 6: Hacienda y Presupuesto (Temas 19-21)</h3>
<ul>
  <li><strong>T19:</strong> La Hacienda Pública estatal. La Ley General Presupuestaria.</li>
  <li><strong>T20:</strong> Los Presupuestos Generales del Estado. Principios presupuestarios. Fases.</li>
  <li><strong>T21:</strong> El control financiero. La Intervención General. El Tribunal de Cuentas.</li>
</ul>

<h3>Grupo 7: Legislación específica (Temas 22-24)</h3>
<ul>
  <li><strong>T22:</strong> Igualdad de género. La Ley Orgánica 3/2007. El Plan de Igualdad en la AGE.</li>
  <li><strong>T23:</strong> Protección de datos. El Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD.</li>
  <li><strong>T24:</strong> Transparencia y buen gobierno. La Ley 19/2013. El Portal de Transparencia.</li>
</ul>

<h2>Bloque II — Actividad administrativa (4 temas)</h2>
<ul>
  <li><strong>T25:</strong> Ofimática: Microsoft Word. Procesamiento de textos, estilos, combinar correspondencia.</li>
  <li><strong>T26:</strong> Ofimática: Microsoft Excel. Hojas de cálculo, fórmulas, tablas dinámicas.</li>
  <li><strong>T27:</strong> Sistemas operativos: Windows. Gestión de archivos, redes, configuración.</li>
  <li><strong>T28:</strong> Pruebas psicotécnicas. Razonamiento verbal, numérico y abstracto.</li>
</ul>

<h2>Cómo organizar el estudio</h2>
<ol>
  <li>
    <strong>Empieza por los temas de alto rendimiento:</strong> T1-T3 (CE), T9-T11 (LPAC/LRJSP)
    y T12-T14 (TREBEP). Estos temas representan entre el 40% y el 50% de las preguntas
    en exámenes recientes.
  </li>
  <li>
    <strong>Paraleliza el Bloque II:</strong> Dedica 15-20 minutos al día a psicotécnicas
    (T28) y a repasar funciones concretas de Word/Excel (T25-T26). El Bloque II no se
    estudia — se practica.
  </li>
  <li>
    <strong>Temas de menor rendimiento:</strong> T16-T18 (UE) y T19-T21 (Hacienda) suelen
    generar menos preguntas. Estúdialos en la fase final, cuando tengas los temas clave dominados.
  </li>
  <li>
    <strong>Haz tests por tema desde el día 1:</strong> Leer sin testar es la forma más
    lenta de preparar una oposición. Cada vez que terminas un tema, genera 10 preguntas
    tipo test sobre él.
  </li>
</ol>

<h2>Practica el temario completo con OpoRuta</h2>
<p>
  OpoRuta cubre los 28 temas del TAC con preguntas tipo test generadas por IA y verificadas
  con cita legal exacta. Puedes generar tests por tema, por bloque, o simular el examen
  completo con 100 preguntas y penalización real.
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
      'Guía clara para distinguir la Ley 39/2015 (LPAC) y la Ley 40/2015 (LRJSP) en el examen TAC: qué regula cada una y las preguntas trampa más frecuentes.',
    date: '2026-03-01',
    keywords: [
      'diferencia LPAC LRJSP',
      'ley 39/2015 ley 40/2015 auxiliar administrativo',
      'LPAC vs LRJSP examen TAC',
      'tema 11 auxiliar administrativo',
    ],
    content: `
<h2>La confusión más frecuente en el examen TAC</h2>
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
    title: 'La Constitución Española en el examen TAC: artículos clave y preguntas más frecuentes',
    description:
      'Los artículos de la Constitución Española que más se examinan en las oposiciones del Auxiliar Administrativo del Estado: derechos fundamentales, órganos constitucionales y estructura del Estado.',
    date: '2026-03-03',
    keywords: [
      'Constitución española examen auxiliar administrativo',
      'artículos CE oposición TAC',
      'preguntas Constitución española INAP',
      'derechos fundamentales examen auxiliar administrativo',
      'tema 1 auxiliar administrativo estado',
    ],
    content: `
<h2>La Constitución Española: el punto de partida del temario TAC</h2>
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

<h2>Artículos de la CE más examinados en el TAC</h2>

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

<h2>Técnica de estudio para la CE en el examen TAC</h2>
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
]
