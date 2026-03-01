/**
 * execution/apply-migration-008-fetch.ts
 *
 * Aplica la migración 008 usando la API REST de Supabase
 * (endpoint /rest/v1/rpc con función exec ejecutada temporalmente).
 *
 * Uso:
 *   npx tsx --env-file=.env.local execution/apply-migration-008-fetch.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  console.log('🚀 Aplicando migración 008 via Supabase API\n')

  const SQL_PATH = join(process.cwd(), 'supabase/migrations/20260223_008_streaks_logros.sql')
  const sql = readFileSync(SQL_PATH, 'utf-8')

  // Intentar aplicar la migración via la API de gestión de Supabase
  // El endpoint de SQL directo requiere el proyecto ref
  const projectRef = SUPABASE_URL.replace('https://', '').split('.supabase.co')[0]

  console.log(`   Proyecto: ${projectRef}`)

  // Separamos el SQL en statements individuales para ejecutarlos
  // via RPC de Supabase (exec_sql no existe por defecto, intentamos pg-net)
  // Alternativa: usar el endpoint de admin de postgrest
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
  }

  // Intentar con /pg endpoint (Supabase expone esto en algunos planes)
  const tryEndpoints = [
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  ]

  // Dividir SQL en statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.startsWith('--'))

  console.log(`   Statements a ejecutar: ${statements.length}`)
  console.log()

  // Intentar usando pg directamente con la URL de pooler de Supabase
  // URL format: postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
  // No tenemos el password, así que mostramos instrucciones

  console.log('❌ No se puede aplicar automáticamente sin DATABASE_URL\n')
  console.log('📋 INSTRUCCIONES PARA APLICAR LA MIGRACIÓN 008:')
  console.log('══════════════════════════════════════════════════════════')
  console.log()
  console.log('1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql/new')
  console.log(`   URL directa: ${SUPABASE_URL.replace('.supabase.co', '')}.supabase.com/dashboard/project/`)
  console.log()
  console.log('2. Copia y pega el SQL de este archivo:')
  console.log(`   ${SQL_PATH}`)
  console.log()
  console.log('3. Haz click en "Run" (o Ctrl+Enter)')
  console.log()
  console.log('4. Verifica que dice: "Success. No rows returned"')
  console.log()
  console.log('══════════════════════════════════════════════════════════')
  console.log()
  console.log('O añade a .env.local:')
  console.log('DATABASE_URL=postgresql://postgres:[tu-password-db]@db.[proyecto].supabase.co:5432/postgres')
  console.log()
  console.log('El password de la BD se encuentra en:')
  console.log('Supabase Dashboard → Settings → Database → Database password')

  // También imprimir el SQL en formato copiable
  console.log('\n═══════════════ SQL A EJECUTAR ═══════════════')
  console.log(sql)
  console.log('══════════════════════════════════════════════')
}

main().catch(console.error)
