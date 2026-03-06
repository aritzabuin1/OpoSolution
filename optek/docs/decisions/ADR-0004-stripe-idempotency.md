# ADR-0004: INSERT-First Idempotency Pattern for Stripe Webhook

## Status

Accepted

## Context

Stripe delivers webhook events with at-least-once semantics. This means the same event (e.g., `checkout.session.completed`) can be delivered multiple times due to:

- Network timeouts causing Stripe to retry
- Our endpoint returning a 5xx error (Stripe retries up to ~15 times over 3 days)
- Vercel cold starts causing the first request to time out

Without idempotency, processing the same event twice would:
- Insert duplicate purchase records in `compras`
- Grant double corrections to the user
- Activate founder badges multiple times (harmless but wasteful)

The naive approach (SELECT to check if processed, then INSERT) has a classic **TOCTOU (Time-of-Check-Time-of-Use) race condition**: two concurrent webhook deliveries could both pass the SELECT check and both proceed to process.

## Decision

We implemented an **INSERT-first** idempotency pattern using a dedicated `stripe_events_processed` table:

```sql
CREATE TABLE stripe_events_processed (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id text NOT NULL UNIQUE,  -- Stripe event ID (evt_xxxx)
  event_type      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### Flow

```
1. Receive webhook -> verify Stripe signature
2. INSERT INTO stripe_events_processed (stripe_event_id, event_type)
   |
   +---> Success (new event) -> proceed to handle event
   |
   +---> UNIQUE violation (code 23505) -> event already processed -> return 200
   |
   +---> Other DB error -> return 500 (Stripe will retry)
3. Handle event (insert compra, grant corrections, etc.)
4. Return 200 to Stripe
```

### Key Design Decisions

1. **INSERT before processing**: The event is recorded as "received" BEFORE any business logic runs. This is deliberate:
   - If the handler fails after INSERT, the event is marked as received but not fully processed
   - On Stripe retry, the INSERT hits the UNIQUE constraint and returns 200 (skip)
   - This is acceptable because a partial failure (e.g., compra inserted but corrections not granted) is detectable via admin dashboard and manually fixable
   - The alternative (INSERT after processing) would allow duplicate processing if the first request fails after processing but before the INSERT

2. **UNIQUE constraint on `stripe_event_id`**: PostgreSQL's UNIQUE constraint is atomic and thread-safe. Two concurrent INSERTs with the same `stripe_event_id` will result in exactly one succeeding and the other getting a `23505` unique_violation error.

3. **No distributed locks**: We considered using Redis locks or Supabase advisory locks. The INSERT-first approach is simpler and uses only the database, which is already a dependency.

### Handled Events

- `checkout.session.completed`: Records purchase, grants corrections, activates founder badge
- `customer.subscription.created/updated/deleted`: Manages subscription state
- `payment_intent.succeeded`: Logged for audit
- `charge.failed`: Logged as warning

## Consequences

### Positive

- **Race-condition-free**: The UNIQUE constraint eliminates the TOCTOU window entirely
- **Simple**: No distributed locks, no Redis, no external coordination
- **Auditable**: `stripe_events_processed` serves as a complete audit log of all Stripe events received
- **Retry-safe**: Stripe can retry as many times as needed without side effects
- **Zero data loss**: If the handler fails, Stripe retries with a new delivery, which will be rejected by the UNIQUE constraint. Manual investigation is needed for the partial failure case.

### Negative

- **Partial failure risk**: If the handler fails after the INSERT, the event is marked as processed but business logic is incomplete. This requires manual intervention (check `compras` table, grant corrections manually).
- **Table growth**: `stripe_events_processed` grows indefinitely. Consider adding a cleanup job for events older than 90 days.
- **INSERT-before-process semantics**: Some would argue the event should only be marked as processed after successful handling. We chose reliability over exactness: it is better to skip a retry than to process twice.

### Alternatives Considered

1. **SELECT-then-INSERT**: Rejected due to TOCTOU race condition
2. **INSERT-after-process**: Rejected because duplicate processing (double corrections) is worse than a missed retry
3. **Redis distributed lock**: Rejected as over-engineering for the current traffic level
4. **Stripe idempotency keys on our end**: Not applicable; Stripe controls the delivery, not us
