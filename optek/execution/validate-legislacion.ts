/**
 * execution/validate-legislacion.ts — OPTEK §1.1.8
 *
 * Valida la integridad de todos los archivos JSON de legislación en data/legislacion/.
 *
 * Comprobaciones por archivo:
 *   1. Campos raíz requeridos: ley_nombre, ley_codigo, ley_nombre_completo, articulos[]
 *   2. Encoding correcto (UTF-8 sin BOM, acentos y ñ legibles)
 *   3. Cada artículo tiene: numero, titulo_articulo, texto_integro no vacío
 *   4. Sin artículos con texto_integro vacío o null
 *   5. Numeración no duplicada dentro del mismo archivo
 *   6. Sin artículos con texto demasiado corto (< 10 chars — probablemente mal parseado)
 *
 * Ejecutar:
 *   pnpm tsx execution/validate-legislacion.ts
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticuloJSON {
  numero: string
  titulo_articulo: string
  titulo_seccion: string
  texto_integro: string
}

interface LeyJSON {
  ley_nombre: string
  ley_codigo: string
  ley_nombre_completo: string
  fecha_scraping?: string
  total_articulos?: number
  articulos: ArticuloJSON[]
}

interface ValidationResult {
  file: string
  leyCodigo: string
  totalArticulos: number
  errors: string[]
  warnings: string[]
  ok: boolean
}

// ─── Validación ───────────────────────────────────────────────────────────────

const MIN_TEXTO_LENGTH = 10
const REQUIRED_ROOT_FIELDS = ['ley_nombre', 'ley_codigo', 'ley_nombre_completo', 'articulos'] as const
const REQUIRED_ARTICULO_FIELDS = ['numero', 'titulo_articulo', 'texto_integro'] as const

function validateFile(filePath: string, fileName: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  let data: LeyJSON
  try {
    const raw = readFileSync(filePath, 'utf-8')

    // Detectar BOM
    if (raw.charCodeAt(0) === 0xFEFF) {
      warnings.push('BOM detectado al inicio del archivo (UTF-8 BOM)')
    }

    data = JSON.parse(raw) as LeyJSON
  } catch (err) {
    return {
      file: fileName,
      leyCodigo: 'PARSE_ERROR',
      totalArticulos: 0,
      errors: [`JSON inválido: ${err instanceof Error ? err.message : String(err)}`],
      warnings,
      ok: false,
    }
  }

  // 1. Campos raíz
  for (const field of REQUIRED_ROOT_FIELDS) {
    if (!data[field]) {
      errors.push(`Campo raíz faltante: '${field}'`)
    }
  }

  if (!Array.isArray(data.articulos)) {
    errors.push("'articulos' no es un array")
    return { file: fileName, leyCodigo: data.ley_codigo ?? '?', totalArticulos: 0, errors, warnings, ok: false }
  }

  // 2. Verificar total declarado vs real
  if (data.total_articulos !== undefined && data.total_articulos !== data.articulos.length) {
    warnings.push(`total_articulos (${data.total_articulos}) != articulos.length (${data.articulos.length})`)
  }

  // 3. Validar artículos
  const numerosVistos = new Set<string>()

  for (let i = 0; i < data.articulos.length; i++) {
    const art = data.articulos[i]
    const ctx = `Artículo [${i}]`

    // Campos requeridos
    for (const field of REQUIRED_ARTICULO_FIELDS) {
      if (!art[field]) {
        errors.push(`${ctx}: campo '${field}' faltante o vacío`)
      }
    }

    // Texto vacío o muy corto
    if (typeof art.texto_integro === 'string') {
      const trimmed = art.texto_integro.trim()
      if (trimmed.length === 0) {
        errors.push(`${ctx} (núm. ${art.numero ?? '?'}): texto_integro vacío`)
      } else if (trimmed.length < MIN_TEXTO_LENGTH) {
        warnings.push(`${ctx} (núm. ${art.numero ?? '?'}): texto_integro muy corto (${trimmed.length} chars): "${trimmed}"`)
      }
    }

    // Duplicados
    if (art.numero !== undefined) {
      if (numerosVistos.has(String(art.numero))) {
        warnings.push(`Número duplicado: '${art.numero}'`)
      }
      numerosVistos.add(String(art.numero))
    }

    // Acentos/ñ — detección básica de encoding roto
    if (typeof art.texto_integro === 'string') {
      if (art.texto_integro.includes('Ã') || art.texto_integro.includes('Â')) {
        errors.push(`${ctx} (núm. ${art.numero ?? '?'}): posible encoding roto (caracteres Ã/Â detectados)`)
      }
    }
  }

  return {
    file: fileName,
    leyCodigo: data.ley_codigo ?? '?',
    totalArticulos: data.articulos.length,
    errors,
    warnings,
    ok: errors.length === 0,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const legDir = join(process.cwd(), '..', 'data', 'legislacion')

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  OPTEK validate-legislacion.ts — §1.1.8                    ║')
  console.log('║  Validación de integridad de data/legislacion/*.json        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  if (!existsSync(legDir)) {
    console.error(`❌ Directorio no encontrado: ${legDir}`)
    process.exit(1)
  }

  const files = readdirSync(legDir).filter(f => f.endsWith('.json'))

  if (files.length === 0) {
    console.error('❌ No se encontraron archivos .json en data/legislacion/')
    process.exit(1)
  }

  const results: ValidationResult[] = []

  for (const file of files.sort()) {
    const result = validateFile(join(legDir, file), file)
    results.push(result)

    const icon = result.ok ? (result.warnings.length > 0 ? '⚠️ ' : '✅') : '❌'
    console.log(`${icon} ${file.padEnd(52, '.')} ${String(result.totalArticulos).padStart(4)} artículos`)

    for (const err of result.errors) {
      console.log(`     ERROR: ${err}`)
    }
    for (const warn of result.warnings) {
      console.log(`     WARN:  ${warn}`)
    }
  }

  // Resumen
  const okCount = results.filter(r => r.ok).length
  const errCount = results.filter(r => !r.ok).length
  const warnCount = results.filter(r => r.warnings.length > 0).length
  const totalArticulos = results.reduce((sum, r) => sum + r.totalArticulos, 0)

  console.log()
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Archivos validados:   ${files.length}`)
  console.log(`  ✅ Sin errores:       ${okCount}`)
  console.log(`  ❌ Con errores:       ${errCount}`)
  console.log(`  ⚠️  Con advertencias: ${warnCount}`)
  console.log(`  Total artículos:      ${totalArticulos}`)
  console.log('═══════════════════════════════════════════════════════════════')

  if (errCount > 0) {
    console.log()
    console.log('  ❌ Validación FALLIDA — corregir errores antes de ingestar')
    process.exit(1)
  } else {
    console.log()
    console.log('  ✅ Validación PASADA — data/legislacion/ lista para ingesta')
  }
}

main()
