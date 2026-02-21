export type CompraEstado = 'completada' | 'pendiente' | 'fallida'

export type SuscripcionEstado = 'activa' | 'cancelada' | 'expirada'

export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precioCentimos: number
  tipo: 'tema' | 'pack_oposicion' | 'subscription'
}

export interface CompraEstadoDetalle {
  userId: string
  temaId?: string
  oposicionId: string
  estado: CompraEstado
  fecha: string
}
