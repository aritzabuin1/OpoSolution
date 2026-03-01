/**
 * lib/supabase/admin.ts
 *
 * Cliente Supabase para scripts de Node.js / ejecución sin Next.js.
 * NO usa cookies — usa service_role directamente.
 * NUNCA importar en código client-side.
 *
 * Uso en scripts (execution/):
 *   import { createAdminClient } from '@/lib/supabase/admin'
 *   const supabase = createAdminClient()
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'createAdminClient: faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno'
    )
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
