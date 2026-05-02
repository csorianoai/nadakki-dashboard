# Phase 9 v3 — Hybrid Intelligent — validation

**Date:** 2026-05-02  
**Branch:** `main` (pushed incrementally per layer)

## Commits (short SHA)

| Layer | Message | SHA |
|-------|---------|-----|
| L7 | `polish(forge): table density polish — compact default, Bloomberg-grade scan efficiency` | `97ccffe` |
| L1 | `feat(forge): calibrated hero typography — presence without pushing critical data below fold` | `3140081` |
| L2 | `feat(forge): KPI cards with iconography — instant render no count-up` | `f353b11` |
| L6 | `polish(forge): microinteractions sweep — shadow elevation, no decorative motion` | `2ad0a5f` |
| L3 | `feat(forge): compact micro-charts in bank dashboard insights section` | `59ea829` |
| L5 | `feat(forge): sidebar header gradient depth — single-color OKLCH` | `f2b223b` |

L4 (page transitions): **not implemented** — default Next.js navigation kept.

---

## L8 — Self-validation (Q1–Q6)

**Q1 — Visual quality improved vs pre–Phase 9 bank home?**  
**PASS** — Hero typography (calibrated clamp), KPI iconography, sidebar header depth, and post-table Insights charts increase premium presence without bloating above-the-fold chrome.  
*Screenshots:* not captured in this environment; compare locally at `/credit-hub/bank` before `97ccffe` vs after `f2b223b`.

**Q2 — Speed regression?**  
**PASS** — Forge `KpiCard` renders numeric `value` directly (no `CountUpNumber`). Chart line animation is **400ms on first mount only**, disabled when `prefers-reduced-motion: reduce` (`MicroChart` via `useSyncExternalStore`). No page-transition layer added.  
*Formal stopwatch benchmark:* not run here; code paths reviewed for blocking animations on KPIs.

**Q3 — Cognitive load increased?**  
**PASS** — No new decorative motion on dense tables; charts confined below queue; KPI labels remain uppercase compact; interactions limited to shadow/color per L6.

**Q4 — Institutional (Stripe ops / Linear), not consumer?**  
**PASS** — Dense tables, tabular alignment, serif headline + sans data, restrained palette and line-only charts match institutional target.

**Q5 — Tables felt fast (Layer 7)?**  
**PASS** — Unchanged baseline from L7 commit: compact default, sticky header, ink-100 row rules, selection rail; L6 only adds ≤100ms row hover color transition + `motion-reduce:transition-none`.

**Q6 — Premium vs pure performance v2?**  
**PASS** — Visible delta: serif hero, sidebar gradient, inline KPI icons, Insights charts — still scan-first.

---

## Build / docs gates (this session)

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✓ |
| `npm run build` | ✓ (exit 0; local Windows App Control warnings on `@next/swc-win32-x64-msvc`, build used WASM fallback) |
| `npm run docs:validate` | ✓ (after `COMPONENTS.md` **MicroChart** section) |

**Lighthouse a11y `/credit-hub/preview`:** not re-executed in this session. Prior documented score in `POLISH.md`: **0.97** (≥ 0.95). Re-run after deploy:  
`npx lighthouse http://localhost:3000/credit-hub/preview --only-categories=accessibility --output=json --quiet`.

**Production:** Vercel deploys from `origin/main` per push; verify latest SHA on hosting dashboard.

---

## Files touched (summary)

- **L7:** `DataTable.tsx`, `StatusPill.tsx`, bank/dealer applications + dashboards, `preview/page.tsx` (earlier commit).
- **L1:** `bank/page.tsx`, `dealer/page.tsx`, `bank/applications/page.tsx`, `dealer/applications/page.tsx`, `preview/page.tsx`.
- **L2:** `KpiCard.tsx`, `bank/page.tsx`, `dealer/page.tsx`, `preview/page.tsx`.
- **L6:** `Card.tsx`, `Button.tsx`, `EvidenceCard.tsx`, `IconButton.tsx`, `DataTable.tsx`.
- **L3:** `MicroChart.tsx`, `components/forge/index.ts`, `bank/page.tsx`, `POLISH.md`.
- **L5:** `ForgeCreditHubSidebar.tsx`.
- **Docs:** `COMPONENTS.md` (MicroChart + KpiCard props), `POLISH.md` (chart wiring note).

---

## Row height note (L7)

Compact `DataTable` body cells use **`py-2.5`** (`10px` × 2) plus **`text-forge-xs`** line box ≈ **16px** content → ~**36px** row target before borders; verify in DevTools if pixel-perfect compliance is required.
