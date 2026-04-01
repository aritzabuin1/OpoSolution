/**
 * execution/seed-estudiar.ts
 *
 * Pre-genera los 2 bloques gratuitos de resúmenes de estudio:
 * - CE arts. 14-29 (Derechos Fundamentales)
 * - LPAC arts. 53-67 (Procedimiento administrativo)
 *
 * Coste estimado: ~$0.10
 *
 * Usage:
 *   pnpm tsx execution/seed-estudiar.ts
 */

import { createClient } from '@supabase/supabase-js'
import { SYSTEM_ESTUDIAR, buildEstudiarPrompt } from '../lib/estudiar/prompts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// We use OpenAI directly here (like other execution scripts) to avoid importing Next.js modules
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface SeedBlock {
  ley_codigo: string
  rango: string
  titulo: string
  minArt: number
  maxArt: number
}

const BLOCKS_TO_SEED: SeedBlock[] = [
  // ─── CE (UNIVERSAL — todas las oposiciones) ───────────────────────────────
  {
    ley_codigo: 'CE',
    rango: 'Preliminar-9',
    titulo: 'Constitución Española — Título Preliminar y valores superiores',
    minArt: 1,
    maxArt: 9,
  },
  {
    ley_codigo: 'CE',
    rango: '14-29',
    titulo: 'Constitución Española — Derechos Fundamentales y Libertades Públicas (arts. 14-29)',
    minArt: 14,
    maxArt: 29,
  },
  {
    ley_codigo: 'CE',
    rango: '97-107',
    titulo: 'Constitución Española — Gobierno y Administración (arts. 97-107)',
    minArt: 97,
    maxArt: 107,
  },
  {
    ley_codigo: 'CE',
    rango: '137-158',
    titulo: 'Constitución Española — Organización Territorial del Estado (arts. 137-158)',
    minArt: 137,
    maxArt: 158,
  },

  // ─── LPAC (AGE + Correos + Justicia + Seguridad) ─────────────────────────
  {
    ley_codigo: 'BOE-A-2015-10565',
    rango: '53-67',
    titulo: 'LPAC — Procedimiento administrativo común (arts. 53-67)',
    minArt: 53,
    maxArt: 67,
  },
  {
    ley_codigo: 'BOE-A-2015-10565',
    rango: '34-52',
    titulo: 'LPAC — Acto administrativo: requisitos, eficacia, nulidad (arts. 34-52)',
    minArt: 34,
    maxArt: 52,
  },

  // ─── TREBEP (AGE + Correos + Justicia) ────────────────────────────────────
  {
    ley_codigo: 'BOE-A-2015-11719',
    rango: '1-13',
    titulo: 'TREBEP — Objeto, ámbito y derechos individuales (arts. 1-13)',
    minArt: 1,
    maxArt: 13,
  },

  // ─── LGT (Hacienda) ──────────────────────────────────────────────────────
  {
    ley_codigo: 'BOE-A-2003-23186',
    rango: '1-16',
    titulo: 'Ley General Tributaria — Principios generales (arts. 1-16)',
    minArt: 1,
    maxArt: 16,
  },

  // ─── CP (Penitenciarias + Seguridad) ──────────────────────────────────────
  {
    ley_codigo: 'BOE-A-1995-25444',
    rango: '1-9',
    titulo: 'Código Penal — Garantías penales y aplicación de la ley (arts. 1-9)',
    minArt: 1,
    maxArt: 9,
  },

  // ─── LOGP (Penitenciarias) ────────────────────────────────────────────────
  {
    ley_codigo: 'BOE-A-1979-23708',
    rango: '1-24',
    titulo: 'Ley General Penitenciaria — Disposiciones generales y derechos (arts. 1-24)',
    minArt: 1,
    maxArt: 24,
  },

  // ─── LO 2/1986 FCSE (Seguridad — GC, PN, Ertzaintza) ────────────────────
  {
    ley_codigo: 'BOE-A-1986-6859',
    rango: '1-8',
    titulo: 'LO FCSE — Disposiciones generales y principios básicos (arts. 1-8)',
    minArt: 1,
    maxArt: 8,
  },
  {
    ley_codigo: 'BOE-A-1986-6859',
    rango: '9-25',
    titulo: 'LO FCSE — Fuerzas y Cuerpos de Seguridad del Estado (arts. 9-25)',
    minArt: 9,
    maxArt: 25,
  },

  // ─── Seguridad Ciudadana (Seguridad) ──────────────────────────────────────
  {
    ley_codigo: 'BOE-A-2015-3442',
    rango: '1-8',
    titulo: 'LO Seguridad Ciudadana — Disposiciones generales (arts. 1-8)',
    minArt: 1,
    maxArt: 8,
  },

  // ─── Estatuto de Gernika (Ertzaintza) ─────────────────────────────────────
  {
    ley_codigo: 'BOE-A-1979-30177',
    rango: '1-12',
    titulo: 'Estatuto de Gernika — Disposiciones generales y competencias (arts. 1-12)',
    minArt: 1,
    maxArt: 12,
  },

  // ─── LECrim (Justicia) ────────────────────────────────────────────────────
  {
    ley_codigo: 'BOE-A-1882-6036',
    rango: '1-100',
    titulo: 'LECrim — Disposiciones generales y competencia (arts. 1-100)',
    minArt: 1,
    maxArt: 100,
  },
]

async function generateWithOpenAI(system: string, user: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('No OPENAI_API_KEY')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function generateWithAnthropic(system: string, user: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('No ANTHROPIC_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${errText}`)
  }
  const data = await res.json()
  return data.content[0].text
}

async function generateContent(system: string, user: string): Promise<string> {
  // Try OpenAI first (cheaper), fallback to Anthropic
  if (OPENAI_API_KEY) {
    try {
      return await generateWithOpenAI(system, user)
    } catch (err) {
      console.warn('⚠️  OpenAI failed, trying Anthropic...', (err as Error).message)
    }
  }
  return await generateWithAnthropic(system, user)
}

async function seedBlock(block: SeedBlock) {
  console.log(`\n📚 Processing: ${block.titulo}`)

  // Check if already exists
  const { data: existing } = await supabase
    .from('resumen_legislacion')
    .select('id')
    .eq('ley_codigo', block.ley_codigo)
    .eq('rango', block.rango)
    .single()

  if (existing) {
    console.log('  ✅ Already exists, skipping')
    return
  }

  // Fetch articles — filter range server-side to avoid Supabase 1000 row limit.
  // articulo_numero is TEXT, so we use gte/lte with string comparison.
  // To get correct numeric range, we paginate per article number.
  const allArticulos: { articulo_numero: string; texto_integro: string; titulo_capitulo: string | null }[] = []
  for (let artNum = block.minArt; artNum <= block.maxArt; artNum++) {
    const { data: rows } = await supabase
      .from('legislacion')
      .select('articulo_numero, texto_integro, titulo_capitulo')
      .eq('ley_codigo', block.ley_codigo)
      .eq('articulo_numero', String(artNum))
      .limit(50)
    if (rows) allArticulos.push(...rows)
  }
  const articulos = allArticulos
  const error = null

  if (error || !articulos) {
    console.error(`  ❌ Failed to fetch articles:`, error?.message)
    return
  }

  const inRange = articulos

  if (inRange.length === 0) {
    console.error(`  ❌ No articles found for ${block.ley_codigo} range ${block.rango}`)
    return
  }

  // Deduplicate by articulo_numero — merge apartados into a single text
  const byNum = new Map<string, { numero: string; textos: string[]; titulo: string }>()
  for (const a of inRange) {
    const existing = byNum.get(a.articulo_numero)
    if (existing) {
      existing.textos.push(a.texto_integro)
    } else {
      byNum.set(a.articulo_numero, { numero: a.articulo_numero, textos: [a.texto_integro], titulo: a.titulo_capitulo ?? '' })
    }
  }
  let filtered = [...byNum.values()].map(v => ({
    articulo_numero: v.numero,
    texto_integro: v.textos.join('\n'),
    titulo_capitulo: v.titulo,
  }))

  // Truncate total content to ~60K chars (~15K tokens) to stay within rate limits
  const MAX_CHARS = 60000
  let totalChars = filtered.reduce((sum, a) => sum + a.texto_integro.length, 0)
  if (totalChars > MAX_CHARS) {
    console.log(`  ⚠️  Content too large (${totalChars} chars), truncating per article...`)
    // Truncate each article proportionally
    const maxPerArticle = Math.floor(MAX_CHARS / filtered.length)
    filtered = filtered.map(a => ({
      ...a,
      texto_integro: a.texto_integro.slice(0, maxPerArticle),
    }))
    totalChars = filtered.reduce((sum, a) => sum + a.texto_integro.length, 0)
    console.log(`  📏 Truncated to ${totalChars} chars`)
  }

  console.log(`  📄 ${filtered.length} artículos (${inRange.length} apartados) encontrados`)

  // Generate
  const prompt = buildEstudiarPrompt(
    block.titulo.split(' — ')[0],
    block.rango,
    block.titulo,
    filtered.map(a => ({
      numero: a.articulo_numero,
      texto_integro: a.texto_integro,
      titulo_capitulo: a.titulo_capitulo ?? '',
    }))
  )

  console.log('  🤖 Generando resumen con IA...')
  const contenido = await generateContent(SYSTEM_ESTUDIAR, prompt)
  console.log(`  ✍️  ${contenido.length} caracteres generados`)

  // Insert
  const { error: insertErr } = await supabase
    .from('resumen_legislacion')
    .insert({
      ley_codigo: block.ley_codigo,
      rango: block.rango,
      titulo: block.titulo,
      contenido,
    })

  if (insertErr) {
    console.error(`  ❌ Insert failed:`, insertErr.message)
  } else {
    console.log('  ✅ Resumen guardado en BD')
  }
}

async function main() {
  console.log('🌱 Seed estudiar — Pre-generando bloques gratuitos\n')

  for (const block of BLOCKS_TO_SEED) {
    await seedBlock(block)
  }

  console.log('\n✅ Seed completado')
}

main().catch(err => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
