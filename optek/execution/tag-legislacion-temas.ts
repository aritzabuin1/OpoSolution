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

// ── Mapeo nombre simbólico → ley_codigo(s) en BD ─────────────────────────────
// Algunas leyes tienen múltiples entradas (ej: LOPJ completa + parcial)
const CODE_MAP: Record<string, string[]> = {
  CE:           ['CE', 'BOE-A-1978-31229'],
  TREBEP:       ['TREBEP', 'BOE-A-2015-11719'],
  LPAC:         ['LPAC', 'BOE-A-2015-10565'],
  LRJSP:        ['BOE-A-2015-10566'],
  LOPDGDD:      ['BOE-A-2018-16673'],
  LO_IGUALDAD:  ['BOE-A-2007-6115'],
  LO_VG:        ['BOE-A-2004-21760'],
  PRL:          ['BOE-A-1995-24292'],
  LCSP:         ['BOE-A-2017-12902'],
  LOPJ:         ['BOE-A-1985-12666'],
  LEC:          ['BOE-A-2000-323'],
  LECRIM:       ['BOE-A-1882-6036'],
  LO_SPJ:       ['BOE-A-2025-76'],
  LGTBI:        ['BOE-A-2023-5366'],
  LEY_IGUALDAD_TRATO: ['BOE-A-2022-11589'],
  LEY_POSTAL:   ['BOE-A-2010-20139'],
  RD_POSTAL:    ['BOE-A-1999-24919', 'BOE-A-2024-10010'],
}

// Resolve symbolic name to all matching ley_codigos
function resolveCodes(name: string): string[] {
  return CODE_MAP[name] ?? [name]
}

// ── Reglas de tagging ────────────────────────────────────────────────────────
// Estas reglas definen qué artículos de leyes existentes se asocian a qué temas

const JUSTICIA_RULES: TaggingRule[] = [
  // Constitución → T1-T5 de Auxilio, Tramitación, Gestión
  { ley_codigo: 'CE', oposicion_slug: 'auxilio-judicial', temas: [1, 2, 3] },
  { ley_codigo: 'CE', oposicion_slug: 'tramitacion-procesal', temas: [1, 2, 3] },
  { ley_codigo: 'CE', oposicion_slug: 'gestion-procesal', temas: [1, 2, 3, 4, 5] },
  // LOPJ → organización judicial
  { ley_codigo: 'LOPJ', oposicion_slug: 'auxilio-judicial', temas: [4, 5, 6, 7, 8, 9, 10] },
  { ley_codigo: 'LOPJ', oposicion_slug: 'tramitacion-procesal', temas: [4, 5, 6, 7, 8, 9] },
  { ley_codigo: 'LOPJ', oposicion_slug: 'gestion-procesal', temas: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
  // LO 1/2025 Servicio Público de Justicia
  { ley_codigo: 'LO_SPJ', oposicion_slug: 'auxilio-judicial', temas: [8, 10] },
  { ley_codigo: 'LO_SPJ', oposicion_slug: 'tramitacion-procesal', temas: [8, 10] },
  { ley_codigo: 'LO_SPJ', oposicion_slug: 'gestion-procesal', temas: [16, 18] },
  // TREBEP → personal de Justicia
  { ley_codigo: 'TREBEP', oposicion_slug: 'auxilio-judicial', temas: [11, 12, 13] },
  { ley_codigo: 'TREBEP', oposicion_slug: 'tramitacion-procesal', temas: [10, 11, 12] },
  { ley_codigo: 'TREBEP', oposicion_slug: 'gestion-procesal', temas: [17, 18, 19, 20, 21, 22] },
  // LEC → procedimiento civil
  { ley_codigo: 'LEC', oposicion_slug: 'auxilio-judicial', temas: [14, 15, 16, 17] },
  { ley_codigo: 'LEC', oposicion_slug: 'tramitacion-procesal', temas: [13, 14, 15, 16, 17, 18, 19, 20] },
  { ley_codigo: 'LEC', oposicion_slug: 'gestion-procesal', temas: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39] },
  // LECrim → procedimiento penal
  { ley_codigo: 'LECRIM', oposicion_slug: 'auxilio-judicial', temas: [18, 19, 20, 21] },
  { ley_codigo: 'LECRIM', oposicion_slug: 'tramitacion-procesal', temas: [21, 22, 23, 24, 25, 26, 27, 28] },
  { ley_codigo: 'LECRIM', oposicion_slug: 'gestion-procesal', temas: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56] },
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
  // LGTBI
  { ley_codigo: 'LGTBI', oposicion_slug: 'auxilio-judicial', temas: [24] },
  { ley_codigo: 'LGTBI', oposicion_slug: 'tramitacion-procesal', temas: [35] },
  { ley_codigo: 'LGTBI', oposicion_slug: 'gestion-procesal', temas: [66] },
  // Igualdad de trato
  { ley_codigo: 'LEY_IGUALDAD_TRATO', oposicion_slug: 'auxilio-judicial', temas: [24] },
  { ley_codigo: 'LEY_IGUALDAD_TRATO', oposicion_slug: 'tramitacion-procesal', temas: [35] },
  { ley_codigo: 'LEY_IGUALDAD_TRATO', oposicion_slug: 'gestion-procesal', temas: [66] },
  // PRL
  { ley_codigo: 'PRL', oposicion_slug: 'auxilio-judicial', temas: [25] },
  { ley_codigo: 'PRL', oposicion_slug: 'tramitacion-procesal', temas: [36] },
  { ley_codigo: 'PRL', oposicion_slug: 'gestion-procesal', temas: [67] },
  // LCSP → contratación
  { ley_codigo: 'LCSP', oposicion_slug: 'tramitacion-procesal', temas: [32] },
  { ley_codigo: 'LCSP', oposicion_slug: 'gestion-procesal', temas: [60] },
]

const CORREOS_RULES: TaggingRule[] = [
  // Ley Postal + Reglamento Postal → temas 1-9
  { ley_codigo: 'LEY_POSTAL', oposicion_slug: 'correos', temas: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { ley_codigo: 'RD_POSTAL', oposicion_slug: 'correos', temas: [1, 6, 7, 8, 9] },
  // LOPDGDD + RGPD → T12
  { ley_codigo: 'LOPDGDD', oposicion_slug: 'correos', temas: [12] },
  // Igualdad → T10
  { ley_codigo: 'LO_IGUALDAD', oposicion_slug: 'correos', temas: [10] },
  { ley_codigo: 'LGTBI', oposicion_slug: 'correos', temas: [10] },
  { ley_codigo: 'LEY_IGUALDAD_TRATO', oposicion_slug: 'correos', temas: [10] },
  // PRL → T10
  { ley_codigo: 'PRL', oposicion_slug: 'correos', temas: [10] },
  // Certificado digital → T11
  // (no hay ley específica ingestionada, se genera con IA)
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

    // Fetch all articles for this ley (resolve symbolic name to BOE codes)
    const codes = resolveCodes(rule.ley_codigo)
    const allArticles: Array<{ id: string; tema_ids: string[] | null }> = []
    for (const code of codes) {
      const { data } = await supabase
        .from('legislacion')
        .select('id, tema_ids')
        .eq('ley_codigo', code)
        .eq('activo', true)
      if (data?.length) allArticles.push(...data)
    }

    if (allArticles.length === 0) {
      console.warn(`  No articles found for ley ${rule.ley_codigo} (codes: ${codes.join(', ')})`)
      continue
    }

    const articles = allArticles
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
