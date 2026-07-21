# CURSOR_EXPOSE — Final Report (Credit Hub Demo)

**Date:** 2026-07-08  
**Loop:** `CURSOR_LOOP_CREDIT_HUB_EXPONER_DEMO_v1`  
**Repo:** `csorianoai/nadakki-dashboard` (frontend only)  
**Status:** **STOP at C0** — awaiting César decision before C1–C4

---

## 1. C0 — Wiring matrix + discrepancies

Full table: [`C0_WIRING_CHECK.md`](./C0_WIRING_CHECK.md)

| Metric | Value |
|--------|-------|
| Panels READY in handoff | 22 (incl. G1) |
| Wired match (YES + DOC) | 16 |
| Hard NO (wrong/missing endpoint) | **4** (B2, B11, B12, G1) |
| GAP (honest defer) | G2, G3 |

**STOP triggered:** 4 hard mismatches > threshold of 3.

---

## 2. C1 — Broken panels (not executed — blocked)

**Target panels:** Bank Bandeja + Bank KPI strip (prod error string confirmed in `EmptyStateRich`).

| Panel | Root cause (code analysis) | Fix owner |
|-------|---------------------------|-----------|
| Bank KPI strip | Coupled `isError` on queue **OR** analytics (`bank/page.tsx` L32) | **FE** — decouple errors (safe) |
| Bank bandeja | Independent queue query; failure = backend/auth/tenant | **Verify** with JWT + `X-Tenant-ID: nadakki-demo` |
| Dealer summary tiles | `/credit/dashboard/summary` failure → DEMO pipeline path | **Backend** if 404/500; **FE** if 200 parse bug |

**Network-first capture:** **NOT RUN** — no session token available in executor environment. Unauthenticated curls → 401.

**C1_BACKEND_HANDBACK.md:** Not created — no authenticated failure response captured. Pending smoke with demo login.

---

## 3. C2 / C3 — Not executed (blocked)

| Phase | Blocker |
|-------|---------|
| **C2** Demo banner | `is_demo` **not present** in tenant config / session payload consumed by `useTenantConfig` / `useTenantBranding`. Rule: no slug/UUID detection. → **[HANDBACK-CLAUDE-CODE: expose `is_demo` in tenant config]** |
| **C3** Remove tile DEMO badges | Requires C2 global banner + confirmed real data on G1/B2/B7/B8 sub-panels; removing mocks before backend goals endpoint would show empty goals |

---

## 4. C4 — Smoke evidence

**NOT RUN** (blocked at C0). Template for Cowork: [`C4_SMOKE_EVIDENCE.md`](./C4_SMOKE_EVIDENCE.md) (placeholder).

---

## 5. Honesty map (target state post-C3)

| Panel | Target badge |
|-------|--------------|
| D1, D2, D3, D4, D5, D6, B1, B3, B4, B5, B6, B7, B8, B9, B10 | **REAL** (no per-tile DEMO) |
| G1 Monthly Goals | **REAL** after goals API wired |
| B2 Expediente full | **REAL** after endpoint wired or handoff accepts canonical GET |
| B11 Stipulations | **PRÓXIMAMENTE** until seed + UI |
| B12 Consent (bank detail) | **REAL** when tab wired |
| G2 Profile, G3 Notifications | **PRÓXIMAMENTE** (handoff GAP) |
| D7 Pre-approval, D8 Simulator | Frontend-only (no badge) |
| BankAnalystProductivity, DealerTrendsAlerts (no Ola1 endpoint) | **PRÓXIMAMENTE** |

---

## 6. PRs opened

| Branch | Phase | Status |
|--------|-------|--------|
| — | C0 docs only | This commit (no PR yet) |
| `fix/credit-hub-broken-panels-fe` | C1 | **Not started** |
| `feat/credit-hub-demo-banner` | C2 | **Blocked** |
| `feat/credit-hub-remove-tile-badges` | C3 | **Blocked** |

---

## 7. [HANDBACK-CLAUDE-CODE] pending

| ID | Item | Evidence |
|----|------|----------|
| HC-1 | Expose `is_demo: boolean` on tenant config / session for C2 banner | Grep `is_demo` in dashboard `lib/credit-hub` → 0 |
| HC-2 | Confirm/implement `GET /api/v2/credit/goals/monthly/{yyyy_mm}` | Spec in `nadakki-ai-suite/docs/credit_hub_backend_audit/B_NEW_ENDPOINTS_SPEC.md`; FE has no client |
| HC-3 | Align handoff queue curl path (`/api/bank/...` vs `/api/v2/credit/.../queue`) | C0 matrix B1 |
| HC-4 | `GET .../expediente/full` — required fields vs canonical GET | B2 mismatch |
| HC-5 | Wire stipulations + consent history endpoints to credit-hub bank detail | B11, B12 |
| HC-6 | Authenticated prod smoke: queue + analytics + dashboard summary for `nadakki-demo` | C1 network-first |

---

## 8. Prohibition greps (baseline)

Run before any PR:

```powershell
# Must be 0 in new/changed code
rg -i credicefi app/ components/ lib/
rg d3b00111 app/ components/ lib/   # existing: lib/credit-hub/utils/nadakki-demo-tenant.ts (C3 must remove UUID detect)
```

---

## 9. Recommended next step (1 interaction with César)

**Ask César to confirm:**

1. Proceed with **FE-only C1** (decouple bank KPI vs queue errors + tenant guard) while backend delivers HC-1/HC-2?  
2. Or **wait** for `is_demo` + goals API before any demo exposure PR?

**If no response after 2 interactions → [NEEDS-HUMAN] with this report + `C0_WIRING_CHECK.md`.**

---

*End of report — phases C1–C4 intentionally not implemented pending STOP clearance.*
