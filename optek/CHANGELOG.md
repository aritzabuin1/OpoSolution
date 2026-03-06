# Changelog

All notable changes to OpoRuta (formerly OPTEK) are documented here, organized by development phase.

---

## Testing and Security (2026-03-06)

### Testing Sprint
- Added 11 new test files covering critical untested code (+165 tests, 291 -> 456 total)
- New test coverage: Zod schemas, simulacro ranking, hash/normalize pipeline, citation aliases, Stripe pricing constants, email client, flashcard generation, alerting, retry with exponential backoff, request metrics, streaks/logros catalog
- All 456 tests passing across 33 test files

### Security Audit
- Executed /securizar with 3 parallel subagents
- P0 fixes: META Pixel consent check, api_usage_log in GDPR delete+export, dependency overrides (hono >=4.12.4, dompurify >=3.3.2)
- P1 fixes: ManageCookiesButton in both footers (RGPD Art. 7.3), privacy policy expanded (SCCs, retention, providers), INCIDENT_RESPONSE.md created
- Export filename corrected optek -> oporuta
- Full audit report: `docs/auditoria-seguridad-oporuta-2026-03-06.md`

### Scalability Review
- Streaming explain-errores endpoint (TTFB <500ms vs 3-5s batch)
- Timeout BOE fetch (AbortController 10s), timeout reto-diario (withTimeout 45s)
- console.error -> logger in api-error.ts
- Parallel question verification (Promise.all in generate-test.ts)
- Full review: `docs/revision-escalabilidad-oporuta-2026-03-06.md`

---

## Pre-Launch Polish (2026-03-02 -- 2026-03-05)

### Rebrand OPTEK to OpoRuta
- Renamed all user-facing surfaces: Navbar, Footer, layout.tsx, email templates, OG image, landing page, legal pages, blog, share buttons, PaywallGate, DailyBrief, CookieBanner, Stripe routes, logger
- Domain: oporuta.es
- Tagline: "El camino mas corto hacia el aprobado"

### Security and UX Hardening
- Added 7 missing routes to proxy.ts (including admin) + HSTS + CSP headers for openai.com and facebook.net
- Fixed open redirect vulnerability in auth/callback
- Added error boundary pages: not-found.tsx, error.tsx, (dashboard)/error.tsx, (dashboard)/loading.tsx
- Resolved all `pnpm audit` vulnerabilities (overrides: hono, minimatch, rollup)
- Implemented forgot-password + reset-password flow with link on login page
- Replaced PaywallGate alert with toast notifications
- Restored daily cost alerting via boe-watch cron piggyback

### SEO and UX Polish
- Dynamic browser tab titles for test pages (`generateMetadata` with tema title)
- Active nav state highlighting for nested routes (`startsWith(href + '/')`)
- Blog reading time estimation (~230 words/min)
- Marketing nav: Blog + Simulacros INAP in header and footer
- Auth layout noindex (`robots: { index: false, follow: true }`)
- Dashboard layout metadata with `template: '%s -- OpoRuta'`
- Clean sitemap: removed noindex pages, included legal pages at priority 0.2
- 9 SEO blog posts total (LPAC, TAC, TREBEP, LOPDGDD, Constitution, psychometrics, syllabus guide)
- Blog section on marketing landing page (3 curated posts)
- Radar page duplicate title bug fixed
- Primer-test page metadata added
- Flashcard per-deck sessions with "Repasar N" button and "Al dia" badge
- Sidebar desktop NotificationBell for mobile/desktop parity
- PaywallGate includes recarga (8.99 EUR) as accessible entry
- Dashboard flashcard reminder card when pendientes > 0
- BuyButton component for cuenta page CTAs

### Value Features (Section 2.25)
- llms.txt rewritten with standard AI search structure
- MapaDebilidades component (top 5 worst-scoring themes)
- Simulacro ranking: calcularNotaSimulacro (score vs historical cut-off: 2019=5.75, 2022=6.00, 2024=6.50)
- Cross-reference: getAniosConvocatoriaBatch (preguntas_oficiales JOIN examenes_oficiales)
- Results page: "Habrias aprobado?" panel + per-tema cross-reference

### Pricing and Messaging (Section 2.24)
- Price updated to 49.99 EUR on landing, PaywallGate, and Stripe client
- "correcciones" renamed to "analisis detallados" globally
- Socratic method for explain-errores prompt (4 steps: empatia, pregunta_guia, revelacion, anclaje)
- Corrector page removed from Sidebar and Navbar (page preserved)
- Fake testimonials replaced with early adopter CTA
- Founder counter redesigned (option B)
- Anthropic prompt caching enabled (cache_control ephemeral on system prompts > 1024 tokens)

---

## Phase 2: Advanced Features (2026-02-28 -- 2026-03-03)

### Section 2.1-2.2: Flashcards
- Migration 015: flashcards table with spaced repetition fields
- Spaced repetition algorithm (getNextInterval, getNextReviewDate)
- Auto-generation from test errors via Claude Haiku (max 3 per test)
- FlashcardReview component with swipe-style review
- `/flashcards` page with per-deck sessions

### Section 2.5: IPR (Personal Performance Index)
- `calcularIPR()`: composite score 0-100 (rendimiento 60% + constancia 25% + progresion 15%)
- 4 levels: iniciando, aprendiendo, avanzado, preparado
- IPR card on dashboard with colored progress bar
- 14 tests

### Section 2.6A: Official Simulacros
- Endpoint `generate-simulacro` fetching from `preguntas_oficiales` (no AI)
- SimulacroCard with INAP-style penalty (-1/3 for wrong answers)
- ExplicarErroresPanel (Claude Haiku, consumes 1 correction credit)

### Section 2.6.1: Mixed Simulacro
- `modo: 'mixto'` combines questions from all available years (2019, 2022, 2024)
- SimulacroMixtoCard + recommended section on simulacros page

### Section 2.6.2: Timer
- 90-minute countdown in simulacros with auto-submit

### Section 2.6.3-2.6.4: Per-Tema Breakdown
- `temaId` + `temaTitulo` on Pregunta type
- Batch-fetch tema titles in generate-simulacro
- Results page shows "Desglose por tema" sorted worst-to-best

### Section 2.7: Feedback System
- Migration 014: sugerencias table
- POST /api/user/feedback endpoint with rate limiting (5/day)
- Floating FeedbackButton component
- Email notification to admin via Resend

### Section 2.8: Achievements
- Migration 016: advanced achievements (500_preguntas, 10_temas_completados, todas_notas_sobre_7)
- `check_and_grant_logros` RPC updated
- `/logros` page with unlocked/pending grid

### Section 2.12: Caza-Trampas
- Migration 017: cazatrampas_sesiones table
- AI generates modified legal text with injected errors
- Deterministic grading (string comparison)
- Rate limit: free=3/day, paid=unlimited
- CazaTrampasCard + `/cazatrampas` page
- 19 tests

### Section 2.13: BOE Watcher + Daily Brief
- Migration 018: notificaciones table
- boe-watcher checks BOE for legislative changes
- Vercel cron `/api/cron/boe-watch` (daily 07:00 UTC)
- DailyBrief Server Component
- NotificationBell component
- `/api/notifications` GET/PATCH endpoints
- 5 tests

### Section 2.14: Radar del Tribunal
- Migration 022: frecuencias_articulos table
- `build-radar-tribunal.ts` analyzes exam question frequencies
- RadarTribunal component + RadarMini dashboard widget
- `/radar` page with frequency rankings
- `generateTopFrecuentesTest` for radar-based test generation
- 15 tests

### Section 2.16: Share Buttons
- ShareButton on results, cazatrampas, and logros pages

### Section 2.17: JSON-LD
- JsonLd component with FAQPage, Organization, WebSite, BreadcrumbList schemas

### Section 2.18: Admin Dashboard
- Migration 019: admin role + metrics functions
- Admin layout with access control (is_admin)
- Metrics widgets for economics + user activity
- 8 tests

### Section 2.20: Reto Diario (Daily Community Challenge)
- Migration 020: reto_diario + reto_diario_resultados tables
- Cron `generate-reto-diario` (daily 00:05 UTC) with on-demand fallback
- GET/POST API routes for fetching/submitting
- RetoDiarioCard (interactive game) + RetoDiarioShareButton (Wordle-style grid)
- OG image support for tipo=reto_diario
- 5 tests

### Section 2.23: Infrastructure Monitor
- Migration 023: RPC `get_db_size_bytes`
- `getInfraMetrics()` with unstable_cache (5 min)
- Infrastructure page (4 semaphore cards)
- Cost check alerts via cron
- 24 tests

### Error Review (Repaso de Errores)
- POST /api/ai/generate-repaso: extracts failed questions from last 30 tests
- Deterministic (no AI): deduplication, Fisher-Yates shuffle, max 20 questions
- RepasoButton on tests and results pages
- 12 tests

---

## Phase 1B: Monetization, Compliance, and Data (2026-02-27 -- 2026-02-28)

### Section 1.3A: Bloque II (Office Tools)
- Microsoft Support scraper for Word/Excel content
- Knowledge ingestion pipeline (conocimiento_tecnico table)
- Dedicated Bloque II prompt (SYSTEM_GENERATE_TEST_BLOQUE2)
- Context-based guardrail (verificarPreguntaBloque2)

### Section 1.3B: Psychometric Tests
- Deterministic psychometric engine (no AI, zero API cost)
- Categories: numerical series, abstract reasoning, calculation
- `/psicotecnicos` page
- Integration into simulacros (incluirPsicotecnicos toggle)

### Section 1.3.0-1.3.7: Official Exam Ingestion
- `parse-exam-pdf.ts` with OpenAI Vision for scanned PDFs
- Anthropic documents API fallback for scanned PDFs (2018 exam)
- 220 questions ingested from 2019, 2022, 2024 exams
- Migration 021: exam model A/B support

### Section 1.4.4: INAP Examples in Prompts
- `retrieveExamples(temaId, limit=3)` queries preguntas_oficiales
- Integrated into Bloque I test generation prompt
- PROMPT_VERSION bumped to 2.1.0

### Section 1.17: GDPR Compliance
- DELETE /api/user/delete: anonymize purchases (user_id -> NULL for tax compliance), cascade delete everything else
- GET /api/user/export: full data export as JSON (Art. 20 GDPR)
- Data governance directive

### Section 1.21: Go-to-Market
- META Pixel integration (layout.tsx)
- sitemap.ts dynamic generation
- Blog with 3 initial SEO posts
- Founder Pricing tier (24.99 EUR, limited slots, is_founder badge)

### Stripe Integration
- Checkout session creation with metadata
- Webhook with INSERT-first idempotency
- Customer portal for payment history
- Tier system: pack (49.99 EUR), recarga (8.99 EUR), fundador (24.99 EUR)
- Corrections balance system (grant_corrections, use_correction RPCs)

---

## Phase 1A: Core AI Pipeline (2026-02-20 -- 2026-02-27)

### Test Generation Pipeline
- RAG retrieval from legislacion table (buildContext, formatContext)
- Weakness-Weighted RAG: boost articles from previously failed questions
- OpenAI GPT-5-mini for MCQ generation with Zod schema validation
- Deterministic citation verification (extractCitations, verifyCitation, verifyContentMatch)
- Citation alias resolution (resolveLeyNombre)
- Retry mechanism (max 2 retries if verification filters too many questions)
- Prompt versioning (PROMPT_VERSION tracking)

### Essay Correction Pipeline
- Claude Sonnet 4.6 for essay grading
- Three-dimensional evaluation: content, form, citations
- Citation verification on corrected essays
- Corrections balance with free tier (2 free corrections)

### Legislation Ingestion
- BOE scraper
- Legislation ingestion pipeline
- Vector embedding generation (OpenAI text-embedding-3-small)
- Theme-to-article auto-mapping

### Core Infrastructure
- Migrations 001-005: core tables, business tables, RLS, functions, seed data
- Migrations 006-015: pricing/credits, 28 themes, streaks/achievements, weakness RAG, psychometric config, technical knowledge, feedback, flashcards
- Rate limiting via Upstash Redis
- Circuit breaker on Claude and OpenAI APIs
- Pino structured logging
- Health check endpoint

---

## Phase 0: Initial Setup (2026-02-20)

- Next.js 16 project scaffold with App Router
- Supabase project creation (EU region)
- TypeScript configuration
- Tailwind CSS v4 + Radix UI primitives
- ESLint + Prettier
- Vitest test framework
- Project structure: app/, lib/, components/, execution/, tests/
- Environment configuration (.env.example)
- Vercel deployment configuration
