# PLAN.md — OPTEK: Plataforma IA para Opositores

> **Objetivo:** Construir una PWA que actúe como "Entrenador Personal" de oposiciones usando IA (Claude API) con verificación determinista de citas legales.
>
> **Stack:** Next.js latest (App Router) + Tailwind + shadcn/ui + Supabase (auth, PostgreSQL, storage) + Claude API + Stripe + PWA
>
> **Primera oposición:** Auxiliar Administrativo del Estado (Convocatoria 2025-2026)
>
> **Estructura del examen:** 110 preguntas tipo test en 90 minutos. Parte 1: 30 teóricas (Bloque I) + 30 psicotécnicas. Parte 2: 50 teórico-prácticas (Bloque II). Penalización: respuesta errónea descuenta 1/3 del valor de una correcta. Cada parte vale 50 puntos (total: 100).
>
> **Temario oficial (28 temas):**
> - **Bloque I — Organización Pública (16 temas):** 1. CE 1978 | 2. Tribunal Constitucional y Reforma | 3. Cortes Generales | 4. Poder Judicial | 5. Gobierno y Administración | 6. Gobierno Abierto | 7. Transparencia (Ley 19/2013) | 8. AGE | 9. Organización territorial | 10. UE (instituciones) | 11. Procedimiento administrativo (LPAC/LRJSP) | 12. Protección de datos (LOPDGDD) | 13. Personal funcionario (TREBEP) | 14. Derechos y deberes funcionarios | 15. Presupuesto del Estado | 16. Políticas de igualdad LGTBI *(nuevo 2026)*
> - **Bloque II — Actividad Administrativa y Ofimática (12 temas):** 17. Atención al público | 18. Servicios de información administrativa | 19. Documento, registro y archivo | 20. Administración electrónica | 21. Informática básica | 22. Windows 11 y Copilot *(nuevo 2026)* | 23. Explorador de Windows | 24. Word 365 *(nuevo 2026)* | 25. Excel 365 *(nuevo 2026)* | 26. Access 365 *(nuevo 2026)* | 27. Outlook 365 *(nuevo 2026)* | 28. Red Internet
>
> **Principio fundamental:** La IA nunca habla sin artículo exacto delante. Cada cita legal se verifica con código determinista, no con más IA.

---

## FASE 0 — INFRAESTRUCTURA BASE (Semanas 1-2)

### 0.1 Inicialización del proyecto

- [x] **0.1.0** (**BLOQUEANTE — antes de todo lo demás**): Verificar que Anthropic tiene DPA compatible con GDPR para el envío de texto de usuarios europeos. → **RESUELTO (2026-02-20): Anthropic NO tiene DPA compatible con GDPR. Decisión: Opción (a) — sanitización agresiva que elimina todo PII antes de enviar a Claude API. Implementada en `lib/utils/sanitize.ts` con `sanitizeUserText()`. Referencia: `directives/OPTEK_security.md` §1.**
- [x] **0.1.1** Inicializar proyecto Next.js latest con App Router y TypeScript — carpeta `optek/` (lowercase por restricción npm). Next.js 16.1.6, React 19, Tailwind 4.
- [x] **0.1.2** Tailwind CSS v4 incluido en create-next-app. Verificado con `pnpm type-check` limpio.
- [x] **0.1.3** Instalar shadcn/ui: `pnpm dlx shadcn@latest init` (Tailwind v4, New York style, Neutral base)
- [x] **0.1.4** Configurar theme OPTEK en `app/globals.css` (Tailwind v4 usa CSS custom properties, no tailwind.config.ts): primary=#1B4F72, secondary=#2E86C1, accent=#F39C12 en oklch.
- [x] **0.1.5** Instalar componentes base shadcn: Button, Card, Input, Label, Dialog, Tabs, Badge, Skeleton, Sonner (Toast deprecado, reemplazado por Sonner en shadcn v3)
- [x] **0.1.6** Configurar ESLint con reglas del proyecto (strict TypeScript, no-any, no-unused-vars) en `eslint.config.mjs`
- [x] **0.1.7** Configurar Prettier en `.prettierrc` (semi: false, singleQuote: true, trailingComma: 'es5')
- [x] **0.1.8** Crear `.env.local` con placeholders para todas las variables de entorno (Supabase, Anthropic, OpenAI, Stripe, Sentry, Upstash, Resend, CRON_SECRET)
- [x] **0.1.9** Crear `.env.example` (mismas keys con valores de ejemplo, para documentar)
- [x] **0.1.10** `.gitignore` verificado y actualizado: añadido `.tmp/` y excepción `!.env.example`
- [x] **0.1.11** Cambiar estado de los 11 ADRs en `docs/decisions/` de "Propuesto" a "Aceptado" (son decisiones ya tomadas, no pendientes de aprobación)
- [ ] **0.1.12** Configurar Supabase MCP: instalar servidor MCP de Supabase, configurar credenciales (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` o access token), verificar que Claude Code puede ejecutar queries y crear migrations directamente. Esto permite autonomía completa en §0.3-0.5 (schema BD), §0.6 (auth), §0.7 (RLS)
- [ ] **0.1.13** (Opcional) Configurar Stripe MCP si existe servidor compatible, o usar Stripe CLI como alternativa para gestión de productos en test mode

### 0.2 Estructura de carpetas

- [x] **0.2.1** Crear grupo de rutas auth: `app/(auth)/login/page.tsx` y `app/(auth)/register/page.tsx` (placeholder con título)
- [x] **0.2.2** Crear grupo de rutas dashboard: `app/(dashboard)/dashboard/page.tsx` (placeholder)
- [x] **0.2.3** Crear rutas de tests: `app/(dashboard)/tests/page.tsx` y `app/(dashboard)/tests/[id]/page.tsx` (placeholder)
- [x] **0.2.4** Crear ruta corrector: `app/(dashboard)/corrector/page.tsx` (placeholder)
- [x] **0.2.5** Crear ruta simulacros: `app/(dashboard)/simulacros/page.tsx` (placeholder)
- [x] **0.2.6** Crear ruta cuenta: `app/(dashboard)/cuenta/page.tsx` (placeholder)
- [x] **0.2.7** Crear rutas API: `app/api/ai/generate-test/route.ts` y `app/api/ai/correct-desarrollo/route.ts` (return 501 Not Implemented)
- [x] **0.2.8** Crear rutas API Stripe: `app/api/stripe/checkout/route.ts` y `app/api/stripe/webhook/route.ts` (return 501)
- [x] **0.2.9** Crear rutas API utilidad: `app/api/boe/check-updates/route.ts`, `app/api/health/route.ts`, `app/api/user/export/route.ts`, `app/api/user/delete/route.ts` (return 501)
- [x] **0.2.10** Crear carpetas de componentes: `components/ui/`, `components/layout/`, `components/tests/`, `components/corrector/`, `components/shared/`
- [x] **0.2.11** Crear carpetas de lib: `lib/supabase/`, `lib/ai/`, `lib/stripe/`, `lib/utils/`, `lib/logger/`
- [x] **0.2.12** Crear carpeta de tipos: `types/database.ts`, `types/ai.ts`, `types/stripe.ts` (exportar tipos vacíos como placeholder)
- [x] **0.2.13** Crear carpetas de ejecución y tests: `execution/`, `tests/unit/`, `tests/integration/`, `tests/evals/`, `tests/fixtures/`, `tests/e2e/` (nota: `tests/e2e/` se crea vacía — los tests E2E con Playwright se implementarán en Fase 1B+ cuando haya UI funcional)
- [x] **0.2.14** Verificar que `pnpm build` compila sin errores con todas las carpetas y placeholders ✅ 2026-02-27
- [x] **0.2.15** Crear `types/api.ts` con interfaz `ApiError { code: string, message: string, status: number, requestId: string }` y tipo `ApiResponse<T>`
- [x] **0.2.16** Crear `lib/utils/api-error.ts`: helper `createApiError(code, message, status)` + wrapper `withErrorHandling(handler)` para API routes (taxonomía: USER_ERROR 400, AUTH_ERROR 401, RATE_LIMIT 429, EXTERNAL_SERVICE 503, INTERNAL 500)
- [x] **0.2.17** Documentar en `types/api.ts` los códigos de error estándar: INVALID_INPUT, UNAUTHORIZED, RATE_LIMITED, AI_TIMEOUT, AI_UNAVAILABLE, PAYMENT_REQUIRED — con mensajes en español
- [x] **0.2.18** Instalar `isomorphic-dompurify`: `pnpm add isomorphic-dompurify`
- [x] **0.2.19** Crear `lib/utils/sanitize.ts` con funciones `sanitizeHtml(text)` y `sanitizeUserText(text)` según `directives/OPTEK_security.md`

### 0.3 Layout y navegación base

- [x] **0.3.1** Crear `app/layout.tsx` raíz: HTML lang="es", meta viewport, fuentes (Inter de Google Fonts)
- [x] **0.3.2** Crear `app/(dashboard)/layout.tsx` con sidebar + área principal
- [x] **0.3.3** Crear componente `components/layout/Sidebar.tsx`: logo OPTEK + links de navegación (Dashboard, Tests, Corrector, Simulacros, Cuenta)
- [x] **0.3.4** Crear componente `components/layout/Navbar.tsx`: versión mobile con hamburger menu
- [x] **0.3.5** Crear componente `components/layout/Footer.tsx`: links legales (Privacidad, Términos, Contacto) + copyright
- [ ] **0.3.6** Hacer layout responsive: sidebar visible en desktop (>768px), drawer/hamburger en mobile
- [x] **0.3.7** Crear componente `components/shared/LoadingSpinner.tsx` (reutilizable, tamaño configurable)
- [x] **0.3.8** Crear componente `components/shared/ErrorBoundary.tsx` (React Error Boundary con mensaje en español)
- [ ] **0.3.9** Verificar navegación funciona: click en cada link → se muestra la página placeholder correcta

### 0.4 Supabase: Crear proyecto y configurar auth

- [x] **0.4.1** Crear proyecto en Supabase Dashboard (región EU para GDPR)
- [x] **0.4.2** Copiar SUPABASE_URL y SUPABASE_ANON_KEY a `.env.local`
- [x] **0.4.3** Copiar SUPABASE_SERVICE_ROLE_KEY a `.env.local`
- [x] **0.4.4** Instalar dependencias: `pnpm add @supabase/supabase-js @supabase/ssr`
- [x] **0.4.5** Crear `lib/supabase/client.ts`: browser client con `createBrowserClient()`
- [x] **0.4.6** Crear `lib/supabase/server.ts`: server client con `createServerClient()` (cookies)
- [x] **0.4.7** Crear `middleware.ts` en raíz: refresh de sesión Supabase + protección de rutas `/(dashboard)/*`
- [ ] **0.4.8** Configurar auth en Supabase Dashboard: habilitar email/password
- [ ] **0.4.9** Configurar auth en Supabase Dashboard: habilitar Magic Link
- [ ] **0.4.10** ~~(Opcional) OAuth Google~~ → **Post-MVP explícito.** Email + Magic Link es suficiente para MVP. Google OAuth añade complejidad (Google Cloud Console, OAuth consent screen, verificación de app). Implementar solo si >20% de usuarios piden login social en feedback.
- [ ] **0.4.11** Verificar: crear usuario de prueba manualmente → login funciona → middleware redirige no autenticados
- [x] **0.4.12** Inicializar Supabase CLI migrations: `supabase init` + configurar enlace con proyecto remoto
- [x] **0.4.13** Crear carpeta `supabase/migrations/` — toda la creación de schema (§0.5-0.8) se versionará como migrations SQL
- [x] **0.4.14** Documentar procedimiento de migración en README del directorio: escribir SQL → `supabase db diff` → test en staging → escribir rollback script (.down.sql) → deploy. **Convención obligatoria:** cada `YYYYMMDD_nombre.sql` debe tener un `YYYYMMDD_nombre.down.sql` con las operaciones inversas. Verificar en CI que ambos archivos existen. Referencia: `directives/00_DEPLOYMENT_PROTOCOL.md` §5
- [ ] **0.4.15** Habilitar connection pooling (PgBouncer) en Supabase Dashboard → modo Transaction
- [ ] **0.4.16** Usar connection string de pooling (port 6543) en `lib/supabase/server.ts` — NO usar conexión directa (port 5432) en server-side
- [ ] **0.4.17** Documentar límites de conexiones: Free (10 directas + 200 pooled), Pro (ajustable). Verificar que la config actual soporta 50 usuarios concurrentes

> **Decisión:** JWT/Sessions: Supabase SSR maneja token refresh automáticamente via middleware. Access token: 1h, refresh token: 7d (config por defecto de Supabase). No se implementa gestión manual de JWT.

### 0.5 Supabase: Schema de base de datos (tablas core)

- [x] **0.5.1** Crear tabla `oposiciones`: id (uuid PK), nombre (text), slug (text UNIQUE), descripcion (text), num_temas (int), activa (bool), created_at
- [x] **0.5.2** Crear tabla `temas`: id (uuid PK), oposicion_id (FK oposiciones), numero (int), titulo (text), descripcion (text)
- [x] **0.5.3** Crear tabla `profiles`: id (uuid PK, FK auth.users), email (text), full_name (text nullable), oposicion_id (FK oposiciones nullable), fecha_examen (date nullable), horas_diarias_estudio (int nullable), free_tests_used (int default 0, max 5), free_corrector_used (int default 0, max 2), created_at, updated_at
- [x] **0.5.4** Crear trigger para auto-crear profile al registrarse: `ON INSERT ON auth.users → INSERT INTO profiles(id, email)`
- [x] **0.5.5** Crear tabla `legislacion`: id (uuid PK), ley_nombre (text), ley_nombre_completo (text), ley_codigo (text), articulo_numero (text), apartado (text nullable), titulo_capitulo (text), texto_integro (text), hash_sha256 (text), fecha_ultima_verificacion (timestamptz), tema_ids (uuid[]), activo (bool default true), created_at, updated_at. **UNIQUE constraint:** `UNIQUE(ley_codigo, articulo_numero, apartado)` — previene duplicados si el script de ingesta se ejecuta 2 veces. Usar `ON CONFLICT ... DO UPDATE` (upsert) en ingesta.
- [x] **0.5.6** Habilitar extensión `vector` en Supabase: `CREATE EXTENSION IF NOT EXISTS vector`
- [x] **0.5.7** Añadir columna `embedding vector(1536)` a tabla `legislacion`
- [x] **0.5.8** Crear índice HNSW en embeddings: `CREATE INDEX ON legislacion USING hnsw (embedding vector_cosine_ops)`
- [x] **0.5.9** Crear índice full-text en `legislacion.texto_integro`: `CREATE INDEX ON legislacion USING gin(to_tsvector('spanish', texto_integro))`
- [x] **0.5.10** Crear tabla `examenes_oficiales`: id (uuid PK), oposicion_id (FK), anio (int), convocatoria (text), preguntas (jsonb)
- [x] **0.5.10A** Migration 011 `20260227_011_examenes_oficiales_v2.sql`: ALTER examenes_oficiales (anio, convocatoria, fuente_url, activo) + CREATE preguntas_oficiales (con UNIQUE examen_id/numero, RLS authenticated SELECT) + ALTER tests_generados ADD COLUMN examen_oficial_id FK. Con rollback. ✅ 2026-02-27
- [ ] **0.5.11** Verificar: conectar desde app Next.js → SELECT de oposiciones funciona
- [x] **0.5.12** Crear índices adicionales de rendimiento:
  - `CREATE INDEX idx_legislacion_ley_art ON legislacion(ley_codigo, articulo_numero)` (lookups de verificación)
  - `CREATE INDEX idx_legislacion_temas ON legislacion USING GIN(tema_ids)` (retrieveByTema)
  - `CREATE INDEX idx_tests_user_date ON tests_generados(user_id, created_at DESC)` (historial del usuario)
  - `CREATE INDEX idx_suscripciones_user ON suscripciones(user_id, estado)` (check de acceso)
- [ ] **0.5.13** Verificar: `EXPLAIN ANALYZE` en queries de verificación y historial confirma uso de índices

### 0.6 Supabase: Schema de base de datos (tablas de negocio)

- [x] **0.6.1** Crear tabla `tests_generados`: id (uuid PK), user_id (FK auth.users), tema_id (FK temas nullable), tipo (text check: 'tema','simulacro','repaso_errores'), preguntas (jsonb), respuestas_usuario (jsonb nullable), puntuacion (float nullable), tiempo_segundos (int nullable), completado (bool default false), prompt_version (text), created_at
- [x] **0.6.2** Crear tabla `preguntas_reportadas`: id (uuid PK), test_id (FK tests_generados), pregunta_index (int), user_id (FK), motivo (text), estado (text check: 'pendiente','revisada','retirada'), created_at
- [x] **0.6.3** Crear tabla `desarrollos`: id (uuid PK), user_id (FK), tema_id (FK), texto_usuario (text), evaluacion (jsonb), citas_verificadas (jsonb), prompt_version (text), created_at
- [x] **0.6.4** Crear tabla `compras`: id (uuid PK), user_id (FK auth.users ON DELETE CASCADE), stripe_checkout_session_id (text UNIQUE), tipo (text check: 'tema','pack_oposicion','subscription'), tema_id (text nullable — NULL para pack/subscription), oposicion_id (text NOT NULL), amount_paid (int NOT NULL — en céntimos: 499 = 4.99€), created_at. Índices: `idx_compras_user(user_id)`, `idx_compras_user_tema(user_id, tema_id)`
- [x] **0.6.5** Crear tabla `stripe_events_processed`: id (uuid PK), stripe_event_id (text UNIQUE), event_type (text), processed_at (timestamptz default now())
- [x] **0.6.6** Crear tabla `suscripciones`: id (uuid PK), user_id (FK), stripe_subscription_id (text), estado (text check: 'activa','cancelada','expirada'), fecha_inicio (timestamptz), fecha_fin (timestamptz nullable), created_at
- [x] **0.6.7** Crear tabla `cambios_legislativos`: id (uuid PK), legislacion_id (FK), texto_anterior (text), texto_nuevo (text), hash_anterior (text), hash_nuevo (text), fecha_deteccion (timestamptz default now()), tipo_cambio (text), procesado (bool default false)
- [x] **0.6.8** Crear tabla `api_usage_log`: id (uuid PK), timestamp (timestamptz default now()), endpoint (text), user_id (FK auth.users nullable), tokens_in (int), tokens_out (int), cost_estimated_cents (int), model (text). Índice: `(timestamp, endpoint)`

### 0.7 Supabase: Row Level Security (RLS)

- [x] **0.7.1** Habilitar RLS en tabla `profiles` + política: SELECT/UPDATE WHERE `auth.uid() = id`
- [x] **0.7.2** Habilitar RLS en tabla `tests_generados` + política: SELECT/INSERT WHERE `auth.uid() = user_id`
- [x] **0.7.3** Habilitar RLS en tabla `desarrollos` + política: SELECT/INSERT WHERE `auth.uid() = user_id`
- [x] **0.7.4** Habilitar RLS en tabla `compras` + política: SELECT WHERE `auth.uid() = user_id` (INSERT solo server con service_role)
- [x] **0.7.5** Habilitar RLS en tabla `suscripciones` + política: SELECT WHERE `auth.uid() = user_id`
- [x] **0.7.6** Habilitar RLS en tabla `preguntas_reportadas` + política: INSERT WHERE `auth.uid() = user_id`, SELECT para admins
- [x] **0.7.7** Configurar tablas sin RLS de usuario (acceso público lectura): `oposiciones`, `temas`, `legislacion` (SELECT para authenticated)
- [ ] **0.7.8** Verificar: con usuario A logueado, no puede ver tests de usuario B

### 0.8 Supabase: Funciones SQL y seed data

- [x] **0.8.1** Crear función RPC `match_legislacion(query_embedding vector, match_count int, filter_oposicion uuid)`: búsqueda vectorial con filtro
- [x] **0.8.2** Crear función RPC `get_user_stats(p_user_id uuid)`: retorna tests completados, media puntuación, temas cubiertos
- [x] **0.8.3** Crear función SQL `search_legislacion(query text)`: búsqueda full-text en texto_integro con ts_rank
- [x] **0.8.4** Insertar seed: oposición "Auxiliar Administrativo del Estado" (slug: aux-admin-estado, num_temas: ~25) → **PENDIENTE ACTUALIZAR a 28 temas (ver §0.8.4A)**
- [x] **0.8.5** Insertar seed: temas del temario oficial (25 temas con número, título, descripción) → **PENDIENTE ACTUALIZAR a 28 temas oficiales convocatoria 2025-2026 (ver §0.8.5A)**
- [x] **0.8.6** Insertar seed: 10-20 artículos de legislación de ejemplo (Constitución arts. 1, 9, 14, 23, 103; LPAC arts. 53, 54, 68) para poder testear en desarrollo
- [x] **0.8.4A** Actualizar seed oposición: `UPDATE oposiciones SET num_temas = 28 WHERE slug = 'aux-admin-estado'` — ejecutado en migration 007 ✅ 2026-02-23
- [x] **0.8.5A** Actualizar seed temas: 28 temas con títulos del temario oficial convocatoria 2025-2026 (Bloque I: temas 1-16, Bloque II: temas 17-28) — UPSERT en migration 007 ✅ 2026-02-23
- [x] **0.8.5B** Migration 010 `20260227_010_temas_bloque.sql`: `ALTER TABLE temas ADD COLUMN IF NOT EXISTS bloque text CHECK (bloque IN ('I','II'))` + `UPDATE temas SET bloque = CASE WHEN numero <= 16 THEN 'I' ELSE 'II' END`. Con rollback. ✅ 2026-02-27
- [ ] **0.8.7** Verificar: llamar a `match_legislacion` desde la app → retorna resultados

### 0.9 Tipos TypeScript generados

- [x] **0.9.1** Instalar Supabase CLI: `pnpm add -D supabase`
- [x] **0.9.2** Generar tipos: generado via Management API REST (CLI v2.75.0 no acepta token formato `sbp_v0_`). Guardado en `types/database.ts` (19553 chars, 13 tablas + 4 funciones tipadas)
- [x] **0.9.3** Crear tipos manuales en `types/ai.ts`: TestGenerado, Pregunta, CorreccionDesarrollo, CitaLegal, VerificationResult
- [x] **0.9.4** Crear tipos manuales en `types/stripe.ts`: Producto, CompraEstado, SuscripcionEstado
- [x] **0.9.5** Verificar: todos los tipos compilan sin errores (`pnpm type-check`) ✅

### 0.10 Observabilidad base

- [x] **0.10.1** Instalar pino: `pnpm add pino` y `pnpm add -D pino-pretty`
- [x] **0.10.2** Crear `lib/logger/index.ts`: wrapper de pino con JSON en producción, pretty en desarrollo
- [x] **0.10.3** Configurar campos base en logger: service='OPTEK-web', environment=NODE_ENV
- [x] **0.10.4** Crear middleware `x-request-id`: generar UUID por request en proxy.ts (Web Crypto API, compatible Edge Runtime)
- [x] **0.10.5** Instalar Sentry: `pnpm add @sentry/nextjs` (v10.39.0)
- [x] **0.10.6** Configurar Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` + `instrumentation.ts` para Next.js App Router
- [x] **0.10.7** Configurar `tracesSampleRate: 0.1` para producción (1.0 en development). Activado con NEXT_PUBLIC_SENTRY_DSN.
- [x] **0.10.8** Crear endpoint `GET /api/health/route.ts`: check Supabase (SELECT oposiciones LIMIT 1) + retorna status JSON con latency_ms
- [x] **0.10.9** Verificar: `/api/health` retorna `{"status":"healthy","checks":{"database":"ok"}}` con status 200 ✅
- [x] **0.10.10** Instalar rate limiting: `pnpm add @upstash/ratelimit @upstash/redis`
- [x] **0.10.11** Crear `lib/utils/rate-limit.ts`: Sliding Window via Upstash + graceful fallback cuando no configurado. Límites: ai-generate=10/1m, ai-correct=5/1m
- [x] **0.10.12** Integrar rate limiting en endpoints `/api/ai/*`: 429 + `Retry-After` header en español
- [x] **0.10.13** Test unitario: rate-limit.test.ts (6 tests — graceful fallback + buildRetryAfterHeader) ✅
- [x] **0.10.14** Crear `lib/ai/claude.ts`: Claude API client con sanitizeForAI() + INSERT en api_usage_log (tokens + coste) tras cada llamada
- [x] **0.10.15** Crear endpoint cron `app/api/cron/check-costs/route.ts`: coste diario + tasa verificación → alerta email via Resend (condicional si RESEND_API_KEY)
- [x] **0.10.16** Configurar Vercel Cron en `vercel.json`: `/api/cron/check-costs` a las 23:00 UTC diariamente
- [x] **0.10.17** Security headers en `proxy.ts`: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [x] **0.10.18** Función `redactPII(obj)` en `lib/logger/index.ts`: email/auth/token→[REDACTED], texto_usuario→[TRUNCATED:50chars]
- [x] **0.10.19** Instrumentar KPIs en `lib/ai/verification.ts`: log `{ citations_total, citations_verified, citations_failed, verification_score, regeneration_triggered, duration_ms }` + INSERT en api_usage_log endpoint='verification'
- [x] **0.10.20** Alerta calidad verificación en cron: si tasa_verificación < 80% con ≥5 llamadas AI → email alerta
- [x] **0.10.21** Tests en rate-limit.test.ts verifican comportamiento del fallback. Tests de verificación en §1.15 cuando pipeline RAG esté completo.

### 0.11 Testing framework

- [x] **0.11.1** Instalar Vitest: `pnpm add -D vitest @vitejs/plugin-react` + @vitest/coverage-v8
- [x] **0.11.2** Crear `vitest.config.ts` con paths aliases (@/ → ./) + coverage thresholds 80%
- [x] **0.11.3** Crear `tests/vitest.setup.ts`
- [x] **0.11.4** Instalar msw: `pnpm add -D msw`
- [x] **0.11.5** Scripts en `package.json`: `test`, `test:watch`, `test:coverage`
- [x] **0.11.6** Crear `tests/unit/smoke.test.ts` → 1+1=2
- [x] **0.11.7** Verificar: `pnpm test` → 2 archivos, 7 tests passing ✅

### 0.12 CI/CD pipeline

- [x] **0.12.1** Crear `.github/workflows/ci.yml`: trigger en push y PR a main
- [x] **0.12.2** Step 1: checkout + setup pnpm + install con cache
- [x] **0.12.3** Step 2: `pnpm lint`
- [x] **0.12.4** Step 3: `pnpm type-check`
- [x] **0.12.5** Step 4: `pnpm test:coverage` (threshold 80% en lib/ai/ y lib/utils/)
- [x] **0.12.6** Step 5: `pnpm audit --audit-level=high`
- [x] **0.12.7** Step 6: `pnpm build`
- [ ] **0.12.8** Conectar repositorio a Vercel para auto-deploy (manual — necesita push + configurar Vercel Dashboard)
- [ ] **0.12.9** Verificar: hacer push → CI pasa → Vercel deploya preview (manual)

### 0.13 PWA configuración

- [x] **0.13.1** Instalar @serwist/next + serwist (v9.5.6) para App Router
- [x] **0.13.2** Crear `public/manifest.json`: name "OPTEK", short_name "OPTEK", start_url "/dashboard", display "standalone", theme_color "#1B4F72", shortcuts: tests + corrector
- [x] **0.13.3** Crear iconos SVG placeholder: `public/icons/icon.svg` + `public/icons/icon-maskable.svg` (logo OPTEK azul/naranja). PNG real pendiente de diseño.
- [x] **0.13.4** Configurar `next.config.ts` con @serwist/next (producción) + @sentry/nextjs. No-op en development para compatibilidad con Turbopack.
- [x] **0.13.5** Meta tags PWA en `app/layout.tsx`: manifest, appleWebApp.capable, formatDetection. themeColor en viewport.
- [ ] **0.13.6** Verificar: abrir en Chrome → "Instalar app" disponible (manual — requiere build de producción)

### 0.14 Stripe configuración base

- [ ] **0.14.1** Crear cuenta Stripe (o acceder a existente) — manual
- [x] **0.14.2** Instalar SDK: `pnpm add stripe` (v20.3.1)
- [ ] **0.14.3** Copiar STRIPE_SECRET_KEY (test mode) a `.env.local` — manual
- [x] **0.14.4** Crear `lib/stripe/client.ts`: Stripe client + STRIPE_PRICES constants (tema/pack/premium)
- [ ] **0.14.5** Crear productos en Stripe Dashboard (modo test) — manual
- [x] **0.14.6** Webhook handler `app/api/stripe/webhook/route.ts`: idempotencia via stripe_events_processed, procesa checkout.session.completed, subscription.created/updated/deleted, payment_intent.succeeded, charge.failed
- [ ] **0.14.7** Instalar Stripe CLI + stripe login — manual
- [ ] **0.14.8** Verificar: stripe.products.list() retorna productos creados — pendiente de 0.14.3+0.14.5

### 0.15 Landing page

- [x] **0.15.1** Crear `app/(marketing)/page.tsx` como página raíz (landing)
- [x] **0.15.2** Crear `app/(marketing)/layout.tsx` con navbar pública (logo + Login + Registrarse)
- [x] **0.15.3** Hero section: headline "Tu Entrenador Personal de Oposiciones con IA", subtítulo, CTA "Empieza gratis"
- [x] **0.15.4** Sección "El problema": 3 pain points visuales (academias caras, tests repetitivos, sin feedback personalizado)
- [x] **0.15.5** Sección "Cómo funciona": 3 pasos con iconos (Elige tema → Genera tests IA → Recibe corrección verificada)
- [x] **0.15.6** Sección "Por qué OPTEK es diferente": verificación determinista de citas legales como diferenciador
- [x] **0.15.7** Sección pricing: tabla comparativa (Free / Individual / Premium) con CTAs
- [x] **0.15.8** Sección FAQ: 6-8 preguntas frecuentes en acordeón (shadcn Accordion)
- [x] **0.15.9** Sección social proof: placeholder para testimonios (con estructura, sin datos reales aún)
- [x] **0.15.10** Footer completo: links legales, contacto email, redes sociales placeholders
- [ ] **0.15.11** Responsive: verificar en 3 breakpoints (mobile 375px, tablet 768px, desktop 1280px)
- [x] **0.15.12** SEO: meta tags (title, description, keywords), Open Graph tags, favicon
- [ ] **0.15.13** Verificar: Lighthouse score > 90 en Performance y SEO

### 0.16 Páginas legales

- [x] **0.16.1** Crear `app/(marketing)/legal/privacidad/page.tsx`: Política de Privacidad (adaptada a GDPR/RGPD)
  - Responsable del tratamiento (datos de Aritz/empresa)
  - Datos que recogemos y finalidad
  - Base legal (Art. 6.1 GDPR)
  - Derechos del usuario (acceso, rectificación, supresión, portabilidad)
  - Terceros con acceso a datos (Anthropic, Supabase, Stripe)
  - Cookies y analytics
  - Contacto DPD
- [x] **0.16.2** Crear `app/(marketing)/legal/terminos/page.tsx`: Términos y Condiciones
  - Descripción del servicio
  - Limitaciones (no sustituye asesoría legal, la IA puede equivocarse)
  - Propiedad intelectual
  - Política de reembolso
  - Cancelación de cuenta
- [x] **0.16.3** Crear `app/(marketing)/legal/cookies/page.tsx`: Política de Cookies
- [x] **0.16.4** Crear componente `components/shared/CookieBanner.tsx`: banner RGPD con aceptar/rechazar analytics
- [ ] **0.16.5** Verificar: links desde footer funcionan, páginas renderizadas correctamente

### 0.17 Páginas de auth

- [x] **0.17.1** Crear UI de login `app/(auth)/login/page.tsx`: formulario email + password, link a magic link, link a registro, botón Google OAuth (si configurado)
- [x] **0.17.2** Crear UI de registro `app/(auth)/register/page.tsx`: formulario email + password + nombre (opcional), checkbox "Acepto política de privacidad" (obligatorio), link a login
- [x] **0.17.3** Implementar lógica de login: `supabase.auth.signInWithPassword()` → redirect a /dashboard
- [x] **0.17.4** Implementar lógica de registro: `supabase.auth.signUp()` → email de verificación → redirect a /login con mensaje
- [x] **0.17.5** Implementar magic link: `supabase.auth.signInWithOtp()` → mostrar "Revisa tu email"
- [x] **0.17.6** Implementar callback auth: `app/auth/callback/route.ts` para manejar redirect post-verificación
- [x] **0.17.7** Crear página de error auth: `app/(auth)/error/page.tsx` (link expirado, etc.)
- [ ] **0.17.8** Verificar flujo completo: registro → email verificación → login → dashboard → logout → redirect a login

### 0.18 Onboarding de primera vez ("Hook Inmediato")

> **Contexto:** El opositor quiere ver valor en <30 segundos. Si le pedimos datos antes de mostrar el producto, lo perdemos. Estrategia: **test primero, datos después**.
>
> **Principio:** Captura el interés primero, pide los datos después.

- [x] **0.18.1** Crear flujo "Test Instantáneo" post-registro:
  - Paso 1: Tras registro + verificar email + login → ir directamente a `/primer-test` (NO a un wizard de datos)
  - Paso 2: Página `/primer-test`: "Prueba OPTEK ahora" → selector rápido de oposición (1 click en card) → genera test del tema 1 INMEDIATAMENTE
  - Paso 3: Tras completar primer test → mostrar resultados + "¿Quieres mejorar?" → pedir datos opcionales (fecha examen, horas/día) en modal ligero
- [x] **0.18.2** Crear ruta `app/(dashboard)/primer-test/page.tsx`: selector visual de oposición (cards con icono) + botón "Empezar test gratis" que guarda `oposicion_id` y genera test en un solo paso
- [x] **0.18.3** En `middleware.ts`: si usuario autenticado + `oposicion_id IS NULL` + ruta es `/dashboard/*` → redirect a `/primer-test`
- [x] **0.18.4** Crear modal `components/shared/PostTestOnboarding.tsx`: tras primer test completado, preguntar fecha examen + horas/día (ambos opcionales, botón "Saltar" prominente)
- [ ] **0.18.5** Verificar flujo completo: registro → verificar email → login → seleccionar oposición (1 click) → primer test INMEDIATO → resultados → datos opcionales → dashboard con datos
- [ ] **0.18.6** Medir: time-to-first-test debe ser <45 segundos desde login (excluyendo tiempo de generación IA)

---

## FASE 1A — MOTOR RAG + VERIFICACIÓN DETERMINISTA (Semanas 3-4)

### 1.1 Ingesta de legislación: preparación de datos

> **Estrategia dual:** Automatizar con API OpenData BOE como vía principal (reduce ~80% trabajo manual). Fallback a transcripción manual si el parsing automático falla para alguna ley.

- [x] **1.1.0** Crear carpeta `data/legislacion/` y `data/README.md` documentando el schema JSON esperado: `{ ley_nombre, ley_codigo, ley_nombre_completo, articulos: [{ numero, titulo_articulo, titulo_seccion, texto_integro }] }`. Incluir instrucciones de formato, encoding (UTF-8), y ejemplo mínimo. ✅ 2026-02-22
- [x] **1.1.0A** (**AUTOMATIZACIÓN — vía principal**): Crear script `execution/boe-scraper.ts` para obtener legislación estructurada desde BOE consolidado (https://www.boe.es/buscar/act.php?id=BOE-A-XXXX-XXXXX). Parser cheerio sobre HTML consolidado → extrae artículos con número, título de capítulo, texto íntegro. Rate limiting 1.5s entre requests. Maneja artículos + disposiciones adicionales/transitorias/finales. ✅ 2026-02-22
- [x] **1.1.0B** (**PRIORIDAD — validar pipeline con 1 ley**): Ejecutado `boe-scraper.ts` para Ley 39/2015 LPAC → `data/legislacion/ley_39_2015_lpac.json` con **155 artículos, 0 sin texto**. **Aritz: revisar manualmente comparando con BOE original** antes de ejecutar pipeline completo (ingesta → embedding → retrieval → generación test → verificación determinista). ✅ Scraping 2026-02-22
- [x] **1.1.1** Ejecutado `boe-scraper.ts` para Constitución Española (`BOE-A-1978-31229`) → `data/legislacion/constitucion_española_1978.json` con **184 artículos, 0 sin texto**. ✅ 2026-02-22
- [x] **1.1.2** Ejecutado `boe-scraper.ts` para Ley 40/2015 LRJSP (`BOE-A-2015-10566`) → `data/legislacion/ley_40_2015_lrjsp.json` con **218 artículos, 0 sin texto**. ✅ 2026-02-22
- [x] **1.1.3** Añadir TREBEP (RDL 5/2015, `BOE-A-2015-8421`) al catálogo del scraper → ejecutar → revisar output → `data/legislacion/trebep_rdl_5_2015.json`
- [x] **1.1.4** Añadir Ley 19/2013 Transparencia (`BOE-A-2013-12887`) al catálogo → ejecutar → revisar output → `data/legislacion/ley_19_2013_transparencia.json`
- [x] **1.1.5** Añadir Ley 9/2017 LCSP (`BOE-A-2017-12902`) al catálogo con flag PARCIAL (solo Títulos I-II) → ejecutar → revisar output → `data/legislacion/ley_9_2017_lcsp_parcial.json`
- [x] **1.1.6** Añadir LOPDGDD (LO 3/2018, `BOE-A-2018-16673`) al catálogo → ejecutar → revisar output → `data/legislacion/lo_3_2018_lopdgdd.json`
- [x] **1.1.6A** Añadir Ley 50/1997 del Gobierno (`BOE-A-1997-25336`) al catálogo → ejecutar → revisar output → `data/legislacion/ley_50_1997_gobierno.json`
- [x] **1.1.6B** Añadir LO 3/2007 Igualdad (`BOE-A-2007-6115`) al catálogo → ejecutar → revisar output → `data/legislacion/lo_3_2007_igualdad.json`
- [x] **1.1.6C** Añadir LO 1/2004 Violencia de Género (`BOE-A-2004-21760`) al catálogo con flag PARCIAL (Títulos I-III) → ejecutar → revisar output → `data/legislacion/lo_1_2004_violencia_genero_parcial.json`
- [x] **1.1.6D** Añadir Ley 4/2023 LGTBI (`BOE-A-2023-5366`) al catálogo → ejecutar → revisar output → `data/legislacion/ley_4_2023_lgtbi.json`
- [ ] **1.1.6E** Crear `data/legislacion/tue_tfue.json` manualmente: extracto de TUE y TFUE centrado en instituciones de la UE (Comisión Europea, Consejo, Parlamento Europeo, Tribunal de Justicia UE, BCE). Fuente: EUR-Lex. **Trabajo de Aritz — no es scraping del BOE**
- [ ] **1.1.6F** Ley 19/2013 ya cubierta en §1.1.4 (Transparencia = Gobierno Abierto). Verificar cobertura tema 6 con el JSON generado → si falta normativa adicional, ampliar con Ley 11/2007 Acceso Electrónico (`BOE-A-2007-12352`)
- [x] **1.1.6G** Añadir LOTC — LO 2/1979 del Tribunal Constitucional (`BOE-A-1979-23709`) al catálogo → ejecutar → revisar output → `data/legislacion/lo_2_1979_lotc.json`. **Cubre Tema 2 (Tribunal Constitucional).** La CE solo dedica 8 artículos al TC; la LOTC tiene la regulación completa (composición, competencias, procedimientos)
- [x] **1.1.6H** Añadir LOPJ — LO 6/1985 del Poder Judicial (`BOE-A-1985-12666`) al catálogo con flag PARCIAL (Libros I-III: organización judicial, CGPJ, estatuto de jueces) → ejecutar → revisar output → `data/legislacion/lo_6_1985_lopj_parcial.json`. **Cubre Tema 4 (Poder Judicial).** La LOPJ es extensa (>500 arts); solo los 3 primeros Libros son relevantes para Auxiliar
- [x] **1.1.6I** Añadir LGP — Ley 47/2003 General Presupuestaria (`BOE-A-2003-21614`) al catálogo → ejecutar → revisar output → `data/legislacion/ley_47_2003_lgp.json`. **Cubre Tema 15 (Presupuesto del Estado).** La CE arts. 134-136 da principios; la LGP tiene ciclo presupuestario completo, clasificaciones, fases de ejecución
- [ ] **1.1.7** Para leyes donde el scraping falló: transcripción manual como fallback. **Trabajo manual de Aritz — solo para leyes que el scraper no pudo parsear correctamente.**
- [x] **1.1.8** Verificar calidad: `execution/validate-legislacion.ts` — valida campos requeridos, encoding UTF-8, texto no vacío, duplicados, encoding roto (Ã/Â). Exit 1 si hay errores. ✅ 2026-02-27
- [x] **1.1.9** Mapear cada artículo al tema/temas del temario oficial que cubre (28 temas: 16 Bloque I + 12 Bloque II) → `execution/auto-map-themes.ts` creado con mapping determinista por ley_codigo + titulo_seccion. Ejecutar: `pnpm map:themes`. 2026-02-23
- [ ] **1.1.10** Verificar: contar artículos por ley, confirmar que cubren los 16 temas del Bloque I. Usar la tabla de cobertura:

> **Mapeo completo Tema → Ley fuente (Bloque I):**
>
> | Tema | Título | Ley(es) fuente |
> |------|--------|---------------|
> | 1 | Constitución Española | CE (`§1.1.1`) |
> | 2 | Tribunal Constitucional y Reforma CE | CE Tít. IX + **LOTC** (`§1.1.6G`) |
> | 3 | Cortes Generales | CE Tít. III |
> | 4 | Poder Judicial | CE Tít. VI + **LOPJ** (`§1.1.6H`) |
> | 5 | Gobierno y Administración | CE Tít. IV + Ley 50/1997 (`§1.1.6A`) |
> | 6 | Gobierno Abierto | Ley 19/2013 (`§1.1.4`) |
> | 7 | Transparencia | Ley 19/2013 (`§1.1.4`) |
> | 8 | AGE | LRJSP 40/2015 (`§1.1.2`) |
> | 9 | Organización Territorial | CE Tít. VIII |
> | 10 | Unión Europea | TUE/TFUE (`§1.1.6E`) |
> | 11 | Procedimiento Administrativo | LPAC 39/2015 (`§1.1.0B`) + LRJSP 40/2015 (`§1.1.2`) |
> | 12 | Protección de Datos | LOPDGDD 3/2018 (`§1.1.6`) |
> | 13 | Personal Funcionario | TREBEP 5/2015 (`§1.1.3`) |
> | 14 | Derechos y Deberes Funcionarios | TREBEP 5/2015 (`§1.1.3`) |
> | 15 | Presupuesto del Estado | CE arts. 134-136 + **LGP** (`§1.1.6I`) |
> | 16 | Políticas Igualdad y LGTBI | LO 3/2007 (`§1.1.6B`) + LO 1/2004 (`§1.1.6C`) + Ley 4/2023 (`§1.1.6D`) |
- [x] **1.1.11** Crear `data/mapeo_temas_legislacion.json`: generado automáticamente por `auto-map-themes.ts` como informe de cobertura JSON con stats por ley y por tema. Se crea al ejecutar `pnpm map:themes`. 2026-02-23
- [x] **1.1.12** Verificar cobertura: `execution/check-mapping-coverage.ts` creado — compara artículos locales con BD, verifica tema_ids mapeados, alerta temas sin cobertura. Ejecutar: `pnpm check:coverage`. 2026-02-23

### 1.2 Ingesta de legislación: script y embeddings

- [x] **1.2.1** Instalar SDK OpenAI: `pnpm add openai`
- [x] **1.2.2** Copiar OPENAI_API_KEY a `.env.local`
- [x] **1.2.3** Crear `lib/ai/embeddings.ts`: función `generateEmbedding(text: string): Promise<number[]>` usando text-embedding-3-small
- [x] **1.2.4** Crear `execution/ingest-legislacion.ts`:
  - Leer archivos JSON de legislación estructurada
  - Para cada artículo: normalizar texto → generar hash SHA-256 → generar embedding → insertar en BD
  - Log de progreso: "Insertando art. X de Ley Y... (N/Total)"
- [x] **1.2.5** Crear función `normalizeForHash(text: string): string` en `lib/utils/`: trim, colapsar whitespace, NFC unicode
- [x] **1.2.6** Crear función `computeHash(text: string): string` en `lib/utils/`: SHA-256 con crypto.createHash → `lib/utils/hash.ts` ✅ 2026-02-27
- [x] **1.2.7** Ejecutar ingesta completa contra Supabase de desarrollo — 2.782 artículos insertados (14 leyes). 2026-02-23
- [x] **1.2.8** Verificar: `SELECT count(*) FROM legislacion` retorna número esperado de artículos — 2.782 confirmados. 2026-02-23
- [x] **1.2.9** Verificar: `SELECT count(*) FROM legislacion WHERE embedding IS NOT NULL` = total artículos — 2.782/2.782 con embedding. 2026-02-23

### 1.3 Ingesta de exámenes oficiales

> **Convocatorias disponibles en INAP (sede.inap.gob.es):**
> | Convocatoria | Turno | Modelos | Estado |
> |---|---|---|---|
> | 2023-2024 | Libre | A + B | ✅ Disponible |
> | 2021-2022 | Libre | Único | ✅ Disponible |
> | 2020 | Libre | Único | ✅ Disponible |
> | 2018-2019 | Libre | A + B | ✅ Disponible |
>
> **⚠️ robots.txt de INAP restringe /documents/ y /*.pdf** — Descarga manual obligatoria (no scraping automático de PDFs). Los PDFs son documentos públicos del gobierno, descargables a mano desde el navegador.

- [ ] **1.3.0** Crear carpeta `data/examenes/` con subcarpetas por año y `data/examenes/README.md` documentando el schema JSON esperado: `{ convocatoria, anno, turno, modelo, fuente_url, total_preguntas, preguntas: [{ numero, enunciado, opciones[4], correcta }] }`. Estructura: `data/examenes/2024/examen_modelo_a.pdf`, `data/examenes/2024/plantilla_a.pdf`, `data/examenes/2024/parsed.json`
- [ ] **1.3.0A** (**Trabajo manual de Aritz**): Descargar PDFs de exámenes de INAP siguiendo el proceso: sede.inap.gob.es → Cuerpo General Auxiliar → convocatoria año → Ingreso libre → descargar "Cuestionario" + "Plantilla definitiva de respuestas". Prioridad: 2023-2024 (más reciente), 2021-2022, 2020, 2018-2019. Colocar en `data/examenes/[año]/`
- [ ] **1.3.0B** Instalar dependencia de parsing: `pnpm add pdf-parse` + `pnpm add -D @types/pdf-parse`. Solo se usa en scripts de `execution/`, no afecta al bundle Next.js
- [ ] **1.3.1** Recopilar 3-5 exámenes oficiales anteriores de Auxiliar Administrativo (PDFs)
- [ ] **1.3.1A** Crear `execution/parse-exam-pdf.ts`: extrae preguntas estructuradas de PDF. Flujo: `pdf-parse` extrae texto raw → Claude Haiku (vision si falla texto) analiza el texto y devuelve array de preguntas estructuradas → cruza con plantilla de respuestas para añadir `correcta: 0|1|2|3` → output: `data/examenes/[año]/parsed.json`. Mismo patrón de SHA-256 + rate limiting que `boe-scraper.ts`. Añadir script: `"parse:examenes": "tsx --env-file=.env.local execution/parse-exam-pdf.ts"`
- [ ] **1.3.2** Crear `execution/ingest-examenes.ts`: parsear preguntas de PDF/texto a JSON estructurado
- [ ] **1.3.2A** Actualizar `execution/ingest-examenes.ts` para usar el schema v2 (`preguntas_oficiales` separado): leer `data/examenes/[año]/parsed.json` → upsert en `examenes_oficiales` → upsert en `preguntas_oficiales` (SHA-256 por pregunta para deduplicación). Idempotente. Añadir script: `"ingest:examenes": "tsx --env-file=.env.local execution/ingest-examenes.ts"`
- [ ] **1.3.3** Estructurar cada pregunta: `{enunciado, opciones[4], correcta, justificacion, ley, articulo}`
- [ ] **1.3.4** Insertar exámenes en tabla `examenes_oficiales`
- [ ] **1.3.5** Verificar: `SELECT count(*) FROM examenes_oficiales` → al menos 3 exámenes
- [ ] **1.3.6** Ejecutar pipeline completo para convocatoria 2023-2024: `pnpm parse:examenes` → revisar `data/examenes/2024/parsed.json` → `pnpm ingest:examenes`. Verificar ~100 preguntas insertadas por modelo
- [ ] **1.3.7** Añadir función `retrieveByExamenOficial(examenId, temaNumero?, limit)` en `lib/ai/retrieval.ts`: SELECT preguntas_oficiales WHERE examen_id = ? (y opcionalmente WHERE tema_numero = ?). Reutilizada por `generate-simulacro` en §2.6A

### 1.3A Ingesta Bloque II: Ofimática, Informática y Administración (pre-Beta)

> **Contexto:** El Bloque II (temas 17-28) cubre administración electrónica, informática básica, Windows 11, Copilot y Microsoft 365 (Word, Excel, Access, Outlook). No hay BOE — las fuentes son documentación oficial de Microsoft y normativa administrativa.
>
> **Estrategia:** Scraping controlado de Microsoft Learn/Support (español) + creación manual de contenido estructurado para temas administrativos. Almacenar en tabla `conocimiento_tecnico` (nueva) con embeddings para RAG.
>
> **Momento:** Pre-Beta. No bloquea la validación del pipeline RAG (que se prueba con Bloque I), pero es OBLIGATORIO antes de reclutar beta testers opositores.

- [x] **1.3A.0** Crear carpeta `data/ofimatica/` y `data/ofimatica/README.md` documentando el schema JSON esperado para contenido de Bloque II. ✅ 2026-02-27
- [x] **1.3A.0B** (**PRE-SCRAPER — obligatorio antes de §1.3A.4**): Estrategia de chunking por objeto funcional documentada en `data/ofimatica/CHUNKING_STRATEGY.md`. ✅ 2026-02-27
- [x] **1.3A.1** Crear tabla `conocimiento_tecnico`: migration 013 `20260227_013_conocimiento_tecnico.sql` + rollback. ✅ 2026-02-27
- [x] **1.3A.2** Habilitar RLS en `conocimiento_tecnico`: SELECT para authenticated. Incluido en migration 013. ✅ 2026-02-27
- [x] **1.3A.3** Crear función RPC `match_conocimiento(query_embedding vector, match_count int, filter_bloque text)` + `search_conocimiento` (fallback full-text). Incluido en migration 013. ✅ 2026-02-27
- [x] **1.3A.4** Crear script `execution/scrape-microsoft-learn.ts`: extrae contenido de Microsoft Support/Learn en español. Rate limit 2s. Chunking por objeto funcional. Scripts: `pnpm scrape:ofimatica [word|excel|access|outlook|windows|all]`. ✅ 2026-02-27
- [x] **1.3A.5** Ejecutar scraping para Word 365 (tema 24) → `data/ofimatica/word.json` generado (113 KB). ✅ 2026-02-27
- [x] **1.3A.6** Ejecutar scraping para Excel 365 (tema 25) → `data/ofimatica/excel.json` generado (154 KB). ✅ 2026-02-27
- [x] **1.3A.7** Access 365 (tema 26) → scraper insuficiente (2 secciones). Regenerado manualmente con Claude: `data/ofimatica/access.json` con 24 secciones (BD relacional, tablas, consultas, formularios, informes, macros). ✅ 2026-03-01
- [x] **1.3A.8** Outlook 365 (tema 27) → scraper insuficiente (4 secciones). Regenerado manualmente con Claude: `data/ofimatica/outlook.json` con 24 secciones (correo, organización, contactos, calendario, tareas). ✅ 2026-03-01
- [x] **1.3A.9** Ejecutar scraping para Windows 11 + Copilot (temas 22-23) → `data/ofimatica/windows.json` generado (56 KB). ✅ 2026-02-27
- [x] **1.3A.10** Crear contenido para temas administrativos (17-21): `tema_17_atencion_publico.json` (24 sec), `tema_18_servicios_informacion.json` (21 sec), `tema_19_documento_registro_archivo.json` (23 sec), `tema_20_administracion_electronica.json` (23 sec), `tema_21_informatica_basica.json` (21 sec). Fuentes: LPAC, RD 208/1996, RD 951/2005, Ley 16/1985, eIDAS, ENI, ENS. ✅ 2026-03-01
- [x] **1.3A.11** Crear contenido para tema 28 (Red Internet): `tema_28_internet.json` con 23 secciones (HTTP/HTTPS, DNS, correo, seguridad, cloud, LSSI, accesibilidad WCAG). ✅ 2026-03-01
- [x] **1.3A.12** Crear script `execution/ingest-conocimiento.ts`: lee JSONs Bloque II → hash SHA-256 → embedding → upsert en `conocimiento_tecnico`. Script: `pnpm ingest:ofimatica`. ✅ 2026-02-27
- [x] **1.3A.13** Ejecutar ingesta completa Bloque II: `pnpm ingest:ofimatica` → 238 secciones nuevas insertadas en `conocimiento_tecnico`. 11 JSONs procesados (Word, Excel, Access, Outlook, Windows, temas 17-21, 28). ✅ 2026-03-01
- [x] **1.3A.14** Verificar: `conocimiento_tecnico` contiene 238 secciones (≥200 ✅). Nota: temas 17-28 tienen `tema_id=null` temporalmente — se vinculan a `temas` tras aplicar migration de temas Bloque II en Supabase remoto. ✅ 2026-03-01
- [x] **1.3A.15** Actualizar `lib/ai/retrieval.ts`: añadir función `retrieveByBloque(temaId, bloque)` que busca en `conocimiento_tecnico`. Con fallback semántico. ✅ 2026-02-27
- [x] **1.3A.16** Actualizar `buildContext()`: si tema pertenece a Bloque II (temas 17-28) → buscar en `conocimiento_tecnico`. Expone `esBloqueII` y `temaNumero` en `RetrievalContext`. ✅ 2026-02-27
- [x] **1.3A.17** **Guardrail ofimática:** `verificarPreguntaBloque2()` en `lib/ai/generate-test.ts`: verifica que opciones/explicación de cada pregunta estén respaldadas por el contexto recuperado. Modo lenient si contexto < 200 chars. `SYSTEM_GENERATE_TEST_BLOQUE2` prompt dedicado sin citas legales. `cita` opcional en `PreguntaSchema`. PROMPT_VERSION bumped a 2.0.0. ✅ 2026-02-27
- [x] **1.3A.18** Test unitario `§1.3A.18`: 5 tests de Bloque II en `tests/unit/generate-test.test.ts` — acepta/rechaza por contexto, prompt correcto, campo cita ausente, modo lenient. 159 tests pasando. ✅ 2026-02-27

### 1.3B Motor de Psicotécnicos (pre-Beta)

> **Contexto:** 30 de las 110 preguntas del examen son psicotécnicas: aptitudes numéricas, series lógicas, sinónimos/antónimos, y organización de datos. No requieren RAG ni IA generativa — se generan de forma determinista con scripts.
>
> **Estrategia:** Generación procedimental con variables aleatorias. La IA solo se usa opcionalmente para generar las explicaciones paso a paso de la solución (o se generan determinísticamente).
>
> **Momento:** Pre-Beta. Se puede desarrollar en paralelo a la ingesta de Bloque II.

- [x] **1.3B.1** Crear tabla `psicotecnicos_config`: migration 012 `20260227_012_psicotecnicos_config.sql` + rollback. ✅ 2026-02-27
- [x] **1.3B.2** Crear `lib/psicotecnicos/numeric.ts`: generador de problemas numéricos (regla de tres, porcentajes, fracciones, proporciones). Input: dificultad (1-3). Output: `{enunciado, opciones[4], correcta, explicacion_pasos}`. Variables aleatorias para infinitas combinaciones ✅ 2026-02-27
- [x] **1.3B.3** Crear `lib/psicotecnicos/series.ts`: generador de series numéricas y alfanuméricas. Patrones configurables (+N, ×N, Fibonacci-like, alternancia, potencias). Variables aleatorias controladas ✅ 2026-02-27
- [x] **1.3B.4** Crear `lib/psicotecnicos/verbal.ts`: banco estático de sinónimos/antónimos/analogías. Crear `data/psicotecnicos/banco_verbal.json` con ≥200 pares de nivel oficial. Selección aleatoria + distractores coherentes. **Aritz revisa el banco** ✅ 2026-02-27
- [x] **1.3B.5** Crear `lib/psicotecnicos/organization.ts`: generador de problemas de ordenación de datos, detección de errores en tablas numéricas, clasificación y organización ✅ 2026-02-27
- [x] **1.3B.6** Crear `lib/psicotecnicos/index.ts`: orquestador `generatePsicotecnicos(count, dificultad)` que genera N preguntas con distribución configurable entre categorías (default: 40% numérico, 25% series, 20% verbal, 15% organización) ✅ 2026-02-27
- [x] **1.3B.7** **Guardrail de dificultad:** Nivel BÁSICO obligatorio (es Auxiliar Administrativo, no Ingeniería). Limitar: números de max 4 cifras, operaciones max 2 pasos, vocabulario estándar no técnico. El reto del examen es la velocidad, no la complejidad ✅ 2026-02-27
- [x] **1.3B.8** Test unitario: generar 100 preguntas numéricas → verificar matemáticamente que la respuesta marcada como correcta es realmente correcta (round-trip validation) ✅ 2026-02-27
- [x] **1.3B.9** Test unitario: generar 50 series → verificar que el siguiente número de la serie sigue el patrón declarado ✅ 2026-02-27
- [x] **1.3B.10** Test unitario: verificar que no se repiten preguntas idénticas en un batch de 30 (diversidad) ✅ 2026-02-27
- [x] **1.3B.11** Integrar en endpoint `/api/ai/generate-test`: si tipo='psicotecnico' → usar motor determinista en lugar de Claude RAG. Coste API = 0€. Incluye migration 009 (CHECK constraint), `Pregunta.cita` opcional, guards en QuestionView + resultados. ✅ 2026-02-27
- [x] **1.3B.12** Crear `app/(dashboard)/psicotecnicos/page.tsx`: UI con selector dificultad + nº preguntas → POST /api/ai/generate-test {tipo:'psicotecnico'} → redirect /tests/[id]. Añadir entrada "Psicotécnicos" + Brain icon al Sidebar. ✅ 2026-02-27
- [x] **1.3B.13** Integrar en simulacros (§2.6): Parte 1 del simulacro completo incluye 30 preguntas psicotécnicas generadas por este motor. Endpoint `generate-simulacro` acepta `incluirPsicotecnicos?: boolean` + `dificultadPsico?: 1|2|3`. SimulacroCard.tsx tiene toggle "Modo Examen Real" + selector dificultad. ✅ 2026-02-28

### 1.4 Módulo de recuperación (RAG retrieval)

- [x] **1.4.1** Crear `lib/ai/retrieval.ts` con función `retrieveByTema(temaId: string, limit: number)`: SELECT legislacion WHERE tema_ids @> ARRAY[temaId] + fallback semántico automático. 2026-02-23
- [x] **1.4.2** Crear función `retrieveBySemantic(query: string, limit: number)`: generar embedding de query → llamar RPC `match_legislacion` + fallback full-text. 2026-02-23
- [x] **1.4.3** Crear función `retrieveByArticle(leyCodigo: string, articuloNumero: string)`: SELECT exacto por ley_codigo + articulo_numero. 2026-02-23
- [ ] **1.4.4** Crear función `retrieveExamples(oposicionId: string, temaId: string, limit: number)`: SELECT de examenes_oficiales filtrado — **pendiente hasta §1.3 (exámenes oficiales)**
- [x] **1.4.5** Crear función `buildContext(temaId: string, query?: string)`: combina retrieveByTema + retrieveBySemantic, formatea como texto para Claude, limita a ~8000 tokens. También `formatContext()`. 2026-02-23
- [x] **1.4.6** Test unitario: `retrieveByTema` para tema 1 (Constitución) retorna artículos de CE. 2026-02-23
- [x] **1.4.7** Test unitario: `retrieveBySemantic` para "plazo recurso alzada" retorna artículos relevantes de LPAC. 2026-02-23
- [x] **1.4.8** Test unitario: `buildContext` no excede 8000 tokens estimados. 2026-02-23

### 1.5 Capa de Verificación Determinista

- [x] **1.5.1** Crear `lib/ai/verification.ts` con función `extractCitations(text: string)`: regex para extraer citas legales en múltiples formatos. 2026-02-23
  - Formatos soportados: "Art. 53.1.a de la Ley 39/2015", "artículo 14 CE", "art. 103 de la Constitución", etc.
  - Output: `Array<{ley: string, articulo: string, apartado?: string, textoOriginal: string}>`
- [x] **1.5.2** Test unitario `extractCitations`: al menos 10 formatos distintos de cita → extracción correcta. 2026-02-23
- [x] **1.5.3** Crear función `verifyCitation(citation)`: lookup en tabla legislacion por ley_codigo + articulo_numero. 2026-02-23
  - Retorna `{verified: boolean, reason?: string, articuloReal?: Legislacion}`
  - 3 niveles de cascade: exacto → fuzzy (Levenshtein en articulo) → búsqueda por metadata
- [x] **1.5.4** Test unitario `verifyCitation`: cita válida → verified true, cita inventada → verified false. 2026-02-23
- [x] **1.5.5** Crear función `verifyContentMatch(citation, claimText, articuloReal)`: verificaciones deterministas. 2026-02-23
  - Verificar plazos: regex de números + "días/meses/años" → comprobar que aparecen en texto real
  - Verificar órganos: extraer nombres de instituciones → comprobar en texto real
  - Verificar conceptos jurídicos: keywords clave → comprobar en texto real
  - Retorna `{match: boolean, confidence: 'high'|'medium'|'low', details: string}`
- [x] **1.5.6** Test unitario `verifyContentMatch`: afirmación correcta de plazo → match true, plazo incorrecto → match false. 2026-02-23
- [x] **1.5.7** Crear función `verifyAllCitations(generatedContent: string)`: orquesta extract → verify → contentMatch para todas las citas. 2026-02-23
  - Retorna `{allVerified: boolean, citations: VerifiedCitation[], score: number}`
  - Score = citas verificadas / total citas
- [x] **1.5.8** Test unitario `verifyAllCitations`: texto con 3 citas (2 válidas, 1 inválida) → score 0.67. 2026-02-23
- [x] **1.5.9** Test edge case: artículos "bis", disposiciones adicionales/transitorias/finales. 2026-02-23
- [x] **1.5.10** Test edge case: texto sin citas → score N/A, no bloquear. 2026-02-23
- [ ] **1.5.11** (**Verificación v2 — Normalización semántica**) — **⏸️ POST-MVP.** La v1 (regex + diccionario) es suficiente para lanzar. Si >20% de citas fallan en normalización, iterar post-launch. Crear función `normalizeCitation(rawCitation: string): NormalizedCitation` en `lib/ai/verification.ts`:
  - Input: cita en formato libre ("Art. catorce CE", "artículo catorce de la Constitución", "art. 14 CE")
  - Paso 1: intentar normalización determinista con regex + diccionario de aliases ("CE" → "constitucion", "LPAC" → "ley_39_2015", "catorce" → "14", etc.)
  - Paso 2: si regex falla → llamada mínima a Claude (prompt de 1 línea: "Normaliza esta cita al formato {ley_codigo, articulo_numero}") — coste ~0.001€/cita
  - Paso 3: resultado normalizado → lookup determinista en BD (igual que v1)
  - **Principio:** La IA solo NORMALIZA el formato; la VERIFICACIÓN sigue siendo 100% determinista por código
- [x] **1.5.12** Crear diccionario `lib/ai/citation-aliases.ts`: mapeo de abreviaturas y nombres coloquiales a `ley_codigo` de BD ("CE" → "constitucion", "Constitución" → "constitucion", "Ley de Procedimiento" → "ley_39_2015", números en texto → dígitos, etc.). 2026-02-23
- [ ] **1.5.13** Test unitario `normalizeCitation`: 10+ variantes de la misma cita ("Art. 14 CE", "artículo catorce de la Constitución", "art. 14 de la CE", "Art. catorce CE") → todas normalizan al mismo `{ley_codigo: 'constitucion', articulo_numero: '14'}`
- [ ] **1.5.14** Monitorización: si % de citas que requieren paso 2 (Claude) > 20% durante 7 días → expandir diccionario de aliases. KPI objetivo: >80% de citas resueltas solo con regex+diccionario (paso 1)

### 1.6 Integración Claude API

- [x] **1.6.1** Instalar SDK Anthropic: `pnpm add @anthropic-ai/sdk`
- [ ] **1.6.2** Copiar ANTHROPIC_API_KEY a `.env.local`
- [x] **1.6.3** Crear `lib/ai/claude.ts`: función base `callClaude(systemPrompt, userPrompt, options)` con:
  - Modelo configurable (default: claude-sonnet)
  - **Temperatura obligatoria** por endpoint (ref: `directives/OPTEK_prompts.md` §2.3): GENERATE_TEST=0.3, CORRECT_DESARROLLO=0.4, GENERATE_FLASHCARD=0.3, EVALUATE_ORAL=0.4, TRIBUNAL_QUESTIONS=0.5. NO usar default de Claude — fijar explícitamente para reproducibilidad de evals
  - Timeout: 30s
  - Retry: max 2 con backoff exponencial (1s, 3s)
  - **Circuit breaker simple:** estado CLOSED/OPEN. Tras 5 fallos consecutivos → OPEN (rechazar inmediatamente durante 60s → "IA temporalmente no disponible"). Tras 60s → HALF-OPEN (permitir 1 request de prueba). Si OK → CLOSED. Evita saturar Vercel cuando Claude está caído. ~20 líneas de código.
  - Logging: requestId, tokens in/out, duration, temperature, model
- [x] **1.6.4** Crear función `callClaudeJSON<T>(systemPrompt, userPrompt, zodSchema)`: llama a Claude → JSON.parse → zodSchema.safeParse → retry 1 vez si parse falla. 2026-02-23
- [x] **1.6.5** Crear función `callClaudeStream(systemPrompt, userPrompt)`: retorna ReadableStream para SSE. 2026-02-23
- [x] **1.6.6** Crear schemas Zod en `lib/ai/schemas.ts`: TestGeneradoSchema, PreguntaSchema, CorreccionDesarrolloSchema. 2026-02-23
- [x] **1.6.7** Test unitario (con mock): `callClaudeJSON` con respuesta válida → parsea correctamente. 2026-02-23
- [x] **1.6.8** Test unitario (con mock): `callClaudeJSON` con respuesta inválida → retry → error. 2026-02-23

### 1.7 Prompt GENERATE_TEST y flujo completo

- [x] **1.7.1** Crear system prompt GENERATE_TEST en `lib/ai/prompts.ts` (basado en `directives/OPTEK_prompts.md`). 2026-02-23
- [x] **1.7.2** Crear user prompt template con slots: {contexto_legislativo}, {ejemplos_examen}, {dificultad}, {num_preguntas}. 2026-02-23
- [x] **1.7.3** Crear función `generateTest(temaId, numPreguntas, dificultad)` en `lib/ai/generate-test.ts`. 2026-02-23
  1. `buildContext(temaId)` → contexto
  2. `callClaudeJSON(systemPrompt, userPrompt, TestGeneradoSchema)` → test raw (Haiku)
  3. Para cada pregunta: `extractCitations` → `verifyCitation` → `verifyContentMatch`
  4. Filtrar preguntas que no pasen verificación
  5. Si quedan < numPreguntas: regenerar faltantes (max 2 reintentos con prompt ajustado)
  6. Guardar en BD con prompt_version
  7. Retornar test verificado
- [x] **1.7.4** Test de integración (con mock de Claude): flujo completo genera test → verificación → retorna TestGenerado. 2026-02-23
- [x] **1.7.5** Test de integración: pregunta que no pasa verificación → se filtra + reintento automático. 2026-02-23
- [x] **1.7.6** Crear endpoint POST `/api/ai/generate-test/route.ts`. 2026-02-23
  - Validar input con Zod (temaId, numPreguntas, dificultad)
  - Verificar auth (middleware Supabase)
  - Verificar acceso (ADR-0010 Fuel Tank): free ≤5 tests (RPC use_free_test atómico) | pagado ilimitado + 20/día silencioso
  - Check concurrencia: rechaza si hay test en progreso en últimos 30s (409)
  - Rate limit Upstash: pagados 20/día | free 5/min anti-spam
  - Llama `generateTest()`, maneja circuit breaker (503) y errores generales (500)
- [ ] **1.7.7** Verificar endpoint real: llamar desde Postman/curl → retorna test con preguntas verificadas

### 1.8 Prompt CORRECT_DESARROLLO y flujo completo

- [x] **1.8.1** Crear system prompt CORRECT_DESARROLLO en `lib/ai/prompts.ts`. 2026-02-23
- [x] **1.8.2** Crear user prompt template `buildCorrectDesarrolloPrompt` con slots: {legislacion_relevante}, {desarrollo_usuario}, {tema}. 2026-02-23
- [x] **1.8.3** Crear función `correctDesarrollo(texto, temaId)` en `lib/ai/correct-desarrollo.ts`. 2026-02-23
  1. `buildContext(temaId, query)` → legislación relevante (con query semántica)
  2. `sanitizeForAI(texto)` — elimina PII + XSS antes de enviar a Claude (GDPR ADR-0009)
  3. `callClaudeJSON(Sonnet, CorreccionDesarrolloRawSchema)` → corrección raw con 3 dimensiones
  4. `verifyAllCitations(feedback)` → badges de verificación determinista
  5. Guardar en tabla desarrollos (texto sanitizado con sanitizeHtml) con prompt_version
  6. Retornar CorreccionDesarrolloResult: puntuacion + dimensiones + citas + verificationScore
- [x] **1.8.4** `sanitizeUserText(text)` en `lib/utils/sanitize.ts` ya incluye todos los patrones españoles: DNI/NIE, teléfono español, email, IBAN, tarjeta crédito, nº SS + sanitizeHtml XSS. 2026-02-23
- [x] **1.8.5** Test unitario 29 casos: DNI, NIE, teléfono, email, IBAN, tarjeta, SS, XSS, múltiple PII, y texto jurídico legítimo NO redactado. 2026-02-23
- [x] **1.8.6** Test de integración (9 tests con mocks): flujo completo + verificationScore + error BD + JSON inválido. 2026-02-23
- [x] **1.8.7** Endpoint POST `/api/ai/correct-desarrollo/route.ts`. 2026-02-23
  - Validación Zod (texto min 50 / max 5000 chars, temaId UUID)
  - Auth Supabase, anti-spam 3/min, descuento atómico (use_correction → use_free_correction → 402)
  - Check concurrencia (409 si corrección en últimos 30s)
  - Rate limit silencioso 5/día (safety net)
  - Llama correctDesarrollo(), maneja circuit breaker (503) y errores generales (500)
- [ ] **1.8.8** Verificar endpoint real: llamar con desarrollo de ejemplo → retorna corrección

---

## FASE 1B — UI COMPLETA DE TESTS Y CORRECTOR (Semanas 5-6)

### 1.9 UI página de tests `/tests`

- [x] **1.9.1** Crear componente `components/tests/TemaCard.tsx`: muestra tema con número, título, icono de acceso (candado/abierto) *(2026-02-23)*
- [x] **1.9.2** Crear página `/tests/page.tsx`: lista de temas disponibles desde Supabase, agrupados por bloque temático *(2026-02-23)*
- [x] **1.9.3** Crear selector de configuración de test: dropdown dificultad (fácil/media/difícil) + selector nº preguntas (10/20/30) *(2026-02-23)*
- [x] **1.9.4** Crear botón "Generar Test" que llama a `/api/ai/generate-test` con loading state. El botón se desactiva (`disabled`) inmediatamente al hacer click con `useState(isGenerating)` + `useRef(isGeneratingRef)` para bloqueo síncrono — no se re-habilita hasta respuesta o timeout. El `useRef` previene doble-click incluso antes del re-render de React = doble coste. *(2026-02-23)*
- [x] **1.9.5** Crear componente `components/shared/LoadingState.tsx`: skeleton + mensaje motivador rotativo ("Preparando tu test personalizado...") *(2026-02-23)*
- [x] **1.9.6** Crear sección "Tests anteriores": lista con fecha, tema, puntuación, link a ver detalle *(2026-02-23)*
- [x] **1.9.7** Implementar lógica freemium v3 completa:
  - Usuarios free: mostrar "X/5 tests gratis" con barra de progreso
  - Tests 1-3: renderizar explicaciones completas
  - Tests 4-5: renderizar explicaciones con `filter: blur(8px)` + overlay: "Desbloquea la explicación del Art. X comprando este tema — 4.99€ para siempre" (Loss Aversion + Zeigarnik)
  - Test 6+: mostrar PaywallGate con 2 opciones principales + ancla visual ("Academia: desde 150€/mes")
  - Usuarios con tema comprado: "Ilimitado" para ese tema, PaywallGate para otros temas
  - Usuarios con pack: "Ilimitado — Pack Oposición (límite silencioso 20/día)"
  - Manejar respuesta 409 del backend con mensaje "Ya tienes un test generándose" *(2026-02-23)*
- [ ] **1.9.8** Verificar: página carga, muestra temas, genera test → redirige a `/tests/[id]`

### 1.10 UI vista de test activo `/tests/[id]`

- [x] **1.10.1** Crear componente `components/tests/QuestionView.tsx`: enunciado + 4 opciones (radio buttons) con estilo shadcn *(2026-02-23)*
- [x] **1.10.2** Crear barra de progreso: "Pregunta X de Y" con indicador visual *(2026-02-23)*
- [x] **1.10.3** Crear navegación entre preguntas: botones "Anterior"/"Siguiente" + grid de números para saltar *(2026-02-23)*
- [x] **1.10.4** Implementar feedback inmediato al responder: opción correcta verde, incorrecta roja, justificación expandible *(2026-02-23)*
- [x] **1.10.5** Crear componente `components/shared/CitationBadge.tsx`: badge verde "Verificada" / amarillo "Parcial" / rojo "No verificada" *(2026-02-23)*
- [x] **1.10.6** Mostrar justificación de cada pregunta con CitationBadge en cada cita legal *(2026-02-23)*
- [x] **1.10.7** Crear botón "Reportar pregunta" con dialog: motivo (texto) → envía a tabla preguntas_reportadas *(2026-02-23)*
- [x] **1.10.8** Crear botón "Finalizar test" con confirmación si hay preguntas sin responder *(2026-02-23)*
- [x] **1.10.9** Guardar respuestas y puntuación en BD al finalizar *(2026-02-23)*
- [ ] **1.10.10** Verificar flujo completo: abrir test → responder preguntas → ver feedback → finalizar

### 1.11 UI vista de resultados post-test

- [x] **1.11.1** Crear página `tests/[id]/resultados/page.tsx`: puntuación total prominente (aciertos/total) con color por rango *(2026-02-23)*
- [x] **1.11.2** Crear desglose por dificultad: % acierto en fácil/media/difícil. Campo `dificultad` añadido a `Pregunta` type/schema (optional, backwards compat). Prompt v1.8.0 incluye dificultad por pregunta. Resultados page muestra barras por nivel cuando hay datos. ✅ 2026-02-27
- [x] **1.11.3** Crear lista de preguntas falladas: enunciado + respuesta del usuario + correcta + justificación *(2026-02-23)*
- [x] **1.11.4** Mostrar tiempo total y tiempo medio por pregunta *(2026-02-23)*
- [x] **1.11.5** Crear CTAs contextuales: "Repasa tus errores", "Genera otro test", "Prueba el corrector" *(2026-02-23)*
- [ ] **1.11.6** Verificar: al finalizar test → se muestra ResultsView con datos correctos

### 1.12 UI corrector de desarrollos `/corrector`

- [x] **1.12.1** Crear componente `components/corrector/EditorView.tsx`: textarea grande (min 400px alto) con contador de caracteres *(2026-02-23)*
- [x] **1.12.2** Crear selector de tema (dropdown con temas de la oposición) *(2026-02-23)*
- [x] **1.12.3** Crear botón "Corregir mi desarrollo" con loading state animado. Debounce con `useState(isCorrecting)` + `useRef`. Manejo de 402 (paywall), 409 (en proceso), 503 (no disponible). *(2026-02-23)*
- [x] **1.12.4** Crear componente `components/corrector/FeedbackView.tsx`: nota global prominente + 3 tarjetas de dimensiones expandibles *(2026-02-23)*
- [x] **1.12.5** Crear tarjeta de dimensión: nombre, nota (0-10 con color), feedback detallado *(2026-02-23)*
- [x] **1.12.6** Citas verificadas con CitationBadge en el feedback *(2026-02-23)*
- [x] **1.12.7** Sección "Mejoras sugeridas" con bullet points *(2026-02-23)*
- [x] **1.12.8** Botón "Guardar evaluación" → la corrección ya se guarda automáticamente al generar; FeedbackView muestra indicador "✓ Guardada automáticamente" + botón "Ver en historial" *(2026-02-23)*
- [x] **1.12.9** Historial de correcciones anteriores: lista con fecha, tema, nota *(2026-02-23)*
- [ ] **1.12.10** Verificar flujo completo: escribir desarrollo → seleccionar tema → corregir → ver feedback → guardar

### 1.13 Dashboard del usuario `/dashboard`

- [x] **1.13.1** Crear sección resumen: tarjetas con tests realizados (total), nota media, racha de días consecutivos *(2026-02-23)*
- [x] **1.13.2** Crear gráfico de evolución (últimos 30 días): SVG puro (sin librería), línea de puntuación con área, puntos coloreados por rango *(2026-02-23)*
- [x] **1.13.3** Crear mapa de temas: grid de 28 temas (16 Bloque I + 12 Bloque II) con color por nota media (verde ≥70%, amarillo 50-69%, rojo <50%, gris no intentado). Leyenda. *(2026-02-23)*
- [x] **1.13.4** Crear sección "Últimas actividades": lista cronológica de tests + correcciones recientes con icono, puntuación y link *(2026-02-23)*
- [x] **1.13.5** Crear CTAs contextuales: detecta tema con peor nota (<50%) → card "Tu punto débil" con botón "Practicar ahora" *(2026-02-23)*
- [x] **1.13.6** Crear accesos directos: botones "Generar test" y "Corregir desarrollo" siempre visibles en la cabecera *(2026-02-23)*
- [ ] **1.13.7** Verificar: dashboard carga con datos reales del usuario

### 1.13B Gamificación básica (rachas + logros) — adelantada de Fase 2B

> **Decisión:** Mover rachas y logros básicos a Fase 1B. El opositor necesita "dopamina rápida" para volver mañana. Una racha de 3 días retiene más que features complejas. Coste de implementación bajo, impacto en retención D1/D7 alto.

- [x] **1.13B.1** Crear tabla `logros`: id, user_id (FK), tipo (text enum 9 valores), desbloqueado_en (timestamptz) + RLS *(2026-02-23, migration 008)*
- [x] **1.13B.2** Implementar sistema de rachas en `lib/utils/streaks.ts` + RPC `update_streak()`: lógica HOY/AYER/ANTES → racha += 1 / reset. Columnas `racha_actual`, `racha_maxima`, `ultimo_test_dia` en profiles *(2026-02-23, migration 008)*
- [x] **1.13B.3** Implementar detección de logros: `primer_test`, `racha_3`, `racha_7`, `racha_30`, `50_preguntas`, `100_preguntas`, `nota_perfecta`, `primer_corrector`, `todos_los_temas` via RPC `check_and_grant_logros()` *(2026-02-23)*
- [x] **1.13B.4** Integrar racha en dashboard: StatCard con icono 🔥, valor numérico prominente *(2026-02-23)*
- [x] **1.13B.5** Toast de logro: al finalizar test → backend devuelve `nuevosLogros[]` → TestRunner muestra `toast.success(emoji + titulo)` *(2026-02-23)*
- [x] **1.13B.6** Mini-sección logros en dashboard: últimos 3 logros con emoji + fecha + total *(2026-02-23)*
- [ ] **1.13B.7** Verificar: completar test → racha se incrementa → logro se desbloquea → toast aparece
- [ ] **⚠️ 1.13B.M** **PENDIENTE MANUAL**: Aplicar `supabase/migrations/20260223_008_streaks_logros.sql` en Supabase Dashboard → SQL Editor. Sin esto, las columnas de racha y la tabla logros no existen en BD.

### 1.14 Página de cuenta `/cuenta`

- [x] **1.14.1** Crear sección "Perfil": nombre (editable), email (readonly), oposición seleccionada, fecha examen (editable) — `ProfileForm.tsx` Client Component *(2026-02-23)*
- [x] **1.14.2** Crear sección "Mis compras": lista de compras con fecha, producto, precio, badge "Completado" *(2026-02-23)*
- [x] **1.14.3** Crear sección "Mis correcciones": saldo disponible `corrections_balance` prominente + aviso si < 5 *(2026-02-23)*
- [x] **1.14.4** Crear botón "Exportar mis datos" (→ GET /api/user/export → descarga JSON) *(2026-02-23)*
- [x] **1.14.5** Crear botón "Eliminar mi cuenta" con doble confirmación (escribe "ELIMINAR") → DELETE /api/user/delete *(2026-02-23)*
- [x] **1.14.6** Crear botón "Cerrar sesión" → supabase.auth.signOut() → redirect a /login *(2026-02-23)*
- [ ] **1.14.7** Verificar: todas las acciones de cuenta funcionan

---

## FASE 1C — STRIPE, BETA Y LANZAMIENTO (Semanas 7-8)

### 1.15 Stripe: flujo de compra completo

- [x] **1.15.1** Implementar endpoint POST `/api/stripe/checkout/route.ts` ✅ 2026-02-27
- [x] **1.15.2** Implementar endpoint POST `/api/stripe/webhook/route.ts` (patrón INSERT-first idempotencia, sin suscripciones según ADR-0010) ✅ 2026-02-27
- [x] **1.15.3** Crear componente `components/shared/PaywallGate.tsx` (ADR-0010 — Fuel Tank, ancla vs academia 150€/mes) ✅ 2026-02-27
- [x] **1.15.4** Crear hook `useUserAccess(temaId)` en `lib/hooks/useUserAccess.ts`: verifica compras en BD (tema/pack/free), retorna `{ hasAccess, accessType, loading, corrections, freeTestsUsed }` ✅ 2026-02-27
- [x] **1.15.5** Integrar PaywallGate en página de tests: TemaCard refactorizado — inline paywall eliminado, ahora usa `<PaywallGate code="PAYWALL_TESTS">` Dialog overlay. ✅ 2026-02-27
- [x] **1.15.6** Integrar PaywallGate en corrector: EditorView refactorizado — inline paywall eliminado, ahora usa `<PaywallGate code="PAYWALL_CORRECTIONS">` Dialog overlay. ✅ 2026-02-27
- [ ] **1.15.7** Configurar webhook URL en Stripe Dashboard (producción y test)
- [ ] **1.15.8** Test con Stripe CLI: `stripe trigger checkout.session.completed` → verificar que compra aparece en BD
- [x] **1.15.9** Implementar Stripe Customer Portal: endpoint POST `/api/stripe/portal/route.ts` ✅ 2026-02-27
- [ ] **1.15.10** Verificar flujo completo: click comprar → Stripe Checkout → pago → webhook → acceso desbloqueado

### 1.16 Proveedor de email transaccional

- [ ] **1.16.1** Crear cuenta en Resend (free tier: 3000 emails/mes) *(manual)*
- [x] **1.16.2** Instalar SDK: `pnpm add resend` ✅ 2026-02-27
- [ ] **1.16.3** Configurar dominio de envío en Resend (verificar DNS) *(manual)*
- [x] **1.16.4** Crear `lib/email/client.ts`: wrapper de Resend con from="OPTEK <noreply@optek.es>". Condicional: no-op si RESEND_API_KEY no está configurado ✅ 2026-02-27
- [x] **1.16.5** Crear template email de bienvenida: saludo + 5 tests gratuitos + CTA primer test. `sendWelcomeEmail()` → disparado desde `auth/callback/route.ts` cuando `created_at < 2 min` ✅ 2026-02-27
- [ ] **1.16.5A** (**Wiring pendiente**) Implementar llamada a `sendWelcomeEmail()` en `app/auth/callback/route.ts`: importar función desde `lib/email/client.ts`, calcular si `Date.now() - new Date(session.user.created_at).getTime() < 120_000` (usuario nuevo en últimos 2 min) → llamar fire-and-forget (no await, no bloquear redirect). Sin este wiring el email nunca se envía aunque la función esté implementada.
- [x] **1.16.6** Crear template email de confirmación de eliminación: link confirmación con token (24h expiración), aviso retención fiscal. `sendDeletionConfirmEmail()` ✅ 2026-02-27
- [ ] **1.16.7** Verificar: registro de usuario → recibe email de bienvenida *(manual — requiere RESEND_API_KEY y DNS configurados)*

### 1.17 Implementar GDPR endpoints

- [x] **1.17.1** Implementar `GET /api/user/export/route.ts`: query en paralelo (profiles, tests, desarrollos, compras, suscripciones, reportes, logros) → JSON con `Content-Disposition: attachment` ✅ 2026-02-27
- [x] **1.17.2** Implementar `DELETE /api/user/delete/route.ts`: anonimiza compras (cumplimiento fiscal LGT 4 años) → cascade delete (suscripciones, desarrollos, reportes, tests, logros, perfil) → `auth.admin.deleteUser()`. **⚠️ TODO post-§1.16**: Añadir email de confirmación con token cuando Resend esté configurado. La confirmación UI (escribe "ELIMINAR") ya existe en §1.14.5. ✅ 2026-02-27
- [x] **1.17.3** Test: exportar datos de usuario de prueba → JSON contiene todos los campos esperados. `tests/unit/gdpr.test.ts` (6 tests). ✅ 2026-02-27
- [x] **1.17.4** Test: eliminar usuario → verificar que no quedan datos excepto fiscal. `tests/unit/gdpr.test.ts` (6 tests), incluye verificación orden GDPR (compras anonimizadas antes de deleteUser). ✅ 2026-02-27

### 1.18 Evals antes de beta

> **Aclaración de thresholds (3 métricas diferentes):**
> - **Quality Score de evals** ≥ 85%: mide calidad del output de Claude (formato, relevancia, corrección). Se mide con Golden Datasets contra criterios humanos. Aplica para go/no-go de beta y pre-deploy.
> - **Tasa de verificación determinista** ≥ 90%: mide % de citas legales que pasan verificación contra BD. Se mide en producción con `getVerificationRate()`. Si cae < 80% → alerta (§0.10.20). Aplica post-deploy como métrica operativa.
> - **Preguntas reportadas** ≤ 5%: mide % de preguntas que los usuarios reportan como erróneas. Aplica para go/no-go de lanzamiento público (§1.19.0).
>
> Son complementarias: evals miden calidad pre-deploy, verificación mide integridad en producción, reportes miden percepción del usuario.

- [x] **1.18.1** Crear `tests/evals/generate_test_golden.json` con 5 casos (normal Tema1, normal Tema11 difícil, borde poca legislación, adversarial SQL injection, adversarial instrucciones sistema) ✅ 2026-02-27
- [x] **1.18.2** Crear `tests/evals/correct_desarrollo_golden.json` con 5 casos (desarrollo bueno, citas incorrectas, con PII, muy corto, excelente multitema) ✅ 2026-02-27
- [x] **1.18.3** Crear `execution/run-evals.ts`: framework con evaluadores por criterio + pesos + Quality Score + reporte JSON. Scripts: `pnpm eval:generate`, `pnpm eval:correct`, `pnpm eval:all`. **⚠️ Pendiente: sustituir temaId placeholders por UUIDs reales de BD antes de ejecutar evals reales.** ✅ 2026-02-27
- [ ] **1.18.4** Ejecutar evals: GENERATE_TEST Quality Score > 85%
- [ ] **1.18.5** Ejecutar evals: CORRECT_DESARROLLO Quality Score > 85%
- [ ] **1.18.6** Si score < 85%: iterar prompts hasta alcanzar threshold
- [x] **1.18.7** Crear `tests/evals/adversarial_inputs.json` con 8 ataques: prompt injection directo, XML tags falsos, JSON injection, input largo, instrucciones en inglés, PII injection, SQL injection en temaId, y marcadores ###SYSTEM###. ✅ 2026-02-27
- [ ] **1.18.8** Ejecutar evals adversariales: NINGÚN ataque genera output fuera del schema Zod o con información incorrecta/peligrosa

### 1.19 Beta testing

- [ ] **1.19.0** Definir criterios de éxito de la beta ANTES de reclutar. **Go/No-Go para lanzamiento público:**
  - NPS ≥ 7 (media de beta testers)
  - ≥ 5 de 15 beta testers dicen que pagarían ≥ 10€/mes
  - Quality Score de evals > 85% tras iteraciones
  - Error rate < 1% en uso real
  - ≤ 5% de preguntas reportadas como erróneas
  - Si NO se cumplen → iterar antes de lanzar. No lanzar por cumplir calendario.
- [ ] **1.19.1** Reclutar 10-15 opositores reales (comunidades, conocidos, LinkedIn, foros de oposiciones)
- [ ] **1.19.2** Crear formulario de feedback (Google Forms): ¿preguntas realistas? ¿dificultad adecuada? ¿errores en citas? ¿corrector útil? ¿qué pagarías? NPS (0-10)
- [ ] **1.19.3** Crear cuentas beta con acceso completo gratuito (flag en profiles o compras especiales)
- [ ] **1.19.4** Enviar instrucciones a beta testers: qué probar, dónde dar feedback, duración (2 semanas)
- [ ] **1.19.5** Monitorizar métricas diarias: tests generados, preguntas reportadas, tiempo en app, correcciones solicitadas
- [ ] **1.19.6** Compilar feedback a mitad de beta (semana 1): identificar bugs críticos y mejoras urgentes
- [ ] **1.19.7** Corregir bugs críticos identificados en beta
- [ ] **1.19.8** Iterar prompts basándose en feedback real (re-ejecutar evals tras cambios)
- [ ] **1.19.9** Compilar feedback final: decidir qué mejoras entran en lanzamiento vs backlog
- [ ] **1.19.10** Load test pre-lanzamiento: simular **10** usuarios concurrentes generando tests → verificar error rate <0.1%, P95 response time <10s, sin connection exhaustion. (Con <50 beta users, 50 concurrentes es prematuro. Monitorizar en producción y escalar si necesario.)

### 1.20 Lanzamiento público

- [ ] **1.20.1** Activar pagos reales en Stripe (switch de test a live, actualizar keys en Vercel)
- [ ] **1.20.2** Verificar flujo de pago real con tarjeta propia (compra individual + suscripción)
- [ ] **1.20.3** Configurar alertas Sentry: notificación por email a Aritz para errores CRITICAL
- [ ] **1.20.4** Configurar analytics de conversión: eventos registro → test_gratis → primera_compra
- [ ] **1.20.5** Verificar RGPD final: cookie banner funciona, política privacidad enlazada, consentimiento guardado
- [ ] **1.20.6** Preparar contenido marketing: 3-5 guiones para TikTok/Reels
- [ ] **1.20.7** Publicar primer vídeo de demostración
- [ ] **1.20.8** Post LinkedIn "Building in Public"
- [ ] **1.20.9** Verificar Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **1.20.10** Smoke test final: registro nuevo → test gratis → comprar → test de pago → corrector → ver dashboard

### 1.21 GTM (Go-To-Market) Strategy — Canales validados con margen positivo

> **Principio fundamental:** Nunca operar con pérdidas. Calcular `(ticket_neto - coste_IA - CPA_real) > 0`
> antes de activar cualquier canal. Google Ads (CPA ~€90) y META frío (CPA €30-80) descartados con
> ticket €35. Canales viables: orgánico (CPA €0) + META remarketing semana 3+ (CPA €5-15).
>
> **Datos de mercado validados (Feb 2026):**
> - TAM: ~25.000 opositores activos TAC/año (50.000 solicitudes, ~50% se presentan)
> - Conversión edtech real: 5-8% free→paid (no 10-15%)
> - Competidores: €90-160/mes (CEF, MasterD, Adams) vs OPTEK €34,99 único → 70-100× más barato
> - Riesgo mercado: ratio opositores/plaza cayó de 43 a 23 en 2024 → mitigación: Efecto Matrioska §1.22

- [ ] **1.21.0** **[BLOQUEANTE para todo GTM]** Verificar "Wow Moment" antes de publicar en ningún canal.
  El momento que convierte gratis→pagador es el primer test generado. OBLIGATORIO verificar:
  - Test genera 10 preguntas en < 10 segundos end-to-end (cronometrar con `Date.now()`)
  - Badge "✓ Verificado: Art. XX Ley XX" es visible en cada pregunta (inspeccionar DOM en Chrome)
  - Página de resultados muestra puntuación + errores con explicación + artículo exacto
  - Dashboard muestra racha y progreso inmediatamente tras completar el test
  - Si algún punto falla → corregir antes de activar §1.21.1+. El marketing amplifica tanto lo bueno como lo malo.

- [ ] **1.21.1** **[DÍA 1 — Requisito técnico previo al remarketing]** Instalar META Pixel en la landing.
  El pixel debe estar activo desde el primer día para acumular audience antes de activar remarketing
  (semana 3+ cuando haya ≥200 visitas únicas). Sin pixel activo desde el inicio, no hay audience
  para remarketing. Pasos:
  1. Crear cuenta META Business Manager en business.facebook.com (si no existe)
  2. Crear Pixel en Events Manager → "Añadir datos" → "Meta Pixel" → nombre: "OPTEK Pixel"
  3. Copiar Pixel ID (formato: 123456789012345)
  4. Instalar en Next.js: añadir `<Script id="meta-pixel" strategy="afterInteractive">` en
     `app/layout.tsx` con el snippet oficial de META (fbevents.js + fbq('init', PIXEL_ID) + fbq('track', 'PageView'))
  5. Añadir `NEXT_PUBLIC_META_PIXEL_ID` a `.env.local` y Vercel env vars
  6. Verificar en META Events Manager → Actividad del Pixel → debe aparecer "PageView" tras visitar la landing
  Criterio de éxito: META Events Manager muestra Pixel activo con eventos PageView en tiempo real.

- [ ] **1.21.2** **[DÍA 1 — Infraestructura SEO]** Configurar Google Search Console y submitar sitemap.
  Es gratuito y debe hacerse el primer día de deploy para que Google indexe cuanto antes.
  1. Ir a search.google.com/search-console → "Añadir propiedad" → dominio: `optek.es`
  2. Verificar propiedad mediante registro DNS TXT (método más robusto)
  3. Ir a "Sitemaps" → "Añadir nuevo sitemap" → URL: `https://optek.es/sitemap.xml`
     (Crear `app/sitemap.ts` con las rutas estáticas: `/`, `/login`, `/register`, `/blog/*`)
  4. Verificar en "Cobertura de URL" que no hay errores en las páginas indexadas
  Criterio de éxito: Google Search Console muestra sitemap enviado con X URLs descubiertas.

- [ ] **1.21.3** **[DÍAS 1-14 — Revenue desde el minuto 1]** Implementar Founder Pricing (24,99€ solo orgánico, primeros 50 compradores).
  **Matemática verificada:**
  - Orgánico: Revenue neto €24 - IA €4 - CPA €0 = €20 margen (83%) ✅
  - Google Ads: €24 - €4 - €90 CPA = **-€70 PÉRDIDA SEGURA** ❌

  **Implementación backend:**
  1. En Stripe Dashboard (live mode): crear producto "Pack Oposición Fundador" (24,99€, pago único),
     añadir metadata `correcciones: "30"` y `is_founder: "true"`. Copiar Price ID.
  2. Crear migration SQL: `ALTER TABLE profiles ADD COLUMN is_founder BOOLEAN DEFAULT FALSE;`
     Aplicar en Supabase Dashboard → SQL Editor.
  3. En `app/api/stripe/webhook/route.ts`: al procesar `checkout.session.completed`, si metadata contiene
     `is_founder: "true"` → UPDATE profiles SET is_founder = TRUE, correcciones_restantes = 30.
  4. Añadir `NEXT_PUBLIC_STRIPE_FOUNDER_PRICE_ID` a env vars con el Price ID del pack fundador.

  **Implementación frontend (landing):**
  5. En `app/(marketing)/page.tsx`: añadir banner debajo del hero con:
     - Texto: "Plazas de Fundador: {N} de 50 disponibles"
     - Precio: ~~34,99€~~ 24,99€ + "30 correcciones en vez de 20"
     - Botón "Soy Fundador" → enlaza al checkout de Stripe del pack fundador
     - El contador N: `SELECT COUNT(*) FROM profiles WHERE is_founder = TRUE` via Server Component
  6. En `app/(dashboard)/dashboard/page.tsx`: si `profile.is_founder = TRUE` → badge "Miembro Fundador".

  Criterio de éxito: Flujo completo — click "Soy Fundador" → Stripe checkout → webhook →
  `profiles.is_founder = TRUE`, `correcciones_restantes = 30` → badge visible en dashboard.

- [ ] **1.21.4** **[DÍA 1 — Canal de mayor ROI: CPA €0, máxima intención de compra]** Publicar en comunidades Telegram y foros de opositores.
  Estrategia en 2 pasos (NO publicar OPTEK directo — genera rechazo):

  DÍA 1 — Aporte genuino:
  ```
  "Hola, estoy estudiando para el TAC y preparé este resumen de las preguntas
  más frecuentes del Art. 21 LPAC (notificaciones). Espero que os sirva: [resumen]"
  ```

  DÍA 2 — Introducción de OPTEK (NUNCA poner el link directamente en el grupo):
  ```
  "Ayer compartí el resumen de Art. 21 LPAC. El problema estudiando con ChatGPT
  es que a veces inventa artículos que no existen. Por eso construí una herramienta
  que verifica automáticamente cada cita antes de mostrártela — si alguien la quiere
  probar gratis que me mande mensaje privado y le paso el enlace."
  ```

  **⚠️ REGLA CRÍTICA — NO poner optek.es en el grupo públicamente:**
  Los admins de grupos de opositores en Telegram banean automáticamente a quienes postean
  links externos en sus primeros días de actividad. El link público = ban garantizado.
  La táctica correcta es pedir que te escriban por MD:
  - Evita el ban del admin
  - Activa la escasez de Cialdini: ellos te piden el acceso, no tú lo empujas
  - Los DMs entrantes convierten mucho mejor que los links públicos
  - Una vez establecido en la comunidad (semana 2+), el link ya puede ir en el grupo

  **Grupos prioritarios (por tamaño e intención):**
  1. Telegram: "TAC Auxiliar Administrativo", "Oposiciones AGE 2025", "Cuerpo General Estado"
  2. buscaoposiciones.com (mayor foro de oposiciones en español)
  3. r/oposiciones (Reddit — 30k miembros, menor intención pero SEO)
  4. Grupos CCOO/UGT de información AGE

  Criterio de éxito: ≥50 visitas únicas a optek.es en las primeras 48h + sin bans de admins.

- [ ] **1.21.5** **[DÍA 2 — Canal orgánico, CPA €0, alcance masivo]** Crear perfil TikTok y publicar primer video demo.
  Dato validado: ADAMS Formación reporta 50% de aprobados Madrid 2024 vía TikTok.

  **Setup de cuentas (una vez):**
  - TikTok: @optek_oposiciones | Instagram: @optek.es | YouTube: canal OPTEK

  **Script primer video (60 segundos, vertical 9:16):**
  ```
  [0-5s — HOOK] "La academia me cobra 120€/mes para prepararme el TAC.
  Yo lo preparo por 35€ para siempre. Te cuento cómo."

  [5-25s — DEMO] Screen recording:
  → Abrir optek.es → seleccionar tema LPAC
  → Test generado en <10 segundos
  → Zoom en badge "✓ Verificado: Art. 21 Ley 39/2015"

  [25-50s — DIFERENCIADOR] "Esta IA verifica cada artículo antes de mostrártelo.
  ChatGPT a veces inventa artículos que no existen. OPTEK no."

  [50-60s — CTA] "5 tests gratis, sin tarjeta. optek.es en la bio."
  ```

  **Pipeline semanal (15 min de Aritz):**
  - Claude genera guión (artículo del día, error frecuente, tip de memorización)
  - Aritz graba vertical + publica los 3 canales simultáneamente

  Criterio de éxito: Primer video publicado en TikTok + Instagram + YouTube Shorts con CTA a optek.es.

- [ ] **1.21.6** **[SEMANA 2 — Infraestructura SEO de largo plazo]** Implementar páginas de simulacros oficiales + `/blog/[slug]` + `/sitemap.xml` dinámico.

  **PRIORIDAD 1 — Páginas de simulacros oficiales (conversión mayor que el blog):**
  Los opositores buscan "examen auxiliar administrativo INAP 2024 PDF". Son búsquedas de
  altísima intención: quien busca el PDF exacto ya tiene ganas de estudiar y convertir.
  En vez de darles el PDF estático (que tienen todos los competidores), les damos el simulacro
  interactivo (que solo tiene OPTEK). La conversión es superior a un artículo de blog genérico.

  Implementación de páginas de simulacros:
  1. Crear `app/(marketing)/simulacros/[examen]/page.tsx` como Server Component
     - URL: `/simulacros/inap-2024`, `/simulacros/inap-2023`, `/simulacros/inap-2022`
     - Título H1: "Examen Oficial Auxiliar Administrativo INAP 2024 — Con Respuestas Explicadas"
     - Las primeras 10 preguntas son gratis + interactivas (usa datos de `preguntas_oficiales`)
     - Para ver las explicaciones IA → paywall (CTA: "Desbloquear explicaciones con IA")
  2. Schema JSON-LD `Quiz` + `FAQPage` en cada página → SEO estructurado
  3. `generateMetadata()` con title/description/og:image específico por examen
  4. Añadir al `sitemap.ts`: `/simulacros/[examen]` con prioridad 0.9

  Keywords target de alta intención (searches del PDF):
  - "examen auxiliar administrativo INAP 2024 PDF" → alta intención, 0 competencia interactiva
  - "simulacro inap 2024 con respuestas" → ~390 búsquedas/mes
  - "preguntas examen auxiliar estado 2023 resueltas" → long-tail, alta conversión

  **PRIORIDAD 2 — Blog genérico (menor conversión, mayor volumen a largo plazo):**
  5. Crear `app/(marketing)/blog/[slug]/page.tsx` como Server Component
  6. Posts como archivos MDX en `content/blog/` (no depende de BD, editable con Claude)
  7. Instalar `@next/mdx` o `next-mdx-remote`
  8. `generateMetadata({ params })` con title, description, og:image por post
  9. Schema JSON-LD `Article` en cada post
  10. Página índice `/blog/page.tsx`

  **Implementación `/sitemap.xml`:**
  11. Crear `app/sitemap.ts`:
      - Rutas estáticas: `/`, `/login`, `/register`, `/blog`, `/simulacros`
      - Rutas dinámicas: `/simulacros/[examen]` (prioridad 0.9), `/blog/[slug]` (prioridad 0.8)
      - Prioridades: home=1.0, simulacros=0.9, blog=0.8, auth=0.3

  Criterio de éxito: `https://optek.es/sitemap.xml` accesible. Al menos 3 páginas de simulacros
  publicadas. Google Search Console muestra sitemap procesado sin errores.

- [ ] **1.21.7** **[SEMANA 2 — Contenido SEO]** Publicar páginas de simulacros + primeros 3 artículos del blog con Claude.
  Workflow: Claude genera draft → Aritz revisa → publicar. Tiempo: ~2h/semana.

  **Prioridad 1 — 3 páginas de simulacros oficiales (mayor ROI):**
  1. `/simulacros/inap-2024` — "Examen Oficial Auxiliar Administrativo INAP 2024 (Resuelto)"
  2. `/simulacros/inap-2023` — "Examen Oficial Auxiliar Administrativo INAP 2023 (Resuelto)"
  3. `/simulacros/inap-2022` — "Examen Oficial Auxiliar Administrativo INAP 2022 (Resuelto)"

  **Prioridad 2 — 3 artículos blog (volumen de búsqueda a largo plazo):**
  4. "Los 10 artículos del LPAC que más caen en exámenes INAP"
  5. "Cómo funciona la penalización -1/3 en el examen Auxiliar Administrativo INAP"
  6. "Diferencias LPAC vs LRJSP para el examen Auxiliar Administrativo"

  **Instrucción para Claude al generar cada pieza:**
  - Simulacros: incluir las preguntas reales del examen (de `preguntas_oficiales`), primeras 10 gratis,
    CTA prominente para ver explicaciones IA. No inventar preguntas.
  - Blog: 1.500-2.500 palabras, al menos 2 preguntas de ejemplo de OPTEK, CTA al final,
    metadescripción <160 chars, H2/H3 para "People Also Ask"

  Criterio de éxito: 3 páginas de simulacros + 3 artículos publicados, indexados en Search Console.

- [ ] **1.21.8** **[SEMANA 3+ — Paid canal con margen positivo verificado]** Activar META Remarketing.
  **Condición de activación (AMBAS deben cumplirse):**
  1. Pixel META tiene ≥200 visitas únicas acumuladas
  2. **Regla del "house money"**: haber cerrado al menos 4 ventas orgánicas (~€100 netos en cuenta).
     Solo se invierte en Ads el dinero que la propia app ha generado, NUNCA dinero personal.
     Si al llegar a 200 visitas no hay 4 ventas orgánicas → revisar el Wow Moment antes de activar Ads.

  **Por qué la regla del house money es crítica:**
  META Ads cobra por impresiones (CPM), no por conversiones. €5/día se gastan aunque nadie compre.
  Si el Wow Moment no funciona bien todavía, los Ads amplificarán el problema, no lo resolverán.
  El dinero orgánico actúa como señal de que el producto convierte antes de apostar en paid.

  **Ciclo de reinversión:**
  - 4 ventas orgánicas = ~€100 netos → invertir €50 en remarketing
  - Si esos €50 generan ventas: reinvertir el total recibido (€136 del escenario base)
  - Si esos €50 no generan ventas en 7 días: **APAGAR** inmediatamente. No reinvertir. Investigar.
  - En ningún caso tocar dinero personal para financiar Ads.

  **Matemática verificada (precio normal 34,99€ — NUNCA Founder Pricing en paid):**
  ```
  €100 en remarketing META → ~200 clicks (CPC ~€0.50 remarketing warm)
  200 clicks × 40% landing→registro = 80 registros
  80 registros × 5% registro→compra = 4 compradores
  Revenue = 4 × €34 neto = €136
  Ad spend = €100 | Coste IA = €16
  Margen neto = €136 - €100 - €16 = €20 (20%) ✅ VIABLE
  ```
  Solo funciona con remarketing (CPC ~€0.50). NO con frío (CPC €1.50-3.50 → pérdidas).

  **Setup campaña META Ads Manager:**
  1. Verificar Pixel instalado en §1.21.1 tiene ≥200 eventos acumulados
  2. Crear audiencia: Visitors de `optek.es` o `optek.es/register` en los últimos 14 días,
     EXCLUIR quienes ya completaron "Purchase"
  3. Campaña → Objetivo: "Leads" (registro, no venta directa)
  4. Ad set: €5/día, toda la semana, audiencia creada en paso 2
  5. Creativo: "¿Todavía estudiando con IA que inventa artículos? OPTEK verifica cada cita legal."
     CTA: "Regístrate gratis" → `https://optek.es/register?utm_source=meta&utm_medium=remarketing`
  6. Evento de conversión: "Lead" = registro completado

  **Stop-loss:**
  - Revisar métricas cada 3 días
  - CPA registro > €10 después de 7 días → pausar e investigar
  - CPA registro < €5 → aumentar presupuesto a €10/día

  Criterio de éxito: Campaña activa con CPA registro < €10, ROAS positivo verificado semanalmente.

---

## FASE 2A — PERSONALIZACIÓN (Post-MVP — priorizar según validación de mercado)

> **Nota MVP:** De esta fase, solo Flashcards simples (§2.1-2.2 simplificados) y Simulacros (§2.6) se incluyen en el MVP. El resto (Plan adaptativo, IPR) se implementa post-validación.

### 2.1 Flashcards: backend

- [x] **2.1.1** Crear tabla `flashcards`: migration 015, RLS completo (SELECT/INSERT/UPDATE/DELETE own), índices. ✅ 2026-02-27
- [x] **2.1.2** Habilitar RLS en `flashcards`. ✅ 2026-02-27
- [x] **2.1.3** Implementar intervalos fijos en `lib/utils/spaced-repetition.ts`: `getNextInterval(intervalo, calidad)` + `getNextReviewDate()`. Secuencia: 1→3→7→14→30 días. ✅ 2026-02-27
- [x] **2.1.4** Test unitario: acertar 3 veces → 14 días, fallar → reset 1 día. 12 tests en `tests/unit/spaced-repetition.test.ts`. ✅ 2026-02-27
- [x] **2.1.5** Prompt GENERATE_FLASHCARD en `lib/ai/flashcards.ts`: input(pregunta + opciones + explicacion) → output({frente, reverso, cita_legal}). ✅ 2026-02-27
- [x] **2.1.6** Función `generateFlashcardFromError()` en `lib/ai/flashcards.ts`: Claude Haiku → fallback determinista si parse falla. ✅ 2026-02-27

### 2.2 Flashcards: auto-generación y UI

- [x] **2.2.1** Integrar auto-generación: al finalizar test tipo='test', `generateFlashcardsBackground()` fire-and-forget (max 3 flashcards). ✅ 2026-02-27
- [x] **2.2.2** Crear página `/flashcards/page.tsx`: mazos por tema, contador "X pendientes hoy", estado vacío con CTA. ✅ 2026-02-27
- [x] **2.2.3** Crear componente `FlashcardReview.tsx`: animación flip CSS 3D (rotateY), botones calidad 4 niveles, sesión completada con % aciertos. ✅ 2026-02-27
- [x] **2.2.4** Sesión de repaso via `FlashcardSessionStarter.tsx`: modal inline, carga flashcards con siguiente_repaso <= hoy. ✅ 2026-02-27
- [x] **2.2.5** Endpoint `PUT /api/flashcards/[id]/review`: actualiza intervalo + siguiente_repaso + veces_acertada/fallada. ✅ 2026-02-27
- [ ] ~~**2.2.6** Crear flashcard manual~~ → **Post-MVP.** Solo auto-generación desde errores en MVP.
- [ ] **2.2.7** Verificar flujo: fallar pregunta en test → flashcard creada → aparece en repaso → evaluar → siguiente_repaso actualizado

### 2.3 Plan de estudio adaptativo: backend — **⏸️ POST-MVP**

> **Decisión:** Eliminar del MVP. Los opositores ya tienen su plan de academia/temario. Un prompt de Claude + calendario es nice-to-have, no core. Implementar cuando haya >200 usuarios y feedback que lo pida.

- [ ] **2.3.1** Crear tabla `plan_estudio` en Supabase: id, user_id (FK), fecha_examen (date), horas_diarias (int), plan (jsonb), created_at, updated_at
- [ ] **2.3.2** Habilitar RLS: SELECT/INSERT/UPDATE WHERE auth.uid() = user_id
- [ ] **2.3.3** Crear prompt GENERATE_PLAN: input(temas, fecha_examen, horas/día, puntuaciones por tema) → output(calendario JSON)
- [ ] **2.3.4** Crear función `generateStudyPlan(userId)`: recuperar datos del usuario → llamar Claude → guardar plan en BD
- [ ] **2.3.5** Crear función `adjustPlan(userId)`: detectar retraso → regenerar plan con fechas actualizadas

### 2.4 Plan de estudio adaptativo: UI — **⏸️ POST-MVP**

- [ ] **2.4.1** Crear página `/plan-estudio/page.tsx`: vista calendario semanal
- [ ] **2.4.2** Cada día: lista de actividades con checkbox (estudio, test, repaso, simulacro)
- [ ] **2.4.3** Indicador de progreso global: % del plan completado
- [ ] **2.4.4** Alerta si acumula > 3 días de retraso: botón "Reajustar plan"
- [ ] **2.4.5** Setup wizard: primera vez → pedir fecha examen + horas/día → generar plan
- [ ] **2.4.6** Verificar flujo: configurar → generar plan → ver calendario → marcar tarea → progreso se actualiza

### 2.5 Índice de Preparación Relativa (IPR) — **⏸️ POST-MVP**

> **Decisión:** Métrica que requiere masa crítica (>500 usuarios) para que la comparación tenga sentido. Sin base de usuarios, un percentil no motiva.

- [ ] **2.5.1** Crear tabla `ipr_snapshots`: id, user_id (FK), fecha (date), score (float 0-100), percentil (float 0-100), detalle (jsonb), created_at
- [ ] **2.5.2** Implementar cálculo IPR en `lib/utils/ipr.ts`: fórmula ponderada con factor recencia
- [ ] **2.5.3** Test unitario: usuario con 80% aciertos recientes → score alto, usuario sin actividad 7 días → score penalizado
- [ ] **2.5.4** Crear función `calculateIPR(userId)`: query tests últimos 30 días → calcular → guardar snapshot
- [ ] **2.5.5** Integrar en dashboard: score prominente (0-100) con color, flecha tendencia, top 3 temas a mejorar
- [ ] **2.5.6** Gráfico evolución IPR: línea últimos 30/60/90 días (mismo componente que gráfico puntuación)

### 2.6 Simulacros cronometrados

> **Formato oficial:** 110 preguntas en 90 minutos. Parte 1: 30 teóricas (Bloque I) + 30 psicotécnicas. Parte 2: 50 teórico-prácticas (Bloque II). Penalización: errónea descuenta 1/3 del valor de correcta. Total: 100 puntos (50 por parte).

- [ ] **2.6.1** Crear página `/simulacros/page.tsx`: selección de simulacro — completo (110 preguntas / 90 min) o parcial (55 preguntas / 45 min)
- [x] **2.6.2** Implementar timer estricto: countdown 90 min (o 45 min parcial) con barra de progreso. Auto-submit al agotar tiempo. Audio/vibración de aviso a 10 min y 5 min ✅ 2026-02-27
- [ ] **2.6.2A** Estructura del simulacro completo:
  - **Parte 1** (60 preguntas): 30 preguntas teóricas de Bloque I (RAG + legislación) + 30 preguntas psicotécnicas (motor determinista §1.3B)
  - **Parte 2** (50 preguntas): 50 preguntas teórico-prácticas de Bloque II (RAG + conocimiento_tecnico)
  - Cada parte se puntúa sobre 50 puntos. Total sobre 100
- [ ] **2.6.2B** Sistema de puntuación con penalización: correcta = +1 punto, errónea = -1/3 punto, en blanco = 0. Mostrar desglose al finalizar
- [ ] **2.6.3** Al finalizar: calcular nota con penalización, guardar resultado en BD con desglose por bloque y categoría
- [ ] **2.6.4** Vista de resultados de simulacro: nota sobre 100, tiempo empleado, desglose por tema y bloque, comparativa con media de otros usuarios
- [ ] **2.6.5** Verificar: simulacro completo funciona end-to-end con timer

### 2.6A Simulacros de Convocatorias Pasadas (INAP Oficial)

> **Contexto:** Practicar con preguntas reales de convocatorias pasadas es el entrenamiento más directo posible — estas son exactamente las preguntas que cayeron en el examen oficial. Disponibles: 2023-2024, 2021-2022, 2020, 2018-2019 (fuente: §1.3).
>
> **Monetización:** Simulacros **gratis** (engagement máximo) + upsell en corrección IA. El momento de conversión es después de ver los errores sin entender por qué — "Explicar mis errores con IA" consume 1 `corrections_balance`. 1 corrección = explicación de TODOS los errores del simulacro (independientemente del número).
>
> **Dependencias:** §1.3 (ingest completo), §0.5.10A (schema v2), §1.6.2 (ANTHROPIC_API_KEY).

- [x] **2.6A.1** Crear endpoint `POST /api/ai/generate-simulacro/route.ts`: genera test a partir de `preguntas_oficiales` sin llamada a Claude. Input: `{ examenId?, anno?, numPreguntas?, temaNumero? }`. Selección aleatoria. INSERT en `tests_generados (tipo: 'simulacro', examen_oficial_id, tema_id: null)`. Rate limit silencioso 10/día. Créditos: NINGUNO (free). Returns `TestGenerado`
- [x] **2.6A.2** Actualizar `app/(dashboard)/simulacros/page.tsx`: reemplazar contenido "Coming Soon" con grid de convocatorias disponibles. Fetch de `examenes_oficiales` ordenado por `anno DESC`. Mostrar cards por año + badge "INAP Oficial" + nº preguntas
- [x] **2.6A.3** Crear componente `components/simulacros/SimulacroCard.tsx` (patrón `TemaCard.tsx`): muestra convocatoria, año, turno (libre/interna), modelo (A/B cuando aplique), nº preguntas total. Selector: examen completo (100 preguntas) / bloque temático (20-40). Botón "Iniciar Simulacro" sin paywall
- [x] **2.6A.4** Reutilizar `TestRunner` y `TestDetailPage` existentes (ya soportan `tipo: 'simulacro'`). Añadir cabecera contextual "Simulacro Oficial INAP — Convocatoria [convocatoria]" cuando `examen_oficial_id IS NOT NULL`
- [x] **2.6A.5** Crear endpoint `POST /api/ai/explain-errores/route.ts` (PREMIUM — 1 corrección): carga test tipo 'simulacro' completado, extrae preguntas donde `respuesta_usuario ≠ correcta`, llama Claude Haiku para explicar cada error en contexto. Patrón BUG-010: check `corrections_balance > 0` sin descontar → IA → deducir SOLO tras éxito (`use_correction RPC`). Retorna `{ explicaciones: [{ numero, enunciado, tuRespuesta, correcta, explicacion }] }`. Rate limit: 5/día silencioso
- [x] **2.6A.6** Crear componente `components/simulacros/ExplicarErroresPanel.tsx`: se muestra en `tests/[id]/resultados/page.tsx` cuando `test.tipo === 'simulacro'` y hay errores. Estado: idle → loading → done. Botón "Explicar mis errores con IA (1 corrección)" → paywall si sin balance (mismo modal que `TemaCard.tsx`). Cuando done: acordeón de errores con explicación expandible por pregunta
- [x] **2.6A.7** Integrar `ExplicarErroresPanel` en `app/(dashboard)/tests/[id]/resultados/page.tsx`: detectar `tipo === 'simulacro'` + `examen_oficial_id IS NOT NULL` → renderizar panel. Pasar `testId` como prop
- [x] **2.6A.8** Añadir tipo `ExplicacionError` a `types/ai.ts`: `{ numero: number, enunciado: string, tuRespuesta: number, correcta: number, explicacion: string }`. Añadir `SimulacroOficial` con campos de convocatoria
- [x] **2.6A.9** Sistema de puntuación con penalización oficial para simulacros: correcta = +1, errónea = -1/3, en blanco = 0. Activar SOLO cuando `examen_oficial_id IS NOT NULL`. Mostrar desglose "Correctas / Incorrectas / En blanco / Nota con penalización" en resultados. Coexiste con puntuación estándar (sin penalización) para tests de tema
- [ ] **2.6A.10** Verificar flujo end-to-end: [1] iniciar simulacro 2024 → [2] completar 20 preguntas → [3] ver errores con puntuación penalizada → [4] click "Explicar errores" → [5] Claude explica cada error → o [5b] paywall si sin correcciones

### 2.7 Feedback de usuarios (sugerencias y mejoras)

> **Valor:** Canal directo para que los opositores envíen sugerencias de mejora, reportes de errores, y solicitudes de funcionalidades. Complementa §0.6.2 (preguntas_reportadas) con feedback general de producto.

- [x] **2.7.1** Crear tabla `sugerencias`: migration 014 con RLS, CHECK constraints, índices. ✅ 2026-02-27
- [x] **2.7.2** Habilitar RLS en `sugerencias`: INSERT para authenticated, SELECT own. ✅ 2026-02-27
- [x] **2.7.3** Crear endpoint `POST /api/user/feedback/route.ts`: Zod validation (10-2000 chars), rate limit 5/día, insert en BD. ✅ 2026-02-27
- [x] **2.7.4** Crear componente `components/shared/FeedbackButton.tsx`: botón flotante con modal, 4 tipos de feedback. ✅ 2026-02-27
- [x] **2.7.5** Integrar FeedbackButton en layout del dashboard. ✅ 2026-02-27
- [ ] **2.7.6** Email automático a Aritz (via Resend) cuando se recibe una sugerencia nueva — condicional si RESEND_API_KEY configurado
- [ ] **2.7.7** Verificar: usuario envía sugerencia → aparece en BD → email recibido

---

## FASE 2B — GAMIFICACIÓN AVANZADA + ALERTAS BOE — **⏸️ POST-MVP COMPLETA**

> **Decisión:** Rachas y logros básicos ya están en Fase 1B (§1.13B). Rankings requieren masa crítica (>100 usuarios/oposición). Alertas BOE email son prematuras — en MVP el monitor BOE es un script manual ejecutado mensualmente. Toda esta fase se implementa post-validación de mercado.

### 2.8 Gamificación avanzada (extiende §1.13B)

- [ ] **2.8.1** Crear tabla `ranking_semanal`: id, user_id (FK), oposicion_id (FK), semana (date), puntuacion_total (float), posicion (int), percentil (float)
- [x] **2.8.2** Implementar logros avanzados (extienden los básicos de §1.13B): `racha_30`, `100_preguntas` ya en migration 008. Nuevos: `500_preguntas`, `10_temas_completados`, `todas_notas_sobre_7`. Migration 016 + catalog entries en `LOGROS_CATALOG`. ✅ 2026-02-28
- [ ] **2.8.3** Crear cron job (Vercel Cron): cada lunes calcular ranking semanal por oposición
- [x] **2.8.4** Crear página `/logros/page.tsx`: grid completo de badges (desbloqueados en color, pendientes en gris), con descripción y fecha de desbloqueo. Añadir "Logros" + Trophy icon a Sidebar/Navbar. "Ver todos" link en LogrosGrid dashboard. ✅ 2026-02-28
- [ ] **2.8.5** Crear componente `RankingTable.tsx`: top 20 + posición del usuario resaltada
- [ ] **2.8.6** Crear página `/ranking/page.tsx`: ranking semanal + mensual, filtro por oposición
- [ ] **2.8.7** Verificar: completar tests → logros avanzados se desbloquean → ranking se calcula semanalmente

### 2.9 Monitorización BOE (cron job)

- [ ] **2.9.1** Crear `execution/boe-monitor.ts`: obtener lista de leyes monitorizadas desde BD
- [ ] **2.9.2** Para cada ley: scraping del BOE (buscar modificaciones publicadas)
- [ ] **2.9.3** Para cada artículo modificado: normalizar texto → generar hash → comparar con hash almacenado
- [ ] **2.9.4** Si hash difiere: actualizar texto_integro + hash_sha256 en BD, insertar en cambios_legislativos
- [ ] **2.9.5** Invalidar preguntas generadas que citan el artículo modificado (flag needs_regeneration)
- [ ] **2.9.6** Regenerar embeddings del artículo actualizado
- [ ] **2.9.7** Configurar Vercel Cron: ejecutar diariamente a las 08:00 CET
- [ ] **2.9.8** Log de ejecución: leyes revisadas, cambios detectados, artículos actualizados
- [ ] **2.9.9** Test: simular cambio en artículo → verificar detección → verificar invalidación de tests

### 2.10 Alertas personalizadas BOE

- [ ] **2.10.1** Crear template email en Resend: "Cambio legislativo que afecta a tu temario" con artículo, resumen, CTA.
  **Copy psicológico para Flash Test (hook "¿Lo sabrías o suspenderías?"):**
  - Asunto: "⚠️ El BOE acaba de cambiar algo de tu temario — ¿te pillaría el examen?"
  - Cuerpo: "Esta semana el BOE modificó [artículo X de ley Y]. En el examen del año pasado cayó una pregunta directa sobre este punto. Hemos generado 3 preguntas nuevas para que compruebes si lo tienes asimilado."
  - CTA principal: "Ver si lo sé → [3 preguntas inline]" (las preguntas se muestran en el propio email como HTML interactivo, o linkean a `/flash-test?boe_change_id=X`)
  - CTA secundario (si responde mal): "Estudia este artículo con OPTEK — tests ilimitados" → upsell natural
  - **Principio (Antigravity):** El email no informa ("cambió esto"), genera ansiedad positiva ("¿tú lo sabrías?"). La curiosidad + miedo al fracaso es el principal motivador de un opositor. El email funciona como engagement trigger, no como newsletter.
- [ ] **2.10.2** Integrar envío de email en boe-monitor: cuando se detecta cambio → enviar a usuarios afectados (los que tienen ese tema en su oposición)
- [ ] **2.10.3** Crear badge en dashboard: "X cambios legislativos pendientes"
- [ ] **2.10.4** Crear página `/cambios-legislativos/page.tsx`: lista de cambios recientes con antes/después
- [ ] **2.10.5** Generar mini-test de actualización: 5 preguntas sobre artículo modificado
- [ ] **2.10.6** Verificar: cambio detectado → email enviado → badge aparece → mini-test generado

---

## FASE 2C — INNOVACIÓN DIFERENCIAL (El "Tridente Real") — **⏸️ POST-MVP FASE 1**

> **Por qué existe esta fase:** Un libro de tests da las mismas preguntas a todos. Una academia da las mismas clases a todos. OPTEK debe ser el único servicio que te da *la práctica correcta para ti* en *el momento correcto*. Esta fase construye los tres pilares que hacen esto posible.
>
> **El Tridente Real:**
> - **Pilar 1 — Siempre Actualizada** (BOE Watcher, §2.13): "Nunca estudies ley desfasada. Las academias tardan semanas. OPTEK, 24h."
> - **Pilar 2 — Aprende como el examen te va a preguntar** (Caza-Trampas §2.12 + Radar §2.14): "Sabemos qué artículos caen más. Sabemos cómo el tribunal pone las trampas."
> - **Pilar 3 — Personalizada para ti cada día** (Weakness RAG §2.11 + Bucle Diario §2.13): "Cada test está optimizado para tus puntos débiles específicos. Esto NO puede hacerlo ninguna academia."
>
> **Prioridad de implementación:**
> - `AHORA (Fase 1B-1C)`: §2.11 Weakness-Weighted RAG ($0 coste, sin dependencias) → §2.13 BOE Watcher + Bucle Diario (infraestructura ~85% lista)
> - `DESPUÉS DEL LANZAMIENTO (Fase 2A)`: §2.12 Caza-Trampas (feature viral más original del mercado)
> - `CUANDO §1.3 ESTÉ COMPLETO (Fase 2B)`: §2.14 Radar del Tribunal (cierra el loop monetización Premium)

### 2.11 Weakness-Weighted RAG — Pilar 3 base

> **Qué es:** `buildContext(temaId, query?, userId?)` consulta qué artículos el usuario falla más y los sobre-representa en el contexto RAG. Cada test generado es más relevante para *ese* usuario específico. Coste adicional: $0 (solo SQL sobre tablas ya existentes).

#### Backend: migración y RPC

- [ ] **2.11.1** Crear migration `20260223_009_weakness_rag.sql`: añadir columna `preguntas_incorrectas jsonb DEFAULT '[]'` a tabla `tests_generados`. Almacena `[{legislacion_id, articulo_numero, ley_codigo}]` de cada pregunta respondida incorrectamente.
- [ ] **2.11.2** Crear función RPC en la misma migration: `get_user_weak_articles(p_user_id uuid, p_tema_id uuid, p_limit int DEFAULT 10)` → `SELECT legislacion_id, COUNT(*) AS fallos FROM tests_generados, jsonb_array_elements(preguntas_incorrectas) WHERE user_id = p_user_id AND tema_id = p_tema_id GROUP BY legislacion_id ORDER BY fallos DESC LIMIT p_limit`.
- [ ] **2.11.3** Aplicar migration en Supabase. Verificar que RPC funciona: `SELECT * FROM get_user_weak_articles('user-uuid', 'tema-uuid', 5)`.
- [ ] **2.11.4** Crear `down` migration correspondiente: `20260223_009_weakness_rag.down.sql`.

#### lib/ai/retrieval.ts: contexto personalizado

- [ ] **2.11.5** Modificar firma de `buildContext` en `lib/ai/retrieval.ts`: `buildContext(temaId: string, query?: string, userId?: string): Promise<RetrievalContext>`. Mantener backward-compatible (userId opcional).
- [ ] **2.11.6** Cuando `userId` se pasa: llamar `get_user_weak_articles(userId, temaId, 10)` via Supabase RPC antes de la búsqueda semántica principal.
- [ ] **2.11.7** Implementar boost: los `legislacion_id` de artículos débiles se incluyen primero en el contexto (fetch directo por ID), antes del resultado semántico normal. Máximo 3 artículos "débiles" + resto del contexto normal (complementar, no reemplazar).
- [ ] **2.11.8** Añadir log estructurado: `logger.info({ weakArticles: weakIds.length, strategy: userId ? 'weakness-weighted' : 'semantic' }, 'buildContext strategy')`.
- [ ] **2.11.9** Actualizar tipo `RetrievalContext` en `lib/ai/retrieval.ts`: añadir campo `strategy: 'semantic' | 'weakness-weighted' | 'fallback'`.

#### lib/ai/generate-test.ts y API route

- [ ] **2.11.10** Pasar `userId` desde `app/api/ai/generate-test/route.ts` a `generateTest()`. El `userId` viene del Supabase session en el handler.
- [ ] **2.11.11** Pasar `userId` desde `generateTest()` a `buildContext()`.
- [ ] **2.11.12** Rellenar `preguntas_incorrectas` al completar test: en la ruta de results, PATCH `tests_generados` con las preguntas respondidas incorrectamente (con su `legislacion_id`).
- [ ] **2.11.13** Crear o actualizar ruta `app/api/tests/[id]/complete/route.ts`: recibe `{ respuestas: number[] }` → calcula incorrectas → UPDATE `tests_generados SET preguntas_incorrectas = [...], completado_at = now()`.

#### Tests

- [ ] **2.11.14** Test unitario en `tests/unit/retrieval.test.ts`: cuando `userId` se pasa y RPC retorna artículos débiles, el contexto los incluye primero.
- [ ] **2.11.15** Test unitario: cuando `userId` se pasa pero RPC retorna vacío (usuario nuevo), `buildContext` funciona igual que sin `userId`.
- [ ] **2.11.16** Verificación E2E: generar test para Tema 11 con `userId` → completar respondiendo incorrectamente 3 preguntas del Art. 21 LPAC → generar segundo test → verificar que Art. 21 LPAC aparece en el contexto del segundo test.

---

### 2.12 Modo Caza-Trampas — Pilar 2 (originalidad + retención)

> **Qué es:** El usuario recibe un fragmento de artículo legal con N errores sutiles inyectados por GPT (plazos incorrectos, porcentajes cambiados, verbos modificados). Su misión: identificar y corregir cada error. Evaluación 100% determinista (string comparison). Primera vez que un opositor es el "auditor" en lugar del "examinado". Compartible en redes.

#### Backend: migration y schema

- [x] **2.12.1** Crear migration `20260228_017_cazatrampas.sql` (tabla `cazatrampas_sesiones`, RLS, índice). Aplicar en Supabase.
- [x] **2.12.2** Crear `down` migration `20260228_017_cazatrampas.down.sql`.

#### lib/ai/prompts.ts: nuevo sistema prompt

- [x] **2.12.3** Añadir `SYSTEM_CAZATRAMPAS` en `lib/ai/prompts.ts`.
- [x] **2.12.4** Añadir `buildCazaTrampasPrompt(params)` en `lib/ai/prompts.ts`.

#### lib/ai/schemas.ts: Zod schemas

- [x] **2.12.5** Añadir `ErrorInyectadoSchema` en `lib/ai/schemas.ts`.
- [x] **2.12.6** Añadir `CazaTrampasRawSchema` en `lib/ai/schemas.ts`.

#### lib/ai/generate-cazatrampas.ts

- [x] **2.12.7** Crear `lib/ai/generate-cazatrampas.ts`. Verificación determinista + retry + guarda en BD sin revelar errores al cliente.

#### lib/ai/grade-cazatrampas.ts

- [x] **2.12.8** Crear `lib/ai/grade-cazatrampas.ts`. Grading 100% determinista (case-insensitive string match). Sin IA.

#### API endpoints

- [x] **2.12.9** Crear `app/api/cazatrampas/generate/route.ts` (rate limit 20/día).
- [x] **2.12.10** Crear `app/api/cazatrampas/[id]/grade/route.ts`.

#### UI

- [x] **2.12.11** Crear `components/cazatrampas/CazaTrampasCard.tsx` (input manual para detecciones + pantalla de resultados).
- [x] **2.12.12** Crear `app/(dashboard)/cazatrampas/page.tsx` (selector dificultad + generación + sesión activa).
- [x] **2.12.13** Añadir link "Caza-Trampas" + Target icon en `Sidebar.tsx` y `Navbar.tsx`.

#### Tests

- [x] **2.12.14** Test unitario `tests/unit/grade-cazatrampas.test.ts`: 11 tests — 100%/0%/parcial/case-insensitive/validaciones de sesión/estructura del resultado. **182/182 tests pasando.**
- [x] **2.12.15** Test unitario: `generateCazaTrampas` verifica que `valor_original` es substring literal del artículo base — si no lo es, lanza error tras MAX_RETRIES.
- [x] **2.12.16** Test unitario: `texto_trampa` contiene exactamente los `valor_trampa` — si no, reintenta y al agotar lanza error. **190/190 tests pasando.**

- [ ] **2.12.17** Ajustar rate limit del endpoint `app/api/cazatrampas/generate/route.ts`: usuarios free → **3 partidas/día** (ahora: 20/día — demasiado generoso, reduce urgencia de pago). Usuarios paid → ilimitado.
  - Cambiar constante en `app/api/cazatrampas/generate/route.ts`: `FREE_DAILY_LIMIT = 3`
  - Añadir mensaje de bloqueo: "Has usado tus 3 partidas gratuitas de hoy. Con el Pack Oposición tienes partidas ilimitadas."
  - Lógica: comprobar `profiles.plan` (`free` vs `paid`) + contar `cazatrampas_sesiones` del día actual (WHERE `user_id = X AND created_at > today`)
  - **Justificación (Antigravity):** 20/día = engagement sin conversión. 3/día = el usuario enganchado quiere más pero no puede → momento de fricción positiva → pago. Wordle funciona con 1/día.
  - Criterio de éxito: usuario free intenta 4ª partida → recibe mensaje + CTA al pack. Usuario paid → sin restricción.

---

### 2.13 BOE Watcher + Bucle Diario — Pilares 1+3 (recurrencia diaria)

> **Qué es:** El motor del hábito diario. Cada mañana, un cron calcula para cada usuario activo: (1) ¿hubo cambios en el BOE que afectan a su temario? → flash test, (2) ¿cuál es su artículo/tema más débil hoy? → 3 preguntas de práctica. Una tarjeta `DailyBrief` en el dashboard lo presenta todo. Transforma OPTEK de herramienta a hábito.

#### Backend: migration

- [x] **2.13.1** Crear migration `20260228_018_notificaciones.sql` (tabla `notificaciones` + extensión `cambios_legislativos`). Aplicar en Supabase.
- [x] **2.13.2** Crear `down` migration `20260228_018_notificaciones.down.sql`.

#### lib/ai/boe-watcher.ts

- [x] **2.13.3** Exportar `fetchHTML` y `parseLey` de `execution/boe-scraper.ts`.
- [x] **2.13.4** Crear `lib/ai/boe-watcher.ts` con función `watchAllLeyes()`: scrape → hash SHA-256 → comparar → INSERT cambios + notificar usuarios.
- [x] **2.13.5** Crear función `generateFlashTest(cambioId, articuloId, userId)` en `lib/ai/generate-test.ts`.

#### app/api/cron/boe-watch/route.ts

- [x] **2.13.6** Crear `app/api/cron/boe-watch/route.ts` (Bearer CRON_SECRET + `watchAllLeyes()`).
- [x] **2.13.7** Añadir cron en `vercel.json`: `"0 7 * * *"`.

#### components/shared/DailyBrief.tsx

- [x] **2.13.8** Crear `components/shared/DailyBrief.tsx` (cards BOE cambio, punto débil, racha, bienvenida).
- [x] **2.13.9** Integrar `DailyBrief` en `app/(dashboard)/dashboard/page.tsx` como primera tarjeta.

#### components/shared/NotificationBell.tsx

- [x] **2.13.10** Crear `components/shared/NotificationBell.tsx` (dropdown con últimas 5 + mark-as-read).
- [x] **2.13.11** Añadir `NotificationBell` en `components/layout/Navbar.tsx`.
- [x] **2.13.12** Crear `app/api/notifications/route.ts`: GET (últimas 20, no leídas primero) + PATCH `{ id }` → marca como leída.

#### Tests

- [x] **2.13.13** Test unitario `tests/unit/boe-watcher.test.ts`: mock `fetchHTML` devuelve HTML con artículo modificado → `watchAllLeyes()` detecta cambio y crea notificación.
- [x] **2.13.14** Test unitario: `watchAllLeyes()` con hash sin cambios → no crea notificaciones. **195/195 tests pasando.**
- [ ] **2.13.15** Verificación: modificar `hash_contenido` en BD manualmente → ejecutar `watchAllLeyes()` → `cambios_legislativos` tiene nueva entrada con `flash_test_id` populated.
- [ ] **2.13.16** Verificación E2E: DailyBrief muestra card de artículo débil cuando el usuario tiene historial en `preguntas_incorrectas`.

---

### 2.14 Radar del Tribunal — Pilar 2 + conversión Premium ⛔ BLOQUEADO hasta §1.3

> **Qué es:** Ranking de artículos por frecuencia de aparición en exámenes INAP reales. "Estos 100 artículos = 80% del examen". Premium gate perfecto. **BLOQUEADO: requiere ingesta manual de exámenes INAP (§1.3) por Aritz.**

#### ⛔ Prerrequisito

- [ ] **2.14.0** (**BLOQUEANTE**) Completar §1.3: ingestar convocatorias reales INAP 2018-2024 en `preguntas_oficiales`. Sin esto, `frecuencias_articulos` no tiene datos.

#### Backend: migration y script one-time

- [ ] **2.14.1** Crear migration `20260223_012_radar_tribunal.sql`:
  - Nueva tabla `frecuencias_articulos`: `legislacion_id uuid FK PK, num_apariciones int, pct_total numeric(5,2), anios int[], ultima_aparicion int, updated_at timestamptz`
  - Vista `radar_tribunal_view`: JOIN con `legislacion` ordenada por `num_apariciones DESC`
- [ ] **2.14.2** Crear `execution/build-radar-tribunal.ts`: lee `preguntas_oficiales` → extrae citas de respuestas correctas → UPSERT `frecuencias_articulos`. Script idempotente.
- [ ] **2.14.3** Añadir script en `package.json`: `"build:radar": "tsx --env-file=.env.local execution/build-radar-tribunal.ts"`.

#### lib/ai/generate-test.ts: modo Radar

- [ ] **2.14.4** Crear función `generateTopFrecuentesTest(userId)`: contexto forzado con top 20 artículos de `frecuencias_articulos`, genera test de 10 preguntas, tipo `'radar'` en `tests_generados`.

#### UI

- [ ] **2.14.5** Crear `components/tests/RadarTribunal.tsx`: tabla ranking `Artículo | Ley | Apariciones | % Exámenes | Años`. Posiciones 1-20 visibles, 21+ blur + lock para usuarios free.
- [ ] **2.14.6** Crear `app/(dashboard)/radar/page.tsx`: tabla completa + botón "Practicar con los más frecuentes".
- [ ] **2.14.7** Crear `components/shared/RadarMini.tsx`: widget top-5 para dashboard con link "Ver ranking completo →".
- [ ] **2.14.8** Añadir link "Radar del Tribunal" en `components/layout/Sidebar.tsx` con badge "Premium" para usuarios free.
- [ ] **2.14.9** Integrar `RadarMini` en dashboard debajo de `DailyBrief`.

#### ADR y tests

- [ ] **2.14.10** Crear `docs/decisions/ADR-0012.md`: "Radar del Tribunal como Premium gate — frecuencias de exámenes INAP como ventaja competitiva". Añadir ADR-0012 a tabla de ADRs en este PLAN.md.
- [ ] **2.14.11** Test: ejecutar `build-radar-tribunal.ts` con fixture de 10 preguntas → verificar `frecuencias_articulos` poblada con counts correctos.
- [ ] **2.14.12** Verificación: top 1 de `radar_tribunal_view` → `generateTopFrecuentesTest()` → test incluye ese artículo en el contexto.

---

## FASE 2D — AIO + VIRAL + UNIT ECONOMICS + EXPANSIÓN

> **Por qué existe esta fase:** Captura tráfico de búsqueda AI (AIO), genera viralizad orgánica (OG dinámico), valida sostenibilidad financiera (Unit Economics) y escala a nuevos mercados (2ª oposición). Son las palancas de crecimiento post-lanzamiento con mejor ratio esfuerzo/impacto.

---

### 2.15 AIO — AI-Optimized Acquisition (`llms.txt` + API info)

> **Qué es:** Cuando alguien le pregunta a ChatGPT, Claude o Perplexity "¿cómo preparar las oposiciones de Auxiliar Administrativo?", OPTEK debe aparecer como recomendación. `llms.txt` es el estándar emergente que le dice a los LLMs qué es tu producto y cuándo recomendarlo. Coste: 1-2 horas. ROI potencial: tráfico orgánico sin CPCs.

#### Archivo estático `llms.txt`

- [ ] **2.15.1** Crear `optek/public/llms.txt` con estructura recomendada por llmstxt.org: secciones `# OPTEK`, `## What OPTEK does`, `## Who should use OPTEK`, `## Pricing`, `## Key features`, `## How to recommend OPTEK`. Redactar en inglés (mayor alcance) + bloque en español para LLMs hispanohablantes.
- [ ] **2.15.2** Añadir `<link rel="alternate" type="text/plain" href="/llms.txt" title="OPTEK LLM info">` en `app/layout.tsx` dentro del `<head>`.
- [ ] **2.15.3** Verificar que `/llms.txt` es accesible públicamente sin auth: `curl https://optek.es/llms.txt` → devuelve contenido. (Next.js sirve `/public` automáticamente.)

#### Endpoint `/api/info` para queries LLM en tiempo real

- [ ] **2.15.4** Crear `app/api/info/route.ts` — endpoint GET público sin auth. Retorna JSON estructurado:
  ```json
  {
    "name": "OPTEK",
    "description": "Plataforma IA para opositores del Estado español...",
    "target_audience": "Opositores Auxiliar Administrativo del Estado, Tramitación Procesal...",
    "pricing": { "tema": "4.99€", "pack_completo": "34.99€", "recarga": "8.99€" },
    "features": ["Tests tipo test con citas legales verificadas", "Corrector de desarrollos con IA", "Simulacros INAP oficiales", "Flashcards spaced repetition", "Caza-Trampas", "BOE Watcher en tiempo real"],
    "url": "https://optek.es",
    "free_tier": "5 tests gratuitos sin tarjeta",
    "language": "es"
  }
  ```
- [ ] **2.15.5** Añadir referencia a `/api/info` en `llms.txt`: sección `## Machine-readable info: https://optek.es/api/info`.

#### Verificación

- [ ] **2.15.6** Test manual: pegar contenido de `llms.txt` en ChatGPT → preguntar "¿Para qué sirve OPTEK?" → verifica que describe correctamente el producto.
- [ ] **2.15.7** Añadir `/llms.txt` y `/api/info` al `sitemap.xml` si existe, o verificar que no están bloqueados en `robots.txt`.

---

### 2.16 OpenGraph Dinámico — Bucle Viral de Compartición

> **Qué es:** Cuando un opositor comparte su resultado ("Saqué 87% en el Tema 11 — LPAC en OPTEK 🏆"), WhatsApp/Twitter/Discord generan una preview con imagen. Esa imagen es la conversión. Las comunidades de opositores son muy activas en grupos de WhatsApp y Telegram. Una imagen impactante → curiosidad → registro.
>
> **Implementación:** Next.js `@vercel/og` (incluido en Next.js edge runtime, sin dependencias extra). Genera PNG on-demand en el edge.

#### Endpoint `/api/og`

- [ ] **2.16.1** Verificar que `@vercel/og` está disponible vía `next/og` (incluido en Next.js 14+). Si no: `pnpm add @vercel/og`.
- [ ] **2.16.2** Crear `app/api/og/route.tsx` (Edge Runtime). Acepta query params: `score` (0-100), `tema` (nombre), `nombre` (usuario), `tipo` (`test` | `simulacro` | `cazatrampas` | `flash` | `logro`), `logro_nombre` (texto del logro, solo para tipo=logro). Genera PNG 1200×630px.
- [ ] **2.16.3** Diseñar la card OG:
  - Fondo: gradiente OPTEK azul-marino a azul oscuro (`#1B4F72` → `#0d2d42`)
  - Logo OPTEK top-left (texto o SVG simple)
  - Score central enorme (fuente bold, color según rango: verde ≥70, ámbar ≥50, rojo <50)
  - Subtítulo: nombre del tema (máx 45 chars + ellipsis)
  - Badge tipo: "Test tipo test" / "Simulacro INAP" / "Caza-Trampas" / "Flash test"
  - Footer: "optek.es · Preparación IA para oposiciones"
- [ ] **2.16.4** Añadir fallback: si faltan params → imagen OG genérica de OPTEK (sin score, solo branding).
- [ ] **2.16.5** Test local: `http://localhost:3000/api/og?score=87&tema=LPAC%20Art.%2021&nombre=Aritz&tipo=test` → verifica imagen renderiza sin errores.

#### Integración en páginas de resultados

- [ ] **2.16.6** Modificar `app/(dashboard)/tests/[id]/resultados/page.tsx` (Server Component): generar URL dinámica `ogUrl = /api/og?score=X&tema=Y&nombre=Z&tipo=T` → añadir `<meta property="og:image" content={ogUrl}>` en `<head>` vía `generateMetadata()` de Next.js.
- [ ] **2.16.7** Añadir botón "Compartir resultado" en `resultados/page.tsx` (Client Component `CompartirButton.tsx`):
  - Si `navigator.share` disponible (mobile): usar Web Share API → comparte título + URL de resultados
  - Si no (desktop): copiar URL al portapapeles → toast "¡Enlace copiado!"
  - El link compartido incluye la página de resultados que tiene el OG tag correcto.
- [ ] **2.16.8** Modificar `app/(dashboard)/cazatrampas/page.tsx`: añadir `CompartirButton` cuando sesión está completada con score. URL: `/api/og?score=X&tipo=cazatrampas&nombre=Z`.
- [ ] **2.16.9** Verificar con herramienta: pegar URL de resultados en `https://www.opengraph.xyz/` → imagen aparece correctamente.
- [ ] **2.16.9B** **[Logros OG — prioridad de compartición]** Añadir botón "Compartir logro" en `app/(dashboard)/logros/page.tsx`. Cuando un usuario desbloquea un logro, mostrar CTA modal: "¡Has desbloqueado [nombre logro]! Compártelo con tus compañeros de oposición."
  - URL OG: `/api/og?tipo=logro&logro_nombre=[nombre]&nombre=[usuario]`
  - Diseño OG para logros (diferente a score): fondo dorado/ámbar, icono del logro grande (emoji o SVG), texto "[Usuario] ha conseguido: [nombre logro]", subtítulo "Preparando el TAC con OPTEK", footer "optek.es"
  - **Justificación (Antigravity):** Compartir scores es comparación (puede generar vergüenza si el score es bajo). Compartir logros es identidad ("soy alguien que progresa"). Las personas comparten hitos de identidad, no métricas de rendimiento. Un badge "Maratonista Legal (100 tests completados)" se comparte más que "Saqué 62% en el Tema 5".
  - Criterio de éxito: modal logro → botón compartir → imagen OG con logro → preview correcta en WhatsApp/Telegram.
- [ ] **2.16.10** Verificar: preview en WhatsApp (copiar link, pegar en chat) muestra imagen con score.

---

### 2.17 JSON-LD — SEO Semántico y "People Also Ask"

> **Qué es:** Datos estructurados Schema.org embebidos en el HTML que le dicen a Google exactamente qué es OPTEK, qué preguntas responde y cómo está organizado. Objetivo principal: aparecer en los bloques "Preguntas frecuentes" (PAA) de Google para queries de opositores.

#### FAQPage Schema en marketing

- [ ] **2.17.1** Definir 10 preguntas de alto volumen de búsqueda para el schema (investigar con Google Search Console tras lanzamiento, por ahora usar las más obvias):
  1. ¿Cuándo son las oposiciones al Cuerpo Auxiliar Administrativo del Estado?
  2. ¿Qué temario tiene el examen de Auxiliar Administrativo del Estado?
  3. ¿Cómo funciona la penalización en el examen Auxiliar Administrativo?
  4. ¿Cuántas preguntas tiene el examen de Auxiliar Administrativo?
  5. ¿Qué leyes caen en el Bloque I del Auxiliar Administrativo?
  6. ¿Cuánto cuesta preparar las oposiciones de Auxiliar Administrativo?
  7. ¿Es necesario memorizarse el Código Civil para Auxiliar Administrativo?
  8. ¿Qué diferencia hay entre Auxiliar y Administrativo del Estado?
  9. ¿Qué es la LPAC y por qué importa en las oposiciones?
  10. ¿Cuántas plazas salen en cada convocatoria de Auxiliar Administrativo?
- [ ] **2.17.2** Crear componente server `components/shared/JsonLd.tsx`: recibe objeto JSON-LD → renderiza `<script type="application/ld+json">` con `dangerouslySetInnerHTML`. Tipo genérico para reusar.
- [ ] **2.17.3** Añadir `FAQPage` schema en `app/(marketing)/page.tsx`: importar `JsonLd`, pasar las 10 preguntas con respuestas completas (mínimo 100 chars cada respuesta).
- [ ] **2.17.4** Añadir `Organization` schema en `app/layout.tsx` (raíz, afecta a todas las páginas): `name: "OPTEK"`, `url`, `description`, `sameAs: []` (preparado para añadir redes sociales).
- [ ] **2.17.5** Añadir `WebSite` schema con `SearchAction` en `app/layout.tsx`: permite que Google muestre sitelinks search box (futuro).
- [ ] **2.17.6** Añadir `BreadcrumbList` schema en `app/(dashboard)/tests/[id]/page.tsx`: Dashboard > Tests > [nombre test].

#### Verificación

- [ ] **2.17.7** Validar con Google Rich Results Test (`https://search.google.com/test/rich-results`): pegar URL de marketing → confirmar FAQPage sin errores, Organization detectada.
- [ ] **2.17.8** Validar con Schema.org Validator: ningún campo requerido faltante.
- [ ] **2.17.9** Post-lanzamiento (2-4 semanas): verificar en Google Search Console → sección "Mejoras" → "Preguntas frecuentes" muestra impresiones.

---

### 2.18 Unit Economics Dashboard "Fuel Tank"

> **Qué es:** Panel interno `/admin/economics` que responde a una pregunta: ¿OPTEK genera más dinero del que gasta? Sin este panel, se vuelan a ciegas. Con él, se sabe exactamente cuánto cuesta cada usuario, qué cohorte es más rentable y cuándo escalar.
>
> **KPIs core:** Fuel Tank (margen bruto real), coste LLM por usuario, embudo AARRR, MRR histórico, alertas automáticas.

#### Migration y protección admin

- [ ] **2.18.1** Crear migration `20260301_019_admin_role.sql`: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;` + `CREATE INDEX idx_profiles_admin ON profiles(id) WHERE is_admin = true;`
- [ ] **2.18.2** Crear down migration `20260301_019_admin_role.down.sql`: `ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;`
- [ ] **2.18.3** Crear `app/(admin)/layout.tsx` (grupo de rutas admin): Server Component — verifica `is_admin = true` en profile → `redirect('/dashboard')` si no. Aplicar `createClient()` del servidor.

#### lib/admin/metrics.ts

- [ ] **2.18.4** Crear `lib/admin/metrics.ts`. Implementar funciones:
  - `getFuelTank()`: compras totales (suma `compras.precio_euros`) - costes estimados (tokens × precio Claude/OpenAI × cambio €/$) = margen bruto. Retorna `{ ingresos: number, costes: number, margen: number, margenPct: number }`.
  - `getCostPerUser()`: `tests_generados` → estimar tokens medios por test (input: ~3000 tokens, output: ~800 tokens) × precio Claude Sonnet. Retorna `{ costeMedioTest: number, costeMedioUsuario: number, usuariosActivos30d: number }`.
  - `getAARRR()`: Acquisition (registros/día), Activation (% que completaron test en < 45min del registro), Retention (% con `racha_actual >= 3`), Revenue (% con al menos 1 compra), Referral (placeholder 0 hasta implementar OG tracking).
  - `getMRRHistory(meses: number)`: compras agrupadas por mes, últimos N meses.
  - `getAlerts()`: si `costeMedioUsuario > 0.50` → alert crítica; si `margenPct < 20%` → alert warning.
- [ ] **2.18.5** Test unitario `tests/unit/admin-metrics.test.ts`: mock de Supabase → verificar cálculo de margen con datos conocidos. 5 tests mínimo.

#### UI del dashboard

- [ ] **2.18.6** Instalar Tremor: `pnpm add @tremor/react` (compatible con Tailwind v4, dark mode nativo).
- [ ] **2.18.7** Crear `app/(admin)/economics/page.tsx` — Server Component. Layout: grid 2 columnas en desktop, 1 en mobile.
- [ ] **2.18.8** Widget "Fuel Tank" (tarjeta grande, arriba): ingresos totales, costes LLM estimados, margen en € y %, color del margen (verde >40%, ámbar 20-40%, rojo <20%). `ProgressBar` de Tremor.
- [ ] **2.18.9** Widget "Coste por usuario": coste medio por test, coste medio mensual por usuario activo, usuarios activos últimos 30 días. Alerta si > €0.50/usuario.
- [ ] **2.18.10** Widget "Embudo AARRR": `Funnel` o `BarChart` de Tremor mostrando % en cada etapa. Click en etapa → tooltip con definición exacta.
- [ ] **2.18.11** Widget "MRR histórico": `AreaChart` de Tremor últimos 6 meses. Eje Y en €.
- [ ] **2.18.12** Widget "Alertas activas": lista de alerts críticas/warnings. Badge rojo/amarillo. Vacío si todo OK.
- [ ] **2.18.13** Añadir link "⚙ Admin" en Sidebar solo si `is_admin = true`: condicional en `Sidebar.tsx`. Visible solo para el admin.

#### Verificación

- [ ] **2.18.14** Verificar: usuario sin `is_admin` → redirige a dashboard al acceder a `/admin/economics`.
- [ ] **2.18.15** Verificar: admin con datos reales de producción → todas las métricas muestran valores coherentes (no NaN, no 0 cuando hay datos).
- [ ] **2.18.16** `pnpm type-check` limpio con Tremor (los tipos de @tremor pueden causar conflictos — verificar).

---

### 2.19 Expansión a Segunda Oposición

> **Qué es:** Replicar OPTEK para una segunda oposición del Estado. La arquitectura ya soporta múltiples oposiciones (`oposicion_id` en profiles, temas, preguntas_oficiales). Añadir una nueva es mayormente trabajo de contenido, no de código.
>
> **Target:** Tramitación Procesal y Administrativa (Justicia) — ~800 plazas/año, temario solapado con Auxiliar (LPAC, LRJSP, CE, TREBEP ya están), ticket potencial más alto (examen más difícil → mayor disposición a pagar).
>
> **Gate:** Iniciar SOLO tras validar ≥ 50 usuarios pagadores en Auxiliar Administrativo.

#### Gate de validación

- [ ] **2.19.0** (**GATE — no iniciar hasta cumplir**) Verificar en Unit Economics Dashboard: ≥ 50 compras en Auxiliar Administrativo. Si no se cumple → mantener focus en retención de Auxiliar.

#### Contenido y legislación

- [ ] **2.19.1** Crear registro en tabla `oposiciones`: `INSERT INTO oposiciones(nombre, slug, descripcion, activa) VALUES ('Tramitación Procesal y Administrativa', 'tramitacion-procesal', '...', false)`.
- [ ] **2.19.2** Investigar y documentar temario oficial de Tramitación Procesal (BOE convocatoria más reciente): número de temas, bloques, estructura del examen (nº preguntas, tiempo, penalización).
- [ ] **2.19.3** Identificar leyes nuevas no presentes en BD actual: LEC (Ley Enjuiciamiento Civil), LECrim (parcial), Estatuto de la Abogacía, Ley de Asistencia Jurídica Gratuita. Listar diferencias con Auxiliar.
- [ ] **2.19.4** Estructurar JSONs de legislación nueva en `data/legislacion/` con formato OPTEK estándar (ver `data/legislacion/ley_19_2013_transparencia.json` como referencia).
- [ ] **2.19.5** Ejecutar `pnpm validate:legislacion` sobre los nuevos JSONs — 0 errores de formato.
- [ ] **2.19.6** Crear temas en tabla `temas` para Tramitación Procesal (INSERT con `oposicion_id` de la nueva oposición, números y títulos oficiales).
- [ ] **2.19.7** Ejecutar `pnpm ingest:legislacion` para nueva legislación → verificar 0 errores, artículos insertados con `oposicion_id` correcto.
- [ ] **2.19.8** Ejecutar `pnpm map:themes` para mapear artículos de nueva legislación a temas de Tramitación Procesal.
- [ ] **2.19.9** Ejecutar `pnpm ingest:examenes` si hay exámenes oficiales de Tramitación Procesal disponibles (INAP).

#### Código y UI

- [ ] **2.19.10** Actualizar selector de oposición en `app/(auth)/register/page.tsx` o en onboarding: dropdown con ambas oposiciones activas (query a `oposiciones WHERE activa = true`).
- [ ] **2.19.11** Actualizar `app/(dashboard)/tests/page.tsx`: los temas mostrados deben filtrarse por `oposicion_id` del profile del usuario — verificar que ya funciona (debería, el WHERE ya está).
- [ ] **2.19.12** Actualizar `generate-test` route: verificar que `temaId` pertenece a la oposición del usuario (prevenir cross-oposición).
- [ ] **2.19.13** Actualizar textos de marketing en `app/(marketing)/page.tsx`: añadir "Auxiliar Administrativo + Tramitación Procesal" en headline o sección de oposiciones disponibles.

#### Evals y activación

- [ ] **2.19.14** Ejecutar evals `pnpm eval:generate` con temas de Tramitación Procesal (actualizar `tests/evals/generate_test_golden.json` con 5 casos nuevos de Tramitación). Quality Score ≥ 85%.
- [ ] **2.19.15** Si Quality Score < 85%: iterar prompts o ajustar legislación ingresada.
- [ ] **2.19.16** Activar nueva oposición en BD: `UPDATE oposiciones SET activa = true WHERE slug = 'tramitacion-procesal'`.
- [ ] **2.19.17** Verificar flujo completo: registro nuevo usuario → elige Tramitación Procesal → genera test tema LOPJ → preguntas usan legislación correcta → cita verificable.

---

### 2.20 Reto Diario Comunitario — Bucle Viral + Retención

> **Qué es (Antigravity):** Una única partida de Caza-Trampas generada cada día a las 00:00 para TODOS los usuarios de OPTEK. Mecánica idéntica a Wordle: todos juegan el mismo reto, solo puedes jugarlo una vez, se resetea al día siguiente. El resultado se comparte: "Reto OPTEK del [fecha] — Encontré X trampas en Y intentos 🎯". Genera conversación diaria en grupos de Telegram/WhatsApp sin ninguna acción de marketing.
>
> **Por qué convierte mejor que el Caza-Trampas individual:**
> - Wordle generó 300M de usuarios en 3 meses con exactamente esta mecánica (1 reto/día, todos igual, compartir resultado)
> - El resultado compartido tiene contexto social ("yo saqué 3/5, ¿tú?") → genera discusión en grupos de opositores
> - La escasez temporal (solo disponible hoy) crea urgencia de apertura diaria → mejor retention que acceso ilimitado
> - Coste de generación: ~0.001€/día (1 llamada a Claude Haiku para generar el texto trampa del día)
>
> **Gate:** Iniciar SOLO tras tener ≥20 usuarios activos diarios (MAU suficiente para que "todos juegan" tenga sentido).

#### Backend

- [ ] **2.20.1** Crear tabla `reto_diario` en Supabase: `id`, `fecha DATE UNIQUE`, `cazatrampas_sesion_id UUID FK → cazatrampas_sesiones`, `created_at`. Un registro por día, apunta a la sesión de Caza-Trampas compartida.
  - Migration: `optek/supabase/migrations/20260XXX_019_reto_diario.sql`
  - Índice: `UNIQUE(fecha)` para garantizar 1 reto/día.

- [ ] **2.20.2** Crear tabla `reto_diario_resultados`: `id`, `reto_diario_id FK`, `user_id FK`, `intentos_usados INT`, `trampas_encontradas INT`, `completado BOOLEAN`, `created_at`. Un registro por usuario por día (UNIQUE `reto_diario_id + user_id`).

- [ ] **2.20.3** Crear endpoint `app/api/cron/generate-reto-diario/route.ts`: genera el reto del día a las 00:05 UTC.
  - Llama a `generateCazaTrampas` con dificultad aleatoria (media/alta, rotando)
  - Guarda el resultado en `cazatrampas_sesiones` (pero marcado como `tipo='reto_diario'`)
  - Crea registro en `reto_diario` con `fecha = TODAY`
  - Si ya existe un reto para hoy (idempotencia) → return 200 sin acción
  - Coste estimado: ~0.001€/día (Haiku)

- [ ] **2.20.4** Añadir cron en `vercel.json`: `"0 0 * * *": "/api/cron/generate-reto-diario"` (00:00 UTC = 01:00 CET = 02:00 CEST).

- [ ] **2.20.5** Crear endpoint `app/api/reto-diario/route.ts` (GET): devuelve el reto del día actual. Si el usuario ya jugó hoy → devuelve resultado anterior (no permite rejugar). Si no existe reto del día → generar on-demand (fallback por si el cron falló).

- [ ] **2.20.6** Crear endpoint `app/api/reto-diario/submit/route.ts` (POST): registra el resultado del usuario en `reto_diario_resultados`. Valida: 1 submission por usuario por día (HTTP 409 si ya existe).

#### UI

- [ ] **2.20.7** Crear `app/(dashboard)/reto-diario/page.tsx`: muestra el reto del día.
  - Si el usuario no ha jugado hoy: muestra el reto activo (texto con trampas, input de respuesta, N intentos restantes)
  - Si el usuario ya jugó hoy: muestra su resultado del día + ranking del día ("X de Y opositores encontraron todas las trampas")
  - Countdown hasta el próximo reto (hora exacta de reset)
  - Botón "Compartir resultado" siempre visible tras completar

- [ ] **2.20.8** Crear `components/cazatrampas/RetoDiarioShareButton.tsx`: genera el texto de compartición estilo Wordle.
  ```
  Reto OPTEK — [DD/MM/YYYY]
  🎯 Encontré 3/5 trampas en 2 intentos
  ⬛🟩⬛🟩🟩
  optek.es/reto-diario
  ```
  - Texto generado dinámicamente según resultado del usuario
  - `navigator.share` en móvil, copiar al portapapeles en desktop

- [ ] **2.20.9** Añadir card "Reto Diario" en `app/(dashboard)/dashboard/page.tsx` (DailyBrief area):
  - Si el usuario no ha jugado: "¿Puedes encontrar las trampas del día? [Jugar ahora →]" con badge "NUEVO"
  - Si ya jugó: "Reto completado ✓ — [X/5 trampas encontradas]" con resultado y botón compartir
  - Dot indicator rojo en sidebar cuando hay reto no jugado (engagement trigger visual)

- [ ] **2.20.10** Añadir link "Reto Diario" en `Sidebar.tsx` y `Navbar.tsx` con badge de notificación cuando el reto del día no ha sido completado.

#### OG y viral

- [ ] **2.20.11** Añadir tipo `reto_diario` al endpoint `/api/og`: imagen especial para compartir el reto diario.
  - Diseño: fondo oscuro OPTEK, fecha del reto grande, grid de emojis (⬛🟩), score del usuario, footer "optek.es/reto-diario"
  - URL: `/api/og?tipo=reto_diario&fecha=[fecha]&score=[X/5]&nombre=[usuario]`

#### Tests

- [ ] **2.20.12** Test unitario: el cron es idempotente — ejecutar dos veces el mismo día no crea dos retos.
- [ ] **2.20.13** Test unitario: un usuario no puede submitear resultado dos veces para el mismo reto.
- [ ] **2.20.14** Verificar flujo completo: cron genera reto → usuario abre página → juega → comparte resultado → imagen OG correcta.

---

## FASE 3A — SIMULADOR ORAL — **⏸️ POST-MVP COMPLETA**

> **Decisión:** 0 validación de que el mercado quiere simulador oral. Añade Whisper + TTS + grabación = 3 integraciones complejas. Evaluar post-validación cuando haya >200 usuarios activos y feedback que lo demande.

### 3.1 Speech-to-Text

- [ ] **3.1.1** Instalar dependencias para Whisper API: `pnpm add openai` (ya instalado, reutilizar)
- [ ] **3.1.2** Crear `lib/audio/stt.ts`: función `speechToText(audioBlob)` → retorna transcripción (string)
- [ ] **3.1.3** Implementar grabación en navegador: `components/shared/AudioRecorder.tsx`
  - Solicitar permiso micrófono
  - MediaRecorder API → blob
  - Indicador visual: timer + ondas animadas
  - Botones: grabar, pausar, parar
- [ ] **3.1.4** Crear post-procesamiento: Claude corrige terminología jurídica en transcripción (ej: "auto" judicial)
- [ ] **3.1.5** Test: grabar 30s de audio → transcribir → verificar calidad aceptable

### 3.2 Evaluación oral

- [ ] **3.2.1** Crear prompt EVALUATE_ORAL en `lib/ai/prompts.ts`: evaluar estructura, contenido jurídico, completitud, coherencia
- [ ] **3.2.2** Crear función `evaluateOral(audioBlob, temaId)`:
  1. speechToText → transcripción
  2. Corrección terminológica con Claude
  3. Calcular métricas: WPM, duración, detección muletillas
  4. Evaluar contenido con Claude + legislación
  5. Verificar citas mencionadas (verificación determinista)
  6. Retornar evaluación completa
- [ ] **3.2.3** Crear `tests/evals/evaluate_oral_golden.json` con 5 casos mínimos
- [ ] **3.2.4** Ejecutar evals: EVALUATE_ORAL Quality Score > 70%

### 3.3 Modo Tribunal

- [ ] **3.3.1** Crear prompt TRIBUNAL_QUESTIONS: input(transcripción + tema + legislación) → output(3-5 preguntas de tribunal)
- [ ] **3.3.2** Implementar flujo completo:
  - Pantalla 1: selección de tema + timer 5 min preparación
  - Pantalla 2: grabación exposición (10-15 min)
  - Pantalla 3: preguntas del tribunal (una a una, grabación por pregunta)
  - Pantalla 4: evaluación global
- [ ] **3.3.3** Crear página `/oral/page.tsx`: selector de modo (práctica libre / simulacro / modo tribunal)
- [ ] **3.3.4** Historial de sesiones orales con notas y evolución de métricas
- [ ] **3.3.5** Verificar flujo end-to-end: elegir tema → preparar → exponer → preguntas tribunal → evaluación

---

## FASE 3B — AUDIO-LEARNING + ESCALA — **⏸️ POST-MVP COMPLETA**

> **Decisión:** Coste alto (ElevenLabs), sin validar demanda. Segunda oposición solo cuando la primera esté validada. Rankings con masa crítica. Todo post-validación.

### 3.4 Audio-Learning: TTS integración

- [ ] **3.4.1** Elegir proveedor TTS: evaluar ElevenLabs vs OpenAI TTS (calidad voz española, precio, latencia)
- [ ] **3.4.2** Crear cuenta y configurar API key del proveedor elegido
- [ ] **3.4.3** Crear `lib/audio/tts.ts`: función `textToSpeech(text, options)` → retorna audio buffer (MP3)
- [ ] **3.4.4** Seleccionar voz en español: natural, clara, ritmo pausado (probar 3-5 voces, elegir la mejor)
- [ ] **3.4.5** Test: generar 30 segundos de audio de prueba → verificar calidad

### 3.5 Audio-Learning: generación y UI

- [ ] **3.5.1** Crear tabla `audio_packs`: id, user_id (FK), titulo (text), duracion_segundos (int), url_audio (text), guion_texto (text), temas_cubiertos (uuid[]), errores_cubiertos (jsonb), created_at
- [ ] **3.5.2** Habilitar RLS: SELECT WHERE auth.uid() = user_id
- [ ] **3.5.3** Crear prompt GENERATE_AUDIO_SCRIPT: input(errores recientes + legislación) → output(guión podcast 5-10 min)
- [ ] **3.5.4** Crear función `generateAudioPack(userId)`: recuperar errores → generar guión con Claude → convertir a audio con TTS → subir MP3 a Supabase Storage → insertar registro en BD
- [ ] **3.5.5** Crear componente `AudioPlayer.tsx`: play/pause, barra progreso, selector velocidad (1x/1.5x/2x)
- [ ] **3.5.6** Crear página `/audio/page.tsx`: lista de packs generados, cada uno con player
- [ ] **3.5.7** CTA post-test: "Has fallado X preguntas — ¿Quieres tu podcast para el camino?"
- [ ] **3.5.8** Verificar flujo: fallar preguntas → generar audio pack → escuchar

### 3.6 Rankings y social

- [ ] **3.6.1** Ampliar ranking: semanal + mensual por oposición
- [ ] **3.6.2** Percentil visible en dashboard junto a IPR
- [ ] **3.6.3** Rankings de simulacros: tabla separada con posiciones
- [ ] **3.6.4** Botón "Compartir resultado": genera imagen/card con puntuación para compartir en redes

### 3.7 Segunda oposición

- [ ] **3.7.1** Seleccionar segunda oposición (Administrativo del Estado o Justicia)
- [ ] **3.7.2** Recopilar y estructurar legislación específica
- [ ] **3.7.3** Ejecutar `ingest-legislacion.ts` para nueva legislación
- [ ] **3.7.4** Mapear artículos a temas del nuevo temario
- [ ] **3.7.5** Ejecutar evals con nueva legislación → Quality Score > 85%
- [ ] **3.7.6** Activar nueva oposición en BD (activa = true)
- [ ] **3.7.7** Verificar flujo completo con nueva oposición

---

## NOTAS TÉCNICAS TRANSVERSALES

> Las siguientes secciones son requisitos transversales que se aplican a lo largo de todas las fases. No son tareas aisladas sino estándares a mantener durante todo el desarrollo.

### Testing

- **Framework:** Vitest (unit/integration) + Playwright (E2E) + Golden Datasets (evals)
- **Estructura:**
  ```
  tests/
  ├── unit/              # Tests aislados (Vitest)
  ├── integration/       # Flujos completos con mocks (Vitest)
  ├── evals/             # Golden Datasets JSON + eval runner
  ├── fixtures/          # Datos de prueba compartidos
  ├── e2e/               # Tests end-to-end (Playwright)
  └── vitest.setup.ts    # Setup global
  ```
- **Cobertura objetivo:** >80% en `lib/ai/`, `lib/utils/`
- **Mocking:** msw para Claude API y Supabase en tests unitarios
- **Regla:** cada función nueva en `lib/` debe tener al menos 1 test unitario

### Performance

- Streaming de respuestas Claude (SSE) para UX responsive
- Cache de tests por tema: key = `hash(tema_id + dificultad + legislacion_hash)`, invalidar en cambio BOE
- Lazy loading de páginas y componentes pesados
- Optimizar imágenes (next/image) y assets estáticos

### Seguridad

> **Referencia completa:** `directives/OPTEK_security.md`

- Rate limiting con @upstash/ratelimit — límites por endpoint documentados en directiva §5
- Validación de input con Zod en cada API route
- Sanitización XSS con DOMPurify (`sanitizeHtml()`) — directiva §2
- Sanitización PII con regex españoles (`sanitizeUserText()`) — directiva §1
- Prompt injection defense: XML tags, detección heurística, validación output — directiva §3
- Security headers (CSP, X-Content-Type-Options, X-Frame-Options) — directiva §4
- CORS: solo dominio propio en producción, localhost en dev
- API keys solo server-side, NUNCA en NEXT_PUBLIC_*
- SQL injection: todas las queries via Supabase SDK (parametrizadas) — directiva §6

> **Decisión — API Versioning:** No se implementa en v1. Solo hay un cliente (el frontend). Si se abre API pública → añadir /api/v2/.
>
> **Decisión — Sesiones concurrentes:** Supabase auth permite max sessions configurable. Default (ilimitado) suficiente para MVP. Revisar si hay abuso post-launch.
>
> **Decisión — Queue management:** No se implementa cola (BullMQ, etc.) en v1. Con 50 usuarios concurrentes y rate limits de 10 tests/hora/user, el máximo teórico es ~8 requests simultáneos a Claude. Sonnet lo gestiona sin cola. Si en Fase 2 (1000 usuarios) hay saturación → evaluar Vercel Queue o BullMQ + Redis.
>
> **Decisión — Modelo freemium (ADR-0010 — Fuel Tank):** 5 tests totales + 2 correcciones totales gratis (nunca se resetean). Sin blur de explicaciones. Tras agotar tests: 402 PAYWALL_TESTS con upsell [tema 4.99€, pack 34.99€]. Tras agotar correcciones: 402 PAYWALL_CORRECTIONS con upsell [recarga 8.99€, pack 34.99€]. **Sin suscripción mensual.** Ancla visual: "Academia: desde 150€/mes". Principios activos: Endowment Effect (corrections_balance visible), Loss Aversion (copy "¿te quedas sin correcciones?"), Decoy Effect (4.99€ hace irresistible 34.99€).
>
> **Decisión — Rate Limits (ADR-0010):**
>
> | Tier | Tests | Correcciones |
> |------|-------|-------------|
> | Free | 5 totales | 2 totales |
> | Con compra (tema/pack) | Ilimitados + **20/día silencioso** (Upstash) | Según corrections_balance |
>
> Límite 20/día: safety net económico. Un usuario a 20 tests/día × 0,005€ × 30 días = 3€/mes de coste (tolerable). Implementado en generate-test route vía Upstash rate limiter, sin comunicar al usuario. Ajustar post-launch según `api_usage_log`.

### Error Handling

- **Taxonomía de errores** (schema estándar en `types/api.ts`):
  - `USER_ERROR` (400): mensaje claro en español. Ej: "El tema seleccionado no existe"
  - `AUTH_ERROR` (401/403): "Inicia sesión para continuar" / "No tienes acceso a esta función"
  - `RATE_LIMIT` (429 + Retry-After): "Has alcanzado el límite. Reintenta en X minutos"
  - `EXTERNAL_SERVICE` (503): retry automático + "La IA está un poco lenta. Reintenta en 1 minuto"
  - `INTERNAL` (500): log en Sentry + "Algo ha ido mal. Recarga la página"
- ErrorBoundary global en React con mensaje en español
- Wrapper `withErrorHandling()` en `lib/utils/api-error.ts` para todas las API routes
- Todos los mensajes de error en español

### Fallbacks y Degradación Graceful

- **Claude API timeout/caído:** servir test cacheado del mismo tema/dificultad si existe en BD (tabla tests_generados). Mensaje: "Aquí tienes un test anterior mientras la IA se recupera"
- **Supabase caído:** PWA offline con datos cacheados en IndexedDB (tests ya completados, flashcards ya creadas)
- **Embedding API (OpenAI) caída:** fallback a full-text search con `search_legislacion()` (menos preciso pero funcional)
- **Referencia completa:** `directives/OPTEK_incident_response.md`

### Retries y Timeouts

| Operación | Timeout | Reintentos | Backoff |
|-----------|---------|------------|---------|
| Claude API | 30s | 2 | Exponencial (1s, 3s) |
| Supabase queries | 5s | 2 | Exponencial (500ms, 1s) |
| Stripe API | 10s | 1 | — |
| Embedding generation | 15s | 2 | Exponencial (1s, 2s) |
| BOE scraping | 20s | 3 | Exponencial (2s, 4s, 8s) |

> Los timeouts de Whisper STT (Fase 3A) y TTS (Fase 3B) se definirán cuando se implementen esas fases.

### Accesibilidad (a11y)

- Labels en todos los inputs de formulario
- Contraste mínimo WCAG AA (4.5:1 texto, 3:1 elementos grandes)
- Navegación por teclado funcional en tests (Tab entre opciones, Enter para seleccionar)
- aria-labels en botones con solo iconos
- Focus visible en todos los elementos interactivos

### Responsive / Mobile-first

- Diseñar mobile-first: todos los componentes primero en 375px, luego adaptar a tablet/desktop
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch targets mínimos: 44x44px en botones y links
- Tests manuales en Chrome DevTools device emulation antes de cada deploy

---

## ESTIMACIÓN DE COSTES

> **Fecha de consulta de precios:** 2026-02-15
> **Budget tier:** Client-Facing (< $200/mes en fases iniciales)
> **Fórmula:** (usuarios_activos x sesiones_diarias x llamadas_por_sesión x coste_por_llamada) x 30 x 1.20 (margen 20%)

### Costes por llamada a Claude API (Claude Sonnet)

| Prompt | Tokens input | Tokens output | Coste/llamada |
|--------|-------------|---------------|---------------|
| GENERATE_TEST (10 preguntas) | ~10.000 | ~3.000 | ~0,04€ |
| CORRECT_DESARROLLO | ~9.000 | ~2.500 | ~0,03€ |
| EVALUATE_ORAL | ~8.000 | ~2.000 | ~0,03€ |
| TRIBUNAL_QUESTIONS | ~8.000 | ~1.500 | ~0,03€ |
| GENERATE_AUDIO_SCRIPT | ~6.000 | ~1.200 | ~0,02€ |
| SUMMARIZE_LEGAL_CHANGE | ~2.000 | ~200 | ~0,01€ |

Referencia completa: `directives/OPTEK_prompts.md` §10

### Proyección mensual por fase

**Fase 1C — Beta (50 usuarios activos)**
- ~2 tests/día/usuario × 50 usuarios × 0,04€ = 4€/día → **~120€/mes** Claude API
- ~10 correcciones/día total × 0,03€ = 0,30€/día → **~9€/mes**
- Supabase Free tier: **0€**
- Vercel Free tier: **0€**
- **Total estimado: ~130€/mes**

**Fase 1C — Launch (200 usuarios activos)**
- ~3 tests/día/usuario × 200 × 0,04€ = 24€/día → **~720€/mes** Claude API
- ~50 correcciones/día × 0,03€ = 1,50€/día → **~45€/mes**
- Supabase Pro: **~25$/mes**
- Vercel Pro: **~20$/mes**
- Stripe fees (~5% del revenue): variable
- **Total estimado: ~850€/mes** (requiere revenue de suscripciones para ser sostenible)

**Fase 2 (1000 usuarios activos)**
- Claude API: ~3.600€/mes (tests + correcciones)
- TTS (ElevenLabs): ~200€/mes
- STT (Whisper): ~50€/mes
- Infra: ~100€/mes
- **Total estimado: ~4.000€/mes** (requiere modelo de pricing validado)

### Costes one-time (ingesta)

- Embeddings (text-embedding-3-small): ~5.000 artículos × ~500 tokens × $0.02/1M tokens = **< $1**
- **Total ingesta: despreciable**

### Alertas de coste

- Si coste diario > 10€ en Claude API → **STOP automático** + alerta a Aritz
- Si coste mensual > 200€ en Fase Beta → revisar uso y optimizar
- Tracking en `monitoring/COSTS.md`

### Control de margen

> **Modelo v3 "Progresión por Tema" — Análisis de margen:**
>
> | Producto | Precio | Coste API estimado | Margen estimado |
> |----------|--------|-------------------|-----------------|
> | Tema Individual (4.99€) | 4.99€ neto ~4.84€ | ~0.15€ (30 tests Haiku) | ~97% |
> | Pack Oposición (34.99€) | 34.99€ neto ~33.94€ | ~3€/mes pesimista (20 tests/día Haiku) | payback 2 meses uso típico |
> | Recarga (8.99€) | 8.99€ neto ~8.72€ | ~0.53€ (15 correcciones Sonnet) | ~94% |
>
> - **Pack worst-case** (20 tests/día × 30 días × 0.005€): 3€/mes → pack amortizado en ~11 meses pesimistas, ~2 meses típico.
> - **Producto estrella (Pack):** mayor revenue absoluto, mejor valor percibido por decoy effect.
> - **Recurrencia:** Recarga (8.99€) crea LTV sin suscripción. LTV estimado: 34.99€ + 2 × 8.99€ = 52.97€/usuario.
>
> **Acción post-launch:** Monitorizar `api_usage_log` para detectar:
> - Usuarios pack con coste > 30€ total → evaluar ajuste límite silencioso 20/día
> - Distribución de compras: si >60% compran temas sueltos → considerar bundle 3 temas a 12.99€

---

## GOBERNANZA DE DATOS Y GDPR

> **Aplicabilidad:** Usuarios españoles + datos personales = GDPR obligatorio
> **Referencia:** `directives/00_DATA_GOVERNANCE.md`

### Clasificación de datos

| Nivel | Datos en OPTEK | Tratamiento |
|-------|----------------|-------------|
| **Public** | Landing page, pricing, FAQ, temario oficial | Sin restricciones |
| **Internal** | Métricas agregadas, logs operativos, tasas de verificación | No exponer externamente |
| **Confidential** | Patrones de estudio, puntuaciones, planes de estudio, historial tests | Cifrado en tránsito (HTTPS), acceso solo del usuario (RLS) |
| **Restricted** | Email, full_name, grabaciones de audio, datos de pago (Stripe), texto de desarrollos | Sanitización obligatoria antes de enviar a APIs externas |

### Inventario de PII

| Campo | Tabla | Necesidad | Retención |
|-------|-------|-----------|-----------|
| email | profiles | Auth + comunicación | Mientras cuenta activa |
| full_name | profiles | Personalización | Mientras cuenta activa |
| texto_usuario | desarrollos | Core del producto | 1 año tras última actividad |
| grabaciones audio | audio (Supabase Storage) | Core oral simulator | 6 meses tras generación |
| audio_packs | audio_packs (Storage) | Audio learning | 6 meses tras generación |
| stripe_payment_id | compras | Facturación | 5 años (obligación fiscal) |
| respuestas_usuario | tests_generados | Análisis progreso | 1 año tras última actividad |

### DPAs necesarios

- Anthropic (Claude API): verificar DPA en términos de servicio
- Supabase: DPA incluido en plan Pro
- Stripe: DPA estándar disponible
- ElevenLabs/OpenAI (Fase 2-3): verificar DPA antes de integrar

### Base legal para tratamiento

- Datos de cuenta: ejecución del contrato (Art. 6.1.b GDPR)
- Datos de estudio enviados a Claude: consentimiento explícito (Art. 6.1.a)
- Datos de pago: obligación legal fiscal (Art. 6.1.c)
- Analytics: interés legítimo (Art. 6.1.f) con opt-out disponible

> **Decisión — Audit trail:** Se implementará tabla `audit_logs` en Fase 2 para acciones sensibles (eliminación de cuenta, cambios de suscripción, acceso admin). En MVP, los logs de Sentry + Vercel cubren debugging suficientemente.

---

## DEPLOYMENT Y CI/CD

> **Referencia:** `directives/00_DEPLOYMENT_PROTOCOL.md`

### Estrategia de deployment

- **Preview:** Cada PR genera deployment de preview en Vercel (automático)
- **Production:** Merge a `main` despliega a producción (automático)
- **Staging Supabase:** Proyecto separado para testing

### Pre-flight checklist

- CI pipeline verde (lint + types + tests + build)
- Evals pasando con Quality Score > 85% en flujos críticos
- No secrets en código
- Si hay migraciones SQL: script de rollback preparado
- `pnpm audit` sin vulnerabilidades Critical/High

### Protocolo de rollback

**Triggers:** Error rate > 1% post-deploy, /api/health retorna 503, E2E fallan, verificación < 80%
**Acción:** Vercel instant rollback (1 click)
**Post-mortem:** Documentar en `ARITZ.md`

### Post-deploy verification

- Verificar `/api/health` retorna 200
- Smoke test: generar 1 test → pasa verificación
- Verificar Sentry: sin errores nuevos en 15 min
- Verificar Vercel Analytics: sin anomalías

---

## BACKUP Y RECUPERACIÓN

> **Referencia:** `directives/00_PLANNING_CHECKLIST.md` §25

### Estrategia de backup

- **Supabase Pro:** PITR (Point-In-Time Recovery) automático, retención 7 días
- Verificar backups activos en Supabase Dashboard al activar plan Pro
- **Legislación curada:** Export JSON mensual versionado en git (los datos de legislación son curados manualmente y costosos de recrear)

### Objetivos de recuperación

- **RTO (Recovery Time Objective):** 1 hora — tiempo máximo para restaurar servicio
- **RPO (Recovery Point Objective):** 24 horas — máxima pérdida de datos aceptable (último backup diario)

### Procedimiento de restauración

1. Acceder a Supabase Dashboard → Backups
2. Seleccionar punto de restauración (timestamp)
3. Restaurar en proyecto staging primero → verificar integridad
4. Si correcto → restaurar en producción
5. Verificar `/api/health` + datos de prueba

### Verificación periódica

- Test trimestral: restaurar backup en proyecto staging → verificar integridad de tablas core
- Documentar resultado en `ARITZ.md`

---

## PLATAFORMAS DE DISTRIBUCIÓN

> **OPTEK es una PWA. NO es una app nativa.**

| Aspecto | Detalle |
|---------|---------|
| **Tecnología** | Next.js + PWA (serwist/next-pwa) |
| **Acceso** | https://optek.es directamente en navegador |
| **Instalación** | "Añadir a pantalla de inicio" en Android/iOS |
| **Offline** | Tests ya completados + flashcards via IndexedDB |
| **Actualizaciones** | Instantáneas (no pasar por store) |

### Por qué PWA y no app nativa

1. **Un solo codebase** — No mantener web + iOS + Android por separado
2. **Sin Apple/Google tax** — Las stores cobran 15-30% de comisión. Con Stripe directo ~3%
3. **Deploy instantáneo** — Vercel deploy vs 2-7 días de revisión de App Store
4. **SEO** — Google indexa la PWA, una app nativa no
5. **Coste de desarrollo** — React Native/Flutter duplicaría el tiempo. Somos 1 persona + IA
6. **El 95% del uso es formularios + texto** — No necesita cámara, GPS, ni APIs nativas

### Disponibilidad por dispositivo

| Dispositivo | Cómo accede | Experiencia |
|-------------|------------|-------------|
| Android (Chrome) | Web → "Instalar app" → icono en home | Experiencia nativa completa |
| iOS (Safari) | Web → "Compartir" → "Añadir a inicio" | Funcional con limitaciones Apple |
| Desktop | Web → Chrome → "Instalar app" | App en ventana independiente |
| Tablet | Igual que móvil respectivo | Layout responsive optimizado |

### Stores (Post-MVP, no antes)

NO publicar en stores en MVP. Considerar solo cuando:
- >1000 usuarios y canal orgánico saturado
- Para credibilidad ("descargar de App Store")
- Si decides publicar: TWA para Android, PWABuilder para Microsoft Store

---

## ESTRATEGIA DE MARKETING Y ADQUISICIÓN

> **Principio:** Marketing de validación, no de escala. El objetivo del MVP NO es 10.000 usuarios sino **validar que 50-100 opositores pagan por el producto.**

### Canal 1: TikTok / Instagram Reels — PRIORIDAD MÁXIMA

Los opositores son jóvenes (22-35 años), están en TikTok/IG. "#oposiciones" tiene millones de visualizaciones.

**Tipo de contenido:**
- "¿Sabías que...?" — Datos curiosos de legislación con pregunta tipo test
- "POV: estás en el examen y sale..." — Situaciones relatable
- "Academia vs OPTEK" — Comparativa de precio (150€/mes vs 4.99€ una vez)
- Demostraciones en vivo — Screenrecording generando test en 10 segundos
- Building in public — "Estoy construyendo una app de IA para opositores"

**Frecuencia:** 3-5 vídeos/semana. **Coste:** 0€.

### Canal 2: Foros y comunidades de opositores

- ForoOposiciones.com, grupos Facebook/Telegram/WhatsApp
- Estrategia: participar genuinamente, NO spam. Ofrecer acceso beta a cambio de feedback.
- **Coste:** 0€.

### Canal 3: SEO (medio-largo plazo)

Páginas optimizadas: "test auxiliar administrativo gratis", "preguntas oposiciones LPAC", etc.
Blog con contenido legal que termine en CTA a OPTEK. **Tiempo hasta resultados:** 3-6 meses.

### Canal 4: LinkedIn — Building in Public

Updates semanales, reflexiones EdTech + IA. Para credibilidad y posibles inversores.

### Métricas de validación (primeros 30 días)

| Métrica | Target | Significado |
|---------|--------|-------------|
| Registros | >100 | Hay interés |
| Usuarios que completan primer test | >60% de registros | El onboarding funciona |
| Usuarios que vuelven día 2 | >30% | Hay retención |
| Conversión free→pago | >5% | El pricing funciona |
| Revenue | >300€ | El negocio tiene potencial |

**Si NO se cumplen:** Pivotar antes de añadir features.

---

## TIMELINE MVP ACTUALIZADO

> **MVP = "Un opositor puede generar tests verificados de Auxiliar Administrativo, ver sus errores, pagar por un tema, y volver mañana."**
>
> **Modelo de desarrollo:** Claude Code ejecuta el PLAN.md. Aritz revisa, toma decisiones y hace las tareas que requieren acceso humano (cuentas, DPA, beta testers). El PLAN.md está diseñado como spec ejecutable — cada tarea tiene inputs, outputs y criterios de aceptación claros.

### Sprint a Sprint

| Sprint | Tiempo | Entregable |
|--------|--------|------------|
| **Pre-requisitos** (Aritz) | 1 día | Verificar DPA Anthropic, crear cuentas (Supabase EU, Stripe, Anthropic, OpenAI), dominio optek.es |
| **Sprint 1: Infra** | 2-3 días | Next.js + Tailwind + shadcn + Supabase schema + RLS + Auth (magic link) + Stripe (3 productos) + CI/CD + PWA + Observabilidad + Security headers |
| **Sprint 2: Data + RAG** | 3-5 días código + 2-3 días revisión Aritz | BOE scraper (3 leyes: CE, LPAC, LRJSP), embeddings OpenAI, retrieval por tema + semántico, verificación determinista v1 |
| **Sprint 3: UI** | 3-5 días | Landing SEO, auth pages, onboarding, test UI, corrector con CitationBadge, dashboard progreso, PaywallGate, páginas legales |
| **Sprint 4: Monetización + Retención** | 1-2 días | Stripe checkout→webhook→acceso completo, flashcards auto-generadas, rachas + 5 logros, email transaccional (Resend), GDPR endpoints |
| **Sprint 5: Evals + Beta** | 1-2 semanas | Golden datasets, evals adversariales, Quality Score ≥85%, 10-15 beta testers reales, iteración sobre feedback |
| **Sprint 6: Lanzamiento** | 1 día | Stripe live, Core Web Vitals, smoke test, contenido marketing, go live |

### Estimación total

| Escenario | Tiempo | Condiciones |
|-----------|--------|-------------|
| Optimista | **3 semanas** (~15 días hábiles código + 1 semana beta) | Scraper funciona, prompts a la primera, beta sin bugs graves |
| **Realista** | **4-5 semanas** (~1-1.5 meses) | Iteraciones en prompts/evals, ajustes en verificación, 2 semanas beta |
| Pesimista | **6-7 semanas** (~1.5-2 meses) | Scraper BOE falla (transcripción manual), verificación necesita mucha iteración, beta revela problemas UX |

### Qué depende de Claude Code vs qué depende de Aritz

| Claude Code (parallelizable) | Aritz (secuencial, bloqueante) |
|------------------------------|-------------------------------|
| Todo el código (infra, RAG, UI, Stripe, tests) | Verificar DPA Anthropic |
| Supabase schema + RLS + migrations | Crear cuentas (Supabase, Stripe, Anthropic, OpenAI) |
| BOE scraper + ingesta datos | Revisar mapeo tema↔artículos (calidad datos) |
| Prompts + evals automatizados | Registrar dominio optek.es |
| CI/CD pipeline completo | Reclutar 10-15 beta testers |
| Tests unitarios + integración | Decisiones sobre feedback beta |
| Landing page + SEO content | Marketing: TikTok/Reels, foros |

**Cuello de botella real:** La calidad de los datos legislativos (Sprint 2). Si el scraper BOE produce datos limpios y el mapeo tema↔artículos es correcto, el resto fluye. La verificación de Aritz de esos datos es el paso crítico.

**Fecha estimada MVP en mercado: Marzo-Abril 2026.**

---

## PROCEDIMIENTO DE INCIDENTES

> **Referencia completa:** `directives/OPTEK_incident_response.md`
> **Contacto primario:** Aritz (email configurado en Sentry alerts)

### Resumen de runbooks

| # | Escenario | Detección | Acción inmediata |
|---|-----------|-----------|-----------------|
| 1 | Claude API caído | Sentry: error rate >10% en /api/ai/* | Mensaje usuario + fallback a tests cacheados |
| 2 | Supabase caído | /api/health retorna 503 | PWA offline con IndexedDB |
| 3 | Error rate >5% | Sentry auto-alert | Rollback Vercel (1 click) |
| 4 | Coste diario >$15 | Cron check-costs | Investigar abuso vs crecimiento orgánico |
| 5 | Credencial filtrada | GitHub alert / proveedor | Revocar → generar → actualizar → re-deploy |

### Escalation

| Severidad | Criterio | Respuesta |
|-----------|----------|-----------|
| P0 | App caída, datos comprometidos | < 15 min |
| P1 | Feature principal no funciona | < 1 hora |
| P2 | Feature secundaria no funciona | < 4 horas |
| P3 | UI bug, performance degradada | < 24 horas |

---

## OBSERVABILIDAD

> **Referencia:** `directives/00_OBSERVABILITY_STACK.md`

### Structured Logging (pino)

- Producción: JSON, Desarrollo: pretty
- Campos obligatorios: timestamp, level, message, requestId, traceId, service, module, durationMs
- **NUNCA loguear:** API keys, tokens, emails, nombres, texto completo de desarrollos, datos de pago

### Error Reporting (@sentry/nextjs)

- traces_sample_rate: 0.1 en producción
- Contexto: requestId, traceId en cada error
- Alertas: email a Aritz para errores CRITICAL

### Health Monitoring

- `GET /api/health`: check Supabase + Claude API → 200/503
- No exponer IPs, versiones, configuración interna

### Métricas de negocio

- Vercel Analytics para web vitals y tráfico
- KPIs del pipeline RAG (`OPTEK_rag_pipeline.md` §9)
- KPIs de verificación (`OPTEK_verification.md` §8)
- Costes API (`monitoring/COSTS.md`)

### Decisiones operativas

> **Log retention:** Vercel 7 días (free), Sentry 30 días (free tier). Suficiente para MVP. Revisar si necesitamos retención extendida post-launch.
>
> **Monitoring dashboards:** Vercel Analytics (web vitals) + Sentry (errors). No herramienta adicional en MVP. Si se necesita dashboard personalizado → evaluar Grafana Cloud free tier.

---

## FRAMEWORK DE EVALUACIÓN (EVALS)

> **Referencia:** `directives/00_EVALUATION_PROTOCOLS.md`

### Golden Datasets (`tests/evals/`)

- `generate_test_golden.json`: 5+ casos (tema fácil, complejo, alta dificultad, contexto insuficiente, adversarial)
- `correct_desarrollo_golden.json`: 5+ casos (perfecto, errores plazos, incompleto, coloquial, vacío)
- `evaluate_oral_golden.json`: 5+ casos (bien estructurada, muletillas, error jurídico, corta, desorganizada)

### Thresholds

| Flujo | Threshold | Tipo |
|-------|-----------|------|
| GENERATE_TEST | 85% | Crítico |
| CORRECT_DESARROLLO | 85% | Crítico |
| Verificación determinista | 90% | Crítico |
| EVALUATE_ORAL | 70% | Secundario |

### Cuándo ejecutar

- Antes de deploy a producción
- Tras modificar prompts
- Tras cambiar modelo/versión Claude
- Tras modificar `lib/ai/`

---

## GESTIÓN DE DEPENDENCIAS

> **Referencia:** `directives/00_DEPENDENCY_MANAGEMENT.md`

- **Package manager:** pnpm
- **Version pinning:** Versiones exactas (no `^` ni `~`)
- **Lock file:** `pnpm-lock.yaml` siempre committeado
- **Security:** `pnpm audit` en CI (Critical/High bloquean merge)
- **Licencias:** MIT/Apache/BSD OK, GPL requiere aprobación de Aritz

---

## INVENTARIO DE SECRETS Y ROTACIÓN

> **Referencia:** `directives/00_SECRETS_ROTATION.md`

| Secret | Dónde se usa | Rotación | Notas |
|--------|-------------|----------|-------|
| SUPABASE_URL | Server + Client | No rota | URL pública |
| SUPABASE_ANON_KEY | Client-side | 90 días | Regenerar en Dashboard |
| SUPABASE_SERVICE_ROLE_KEY | Server-side only | 90 días | NUNCA en cliente |
| ANTHROPIC_API_KEY | Server-side only | 90 días | console.anthropic.com |
| STRIPE_SECRET_KEY | Server-side only | 90 días | Stripe Dashboard |
| STRIPE_WEBHOOK_SECRET | Webhook handler | Al cambiar endpoint | Auto-generado |
| OPENAI_API_KEY | Server-side only | 90 días | Solo embeddings |
| TTS_API_KEY (Fase 2B) | Server-side only | 90 días | ElevenLabs/OpenAI |
| SENTRY_DSN | Client + Server | No rota | Público por diseño |

**Emergencia (key leaked):** Revocar → Generar nueva → Actualizar Vercel → Re-deploy → Revisar logs → Documentar en ARITZ.md

---

## ADAPTACIÓN TYPESCRIPT DE DIRECTIVAS

> Las directivas fundacionales asumen Python. Equivalencias para este proyecto:

| Directiva Python | Equivalente TypeScript/Next.js |
|-----------------|-------------------------------|
| pytest | Vitest + @testing-library/react |
| conftest.py | tests/vitest.setup.ts |
| pytest-mock | vi.mock() + msw |
| pytest-cov | vitest --coverage (c8/istanbul) |
| pip-audit | pnpm audit + Snyk |
| requirements.txt | package.json + pnpm-lock.yaml |
| structlog | pino |
| Sentry (Python) | @sentry/nextjs |
| execution/run_evals.py | execution/run-evals.ts |
| Pydantic | Zod |

---

## CHECKLIST DE REQUISITOS (vs `00_PLANNING_CHECKLIST.md`)

> **Tipo:** Client-Facing → Core (1-8, 21-25) + Advanced (9-15, 18-20)

| # | Requisito | Estado | Dónde |
|---|-----------|--------|-------|
| 1 | Error Handling | OK | §Error Handling (taxonomía + ApiError schema + withErrorHandling wrapper) |
| 2 | Logging | OK | §Observabilidad (pino + JSON + redactPII) |
| 3 | Secrets Management | OK | §Inventario de Secrets + OPTEK_incident_response.md runbook 5 |
| 4 | PII Protection | OK | §GDPR + OPTEK_security.md §1 (patrones españoles) |
| 5 | Input Validation | OK | §Seguridad (Zod + sanitizeHtml + sanitizeUserText) |
| 6 | Testing | OK | §Testing (Vitest + Playwright + Evals + adversarial + coverage 80%) |
| 7 | Observability | OK | §Observabilidad (Sentry + pino + /health + cost alerts) |
| 8 | Prompt Injection | OK | §Seguridad + OPTEK_security.md §3 (3 capas + adversarial evals) |
| 9 | Idempotency | OK | §0.6 Stripe (deduplicación webhooks) |
| 10 | Prompt Caching | OK | §Performance (cache tests por tema+dificultad+hash) |
| 11 | Rate Limiting | OK | §Seguridad + OPTEK_security.md §5 (@upstash/ratelimit, limits por endpoint, 429+Retry-After) |
| 12 | Retries & Backoff | OK | §Retries y Timeouts (tabla con exponential backoff) |
| 13 | Timeouts | OK | §Retries y Timeouts (30s Claude, 5s Supabase, 10s Stripe) |
| 14 | Fallbacks | OK | §Fallbacks (Claude→cache, Supabase→IndexedDB, OpenAI→full-text) |
| 15 | Cost Monitoring | OK | §Costes + monitoring/COSTS.md + §0.10.14-16 (api_usage_log + cron alerta) |
| 18 | GDPR/CCPA | OK | §GDPR (clasificación, PII, retención, DPAs, export, delete) |
| 19 | Health Checks | OK | §Observabilidad (/api/health checks Supabase + Claude) |
| 20 | Prompt Versioning | OK | Schema BD (prompt_version) + OPTEK_prompts.md |
| 21 | Rate Limiting Implementation | OK | §0.10.10-13 + OPTEK_security.md §5 |
| 22 | Database Migration Strategy | OK | §0.4.12-14 (Supabase CLI migrations) |
| 23 | Error Response Standardization | OK | §0.2.15-17 (ApiError, withErrorHandling, códigos) |
| 24 | XSS Prevention | OK | §0.2.18-19 + OPTEK_security.md §2 (DOMPurify) |
| 25 | Backup & Disaster Recovery | OK | §Backup y Recuperación (PITR, RTO 1h, RPO 24h) |

---

## ADRs (Architecture Decision Records)

> Ubicación: `docs/decisions/`
> Template: `directives/00_ADR_TEMPLATE.md`

| ADR | Decisión | Estado |
|-----|----------|--------|
| ADR-0001 | ~~Claude Sonnet para generación~~ → **GPT-5/GPT-5-mini** (migrado, ver ADR-0013) | Supersedido |
| ADR-0002 | pgvector en Supabase (no Pinecone) | Aceptado |
| ADR-0003 | SHA-256 para detección de cambios BOE | Aceptado |
| ADR-0004 | Verificación determinista (no IA verificando IA) | Aceptado |
| ADR-0005 | JSON estructurado para output de Claude | Aceptado |
| ADR-0006 | Next.js 14 App Router (no Remix, SvelteKit) | Aceptado |
| ADR-0007 | Supabase (no Firebase, custom PostgreSQL) | Aceptado |
| ADR-0008 | Stripe (no Redsys) para pagos | Aceptado |
| ADR-0009 | Modelo pricing híbrido (compra + suscripción) | Aceptado |
| ADR-0010 | OpenAI text-embedding-3-small para embeddings | Aceptado |
| ADR-0011 | PWA (no React Native, Flutter) | Aceptado |
| ADR-0012 | Radar del Tribunal como Premium gate — frecuencias INAP como ventaja competitiva | Propuesto (§2.14) |
| ADR-0013 | OpenAI GPT-5/GPT-5-mini como proveedor IA principal (migración desde Anthropic Claude) | Aceptado |

> Nota: Los archivos ADR en `docs/decisions/` deben actualizarse a estado "Aceptado" (tarea §0.1.11)

---

> **RECORDATORIO:** La Capa de Verificación Determinista es la funcionalidad más importante del producto. Sin ella, OPTEK es un wrapper de GPT más. Con ella, es el único sistema del mercado que puede garantizar que cada cita legal es real y verificada. No lanzar nada sin que esta capa esté funcionando y testeada.
