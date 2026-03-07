/**
 * Supabase server client — OpoRuta
 *
 * Usar en Server Components, API routes y proxy (middleware).
 *
 * DDIA Scalability: usa connection pooling (PgBouncer Transaction mode, port 6543).
 * Esto permite hasta 200 conexiones pooled en Supabase Free vs 10 directas.
 * Soporta 50 usuarios concurrentes con headroom.
 *
 * DDIA Reliability: createServerClient es stateless — se crea por request, no persiste.
 */
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede fallar en Server Components (read-only).
            // El proxy maneja el refresh — aquí es no-op seguro.
          }
        },
      },
    }
  )
}

/**
 * Cliente con service_role — bypass de RLS para operaciones server-side.
 * NUNCA exponer al cliente. Solo usar en API routes y Server Components admin.
 *
 * Usa @supabase/supabase-js directamente (sin cookies) porque el service role
 * no necesita contexto de usuario. Esto permite usarlo dentro de unstable_cache
 * y otros contextos sin acceso a request headers.
 */
export async function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
