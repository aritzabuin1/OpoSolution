# OpoRuta — Plan de Arquitectura

## Qué es
Plataforma SaaS para opositores al Cuerpo General Auxiliar de la Administración del Estado (C2).
Examen: 110 preguntas tipo test (30 teoría + 30 psicotécnicas + 50 ofimática), 90 minutos, penalización -1/3.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.1.6 (Turbopack) + React 19 + Tailwind CSS v4 |
| Backend | Next.js API Routes (serverless, Node.js) |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| IA | OpenAI (primario) + Anthropic (fallback) via `lib/ai/provider.ts` |
| Pagos | Stripe (modo LIVE, pago único, no suscripción) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Logging | Pino (JSON en prod) |
| Deploy | Vercel Hobby |
| Tests | Vitest (455+ tests unitarios) |

## Arquitectura de IA

```
Consumidores (API routes)
    ↓
provider.ts  ← punto único de entrada
    ↓
┌──────────┐    ┌──────────────┐
│ openai.ts │ ←→ │ anthropic.ts │  (circuit breaker + auto-fallback)
└──────────┘    └──────────────┘
```

- `AI_PRIMARY_PROVIDER=openai` en producción
- SDK clients lazy-init (no crash si falta API key)
- Funciones: `callAI`, `callAIJSON`, `callAIMini`, `callAIStream`
- Streaming para UX (primer token <500ms)

## Modelo de negocio (Freemium)

### Gratis
- 5 tests IA en 3 temas (1, 11, 17)
- 3 psicotécnicos
- 3 simulacros oficiales
- 3 caza-trampas/día
- 2 análisis detallados

### Pack Oposición (49,99€ pago único)
- Tests ilimitados en 28 temas
- Simulacros y psicotécnicos ilimitados
- 20 análisis detallados + Radar del Tribunal
- Rate limits anti-abuso (20 tests/día, 10 sim/día)

### Recarga (8,99€)
- +10 análisis detallados

### Fundador (24,99€ — limitado a 20 plazas)
- Todo el Pack Oposición + 30 análisis + badge Fundador

## Módulos funcionales

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Tests IA | /tests | Generación IA por tema (Bloque I legislación, Bloque II ofimática) |
| Psicotécnicos | /psicotecnicos | Motor determinista (ortografía, series, comprensión) |
| Simulacros | /simulacros | Preguntas oficiales INAP (2018-2024), penalización real |
| Flashcards | /flashcards | Spaced repetition auto-generadas de errores |
| Caza-Trampas | /cazatrampas | Encontrar errores en textos legales modificados |
| Reto Diario | /reto-diario | Caza-trampas comunitario diario (cron 00:05 UTC) |
| Radar Tribunal | /radar | Ranking de artículos más preguntados en INAP |
| Logros | /logros | Gamificación (rachas, hitos, notas) |
| BOE Watcher | cron 07:00 | Alertas de cambios legislativos relevantes |
| Admin | /admin | Analytics + Economics + Infrastructure |

## Base de datos

25 migrations aplicadas. Tablas principales:
- `profiles` — usuario + oposicion_id + créditos + is_admin
- `tests_generados` — tests con preguntas, respuestas, puntuación
- `preguntas_oficiales` — banco de preguntas INAP reales
- `flashcards` — spaced repetition
- `cazatrampas_sesiones` — ejercicios caza-trampas
- `compras` — transacciones Stripe
- `api_usage_log` — tracking de costes IA
- `logros` — achievements desbloqueados
- `notificaciones` — alertas BOE

## Seguridad

- RLS en todas las tablas (users solo ven sus datos)
- `createServiceClient()` para bypass RLS en admin/webhooks
- CSP + HSTS + X-Frame-Options via proxy.ts
- Rate limiting por usuario y endpoint (Upstash)
- RGPD: export + delete + anonimización fiscal
- Stripe webhook idempotente (INSERT-first en stripe_events_processed)
- No Edge Functions (solo serverless Node.js)

## Infraestructura Vercel Hobby

- 2 crons máx: boe-watch + reto-diario
- 100k invocaciones/mes
- 10s timeout serverless (streaming para IA)
- check-costs manual hasta Pro

## Decisiones arquitectónicas clave

1. **No suscripción** → pago único (reduce fricción para opositores)
2. **OpenAI primario** → más fiable, Anthropic como fallback
3. **Streaming** → UX de primer token rápido, crédito solo al completar
4. **No Edge Functions** → evita bugs de deploy en Vercel
5. **Turbopack obligatorio** → Tailwind v4 no funciona con webpack
6. **Freemium con gating real** → RPCs en BD, no solo UI
7. **Motor determinista para psicotécnicos** → no gastar tokens IA
8. **Simulacros sin IA** → preguntas oficiales reales de INAP
