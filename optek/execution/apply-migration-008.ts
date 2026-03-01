/**
 * execution/apply-migration-008.ts
 *
 * Aplica la migración 008 (streaks + logros) directamente a Supabase
 * usando la API REST de ejecución de SQL (Service Role).
 *
 * Uso:
 *   npx tsx --env-file=.env.local execution/apply-migration-008.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Leer el SQL de la migración
const SQL = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260223_008_streaks_logros.sql'),
  'utf-8'
)

async function applySql(sql: string): Promise<void> {
  // Supabase expone un endpoint de consultas SQL vía la API REST con service role
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`

  // Si no hay función exec_sql, usamos la API de administración
  // Intentamos con el endpoint SQL de la API REST nativa de Supabase
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  })
  void res
}

// Alternativa: usar la librería pg directamente si hay DATABASE_URL
async function main() {
  console.log('🚀 Aplicando migración 008 — Streaks y Logros\n')

  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!DATABASE_URL) {
    console.log('⚠️  No se encontró DATABASE_URL. Mostrando SQL para aplicar manualmente:\n')
    console.log('─'.repeat(60))
    console.log(SQL)
    console.log('─'.repeat(60))
    console.log('\n📋 Instrucciones:')
    console.log('  1. Ve a tu proyecto de Supabase → SQL Editor')
    console.log('  2. Pega el SQL de arriba y ejecuta')
    console.log('  3. Vuelve a ejecutar: npx tsx --env-file=.env.local execution/setup-test-environment.ts')
    console.log('\n   O bien, en tu .env.local añade:')
    console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres')
    console.log('\n💡 El PROJECT-REF lo encuentras en el Dashboard de Supabase → Settings → API\n')
    return
  }

  // Si hay DATABASE_URL, usar pg
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client } = require('pg')
    const client = new Client({ connectionString: DATABASE_URL })
    await client.connect()
    await client.query(SQL)
    await client.end()
    console.log('✅ Migración 008 aplicada correctamente')
    console.log('   → Columnas añadidas: profiles.racha_actual, profiles.racha_maxima, profiles.ultimo_test_dia')
    console.log('   → Tabla creada: logros')
    console.log('   → RPCs creadas: update_streak(), check_and_grant_logros()')
  } catch (err) {
    console.error('❌ Error al aplicar la migración:', err)
    console.log('\n📋 Aplica el SQL manualmente en el SQL Editor de Supabase:')
    console.log(SQL)
    process.exit(1)
  }
}

main().catch(console.error)
