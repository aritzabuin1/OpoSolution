# OpoRuta Operations Guide

## Deployment

### Process

OpoRuta is deployed on **Vercel** (Hobby plan). The deployment process is:

1. Push to `main` branch
2. Vercel auto-builds with `next build` (Turbopack)
3. Deployment preview URL is generated
4. If the build succeeds, production is updated at `oporuta.es`

There is no staging environment. Preview deployments on feature branches serve as staging.

### Important Constraints

- **Vercel Hobby plan**: max 2 cron jobs, no edge middleware analytics, 10s serverless function timeout (default), 60s max.
- **Turbopack required**: Tailwind CSS v4 does not work with webpack in production. The project must use Next.js 16+ with Turbopack (default build tool).
- **No Edge Functions**: All routes run as serverless Node.js functions. Edge Functions caused deployment failures during Vercel infrastructure incidents.
- **Sentry disabled**: Incompatible with Turbopack. Re-enable when Sentry adds Turbopack support.
- **PWA disabled**: `@serwist/next` removed for Turbopack compatibility. Re-enable on Pro plan.

---

## Environment Variables

All variables are configured in Vercel Dashboard > Settings > Environment Variables.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | `eyJ...` |
| `ANTHROPIC_API_KEY` | Anthropic API key (Claude) | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key (GPT, embeddings) | `sk-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_PACK` | Stripe Price ID for Pack Oposicion | `price_...` |
| `STRIPE_PRICE_RECARGA` | Stripe Price ID for Recarga | `price_...` |
| `STRIPE_PRICE_FOUNDER` | Stripe Price ID for Founder tier | `price_...` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | `AX...` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `ALERT_EMAIL` | Email for cost/infra alerts | `admin@oporuta.es` |
| `CRON_SECRET` | Secret for authenticating cron endpoints | Random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://oporuta.es` |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (disabled) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID |

---

## Supabase Migrations

Migrations are in `supabase/migrations/`. They must be applied manually via the Supabase Dashboard SQL Editor (no CLI integration on the remote instance).

### Applied Migrations

Migrations 001-015 have been applied to the remote Supabase instance.

### Migrations 016-023 (Applied 2026-03-03)

| Migration | Description |
|-----------|-------------|
| 016 | Advanced achievements (logros) |
| 017 | Caza-Trampas tables |
| 018 | Notifications table |
| 019 | Admin role + Founder pricing |
| 020 | Reto Diario tables |
| 021 | Exam model A/B |
| 022 | Radar del Tribunal |
| 023 | Infrastructure monitoring RPC |

### How to Apply a Migration

1. Open the Supabase Dashboard for the project
2. Go to SQL Editor
3. Open the migration file (e.g., `20260228_016_logros_avanzados.sql`)
4. Copy the entire content
5. Paste into the SQL Editor and run
6. Verify success (no errors)
7. If a rollback is needed, use the corresponding `.down.sql` file

### After Applying Migrations

- Run `pnpm build:radar` after applying migration 022 (Radar del Tribunal)
- Regenerate TypeScript types if needed (the codebase uses `as any` casts for tables without generated types)

---

## Cron Jobs

### Active Crons (Vercel)

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/boe-watch` | `0 7 * * *` (07:00 UTC daily) | Checks BOE for legislative changes + piggybacks daily cost/infra check |
| `/api/cron/generate-reto-diario` | `5 0 * * *` (00:05 UTC daily) | Generates the daily community Caza-Trampas challenge |

### Manual Crons

The check-costs cron was removed from `vercel.json` to respect the 2-cron Hobby plan limit. It runs piggybacked on `boe-watch` at 07:00 UTC.

To run manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://oporuta.es/api/cron/check-costs

# Check a specific date:
curl -H "Authorization: Bearer $CRON_SECRET" "https://oporuta.es/api/cron/check-costs?date=2026-03-01"
```

### Restoring check-costs as a Cron

When upgrading to Vercel Pro, add to `vercel.json`:

```json
{ "path": "/api/cron/check-costs", "schedule": "0 23 * * *" }
```

---

## Monitoring

### Health Check

```bash
curl https://oporuta.es/api/health
```

Returns status of all external services (database, Anthropic, OpenAI, Stripe, Resend, Upstash). Returns 503 only if the database is unreachable.

### Admin Dashboard

Available at `/admin` (requires `is_admin = true` in the `profiles` table). Includes:

- **Economics page**: API costs, revenue metrics, Stripe events
- **Infrastructure page**: Database size, user count, test count, API calls

### Infrastructure Metrics API

```bash
# Requires admin authentication via browser session
GET /api/admin/infrastructure
```

Cached for 5 minutes (`unstable_cache`). Returns DB size, usage percent, user/test/purchase counts, and daily API costs.

### Cost Tracking

Costs are tracked in the `api_usage_log` table with estimated cost per API call. The `runCostCheck()` function analyzes daily costs and sends email alerts via Resend if thresholds are exceeded.

---

## Backup Strategy

### Supabase Automated Backups

- **Free plan**: Daily backups, 7-day retention
- **Pro plan**: Point-in-time recovery (PITR)
- **RPO target**: 24 hours (Free), minutes (Pro with PITR)
- **RTO target**: < 1 hour (Supabase restore)

### What is Not Backed Up

- Vercel environment variables (document separately)
- Stripe product/price configuration (recreate manually)
- Redis rate limit state (ephemeral, regenerates naturally)

### Manual Export

For critical data, use the Supabase Dashboard to export tables as CSV, or query the database directly.

---

## Rollback Procedure

### Application Rollback (Vercel)

1. Go to Vercel Dashboard > Deployments
2. Find the last known good deployment
3. Click the three-dot menu > "Promote to Production"
4. The previous deployment is instantly promoted (no rebuild)

### Database Rollback

1. For migration rollback: run the corresponding `.down.sql` file in the Supabase SQL Editor
2. For data restore: use Supabase Dashboard > Database > Backups
3. On Pro plan: use Point-in-Time Recovery to restore to a specific timestamp

### Stripe Rollback

Stripe state (products, prices, webhook config) is managed in the Stripe Dashboard. No automated rollback. Keep documentation of product/price IDs.

---

## Incident Response Playbook

### 1. AI Service Down (Claude or OpenAI)

**Symptoms**: 503 responses from `/api/ai/*`, circuit breaker OPEN in logs.

**Action**:
1. Check Anthropic/OpenAI status pages
2. Circuit breaker auto-recovers after 60s (HALF_OPEN state)
3. If persistent, check API key validity
4. Fallback: Claude and OpenAI are separate circuit breakers; one can fail independently

### 2. Database Unreachable

**Symptoms**: `/api/health` returns 503, all endpoints fail.

**Action**:
1. Check Supabase status page
2. Verify Supabase project is not paused (free tier pauses after inactivity)
3. Check connection pool limits (PgBouncer)
4. If Supabase is down, wait for recovery (no local fallback)

### 3. Stripe Webhook Failures

**Symptoms**: Purchases not being recorded, corrections not granted.

**Action**:
1. Check Stripe Dashboard > Developers > Webhooks > Attempts
2. Stripe retries automatically (up to 3 days)
3. Idempotency is guaranteed: re-delivered events are safely skipped
4. Manual fix: find the `checkout.session.completed` event and trigger manual processing

### 4. Rate Limit Storms

**Symptoms**: Many 429 responses, users complaining.

**Action**:
1. Check Upstash Redis dashboard for unusual patterns
2. Rate limits auto-reset after their window (1 min or 24 hours)
3. If a specific user is causing issues, check the `api_usage_log`
4. Temporary fix: increase limits in `checkRateLimit()` calls

### 5. Vercel Build Failures

**Symptoms**: Deployment fails, production stays on previous version.

**Action**:
1. Check Vercel build logs
2. Common cause: TypeScript errors. Run `pnpm type-check` locally
3. "Deploying outputs" error = Vercel infrastructure issue. Check https://www.vercel-status.com
4. Never use `export const runtime = 'edge'` -- it causes deployment failures

### 6. Cost Spike

**Symptoms**: Alert email from `runCostCheck()`, or manual check shows high costs.

**Action**:
1. Check `api_usage_log` for unusual patterns (endpoint, user_id, cost)
2. Check if a specific user is abusing the free tier
3. Rate limits should prevent abuse, but check if they are configured correctly
4. Emergency: temporarily set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to invalid values to block AI calls

---

## Common Issues and Fixes

### "Deploying outputs" Error on Vercel

This is a Vercel infrastructure issue, not a code error. Check https://www.vercel-status.com. Wait and retry.

### Tailwind CSS Not Working in Production

Tailwind CSS v4 requires Turbopack. Make sure `next build` is using Turbopack (default in Next.js 16+). Do not switch to webpack.

### TypeScript Errors for New Tables

Tables added in migrations 016-023 do not have generated TypeScript types. Use `(supabase as any).from('table_name')` until types are regenerated.

### Stripe Webhook Not Receiving Events

1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check that the webhook endpoint URL is `https://oporuta.es/api/stripe/webhook`
3. Check Stripe Dashboard > Developers > Webhooks for delivery attempts
4. In development, use `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Supabase Auth Emails Not Sending

Configure custom SMTP with Resend in Supabase Dashboard:
- Authentication > Email Templates
- Settings > Auth > SMTP Settings (use Resend SMTP credentials)
- Settings > General > Site URL: `https://oporuta.es`
- Settings > Auth > Redirect URLs: add `https://oporuta.es/**`

### PDF Parsing Fails for Scanned Exams

The `parse-exam-pdf.ts` script uses OpenAI Vision for scanned PDFs (< 500 chars of extractable text). For the 2018 exam, use:

```bash
pnpm parse:examenes 2018
```

This triggers the Anthropic documents API (`type: 'document'`) fallback for scanned PDFs.
