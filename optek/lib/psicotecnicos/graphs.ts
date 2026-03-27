/**
 * lib/psicotecnicos/graphs.ts
 *
 * Generador de interpretación de gráficos/datos para psicotécnicos de Correos.
 * Presenta una tabla de datos numéricos + preguntas de cálculo e interpretación.
 *
 * En el examen real de Correos se presentan gráficos de barras o tablas con datos
 * de ventas, envíos, plazos, etc. Aquí usamos tablas de texto (no imágenes)
 * que replican el mismo tipo de razonamiento.
 *
 * Tipos:
 *   - tabla_datos: tabla con datos + preguntas de lectura/comparación
 *   - calculo_grafico: tabla + preguntas que requieren cálculos (%, diferencias, medias)
 */

import { randomUUID } from 'node:crypto'
import { rnd, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Banco de tablas ────────────────────────────────────────────────────────

interface TablaEntry {
  titulo: string
  encabezados: string[]
  filas: (string | number)[][]
  preguntas: {
    enunciado: string
    correcta: string
    distractores: [string, string, string]
    subtipo: 'tabla_datos' | 'calculo_grafico'
  }[]
  dificultad: 1 | 2 | 3
}

function formatTabla(t: TablaEntry): string {
  const header = t.encabezados.join(' | ')
  const sep = t.encabezados.map(() => '---').join(' | ')
  const rows = t.filas.map(f => f.join(' | ')).join('\n')
  return `${t.titulo}\n\n${header}\n${sep}\n${rows}`
}

const BANCO_TABLAS: TablaEntry[] = [
  {
    titulo: 'Envíos procesados por el Centro de Tratamiento Automatizado (CTA) de Madrid — Semana 12/2025',
    encabezados: ['Día', 'Cartas', 'Paquetes', 'Certificados'],
    filas: [
      ['Lunes', 12400, 3200, 1800],
      ['Martes', 11800, 3500, 2100],
      ['Miércoles', 13200, 2900, 1950],
      ['Jueves', 10500, 4100, 2300],
      ['Viernes', 14600, 3800, 2050],
    ],
    preguntas: [
      { enunciado: '¿Qué día se procesaron más cartas?', correcta: 'Viernes (14.600)', distractores: ['Miércoles (13.200)', 'Lunes (12.400)', 'Martes (11.800)'], subtipo: 'tabla_datos' },
      { enunciado: '¿Cuántos paquetes se procesaron en total durante la semana?', correcta: '17.500', distractores: ['15.800', '18.200', '16.900'], subtipo: 'calculo_grafico' },
      { enunciado: '¿Qué día hubo más certificados que paquetes?', correcta: 'Ningún día', distractores: ['Lunes', 'Miércoles', 'Viernes'], subtipo: 'tabla_datos' },
    ],
    dificultad: 1,
  },
  {
    titulo: 'Reclamaciones recibidas por oficinas de Correos — Primer trimestre 2025',
    encabezados: ['Mes', 'Pérdida', 'Retraso', 'Daño', 'Otros'],
    filas: [
      ['Enero', 45, 120, 30, 15],
      ['Febrero', 38, 95, 25, 12],
      ['Marzo', 52, 140, 35, 20],
    ],
    preguntas: [
      { enunciado: '¿Cuál fue el motivo de reclamación más frecuente en el trimestre?', correcta: 'Retraso', distractores: ['Pérdida', 'Daño', 'Otros'], subtipo: 'tabla_datos' },
      { enunciado: '¿Cuántas reclamaciones totales hubo en marzo?', correcta: '247', distractores: ['210', '235', '252'], subtipo: 'calculo_grafico' },
      { enunciado: '¿En qué porcentaje aumentaron las reclamaciones por pérdida de enero a marzo?', correcta: 'Aproximadamente un 16%', distractores: ['Aproximadamente un 25%', 'Aproximadamente un 10%', 'Aproximadamente un 30%'], subtipo: 'calculo_grafico' },
    ],
    dificultad: 2,
  },
  {
    titulo: 'Volumen de giros postales por canal — Año 2024',
    encabezados: ['Canal', 'T1', 'T2', 'T3', 'T4'],
    filas: [
      ['Oficina presencial', 15200, 14800, 12100, 16500],
      ['App Correos', 8400, 9200, 10500, 11800],
      ['Web Correos', 5100, 5500, 6200, 6800],
      ['Western Union', 22000, 21500, 19800, 23100],
    ],
    preguntas: [
      { enunciado: '¿Qué canal tuvo mayor volumen total en 2024?', correcta: 'Western Union', distractores: ['Oficina presencial', 'App Correos', 'Web Correos'], subtipo: 'tabla_datos' },
      { enunciado: '¿En qué trimestre fue mayor el volumen total de giros por todos los canales?', correcta: 'T4', distractores: ['T1', 'T2', 'T3'], subtipo: 'calculo_grafico' },
      { enunciado: '¿Qué canal mostró crecimiento continuo en los 4 trimestres?', correcta: 'App Correos y Web Correos', distractores: ['Solo App Correos', 'Oficina presencial', 'Western Union'], subtipo: 'tabla_datos' },
    ],
    dificultad: 2,
  },
  {
    titulo: 'Tiempos medios de entrega por tipo de envío (días laborables) — Zona peninsular 2025',
    encabezados: ['Tipo de envío', 'Estándar', 'Urgente', 'Express'],
    filas: [
      ['Carta', 3.2, 1.5, 0.5],
      ['Paquete <2kg', 4.1, 2.0, 1.0],
      ['Paquete 2-10kg', 5.3, 2.5, 1.0],
      ['Paquete >10kg', 6.8, 3.0, 1.5],
    ],
    preguntas: [
      { enunciado: '¿Cuánto tarda de media un paquete urgente de 5 kg?', correcta: '2,5 días laborables', distractores: ['2,0 días laborables', '3,0 días laborables', '1,5 días laborables'], subtipo: 'tabla_datos' },
      { enunciado: '¿Cuántos días se ahorra enviando un paquete de 15 kg por urgente en vez de estándar?', correcta: '3,8 días', distractores: ['2,5 días', '4,3 días', '3,0 días'], subtipo: 'calculo_grafico' },
      { enunciado: '¿Para qué tipo de envío es mayor la diferencia entre estándar y express?', correcta: 'Paquete >10kg (5,3 días de diferencia)', distractores: ['Paquete 2-10kg', 'Carta', 'Paquete <2kg'], subtipo: 'calculo_grafico' },
    ],
    dificultad: 3,
  },
  {
    titulo: 'Productividad por ruta de reparto — Oficina Correos Bilbao Centro — Semana 15/2025',
    encabezados: ['Ruta', 'Envíos asignados', 'Entregados', 'Avisados', 'Devueltos'],
    filas: [
      ['R-01 Centro', 420, 385, 28, 7],
      ['R-02 Ensanche', 380, 342, 32, 6],
      ['R-03 Deusto', 290, 275, 12, 3],
      ['R-04 Santutxu', 350, 310, 30, 10],
      ['R-05 Txurdinaga', 310, 290, 15, 5],
    ],
    preguntas: [
      { enunciado: '¿Qué ruta tiene mayor tasa de entrega efectiva (entregados/asignados)?', correcta: 'R-03 Deusto (94,8%)', distractores: ['R-05 Txurdinaga (93,5%)', 'R-01 Centro (91,7%)', 'R-02 Ensanche (90,0%)'], subtipo: 'calculo_grafico' },
      { enunciado: '¿Cuántos envíos totales fueron avisados en toda la oficina?', correcta: '117', distractores: ['105', '125', '98'], subtipo: 'calculo_grafico' },
      { enunciado: '¿Qué ruta tuvo más devoluciones?', correcta: 'R-04 Santutxu (10)', distractores: ['R-01 Centro (7)', 'R-02 Ensanche (6)', 'R-05 Txurdinaga (5)'], subtipo: 'tabla_datos' },
    ],
    dificultad: 3,
  },
]

// ─── Generador ──────────────────────────────────────────────────────────────

export function generateGraphs(count: number, dificultad: Dificultad): PsicotecnicoQuestion[] {
  const available = BANCO_TABLAS.filter(e =>
    dificultad === 1 ? e.dificultad <= 2 :
    dificultad === 2 ? true :
    e.dificultad >= 2
  )

  if (available.length === 0) return []

  const result: PsicotecnicoQuestion[] = []
  const usedTables = new Set<number>()

  while (result.length < count) {
    if (usedTables.size >= available.length) usedTables.clear()
    let idx: number
    do { idx = rnd(0, available.length - 1) } while (usedTables.has(idx))
    usedTables.add(idx)

    const entry = available[idx]
    const tabla = formatTabla(entry)
    const shuffledPreguntas = [...entry.preguntas].sort(() => Math.random() - 0.5)
    const needed = Math.min(count - result.length, shuffledPreguntas.length)

    for (let i = 0; i < needed; i++) {
      const p = shuffledPreguntas[i]
      const { opciones, correcta } = shuffleOptions(p.correcta, p.distractores)

      result.push({
        id: randomUUID(),
        categoria: 'graficos',
        subtipo: p.subtipo,
        enunciado: `📊 Observa la siguiente tabla:\n\n${tabla}\n\n${p.enunciado}`,
        opciones,
        correcta,
        explicacion: `La respuesta correcta es "${p.correcta}" según los datos de la tabla.`,
        dificultad,
      })
    }
  }

  return result.slice(0, count)
}
