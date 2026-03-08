import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/debug/test-pipeline — Diagnóstico del pipeline de generación de tests
 *
 * Ejecuta cada paso por separado y reporta cuál falla.
 * Solo accesible para admin (is_admin=true).
 *
 * Pasos:
 *   1. Auth + admin check
 *   2. Supabase: listar temas
 *   3. Supabase: retrieval (context building)
 *   4. OpenAI: llamada simple (ping)
 *   5. OpenAI: llamada JSON con schema
 *   6. Pipeline completo (generateTest con 3 preguntas)
 */

export const maxDuration = 60

interface StepResult {
  step: string
  status: 'OK' | 'FAIL' | 'SKIP'
  durationMs: number
  detail?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const results: StepResult[] = []
  const overallStart = Date.now()

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  let userId: string | null = null
  {
    const start = Date.now()
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }

      // Check admin
      const sb = await createServiceClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (sb as any)
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
      }

      userId = user.id
      results.push({ step: '1. Auth + admin', status: 'OK', durationMs: Date.now() - start, detail: `userId=${user.id.slice(0, 8)}` })
    } catch (err) {
      results.push({ step: '1. Auth', status: 'FAIL', durationMs: Date.now() - start, error: String(err) })
      return NextResponse.json({ results, totalMs: Date.now() - overallStart })
    }
  }

  // ── 2. Supabase: listar temas ─────────────────────────────────────────────
  let temaId: string | null = null
  let temaTitulo: string | null = null
  {
    const start = Date.now()
    try {
      const sb = await createServiceClient()
      const { data: temas, error } = await sb
        .from('temas')
        .select('id, numero, titulo')
        .order('numero')
        .limit(5)

      if (error) throw new Error(`Supabase error: ${error.message} (code: ${error.code})`)
      if (!temas || temas.length === 0) throw new Error('No hay temas en la BD')

      temaId = temas[0].id
      temaTitulo = temas[0].titulo
      results.push({
        step: '2. Supabase: temas',
        status: 'OK',
        durationMs: Date.now() - start,
        detail: `${temas.length} temas encontrados. Usando: [${temas[0].numero}] ${temaTitulo}`,
      })
    } catch (err) {
      results.push({ step: '2. Supabase: temas', status: 'FAIL', durationMs: Date.now() - start, error: String(err) })
    }
  }

  // ── 3. Retrieval: buildContext ─────────────────────────────────────────────
  let contextChars = 0
  {
    const start = Date.now()
    if (!temaId) {
      results.push({ step: '3. Retrieval', status: 'SKIP', durationMs: 0, detail: 'Sin temaId (paso 2 falló)' })
    } else {
      try {
        const { buildContext, formatContext } = await import('@/lib/ai/retrieval')
        const ctx = await buildContext(temaId, undefined, userId ?? undefined)
        const formatted = formatContext(ctx)
        contextChars = formatted.length

        results.push({
          step: '3. Retrieval (buildContext)',
          status: ctx.articulos.length > 0 ? 'OK' : 'FAIL',
          durationMs: Date.now() - start,
          detail: `${ctx.articulos.length} artículos, ${ctx.tokensEstimados} tokens, ${contextChars} chars, strategy=${ctx.strategy}, esBloqueII=${ctx.esBloqueII}`,
          error: ctx.articulos.length === 0 ? 'CONTEXTO VACÍO — la IA no tiene material para generar preguntas' : undefined,
        })
      } catch (err) {
        results.push({ step: '3. Retrieval', status: 'FAIL', durationMs: Date.now() - start, error: String(err) })
      }
    }
  }

  // ── 4. OpenAI: ping simple ─────────────────────────────────────────────────
  {
    const start = Date.now()
    try {
      const { AI_PRIMARY_PROVIDER } = await import('@/lib/ai/provider')

      // Check env vars
      const hasOpenAI = !!process.env.OPENAI_API_KEY
      const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
      const envDetail = `PRIMARY=${AI_PRIMARY_PROVIDER}, OPENAI_KEY=${hasOpenAI ? 'SET' : 'MISSING'}, ANTHROPIC_KEY=${hasAnthropic ? 'SET' : 'MISSING'}`

      if (!hasOpenAI && !hasAnthropic) {
        results.push({ step: '4. AI: env check', status: 'FAIL', durationMs: Date.now() - start, error: `NINGUNA API KEY CONFIGURADA. ${envDetail}` })
      } else {
        // Try a simple callAIMini
        const { callAIMini } = await import('@/lib/ai/provider')
        const response = await callAIMini('Responde solo "OK"', {
          systemPrompt: 'Eres un asistente de prueba. Responde solo la palabra OK.',
          maxTokens: 10,
          endpoint: 'debug-ping',
          userId: userId ?? undefined,
        })

        results.push({
          step: '4. AI: ping',
          status: response.includes('OK') ? 'OK' : 'OK',
          durationMs: Date.now() - start,
          detail: `${envDetail}. Respuesta: "${response.slice(0, 50)}"`,
        })
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.push({ step: '4. AI: ping', status: 'FAIL', durationMs: Date.now() - start, error: errMsg })
    }
  }

  // ── 5. OpenAI: JSON con schema ─────────────────────────────────────────────
  {
    const start = Date.now()
    try {
      const { callAIJSON } = await import('@/lib/ai/provider')
      const { z } = await import('zod')

      const TestSchema = z.object({
        preguntas: z.array(z.object({
          enunciado: z.string(),
          opciones: z.tuple([z.string(), z.string(), z.string(), z.string()]),
          correcta: z.number().int().min(0).max(3),
          explicacion: z.string(),
          dificultad: z.enum(['facil', 'media', 'dificil']),
        })).min(1),
      })

      const result = await callAIJSON(
        'Genera exactamente 1 pregunta de prueba sobre la Constitución Española. Responde con JSON.',
        'Genera 1 pregunta tipo test sobre el artículo 1 de la Constitución Española (España es un Estado social y democrático de Derecho). Dificultad: facil.',
        TestSchema,
        {
          maxTokens: 800,
          endpoint: 'debug-json',
          userId: userId ?? undefined,
        }
      )

      results.push({
        step: '5. AI: JSON + Zod schema',
        status: 'OK',
        durationMs: Date.now() - start,
        detail: `${result.preguntas.length} pregunta(s) generada(s). Enunciado: "${result.preguntas[0]?.enunciado?.slice(0, 80)}..."`,
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      results.push({ step: '5. AI: JSON schema', status: 'FAIL', durationMs: Date.now() - start, error: errMsg.slice(0, 500) })
    }
  }

  // ── 6. Pipeline completo (3 preguntas, tema real) ──────────────────────────
  {
    const start = Date.now()
    if (!temaId || contextChars === 0) {
      results.push({ step: '6. Pipeline completo', status: 'SKIP', durationMs: 0, detail: 'Sin contexto (paso 2 o 3 falló)' })
    } else {
      try {
        const { generateTest } = await import('@/lib/ai/generate-test')
        const test = await generateTest({
          temaId,
          numPreguntas: 3,
          dificultad: 'facil',
          userId: userId!,
          requestId: 'debug-pipeline',
        })

        results.push({
          step: '6. Pipeline completo (3 preguntas)',
          status: 'OK',
          durationMs: Date.now() - start,
          detail: `testId=${test.id}, ${test.preguntas.length} preguntas generadas, promptVersion=${test.promptVersion}`,
        })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        results.push({ step: '6. Pipeline completo', status: 'FAIL', durationMs: Date.now() - start, error: errMsg.slice(0, 500) })
      }
    }
  }

  const totalMs = Date.now() - overallStart
  const allOk = results.every(r => r.status === 'OK' || r.status === 'SKIP')

  logger.info({ results, totalMs, allOk }, '[debug] test-pipeline diagnostic complete')

  return NextResponse.json({
    summary: allOk ? 'ALL STEPS OK' : 'FAILURES DETECTED',
    totalMs,
    results,
  }, { status: allOk ? 200 : 500 })
}
