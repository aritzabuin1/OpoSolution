# Enterprise-Level Planning Checklist

**READ THIS FILE when starting any new project or when user asks to review requirements.**

This checklist ensures production-ready, enterprise-level quality. **Not all items apply to every project** - use judgment and consult with Aritz during planning.

---

## Quick Decision Matrix

Use this to determine which requirements apply:

| Project Type | Core Requirements | Advanced Requirements |
|--------------|-------------------|----------------------|
| **Internal MVP** (quick prototype, no users) | 1, 2, 3, 5, 6, 19 | None |
| **Client-Facing** (external users, moderate stakes) | 1-8, 11, 13, 19, 21-25 | 9, 10, 12, 14, 20 |
| **Enterprise Production** (high stakes, compliance) | ALL Core (1-8, 21-25) | ALL Advanced (9-20) |

Use this as starting point, then adjust based on specific project needs.

---

## Core Requirements (Always Evaluate)

### 1. Error Handling ⚠️
**What**: Gracefully catch and handle errors at every layer  
**Why**: Systems fail. Graceful failures = better UX and debuggability  
**When to apply**: ALWAYS  
**Questions**:
- What can go wrong at each step?
- How do we communicate errors to users?
- What should retry vs fail fast?

**Implementation**: Try-catch blocks, specific error types, meaningful messages, different handling for expected vs unexpected

**Standard Error Response Format (REQUIRED for APIs)**:
- Define a consistent error schema: `{ code: string, message: string, status: number, requestId: string }`
- Document error codes per endpoint (400, 401, 429, 503) with user-friendly messages in the user's language
- Create a wrapper function (e.g., `withErrorHandling()`) to enforce consistency across all API routes
- Never expose internal error details (stack traces, SQL errors) to users

---

### 2. Logging 📝
**What**: Record system activity for debugging and monitoring  
**Why**: Can't fix what you can't see. Logs are your time machine.  
**When to apply**: ALWAYS  
**Questions**:
- What info needed to debug production issues?
- How long to keep logs?
- Who has access?

**Implementation**: Structured logging (JSON), levels (DEBUG/INFO/WARNING/ERROR/CRITICAL), include context (timestamp, user_id, request_id). **NEVER log**: API keys, passwords, tokens, PII
**Technical Reference**: Mandatory compliance with directives/00_OBSERVABILITY_STACK.md.
---

### 3. Secrets Management 🔐
**What**: Protect API keys, passwords, tokens, credentials  
**Why**: Exposed secrets = game over. Attackers scan GitHub 24/7.  
**When to apply**: ALWAYS  
**Questions**:
- What credentials does system need?
- Where stored?
- Who can access?

**Implementation**: ALL secrets in `.env`, `.env` in `.gitignore`, use `os.getenv('API_KEY')`, rotate keys periodically
**Technical Reference**: Follow directives/00_SECRETS_ROTATION.md for rotation policies.
---

### 4. PII Protection 🛡️
**What**: Personally Identifiable Information (names, emails, IDs, addresses)  
**Why**: GDPR, CCPA, user trust. Violations = massive fines.  
**When to apply**: If handling ANY user data  
**When NOT to apply**: Internal tools with no user data  
**Questions**:
- What personal data collected?
- Do we really need it?
- How do users delete their data?

**Implementation**: Encrypt at rest/transit, minimize collection, never log PII, data deletion endpoints
**Technical Reference**: Mandatory compliance with `directives/00_DATA_GOVERNANCE.md`.

---

### 5. Input Validation ✅
**What**: Check and sanitize all user inputs  
**Why**: Prevents prompt injection, SQL injection, XSS, malformed data  
**When to apply**: ALWAYS (any user input)  
**Questions**:
- What inputs accepted?
- What could go wrong with malicious inputs?
- How validate without breaking legitimate use?

**Implementation**: Validate types (string, int, email), sanitize (remove dangerous chars), Pydantic models, reject invalid with clear errors

---

### 6. Testing 🧪
**What**: Automated verification code works  
**Why**: Manual testing doesn't scale. Tests catch regressions.  
**When to apply**: ALWAYS (at least critical paths)  
**Questions**:
- What critical paths must work?
- How test without hitting real APIs?
- What edge cases need coverage?

**Implementation**: Unit tests (functions), integration tests (workflows), pytest/unittest, aim >80% coverage on critical paths
**Technical Reference**: Adhere to `directives/00_TESTING_STANDARDS.md` and perform systematic evaluations (Evals) as per `directives/00_EVALUATION_PROTOCOLS.md`.

---

### 7. Observability & Monitoring 👁️
**What**: Understand system health in real-time  
**Why**: Know when things break before users complain  
**When to apply**: Production systems  
**When NOT to apply**: Quick prototypes, internal scripts  
**Questions**:
- How know system is healthy?
- What metrics indicate problems?
- Who gets alerted on failures?

**Implementation**: Health check endpoints (`/health`), metrics (response time, error rate), alerts on critical failures, dashboards
**Technical Reference**: Mandatory compliance with directives/00_OBSERVABILITY_STACK.md
---

### 8. Prompt Injection Protection 🚫
**What**: Prevent malicious inputs hijacking LLM behavior  
**Why**: Users can manipulate AI to leak data, bypass rules, cause harm  
**When to apply**: ANY user-facing LLM interface  
**When NOT to apply**: Internal tools, trusted users only  
**Questions**:
- Can users modify AI behavior through inputs?
- What if "Ignore previous instructions"?
- How test for vulnerabilities?

**Implementation**: Input validation/sanitization, resistant system prompts, output filtering, rate limiting per user

---

## Advanced Requirements (Evaluate Case-by-Case)

### 9. Idempotency 🔁
**What**: Same operation → same result, even if executed multiple times  
**Why**: Network issues, retries, webhooks cause duplicate requests  
**When to apply**: Webhooks, payments, database writes that shouldn't duplicate  
**When NOT to apply**: Read-only operations, stateless functions  
**Implementation**: Unique request IDs, check if operation completed, DB constraints (unique keys)

---

### 10. Prompt Caching 💰
**What**: Reuse LLM responses for identical inputs to save costs  
**Why**: LLM APIs expensive. Caching reduces costs 50-90%  
**When to apply**: Repeated queries, static content, FAQs  
**When NOT to apply**: Real-time data, personalized responses  
**Implementation**: Cache key = hash(prompt + model + params), Redis, appropriate TTL, invalidation strategy

---

### 11. Rate Limiting 🚦
**What**: Restrict requests per user/IP/timeframe  
**Why**: Prevents abuse, controls costs, ensures fair access  
**When to apply**: Public APIs, LLM endpoints, resource-heavy operations  
**When NOT to apply**: Internal tools, trusted users  
**Implementation**: Track requests per user/IP, return 429 + retry-after, different limits per endpoint, grace for burst

**Implementation Details (REQUIRED — not just "add rate limiting")**:
- Specify the **library** (e.g., @upstash/ratelimit, express-rate-limit, django-ratelimit)
- Specify the **state storage** (Redis, database table, in-memory — and why)
- Document **limits per endpoint** in a table (endpoint, limit, window, justification)
- Include **429 response format** with Retry-After header
- **Test**: Simulate exceeding the limit → verify 429 is returned

---

### 12. Retries & Exponential Backoff ⏱️
**What**: Auto-retry failed operations with increasing delays  
**Why**: APIs fail temporarily. Smart retries improve reliability.  
**When to apply**: External API calls, network ops, DB connections  
**When NOT to apply**: Operations not safe to retry (non-idempotent writes)  
**Implementation**: Max 3-5 attempts, exponential delay (1s, 2s, 4s, 8s), jitter, respect rate limits
---

### 13. Timeouts ⏰
**What**: Max time to wait before giving up  
**Why**: Prevents hanging indefinitely  
**When to apply**: ALL external API calls, DB queries, file ops  
**Implementation**: Reasonable timeouts (30s for LLM, 5s for DB), handle gracefully, different per operation type

---

### 14. Fallbacks 🔄
**What**: Alternative behavior when primary fails  
**Why**: Redundancy improves reliability  
**When to apply**: Critical features, multiple provider options  
**When NOT to apply**: Non-critical features, single provider  
**Implementation**: Try primary → on fail try secondary → degrade gracefully, log fallback usage

---

### 15. Cost Monitoring 💸
**What**: Real-time tracking of API usage and costs  
**Why**: LLM APIs can cost $1000s in hours if misconfigured  
**When to apply**: ANY system using paid APIs  
**Implementation**: Track tokens per request, calculate costs, alert on budget breach, dashboard with trends
**Technical Reference**: Implement tracking and alerts according to `directives/00_COST_OBSERVABILITY.md`.
---

### 16. Disaster Recovery & Backups 💾
**What**: Plan for catastrophic failures  
**Why**: Hard drives fail. Databases corrupt. S3 buckets deleted.  
**When to apply**: Important data, production databases  
**When NOT to apply**: Ephemeral data, reproducible state  
**Implementation**: Automated daily backups, different region/provider, test restore regularly, document recovery

---

### 17. Audit Trails 📋
**What**: Immutable log of who did what, when, why  
**Why**: Compliance, debugging, security investigations  
**When to apply**: Compliance requirements, financial, admin actions  
**When NOT to apply**: Simple tools, no compliance needs  
**Implementation**: Log user_id + action + timestamp + inputs + outputs, append-only, separate storage

---

### 18. GDPR/CCPA Compliance 🇪🇺
**What**: Legal requirements for user data  
**Why**: Non-compliance = fines up to €20M or 4% revenue  
**When to apply**: EU or California users, ANY PII  
**When NOT to apply**: No user data, internal tools  
**Implementation**: Data export endpoint, deletion endpoint, privacy policy + consent, DPA for third parties

---

### 19. Health Checks ❤️
**What**: Endpoint reporting system status  
**Why**: Monitoring tools need to know if alive  
**When to apply**: ALL production services  
**Implementation**: `/health` returns 200 if healthy, check DB connection + API availability, return 503 if unhealthy

---

### 20. Prompt Versioning 📌
**What**: Track which prompt version generated which outputs  
**Why**: Prompts evolve. Need to know which version caused issues/improvements.  
**When to apply**: Production LLM systems, A/B testing  
**When NOT to apply**: Prototypes, stable prompts  
**Implementation**: Version number/hash per prompt, store with each call, tag outputs, compare metrics across versions

---

### 21. Rate Limiting Implementation Details 🚦
**What**: Concrete implementation plan for rate limiting, not just "add rate limiting"
**Why**: Vague rate limiting = no rate limiting. Attackers and runaway costs don't wait for you to figure it out.
**When to apply**: ANY system with paid API calls or public endpoints
**Questions**:
- Which library/service will enforce limits?
- Where is state stored (Redis, DB, in-memory)?
- What are the limits per endpoint?
- What response does the user get when limited?

**Implementation**: See §11 for implementation details checklist.

---

### 22. Database Migration Strategy 🗃️
**What**: Documented procedure for safely changing database schema after first deployment
**Why**: Without migrations, schema changes in production risk data loss or downtime
**When to apply**: ANY system with a persistent database
**When NOT to apply**: Ephemeral databases, serverless with no schema
**Questions**:
- What tool manages migrations? (Supabase CLI, Flyway, Prisma, Alembic, Django)
- Where are migration files stored? (versioned directory)
- How to rollback a failed migration?

**Implementation**: Migration tool configured, versioned migration directory, procedure: write migration → test on staging → write rollback script → test rollback → deploy. NEVER DROP COLUMN without verifying code no longer uses it (deploy in 2 phases).

---

### 23. Error Response Standardization 📋
**What**: Unified error response format across all API endpoints
**Why**: Without standard format, frontends can't handle errors gracefully and users see raw JSON or generic "500 error"
**When to apply**: ANY system with API endpoints consumed by a frontend or external clients
**Questions**:
- What fields does every error response include?
- What error codes exist per endpoint?
- Are error messages in the user's language?

**Implementation**: See §1 Error Handling for format details. Create error type definition, helper function, and wrapper for all API routes.

---

### 24. XSS Prevention 🛡️
**What**: Prevent Cross-Site Scripting attacks when storing/displaying user-generated text
**Why**: User submits `<script>stealToken()</script>` → stored in DB → rendered → token stolen
**When to apply**: ANY app that stores and displays user-generated text
**When NOT to apply**: Backend-only services, no user content
**Questions**:
- Where does user text enter the system?
- Where is it rendered/displayed?
- Is any user text rendered with `innerHTML` or equivalent?

**Implementation**: Sanitization library (DOMPurify, bleach, etc.), apply BEFORE storing in DB, configure CSP headers, test with common XSS payloads (`<img src=x onerror="...">`, `<script>alert(1)</script>`, event handlers).

---

### 25. Backup & Disaster Recovery 💾
**What**: Documented backup strategy with tested restore procedure
**Why**: Databases fail. Accidental deletions happen. Without tested backups, data loss is permanent.
**When to apply**: ANY system with important persistent data
**When NOT to apply**: Ephemeral data, fully reproducible state
**Questions**:
- What is the backup frequency? (daily, hourly, continuous)
- What is the retention period? (7 days, 30 days, 1 year)
- What is the RTO (Recovery Time Objective)?
- What is the RPO (Recovery Point Objective)?
- Has a restore been tested?

**Implementation**: Automated backups documented (frequency, retention, provider), restore procedure tested quarterly, RTO/RPO defined and documented, critical data exported separately (e.g., curated datasets in version control).

---

## Planning Workflow

When starting project:

1. **Read this entire checklist**
2. **For each item determine**:
   - Applicable to this project?
   - If yes, how implement?
   - Priority (must-have vs nice-to-have)?
3. **Include in PLAN.md**:
   - List applicable requirements
   - Implementation approach for each
   - Trade-offs and decisions
4. **Present to Aritz for approval**

**Remember**: Not everything applies everywhere. Simple internal tool ≠ full GDPR compliance. But client-facing system with PII = absolutely needs it.

---

## When User Asks "¿Nos falta algo?"

Re-evaluate this checklist against current implementation:

1. Review which requirements were marked as applicable
2. Check if actually implemented
3. Identify gaps
4. Propose additions if project evolved (new requirements emerged)
5. Update PLAN.md with gaps + remediation plan

Be thoughtful. Be thorough. Ask questions.
