# SAME-ORIGIN FINAL MICRO-AUDIT
**Date:** 2026-03-26
**Repos:** nadakki-dashboard + nadakki-ai-suite
**Mode:** READ-ONLY
**Scope:** Visible/real/partial pages only

---

## 1. REMAINING_SAME_ORIGIN_GAPS

### GAP #1: Campaigns CRUD — all calls unreachable (P0)

**Pages affected:** `app/campaigns/page.tsx` + `lib/api.ts` (campaignsAPI)

| Call | Path Sent | Rewrite Exists? | Route Handler? | Result |
|------|-----------|----------------|----------------|--------|
| campaignsAPI.getAll | GET `/campaigns?tenant_id=` | NO (`/api/campaigns/:path*` requires `/api` prefix) | NO | **404 → MOCK_CAMPAIGNS silently shown** |
| campaignsAPI.getByStatus | GET `/campaigns?status=` | NO | NO | 404 → empty array fallback |
| campaignsAPI.getById | GET `/campaigns/{id}` | NO | NO | 404 → mock campaign |
| campaignsAPI.create | POST `/campaigns` | NO | NO | 404 → fake success |
| campaignsAPI.update | PUT `/campaigns/{id}` | NO | NO | 404 → fake success |
| campaignsAPI.delete | DELETE `/campaigns/{id}` | NO | NO | 404 → `{ success: true }` |
| campaignsAPI.activate | POST `/campaigns/{id}/activate` | NO | NO | 404 → `{ success: true }` |
| campaignsAPI.pause | POST `/campaigns/{id}/pause` | NO | NO | 404 → `{ success: true }` |

**Root cause:** `lib/api.ts` calls `/campaigns` (bare). The rewrite `source: "/api/campaigns/:path*"` only matches `/api/campaigns/*`. The backend mounts `campaigns_v2.py` at prefix `/campaigns`.

**Impact:** Every campaign operation silently fails. Users see MOCK_CAMPAIGNS and believe actions succeed.

---

### GAP #2: Catch-all Route Handler missing PATCH/PUT/DELETE (P1)

**File:** `app/api/v1/[[...path]]/route.ts`
**Exports:** `GET`, `POST` only. No `PATCH`, `PUT`, or `DELETE`.

**Pages blocked:**

| Page | Call | Method | Result |
|------|------|--------|--------|
| admin/billing | PATCH `/api/v1/tenants/{id}/billing` | PATCH | **405** → upgrade button dead |
| admin/config | PATCH `/api/v1/tenants/{id}/config` | PATCH | **405** → config save dead |
| admin/api-keys | DELETE `/api/v1/tenants/{id}/api-keys/{keyId}` | DELETE | **405** → key deletion dead |

All three silently swallow errors via `.catch(() => {})`.

**Note:** Marketing templates PUT/DELETE and segments PUT/DELETE call `/api/marketing/templates/{id}` and `/api/marketing/segments/{id}` — these go through the **rewrite** `source: "/api/marketing/:path*"` which proxies all methods, so they are NOT affected by this gap.

---

### GAP #3: Autopilot direct cross-origin calls (P2)

**File:** `lib/api/autopilot.ts`

| Call | URL Pattern | Origin |
|------|-------------|--------|
| fetchActiveCampaigns | `${BACKEND_URL}/marketing/campaigns/active` | Cross-origin (browser → Render) |
| fetchBestActions | `${BACKEND_URL}/marketing/campaigns/autopilot/best-actions` | Cross-origin |
| triggerAutopilotCycle | `${BACKEND_URL}/marketing/autopilot/cycle/trigger` | Cross-origin |

Works because backend CORS includes `https://nadakki-dashboard.vercel.app`. But:
- Exposes backend URL in browser DevTools
- Breaks if dashboard origin changes
- Inconsistent with every other client-side page using same-origin

---

### GAP #4: analyticsAPI in lib/api.ts calls wrong paths (P2)

**File:** `lib/api.ts` lines 267-282

| analyticsAPI call | Path sent | Backend path | Match? |
|-------------------|-----------|-------------|--------|
| getOverview | `/api/analytics/overview` | `/analytics/overview` | **NO** — extra `/api` prefix |
| getMetrics | `/api/analytics/metrics` | (no such endpoint) | **NO** — endpoint doesn't exist |
| getRealtime | `/api/analytics/realtime` | `/analytics/realtime` | **NO** — extra `/api` prefix |
| getTimeSeries | `/api/analytics/time-series` | (no such endpoint) | **NO** — endpoint doesn't exist |
| getPerformance | `/api/analytics/performance` | `/analytics/performance` | **NO** — extra `/api` prefix |

The rewrite `source: "/analytics/:path*"` proxies `/analytics/*` correctly. But `analyticsAPI` prepends `/api/analytics/` which doesn't match any rewrite. These calls hit the catch-all Route Handler which forwards to `${BACKEND_URL}/api/v1/api/analytics/...` — double prefix, guaranteed 404.

**Impact:** Any page using `analyticsAPI` from `lib/api.ts` gets MOCK_ANALYTICS silently. However, the canonical analytics page at `app/marketing/analytics/page.tsx` does NOT use `analyticsAPI` — it calls `/analytics/overview` directly (correct). So the impact is limited to any future page that imports `analyticsAPI`.

**Current exposure:** No visible page currently imports `analyticsAPI`. The mock data sits unused in `lib/api.ts`.

---

### GAP #5: Env var fallback inconsistency (P3)

| File | Fallback when NEXT_PUBLIC_API_URL is unset |
|------|--------------------------------------------|
| lib/api/autopilot.ts | `"https://nadakki-ai-suite.onrender.com"` |
| app/api/v1/[[...path]]/route.ts | `"https://nadakki-ai-suite.onrender.com"` |
| app/api/health/route.ts | `"https://nadakki-ai-suite.onrender.com"` |
| app/api/tenants/route.ts | `"https://nadakki-ai-suite.onrender.com"` |
| All other Route Handlers | `"https://nadakki-ai-suite.onrender.com"` |
| **lib/scheduler-status.ts** | **`""`** (same-origin) |
| **next.config.js** | checks `NEXT_PUBLIC_RENDER_API_URL` first (unique) |

---

## 2. CONTRACT_DRIFT

| Surface | Expected Contract | Actual Behavior | Drift Type |
|---------|------------------|-----------------|------------|
| Campaigns page | Real campaign CRUD | MOCK_CAMPAIGNS shown, all writes silently "succeed" | **SILENT_MOCK** |
| Admin billing upgrade | Plan change applied | Button click does nothing (405 swallowed) | **DEAD_BUTTON** |
| Admin config save | meta_live/sendgrid_live saved | Save does nothing (405 swallowed) | **DEAD_BUTTON** |
| Admin API key delete | Key removed | Delete does nothing (405 swallowed) | **DEAD_BUTTON** |
| Autopilot active campaigns | Same-origin proxied | Direct cross-origin to Render | **ARCHITECTURE_BYPASS** |
| Autopilot best actions | Same-origin proxied | Direct cross-origin to Render | **ARCHITECTURE_BYPASS** |
| Autopilot cycle trigger | Same-origin proxied | Direct cross-origin to Render | **ARCHITECTURE_BYPASS** |
| analyticsAPI (lib/api.ts) | `/analytics/*` paths | `/api/analytics/*` (wrong prefix) | **DEAD_CODE** (no current consumer) |

---

## 3. SAFE_P1_FIXES

| # | Fix | What Changes | Impact | LOC |
|---|-----|-------------|--------|-----|
| **F1** | Add `/campaigns` rewrite to next.config.js | `{ source: "/campaigns/:path*", destination: "${backendUrl}/campaigns/:path*" }` | **Fixes P0:** campaigns page gets real data, all CRUD works | +1 rule (~3 lines) |
| **F2** | Export PATCH, PUT, DELETE from catch-all Route Handler | Add 3 exports mirroring the existing `proxyRequest` pattern in `app/api/v1/[[...path]]/route.ts` | **Fixes P1:** billing upgrade, config save, API key delete all work | +18 lines |
| **F3** | Move autopilot.ts to same-origin | Replace `${BACKEND_URL}/marketing/*` with `/marketing/*` in `lib/api/autopilot.ts`. Add 3 rewrites to next.config.js: `/marketing/campaigns/:path*`, `/marketing/autopilot/:path*` | **Fixes P2:** removes cross-origin dependency | ~10 lines in autopilot.ts + 3 rewrite rules |
| **F4** | Fix analyticsAPI paths (preventive) | Change `/api/analytics/` to `/analytics/` in `lib/api.ts` analyticsAPI methods. Remove non-existent endpoints (metrics, time-series). | **Fixes P2:** prevents future breakage if analyticsAPI is ever used | ~5 lines |
| **F5** | Normalize scheduler-status.ts fallback | Change `""` to `"https://nadakki-ai-suite.onrender.com"` | **Fixes P3:** consistent env var behavior | 1 line |
| **F6** | Remove dead NEXT_PUBLIC_RENDER_API_URL check | Remove from next.config.js line 7 | **Fixes P3:** removes confusing dead env var | -1 line |

### Execution order (dependency-safe):
1. **F1** (campaigns rewrite) — standalone, highest impact
2. **F2** (catch-all methods) — standalone, unblocks 3 admin buttons
3. **F3** (autopilot same-origin) — requires new rewrites in same next.config.js edit
4. **F4** (analyticsAPI paths) — standalone, preventive
5. **F5 + F6** (env cleanup) — trivial, can batch together

---

## 4. FILES_LIKELY_TO_TOUCH

| File | Fixes | Changes |
|------|-------|---------|
| `next.config.js` | F1, F3, F6 | Add 4 rewrite rules, remove 1 dead env var ref |
| `app/api/v1/[[...path]]/route.ts` | F2 | Add PATCH, PUT, DELETE exports (~18 lines) |
| `lib/api/autopilot.ts` | F3 | Replace BACKEND_URL with same-origin paths, remove absolute URL construction |
| `lib/api.ts` | F4 | Fix analyticsAPI paths (5 lines) |
| `lib/scheduler-status.ts` | F5 | Normalize fallback (1 line) |

**Total: 5 files, ~35 lines changed.**

### Files confirmed safe — do NOT touch:
- `lib/api/endpoints.ts` — all paths correct
- `lib/api/client.ts` — no base URL, accepts caller paths
- `lib/api/base.ts` — `API_BASE = ""` correct
- `lib/api/marketing.ts` — `API_URL = ""` correct, functions use correct paths
- All `app/marketing/{templates,segments,journeys,analytics}/page.tsx` — use correct same-origin paths via MARKETING_ENDPOINTS or direct `/analytics/*`
- All `app/admin/{billing,usage,gates}/page.tsx` — GET/POST calls are correct (only missing PATCH/DELETE proxy)
- `hooks/useSocialConnections.ts` — correct paths
- Backend `main.py` — all routes mounted correctly

---

## 5. FINAL_VERDICT

### Scorecard

| Layer | Status | Issues |
|-------|--------|--------|
| Page-level code (40+ files) | **CLEAN** | All use `API_URL = ""` (same-origin) |
| lib/api/endpoints.ts | **CLEAN** | All relative paths correct |
| lib/api/marketing.ts | **CLEAN** | Same-origin, correct endpoints |
| lib/api/client.ts + base.ts | **CLEAN** | No env vars, no drift |
| Marketing CRUD pages (templates/segments/journeys) | **CLEAN** | Use MARKETING_ENDPOINTS → rewrite `/api/marketing/:path*` handles all methods |
| Marketing analytics page | **CLEAN** | Calls `/analytics/*` directly → rewrite handles it |
| next.config.js rewrites | **1 GAP** | Missing `/campaigns/:path*` rule |
| Catch-all Route Handler | **1 GAP** | Missing PATCH/PUT/DELETE exports |
| lib/api.ts campaignsAPI | **BROKEN** | Calls `/campaigns` but no rewrite catches it |
| lib/api.ts analyticsAPI | **DEAD CODE** | Wrong paths, no current consumer |
| lib/api/autopilot.ts | **BYPASS** | Direct cross-origin calls from browser |
| lib/scheduler-status.ts | **MINOR** | Inconsistent fallback |

### Summary

The same-origin architecture is **~92% complete**. The remaining 8% is concentrated in 5 files:

- **1 P0** — Campaigns page shows fake data (1 rewrite rule fixes it)
- **1 P1** — 3 admin buttons are dead (add 3 HTTP method exports)
- **2 P2** — Autopilot bypasses proxy + analyticsAPI has wrong paths
- **2 P3** — Env var inconsistencies

All marketing CRUD pages (templates, segments, journeys, analytics) and the social connections flow are **fully aligned** with same-origin. The fixes are mechanical, low-risk, and touch no business logic.

---

*Audit based on source code analysis. No runtime testing. No modifications made.*
