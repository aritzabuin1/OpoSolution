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
}
