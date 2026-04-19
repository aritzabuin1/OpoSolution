/**
 * execution/build-radar-tribunal.ts — OPTEK §2.14.2
 *
 * Analiza preguntas_oficiales para construir el ranking de artículos y temas más frecuentes.
 *
 * Estrategia TRIPLE para maximizar cobertura:
 *
 *   Path A — Cita explícita (26% de preguntas):
 *     extractCitations("art. 21 LPAC") → legislacion_id directo
 *     → Incrementa num_apariciones para ESE artículo específico
 *
 *   Path B — Keyword matching por ley (74% restante):
 *     Pregunta menciona "Constitución" / "Ley 39/2015" / "LPAC" sin citar artículo
 *     → Incrementa num_apariciones para TODOS los artículos de esa ley en BD
 *       (con peso fraccionario: 1/num_articulos_de_ley)
 *
 *   Path C — Clasificación por tema (100% preguntas):
 *     Cada pregunta se clasifica en 1+ temas via keywords (28 temas, Bloque I + II)
 *     → Alimenta frecuencias_temas para vista de nivel superior
 *
 * Resultado: 100% de preguntas contribuyen al radar.
 *
 * Script idempotente: puede re-ejecutarse sin efecto secundario.
 * No requiere ANTHROPIC_API_KEY — solo SQL + regex determinista.
 *
 * Uso:
 *   pnpm build:radar
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { extractCitations } from '../lib/ai/verification.js'
import { CITATION_ALIASES } from '../lib/ai/citation-aliases.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Carga .env.local ─────────────────────────────────────────────────────────

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnvLocal()

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PreguntaRow {
  id: string
  enunciado: string
  correcta: number
  opciones: string[]
  examenes_oficiales: { anio: number; oposicion_id: string }
}

interface LegislacionRow {
  id: string
  ley_nombre: string
  ley_codigo: string
  articulo_numero: string
}

interface Acumulador {
  count: number
  anios: Set<number>
}

// ─── Keyword patterns para detectar leyes en texto libre ─────────────────────

// Maps regex patterns → ley_codigo (same codes as legislacion.ley_codigo)
const LEY_KEYWORDS: Array<{ pattern: RegExp; leyCodigo: string }> = [
  { pattern: /constituci[oó]n\s*(?:espa[nñ]ola)?/i, leyCodigo: 'CE' },
  { pattern: /\bley\s+39\/2015\b/i, leyCodigo: 'LPAC' },
  { pattern: /\bLPAC\b/, leyCodigo: 'LPAC' },
  { pattern: /procedimiento\s+administrativo\s+com[uú]n/i, leyCodigo: 'LPAC' },
  { pattern: /\bley\s+40\/2015\b/i, leyCodigo: 'LRJSP' },
  { pattern: /\bLRJSP\b/, leyCodigo: 'LRJSP' },
  { pattern: /r[eé]gimen\s+jur[ií]dico\s+del\s+sector\s+p[uú]blico/i, leyCodigo: 'LRJSP' },
  { pattern: /\bTREBEP\b/i, leyCodigo: 'TREBEP' },
  { pattern: /\bEBEP\b/, leyCodigo: 'TREBEP' },
  { pattern: /estatuto\s+b[aá]sico\s+del\s+empleado\s+p[uú]blico/i, leyCodigo: 'TREBEP' },
  { pattern: /\bRDL\s+5\/2015\b/i, leyCodigo: 'TREBEP' },
  { pattern: /\bley\s+19\/2013\b/i, leyCodigo: 'LTAIBG' },
  { pattern: /\bLTAIBG\b/, leyCodigo: 'LTAIBG' },
  { pattern: /transparencia.*(?:acceso|informaci[oó]n|buen\s+gobierno)/i, leyCodigo: 'LTAIBG' },
  { pattern: /\bley\s+47\/2003\b/i, leyCodigo: 'LGP' },
  { pattern: /\bLGP\b/, leyCodigo: 'LGP' },
  { pattern: /ley\s+general\s+presupuestaria/i, leyCodigo: 'LGP' },
  { pattern: /\bley\s+org[aá]nica\s+3\/2018\b/i, leyCodigo: 'LOPDGDD' },
  { pattern: /\bLOPDGDD\b/, leyCodigo: 'LOPDGDD' },
  { pattern: /protecci[oó]n\s+de\s+datos/i, leyCodigo: 'LOPDGDD' },
  { pattern: /\bley\s+org[aá]nica\s+2\/1979\b/i, leyCodigo: 'LOTC' },
  { pattern: /tribunal\s+constitucional/i, leyCodigo: 'LOTC' },
  { pattern: /\bley\s+50\/1997\b/i, leyCodigo: 'LG' },
  { pattern: /\bley\s+del?\s+gobierno\b/i, leyCodigo: 'LG' },
]

// ─── Keyword patterns para clasificar preguntas por tema (28 temas) ──────────

export const TEMA_KEYWORDS: Array<{ patterns: RegExp[]; temaNumero: number }> = [
  // Bloque I — Legislación
  { patterns: [/constituci[oó]n/i, /\bCE\b/], temaNumero: 1 },
  { patterns: [/tribunal\s+constitucional/i, /\bLOTC\b/], temaNumero: 2 },
  { patterns: [/cortes\s+generales/i, /congreso/i, /senado/i, /diputad/i], temaNumero: 3 },
  { patterns: [/poder\s+judicial/i, /\bCGPJ\b/i, /\bjueces?\b/i, /\bLOPJ\b/], temaNumero: 4 },
  { patterns: [/gobierno\b.*administraci[oó]n/i, /consejo\s+de\s+ministros/i, /presidente\s+del\s+gobierno/i, /\bley\s+50\/1997\b/i], temaNumero: 5 },
  { patterns: [/gobierno\s+abierto/i, /participaci[oó]n\s+ciudadana/i], temaNumero: 6 },
  { patterns: [/transparencia/i, /\bLTAIBG\b/, /buen\s+gobierno/i, /ley\s+19\/2013/i], temaNumero: 7 },
  { patterns: [/administraci[oó]n\s+general\s+del\s+estado/i, /\bAGE\b/, /ministerio/i, /delegaci[oó]n\s+del\s+gobierno/i, /secretar[ií]a\s+de\s+estado/i], temaNumero: 8 },
  { patterns: [/comunidad(?:es)?\s+aut[oó]noma/i, /organizaci[oó]n\s+territorial/i, /estatuto\s+de\s+autonom[ií]a/i], temaNumero: 9 },
  { patterns: [/uni[oó]n\s+europea/i, /\bUE\b/, /comisi[oó]n\s+europea/i, /parlamento\s+europeo/i], temaNumero: 10 },
  { patterns: [/procedimiento\s+administrativo/i, /\bLPAC\b/, /\bLRJSP\b/, /ley\s+39\/2015/i, /ley\s+40\/2015/i, /acto\s+administrativo/i, /silencio\s+administrativo/i, /recurso\s+de\s+alzada/i], temaNumero: 11 },
  { patterns: [/protecci[oó]n\s+de\s+datos/i, /\bLOPDGDD\b/i, /\bRGPD\b/i, /ley\s+org[aá]nica\s+3\/2018/i], temaNumero: 12 },
  { patterns: [/\bTREBEP\b/i, /\bEBEP\b/, /funcionari/i, /empleado\s+p[uú]blico/i, /personal\s+laboral/i, /RDL\s+5\/2015/i], temaNumero: 13 },
  { patterns: [/derechos?\s+(?:y\s+deberes?\s+)?de\s+(?:los\s+)?empleados/i, /permisos?\b/i, /vacaciones/i, /jornada\s+laboral/i, /situaciones?\s+administrativas/i], temaNumero: 14 },
  { patterns: [/presupuesto/i, /\bLGP\b/, /ley\s+47\/2003/i, /ley\s+general\s+presupuestaria/i, /cr[eé]dito\s+extraordinario/i], temaNumero: 15 },
  { patterns: [/igualdad/i, /\bLGTBI\b/i, /violencia\s+de\s+g[eé]nero/i, /discriminaci[oó]n/i], temaNumero: 16 },
  // Bloque II — Ofimática y Actividad Administrativa
  { patterns: [/atenci[oó]n\s+al\s+p[uú]blico/i, /atenci[oó]n\s+ciudadana/i, /quejas?\s+y\s+sugerencias/i], temaNumero: 17 },
  { patterns: [/informaci[oó]n\s+administrativa/i, /servicio\s+de\s+informaci[oó]n/i, /\b060\b/], temaNumero: 18 },
  { patterns: [/registro\b.*(?:entrada|salida|electr[oó]nico)/i, /archivo/i, /documento\s+administrativo/i, /copia\s+aut[eé]ntica/i], temaNumero: 19 },
  { patterns: [/administraci[oó]n\s+electr[oó]nica/i, /sede\s+electr[oó]nica/i, /firma\s+electr[oó]nica/i, /certificado\s+digital/i, /\bDNIe\b/i, /cl@ve/i, /notificaci[oó]n\s+electr[oó]nica/i], temaNumero: 20 },
  { patterns: [/inform[aá]tica\s+b[aá]sica/i, /\bhardware\b/i, /\bsoftware\b/i, /sistema\s+operativo/i, /\bCPU\b/, /memoria\s+RAM/i, /disco\s+duro/i], temaNumero: 21 },
  { patterns: [/windows\s+1[01]/i, /\bcopilot\b/i, /escritorio\s+de\s+windows/i, /barra\s+de\s+tareas/i, /men[uú]\s+inicio/i], temaNumero: 22 },
  { patterns: [/explorador\s+de\s+(?:windows|archivos)/i, /carpeta/i, /archivo.*copiar/i, /copiar.*archivo/i], temaNumero: 23 },
  { patterns: [/\bword\b/i, /procesador\s+de\s+texto/i, /p[aá]rrafo/i, /tabla\s+de\s+contenido/i, /combinar\s+correspondencia/i, /encabezado.*pie/i, /sangr[ií]a/i], temaNumero: 24 },
  { patterns: [/\bexcel\b/i, /hoja\s+de\s+c[aá]lculo/i, /celda/i, /f[oó]rmula/i, /funci[oó]n\s+(?:SUMA|SI|BUSCARV|CONTAR)/i, /tabla\s+din[aá]mica/i, /gr[aá]fico/i], temaNumero: 25 },
  { patterns: [/\baccess\b/i, /base\s+de\s+datos/i, /consulta.*tabla/i, /formulario.*informe/i, /clave\s+primaria/i, /relaci[oó]n.*tablas/i], temaNumero: 26 },
  { patterns: [/\boutlook\b/i, /correo\s+electr[oó]nico/i, /bandeja\s+de\s+entrada/i, /calendario.*cita/i], temaNumero: 27 },
  { patterns: [/\binternet\b/i, /navegador/i, /\bURL\b/, /\bHTTPS?\b/, /\bHTML\b/, /intranet/i, /correo\s+web/i, /protocolo\s+TCP/i], temaNumero: 28 },
]

/**
 * Classify a question text into matching tema numbers via keyword patterns.
 * A question can match multiple temas. Returns deduplicated array of temaNumero.
 */
export function classifyByTema(text: string): number[] {
  const matched = new Set<number>()
  for (const { patterns, temaNumero } of TEMA_KEYWORDS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matched.add(temaNumero)
        break // one match per tema is enough
      }
    }
  }
  return [...matched]
}

interface TemaRow {
  id: string
  numero: number
  oposicion_id: string
  titulo: string
}

// ─── Dynamic keyword generation from tema titles ─────────────────────────────
// Reuses the approach from map-preguntas-tema.ts for oposiciones that don't have
// handcrafted TEMA_KEYWORDS (which are only for C2 AGE temas 1-28).

function escapeRegexStr(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const STOP_WORDS = new Set([
  'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'por', 'para',
  'con', 'sin', 'sobre', 'entre', 'que', 'como', 'más', 'sus', 'su', 'al',
  'y', 'o', 'ni', 'pero', 'tema', 'concepto', 'nociones', 'generales',
  'especial', 'referencia', 'regulación', 'régimen', 'general', 'clases',
  'tipos', 'naturaleza', 'jurídica', 'marco', 'normativo',
])

function generateKeywordsFromTitle(titulo: string): RegExp[] {
  const patterns: RegExp[] = []
  const phrases = titulo.split(/[.,;]/).map(s => s.trim()).filter(s => s.length > 3)

  for (const phrase of phrases) {
    const words = phrase.split(/\s+/).filter(w => w.length > 2)
    const significant = words.filter(w => !STOP_WORDS.has(w.toLowerCase()))

    if (significant.length >= 2 && significant.length <= 5) {
      const pattern = significant.map(w => escapeRegexStr(w)).join('\\s+(?:\\w+\\s+){0,2}')
      try { patterns.push(new RegExp(pattern, 'i')) } catch { /* skip */ }
    }

    for (const word of significant) {
      if (word.length >= 5) {
        try { patterns.push(new RegExp(`\\b${escapeRegexStr(word)}`, 'i')) } catch { /* skip */ }
      }
    }
  }

  // Law references in title
  const lawPatterns = titulo.match(/(?:ley|lo|rd|rdl)\s+[\d/]+/gi)
  if (lawPatterns) {
    for (const law of lawPatterns) {
      try { patterns.push(new RegExp(escapeRegexStr(law).replace(/\s+/g, '\\s+'), 'i')) } catch { /* skip */ }
    }
  }

  // Uppercase abbreviations (3+ chars)
  const abbreviations = titulo.match(/\b[A-Z]{3,}\b/g)
  if (abbreviations) {
    for (const abbr of abbreviations) {
      try { patterns.push(new RegExp(`\\b${escapeRegexStr(abbr)}\\b`)) } catch { /* skip */ }
    }
  }

  return patterns
}

/** Per-oposición keyword map: oposicionId → Array<{temaNumero, patterns}> */
type OpoKeywordMap = Map<string, Array<{ temaNumero: number; patterns: RegExp[] }>>

/** C2 AGE oposicion ID — use hardcoded TEMA_KEYWORDS for this one (higher quality) */
const AGE_C2_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'

function buildOpoKeywordMaps(temas: TemaRow[]): OpoKeywordMap {
  const maps: OpoKeywordMap = new Map()

  for (const tema of temas) {
    if (!maps.has(tema.oposicion_id)) {
      maps.set(tema.oposicion_id, [])
    }
    const arr = maps.get(tema.oposicion_id)!

    // For C2 AGE, use handcrafted TEMA_KEYWORDS (more precise than auto-generated)
    if (tema.oposicion_id === AGE_C2_OPOSICION_ID) {
      const handcrafted = TEMA_KEYWORDS.find(k => k.temaNumero === tema.numero)
      if (handcrafted) {
        arr.push({ temaNumero: tema.numero, patterns: handcrafted.patterns })
        continue
      }
    }

    // For all other oposiciones, generate keywords from titulo
    const patterns = generateKeywordsFromTitle(tema.titulo)
    if (patterns.length > 0) {
      arr.push({ temaNumero: tema.numero, patterns })
    }
  }

  return maps
}

/**
 * Classify a question into temas for a specific oposición.
 * Returns array of matching temaNumeros.
 */
function classifyByTemaForOposicion(
  text: string,
  oposicionId: string,
  keywordMaps: OpoKeywordMap,
): number[] {
  const keywords = keywordMaps.get(oposicionId)
  if (!keywords) return []

  const matched = new Set<number>()
  for (const { temaNumero, patterns } of keywords) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matched.add(temaNumero)
        break
      }
    }
  }
  return [...matched]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('SUPABASE_URL no configurada')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function resolveLeyCodigo(rawLey: string): string | null {
  const lower = rawLey.toLowerCase().trim()
  if (CITATION_ALIASES[lower]) return CITATION_ALIASES[lower]
  for (const [alias, codigo] of Object.entries(CITATION_ALIASES)) {
    if (lower.includes(alias)) return codigo
  }
  return null
}

/**
 * Detect which leyes a question text mentions (without specific article numbers).
 * Returns deduplicated array of ley_codigo strings.
 */
function detectLeyesInText(text: string): string[] {
  const found = new Set<string>()
  for (const { pattern, leyCodigo } of LEY_KEYWORDS) {
    if (pattern.test(text)) {
      found.add(leyCodigo)
    }
  }
  return [...found]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📡 OpoRuta — Radar del Tribunal Builder §2.14')
  console.log('==============================================\n')

  const supabase = buildSupabaseClient()

  // Pagination helper — Supabase defaults to 1000 rows max per query
  const PAGE = 1000
  async function fetchAllPages<T>(buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
    const all: T[] = []
    let from = 0
    while (true) {
      const { data, error } = await buildQuery(from, from + PAGE - 1)
      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
    return all
  }

  // 1. Cargar todas las preguntas de preguntas_oficiales + año del examen
  console.log('📥 Cargando preguntas oficiales...')
  const preguntasRows = await fetchAllPages<PreguntaRow>((f, t) =>
    supabase
      .from('preguntas_oficiales')
      .select('id, enunciado, correcta, opciones, examenes_oficiales!inner(anio, oposicion_id)')
      .order('id')
      .range(f, t) as unknown as PromiseLike<{ data: PreguntaRow[] | null; error: { message: string } | null }>,
  )
  console.log(`   ${preguntasRows.length} preguntas encontradas\n`)

  // 2. Cargar toda la tabla legislacion en memoria
  console.log('📚 Cargando legislación en memoria...')
  const legRows = await fetchAllPages<LegislacionRow>((f, t) =>
    supabase
      .from('legislacion')
      .select('id, ley_nombre, ley_codigo, articulo_numero')
      .eq('activo', true)
      .range(f, t) as unknown as PromiseLike<{ data: LegislacionRow[] | null; error: { message: string } | null }>,
  )

  // Índice A: "LPAC:21" → legislacion_id (para citas explícitas)
  const legIndex = new Map<string, string>()
  for (const row of legRows) {
    const key = `${row.ley_nombre}:${row.articulo_numero.trim()}`
    legIndex.set(key, row.id)
    const numeroBase = row.articulo_numero.split('.')[0].trim()
    const keyBase = `${row.ley_nombre}:${numeroBase}`
    if (!legIndex.has(keyBase)) legIndex.set(keyBase, row.id)
  }

  // Índice B: ley_codigo → list of legislacion_ids (para keyword matching)
  const leyToArticulos = new Map<string, string[]>()
  for (const row of legRows) {
    const code = row.ley_codigo ?? row.ley_nombre
    if (!leyToArticulos.has(code)) leyToArticulos.set(code, [])
    leyToArticulos.get(code)!.push(row.id)
  }

  console.log(`   ${legRows.length} artículos indexados`)
  console.log(`   ${leyToArticulos.size} leyes distintas\n`)

  // 3. Dual extraction: citas explícitas + keyword matching
  //    Keyed by "oposicion_id|legislacion_id" to generate separate indices per oposición
  console.log('🔍 Analizando preguntas (estrategia dual)...')

  // Key: "oposicionId|legislacionId" → frequency data
  const frecuencias = new Map<string, Acumulador>()
  let pathA = 0 // preguntas con cita explícita
  let pathB = 0 // preguntas clasificadas por keyword
  let noMatch = 0

  function freqKey(oposicionId: string, legislacionId: string): string {
    return `${oposicionId}|${legislacionId}`
  }

  function addFrequency(oposicionId: string, legislacionId: string, anio: number, weight: number) {
    const k = freqKey(oposicionId, legislacionId)
    if (!frecuencias.has(k)) {
      frecuencias.set(k, { count: 0, anios: new Set() })
    }
    const acc = frecuencias.get(k)!
    acc.count += weight
    acc.anios.add(anio)
  }

  for (const pregunta of preguntasRows) {
    const anio = pregunta.examenes_oficiales.anio
    const oposicionId = pregunta.examenes_oficiales.oposicion_id
    const fullText = `${pregunta.enunciado} ${(pregunta.opciones ?? []).join(' ')}`

    // Path A: Cita explícita → artículo exacto (peso 1.0)
    const citas = extractCitations(fullText)
    let resolvedByPathA = false

    for (const cita of citas) {
      const leyCodigo = resolveLeyCodigo(cita.ley)
      if (!leyCodigo) continue

      const artNumero = cita.articulo.replace(/\s+/g, '').trim()
      const key = `${leyCodigo}:${artNumero}`
      const keyBase = `${leyCodigo}:${artNumero.split('.')[0]}`

      const legislacionId = legIndex.get(key) ?? legIndex.get(keyBase)
      if (!legislacionId) continue

      addFrequency(oposicionId, legislacionId, anio, 1)
      resolvedByPathA = true
    }

    if (resolvedByPathA) {
      pathA++
      continue // No double-count: if we have explicit citations, skip keyword matching
    }

    // Path B: Keyword matching → distributes weight across all articles of that ley
    const leyesDetectadas = detectLeyesInText(fullText)

    if (leyesDetectadas.length > 0) {
      pathB++
      for (const leyCodigo of leyesDetectadas) {
        const articulos = leyToArticulos.get(leyCodigo)
        if (!articulos || articulos.length === 0) continue

        // Distribute 1 "appearance" across all articles of this ley
        const weight = 1 / articulos.length
        for (const artId of articulos) {
          addFrequency(oposicionId, artId, anio, weight)
        }
      }
    } else {
      noMatch++
    }
  }

  console.log(`   Path A (cita explícita): ${pathA} preguntas`)
  console.log(`   Path B (keyword ley):    ${pathB} preguntas`)
  console.log(`   Sin match:               ${noMatch} preguntas`)
  console.log(`   Cobertura:               ${Math.round(((pathA + pathB) / preguntasRows.length) * 100)}%`)
  console.log(`   Artículos únicos:        ${frecuencias.size}\n`)

  if (frecuencias.size === 0) {
    console.warn('⚠️  Sin frecuencias — verifica que preguntas_oficiales tiene datos y legislación está ingestada')
    return
  }

  // 4. Calcular apariciones (redondear fraccionales) y preparar upsert
  // Count preguntas per oposición for accurate pct_total
  const preguntasPorOposicion = new Map<string, number>()
  for (const p of preguntasRows) {
    const oId = p.examenes_oficiales.oposicion_id
    preguntasPorOposicion.set(oId, (preguntasPorOposicion.get(oId) ?? 0) + 1)
  }

  const rows = Array.from(frecuencias.entries())
    .map(([compositeKey, acc]) => {
      const [oposicionId, legislacionId] = compositeKey.split('|')
      const totalForOposicion = preguntasPorOposicion.get(oposicionId) ?? preguntasRows.length
      return {
        oposicion_id: oposicionId,
        legislacion_id: legislacionId,
        num_apariciones: Math.round(acc.count),  // Round fractional weights
        pct_total: parseFloat(((acc.count / totalForOposicion) * 100).toFixed(2)),
        anios: [...acc.anios].sort(),
        ultima_aparicion: Math.max(...acc.anios),
        updated_at: new Date().toISOString(),
      }
    })
    .filter(r => r.num_apariciones > 0) // Skip articles with <0.5 fractional appearances

  const topRows = [...rows].sort((a, b) => b.num_apariciones - a.num_apariciones)

  console.log('📊 Top 15 artículos más frecuentes:')
  for (const row of topRows.slice(0, 15)) {
    const legEntry = legRows.find((l) => l.id === row.legislacion_id)
    const nombre = legEntry ? `${legEntry.ley_codigo ?? legEntry.ley_nombre} Art. ${legEntry.articulo_numero}` : row.legislacion_id
    console.log(`   ${row.num_apariciones}x (${row.pct_total}%) — ${nombre} (${row.anios.join(', ')})`)
  }
  console.log()

  // 5. Clear ALL old data and UPSERT fresh (idempotent rebuild)
  console.log(`💾 Escribiendo ${rows.length} registros en frecuencias_articulos...`)

  // Truncate and rebuild — simpler and safer than selective delete with composite keys
  const { error: delErr } = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('frecuencias_articulos').delete().neq('num_apariciones', -999)
  if (delErr) console.warn('   Warning: no se pudo limpiar tabla:', delErr.message)

  const BATCH_SIZE = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error: upsertErr } = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('frecuencias_articulos')
      .upsert(batch, { onConflict: 'oposicion_id,legislacion_id' })

    if (upsertErr) {
      console.error(`❌ Error en batch ${i / BATCH_SIZE + 1}:`, upsertErr.message)
      continue
    }
    inserted += batch.length
    process.stdout.write(`   Progreso: ${inserted}/${rows.length}\r`)
  }

  // Show per-oposición stats
  const oposicionIds = [...new Set(rows.map(r => r.oposicion_id))]
  for (const oId of oposicionIds) {
    const count = rows.filter(r => r.oposicion_id === oId).length
    console.log(`   Oposición ${oId.slice(0, 8)}...: ${count} artículos`)
  }

  console.log(`\n✅ Radar artículos actualizado: ${inserted} artículos (${oposicionIds.length} oposiciones)`)
  console.log(`   Cobertura: ${pathA + pathB}/${preguntasRows.length} preguntas (${Math.round(((pathA + pathB) / preguntasRows.length) * 100)}%)`)

  // ═══════════════════════════════════════════════════════════════════════════
  // Path C: Clasificación por tema (28 temas) — alimenta frecuencias_temas
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n🎯 Path C: Clasificando preguntas por tema (multi-oposición)...')

  // Load temas table with oposicion_id + titulo for dynamic keyword generation
  const temas = await fetchAllPages<TemaRow>((f, t) =>
    supabase
      .from('temas')
      .select('id, numero, oposicion_id, titulo')
      .order('oposicion_id')
      .order('numero')
      .range(f, t) as unknown as PromiseLike<{ data: TemaRow[] | null; error: { message: string } | null }>,
  )

  if (temas.length === 0) {
    console.log('   Saltando clasificación por temas (no hay temas cargados).')
    return
  }

  // Build per-oposición keyword maps (C2 AGE uses handcrafted TEMA_KEYWORDS, rest auto-generated)
  const keywordMaps = buildOpoKeywordMaps(temas)

  // Build per-oposición temaNumeroToId map: "oposicionId:numero" → temaId
  const temaNumeroToId = new Map<string, string>()
  for (const t of temas) {
    temaNumeroToId.set(`${t.oposicion_id}:${t.numero}`, t.id)
  }

  const oposicionesWithKeywords = [...keywordMaps.keys()]
  const totalTemaKeywords = [...keywordMaps.values()].reduce((sum, arr) => sum + arr.length, 0)
  console.log(`   ${temas.length} temas cargados (${oposicionesWithKeywords.length} oposiciones, ${totalTemaKeywords} keyword sets)`)

  // Classify each question — keyed by "oposicionId|temaId"
  const temaFrec = new Map<string, Acumulador>()
  let temaMatched = 0
  let temaNoMatch = 0

  for (const pregunta of preguntasRows) {
    const anio = pregunta.examenes_oficiales.anio
    const oposicionId = pregunta.examenes_oficiales.oposicion_id
    const fullText = `${pregunta.enunciado} ${(pregunta.opciones ?? []).join(' ')}`

    // Use oposición-specific keyword map instead of global TEMA_KEYWORDS
    const temasDetectados = classifyByTemaForOposicion(fullText, oposicionId, keywordMaps)

    if (temasDetectados.length > 0) {
      temaMatched++
      for (const temaNumero of temasDetectados) {
        // Use oposición-scoped key to get correct tema UUID
        const temaId = temaNumeroToId.get(`${oposicionId}:${temaNumero}`)
        if (!temaId) continue
        const k = `${oposicionId}|${temaId}`
        if (!temaFrec.has(k)) {
          temaFrec.set(k, { count: 0, anios: new Set() })
        }
        const acc = temaFrec.get(k)!
        acc.count += 1
        acc.anios.add(anio)
      }
    } else {
      temaNoMatch++
    }
  }

  console.log(`   Clasificadas: ${temaMatched} preguntas`)
  console.log(`   Sin tema:     ${temaNoMatch} preguntas`)
  console.log(`   Cobertura:    ${Math.round((temaMatched / preguntasRows.length) * 100)}%`)
  console.log(`   Temas con datos: ${temaFrec.size}\n`)

  // Prepare upsert rows
  const temaRows = Array.from(temaFrec.entries())
    .map(([compositeKey, acc]) => {
      const [oposicionId, temaId] = compositeKey.split('|')
      const totalForOposicion = preguntasPorOposicion.get(oposicionId) ?? preguntasRows.length
      return {
        oposicion_id: oposicionId,
        tema_id: temaId,
        num_apariciones: acc.count,
        pct_total: parseFloat(((acc.count / totalForOposicion) * 100).toFixed(2)),
        anios: [...acc.anios].sort(),
        ultima_aparicion: Math.max(...acc.anios),
        updated_at: new Date().toISOString(),
      }
    })

  const topTemas = [...temaRows].sort((a, b) => b.num_apariciones - a.num_apariciones)

  console.log('📊 Top 10 temas más frecuentes:')
  for (const row of topTemas.slice(0, 10)) {
    const tema = temas.find((t) => t.id === row.tema_id)
    const nombre = tema ? `Tema ${tema.numero}` : row.tema_id
    console.log(`   ${row.num_apariciones}x (${row.pct_total}%) — ${nombre} (${row.anios.join(', ')})`)
  }
  console.log()

  // Upsert frecuencias_temas
  console.log(`💾 Escribiendo ${temaRows.length} registros en frecuencias_temas...`)

  // Truncate and rebuild
  const { error: temaDelErr } = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('frecuencias_temas').delete().neq('num_apariciones', -999)
  if (temaDelErr) console.warn('   Warning: no se pudo limpiar tabla:', temaDelErr.message)

  let temaInserted = 0
  for (let i = 0; i < temaRows.length; i += BATCH_SIZE) {
    const batch = temaRows.slice(i, i + BATCH_SIZE)
    const { error: upsertErr } = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('frecuencias_temas')
      .upsert(batch, { onConflict: 'oposicion_id,tema_id' })

    if (upsertErr) {
      console.error(`❌ Error en batch temas ${i / BATCH_SIZE + 1}:`, upsertErr.message)
      continue
    }
    temaInserted += batch.length
  }

  console.log(`\n✅ Radar del Tribunal completo:`)
  console.log(`   Artículos: ${inserted} registros`)
  console.log(`   Temas: ${temaInserted} registros`)
  console.log('\n📌 Siguiente paso: verificar radar en /radar del dashboard')
}

// Only run main when executed directly (not when imported for TEMA_KEYWORDS)
const isDirectExecution = process.argv[1]?.includes('build-radar-tribunal')
if (isDirectExecution) {
  main().catch((err) => {
    console.error('Error fatal:', err)
    process.exit(1)
  })
}
