# PLAN.md — OPTEK: Plataforma IA para Opositores

> **Objetivo:** Construir una PWA que actúe como "Entrenador Personal" de oposiciones usando IA (Claude API) con verificación determinista de citas legales.
>
> **Stack:** Next.js latest (App Router) + Tailwind + shadcn/ui + Supabase (auth, PostgreSQL, storage) + Claude API + Stripe + PWA
>
> **Primera oposición:** Auxiliar Administrativo del Estado
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

- [ ] **0.2.1** Crear grupo de rutas auth: `app/(auth)/login/page.tsx` y `app/(auth)/register/page.tsx` (placeholder con título)
- [ ] **0.2.2** Crear grupo de rutas dashboard: `app/(dashboard)/dashboard/page.tsx` (placeholder)
- [ ] **0.2.3** Crear rutas de tests: `app/(dashboard)/tests/page.tsx` y `app/(dashboard)/tests/[id]/page.tsx` (placeholder)
- [ ] **0.2.4** Crear ruta corrector: `app/(dashboard)/corrector/page.tsx` (placeholder)
- [ ] **0.2.5** Crear ruta simulacros: `app/(dashboard)/simulacros/page.tsx` (placeholder)
- [ ] **0.2.6** Crear ruta cuenta: `app/(dashboard)/cuenta/page.tsx` (placeholder)
- [ ] **0.2.7** Crear rutas API: `app/api/ai/generate-test/route.ts` y `app/api/ai/correct-desarrollo/route.ts` (return 501 Not Implemented)
- [ ] **0.2.8** Crear rutas API Stripe: `app/api/stripe/checkout/route.ts` y `app/api/stripe/webhook/route.ts` (return 501)
- [ ] **0.2.9** Crear rutas API utilidad: `app/api/boe/check-updates/route.ts`, `app/api/health/route.ts`, `app/api/user/export/route.ts`, `app/api/user/delete/route.ts` (return 501)
- [ ] **0.2.10** Crear carpetas de componentes: `components/ui/`, `components/layout/`, `components/tests/`, `components/corrector/`, `components/shared/`
- [ ] **0.2.11** Crear carpetas de lib: `lib/supabase/`, `lib/ai/`, `lib/stripe/`, `lib/utils/`, `lib/logger/`
- [ ] **0.2.12** Crear carpeta de tipos: `types/database.ts`, `types/ai.ts`, `types/stripe.ts` (exportar tipos vacíos como placeholder)
- [ ] **0.2.13** Crear carpetas de ejecución y tests: `execution/`, `tests/unit/`, `tests/integration/`, `tests/evals/`, `tests/fixtures/`, `tests/e2e/` (nota: `tests/e2e/` se crea vacía — los tests E2E con Playwright se implementarán en Fase 1B+ cuando haya UI funcional)
- [ ] **0.2.14** Verificar que `pnpm build` compila sin errores con todas las carpetas y placeholders
- [ ] **0.2.15** Crear `types/api.ts` con interfaz `ApiError { code: string, message: string, status: number, requestId: string }` y tipo `ApiResponse<T>`
- [ ] **0.2.16** Crear `lib/utils/api-error.ts`: helper `createApiError(code, message, status)` + wrapper `withErrorHandling(handler)` para API routes (taxonomía: USER_ERROR 400, AUTH_ERROR 401, RATE_LIMIT 429, EXTERNAL_SERVICE 503, INTERNAL 500)
- [ ] **0.2.17** Documentar en `types/api.ts` los códigos de error estándar: INVALID_INPUT, UNAUTHORIZED, RATE_LIMITED, AI_TIMEOUT, AI_UNAVAILABLE, PAYMENT_REQUIRED — con mensajes en español
- [ ] **0.2.18** Instalar `isomorphic-dompurify`: `pnpm add isomorphic-dompurify`
- [ ] **0.2.19** Crear `lib/utils/sanitize.ts` con funciones `sanitizeHtml(text)` y `sanitizeUserText(text)` según `directives/OPTEK_security.md`

### 0.3 Layout y navegación base

- [ ] **0.3.1** Crear `app/layout.tsx` raíz: HTML lang="es", meta viewport, fuentes (Inter de Google Fonts)
- [ ] **0.3.2** Crear `app/(dashboard)/layout.tsx` con sidebar + área principal
- [ ] **0.3.3** Crear componente `components/layout/Sidebar.tsx`: logo OPTEK + links de navegación (Dashboard, Tests, Corrector, Simulacros, Cuenta)
- [ ] **0.3.4** Crear componente `components/layout/Navbar.tsx`: versión mobile con hamburger menu
- [ ] **0.3.5** Crear componente `components/layout/Footer.tsx`: links legales (Privacidad, Términos, Contacto) + copyright
- [ ] **0.3.6** Hacer layout responsive: sidebar visible en desktop (>768px), drawer/hamburger en mobile
- [ ] **0.3.7** Crear componente `components/shared/LoadingSpinner.tsx` (reutilizable, tamaño configurable)
- [ ] **0.3.8** Crear componente `components/shared/ErrorBoundary.tsx` (React Error Boundary con mensaje en español)
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
- [x] **0.8.4** Insertar seed: oposición "Auxiliar Administrativo del Estado" (slug: aux-admin-estado, num_temas: ~25)
- [x] **0.8.5** Insertar seed: temas del temario oficial (25 temas con número, título, descripción)
- [x] **0.8.6** Insertar seed: 10-20 artículos de legislación de ejemplo (Constitución arts. 1, 9, 14, 23, 103; LPAC arts. 53, 54, 68) para poder testear en desarrollo
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

- [ ] **0.15.1** Crear `app/(marketing)/page.tsx` como página raíz (landing)
- [ ] **0.15.2** Crear `app/(marketing)/layout.tsx` con navbar pública (logo + Login + Registrarse)
- [ ] **0.15.3** Hero section: headline "Tu Entrenador Personal de Oposiciones con IA", subtítulo, CTA "Empieza gratis"
- [ ] **0.15.4** Sección "El problema": 3 pain points visuales (academias caras, tests repetitivos, sin feedback personalizado)
- [ ] **0.15.5** Sección "Cómo funciona": 3 pasos con iconos (Elige tema → Genera tests IA → Recibe corrección verificada)
- [ ] **0.15.6** Sección "Por qué OPTEK es diferente": verificación determinista de citas legales como diferenciador
- [ ] **0.15.7** Sección pricing: tabla comparativa (Free / Individual / Premium) con CTAs
- [ ] **0.15.8** Sección FAQ: 6-8 preguntas frecuentes en acordeón (shadcn Accordion)
- [ ] **0.15.9** Sección social proof: placeholder para testimonios (con estructura, sin datos reales aún)
- [ ] **0.15.10** Footer completo: links legales, contacto email, redes sociales placeholders
- [ ] **0.15.11** Responsive: verificar en 3 breakpoints (mobile 375px, tablet 768px, desktop 1280px)
- [ ] **0.15.12** SEO: meta tags (title, description, keywords), Open Graph tags, favicon
- [ ] **0.15.13** Verificar: Lighthouse score > 90 en Performance y SEO

### 0.16 Páginas legales

- [ ] **0.16.1** Crear `app/(marketing)/legal/privacidad/page.tsx`: Política de Privacidad (adaptada a GDPR/RGPD)
  - Responsable del tratamiento (datos de Aritz/empresa)
  - Datos que recogemos y finalidad
  - Base legal (Art. 6.1 GDPR)
  - Derechos del usuario (acceso, rectificación, supresión, portabilidad)
  - Terceros con acceso a datos (Anthropic, Supabase, Stripe)
  - Cookies y analytics
  - Contacto DPD
- [ ] **0.16.2** Crear `app/(marketing)/legal/terminos/page.tsx`: Términos y Condiciones
  - Descripción del servicio
  - Limitaciones (no sustituye asesoría legal, la IA puede equivocarse)
  - Propiedad intelectual
  - Política de reembolso
  - Cancelación de cuenta
- [ ] **0.16.3** Crear `app/(marketing)/legal/cookies/page.tsx`: Política de Cookies
- [ ] **0.16.4** Crear componente `components/shared/CookieBanner.tsx`: banner RGPD con aceptar/rechazar analytics
- [ ] **0.16.5** Verificar: links desde footer funcionan, páginas renderizadas correctamente

### 0.17 Páginas de auth

- [ ] **0.17.1** Crear UI de login `app/(auth)/login/page.tsx`: formulario email + password, link a magic link, link a registro, botón Google OAuth (si configurado)
- [ ] **0.17.2** Crear UI de registro `app/(auth)/register/page.tsx`: formulario email + password + nombre (opcional), checkbox "Acepto política de privacidad" (obligatorio), link a login
- [ ] **0.17.3** Implementar lógica de login: `supabase.auth.signInWithPassword()` → redirect a /dashboard
- [ ] **0.17.4** Implementar lógica de registro: `supabase.auth.signUp()` → email de verificación → redirect a /login con mensaje
- [ ] **0.17.5** Implementar magic link: `supabase.auth.signInWithOtp()` → mostrar "Revisa tu email"
- [ ] **0.17.6** Implementar callback auth: `app/auth/callback/route.ts` para manejar redirect post-verificación
- [ ] **0.17.7** Crear página de error auth: `app/(auth)/error/page.tsx` (link expirado, etc.)
- [ ] **0.17.8** Verificar flujo completo: registro → email verificación → login → dashboard → logout → redirect a login

### 0.18 Onboarding de primera vez ("Hook Inmediato")

> **Contexto:** El opositor quiere ver valor en <30 segundos. Si le pedimos datos antes de mostrar el producto, lo perdemos. Estrategia: **test primero, datos después**.
>
> **Principio:** Captura el interés primero, pide los datos después.

- [ ] **0.18.1** Crear flujo "Test Instantáneo" post-registro:
  - Paso 1: Tras registro + verificar email + login → ir directamente a `/primer-test` (NO a un wizard de datos)
  - Paso 2: Página `/primer-test`: "Prueba OPTEK ahora" → selector rápido de oposición (1 click en card) → genera test del tema 1 INMEDIATAMENTE
  - Paso 3: Tras completar primer test → mostrar resultados + "¿Quieres mejorar?" → pedir datos opcionales (fecha examen, horas/día) en modal ligero
- [ ] **0.18.2** Crear ruta `app/(dashboard)/primer-test/page.tsx`: selector visual de oposición (cards con icono) + botón "Empezar test gratis" que guarda `oposicion_id` y genera test en un solo paso
- [ ] **0.18.3** En `middleware.ts`: si usuario autenticado + `oposicion_id IS NULL` + ruta es `/dashboard/*` → redirect a `/primer-test`
- [ ] **0.18.4** Crear modal `components/shared/PostTestOnboarding.tsx`: tras primer test completado, preguntar fecha examen + horas/día (ambos opcionales, botón "Saltar" prominente)
- [ ] **0.18.5** Verificar flujo completo: registro → verificar email → login → seleccionar oposición (1 click) → primer test INMEDIATO → resultados → datos opcionales → dashboard con datos
- [ ] **0.18.6** Medir: time-to-first-test debe ser <45 segundos desde login (excluyendo tiempo de generación IA)

---

## FASE 1A — MOTOR RAG + VERIFICACIÓN DETERMINISTA (Semanas 3-4)

### 1.1 Ingesta de legislación: preparación de datos

> **Estrategia dual:** Automatizar con API OpenData BOE como vía principal (reduce ~80% trabajo manual). Fallback a transcripción manual si el parsing automático falla para alguna ley.

- [ ] **1.1.0** Crear carpeta `data/legislacion/` y `data/README.md` documentando el schema JSON esperado: `{ ley_nombre, ley_codigo, ley_nombre_completo, articulos: [{ numero, apartado?, titulo_capitulo, texto_integro }] }`. Incluir instrucciones de formato, encoding (UTF-8), y ejemplo mínimo.
- [ ] **1.1.0A** (**AUTOMATIZACIÓN — vía principal**): Crear script `execution/boe-scraper.ts` para obtener legislación estructurada desde la API OpenData del BOE (https://www.boe.es/datosabiertos/):
  - Endpoint XML/JSON del BOE → parsear estructura de ley → extraer artículos con número, título de capítulo, texto íntegro
  - Normalizar encoding (UTF-8), eliminar HTML/XML tags del texto
  - Output: archivos JSON siguiendo el schema de `data/README.md`
  - Incluir rate limiting hacia el BOE (max 1 req/segundo) y retry con backoff
  - **Si el parsing de una ley falla:** log warning + marcar para transcripción manual
- [ ] **1.1.0B** (**PRIORIDAD — validar pipeline con 1 ley**): Ejecutar `boe-scraper.ts` para Ley 39/2015 LPAC como primera ley de prueba → generar `data/legislacion/ley_39_2015_lpac.json`. **Aritz revisa manualmente el output** comparando con BOE original. Si el scraping tiene >5% errores → transcripción manual de esa ley como fallback. Ejecutar pipeline completo (ingesta → embedding → retrieval → generación test → verificación determinista) con solo esta ley. Validar end-to-end ANTES de procesar las 2 leyes restantes.
- [ ] **1.1.1** Ejecutar `boe-scraper.ts` para Constitución Española (artículos clave: Título Preliminar, Títulos I-IV, VIII) → revisar output
- [ ] **1.1.2** Ejecutar `boe-scraper.ts` para Ley 40/2015 LRJSP (completa) → revisar output
- [ ] ~~**1.1.3** TREBEP~~ → **Post-MVP** (ley P1, no crítica para validar)
- [ ] ~~**1.1.4** Transparencia~~ → **Post-MVP** (ley P1)
- [ ] ~~**1.1.5** LCSP~~ → **Post-MVP** (ley P1)
- [ ] ~~**1.1.6** LOPDGDD~~ → **Post-MVP** (ley P1)
- [ ] **1.1.7** Para leyes donde el scraping falló: transcripción manual como fallback. **Trabajo manual de Aritz — solo para leyes que el scraper no pudo parsear correctamente.**
- [ ] **1.1.8** Verificar calidad: crear script `execution/validate-legislacion.ts` que comprueba integridad de cada JSON (campos requeridos, encoding, texto no vacío, artículos numerados correctamente)
- [ ] **1.1.9** Mapear cada artículo al tema/temas del temario oficial que cubre
- [ ] **1.1.10** Verificar: contar artículos por ley, confirmar que cubren todos los 25 temas
- [ ] **1.1.11** Crear `data/mapeo_temas_legislacion.json`: mapeo de cada artículo a los temas del temario oficial. Formato: `{ "tema_1": ["CE:art_1", "CE:art_9", ...], "tema_2": [...] }`. **Borrador generado por Claude Code usando el texto de los artículos + títulos del temario → Aritz valida y corrige.**
- [ ] **1.1.12** Verificar cobertura: crear script en `execution/check-mapping-coverage.ts` que compara artículos en `data/legislacion/*.json` con `data/mapeo_temas_legislacion.json` → alertar artículos sin tema asignado y temas sin artículos

### 1.2 Ingesta de legislación: script y embeddings

- [ ] **1.2.1** Instalar SDK OpenAI: `pnpm add openai`
- [ ] **1.2.2** Copiar OPENAI_API_KEY a `.env.local`
- [ ] **1.2.3** Crear `lib/ai/embeddings.ts`: función `generateEmbedding(text: string): Promise<number[]>` usando text-embedding-3-small
- [ ] **1.2.4** Crear `execution/ingest-legislacion.ts`:
  - Leer archivos JSON de legislación estructurada
  - Para cada artículo: normalizar texto → generar hash SHA-256 → generar embedding → insertar en BD
  - Log de progreso: "Insertando art. X de Ley Y... (N/Total)"
- [ ] **1.2.5** Crear función `normalizeForHash(text: string): string` en `lib/utils/`: trim, colapsar whitespace, NFC unicode
- [ ] **1.2.6** Crear función `computeHash(text: string): string` en `lib/utils/`: SHA-256 con crypto.createHash
- [ ] **1.2.7** Ejecutar ingesta completa contra Supabase de desarrollo
- [ ] **1.2.8** Verificar: `SELECT count(*) FROM legislacion` retorna número esperado de artículos
- [ ] **1.2.9** Verificar: `SELECT count(*) FROM legislacion WHERE embedding IS NOT NULL` = total artículos

### 1.3 Ingesta de exámenes oficiales

- [ ] **1.3.1** Recopilar 3-5 exámenes oficiales anteriores de Auxiliar Administrativo (PDFs)
- [ ] **1.3.2** Crear `execution/ingest-examenes.ts`: parsear preguntas de PDF/texto a JSON estructurado
- [ ] **1.3.3** Estructurar cada pregunta: `{enunciado, opciones[4], correcta, justificacion, ley, articulo}`
- [ ] **1.3.4** Insertar exámenes en tabla `examenes_oficiales`
- [ ] **1.3.5** Verificar: `SELECT count(*) FROM examenes_oficiales` → al menos 3 exámenes

### 1.4 Módulo de recuperación (RAG retrieval)

- [ ] **1.4.1** Crear `lib/ai/retrieval.ts` con función `retrieveByTema(temaId: string, limit: number)`: SELECT legislacion WHERE tema_ids @> ARRAY[temaId]
- [ ] **1.4.2** Crear función `retrieveBySemantic(query: string, limit: number)`: generar embedding de query → llamar RPC `match_legislacion`
- [ ] **1.4.3** Crear función `retrieveByArticle(leyCodigo: string, articuloNumero: string)`: SELECT exacto por ley_codigo + articulo_numero
- [ ] **1.4.4** Crear función `retrieveExamples(oposicionId: string, temaId: string, limit: number)`: SELECT de examenes_oficiales filtrado
- [ ] **1.4.5** Crear función `buildContext(temaId: string, query?: string)`: combina retrieveByTema + retrieveBySemantic + retrieveExamples, formatea como texto para Claude, limita a ~8000 tokens
- [ ] **1.4.6** Test unitario: `retrieveByTema` para tema 1 (Constitución) retorna artículos de CE
- [ ] **1.4.7** Test unitario: `retrieveBySemantic` para "plazo recurso alzada" retorna artículos relevantes de LPAC
- [ ] **1.4.8** Test unitario: `buildContext` no excede 8000 tokens estimados

### 1.5 Capa de Verificación Determinista

- [ ] **1.5.1** Crear `lib/ai/verification.ts` con función `extractCitations(text: string)`: regex para extraer citas legales en múltiples formatos
  - Formatos soportados: "Art. 53.1.a de la Ley 39/2015", "artículo 14 CE", "art. 103 de la Constitución", etc.
  - Output: `Array<{ley: string, articulo: string, apartado?: string, textoOriginal: string}>`
- [ ] **1.5.2** Test unitario `extractCitations`: al menos 10 formatos distintos de cita → extracción correcta
- [ ] **1.5.3** Crear función `verifyCitation(citation)`: lookup en tabla legislacion por ley_codigo + articulo_numero
  - Retorna `{verified: boolean, reason?: string, articuloReal?: Legislacion}`
  - 3 niveles de cascade: exacto → fuzzy (Levenshtein en articulo) → búsqueda por metadata
- [ ] **1.5.4** Test unitario `verifyCitation`: cita válida → verified true, cita inventada → verified false
- [ ] **1.5.5** Crear función `verifyContentMatch(citation, claimText, articuloReal)`: verificaciones deterministas
  - Verificar plazos: regex de números + "días/meses/años" → comprobar que aparecen en texto real
  - Verificar órganos: extraer nombres de instituciones → comprobar en texto real
  - Verificar conceptos jurídicos: keywords clave → comprobar en texto real
  - Retorna `{match: boolean, confidence: 'high'|'medium'|'low', details: string}`
- [ ] **1.5.6** Test unitario `verifyContentMatch`: afirmación correcta de plazo → match true, plazo incorrecto → match false
- [ ] **1.5.7** Crear función `verifyAllCitations(generatedContent: string)`: orquesta extract → verify → contentMatch para todas las citas
  - Retorna `{allVerified: boolean, citations: VerifiedCitation[], score: number}`
  - Score = citas verificadas / total citas
- [ ] **1.5.8** Test unitario `verifyAllCitations`: texto con 3 citas (2 válidas, 1 inválida) → score 0.67
- [ ] **1.5.9** Test edge case: artículos "bis", disposiciones adicionales/transitorias/finales
- [ ] **1.5.10** Test edge case: texto sin citas → score N/A, no bloquear
- [ ] **1.5.11** (**Verificación v2 — Normalización semántica**) — **⏸️ POST-MVP.** La v1 (regex + diccionario) es suficiente para lanzar. Si >20% de citas fallan en normalización, iterar post-launch. Crear función `normalizeCitation(rawCitation: string): NormalizedCitation` en `lib/ai/verification.ts`:
  - Input: cita en formato libre ("Art. catorce CE", "artículo catorce de la Constitución", "art. 14 CE")
  - Paso 1: intentar normalización determinista con regex + diccionario de aliases ("CE" → "constitucion", "LPAC" → "ley_39_2015", "catorce" → "14", etc.)
  - Paso 2: si regex falla → llamada mínima a Claude (prompt de 1 línea: "Normaliza esta cita al formato {ley_codigo, articulo_numero}") — coste ~0.001€/cita
  - Paso 3: resultado normalizado → lookup determinista en BD (igual que v1)
  - **Principio:** La IA solo NORMALIZA el formato; la VERIFICACIÓN sigue siendo 100% determinista por código
- [ ] **1.5.12** Crear diccionario `lib/ai/citation-aliases.ts`: mapeo de abreviaturas y nombres coloquiales a `ley_codigo` de BD ("CE" → "constitucion", "Constitución" → "constitucion", "Ley de Procedimiento" → "ley_39_2015", números en texto → dígitos, etc.)
- [ ] **1.5.13** Test unitario `normalizeCitation`: 10+ variantes de la misma cita ("Art. 14 CE", "artículo catorce de la Constitución", "art. 14 de la CE", "Art. catorce CE") → todas normalizan al mismo `{ley_codigo: 'constitucion', articulo_numero: '14'}`
- [ ] **1.5.14** Monitorización: si % de citas que requieren paso 2 (Claude) > 20% durante 7 días → expandir diccionario de aliases. KPI objetivo: >80% de citas resueltas solo con regex+diccionario (paso 1)

### 1.6 Integración Claude API

- [ ] **1.6.1** Instalar SDK Anthropic: `pnpm add @anthropic-ai/sdk`
- [ ] **1.6.2** Copiar ANTHROPIC_API_KEY a `.env.local`
- [ ] **1.6.3** Crear `lib/ai/claude.ts`: función base `callClaude(systemPrompt, userPrompt, options)` con:
  - Modelo configurable (default: claude-sonnet)
  - **Temperatura obligatoria** por endpoint (ref: `directives/OPTEK_prompts.md` §2.3): GENERATE_TEST=0.3, CORRECT_DESARROLLO=0.4, GENERATE_FLASHCARD=0.3, EVALUATE_ORAL=0.4, TRIBUNAL_QUESTIONS=0.5. NO usar default de Claude — fijar explícitamente para reproducibilidad de evals
  - Timeout: 30s
  - Retry: max 2 con backoff exponencial (1s, 3s)
  - **Circuit breaker simple:** estado CLOSED/OPEN. Tras 5 fallos consecutivos → OPEN (rechazar inmediatamente durante 60s → "IA temporalmente no disponible"). Tras 60s → HALF-OPEN (permitir 1 request de prueba). Si OK → CLOSED. Evita saturar Vercel cuando Claude está caído. ~20 líneas de código.
  - Logging: requestId, tokens in/out, duration, temperature, model
- [ ] **1.6.4** Crear función `callClaudeJSON<T>(systemPrompt, userPrompt, zodSchema)`: llama a Claude → JSON.parse → zodSchema.safeParse → retry 1 vez si parse falla
- [ ] **1.6.5** Crear función `callClaudeStream(systemPrompt, userPrompt)`: retorna ReadableStream para SSE
- [ ] **1.6.6** Crear schemas Zod en `lib/ai/schemas.ts`: TestGeneradoSchema, PreguntaSchema, CorreccionDesarrolloSchema
- [ ] **1.6.7** Test unitario (con mock): `callClaudeJSON` con respuesta válida → parsea correctamente
- [ ] **1.6.8** Test unitario (con mock): `callClaudeJSON` con respuesta inválida → retry → error

### 1.7 Prompt GENERATE_TEST y flujo completo

- [ ] **1.7.1** Crear system prompt GENERATE_TEST en `lib/ai/prompts.ts` (basado en `directives/OPTEK_prompts.md`)
- [ ] **1.7.2** Crear user prompt template con slots: {contexto_legislativo}, {ejemplos_examen}, {dificultad}, {num_preguntas}
- [ ] **1.7.3** Crear función `generateTest(temaId, numPreguntas, dificultad)`:
  1. `buildContext(temaId)` → contexto
  2. `callClaudeJSON(systemPrompt, userPrompt, TestGeneradoSchema)` → test raw
  3. Para cada pregunta: `extractCitations` → `verifyCitation` → `verifyContentMatch`
  4. Filtrar preguntas que no pasen verificación
  5. Si quedan < numPreguntas: regenerar faltantes (max 2 reintentos con prompt ajustado)
  6. Guardar en BD con prompt_version
  7. Retornar test verificado
- [ ] **1.7.4** Test de integración (con mock de Claude): flujo completo genera test de 10 preguntas → verificación → retorna test válido
- [ ] **1.7.5** Test de integración: flujo con pregunta que no pasa verificación → se filtra correctamente
- [ ] **1.7.6** Crear endpoint POST `/api/ai/generate-test/route.ts`:
  - Validar input con Zod (temaId, numPreguntas, dificultad)
  - Verificar auth (middleware Supabase)
  - Verificar acceso (ADR-0010 Fuel Tank): `free_tests_used < 5 O tiene compra tipo 'tema' para este temaId O tiene compra tipo 'pack'`. Sin suscripción. Si no tiene acceso → retornar 402 con upsell [tema 4.99€, pack 34.99€]. Sin flag blur_explanations (eliminado del modelo).
  - Check concurrencia: `SELECT id FROM tests_generados WHERE user_id = X AND created_at > NOW() - INTERVAL '30 seconds' AND completado = false`. Si existe → retornar 409 "Ya tienes un test generándose"
  - Rate limit: usuarios pagados → 20 tests/día silencioso (Upstash). Usuarios free → 5/1m anti-spam.
  - Llamar `generateTest()`
  - Tras generación exitosa: incrementar `free_tests_used` (si es usuario free sin compra de este tema)
  - Retornar JSON con streaming status
- [ ] **1.7.7** Verificar endpoint real: llamar desde Postman/curl → retorna test con preguntas verificadas

### 1.8 Prompt CORRECT_DESARROLLO y flujo completo

- [ ] **1.8.1** Crear system prompt CORRECT_DESARROLLO en `lib/ai/prompts.ts` (basado en `directives/OPTEK_prompts.md`)
- [ ] **1.8.2** Crear user prompt template con slots: {legislacion_relevante}, {desarrollo_usuario}, {tema}
- [ ] **1.8.3** Crear función `correctDesarrollo(texto, temaId)`:
  1. `buildContext(temaId)` → legislación relevante
  2. Sanitizar texto usuario: eliminar patrones PII (emails, teléfonos, DNI) con regex
  3. `callClaudeJSON(systemPrompt, userPrompt, CorreccionDesarrolloSchema)` → corrección raw
  4. Para cada cita en la corrección: verificar determinísticamente
  5. Guardar en BD con prompt_version
  6. Retornar evaluación con badges de verificación
- [ ] **1.8.4** Ampliar `sanitizeUserText(text)` en `lib/utils/sanitize.ts` con patrones españoles según `directives/OPTEK_security.md` §1: DNI/NIE, teléfono español, email, IBAN, tarjeta crédito, nº SS. Aplicar también `sanitizeHtml()` para prevenir XSS. Reemplazo: `[PII_REDACTADO]`
- [ ] **1.8.5** Test unitario con 10+ patrones reales: "Mi DNI es 12345678Z", "Llámame al 666 123 456", "juan@gmail.com", "IBAN ES9121000418450200051332", `<script>alert('xss')</script>`, y verificar que texto legal ("Art. 14 CE") NO se redacta
- [ ] **1.8.6** Test de integración (con mock): flujo completo corrige desarrollo → retorna 5 dimensiones + citas verificadas
- [ ] **1.8.7** Crear endpoint POST `/api/ai/correct-desarrollo/route.ts`:
  - Validar input con Zod (texto, temaId)
  - Verificar auth + acceso (modelo v3): `free_corrector_used < 2 O tiene compra tipo 'tema' para este temaId O tiene compra tipo 'pack_oposicion' O suscripción activa`. Si no tiene acceso → retornar PaywallGate info
  - Check concurrencia: `SELECT id FROM desarrollos WHERE user_id = X AND created_at > NOW() - INTERVAL '30 seconds'`. Si existe → retornar 409 "Ya tienes una corrección en proceso"
  - Rate limit: 5/día por tema (pack/tema) o 5/día global (premium)
  - Llamar `correctDesarrollo()`
  - Tras corrección exitosa: incrementar `free_corrector_used` (si es usuario free sin compra de este tema)
  - Retornar evaluación JSON
- [ ] **1.8.8** Verificar endpoint real: llamar con desarrollo de ejemplo → retorna corrección

---

## FASE 1B — UI COMPLETA DE TESTS Y CORRECTOR (Semanas 5-6)

### 1.9 UI página de tests `/tests`

- [ ] **1.9.1** Crear componente `components/tests/TemaCard.tsx`: muestra tema con número, título, icono de acceso (candado/abierto)
- [ ] **1.9.2** Crear página `/tests/page.tsx`: lista de temas disponibles desde Supabase, agrupados por bloque temático
- [ ] **1.9.3** Crear selector de configuración de test: dropdown dificultad (fácil/media/difícil) + selector nº preguntas (10/20/30)
- [ ] **1.9.4** Crear botón "Generar Test" que llama a `/api/ai/generate-test` con loading state. El botón se desactiva (`disabled`) inmediatamente al hacer click con `useState(isGenerating)` + `useRef(isGeneratingRef)` para bloqueo síncrono — no se re-habilita hasta respuesta o timeout. El `useRef` previene doble-click incluso antes del re-render de React = doble coste.
- [ ] **1.9.5** Crear componente `components/shared/LoadingState.tsx`: skeleton + mensaje motivador rotativo ("Preparando tu test personalizado...")
- [ ] **1.9.6** Crear sección "Tests anteriores": lista con fecha, tema, puntuación, link a ver detalle
- [ ] **1.9.7** Implementar lógica freemium v3 completa:
  - Usuarios free: mostrar "X/5 tests gratis" con barra de progreso
  - Tests 1-3: renderizar explicaciones completas
  - Tests 4-5: renderizar explicaciones con `filter: blur(8px)` + overlay: "Desbloquea la explicación del Art. X comprando este tema — 4.99€ para siempre" (Loss Aversion + Zeigarnik)
  - Test 6+: mostrar PaywallGate con 2 opciones principales + ancla visual ("Academia: desde 150€/mes")
  - Usuarios con tema comprado: "Ilimitado" para ese tema, PaywallGate para otros temas
  - Usuarios con pack: "Ilimitado — Pack Oposición"
  - Usuarios premium: "Premium — 20 tests/día" con contador
  - Manejar respuesta 409 del backend con mensaje "Ya tienes un test generándose"
- [ ] **1.9.8** Verificar: página carga, muestra temas, genera test → redirige a `/tests/[id]`

### 1.10 UI vista de test activo `/tests/[id]`

- [ ] **1.10.1** Crear componente `components/tests/QuestionView.tsx`: enunciado + 4 opciones (radio buttons) con estilo shadcn
- [ ] **1.10.2** Crear barra de progreso: "Pregunta X de Y" con indicador visual
- [ ] **1.10.3** Crear navegación entre preguntas: botones "Anterior"/"Siguiente" + grid de números para saltar
- [ ] **1.10.4** Implementar feedback inmediato al responder: opción correcta verde, incorrecta roja, justificación expandible
- [ ] **1.10.5** Crear componente `components/shared/CitationBadge.tsx`: badge verde "Verificada" / amarillo "Parcial" / rojo "No verificada"
- [ ] **1.10.6** Mostrar justificación de cada pregunta con CitationBadge en cada cita legal
- [ ] **1.10.7** Crear botón "Reportar pregunta" con dialog: motivo (texto) → envía a tabla preguntas_reportadas
- [ ] **1.10.8** Crear botón "Finalizar test" con confirmación si hay preguntas sin responder
- [ ] **1.10.9** Guardar respuestas y puntuación en BD al finalizar
- [ ] **1.10.10** Verificar flujo completo: abrir test → responder preguntas → ver feedback → finalizar

### 1.11 UI vista de resultados post-test

- [ ] **1.11.1** Crear componente `components/tests/ResultsView.tsx`: puntuación total prominente (aciertos/total) con color por rango
- [ ] **1.11.2** Crear desglose por dificultad: % acierto en fácil/media/difícil
- [ ] **1.11.3** Crear lista de preguntas falladas: enunciado + respuesta del usuario + correcta + justificación
- [ ] **1.11.4** Mostrar tiempo total y tiempo medio por pregunta
- [ ] **1.11.5** Crear CTAs contextuales: "Repasa tus errores", "Genera otro test", "Prueba el corrector"
- [ ] **1.11.6** Verificar: al finalizar test → se muestra ResultsView con datos correctos

### 1.12 UI corrector de desarrollos `/corrector`

- [ ] **1.12.1** Crear componente `components/corrector/EditorView.tsx`: textarea grande (min 500px alto) con contador de palabras
- [ ] **1.12.2** Crear selector de tema (dropdown con temas de la oposición)
- [ ] **1.12.3** Crear botón "Corregir mi desarrollo" con loading state animado. Debounce: desactivar (`disabled`) al click con `useState(isCorrecting)`. Verificar acceso (ADR-0010): si `corrections_balance = 0` y `free_corrector_used >= 2` → el backend retorna 402 con upsell [recarga 8.99€, pack 34.99€]. Frontend muestra modal de recarga. Manejar respuesta 409 con "Ya tienes una corrección en proceso".
- [ ] **1.12.4** Crear componente `components/corrector/FeedbackView.tsx`: nota global prominente + 5 tarjetas de dimensiones expandibles
- [ ] **1.12.5** Crear tarjeta de dimensión: nombre, nota (0-10 con color), feedback detallado, errores con highlight
- [ ] **1.12.6** Cada error muestra: texto del usuario citado, corrección sugerida, CitationBadge con artículo
- [ ] **1.12.7** Sección "Puntos fuertes" y "Áreas de mejora" con bullet points
- [ ] **1.12.8** Botón "Guardar evaluación" → guardar en BD
- [ ] **1.12.9** Historial de correcciones anteriores: lista con fecha, tema, nota, link a ver detalle
- [ ] **1.12.10** Verificar flujo completo: escribir desarrollo → seleccionar tema → corregir → ver feedback → guardar

### 1.13 Dashboard del usuario `/dashboard`

- [ ] **1.13.1** Crear sección resumen: tarjetas con tests realizados (total), nota media, racha de días consecutivos
- [ ] **1.13.2** Crear gráfico de evolución (últimos 30 días): usar librería ligera (recharts o chart.js) para línea de puntuación
- [ ] **1.13.3** Crear mapa de temas: grid de 25 temas con color por nota (verde >=7, amarillo 4-7, rojo <4, gris no intentado)
- [ ] **1.13.4** Crear sección "Últimas actividades": lista cronológica de tests + correcciones recientes
- [ ] **1.13.5** Crear CTAs contextuales: lógica simple basada en datos (ej: tema con peor nota → "Tu punto débil es...")
- [ ] **1.13.6** Crear accesos directos: botones "Generar test" y "Corregir desarrollo" siempre visibles
- [ ] **1.13.7** Verificar: dashboard carga con datos reales del usuario

### 1.13B Gamificación básica (rachas + logros) — adelantada de Fase 2B

> **Decisión:** Mover rachas y logros básicos a Fase 1B. El opositor necesita "dopamina rápida" para volver mañana. Una racha de 3 días retiene más que features complejas. Coste de implementación bajo, impacto en retención D1/D7 alto.

- [ ] **1.13B.1** Crear tabla `logros`: id, user_id (FK), tipo (text), desbloqueado_en (timestamptz)
- [ ] **1.13B.2** Implementar sistema de rachas en `lib/utils/streaks.ts`: contar días consecutivos con ≥1 test completado. Guardar en `profiles.racha_actual (int)` y `profiles.racha_maxima (int)`
- [ ] **1.13B.3** Implementar detección de logros básicos: `primer_test`, `racha_3`, `racha_7`, `50_preguntas`, `nota_perfecta`
- [ ] **1.13B.4** Integrar racha en dashboard (sección 1.13.1): número prominente + icono fuego 🔥 + mensaje motivador ("¡3 días seguidos! No rompas la racha")
- [ ] **1.13B.5** Toast de logro: al desbloquear → toast animado con badge + confetti sutil (shadcn Toast + css animation)
- [ ] **1.13B.6** Mini-sección logros en dashboard: últimos 3 logros desbloqueados con badge
- [ ] **1.13B.7** Verificar: completar test → racha se incrementa → logro se desbloquea → toast aparece

### 1.14 Página de cuenta `/cuenta`

- [ ] **1.14.1** Crear sección "Perfil": nombre (editable), email (readonly), oposición seleccionada, fecha examen (editable)
- [ ] **1.14.2** Crear sección "Mis compras": lista de compras con fecha, producto, precio, estado
- [ ] **1.14.3** Crear sección "Suscripción": estado actual, fecha próximo pago, botón "Gestionar suscripción" (→ Stripe Customer Portal)
- [ ] **1.14.4** Crear botón "Exportar mis datos" (→ GET /api/user/export → descarga JSON)
- [ ] **1.14.5** Crear botón "Eliminar mi cuenta" con doble confirmación → DELETE /api/user/delete → email de confirmación
- [ ] **1.14.6** Crear botón "Cerrar sesión" → supabase.auth.signOut() → redirect a /login
- [ ] **1.14.7** Verificar: todas las acciones de cuenta funcionan

---

## FASE 1C — STRIPE, BETA Y LANZAMIENTO (Semanas 7-8)

### 1.15 Stripe: flujo de compra completo

- [ ] **1.15.1** Implementar endpoint POST `/api/stripe/checkout/route.ts`:
  - Input: productId + userId
  - Crear Stripe Checkout Session con success_url y cancel_url
  - Retornar URL de checkout
- [ ] **1.15.2** Implementar endpoint POST `/api/stripe/webhook/route.ts`:
  - Verificar firma: `stripe.webhooks.constructEvent(body, signature, webhookSecret)`
  - Check idempotencia (**patrón INSERT-first**): `INSERT INTO stripe_events_processed (stripe_event_id, event_type) VALUES (X, Y)` — si lanza UniqueViolation → ya procesado → return 200 (skip). Este patrón es más seguro que SELECT-then-INSERT porque evita race conditions bajo carga.
  - Manejar `checkout.session.completed` → INSERT compras (en transacción con el INSERT de stripe_events_processed)
  - **Sin suscripciones (ADR-0010):** eliminar handlers invoice.paid y subscription.deleted del MVP.
- [ ] **1.15.3** Crear componente `components/shared/PaywallGate.tsx` (ADR-0010 — Fuel Tank):
  - **Contexto TESTS** (code: PAYWALL_TESTS): 2 tarjetas:
    - Tarjeta 1: "Por tema — 4.99€" (tests ilimitados de 1 tema + 5 correcciones)
    - Tarjeta 2 (destacada, "Más popular"): "Pack Oposición — 34.99€" (todo el temario + 20 correcciones)
  - **Contexto CORRECCIONES** (code: PAYWALL_CORRECTIONS): 2 tarjetas:
    - Tarjeta 1: "Recarga — 8.99€" (+15 correcciones)
    - Tarjeta 2 (destacada, "Más valor"): "Pack Oposición — 34.99€" (todo + 20 correcciones)
  - **Ancla visual** arriba: "Academia presencial: desde 150€/mes" vs "OPTEK: desde 4.99€ una vez"
  - Props: `code: 'PAYWALL_TESTS' | 'PAYWALL_CORRECTIONS'`, `upsell: UpsellOption[]` (viene del 402)
- [ ] **1.15.4** Crear hook `useUserAccess(temaId)`: verifica en BD si usuario tiene compra (tema o pack). Retorna `{ hasAccess, accessType: 'tema'|'pack'|'free' }`
- [ ] **1.15.5** Integrar PaywallGate en página de tests: manejar respuesta 402 del backend → mostrar modal PaywallGate
- [ ] **1.15.6** Integrar PaywallGate en corrector: si no tiene acceso al tema → PaywallGate
- [ ] **1.15.7** Configurar webhook URL en Stripe Dashboard (producción y test)
- [ ] **1.15.8** Test con Stripe CLI: `stripe trigger checkout.session.completed` → verificar que compra aparece en BD
- [ ] **1.15.9** Implementar Stripe Customer Portal: endpoint POST `/api/stripe/portal/route.ts` → redirect a portal
- [ ] **1.15.10** Verificar flujo completo: click comprar → Stripe Checkout → pago → webhook → acceso desbloqueado

### 1.16 Proveedor de email transaccional

- [ ] **1.16.1** Crear cuenta en Resend (free tier: 3000 emails/mes)
- [ ] **1.16.2** Instalar SDK: `pnpm add resend`
- [ ] **1.16.3** Configurar dominio de envío en Resend (verificar DNS)
- [ ] **1.16.4** Crear `lib/email/client.ts`: wrapper de Resend con from="OPTEK <noreply@OPTEK.es>"
- [ ] **1.16.5** Crear template email de bienvenida: saludo + qué puede hacer + CTA primer test
- [ ] **1.16.6** Crear template email de confirmación de eliminación de cuenta: link de confirmación con token (24h expiración)
- [ ] **1.16.7** Verificar: registro de usuario → recibe email de bienvenida

### 1.17 Implementar GDPR endpoints

- [ ] **1.17.1** Implementar `GET /api/user/export/route.ts`: query todas las tablas del usuario → compilar JSON → retornar como descarga
- [ ] **1.17.2** Implementar `DELETE /api/user/delete/route.ts`:
  - Paso 1: enviar email de confirmación con token firmado
  - Paso 2: endpoint de confirmación `/api/user/delete/confirm?token=X`
  - Paso 3: cascade delete con anonimización de datos fiscales
- [ ] **1.17.3** Test: exportar datos de usuario de prueba → JSON contiene todos los campos esperados
- [ ] **1.17.4** Test: eliminar usuario → verificar que no quedan datos excepto fiscal

### 1.18 Evals antes de beta

> **Aclaración de thresholds (3 métricas diferentes):**
> - **Quality Score de evals** ≥ 85%: mide calidad del output de Claude (formato, relevancia, corrección). Se mide con Golden Datasets contra criterios humanos. Aplica para go/no-go de beta y pre-deploy.
> - **Tasa de verificación determinista** ≥ 90%: mide % de citas legales que pasan verificación contra BD. Se mide en producción con `getVerificationRate()`. Si cae < 80% → alerta (§0.10.20). Aplica post-deploy como métrica operativa.
> - **Preguntas reportadas** ≤ 5%: mide % de preguntas que los usuarios reportan como erróneas. Aplica para go/no-go de lanzamiento público (§1.19.0).
>
> Son complementarias: evals miden calidad pre-deploy, verificación mide integridad en producción, reportes miden percepción del usuario.

- [ ] **1.18.1** Crear `tests/evals/generate_test_golden.json` con 5+ casos: caso normal (tema estándar, dificultad media), caso límite (tema con poca legislación), caso adversarial (input con prompt injection), caso edge (artículos bis, disposiciones adicionales), caso de error esperado (contexto insuficiente → debe rechazar)
- [ ] **1.18.2** Crear `tests/evals/correct_desarrollo_golden.json` con 5 casos mínimos
- [ ] **1.18.3** Crear `execution/run-evals.ts`: carga JSON → ejecuta prompts → compara output → calcula Quality Score
- [ ] **1.18.4** Ejecutar evals: GENERATE_TEST Quality Score > 85%
- [ ] **1.18.5** Ejecutar evals: CORRECT_DESARROLLO Quality Score > 85%
- [ ] **1.18.6** Si score < 85%: iterar prompts hasta alcanzar threshold
- [ ] **1.18.7** Crear `tests/evals/adversarial_inputs.json` con 5+ ataques de prompt injection según `directives/OPTEK_security.md` §3: "Ignora instrucciones previas", XML tags falsos, JSON injection, input extremadamente largo, instrucciones en otro idioma
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

---

## FASE 2A — PERSONALIZACIÓN (Post-MVP — priorizar según validación de mercado)

> **Nota MVP:** De esta fase, solo Flashcards simples (§2.1-2.2 simplificados) y Simulacros (§2.6) se incluyen en el MVP. El resto (Plan adaptativo, IPR) se implementa post-validación.

### 2.1 Flashcards: backend

- [ ] **2.1.1** Crear tabla `flashcards` en Supabase: id, user_id (FK), tema_id (FK), frente (text), reverso (text), cita_legal (jsonb), intervalo_dias (int default 1), facilidad (float default 2.5), siguiente_repaso (date), veces_acertada (int default 0), veces_fallada (int default 0), origen (text check: 'error_test','error_desarrollo','manual'), created_at
- [ ] **2.1.2** Habilitar RLS: SELECT/INSERT/UPDATE WHERE auth.uid() = user_id
- [ ] **2.1.3** ~~Implementar algoritmo SM-2~~ **MVP simplificado:** Implementar intervalos fijos en `lib/utils/spaced-repetition.ts`: función `getNextReviewDate(timesCorrect: number)` → intervalos fijos: 1, 3, 7, 14, 30 días. SM-2 completo → Post-MVP.
- [ ] **2.1.4** Test unitario: acertar 3 veces → siguiente repaso en 7 días, fallar → reset a 1 día
- [ ] **2.1.5** Crear prompt GENERATE_FLASHCARD: input(pregunta fallada + justificación) → output({frente, reverso, cita_legal})
- [ ] **2.1.6** Crear función `generateFlashcardFromError(pregunta, respuestaCorrecta, justificacion)`: llama Claude → inserta flashcard en BD

### 2.2 Flashcards: auto-generación y UI

- [ ] **2.2.1** Integrar auto-generación: cuando usuario falla pregunta de test, crear flashcard automáticamente (en background)
- [ ] **2.2.2** Crear página `/flashcards/page.tsx`: mazos por tema (grid de tarjetas), contador "X pendientes hoy"
- [ ] **2.2.3** Crear componente `FlashcardReview.tsx`: animación flip (frente/reverso), botones de calidad ("No lo sabía", "Difícil", "Bien", "Fácil")
- [ ] **2.2.4** Implementar sesión de repaso: cargar flashcards con siguiente_repaso <= hoy, presentar una a una
- [ ] **2.2.5** Al evaluar: actualizar intervalo/facilidad con SM-2, actualizar siguiente_repaso en BD
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

- [ ] **2.6.1** Crear página `/simulacros/page.tsx`: selección de simulacro (completo = 60 preguntas, parcial = 30)
- [ ] **2.6.2** Implementar timer estricto: countdown visible, penalización configurable por incorrectas
- [ ] **2.6.3** Al finalizar: calcular nota con penalización, guardar resultado en BD
- [ ] **2.6.4** Vista de resultados de simulacro: nota, tiempo, desglose por tema, comparativa con media de otros usuarios
- [ ] **2.6.5** Verificar: simulacro completo funciona end-to-end con timer

---

## FASE 2B — GAMIFICACIÓN AVANZADA + ALERTAS BOE — **⏸️ POST-MVP COMPLETA**

> **Decisión:** Rachas y logros básicos ya están en Fase 1B (§1.13B). Rankings requieren masa crítica (>100 usuarios/oposición). Alertas BOE email son prematuras — en MVP el monitor BOE es un script manual ejecutado mensualmente. Toda esta fase se implementa post-validación de mercado.

### 2.7 Gamificación avanzada (extiende §1.13B)

- [ ] **2.7.1** Crear tabla `ranking_semanal`: id, user_id (FK), oposicion_id (FK), semana (date), puntuacion_total (float), posicion (int), percentil (float)
- [ ] **2.7.2** Implementar logros avanzados (extienden los básicos de §1.13B): `racha_30`, `100_preguntas`, `500_preguntas`, `10_temas_completados`, `todas_notas_sobre_7`
- [ ] **2.7.3** Crear cron job (Vercel Cron): cada lunes calcular ranking semanal por oposición
- [ ] **2.7.4** Crear página `/logros/page.tsx`: grid completo de badges (desbloqueados en color, pendientes en gris), con descripción y fecha de desbloqueo
- [ ] **2.7.5** Crear componente `RankingTable.tsx`: top 20 + posición del usuario resaltada
- [ ] **2.7.6** Crear página `/ranking/page.tsx`: ranking semanal + mensual, filtro por oposición
- [ ] **2.7.7** Verificar: completar tests → logros avanzados se desbloquean → ranking se calcula semanalmente

### 2.8 Monitorización BOE (cron job)

- [ ] **2.8.1** Crear `execution/boe-monitor.ts`: obtener lista de leyes monitorizadas desde BD
- [ ] **2.8.2** Para cada ley: scraping del BOE (buscar modificaciones publicadas)
- [ ] **2.8.3** Para cada artículo modificado: normalizar texto → generar hash → comparar con hash almacenado
- [ ] **2.8.4** Si hash difiere: actualizar texto_integro + hash_sha256 en BD, insertar en cambios_legislativos
- [ ] **2.8.5** Invalidar preguntas generadas que citan el artículo modificado (flag needs_regeneration)
- [ ] **2.8.6** Regenerar embeddings del artículo actualizado
- [ ] **2.8.7** Configurar Vercel Cron: ejecutar diariamente a las 08:00 CET
- [ ] **2.8.8** Log de ejecución: leyes revisadas, cambios detectados, artículos actualizados
- [ ] **2.8.9** Test: simular cambio en artículo → verificar detección → verificar invalidación de tests

### 2.9 Alertas personalizadas BOE

- [ ] **2.9.1** Crear template email en Resend: "Cambio legislativo que afecta a tu temario" con artículo, resumen, CTA
- [ ] **2.9.2** Integrar envío de email en boe-monitor: cuando se detecta cambio → enviar a usuarios afectados (los que tienen ese tema en su oposición)
- [ ] **2.9.3** Crear badge en dashboard: "X cambios legislativos pendientes"
- [ ] **2.9.4** Crear página `/cambios-legislativos/page.tsx`: lista de cambios recientes con antes/después
- [ ] **2.9.5** Generar mini-test de actualización: 5 preguntas sobre artículo modificado
- [ ] **2.9.6** Verificar: cambio detectado → email enviado → badge aparece → mini-test generado

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
| ADR-0001 | Claude Sonnet para generación (no Opus) | Aceptado |
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

> Nota: Los archivos ADR en `docs/decisions/` deben actualizarse a estado "Aceptado" (tarea §0.1.11)

---

> **RECORDATORIO:** La Capa de Verificación Determinista es la funcionalidad más importante del producto. Sin ella, OPTEK es un wrapper de GPT más. Con ella, es el único sistema del mercado que puede garantizar que cada cita legal es real y verificada. No lanzar nada sin que esta capa esté funcionando y testeada.
