# OpoRuta — Estado y Lecciones Aprendidas

> Última actualización: 2026-03-08

## Estado actual: PRE-LANZAMIENTO

La app está funcionalmente completa. Pendiente: testeo manual final y promoción.

### Verificaciones de producción (2026-03-08)
- `/api/health` → healthy (DB ok, OpenAI ok, Stripe ok, Resend ok, Upstash ok, Anthropic degraded=esperado)
- 455+ tests unitarios pasando
- 0 referencias a "OPTEK" o "TAC" en código
- 0 TODO/FIXME/HACK en app/ y lib/
- Deploy Vercel funcional con Turbopack

### Migrations aplicadas en Supabase remoto
- 001-025 todas aplicadas

### Configuración completada
- Vercel env vars configuradas
- Stripe productos + webhook en modo LIVE
- Resend configurado
- ANTHROPIC_API_KEY vacía (OpenAI hace todo)
- OPENAI_API_KEY activa
- IndexNow + sitemap enviados

## Lecciones aprendidas

### Vercel
- **NO usar Edge Functions** → causan "Deploying outputs" error en incidentes Vercel
- **NO tener middleware.ts + proxy.ts** → Next.js 16 solo permite uno
- **Tailwind v4 requiere Turbopack** → webpack da ENOENT en build
- **Hobby: máx 2 crons** → check-costs eliminado, ejecutar manual
- **10s timeout** → streaming para IA, AbortController para writes

### Supabase
- **`createServiceClient()`** sin cookies → fix para admin pages con `unstable_cache`
- **RLS UPDATE faltante** → endpoint finalizar fallaba silenciosamente, migration 025
- **`(supabase as any)`** para tablas sin tipos TS generados

### Stripe
- **metadata.tier vs metadata.tipo** → mapeo explícito TIER_TO_DB_TIPO
- **Webhook idempotente** → INSERT-first en stripe_events_processed
- **Modo LIVE desde el inicio** → cs_live_ es correcto

### IA
- **provider.ts como punto único** → nunca importar de claude.ts/openai.ts directamente
- **Lazy-init SDK** → getClient() evita crash si falta API key
- **isomorphic-dompurify eliminado** → jsdom 20MB crasheaba serverless, regex suficiente
- **Streaming + crédito al completar** → patrón BUG-010 en createSafeStreamResponse
- **Prompt caching Anthropic** → cache_control ephemeral en system array

### Datos
- **parse-exam-pdf.ts** → OpenAI Files API para PDFs escaneados (2018)
- **Exámenes ingestados**: 2018 (46+5), 2019, 2022, 2024
- **PROMPT_VERSION** → bumpar en generate-test.ts Y en test file al cambiar prompts

### Seguridad
- **META Pixel** → solo cargar si consent aceptado
- **GDPR export** → validar .error en TODAS las queries, no exportar parcial
- **Open redirect fix** → auth/callback valida destino
- **CSP** → incluir facebook.net, openai.com, anthropic.com

### UX
- **"correcciones" → "análisis detallados"** → rebrand global
- **Timer simulacro proporcional** → 110q=90min, 50q=41min, 20q=16min
- **Test perfecto** → requiere sinResponder === 0
- **Sidebar active state** → startsWith(href + '/') para rutas anidadas

## Comandos útiles

```bash
pnpm type-check        # Verificar TS
pnpm test              # 455+ tests
pnpm build:radar       # Ranking Radar del Tribunal
pnpm ingest:legislacion # Insertar leyes
pnpm eval:all          # Evals de IA (requiere BD real)
pnpm parse:examenes    # Parsear PDFs de exámenes
pnpm ingest:examenes   # Insertar preguntas oficiales
```

## Métricas admin

| Página | Qué mide |
|--------|----------|
| /admin/analytics | Conversión, churn, DAU, funnel, engagement, temas, créditos, feedback |
| /admin/economics | Fuel tank (ingresos vs costes), coste/usuario, AARRR, MRR, alertas |
| /admin/infrastructure | DB size, MAU, Upstash, Vercel invocaciones, crecimiento, negocio |

## Próximos pasos post-lanzamiento

1. Monitorizar métricas admin diariamente la primera semana
2. Google Alerts para "OpoRuta"
3. Axiom log drain en Vercel (gratis 500MB/mes)
4. Cuando >500€/mes revenue → Vercel Pro (20€/mes) + re-añadir check-costs cron
5. Blog: más posts SEO (objetivo 15-20)
6. Segunda oposición (§2.19) cuando haya tracción
