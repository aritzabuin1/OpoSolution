# ADR-0002: Supabase as Primary Data Store with RLS and Service Role

## Status

Accepted

## Context

OpoRuta needed a database solution that provides:

1. **PostgreSQL compatibility** for relational data (users, tests, legislation, purchases)
2. **Vector support** for RAG (Retrieval-Augmented Generation) with legislation embeddings
3. **Row Level Security (RLS)** for data isolation between users
4. **Authentication** integrated with the database
5. **Low operational overhead** for a solo developer
6. **EU hosting** for GDPR compliance

Alternatives considered:
- **PlanetScale (MySQL)**: No vector support, no built-in auth
- **Neon (PostgreSQL)**: Good PostgreSQL but no integrated auth
- **Firebase**: NoSQL, no vector support, harder relational modeling
- **Self-hosted PostgreSQL**: High operational overhead

## Decision

We chose **Supabase** (hosted PostgreSQL with pgvector) as the primary data store, with a dual-client architecture:

### Dual Client Pattern

1. **`createClient()`** -- User-facing client using the `anon` key:
   - Subject to Row Level Security policies
   - Used in Server Components and API routes for user-scoped queries
   - Cannot read or modify other users' data (enforced at DB level)

2. **`createServiceClient()`** -- Server-side client using the `service_role` key:
   - Bypasses all RLS policies
   - Used exclusively in API routes for administrative operations:
     - Granting corrections (`rpc('grant_corrections')`)
     - Updating free test counters (`rpc('use_free_test')`)
     - Deleting user data (GDPR deletion flow)
     - Inserting test results (service needs to write to user's row)
   - NEVER exposed to the client or imported in client components

### RLS Policies

Every user-facing table has RLS enabled with least-privilege policies (migration 003):

- `profiles`: SELECT/UPDATE own row only
- `tests_generados`: SELECT/INSERT own rows only (UPDATE/DELETE via service role)
- `desarrollos`: SELECT/INSERT own rows only
- `compras`: SELECT own rows only (INSERT via service role from webhook)
- `suscripciones`: SELECT own rows only
- `preguntas_reportadas`: SELECT/INSERT own rows only
- `legislacion`: SELECT for all authenticated users (shared reference data)
- `oposiciones` / `temas`: SELECT for all authenticated users (shared catalog)

### Connection Strategy

- PgBouncer Transaction Mode (port 6543) for connection pooling
- Supports up to 200 pooled connections vs 10 direct connections
- Each `createClient()` call is stateless (created per request, not persisted)

### Untyped Tables

Some tables added in later migrations (016-023) do not have generated TypeScript types. These use a `getUntypedClient()` pattern or `(supabase as any).from('table')` cast until types are regenerated. Affected tables: `logros`, `conocimiento_tecnico`, `preguntas_oficiales`, `notificaciones`, `sugerencias`, `cazatrampas_sesiones`, `reto_diario`, `reto_diario_resultados`, `flashcards`, `frecuencias_articulos`.

## Consequences

### Positive

- **Defense in depth**: Even if application code has a bug that constructs a wrong query, RLS prevents data leakage between users at the database level
- **Single platform**: Auth, database, vector search, and real-time (future) in one service
- **EU region**: Supabase project hosted in EU for GDPR compliance
- **pgvector**: Native vector similarity search for RAG without an external vector database
- **Zero-downtime migrations**: SQL migrations applied via Dashboard SQL Editor with rollback scripts (.down.sql)

### Negative

- **Vendor lock-in**: Deep integration with Supabase auth, RLS policies, and RPCs makes migration to another provider non-trivial
- **Type generation lag**: New tables require regenerating TypeScript types from the schema; until then, `as any` casts reduce type safety
- **Service role risk**: The `service_role` key has full database access. If leaked, all data is exposed. Mitigated by: environment variables only, never in client code, never logged
- **Free tier limitations**: 500 MB database, daily backups only (no PITR), 2 projects max. Upgrade to Pro planned for production growth

### Future Considerations

- Regenerate TypeScript types after all pending migrations are applied
- Consider Supabase Realtime for live notifications (currently polling)
- Evaluate Supabase Edge Functions for background jobs if Vercel cron limits become constraining
