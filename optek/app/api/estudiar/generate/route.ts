import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAI } from '@/lib/ai/provider'
import { SYSTEM_ESTUDIAR, buildEstudiarPrompt } from '@/lib/estudiar/prompts'
import { logger } from '@/lib/logger'

export const maxDuration = 60

/**
 * POST /api/estudiar/generate
 *
 * Genera (o devuelve cacheado) un resumen didáctico de un bloque de ley.
 * - Si ya existe en resumen_legislacion → retorna cacheado (sin check premium)
 * - Si no existe → requiere premium, genera con IA, cachea para todos
 * - NO consume crédito IA del usuario (contenido compartido)
 */

const InputSchema = z.object({
  ley: z.string().min(1, 'ley es requerido'),
  rango: z.string().min(1, 'rango es requerido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'estudiar-generate' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // Validate
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { ley, rango } = parsed.data

  const serviceSupabase = await createServiceClient()

  // Check cache first — available for everyone (free + premium)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cached } = await (serviceSupabase as any)
    .from('resumen_legislacion')
    .select('contenido, titulo')
    .eq('ley_codigo', ley)
    .eq('rango', rango)
    .single()

  if (cached) {
    return NextResponse.json({
      contenido: (cached as { contenido: string }).contenido,
      titulo: (cached as { titulo: string }).titulo,
      ley,
      rango,
      cached: true,
    })
  }

  // Not cached — premium required to generate
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)
  if (!isPaid) {
    return NextResponse.json({
      error: 'Desbloquea el pack para generar resúmenes de estudio.',
      code: 'PAYWALL_ESTUDIAR',
    }, { status: 402 })
  }

  // Rate limit: 5 generations/day per user (anti-abuse)
  const rl = await checkRateLimit(user.id, 'estudiar-generate', 5, '1 d')
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Has alcanzado el límite de generaciones por hoy. Vuelve mañana.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } }
    )
  }

  // Fetch articles for this ley + rango
  const rangoMatch = rango.match(/(\d+)\s*-\s*(\d+)/)
  let minArt = 1, maxArt = 999
  if (rangoMatch) {
    minArt = parseInt(rangoMatch[1], 10)
    maxArt = parseInt(rangoMatch[2], 10)
  } else if (rango.startsWith('Preliminar')) {
    minArt = 1
    maxArt = parseInt(rango.split('-')[1], 10) || 9
  }

  // Fetch articles per number to avoid Supabase 1000-row default limit.
  // Laws with many apartados (e.g. LPAC has 2015 rows) get silently truncated.
  const allRows: { articulo_numero: string; texto_integro: string; titulo_capitulo: string | null }[] = []
  for (let artNum = minArt; artNum <= maxArt; artNum++) {
    const { data: rows } = await serviceSupabase
      .from('legislacion')
      .select('articulo_numero, texto_integro, titulo_capitulo')
      .eq('ley_codigo', ley)
      .eq('articulo_numero', String(artNum))
      .limit(50)
    if (rows) allRows.push(...rows)
  }

  // Deduplicate: merge apartados per article into single text
  const byNum = new Map<string, { textos: string[]; titulo: string }>()
  for (const a of allRows) {
    const existing = byNum.get(a.articulo_numero)
    if (existing) {
      existing.textos.push(a.texto_integro)
    } else {
      byNum.set(a.articulo_numero, { textos: [a.texto_integro], titulo: a.titulo_capitulo ?? '' })
    }
  }
  const articulosFiltrados = [...byNum.entries()].map(([num, v]) => ({
    articulo_numero: num,
    texto_integro: v.textos.join('\n'),
    titulo_capitulo: v.titulo,
  }))

  // Truncate total content to ~60K chars (~15K tokens) to stay within AI limits
  const MAX_CHARS = 60000
  let totalChars = articulosFiltrados.reduce((sum, a) => sum + a.texto_integro.length, 0)
  if (totalChars > MAX_CHARS) {
    const maxPerArticle = Math.floor(MAX_CHARS / articulosFiltrados.length)
    for (const a of articulosFiltrados) {
      a.texto_integro = a.texto_integro.slice(0, maxPerArticle)
    }
    totalChars = articulosFiltrados.reduce((sum, a) => sum + a.texto_integro.length, 0)
    log.info({ ley, rango, originalChars: totalChars, truncatedTo: MAX_CHARS }, 'content truncated')
  }

  if (articulosFiltrados.length === 0) {
    return NextResponse.json({ error: 'No se encontraron artículos para este bloque.' }, { status: 404 })
  }

  // Get ley display name
  const leyNombre = articulosFiltrados[0].titulo_capitulo?.split(' - ')[0] ?? ley

  // Generate with AI
  const titulo = `${leyNombre} — arts. ${rango}`
  log.info({ userId: user.id, ley, rango, articulos: articulosFiltrados.length }, 'generating resumen')

  let contenido: string
  try {
    contenido = await callAI(
      buildEstudiarPrompt(leyNombre, rango, titulo, articulosFiltrados.map(a => ({
        numero: a.articulo_numero,
        texto_integro: a.texto_integro,
        titulo_capitulo: a.titulo_capitulo ?? '',
      }))),
      {
        systemPrompt: SYSTEM_ESTUDIAR,
        maxTokens: 4000,
        requestId,
        endpoint: 'estudiar-generate',
        userId: user.id,
        oposicionId,
      }
    )
  } catch (err) {
    log.error({ err }, 'AI generation failed')
    return NextResponse.json({ error: 'Error al generar el resumen. Inténtalo de nuevo.' }, { status: 500 })
  }

  // Cache — INSERT ON CONFLICT DO NOTHING to handle concurrent requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (serviceSupabase as any)
    .from('resumen_legislacion')
    .insert({
      ley_codigo: ley,
      rango,
      titulo,
      contenido,
      generated_by: user.id,
    })

  if (insertErr) {
    // ON CONFLICT = another request already inserted it. Fetch that one.
    if (insertErr.code === '23505') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: justInserted } = await (serviceSupabase as any)
        .from('resumen_legislacion')
        .select('contenido, titulo')
        .eq('ley_codigo', ley)
        .eq('rango', rango)
        .single()
      if (justInserted) {
        return NextResponse.json({
          contenido: (justInserted as { contenido: string }).contenido,
          titulo: (justInserted as { titulo: string }).titulo,
          ley,
          rango,
          cached: true,
        })
      }
    }
    log.error({ insertErr, ley, rango }, 'Failed to cache resumen')
    // Still return the generated content even if caching failed
  }

  // Log usage
  try {
    await serviceSupabase.from('api_usage_log').insert({
      user_id: user.id,
      endpoint: 'estudiar-generate',
      model: 'ai',
      tokens_in: 0,
      tokens_out: Math.ceil(contenido.length / 4),
      cost_estimated_cents: Math.round(contenido.length / 4 * 0.0015),
    })
  } catch { /* non-blocking */ }

  return NextResponse.json({
    contenido,
    titulo,
    ley,
    rango,
    cached: false,
  })
}
