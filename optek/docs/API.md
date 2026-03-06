# OpoRuta API Reference

All endpoints are served from `/api/`. Unless noted otherwise, requests and responses use JSON (`Content-Type: application/json`).

---

## AI Endpoints

### POST /api/ai/generate-test

Generate a verified multiple-choice test.

| Field | Details |
|-------|---------|
| **Auth** | Required (Supabase session) |
| **Rate limit** | Free: 5 tests total + 5 req/min anti-spam. Paid: 20 tests/day |

**Request body:**

```json
{
  "tipo": "tema" | "psicotecnico" | "radar",
  "temaId": "uuid (required for tipo=tema)",
  "numPreguntas": 1-30,
  "dificultad": "facil" | "media" | "dificil"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "preguntas": [
    {
      "enunciado": "string",
      "opciones": ["A", "B", "C", "D"],
      "correcta": 0-3,
      "explicacion": "string",
      "dificultad": "facil|media|dificil",
      "cita": { "ley": "string", "articulo": "string", "apartado": "string", "textoExacto": "string" }
    }
  ],
  "temaId": "uuid|null",
  "promptVersion": "2.1.0",
  "createdAt": "ISO timestamp"
}
```

**Error codes:**

| Status | Code | Meaning |
|--------|------|---------|
| 400 | - | Invalid input |
| 401 | - | Not authenticated |
| 402 | `PAYWALL_TESTS` | Free test quota exhausted (5 tests) |
| 402 | `PAYWALL_RADAR` | Radar is premium-only |
| 409 | - | Test already in progress (concurrency guard, 30s window) |
| 429 | - | Rate limit exceeded (Retry-After header included) |
| 503 | - | AI service unavailable (circuit breaker open) or Radar data not built |
| 500 | - | Internal error |

---

### POST /api/ai/correct-desarrollo

Correct a written essay using Claude Sonnet.

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 3 req/min anti-spam, 5 corrections/day |
| **Credits** | Consumes 1 `corrections_balance` (paid) or 1 `free_corrector_used` (free, max 2) |

**Request body:**

```json
{
  "texto": "string (50-5000 chars)",
  "temaId": "uuid"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "puntuacion": 0-10,
  "evaluacion": { ... },
  "citasVerificadas": [ ... ],
  "promptVersion": "1.8.0"
}
```

**Error codes:**

| Status | Code | Meaning |
|--------|------|---------|
| 402 | `PAYWALL_CORRECTIONS` | No corrections available |
| 409 | - | Correction already in progress |
| 429 | - | Rate limit exceeded |
| 503 | - | AI service unavailable |

---

### POST /api/ai/explain-errores

Explain errors from a completed simulacro using Claude Haiku (Socratic method).

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 3 req/min, 5 explanations/day |
| **Credits** | Consumes 1 correction credit |
| **Cost** | ~0.03 EUR/session |

**Request body:**

```json
{
  "testId": "uuid"
}
```

**Response (200):**

```json
{
  "explicaciones": [
    {
      "numero": 1,
      "enunciado": "string",
      "tuRespuesta": 0-3,
      "correcta": 0-3,
      "explicacion": "empatia + pregunta_guia + revelacion + anclaje"
    }
  ]
}
```

**Error codes:** Same as correct-desarrollo, plus 404 if test not found, 400 if test not completed or not a simulacro.

---

### POST /api/ai/explain-errores/stream

Streaming version of explain-errores. Returns explanations as a text stream (first token <500ms vs 3-5s batch latency).

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 3 req/min |
| **Credits** | Consumes 1 correction credit (deducted only on stream completion) |
| **Cost** | ~0.03 EUR/session |

**Request body:** Same as POST /api/ai/explain-errores.

**Response (200):** `Content-Type: text/plain; charset=utf-8` — ReadableStream of plain text. The prompt uses `SYSTEM_EXPLAIN_ERRORES_STREAM` (plain text, not JSON) with Socratic 4-step format.

**Error codes:** Same as POST /api/ai/explain-errores.

**Notes:**
- Credit is deducted only when the stream completes successfully (BUG-010 pattern)
- Used by `ExplicarErroresPanel` component for real-time streaming UX
- Falls back to batch endpoint if streaming fails

---

### POST /api/ai/generate-simulacro

Generate a simulacro from official INAP exam questions (no AI call, deterministic).

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 10 simulacros/day |
| **Credits** | None -- simulacros are free |

**Request body:**

```json
{
  "examenId": "uuid (optional)",
  "anno": 2019-2099,
  "numPreguntas": 1-110,
  "incluirPsicotecnicos": false,
  "dificultadPsico": 1 | 2 | 3,
  "modo": "anio" | "mixto"
}
```

Either `examenId`, `anno`, or `modo=mixto` is required.

**Response (200):**

```json
{
  "id": "uuid",
  "preguntas": [ ... ],
  "temaId": null,
  "examenId": "uuid",
  "promptVersion": "oficial-1.0",
  "createdAt": "ISO timestamp"
}
```

---

### POST /api/ai/generate-repaso

Generate an error-review test from the user's previously failed questions (deterministic, no AI).

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 10 reviews/day |
| **Credits** | None -- reviews are free |

**Request body:** Empty `{}` (no input required).

**Response (200):**

```json
{
  "id": "uuid",
  "preguntas": [ ... ],
  "preguntasCount": 3-20,
  "totalFalladas": 15,
  "promptVersion": "repaso-1.0",
  "createdAt": "ISO timestamp"
}
```

**Error codes:**

| Status | Meaning |
|--------|---------|
| 404 | No completed tests yet, or fewer than 3 failed questions |
| 429 | Daily limit reached |

---

## Test Management

### POST /api/tests/{id}/finalizar

Submit answers and finalize a test.

| Field | Details |
|-------|---------|
| **Auth** | Required (must own the test) |

**Request body:**

```json
{
  "respuestas": [0, 1, null, 3, ...],
  "puntuacion": 0-100
}
```

**Response (200):**

```json
{
  "ok": true,
  "puntuacion": 75,
  "nuevosLogros": ["primer_test", "racha_3"]
}
```

Side effects (background, non-blocking):
- Updates streak and checks/grants achievements
- Auto-generates up to 3 flashcards from incorrect answers (type=test only)
- Records incorrect questions for Weakness-Weighted RAG

---

### POST /api/tests/reportar-pregunta

Report an incorrect or confusing question.

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Request body:**

```json
{
  "testId": "uuid",
  "preguntaIndex": 0,
  "motivo": "string (5-500 chars)"
}
```

**Response (201):** `{ "ok": true }`

---

## Caza-Trampas (Trap Hunt)

### POST /api/cazatrampas/generate

Generate a Caza-Trampas session (find injected errors in legal text).

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | Free: 3/day. Paid: unlimited |

**Request body:**

```json
{
  "temaId": "uuid (optional)",
  "numErrores": 1 | 2 | 3
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "texto_trampa": "string",
  "numErrores": 3,
  "leyNombre": "LPAC",
  "articuloNumero": "53",
  "tituloCap": "string"
}
```

---

### POST /api/cazatrampas/{id}/grade

Grade user's detections (100% deterministic).

| Field | Details |
|-------|---------|
| **Auth** | Required (must own the session) |

**Request body:**

```json
{
  "detecciones": [
    {
      "valor_trampa_detectado": "string",
      "valor_original_propuesto": "string"
    }
  ]
}
```

**Response (200):**

```json
{
  "puntuacion": 66.67,
  "aciertos": 2,
  "total": 3,
  "detalles": [ ... ],
  "erroresReales": [ ... ]
}
```

---

## Reto Diario (Daily Challenge)

### GET /api/reto-diario

Get today's community challenge and the user's result (if already played).

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Response (200):**

```json
{
  "reto": {
    "id": "uuid",
    "fecha": "2026-03-03",
    "ley_nombre": "LPAC",
    "articulo_numero": "53",
    "texto_trampa": "string",
    "num_errores": 3
  },
  "resultado": null,
  "stats": { "total_jugadores": 42 }
}
```

If the cron did not generate today's challenge, it is created on-demand (fallback).

---

### POST /api/reto-diario/submit

Submit answer for today's challenge. One submission per user per day.

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Request body:**

```json
{
  "reto_id": "uuid",
  "detecciones": [
    { "valor_trampa_detectado": "string", "valor_original_propuesto": "string" }
  ]
}
```

**Response (200):**

```json
{
  "puntuacion": 100.0,
  "aciertos": 3,
  "total": 3,
  "detalles": [ ... ],
  "errores_reales": [ ... ],
  "stats": { "total_jugadores": 43 }
}
```

**Error codes:**

| Status | Meaning |
|--------|---------|
| 404 | Challenge not found |
| 409 | Already played today |
| 410 | Challenge expired (not today's) |

---

## Flashcards

### PUT /api/flashcards/{id}/review

Update a flashcard's spaced repetition interval after review.

| Field | Details |
|-------|---------|
| **Auth** | Required (must own the flashcard) |

**Request body:**

```json
{
  "calidad": "mal" | "dificil" | "bien" | "facil"
}
```

**Response (200):**

```json
{
  "intervalo_dias": 7,
  "siguiente_repaso": "2026-03-10"
}
```

---

## Notifications

### GET /api/notifications

Get the user's latest 20 notifications (unread first).

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Response (200):**

```json
[
  {
    "id": "uuid",
    "tipo": "boe_cambio",
    "titulo": "string",
    "mensaje": "string",
    "url_accion": "string|null",
    "leida": false,
    "created_at": "ISO timestamp"
  }
]
```

---

### PATCH /api/notifications

Mark a notification as read.

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Request body:**

```json
{
  "id": "uuid"
}
```

**Response (200):** `{ "ok": true }`

---

## Stripe Endpoints

### POST /api/stripe/checkout

Create a Stripe Checkout session and return the payment URL.

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Request body:**

```json
{
  "tier": "pack" | "recarga" | "fundador",
  "temaId": "uuid (optional)",
  "oposicionId": "uuid (optional)"
}
```

**Response (200):**

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Error codes:**

| Status | Meaning |
|--------|---------|
| 410 | Founder slots exhausted |
| 503 | Price not configured in environment |

---

### POST /api/stripe/webhook

Stripe webhook receiver. Not called by the application directly.

| Field | Details |
|-------|---------|
| **Auth** | Stripe signature verification (`stripe-signature` header) |
| **Idempotency** | INSERT-first into `stripe_events_processed` (unique on `stripe_event_id`) |

**Handled events:**

- `checkout.session.completed` -- records purchase, grants corrections, activates founder badge
- `customer.subscription.created` -- records subscription
- `customer.subscription.updated` -- updates subscription status
- `customer.subscription.deleted` -- marks subscription as cancelled
- `payment_intent.succeeded` -- logged
- `charge.failed` -- logged as warning

---

### POST /api/stripe/portal

Redirect to Stripe Customer Portal for payment history and invoices.

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Response (200):** `{ "url": "https://billing.stripe.com/..." }`

**Error codes:** 404 if user has no `stripe_customer_id` (never purchased).

---

## User Endpoints

### DELETE /api/user/delete

Delete user account (GDPR right to erasure).

| Field | Details |
|-------|---------|
| **Auth** | Required |

Anonymizes purchase records (`user_id -> NULL`) for tax compliance (LGT 4 years), then cascade-deletes all other data including the auth user.

**Response (200):** `{ "message": "Cuenta eliminada correctamente" }`

---

### GET /api/user/export

Export all user data as downloadable JSON (GDPR right to portability, Art. 20).

| Field | Details |
|-------|---------|
| **Auth** | Required |

**Response (200):** JSON file download containing profile, tests, corrections, purchases, subscriptions, reports, and achievements.

---

### POST /api/user/feedback

Submit feedback, bug reports, or feature requests.

| Field | Details |
|-------|---------|
| **Auth** | Required |
| **Rate limit** | 5/day |

**Request body:**

```json
{
  "tipo": "sugerencia" | "error" | "funcionalidad" | "otro",
  "mensaje": "string (10-2000 chars)",
  "pagina_origen": "string (optional)"
}
```

**Response (201):** `{ "id": "uuid" }`

Side effect: sends email notification to admin (fire-and-forget).

---

## Admin Endpoints

### GET /api/admin/infrastructure

Get infrastructure metrics (cached 5 minutes).

| Field | Details |
|-------|---------|
| **Auth** | Required + `is_admin = true` |

**Response (200):**

```json
{
  "dbSizeBytes": 12345678,
  "dbSizeHuman": "11.77 MB",
  "dbUsagePercent": 2.35,
  "totalUsers": 150,
  "totalTests": 3400,
  "totalCompras": 45,
  "apiCallsToday": 120,
  "apiCostTodayCents": 45.2
}
```

---

## Cron Endpoints

All cron endpoints require `Authorization: Bearer $CRON_SECRET`.

### GET /api/cron/boe-watch

Check BOE for legislative changes affecting tracked laws. Also piggybacks a daily cost check.

| Field | Details |
|-------|---------|
| **Schedule** | Daily at 07:00 UTC (Vercel Cron) |
| **Auth** | CRON_SECRET |

**Response (200):**

```json
{
  "ok": true,
  "boe": { ... },
  "costs": { ... }
}
```

---

### GET /api/cron/generate-reto-diario

Generate the daily community Caza-Trampas challenge. Idempotent (skips if today's challenge exists).

| Field | Details |
|-------|---------|
| **Schedule** | Daily at 00:05 UTC (Vercel Cron) |
| **Auth** | CRON_SECRET |

**Response (200):**

```json
{
  "ok": true,
  "skipped": false,
  "fecha": "2026-03-03",
  "id": "uuid"
}
```

---

### GET /api/cron/check-costs

Manual cost and infrastructure check endpoint.

| Field | Details |
|-------|---------|
| **Schedule** | Manual only (Hobby plan: 2 cron limit) |
| **Auth** | CRON_SECRET |
| **Query params** | `?date=YYYY-MM-DD` (optional, defaults to today) |

**Response (200):** Cost check result object.

---

## Health and Info

### GET /api/health

Health check with connectivity verification for all external services.

| Field | Details |
|-------|---------|
| **Auth** | None |
| **Cache** | 30s (public) |

**Response (200 or 503):**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": {
    "database": "ok" | "error" | "degraded",
    "anthropic": "ok" | "degraded",
    "openai": "ok" | "degraded",
    "stripe": "ok" | "degraded",
    "resend": "ok" | "degraded",
    "upstash": "ok" | "error" | "degraded"
  },
  "latency_ms": 150
}
```

Returns 503 only when the database is down (critical). Other service failures return 200 with `"degraded"` status.

---

### GET /api/info

Public metadata about OpoRuta for LLM indexing. No authentication required.

**Response (200):** JSON with name, description, features, pricing, legislation covered, and URLs. Referenced from `llms.txt`.

---

### GET /api/boe/check-updates

Not implemented (stub, returns 501).
