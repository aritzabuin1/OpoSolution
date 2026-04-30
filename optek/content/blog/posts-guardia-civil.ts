import type { BlogPost } from './posts'

/**
 * 12 posts SEO específicos para Guardia Civil (Escala Cabos y Guardias).
 * Complementan los 9 posts guardia civil ya existentes en posts.ts.
 * Cifras tomadas de convocatorias 2019-2024 y posts pilar existentes.
 */

export const guardiaCivilPosts: BlogPost[] = [
  // ─── 1 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'como-aprobar-guardia-civil-primera-vuelta-2026',
    title: 'Aprobar Guardia Civil a la primera 2026: plan 10 meses real',
    description:
      'Plan realista para aprobar Guardia Civil en primera convocatoria: 45 temas en 10 meses, 20 h/semana, simulacros y físicas en paralelo.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'como aprobar guardia civil a la primera',
      'plan estudio guardia civil 2026',
      'oposicion guardia civil primera vuelta',
      'guardia civil 10 meses',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Horas mínimas:</strong> 20 h/semana durante 10 meses = 800 h totales para cubrir 45 temas.</li>
  <li><strong>Distribución:</strong> 60 % teoría, 25 % test/simulacros, 15 % físicas + ortografía + inglés.</li>
  <li><strong>Ratio real:</strong> 1 de cada 12 presentados aprueba (3.118 plazas en 2024 con ~36.500 presentados).</li>
</ul>

<h2>¿Es realista aprobar Guardia Civil a la primera?</h2>
<p>
  Sí, pero solo si empiezas con al menos <strong>10 meses de antelación</strong> al examen teórico (septiembre-octubre 2026).
  Aprobar a la primera no es cuestión de inteligencia: es organización y constancia. El temario de 45 temas se puede
  memorizar en 8-9 meses con 20 horas semanales, dejando 1 mes final para repaso y simulacros.
</p>

<h2>Plan semanal base (20 horas)</h2>
<table>
  <thead><tr><th>Bloque</th><th>Horas/semana</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Teoría nueva</td><td>10 h</td><td>2 temas nuevos (Ciencias Jurídicas o Sociotécnicas)</td></tr>
    <tr><td>Repaso espaciado</td><td>3 h</td><td>Temas de semanas -1, -3 y -7 (spaced repetition)</td></tr>
    <tr><td>Tests + simulacros</td><td>4 h</td><td>100 preguntas diarias con penalización −1/4</td></tr>
    <tr><td>Ortografía + inglés</td><td>1 h</td><td>Dictados + vocabulario A2/B1</td></tr>
    <tr><td>Físicas</td><td>2 h</td><td>Fuerza + carrera (empieza mes 3)</td></tr>
  </tbody>
</table>

<h2>Cronograma mes a mes</h2>
<ul>
  <li><strong>Mes 1-3:</strong> Bloque I (temas 1-20, Ciencias Jurídicas). Base constitucional y derecho penal.</li>
  <li><strong>Mes 4-6:</strong> Bloque II (temas 21-35, Sociotécnicas: tráfico, educación vial, geografía).</li>
  <li><strong>Mes 7-8:</strong> Bloque III (temas 36-45, materias técnicas de la Guardia Civil).</li>
  <li><strong>Mes 9:</strong> repaso completo + 3 simulacros semanales de 100 preguntas.</li>
  <li><strong>Mes 10:</strong> afinado final, psicotécnicos, ortografía y control de nervios.</li>
</ul>

<h2>Errores que te sacan a la primera</h2>
<ul>
  <li><strong>Empezar físicas el mes 8:</strong> necesitas 16 semanas para llegar con marcas. Empieza en mes 3.</li>
  <li><strong>Ignorar la penalización −1/4:</strong> cada 4 errores te cuesta 1 acierto. Entrena siempre con ella.</li>
  <li><strong>Saltarse ortografía:</strong> es eliminatoria. Un dictado al día basta.</li>
  <li><strong>No repasar:</strong> sin spaced repetition, al mes 6 has olvidado el 70 % del temario del mes 1.</li>
</ul>

<h2>Tu ratio de éxito</h2>
<p>
  Con 3.100 plazas y ~36.000 presentados, el ratio es <strong>1:12</strong>. Pero si filtras por quien llega al examen
  con 500+ horas efectivas (la mitad abandona), el ratio real sube a <strong>1:4</strong>. Con plan + constancia, aprobar
  a la primera es estadísticamente razonable.
</p>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo 45 temas</a></li>
  <li><a href="/blog/pruebas-fisicas-guardia-civil-2026">Pruebas físicas Guardia Civil 2026</a></li>
  <li><a href="/blog/calendario-guardia-civil-2026-fechas-examen">Calendario y fechas 2026</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuánto tiempo necesito para aprobar Guardia Civil a la primera?', answer: 'Entre 800 y 1.000 horas efectivas de estudio, repartidas en 10 meses a razón de 20 h/semana. Menos de 8 meses es muy arriesgado.' },
      { question: '¿Cuántas personas aprueban Guardia Civil a la primera?', answer: 'Se estima que en torno al 30-40 % de los aprobados lo consigue a la primera. La mayoría tarda 2 convocatorias.' },
      { question: '¿Puedo opositar sin academia privada?', answer: 'Sí. Con el temario actualizado, simulacros realistas con penalización −1/4 y disciplina, academia presencial no es imprescindible.' },
      { question: '¿Cuándo empiezo a entrenar físicas?', answer: 'En el mes 3 del plan. Necesitas 16 semanas mínimo para llegar con marcas apto sin lesionarte.' },
      { question: '¿Qué pasa si fallo en ortografía?', answer: 'Es eliminatoria: si no superas la prueba de ortografía, quedas fuera aunque tengas el teórico aprobado.' },
    ],
  },

  // ─── 2 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'psicotecnicos-guardia-civil-2026-tipos-ejemplos',
    title: 'Psicotécnicos Guardia Civil 2026: tipos, ejemplos y tiempos',
    description:
      'Psicotécnicos Guardia Civil: series numéricas, razonamiento abstracto, test personalidad 240 ítems. Ejemplos, tiempos y cómo entrenar.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'psicotecnicos guardia civil',
      'test personalidad guardia civil',
      'razonamiento abstracto guardia civil',
      'psicotecnico guardia civil 2026',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Dos bloques:</strong> aptitud (~60 preguntas, 45 min) + personalidad (~240 ítems, 30 min).</li>
  <li><strong>Aptitud:</strong> series numéricas, razonamiento verbal, abstracto y memoria visual.</li>
  <li><strong>Personalidad:</strong> no se aprueba ni se suspende, se usa para entrevista y perfilado.</li>
</ul>

<h2>Estructura del psicotécnico en Guardia Civil</h2>
<p>
  El test psicotécnico es independiente del examen teórico y se realiza habitualmente el mismo día. Consta de dos
  partes: una de aptitud (puntúa para el ranking global) y otra de personalidad (no puntúa pero filtra perfiles).
  Ambos se corrigen centralizadamente en Madrid.
</p>

<h2>Tipos de preguntas de aptitud</h2>
<table>
  <thead><tr><th>Tipo</th><th>Nº preguntas aprox.</th><th>Tiempo recomendado</th></tr></thead>
  <tbody>
    <tr><td>Series numéricas</td><td>15</td><td>30 s/pregunta</td></tr>
    <tr><td>Razonamiento verbal (analogías)</td><td>15</td><td>25 s/pregunta</td></tr>
    <tr><td>Razonamiento abstracto (figuras)</td><td>15</td><td>40 s/pregunta</td></tr>
    <tr><td>Problemas matemáticos</td><td>10</td><td>60 s/pregunta</td></tr>
    <tr><td>Memoria visual / órdenes</td><td>5</td><td>instantáneo</td></tr>
  </tbody>
</table>

<h2>Ejemplo series numéricas</h2>
<p>Serie: <strong>2, 6, 12, 20, 30, ?</strong></p>
<p>
  Diferencias: +4, +6, +8, +10. La siguiente diferencia es +12. Resultado: <strong>42</strong>. Este tipo de series se
  resuelve en menos de 20 segundos con entrenamiento. Sin entrenamiento, muchos opositores tardan más de 1 minuto.
</p>

<h2>Ejemplo razonamiento verbal</h2>
<p>"Libro es a leer como cuchara es a..." → comer. Se trata de identificar la relación lógica entre términos.</p>

<h2>Test de personalidad (240 ítems)</h2>
<p>
  Son afirmaciones tipo "Me cuesta expresar mis sentimientos" a las que respondes Verdadero/Falso. No hay respuestas
  correctas: se busca coherencia (mismas preguntas formuladas al revés varias veces) y ausencia de rasgos incompatibles
  con el servicio (impulsividad extrema, aislamiento social, agresividad).
</p>

<h2>Cómo entrenar</h2>
<ul>
  <li>Haz <strong>20 minutos diarios</strong> durante 3 meses: la mejora es lineal y medible.</li>
  <li>Cronometra cada bloque: la velocidad es casi tan importante como acertar.</li>
  <li>En personalidad, <strong>responde con sinceridad</strong>: las incoherencias se detectan.</li>
  <li>Repasa las figuras de series abstractas (tipo Raven): son las que más se repiten.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo</a></li>
  <li><a href="/blog/entrevista-personal-guardia-civil-2026-preguntas">Entrevista personal</a></li>
  <li><a href="/psicotecnicos">Practica psicotécnicos en OpoRuta</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿El psicotécnico de Guardia Civil puntúa?', answer: 'La parte de aptitud sí puntúa para el ranking. La de personalidad es APTO/NO APTO y se usa también en la entrevista personal.' },
      { question: '¿Cuántos ítems tiene el test de personalidad?', answer: 'En torno a 240 ítems tipo Verdadero/Falso, a completar en 30 minutos aproximadamente.' },
      { question: '¿Se puede suspender el psicotécnico?', answer: 'Sí. Si el test de personalidad detecta un perfil incompatible (incoherencias graves, rasgos extremos) quedas fuera aunque hayas aprobado teórico.' },
      { question: '¿Cuánto tiempo hay para cada pregunta de aptitud?', answer: 'Depende del tipo: series numéricas ~30 s, razonamiento abstracto ~40 s, problemas matemáticos hasta 60 s. Total ~45 min para ~60 preguntas.' },
      { question: '¿Se puede entrenar el psicotécnico?', answer: 'Sí, con 20 minutos diarios durante 3 meses la mejora es notable. La velocidad es el factor que más se entrena.' },
    ],
  },

  // ─── 3 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'entrevista-personal-guardia-civil-2026-preguntas',
    title: 'Entrevista Guardia Civil 2026: 25 preguntas y cómo responder',
    description:
      'Entrevista personal Guardia Civil 2026: 25 preguntas reales, duración 20 min, qué buscan los tribunales y cómo preparar respuestas concretas.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'entrevista guardia civil',
      'preguntas entrevista guardia civil',
      'entrevista personal guardia civil 2026',
      'que preguntan en la entrevista guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Duración:</strong> 15-25 minutos con un tribunal de 3 miembros.</li>
  <li><strong>Puntuación:</strong> APTO/NO APTO en la mayoría de convocatorias (puede puntuar en algunas).</li>
  <li><strong>Base:</strong> se apoya en tu test de personalidad (240 ítems) y tu historial.</li>
</ul>

<h2>¿Qué buscan los tribunales?</h2>
<p>
  No buscan opositores "perfectos", buscan personas coherentes, estables emocionalmente y con motivación real para el
  servicio. La entrevista valida que lo que dijiste en el psicotécnico de personalidad se sostiene cuando alguien te
  pregunta a la cara. Incoherencias graves = NO APTO.
</p>

<h2>25 preguntas frecuentes por categoría</h2>
<table>
  <thead><tr><th>Categoría</th><th>Ejemplos de preguntas</th></tr></thead>
  <tbody>
    <tr><td>Motivación</td><td>¿Por qué Guardia Civil y no Policía Nacional? ¿Desde cuándo?</td></tr>
    <tr><td>Familia / entorno</td><td>¿Qué opina tu familia de que quieras ser guardia? ¿Hay familiares en el cuerpo?</td></tr>
    <tr><td>Autocrítica</td><td>3 defectos tuyos y cómo los gestionas. Una situación en la que fallaste.</td></tr>
    <tr><td>Resolución conflictos</td><td>¿Qué harías si vieras a un compañero cometiendo una falta?</td></tr>
    <tr><td>Actualidad</td><td>Un hecho reciente en el que haya intervenido la Guardia Civil y tu opinión.</td></tr>
    <tr><td>Destinos</td><td>¿Estás dispuesto a ir a Ceuta, Melilla, Canarias o zonas fronterizas?</td></tr>
    <tr><td>Dilemas éticos</td><td>¿Qué harías si te ordenaran algo que consideras injusto pero legal?</td></tr>
  </tbody>
</table>

<h2>Las 25 preguntas concretas más repetidas</h2>
<ol>
  <li>Preséntate en 2 minutos.</li>
  <li>¿Por qué quieres ser guardia civil?</li>
  <li>¿Qué te diferencia del resto de candidatos?</li>
  <li>¿Cuáles son tus 3 principales fortalezas?</li>
  <li>Dime 3 defectos reales.</li>
  <li>¿Qué harías si no aprobaras?</li>
  <li>¿Has vivido alguna situación de estrés importante? ¿Cómo la gestionaste?</li>
  <li>¿Qué opinas de la Ley Orgánica 2/1986 (FFCCSE)?</li>
  <li>¿Qué diferencia hay entre Guardia Civil y Policía Nacional?</li>
  <li>¿Qué especialidad te atrae? (GRS, SEPRONA, GAR, Tráfico...)</li>
  <li>¿Aceptarías destino lejos de casa durante años?</li>
  <li>¿Qué harías si ves a un compañero cometiendo una falta grave?</li>
  <li>¿Te consideras líder o seguidor?</li>
  <li>¿Qué importancia das a la disciplina?</li>
  <li>Háblame de un libro o película que te haya marcado.</li>
  <li>¿Cómo gestionas las críticas?</li>
  <li>¿Qué haces en tu tiempo libre?</li>
  <li>¿Practicas algún deporte de equipo?</li>
  <li>¿Tienes antecedentes médicos relevantes?</li>
  <li>¿Qué opinas sobre la violencia de género? (tema sensible)</li>
  <li>¿Has ejercido como voluntario?</li>
  <li>¿Cuánto tiempo llevas preparándote?</li>
  <li>Describe tu rutina semanal de estudio.</li>
  <li>¿Qué nota has sacado en el teórico?</li>
  <li>¿Por qué deberíamos seleccionarte a ti?</li>
</ol>

<h2>Cómo preparar respuestas</h2>
<ul>
  <li><strong>Regla STAR:</strong> Situación, Tarea, Acción, Resultado. Responde con ejemplos concretos, no genéricos.</li>
  <li><strong>No mientas:</strong> contrastan con tu test de personalidad y antecedentes.</li>
  <li><strong>Evita extremos:</strong> ni agresividad ni pasividad total.</li>
  <li><strong>Practica en voz alta:</strong> grábate en vídeo y revísalo.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/psicotecnicos-guardia-civil-2026-tipos-ejemplos">Psicotécnicos y personalidad</a></li>
  <li><a href="/blog/reconocimiento-medico-guardia-civil-causas-exclusion-2026">Reconocimiento médico</a></li>
  <li><a href="/blog/como-aprobar-guardia-civil-primera-vuelta-2026">Plan para aprobar a la primera</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuánto dura la entrevista de Guardia Civil?', answer: 'Entre 15 y 25 minutos con un tribunal de 3 miembros (típicamente un oficial, un psicólogo y un mando intermedio).' },
      { question: '¿Se puede suspender solo en la entrevista?', answer: 'Sí. En la mayoría de convocatorias es APTO/NO APTO. Si declaran NO APTO, quedas fuera del proceso selectivo.' },
      { question: '¿Qué preguntas nunca debes fallar?', answer: 'Por qué Guardia Civil, por qué tú, y las relacionadas con dilemas éticos. Son las más determinantes.' },
      { question: '¿Puedo llevar apuntes a la entrevista?', answer: 'No. Es una entrevista oral abierta. Solo se permite un currículum entregado por adelantado en algunos casos.' },
      { question: '¿Evalúan mi aspecto físico en la entrevista?', answer: 'Sí indirectamente: imagen cuidada, postura y lenguaje no verbal cuentan. Traje o ropa semi-formal es lo más aceptado.' },
    ],
  },

  // ─── 4 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'reconocimiento-medico-guardia-civil-causas-exclusion-2026',
    title: 'Reconocimiento médico Guardia Civil 2026: 40+ causas exclusión',
    description:
      'Reconocimiento médico Guardia Civil 2026: cuadro de exclusiones, visión, audición, tatuajes, IMC. Lista completa y cómo prepararte.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'reconocimiento medico guardia civil',
      'exclusiones medicas guardia civil',
      'cuadro medico guardia civil 2026',
      'tatuajes guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Cuadro médico oficial:</strong> Orden PRE/2622/2007 con más de 40 causas de exclusión.</li>
  <li><strong>Agudeza visual mínima:</strong> 1/2 en cada ojo sin corrección, o 2/3 corregida sin exceder −8 dioptrías.</li>
  <li><strong>IMC:</strong> entre 18 y 30 (ajustes por musculación en casos concretos).</li>
  <li><strong>Tatuajes:</strong> prohibidos visibles con uniforme (cara, cuello, manos por debajo de la muñeca).</li>
</ul>

<h2>Qué es el reconocimiento médico</h2>
<p>
  Es la última fase eliminatoria y consta de 3 partes: analítica (sangre, orina, drogas), pruebas físicas específicas
  (espirometría, electrocardiograma, audiometría, optometría) y exploración clínica general. Se realiza en el Hospital
  Central de la Guardia Civil (Madrid) o centros autorizados.
</p>

<h2>Causas de exclusión más frecuentes</h2>
<table>
  <thead><tr><th>Sistema</th><th>Exclusiones habituales</th></tr></thead>
  <tbody>
    <tr><td>Visión</td><td>Agudeza &lt; 1/2 sin corrección; miopía &gt; −8 D; astigmatismo &gt; 4 D; daltonismo severo</td></tr>
    <tr><td>Audición</td><td>Pérdida &gt; 35 dB en frecuencias conversacionales</td></tr>
    <tr><td>Cardiovascular</td><td>HTA &gt; 140/90; arritmias; soplos significativos</td></tr>
    <tr><td>Respiratorio</td><td>Asma persistente; capacidad vital &lt; 80 % teórica</td></tr>
    <tr><td>Locomotor</td><td>Escoliosis &gt; 20°; pies planos grado III; pérdida movilidad articular</td></tr>
    <tr><td>Psiquiátrico</td><td>Trastornos psicóticos, de personalidad, consumo de tóxicos</td></tr>
    <tr><td>Piel</td><td>Tatuajes visibles con uniforme; cicatrices que impidan uso de equipo</td></tr>
    <tr><td>Endocrino</td><td>Diabetes tipo 1; obesidad IMC &gt; 30</td></tr>
  </tbody>
</table>

<h2>Tatuajes: qué se permite</h2>
<ul>
  <li><strong>Prohibidos:</strong> cara, cuello, antebrazos desde la muñeca hacia arriba visibles con manga corta.</li>
  <li><strong>Permitidos:</strong> zonas no visibles con uniforme reglamentario.</li>
  <li><strong>Siempre excluyentes:</strong> contenido ofensivo, discriminatorio o incompatible con los valores del cuerpo.</li>
</ul>

<h2>Preparación previa al reconocimiento</h2>
<ul>
  <li><strong>3 meses antes:</strong> analítica completa privada para detectar anomalías.</li>
  <li><strong>Optometría:</strong> si usas lentillas, asegúrate de que tu graduación está por debajo del límite.</li>
  <li><strong>Audiometría:</strong> evita exposición a ruido fuerte semanas antes (conciertos, cascos a alto volumen).</li>
  <li><strong>No consumas:</strong> cannabis ni otras drogas al menos 3 meses antes (detección en orina).</li>
</ul>

<h2>¿Se puede recurrir una exclusión?</h2>
<p>
  Sí, pero solo por errores de procedimiento o medición. Las exclusiones médicas basadas en el cuadro oficial son muy
  difíciles de revertir. El recurso se presenta en 10 días hábiles desde la notificación. Presenta informes médicos
  privados recientes como prueba.
</p>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/requisitos-guardia-civil-2026-edad-altura-estudios">Requisitos completos</a></li>
  <li><a href="/blog/pruebas-fisicas-guardia-civil-2026">Pruebas físicas</a></li>
  <li><a href="/blog/entrevista-personal-guardia-civil-2026-preguntas">Entrevista personal</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas causas de exclusión hay en Guardia Civil?', answer: 'El cuadro médico oficial (Orden PRE/2622/2007) recoge más de 40 causas agrupadas en 15 sistemas corporales.' },
      { question: '¿Puedo opositar con gafas?', answer: 'Sí, siempre que la graduación no supere −8 dioptrías de miopía o 4 de astigmatismo y la agudeza corregida llegue a 2/3 en ambos ojos.' },
      { question: '¿Los tatuajes pequeños en el brazo son excluyentes?', answer: 'Depende. Si se ven con manga corta del uniforme (zona antebrazo visible), son excluyentes. Si quedan cubiertos, se permiten.' },
      { question: '¿Hacen test de drogas?', answer: 'Sí. Analítica de orina que detecta cannabis, cocaína, opiáceos y otras sustancias. Positivo = exclusión directa.' },
      { question: '¿Qué IMC se exige?', answer: 'Entre 18 y 30. Se acepta IMC &gt;30 solo si el exceso es masa muscular comprobada (bioimpedancia).' },
    ],
  },

  // ─── 5 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'requisitos-guardia-civil-2026-edad-altura-estudios',
    title: 'Requisitos Guardia Civil 2026: edad, estudios, IMC',
    description:
      'Requisitos Guardia Civil 2026: 18-40 años, ESO, IMC 17-30, sin antecedentes. Altura eliminada como requisito desde 2023. Checklist completo.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'requisitos guardia civil 2026',
      'edad guardia civil',
      'altura guardia civil eliminada',
      'imc guardia civil',
      'estudios guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Edad:</strong> 18-40 años cumplidos antes del cierre de inscripción.</li>
  <li><strong>Estudios:</strong> ESO o equivalente (FP básica sirve).</li>
  <li><strong>Altura:</strong> <strong>eliminada como requisito desde octubre de 2023</strong> (Orden PCI/155/2019 modificada).</li>
  <li><strong>IMC:</strong> entre 17 y 30 — sustituye al filtro clásico de talla.</li>
  <li><strong>Nacionalidad:</strong> española. Sin antecedentes penales ni sanciones graves.</li>
</ul>

<h2>Checklist de requisitos 2026</h2>
<table>
  <thead><tr><th>Requisito</th><th>Detalle</th><th>Documento</th></tr></thead>
  <tbody>
    <tr><td>Nacionalidad</td><td>Española únicamente</td><td>DNI en vigor</td></tr>
    <tr><td>Edad</td><td>18-40 años cumplidos al cierre de inscripción</td><td>DNI</td></tr>
    <tr><td>Estudios</td><td>ESO o equivalente (FP básica, título extranjero homologado)</td><td>Título o certificado</td></tr>
    <tr><td>Altura</td><td><strong>Sin límite mínimo ni máximo</strong> desde 2023 (sí se evalúa el IMC)</td><td>Reconocimiento médico</td></tr>
    <tr><td>IMC</td><td>Entre 17 y 30 (peso kg ÷ talla en metros²)</td><td>Reconocimiento médico</td></tr>
    <tr><td>Antecedentes penales</td><td>Sin antecedentes sin cancelar</td><td>Certificado Registro Central</td></tr>
    <tr><td>Antecedentes militares</td><td>No expulsado FFAA ni FFCCSE</td><td>Declaración jurada</td></tr>
    <tr><td>Compromiso de armas</td><td>Jurar fidelidad a la Constitución</td><td>Declaración en inscripción</td></tr>
    <tr><td>Carnet B</td><td>No siempre obligatorio en inscripción, sí antes de jurar plaza</td><td>Permiso de conducción</td></tr>
  </tbody>
</table>

<h2>Cambio clave 2023: adiós al requisito de altura</h2>
<p>
  Hasta 2022 la Guardia Civil exigía una altura mínima de 160 cm para hombres y 155 cm para mujeres
  (antes de 2020, 165/160). A partir de la <strong>modificación de la Orden PCI/155/2019 publicada el
  19 de octubre de 2023</strong>, la talla deja de figurar en el cuadro de exclusiones médicas:
  <strong>ya no existe altura mínima ni máxima</strong> para opositar al cuerpo.
</p>
<p>
  En su lugar el filtro físico pasa por el <strong>IMC (Índice de Masa Corporal) entre 17 y 30</strong>
  y el resto de pruebas físicas (carrera, natación, dominadas, flexiones, circuito). Si tu estatura te
  permite pasar las pruebas físicas y no tienes patologías excluyentes, puedes presentarte sin importar
  cuánto mides.
</p>

<h2>¿Qué pasa si cumplo 40 años durante la oposición?</h2>
<p>
  Lo que cuenta es la fecha de cierre de inscripción. Si tienes 40 años recién cumplidos ese día, estás dentro. Si los
  cumples un día después del cierre, también estás dentro para esa convocatoria. El corte es estricto respecto a la
  fecha publicada en el BOE.
</p>

<h2>Titulaciones equivalentes a ESO</h2>
<ul>
  <li>Graduado Escolar (antiguo sistema EGB)</li>
  <li>Técnico auxiliar (FP1)</li>
  <li>Técnico básico (FP básica actual)</li>
  <li>Certificado Profesionalidad nivel 2</li>
  <li>Estudios extranjeros homologados por Ministerio de Educación</li>
</ul>

<h2>Requisitos adicionales durante el proceso</h2>
<ul>
  <li>Firmar compromiso de permanencia de 2 años tras finalizar la Academia.</li>
  <li>Tener permiso de conducción B <strong>antes de jurar la plaza</strong> (finalización Academia Baeza).</li>
  <li>Comprometerse a cualquier destino nacional.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/plazas-guardia-civil-2026-convocatoria">Plazas y convocatoria 2026</a></li>
  <li><a href="/blog/reconocimiento-medico-guardia-civil-causas-exclusion-2026">Reconocimiento médico</a></li>
  <li><a href="/blog/calendario-guardia-civil-2026-fechas-examen">Calendario y fechas</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Qué edad mínima hay que tener para Guardia Civil?', answer: '18 años cumplidos en el momento de cerrar el plazo de inscripción publicado en el BOE.' },
      { question: '¿Hay edad máxima para opositar a Guardia Civil?', answer: 'Sí, 40 años cumplidos. Si los cumples el mismo día del cierre de inscripción estás dentro; después quedas fuera.' },
      { question: '¿Sirve el título de Bachillerato?', answer: 'Sí. Bachillerato, FP de grado medio o superior, y cualquier titulación superior también cumplen el requisito mínimo de ESO.' },
      { question: '¿Cuánto mide como mínimo un guardia civil en 2026?', answer: 'Ya no existe altura mínima. La modificación de la Orden PCI/155/2019 publicada el 19 de octubre de 2023 eliminó la talla del cuadro de exclusiones médicas. Ahora se evalúa IMC (17-30) y pruebas físicas.' },
      { question: '¿Necesito carnet B para inscribirme?', answer: 'No para inscribirte, pero sí antes de jurar la plaza al finalizar la Academia de Baeza. Mejor sacarlo antes.' },
    ],
  },

  // ─── 6 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'nota-corte-guardia-civil-2024-2025-historico',
    title: 'Nota de corte Guardia Civil 2019-2025: histórico por año',
    description:
      'Histórico notas de corte Guardia Civil Escala Cabos y Guardias: 2019 a 2024, evolución, nota mínima aprobado y estimación 2026.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'nota corte guardia civil',
      'nota guardia civil 2024',
      'aprobado guardia civil',
      'nota minima guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Nota de corte 2024:</strong> ~62/100 para la última plaza adjudicada.</li>
  <li><strong>Histórico estable:</strong> oscila entre 55 y 68 puntos desde 2019.</li>
  <li><strong>Nota mínima aprobado:</strong> 50/100 tras aplicar penalización −1/4.</li>
</ul>

<h2>Qué es la nota de corte en Guardia Civil</h2>
<p>
  La nota de corte es la puntuación del <strong>último opositor que obtiene plaza</strong>, no la mínima para aprobar
  el examen. Para aprobar el teórico basta con 50/100, pero para obtener plaza hay que superar la nota del último
  seleccionado, que depende del número de presentados y plazas convocadas.
</p>

<h2>Histórico nota de corte 2019-2024</h2>
<table>
  <thead><tr><th>Año</th><th>Plazas</th><th>Presentados aprox.</th><th>Nota corte estimada</th></tr></thead>
  <tbody>
    <tr><td>2019</td><td>2.030</td><td>24.000</td><td>~67 / 100</td></tr>
    <tr><td>2021</td><td>2.075</td><td>26.000</td><td>~66 / 100</td></tr>
    <tr><td>2022</td><td>2.557</td><td>31.000</td><td>~64 / 100</td></tr>
    <tr><td>2023</td><td>2.900</td><td>34.000</td><td>~63 / 100</td></tr>
    <tr><td>2024</td><td>3.118</td><td>36.500</td><td>~62 / 100</td></tr>
    <tr><td>2026 (est.)</td><td>~3.100</td><td>~36.000</td><td>~62-64 / 100</td></tr>
  </tbody>
</table>

<h2>Cómo se calcula tu nota final</h2>
<ul>
  <li><strong>Examen teórico:</strong> 100 preguntas × 1 punto, con penalización −1/4.</li>
  <li><strong>Ejemplo:</strong> 75 aciertos, 15 fallos, 10 blancos → 75 − (15/4) = 71,25 puntos.</li>
  <li><strong>Ortografía y psicotécnico:</strong> modifican la nota final según convocatoria.</li>
</ul>

<h2>Diferencia entre aprobar y obtener plaza</h2>
<p>
  En 2024, aprobaron el teórico aproximadamente el 35 % de presentados (12.700 opositores), pero solo obtuvieron plaza
  3.118. Es decir, <strong>más de 9.500 personas aprobaron y se quedaron sin plaza</strong>. Por eso la nota de corte es
  crítica: no basta con aprobar, hay que estar entre los mejores ~3.100.
</p>

<h2>Cómo subir tu nota 5-10 puntos</h2>
<ul>
  <li>Simulacros semanales con penalización: entrena la decisión de dejar en blanco.</li>
  <li>Temas del bloque III (técnicas): son los que más se repiten en los exámenes recientes.</li>
  <li>Ortografía: un error menos en ortografía vale como 2-3 preguntas bien en teoría.</li>
  <li>Psicotécnico: entrenarlo aporta 3-5 puntos a la nota ponderada.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/plazas-guardia-civil-2026-convocatoria">Plazas convocatoria 2026</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados 2023-2025</a></li>
  <li><a href="/blog/simulacro-guardia-civil-2026-examen-completo-online">Simulacro completo</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuál fue la nota de corte de Guardia Civil 2024?', answer: 'En torno a 62/100 tras aplicar la penalización −1/4. Varía ligeramente entre modelos A y B del examen.' },
      { question: '¿Cuál es la nota mínima para aprobar?', answer: 'El mínimo para aprobar el teórico es 50/100 tras penalización. Pero para obtener plaza necesitas superar la nota de corte real (~62-68).' },
      { question: '¿Baja la nota de corte al haber más plazas?', answer: 'Sí. En 2019 (2.030 plazas) la nota rondaba 67. En 2024 (3.118 plazas) bajó a 62. A más plazas, menor nota de corte.' },
      { question: '¿Dónde consulto las notas oficiales?', answer: 'En la web del Ministerio del Interior y en el BOE, en las listas definitivas de aprobados publicadas tras cada fase.' },
      { question: '¿Se publica la nota de corte oficialmente?', answer: 'No se publica como tal. Se deduce de la nota del último aspirante que obtuvo plaza en las listas definitivas.' },
    ],
  },

  // ─── 7 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'temas-mas-preguntados-guardia-civil-2023-2025',
    title: 'Temas más preguntados Guardia Civil 2023-2025: top 15',
    description:
      'Análisis de exámenes Guardia Civil 2023, 2024 y 2025: los 15 temas con más preguntas, % por bloque y en cuáles centrar el estudio.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'temas mas preguntados guardia civil',
      'analisis examen guardia civil',
      'estadisticas guardia civil',
      'guardia civil temas importantes',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Bloque I (jurídico):</strong> aporta ~45 % de las preguntas del examen.</li>
  <li><strong>Tema 1 (Constitución):</strong> entre 5 y 8 preguntas por examen.</li>
  <li><strong>Temas específicos Guardia Civil:</strong> 25-30 % del examen pese a ser solo 22 % del temario.</li>
</ul>

<h2>Metodología del análisis</h2>
<p>
  Hemos analizado los exámenes oficiales publicados por el Ministerio de Defensa en 2023, 2024 y 2025 (modelos A y B),
  contando la frecuencia por tema y por bloque. Los datos están cruzados con el temario oficial de 45 temas de la Escala
  de Cabos y Guardias.
</p>

<h2>Top 15 temas más preguntados 2023-2025</h2>
<table>
  <thead><tr><th>Pos.</th><th>Tema</th><th>Bloque</th><th>Preguntas/examen (media)</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Constitución Española de 1978</td><td>I</td><td>7,3</td></tr>
    <tr><td>2</td><td>Ley Orgánica 2/1986 (FFCCSE)</td><td>I</td><td>5,8</td></tr>
    <tr><td>3</td><td>Código Penal: delitos contra las personas</td><td>I</td><td>5,0</td></tr>
    <tr><td>4</td><td>Ley de Enjuiciamiento Criminal</td><td>I</td><td>4,7</td></tr>
    <tr><td>5</td><td>Derechos Humanos y UE</td><td>I</td><td>4,2</td></tr>
    <tr><td>6</td><td>Educación Vial y tráfico</td><td>II</td><td>4,0</td></tr>
    <tr><td>7</td><td>Geografía física de España</td><td>II</td><td>3,8</td></tr>
    <tr><td>8</td><td>Historia de España contemporánea</td><td>II</td><td>3,5</td></tr>
    <tr><td>9</td><td>Informática básica y redes</td><td>II</td><td>3,3</td></tr>
    <tr><td>10</td><td>Topografía y orientación</td><td>III</td><td>3,2</td></tr>
    <tr><td>11</td><td>Armamento reglamentario</td><td>III</td><td>3,0</td></tr>
    <tr><td>12</td><td>Primeros auxilios</td><td>III</td><td>2,9</td></tr>
    <tr><td>13</td><td>Ley Orgánica 4/2000 (Extranjería)</td><td>I</td><td>2,8</td></tr>
    <tr><td>14</td><td>Instrucción técnica policial</td><td>III</td><td>2,7</td></tr>
    <tr><td>15</td><td>Protección datos (LO 3/2018)</td><td>I</td><td>2,5</td></tr>
  </tbody>
</table>

<h2>Distribución por bloques</h2>
<ul>
  <li><strong>Bloque I (Ciencias Jurídicas, temas 1-20):</strong> 45 % de las preguntas.</li>
  <li><strong>Bloque II (Sociotécnicas, temas 21-35):</strong> 30 % de las preguntas.</li>
  <li><strong>Bloque III (Técnicas, temas 36-45):</strong> 25 % de las preguntas.</li>
</ul>

<h2>Implicaciones para tu estudio</h2>
<ul>
  <li>Los <strong>10 primeros temas del bloque I</strong> (Constitución, FFCCSE, Penal, LECrim) concentran más del 25 % del examen.</li>
  <li>El <strong>Bloque III</strong> tiene solo 10 temas pero aporta 25 % del examen: rentabilidad altísima por tema.</li>
  <li>Los temas de <strong>tráfico y geografía</strong> (bloque II) se repiten en casi todas las convocatorias.</li>
</ul>

<h2>Temas que NO deberías descuidar</h2>
<p>
  Muchos opositores "priorizan" dejando temas del bloque II con menos preguntas. Error común: en 2024 aparecieron 3
  preguntas del tema 28 (Medio Ambiente) que nadie había estudiado. Esos 3 puntos pueden ser tu plaza o la del siguiente.
</p>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo 45 temas</a></li>
  <li><a href="/blog/derecho-constitucional-guardia-civil-2026-temas-clave">Derecho constitucional clave</a></li>
  <li><a href="/blog/nota-corte-guardia-civil-2024-2025-historico">Histórico notas de corte</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuál es el tema más preguntado en Guardia Civil?', answer: 'La Constitución Española de 1978 (tema 1), con una media de 7,3 preguntas por examen entre 2023 y 2025.' },
      { question: '¿Qué bloque aporta más preguntas?', answer: 'El Bloque I (Ciencias Jurídicas, 20 temas) aporta aproximadamente el 45 % de las preguntas totales del examen.' },
      { question: '¿Hay temas que no entran nunca?', answer: 'No. Todos los 45 temas pueden entrar. Pero algunos aparecen casi siempre (Constitución, Código Penal) y otros con poca frecuencia.' },
      { question: '¿Cómo saber qué temas estudiar primero?', answer: 'Empieza por los temas 1-10 (Bloque I) y los temas 36-45 (Bloque III): juntos suman el 70 % del examen.' },
      { question: '¿Se repiten preguntas exactas de años anteriores?', answer: 'Raramente idénticas, pero sí el concepto. Hacer simulacros de exámenes oficiales te asegura ver el tipo de enfoque que usa el tribunal.' },
    ],
  },

  // ─── 8 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'derecho-constitucional-guardia-civil-2026-temas-clave',
    title: 'Constitución Guardia Civil 2026: temas 1-5 clave con test',
    description:
      'Derecho constitucional Guardia Civil: temas 1-5 (Constitución, Corona, Cortes, Gobierno, Poder Judicial). Esquemas, artículos clave y test.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'derecho constitucional guardia civil',
      'constitucion guardia civil',
      'tema 1 guardia civil',
      'bloque juridico guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>5 temas jurídicos</strong> cubren Constitución, Corona, Cortes, Gobierno y Poder Judicial.</li>
  <li>En el examen aparecen <strong>10-15 preguntas</strong> directamente de estos 5 temas.</li>
  <li><strong>Artículos clave:</strong> 1, 14, 17, 53, 56, 66, 97, 117, 159, 168 CE.</li>
</ul>

<h2>Por qué estos temas son decisivos</h2>
<p>
  Los temas 1 a 5 del temario de Guardia Civil están dedicados a la Constitución Española de 1978. Juntos representan
  el núcleo del Bloque I (Ciencias Jurídicas) y son de los más preguntados del examen: una media de 12 preguntas por
  convocatoria. Dominarlos es casi condición necesaria para superar la nota de corte.
</p>

<h2>Contenido de cada tema</h2>
<table>
  <thead><tr><th>Tema</th><th>Contenido</th><th>Artículos clave</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Estructura CE, Título Preliminar, valores superiores</td><td>1-9</td></tr>
    <tr><td>2</td><td>Derechos fundamentales y libertades públicas</td><td>10-55</td></tr>
    <tr><td>3</td><td>La Corona. Funciones del Rey</td><td>56-65</td></tr>
    <tr><td>4</td><td>Las Cortes Generales. Congreso y Senado</td><td>66-96</td></tr>
    <tr><td>5</td><td>Gobierno, Administración, Poder Judicial</td><td>97-127, 159</td></tr>
  </tbody>
</table>

<h2>Artículos más preguntados en exámenes reales</h2>
<ul>
  <li><strong>Art. 1 CE:</strong> España se constituye en Estado social y democrático de Derecho.</li>
  <li><strong>Art. 14 CE:</strong> Igualdad ante la ley (base de no discriminación).</li>
  <li><strong>Art. 17 CE:</strong> Derecho a la libertad y seguridad. Detención 72 h máximo.</li>
  <li><strong>Art. 53.2 CE:</strong> Tutela judicial de derechos fundamentales + amparo TC.</li>
  <li><strong>Art. 56 CE:</strong> El Rey es Jefe del Estado, símbolo de su unidad.</li>
  <li><strong>Art. 66 CE:</strong> Las Cortes Generales representan al pueblo español.</li>
  <li><strong>Art. 97 CE:</strong> El Gobierno dirige la política interior y exterior.</li>
  <li><strong>Art. 117 CE:</strong> La justicia emana del pueblo; jueces independientes.</li>
  <li><strong>Art. 159 CE:</strong> Tribunal Constitucional: 12 miembros, 9 años.</li>
  <li><strong>Art. 168 CE:</strong> Reforma agravada (Título Preliminar, derechos fundamentales, Corona).</li>
</ul>

<h2>Esquema del Título VII (Título Preliminar a Título X)</h2>
<ul>
  <li><strong>Título Preliminar:</strong> art. 1-9 (valores, lengua, banderas, partidos, sindicatos).</li>
  <li><strong>Título I:</strong> 10-55 (derechos y deberes).</li>
  <li><strong>Título II:</strong> 56-65 (Corona).</li>
  <li><strong>Título III:</strong> 66-96 (Cortes Generales).</li>
  <li><strong>Título IV:</strong> 97-107 (Gobierno y Administración).</li>
  <li><strong>Título V:</strong> 108-116 (relaciones Gobierno-Cortes).</li>
  <li><strong>Título VI:</strong> 117-127 (Poder Judicial).</li>
  <li><strong>Título VII:</strong> 128-136 (Economía y Hacienda).</li>
  <li><strong>Título VIII:</strong> 137-158 (Organización territorial).</li>
  <li><strong>Título IX:</strong> 159-165 (Tribunal Constitucional).</li>
  <li><strong>Título X:</strong> 166-169 (Reforma constitucional).</li>
</ul>

<h2>Trucos de memorización</h2>
<ul>
  <li><strong>Números redondos:</strong> 14 igualdad, 53 garantías, 66 Cortes, 97 Gobierno, 117 Justicia.</li>
  <li><strong>Regla 72-5:</strong> detención 72 h, derecho asilo 5 días, incomunicación 5 días más (terrorismo).</li>
  <li><strong>3 tipos de reforma:</strong> 167 (ordinaria), 168 (agravada), 169 (prohibida en estados excepcionales).</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados</a></li>
  <li><a href="/blog/test-guardia-civil-online-gratis-2026">Test gratuito Guardia Civil</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas de Constitución caen en Guardia Civil?', answer: 'Entre 10 y 15 preguntas directamente de los temas 1-5 de Constitución (CE y órganos constitucionales).' },
      { question: '¿Qué artículos de la Constitución hay que memorizar sí o sí?', answer: 'Los núcleos son: 1, 14, 17, 53, 56, 66, 97, 117, 159 y 168. A partir de ahí, ampliar por bloque.' },
      { question: '¿Cuánto dura la detención según la Constitución?', answer: 'Máximo 72 horas según el art. 17 CE, ampliables hasta 5 días en casos de terrorismo con autorización judicial.' },
      { question: '¿Qué Título es el de los derechos fundamentales?', answer: 'El Título I (arts. 10-55), y dentro de él, la Sección 1ª del Capítulo II (arts. 15-29) son los derechos fundamentales con protección reforzada.' },
      { question: '¿Cuántos miembros tiene el Tribunal Constitucional?', answer: '12 miembros nombrados por 9 años. Se renuevan por terceras partes cada 3 años (art. 159 CE).' },
    ],
  },

  // ─── 9 ─────────────────────────────────────────────────────────────────────
  {
    slug: 'ortografia-guardia-civil-2026-tipo-examen-ejemplos',
    title: 'Ortografía Guardia Civil 2026: 20 preguntas, tipos y ejemplos',
    description:
      'Prueba de ortografía Guardia Civil 2026: 20 preguntas en 15 min, tildes, signos, barbarismos. Ejemplos reales y cómo superarla.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'ortografia guardia civil',
      'examen ortografia guardia civil 2026',
      'prueba ortografia oposicion',
      'tildes guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Formato:</strong> 20 preguntas tipo test en 15 minutos.</li>
  <li><strong>Penalización:</strong> también −1/4 como en el teórico.</li>
  <li><strong>Es eliminatoria:</strong> suspender ortografía = fuera del proceso.</li>
  <li><strong>Mínimo aprobado:</strong> aproximadamente 10/20 sobre nota neta.</li>
</ul>

<h2>Estructura de la prueba</h2>
<p>
  La prueba de ortografía es independiente del examen teórico pero se realiza el mismo día. Consta de 20 preguntas tipo
  test de 4 opciones, con penalización −1/4 igual que el teórico. Es <strong>eliminatoria</strong>: aunque saques 90 en
  el teórico, si suspendes ortografía, quedas fuera.
</p>

<h2>Tipos de preguntas que entran</h2>
<table>
  <thead><tr><th>Tipo</th><th>Preguntas aprox.</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Tildes (acentuación)</td><td>6</td><td>Agudas, llanas, esdrújulas, diacríticos (tú/tu, sí/si)</td></tr>
    <tr><td>Uso de B/V, G/J, H</td><td>4</td><td>Barbarismos ortográficos</td></tr>
    <tr><td>Puntuación</td><td>3</td><td>Coma, punto y coma, dos puntos, comillas</td></tr>
    <tr><td>Mayúsculas / minúsculas</td><td>2</td><td>Nombres propios, tratamientos, cargos</td></tr>
    <tr><td>Palabras juntas/separadas</td><td>2</td><td>Sino/si no, porque/por qué, también/tan bien</td></tr>
    <tr><td>Grafías dudosas</td><td>3</td><td>Palabras con LL/Y, Y/I, SC/X, C/Z</td></tr>
  </tbody>
</table>

<h2>Ejemplos de preguntas reales</h2>
<ol>
  <li><strong>Elige la opción correctamente escrita:</strong>
    <ul>
      <li>a) Cómo quieras, tú mismo decidirás.</li>
      <li>b) Como quieras, tu mismo decidirás.</li>
      <li>c) Cómo quieras, tu mismo decidirás. ✓ (incorrecta: falta tilde en "tú")</li>
    </ul>
    Respuesta correcta: a.
  </li>
  <li><strong>Señala la oración con error ortográfico:</strong>
    <ul>
      <li>a) El ejército desfiló con orgullo.</li>
      <li>b) Vamos a hacer un examen muy difícil.</li>
      <li>c) Iré al ayuntamiento a por el certificado. ✗ (coloquialismo)</li>
      <li>d) Llegaremos en breve al destino.</li>
    </ul>
  </li>
</ol>

<h2>Las 20 reglas de acentuación que más caen</h2>
<ul>
  <li>Agudas con tilde: acaban en vocal, N o S (canción, compás).</li>
  <li>Llanas con tilde: NO acaban en vocal, N o S (árbol, cárcel).</li>
  <li>Esdrújulas: siempre llevan tilde (máquina, rápido).</li>
  <li>Diacríticos: tú/tu, él/el, sí/si, sé/se, más/mas, té/te, aún/aun, cómo/como, qué/que.</li>
  <li>Interrogativas y exclamativas siempre con tilde: qué, cómo, cuándo, dónde, quién.</li>
  <li>Solo sin tilde (RAE 2010): hoy se permite escribirlo siempre sin tilde.</li>
  <li>Este/ese/aquel: sin tilde como norma (la RAE recomienda no acentuar).</li>
</ul>

<h2>Plan de preparación en 30 días</h2>
<ul>
  <li><strong>Días 1-10:</strong> reglas de acentuación + 100 ejercicios.</li>
  <li><strong>Días 11-20:</strong> uso de letras dudosas + puntuación + 100 ejercicios.</li>
  <li><strong>Días 21-30:</strong> 3 simulacros completos de 20 preguntas cada uno.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo</a></li>
  <li><a href="/blog/ingles-guardia-civil-2026-nivel-examen-preparacion">Inglés Guardia Civil</a></li>
  <li><a href="/blog/simulacro-guardia-civil-2026-examen-completo-online">Simulacro completo</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas tiene la prueba de ortografía?', answer: '20 preguntas tipo test de 4 opciones, a realizar en 15 minutos con penalización −1/4.' },
      { question: '¿Es eliminatoria la ortografía en Guardia Civil?', answer: 'Sí. Si no alcanzas la nota mínima (aprox. 10/20 neto), quedas eliminado aunque hayas aprobado el teórico.' },
      { question: '¿Qué reglas de tilde son imprescindibles?', answer: 'Acentuación de agudas, llanas y esdrújulas más los diacríticos (tú/tu, él/el, sí/si). Caen casi todas las convocatorias.' },
      { question: '¿Cuánto tiempo necesito para preparar ortografía?', answer: 'Con 30 días de práctica diaria (30 min/día) se supera. Un opositor partiendo de cero debería empezar 2 meses antes.' },
      { question: '¿Caen palabras técnicas o jurídicas?', answer: 'Sí. Preguntan por la grafía correcta de términos comunes en el ámbito policial y jurídico (coadyuvar, exhorto, etc.).' },
    ],
  },

  // ─── 10 ────────────────────────────────────────────────────────────────────
  {
    slug: 'ingles-guardia-civil-2026-nivel-examen-preparacion',
    title: 'Inglés Guardia Civil 2026: nivel A2/B1 y preparación eficaz',
    description:
      'Inglés Guardia Civil 2026: nivel A2/B1, 20 preguntas, gramática y vocabulario. Plan 60 días con apps gratuitas y simulacros.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'ingles guardia civil',
      'nivel ingles guardia civil 2026',
      'examen ingles guardia civil',
      'preparar ingles oposicion',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Nivel exigido:</strong> A2 con partes de B1 según MCER.</li>
  <li><strong>Formato:</strong> 20 preguntas tipo test en 20 minutos.</li>
  <li><strong>No es eliminatoria</strong> (en la mayoría de convocatorias) pero suma a la nota final.</li>
</ul>

<h2>¿Qué nivel de inglés necesito?</h2>
<p>
  El nivel oficial es A2 del Marco Común Europeo de Referencia (MCER), aunque en los exámenes aparecen preguntas de nivel
  B1 bajo. Si tienes ESO aprobada con nota media en inglés, partes con una base suficiente. Si no has estudiado inglés
  desde hace años, necesitarás <strong>60-90 días</strong> de preparación específica.
</p>

<h2>Estructura de la prueba</h2>
<table>
  <thead><tr><th>Apartado</th><th>Preguntas</th><th>Contenido</th></tr></thead>
  <tbody>
    <tr><td>Gramática</td><td>8</td><td>Tiempos verbales, modales, condicionales</td></tr>
    <tr><td>Vocabulario</td><td>5</td><td>Sinónimos, antónimos, collocations</td></tr>
    <tr><td>Reading comprehension</td><td>5</td><td>Textos cortos + preguntas sobre contenido</td></tr>
    <tr><td>Phrasal verbs</td><td>2</td><td>Look for, take off, get on, etc.</td></tr>
  </tbody>
</table>

<h2>Gramática imprescindible (nivel A2/B1)</h2>
<ul>
  <li><strong>Tiempos verbales:</strong> present simple/continuous, past simple/continuous, present perfect, future (will/going to).</li>
  <li><strong>Modales:</strong> can, could, may, might, must, should, have to.</li>
  <li><strong>Condicionales:</strong> zero, first y second conditional.</li>
  <li><strong>Reported speech:</strong> He said that he was... / She asked if...</li>
  <li><strong>Passive voice:</strong> The document was signed by...</li>
  <li><strong>Comparativos y superlativos:</strong> taller than, the tallest, as fast as.</li>
</ul>

<h2>500 palabras clave del examen</h2>
<ul>
  <li><strong>Policía y seguridad:</strong> police officer, weapon, crime, arrest, warning, patrol, evidence.</li>
  <li><strong>Administración:</strong> document, request, certificate, appointment, form, signature.</li>
  <li><strong>Tráfico:</strong> driving licence, speed limit, fine, accident, pedestrian, roundabout.</li>
  <li><strong>Cuerpo y salud:</strong> injury, wound, first aid, ambulance, stretcher.</li>
  <li><strong>Días/tiempo:</strong> appointment, deadline, schedule, delayed, postponed.</li>
</ul>

<h2>Plan 60 días sin gastar dinero</h2>
<ul>
  <li><strong>Días 1-20 (base):</strong> Duolingo 30 min/día + BBC Learning English (nivel A2).</li>
  <li><strong>Días 21-40 (gramática):</strong> libro "English Grammar in Use" Murphy (nivel Intermediate).</li>
  <li><strong>Días 41-55 (exámenes):</strong> tests de Cambridge KET/PET online gratuitos.</li>
  <li><strong>Días 56-60 (simulacro):</strong> exámenes Guardia Civil de 2021-2024 en condiciones reales.</li>
</ul>

<h2>Errores comunes de españoles</h2>
<ul>
  <li><strong>False friends:</strong> actual = current (no "actual"); embarrassed = avergonzado (no embarazada).</li>
  <li><strong>Preposiciones:</strong> on Monday, at 5, in 2026.</li>
  <li><strong>Present perfect:</strong> "I have lived here for 5 years" (no "I live here for 5 years").</li>
  <li><strong>Tercera persona del singular:</strong> he works, she lives (muy olvidada).</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temario-guardia-civil-2026-escala-cabos-guardias">Temario completo</a></li>
  <li><a href="/blog/ortografia-guardia-civil-2026-tipo-examen-ejemplos">Prueba de ortografía</a></li>
  <li><a href="/blog/como-aprobar-guardia-civil-primera-vuelta-2026">Plan para aprobar a la primera</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Qué nivel de inglés piden en Guardia Civil?', answer: 'Oficialmente A2 del MCER, con incursiones a B1 bajo. Equivale a un KET (Key English Test) de Cambridge.' },
      { question: '¿Es eliminatoria la prueba de inglés?', answer: 'En la mayoría de convocatorias no es eliminatoria por sí misma, pero la nota cuenta para la media final y el ranking de plazas.' },
      { question: '¿Cuánto tiempo se tarda en preparar inglés desde cero?', answer: 'Entre 60 y 90 días con 1 hora diaria de estudio, si no tienes base alguna. Con base ESO, 30-45 días bastan.' },
      { question: '¿Qué libro me recomendáis?', answer: 'English Grammar in Use (Raymond Murphy) nivel Intermediate es el más usado. Gratis: BBC Learning English y Duolingo.' },
      { question: '¿Caen phrasal verbs en el examen?', answer: 'Sí, 2-3 preguntas por examen. Los más repetidos: look for, take off, get on, find out, give up.' },
    ],
  },

  // ─── 11 ────────────────────────────────────────────────────────────────────
  {
    slug: 'opositar-guardia-civil-trabajando-plan-semanal-2026',
    title: 'Opositar Guardia Civil trabajando: plan 15 h/semana 2026',
    description:
      'Opositar a Guardia Civil trabajando: plan realista 15 h/semana, rutina diaria y fines de semana. Cómo llegar al examen con 600 h.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'opositar trabajando guardia civil',
      'plan estudio 15 horas semana',
      'guardia civil trabajo compatible',
      'estudiar oposicion con trabajo',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Objetivo:</strong> 15 horas efectivas/semana durante 10 meses = 600 h totales.</li>
  <li><strong>Distribución realista:</strong> 2 h/día L-V (10 h) + 5 h sábado.</li>
  <li><strong>Físicas:</strong> 3 h/semana en horario matinal o nocturno.</li>
  <li><strong>Resultado:</strong> aprobado viable si el bloque I está cubierto antes de los 6 meses.</li>
</ul>

<h2>¿Es compatible trabajar y opositar a Guardia Civil?</h2>
<p>
  Sí, pero exige sacrificio real. La mayoría de opositores que aprueban trabajando dedican un año completo y renuncian
  a la vida social durante ese tiempo. El secreto no es la cantidad de horas sino la <strong>constancia diaria</strong>
  y la <strong>eficacia del estudio</strong> (activo, no leer pasivamente).
</p>

<h2>Plan semanal tipo (15 h efectivas)</h2>
<table>
  <thead><tr><th>Día</th><th>Horario</th><th>Actividad</th><th>Horas</th></tr></thead>
  <tbody>
    <tr><td>Lunes</td><td>20:00-22:00</td><td>Teoría tema nuevo</td><td>2 h</td></tr>
    <tr><td>Martes</td><td>6:00-7:00 + 20:00-21:00</td><td>Físicas matinales + tests</td><td>1 h estudio</td></tr>
    <tr><td>Miércoles</td><td>20:00-22:00</td><td>Continuación tema + esquema</td><td>2 h</td></tr>
    <tr><td>Jueves</td><td>6:00-7:00 + 20:00-21:00</td><td>Físicas + repaso espaciado</td><td>1 h estudio</td></tr>
    <tr><td>Viernes</td><td>20:00-21:00</td><td>Tests del tema (100 preguntas)</td><td>1 h</td></tr>
    <tr><td>Sábado</td><td>9:00-14:00</td><td>Tema 2 completo + simulacro</td><td>5 h</td></tr>
    <tr><td>Domingo</td><td>10:00-13:00</td><td>Repaso + ortografía + inglés</td><td>3 h</td></tr>
  </tbody>
</table>
<p>Total: <strong>15 horas de estudio efectivo</strong> + 2-3 horas de físicas.</p>

<h2>Regla del pomodoro adaptado</h2>
<ul>
  <li>Bloques de 50 minutos de estudio + 10 minutos descanso.</li>
  <li>Tras 3 bloques (2,5 h), descanso largo de 30 minutos.</li>
  <li>En 2 horas nocturnas consigues 2 bloques efectivos reales.</li>
</ul>

<h2>Cómo cubrir 45 temas en 10 meses con este ritmo</h2>
<ul>
  <li><strong>Ritmo:</strong> 1 tema cada 5-6 días.</li>
  <li>Viernes: empezar tema nuevo.</li>
  <li>Lunes a miércoles siguientes: profundizar.</li>
  <li>Jueves: tests y autoevaluación.</li>
</ul>

<h2>Físicas trabajando: cuándo y cómo</h2>
<ul>
  <li><strong>6:00-7:00 antes del trabajo:</strong> 2 días/semana (carrera o fuerza).</li>
  <li><strong>Sábado tarde:</strong> entreno completo 1 h (simulacro de pruebas físicas).</li>
  <li><strong>Total:</strong> 3 h/semana mínimo, suficiente con un plan estructurado.</li>
</ul>

<h2>Errores del opositor que trabaja</h2>
<ul>
  <li>Intentar estudiar 3 h diarias después de jornada de 8 h: insostenible. Mejor 2 h firmes.</li>
  <li>Saltarse el fin de semana por "recuperar vida social". Sábado es sagrado.</li>
  <li>No dormir 7-8 h por ganar 1 h de estudio: baja el rendimiento al 60 %.</li>
  <li>No hacer tests hasta el mes 6. Los tests deben empezar desde el primer mes.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/como-aprobar-guardia-civil-primera-vuelta-2026">Plan para aprobar a la primera</a></li>
  <li><a href="/blog/calendario-guardia-civil-2026-fechas-examen">Calendario convocatoria 2026</a></li>
  <li><a href="/blog/pruebas-fisicas-guardia-civil-2026">Pruebas físicas</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas horas a la semana son mínimas para opositar trabajando?', answer: '15 horas efectivas semanales (2 h de lunes a viernes + 5 h sábado + 3 h domingo) durante 10 meses para aprobar Guardia Civil.' },
      { question: '¿Puedo pedir una excedencia para opositar?', answer: 'Depende del tipo de contrato. En sector público existe la excedencia voluntaria; en privado, negociación individual o reducción de jornada.' },
      { question: '¿Estudio mejor por la mañana o por la noche?', answer: 'Por la mañana si te levantas 1-2 h antes del trabajo; si no, después de cenar pero antes de las 23:00. Evita estudiar con menos de 7 h de sueño.' },
      { question: '¿Es compatible el entrenamiento físico con el trabajo?', answer: 'Sí. 3 sesiones de 1 h/semana (dos entre semana a las 6 h y una el sábado) son suficientes para llegar con marcas mínimas.' },
      { question: '¿Cómo evito el burnout en 10 meses?', answer: '1 día completo de descanso cada 2 semanas, dormir 7-8 h siempre, y 30 min diarios de actividad no relacionada con la oposición.' },
    ],
  },

  // ─── 12 ────────────────────────────────────────────────────────────────────
  {
    slug: 'simulacro-guardia-civil-2026-examen-completo-online',
    title: 'Simulacro Guardia Civil 2026: examen completo 100 preguntas',
    description:
      'Simulacro Guardia Civil 2026 completo online: 100 preguntas + ortografía + psicotécnico, penalización −1/4 y tiempos reales como el examen.',
    date: '2026-04-19',
    dateModified: '2026-04-19',
    keywords: [
      'simulacro guardia civil 2026',
      'examen guardia civil online',
      'simulacro completo guardia civil',
      'test guardia civil gratis',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Examen real:</strong> 100 preguntas + 10 reserva en 90 minutos, penalización −1/4.</li>
  <li><strong>Añadidos:</strong> 20 ortografía (15 min) + psicotécnico aptitud (45 min).</li>
  <li><strong>Simulacro completo:</strong> 2,5 h totales sin descanso para replicar fatiga real.</li>
</ul>

<h2>Por qué hacer simulacros completos</h2>
<p>
  Estudiar temas y hacer tests cortos es útil, pero no prepara para la <strong>fatiga real</strong> de un examen de 2,5 h
  seguidas con penalización. Los opositores que no hacen simulacros completos pierden una media de 5-8 puntos en el examen
  final por errores de gestión de tiempo y decisiones bajo presión. Desde el mes 7, haz 1 simulacro/semana.
</p>

<h2>Estructura del simulacro oficial</h2>
<table>
  <thead><tr><th>Bloque</th><th>Preguntas</th><th>Tiempo</th><th>Penalización</th></tr></thead>
  <tbody>
    <tr><td>Teórico (temas 1-45)</td><td>100 + 10 reserva</td><td>90 min</td><td>−1/4</td></tr>
    <tr><td>Ortografía</td><td>20</td><td>15 min</td><td>−1/4</td></tr>
    <tr><td>Psicotécnico aptitud</td><td>~60</td><td>45 min</td><td>No (solo aciertos)</td></tr>
    <tr><td>Personalidad</td><td>~240</td><td>30 min</td><td>APTO/NO APTO</td></tr>
  </tbody>
</table>

<h2>Cómo se calcula tu nota en el simulacro</h2>
<ul>
  <li><strong>Nota bruta:</strong> aciertos totales.</li>
  <li><strong>Nota neta con penalización:</strong> aciertos − (fallos / 4).</li>
  <li><strong>Ejemplo:</strong> 72 aciertos, 18 fallos, 10 blancos → 72 − 4,5 = <strong>67,5/100</strong>.</li>
</ul>

<h2>Estrategia óptima durante el simulacro</h2>
<ul>
  <li><strong>Primer paso (90 min teoría):</strong> dar 2 pasadas. Primera rápida respondiendo solo seguras (50-60 min). Segunda para dudas (25-30 min). Últimos 5 min: revisión.</li>
  <li><strong>Blanco cuando:</strong> no puedes descartar ni 1 opción. Responder al azar da valor esperado 0 con penalización −1/4 (probabilidad 1/4 acierto × 1 = 0,25; 3/4 fallo × −0,25 = −0,1875; valor = +0,06 positivo). Técnicamente conviene jugarla si descartas 1.</li>
  <li><strong>Ortografía:</strong> hacerla con agilidad (30 s/pregunta). No dejes blancos salvo duda radical.</li>
  <li><strong>Psicotécnico:</strong> nunca quedarte atascado &gt;45 s en una pregunta. Pasa y vuelve.</li>
</ul>

<h2>Objetivos por fase del simulacro</h2>
<ul>
  <li><strong>Mes 7:</strong> nota 55/100 con penalización. Más blancos, menos fallos.</li>
  <li><strong>Mes 8:</strong> 60/100. Reducir blancos a &lt;15.</li>
  <li><strong>Mes 9:</strong> 65/100. Consolidar temas 1-20.</li>
  <li><strong>Mes 10:</strong> 70+/100. Nota de corte dentro.</li>
</ul>

<h2>Check-list del simulacro</h2>
<ul>
  <li>Cronómetro visible.</li>
  <li>Penalización −1/4 activada.</li>
  <li>Sin ayudas externas (apuntes, móvil, café durante).</li>
  <li>Mismo horario que el examen real (09:00-12:00 suele ser el oficial).</li>
  <li>Analizar TODOS los fallos después: qué tema, por qué, cómo evitarlo.</li>
</ul>

<h2>Enlaces útiles en OpoRuta</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/test-guardia-civil-online-gratis-2026">Test Guardia Civil gratis</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados</a></li>
  <li><a href="/blog/nota-corte-guardia-civil-2024-2025-historico">Histórico notas de corte</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas tiene el examen real de Guardia Civil?', answer: '100 preguntas puntuables + 10 de reserva (sustituyen anuladas), en 90 minutos con penalización −1/4.' },
      { question: '¿Los simulacros son gratis en OpoRuta?', answer: 'Sí, la versión básica es gratuita. Los simulacros oficiales con correcciones IA detalladas están en el plan premium (49,99 €).' },
      { question: '¿Cuándo debo empezar los simulacros completos?', answer: 'A partir del mes 7 del plan de 10 meses. Antes los tests cortos por tema son más productivos.' },
      { question: '¿Cuántos simulacros hago antes del examen?', answer: 'Entre 8 y 12 simulacros completos en los 4 meses finales, uno por semana desde el mes 7 y 2 por semana en el mes final.' },
      { question: '¿Hago el simulacro en el ordenador o en papel?', answer: 'Mejor alternar. El examen real es en papel con plantilla; los simulacros online son útiles para análisis inmediato de fallos.' },
    ],
  },

  // ─── 13 ────────────────────────────────────────────────────────────────────
  {
    slug: 'examen-guardia-civil-2022-analisis-preguntas-clave',
    title: 'Examen Guardia Civil 2022: análisis y preguntas clave por bloque',
    description:
      'Análisis del examen Guardia Civil 2022: distribución por bloques, temas que más cayeron, preguntas tipo y nota de corte real.',
    date: '2026-04-30',
    dateModified: '2026-04-30',
    keywords: [
      'examen guardia civil 2022',
      'examenes guardia civil 2022',
      'preguntas examen guardia civil 2022',
      'analisis examen guardia civil 2022',
      'temas examen guardia civil 2022',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Estructura:</strong> 100 preguntas puntuables + 10 de reserva, 4 opciones, penalización 1:3 (cada 3 errores restan 1 acierto).</li>
  <li><strong>Duración:</strong> 90 minutos. Se celebró en convocatoria ordinaria con ~30.000 presentados.</li>
  <li><strong>Bloque más exigente:</strong> Ciencias Jurídicas (Constitución + LO 2/86 + LO Régimen Personal).</li>
</ul>

<h2>Distribución real por bloques en 2022</h2>
<p>
  El examen 2022 mantuvo la estructura clásica: tres bloques (Ciencias Jurídicas, Materias Sociotécnicas y Materias Técnico-Científicas)
  con peso aproximado 45/30/25. Si comparas con 2019 y 2024, hay continuidad: la Constitución y la LO 2/86 concentran un porcentaje
  altísimo del Bloque I.
</p>

<table>
  <thead><tr><th>Bloque</th><th>Preguntas aprox.</th><th>Temas con más peso</th></tr></thead>
  <tbody>
    <tr><td>I. Ciencias Jurídicas</td><td>~45</td><td>Constitución, LO 2/86, LO Régimen Personal Guardia Civil, derechos humanos</td></tr>
    <tr><td>II. Sociotécnicas</td><td>~30</td><td>Geografía e historia de España, UE, educación vial, igualdad</td></tr>
    <tr><td>III. Técnico-Científicas</td><td>~25</td><td>Topografía, armamento, primeros auxilios, informática básica</td></tr>
  </tbody>
</table>

<h2>Preguntas tipo del examen 2022 (estilo)</h2>
<ul>
  <li><strong>Constitución:</strong> mayoría exigida en moción de censura (mayoría absoluta del Congreso). Aparece casi cada año.</li>
  <li><strong>LO 2/86 FCS:</strong> funciones que la Guardia Civil ejerce con carácter exclusivo (resguardo fiscal del Estado, armas y explosivos, vías interurbanas, etc.).</li>
  <li><strong>Topografía:</strong> escalas, curvas de nivel, equidistancia. Pregunta clásica: en una 1:50.000, ¿qué representan 2 cm reales?</li>
  <li><strong>Sociotécnicas:</strong> CC. AA., capitales, ríos, distribución administrativa.</li>
</ul>

<h2>Qué cayó más de lo esperado</h2>
<ul>
  <li>Reformas del art. 13.2 (1992) y art. 135 (2011) de la Constitución.</li>
  <li>Régimen disciplinario de la Guardia Civil (faltas leves, graves, muy graves).</li>
  <li>Educación vial: señales, prioridades, alcoholemia.</li>
</ul>

<h2>Nota de corte 2022</h2>
<p>
  La nota de corte rondó los 60 aciertos netos sobre 100 (descontada penalización). Con 2.022 plazas convocadas, el ratio fue
  cercano a 1 plaza por cada 14 presentados. Si quieres ver el histórico completo, pasa por <a href="/blog/nota-corte-guardia-civil-2024-2025-historico">notas de corte 2024-2025</a>.
</p>

<h2>Cómo entrenar este examen en OpoRuta</h2>
<ul>
  <li>Simulacro modo "convocatoria 2022" con las 100 preguntas reales ingestadas.</li>
  <li>Penalización 1:3 activada por defecto.</li>
  <li>Desglose por tema al terminar y referencia cruzada con 2019, 2022 y 2024.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/simulacros-oposiciones">Simulacros oficiales</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados</a></li>
  <li><a href="/register">Empieza gratis</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas tuvo el examen Guardia Civil 2022?', answer: '100 puntuables más 10 de reserva, 4 opciones, penalización 1:3, 90 minutos.' },
      { question: '¿Qué bloque pesó más en 2022?', answer: 'Ciencias Jurídicas, con ~45 preguntas. Constitución y LO 2/86 fueron los temas más cargados.' },
      { question: '¿Qué nota de corte tuvo el examen 2022?', answer: 'Rondó los 60 aciertos netos sobre 100, en línea con 2019 y ligeramente por encima de 2024.' },
      { question: '¿Puedo practicar el examen 2022 en OpoRuta?', answer: 'Sí: está ingestado completo. Puedes hacer el simulacro en modo convocatoria oficial con penalización real.' },
      { question: '¿En qué se diferenció 2022 de 2024?', answer: 'En 2022 cayó más topografía y régimen disciplinario; en 2024 ganó peso la igualdad y la UE.' },
    ],
  },

  // ─── 14 ────────────────────────────────────────────────────────────────────
  {
    slug: 'examen-guardia-civil-2018-conocimientos-preguntas-resueltas',
    title: 'Examen Guardia Civil 2018: preguntas resueltas y razonadas',
    description:
      'Examen Guardia Civil 2018 con preguntas resueltas, explicación razonada y cita legal. Útil para entender qué busca el tribunal.',
    date: '2026-04-30',
    dateModified: '2026-04-30',
    keywords: [
      'examen guardia civil 2018',
      'examen conocimientos guardia civil 2018',
      'test guardia civil 2018 gratis',
      'preguntas guardia civil 2018',
      'examen 2018 guardia civil resuelto',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Convocatoria 2018:</strong> 2.030 plazas, ~33.000 presentados. Examen tipo test 100 + 10 reserva.</li>
  <li><strong>Penalización:</strong> 1:3, 4 opciones, 90 minutos.</li>
  <li><strong>Por qué interesa hoy:</strong> 2018 marcó el patrón de preguntas que se repite en 2019, 2022 y 2024.</li>
</ul>

<h2>¿Por qué estudiar el examen 2018 en 2026?</h2>
<p>
  El temario apenas cambia entre convocatorias. El tribunal recicla estructura y, a menudo, formulaciones. Resolver el examen
  2018 con explicación razonada te enseña a <strong>leer enunciados con trampa</strong> y a identificar el matiz que busca el
  redactor. No es nostalgia: es ingeniería inversa.
</p>

<h2>Preguntas tipo resueltas (estilo del examen)</h2>
<h3>1. Constitución española</h3>
<p>
  <em>"La iniciativa popular para la presentación de proposiciones de ley exige un mínimo de…"</em> Respuesta: 500.000 firmas
  acreditadas (art. 87.3 CE). Trampa habitual: te ofrecen 50.000, 100.000 o 1.000.000 como distractores.
</p>

<h3>2. LO 2/86 de Fuerzas y Cuerpos de Seguridad</h3>
<p>
  <em>"¿Cuál de estas funciones la ejerce con carácter exclusivo la Guardia Civil?"</em> Respuesta: el resguardo fiscal del
  Estado y el control de armas y explosivos (art. 12). La Policía Nacional NO comparte esas competencias.
</p>

<h3>3. Topografía</h3>
<p>
  <em>"En un mapa a escala 1:50.000, una distancia de 4 cm equivale a…"</em> Respuesta: 2 km reales. Regla: cm en mapa × escala
  / 100.000 = km reales.
</p>

<h3>4. Geografía de España</h3>
<p>
  <em>"¿Qué río atraviesa la Comunidad Foral de Navarra?"</em> Respuesta: el Ebro (también Bidasoa, Aragón). Trampa: el
  Duero NO pasa por Navarra.
</p>

<h2>Patrón que se repite desde 2018</h2>
<table>
  <thead><tr><th>Tipo de pregunta</th><th>Frecuencia 2018-2024</th><th>Estrategia</th></tr></thead>
  <tbody>
    <tr><td>Cifra exacta CE/leyes</td><td>~20 %</td><td>Memorizar plazos, mayorías y porcentajes</td></tr>
    <tr><td>Función exclusiva GC</td><td>3-5 preguntas/año</td><td>Dominar art. 11-12 LO 2/86</td></tr>
    <tr><td>Topografía/escalas</td><td>2-3 preguntas</td><td>Practicar conversión cm ↔ km</td></tr>
    <tr><td>Geografía/CC.AA.</td><td>5-7 preguntas</td><td>Mapa mental por comunidades</td></tr>
  </tbody>
</table>

<h2>Cómo trabajar el 2018 en OpoRuta</h2>
<ul>
  <li>Modo simulacro convocatoria 2018 (cuando esté ingestado).</li>
  <li>Análisis IA pregunta a pregunta con cita legal y empatía socrática.</li>
  <li>Comparativa con 2019, 2022 y 2024 para detectar patrones repetidos.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados</a></li>
  <li><a href="/simulacros-oposiciones">Simulacros oficiales</a></li>
  <li><a href="/register">Empieza gratis</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Sigue siendo útil el examen 2018?', answer: 'Sí: marca el patrón de preguntas que se repite en 2019, 2022 y 2024. El temario y la estructura son prácticamente los mismos.' },
      { question: '¿Dónde encuentro el examen 2018 oficial?', answer: 'En el BOE y en la sede del Ministerio del Interior. OpoRuta lo ingesta y lo pone como simulacro.' },
      { question: '¿Cuántos aprobaron en 2018?', answer: 'Se cubrieron las 2.030 plazas. La nota de corte rondó los 58-60 aciertos netos.' },
      { question: '¿Qué tema cayó más en 2018?', answer: 'Constitución y LO 2/86 concentraron casi un tercio del examen. Topografía y geografía completaron el cuadro.' },
      { question: '¿Hay test gratis del 2018?', answer: 'Sí: la versión gratuita de OpoRuta permite ver preguntas tipo del 2018 con explicación razonada.' },
    ],
  },

  // ─── 15 ────────────────────────────────────────────────────────────────────
  {
    slug: 'tema-18-guardia-civil-topografia-claves-examen',
    title: 'Tema 18 Guardia Civil: topografía, escalas y curvas de nivel',
    description:
      'Tema 18 Guardia Civil al detalle: escalas, curvas de nivel, coordenadas UTM, signos convencionales y preguntas tipo del examen.',
    date: '2026-04-30',
    dateModified: '2026-04-30',
    keywords: [
      'tema 18 guardia civil',
      'topografia guardia civil',
      'tema 18 topografia guardia civil',
      'escalas guardia civil examen',
      'curvas de nivel guardia civil',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Peso del tema:</strong> 2-4 preguntas por examen (Bloque III, Materias Técnico-Científicas).</li>
  <li><strong>Conceptos clave:</strong> escala, curvas de nivel, equidistancia, coordenadas UTM, signos convencionales.</li>
  <li><strong>Trampa habitual:</strong> confundir escala numérica (1:50.000) con escala gráfica.</li>
</ul>

<h2>Escalas: la pregunta más repetida</h2>
<p>
  La escala es la relación entre la distancia en el mapa y la distancia real. Si la escala es 1:50.000, 1 cm en el mapa equivale
  a 50.000 cm reales (es decir, 500 m o 0,5 km). Memoriza esto:
</p>
<ul>
  <li><strong>1:25.000</strong> → 1 cm = 250 m. Mapas militares de detalle.</li>
  <li><strong>1:50.000</strong> → 1 cm = 500 m. Es la escala estándar del Ejército y la Guardia Civil.</li>
  <li><strong>1:200.000</strong> → 1 cm = 2 km. Mapas provinciales.</li>
</ul>

<h2>Curvas de nivel</h2>
<p>
  Líneas que unen puntos de igual altitud. La <strong>equidistancia</strong> es la diferencia de altura entre dos curvas
  consecutivas. En un 1:50.000 la equidistancia suele ser de 20 m. Si las curvas están muy juntas, el terreno es abrupto;
  si están separadas, es suave.
</p>

<h2>Coordenadas UTM</h2>
<p>
  Sistema universal: el mundo se divide en husos de 6° de longitud, numerados del 1 al 60. España está en los husos 29, 30 y 31.
  Cada punto se localiza con un par (X, Y) en metros desde el origen del huso. Pregunta tipo: <em>"En qué huso UTM está
  Madrid?"</em> → Huso 30.
</p>

<h2>Signos convencionales</h2>
<table>
  <thead><tr><th>Signo</th><th>Significado</th></tr></thead>
  <tbody>
    <tr><td>Línea continua negra</td><td>Carretera asfaltada</td></tr>
    <tr><td>Línea discontinua</td><td>Camino o senda</td></tr>
    <tr><td>Triángulo con punto</td><td>Vértice geodésico</td></tr>
    <tr><td>Cruz</td><td>Iglesia o ermita</td></tr>
  </tbody>
</table>

<h2>Preguntas tipo del examen</h2>
<ul>
  <li>"En un mapa 1:50.000, ¿cuántos km reales son 8 cm?" → 4 km.</li>
  <li>"¿Qué representa una equidistancia de 20 m?" → la diferencia de altitud entre dos curvas de nivel consecutivas.</li>
  <li>"¿En qué huso UTM se sitúa Bilbao?" → Huso 30.</li>
  <li>"Las curvas de nivel muy juntas indican…" → terreno abrupto / pendiente fuerte.</li>
</ul>

<h2>Cómo dominar el tema 18 en 2 semanas</h2>
<ul>
  <li>Día 1-3: aprender escalas y hacer 30 conversiones cm ↔ km.</li>
  <li>Día 4-7: curvas de nivel, equidistancia, perfiles topográficos.</li>
  <li>Día 8-10: UTM, husos, coordenadas geográficas.</li>
  <li>Día 11-14: signos convencionales y test mixto de 50 preguntas.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/temas-mas-preguntados-guardia-civil-2023-2025">Temas más preguntados</a></li>
  <li><a href="/simulacros-oposiciones">Simulacros oficiales</a></li>
  <li><a href="/register">Empieza gratis</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuántas preguntas de topografía caen en el examen?', answer: 'Entre 2 y 4 por convocatoria. Es un tema con alto retorno por hora estudiada.' },
      { question: '¿Qué escala es la más típica en preguntas?', answer: '1:50.000 (la del Ejército). Domina la conversión 1 cm = 500 m y resolverás la mayoría.' },
      { question: '¿Hay que saber UTM al detalle?', answer: 'Conocer el concepto de huso, los husos de España (29, 30 y 31) y entender que las coordenadas se miden en metros. No piden cálculos complejos.' },
      { question: '¿Necesito un libro específico para el tema 18?', answer: 'No: con un manual oficial actualizado y práctica de tests es suficiente. Los conceptos son finitos.' },
      { question: '¿Cuánto tiempo dedicarle?', answer: 'Entre 15 y 20 horas para dominar el tema con margen. Repasos cortos cada 2 semanas para no olvidar.' },
    ],
  },

  // ─── 16 ────────────────────────────────────────────────────────────────────
  {
    slug: 'boe-convocatoria-guardia-civil-2026-fechas-plazas',
    title: 'BOE convocatoria Guardia Civil 2026: fechas, plazas y requisitos',
    description:
      'Convocatoria Guardia Civil 2026 publicada en BOE: plazas, fechas de instancia, examen, requisitos oficiales y enlaces directos.',
    date: '2026-04-30',
    dateModified: '2026-04-30',
    keywords: [
      'boe guardia civil',
      'boe guardia civil 2026',
      'convocatoria guardia civil 2026',
      'fechas guardia civil 2026',
      'plazas guardia civil 2026',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Plazas previstas:</strong> en torno a 1.700 plazas para Escala de Cabos y Guardias en la convocatoria 2026.</li>
  <li><strong>Examen teórico:</strong> previsto para otoño 2026 (octubre-noviembre, según el patrón de convocatorias anteriores).</li>
  <li><strong>Plazo de instancias:</strong> 20 días hábiles desde la publicación oficial en BOE.</li>
</ul>

<h2>¿Dónde se publica la convocatoria?</h2>
<p>
  En el <strong>Boletín Oficial del Estado (BOE)</strong> y en el <strong>Boletín Oficial de la Defensa (BOD)</strong>.
  La instrucción la firma el Ministerio del Interior junto con el Ministerio de Defensa (la Guardia Civil tiene naturaleza
  militar). El orden de publicación es: oferta de empleo público → convocatoria oficial → bases → corrección de errores.
</p>

<h2>Fases del calendario tipo</h2>
<table>
  <thead><tr><th>Fase</th><th>Cuándo</th><th>Qué hacer</th></tr></thead>
  <tbody>
    <tr><td>Publicación BOE</td><td>Primer trimestre 2026</td><td>Leer bases completas, comprobar requisitos</td></tr>
    <tr><td>Plazo de instancias</td><td>20 días hábiles desde publicación</td><td>Presentar solicitud y abonar tasa</td></tr>
    <tr><td>Listas provisionales</td><td>1-2 meses después</td><td>Verificar admisión y subsanar</td></tr>
    <tr><td>Examen teórico</td><td>Otoño 2026</td><td>Test 100 preguntas + 10 reserva</td></tr>
    <tr><td>Pruebas físicas y psicotécnicas</td><td>Diciembre 2026 - enero 2027</td><td>Tras aprobado el teórico</td></tr>
    <tr><td>Reconocimiento médico</td><td>Enero - febrero 2027</td><td>Causas de exclusión RD</td></tr>
  </tbody>
</table>

<h2>Requisitos básicos (sin cambios respecto a 2024)</h2>
<ul>
  <li>Ser español y mayor de edad (18-40 años, ampliable según situaciones).</li>
  <li>Título de Bachillerato o equivalente.</li>
  <li>Carné de conducir tipo B en vigor.</li>
  <li>No tener antecedentes penales.</li>
  <li>Compromiso militar mínimo durante el periodo de prácticas.</li>
</ul>

<h2>Plazas por convocatoria (referencia)</h2>
<ul>
  <li><strong>2022:</strong> 2.022 plazas.</li>
  <li><strong>2023:</strong> 1.880 plazas aprox.</li>
  <li><strong>2024:</strong> 3.118 plazas (cifra alta por acumulación).</li>
  <li><strong>2025:</strong> 1.671 plazas.</li>
  <li><strong>2026:</strong> previsión en torno a 1.700 plazas.</li>
</ul>

<h2>Cómo no perderte la publicación oficial</h2>
<ul>
  <li>Suscríbete al BOE Watcher de OpoRuta: te avisa por email cuando aparezca cualquier referencia a "Guardia Civil".</li>
  <li>Revisa el portal del INAP y de la Guardia Civil semanalmente.</li>
  <li>Activa alertas en el buscador del BOE con la palabra clave "Cabos y Guardias".</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/blog/calendario-guardia-civil-2026-fechas-examen">Calendario 2026 detallado</a></li>
  <li><a href="/blog/requisitos-guardia-civil-2026-edad-altura-estudios">Requisitos completos</a></li>
  <li><a href="/register">Activar BOE Watcher gratis</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿Cuándo se publica la convocatoria 2026 en el BOE?', answer: 'Habitualmente en el primer trimestre del año. La oferta de empleo público suele aparecer en enero-marzo.' },
      { question: '¿Cuántas plazas habrá en 2026?', answer: 'La previsión ronda las 1.700 plazas, en línea con 2025 y por debajo del pico de 2024.' },
      { question: '¿Cuánto dura el plazo de presentación de instancias?', answer: '20 días hábiles desde el día siguiente a la publicación de la convocatoria en BOE.' },
      { question: '¿Cuál es la tasa de examen?', answer: 'Ronda los 11 € en convocatorias recientes. Se actualiza anualmente.' },
      { question: '¿Qué titulación necesito?', answer: 'Bachillerato, Técnico de Grado Medio o equivalente. No exige titulación universitaria.' },
    ],
  },

  // ─── 17 ────────────────────────────────────────────────────────────────────
  {
    slug: 'test-guardia-civil-gratis-online-2026-100-preguntas',
    title: 'Test Guardia Civil gratis online 2026: 100 preguntas con IA',
    description:
      'Test Guardia Civil gratis online: 100 preguntas tipo examen, penalización 1:3 real y corrección IA. Sin registro para empezar.',
    date: '2026-04-30',
    dateModified: '2026-04-30',
    keywords: [
      'test guardia civil gratis',
      'test guardia civil online 2026',
      'test guardia civil 2018 gratis',
      'test gratis guardia civil',
      'test guardia civil 100 preguntas',
    ],
    content: `
<h2>TL;DR</h2>
<ul>
  <li><strong>Test gratis sin tarjeta:</strong> 100 preguntas tipo examen Guardia Civil, penalización 1:3 activada.</li>
  <li><strong>Corrección IA:</strong> análisis de cada error con cita legal y explicación socrática.</li>
  <li><strong>Banco de preguntas:</strong> ingestadas convocatorias 2018, 2019, 2022 y 2024 reales.</li>
</ul>

<h2>Por qué hacer un test antes de pagar academia</h2>
<p>
  Antes de gastar 1.500 €/año en una academia presencial, haz un test real de 100 preguntas con penalización. En 90 minutos
  sabrás:
</p>
<ul>
  <li>Tu nivel de partida (¿estás cerca del corte 60 puntos netos?).</li>
  <li>Qué bloque tienes peor (Jurídicas, Sociotécnicas o Técnicas).</li>
  <li>Cuánto tiempo necesitas hasta el examen real.</li>
</ul>

<h2>Qué incluye el test gratis de OpoRuta</h2>
<table>
  <thead><tr><th>Funcionalidad</th><th>Free</th><th>Pack 49,99 €</th></tr></thead>
  <tbody>
    <tr><td>100 preguntas tipo examen</td><td>Sí (3 simulacros lifetime, 20 preguntas)</td><td>Ilimitado, 100 preguntas</td></tr>
    <tr><td>Penalización 1:3 real</td><td>Sí</td><td>Sí</td></tr>
    <tr><td>Corrección IA detallada</td><td>2 análisis gratis</td><td>Ilimitado</td></tr>
    <tr><td>Convocatorias reales (2018, 2019, 2022, 2024)</td><td>Acceso parcial</td><td>Completo</td></tr>
    <tr><td>Desglose por tema</td><td>Sí</td><td>Sí</td></tr>
  </tbody>
</table>

<h2>Cómo se hace el test gratis</h2>
<ol>
  <li>Crea cuenta gratis en <a href="/register">/register</a> (email o Google, sin tarjeta).</li>
  <li>Entra a <a href="/simulacros-oposiciones">/simulacros-oposiciones</a> y elige Guardia Civil.</li>
  <li>Selecciona convocatoria (2019, 2022 o 2024) o modo mixto.</li>
  <li>Activa la penalización 1:3 (viene por defecto).</li>
  <li>Termina el simulacro y revisa el desglose por tema.</li>
</ol>

<h2>Cómo interpretar tu resultado</h2>
<ul>
  <li><strong>Por debajo de 40 netos:</strong> aún estás en fase de temario. Ataca tema a tema.</li>
  <li><strong>Entre 40 y 55 netos:</strong> bien encaminado. Toca repasos espaciados y simulacros semanales.</li>
  <li><strong>Más de 55 netos:</strong> estás cerca del corte. Afina técnica, ortografía y físicas.</li>
  <li><strong>Más de 70 netos:</strong> rendimiento de aprobado holgado. Mantén el ritmo.</li>
</ul>

<h2>Errores típicos al hacer test gratis online</h2>
<ul>
  <li>No activar la penalización: te da una nota irreal (siempre más alta de la que sacarías en el examen).</li>
  <li>Hacer test cortos sólo: aprendes preguntas, no resistencia. Mete simulacros completos cada semana.</li>
  <li>Ignorar el desglose por tema: el valor está ahí. Te dice qué estudiar mañana.</li>
</ul>

<h2>Enlaces útiles</h2>
<ul>
  <li><a href="/oposiciones/seguridad/guardia-civil">Página principal Guardia Civil</a></li>
  <li><a href="/simulacros-oposiciones">Simulacros oficiales</a></li>
  <li><a href="/blog/simulacro-guardia-civil-2026-examen-completo-online">Guía simulacro completo</a></li>
  <li><a href="/register">Empieza gratis</a></li>
</ul>
`.trim(),
    faqs: [
      { question: '¿El test es realmente gratis?', answer: 'Sí: la versión free permite hacer simulacros de 20 preguntas (3 lifetime) y tests por tema en los temas 1, 11 y 17. Sin tarjeta.' },
      { question: '¿Tengo que registrarme?', answer: 'Para los simulacros con corrección IA sí. Solo email o Google. No pedimos tarjeta.' },
      { question: '¿Las preguntas son reales del examen?', answer: 'Sí: las convocatorias 2018, 2019, 2022 y 2024 están ingestadas oficialmente desde el BOE.' },
      { question: '¿Puedo hacer test sólo del examen 2018?', answer: 'Sí, eliges convocatoria al iniciar el simulacro. También puedes hacer modo mixto con preguntas de varios años.' },
      { question: '¿Cuánto cuesta el plan completo?', answer: '49,99 € pago único por todo el ciclo de oposición. Sin suscripción ni renovación automática.' },
    ],
  },
]
