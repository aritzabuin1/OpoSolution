/**
 * lib/ai/schemas.ts — OPTEK §1.6.6
 *
 * Schemas Zod para validar respuestas JSON de Claude.
 * Garantizan que el output de la IA cumple el contrato de tipos antes de
 * ser procesado por la aplicación — defensa en profundidad contra alucinaciones
 * o respuestas malformadas.
 *
 * Principios aplicados:
 *   - Falla rápido: safeParse() antes de cualquier procesamiento
 *   - Errores descriptivos: Zod genera mensajes de error legibles en CI/logs
 *   - Tipos inferidos: z.infer<> para evitar duplicación con types/ai.ts
 */

import { z } from 'zod'

// ─── Cita Legal ───────────────────────────────────────────────────────────────

export const CitaLegalSchema = z.object({
  ley: z.string().min(1),
  articulo: z.string().min(1),
  apartado: z.string().optional(),
  textoExacto: z.string().min(1),
})

// ─── Pregunta MCQ ─────────────────────────────────────────────────────────────

export const PreguntaSchema = z.object({
  enunciado: z.string().min(10),
  opciones: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correcta: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explicacion: z.string().min(10),
  /** Cita legal verificada. Ausente en preguntas de Bloque II (ofimática) y psicotécnicas. */
  cita: CitaLegalSchema.optional(),
  /** Dificultad individual de la pregunta (disponible desde prompt v1.8.0) */
  dificultad: z.enum(['facil', 'media', 'dificil']).optional(),
})

// ─── Test generado (§1.6.6) ──────────────────────────────────────────────────

/**
 * Schema para la respuesta completa de generate-test.
 * Claude devuelve un objeto con un array de preguntas.
 */
export const TestGeneradoRawSchema = z.object({
  preguntas: z.array(PreguntaSchema).min(1).max(30),
})

// ─── Corrección de desarrollo (§1.6.6) ───────────────────────────────────────

/**
 * Schema para la respuesta de correct-desarrollo.
 * Incluye tres dimensiones de evaluación para feedback granular.
 */
export const CorreccionDesarrolloRawSchema = z.object({
  puntuacion: z.number().min(0).max(10),
  feedback: z.string().min(20),
  mejoras: z.array(z.string()).min(1).max(5),
  citas_usadas: z.array(CitaLegalSchema),
  dimension_juridica: z.number().min(0).max(10),
  dimension_argumentacion: z.number().min(0).max(10),
  dimension_estructura: z.number().min(0).max(10),
})

// ─── §2.12 Caza-Trampas ───────────────────────────────────────────────────────

export const ErrorInyectadoSchema = z.object({
  tipo: z.enum(['plazo', 'porcentaje', 'sujeto', 'verbo', 'cifra', 'otro']),
  valor_original: z.string().min(1),
  valor_trampa: z.string().min(1),
  explicacion: z.string().min(5),
})

export const CazaTrampasRawSchema = z.object({
  texto_trampa: z.string().min(20),
  errores_reales: z.array(ErrorInyectadoSchema).min(1).max(5),
})

export type ErrorInyectado = z.infer<typeof ErrorInyectadoSchema>
export type CazaTrampasRaw = z.infer<typeof CazaTrampasRawSchema>

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type TestGeneradoRaw = z.infer<typeof TestGeneradoRawSchema>
export type CorreccionDesarrolloRaw = z.infer<typeof CorreccionDesarrolloRawSchema>
export type PreguntaRaw = z.infer<typeof PreguntaSchema>
export type CitaLegalRaw = z.infer<typeof CitaLegalSchema>
