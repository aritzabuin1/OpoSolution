/**
 * tests/unit/banco-progresivo.test.ts
 *
 * Tests del banco progresivo de tests y supuestos.
 * Verifica que el tracking es preciso, que se sirven las preguntas/supuestos
 * correctos, y que la generación con IA solo ocurre cuando es necesaria.
 *
 * CRITICO: de este sistema depende que el gasto en IA tienda a €0.
 */

import { describe, it, expect } from 'vitest'

// ─── Helpers que simulan la lógica del banco ────────────────────────────────

/**
 * Simula la decisión del banco progresivo de TESTS.
 * Reproduce la lógica exacta de generate-test/route.ts líneas ~449-535.
 */
function decideBancoTest(params: {
  totalInBank: number
  unseenByUser: number
  numPreguntasPedidas: number
}): 'serve_bank' | 'generate_ai' {
  const { totalInBank, unseenByUser, numPreguntasPedidas } = params
  const unseenRatio = totalInBank > 0 ? unseenByUser / totalInBank : 0

  if (unseenByUser >= numPreguntasPedidas && unseenRatio > 0.10) {
    return 'serve_bank'
  }
  return 'generate_ai'
}

/**
 * Simula la decisión del banco progresivo de SUPUESTOS.
 * Reproduce la lógica de generate-supuesto-test/route.ts.
 */
function decideBancoSupuesto(params: {
  totalInBank: number
  seenByUser: number
  hasCredits: boolean
  isAdmin: boolean
}): 'serve_bank' | 'paywall_credito' | 'generate_ai' {
  const { totalInBank, seenByUser, hasCredits, isAdmin } = params
  const unseen = totalInBank - seenByUser

  if (unseen > 0) return 'serve_bank'
  if (!hasCredits && !isAdmin) return 'paywall_credito'
  return 'generate_ai'
}

/**
 * Simula el tracking de preguntas vistas para tests.
 * Un Set de question_ids que el usuario ha visto.
 */
function createQuestionTracker() {
  const seen = new Set<string>()
  return {
    markSeen(ids: string[]) { ids.forEach(id => seen.add(id)) },
    getUnseen(allIds: string[]) { return allIds.filter(id => !seen.has(id)) },
    seenCount() { return seen.size },
    hasSeen(id: string) { return seen.has(id) },
  }
}

/**
 * Simula el tracking de supuestos vistos.
 */
function createSupuestoTracker() {
  const seen = new Set<string>()
  return {
    markSeen(id: string) { seen.add(id) },
    getUnseen(allIds: string[]) { return allIds.filter(id => !seen.has(id)) },
    seenCount() { return seen.size },
    hasSeen(id: string) { return seen.has(id) },
  }
}

// ─── TESTS: Banco Progresivo de Tests por Tema ─────────────────────────────

describe('Banco Progresivo de Tests', () => {
  describe('Decisión banco vs IA', () => {
    it('sirve del banco si hay suficientes sin ver y <90% visto', () => {
      expect(decideBancoTest({ totalInBank: 50, unseenByUser: 40, numPreguntasPedidas: 10 }))
        .toBe('serve_bank')
    })

    it('sirve del banco con 20 preguntas pedidas', () => {
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 30, numPreguntasPedidas: 20 }))
        .toBe('serve_bank')
    })

    it('sirve del banco con 30 preguntas pedidas si hay suficientes', () => {
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 35, numPreguntasPedidas: 30 }))
        .toBe('serve_bank')
    })

    it('genera con IA si no hay suficientes sin ver (20 < 30 pedidas)', () => {
      expect(decideBancoTest({ totalInBank: 50, unseenByUser: 20, numPreguntasPedidas: 30 }))
        .toBe('generate_ai')
    })

    it('genera con IA si ha visto ≥90% del banco', () => {
      // 8 sin ver de 100 = 8% → ≤10% → genera con IA
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 8, numPreguntasPedidas: 5 }))
        .toBe('generate_ai')
    })

    it('genera con IA si ha visto exactamente 90% del banco', () => {
      // 10 sin ver de 100 = 10% → exactamente 10% → ≤10% → genera con IA
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 10, numPreguntasPedidas: 10 }))
        .toBe('generate_ai')
    })

    it('sirve del banco si ha visto 89% (justo por encima del threshold)', () => {
      // 11 sin ver de 100 = 11% → >10% → sirve
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 11, numPreguntasPedidas: 10 }))
        .toBe('serve_bank')
    })

    it('genera con IA si el banco está vacío', () => {
      expect(decideBancoTest({ totalInBank: 0, unseenByUser: 0, numPreguntasPedidas: 10 }))
        .toBe('generate_ai')
    })

    it('genera con IA si tiene 0 sin ver (ha visto todo)', () => {
      expect(decideBancoTest({ totalInBank: 50, unseenByUser: 0, numPreguntasPedidas: 10 }))
        .toBe('generate_ai')
    })
  })

  describe('Tracking de preguntas vistas', () => {
    it('trackea preguntas vistas correctamente', () => {
      const tracker = createQuestionTracker()
      const allQuestions = ['q1', 'q2', 'q3', 'q4', 'q5']

      // Aún no ha visto nada
      expect(tracker.getUnseen(allQuestions)).toEqual(allQuestions)
      expect(tracker.seenCount()).toBe(0)

      // Ve 3 preguntas
      tracker.markSeen(['q1', 'q2', 'q3'])
      expect(tracker.getUnseen(allQuestions)).toEqual(['q4', 'q5'])
      expect(tracker.seenCount()).toBe(3)
      expect(tracker.hasSeen('q1')).toBe(true)
      expect(tracker.hasSeen('q4')).toBe(false)
    })

    it('no duplica preguntas vistas', () => {
      const tracker = createQuestionTracker()
      tracker.markSeen(['q1', 'q2'])
      tracker.markSeen(['q2', 'q3']) // q2 ya estaba
      expect(tracker.seenCount()).toBe(3) // no 4
    })

    it('nunca sirve una pregunta ya vista', () => {
      const tracker = createQuestionTracker()
      const banco = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']

      // Test 1: recibe q1-q5
      const test1 = tracker.getUnseen(banco).slice(0, 5)
      tracker.markSeen(test1)
      expect(test1).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'])

      // Test 2: recibe q6-q10 (NUNCA q1-q5)
      const test2 = tracker.getUnseen(banco).slice(0, 5)
      tracker.markSeen(test2)
      expect(test2).toEqual(['q6', 'q7', 'q8', 'q9', 'q10'])

      // Test 3: no quedan sin ver
      const test3 = tracker.getUnseen(banco)
      expect(test3).toEqual([])
    })
  })

  describe('Flujo completo con 2 usuarios', () => {
    it('User 2 recibe preguntas del banco sin generar IA', () => {
      const banco: string[] = []
      const trackerUser1 = createQuestionTracker()
      const trackerUser2 = createQuestionTracker()

      // Seed: 20 preguntas iniciales
      for (let i = 1; i <= 20; i++) banco.push(`seed-q${i}`)

      // User 1: 2 tests de 10 → agota el banco
      const u1test1 = trackerUser1.getUnseen(banco).slice(0, 10)
      trackerUser1.markSeen(u1test1)
      expect(u1test1.length).toBe(10)

      const u1test2 = trackerUser1.getUnseen(banco).slice(0, 10)
      trackerUser1.markSeen(u1test2)
      expect(u1test2.length).toBe(10)

      // User 1: banco agotado, genera con IA → 10 nuevas entran al banco
      expect(trackerUser1.getUnseen(banco).length).toBe(0)
      const decision = decideBancoTest({ totalInBank: 20, unseenByUser: 0, numPreguntasPedidas: 10 })
      expect(decision).toBe('generate_ai')

      // Simular generación IA
      for (let i = 1; i <= 10; i++) banco.push(`ai-q${i}`)
      expect(banco.length).toBe(30)

      // User 2: ve las 30 (20 seed + 10 de User 1) SIN generar IA
      const u2unseen = trackerUser2.getUnseen(banco)
      expect(u2unseen.length).toBe(30)

      // User 2: test 1 de 10
      const u2test1 = u2unseen.slice(0, 10)
      trackerUser2.markSeen(u2test1)
      const decisionU2 = decideBancoTest({ totalInBank: 30, unseenByUser: 20, numPreguntasPedidas: 10 })
      expect(decisionU2).toBe('serve_bank') // 20/30 = 67% sin ver → sirve del banco

      // User 2: test 2 de 10
      trackerUser2.markSeen(trackerUser2.getUnseen(banco).slice(0, 10))
      const decisionU2b = decideBancoTest({ totalInBank: 30, unseenByUser: 10, numPreguntasPedidas: 10 })
      expect(decisionU2b).toBe('serve_bank') // 10/30 = 33% → sirve

      // User 2: test 3 de 10 → quedan 0 → genera IA
      trackerUser2.markSeen(trackerUser2.getUnseen(banco).slice(0, 10))
      const decisionU2c = decideBancoTest({ totalInBank: 30, unseenByUser: 0, numPreguntasPedidas: 10 })
      expect(decisionU2c).toBe('generate_ai')
    })
  })

  describe('Edge cases tests', () => {
    it('banco con exactamente el número pedido → sirve (ratio > 10%)', () => {
      expect(decideBancoTest({ totalInBank: 10, unseenByUser: 10, numPreguntasPedidas: 10 }))
        .toBe('serve_bank') // 10/10 = 100% sin ver
    })

    it('banco con 1 más de lo pedido → sirve', () => {
      expect(decideBancoTest({ totalInBank: 11, unseenByUser: 11, numPreguntasPedidas: 10 }))
        .toBe('serve_bank')
    })

    it('banco con 1 menos de lo pedido → genera IA', () => {
      expect(decideBancoTest({ totalInBank: 10, unseenByUser: 9, numPreguntasPedidas: 10 }))
        .toBe('generate_ai')
    })

    it('pide 30 preguntas con banco pequeño → genera IA', () => {
      expect(decideBancoTest({ totalInBank: 25, unseenByUser: 25, numPreguntasPedidas: 30 }))
        .toBe('generate_ai')
    })

    it('threshold 90%: 91 de 100 vistas → genera IA', () => {
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 9, numPreguntasPedidas: 5 }))
        .toBe('generate_ai')
    })

    it('threshold 90%: 89 de 100 vistas → sirve banco', () => {
      expect(decideBancoTest({ totalInBank: 100, unseenByUser: 11, numPreguntasPedidas: 10 }))
        .toBe('serve_bank')
    })
  })
})

// ─── TESTS: Banco Progresivo de Supuestos ──────────────────────────────────

describe('Banco Progresivo de Supuestos', () => {
  describe('Decisión banco vs paywall vs IA', () => {
    it('sirve del banco si hay sin ver', () => {
      expect(decideBancoSupuesto({ totalInBank: 10, seenByUser: 5, hasCredits: false, isAdmin: false }))
        .toBe('serve_bank')
    })

    it('sirve del banco si queda exactamente 1 sin ver', () => {
      expect(decideBancoSupuesto({ totalInBank: 10, seenByUser: 9, hasCredits: false, isAdmin: false }))
        .toBe('serve_bank')
    })

    it('paywall si ha visto todos y no tiene créditos', () => {
      expect(decideBancoSupuesto({ totalInBank: 10, seenByUser: 10, hasCredits: false, isAdmin: false }))
        .toBe('paywall_credito')
    })

    it('genera con IA si ha visto todos y tiene créditos', () => {
      expect(decideBancoSupuesto({ totalInBank: 10, seenByUser: 10, hasCredits: true, isAdmin: false }))
        .toBe('generate_ai')
    })

    it('admin puede generar sin créditos', () => {
      expect(decideBancoSupuesto({ totalInBank: 10, seenByUser: 10, hasCredits: false, isAdmin: true }))
        .toBe('generate_ai')
    })

    it('banco vacío sin créditos → paywall', () => {
      expect(decideBancoSupuesto({ totalInBank: 0, seenByUser: 0, hasCredits: false, isAdmin: false }))
        .toBe('paywall_credito')
    })

    it('banco vacío con créditos → genera IA', () => {
      expect(decideBancoSupuesto({ totalInBank: 0, seenByUser: 0, hasCredits: true, isAdmin: false }))
        .toBe('generate_ai')
    })
  })

  describe('Tracking de supuestos vistos', () => {
    it('trackea supuestos vistos correctamente', () => {
      const tracker = createSupuestoTracker()
      const banco = ['s1', 's2', 's3', 's4', 's5']

      expect(tracker.getUnseen(banco)).toEqual(banco)
      expect(tracker.seenCount()).toBe(0)

      tracker.markSeen('s1')
      tracker.markSeen('s3')
      expect(tracker.getUnseen(banco)).toEqual(['s2', 's4', 's5'])
      expect(tracker.seenCount()).toBe(2)
    })

    it('nunca sirve un supuesto ya visto como "nuevo"', () => {
      const tracker = createSupuestoTracker()
      const banco = ['s1', 's2', 's3']

      // Pide 3 veces
      for (let i = 0; i < 3; i++) {
        const unseen = tracker.getUnseen(banco)
        expect(unseen.length).toBe(3 - i)
        tracker.markSeen(unseen[0])
      }

      // Ya no quedan
      expect(tracker.getUnseen(banco)).toEqual([])
    })

    it('no duplica en el tracker', () => {
      const tracker = createSupuestoTracker()
      tracker.markSeen('s1')
      tracker.markSeen('s1') // idempotente
      expect(tracker.seenCount()).toBe(1)
    })
  })

  describe('Flujo completo: la trampa del modelo de negocio', () => {
    it('User 1 genera, User 2 y 3 reciben gratis', () => {
      const banco: string[] = []
      const trackers = [createSupuestoTracker(), createSupuestoTracker(), createSupuestoTracker()]

      // Seed: 10 supuestos
      for (let i = 1; i <= 10; i++) banco.push(`seed-${i}`)

      // User 1: ve los 10 → incluidos en pack (€0)
      for (const id of banco) trackers[0].markSeen(id)
      expect(trackers[0].getUnseen(banco).length).toBe(0)

      // User 1: quiere más → paga 1 crédito → genera con IA
      let decision = decideBancoSupuesto({ totalInBank: 10, seenByUser: 10, hasCredits: true, isAdmin: false })
      expect(decision).toBe('generate_ai')
      banco.push('ai-1') // se genera y entra al banco
      trackers[0].markSeen('ai-1')

      // User 1: paga otro crédito → otra generación
      banco.push('ai-2')
      trackers[0].markSeen('ai-2')
      // Banco = 12 supuestos

      // User 2: ve los 10 del seed gratis
      for (let i = 0; i < 10; i++) {
        const unseen = trackers[1].getUnseen(banco)
        expect(unseen.length).toBeGreaterThan(0)
        trackers[1].markSeen(unseen[0])
      }
      expect(trackers[1].seenCount()).toBe(10)

      // User 2: quiere más → paga 1 crédito → RECIBE el de User 1 (€0 IA!)
      decision = decideBancoSupuesto({ totalInBank: 12, seenByUser: 10, hasCredits: true, isAdmin: false })
      expect(decision).toBe('serve_bank') // HAY 2 sin ver → sirve del banco, NO genera
      const u2unseen = trackers[1].getUnseen(banco)
      expect(u2unseen).toContain('ai-1') // el generado por User 1
      expect(u2unseen).toContain('ai-2')

      // User 3: tiene 12 para ver, todo gratis
      expect(trackers[2].getUnseen(banco).length).toBe(12)

      // User 3: ve los 12 sin pagar nada extra
      for (const id of banco) trackers[2].markSeen(id)
      decision = decideBancoSupuesto({ totalInBank: 12, seenByUser: 12, hasCredits: false, isAdmin: false })
      expect(decision).toBe('paywall_credito') // sin créditos → paywall
    })

    it('el cobro de crédito solo ocurre cuando NO hay unseen (no en servir del banco)', () => {
      const banco = ['s1', 's2', 's3', 's4', 's5']
      const tracker = createSupuestoTracker()

      // Primeros 5: sirve del banco (€0 IA, €0 créditos)
      for (let i = 0; i < 5; i++) {
        const decision = decideBancoSupuesto({
          totalInBank: banco.length,
          seenByUser: tracker.seenCount(),
          hasCredits: true,
          isAdmin: false,
        })
        expect(decision).toBe('serve_bank') // NO genera, NO cobra crédito
        tracker.markSeen(tracker.getUnseen(banco)[0])
      }

      // 6°: no hay unseen → genera con IA → cobra 1 crédito
      const decision = decideBancoSupuesto({
        totalInBank: banco.length,
        seenByUser: tracker.seenCount(),
        hasCredits: true,
        isAdmin: false,
      })
      expect(decision).toBe('generate_ai') // ahora sí genera y cobra
    })
  })

  describe('Edge cases supuestos', () => {
    it('banco vacío, no créditos → paywall', () => {
      expect(decideBancoSupuesto({ totalInBank: 0, seenByUser: 0, hasCredits: false, isAdmin: false }))
        .toBe('paywall_credito')
    })

    it('ha visto más que el total (dato corrupto) → paywall', () => {
      // Esto no debería pasar, pero si pasa, unseen = max(0, 5-8) = 0 en el código real
      // Aquí simulamos: seenByUser > totalInBank → 0 unseen
      expect(decideBancoSupuesto({ totalInBank: 5, seenByUser: 8, hasCredits: false, isAdmin: false }))
        .toBe('paywall_credito')
    })

    it('puede repetir supuesto ya visto (mode=repeat) sin afectar tracking', () => {
      const tracker = createSupuestoTracker()
      const banco = ['s1', 's2']

      tracker.markSeen('s1')
      expect(tracker.seenCount()).toBe(1)

      // "Repetir" s1 no cambia el tracking
      // (en el código real, mode='repeat' no inserta en user_supuestos_seen)
      expect(tracker.hasSeen('s1')).toBe(true)
      expect(tracker.getUnseen(banco)).toEqual(['s2']) // s2 sigue sin ver
    })

    it('nuevo supuesto generado por User A aparece como unseen para User B', () => {
      const banco = ['s1', 's2', 's3']
      const trackerA = createSupuestoTracker()
      const trackerB = createSupuestoTracker()

      // User A ve todo y genera 1 nuevo
      for (const id of banco) trackerA.markSeen(id)
      banco.push('ai-new')
      trackerA.markSeen('ai-new')

      // User B: ai-new aparece como sin ver
      expect(trackerB.getUnseen(banco)).toContain('ai-new')
      expect(trackerB.seenCount()).toBe(0) // User B no ha visto nada
    })
  })
})

// ─── TESTS: Deduplicación del banco ────────────────────────────────────────

describe('Deduplicación al guardar en banco', () => {
  // Simula el filtro de dedup antes de guardar
  function filterDuplicates(
    newQuestions: { enunciado: string; hash: string }[],
    existingHashes: Set<string>
  ): { enunciado: string; hash: string }[] {
    return newQuestions.filter(q => !existingHashes.has(q.hash))
  }

  it('no mete preguntas con hash duplicado', () => {
    const existing = new Set(['hash-a', 'hash-b', 'hash-c'])
    const newQ = [
      { enunciado: 'Nueva', hash: 'hash-d' },
      { enunciado: 'Duplicada', hash: 'hash-a' }, // ya existe
      { enunciado: 'Otra nueva', hash: 'hash-e' },
    ]

    const filtered = filterDuplicates(newQ, existing)
    expect(filtered).toHaveLength(2)
    expect(filtered.map(q => q.hash)).toEqual(['hash-d', 'hash-e'])
  })

  it('todas nuevas → todas entran', () => {
    const existing = new Set(['hash-x'])
    const newQ = [
      { enunciado: 'A', hash: 'hash-a' },
      { enunciado: 'B', hash: 'hash-b' },
    ]
    expect(filterDuplicates(newQ, existing)).toHaveLength(2)
  })

  it('todas duplicadas → ninguna entra', () => {
    const existing = new Set(['hash-a', 'hash-b'])
    const newQ = [
      { enunciado: 'A', hash: 'hash-a' },
      { enunciado: 'B', hash: 'hash-b' },
    ]
    expect(filterDuplicates(newQ, existing)).toHaveLength(0)
  })

  it('el banco crece solo con preguntas únicas', () => {
    const bancoHashes = new Set<string>()

    // Ronda 1: 10 preguntas, todas nuevas
    const ronda1 = Array.from({ length: 10 }, (_, i) => ({
      enunciado: `Q${i}`, hash: `hash-${i}`,
    }))
    const filtered1 = filterDuplicates(ronda1, bancoHashes)
    expect(filtered1).toHaveLength(10)
    filtered1.forEach(q => bancoHashes.add(q.hash))

    // Ronda 2: 10 preguntas, 7 nuevas + 3 duplicadas
    const ronda2 = [
      ...Array.from({ length: 7 }, (_, i) => ({ enunciado: `R2-${i}`, hash: `hash-r2-${i}` })),
      { enunciado: 'Dup1', hash: 'hash-0' }, // duplicada de ronda 1
      { enunciado: 'Dup2', hash: 'hash-1' },
      { enunciado: 'Dup3', hash: 'hash-2' },
    ]
    const filtered2 = filterDuplicates(ronda2, bancoHashes)
    expect(filtered2).toHaveLength(7) // solo las 7 nuevas
    filtered2.forEach(q => bancoHashes.add(q.hash))

    expect(bancoHashes.size).toBe(17) // 10 + 7
  })
})
