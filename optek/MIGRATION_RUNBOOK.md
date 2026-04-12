# OpoRuta — Migration Runbook: Vercel → Railway

> Prepared 2026-04-12. Execute when Vercel free tier limits become blocking.
> Estimated total execution time: ~60–90 minutes (plus DNS propagation).

---

## Pre-flight Checklist

Before starting, confirm you have access to:

- [ ] [Railway Dashboard](https://railway.com/dashboard) (account created)
- [ ] [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
- [ ] [Supabase Dashboard](https://supabase.com/dashboard) → Auth → URL Configuration
- [ ] DNS registrar for `oporuta.es` (update this with your actual registrar)
- [ ] GitHub repo: `aritzabuin1/OpoSolution`
- [ ] Google Cloud Console (if Google OAuth is active)

---

## Environment Variables to Migrate

**27 variables total.** Copy from Vercel Dashboard → Settings → Environment Variables, or use `.env.example` as reference.

### Critical (app won't start without these)
| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `OPENAI_API_KEY` | OpenAI Platform |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | **Will change** — new value from Railway webhook |
| `CRON_SECRET` | Same value (random 32+ chars) |
| `NEXT_PUBLIC_APP_URL` | `https://oporuta.es` |

### Stripe Price IDs (11 total — same values, just copy)
| Variable | Product |
|----------|---------|
| `STRIPE_PRICE_PACK` | Pack C2 49,99€ |
| `STRIPE_PRICE_PACK_C1` | Pack C1 49,99€ |
| `STRIPE_PRICE_PACK_DOBLE` | Pack Doble 79,99€ |
| `STRIPE_PRICE_PACK_A2` | Pack GACE A2 69,99€ |
| `STRIPE_PRICE_PACK_TRIPLE` | Pack Triple AGE 129,99€ |
| `STRIPE_PRICE_RECARGA_SUP` | Recarga supuestos 14,99€ |
| `STRIPE_PRICE_PACK_CORREOS` | Pack Correos 49,99€ |
| `STRIPE_PRICE_PACK_AUXILIO` | Pack Auxilio C2 49,99€ |
| `STRIPE_PRICE_PACK_TRAMITACION` | Pack Tramitacion C1 49,99€ |
| `STRIPE_PRICE_PACK_GESTION_J` | Pack Gestion A2 79,99€ |
| `STRIPE_PRICE_PACK_DOBLE_JUSTICIA` | Doble Justicia 79,99€ |
| `STRIPE_PRICE_PACK_TRIPLE_JUSTICIA` | Triple Justicia 139,99€ |
| `STRIPE_PRICE_RECARGA` | Recarga analisis 8,99€ |

### Other services (same values, just copy)
| Variable | Source |
|----------|--------|
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `UPSTASH_REDIS_REST_URL` | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console |
| `RESEND_API_KEY` | Resend Dashboard |
| `ALERT_EMAIL` | `aritzabuin1@gmail.com` |
| `ADMIN_EMAIL` | `admin@oporuta.es` |

### Railway-specific (add these new ones)
| Variable | Value |
|----------|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `HOSTNAME` | `0.0.0.0` |

### Optional (only if active)
| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Only if Meta Pixel is active |
| Google OAuth env vars | Only if Google login is enabled |

---

## Cron Jobs to Migrate

**2 cron jobs**, currently in `vercel.json`:

| Cron | Schedule (UTC) | Purpose | Timeout needs |
|------|---------------|---------|---------------|
| `/api/cron/boe-watch` | `0 7 * * *` (7:00 AM) | BOE law changes + cost check + nurture emails | 55s internal timeout |
| `/api/cron/generate-reto-diario` | `5 0 * * *` (00:05 AM) | Daily challenge generation (1 rama per invocation) | 15-40s per rama |

**Railway cron approach**: Create a lightweight cron service that curls the main app's endpoints. Railway cron services must **exit after completion** — curl does this naturally.

---

## Phase 0 — Preparation (30 min before)

### 0.1 Backup env vars
```bash
# Option A: If you have Vercel CLI installed
vercel env pull .env.backup.production --environment=production

# Option B: Manual
# Vercel Dashboard → Settings → Environment Variables → copy all
```

### 0.2 Ensure branch is up to date
```bash
git checkout migration/railway
git merge main
# Resolve conflicts if any
git push origin migration/railway
```

### 0.3 Reduce DNS TTL (if possible)
In your DNS registrar for `oporuta.es`, reduce TTL to **60 seconds** at least 1-2 hours before the cutover. This ensures fast rollback if needed.

---

## Phase 1 — Deploy to Railway (15 min)

### 1.1 Create Railway project
1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub Repo**
2. Select `aritzabuin1/OpoSolution`
3. Set **Root Directory** to `optek` (critical — code lives in subdirectory)
4. Select branch `migration/railway`
5. Railway will detect the Dockerfile and start building (it will fail — missing env vars)

### 1.2 Configure environment variables
1. In Railway service → **Variables** tab
2. Click **Raw Editor** (bulk import)
3. Paste all variables from `.env.backup.production` (Railway accepts `.env` format)
4. Add Railway-specific variables:
   ```
   PORT=3000
   NODE_ENV=production
   HOSTNAME=0.0.0.0
   ```
5. **Important**: `STRIPE_WEBHOOK_SECRET` will change in Phase 4 — use the Vercel value for now

### 1.3 Trigger redeploy
1. After adding variables, Railway auto-redeploys
2. Wait for build to complete (2-5 min)
3. Check **Deploy Logs** — look for `Ready on http://0.0.0.0:3000`
4. If build fails, check logs for missing dependencies or env vars

---

## Phase 2 — Verify on Railway temporary domain (10 min)

Railway provides a temporary domain: `oporuta-production-XXXX.up.railway.app`

### 2.1 Smoke test checklist
- [ ] Home page loads (`/`)
- [ ] `/api/health` returns `{"status":"healthy"}`
- [ ] Login works (Supabase auth)
- [ ] Generate a test (CPU + AI working)
- [ ] Dashboard loads with data
- [ ] Admin panel accessible (`/admin`)
- [ ] Blog pages render (`/blog`)
- [ ] Images load correctly (next/image + sharp)
- [ ] No 500 errors in Railway logs

### 2.2 If something fails
**Do NOT proceed to Phase 3.** Users are still on Vercel. Debug here safely.

Common issues:
- **500 on all pages**: Missing critical env var (SUPABASE_URL, ANON_KEY)
- **Images broken**: Sharp not copying correctly — check Dockerfile COPY steps
- **Auth fails**: Supabase redirect URLs not configured yet (expected at this stage)
- **AI endpoints timeout**: Check OPENAI_API_KEY and ANTHROPIC_API_KEY are set

---

## Phase 3 — Create Cron Services (10 min)

Railway cron jobs run as **separate services** that start, execute, and exit.

### 3.1 BOE Watcher cron
1. In Railway project → **New Service** → **Empty Service**
2. Name: `cron-boe-watch`
3. Settings → **Cron Schedule**: `0 7 * * *`
4. Settings → **Start Command**:
   ```bash
   wget -qO- --header="Authorization: Bearer $CRON_SECRET" "https://$RAILWAY_PUBLIC_DOMAIN/api/cron/boe-watch" || true
   ```
   > Note: Use `$RAILWAY_PUBLIC_DOMAIN` which Railway injects automatically.
   > After DNS cutover, change to `https://oporuta.es/api/cron/boe-watch`.
5. Add shared variable: `CRON_SECRET` (same value as main service)
6. Use a minimal image — Settings → **Docker Image**: `alpine:3.19`

### 3.2 Reto Diario cron
1. **New Service** → **Empty Service**
2. Name: `cron-reto-diario`
3. **Cron Schedule**: `5 0 * * *`
4. **Start Command**:
   ```bash
   wget -qO- --header="Authorization: Bearer $CRON_SECRET" "https://$RAILWAY_PUBLIC_DOMAIN/api/cron/generate-reto-diario" || true
   ```
5. Add shared variable: `CRON_SECRET`
6. Docker Image: `alpine:3.19`

### 3.3 Verify crons
- Trigger one cron manually (Railway dashboard → **Run Now** or trigger button)
- Check main service logs for the cron request arriving
- Verify auth passes (no 401 in logs)

> **Note**: Railway cron precision is ~few minutes. Your endpoints are idempotent, so this is fine.

---

## Phase 4 — Update External Services (10 min)

### 4.1 Stripe webhook
1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. **Add endpoint**: `https://RAILWAY_DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed` (and any others currently configured)
3. Copy the new **Signing Secret** (`whsec_...`)
4. In Railway → Variables → update `STRIPE_WEBHOOK_SECRET` with the new value
5. **Do NOT delete** the Vercel webhook yet

### 4.2 Supabase auth redirects
1. [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://RAILWAY_DOMAIN/auth/callback`
   - `https://RAILWAY_DOMAIN/auth/confirm`
3. **Do NOT remove** Vercel URLs yet

### 4.3 Google OAuth (only if active)
1. Google Cloud Console → Credentials → OAuth 2.0 Client
2. Add to **Authorized redirect URIs**:
   - `https://RAILWAY_DOMAIN/auth/callback`
3. **Do NOT remove** Vercel URIs yet

---

## Phase 5 — Custom Domain on Railway (5 min)

### 5.1 Add domain
1. Railway Dashboard → Service Settings → **Domains**
2. Add **Custom Domain**: `oporuta.es`
3. Add **Custom Domain**: `www.oporuta.es` (redirects to non-www via next.config.ts)
4. Railway will show a **CNAME target** (e.g., `xxx.up.railway.app`) — note this down

### 5.2 Do NOT change DNS yet
Just note the CNAME target. We change DNS in the next phase.

---

## Phase 6 — DNS Cutover (the critical moment)

> **Timing**: Do this on a Tuesday/Wednesday morning. Never Friday afternoon.

### 6.1 Update DNS records
In your DNS registrar for `oporuta.es`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `@` (or root) | `xxx.up.railway.app` (from Phase 5) | 60 |
| CNAME | `www` | `xxx.up.railway.app` | 60 |

> **Note**: Some registrars don't allow CNAME on root. In that case, use Railway's IP address with an A record, or use a CNAME flattening service (Cloudflare does this automatically).

### 6.2 Wait for propagation
```bash
# Check DNS resolution
dig oporuta.es
# Or use https://dnschecker.org/#CNAME/oporuta.es
```

### 6.3 SSL certificate
Railway auto-provisions Let's Encrypt SSL within 1-5 minutes of DNS resolution.

### 6.4 Update cron URLs
Once DNS is working, update cron service start commands to use `oporuta.es` instead of `$RAILWAY_PUBLIC_DOMAIN`.

---

## Phase 7 — Final Verification (15 min)

### 7.1 Full smoke test on production domain
Open `https://oporuta.es` in incognito browser:
- [ ] Home page loads with correct branding
- [ ] SSL certificate valid (padlock icon)
- [ ] User registration works
- [ ] Login works (email + Google if active)
- [ ] Generate a test → verify AI response
- [ ] Complete a test → verify scoring + results page
- [ ] Dashboard shows correct data
- [ ] Admin panel metrics load
- [ ] Stripe checkout flow (use test card `4242 4242 4242 4242`)
- [ ] Check Railway logs — no unexpected errors

### 7.2 Verify Stripe webhook end-to-end
1. Complete a test purchase with Stripe test card
2. Verify webhook received in Railway logs
3. Verify `compras` table updated in Supabase

### 7.3 Verify cron execution
- Trigger each cron manually
- Or wait for scheduled execution and check logs

### 7.4 Monitor for 30 minutes
Watch Railway logs for:
- 500 errors
- Memory spikes
- Unexpected crashes
- Auth failures

---

## Phase 8 — Cleanup (after 48h stable)

### 8.1 Wait 48 hours
Keep Vercel running as fallback. If anything goes wrong, revert DNS.

### 8.2 After 48h stable
1. **Stripe**: Delete the old Vercel webhook endpoint
2. **Supabase**: Remove old Vercel redirect URLs
3. **Google OAuth**: Remove old Vercel redirect URIs
4. **Git**: Merge `migration/railway` into `main`:
   ```bash
   git checkout main
   git merge migration/railway
   git push
   ```
5. **Railway**: Update deployment branch from `migration/railway` to `main`
6. **Vercel**: Pause the project (don't delete yet — keep 2 more weeks as safety net)
7. **Vercel**: Delete after 2 weeks stable on Railway

---

## Emergency Rollback

If something goes critically wrong after DNS cutover:

### Immediate (< 2 min)
1. Revert DNS records to point to Vercel
2. If TTL was 60s, propagation takes ~1 minute
3. Users return to Vercel automatically

### Stripe
If you already changed `STRIPE_WEBHOOK_SECRET`:
1. Old Vercel webhook is still active (we didn't delete it)
2. Payments continue working on Vercel

### Supabase
Auth redirect URLs for both platforms are still configured — no action needed.

---

## Audit Results

### Vercel-specific code found
| Item | File | Impact |
|------|------|--------|
| `maxDuration = 60` | `api/cron/boe-watch/route.ts:9` | **No action needed** — Railway has no function timeout (persistent server). The internal 55s abort controller still provides safety. |
| `maxDuration = 60` | `api/cron/generate-reto-diario/route.ts:11` | Same — harmless on Railway |
| `vercel.json` crons | `vercel.json` | **Replaced** by Railway cron services (Phase 3) |
| `THRESHOLDS.vercel` | `lib/admin/infrastructure.ts` | **Updated** — detects `RAILWAY_ENVIRONMENT` and skips invocation limit metric |
| `vercel-build` script | `package.json:9` | **Harmless** — Railway uses Dockerfile, not this script |
| Vercel comments | Various files | **Cosmetic** — no functional impact |

### NOT found (good news)
- Zero `@vercel/*` package imports
- Zero `export const runtime = 'edge'` declarations
- Zero Vercel KV / Postgres / Blob usage
- Zero Vercel-specific middleware APIs
- Middleware (`proxy.ts`) is 100% Node.js compatible (uses `crypto.randomUUID()` from Web Crypto API, available in Node 20+)

### Sharp dependency
`sharp` is listed as devDependency but needed at runtime for `next/image` optimization. The Dockerfile handles this by copying sharp + @img binaries from the build stage.

---

## Cost Comparison

| | Vercel Free | Vercel Pro | Railway Hobby |
|---|---|---|---|
| Monthly cost | $0 | $20/mo | ~$5-10/mo |
| CPU limit | 100 GB-hrs | 1000 GB-hrs | Pay per use (no hard limit) |
| ISR writes | Limited | 10M/mo | N/A (persistent server) |
| Function timeout | 60s | 300s | No limit |
| Cron jobs | 2 | Unlimited | 50 per project |
| Egress | 100 GB | 1 TB | $0.05/GB |

Railway Hobby includes $5 in credits. Typical OpoRuta usage (low traffic, 2 crons, occasional AI calls) should be **$5-8/month**.
