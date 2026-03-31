/**
 * lib/ingles/types.ts — §6.6
 *
 * Tipos para el motor determinista de ingles (Guardia Civil).
 */

export type CategoriaIngles =
  | 'grammar_tenses'
  | 'grammar_prepositions'
  | 'grammar_articles'
  | 'grammar_comparatives'
  | 'grammar_modals'
  | 'grammar_conditionals'
  | 'vocabulary_police'
  | 'vocabulary_general'
  | 'reading_comprehension'

export type Dificultad = 1 | 2 | 3

export interface InglesItem {
  categoria: CategoriaIngles
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  dificultad: Dificultad
}

export interface InglesQuestion {
  id: string
  categoria: CategoriaIngles
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  dificultad: Dificultad
}
