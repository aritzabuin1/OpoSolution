import type { BlogPost } from './posts'

/**
 * 12 posts SEO específicos para Ertzaintza (Agente, C1, Gobierno Vasco).
 * Complementan los posts ya existentes en posts.ts (plazas, sueldo, temario, calendario,
 * pruebas físicas, test de práctica).
 * Cifras basadas en convocatorias de la Academia Vasca de Policía y Emergencias (Arkaute)
 * y en la Ley 4/1992 de Policía del País Vasco. Se usan rangos cuando no se puede verificar
 * una cifra concreta.
 */

export const ertzaintzaPosts: BlogPost[] = [
  // ─── 1 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'como-aprobar-ertzaintza-primera-vuelta-2026',
    title: 'Aprobar Ertzaintza a la primera 2026: plan 12 meses',
    description:
      'Plan realista para aprobar Ertzaintza en primera convocatoria: 40 temas, euskera PL2, físicas y psicotécnico en paralelo.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'como aprobar ertzaintza a la primera',
      'plan estudio ertzaintza 2026',
      'oposicion ertzaintza primera vuelta',
      'ertzaintza 12 meses',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Horas mínimas:</strong> 20 h/semana durante 12 meses = ~1.000 h totales para cubrir ~40 temas + euskera.</li>
  <li><strong>Distribución:</strong> 45% teoría, 20% test/simulacros, 15% euskera, 10% físicas, 10% psicotécnico + entrevista.</li>
  <li><strong>Plazas 2026:</strong> ~800 plazas en la última OPE del Departamento de Seguridad del Gobierno Vasco.</li>
</ul>

<h2>¿Es realista aprobar Ertzaintza a la primera?</h2>
<p>
  Sí, pero solo con un plan de al menos <strong>12 meses</strong>. La Ertzaintza no es únicamente un examen teórico:
  exige euskera (perfil PL2 para la mayoría de plazas), pruebas físicas exigentes, psicotécnico + test de personalidad,
  entrevista personal y reconocimiento médico. Quien prepara únicamente el test teórico y descuida euskera o físicas
  queda fuera.
</p>

<h2>Plan semanal base (20 horas)</h2>
<table>
  <thead><tr><th>Bloque</th><th>Horas/semana</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Teoría nueva</td><td>9 h</td><td>1-2 temas nuevos (Constitución, Estatuto, Ley 4/1992)</td></tr>
    <tr><td>Repaso espaciado</td><td>3 h</td><td>Temas semana -1, -3 y -7 (spaced repetition)</td></tr>
    <tr><td>Euskera</td><td>3 h</td><td>EGA / PL2 equivalente: gramática + comprensión</td></tr>
    <tr><td>Tests y simulacros</td><td>2 h</td><td>Tests de 100 preguntas con penalización</td></tr>
    <tr><td>Físicas</td><td>2 h</td><td>Course-navette, fuerza y velocidad</td></tr>
    <tr><td>Psicotécnico</td><td>1 h</td><td>Series, razonamiento abstracto, aptitud verbal</td></tr>
  </tbody>
</table>

<h2>Cronograma mes a mes</h2>
<ul>
  <li><strong>Mes 1-3:</strong> Bloque jurídico base (Constitución, Estatuto de Autonomía, Ley 4/1992).</li>
  <li><strong>Mes 4-6:</strong> Bloque policial (LO 2/1986, procedimiento penal, seguridad ciudadana).</li>
  <li><strong>Mes 7-9:</strong> Bloque técnico (tráfico, extranjería, violencia de género, protección civil).</li>
  <li><strong>Mes 10:</strong> repaso completo y psicotécnicos intensivos.</li>
  <li><strong>Mes 11-12:</strong> simulacros semanales, entrevista, euskera de consolidación.</li>
</ul>

<h2>Errores que te sacan a la primera</h2>
<ul>
  <li><strong>Dejar euskera para el final:</strong> PL2 exige al menos 6-9 meses si partes de B1.</li>
  <li><strong>No entrenar el course-navette:</strong> es la prueba que más elimina.</li>
  <li><strong>Ignorar el test de personalidad:</strong> sincronizar respuestas con la entrevista es decisivo.</li>
  <li><strong>Estudiar sin base de la Ley 4/1992:</strong> el examen prioriza la normativa autonómica.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/temario-ertzaintza-2026">Temario completo Ertzaintza 2026</a></li>
  <li><a href="/blog/pruebas-fisicas-ertzaintza-2026-marcas-minimas">Pruebas físicas y marcas mínimas</a></li>
  <li><a href="/blog/plazas-ertzaintza-2026-convocatoria">Plazas y convocatoria 2026</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuánto tiempo necesito para aprobar Ertzaintza a la primera?', answer: 'Entre 900 y 1.100 horas efectivas repartidas en 12 meses. Si partes de cero en euskera, suma 200-300 horas adicionales.' },
      { question: '¿Puedo aprobar Ertzaintza sin saber euskera?', answer: 'Puedes presentarte a plazas con perfil PL1 en algunas convocatorias, pero la mayoría exigen PL2. Sin euskera, el número de plazas accesibles cae drásticamente.' },
      { question: '¿Cuándo empiezo a entrenar físicas para Ertzaintza?', answer: 'Desde el mes 1, con volumen bajo. El course-navette y la fuerza necesitan progresión de 10-12 meses.' },
      { question: '¿Vale la pena academia presencial en Euskadi?', answer: 'Ayuda sobre todo en euskera y entrevista. Para teoría y tests, una plataforma con IA y simulacros oficiales actualizados es suficiente.' },
      { question: '¿En qué parte elimina más gente la Ertzaintza?', answer: 'Históricamente en euskera y en pruebas físicas (course-navette). El teórico elimina menos porque hay bolsa amplia de presentados.' },
    ],
  },

  // ─── 2 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'requisitos-ertzaintza-2026-edad-altura-euskera',
    title: 'Requisitos Ertzaintza 2026: edad, euskera, sin altura',
    description:
      'Requisitos Ertzaintza 2026: 18-38 años, Bachiller, carnet B, euskera PL2. La altura fue eliminada como requisito en la convocatoria 2022. Guía completa.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'requisitos ertzaintza 2026',
      'edad maxima ertzaintza',
      'altura ertzaintza eliminada',
      'euskera ertzaintza pl2',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Edad:</strong> entre 18 y 38 años el día del examen teórico.</li>
  <li><strong>Estatura:</strong> <strong>eliminada como requisito</strong> a partir de la convocatoria 2022 (medida contra la brecha de género).</li>
  <li><strong>Euskera:</strong> perfil lingüístico PL2 en la mayoría de plazas (PL1 en algunas convocatorias).</li>
</ul>

<h2>Requisitos generales</h2>
<table>
  <thead><tr><th>Requisito</th><th>Detalle</th></tr></thead>
  <tbody>
    <tr><td>Nacionalidad</td><td>Española</td></tr>
    <tr><td>Edad</td><td>18-38 años</td></tr>
    <tr><td>Titulación</td><td>Bachillerato, técnico FP grado medio o equivalente (nivel C1 administrativo)</td></tr>
    <tr><td>Estatura</td><td><strong>Sin requisito mínimo</strong> desde la convocatoria 2022</td></tr>
    <tr><td>Permiso de conducir</td><td>B en vigor</td></tr>
    <tr><td>Euskera</td><td>PL2 obligatorio en la mayoría de plazas</td></tr>
    <tr><td>Antecedentes penales</td><td>No tener antecedentes incompatibles</td></tr>
    <tr><td>Compromiso de armas</td><td>Comprometerse al uso de armas cuando proceda</td></tr>
  </tbody>
</table>

<h2>Perfiles lingüísticos de euskera</h2>
<p>
  La Ertzaintza distingue varios perfiles lingüísticos (PL) que se equiparan a niveles del marco europeo:
</p>
<ul>
  <li><strong>PL1:</strong> equivalente a B1 aproximadamente.</li>
  <li><strong>PL2:</strong> equivalente a B2 aproximadamente. Es el perfil exigido en la mayoría de plazas.</li>
  <li><strong>PL3:</strong> equivalente a C1. Exigido para puestos especializados.</li>
</ul>

<h2>Cambio clave 2022: adiós al requisito de altura</h2>
<p>
  Hasta 2022 se exigía <strong>1,65 m hombres y 1,60 m mujeres</strong>. El Gobierno Vasco y la
  Academia Vasca de Policía y Emergencias (Arkaute) <strong>eliminaron el requisito de estatura
  mínima</strong> a partir de la convocatoria siguiente, dentro del <em>Plan para el Fomento del
  Acceso de las Mujeres a la categoría de Agente</em>. Actualmente puedes presentarte al proceso
  selectivo sin importar cuánto mides, siempre que superes las pruebas físicas y el reconocimiento
  médico.
</p>

<h2>Causas frecuentes de exclusión inicial</h2>
<ul>
  <li>Superar la edad máxima el día del examen teórico.</li>
  <li>Carecer del permiso B en el momento de la inscripción.</li>
  <li>No acreditar titulación equivalente a Bachillerato.</li>
  <li>Antecedentes penales incompatibles con el servicio.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Ertzaintza en OpoRuta</a></li>
  <li><a href="/blog/plazas-ertzaintza-2026-convocatoria">Plazas y convocatoria 2026</a></li>
  <li><a href="/blog/euskera-ertzaintza-perfil-pl2-pl3-examen">Euskera: perfiles PL2 y PL3</a></li>
  <li><a href="/ley/ley-organica-2-1986-fuerzas-cuerpos-seguridad">LO 2/1986 de Fuerzas y Cuerpos de Seguridad</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuál es la edad máxima para Ertzaintza?', answer: 'La edad máxima es 38 años el día del examen teórico. No se descuenta el tiempo de servicio militar ni otras situaciones.' },
      { question: '¿La Ertzaintza pide altura mínima?', answer: 'No. El Gobierno Vasco eliminó el requisito de altura mínima (antes 1,65 m hombres / 1,60 m mujeres) a partir de la convocatoria 2022, como parte del Plan para el Fomento del Acceso de las Mujeres. Ya no se excluye por talla.' },
      { question: '¿Puedo opositar sin el perfil PL2 de euskera?', answer: 'Puedes presentarte a plazas con PL1 si la convocatoria ofrece esa modalidad, pero la inmensa mayoría de plazas exigen PL2.' },
      { question: '¿Es obligatorio el carné de conducir B?', answer: 'Sí. Debes tenerlo en vigor el día de finalización del plazo de inscripción.' },
      { question: '¿Puedo ser Ertzaintza si tengo antecedentes penales?', answer: 'Depende. Antecedentes cancelados no impiden participar, pero cualquier antecedente activo incompatible con el servicio supone exclusión.' },
    ],
  },

  // ─── 3 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'psicotecnicos-ertzaintza-2026-tipos-ejemplos',
    title: 'Psicotécnicos Ertzaintza 2026: tipos, ejemplos y tiempos',
    description:
      'Psicotécnicos Ertzaintza: aptitudes verbales, numéricas, espaciales, atención y personalidad. Ejemplos, tiempos y cómo entrenar.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'psicotecnicos ertzaintza 2026',
      'test personalidad ertzaintza',
      'aptitudes ertzaintza',
      'examen psicotecnico arkaute',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Batería:</strong> 5-6 pruebas de aptitudes + un test de personalidad extenso.</li>
  <li><strong>Duración total:</strong> entre 3 y 4 horas en una o dos sesiones en Arkaute.</li>
  <li><strong>Eliminatoria:</strong> sí. Quien no alcanza el percentil mínimo queda fuera.</li>
</ul>

<h2>Estructura de los psicotécnicos Ertzaintza</h2>
<table>
  <thead><tr><th>Prueba</th><th>Qué mide</th><th>Formato</th></tr></thead>
  <tbody>
    <tr><td>Aptitud verbal</td><td>Vocabulario, sinónimos, analogías</td><td>Test de opción múltiple</td></tr>
    <tr><td>Aptitud numérica</td><td>Cálculo, series, problemas</td><td>Test con tiempo ajustado</td></tr>
    <tr><td>Razonamiento abstracto</td><td>Matrices, figuras, patrones</td><td>Similar a Raven</td></tr>
    <tr><td>Aptitud espacial</td><td>Rotaciones, mapas, encajes</td><td>Visualización</td></tr>
    <tr><td>Atención y percepción</td><td>Tachar símbolos, errores, detalles</td><td>Alta velocidad</td></tr>
    <tr><td>Test de personalidad</td><td>Perfil profesional Ertzaintza</td><td>240-400 ítems tipo Likert</td></tr>
  </tbody>
</table>

<h2>Cómo se corrige</h2>
<p>
  Cada prueba se normaliza por percentiles frente al conjunto de opositores. No suele haber penalización por error,
  pero el tiempo es el factor limitante: dejarse preguntas en blanco reduce tu percentil. El test de personalidad
  no tiene respuestas correctas, pero sí escalas de sinceridad: contradecirte activa una alerta que se contrasta
  en la entrevista personal.
</p>

<h2>Plan de entrenamiento recomendado</h2>
<ul>
  <li><strong>Meses 1-3:</strong> 1 h/semana de aptitudes para detectar tus puntos débiles.</li>
  <li><strong>Meses 4-8:</strong> 2 h/semana centradas en el tipo que te cueste más (normalmente numérico o espacial).</li>
  <li><strong>Meses 9-12:</strong> 3 h/semana con simulacros completos a tiempo real.</li>
  <li><strong>Personalidad:</strong> responde con coherencia en bloques, sin idealizar ni desahogarte.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/test-ertzaintza-2026-practica-online-gratis-ia">Test de práctica online</a></li>
  <li><a href="/blog/reconocimiento-psicologico-ertzaintza-test-personalidad">Reconocimiento psicológico y personalidad</a></li>
  <li><a href="/blog/entrevista-personal-ertzaintza-preguntas-2026">Entrevista personal Ertzaintza</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuánto duran los psicotécnicos en Ertzaintza?', answer: 'Entre 3 y 4 horas en total, normalmente en una o dos sesiones en la Academia de Arkaute.' },
      { question: '¿Se puede aprobar el psicotécnico sin entrenar?', answer: 'Es muy poco probable. Incluso personas con buenas aptitudes base mejoran 1-2 percentiles completos con 3 meses de entrenamiento específico.' },
      { question: '¿Tiene penalización el psicotécnico de Ertzaintza?', answer: 'Las aptitudes no suelen penalizar errores, pero cada convocatoria lo precisa. Lo decisivo es el tiempo y la tasa de acierto normalizada.' },
      { question: '¿Qué miden en el test de personalidad?', answer: 'Estabilidad emocional, tolerancia a la frustración, orientación a normas, trabajo en equipo y coherencia interna de respuestas.' },
      { question: '¿El test de personalidad es eliminatorio?', answer: 'Sí en combinación con la entrevista. Si detectan incoherencias graves o perfil incompatible, puedes quedar excluido aunque hayas aprobado teórico y físicas.' },
    ],
  },

  // ─── 4 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'entrevista-personal-ertzaintza-preguntas-2026',
    title: 'Entrevista Ertzaintza 2026: 20 preguntas clave',
    description:
      'Entrevista personal Ertzaintza: estructura, duración, tipos de preguntas y errores frecuentes. Guía para preparar Arkaute con éxito.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'entrevista personal ertzaintza',
      'preguntas entrevista ertzaintza 2026',
      'entrevista arkaute',
      'como preparar entrevista ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Duración:</strong> 20-40 minutos ante un tribunal mixto (psicólogo + mando).</li>
  <li><strong>Base:</strong> se apoya en los resultados del test de personalidad.</li>
  <li><strong>Objetivo:</strong> validar coherencia, motivación real y estabilidad emocional.</li>
</ul>

<h2>Estructura de la entrevista</h2>
<table>
  <thead><tr><th>Bloque</th><th>Contenido</th><th>Tiempo aprox.</th></tr></thead>
  <tbody>
    <tr><td>Biográfico</td><td>Trayectoria académica y laboral</td><td>5-10 min</td></tr>
    <tr><td>Motivacional</td><td>Por qué Ertzaintza y no otro cuerpo</td><td>5-8 min</td></tr>
    <tr><td>Situacional</td><td>Casos prácticos policiales</td><td>8-12 min</td></tr>
    <tr><td>Contraste personalidad</td><td>Respuestas incoherentes del test</td><td>5-10 min</td></tr>
  </tbody>
</table>

<h2>10 preguntas que suelen caer</h2>
<ul>
  <li>¿Por qué Ertzaintza y no Policía Nacional o Guardia Civil?</li>
  <li>¿Qué harías si un compañero actuara de forma incorrecta?</li>
  <li>Describe una situación donde hayas tenido que liderar bajo presión.</li>
  <li>¿Cómo reaccionas cuando alguien te insulta o provoca?</li>
  <li>¿Qué papel juega el euskera en tu motivación?</li>
  <li>¿Cómo gestionas conflictos familiares o de pareja?</li>
  <li>Pon un ejemplo de decisión ética difícil.</li>
  <li>¿Cómo te ves a 10 años dentro del cuerpo?</li>
  <li>¿Qué opinas sobre el uso proporcional de la fuerza?</li>
  <li>¿Qué harías si detectaras corrupción interna?</li>
</ul>

<h2>Errores que eliminan en la entrevista</h2>
<ul>
  <li>Respuestas memorizadas o genéricas.</li>
  <li>Idealizar el cuerpo sin mostrar conciencia de su parte difícil.</li>
  <li>Contradicciones con el test de personalidad.</li>
  <li>Lenguaje no verbal defensivo o arrogante.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/reconocimiento-psicologico-ertzaintza-test-personalidad">Test de personalidad</a></li>
  <li><a href="/blog/psicotecnicos-ertzaintza-2026-tipos-ejemplos">Psicotécnicos Ertzaintza</a></li>
  <li><a href="/blog/requisitos-ertzaintza-2026-edad-altura-euskera">Requisitos Ertzaintza 2026</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuánto dura la entrevista personal en Ertzaintza?', answer: 'Entre 20 y 40 minutos, según cuánto necesite el tribunal profundizar en el contraste con el test de personalidad.' },
      { question: '¿Es eliminatoria la entrevista?', answer: 'Sí. Forma parte del bloque psicológico junto con el test de personalidad y puede excluirte aunque hayas aprobado teórico y físicas.' },
      { question: '¿Quién te entrevista?', answer: 'Un tribunal mixto compuesto habitualmente por psicólogos y mandos del cuerpo.' },
      { question: '¿Puedo responder en euskera o castellano?', answer: 'Puedes responder en la lengua oficial que prefieras. Si vas a plaza PL2, mostrar soltura en euskera suma.' },
      { question: '¿Me pueden preguntar por mis antecedentes personales?', answer: 'Sí, incluyendo relaciones familiares, consumo de sustancias, deudas o episodios psicológicos. La sinceridad controlada es clave.' },
    ],
  },

  // ─── 5 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'reconocimiento-medico-ertzaintza-causas-exclusion',
    title: 'Reconocimiento médico Ertzaintza: causas de exclusión 2026',
    description:
      'Reconocimiento médico Ertzaintza 2026: cuadro de exclusiones (visión, audición, tatuajes, psiquiátrico) y cómo prepararte.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'reconocimiento medico ertzaintza',
      'causas exclusion medica ertzaintza',
      'cuadro exclusiones ertzaintza',
      'tatuajes ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Fase eliminatoria:</strong> se realiza tras físicas y psicotécnico.</li>
  <li><strong>Causas frecuentes:</strong> visión insuficiente, hipertensión no controlada, trastornos musculoesqueléticos.</li>
  <li><strong>Tatuajes:</strong> no prohibidos, pero no pueden ser visibles con uniforme o contrarios a los principios del cuerpo.</li>
</ul>

<h2>Pruebas que suelen incluirse</h2>
<table>
  <thead><tr><th>Área</th><th>Prueba</th><th>Criterio</th></tr></thead>
  <tbody>
    <tr><td>Visión</td><td>Agudeza con/sin corrección, campo visual</td><td>Normalmente se admite cirugía refractiva estable</td></tr>
    <tr><td>Audición</td><td>Audiometría</td><td>Sin pérdidas significativas en frecuencias conversacionales</td></tr>
    <tr><td>Cardiovascular</td><td>ECG, tensión arterial</td><td>TA controlada, sin arritmias patológicas</td></tr>
    <tr><td>Pulmonar</td><td>Espirometría</td><td>Función pulmonar normal</td></tr>
    <tr><td>Locomotor</td><td>Exploración ortopédica</td><td>Sin limitaciones funcionales graves</td></tr>
    <tr><td>Analítica</td><td>Sangre, orina, tóxicos</td><td>Presencia de drogas = exclusión</td></tr>
    <tr><td>Psiquiátrico</td><td>Historia y cribado</td><td>Sin trastornos activos incompatibles</td></tr>
  </tbody>
</table>

<h2>Causas frecuentes de exclusión</h2>
<ul>
  <li>Agudeza visual por debajo del mínimo con corrección.</li>
  <li>Hipertensión arterial sin control.</li>
  <li>Diabetes insulinodependiente mal controlada.</li>
  <li>Historia reciente de trastornos psiquiátricos graves.</li>
  <li>Patologías de columna con limitación funcional.</li>
  <li>Analítica positiva en drogas de abuso.</li>
</ul>

<h2>Tatuajes y piercings</h2>
<p>
  Los tatuajes no excluyen por sí mismos, pero no pueden ser visibles con el uniforme de verano ni mostrar símbolos
  contrarios a los principios constitucionales y al propio cuerpo policial. Piercings visibles suelen requerirse retirados
  durante el servicio.
</p>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/pruebas-fisicas-ertzaintza-2026-marcas-minimas">Pruebas físicas y marcas mínimas</a></li>
  <li><a href="/blog/reconocimiento-psicologico-ertzaintza-test-personalidad">Reconocimiento psicológico</a></li>
  <li><a href="/blog/requisitos-ertzaintza-2026-edad-altura-euskera">Requisitos generales</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Puedo ser Ertzaintza operado de miopía?', answer: 'Sí, siempre que la cirugía refractiva esté estabilizada (mínimo 6-12 meses) y no haya complicaciones ni limitación visual residual.' },
      { question: '¿Los tatuajes excluyen en Ertzaintza?', answer: 'No por sí solos. Quedan excluidos los tatuajes visibles con uniforme reglamentario o con contenido contrario al cuerpo.' },
      { question: '¿Detectan drogas en la analítica?', answer: 'Sí. Una analítica positiva en drogas de abuso supone exclusión directa del proceso.' },
      { question: '¿Me excluyen por problemas de espalda?', answer: 'Solo si hay limitación funcional o patología estructural grave demostrada. Dolores ocasionales o hallazgos leves en RMN no suelen excluir.' },
      { question: '¿Puedo presentarme con asma leve?', answer: 'Depende del grado. Asma bien controlada sin crisis frecuentes y con espirometría normal no suele excluir.' },
    ],
  },

  // ─── 6 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'nota-corte-ertzaintza-2024-2025-historico',
    title: 'Nota de corte Ertzaintza 2024-2025: histórico',
    description:
      'Nota de corte Ertzaintza últimas convocatorias: teórico, físicas, psicotécnico. Evolución histórica y previsión 2026.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'nota corte ertzaintza 2024',
      'nota corte ertzaintza 2025',
      'historico notas ertzaintza',
      'nota minima ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Teórico:</strong> histórico entre 5,0 y 6,5/10 según dificultad del examen y número de plazas.</li>
  <li><strong>Físicas:</strong> eliminatorias por prueba, no por nota conjunta.</li>
  <li><strong>Previsión 2026:</strong> con ~800 plazas, la nota de corte tenderá a bajar respecto a OPEs pequeñas.</li>
</ul>

<h2>Cómo se calcula la nota de corte</h2>
<p>
  La Ertzaintza combina la nota del teórico con los puntos del concurso (méritos) y las pruebas eliminatorias. El corte
  real depende del número de plazas convocadas y del tamaño de la bolsa de presentados. En convocatorias con muchas
  plazas la nota mínima para pasar a la siguiente fase desciende de forma natural.
</p>

<h2>Evolución histórica aproximada</h2>
<table>
  <thead><tr><th>Convocatoria</th><th>Plazas aprox.</th><th>Corte orientativo teórico</th></tr></thead>
  <tbody>
    <tr><td>2017-2018</td><td>400-500</td><td>Alta (6,0-6,5/10)</td></tr>
    <tr><td>2021-2022</td><td>600-700</td><td>Media (5,5-6,0/10)</td></tr>
    <tr><td>2023-2024</td><td>700-850</td><td>Moderada (5,0-5,8/10)</td></tr>
    <tr><td>2026 (previsión)</td><td>~800</td><td>Media-baja (5,0-5,8/10)</td></tr>
  </tbody>
</table>

<h2>Qué implica para ti</h2>
<ul>
  <li>No te obsesiones con sacar un 9 en teórico: pasa de corte con solvencia y prioriza físicas/euskera.</li>
  <li>La bolsa de aprobados es amplia cuando hay muchas plazas: los méritos importan más.</li>
  <li>Una mala nota teórica es difícil de compensar si el corte se sitúa por encima de 6.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/plazas-ertzaintza-2026-convocatoria">Plazas y convocatoria 2026</a></li>
  <li><a href="/blog/temas-mas-preguntados-ertzaintza-2023-2025">Temas más preguntados 2023-2025</a></li>
  <li><a href="/blog/calendario-ertzaintza-2026-fechas-examen">Calendario 2026</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuál fue la nota de corte en Ertzaintza 2024?', answer: 'Oscila según la fase, pero el teórico se sitúa habitualmente entre 5,0 y 5,8 sobre 10 cuando hay muchas plazas. Consulta las publicaciones oficiales de Arkaute para el dato exacto.' },
      { question: '¿Influye el número de plazas en la nota de corte?', answer: 'Mucho. Más plazas convocadas → corte teórico más bajo. OPEs pequeñas suelen tener cortes por encima de 6,0.' },
      { question: '¿Hay nota de corte global sumando todas las pruebas?', answer: 'No exactamente. Cada fase eliminatoria (físicas, psicotécnico, médico, entrevista) tiene su propio umbral. La nota final decide el orden de adjudicación.' },
      { question: '¿Qué nota necesito para aprobar con seguridad?', answer: 'Apuntar a 7,5/10 en teórico te deja margen tranquilo en prácticamente cualquier convocatoria.' },
      { question: '¿Se puede recurrir la nota?', answer: 'Sí, mediante recursos potestativos de reposición o contencioso-administrativo, en los plazos publicados en cada convocatoria.' },
    ],
  },

  // ─── 7 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'temas-mas-preguntados-ertzaintza-2023-2025',
    title: 'Temas más preguntados Ertzaintza 2023-2025 (análisis real)',
    description:
      'Análisis de frecuencia: qué temas del temario Ertzaintza cayeron más en 2023, 2024 y 2025. Prioriza tu estudio con datos reales.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'temas mas preguntados ertzaintza',
      'frecuencia temas ertzaintza 2024',
      'analisis examenes ertzaintza',
      'radar tribunal ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Ley 4/1992:</strong> presente en el 15-20% de las preguntas de convocatorias recientes.</li>
  <li><strong>Constitución + Estatuto:</strong> bloque troncal, 20-25% de preguntas.</li>
  <li><strong>Procedimiento penal y seguridad ciudadana:</strong> 15% recurrente.</li>
</ul>

<h2>Distribución orientativa 2023-2025</h2>
<table>
  <thead><tr><th>Bloque</th><th>% aproximado</th><th>Temas clave</th></tr></thead>
  <tbody>
    <tr><td>Derecho constitucional</td><td>15-18%</td><td>Derechos fundamentales, Cortes, Corona</td></tr>
    <tr><td>Estatuto de Autonomía y Gobierno Vasco</td><td>10-12%</td><td>Competencias, Lehendakari, Parlamento Vasco</td></tr>
    <tr><td>Ley 4/1992 de Policía del País Vasco</td><td>15-20%</td><td>Principios, derechos y deberes, régimen disciplinario</td></tr>
    <tr><td>LO 2/1986 FCSE</td><td>8-10%</td><td>Principios de actuación, funciones</td></tr>
    <tr><td>Procedimiento penal</td><td>10-12%</td><td>Detención, policía judicial, plazos</td></tr>
    <tr><td>Seguridad ciudadana</td><td>8-10%</td><td>LO 4/2015, potestades</td></tr>
    <tr><td>Violencia de género</td><td>5-7%</td><td>LO 1/2004, protocolo Ertzaintza</td></tr>
    <tr><td>Tráfico y seguridad vial</td><td>6-8%</td><td>LSV, infracciones graves/muy graves</td></tr>
    <tr><td>Protección civil y extranjería</td><td>5-7%</td><td>Emergencias, LO 4/2000</td></tr>
  </tbody>
</table>

<h2>Temas que no puedes fallar</h2>
<ul>
  <li>Derechos fundamentales (arts. 14-29 CE).</li>
  <li>Organización institucional de Euskadi (Estatuto de Gernika).</li>
  <li>Principios de actuación policial (art. 5 LO 2/1986).</li>
  <li>Régimen disciplinario de la Ley 4/1992.</li>
  <li>Detención y derechos del detenido (art. 520 LECrim).</li>
</ul>

<h2>Cómo aplicar esta información</h2>
<p>
  Dedica el 60-65% del tiempo de estudio a los bloques con más del 10% de frecuencia. Los temas residuales (emergencias,
  extranjería, deontología) necesitan repaso regular pero no dominan el examen. OpoRuta ofrece el Radar del Tribunal que
  calcula esta frecuencia automáticamente sobre todas las convocatorias ingestadas.
</p>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/temario-ertzaintza-2026">Temario completo Ertzaintza 2026</a></li>
  <li><a href="/blog/ley-policia-pais-vasco-4-1992-ertzaintza-temas-clave">Ley 4/1992: temas clave</a></li>
  <li><a href="/blog/derecho-constitucional-estatuto-autonomia-ertzaintza-2026">Constitución y Estatuto</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Qué ley se pregunta más en Ertzaintza?', answer: 'La Ley 4/1992 de Policía del País Vasco, junto con la Constitución y el Estatuto de Gernika, concentran cerca del 40% de las preguntas.' },
      { question: '¿Merece la pena estudiar todos los temas por igual?', answer: 'No. Asigna el tiempo en función del peso histórico: al menos el 60% a los bloques con más de 10% de frecuencia.' },
      { question: '¿Cambia mucho el peso entre convocatorias?', answer: 'El reparto macro (constitucional, Ley 4/1992, procedimiento penal) es estable. Los temas pequeños sí oscilan más.' },
      { question: '¿Preguntan novedades legislativas?', answer: 'Sí. Reformas recientes en violencia de género, seguridad ciudadana o extranjería suelen aparecer el año siguiente a su publicación.' },
      { question: '¿Qué herramienta usa OpoRuta para medir frecuencia?', answer: 'El Radar del Tribunal, que calcula la frecuencia por tema a partir de las convocatorias oficiales ingestadas.' },
    ],
  },

  // ─── 8 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'euskera-ertzaintza-perfil-pl2-pl3-examen',
    title: 'Euskera Ertzaintza: perfiles PL2 y PL3, examen y preparación',
    description:
      'Euskera Ertzaintza 2026: perfiles PL1, PL2 y PL3, equivalencia con niveles europeos, estructura del examen y plan de estudio.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'euskera ertzaintza',
      'perfil pl2 ertzaintza',
      'perfil pl3 ertzaintza',
      'examen euskera ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>PL2:</strong> perfil obligatorio en la mayoría de plazas desde convocatorias recientes.</li>
  <li><strong>Equivalencia:</strong> PL2 ≈ B2, PL3 ≈ C1 del Marco Común Europeo.</li>
  <li><strong>Preparación:</strong> de B1 a PL2 se necesitan 6-9 meses de estudio intensivo.</li>
</ul>

<h2>Perfiles lingüísticos de euskera</h2>
<table>
  <thead><tr><th>Perfil</th><th>Nivel europeo aprox.</th><th>Uso en Ertzaintza</th></tr></thead>
  <tbody>
    <tr><td>PL1</td><td>B1</td><td>Plazas sin perfil obligatorio / mínimo</td></tr>
    <tr><td>PL2</td><td>B2</td><td>La mayoría de plazas convocadas</td></tr>
    <tr><td>PL3</td><td>C1</td><td>Puestos especializados y mandos</td></tr>
    <tr><td>PL4</td><td>C2</td><td>Muy específico, poco frecuente en base</td></tr>
  </tbody>
</table>

<h2>Estructura del examen de euskera</h2>
<ul>
  <li><strong>Comprensión lectora:</strong> textos y preguntas tipo test.</li>
  <li><strong>Comprensión oral:</strong> audios y preguntas breves.</li>
  <li><strong>Expresión escrita:</strong> redacción de 150-300 palabras.</li>
  <li><strong>Expresión oral:</strong> diálogo con el tribunal.</li>
</ul>

<h2>Cómo acreditar sin examen</h2>
<p>
  Puedes acreditar el perfil mediante certificados oficiales reconocidos por HABE (EGA, certificados universitarios)
  o por equivalencias con títulos europeos. Comprueba en la convocatoria concreta los certificados exactos que se
  homologan, porque la lista puede variar.
</p>

<h2>Plan de estudio de PL2 en 9 meses</h2>
<ul>
  <li><strong>Mes 1-3:</strong> gramática base (aditzak, deklinabidea) + vocabulario temático.</li>
  <li><strong>Mes 4-6:</strong> comprensión lectora y audio diario + redacciones cortas.</li>
  <li><strong>Mes 7-8:</strong> simulacros completos con corrección humana.</li>
  <li><strong>Mes 9:</strong> oral intensivo, frases hechas y terminología policial.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/requisitos-ertzaintza-2026-edad-altura-euskera">Requisitos Ertzaintza 2026</a></li>
  <li><a href="/blog/plazas-ertzaintza-2026-convocatoria">Plazas y convocatoria 2026</a></li>
  <li><a href="/blog/como-aprobar-ertzaintza-primera-vuelta-2026">Plan 12 meses Ertzaintza</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Puedo entrar en Ertzaintza sin euskera?', answer: 'En convocatorias con plazas sin perfil obligatorio sí, pero la mayoría de plazas exigen PL2. Sin euskera, tu rango de plazas accesibles es muy reducido.' },
      { question: '¿A qué nivel equivale el PL2?', answer: 'Se considera equivalente a un B2 del Marco Común Europeo de Referencia, con énfasis en situaciones reales de uso.' },
      { question: '¿Cuánto tarda alguien sin euskera en llegar a PL2?', answer: 'Partiendo de cero, entre 18 y 24 meses intensivos. Desde B1 sólido, 6-9 meses con dedicación diaria.' },
      { question: '¿El EGA equivale al PL3?', answer: 'Sí, el EGA se reconoce habitualmente como equivalente al PL3. Comprueba la tabla oficial de HABE vigente en cada convocatoria.' },
      { question: '¿El examen de euskera tiene parte oral?', answer: 'Sí. La parte oral suele ser la más discriminante y se prepara con tutor/simulacros orales en directo.' },
    ],
  },

  // ─── 9 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'derecho-constitucional-estatuto-autonomia-ertzaintza-2026',
    title: 'Constitución y Estatuto Gernika para Ertzaintza 2026',
    description:
      'Constitución española y Estatuto de Autonomía del País Vasco para Ertzaintza: artículos clave, competencias y preguntas tipo.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'constitucion ertzaintza',
      'estatuto gernika ertzaintza',
      'derecho constitucional ertzaintza',
      'competencias euskadi seguridad',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Constitución:</strong> 15-18% de las preguntas de Ertzaintza.</li>
  <li><strong>Estatuto de Gernika (LO 3/1979):</strong> 10-12% adicional.</li>
  <li><strong>Competencia clave:</strong> seguridad pública propia en el marco del art. 17 del Estatuto.</li>
</ul>

<h2>Artículos constitucionales de alto impacto</h2>
<table>
  <thead><tr><th>Artículo</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Art. 1</td><td>Estado social y democrático de Derecho</td></tr>
    <tr><td>Arts. 14-29</td><td>Derechos fundamentales y libertades públicas</td></tr>
    <tr><td>Art. 104</td><td>Fuerzas y Cuerpos de Seguridad</td></tr>
    <tr><td>Art. 117</td><td>Poder judicial y unidad jurisdiccional</td></tr>
    <tr><td>Art. 149</td><td>Competencias exclusivas del Estado</td></tr>
    <tr><td>Art. 148</td><td>Competencias de las Comunidades Autónomas</td></tr>
  </tbody>
</table>

<h2>Estatuto de Autonomía del País Vasco (LO 3/1979)</h2>
<ul>
  <li><strong>Art. 9:</strong> derechos y deberes de los ciudadanos vascos.</li>
  <li><strong>Art. 17:</strong> seguridad ciudadana y Ertzaintza.</li>
  <li><strong>Art. 24:</strong> Parlamento Vasco.</li>
  <li><strong>Art. 33:</strong> Lehendakari y Gobierno Vasco.</li>
  <li><strong>Art. 40-45:</strong> Hacienda y Concierto Económico.</li>
</ul>

<h2>Competencia de seguridad pública</h2>
<p>
  El art. 17 del Estatuto atribuye al País Vasco la competencia para el régimen de la Policía Autónoma, dentro de lo
  dispuesto por la Constitución y la LO 2/1986 de Fuerzas y Cuerpos de Seguridad. La Junta de Seguridad es el órgano
  paritario Estado-Euskadi que coordina actuaciones.
</p>

<h2>Preguntas tipo que deberías bordar</h2>
<ul>
  <li>¿Qué órgano designa al Lehendakari?</li>
  <li>¿Cuál es el órgano paritario de coordinación Estado-Euskadi en seguridad?</li>
  <li>¿Puede suspenderse el art. 25 CE?</li>
  <li>¿Qué contenidos mínimos tiene el derecho de reunión?</li>
  <li>¿Qué relación hay entre LO 2/1986 y Ley 4/1992?</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/ley/ley-organica-2-1986-fuerzas-cuerpos-seguridad">LO 2/1986 FCSE</a></li>
  <li><a href="/blog/ley-policia-pais-vasco-4-1992-ertzaintza-temas-clave">Ley 4/1992 del País Vasco</a></li>
  <li><a href="/blog/temario-ertzaintza-2026">Temario completo Ertzaintza</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Qué parte de la Constitución se pregunta más en Ertzaintza?', answer: 'Los derechos fundamentales (arts. 14-29), la organización territorial (arts. 137-149) y el art. 104 sobre FCS dominan las preguntas.' },
      { question: '¿Qué es la Junta de Seguridad?', answer: 'El órgano paritario Estado-Euskadi que coordina las actuaciones policiales en el ámbito autonómico, según el Estatuto y la LO 2/1986.' },
      { question: '¿Se pregunta el Concierto Económico en el examen?', answer: 'Aparece en el bloque constitucional/estatutario, aunque con menor peso que derechos fundamentales o seguridad pública.' },
      { question: '¿Qué artículos del Estatuto son imprescindibles?', answer: 'Arts. 1, 2, 9, 10, 17, 24 y 33 al menos. Son los más preguntados en convocatorias recientes.' },
      { question: '¿Debo estudiar la reforma constitucional de 2011?', answer: 'Sí. La reforma del art. 135 suele aparecer y es útil para preguntas sobre estabilidad presupuestaria.' },
    ],
  },

  // ─── 10 ────────────────────────────────────────────────────────────────────
  {
    slug: 'ley-policia-pais-vasco-4-1992-ertzaintza-temas-clave',
    title: 'Ley 4/1992 Policía País Vasco: temas clave Ertzaintza',
    description:
      'Ley 4/1992 de Policía del País Vasco explicada: estructura, derechos, deberes, régimen disciplinario y preguntas típicas Ertzaintza.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'ley 4 1992 policia pais vasco',
      'ertzaintza ley 4 1992',
      'regimen disciplinario ertzaintza',
      'derechos deberes ertzaintza',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Marco:</strong> Ley 4/1992 regula la Policía del País Vasco (Ertzaintza + policías locales).</li>
  <li><strong>Peso en examen:</strong> 15-20% de las preguntas.</li>
  <li><strong>Zonas calientes:</strong> principios de actuación, derechos, deberes y régimen disciplinario.</li>
</ul>

<h2>Estructura general de la Ley 4/1992</h2>
<table>
  <thead><tr><th>Título</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Título I</td><td>Disposiciones generales y funciones</td></tr>
    <tr><td>Título II</td><td>Principios de actuación</td></tr>
    <tr><td>Título III</td><td>Estructura y organización Ertzaintza</td></tr>
    <tr><td>Título IV</td><td>Policías Locales de Euskadi</td></tr>
    <tr><td>Título V</td><td>Coordinación y formación</td></tr>
    <tr><td>Título VI</td><td>Régimen estatutario</td></tr>
    <tr><td>Título VII</td><td>Régimen disciplinario</td></tr>
  </tbody>
</table>

<h2>Principios de actuación</h2>
<p>
  Los principios son coherentes con el art. 5 de la LO 2/1986: adecuación al ordenamiento, relaciones con la comunidad,
  tratamiento a detenidos, dedicación profesional, secreto profesional y responsabilidad. Aparecen casi todos los años.
</p>

<h2>Derechos y deberes (resumen)</h2>
<ul>
  <li><strong>Derechos:</strong> sindicación con particularidades, formación permanente, jornada, seguridad y salud, ayudas.</li>
  <li><strong>Deberes:</strong> disponibilidad, secreto, imparcialidad, uso proporcional de la fuerza.</li>
</ul>

<h2>Régimen disciplinario</h2>
<table>
  <thead><tr><th>Falta</th><th>Ejemplos</th><th>Sanciones</th></tr></thead>
  <tbody>
    <tr><td>Muy graves</td><td>Tortura, insubordinación, embriaguez reiterada en servicio</td><td>Separación del servicio</td></tr>
    <tr><td>Graves</td><td>Grave desconsideración, abandono de servicio</td><td>Suspensión hasta 1 año</td></tr>
    <tr><td>Leves</td><td>Incorrección, retrasos</td><td>Apercibimiento, suspensión hasta 4 días</td></tr>
  </tbody>
</table>

<h2>Preguntas tipo</h2>
<ul>
  <li>¿Qué órgano resuelve los procedimientos por faltas muy graves?</li>
  <li>¿Cuáles son los plazos de prescripción de faltas graves?</li>
  <li>¿Qué diferencia hay entre suspensión firme y provisional?</li>
  <li>¿Se puede reingresar tras separación del servicio?</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/ley/ley-organica-2-1986-fuerzas-cuerpos-seguridad">LO 2/1986 FCSE</a></li>
  <li><a href="/blog/derecho-constitucional-estatuto-autonomia-ertzaintza-2026">Constitución y Estatuto</a></li>
  <li><a href="/blog/temas-mas-preguntados-ertzaintza-2023-2025">Temas más preguntados</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Qué regula la Ley 4/1992?', answer: 'La Policía del País Vasco: Ertzaintza, Policías Locales de Euskadi, régimen estatutario, coordinación, formación y régimen disciplinario.' },
      { question: '¿Cuántos títulos tiene la Ley 4/1992?', answer: 'Siete títulos más disposiciones adicionales, transitorias y finales. Los títulos II, VI y VII concentran la mayoría de preguntas.' },
      { question: '¿Se pregunta mucho el régimen disciplinario?', answer: 'Sí, es uno de los bloques más frecuentes. Cuadro de faltas y sanciones y órganos competentes aparecen cada convocatoria.' },
      { question: '¿Qué relación tiene con la LO 2/1986?', answer: 'La Ley 4/1992 desarrolla en Euskadi los principios de la LO 2/1986, respetando el marco estatutario del art. 17 de Gernika.' },
      { question: '¿Ha sido reformada recientemente?', answer: 'Ha sufrido modificaciones puntuales. Estudia siempre la versión consolidada vigente en la fecha de la convocatoria.' },
    ],
  },

  // ─── 11 ────────────────────────────────────────────────────────────────────
  {
    slug: 'opositar-ertzaintza-trabajando-plan-semanal-2026',
    title: 'Opositar a Ertzaintza trabajando: plan realista 2026',
    description:
      'Cómo preparar Ertzaintza compaginando trabajo: plan semanal de 15 horas, priorización y rutinas que funcionan sin quemarte.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'opositar ertzaintza trabajando',
      'plan ertzaintza compaginar trabajo',
      'preparar ertzaintza media jornada',
      'ertzaintza 15 horas semana',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Horas efectivas:</strong> 15 h/semana es el mínimo realista con trabajo a jornada completa.</li>
  <li><strong>Plazo:</strong> necesitarás 14-16 meses en lugar de 12.</li>
  <li><strong>Clave:</strong> bloques cortos de 45 min con descansos y sesión larga fin de semana.</li>
</ul>

<h2>Plan semanal de 15 horas</h2>
<table>
  <thead><tr><th>Día</th><th>Horas</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Lunes-Jueves</td><td>1,5 h/día</td><td>1 tema nuevo o repaso + 25 preguntas</td></tr>
    <tr><td>Viernes</td><td>1 h</td><td>Euskera</td></tr>
    <tr><td>Sábado</td><td>4 h</td><td>Temas pesados + simulacro de 50 preguntas</td></tr>
    <tr><td>Domingo</td><td>3 h</td><td>Físicas + psicotécnico + repaso</td></tr>
  </tbody>
</table>

<h2>Rutinas que funcionan</h2>
<ul>
  <li><strong>Madrugar 45 min antes:</strong> usar la primera hora del día para lo más denso.</li>
  <li><strong>Comidas útiles:</strong> audios en euskera o repasos de flashcards mientras comes.</li>
  <li><strong>Bloques Pomodoro:</strong> 45 min estudio / 10 min descanso / 45 min repaso.</li>
  <li><strong>Fin de semana blindado:</strong> Sábado y domingo son innegociables para temario nuevo.</li>
</ul>

<h2>Errores típicos trabajando</h2>
<ul>
  <li>Querer hacer lo mismo que alguien a jornada completa.</li>
  <li>Empezar físicas solo los fines de semana: no progresa.</li>
  <li>Saltarse el descanso semanal y quemarse en mes 6.</li>
  <li>No dejar margen para imprevistos laborales.</li>
</ul>

<h2>Cuándo plantearse reducir jornada</h2>
<p>
  En los últimos 2-3 meses antes del examen, reducir jornada o pedir excedencia puntual puede marcar la diferencia.
  Si tu empleo lo permite, plantéalo con antelación y reserva el presupuesto.
</p>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/como-aprobar-ertzaintza-primera-vuelta-2026">Plan 12 meses Ertzaintza</a></li>
  <li><a href="/blog/calendario-ertzaintza-2026-fechas-examen">Calendario 2026</a></li>
  <li><a href="/blog/simulacro-ertzaintza-2026-examen-completo-online">Simulacros online</a></li>
</ul>
`.trim(),
    howTo: {
      name: 'Plan semanal Ertzaintza compatible con trabajo',
      description: 'Pasos para estructurar 15 h/semana sin quemarte mientras trabajas.',
      totalTime: 'P14M',
      steps: [
        { name: 'Define horario fijo', text: 'Bloquea las franjas lunes-jueves de 1,5 h a la misma hora del día. Constancia > duración.' },
        { name: 'Dedica el fin de semana al bloque denso', text: '4 h sábado para temas nuevos y simulacro, 3 h domingo para físicas + repaso.' },
        { name: 'Incluye euskera cada semana', text: 'Aunque sean 60 min el viernes. Sin constancia no se alcanza PL2.' },
        { name: 'Haz 1 simulacro completo al mes', text: 'Imita condiciones de examen: misma hora, papel, sin móvil.' },
        { name: 'Revisa trimestralmente', text: 'Ajusta distribución cada 3 meses según puntos débiles detectados.' },
      ],
    },
    faqs: [
      { question: '¿Se puede aprobar Ertzaintza trabajando a jornada completa?', answer: 'Sí, pero necesitas 14-16 meses y 15 h/semana bien distribuidas. A jornada partida con horarios cambiantes, es más difícil.' },
      { question: '¿Cuántas horas mínimas son viables trabajando?', answer: 'Por debajo de 12 h/semana es casi imposible acabar el temario en un año. El mínimo recomendado es 15 h.' },
      { question: '¿Merece la pena dejar el trabajo?', answer: 'Solo si tienes ahorro para 6-9 meses y una 2ª convocatoria asegurada. Normalmente es mejor reducir jornada los 2-3 meses finales.' },
      { question: '¿Cómo encajo las físicas si trabajo 40 horas?', answer: '3 sesiones semanales de 45-60 min: 1 entre semana y 2 en fin de semana. Prioriza course-navette y fuerza específica.' },
      { question: '¿Qué papel juega la IA en este plan?', answer: 'Reduce tiempo de creación de tests, identifica tus puntos débiles y personaliza el repaso diario. Permite aprovechar mejor cada hora disponible.' },
    ],
  },

  // ─── 12 ────────────────────────────────────────────────────────────────────
  {
    slug: 'simulacro-ertzaintza-2026-examen-completo-online',
    title: 'Simulacro Ertzaintza 2026: examen completo online',
    description:
      'Simulacros Ertzaintza 2026 con estructura oficial: 100 preguntas, penalización, temporizador y análisis detallado por IA.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'simulacro ertzaintza 2026',
      'examen ertzaintza online',
      'simulacro ertzaintza completo',
      'simulacro arkaute',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Estructura oficial:</strong> 100 preguntas puntuables + 10 de reserva.</li>
  <li><strong>Penalización:</strong> suele aplicarse en proporciones tipo −1/3 o −1/4 según convocatoria.</li>
  <li><strong>Tiempo:</strong> alrededor de 100-120 minutos, depende de convocatoria.</li>
</ul>

<h2>Cómo es un simulacro realista de Ertzaintza</h2>
<table>
  <thead><tr><th>Elemento</th><th>Detalle</th></tr></thead>
  <tbody>
    <tr><td>Número de preguntas</td><td>100 puntuables + 10 de reserva</td></tr>
    <tr><td>Opciones</td><td>4 respuestas, 1 correcta</td></tr>
    <tr><td>Penalización</td><td>Aplicada según convocatoria (típicamente 1/3)</td></tr>
    <tr><td>Duración</td><td>100-120 minutos</td></tr>
    <tr><td>Distribución</td><td>Constitución, Estatuto, Ley 4/1992, LO 2/1986, penal, seguridad, tráfico, violencia de género, extranjería</td></tr>
  </tbody>
</table>

<h2>Cómo abordar un simulacro</h2>
<ul>
  <li><strong>Primera pasada:</strong> responde lo seguro, marca dudas.</li>
  <li><strong>Segunda pasada:</strong> resuelve dudas descartando opciones.</li>
  <li><strong>Tercera pasada:</strong> decide si contestar en blanco las que aún dudas (depende del riesgo con penalización).</li>
  <li><strong>Regla de oro:</strong> si dudas entre 2 opciones y conoces bien el tema, arriesga; si dudas entre 3, mejor en blanco.</li>
</ul>

<h2>Qué aporta el simulacro de OpoRuta</h2>
<ul>
  <li>Temporizador realista y penalización configurable.</li>
  <li>Desglose por tema al terminar, ordenado peor-mejor.</li>
  <li>Análisis detallado por IA de tus errores (cita legal, explicación).</li>
  <li>Referencia cruzada con las convocatorias reales ingestadas.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/ertzaintza">Página principal Ertzaintza</a></li>
  <li><a href="/blog/test-ertzaintza-2026-practica-online-gratis-ia">Test gratis online</a></li>
  <li><a href="/blog/temas-mas-preguntados-ertzaintza-2023-2025">Temas más preguntados</a></li>
  <li><a href="/blog/calendario-ertzaintza-2026-fechas-examen">Calendario 2026</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas tiene el examen real de Ertzaintza?', answer: 'Habitualmente 100 preguntas puntuables más 10 de reserva, aunque puede variar ligeramente entre convocatorias.' },
      { question: '¿Hay penalización por error?', answer: 'Sí, suele aplicarse una penalización proporcional (por ejemplo 1/3 o 1/4 del valor de la pregunta), según cada convocatoria.' },
      { question: '¿Cuánto dura el examen teórico?', answer: 'Entre 100 y 120 minutos aproximadamente. Revisa siempre las bases de la convocatoria vigente.' },
      { question: '¿Puedo hacer simulacros gratis en OpoRuta?', answer: 'Sí: los usuarios gratuitos pueden realizar simulacros de 20 preguntas limitados. Los usuarios Pack acceden a simulacros completos ilimitados.' },
      { question: '¿Qué análisis genera la IA después del simulacro?', answer: 'Un informe con nota, desglose por tema, referencia cruzada con convocatorias oficiales y explicación detallada de cada error con su cita legal.' },
    ],
  },
]
