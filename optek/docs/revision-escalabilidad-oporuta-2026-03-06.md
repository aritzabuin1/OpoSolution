# Revision de Escalabilidad - OpoRuta

**Fecha**: 2026-03-06
**Stack**: Next.js 16 + Supabase + Claude/OpenAI + Stripe + Upstash Redis + Vercel

---

## Estado actual

**Carga actual**: Pre-lanzamiento (0 usuarios reales).
**Carga objetivo**: 100-500 usuarios registrados en 3 meses, 1.000-5.000 en 12 meses.
**Concurrencia pico estimada**: 10-50 requests simultaneos (oposiciones = estudio nocturno, picos 20:00-23:00).
**Infra actual**: Vercel Hobby (0 EUR/mes) + Supabase Free + Upstash Free.

**Que funciona bien:**
- Idempotencia en operaciones criticas (Stripe webhook, logros, reto diario, streaks) -- todo usa INSERT ON CONFLICT o RPCs atomicos
- Logging estructurado con pino + requestId en todas las rutas criticas
- Health check completo (6 servicios, healthy/degraded/unhealthy)
- Rate limiting fail-closed en produccion
- Circuit breaker dual (Claude + OpenAI)
- Secretos correctamente gestionados (.env.local gitignored, .env.example solo placeholders)

---

## Antipatrones encontrados

### AP-1: Procesamiento pesado en request handlers

| # | Que | Donde | Impacto | Risk |
|---|-----|-------|---------|------|
| 1.1 | BOE scraper fetch sin timeout | `execution/boe-scraper.ts:157-170` | Cron colgado indefinidamente si BOE no responde | HIGH |
| 1.2 | generate-reto-diario sin timeout global | `app/api/cron/generate-reto-diario/route.ts:92` | 3 llamadas GPT x 120s timeout SDK = hasta 360s | MEDIUM |
| 1.3 | explain-errores sin withTimeout | `app/api/ai/explain-errores/route.ts:198` | Haiku timeout SDK 30s, pero sin safety net | LOW |

### AP-2: Estado en memoria (serverless-incompatible)

| # | Que | Donde | Impacto | Risk |
|---|-----|-------|---------|------|
| 2.1 | Circuit breaker Claude per-instance | `lib/ai/claude.ts:73-86` | 50 instancias Vercel = 50 circuit breakers independientes. Inefectivo | HIGH |
| 2.2 | Circuit breaker OpenAI per-instance | `lib/ai/openai.ts:84-89` | Mismo problema | HIGH |

**Nota**: Moverlo a Redis (Upstash) requiere cambio de arquitectura. Documentado como P2 -- funciona como "fusible local" mientras tanto.

### AP-3: Llamadas externas sin timeout

| # | Que | Donde | Timeout? | Risk |
|---|-----|-------|----------|------|
| 3.1 | fetch() BOE | `execution/boe-scraper.ts:161` | NO | HIGH |
| 3.2 | Anthropic SDK | `lib/ai/claude.ts:28` | SI (30s) | LOW |
| 3.3 | OpenAI SDK | `lib/ai/openai.ts:33` | SI (120s) | LOW |
| 3.4 | Resend SDK | `lib/email/client.ts` | Default (~30s) | LOW |
| 3.5 | Stripe SDK | `lib/stripe/client.ts` | Default (~60s) | LOW |
| 3.6 | Supabase RPCs | Multiples ficheros | NO explicito (server-side ~30s) | MEDIUM |

### AP-4: Sin reintentos en operaciones criticas

| # | Que | Donde | Risk |
|---|-----|-------|------|
| 4.1 | Email Resend sin retry | `lib/email/client.ts:205,243,279` | HIGH |
| 4.2 | BOE watcher DB writes sin retry | `lib/ai/boe-watcher.ts:157,179,190,211` | HIGH |
| 4.3 | Alert email sin retry | `lib/admin/alerting.ts:31` | MEDIUM |

### AP-5: Queries N+1

| # | Que | Donde | Risk |
|---|-----|-------|------|
| 5.1 | Verificacion secuencial de preguntas | `lib/ai/generate-test.ts:214-228` | MEDIUM |

**Nota**: El resto del codebase usa `Promise.all()` correctamente (simulacro, flashcards, etc).

### AP-6: Indices faltantes

No se encontraron indices criticos faltantes. Todas las columnas frecuentes (user_id, tema_id, created_at, tipo, fecha) tienen indices. `profiles.id` es PRIMARY KEY (indexado implicitamente).

### AP-7-9: Concurrencia, secretos, health checks -- TODO CORRECTO

- Concurrencia: RPCs atomicos + ON CONFLICT en todas las escrituras criticas
- Secretos: .env.local nunca commiteado, .env.example solo placeholders
- Health: /api/health verifica 6 servicios con timeouts individuales

### AP-10: Logs inconsistentes

| # | Que | Donde | Risk |
|---|-----|-------|------|
| 10.1 | console.error directo | `lib/hooks/useUserAccess.ts:130` | LOW |
| 10.2 | console.error en api-error | `lib/utils/api-error.ts:30` | LOW |

### AP-11: Idempotencia en emails

| # | Que | Donde | Risk |
|---|-----|-------|------|
| 11.1 | Email welcome sin dedup | `lib/email/client.ts:195-224` | MEDIUM |

**Nota**: Stripe, logros, reto diario, streaks, tests -- todos correctamente idempotentes.

### AP-12: Funciones monoliticas

| # | Funcion | Fichero | Lineas | Risk |
|---|---------|---------|--------|------|
| 12.1 | buildContext() | `lib/ai/retrieval.ts:455-611` | ~155 | HIGH |
| 12.2 | generateTest() | `lib/ai/generate-test.ts:83-204` | ~120 | HIGH |
| 12.3 | POST generate-simulacro | `app/api/ai/generate-simulacro/route.ts:59-342` | ~280 | MEDIUM |
| 12.4 | POST explain-errores | `app/api/ai/explain-errores/route.ts:40-277` | ~235 | MEDIUM |

---

## Plan de migracion priorizado

### P0 - RIESGO DE CAIDA (arreglar antes de escalar)

| # | Fix | Esfuerzo | Antipatron |
|---|-----|----------|------------|
| P0-1 | Anadir AbortController con 10s timeout a boe-scraper fetch | 10 min | AP-1.1 + AP-3.1 |
| P0-2 | Envolver loop reto-diario en withTimeout(45s) | 10 min | AP-1.2 |
| P0-3 | Reemplazar console.error por logger en 2 ficheros | 5 min | AP-10 |

### P1 - CUELLO DE BOTELLA (arreglar antes de escalar)

| # | Fix | Esfuerzo | Antipatron |
|---|-----|----------|------------|
| P1-1 | Paralelizar verificacion preguntas con Promise.all() | 15 min | AP-5.1 |
| P1-2 | Extraer buildContext en buildContextBloque1/buildContextBloque2 | 30 min | AP-12.1 |
| P1-3 | Extraer retry loop de generateTest en funcion separada | 20 min | AP-12.2 |
| P1-4 | Extraer loadExamenMixto/loadExamenPorAno de generate-simulacro | 25 min | AP-12.3 |

### P2 - DEUDA TECNICA (arreglar cuando haya tiempo)

| # | Fix | Esfuerzo | Antipatron |
|---|-----|----------|------------|
| P2-1 | Circuit breaker a Redis (Upstash) | 2h | AP-2 |
| P2-2 | withRetry en emails Resend | 15 min | AP-4.1 |
| P2-3 | withRetry en BOE watcher DB writes | 20 min | AP-4.2 |
| P2-4 | Extraer credit management de explain-errores | 30 min | AP-12.4 |

---

## Estimacion de capacidad

### Con arquitectura actual (Vercel Hobby + Supabase Free):

| Metrica | Limite | Notas |
|---------|--------|-------|
| Usuarios registrados | ~500 | Limitado por Supabase Free (500 MB DB) |
| Requests concurrentes | ~50 | Vercel Hobby: 12 serverless functions concurrentes |
| Tests AI/dia | ~200 | Limitado por presupuesto OpenAI (~0.05 USD/test) |
| Serverless timeout | 10s (Hobby) / 60s (Pro) | Problema para generate-test (~5-8s) |
| Cron jobs | 2 | Ya al limite (boe-watch + reto-diario) |
| Bandwidth | 100 GB/mes | Mas que suficiente |

### Despues de P0+P1 + Vercel Pro (20 USD/mes):

| Metrica | Limite | Mejora |
|---------|--------|--------|
| Serverless timeout | 60s | 6x mas margen para AI |
| Cron jobs | 40 | check-costs restaurable |
| Concurrencia | ~100 | Serverless auto-scale |
| Usuarios | ~2.000 | Con Supabase Pro (25 USD/mes): ~50.000 |

### Coste mensual estimado por fase:

| Fase | Usuarios | Infra/mes | AI/mes | Total |
|------|----------|-----------|--------|-------|
| Lanzamiento (0-100) | 0-100 | 0 EUR (Hobby+Free) | ~10 EUR | ~10 EUR |
| Crecimiento (100-500) | 100-500 | 45 EUR (Vercel Pro + Supabase Pro) | ~50 EUR | ~95 EUR |
| Escala (500-5.000) | 500-5.000 | 45 EUR | ~300 EUR | ~345 EUR |

---

## Coste de no hacer nada

Si la carga crece un 50% sin aplicar P0:
- **BOE cron sin timeout**: si BOE cae, cron se cuelga y no se regenera reto diario al dia siguiente (2 crons bloqueados en Hobby)
- **generate-test sin paralelizar**: latencia crece linealmente con numero de preguntas verificadas (10 preguntas x 2 queries = 20 queries secuenciales vs 2 queries paralelas)
- **Circuit breaker local**: si Claude cae, todas las instancias siguen intentando durante 60s antes de abrir circuito independientemente. Con 50 usuarios concurrentes = 50 requests fallidos en vez de 5

Ningun hallazgo causa caida inmediata. El sistema funciona para lanzamiento. Los P0 previenen problemas bajo carga moderada (>50 concurrentes).
