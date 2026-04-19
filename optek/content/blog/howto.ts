/**
 * content/blog/howto.ts — PlanSEO F2.T6
 *
 * HowTo schema por slug. Se merge con BlogPost en tiempo de render
 * en app/(marketing)/blog/[slug]/page.tsx, sin tocar posts.ts.
 *
 * Sólo para posts con forma de tutorial (pasos claros, outcome verificable).
 * Objetivo: rich result "HowTo" en Google para queries navegacionales.
 */

import type { BlogPost } from './posts'

type HowTo = NonNullable<BlogPost['howTo']>

export const HOWTO_BY_SLUG: Record<string, HowTo> = {
  'como-preparar-oposicion-auxiliar-administrativo-estado-guia': {
    name: 'Cómo preparar la oposición de Auxiliar Administrativo del Estado',
    description:
      'Plan de preparación en 5 fases para aprobar el examen INAP (C2): temario, simulacros, ofimática y estrategia de penalización -1/3.',
    totalTime: 'PT6M',
    steps: [
      { name: 'Conoce el examen', text: 'Estudia el formato INAP: 100 preguntas puntuables + 10 de reserva, 90 minutos, penalización -1/3 por error, dos partes eliminatorias (teoría+psico y ofimática).' },
      { name: 'Organiza el temario', text: 'Divide los temas del Bloque I por frecuencia: Constitución, LPAC, LRJSP y TREBEP suman el 70% de lo preguntado.' },
      { name: 'Entrena con exámenes reales', text: 'Haz simulacros INAP 2018-2024 con penalización activada para acostumbrarte al ritmo y la presión.' },
      { name: 'Refuerza ofimática', text: 'Practica Windows 11 y Microsoft 365 (Word, Excel, Access, Outlook) con preguntas reales de la 2ª parte.' },
      { name: 'Revisa errores con IA', text: 'Tras cada simulacro pide explicación IA de lo que fallaste para no repetir el mismo error.' },
    ],
  },
  'preparar-oposicion-auxiliar-administrativo-por-libre': {
    name: 'Cómo preparar el examen de Auxiliar Administrativo por libre',
    totalTime: 'PT8M',
    steps: [
      { name: 'Descarga el temario oficial', text: 'Usa el programa anexo a la convocatoria BOE como índice canónico — nada de academias con "extras".' },
      { name: 'Legislación consolidada', text: 'Accede a textos consolidados en BOE. Marca los artículos frecuentes con un color para reconocerlos al vuelo.' },
      { name: 'Calendario 8 meses', text: 'Reserva 6 meses para teoría y psico, 1 mes de ofimática intensiva y 1 mes sólo simulacros.' },
      { name: 'Tests diarios', text: 'Haz al menos 30 preguntas al día en OpoRuta para fijar la materia sin saturarte.' },
      { name: 'Simula el examen real', text: 'Los 30 días finales: 1 simulacro INAP completo cada 3 días con temporizador y penalización.' },
    ],
  },
  'ultimos-60-dias-administrativo-estado-c1-plan-estudio': {
    name: 'Plan de estudio 60 días — Administrativo del Estado C1',
    totalTime: 'PT4M',
    steps: [
      { name: 'Semanas 1-2: audit', text: 'Haz un simulacro diagnóstico y detecta los 3 bloques más débiles. No estudies todo: foco en lo que falla.' },
      { name: 'Semanas 3-5: refuerzo', text: '8 sesiones de 90 minutos por semana. 50% tests + 50% repaso legislación.' },
      { name: 'Semanas 6-7: integración', text: 'Mezcla bloques en tests temáticos. Incluye supuesto práctico 2 veces por semana.' },
      { name: 'Semanas 8-9: simulacros', text: 'Un simulacro INAP completo cada 3 días con corrección IA de errores.' },
    ],
  },
  'preparar-correos-sin-academia-3-meses': {
    name: 'Cómo preparar Correos sin academia en 3 meses',
    totalTime: 'PT5M',
    steps: [
      { name: 'Mes 1: temario', text: 'Lee los 13 temas del programa oficial y subraya la regulación postal clave (Ley 43/2010).' },
      { name: 'Mes 2: tests temáticos', text: '60 preguntas diarias por bloque en OpoRuta — tasa de acierto objetivo 75%.' },
      { name: 'Mes 3: simulacros', text: 'Simulacros Correos completos 2 veces por semana con 90 min cronometrados.' },
      { name: 'Revisión psicotécnicos', text: 'Dedica 20 minutos diarios a series numéricas y aptitud verbal.' },
    ],
  },
  'preparar-auxilio-judicial-sin-academia-10-meses': {
    name: 'Cómo preparar Auxilio Judicial sin academia en 10 meses',
    totalTime: 'PT6M',
    steps: [
      { name: 'Meses 1-3: cimientos', text: 'Lee los 26 temas y fija LO 6/1985 LOPJ + LO 1/2025 en esquemas propios.' },
      { name: 'Meses 4-6: tests por tema', text: '40 preguntas diarias, una hora al día. Marca dudas y resuélvelas semanalmente.' },
      { name: 'Meses 7-8: simulacros MJU', text: '2 simulacros oficiales MJU por semana con penalización real.' },
      { name: 'Meses 9-10: pulido', text: 'Foco en errores recurrentes + repaso express del temario cada 5 días.' },
    ],
  },
  'opositar-justicia-trabajando-plan-semanal': {
    name: 'Cómo opositar Justicia trabajando — plan semanal',
    totalTime: 'PT4M',
    steps: [
      { name: 'Lunes-Jueves: 90 min/noche', text: '45 min lectura activa + 45 min tests. Nada de leer pasivamente.' },
      { name: 'Viernes: descanso', text: 'No estudies. El descanso consolida memoria (comprobado en investigación).' },
      { name: 'Sábado: bloque largo', text: '3 horas: 1 simulacro parcial + repaso errores con explicación IA.' },
      { name: 'Domingo: planificación', text: '45 min: revisa progreso semanal y planifica los 4 bloques siguientes.' },
    ],
  },
  'como-aprobar-agente-hacienda-estrategia': {
    name: 'Cómo aprobar Agente de Hacienda Pública',
    totalTime: 'PT5M',
    steps: [
      { name: 'Dominio tributario', text: 'LGT 58/2003 + RGAGI son el núcleo: 40% del examen sale de estos dos textos.' },
      { name: 'Procedimientos', text: 'Estudia recaudación (RD 939/2005) con esquemas de plazos — el tribunal pregunta fechas exactas.' },
      { name: 'Supuesto práctico', text: 'Practica 2 casos semanales resolviéndolos por escrito antes de ver la solución.' },
      { name: 'Simulacros AEAT', text: 'Simulacros reales cada semana con penalización activada.' },
    ],
  },
  'como-aprobar-penitenciarias-estrategia-bloques': {
    name: 'Cómo aprobar Ayudante de Instituciones Penitenciarias',
    totalTime: 'PT5M',
    steps: [
      { name: 'LOGP + Reglamento', text: 'LO 1/1979 y RD 190/1996 son el corazón. Domínalos antes de tocar otros bloques.' },
      { name: 'DDHH + Constitución', text: 'Estudia Título I CE y tratados internacionales — piden aplicación concreta, no teoría.' },
      { name: 'Organización penitenciaria', text: 'Estructura SGIP, tipos de centros, régimen de vida: esquemas visuales.' },
      { name: 'Simulacros completos', text: '1 simulacro completo cada 2 semanas + tests diarios por bloque.' },
    ],
  },
  'preparar-oposiciones-administrativo-estado-c1-por-libre': {
    name: 'Cómo preparar Administrativo del Estado C1 por libre',
    totalTime: 'PT6M',
    steps: [
      { name: 'Conoce el examen INAP C1', text: '100 preguntas puntuables + 10 de reserva, penalización -1/3, supuesto práctico y ofimática.' },
      { name: 'Orden de estudio', text: 'Empieza por CE, LPAC, LRJSP y TREBEP (70% del examen) antes de pasar a derecho financiero y presupuestario.' },
      { name: 'Supuesto práctico', text: 'Practica 1 supuesto por semana sin mirar la solución durante 90 minutos cronometrados.' },
      { name: 'Ofimática avanzada', text: 'Excel avanzado (tablas dinámicas, fórmulas lógicas) + Word con estilos, índices y combinar correspondencia.' },
      { name: 'Simulacros cronometrados', text: 'Simulacros INAP 2019, 2022 y 2024 con penalización y tiempo real.' },
    ],
  },
  'guia-auxilio-judicial-2026': {
    name: 'Guía para preparar Auxilio Judicial 2026',
    totalTime: 'PT5M',
    steps: [
      { name: 'Temario oficial', text: 'Estudia los 25 temas del programa oficial MJU ordenando primero CE, LOPJ y LEC.' },
      { name: 'Derecho procesal', text: 'LEC y LECrim: muy preguntadas notificaciones, ejecución y embargos.' },
      { name: 'Tests diarios', text: '30-50 preguntas diarias con explicación IA de errores.' },
      { name: 'Simulacros MJU', text: 'Simulacros oficiales 2023-2025 cada 10 días con tiempo real.' },
    ],
  },
  'guia-tramitacion-procesal-2026': {
    name: 'Guía para preparar Tramitación Procesal 2026',
    totalTime: 'PT5M',
    steps: [
      { name: 'Domina el temario C1', text: '47 temas: CE, LOPJ, LEC y Estatuto LAJ son el núcleo.' },
      { name: 'Supuesto práctico', text: 'Redacción de diligencias, providencias y notificaciones sobre un caso simulado.' },
      { name: 'Tests + simulacros', text: 'Tests por bloque diarios + simulacros MJU completos quincenales.' },
      { name: 'Ofimática Word', text: 'Word con estilos, índices, tablas y combinar correspondencia. Es eliminatoria.' },
    ],
  },
  'preparar-oposiciones-con-inteligencia-artificial-2026': {
    name: 'Cómo preparar oposiciones con inteligencia artificial en 2026',
    totalTime: 'PT4M',
    steps: [
      { name: 'Define tu línea base', text: 'Haz un simulacro oficial real (sin IA) y registra tu nota como baseline.' },
      { name: 'Identifica debilidades con IA', text: 'Usa Radar del Tribunal y Mapa de Debilidades para ver qué leyes/temas fallas más.' },
      { name: 'Sesiones con tutor socrático', text: 'En cada error, deja que el tutor te guíe con preguntas en vez de darte la respuesta.' },
      { name: 'Repetición espaciada con flashcards', text: 'Las flashcards auto-generadas reaparecen según tu curva del olvido personal.' },
      { name: 'Simulacro periódico con penalización', text: 'Cada 10 días: simulacro oficial con IA desactivada para medir progreso real.' },
    ],
  },
  'estudiar-oposiciones-con-ia-2026-guia-practica': {
    name: 'Estudiar oposiciones con IA: guía práctica 2026',
    totalTime: 'PT5M',
    steps: [
      { name: 'Genera tests adaptativos', text: 'Pide tests por tema + dificultad. Revisa que cada pregunta tenga cita legal verificada (BOE).' },
      { name: 'Explica errores socráticamente', text: 'Cuando falles, usa el tutor socrático para descubrir el error en vez de memorizar la solución.' },
      { name: 'Usa radar de tendencias', text: 'Radar del Tribunal muestra qué artículos están cayendo más en exámenes reales recientes.' },
      { name: 'Evita academias que solo resumen', text: 'Prioriza sistemas que citen BOE verificado y permitan simulacros INAP/MJU reales.' },
    ],
  },
  'estudiar-oposicion-trabajando-8-horas-plan-2026': {
    name: 'Plan para estudiar oposición trabajando 8 horas',
    totalTime: 'PT4M',
    steps: [
      { name: 'Lunes-jueves: 90 min/noche', text: '45 min lectura activa + 45 min tests adaptativos. Nada de leer pasivamente.' },
      { name: 'Viernes: descanso', text: 'Sin estudio. El sueño consolida lo aprendido en la semana.' },
      { name: 'Sábado: bloque largo', text: '3-4 h con 1 simulacro parcial + repaso errores con IA.' },
      { name: 'Domingo: planificación', text: '45 min. Revisa métricas IPR y planifica la semana siguiente.' },
      { name: 'Vacaciones: sprint', text: 'Días libres = 5-6 h/día con simulacros oficiales cronometrados.' },
    ],
  },
  'plan-estudio-oposiciones-3-meses-vs-12-meses-2026': {
    name: 'Plan de estudio oposiciones: 3 vs 6 vs 12 meses',
    totalTime: 'PT4M',
    steps: [
      { name: 'Diagnóstico inicial', text: 'Haz un simulacro oficial para medir tu baseline antes de elegir un plan.' },
      { name: 'Plan 3 meses (intensivo)', text: '3-4 h/día. Sólo viable en oposiciones asequibles (Correos, Celador). Riesgo alto en C1/A2.' },
      { name: 'Plan 6 meses (estándar)', text: '2-3 h/día + fines de semana. Balance realista entre vida personal y progresión.' },
      { name: 'Plan 12 meses (robusto)', text: '2 h/día + fines moderados. El más sólido para C1/A2 con repetición espaciada.' },
      { name: 'Ajuste mensual', text: 'Cada 4 semanas revisa progreso (IPR, nota simulacros) y ajusta intensidad.' },
    ],
  },
}
