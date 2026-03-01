/**
 * tests/unit/boe-watcher.test.ts — §2.13.13, §2.13.14
 *
 * Tests unitarios para watchAllLeyes().
 * Supabase, fetchHTML, parseLey y logger se mockean completamente.
 *
 * Cobertura:
 *   §2.13.13  HTML con artículo modificado → detecta cambio, INSERT cambios_legislativos, notifica usuarios
 *   §2.13.14  Hash idéntico → no crea notificaciones ni inserta cambios
 *   Extra     Error en scraping → skip ley silenciosamente (no lanza error)
 *   Extra     Artículo no encontrado en scrape → skip
 *   Extra     Sin artículos activos en BD → resultado vacío
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockFetchHTML,
  mockParseLey,
} = vi.hoisted(() => ({
  mockFetchHTML: vi.fn(),
  mockParseLey: vi.fn(),
}))

vi.mock('@/execution/boe-scraper', () => ({
  fetchHTML: mockFetchHTML,
  parseLey: mockParseLey,
}))

// Supabase mock: tabla → función → chainable
const mockSupabaseCalls: Record<string, () => unknown> = {}
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        const handler = mockSupabaseCalls[table]
        if (handler) return handler()
        throw new Error(`Unexpected table in boe-watcher mock: ${table}`)
      },
    })
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

// ─── Import bajo test ─────────────────────────────────────────────────────────

import { watchAllLeyes } from '@/lib/ai/boe-watcher'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

const TEXTO_ORIGINAL = 'Artículo 14. El plazo para resolver será de tres meses a contar desde el día siguiente a su notificación.'
const TEXTO_MODIFICADO = 'Artículo 14. El plazo para resolver será de seis meses a contar desde el día siguiente a su notificación.'

const articuloBase = {
  id: 'leg-001',
  ley_codigo: 'BOE-A-2015-10565',
  ley_nombre: 'LPAC',
  ley_nombre_completo: 'Ley 39/2015',
  articulo_numero: '14',
  apartado: null,
  texto_integro: TEXTO_ORIGINAL,
  hash_sha256: sha256(TEXTO_ORIGINAL),
  tema_ids: ['tema-001'],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('watchAllLeyes — §2.13.14 sin cambios (hash idéntico)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no crea cambios_legislativos si hash es idéntico', async () => {
    const insertCambiosMock = vi.fn()

    mockSupabaseCalls['legislacion'] = () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [articuloBase], error: null }),
        }),
      }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    })
    mockSupabaseCalls['cambios_legislativos'] = () => ({
      insert: insertCambiosMock,
    })

    // Parser devuelve el MISMO texto → hash idéntico → sin cambio
    mockFetchHTML.mockResolvedValue('<html>sin cambios</html>')
    mockParseLey.mockReturnValue({
      articulos: [{ numero: '14', texto_integro: TEXTO_ORIGINAL }],
    })

    const result = await watchAllLeyes()

    expect(result.cambiosDetectados).toBe(0)
    expect(result.notificacionesCreadas).toBe(0)
    expect(result.articulosComprobados).toBe(1)
    expect(insertCambiosMock).not.toHaveBeenCalled()
  })
})

describe('watchAllLeyes — §2.13.13 detección de cambios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detecta cambio de hash y crea entrada en cambios_legislativos + notificaciones a usuarios', async () => {
    const insertCambiosMock = vi.fn().mockResolvedValue({ error: null })
    const insertNotifMock = vi.fn().mockResolvedValue({ error: null })
    const updateLegMock = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) })

    // Mock legislacion: primero select (query), luego update
    let legislacionCallCount = 0
    mockSupabaseCalls['legislacion'] = () => {
      legislacionCallCount++
      if (legislacionCallCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [articuloBase], error: null }),
            }),
          }),
        }
      }
      return { update: updateLegMock }
    }

    mockSupabaseCalls['cambios_legislativos'] = () => ({
      insert: insertCambiosMock,
    })

    mockSupabaseCalls['tests_generados'] = () => ({
      select: () => ({
        overlaps: () => ({
          limit: () => Promise.resolve({
            data: [{ user_id: 'user-001' }, { user_id: 'user-002' }],
            error: null,
          }),
        }),
      }),
    })

    mockSupabaseCalls['notificaciones'] = () => ({
      insert: insertNotifMock,
    })

    // Parser devuelve texto MODIFICADO → hash diferente
    mockFetchHTML.mockResolvedValue('<html>modificado</html>')
    mockParseLey.mockReturnValue({
      articulos: [{ numero: '14', texto_integro: TEXTO_MODIFICADO }],
    })

    const result = await watchAllLeyes()

    expect(result.cambiosDetectados).toBe(1)
    expect(result.notificacionesCreadas).toBe(2) // 2 usuarios notificados
    expect(result.articulosComprobados).toBe(1)

    // Verificar que INSERT fue llamado con los datos correctos
    expect(insertCambiosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        legislacion_id: 'leg-001',
        texto_anterior: TEXTO_ORIGINAL,
        texto_nuevo: TEXTO_MODIFICADO,
        tipo_cambio: 'modificacion',
        procesado: false,
        notificacion_enviada: false,
      })
    )

    // Verificar que las notificaciones incluyen el tipo correcto
    expect(insertNotifMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tipo: 'boe_cambio', leida: false }),
      ])
    )
  })
})

describe('watchAllLeyes — manejo de errores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('salta la ley si fetchHTML lanza error (sin propagar)', async () => {
    mockSupabaseCalls['legislacion'] = () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [articuloBase], error: null }),
        }),
      }),
    })

    mockFetchHTML.mockRejectedValue(new Error('HTTP 503 Service Unavailable'))

    const result = await watchAllLeyes()

    expect(result.cambiosDetectados).toBe(0)
    expect(result.articulosComprobados).toBe(1)
    // No debe lanzar error
  })

  it('salta artículo si no aparece en el resultado del scrape', async () => {
    const insertCambiosMock = vi.fn()
    mockSupabaseCalls['legislacion'] = () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [articuloBase], error: null }),
        }),
      }),
    })
    mockSupabaseCalls['cambios_legislativos'] = () => ({ insert: insertCambiosMock })

    mockFetchHTML.mockResolvedValue('<html>ok</html>')
    // Parser devuelve artículo con número distinto → no matchea
    mockParseLey.mockReturnValue({
      articulos: [{ numero: '99', texto_integro: 'otro texto' }],
    })

    const result = await watchAllLeyes()

    expect(result.cambiosDetectados).toBe(0)
    expect(insertCambiosMock).not.toHaveBeenCalled()
  })

  it('retorna vacío si no hay artículos activos en BD', async () => {
    mockSupabaseCalls['legislacion'] = () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    })

    const result = await watchAllLeyes()

    expect(result.articulosComprobados).toBe(0)
    expect(result.cambiosDetectados).toBe(0)
    expect(result.notificacionesCreadas).toBe(0)
  })
})
