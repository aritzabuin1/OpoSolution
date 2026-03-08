import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, checkIsAdmin } from '@/lib/freemium'
import { logger } from '@/lib/logger'

/**
 * GET /api/debug/generate?temaId=xxx — Diagnóstico paso a paso del flujo generate-test
 *
 * Requiere estar autenticado. Replica EXACTAMENTE el flujo del POST /api/ai/generate-test
 * pero reportando cada paso individual para identificar dónde falla.
 */
export const maxDuration = 60

interface Step {
  step: string
  status: 'OK' | 'FAIL' | 'SKIP'
  ms: number
  detail?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const steps: Step[] = []
  const start = Date.now()

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  let userId: string | null = null
  {
    const s = Date.now()
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'No autenticado. Inicia sesión primero.', steps }, { status: 401 })
      }
      userId = user.id
      steps.push({ step: '1. Auth', status: 'OK', ms: Date.now() - s, detail: `userId=${user.id.slice(0, 8)}...` })
    } catch (err) {
      steps.push({ step: '1. Auth', status: 'FAIL', ms: Date.now() - s, error: String(err) })
      return NextResponse.json({ steps, totalMs: Date.now() - start })
    }
  }

  // ── 2. Admin + Paid check ──────────────────────────────────────────────────
  let isAdmin = false
  let hasPaidAccess = false
  {
    const s = Date.now()
    try {
      const svc = await createServiceClient()
      const results = await Promise.all([
        checkPaidAccess(svc, userId!),
        checkIsAdmin(svc, userId!),
      ])
      hasPaidAccess = results[0]
      isAdmin = results[1]
      steps.push({
        step: '2. Access check',
        status: 'OK',
        ms: Date.now() - s,
        detail: `hasPaidAccess=${hasPaidAccess}, isAdmin=${isAdmin}`,
      })
    } catch (err) {
      steps.push({ step: '2. Access check', status: 'FAIL', ms: Date.now() - s, error: String(err) })
    }
  }

  // ── 3. Tema lookup ─────────────────────────────────────────────────────────
  let temaId = request.nextUrl.searchParams.get('temaId')
  let temaTitulo = ''
  {
    const s = Date.now()
    try {
      const svc = await createServiceClient()
      if (!temaId) {
        // Si no se pasa temaId, usar tema 1
        const { data: temas } = await svc.from('temas').select('id, numero, titulo').eq('numero', 1).single()
        temaId = temas?.id ?? null
        temaTitulo = temas?.titulo ?? 'Desconocido'
      } else {
        const { data: tema } = await svc.from('temas').select('titulo').eq('id', temaId).single()
        temaTitulo = tema?.titulo ?? 'Desconocido'
      }
      steps.push({
        step: '3. Tema lookup',
        status: temaId ? 'OK' : 'FAIL',
        ms: Date.now() - s,
        detail: `temaId=${temaId?.slice(0, 8)}, titulo="${temaTitulo}"`,
      })
    } catch (err) {
      steps.push({ step: '3. Tema lookup', status: 'FAIL', ms: Date.now() - s, error: String(err) })
    }
  }

  if (!temaId) {
    return NextResponse.json({ steps, totalMs: Date.now() - start, error: 'No se encontró tema' })
  }

  // ── 4. Concurrency check ───────────────────────────────────────────────────
  {
    const s = Date.now()
    try {
      const supabase = await createClient()
      const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString()
      const { data: testEnProgreso } = await supabase
        .from('tests_generados')
        .select('id, created_at')
        .eq('user_id', userId!)
        .eq('completado', false)
        .gte('created_at', thirtySecondsAgo)
        .limit(1)
        .maybeSingle()

      if (testEnProgreso) {
        steps.push({
          step: '4. Concurrency check',
          status: 'FAIL',
          ms: Date.now() - s,
          error: `Test en progreso: ${testEnProgreso.id} (created: ${testEnProgreso.created_at}). Espera 30s.`,
        })
      } else {
        steps.push({ step: '4. Concurrency check', status: 'OK', ms: Date.now() - s, detail: 'Sin tests en progreso' })
      }
    } catch (err) {
      steps.push({ step: '4. Concurrency check', status: 'FAIL', ms: Date.now() - s, error: String(err) })
    }
  }

  // ── 5. RAG buildContext ────────────────────────────────────────────────────
  let contextChars = 0
  {
    const s = Date.now()
    try {
      const { buildContext, formatContext } = await import('@/lib/ai/retrieval')
      const ctx = await buildContext(temaId, undefined, userId!)
      const formatted = formatContext(ctx)
      contextChars = formatted.length

      steps.push({
        step: '5. RAG buildContext',
        status: ctx.articulos.length > 0 ? 'OK' : 'FAIL',
        ms: Date.now() - s,
        detail: `${ctx.articulos.length} artículos, ${formatted.length} chars, strategy=${ctx.strategy}, esBloqueII=${ctx.esBloqueII}`,
        error: ctx.articulos.length === 0 ? 'CONTEXTO VACÍO' : undefined,
      })
    } catch (err) {
      steps.push({ step: '5. RAG buildContext', status: 'FAIL', ms: Date.now() - s, error: String(err) })
    }
  }

  // ── 6. Full generateTest (1 pregunta para diagnóstico rápido) ──────────────
  {
    const s = Date.now()
    if (contextChars === 0) {
      steps.push({ step: '6. generateTest(1q)', status: 'SKIP', ms: 0, error: 'Sin contexto (paso 5)' })
    } else {
      try {
        const { generateTest } = await import('@/lib/ai/generate-test')
        const test = await generateTest({
          temaId,
          numPreguntas: 1,
          dificultad: 'facil',
          userId: userId!,
          requestId: 'debug-generate',
        })
        steps.push({
          step: '6. generateTest(1q)',
          status: 'OK',
          ms: Date.now() - s,
          detail: `testId=${test.id}, preguntas=${test.preguntas.length}, enunciado="${test.preguntas[0]?.enunciado?.slice(0, 60)}..."`,
        })
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        steps.push({ step: '6. generateTest(1q)', status: 'FAIL', ms: Date.now() - s, error: msg.slice(0, 500) })
      }
    }
  }

  // ── 7. Full generateTest (10 preguntas — lo que pide el usuario) ───────────
  {
    const s = Date.now()
    const step6ok = steps.find(st => st.step.startsWith('6.'))?.status === 'OK'
    if (!step6ok) {
      steps.push({ step: '7. generateTest(10q)', status: 'SKIP', ms: 0, error: 'Paso 6 falló' })
    } else {
      try {
        const { generateTest } = await import('@/lib/ai/generate-test')
        const test = await generateTest({
          temaId,
          numPreguntas: 10,
          dificultad: 'facil',
          userId: userId!,
          requestId: 'debug-generate-10q',
        })
        steps.push({
          step: '7. generateTest(10q)',
          status: 'OK',
          ms: Date.now() - s,
          detail: `testId=${test.id}, preguntas=${test.preguntas.length}`,
        })
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        steps.push({ step: '7. generateTest(10q)', status: 'FAIL', ms: Date.now() - s, error: msg.slice(0, 500) })
      }
    }
  }

  const totalMs = Date.now() - start
  const allOk = steps.every(s => s.status === 'OK' || s.status === 'SKIP')

  logger.info({ steps, totalMs, allOk }, '[debug] generate diagnostic complete')

  return NextResponse.json({
    status: allOk ? 'ALL OK' : 'FAILURE DETECTED',
    totalMs,
    steps,
  }, { status: allOk ? 200 : 500, headers: { 'Cache-Control': 'no-store' } })
}
