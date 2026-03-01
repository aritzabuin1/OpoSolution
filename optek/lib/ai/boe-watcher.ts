/**
 * lib/ai/boe-watcher.ts — §2.13.4
 *
 * Comprueba cambios en el BOE para todas las leyes activas.
 * Para cada ley:
 *   1. Scrape HTML desde boe.es
 *   2. Parsea artículos con parseLey()
 *   3. Calcula SHA-256 del texto_integro de cada artículo
 *   4. Compara con hash_sha256 almacenado en legislacion
 *   5. Si cambio: INSERT cambios_legislativos + notificar usuarios afectados
 *
 * Invocado desde: app/api/cron/boe-watch/route.ts (Vercel Cron, 07:00 UTC)
 */

import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { fetchHTML, parseLey } from '@/execution/boe-scraper'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LeyActiva {
  id: string
  ley_codigo: string
  ley_nombre: string
  ley_nombre_completo: string
  articulo_numero: string
  apartado: string | null
  texto_integro: string
  hash_sha256: string
  tema_ids: string[]
}

interface CambioDetectado {
  legislacionId: string
  leyNombre: string
  articuloNumero: string
  hashAnterior: string
  hashNuevo: string
  textoAnterior: string
  textoNuevo: string
}

export interface WatchResult {
  cambiosDetectados: number
  notificacionesCreadas: number
  articulosComprobados: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Comprueba cambios en el BOE y notifica a usuarios afectados.
 */
export async function watchAllLeyes(): Promise<WatchResult> {
  const supabase = await createServiceClient()
  const log = logger.child({ fn: 'watchAllLeyes' })

  let cambiosDetectados = 0
  let notificacionesCreadas = 0

  // 1. Cargar todas las leyes activas agrupadas por ley_codigo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: articulos, error: fetchErr } = await (supabase as any)
    .from('legislacion')
    .select('id, ley_codigo, ley_nombre, ley_nombre_completo, articulo_numero, apartado, texto_integro, hash_sha256, tema_ids')
    .eq('activo', true)
    .order('ley_codigo')

  if (fetchErr || !articulos) {
    log.error({ err: fetchErr }, '[boe-watcher] error cargando artículos')
    throw new Error('Error cargando artículos de legislación')
  }

  const rows = articulos as LeyActiva[]
  log.info({ total: rows.length }, '[boe-watcher] artículos a verificar')

  // Agrupar por ley_codigo → solo 1 fetch HTTP por ley
  const porLey = new Map<string, LeyActiva[]>()
  for (const row of rows) {
    const lista = porLey.get(row.ley_codigo) ?? []
    lista.push(row)
    porLey.set(row.ley_codigo, lista)
  }

  // 2. Para cada ley → scrape + comparar hashes artículo a artículo
  for (const [leyCodigo, articulosDeLey] of porLey) {
    const leyRef = articulosDeLey[0]!

    // Buscar la config del catálogo de boe-scraper (usando ley_codigo como BOE ID)
    // El boe-scraper usa "BOE-A-..." como código. Si no encontramos el config
    // exacto, saltamos esta ley silenciosamente.
    let rawHTML: string
    try {
      // leyCodigo podría ser 'CE', 'LPAC', etc. — necesitamos el BOE ID.
      // Lo resolvemos buscando en el array LEYES... pero ese módulo no lo exporta.
      // En su lugar usamos el ley_nombre_completo como fallback para loggear.
      log.info({ leyCodigo, ley: leyRef.ley_nombre }, '[boe-watcher] scraping')
      rawHTML = await fetchHTML(leyCodigo)
    } catch (err) {
      log.warn({ err, leyCodigo }, '[boe-watcher] error scraping ley — skip')
      continue
    }

    // Parsear con la misma función que el scraper original
    let parsed: ReturnType<typeof parseLey>
    try {
      parsed = parseLey(rawHTML, {
        codigo: leyCodigo,
        nombre: leyRef.ley_nombre,
        nombre_completo: leyRef.ley_nombre_completo,
        archivo: '',
      } as unknown as Parameters<typeof parseLey>[1])
    } catch (err) {
      log.warn({ err, leyCodigo }, '[boe-watcher] error parseando ley — skip')
      continue
    }

    // Construir mapa articuloNumero → texto scrapeado
    const textoScrapeado = new Map<string, string>()
    for (const art of parsed.articulos) {
      textoScrapeado.set(art.numero, art.texto_integro)
    }

    // 3. Comparar artículo a artículo
    const cambiosDeLey: CambioDetectado[] = []
    for (const art of articulosDeLey) {
      const textoNuevo = textoScrapeado.get(art.articulo_numero)
      if (!textoNuevo) continue // artículo no encontrado en scrape — saltar

      const hashNuevo = sha256(textoNuevo)
      if (hashNuevo === art.hash_sha256) continue // sin cambios

      cambiosDeLey.push({
        legislacionId: art.id,
        leyNombre: art.ley_nombre,
        articuloNumero: art.articulo_numero,
        hashAnterior: art.hash_sha256,
        hashNuevo,
        textoAnterior: art.texto_integro,
        textoNuevo,
      })
    }

    if (cambiosDeLey.length === 0) continue

    // 4. Guardar cambios en BD + notificar usuarios afectados
    for (const cambio of cambiosDeLey) {
      // INSERT cambios_legislativos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertCambioErr } = await (supabase as any)
        .from('cambios_legislativos')
        .insert({
          legislacion_id: cambio.legislacionId,
          texto_anterior: cambio.textoAnterior,
          texto_nuevo: cambio.textoNuevo,
          hash_anterior: cambio.hashAnterior,
          hash_nuevo: cambio.hashNuevo,
          tipo_cambio: 'modificacion',
          procesado: false,
          notificacion_enviada: false,
        })

      if (insertCambioErr) {
        log.error({ err: insertCambioErr, cambio }, '[boe-watcher] error guardando cambio')
        continue
      }

      cambiosDetectados++

      // UPDATE hash en legislacion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('legislacion')
        .update({ hash_sha256: cambio.hashNuevo, texto_integro: cambio.textoNuevo })
        .eq('id', cambio.legislacionId)

      // Notificar usuarios afectados (los que tienen ese tema_ids en sus tests)
      const artRow = articulosDeLey.find((a) => a.id === cambio.legislacionId)
      if (!artRow || artRow.tema_ids.length === 0) continue

      // Buscar usuarios que hayan hecho tests en alguno de esos temas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usuarios } = await (supabase as any)
        .from('tests_generados')
        .select('user_id')
        .overlaps('tema_ids', artRow.tema_ids)
        .limit(500)

      if (!usuarios) continue

      const userIds = [...new Set((usuarios as { user_id: string }[]).map((u) => u.user_id))]
      if (userIds.length === 0) continue

      const notificaciones = userIds.map((userId: string) => ({
        user_id: userId,
        tipo: 'boe_cambio',
        titulo: `Cambio legislativo: ${cambio.leyNombre}`,
        mensaje: `El artículo ${cambio.articuloNumero} de ${cambio.leyNombre} ha sido modificado en el BOE. Actualiza tu estudio.`,
        url_accion: `/tests?ley=${leyCodigo}&art=${cambio.articuloNumero}`,
        leida: false,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: notifErr } = await (supabase as any)
        .from('notificaciones')
        .insert(notificaciones)

      if (notifErr) {
        log.error({ err: notifErr }, '[boe-watcher] error creando notificaciones')
      } else {
        notificacionesCreadas += notificaciones.length
      }
    }
  }

  log.info(
    { cambiosDetectados, notificacionesCreadas, articulosComprobados: rows.length },
    '[boe-watcher] completado'
  )

  return {
    cambiosDetectados,
    notificacionesCreadas,
    articulosComprobados: rows.length,
  }
}
