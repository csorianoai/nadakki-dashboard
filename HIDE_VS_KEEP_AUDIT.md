# HIDE vs KEEP VALIDATION AUDIT — NADAKKI DASHBOARD
**Audit Date:** 2026-03-25
**Method:** Code-level evidence — frontend page source + backend router mounts
**Branch:** main (both repos, synced with origin)

---

## EXECUTIVE SUMMARY

| Verdict | Count | Action |
|---------|-------|--------|
| KEEP_VISIBLE_REAL | 6 | No changes needed — live data, no silent mocks |
| KEEP_VISIBLE_PARTIAL | 8 | Keep visible but label or fix fallback behavior |
| HIDE_TEMPORARILY | 7 | Remove from sidebar — pure mock/demo with no API |
| FRONTEND_MISSING | 4 | Backend ready, no frontend page exists yet |
| BOTH_BROKEN | 1 | Backend not mounted AND no frontend page |
| NOT_PLANNED | 1 | Neither backend nor frontend exists |

---

## 1. KEEP VISIBLE — REAL DATA (no action needed)

These pages make real API calls with no silent mock substitution:

| Module | Endpoints | Notes |
|--------|-----------|-------|
| `/marketing/overview` | agents, campaigns, health, social status | DataSourceBadge shows live vs fallback |
| `/marketing/social-connections` | social status, OAuth connect/disconnect | Full OAuth flow |
| `/autopilot` | scheduler status, active campaigns, best-actions, trigger cycle | Direct calls to Render backend |
| `/scheduler` | scheduler/status | Error banner on failure, no fake data |
| `/admin/qa` | auth status (Meta/Google), agent dry-run | Real diagnostic tool |
| `/marketing/google-ads` | agents, social status | Placeholder agent names if API empty |

---

## 2. KEEP VISIBLE — PARTIAL (label or fix)

These pages call real APIs but have silent hardcoded fallbacks that may mislead:

| Module | Real API | Silent Fallback | Risk |
|--------|----------|-----------------|------|
| `/campaigns` | GET /campaigns?tenant_id= | MOCK_CAMPAIGNS silently substituted | User sees fake campaigns on API error |
| `/advertising` | GET /api/v1/advertising/dashboard | FALLBACK_ADVERTISING_DASHBOARD | DataSourceBadge labels it — acceptable |
| `/admin/billing` | GET /api/v1/billing/plans + tenant billing | DEFAULT_PLANS (Starter $999, Pro $2999, Enterprise $9999) | Wrong prices shown on error |
| `/admin/usage` | GET /api/v1/tenants/{id}/usage | EXAMPLE_USAGE (10 rows from Feb 2025) | Stale fake data shown on error |
| `/admin/gates` | GET /api/v1/gates + approve/reject | All gates reset to PENDING on error | Silent error swallowing |
| `/marketing/campaigns/editor` | None (local editor) | Local React state only | No save/load — work is lost on refresh |
| `/marketing/email-builder` | None (local editor) | Local React state only | No save/load — work is lost on refresh |
| `/marketing/google-ads` | agents, social | 5 hardcoded agent names if empty | Minor — clearly labeled |

### Recommended fixes for PARTIAL modules:
1. **campaigns**: Add DataSourceBadge pattern (like advertising) instead of silent mock swap
2. **admin/billing**: Show error state instead of hardcoded prices on API failure
3. **admin/usage**: Show error state instead of 2025 example data
4. **admin/gates**: Show error banner on API failure instead of silent reset

---

## 3. HIDE TEMPORARILY — PURE MOCK/DEMO

These pages make ZERO API calls and display 100% hardcoded data:

| Module | What User Sees | Reality |
|--------|---------------|---------|
| `/analytics` | Navigation hub with 6 links | Links go to non-existent sub-routes; analytics router NOT mounted |
| `/marketing/command-center` | KPIs: $156K revenue, 1,247 leads, 3.2% conversion | ALL hardcoded constants — no API |
| `/marketing/social` | 4 platforms, scheduled posts, inbox messages | ALL hardcoded arrays — no API |
| `/marketing/content` | Content generator with "AI" generation | setTimeout simulation — not connected to real AI engine |
| `/marketing/audience-builder` | Audience size calculator | Math.floor(125000 * factor) — no real data |
| `/marketing/leads` | 5 leads (Carlos Garcia, Maria Lopez...) | ALL hardcoded fake names/scores |
| `/admin/logs` | 10 log entries | ALL hardcoded — despite /api/v1/audit existing in backend |

### How to hide:
Remove these routes from the sidebar navigation in `components/layout/DashboardLayout.tsx`. The pages can remain in the codebase for future wiring.

---

## 4. FRONTEND MISSING — BACKEND READY

Backend CRUD endpoints exist and are mounted, but no frontend page consumes them:

| Capability | Backend Endpoint | Frontend Status |
|-----------|-----------------|-----------------|
| Marketing Templates | /api/marketing/templates (GET/POST/PUT/DELETE + /generate) | No page — lib/api/marketing.ts has functions ready |
| Marketing Segments | /api/marketing/segments (GET/POST/PUT/DELETE + /duplicate) | Stub at app/segments/ (wrong path, no API wired) |
| Marketing Journeys | /api/marketing/journeys (full CRUD + activate/pause) | No page exists |
| A/B Testing | AI generation engine (rewrite, AB variants, optimize) | No page exists |

### Priority:
Templates + Segments + Journeys pages are the fastest wins — backend CRUD is fully operational (committed Mar 25), and `lib/api/marketing.ts` already has the fetch functions written.

---

## 5. BOTH BROKEN

| Capability | Backend | Frontend |
|-----------|---------|----------|
| Marketing Analytics | analytics.py has 4 endpoints but is NOT MOUNTED in main.py | No page at /marketing/analytics |

**Fix:** Mount analytics.py in main.py (1-line fix), then build frontend page.

---

## 6. SIDEBAR RECOMMENDATION

### Current sidebar should KEEP:
- Marketing Overview
- Campaigns Hub
- Google Ads Hub
- Social Connections
- Autopilot / AME
- Scheduler / Motor de Ejecucion
- Advertising
- Admin > Billing
- Admin > Usage
- Admin > Gates
- Admin > QA
- SIC (all sub-routes — validated as ALIGNED in previous audit)

### Current sidebar should HIDE:
- Analytics (dead-end nav hub)
- Marketing > Command Center (pure demo)
- Marketing > Social (pure demo — NOT social-connections)
- Marketing > Content (fake AI)
- Marketing > Audience Builder (fake calculator)
- Marketing > Leads (fake data)
- Marketing > Email Builder (no save API)
- Admin > Logs (hardcoded — despite backend audit API existing)

### Should ADD when frontend pages are built:
- Marketing > Templates (backend ready)
- Marketing > Segments (backend ready)
- Marketing > Journeys (backend ready)

---

## ATTACHED FILES
- `MODULE_VALIDATION_MATRIX.csv` — Full matrix with verdict and evidence per module

---

*Audit based on source code analysis. No runtime testing. No modifications made.*
