/**
 * lib/ai/reto-diario.ts — §2.20.3 (fallback on-demand)
 *
 * Generación del Reto Diario como fallback si el cron no corrió.
 * Misma lógica que el cron endpoint pero sin la verificación de auth.
 * Se llama solo desde GET /api/reto-diario cuando no existe reto para hoy.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'

const NUM_ERRORES = 3

/**
 * Genera el reto del día y lo guarda en BD.
 * Idempotente: si ya existe → lo retorna directamente.
 */
export async function generateRetoDiarioOnDemand(fecha: string): Promise<{
  id: string
  fecha: string
  ley_nombre: string
  articulo_numero: string
  texto_trampa: string
  num_errores: number
}> {
  const log = logger.child({ fecha, fn: 'generateRetoDiarioOnDemand' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Comprobar si ya existe (otro request concurrente puede haberlo creado)
  const { data: existing } = await supabase
    .from('reto_diario')
    .select('id, fecha, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .eq('fecha', fecha)
    .maybeSingle()

  if (existing) return existing

  // Elegir artículo
  const { data: candidatos, error: fetchErr } = await supabase
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
    .eq('activo', true)
    .not('texto_integro', 'is', null)
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

  // Generar con GPT
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

    const raw = await callAIJSON(SYSTEM_CAZATRAMPAS, prompt, CazaTrampasRawSchema)
    if (!raw) { log.warn({ attempt }, 'GPT devolvió null'); continue }

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
      ley_nombre: articulo.ley_nombre,
      articulo_numero: articulo.articulo_numero,
      texto_trampa: textoTrampa,
      errores_reales: erroresVerificados,
      num_errores: NUM_ERRORES,
    })
    .select('id, fecha, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .single()

  if (insertErr) {
    // UNIQUE conflict → otro request concurrente lo creó
    if ((insertErr as { code?: string }).code === '23505') {
      const { data: retry } = await supabase
        .from('reto_diario')
        .select('id, fecha, ley_nombre, articulo_numero, texto_trampa, num_errores')
        .eq('fecha', fecha)
        .single()
      if (retry) return retry
    }
    throw new Error(`DB error: ${insertErr.message}`)
  }

  log.info({ id: inserted.id }, 'Reto diario generado on-demand')
  return inserted
}
