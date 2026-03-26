# SAME-ORIGIN / CONTRACT HARDENING MICRO-AUDIT
**Date:** 2026-03-25
**Repos:** nadakki-dashboard + nadakki-ai-suite
**Mode:** READ-ONLY
**Branch:** main (both repos, synced with origin)

---

## 1. SAME_ORIGIN_GAPS

### 1A. URL Strategy Summary

| Layer | Pattern | Count | Notes |
|-------|---------|-------|-------|
| Client-side pages | `const API_URL = ""` (same-origin) | 40+ files | Correct — all page-level fetches are relative |
| lib/api.ts | `const API_URL = ""` | 1 | Same-origin — campaigns, agents, etc. |
| lib/api/base.ts | `const API_BASE = ""` | 1 | Same-origin — fetchAPI wrapper |
| lib/api/endpoints.ts | Hardcoded relative paths | 1 | `/api/marketing/*`, `/api/v1/*` — correct |
| lib/api/client.ts | No base URL | 1 | Accepts caller-supplied URLs |
| lib/api/autopilot.ts | `NEXT_PUBLIC_API_URL \|\| "https://nadakki-ai-suite.onrender.com"` | 1 | **DIRECT CROSS-ORIGIN** from browser |
| lib/scheduler-status.ts | `NEXT_PUBLIC_API_URL \|\| ""` | 1 | **INCONSISTENT** — falls back to same-origin, unlike all others |
| Route Handlers (app/api/) | `NEXT_PUBLIC_API_URL \|\| "https://nadakki-ai-suite.onrender.com"` | 6 files | Server-side — acceptable (not browser) |
| next.config.js rewrites | `NEXT_PUBLIC_API_URL \|\| NEXT_PUBLIC_RENDER_API_URL \|\| onrender` | 1 | Checks extra env var no other file uses |

### 1B. Proxy Coverage Mechanisms

| Mechanism | Coverage |
|-----------|----------|
| next.config.js rewrites (9 rules) | `/api/marketing/*`, `/api/campaigns/*`, `/analytics/*`, `/health`, `/cores`, `/api/v1/sic/*`, `/api/v1/auth/*`, `/api/v1/ame/*`, `/api/v1/advertising/*` |
| Catch-all Route Handler `app/api/v1/[[...path]]/route.ts` | ALL `/api/v1/*` not already matched by rewrites — **GET and POST only** |
| Dedicated Route Handlers | `/api/health`, `/api/tenants`, `/api/ai-studio/agents`, `/api/v1/agents/{id}/execute`, `/api/v1/sic/cases/{id}/documents`, `/api/v1/sic/statements` |
| Direct cross-origin (autopilot.ts) | `/marketing/autopilot/*`, `/marketing/campaigns/*` — bypasses proxy entirely |

### 1C. Backend CORS Configuration

```python
_ALLOWED_ORIGINS = [
    "https://dashboard.nadakki.com",
    "https://nadakki-dashboard.vercel.app",
    "https://www.nadakki.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
```
Methods: `["*"]`, Headers: `["*"]`, Credentials: `True`

Cross-origin calls from autopilot.ts will work IF the dashboard is served from one of these origins.

---

## 2. REMAINING_CONTRACT_BREAKS

### BREAK #1: GET /campaigns is unreachable (SILENT MOCK SUBSTITUTION)
- **Page:** `app/campaigns/page.tsx`
- **Call:** `campaignsAPI.getAll()` → `fetchWithFallback("/campaigns?tenant_id=...", MOCK_CAMPAIGNS)`
- **Problem:** Frontend calls `GET /campaigns` (no `/api` prefix). The rewrite rule is `source: "/api/campaigns/:path*"` which requires the `/api` prefix. No Route Handler exists at root `/campaigns`. Result: 404 → `MOCK_CAMPAIGNS` silently shown.
- **Backend:** `campaigns_v2.py` is mounted at `/campaigns` (correct). The problem is the proxy, not the backend.
- **User impact:** Campaigns page ALWAYS shows fake data. Users cannot see real campaigns.
- **Severity:** **P0**

### BREAK #2: PATCH /api/v1/tenants/{id}/billing returns 405
- **Page:** `app/admin/billing/page.tsx` line 68
- **Call:** `fetch("/api/v1/tenants/${tenantId}/billing", { method: "PATCH" })`
- **Problem:** The catch-all Route Handler at `app/api/v1/[[...path]]/route.ts` only exports `GET` and `POST`. No `PATCH` export exists. Next.js returns 405 Method Not Allowed.
- **User impact:** "Upgrade Plan" button silently fails (error swallowed by `.catch(() => {})`). User thinks nothing happened.
- **Severity:** **P1**

### BREAK #3: lib/api/autopilot.ts bypasses proxy tier entirely
- **Page:** `app/autopilot/page.tsx`
- **Calls:** 3 endpoints directly to `${BACKEND_URL}/marketing/*` (absolute cross-origin)
- **Problem:** These calls go from the browser directly to the Render backend, bypassing Next.js rewrites/handlers. Works only if CORS allows the dashboard origin. If `NEXT_PUBLIC_API_URL` is unset, defaults to hardcoded `nadakki-ai-suite.onrender.com`.
- **User impact:** Works in production (Vercel origin is in CORS list), but fragile. Any origin change breaks it. Also exposes backend URL to browser network tab.
- **Severity:** **P2** (functional but architecturally wrong)

### BREAK #4: Inconsistent env var fallbacks
- **Files:** `lib/scheduler-status.ts` falls back to `""` (same-origin). All other files fall back to `https://nadakki-ai-suite.onrender.com`.
- **next.config.js** checks `NEXT_PUBLIC_RENDER_API_URL` which no other file reads.
- **User impact:** If env vars are partially configured, different modules contact different backends.
- **Severity:** **P3** (configuration hygiene)

---

## 3. SAFE_FIX_QUEUE_P1

| # | Fix | File(s) | Lines of Code | Impact |
|---|-----|---------|---------------|--------|
| 1 | **Add `/campaigns` rewrite** — add `{ source: "/campaigns/:path*", destination: "${backendUrl}/campaigns/:path*" }` to next.config.js rewrites | `next.config.js` | +3 lines | **Fixes P0:** campaigns page gets real data instead of MOCK_CAMPAIGNS |
| 2 | **Export PATCH from catch-all Route Handler** — add `export async function PATCH(req, ctx)` mirroring the existing POST handler | `app/api/v1/[[...path]]/route.ts` | +10 lines | **Fixes P1:** billing upgrade button works |
| 3 | **Move autopilot.ts to same-origin** — replace `${BACKEND_URL}/marketing/*` calls with same-origin `/marketing/*` paths, add 3 rewrites to next.config.js for `/marketing/campaigns/active`, `/marketing/campaigns/autopilot/*`, `/marketing/autopilot/*` | `lib/api/autopilot.ts` + `next.config.js` | ~15 lines | **Fixes P2:** removes cross-origin dependency |
| 4 | **Normalize scheduler-status.ts fallback** — change `""` to match the standard `"https://nadakki-ai-suite.onrender.com"` fallback | `lib/scheduler-status.ts` | 1 line | **Fixes P3:** consistent behavior across modules |
| 5 | **Remove NEXT_PUBLIC_RENDER_API_URL** — only checked in next.config.js, unknown to all other files | `next.config.js` | -1 line | **Fixes P3:** removes dead env var |

---

## 4. FILES_LIKELY_TO_TOUCH

| File | Fix # | Change Type |
|------|-------|-------------|
| `next.config.js` | 1, 3, 5 | Add 4 rewrite rules, remove 1 dead env var reference |
| `app/api/v1/[[...path]]/route.ts` | 2 | Add PATCH (and optionally PUT, DELETE) export |
| `lib/api/autopilot.ts` | 3 | Replace absolute URLs with same-origin paths |
| `lib/scheduler-status.ts` | 4 | Normalize fallback string |

**Total: 4 files, ~30 lines changed.**

### Files that should NOT be touched:
- All `app/admin/*.tsx` pages — their API call patterns are correct (`/api/v1/*` → caught by Route Handler)
- `lib/api.ts` — same-origin pattern is correct; the bug is in the rewrite, not the fetch call
- `lib/api/endpoints.ts` — all paths are correct
- `lib/api/client.ts` — no changes needed
- `lib/api/base.ts` — no changes needed
- Any backend file — all backend routes are mounted and functional

---

## 5. FINAL_VERDICT

### What is solid:
- **40+ client-side pages** use `API_URL = ""` (same-origin) — correct and consistent
- **lib/api/endpoints.ts** has clean relative paths — no env vars, no drift
- **9 rewrite rules** in next.config.js cover SIC, auth, AME, advertising, analytics, marketing CRUD
- **6 dedicated Route Handlers** cover health, tenants, agents, SIC uploads
- **Backend CORS** allows both production and localhost origins
- **All backend routes** for the audited modules are mounted and returning real data

### What needs fixing:
1. **P0 — 1 silent mock substitution:** `/campaigns` unreachable → MOCK_CAMPAIGNS shown. Users see fake data and don't know it. Fix: 1 rewrite rule in next.config.js.
2. **P1 — 1 dead button:** PATCH not proxied → billing upgrade fails silently. Fix: add PATCH export to catch-all handler.
3. **P2 — 1 architectural bypass:** autopilot.ts calls backend directly from browser. Fix: move to same-origin + add rewrites.
4. **P3 — 2 config inconsistencies:** scheduler fallback differs from standard; dead env var in next.config.js.

### Bottom line:
The same-origin migration is **90% complete**. All page-level code is correct. The remaining gaps are in the proxy/rewrite layer (4 files, ~30 lines). The P0 campaigns fix is the highest priority — it's the only module silently serving fake data to users without any indication.

---

*Audit based on source code analysis. No runtime testing. No modifications made.*
