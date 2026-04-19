/**
 * execution/generate-article-summaries.ts — PlanSEO F1.T5
 *
 * Genera TL;DR IA cacheadas en `article_summaries` para cada artículo indexable.
 * Objetivo: añadir information gain frente al BOE. 2-3 frases que expliquen el
 * propósito del artículo en lenguaje llano para opositores.
 *
 * Uso:
 *   pnpm exec tsx --env-file=.env.local execution/generate-article-summaries.ts [--ley CE] [--limit 50] [--force]
 *
 * Sin --force, salta artículos que ya tengan TL;DR con prompt_version actual.
 */

import { createClient } from '@supabase/supabase-js'
import { callAIMini } from '../lib/ai/provider'
import { isArticleIndexable } from '../lib/seo/indexability'
import articleIndex from '../data/seo/article-index.json'
import { LEY_REGISTRY } from '../data/seo/ley-registry'

const PROMPT_VERSION = '1.0.0'
const MODEL_TAG = 'claude-haiku-4-5-or-gpt-5-mini'

const SYSTEM_PROMPT = `Eres un profesor de oposiciones españolas. Tu tarea: leer un artículo legal y escribir un resumen de 2-3 frases (máx 320 caracteres) que:

1. Explique en lenguaje llano qué regula el artículo.
2. Destaque el punto examinable que más se pregunta.
3. NO repita literalmente el texto del BOE; aporta paráfrasis didáctica.

Responde SOLO con el resumen, sin preámbulos ni viñetas.`

interface Args {
  ley?: string
  limit: number
  force: boolean
}

function parseArgs(): Args {
  const args: Args = { limit: Number.POSITIVE_INFINITY, force: false }
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i]
    if (a === '--ley') args.ley = process.argv[++i]
    else if (a === '--limit') args.limit = Number(process.argv[++i])
    else if (a === '--force') args.force = true
  }
  return args
}

async function main() {
  const args = parseArgs()
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const lawsToProcess = args.ley
    ? LEY_REGISTRY.filter(l => l.leyNombre === args.ley || l.slug === args.ley)
    : LEY_REGISTRY.filter(l => l.enabled)

  if (lawsToProcess.length === 0) {
    console.error(`No law matched ${args.ley}`)
    process.exit(1)
  }

  const { data: existingRows } = await supa
    .from('article_summaries')
    .select('ley_nombre, articulo_numero, prompt_version')

  const existing = new Set(
    (existingRows ?? [])
      .filter(r => args.force || r.prompt_version === PROMPT_VERSION)
      .map(r => `${r.ley_nombre}:${r.articulo_numero}`),
  )

  let processed = 0
  let skipped = 0
  let failed = 0

  for (const ley of lawsToProcess) {
    const entry = articleIndex.laws.find(l => l.leyNombre === ley.leyNombre)
    if (!entry) continue

    for (const numero of entry.articles) {
      if (processed >= args.limit) break
      if (!isArticleIndexable(ley.leyNombre, numero)) continue
      const key = `${ley.leyNombre}:${numero}`
      if (existing.has(key)) { skipped++; continue }

      // Fetch article text from DB
      const { data: rows, error } = await supa
        .from('legislacion')
        .select('texto_integro, titulo_capitulo')
        .eq('ley_nombre', ley.leyNombre)
        .eq('articulo_numero', numero)
        .eq('activo', true)
        .limit(5)

      if (error || !rows || rows.length === 0) continue

      const texto = rows.map(r => r.texto_integro).filter(Boolean).join('\n').slice(0, 2500)
      if (texto.length < 80) continue

      const userPrompt = `LEY: ${ley.fullName}
ARTÍCULO: ${numero}
${rows[0].titulo_capitulo ? `SECCIÓN: ${rows[0].titulo_capitulo.slice(0, 120)}\n` : ''}
TEXTO:
${texto}

Escribe el resumen (máx 320 caracteres):`

      try {
        const raw = await callAIMini(userPrompt, {
          systemPrompt: SYSTEM_PROMPT,
          maxTokens: 220,
          temperature: 0.3,
        })
        const tldr = raw.trim().replace(/^"|"$/g, '').slice(0, 480)
        if (tldr.length < 40) { failed++; continue }

        const { error: insErr } = await supa
          .from('article_summaries')
          .upsert({
            ley_nombre: ley.leyNombre,
            articulo_numero: numero,
            tldr,
            model: MODEL_TAG,
            prompt_version: PROMPT_VERSION,
            generated_at: new Date().toISOString(),
          })
        if (insErr) { console.error(`[${key}] insert:`, insErr.message); failed++; continue }
        processed++
        if (processed % 20 === 0) console.log(`...${processed} procesados (skip: ${skipped}, fail: ${failed})`)
      } catch (err) {
        console.error(`[${key}] ${(err as Error).message}`)
        failed++
      }
    }
    if (processed >= args.limit) break
  }

  console.log(`\nDone. processed=${processed} skipped=${skipped} failed=${failed}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
