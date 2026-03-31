/**
 * lib/ortografia/types.ts — §6.5
 *
 * Tipos para el motor determinista de ortografía (Guardia Civil).
 */

export type CategoriaOrtografia =
  | 'acentuacion'
  | 'b_v'
  | 'h'
  | 'g_j'
  | 'll_y'
  | 'c_z_s'
  | 'mayusculas'
  | 'puntuacion'
  | 'homofonos'

export type Dificultad = 1 | 2 | 3

export interface OrtografiaItem {
  categoria: CategoriaOrtografia
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  dificultad: Dificultad
}

export interface OrtografiaQuestion {
  id: string
  categoria: CategoriaOrtografia
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  dificultad: Dificultad
}
