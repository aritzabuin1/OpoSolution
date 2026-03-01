/**
 * lib/ai/generate-cazatrampas.ts — §2.12.7
 *
 * Genera una sesión Caza-Trampas:
 *   1. Fetch artículo aleatorio de `legislacion`
 *   2. Llama a GPT para inyectar N errores sutiles
 *   3. Verifica determinista: cada error.valor_original existe literal en texto_original
 *   4. Guarda en `cazatrampas_sesiones` (sin exponer errores_reales al cliente)
 *   5. Retorna { id, texto_trampa, numErrores, leyNombre, articuloNumero }
 *
 * Evaluación: 100% determinista (§2.12.8 grade-cazatrampas.ts)
 */

import { createServiceClient } from '@/lib/supabase/server'
import { callGPTJSON } from '@/lib/ai/openai'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import type { ErrorInyectado } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CazaTrampasSession {
  id: string
  texto_trampa: string
  numErrores: number
  leyNombre: string
  articuloNumero: string
  tituloCap: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 2

// ─── Generación ──────────────────────────────────────────────────────────────

/**
 * Genera una sesión Caza-Trampas para un usuario.
 *
 * @param userId      ID del usuario autenticado
 * @param temaId      (opcional) UUID del tema — filtra artículos del tema
 * @param numErrores  Número de errores a inyectar (default: 3)
 */
export async function generateCazaTrampas(
  userId: string,
  temaId?: string,
  numErrores = 3
): Promise<CazaTrampasSession> {
  const supabase = await createServiceClient()

  // 1. Elegir artículo aleatorio con texto suficientemente largo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let qb = (supabase as any)
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
    .eq('activo', true)
    .gte('texto_integro', '') // solo no-nulos
    .filter('texto_integro', 'not.is', null)

  if (temaId) {
    qb = qb.contains('tema_ids', [temaId])
  }

  // Traemos varios candidatos y elegimos uno con texto > 200 chars
  const { data: candidatos, error: fetchErr } = await qb.limit(50)

  if (fetchErr || !candidatos || (candidatos as unknown[]).length === 0) {
    throw new Error('No hay artículos disponibles para Caza-Trampas')
  }

  type LegislacionRow = {
    id: string
    ley_nombre: string
    articulo_numero: string
    titulo_capitulo: string | null
    texto_integro: string
  }

  const validos = (candidatos as LegislacionRow[]).filter(
    (a) => a.texto_integro && a.texto_integro.length >= 200
  )

  if (validos.length === 0) {
    throw new Error('Artículos demasiado cortos para Caza-Trampas')
  }

  const articulo = validos[Math.floor(Math.random() * validos.length)]!

  // 2. Llamar a GPT con reintentos + verificación determinista
  let erroresVerificados: ErrorInyectado[] = []
  let textoTrampa = ''
  let succeeded = false

  for (let attempt = 0; attempt <= MAX_RETRIES && !succeeded; attempt++) {
    const prompt = buildCazaTrampasPrompt({
      textoOriginal: articulo.texto_integro,
      leyNombre: articulo.ley_nombre,
      articuloNumero: articulo.articulo_numero,
      numErrores,
    })

    const raw = await callGPTJSON(SYSTEM_CAZATRAMPAS, prompt, CazaTrampasRawSchema)
    if (!raw) {
      logger.warn({ attempt }, '[cazatrampas] GPT devolvió null')
      continue
    }

    // 3. Verificación determinista: cada valor_original debe existir en texto_original
    const fallos = raw.errores_reales.filter(
      (e) => !articulo.texto_integro.includes(e.valor_original)
    )

    if (fallos.length > 0) {
      logger.warn(
        { attempt, fallos: fallos.map((f) => f.valor_original) },
        '[cazatrampas] valor_original no encontrado en texto — reintentando'
      )
      continue
    }

    // 4. Verificar que texto_trampa contiene los valor_trampa
    const trampaOk = raw.errores_reales.every((e) =>
      raw.texto_trampa.includes(e.valor_trampa)
    )
    if (!trampaOk) {
      logger.warn({ attempt }, '[cazatrampas] texto_trampa no contiene valor_trampa — reintentando')
      continue
    }

    erroresVerificados = raw.errores_reales
    textoTrampa = raw.texto_trampa
    succeeded = true
  }

  if (!succeeded) {
    throw new Error('No se pudo generar Caza-Trampas con errores verificados tras los reintentos')
  }

  // 5. Guardar en BD (errores_reales son secretos para el cliente)
  const { data: sesion, error: insertErr } = await (supabase as any)
    .from('cazatrampas_sesiones')
    .insert({
      user_id: userId,
      legislacion_id: articulo.id,
      texto_trampa: textoTrampa,
      errores_reales: erroresVerificados,
    })
    .select('id')
    .single()

  if (insertErr || !sesion) {
    logger.error({ err: insertErr }, '[cazatrampas] error guardando sesión')
    throw new Error('Error al guardar la sesión de Caza-Trampas')
  }

  logger.info(
    { sesionId: sesion.id, userId, numErrores: erroresVerificados.length },
    '[cazatrampas] sesión creada'
  )

  return {
    id: (sesion as { id: string }).id,
    texto_trampa: textoTrampa,
    numErrores: erroresVerificados.length,
    leyNombre: articulo.ley_nombre,
    articuloNumero: articulo.articulo_numero,
    tituloCap: articulo.titulo_capitulo ?? '',
  }
}
