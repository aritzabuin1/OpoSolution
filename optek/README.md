# OpoRuta

**El camino mas corto hacia el aprobado.**

OpoRuta is a SaaS platform for Spanish civil service exam preparation (Auxiliar Administrativo del Estado). It uses AI to generate verified multiple-choice tests, correct written essays, and provide personalized study paths -- all grounded in real legislation to prevent legal hallucinations.

Production URL: [https://oporuta.es](https://oporuta.es)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Database | Supabase (PostgreSQL + pgvector + RLS) |
| AI - Tests | OpenAI gpt-5-mini (MCQ generation) |
| AI - Corrections | Claude Sonnet 4.6 (essay grading) |
| AI - Flashcards | Claude Haiku 4.5 (auto-generation from errors) |
| Payments | Stripe (one-time purchases, webhook idempotency) |
| Rate Limiting | Upstash Redis |
| Email | Resend |
| Hosting | Vercel (Hobby plan, 2 cron jobs) |
| UI | Tailwind CSS v4, Radix UI, Lucide icons |
| Testing | Vitest (vi.mock for mocking) |
| Validation | Zod v4 |
| Logging | Pino |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10 (`corepack enable && corepack prepare pnpm@10.6.5 --activate`)
- **Supabase** account with a project in the EU region
- API keys: Anthropic, OpenAI, Stripe, Upstash Redis, Resend

---

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd optek
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all values in .env.local (see .env.example for descriptions)

# 3. Apply Supabase migrations
# Run each .sql file from supabase/migrations/ in order via Supabase Dashboard SQL Editor

# 4. Seed legislation data
pnpm ingest:legislacion

# 5. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
optek/
  app/
    (admin)/         # Admin dashboard (is_admin required)
    (auth)/          # Login, register, forgot-password, reset-password
    (dashboard)/     # Authenticated user pages (tests, flashcards, simulacros, etc.)
    (marketing)/     # Public landing page, blog, legal pages, simulacros index
    api/
      ai/            # AI endpoints (generate-test, correct-desarrollo, explain-errores, etc.)
      cron/          # Cron jobs (boe-watch, generate-reto-diario, check-costs)
      stripe/        # Checkout, webhook, customer portal
      user/          # GDPR export/delete, feedback
      admin/         # Infrastructure metrics
      health/        # Health check
      info/          # Public metadata for LLM indexing
  components/
    cazatrampas/     # Caza-Trampas game components
    corrector/       # Essay correction UI
    dashboard/       # Dashboard widgets (IPR, MapaDebilidades, etc.)
    flashcards/      # Flashcard review + session starter
    layout/          # Sidebar, Navbar, Footer
    shared/          # FeedbackButton, ShareButtons, PaywallGate, etc.
    simulacros/      # SimulacroCard, ExplicarErroresPanel
    tests/           # Test-taking UI components
    ui/              # Radix-based primitives (Button, Card, Dialog, etc.)
  content/
    blog/            # Blog posts (TypeScript data, not MDX)
  execution/         # CLI scripts (ingestion, scraping, parsing, evals)
  lib/
    admin/           # Admin utilities (cost-check, infrastructure metrics)
    ai/              # AI pipeline (claude, openai, prompts, verification, retrieval)
    analytics/       # Meta Pixel tracking
    email/           # Resend email client
    hooks/           # React hooks
    logger/          # Pino logger
    psicotecnicos/   # Deterministic psychometric test engine
    stripe/          # Stripe client + price constants
    supabase/        # Supabase server/browser clients
    utils/           # Rate limiting, spaced repetition, IPR, sanitization
  supabase/
    migrations/      # 23 migration files (001-023)
  tests/
    unit/            # 456 unit tests (33 files)
    integration/     # Integration tests
    evals/           # AI evaluation golden datasets
    fixtures/        # Test fixtures
  types/             # TypeScript type definitions (database.ts, ai.ts)
```

---

## Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking (no emit) |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without writing |

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with V8 coverage |

### Data Ingestion

| Command | Description |
|---------|-------------|
| `pnpm ingest:legislacion` | Insert legislation articles into Supabase |
| `pnpm generate:embeddings` | Generate vector embeddings for legislation |
| `pnpm map:themes` | Auto-map legislation articles to exam themes |
| `pnpm check:coverage` | Check mapping coverage stats |
| `pnpm scrape:boe` | Scrape BOE for legislation updates |
| `pnpm scrape:ofimatica [word\|excel\|all]` | Scrape Microsoft Support for Bloque II content |
| `pnpm ingest:ofimatica` | Insert Bloque II knowledge into Supabase |

### Exam Parsing

| Command | Description |
|---------|-------------|
| `pnpm parse:examenes <year>` | Parse official INAP exam PDFs (uses OpenAI Vision) |
| `pnpm ingest:examenes <year>` | Insert parsed exam questions into Supabase |
| `pnpm build:radar` | Build Radar del Tribunal frequency rankings |

### AI Evaluation

| Command | Description |
|---------|-------------|
| `pnpm eval:generate` | Run generation quality evals |
| `pnpm eval:correct` | Run correction quality evals |
| `pnpm eval:all` | Run all evals |
| `pnpm eval:adversarial` | Run adversarial evals |

---

## Testing

```bash
# Run all 456 tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

Tests use Vitest with `vi.mock()` for dependency mocking. Test files are in `tests/unit/`.

---

## Deployment

OpoRuta is deployed on **Vercel** (Hobby plan).

- Push to `main` triggers automatic deployment.
- Cron jobs are configured in `vercel.json`:
  - `/api/cron/boe-watch` -- daily at 07:00 UTC (BOE legislative changes + cost check piggyback)
  - `/api/cron/generate-reto-diario` -- daily at 00:05 UTC (community daily challenge)
- Check-costs cron is run manually (Hobby plan limited to 2 crons):
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://oporuta.es/api/cron/check-costs
  ```

See [docs/OPERATIONS.md](docs/OPERATIONS.md) for the full operations guide.

---

## Architecture Highlights

- **Deterministic citation verification**: Every legal citation generated by AI is verified against the legislation database before being shown to the user. No legal hallucinations.
- **Circuit breaker**: Claude and OpenAI API calls are protected by a circuit breaker (5 failures -> OPEN -> 60s reset -> HALF_OPEN -> test request).
- **Prompt versioning**: `PROMPT_VERSION` is tracked in every generated test for reproducibility and rollback.
- **Stripe idempotency**: INSERT-first pattern with `stripe_events_processed` table eliminates race conditions in webhook processing.
- **Row Level Security**: All user data is isolated at the database level via Supabase RLS policies.
- **Weakness-Weighted RAG**: Test generation prioritizes articles the user has previously answered incorrectly.

---

## License

Private. All rights reserved.
