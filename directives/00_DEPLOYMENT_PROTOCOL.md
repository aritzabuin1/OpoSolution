# SOP: Deployment & Rollback Strategy

**Objective**: Ensure zero-downtime deployments and 100% recovery capability for enterprise-grade solutions.

## 1. Pre-Flight Checklist

- [ ] **Environment Variables**: Verified and synced in the production provider (Railway, AWS, etc.).
- [ ] **Database Migrations**: SQL/Schema changes tested for reversibility (rollback scripts ready).
- [ ] **Smoke Tests**: Automated suite ready to validate core functionality immediately post-deploy.
- [ ] **Security Scan**: No secrets in codebase, dependencies audited (`pip-audit`).
- [ ] **Quality Gate**: All CI checks passing (unit tests, integration tests, linting).

## 2. Deployment Strategy

1. **Stage/Shadow**: Deploy the new version to a separate environment or a shadow slot.
2. **Health Validation**: Run automated health checks and PII leak scans.
3. **Traffic Switch**: Switch traffic to the new version ONLY if all internal health checks return `200 OK`.
4. **Monitor**: Watch error rates and latency for the first 15 minutes post-deploy.

## 3. Rollback Protocol

**Triggers for immediate rollback**:
- Error rate > 1% in the first 5 minutes.
- P95 Latency > 5 seconds (performance degradation).
- Failed smoke tests or critical user path failures.

**Action**: Immediate revert to the previous stable container image or git commit.

**Post-Mortem**: Every rollback MUST be documented as a "Lesson Learned" in `ARITZ.md` to prevent recurrence.

## 4. Post-Deploy Verification

1. Run smoke tests against production URL
2. Verify `/health` endpoint returns `200`
3. Check logs for unexpected errors (first 15 minutes)
4. Confirm monitoring/alerting is active
5. Notify stakeholders of successful deployment

## 5. Database Migration Workflow

Database schema changes are among the highest-risk operations in production. Follow this procedure for EVERY migration:

### Pre-Deploy
1. **Write migration** in versioned directory (e.g., `supabase/migrations/`, `alembic/versions/`, `prisma/migrations/`)
2. **Write rollback script** for every migration (revert the change)
3. **Test migration on staging** — apply, verify schema, verify app works
4. **Test rollback on staging** — revert, verify schema returns to previous state, verify app works

### Safe Migration Patterns
- **Adding a column**: Add with DEFAULT value → deploy code that uses it → safe
- **Removing a column**: Deploy code that no longer uses it → wait 1 release → drop column (2-phase deploy)
- **Renaming a column**: Add new column → deploy code that writes to both → migrate data → deploy code that reads from new → drop old column
- **Adding an index**: Create index CONCURRENTLY (non-blocking) when supported

### Dangerous Operations (require extra caution)
- `DROP TABLE` / `DROP COLUMN` — verify no code references it, have backup
- `ALTER COLUMN TYPE` — may lock table, test on staging with production-sized data
- `TRUNCATE` — irreversible, require explicit approval

### CI Integration
- Migration files should be validated in CI (syntax check, test apply + rollback)
- Never deploy migration + code change that depends on it in the same release if migration can fail
