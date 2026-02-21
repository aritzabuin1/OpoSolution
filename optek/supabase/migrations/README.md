# Migraciones OPTEK

## Flujo de trabajo

```
Escribir SQL → (opcional: supabase db diff) → test en local → rollback .down.sql → push a remoto
```

**Convención obligatoria**: cada `YYYYMMDD_NNN_nombre.sql` tiene su `YYYYMMDD_NNN_nombre.down.sql`.

---

## Aplicar migraciones (primera vez / después de clonar)

### Requisito: SUPABASE_ACCESS_TOKEN

1. Ir a https://supabase.com/dashboard/account/tokens
2. Generar un nuevo token personal
3. Añadir a `.env.local`:
   ```
   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx
   ```

### Comando único

```bash
cd optek
SUPABASE_ACCESS_TOKEN=sbp_xxx /tmp/supabase-cli/supabase.exe link --project-ref yaxfgdvnfirazrguiykz
SUPABASE_ACCESS_TOKEN=sbp_xxx /tmp/supabase-cli/supabase.exe db push
```

O bien, si tienes el DATABASE_URL (desde Supabase Dashboard → Settings → Database):

```bash
/tmp/supabase-cli/supabase.exe db push \
  --db-url "postgresql://postgres.[REF]:[DB_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

---

## Archivos de migración

| Archivo | Descripción |
|---------|-------------|
| `001_core_tables.sql` | Extensión vector, oposiciones, temas, profiles, trigger auth, legislacion, examenes_oficiales + índices HNSW/GIN |
| `002_business_tables.sql` | tests_generados (con advisory lock documentado), desarrollos, compras, stripe_events_processed, suscripciones, cambios_legislativos, api_usage_log |
| `003_rls.sql` | Row Level Security en todas las tablas |
| `004_functions.sql` | match_legislacion (RAG), search_legislacion, get_user_stats, increment_free_tests/corrector (con advisory lock) |
| `005_seed.sql` | Oposición Aux Admin Estado, 25 temas oficiales, 16 artículos CE+LPAC+EBEP |

---

## Principios DDIA aplicados

### Fiabilidad
- Todos los `CREATE TABLE` usan `IF NOT EXISTS` → idempotentes
- Todos los `INSERT` usan `ON CONFLICT DO NOTHING` → safe para re-ejecutar
- Trigger `handle_new_user` con `EXCEPTION WHEN OTHERS THEN RAISE WARNING` → no bloquea registro
- `stripe_events_processed` como idempotency store contra webhooks duplicados de Stripe

### Consistencia — Advisory Locks (crítico para colisiones de tests)
```sql
-- En la función SQL increment_free_tests():
PERFORM pg_advisory_xact_lock(('x' || md5(user_id::text))::bit(64)::bigint);
SELECT free_tests_used FROM profiles WHERE id = user_id FOR UPDATE;
-- → Garantiza que dos requests simultáneas del mismo usuario no superen el límite
```
Ver función `increment_free_tests()` en migration 004.

### Escalabilidad
- Índice HNSW en embeddings (m=16, ef_construction=64) — mejor que IVFFLAT para alta concurrencia
- Índices compuestos en queries frecuentes del dashboard
- `ef_search=80` en `match_legislacion` para balance calidad/latencia

### Observabilidad
- `api_usage_log` para tracking de coste en tiempo real
- `cambios_legislativos` para audit trail de cambios en legislación
- Timestamps `created_at` / `updated_at` en todas las tablas core

---

## Rollback

```bash
# Rollback de la última migración
psql $DATABASE_URL -f migrations/20260220_005_seed.down.sql
psql $DATABASE_URL -f migrations/20260220_004_functions.down.sql
# ... etc. en orden inverso
```

## Verificación post-apply

```sql
-- Verificar tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar índices HNSW
SELECT indexname FROM pg_indexes WHERE indexname LIKE '%hnsw%';

-- Verificar seed
SELECT COUNT(*) FROM oposiciones;   -- → 1
SELECT COUNT(*) FROM temas;         -- → 25
SELECT COUNT(*) FROM legislacion;   -- → 16

-- Test match_legislacion (requiere embeddings — NULL hasta que pipeline RAG corra)
SELECT id, ley_codigo, articulo_numero FROM legislacion LIMIT 5;
```
