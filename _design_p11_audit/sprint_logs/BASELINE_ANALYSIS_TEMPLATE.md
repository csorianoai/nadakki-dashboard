# Baseline Screenshots Analysis — _to be filled after run_

**Generated:** 2026-05-10 (template)
**Filled in:** _________________  ·  by: _________________
**Source script:** `_design_p11_audit/audit-screenshots.js`
**Output dir:** `_design_p11_audit/screenshots/baseline/`
**Frontend baseline commit:** `9333381` (post Sprint 0)

---

## How to use this template

1. Cesar runs `.\_design_p11_audit\RUN_BASELINE.cmd` (or `node _design_p11_audit\audit-screenshots.js`) on Windows.
2. Confirms 10 PNGs land in `screenshots/baseline/`.
3. Either Cesar or Cowork (when access permits) walks each screenshot and fills the sections below.
4. The "Diff Analysis" section drives Sprint 1's `P11-01` migration scope.

---

## Screenshots generated

Check off each as it lands in `_design_p11_audit/screenshots/baseline/`. The script captures fullPage at viewport 1440×900.

- [ ] `baseline_credit-hub-home.png`        — `/credit-hub` portal landing
- [ ] `baseline_dealer-panel.png`           — `/credit-hub/dealer` (dealer home)
- [ ] `baseline_dealer-applications.png`    — `/credit-hub/dealer/applications` (solicitudes list)
- [ ] `baseline_dealer-new-application.png` — `/credit-hub/dealer/applications/new` (5-step wizard)
- [ ] `baseline_bank-panel.png`             — `/credit-hub/bank` (Mesa de decisiones)
- [ ] `baseline_bank-applications.png`      — `/credit-hub/bank/applications` (priorizada bandeja)
- [ ] `baseline_bank-analytics.png`         — `/credit-hub/bank/analytics` (Riesgo, ROI y dealers)
- [ ] `baseline_bank-compliance.png`        — `/credit-hub/bank/compliance` (Ley 172-13)
- [ ] `baseline_bank-audit.png`             — `/credit-hub/bank/audit` (visor)
- [ ] `prototype-light.png`                 — standalone `Forge Credit Hub - Navy Inverso Light (standalone).html`

**Total expected:** 10 PNGs.  **Total size budget:** ~5-15 MB (fullPage 1440-wide).

### Run metadata

| Field | Value |
|---|---|
| Run timestamp | _________________ |
| Wall-clock | ___ s |
| `Captured: X / Failed: Y` (from script summary) | ___ / ___ |
| Failures (if any) | _________________ |
| Chromium version downloaded | _________________ |

---

## Per-screen observations

> **For each row:** open the PNG, eyeball it, fill the cells. Tag visual quality as `GOOD` (ship-ready aesthetic), `OK` (functional but feels like a draft), `NEEDS WORK` (placeholder or broken).

### `credit-hub-home`
- **Size:** ___ KB
- **Visual quality:** GOOD / OK / NEEDS WORK
- **Loaded state:** normal / loading / error / empty
- **Notable elements:** _________________ (e.g. "4 portal cards visible, hero serif works, 2 cards greyed Próximamente")
- **Differences from prototype expectation:** _________________

### `dealer-panel`
- **Size:** ___ KB
- **Visual quality:** GOOD / OK / NEEDS WORK
- **Loaded state:**
- **Notable:** (greeting, 4 KPI cards, bandeja empty state)
- **Differences from prototype:**

### `dealer-applications`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:**
- **Notable:** (search + density + status tabs + skeleton rows)
- **Differences from prototype:**

### `dealer-new-application`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:** (note: redirects to `/applicant` step 1 of 5)
- **Notable:** (5-step wizard, form fields, Anterior/Guardar/Siguiente)
- **Differences from prototype:** (note: prototype doesn't model the wizard explicitly; this is dealer-unique)
- **UTF-8 sanity:** "Institución" reads cleanly? Y / N

### `bank-panel`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:** (likely error if backend down)
- **Notable:** (Mesa de decisiones hero, 4 KPIs sin sparkline, bandeja error state)
- **Differences from prototype:** (prototype has hero metric + sparkline + AI insights rail + AML rail + 6 charts + audit timeline; current is much sparser)

### `bank-applications`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:**
- **Notable:**
- **Differences from prototype:**

### `bank-analytics`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:**
- **Notable:** (4 KPI placeholders, 2 chart slot placeholders)
- **Differences from prototype:** (prototype has LineChart velocidad + DonutChart score + FunnelChart embudo all populated)

### `bank-compliance`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:**
- **Notable:** (3 stat cards + "Sin alertas AML/KYC" success state + "Derecho al olvido" copy)
- **Differences from prototype:** (compliance not heavily modeled in prototype; this might be a "fine, keep as-is" case)

### `bank-audit`
- **Size:** ___ KB
- **Visual quality:**
- **Loaded state:** (empty likely)
- **Notable:** (inbox icon + empty state copy + "Ver bandeja de solicitudes" CTA)
- **Differences from prototype:** (prototype has an Audit timeline card with 5 events; current is empty-state-only)

### `prototype-light`
- **Size:** ___ KB (expect bigger — fullPage of a 3000-4000px-tall mockup)
- **Visual quality:**
- **Loaded state:** (light by default — Navy Inverso)
- **Notable:** (sidebar 18 items, hero metric RD$14.2M + sparkline, 4 KPIs with sparklines, bandeja 9 rows, AI Insights rail, AML rail, 6 charts, audit timeline)

---

## Diff Analysis (current `main @ 9333381` vs prototype Navy Inverso)

> Fill in based on side-by-side comparison of `baseline_bank-panel.png` vs `prototype-light.png` (the most representative pair). Migration effort tags align with `VISUAL_AUDIT_REPORT.md` Section "Component Mapping Table".

| Element | Current state | Prototype state | Migration effort | Sprint |
|---|---|---|---|---|
| Page background | Light grey-white | Light blue `#DBEAFE` | tokens.css (4h) | P11-01 |
| Card surface | White on grey | White on light-blue | tokens.css (incl. above) | P11-01 |
| Card shadow | Hardish dark | Soft Stripe/Apple stack | tokens.css + `--sh-*` (incl. above) | P11-01 |
| Sidebar header | Navy gradient | Same navy gradient | KEEP — already aligned | — |
| Sidebar nav count | 5 items (bank) / 4 (dealer) | 18 items in 6 groups | REFACTOR sidebar (4h, decided "aspirational option A") | P11-08 (shell) |
| Sidebar collapsible | No | Yes (chevron toggle) | REFACTOR (incl. above) | P11-08 |
| Topbar | Persona eyebrow + tenant + ⌘K search | + theme toggle + bell + avatar | REFACTOR (3h) | P11-08 |
| Hero greeting | Static "Buenas tardes, {tenant}" | Hourly-dynamic, persona-aware | REFACTOR (3h) | P11-11 |
| Hero metric | None (just greeting) | `RD$ 14.2M` + delta + 30-day spark | NEW (4h) | P11-11 |
| KPI cards | label + value | + sparkline + deltaPct trend pill | REFACTOR KpiCard (4h) | P11-11 |
| Bandeja table | Simple table, search + density | + threshold colors + bulk-select + 11 columns | REFACTOR (6h) | P11-11 |
| AI Insights rail | Does not exist | 3 cards tone-coded, brain icon | NEW (8h) | P11-13 |
| AML Alerts rail | Does not exist | 2-3 alerts severity-pilled | NEW (5h) | P11-13 |
| Charts row (Speed/Donut/Funnel) | 2 empty card slots | All 3 populated | NEW (16h, Recharts) | P11-30 |
| Heatmap + dealers row | Does not exist | Hourly heatmap + BarRanking | NEW (12h) | P11-30 |
| Scatter + Geo row | Does not exist | DTI×LTV bubbles + GeographicStripRD | NEW (18h, D3) | P11-30 |
| Audit timeline | Empty state only | 5-event timeline grid | NEW (6h) | P11-30 |
| Cmd+K palette | Exists (`ForgeCreditHubCommandPalette`) | Same + fuzzy search + recientes | REFACTOR (4h) | P11-28 |
| Tweaks panel | Does not exist | Dev/staging tenant+theme flip | NEW (4h) | P11-28 |
| Theme toggle (real) | Does not exist | Sun/moon in topbar | NEW (3h) | P11-01 |

**Aggregate:** ~12 elements REFACTOR + ~8 elements NEW. Aligned with VISUAL_AUDIT_REPORT's 168h estimate.

---

## Recommendations for Sprint 1 (P11-01 Visual System V2)

Strictly token-level wins that should land in P11-01 BEFORE any new component work:

1. **Migrate `tokens.css` from prototype** — `forge-design-preview/forge/tokens.css` (the Navy Inverso version that already passed WCAG AA dual-mode) into `app/(forge)/credit-hub/_design/tokens.css`. **Caveat:** `sprint1_prep/SPRINT_1_READINESS_REPORT.md` flags D0-* decisions needed first (R1 ink-* collision, R2 polarity, R3 data-tenant slug drift). NOT a copy-file-day-1 task per Cursor's analysis.

2. **Add soft Stripe/Apple shadows for light theme** — already validated in Navy Inverso variant.

3. **Add `--sh-modal` light value** — currently dark-tuned shadows look heavy on light bg.

4. **Wire real theme toggle in topbar** — `<ThemeToggle>` button that sets `data-theme="dark"/"light"` on `<html>` + persists in localStorage. ~3h.

5. **Tabular-nums on all numeric cells** — `font-variant-numeric: tabular-nums` global on `.tnum` class + KPI value containers. ~1h.

6. **Sparkline slot on `KpiCard`** — opt-in prop `sparkData?: number[]`. Backwards-compatible. ~4h.

**Sprint 1 P11-01 net effort:** ~17h if all 6 land. If only items 1-3 (pure token migration), ~8h per the master plan.

---

## Open questions to answer during baseline review

- [ ] **Q1:** Is the current `tokens.css` file 1:1 swappable with the prototype's, or does it pre-load with different ink-* semantics? — Answer in `sprint1_prep/01_CURRENT_TOKENS_STATE.md`
- [ ] **Q2:** Does the current production sidebar use `data-forge-sidebar-header` for the dark gradient, or a different selector? Required for Navy Inverso override compatibility
- [ ] **Q3:** Are there cross-references to `--forge-bg-overlay` and `--forge-bg-overlay-strong` in components.jsx-equivalent files? They were the source of the hover-invisibility bug in the variant
- [ ] **Q4:** Is `tenantConfig.institution_name` still the source of the topbar fallback string post-P11-S0-03? (relevant to UTF-8 test in `VISUAL_VALIDATION_CHECKLIST.md`)
- [ ] **Q5:** Does the Command Palette currently support fuzzy search, or just substring filter? (gates Sprint 8's P11-28 scope)

---

## Sign-off

- [ ] All 10 screenshots captured (or failures documented)
- [ ] Per-screen observations complete (10 of 10)
- [ ] Diff analysis table reviewed
- [ ] Recommendations for Sprint 1 confirmed by Cesar
- [ ] Open questions assigned to owners

**Reviewed by:** _________________
**Date:** _________________
**Hand-off to Sprint 1:** [ ] CLEARED / [ ] BLOCKED — _____ (reason)
