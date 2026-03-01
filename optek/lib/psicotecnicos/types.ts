/**
 * lib/psicotecnicos/types.ts — §1.3B
 *
 * Tipos compartidos para el motor determinista de psicotécnicos.
 * Las preguntas psicotécnicas no usan IA ni citas legales.
 */

export type Dificultad = 1 | 2 | 3

export type CategoriaPsicotecnico =
  | 'numerico'
  | 'series'
  | 'verbal'
  | 'organizacion'

export type SubtipoPsicotecnico =
  // Numérico
  | 'regla_tres'
  | 'porcentaje'
  | 'fraccion'
  | 'descuento'
  // Series
  | 'serie_aritmetica'
  | 'serie_geometrica'
  | 'serie_fibonacci'
  | 'serie_alternante'
  // Verbal
  | 'sinonimo'
  | 'antonimo'
  // Organización
  | 'intruso'
  | 'ordenacion'

/**
 * Pregunta psicotécnica generada de forma determinista.
 * Compatible con `Pregunta` de types/ai.ts salvo que no tiene `cita`.
 */
export interface PsicotecnicoQuestion {
  id: string
  categoria: CategoriaPsicotecnico
  subtipo: SubtipoPsicotecnico
  enunciado: string
  opciones: [string, string, string, string]
  /** Índice (0-3) de la opción correcta en el array opciones. */
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  dificultad: Dificultad
}
