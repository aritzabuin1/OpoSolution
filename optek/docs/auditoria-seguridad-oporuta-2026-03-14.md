# Auditoría de Seguridad — OpoRuta — 14 de marzo de 2026

## Resumen ejecutivo

- **Nivel de riesgo global**: MEDIO (antes de fixes) → BAJO (después)
- **Hallazgos**: 0 críticos, 5 altos, 9 medios, 11 bajos
- **RGPD**: CUMPLE PARCIAL → CUMPLE (tras fixes aplicados)
- **Top 3 riesgos corregidos**:
  1. `/api/health/ai` sin autenticación costaba dinero real (OpenAI)
  2. DELETE/EXPORT de usuario incompletos (5 tablas faltantes, columnas incorrectas)
  3. Comparación de CRON_SECRET vulnerable a timing attacks

---

## Hallazgos por fase

### FASE 1: Secretos y Credenciales

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| S-01 | MEDIUM | Webhook secret parcialmente expuesto en stripe-health (8 chars) | **RESUELTO** — reemplazado por boolean `'Configured'` |
| S-02 | LOW | Password hardcodeado en `execution/setup-test-environment.ts:25` | PENDIENTE (script dev, no afecta producción) |
| S-03 | INFO | .gitignore cubre archivos sensibles correctamente | PASS |

### FASE 2: OWASP TOP 10

#### A01 — Control de acceso roto

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A01-01 | **HIGH** | `/api/health/ai` público sin auth — cada request cuesta dinero (AI API calls) | **RESUELTO** — añadida auth CRON_SECRET con timing-safe comparison |
| A01-02 | MEDIUM | `/api/debug/generate` no bloqueaba non-admin users | **RESUELTO** — añadido `if (!isAdmin) return 403` |
| A01-03 | LOW | Middleware excluye API routes del auth check (by design) | ACEPTADO (cada ruta implementa su propia auth) |
| A01-04 | LOW | `reportar-pregunta` puede crear reportes con test_id ajeno | PENDIENTE (bajo impacto — spam, no data leak) |

#### A02 — Fallos criptográficos

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A02-01 | MEDIUM | CRON_SECRET comparado con `!==` (vulnerable a timing attacks) | **RESUELTO** — `verifyCronSecret()` con `timingSafeEqual` en `lib/auth/cron-auth.ts`. Aplicado en 4 rutas: boe-watch, generate-reto-diario, check-costs, stripe-health |
| A02-02 | INFO | HTTPS/TLS y HSTS correctos | PASS |

#### A03 — Inyección

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A03-01 | INFO | Sin SQL injection (Supabase query builder) | PASS |
| A03-02 | LOW | `dangerouslySetInnerHTML` en 3 sitios — mitigado por `markdownToHtml()` escape y contenido hardcodeado | ACEPTADO |
| A03-03 | INFO | Prompt injection: `sanitizeForAI()` aplicada en todas las llamadas AI | PASS |

#### A04 — Diseño inseguro

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A04-01 | MEDIUM | Sin rate limiting custom en login/register | ACEPTADO — Supabase GoTrue tiene rate limiting built-in (30/5min) |
| A04-02 | LOW | Error messages exponen detalles internos en debug/health endpoints | PENDIENTE (endpoints requieren auth) |

#### A05 — Configuración de seguridad incorrecta

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A05-01 | LOW | CSP falta `connect-src` para Stripe | PENDIENTE (Stripe usa redirect, no client-side API) |
| A05-02 | MEDIUM | Security headers no aplicados a API routes | PENDIENTE (JSON responses, bajo riesgo práctico) |
| A05-03 | LOW | CSP incluye `'unsafe-inline'` | ACEPTADO (requerido por Next.js + Meta Pixel) |

#### A06 — Componentes vulnerables

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A06-01 | MEDIUM | 10 vulnerabilidades npm (hono, undici, flatted, express-rate-limit) | **RESUELTO** — overrides actualizados: hono >=4.12.8, @hono/node-server >=1.19.10, flatted >=3.4.0, undici >=7.24.0, express-rate-limit >=8.2.2. `pnpm audit`: 0 vulnerabilities |

#### A07 — Fallos de autenticación

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A07-01 | MEDIUM | Password mínimo 6 chars (Supabase config) | PENDIENTE Aritz — cambiar en Supabase Dashboard a 8 chars + `letters_digits` |
| A07-02 | MEDIUM | `secure_password_change = false` | PENDIENTE Aritz — activar en Supabase Dashboard |
| A07-03 | MEDIUM | No se invalidan sesiones al cambiar password | PENDIENTE — requiere `signOut({ scope: 'global' })` en reset-password |
| A07-04 | LOW | Failed logins no logueados server-side | ACEPTADO — Supabase GoTrue logs cubre esto |
| A07-05 | LOW | Open redirect en login via `redirect` param | ACEPTADO — `router.push` solo navega internamente |

#### A08 — Fallos de integridad

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A08-01 | INFO | Lockfile commiteado | PASS |
| A08-02 | LOW | GitHub Actions no pinned a SHA | PENDIENTE (bajo riesgo para proyecto personal) |

#### A09 — Logging y monitorización

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A09-01 | **HIGH** | `redactPII()` definida pero nunca usada — logger sin protección PII | **RESUELTO** — integrado pino `redact` nativo con paths para email, password, token, apikey, api_key, secret, authorization (1 nivel y nested `*.*`) |
| A09-02 | LOW | `console.error` en client components sin monitoring | ACEPTADO — client-side, Sentry pendiente |
| A09-03 | LOW | Auth events no logueados a audit trail | PENDIENTE (Supabase GoTrue logs cubre baseline) |

#### A10 — SSRF

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| A10-01 | INFO | BOE scraper usa URLs hardcodeadas, no user input | PASS |
| A10-02 | INFO | No se detectó fetching de URLs suministradas por usuario | PASS |

### FASE 3: Seguridad IA/LLM

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| AI-01 | MEDIUM | System prompts sin protección anti-extracción | PENDIENTE — añadir anti-injection preamble (bajo riesgo: prompts no contienen secretos) |
| AI-02 | INFO | PII sanitization sólida (`sanitizeForAI()` en todos los endpoints) | PASS |
| AI-03 | INFO | Rate limiting completo en 10 endpoints AI | PASS |
| AI-04 | INFO | Timeouts configurados (OpenAI 55s, Anthropic 30s, BOE 10s) | PASS |
| AI-05 | INFO | AI responses validadas con Zod schemas | PASS |
| AI-06 | INFO | Circuit breaker activo con fallback automático | PASS |
| AI-07 | LOW | Validation error details en retry prompt | ACEPTADO (Zod output, no secrets) |

### FASE 4: RGPD

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| F-04 | MEDIUM | Política de cookies afirmaba "no usamos marketing cookies" pero Meta Pixel activo | **RESUELTO** — sección reescrita con tabla de cookies `_fbp`, `_fbc` de Meta |
| F-05 | **HIGH** | DELETE endpoint faltaban 5 tablas: flashcards, cazatrampas_sesiones, notificaciones, reto_diario_resultados, sugerencias | **RESUELTO** — 5 pasos explícitos añadidos antes de eliminar perfil |
| F-06 | **HIGH** | EXPORT query a tabla inexistente `reto_diario_participaciones` | **RESUELTO** — corregido a `reto_diario_resultados` con columnas reales |
| F-07 | **HIGH** | EXPORT columnas inexistentes en cazatrampas_sesiones | **RESUELTO** — corregido a `legislacion_id, texto_trampa, errores_reales, errores_detectados, puntuacion, completada_at` |
| F-08 | MEDIUM | EXPORT faltaba tabla sugerencias | **RESUELTO** — añadida query con `id, mensaje, created_at` |
| F-09 | LOW | `trackPixelEvent()` no re-verificaba consent | **RESUELTO** — añadido check `localStorage.getItem('oporuta_cookie_consent')` |
| F-10 | MEDIUM | Política de privacidad omitía Meta Platforms | **RESUELTO** — añadido Meta Platforms Ireland con EU-US DPF, finalidad conversion tracking |
| F-11 | LOW | Fecha política privacidad genérica | **RESUELTO** — "14 de marzo de 2026" |
| F-12 | LOW | Fecha política cookies desactualizada | **RESUELTO** — "14 de marzo de 2026" |
| F-13 | INFO | Cookie banner con accept + reject | PASS |
| F-14 | INFO | INCIDENT_RESPONSE.md completo (AEPD 72h) | PASS |

### FASE 5: Configuración de producción

| # | Sev. | Hallazgo | Estado |
|---|------|----------|--------|
| F-15 | INFO | Sin test keys hardcodeadas | PASS |
| F-16 | INFO | Sin localhost URLs en producción | PASS |
| F-17 | INFO | NEXT_PUBLIC_APP_URL fallback a oporuta.es | PASS |
| F-18 | MEDIUM | Stripe webhook secret parcial en health check | **RESUELTO** (= S-01) |

---

## Estado RGPD

| Requisito | Estado |
|-----------|--------|
| 4.1 Inventario datos personales | ✅ Cumple |
| 4.2 Base legal (consentimiento cookies) | ✅ Cumple |
| 4.3 Derecho de acceso | ✅ Cumple |
| 4.3 Derecho de supresión (Art. 17) | ✅ Cumple (tras fix F-05) |
| 4.3 Derecho de portabilidad (Art. 20) | ✅ Cumple (tras fixes F-06/F-07/F-08) |
| 4.4 Tracking con consentimiento | ✅ Cumple (tras fix F-09) |
| 4.5 Política de privacidad completa | ✅ Cumple (tras fix F-10) |
| 4.5 Política de cookies completa | ✅ Cumple (tras fix F-04) |
| 4.6 Seguridad del tratamiento (Art. 32) | ✅ Cumple (TLS, RLS, logger redact) |
| 4.7 Protocolo notificación brechas (Art. 33-34) | ✅ Cumple (INCIDENT_RESPONSE.md) |

---

## Plan de remediación

### P0 — CRÍTICO (resueltos en esta auditoría)
Ningún hallazgo crítico.

### P1 — ALTO (resueltos en esta auditoría)
1. ~~A01-01~~ `/api/health/ai` protegido con CRON_SECRET
2. ~~F-05~~ DELETE endpoint cubre las 13 tablas con user_id
3. ~~F-06/F-07~~ EXPORT queries corregidas (tabla + columnas)
4. ~~A09-01~~ Logger pino con redact paths nativos
5. ~~A06-01~~ 0 vulnerabilidades npm

### P2 — MEDIO (pendientes Aritz)
1. **A07-01/02**: Supabase Dashboard → Auth Settings → `min_password_length: 8`, `password_requirements: letters_digits`, `secure_password_change: true`
2. **A07-03**: Añadir `signOut({ scope: 'global' })` tras password change en `reset-password/page.tsx`
3. **AI-01**: Anti-injection preamble en system prompts (bajo riesgo pero buena práctica)
4. **A05-02**: Security headers en API routes (mejora defensa en profundidad)

### P3 — BAJO (mejoras futuras)
1. A08-02: Pin GitHub Actions a SHA
2. A09-02: Integrar Axiom/Sentry para client-side errors
3. A01-04: Validar ownership en reportar-pregunta
4. S-02: Password de test en execution script → env var

---

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `lib/auth/cron-auth.ts` | **NUEVO** — `verifyCronSecret()` con `timingSafeEqual` |
| `app/api/health/ai/route.ts` | Auth CRON_SECRET + timing-safe comparison |
| `app/api/debug/generate/route.ts` | Gate admin: `if (!isAdmin) return 403` |
| `app/api/cron/boe-watch/route.ts` | Migrado a `verifyCronSecret()` |
| `app/api/cron/generate-reto-diario/route.ts` | Migrado a `verifyCronSecret()` |
| `app/api/cron/check-costs/route.ts` | Migrado a `verifyCronSecret()` |
| `app/api/admin/stripe-health/route.ts` | Migrado a `verifyCronSecret()` + webhook secret boolean |
| `app/api/user/delete/route.ts` | +5 tablas: flashcards, cazatrampas, notificaciones, reto_diario_resultados, sugerencias |
| `app/api/user/export/route.ts` | Fix tabla `reto_diario_resultados`, fix columnas `cazatrampas_sesiones`, +sugerencias |
| `lib/logger/index.ts` | Pino `redact` paths integrado (email, password, token, secret, etc.) |
| `lib/analytics/pixel.ts` | Re-check consent en `trackPixelEvent()` |
| `app/(marketing)/legal/cookies/page.tsx` | Sección Meta Pixel cookies + fecha actualizada |
| `app/(marketing)/legal/privacidad/page.tsx` | Meta Platforms como tercero + fecha actualizada |
| `package.json` | Overrides: hono ≥4.12.8, @hono/node-server ≥1.19.10, flatted ≥3.4.0, undici ≥7.24.0, express-rate-limit ≥8.2.2 |
| `pnpm-lock.yaml` | Actualizado con nuevos overrides |

**Verificación**: `tsc --noEmit` limpio, 524/524 tests pasan, `pnpm audit` 0 vulnerabilities.

---

## Coste de no arreglar (P1 ya resueltos)

| Hallazgo | Escenario si no se arregla |
|----------|---------------------------|
| A01-01 (health/ai sin auth) | Atacante envía 10k requests → $100-500 en API costs. Financial DoS sin ninguna barrera |
| F-05 (DELETE incompleto) | Usuario ejerce derecho de supresión → flashcards, cazatrampas y sugerencias persisten → Multa RGPD Art. 83.5: hasta 20M€ o 4% facturación |
| F-06/F-07 (EXPORT roto) | AEPD inspecciona → export falla → incumplimiento Art. 20 portabilidad → Multa RGPD |
| A09-01 (logger sin PII redact) | Email o token aparece en Vercel logs → breach notificable → 72h AEPD + comunicación afectados |
| A06-01 (10 vulns npm) | Shadcn/dev tool comprometido → supply chain risk (bajo, pero auditor externo lo flagea) |
