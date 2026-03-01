/**
 * tests/unit/gdpr.test.ts — OPTEK §1.17.3, §1.17.4
 *
 * Tests unitarios para los endpoints GDPR de exportación y borrado de cuenta.
 * Todos los mocks de Supabase son in-memory (sin conexión real).
 *
 * Cobertura:
 *   §1.17.3  GET /api/user/export — exporta todos los datos del usuario
 *   §1.17.4  DELETE /api/user/delete — anonimiza compras, borra el resto, elimina auth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks hoisted — disponibles antes del hoisting de vi.mock() ──────────────

const {
  mockGetUser,
  mockFromExport,
  mockFromDelete,
  mockDeleteUser,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFromExport: vi.fn(),      // from() en el cliente de export
  mockFromDelete: vi.fn(),      // from() en el service client de delete
  mockDeleteUser: vi.fn(),
}))

// Mock Supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFromExport,
    })
  ),
  createServiceClient: vi.fn().mockImplementation(() =>
    Promise.resolve({
      from: mockFromDelete,
      auth: { admin: { deleteUser: mockDeleteUser } },
    })
  ),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: vi.fn().mockReturnValue({
      debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    }),
  },
}))

// ─── Import bajo test (después de todos los mocks) ────────────────────────────

import { GET } from '@/app/api/user/export/route'
import { DELETE } from '@/app/api/user/delete/route'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_FIXTURE = {
  id: 'user-uuid-gdpr-001',
  email: 'test@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

// ─── Helpers para construir cadenas Supabase fluidas ──────────────────────────

/** Builder fluido para queries de selección (profiles, tests_generados, etc.) */
function makeSelectBuilder(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    // Para queries que se awaitan directamente (.order() sin .single())
    then: (resolve: (v: { data: unknown; error: unknown }) => void) => resolve({ data, error }),
  }
  return builder
}

/** Builder fluido para operaciones de escritura (update, delete). */
function makeWriteBuilder(error: unknown = null) {
  const builder = {
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  }
  return builder
}

// ─────────────────────────────────────────────────────────────────────────────
// §1.17.3 — GET /api/user/export
// ─────────────────────────────────────────────────────────────────────────────

describe('§1.17.3 — GET /api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Por defecto: usuario autenticado
    mockGetUser.mockResolvedValue({ data: { user: USER_FIXTURE }, error: null })

    // Por defecto: todas las tablas devuelven datos vacíos sin error
    mockFromExport.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return makeSelectBuilder({ id: USER_FIXTURE.id, free_tests_used: 0 })
      }
      return makeSelectBuilder([])
    })
  })

  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })

    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autenticado')
  })

  it('devuelve 200 con header Content-Disposition como attachment .json', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    const contentDisposition = res.headers.get('Content-Disposition') ?? ''
    expect(contentDisposition).toContain('attachment')
    expect(contentDisposition).toContain('.json')
  })

  it('el JSON exportado contiene las 7 secciones de datos requeridas', async () => {
    const res = await GET()
    expect(res.status).toBe(200)

    const text = await res.text()
    const body = JSON.parse(text) as Record<string, unknown>

    expect(body).toHaveProperty('exportado_el')
    expect(body).toHaveProperty('version_schema', '1.0')
    expect(body).toHaveProperty('usuario')
    expect(body).toHaveProperty('perfil')
    expect(body).toHaveProperty('tests_realizados')
    expect(body).toHaveProperty('correcciones')
    expect(body).toHaveProperty('compras')
    expect(body).toHaveProperty('suscripciones')
    expect(body).toHaveProperty('preguntas_reportadas')
    expect(body).toHaveProperty('logros')
  })

  it('el campo usuario contiene id y email del usuario autenticado', async () => {
    const res = await GET()
    const body = JSON.parse(await res.text()) as Record<string, unknown>

    const usuario = body.usuario as Record<string, string>
    expect(usuario.id).toBe(USER_FIXTURE.id)
    expect(usuario.email).toBe(USER_FIXTURE.email)
  })

  it('incluye datos de tests_generados en tests_realizados', async () => {
    mockFromExport.mockImplementation((table: string) => {
      if (table === 'profiles') return makeSelectBuilder({ id: USER_FIXTURE.id })
      if (table === 'tests_generados') return makeSelectBuilder([{ id: 't1' }, { id: 't2' }])
      return makeSelectBuilder([])
    })

    const res = await GET()
    const body = JSON.parse(await res.text()) as Record<string, unknown>

    expect((body.tests_realizados as unknown[]).length).toBe(2)
  })

  it('devuelve 500 si falla una consulta de BD durante el export', async () => {
    // Simular error de BD lanzando una excepción dentro del try/catch del route
    mockFromExport.mockImplementation(() => {
      throw new Error('DB connection timeout')
    })

    const res = await GET()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// §1.17.4 — DELETE /api/user/delete
// ─────────────────────────────────────────────────────────────────────────────

describe('§1.17.4 — DELETE /api/user/delete', () => {
  // Registrar llamadas para verificar orden GDPR
  const callOrder: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    callOrder.length = 0

    // Por defecto: usuario autenticado
    mockGetUser.mockResolvedValue({ data: { user: USER_FIXTURE }, error: null })

    // Por defecto: todas las operaciones de BD succeeden
    mockFromDelete.mockImplementation((table: string) => {
      callOrder.push(table)
      if (table === 'compras') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return makeWriteBuilder(null)
    })

    // Por defecto: auth.admin.deleteUser OK
    mockDeleteUser.mockImplementation(() => {
      callOrder.push('auth.deleteUser')
      return Promise.resolve({ data: {}, error: null })
    })
  })

  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Not auth') })

    const res = await DELETE()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autenticado')
  })

  it('devuelve 200 con mensaje de confirmación cuando todo es correcto', async () => {
    const res = await DELETE()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Cuenta eliminada correctamente')
  })

  it('GDPR: anonimiza compras (user_id → null) preservando registro fiscal', async () => {
    let updateCalledWith: unknown = null

    mockFromDelete.mockImplementation((table: string) => {
      if (table === 'compras') {
        return {
          update: vi.fn().mockImplementation((data: unknown) => {
            updateCalledWith = data
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            }
          }),
        }
      }
      return makeWriteBuilder(null)
    })

    const res = await DELETE()
    expect(res.status).toBe(200)

    // Verificar que se anonimizó con user_id: null (cumplimiento LGT 4 años)
    expect(updateCalledWith).toEqual({ user_id: null })
  })

  it('GDPR: auth.admin.deleteUser se llama como ÚLTIMO paso', async () => {
    const res = await DELETE()
    expect(res.status).toBe(200)

    // El borrado de auth debe ocurrir después de los datos
    const authIndex = callOrder.indexOf('auth.deleteUser')
    const comprasIndex = callOrder.indexOf('compras')
    expect(authIndex).toBeGreaterThan(-1)
    expect(comprasIndex).toBeGreaterThan(-1)
    expect(comprasIndex).toBeLessThan(authIndex)
  })

  it('devuelve 500 con mensaje específico si falla auth.admin.deleteUser', async () => {
    mockDeleteUser.mockResolvedValue({
      data: null,
      error: new Error('Admin API error'),
    })

    const res = await DELETE()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('autenticación')
  })

  it('devuelve 500 si falla la anonimización de compras (primer paso GDPR)', async () => {
    mockFromDelete.mockImplementation((table: string) => {
      if (table === 'compras') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('FK violation') }),
          }),
        }
      }
      return makeWriteBuilder(null)
    })

    const res = await DELETE()
    expect(res.status).toBe(500)
  })
})
