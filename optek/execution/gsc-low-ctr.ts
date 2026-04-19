/**
 * PlanSEO F3.T1 — identificar top N CTR-bajas vía GSC API
 *
 * Uso: `pnpm tsx execution/gsc-low-ctr.ts [--days 28] [--min 500] [--ctr 0.02] [--limit 15]`
 *
 * Genera CSV en `.tmp/gsc-low-ctr-top15.csv` + imprime tabla en consola.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { getLowCtrPages } from '../lib/seo/gsc-queries'

function parseArg(name: string, fallback: number): number {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1) return fallback
  const v = Number(process.argv[idx + 1])
  return Number.isFinite(v) ? v : fallback
}

async function main() {
  const days = parseArg('days', 28)
  const minImpressions = parseArg('min', 500)
  const maxCtr = parseArg('ctr', 0.02)
  const limit = parseArg('limit', 15)

  console.log(`🔍 GSC low-CTR scan — últimos ${days}d, imp≥${minImpressions}, CTR<${(maxCtr * 100).toFixed(1)}%, top ${limit}`)

  const rows = await getLowCtrPages({ days, minImpressions, maxCtr, limit })
  if (rows.length === 0) {
    console.log('✅ No hay páginas con CTR bajo en el umbral — nada que reescribir.')
    return
  }

  console.table(
    rows.map(r => ({
      page: r.keys[0],
      impresiones: r.impressions,
      clicks: r.clicks,
      ctr: `${(r.ctr * 100).toFixed(2)}%`,
      pos: r.position.toFixed(1),
    })),
  )

  const out = '.tmp/gsc-low-ctr-top15.csv'
  mkdirSync(dirname(out), { recursive: true })
  const header = 'page,impressions,clicks,ctr,position\n'
  const body = rows
    .map(r => `"${r.keys[0]}",${r.impressions},${r.clicks},${r.ctr.toFixed(4)},${r.position.toFixed(2)}`)
    .join('\n')
  writeFileSync(out, header + body + '\n', 'utf8')
  console.log(`\n📄 CSV escrito en ${out}`)
}

main().catch(err => {
  console.error('❌ Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
