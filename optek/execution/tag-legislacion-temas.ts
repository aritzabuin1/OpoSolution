/**
 * execution/tag-legislacion-temas.ts
 *
 * Asocia artículos de legislación existentes con los tema_ids de nuevas oposiciones.
 * Las leyes transversales (CE, TREBEP, LPAC, etc.) ya están ingestionadas para AGE.
 * Este script añade los tema_ids de Correos/Justicia a esos mismos artículos.
 *
 * Uso:
 *   pnpm tag:legislacion --rama justicia
 *   pnpm tag:legislacion --rama correos
 *   pnpm tag:legislacion --dry-run --rama justicia
 *
 * Mapeo: definido en TAGGING_RULES abajo. Cada regla dice:
 *   "para la ley X, artículos que coincidan con patrón Y, añadir tema_ids de oposición Z tema N"
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    if (!(k in process.env)) process.env[k] = t.slice(eq + 1).trim()
  }
}
loadEnv()

interface TaggingRule {
  ley_codigo: string
  oposicion_slug: string
  temas: number[]  // tema números to tag
}

// ── Reglas de tagging ────────────────────────────────────────────────────────
// Estas reglas definen qué artículos de leyes existentes se asocian a qué temas

const JUSTICIA_RULES: TaggingRule[] = [
  // Constitución → T1-T5 de Auxilio, Tramitación, Gestión
  { ley_codigo: 'CE', oposicion_slug: 'auxilio-judicial', temas: [1, 2, 3] },
  { ley_codigo: 'CE', oposicion_slug: 'tramitacion-procesal', temas: [1, 2, 3] },
  { ley_codigo: 'CE', oposicion_slug: 'gestion-procesal', temas: [1, 2, 3, 4, 5] },
  // TREBEP → personal de Justicia
  { ley_codigo: 'TREBEP', oposicion_slug: 'auxilio-judicial', temas: [11, 12, 13] },
  { ley_codigo: 'TREBEP', oposicion_slug: 'tramitacion-procesal', temas: [10, 11, 12] },
  { ley_codigo: 'TREBEP', oposicion_slug: 'gestion-procesal', temas: [17, 18, 19, 20, 21, 22] },
  // LPAC → procedimiento administrativo
  { ley_codigo: 'LPAC', oposicion_slug: 'tramitacion-procesal', temas: [31] },
  { ley_codigo: 'LPAC', oposicion_slug: 'gestion-procesal', temas: [57, 58] },
  // LOPDGDD → protección de datos
  { ley_codigo: 'LOPDGDD', oposicion_slug: 'auxilio-judicial', temas: [26] },
  { ley_codigo: 'LOPDGDD', oposicion_slug: 'tramitacion-procesal', temas: [37] },
  { ley_codigo: 'LOPDGDD', oposicion_slug: 'gestion-procesal', temas: [68] },
  // Igualdad
  { ley_codigo: 'LO_IGUALDAD', oposicion_slug: 'auxilio-judicial', temas: [24] },
  { ley_codigo: 'LO_IGUALDAD', oposicion_slug: 'tramitacion-procesal', temas: [33] },
  { ley_codigo: 'LO_IGUALDAD', oposicion_slug: 'gestion-procesal', temas: [64] },
  // VG
  { ley_codigo: 'LO_VG', oposicion_slug: 'auxilio-judicial', temas: [24] },
  { ley_codigo: 'LO_VG', oposicion_slug: 'tramitacion-procesal', temas: [34] },
  { ley_codigo: 'LO_VG', oposicion_slug: 'gestion-procesal', temas: [65] },
  // PRL
  { ley_codigo: 'PRL', oposicion_slug: 'auxilio-judicial', temas: [25] },
  { ley_codigo: 'PRL', oposicion_slug: 'tramitacion-procesal', temas: [36] },
  { ley_codigo: 'PRL', oposicion_slug: 'gestion-procesal', temas: [67] },
  // LCSP → contratación
  { ley_codigo: 'LCSP', oposicion_slug: 'tramitacion-procesal', temas: [32] },
  { ley_codigo: 'LCSP', oposicion_slug: 'gestion-procesal', temas: [60] },
]

const CORREOS_RULES: TaggingRule[] = [
  { ley_codigo: 'LOPDGDD', oposicion_slug: 'correos', temas: [12] },
  { ley_codigo: 'LO_IGUALDAD', oposicion_slug: 'correos', temas: [10] },
  { ley_codigo: 'PRL', oposicion_slug: 'correos', temas: [10] },
]

async function main() {
  const ramaArg = process.argv.find(a => a.startsWith('--rama='))?.split('=')[1]
    ?? process.argv[process.argv.indexOf('--rama') + 1]
  const dryRun = process.argv.includes('--dry-run')

  if (!ramaArg || !['justicia', 'correos'].includes(ramaArg)) {
    console.error('Usage: pnpm tag:legislacion --rama <justicia|correos> [--dry-run]')
    process.exit(1)
  }

  const rules = ramaArg === 'justicia' ? JUSTICIA_RULES : CORREOS_RULES
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key)

  // Build tema_id lookup: oposicion_slug + tema_numero → tema UUID
  const temaIdMap = new Map<string, string>()
  const slugs = [...new Set(rules.map(r => r.oposicion_slug))]

  for (const slug of slugs) {
    const { data: opo } = await supabase
      .from('oposiciones')
      .select('id')
      .eq('slug', slug)
      .single()
    if (!opo) { console.error(`Oposición "${slug}" not found`); continue }

    const { data: temas } = await supabase
      .from('temas')
      .select('id, numero')
      .eq('oposicion_id', opo.id)

    if (temas) {
      for (const t of temas) {
        temaIdMap.set(`${slug}:${t.numero}`, t.id)
      }
    }
  }

  console.log(`Loaded ${temaIdMap.size} tema mappings for ${slugs.length} oposiciones`)

  let updated = 0

  for (const rule of rules) {
    // Resolve tema UUIDs
    const newTemaIds = rule.temas
      .map(n => temaIdMap.get(`${rule.oposicion_slug}:${n}`))
      .filter((id): id is string => !!id)

    if (newTemaIds.length === 0) {
      console.warn(`  No tema_ids resolved for ${rule.oposicion_slug} temas ${rule.temas}`)
      continue
    }

    // Fetch all articles for this ley
    const { data: articles } = await supabase
      .from('legislacion')
      .select('id, tema_ids')
      .eq('ley_codigo', rule.ley_codigo)
      .eq('activo', true)

    if (!articles?.length) {
      console.warn(`  No articles found for ley ${rule.ley_codigo}`)
      continue
    }

    console.log(`  ${rule.ley_codigo} → ${rule.oposicion_slug} temas ${rule.temas}: ${articles.length} artículos`)

    if (dryRun) continue

    // Append new tema_ids (deduplicated)
    for (const art of articles) {
      const existing = (art.tema_ids as string[]) ?? []
      const merged = [...new Set([...existing, ...newTemaIds])]
      if (merged.length === existing.length) continue // No change

      await supabase
        .from('legislacion')
        .update({ tema_ids: merged })
        .eq('id', art.id)
      updated++
    }
  }

  console.log(`\nDone. Updated ${updated} articles.`)
  if (dryRun) console.log('(dry-run — no changes made)')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
