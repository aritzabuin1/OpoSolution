import { NextResponse } from 'next/server'

/**
 * GET /api/health/ai — Health check público de la capa de IA
 *
 * NO requiere auth. Testea cada paso del pipeline por separado:
 *   1. OpenAI SDK: ping simple ("di OK")
 *   2. OpenAI JSON: respuesta JSON + parse
 *   3. RAG: buildContext de un tema existente
 *
 * Si algún paso falla, devuelve el error exacto para diagnóstico rápido.
 * Rate-limited implícitamente por Vercel (no hay autenticación).
 */

export const maxDuration = 60

interface StepResult {
  step: string
  status: 'OK' | 'FAIL'
  ms: number
  detail?: string
  error?: string
}

export async function GET() {
  const results: StepResult[] = []
  const start = Date.now()

  // ── 0. Env check ──────────────────────────────────────────────────────────
  {
    const s = Date.now()
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
    const primary = process.env.AI_PRIMARY_PROVIDER ?? 'auto'
    results.push({
      step: '0. Env vars',
      status: hasOpenAI || hasAnthropic ? 'OK' : 'FAIL',
      ms: Date.now() - s,
      detail: `PRIMARY=${primary}, OPENAI=${hasOpenAI ? 'SET' : 'MISSING'}, ANTHROPIC=${hasAnthropic ? 'SET' : 'MISSING'}`,
    })
  }

  // ── 1. OpenAI SDK: ping simple ─────────────────────────────────────────────
  {
    const s = Date.now()
    try {
      const { callAIMini } = await import('@/lib/ai/provider')
      const response = await callAIMini('Responde solo la palabra OK.', {
        systemPrompt: 'Responde solo OK.',
        maxTokens: 2000, // reasoning model needs budget for thinking + output
        endpoint: 'health-ping',
      })
      results.push({
        step: '1. AI ping (callAIMini)',
        status: 'OK',
        ms: Date.now() - s,
        detail: `Respuesta: "${response.slice(0, 50)}"`,
      })
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      results.push({
        step: '1. AI ping (callAIMini)',
        status: 'FAIL',
        ms: Date.now() - s,
        error: msg.slice(0, 500),
      })
    }
  }

  // ── 2. AI JSON + Zod ───────────────────────────────────────────────────────
  let jsonOk = false
  {
    const s = Date.now()
    try {
      const { callAIJSON } = await import('@/lib/ai/provider')
      const { z } = await import('zod')

      const SimpleSchema = z.object({
        respuesta: z.string(),
        numero: z.number(),
      })

      const result = await callAIJSON(
        'Responde SOLO con JSON: {"respuesta": "OK", "numero": 42}',
        'Genera un JSON con los campos "respuesta" (string "OK") y "numero" (number 42).',
        SimpleSchema,
        { maxTokens: 4000, endpoint: 'health-json' }
      )

      jsonOk = true
      results.push({
        step: '2. AI JSON + Zod',
        status: 'OK',
        ms: Date.now() - s,
        detail: `Parsed: ${JSON.stringify(result)}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      results.push({
        step: '2. AI JSON + Zod',
        status: 'FAIL',
        ms: Date.now() - s,
        error: msg.slice(0, 500),
      })
    }
  }

  // ── 3. Supabase: hay temas? ──────────────────────────────────────────────
  let temaId: string | null = null
  {
    const s = Date.now()
    try {
      const { createServiceClient } = await import('@/lib/supabase/server')
      const sb = await createServiceClient()
      const { data: temas, error } = await sb
        .from('temas')
        .select('id, numero, titulo')
        .order('numero')
        .limit(3)

      if (error) throw new Error(`Supabase: ${error.message}`)
      if (!temas || temas.length === 0) throw new Error('No hay temas en la BD')

      temaId = temas[0].id
      results.push({
        step: '3. Supabase temas',
        status: 'OK',
        ms: Date.now() - s,
        detail: `${temas.length} temas. Primero: [${temas[0].numero}] ${temas[0].titulo}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({
        step: '3. Supabase temas',
        status: 'FAIL',
        ms: Date.now() - s,
        error: msg.slice(0, 300),
      })
    }
  }

  // ── 4. RAG: buildContext ─────────────────────────────────────────────────
  {
    const s = Date.now()
    if (!temaId) {
      results.push({ step: '4. RAG buildContext', status: 'FAIL', ms: 0, error: 'Sin temaId (paso 3 falló)' })
    } else {
      try {
        const { buildContext, formatContext } = await import('@/lib/ai/retrieval')
        const ctx = await buildContext(temaId)
        const formatted = formatContext(ctx)

        results.push({
          step: '4. RAG buildContext',
          status: ctx.articulos.length > 0 ? 'OK' : 'FAIL',
          ms: Date.now() - s,
          detail: `${ctx.articulos.length} artículos, ${formatted.length} chars, strategy=${ctx.strategy}`,
          error: ctx.articulos.length === 0 ? 'CONTEXTO VACÍO' : undefined,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push({
          step: '4. RAG buildContext',
          status: 'FAIL',
          ms: Date.now() - s,
          error: msg.slice(0, 300),
        })
      }
    }
  }

  // ── 5. AI MCQ generation (sin guardar en BD — health check no tiene userId real)
  {
    const s = Date.now()
    if (!jsonOk || !temaId) {
      results.push({
        step: '5. AI MCQ generation',
        status: 'FAIL',
        ms: 0,
        error: !jsonOk ? 'AI JSON falló (paso 2)' : 'Sin temaId (paso 3)',
      })
    } else {
      try {
        const { callAIJSON } = await import('@/lib/ai/provider')
        const { buildContext, formatContext } = await import('@/lib/ai/retrieval')
        const { SYSTEM_GENERATE_TEST, buildGenerateTestPrompt } = await import('@/lib/ai/prompts')
        const { TestGeneradoRawSchema } = await import('@/lib/ai/schemas')

        const ctx = await buildContext(temaId)
        const contexto = formatContext(ctx)

        const rawTest = await callAIJSON(
          SYSTEM_GENERATE_TEST,
          buildGenerateTestPrompt({
            contextoLegislativo: contexto,
            numPreguntas: 1,
            dificultad: 'facil',
            temaTitulo: 'Health check',
          }),
          TestGeneradoRawSchema,
          { maxTokens: 8000, endpoint: 'health-mcq' }
        )

        const q = rawTest.preguntas[0]
        results.push({
          step: '5. AI MCQ generation',
          status: 'OK',
          ms: Date.now() - s,
          detail: `${rawTest.preguntas.length} pregunta(s). Enunciado: "${q?.enunciado?.slice(0, 80)}..."`,
        })
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        results.push({
          step: '5. AI MCQ generation',
          status: 'FAIL',
          ms: Date.now() - s,
          error: msg.slice(0, 500),
        })
      }
    }
  }

  const totalMs = Date.now() - start
  const allOk = results.every(r => r.status === 'OK')

  return NextResponse.json({
    status: allOk ? 'ALL OK' : 'FAILURES DETECTED',
    totalMs,
    results,
  }, {
    status: allOk ? 200 : 500,
    headers: { 'Cache-Control': 'no-store' },
  })
}
