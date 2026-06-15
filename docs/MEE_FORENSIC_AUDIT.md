# MEE Forensic Audit — Production vs PR #129 Report

**Date:** 2026-06-15  
**Scope:** `dashboard.nadakki.com/market-intel` after merge of PR #129 (~30 min prior to report)  
**Auditor:** Cursor (autonomous task packet)

---

## Executive summary

PR #129 merged the Claude Design **layout shell** (RunsSidebar, tabs, sections, CSS tokens) to `origin/main`, but **did not merge** follow-up commit `6b35762` (FiltersBar visual polish). Filter state is wired in `IntelligenceView`, but **three of four sections ignore most filter dimensions**; only `FindingsPanel` applies `confidence`. Production symptoms match **incomplete merge + missing filter implementation**, not a stale Vercel cache.

---

## §1 Investigation findings

### 1.1 Git / main verification

```
git fetch origin
git log origin/main --oneline -10
```

| Commit | Present on `origin/main`? |
|--------|-------------------------|
| `0ccccec` feat(mee): port Claude Design package (#129) | ✅ |
| `4d81491` fix(market-intel): use canonical tenant context (#128) | ✅ |
| `6b35762` fix(mee): polish FiltersBar interactive affordance and active states | ❌ **Only on `feat/mee-redesign-from-claude-design`** |

**Conclusion:** The polish commit was reported as applied but **never reached main**. Root cause of flat FiltersBar in production.

---

### 1.2 FiltersBar.tsx on main

| Check | Expected (6b35762 / design target) | Reality on main |
|-------|-----------------------------------|-----------------|
| `--mee-accent-soft` / `--mee-accent-strong` on active `.seg button` | ✅ | ❌ Active = `var(--mee-surface)` white |
| Hover amber border | ✅ | ❌ No hover rule |
| `data-on="true"` + `aria-pressed` | ✅ | `data-on` only, no `aria-pressed` |
| Chip "Filtros · N" | ✅ | ❌ Missing |
| Amber `mee-filters-clear` Limpiar | ✅ | ❌ `btn btn-ghost btn-sm` |
| `mee-filters-bar` CSS layout classes | ✅ | ❌ Inline `style={{}}` only |

---

### 1.3 Section filter wiring

| Section | Receives `filters`? | `useMemo` subset? | Renders subset? | Verdict |
|---------|---------------------|-------------------|-----------------|---------|
| `FindingsPanel` | ✅ prop | ✅ | ⚠️ **confidence only** — ignores segment, tier |
| `MarketOverviewSection` | ⚠️ `segment?` only | ❌ | ❌ Always full `institution_shares` |
| `EntryStrategySection` | ❌ | ❌ | ❌ Full strategy always |
| `SourcesSummary` | ❌ | ❌ | ❌ Full `sources_summary` always |

---

### 1.4 IntelligenceView orchestrator

- ✅ `filters` state + `FiltersBar` `setFilters` wired
- ✅ FiltersBar shown on tabs `panorama`, `hallazgos`, `estrategia`
- ⚠️ Passes `segment={filters.segment}` to `MarketOverviewSection` but section **does not destructure/use it**
- ❌ Does not pass `filters` to `EntryStrategySection` or `SourcesSummary`

---

### 1.5 Vercel / production deploy

```powershell
Invoke-WebRequest https://dashboard.nadakki.com/market-intel
```

| Marker | Result |
|--------|--------|
| `RunsSidebar`, `Panorama`, `FiltersBar`, `filters-clear` in HTML | ❌ Not in initial HTML (auth gate: "Verificando sesion...") |
| `app/market-intel/page-*.js` chunk | ✅ Present in RSC payload |
| `market-intel-root` wrapper | ✅ Present |

**Conclusion:** Unauthenticated curl cannot inspect hydrated MEE DOM. Bundle for `/market-intel` is deployed (post-#129). Flat filters and non-functional charts are **code defects on main**, not cache serving an old build.

---

### 1.6 Knowledge pack DO timestamps

Repo: `nadakki-ai-suite/knowledge_packs/market_intel/do/research_mock.yaml`

| Label / field | Location | Value | Issue |
|---------------|----------|-------|-------|
| `year: 2024` on data_points | yaml (throughout) | 2024 | Last BCRD/SIB **annual** close — stale for Jun 2026 report |
| `market_overview.regulatory_environment` | yaml | "dic 2024", "Q4 2024" | Hardcoded |
| `deriveMarketTrend()` | `app/market-intel/lib/market-trend.ts` | years `[2020…2024]` | Hardcoded frontend |
| CardHeader sub | `MarketOverviewSection.tsx` | "serie 2020–2024" | Hardcoded UI string |
| KpiStat sub | `IntelligenceView.tsx` | "sistema · 2024" | Hardcoded UI string |
| `manifest.yaml` version | pack | `1.0.0` | Needs bump after date refresh |

No Q1 2026 BCRD/SIB annual series available in pack; **2025 is the correct as-of ceiling** for annual metrics.

---

## Problem matrix (required)

| Problema | Esperado | Realidad | Causa raíz | Fix |
|----------|----------|----------|------------|-----|
| **Polish visual FiltersBar** | Amber hover/active, count chip, amber Limpiar (commit `6b35762`) | Botones planos; activo = blanco `--mee-surface` | Commit `6b35762` **not merged** with #129 | PR `fix/mee-filters-visual-polish` — cherry-pick `6b35762` |
| **Filtros funcionales** | Click segment/tier/confianza cambia charts, donut, listas | Panorama/estrategia/fuentes ignoran filtros; hallazgos solo filtra confianza | Props no pasadas + `useMemo` ausente en 3 secciones; `segment` prop unused | PR `fix/mee-filters-functional` — `mee-filters.ts` + wire all sections + integration tests |
| **Timestamps 2024 vs 2026** | Reporte Jun 2026 muestra as-of ≥ 2025 | "serie 2020–2024", "sistema · 2024", pack yaml `year: 2024` | Hardcoded en yaml + frontend labels + `deriveMarketTrend` | PR `fix/mee-pack-do-timestamps-2026` (backend pack + frontend labels) |

---

## Why 20/20 tests PASS did not catch these

| Test file | What it asserts | Gap |
|-----------|-----------------|-----|
| `FindingsPanel.test.tsx` | confidence=alto hides f2 | Never tests segment/tier; never tests via FiltersBar click |
| `MarketOverviewSection.test.tsx` | Smoke render only | No filter props, no tier subset |
| `EntryStrategySection.test.tsx` | Tier cards render | No filters |
| `intelligence-view-smoke.test.tsx` | Tabs exist, no `[object Object]` | No filter interaction |
| `FiltersBar.test.tsx` | Polish + count chip | **Exists only on unmerged branch** — not in main CI |

**Pattern:** Unit tests validate **isolated props** the production path never applies. No integration test connects `FiltersBar` onClick → parent state → section re-render. Visual polish has **zero** test coverage on main.

---

## Recommendations for PR #129 v2 (regression prevention)

1. **Integration:** `IntelligenceView` — click Hallazgos → Alta → assert only `confidence: alto` findings; click Panorama → T1 → assert institution count drops.
2. **Section contracts:** Each section test must pass `filters` and assert rendered subset ≠ full snapshot.
3. **Visual:** `FiltersBar.test.tsx` on main — assert `data-on="true"` button computed style includes accent (or class `mee-filters-clear`).
4. **Merge gate:** Any MEE PR must include commit hash checklist vs design branch before claiming "polish applied".
5. **Timestamps:** Assert UI substrings match `snapshot.metadata.as_of_year` or pack manifest `effective_date` — fail CI if hardcoded year < current year − 1.

---

## §5 Cross-check Package 1 Bank (PR #133)

Branch: `feat/credit-hub-bank-port` — **OPEN, do not merge until MEE fixes reviewed.**

### 5.1 BankApplicationsTable filter wiring

| Check | MEE (main) | Bank (#133) |
|-------|------------|-------------|
| Filter UI equivalent | `FiltersBar` (segment/conf/tier) | `BankSegment` ×2 (estado, prio) + score input |
| State → subset via `useMemo` | ❌ Broken in sections | ✅ Lines 44–59 filter + sort |
| Renders filtered subset | ❌ | ✅ `QueueTable items={filtered}` |
| Click filter changes visible rows | ❌ | ✅ Logic correct |
| Test: click filter → data change | ❌ | ❌ Only smoke test |

### 5.2 Visual / token comparison

| Component | Bank (#133) | MEE (main prod) |
|-----------|-------------|-----------------|
| Segment active state | `BankSegment`: `--ch-surface` + shadow (Package 0 CH pattern) | `.seg button[data-on=true]`: same **subtle white** pattern |
| Accent polish | `--ch-accent-text` on Limpiar ghost button | No amber affordance |
| KPI strip | `BankExecutiveMetrics` → `ForgeMetricCard` (forge tokens) | `KpiStat` in amber MEE shell — separate design system |
| Badges | `PriorityBadge` / `StatePill` with explicit semantic colors | MEE chips OK; **seg buttons** are the gap |

Bank **does not** have MEE's missing-commit problem; it implements Package 0 `BankSegment` as designed. MEE drift is **unmerged polish commit**, not a universal Cursor failure.

### 5.3 Cross-check table

| Bug MEE | Aplica a Bank? | Archivo Bank | Fix requerido en #133? |
|---------|----------------|--------------|------------------------|
| FiltersBar polish not visible (6b35762 not merged) | **No** — different token system; CH segments match design package | `bankUi.tsx` `BankSegment` | **No** — intentional CH surface-active pattern |
| Filter clicks don't change rendered data | **No** — `useMemo` filters rows correctly | `BankApplicationsTable.tsx` | **No** — functional wiring OK |
| Stale 2024 timestamps in report | **No** — bank views use relative time / live API analytics | N/A | **No** |
| Tests don't catch filter integration | **Partial** — same smoke-only gap | `BankApplicationsTable.test.tsx` | **Optional** — add filter click test in future; not blocking #133 |

### 5.4 / 5.5 Decision

**Bank does NOT inherit MEE functional bugs.** No commits pushed to `feat/credit-hub-bank-port` for inherited fixes.

**Pattern to retroapply to MEE:** Bank's `BankApplicationsTable` — filter state colocated with `useMemo` subset passed directly to the render target (`QueueTable`). MEE should mirror: pass full `filters` to each section, compute subset in `useMemo`, render subset only.

---

## Fix PRs (created, not merged)

| Branch | Repo | Status |
|--------|------|--------|
| `fix/mee-filters-functional` | nadakki-dashboard | Pending |
| `fix/mee-filters-visual-polish` | nadakki-dashboard | Pending |
| `fix/mee-pack-do-timestamps-2026` | nadakki-ai-suite + dashboard labels | Pending |

**Awaiting explicit go-ahead before any merge.**
