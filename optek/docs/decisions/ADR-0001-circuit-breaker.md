# ADR-0001: Circuit Breaker Pattern on Claude/OpenAI APIs

## Status

Accepted

## Context

OpoRuta depends on two external AI providers (Anthropic Claude and OpenAI GPT) for core functionality: test generation, essay correction, error explanation, and flashcard generation. These services can experience:

- Transient failures (network issues, rate limiting with HTTP 429)
- Extended outages (provider downtime)
- Cascading failures (one slow request blocking subsequent ones)

Without protection, a downed AI service would cause every user request to hang for the full timeout duration, degrading the entire application. The SDK-level retry mechanism (exponential backoff on 429/529) handles transient errors but does not protect against sustained outages.

We needed a pattern that would:
1. Fail fast when the provider is down, returning a clear error to the user
2. Automatically recover when the provider comes back online
3. Operate independently per provider (Claude down should not affect OpenAI)

## Decision

We implemented a **Circuit Breaker** pattern in both `lib/ai/claude.ts` and `lib/ai/openai.ts` with the following configuration:

- **CLOSED** (normal): Requests pass through. Each failure increments a counter.
- **OPEN** (rejecting): After 5 consecutive failures, all requests are immediately rejected with a "temporalmente no disponible" error. No API calls are made.
- **HALF_OPEN** (testing): After 60 seconds in OPEN state, one request is allowed through as a probe:
  - If it succeeds: state returns to CLOSED (counter reset)
  - If it fails: state returns to OPEN (timer resets)

Configuration constants:
- `FAILURE_THRESHOLD = 5` consecutive failures to trip
- `RESET_TIMEOUT_MS = 60_000` (60 seconds before testing recovery)

The circuit breaker state is held in module-level variables (in-process memory). This is appropriate because:
- Vercel serverless functions have short lifetimes
- Each function instance gets its own breaker, which is conservative (may trip later than a shared breaker)
- No external state (Redis) is needed, keeping the pattern lightweight

Each provider has an **independent** circuit breaker. Claude going down does not affect OpenAI and vice versa.

## Consequences

### Positive

- Users get immediate feedback ("servicio no disponible") instead of waiting 30-120 seconds for a timeout
- The AI provider is not hammered with requests during an outage, giving it time to recover
- API route handlers catch the "temporalmente no disponible" message and return HTTP 503 with a user-friendly message
- Independent breakers per provider allow partial degradation (e.g., test generation via OpenAI works even if Claude is down for corrections)

### Negative

- In-process state means the breaker is per-serverless-instance, not global. Under high load with many instances, some instances may not have tripped yet and will still attempt calls.
- The 5-failure threshold means up to 5 users will experience slow failures before the breaker trips.
- 60-second reset is a fixed value. A smarter approach (e.g., exponential backoff on reset) was considered but deemed unnecessary for the current traffic level.

### Risks

- If a provider has intermittent failures (e.g., 50% success rate), the breaker may oscillate between OPEN and HALF_OPEN. This is acceptable because even a 50% success rate is better than blocking all requests.
