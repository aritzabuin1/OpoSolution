/**
 * tests/unit/estudiar.test.ts — FASE 13
 *
 * Tests para la feature "Estudiar":
 * - Agrupaciones: completitud y estructura
 * - Resolver: bloques por tema con/sin legislación
 * - Prompts: generación correcta
 * - Helpers: parseRango, articuloInRango
 */

import { describe, it, expect } from 'vitest'
import { AGRUPACIONES, getAgrupaciones, getLeyesConAgrupaciones } from '@/lib/estudiar/agrupaciones'
import { SYSTEM_ESTUDIAR, SYSTEM_PROFUNDIZAR, buildEstudiarPrompt, buildProfundizarPrompt } from '@/lib/estudiar/prompts'

// ─── Agrupaciones ───────────────────────────────────────────────────────────

describe('agrupaciones', () => {
  it('should have agrupaciones for key laws', () => {
    const leyes = getLeyesConAgrupaciones()
    expect(leyes).toContain('CE')
    expect(leyes).toContain('BOE-A-2015-10565')  // LPAC
    expect(leyes).toContain('BOE-A-2015-10566')  // LRJSP
    expect(leyes).toContain('BOE-A-2015-11719')  // TREBEP
    expect(leyes).toContain('BOE-A-1995-25444')  // CP
    expect(leyes).toContain('BOE-A-1986-6859')   // FCSE
    expect(leyes).toContain('BOE-A-2015-3442')   // Seg. Ciudadana
  })

  it('should return empty array for unknown ley', () => {
    expect(getAgrupaciones('NONEXISTENT')).toEqual([])
  })

  it('CE should have 15 blocks covering the full constitution', () => {
    const ce = getAgrupaciones('CE')
    expect(ce.length).toBe(15)
    // First block is Título Preliminar
    expect(ce[0].titulo).toContain('Preliminar')
    // Last block is Reforma Constitucional
    expect(ce[ce.length - 1].titulo).toContain('Reforma')
  })

  it('every block should have required fields', () => {
    for (const [ley, bloques] of Object.entries(AGRUPACIONES)) {
      for (const b of bloques) {
        expect(b.ley).toBe(ley)
        expect(b.rango).toBeTruthy()
        expect(b.titulo).toBeTruthy()
        expect(b.articulosAprox).toBeGreaterThan(0)
      }
    }
  })

  it('LPAC should have 8 blocks', () => {
    const lpac = getAgrupaciones('BOE-A-2015-10565')
    expect(lpac.length).toBe(8)
  })

  it('blocks within a ley should not have duplicate rangos', () => {
    for (const [ley, bloques] of Object.entries(AGRUPACIONES)) {
      const rangos = bloques.map(b => b.rango)
      const unique = new Set(rangos)
      expect(unique.size).toBe(rangos.length)
    }
  })
})

// ─── Prompts ────────────────────────────────────────────────────────────────

describe('prompts', () => {
  it('SYSTEM_ESTUDIAR should mention all 7 required sections', () => {
    expect(SYSTEM_ESTUDIAR).toContain('Contexto')
    expect(SYSTEM_ESTUDIAR).toContain('Conceptos clave')
    expect(SYSTEM_ESTUDIAR).toContain('Esquema visual')
    expect(SYSTEM_ESTUDIAR).toContain('más preguntados')
    expect(SYSTEM_ESTUDIAR).toContain('Trampas frecuentes')
    expect(SYSTEM_ESTUDIAR).toContain('mnemotécnicas')
    expect(SYSTEM_ESTUDIAR).toContain('Conexiones')
  })

  it('SYSTEM_PROFUNDIZAR should mention all 5 response sections', () => {
    expect(SYSTEM_PROFUNDIZAR).toContain('Respuesta directa')
    expect(SYSTEM_PROFUNDIZAR).toContain('Explicación detallada')
    expect(SYSTEM_PROFUNDIZAR).toContain('Ejemplo práctico')
    expect(SYSTEM_PROFUNDIZAR).toContain('Pregunta tipo test')
    expect(SYSTEM_PROFUNDIZAR).toContain('Conexión')
  })

  it('buildEstudiarPrompt should include all articles', () => {
    const prompt = buildEstudiarPrompt('CE', '14-29', 'Derechos Fundamentales', [
      { numero: '14', texto_integro: 'Los españoles son iguales...', titulo_capitulo: 'Título I Cap. II' },
      { numero: '15', texto_integro: 'Todos tienen derecho a la vida...', titulo_capitulo: 'Título I Cap. II' },
    ])

    expect(prompt).toContain('CE')
    expect(prompt).toContain('arts. 14-29')
    expect(prompt).toContain('Artículo 14')
    expect(prompt).toContain('Artículo 15')
    expect(prompt).toContain('Los españoles son iguales')
    expect(prompt).toContain('derecho a la vida')
  })

  it('buildProfundizarPrompt should include main article and context', () => {
    const prompt = buildProfundizarPrompt(
      { numero: '14', texto_integro: 'Igualdad ante la ley', ley_nombre: 'CE' },
      '¿Qué significa igualdad material?',
      [
        { numero: '13', texto_integro: 'Extranjeros...' },
        { numero: '15', texto_integro: 'Derecho a la vida...' },
      ]
    )

    expect(prompt).toContain('CE, Art. 14')
    expect(prompt).toContain('Igualdad ante la ley')
    expect(prompt).toContain('igualdad material')
    expect(prompt).toContain('Art. 13')
    expect(prompt).toContain('Art. 15')
  })

  it('buildProfundizarPrompt should work without context', () => {
    const prompt = buildProfundizarPrompt(
      { numero: '14', texto_integro: 'Igualdad', ley_nombre: 'CE' },
      '¿Pregunta?',
      []
    )
    expect(prompt).toContain('CE, Art. 14')
    expect(prompt).not.toContain('ADYACENTES')
  })
})

// ─── Resolver helpers (imported indirectly via module) ──────────────────────

describe('resolver helpers', () => {
  // We test the resolver's internal logic via the exported function
  // by mocking the Supabase client

  function createMockSupabase(legislacionRows: unknown[], resumenRows: unknown[], ctRows: unknown[]) {
    return new Proxy({}, {
      get(_target, prop) {
        if (prop !== 'from') return undefined
        return (table: string) => {
          const rows = table === 'legislacion'
            ? legislacionRows
            : table === 'resumen_legislacion'
              ? resumenRows
              : table === 'conocimiento_tecnico'
                ? ctRows
                : []

          const chain: Record<string, unknown> = {}
          chain.select = () => chain
          chain.contains = () => chain
          chain.in = () => chain
          chain.eq = () => chain
          chain.neq = () => chain
          chain.order = () => chain
          chain.single = () => Promise.resolve({ data: rows.length === 1 ? rows[0] : null })
          // Intercept the resolved promise
          chain.then = (resolve: (v: unknown) => void) => resolve({ data: rows, error: null })
          return chain
        }
      },
    })
  }

  it('should return empty array for tema with no legislacion or CT', async () => {
    const { resolverBloquesPorTema } = await import('@/lib/estudiar/resolver')
    const mock = createMockSupabase([], [], [])
    const result = await resolverBloquesPorTema(mock, 'test-tema-id')
    expect(result).toEqual([])
  })

  it('should return conocimiento_tecnico blocks for non-legislative temas', async () => {
    const { resolverBloquesPorTema } = await import('@/lib/estudiar/resolver')
    const mock = createMockSupabase([], [], [
      { id: 'ct-1', titulo: 'Ofimática: Word', contenido: 'Resumen de Word...' },
    ])
    const result = await resolverBloquesPorTema(mock, 'test-tema-id')
    expect(result.length).toBe(1)
    expect(result[0].tipo).toBe('conocimiento_tecnico')
    expect(result[0].generado).toBe(true)
    expect(result[0].contenido).toContain('Word')
  })
})
