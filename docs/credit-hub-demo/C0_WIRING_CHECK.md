# C0 — Wiring Check (Credit Hub Demo)

**Date:** 2026-07-08  
**Executor:** Cursor (PHASE_GATED)  
**Handoff source:** `nadakki-ai-suite/docs/credit_hub_demo/HANDOFF_CURSOR.md` (sibling repo — **not** copied into dashboard; read-only verification)  
**Scope:** Panels marked **READY** / **SEEDED** / **OLA1** in handoff vs frontend wiring in `nadakki-dashboard`

---

## Prerequisite status

| Check | Result |
|-------|--------|
| `HANDOFF_CURSOR.md` exists | **PASS** — `C:\Users\ramon\Projects\nadakki-ai-suite\docs\credit_hub_demo\HANDOFF_CURSOR.md` |
| Backend seed completed (claimed) | **Assumed** per handoff date 2026-07-08 |
| Frontend territory only | **PASS** — audit read-only, no backend edits |

---

## Fetch layer (all panels)

All Credit Hub data hooks use `useTenant()` → `X-Tenant-ID` header. No panel uses raw `fetch()` with manually constructed tenant headers outside `chFetch` / `creditCoreFetch` / `offersFetch`.

| Client | File | Headers |
|--------|------|---------|
| `chFetch` | `lib/credit-hub/api/client.ts` | `Authorization`, `X-Tenant-ID`, `X-Actor-Role` |
| `creditCoreFetch` | `lib/credit-hub/api/creditCoreClient.ts` | `Authorization`, `X-Tenant-ID` |
| `offersFetch` | `lib/credit-hub/api/offersClient.ts` | `Authorization`, `X-Tenant-ID` |

Next.js rewrites proxy browser calls: `/api/v2/credit/*` and `/credit/*` → Render backend (`next.config.js` L265–298).

---

## Panel matrix — handoff vs code

| Panel | Handoff state | Component | Endpoint esperado (handoff) | Endpoint real (código) | Match | Notas |
|-------|---------------|-----------|----------------------------|------------------------|-------|-------|
| **D1** Dashboard Summary | READY | `DealerDashboardView` → `DealerPipelineRail`, `DealerKpiStrip` | `GET /credit/dashboard/summary` | `GET /credit/dashboard/summary` via `getDashboardSummary` → `chFetch` | **YES** | Fallback DEMO en pipeline si summary falla (no mock numérico del endpoint) |
| **D2** Banks Ranking | READY | `BankRanking.tsx` | `GET /api/v2/credit/analytics/banks-ranking` | Same via `getBanksRanking` → `chFetch` | **YES** | **Riesgo:** fallback `DEMO_BANKS` en error (C3 debe remover) |
| **D3** Application List | READY | `DealerApplicationsListView` | `GET /api/v2/credit/applications` | Same via `listApplications` → `creditCoreFetch` | **YES** | — |
| **D4** Application Detail | READY | `DealerApplicationDetailView` | `GET /api/v2/credit/applications/{id}` | Same + `GET .../events` | **PARTIAL** | Handoff no menciona `/events`; dossier usa GET estándar, no `/expediente/full` |
| **D5** Offers per App | READY | `DealerApplicationDetailView`, `OfferComparatorSpotlight` | `GET /api/v2/credit/applications/{id}/offers` | `GET /credit/applications/{id}/offers` via `offersFetch` | **DOC** | Path correcto en FE (Cap 11 mount sin `/api/v2`); handoff path **desactualizado** |
| **D6** Stats | READY | `DealerKpiStrip`, page loader | `GET /api/v2/credit/stats` | Same via `getCreditStats` → `creditCoreFetch` | **YES** | Sparklines `demoTrend` hardcoded (C3) |
| **D7** Pre-approval | N/A | `PreApprovalView` | Frontend-only | Client simulation | **N/A** | — |
| **D8** Simulator | N/A | Wizard / preapproval | Frontend-only | — | **N/A** | — |
| **B1** Queue (Bandeja) | READY | `BankApplicationsTable`, `BankDecisionQueueSpotlight` | `GET /api/bank/applications/queue` | `GET /api/v2/credit/applications/queue` via `getQueue` → `chFetch` | **DOC** | Handoff path legacy; FE usa v2 (rewrite OK). **Prod error posible:** tenant/auth, no proxy |
| **B2** Expediente | READY | `BankDetailLayout` / `BankDetailView` | `GET /api/v2/credit/applications/{id}/expediente/full` | `GET /api/v2/credit/applications/{id}` via `getApplicationForReview` | **NO** | Endpoint enriquecido **no consumido** |
| **B3** Claim / Decide | READY | `BankDecisionPanel`, detail handlers | `POST .../claim`, `POST .../decide` | Same via `bankClient.recordDecision` | **YES** | — |
| **B4** Analytics Dashboard | READY | `BankKpiStrip`, `BankAnalyticsView` | `GET /api/v2/credit/analytics/dashboard` | Same via `getAnalytics` → `chFetch` | **YES** | Period selector bank analytics **unwired** |
| **B5** Portfolio Health | READY | `PortfolioHealthGrid` | `GET /api/v2/credit/analytics/portfolio-health` | Same via `getPortfolioHealth` | **YES** | — |
| **B6** Dealers Ranking | READY | `BankAnalyticsView` | `GET /api/v2/credit/analytics/dealers-ranking` | Same via `getDealersRanking` | **YES** | Fallback a `analytics.top_dealers` |
| **B7** Risk Distributions | READY | `RiskCreditPanel`, `BankOperationsHub` | `GET /api/v2/credit/analytics/risk-distributions` | Same via `getRiskDistributions` | **YES** | Fallback `DEMO_PTI/LTV/REJECTIONS` (C3) |
| **B8** Auction Intel | READY | `AuctionIntel.tsx` | `GET /api/v2/credit/analytics/auction-intel` | Same via `getAuctionIntel` | **YES** | Sub-charts `DEMO_WIN_BREAKDOWN` (C3) |
| **B9** Audit Trail | READY | `BankAuditView`, detail tab | `GET /api/v2/credit/applications/{id}/audit-trail` | Same via `getAuditTrail` | **YES** | Aggregated view max 50 apps |
| **B10** Compliance | READY | `BankComplianceView`, detail | `GET /api/v2/credit/compliance/{id}` | Same via `getComplianceReport` | **YES** | — |
| **B11** Stipulations | PARTIAL | — | `GET .../stipulations` | **Not wired** in credit-hub bank UI | **NO** | Stipulations exist in legacy `(bank)` route only |
| **B12** Consent history | READY | — | `GET /api/v2/credit/consent/application/{id}/history` | Wizard consent only (`useConsentApi`); **not on bank detail** | **NO** | — |
| **G1** Monthly Goals | READY (seed) | `DealerGoals`, `BankGoals` | TBD → spec `GET /api/v2/credit/goals/monthly/{yyyy_mm}` | **No endpoint** — hardcoded targets | **NO** | Backend spec in `B_NEW_ENDPOINTS_SPEC.md`; FE not wired |
| **G2** User Profile | GAP | `DealerProfileView` | TBD | Local only, no save API | **N/A** | Handoff defers — badge PRÓXIMAMENTE OK |
| **G3** Notifications | GAP | `DealerNotificationsView` | TBD | Synthetic from `GET applications` | **N/A** | Handoff defers — badge PRÓXIMAMENTE OK |

---

## Discrepancy summary

| Category | Count | Panels |
|----------|-------|--------|
| **YES** (wired, same intent) | 14 | D1–D4 (partial), D6, B1 (path doc), B3–B10 |
| **DOC** (handoff path stale, FE correct) | 2 | D5 offers mount, B1 queue path |
| **NO** (READY but not wired / wrong endpoint) | **4** | B2 expediente/full, B11 stipulations, B12 consent on detail, G1 monthly goals |
| **N/A / GAP** | 3 | D7–D8, G2–G3 |

---

## STOP gate evaluation

**Rule:** If **>3 panels** marked READY/SEEDED do not match → report before C1.

**Hard NO matches (excluding doc-only path drift): 4**

1. **B2** — `expediente/full` not used  
2. **B11** — stipulations not wired in credit-hub  
3. **B12** — consent history not on bank expediente  
4. **G1** — monthly goals seeded but no GET goals client/hook  

**Additional risk (not counted as wiring mismatch but blocks honest demo):**

- `useTenant()` fallback to `DEFAULT_CREDIT_TENANT_ID` (`0a91ee98-…`) when `localStorage` empty — demo seed is on `nadakki-demo`, not default UUID  
- `is_demo` flag **not exposed** in tenant config response — blocks C2 as specified  
- Multiple tiles still use **local DEMO fixtures** on API error (`DEMO_BANKS`, `DEMO_PTI`, etc.)

### **→ STOP C1–C4. Escalate to César (interaction 1/2).**

Recommended decision points for César:

1. Confirm backend queue path is **`/api/v2/credit/applications/queue`** (handoff curl uses `/api/bank/...` — update handoff or add alias).  
2. Ship **`GET /api/v2/credit/goals/monthly/{yyyy_mm}`** + **`is_demo`** on tenant/session config before C2/C3.  
3. Decide if **`expediente/full`** is required for bank detail or if canonical `GET applications/{id}` is sufficient for demo.  
4. Approve FE-only C1 fix: **decouple bank KPI error from queue error** (analytics fail should not block bandeja spotlight).

---

## Broken panels in prod (pre-C1 observation, code-only)

Symptom: *"Ocurrió un problema al consultar el servicio"* (`EmptyStateRich` variant `error`).

| Panel | Error gate | Likely cause class |
|-------|------------|-------------------|
| Bank KPI strip | `isError = queueQuery.error \|\| analyticsQuery.error` | Either endpoint 401/403/404/500 **or** wrong tenant UUID |
| Bank bandeja | `queueQuery.error` only | Queue endpoint auth/tenant/RLS |
| Dealer pipeline/KPIs | `summaryQuery` error → partial DEMO fallback | `/credit/dashboard/summary` 404/500 |

**Network capture:** Not executed (no JWT in CI). Unauthenticated probe to Render → **401** on queue, analytics, summary (expected).

---

## Files referenced

- Handoff: `../nadakki-ai-suite/docs/credit_hub_demo/HANDOFF_CURSOR.md`
- Clients: `lib/credit-hub/api/{client,analyticsClient,bankClient,creditCoreClient,offersClient}.ts`
- Hooks: `lib/credit-hub/hooks/use{DashboardSummary,BanksRanking,BankQueue,BankAnalytics,ApplicationOffers,CreditApplications}.ts`
- Views: `components/credit-hub/{dealer,bank}/**`
