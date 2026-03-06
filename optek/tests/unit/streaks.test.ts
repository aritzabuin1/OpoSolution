/**
 * tests/unit/streaks.test.ts
 *
 * Tests unitarios para LOGROS_CATALOG y postTestActions.
 *
 * Cobertura:
 *   - LOGROS_CATALOG: completitud, estructura de cada logro
 *   - postTestActions: llama RPCs correctas, mapea logros, maneja errores
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LOGROS_CATALOG } from '@/lib/utils/streaks'

// Mock de createClient para postTestActions
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: null }),
  })),
}))

describe('LOGROS_CATALOG', () => {
  const expectedLogros = [
    'primer_test', 'racha_3', 'racha_7', 'racha_30',
    '50_preguntas', '100_preguntas', 'nota_perfecta',
    'primer_corrector', 'todos_los_temas',
    '500_preguntas', '10_temas_completados', 'todas_notas_sobre_7',
  ]

  it('contiene los 12 logros esperados', () => {
    expect(Object.keys(LOGROS_CATALOG)).toHaveLength(12)
  })

  it.each(expectedLogros)('logro "%s" existe con estructura completa', (tipo) => {
    const logro = LOGROS_CATALOG[tipo]
    expect(logro).toBeDefined()
    expect(logro.tipo).toBe(tipo)
    expect(logro.titulo).toBeTruthy()
    expect(logro.descripcion).toBeTruthy()
    expect(logro.emoji).toBeTruthy()
  })

  it('cada emoji tiene exactamente 1 carácter visual', () => {
    for (const logro of Object.values(LOGROS_CATALOG)) {
      // Emojis can be multi-codepoint but should be visually 1 char
      expect(logro.emoji.length).toBeGreaterThan(0)
      expect(logro.emoji.length).toBeLessThanOrEqual(2) // Some emojis are 2 UTF-16 code units
    }
  })

  it('no hay tipos duplicados', () => {
    const tipos = Object.values(LOGROS_CATALOG).map((l) => l.tipo)
    expect(new Set(tipos).size).toBe(tipos.length)
  })
})

describe('postTestActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna array vacío si RPCs devuelven null', async () => {
    const { postTestActions } = await import('@/lib/utils/streaks')
    const result = await postTestActions('user-123')
    expect(result).toEqual([])
  })

  it('mapea logros devueltos por RPC al catálogo', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const mockRpc = vi.fn()
      .mockResolvedValueOnce({ data: null }) // update_streak
      .mockResolvedValueOnce({ data: ['primer_test', 'racha_3'] }) // check_and_grant_logros

    vi.mocked(createClient).mockReturnValue({ rpc: mockRpc } as any)

    const { postTestActions } = await import('@/lib/utils/streaks')
    const result = await postTestActions('user-123')

    expect(result).toHaveLength(2)
    expect(result[0].tipo).toBe('primer_test')
    expect(result[1].tipo).toBe('racha_3')
  })

  it('filtra logros desconocidos (no en catálogo)', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const mockRpc = vi.fn()
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: ['primer_test', 'logro_inexistente'] })

    vi.mocked(createClient).mockReturnValue({ rpc: mockRpc } as any)

    const { postTestActions } = await import('@/lib/utils/streaks')
    const result = await postTestActions('user-123')

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('primer_test')
  })
})
