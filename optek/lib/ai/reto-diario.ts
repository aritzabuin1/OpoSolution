/**
 * lib/ai/reto-diario.ts — §2.20.3 (fallback on-demand)
 *
 * Generación del Reto Diario como fallback si el cron no corrió.
 * Misma lógica que el cron endpoint pero sin la verificación de auth.
 * Se llama solo desde GET /api/reto-diario cuando no existe reto para hoy + rama.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'

const NUM_ERRORES = 3

/**
 * Laws relevant to each rama for reto diario generation.
 */
const RAMAS_CONFIG: Record<string, string[]> = {
  age: [
    'CE', 'LPAC', 'LRJSP', 'TREBEP', 'LGP',
    'LCSP', 'SUBVENCIONES', 'TRANSPARENCIA', 'LOIGUALDAD',
    'LGOB', 'LOPDGDD', 'LOTC',
  ],
  justicia: [
    'CE', 'LOPJ', 'LEC', 'LECrim', 'LECRIM', 'TREBEP',
    'LOTC', 'LOVIGEN', 'LGTBI',
  ],
  correos: [
    'CE', 'TREBEP', 'LEY_POSTAL', 'RD_POSTAL',
    'LOIGUALDAD', 'LGTBI', 'LOPDGDD',
  ],
}

/**
 * Genera el reto del día para una rama específica y lo guarda en BD.
 * Idempotente: si ya existe → lo retorna directamente.
 */
export async function generateRetoDiarioOnDemand(fecha: string, rama: string): Promise<{
  id: string
  fecha: string
  rama: string
  ley_nombre: string
  articulo_numero: string
  texto_trampa: string
  num_errores: number
}> {
  const log = logger.child({ fecha, rama, fn: 'generateRetoDiarioOnDemand' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Comprobar si ya existe (otro request concurrente puede haberlo creado)
  const { data: existing } = await supabase
    .from('reto_diario')
    .select('id, fecha, rama, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .eq('fecha', fecha)
    .eq('rama', rama)
    .maybeSingle()

  if (existing) return existing

  // Get laws for this rama
  const leyes = RAMAS_CONFIG[rama]
  if (!leyes || leyes.length === 0) {
    throw new Error(`No hay leyes configuradas para rama: ${rama}`)
  }

  const { data: candidatos, error: fetchErr } = await supabase
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
    .eq('activo', true)
    .not('texto_integro', 'is', null)
    .in('ley_nombre', leyes)
    .limit(80)

  if (fetchErr || !candidatos || candidatos.length === 0) {
    throw new Error('No hay artículos disponibles')
  }

  type LegislacionRow = {
    id: string; ley_nombre: string; articulo_numero: string; titulo_capitulo: string | null; texto_integro: string
  }

  const validos = (candidatos as LegislacionRow[]).filter(
    (a) => a.texto_integro && a.texto_integro.length >= 300
  )
  if (validos.length === 0) throw new Error('Artículos demasiado cortos')

  const articulo = validos[Math.floor(Math.random() * validos.length)]!

  // Generar con AI
  let textoTrampa = ''
  let erroresVerificados: ReturnType<typeof CazaTrampasRawSchema.parse>['errores_reales'] = []
  let succeeded = false

  for (let attempt = 0; attempt <= 2 && !succeeded; attempt++) {
    const prompt = buildCazaTrampasPrompt({
      textoOriginal: articulo.texto_integro,
      leyNombre: articulo.ley_nombre,
      articuloNumero: articulo.articulo_numero,
      numErrores: NUM_ERRORES,
    })

    const raw = await callAIJSON(SYSTEM_CAZATRAMPAS, prompt, CazaTrampasRawSchema, {
      endpoint: 'reto-diario',
    })
    if (!raw) { log.warn({ attempt }, 'AI devolvió null'); continue }

    const fallos = raw.errores_reales.filter((e) => !articulo.texto_integro.includes(e.valor_original))
    if (fallos.length > 0) { log.warn({ attempt }, 'verificación fallida'); continue }

    const trampaOk = raw.errores_reales.every((e) => raw.texto_trampa.includes(e.valor_trampa))
    if (!trampaOk) { log.warn({ attempt }, 'texto_trampa inválido'); continue }

    textoTrampa = raw.texto_trampa
    erroresVerificados = raw.errores_reales
    succeeded = true
  }

  if (!succeeded) throw new Error('No se pudo generar reto tras 3 intentos')

  // Insertar (INSERT-first para idempotencia)
  const { data: inserted, error: insertErr } = await supabase
    .from('reto_diario')
    .insert({
      fecha,
      rama,
      ley_nombre: articulo.ley_nombre,
      articulo_numero: articulo.articulo_numero,
      texto_trampa: textoTrampa,
      errores_reales: erroresVerificados,
      num_errores: NUM_ERRORES,
    })
    .select('id, fecha, rama, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .single()

  if (insertErr) {
    // UNIQUE conflict → otro request concurrente lo creó
    if ((insertErr as { code?: string }).code === '23505') {
      const { data: retry } = await supabase
        .from('reto_diario')
        .select('id, fecha, rama, ley_nombre, articulo_numero, texto_trampa, num_errores')
        .eq('fecha', fecha)
        .eq('rama', rama)
        .single()
      if (retry) return retry
    }
    throw new Error(`DB error: ${insertErr.message}`)
  }

  log.info({ id: inserted.id, rama }, 'Reto diario generado on-demand')
  return inserted
}
