/**
 * tests/unit/radar-temas.test.ts
 *
 * Tests for Path C keyword classification (classifyByTema).
 * Validates that questions are correctly classified into temas 1-28.
 */

import { describe, it, expect } from 'vitest'
import { classifyByTema, TEMA_KEYWORDS } from '@/execution/build-radar-tribunal'

describe('classifyByTema — Bloque I (Legislación)', () => {
  it('classifies Constitución as tema 1', () => {
    expect(classifyByTema('Según la Constitución Española, el artículo 14...')).toContain(1)
  })

  it('classifies CE abbreviation as tema 1', () => {
    expect(classifyByTema('El art. 14 CE garantiza la igualdad')).toContain(1)
  })

  it('classifies Tribunal Constitucional as tema 2', () => {
    expect(classifyByTema('El Tribunal Constitucional es el intérprete supremo')).toContain(2)
  })

  it('classifies LOTC as tema 2', () => {
    expect(classifyByTema('Según la LOTC, los magistrados son...')).toContain(2)
  })

  it('classifies Cortes Generales as tema 3', () => {
    expect(classifyByTema('Las Cortes Generales representan al pueblo español')).toContain(3)
  })

  it('classifies Congreso as tema 3', () => {
    expect(classifyByTema('El Congreso de los Diputados aprueba los presupuestos')).toContain(3)
  })

  it('classifies LPAC as tema 11', () => {
    expect(classifyByTema('Según la LPAC, el procedimiento administrativo...')).toContain(11)
  })

  it('classifies Ley 39/2015 as tema 11', () => {
    expect(classifyByTema('La Ley 39/2015 regula el procedimiento administrativo común')).toContain(11)
  })

  it('classifies TREBEP as tema 13', () => {
    expect(classifyByTema('El TREBEP establece el estatuto básico del empleado público')).toContain(13)
  })

  it('classifies protección de datos as tema 12', () => {
    expect(classifyByTema('La protección de datos personales está regulada por...')).toContain(12)
  })

  it('classifies presupuesto as tema 15', () => {
    expect(classifyByTema('Los presupuestos generales del Estado se aprueban...')).toContain(15)
  })

  it('classifies igualdad as tema 16', () => {
    expect(classifyByTema('La igualdad entre hombres y mujeres es un derecho fundamental')).toContain(16)
  })
})

describe('classifyByTema — Bloque II (Ofimática)', () => {
  it('classifies Word as tema 24', () => {
    expect(classifyByTema('En Word, para insertar una tabla de contenido...')).toContain(24)
  })

  it('classifies procesador de texto as tema 24', () => {
    expect(classifyByTema('El procesador de texto permite combinar correspondencia')).toContain(24)
  })

  it('classifies Excel as tema 25', () => {
    expect(classifyByTema('En Excel, la función BUSCARV permite...')).toContain(25)
  })

  it('classifies hoja de cálculo as tema 25', () => {
    expect(classifyByTema('Una hoja de cálculo contiene celdas organizadas en filas')).toContain(25)
  })

  it('classifies Access as tema 26', () => {
    expect(classifyByTema('En Access, una base de datos relacional contiene tablas')).toContain(26)
  })

  it('classifies Outlook as tema 27', () => {
    expect(classifyByTema('En Outlook, la bandeja de entrada muestra los correos')).toContain(27)
  })

  it('classifies correo electrónico as tema 27', () => {
    expect(classifyByTema('El correo electrónico permite enviar mensajes')).toContain(27)
  })

  it('classifies Internet/navegador as tema 28', () => {
    expect(classifyByTema('Un navegador web permite acceder a páginas de internet')).toContain(28)
  })

  it('classifies administración electrónica as tema 20', () => {
    expect(classifyByTema('La sede electrónica permite realizar trámites con certificado digital')).toContain(20)
  })

  it('classifies Windows as tema 22', () => {
    expect(classifyByTema('En Windows 10, la barra de tareas se encuentra en...')).toContain(22)
  })

  it('classifies hardware/software as tema 21', () => {
    expect(classifyByTema('La CPU es un componente fundamental del hardware')).toContain(21)
  })

  it('classifies atención al público as tema 17', () => {
    expect(classifyByTema('La atención al público en las oficinas de la AGE...')).toContain(17)
  })
})

describe('classifyByTema — multi-tema + edge cases', () => {
  it('can match multiple temas from one question', () => {
    const result = classifyByTema('Según la Constitución, el procedimiento administrativo de la LPAC...')
    expect(result).toContain(1) // CE
    expect(result).toContain(11) // LPAC
  })

  it('returns empty array for unclassifiable question', () => {
    expect(classifyByTema('¿Cuál de las siguientes afirmaciones es correcta?')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(classifyByTema('SEGÚN LA CONSTITUCIÓN ESPAÑOLA')).toContain(1)
  })

  it('TEMA_KEYWORDS covers all 28 temas', () => {
    const temasWithKeywords = new Set(TEMA_KEYWORDS.map(k => k.temaNumero))
    for (let i = 1; i <= 28; i++) {
      expect(temasWithKeywords.has(i)).toBe(true)
    }
  })
})
