/**
 * tests/unit/scoring.test.ts — GAP-3
 *
 * Tests unitarios para el motor de scoring configurable (lib/utils/scoring.ts).
 *
 * Cobertura:
 *   - Single exercise: backward compatible (AGE C2)
 *   - Single exercise: sin penalización (Correos)
 *   - Multi-exercise: 2 ejercicios (Auxilio Judicial)
 *   - Multi-exercise: 3 ejercicios (Tramitación Procesal)
 *   - Multi-exercise: scalar fallback (solo primer ejercicio)
 *   - min_aprobado: pass/fail por ejercicio
 *   - aprobado global: requiere TODOS los ejercicios
 *   - describePenalizacion: single, multi, sin penalización, por índice
 *   - parseScoringConfig: valid, null, empty
 *   - getDuracionMinutos: proporcional
 *   - EjercicioData[] overload
 */

import { describe, it, expect } from 'vitest'
import {
  calcularEjercicio,
  calcularPuntuacion,
  describePenalizacion,
  parseScoringConfig,
  getDuracionMinutos,
  resolveMinAprobado,
  formatMinAprobado,
  DEFAULT_SCORING_CONFIG,
  type ScoringConfig,
  type EjercicioData,
} from '@/lib/utils/scoring'

// ─── Configs ──────────────────────────────────────────────────────────────────

/** AGE C2: 1 ejercicio, penaliza 1/3 */
const AGE_C2: ScoringConfig = {
  ejercicios: [{
    nombre: 'Test teórico',
    preguntas: 100,
    minutos: 70,
    acierto: 1.0,
    error: 0.333,
    max: 100,
    min_aprobado: null,
    penaliza: true,
  }],
}

/** Correos: 1 ejercicio, sin penalización */
const CORREOS: ScoringConfig = {
  ejercicios: [{
    nombre: 'Test',
    preguntas: 100,
    minutos: 110,
    acierto: 0.60,
    error: 0,
    max: 60,
    min_aprobado: null,
    penaliza: false,
  }],
}

/** Correos con min_aprobado como objeto (real DB config) */
const CORREOS_OBJECT_MIN: ScoringConfig = {
  ejercicios: [{
    nombre: 'Test',
    preguntas: 100,
    minutos: 110,
    acierto: 0.60,
    error: 0,
    max: 60,
    min_aprobado: { reparto: 33, atc: 36 },
    penaliza: false,
  }],
}

/** Auxilio Judicial C2: 2 ejercicios */
const AUXILIO: ScoringConfig = {
  ejercicios: [
    {
      nombre: 'Test teórico',
      preguntas: 100,
      minutos: 75,
      acierto: 0.60,
      error: 0.15,
      max: 60,
      min_aprobado: 30,
      penaliza: true,
    },
    {
      nombre: 'Supuesto práctico',
      preguntas: 40,
      minutos: 60,
      acierto: 1.0,
      error: 0.25,
      max: 40,
      min_aprobado: 20,
      penaliza: true,
    },
  ],
}

/** Tramitación Procesal C1: 3 ejercicios */
const TRAMITACION: ScoringConfig = {
  ejercicios: [
    {
      nombre: 'Test teórico',
      preguntas: 100,
      minutos: 75,
      acierto: 0.60,
      error: 0.15,
      max: 60,
      min_aprobado: 30,
      penaliza: true,
    },
    {
      nombre: 'Supuesto práctico',
      preguntas: 10,
      minutos: 30,
      acierto: 2.0,
      error: 0.50,
      max: 20,
      min_aprobado: 10,
      penaliza: true,
    },
    {
      nombre: 'Ofimática',
      preguntas: 20,
      minutos: 40,
      acierto: 1.0,
      error: 0.25,
      max: 20,
      min_aprobado: 10,
      penaliza: true,
    },
  ],
}

// ─── calcularEjercicio ───────────────────────────────────────────────────────

describe('calcularEjercicio', () => {
  it('AGE C2: 80 aciertos, 10 errores, 10 en blanco', () => {
    const r = calcularEjercicio(80, 10, 10, AGE_C2.ejercicios[0])
    expect(r.puntosDirectos).toBeCloseTo(76.67, 1)
    expect(r.notaSobreMax).toBeCloseTo(76.67, 1)
    expect(r.penaliza).toBe(true)
    expect(r.aprobado).toBeNull() // no min_aprobado
  })

  it('Correos: sin penalización', () => {
    const r = calcularEjercicio(70, 30, 0, CORREOS.ejercicios[0])
    // 70 * 0.60 = 42, no penalty
    expect(r.puntosDirectos).toBe(42)
    expect(r.notaSobreMax).toBe(42) // 42/60 * 60 = 42
    expect(r.penaliza).toBe(false)
  })

  it('Auxilio Ej.1: pasa min_aprobado', () => {
    const r = calcularEjercicio(70, 20, 10, AUXILIO.ejercicios[0])
    // 70*0.60 - 20*0.15 = 42 - 3 = 39. notaSobreMax = (39/60)*60 = 39
    expect(r.puntosDirectos).toBe(39)
    expect(r.aprobado).toBe(true) // 39 >= 30
  })

  it('Auxilio Ej.1: no pasa min_aprobado', () => {
    const r = calcularEjercicio(40, 40, 20, AUXILIO.ejercicios[0])
    // 40*0.60 - 40*0.15 = 24 - 6 = 18. notaSobreMax = (18/60)*60 = 18
    expect(r.puntosDirectos).toBe(18)
    expect(r.aprobado).toBe(false) // 18 < 30
  })

  it('0 aciertos → 0 puntos (no negativo)', () => {
    const r = calcularEjercicio(0, 50, 50, AGE_C2.ejercicios[0])
    expect(r.puntosDirectos).toBe(0)
    expect(r.notaSobreMax).toBe(0)
  })
})

// ─── calcularPuntuacion — scalar overload ────────────────────────────────────

describe('calcularPuntuacion (scalar)', () => {
  it('backward compatible: no config → DEFAULT_SCORING_CONFIG', () => {
    const r = calcularPuntuacion(80, 10, 10)
    expect(r.ejercicios).toHaveLength(1)
    expect(r.penaliza).toBe(true)
    expect(r.maxTotal).toBe(100)
  })

  it('single exercise config', () => {
    const r = calcularPuntuacion(70, 30, 0, CORREOS)
    expect(r.ejercicios).toHaveLength(1)
    expect(r.ejercicios[0].puntosDirectos).toBe(42)
    expect(r.maxTotal).toBe(60)
    expect(r.penaliza).toBe(false)
  })

  it('multi-exercise config with scalar → only scores first exercise', () => {
    const r = calcularPuntuacion(70, 20, 10, AUXILIO)
    expect(r.ejercicios).toHaveLength(1) // only first
    expect(r.ejercicios[0].nombre).toBe('Test teórico')
    expect(r.maxTotal).toBe(100) // 60 + 40 = total of all exercises
  })
})

// ─── calcularPuntuacion — array overload ─────────────────────────────────────

describe('calcularPuntuacion (EjercicioData[])', () => {
  it('Auxilio: 2 ejercicios, ambos pasan', () => {
    const data: EjercicioData[] = [
      { aciertos: 70, errores: 20, enBlanco: 10 }, // Ej.1: 39/60
      { aciertos: 30, errores: 5, enBlanco: 5 },   // Ej.2: 30*1 - 5*0.25 = 28.75/40
    ]
    const r = calcularPuntuacion(data, AUXILIO)
    expect(r.ejercicios).toHaveLength(2)
    expect(r.ejercicios[0].nombre).toBe('Test teórico')
    expect(r.ejercicios[1].nombre).toBe('Supuesto práctico')
    expect(r.ejercicios[0].aprobado).toBe(true) // 39 >= 30
    expect(r.ejercicios[1].aprobado).toBe(true) // 28.75 >= 20
    expect(r.aprobado).toBe(true) // all pass
    expect(r.maxTotal).toBe(100) // 60 + 40
    expect(r.notaTotal).toBeCloseTo(39 + 28.75, 0)
  })

  it('Auxilio: 2 ejercicios, uno falla min_aprobado → aprobado=false', () => {
    const data: EjercicioData[] = [
      { aciertos: 70, errores: 20, enBlanco: 10 }, // Ej.1: 39/60 → pass
      { aciertos: 10, errores: 20, enBlanco: 10 },  // Ej.2: 10-5=5/40 → fail
    ]
    const r = calcularPuntuacion(data, AUXILIO)
    expect(r.ejercicios[0].aprobado).toBe(true)
    expect(r.ejercicios[1].aprobado).toBe(false)
    expect(r.aprobado).toBe(false) // one failed
  })

  it('Tramitación: 3 ejercicios', () => {
    const data: EjercicioData[] = [
      { aciertos: 80, errores: 10, enBlanco: 10 }, // Ej.1
      { aciertos: 8, errores: 1, enBlanco: 1 },    // Ej.2
      { aciertos: 15, errores: 3, enBlanco: 2 },   // Ej.3
    ]
    const r = calcularPuntuacion(data, TRAMITACION)
    expect(r.ejercicios).toHaveLength(3)
    expect(r.maxTotal).toBe(100) // 60 + 20 + 20
    expect(r.penaliza).toBe(true)
    // All should have scores
    r.ejercicios.forEach(ej => {
      expect(ej.notaSobreMax).toBeGreaterThan(0)
    })
  })

  it('missing exercise data → defaults to 0 aciertos', () => {
    const data: EjercicioData[] = [
      { aciertos: 70, errores: 20, enBlanco: 10 },
      // Ej.2 missing
    ]
    const r = calcularPuntuacion(data, AUXILIO)
    expect(r.ejercicios).toHaveLength(2)
    expect(r.ejercicios[1].aciertos).toBe(0)
    expect(r.ejercicios[1].notaSobreMax).toBe(0)
  })

  it('notaSobre10 is normalized across all exercises', () => {
    const data: EjercicioData[] = [
      { aciertos: 100, errores: 0, enBlanco: 0 }, // max Ej.1 = 60
      { aciertos: 40, errores: 0, enBlanco: 0 },  // max Ej.2 = 40
    ]
    const r = calcularPuntuacion(data, AUXILIO)
    // Perfect score: 60+40 = 100/100 → notaSobre10 = 10
    expect(r.notaTotal).toBe(100)
    expect(r.notaSobre10).toBe(10)
  })
})

// ─── describePenalizacion ────────────────────────────────────────────────────

describe('describePenalizacion', () => {
  it('null config → default AGE description', () => {
    const desc = describePenalizacion(null)
    expect(desc).toContain('1/3')
  })

  it('single exercise sin penalización', () => {
    const desc = describePenalizacion(CORREOS)
    expect(desc).toContain('Sin penalización')
  })

  it('single exercise con penalización', () => {
    const desc = describePenalizacion(AGE_C2)
    expect(desc).toContain('1/3')
    expect(desc).not.toContain('Test teórico:') // no prefix for single
  })

  it('multi-exercise: shows all exercises separated by |', () => {
    const desc = describePenalizacion(AUXILIO)
    expect(desc).toContain('Test teórico:')
    expect(desc).toContain('Supuesto práctico:')
    expect(desc).toContain('|')
  })

  it('ejercicioIndex: returns only that exercise', () => {
    const desc = describePenalizacion(AUXILIO, 1)
    expect(desc).toContain('Supuesto práctico:')
    expect(desc).not.toContain('Test teórico')
  })
})

// ─── parseScoringConfig ──────────────────────────────────────────────────────

describe('parseScoringConfig', () => {
  it('valid config', () => {
    const raw = { ejercicios: [{ nombre: 'Test', preguntas: 100 }] }
    expect(parseScoringConfig(raw)).not.toBeNull()
  })

  it('null → null', () => {
    expect(parseScoringConfig(null)).toBeNull()
  })

  it('empty ejercicios → null', () => {
    expect(parseScoringConfig({ ejercicios: [] })).toBeNull()
  })

  it('not object → null', () => {
    expect(parseScoringConfig('string')).toBeNull()
  })
})

// ─── getDuracionMinutos ──────────────────────────────────────────────────────

describe('getDuracionMinutos', () => {
  it('proportional from config', () => {
    // AGE C2: 100 preguntas = 70 min → 20 preguntas = 14 min
    expect(getDuracionMinutos(20, AGE_C2)).toBe(14)
  })

  it('no config → legacy fallback', () => {
    const mins = getDuracionMinutos(110)
    expect(mins).toBe(90)
  })

  it('minimum 5 minutes', () => {
    expect(getDuracionMinutos(1)).toBeGreaterThanOrEqual(5)
  })
})

// ─── resolveMinAprobado ─────────────────────────────────────────────────────

describe('resolveMinAprobado', () => {
  it('null → null', () => {
    expect(resolveMinAprobado(null)).toBeNull()
  })

  it('undefined → null', () => {
    expect(resolveMinAprobado(undefined)).toBeNull()
  })

  it('number → returns as-is', () => {
    expect(resolveMinAprobado(30)).toBe(30)
  })

  it('object → returns highest value', () => {
    expect(resolveMinAprobado({ reparto: 33, atc: 36 })).toBe(36)
  })

  it('object with single entry', () => {
    expect(resolveMinAprobado({ unico: 25 })).toBe(25)
  })
})

// ─── formatMinAprobado ──────────────────────────────────────────────────────

describe('formatMinAprobado', () => {
  it('null → empty string', () => {
    expect(formatMinAprobado(null)).toBe('')
  })

  it('number → string number', () => {
    expect(formatMinAprobado(30)).toBe('30')
  })

  it('object → formatted categories', () => {
    const result = formatMinAprobado({ reparto: 33, atc: 36 })
    expect(result).toContain('33 (reparto)')
    expect(result).toContain('36 (atc)')
    expect(result).toContain(' / ')
  })
})

// ─── calcularEjercicio with object min_aprobado ─────────────────────────────

describe('calcularEjercicio — object min_aprobado (Correos)', () => {
  it('80 aciertos: aprobado true (exceeds highest threshold)', () => {
    const r = calcularEjercicio(80, 20, 0, CORREOS_OBJECT_MIN.ejercicios[0])
    // 80 * 0.60 = 48. notaSobreMax = (48/60)*60 = 48
    expect(r.puntosDirectos).toBe(48)
    expect(r.notaSobreMax).toBe(48)
    expect(r.aprobado).toBe(true) // 48 >= 36 (highest threshold)
  })

  it('55 aciertos: aprobado false (below highest threshold)', () => {
    const r = calcularEjercicio(55, 45, 0, CORREOS_OBJECT_MIN.ejercicios[0])
    // 55 * 0.60 = 33. notaSobreMax = (33/60)*60 = 33
    expect(r.puntosDirectos).toBe(33)
    expect(r.notaSobreMax).toBe(33)
    expect(r.aprobado).toBe(false) // 33 < 36
  })

  it('does not crash when min_aprobado is an object', () => {
    // This was the Correos crash bug — min_aprobado as object
    expect(() => {
      calcularEjercicio(70, 30, 0, CORREOS_OBJECT_MIN.ejercicios[0])
    }).not.toThrow()
  })
})
