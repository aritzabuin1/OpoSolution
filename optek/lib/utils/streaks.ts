/**
 * lib/utils/streaks.ts — §1.13B
 *
 * Lógica de rachas y logros.
 * Llama a las RPCs de Supabase tras completar un test.
 */

import { createClient } from '@/lib/supabase/client'

export interface LogroInfo {
  tipo: string
  titulo: string
  descripcion: string
  emoji: string
}

export const LOGROS_CATALOG: Record<string, LogroInfo> = {
  primer_test: {
    tipo: 'primer_test',
    titulo: '¡Primer test!',
    descripcion: 'Completaste tu primer test en OpoRuta',
    emoji: '🎯',
  },
  racha_3: {
    tipo: 'racha_3',
    titulo: '3 días seguidos',
    descripcion: '3 días consecutivos estudiando',
    emoji: '🔥',
  },
  racha_7: {
    tipo: 'racha_7',
    titulo: 'Una semana sin falta',
    descripcion: '7 días consecutivos estudiando',
    emoji: '⚡',
  },
  racha_30: {
    tipo: 'racha_30',
    titulo: 'Mes de hierro',
    descripcion: '30 días consecutivos estudiando',
    emoji: '💎',
  },
  '50_preguntas': {
    tipo: '50_preguntas',
    titulo: '50 preguntas respondidas',
    descripcion: 'Has respondido 50 preguntas en total',
    emoji: '📝',
  },
  '100_preguntas': {
    tipo: '100_preguntas',
    titulo: '100 preguntas respondidas',
    descripcion: 'Has respondido 100 preguntas en total',
    emoji: '🏆',
  },
  nota_perfecta: {
    tipo: 'nota_perfecta',
    titulo: '¡Perfecto!',
    descripcion: 'Conseguiste un 100% en un test',
    emoji: '⭐',
  },
  primer_corrector: {
    tipo: 'primer_corrector',
    titulo: 'Primera corrección',
    descripcion: 'Usaste el corrector de desarrollos por primera vez',
    emoji: '✍️',
  },
  todos_los_temas: {
    tipo: 'todos_los_temas',
    titulo: 'Temario completo',
    descripcion: 'Hiciste al menos un test de cada tema',
    emoji: '🎓',
  },
  // §2.8.2 — Logros avanzados
  '500_preguntas': {
    tipo: '500_preguntas',
    titulo: '500 preguntas respondidas',
    descripcion: 'Has respondido 500 preguntas en total',
    emoji: '🚀',
  },
  '10_temas_completados': {
    tipo: '10_temas_completados',
    titulo: 'Explorando el temario',
    descripcion: 'Has practicado en 10 temas distintos',
    emoji: '📚',
  },
  todas_notas_sobre_7: {
    tipo: 'todas_notas_sobre_7',
    titulo: 'Excelencia total',
    descripcion: 'Todos tus temas practicados con nota media ≥70%',
    emoji: '🌟',
  },
}

/**
 * Llama a las RPCs update_streak + check_and_grant_logros tras completar un test.
 * Retorna los logros nuevamente desbloqueados (para mostrar toast).
 */
export async function postTestActions(userId: string): Promise<LogroInfo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // 1. Actualizar racha
  await supabase.rpc('update_streak', { p_user_id: userId })

  // 2. Verificar y conceder logros
  const { data: nuevosLogros } = await supabase.rpc('check_and_grant_logros', {
    p_user_id: userId,
  })

  if (!nuevosLogros || !Array.isArray(nuevosLogros)) return []

  return (nuevosLogros as string[])
    .map((tipo) => LOGROS_CATALOG[tipo])
    .filter(Boolean)
}
