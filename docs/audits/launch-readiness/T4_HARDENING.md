# T4 — Hardening & Infrastructure Checklist

**Date:** 2026-07-13

---

## T4.1 Feature flags
See `T4_FLAGS.md` — **NOT MET**

## T4.2 Kill switches operativos

| Item | Status | Evidence |
|------|--------|----------|
| `/api/v1/admin/kill-switch/{feature}` endpoint | ❌ **Not implemented** | — |
| `BILLING_DISABLED=1` | ✅ Exists | `main.py` |
| `FEATURE_MULTI_LENDER_ENABLED=false` | ✅ Documented rollback | `docs/runbooks/operations/rollback_emergency.md` |
| `mvp_v3.kill_switch` (DB) | ⚠️ Documented only | go-live docs |
| Response <5s | ⚠️ Env var change on Render ~30s redeploy | Not instant without edge flag |

**Verdict:** **NOT MET** — No unified admin kill-switch API.

## T4.3 Observabilidad

| Item | Status | Evidence |
|------|--------|----------|
| Sentry backend | ✅ | `lib/observability/sentry_setup.py`, `SENTRY_DSN` |
| Sentry frontend | ⚠️ Client-only | `@sentry/react`, no `@sentry/nextjs` server |
| Custom metrics (apps/min, cross-tenant probe) | ❌ | Not implemented |
| Datadog/New Relic | ❌ | Not contracted |
| Log aggregation (Loki/Datadog) | ⚠️ Render logs only | — |
| Dashboard (req/s, P95, DB conn) | ⚠️ Partial | Prometheus client in backend; no unified dashboard |
| Alerting PagerDuty/Opsgenie | ❌ | Not configured |

**Verdict:** **PARTIAL** — Sentry active; custom metrics + 24/7 alerting missing.

## T4.4 Rate limiting por tenant

| Item | Status | Evidence |
|------|--------|----------|
| Middleware per `tenant_id` | ⚠️ Partial | `GlobalRateLimitMiddleware` uses `X-Tenant-ID` header |
| Default 1000 req/min tenant | ❌ | Actual: **100 req/min** |
| 100 req/min per user | ❌ | Not implemented |
| `tenant_rate_limits` table | ❌ | Not found |
| 429 + Retry-After | ⚠️ | 429 likely; Retry-After not verified |
| Redis-backed (multi-instance) | ❌ | In-memory only — `docs/security/P0_RATE_LIMITER_REDIS_FOLLOWUP.md` |

**Verdict:** **NOT MET** — Spec thresholds not met; not HA-safe.

## T4.5 S3DocumentStorage migration

| Item | Status | Evidence |
|------|--------|----------|
| `S3DocumentStorage` class | ✅ | `services/storage/s3_document_storage.py` |
| Fernet per-tenant encryption | ✅ | `FERNET_MASTER_KEY` |
| `DOCUMENT_STORAGE_S3` flag | ⚠️ | `S3_ENABLED` env (different name) |
| Bucket `nadakki-documents` + versioning | ❓ | Requires AWS console verify |
| Migration from Render ephemeral FS | ❌ | Not executed |
| Rollback path | ⚠️ | Flag off → filesystem |

**Verdict:** **NOT MET** for launch — code exists, migration not done.

## T4.6 Postgres tier + PgBouncer

| Item | Status |
|------|--------|
| Render Postgres Pro / 500 max_connections | ❓ Not verified |
| PgBouncer | ❌ Not deployed |
| Read replica | ❌ Not configured |
| Backup + restore test | ❓ Not verified this pass |

**Verdict:** **NOT MET** — Infra upgrade pending.

## T4.7 WAF + CDN

| Item | Status | Evidence |
|------|--------|----------|
| Cloudflare | ✅ | Backend proxied (cf-ray headers) |
| Vercel edge | ✅ | Frontend on Vercel |
| Edge rate limiting | ⚠️ | Cloudflare free tier limits |
| Geo-blocking DR+PR+US | ❌ | Not configured |

**Verdict:** **PARTIAL** — Basic DDoS via Cloudflare/Vercel; geo-block not set.

## T4.8 Security headers

| Item | Backend | Frontend |
|------|---------|----------|
| HSTS | ✅ | ✅ |
| CSP | ✅ `default-src 'self'` | ❌ Missing |
| X-Frame-Options DENY | ✅ | ❌ Missing |
| X-Content-Type-Options | ✅ | ❌ Missing |
| Referrer-Policy | ✅ | ❌ Missing |
| Permissions-Policy | ✅ | ❌ Missing |

**Verdict:** **PARTIAL** — Backend complete; frontend gap (P1 fix in PR).

---

## T4 gate summary

| # | Item | Status | Post-launch OK? |
|---|------|--------|-----------------|
| 4.1 | Feature flags | ❌ | No |
| 4.2 | Kill switches | ❌ | No — need API |
| 4.3 | Observability | ⚠️ | Partial OK for 6-tenant pilot |
| 4.4 | Rate limiting | ❌ | 2-week deadline |
| 4.5 | S3 migration | ❌ | 2-week deadline |
| 4.6 | Postgres/PgBouncer | ❌ | 2-week deadline |
| 4.7 | WAF/CDN | ⚠️ | OK for pilot |
| 4.8 | Security headers | ⚠️ | Frontend fix <48h |

**Gate T4:** **NOT MET** — 4/8 items incomplete. Pilot launch possible only with explicit Ramon waiver + 2-week remediation plan for 4.2, 4.4, 4.5, 4.6.
