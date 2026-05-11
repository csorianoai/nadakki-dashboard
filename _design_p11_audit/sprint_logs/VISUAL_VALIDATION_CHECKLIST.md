# Visual Validation Checklist — Post Sprint 0

**Date:** 2026-05-10
**Branch under test:** `feat/p11-01-visual-system-v2` (re-run for P11-01 Step 6)
**Tester:** Cowork (Chrome MCP) · **Date executed:** 2026-05-10
**Purpose:** Confirm Sprint 0 bug fixes landed correctly AND that prior P10-05/P10-11 work didn't regress. ~5-10 min total.

**RUN RESULT — 2026-05-10 (P11-01 Step 6 pre-merge validation):**

- Test 1 UTF-8 mojibake (BUG-A3): ✅ **PASS** — "Credicefi" + "Institución financiera" + accentos `ó/í/é` all clean
- Test 2 `/dealer/simulator` redirect (BUG-A1): ✅ **PASS** — landed on `/preapproval`
- Test 3 `/bank/queue` redirect (BUG-A2): ✅ **PASS** — `location.pathname` = `/credit-hub/bank/applications`
- Test 4 Command Palette → /applications (P11-S0-02): ✅ **PASS** — "Ir a cola de revisión" click landed on `/applications`
- Test 5 Multi-tenant chrome (P10-05): ✅ **PASS** — Credicefi topbar + `RD$0.00` + branding fetch 200
- Test 6 Hydration (P10-11): ✅ **PASS with caveat** — Grammarly extension noise only, no app-code mismatch
- Test 7 Backend smoke: ⚠️ partial — backend bandeja endpoint returning error, branding endpoint OK

**Final result: 6/6 required tests PASS · Sign off Sprint 0 carry-over · Sprint 1 P11-01 cleared for merge.**

Full P11-01 Step 6 report: `P11-01_VISUAL_QA_REPORT.md` in this folder.

---

## Pre-conditions

- [ ] Dev server running on `http://localhost:3000`
- [ ] Browser hard-refreshed (`Ctrl+Shift+R`) on each test to bust HMR cache
- [ ] DevTools open (Console + Network tabs visible)
- [ ] Logged in as a user that lands on `/credit-hub` (any tenant)

> **Tip:** keep a tab pinned to `/credit-hub` and use `Ctrl+L` to clear console between tests.

---

## Test 1 — UTF-8 mojibake fix (BUG-A3 / P11-S0-03)

**Why:** the topbar previously rendered `Institucià³n financiera` due to latin1 bytes being decoded as UTF-8. Should now render `Institución` cleanly.

1. [ ] Hard-refresh `http://localhost:3000/credit-hub`
2. [ ] **Topbar verification:**
   - [ ] Topbar shows the tenant name correctly (e.g. `Credicefi`, not raw bytes)
   - [ ] If a fallback string is shown, it reads `Institución financiera` — accented `ó`, no `Ã³`
3. [ ] Navigate to `/credit-hub/dealer/applications/new` (this was the page where BUG-A3 was originally observed)
   - [ ] Topbar STILL reads `Institución financiera` cleanly (the original repro spot)
4. [ ] Hover/inspect cards that display vehicle types, cédula labels, "Próximamente":
   - [ ] All accented chars render as expected (`í`, `é`, `ó`, `ñ`)
   - [ ] No `Ã`, `Â`, `³` artifacts anywhere

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 2 — Redirect `/dealer/simulator` (BUG-A1 / P11-S0-01)

**Why:** the URL `/credit-hub/dealer/simulator` returned a 404. It should now redirect to the real preapproval page.

1. [ ] In a fresh tab, type `http://localhost:3000/credit-hub/dealer/simulator` and press Enter
2. [ ] **URL bar verification:**
   - [ ] URL ends up at `/credit-hub/dealer/preapproval` (browser does the redirect)
   - [ ] OR URL stays at `/simulator` but page renders the preapproval UI (server-side redirect, also fine)
3. [ ] **Page verification:**
   - [ ] No 404 page (no `404 | This page could not be found.`)
   - [ ] Simulator/preapproval form is interactable
4. [ ] **Sidebar verification:**
   - [ ] On `/credit-hub/dealer`, the sidebar item labeled `Simulador` should be clickable
   - [ ] Clicking it leads to the working page (not 404)

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 3 — Redirect `/bank/queue` (BUG-A2 / P11-S0-02)

**Why:** `/credit-hub/bank/queue` was not a real route. Should redirect to `/credit-hub/bank/applications` (the actual bandeja).

1. [ ] In a fresh tab, type `http://localhost:3000/credit-hub/bank/queue` and press Enter
2. [ ] **URL bar verification:**
   - [ ] URL ends up at `/credit-hub/bank/applications`
3. [ ] **Page verification:**
   - [ ] No 404
   - [ ] Page renders "Solicitudes priorizadas" or equivalent bandeja header
   - [ ] Search input + sort/filter controls visible (even if data fails to load due to backend)

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 4 — Command Palette action target alignment (P11-S0-02)

**Why:** the Command Palette previously had an action labeled `bank-queue` that navigated to the dashboard instead of the queue. Should now go to `/bank/applications`.

1. [ ] On any Bank-portal page, open the Command Palette:
   - Keyboard: `Ctrl+K` (or `Cmd+K` on Mac)
   - Or: click the search icon in the topbar (magnifying-glass button)
2. [ ] Palette opens as a centered modal with search input + grouped action list
3. [ ] In the search box, type `bandeja` (or `queue` / `bank-queue` if the action key is visible)
4. [ ] **Click the matching action** (likely labeled "Bandeja", "Solicitudes priorizadas", or similar)
5. [ ] **URL bar verification:**
   - [ ] Navigates to `/credit-hub/bank/applications` (NOT to `/credit-hub/bank` dashboard)

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 5 — Multi-tenant chrome (P10-05 regression check)

**Why:** Sprint 0 didn't touch tenant-branding code, but our routing/i18n changes could have indirect effects. Confirm the live tenant fetch still works.

1. [ ] Hard-refresh `http://localhost:3000/credit-hub`
2. [ ] **DevTools Network tab:**
   - [ ] One `GET /api/v2/tenants/{slug}/branding` request fired → `200 OK`
   - [ ] No 4xx/5xx
3. [ ] **Topbar verification:**
   - [ ] Shows the tenant display_name (e.g. `Credicefi`)
   - [ ] No "Forge Credit Hub" generic fallback (unless intentional for an unknown tenant)
4. [ ] **CSS vars verification (DevTools Elements):**
   - [ ] Inspect `<div class="forge-app">` (or `<html data-tenant>` parent)
   - [ ] Computed style `--forge-brand-500` matches the tenant (e.g. Credicefi navy `#1B4A8C`, NOT the default `#2e5f97`)
   - [ ] `data-tenant="credicefi"` (or whichever) attribute present
5. [ ] **Currency / locale check:**
   - [ ] Any RD$ amount in the page uses `RD$` prefix
   - [ ] Date format follows `es-DO` (DD/MM/YYYY or "10 may 2026" Spanish style)
6. [ ] **Banner check:**
   - [ ] No red error banner between topbar and main content
   - [ ] No "Reference: ERR-…" identifier visible

> If you have local env override to flip tenant (e.g. `NEXT_PUBLIC_FORGE_TEST_TENANT=banco-piloto-rd`), do a second pass with that tenant and confirm the navy switches to corporate green.

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 6 — Modal hydration (P10-11 regression check)

**Why:** P10-11 fixed the SSR/client hydration mismatch where `<dialog>` vs `<section>` (Toaster) collided. Confirm the fix sticks across Sprint 0 routing changes.

1. [ ] Open DevTools Console
2. [ ] Clear console (`Ctrl+L`)
3. [ ] Hard-refresh `/credit-hub` (the page most likely to mount the shell + toaster + command palette together)
4. [ ] **Console verification:**
   - [ ] **NO** red error `Hydration failed because the server rendered HTML didn't match the client`
   - [ ] **NO** warning `Did not expect server HTML to contain a <X> in <Y>`
   - [ ] React DevTools (if installed) does NOT show "Hydration mismatch" badge on shell components
5. [ ] Navigate to `/credit-hub/dealer`, then `/credit-hub/bank`, then back to `/credit-hub`:
   - [ ] No hydration errors fired on any transition
6. [ ] Open the Command Palette (`Ctrl+K`):
   - [ ] Console stays clean (no new red errors)
   - [ ] Modal opens, focusable, accepts text input
7. [ ] Close Command Palette (`Esc` or click outside):
   - [ ] Console stays clean

**Result:** [ ] PASS / [ ] FAIL — notes: _______________

---

## Test 7 (bonus, optional) — Backend integration smoke

**Why:** Sprint 0 didn't touch backend, but it's worth a fast sanity that the data plane still produces something for the bandeja.

1. [ ] Hard-refresh `/credit-hub/bank/applications`
2. [ ] **Network tab:** any `GET /api/v2/credit/applications` or similar bandeja endpoint fires
   - [ ] If backend is up: returns 200 with JSON
   - [ ] If backend is down: page shows the documented error state `"No se pudo cargar la bandeja"` — NOT a crash or white screen
3. [ ] No console crashes

**Result:** [ ] PASS / [ ] FAIL / [ ] N/A (backend down) — notes: _______________

---

## Final result

- [ ] **All required tests (1-6) PASS** — Sprint 0 closes clean; ready to start Sprint 1
- [ ] **Some tests FAIL** — list below and decide:

| # | Test | Failure observed | Decision |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

**Decision after run:**

- [ ] ✅ Sign off Sprint 0, start Sprint 1
- [ ] ⏸️ Pause for hotfix(es) on `main`; re-run this checklist after
- [ ] 🔄 Re-open Sprint 0 with a new ticket P11-S0-07 capturing the regression

---

*Reportar resultado a Cesar vía chat o en `_design_p11_audit/sprint_logs/` con un archivo `SPRINT_0_VALIDATION_RUN_{YYYY-MM-DD}.md`.*
