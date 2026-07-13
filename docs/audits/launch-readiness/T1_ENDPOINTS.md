# T1.5 — Endpoint Enumeration & Probe

**Date:** 2026-07-13  
**Target:** `https://nadakki-ai-suite.onrender.com`

---

## OpenAPI schema

| Source | URL | Auth required |
|--------|-----|---------------|
| Runtime FastAPI | `GET /openapi.json` | **No** (200) |
| Static reference | `docs/API/openapi_spec_v2.yaml` | N/A |

**Note:** `/api/v1/credit/*` does **not exist**. Credit Hub surface is `/api/v2/credit/*` + legacy `/credit/*` + `/api/bank/*`.

---

## Unauthenticated probe results (2026-07-13)

| Endpoint | Expected | Actual | Verdict |
|----------|----------|--------|---------|
| `GET /health` | 200 | **200** | ✅ Public health |
| `GET /api/v2/credit/health` | 200 | **200** | ✅ Public credit health |
| `GET /openapi.json` | 200 | **200** | ⚠️ Schema exposed (standard FastAPI) |
| `GET /api/v2/credit/applications` | 401 | **401** | ✅ |
| `GET /api/v2/credit/stats` | 401 | **401** | ✅ |
| `GET /api/bank/applications/queue` | 401 | **401** | ✅ |
| `GET /api/v2/credit/consent/application/test/history` | 401 | **401** | ✅ |

**Rate limit headers observed:** `x-ratelimit-limit: 100`, `x-ratelimit-remaining: 99` on credit health.

---

## Credit Hub endpoint map (production-mounted)

### Core `/api/v2/credit` (`routers/credit_router.py`)
- `GET /health` — public
- `POST /applications`, `GET /applications`, `GET /stats`
- `GET /applications/queue`, `POST /applications/bulk-decide`
- `GET /analytics/*`, `POST /applications/{id}/analyze`
- `GET /applications/{id}/*` (audit, events, offers, documents, compliance, PDF, wizard)
- `GET /admin/sunset-metrics` — bearer `CREDIT_ADMIN_API_TOKEN`
- `POST /demo/load` — **review for prod exposure**

### Bank queue `/api/bank`
- `GET /applications/queue`

### Consent `/api/v2/credit/consent`
- Public token routes: `/{token}/public`, `/accept`, `/status` (rate-limited)

### Legacy `/credit/*` (coexistence — sunset tracked)
- `POST /dispatch-multi`
- `GET /applications/{id}/offers`
- `GET /dashboard/summary`

### Mounted admin (`/api/v1/admin`)
- `POST /tenants`, `POST /dealers`
- `GET /onboarding/status/{entity_id}`

### Coded but **unmounted** (dark code)
- `/api/v1/admin/billing/*`
- `/api/v1/admin/email/status`
- `/api/v2/admin/tenants/{id}/modules` (`TENANT_MODULE_ADMIN_ENABLED`)

---

## JWT role probes

| Role | Status |
|------|--------|
| `tenant_admin` | **NOT EXECUTED** — no prod JWT on audit host |
| `platform_superadmin` | **NOT EXECUTED** |
| `bank_analyst` | **NOT EXECUTED** |

**Proxy:** `tests/security/test_auth_bypass.py` + `test_tenant_isolation_contract.py` cover 401/403 matrix in TestClient.

---

## Dark endpoint detection

| Finding | Sev | Detail |
|---------|-----|--------|
| `POST /api/v2/credit/demo/load` | P2 | Demo data loader — verify disabled or superadmin-only in prod |
| Legacy `/credit/*` routes | P2 | Documented sunset via `/admin/sunset-metrics` |
| Unmounted billing admin routers | P3 | Dead code — no attack surface until mounted |
| Observability scripts reference `/api/v1/credit/*` | P3 | Stale — update `scripts/observability/*.sh` |

---

## Gate T1.5 verdict

**PASS** — All probed protected endpoints return 401 without JWT. Public endpoints documented.  
**Residual:** Full OpenAPI diff + role-matrix probe requires prod JWT fixtures (post-launch continuous probe).
