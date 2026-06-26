# COCKPIT + CONFIG FIX PLAN

**Repo:** nadakki-dashboard
**Date:** 2026-06-26
**Pre-requisites:** COCKPIT_DEMO_AUDIT.md + CONFIG_CONTRAST_AUDIT.md reviewed by Cesar
**Test framework:** Jest 30.3.0 + @testing-library/react 16.3.2 (confirmed in package.json)

---

## Part A — Arreglable HOY (no backend nuevo requerido)

### A1: Config Page Dark Contrast Fix

**Archivo:** `app/(forge)/legal/config/page.tsx`
**Accion:** Replace light-mode classes with dark Tailwind classes that `legal-contrast.css` already overrides.

Changes:
- Lines 17, 21: `bg-white rounded-lg shadow border` → `bg-zinc-900 rounded-lg border border-zinc-800`
- Lines 26, 30, 41, 47, 52, 58, 62, 66: `text-slate-500` → `text-zinc-400`
- Line 33: `text-green-700` → `text-emerald-400`
- Line 35: `text-amber-700` → `text-amber-400`

**Riesgo:** LOW. These are display-only changes inside `.legal-surface` scope.
**Implementar hoy:** SI

### A2: PracticeAreaConfig — Fix Undefined CSS Variables

**Archivo:** `components/legal/PracticeAreaConfig.tsx`
**Accion:** Replace `--color-*` CSS variables (likely undefined) with Tailwind classes.

Changes:
- Line 14: `text-[var(--color-text-secondary)]` → `text-zinc-400`
- Line 28: `bg-[var(--color-surface-1)]` → `bg-zinc-900`
- Line 28-29: `border-[var(--color-border-subtle)]` → `border-zinc-700`
- Line 29: `opacity-50` → `opacity-60` (inactive areas — raise to WCAG-AA minimum)
- Line 34: `text-[var(--color-success-strong)]` → `text-emerald-400`
- Line 40: `text-[var(--color-text-tertiary)]` → `text-zinc-500`

**Riesgo:** LOW. Display-only. CSS variables are likely undefined anyway.
**Implementar hoy:** SI

### A3: Etiquetar Demos Visiblemente — KPI Row

**Archivo:** `components/legal-cockpit/LegalKPIRow.tsx`
**Accion:** Since KPIs are always demo data (hardcoded in `KPI_CARDS`), add a visible "DEMO" badge.

Approach:
- KPIRow does not accept a `demoData` prop currently. Two options:
  - **Option 1:** Add `demoData?: boolean` prop, pass from page.tsx as `status.demoData`
  - **Option 2:** Show DEMO badge unconditionally (since data is always hardcoded)

Recommended: Option 1 (prop) — when KPIs are wired to real hooks later, the badge disappears automatically.

**Component signature (current):**
```typescript
export function LegalKPIRow({ loading }: { loading?: boolean })
```

**Proposed change:** Add `demoData?: boolean` prop. When true, render a small `DEMO` chip in the section header.

**Riesgo:** LOW. Additive change. No existing behavior altered.
**Implementar hoy:** SI

### A4: Etiquetar Demos — Calendar Panel

**Archivo:** `components/legal-cockpit/JudicialCalendarPanel.tsx`
**Accion:** Add a visible "DATOS DEMO" badge/ribbon to the calendar panel.

**Component signature (current):**
```typescript
export function JudicialCalendarPanel()
```

No props. All data is imported from `calendar-data.ts`.

**Proposed change:** Add a small banner or badge at the top: "Datos de ejemplo · Pendiente integracion con audiencias reales" in `text-amber-400/80`.

**Riesgo:** LOW. Visual only.
**Implementar hoy:** SI

### A5: Etiquetar Demos — Performance Metrics

**Archivo:** `components/legal-cockpit/PerformanceMetrics.tsx`
**Accion:** Add "DEMO" badge next to "RENDIMIENTO" header.

**Component signature (current):**
```typescript
export function PerformanceMetrics()
```

No props. All data hardcoded in `METRICS` array.

**Proposed change:** Add `text-[10px] text-amber-400/80` label next to "Metricas del bufete" title: "(datos de ejemplo)".

**Riesgo:** LOW. Visual only.
**Implementar hoy:** SI

### A6: Etiquetar Demos — Golden Path

**Archivo:** `components/legal-cockpit/LegalGoldenPath.tsx`
**Accion:** Add "DEMO" indicator.

**Component signature (current):**
```typescript
export function LegalGoldenPath({ steps, onStep }: Props)
// Props: { steps: GoldenPathStep[]; onStep: (href: string) => void }
```

**Proposed change:** Add "(ejemplo de flujo)" subtitle in muted text.

**Riesgo:** LOW.
**Implementar hoy:** SI

### A7: Trust Panel — Fix Permanently-Pending Items

**Archivo:** `app/(forge)/legal/guide/page.tsx` (trust items initialization)
**Accion:** The `isolation` and `human` trust items never update from "pending". Two options:

- **Option A:** Remove them (dishonest to show "pendiente" indefinitely)
- **Option B (Recommended):** Set initial status to `"demo"` instead of `"pending"` — this renders as "demo" with a neutral icon rather than misleading "pendiente de verificacion"

**Change:** In `DEFAULT_TRUST_ITEMS` (page.tsx:47-48):
```typescript
{ key: "isolation", label: "Aislamiento por bufete (RLS)", status: "demo" },
{ key: "human", label: "Revision humana obligatoria", status: "demo" },
```

**Riesgo:** LOW. More honest.
**Implementar hoy:** SI

### A8: Silent Fallback — Add Error/Empty States

**Archivo:** `app/(forge)/legal/guide/page.tsx`
**Accion:** When `fetchCasesList` fails, currently demo data stays silently. Add an indicator.

Approach: Track an `apiError` state. When set, show a small muted notice under urgent matters: "No se pudieron cargar casos reales · mostrando datos de ejemplo".

**Riesgo:** MEDIUM. Requires adding state + conditional render.
**Implementar hoy:** SI (with Cesar review)

---

## Part B — Requiere Backend Futuro

### B1: Wire KPIs to Real Data

**Requires:**
- `useLegalCases` → case count
- `useUpcomingDeadlines` → urgent deadline count
- New `useHearings` hook → hearing count (backend exists: `GET /api/v1/legal/hearings`)
- Aggregate document count (no endpoint today — would need `GET /api/legal/documents/count` or derive from cases)

**Estimated scope:** Modify `LegalKPIRow` to accept real KPI values as props instead of importing `KPI_CARDS`. Wire in page.tsx.

**Implementar hoy:** NO — requires `useHearings` hook creation + docs endpoint clarification.

### B2: Calendar Panel — Real Hearings Integration

**Requires:**
- New `useHearings` hook calling `GET /api/v1/legal/hearings`
- Map `HearingOut` schema to `CalendarEvent` type
- Replace `RAW_EVENTS` with real data
- Handle empty/error states

**Backend status:** `GET /api/v1/legal/hearings` exists (PR #400 merged to backend). Returns `HearingListResponse { hearings: HearingOut[], total: number }`.

**Implementar hoy:** NO — requires new hook + schema mapping + error handling.

### B3: Performance Metrics — Real Data

**Requires:** Backend endpoints for:
- Average case resolution time (no endpoint)
- Case success rate (no endpoint)
- Monthly case throughput (derivable from `GET /api/legal/cases` with date filters)
- Query activity heatmap (no endpoint)

**Implementar hoy:** NO — 3 of 4 metrics have no backend source.

### B4: Golden Path — Real Step Tracking

**Requires:** Backend endpoint for user workflow progress (no endpoint exists or planned).

**Implementar hoy:** NO — no backend. Keep as navigational demo.

---

## File Change Summary

| # | Archivo | Accion | Riesgo | Hoy? |
|---|---------|--------|--------|------|
| A1 | `app/(forge)/legal/config/page.tsx` | Dark contrast fix (bg-white → bg-zinc-900, text-slate → text-zinc) | LOW | SI |
| A2 | `components/legal/PracticeAreaConfig.tsx` | Replace undefined CSS vars with Tailwind, fix opacity-50 | LOW | SI |
| A3 | `components/legal-cockpit/LegalKPIRow.tsx` | Add `demoData` prop + DEMO badge | LOW | SI |
| A4 | `components/legal-cockpit/JudicialCalendarPanel.tsx` | Add DEMO banner | LOW | SI |
| A5 | `components/legal-cockpit/PerformanceMetrics.tsx` | Add "(datos de ejemplo)" label | LOW | SI |
| A6 | `components/legal-cockpit/LegalGoldenPath.tsx` | Add "(ejemplo de flujo)" subtitle | LOW | SI |
| A7 | `app/(forge)/legal/guide/page.tsx` | Fix trust items isolation/human → "demo" status | LOW | SI |
| A8 | `app/(forge)/legal/guide/page.tsx` | Add apiError state + muted notice on fallback | MEDIUM | SI (review) |
| B1 | `components/legal-cockpit/LegalKPIRow.tsx` + page | Wire to real hooks | MEDIUM | NO |
| B2 | New: `hooks/legal/useHearings.ts` + calendar | Hearings integration | HIGH | NO |
| B3 | `components/legal-cockpit/PerformanceMetrics.tsx` | Real metrics | HIGH | NO |
| B4 | `components/legal-cockpit/LegalGoldenPath.tsx` | Real step tracking | HIGH | NO |

---

## Test Plan

**Framework:** Jest 30.3.0 (confirmed `"test": "jest"` in package.json)
**Existing tests:** 7 files in `__tests__/legal/`
**Test config:** `jest.config.js` with ts-jest, jsdom environment

### Tests for Part A (propose, do NOT create until implementation approved)

| Test | Target | What to assert |
|------|--------|---------------|
| `LegalKPIRow renders DEMO badge when demoData=true` | A3 | Badge with "DEMO" text visible |
| `LegalKPIRow hides DEMO badge when demoData=false` | A3 | Badge not in DOM |
| `JudicialCalendarPanel shows demo notice` | A4 | Text "datos de ejemplo" present |
| `PerformanceMetrics shows demo label` | A5 | Text "(datos de ejemplo)" present |
| `Config page uses dark background classes` | A1 | No `bg-white` class in rendered output |
| `Trust items isolation and human have status demo` | A7 | Status renders as "demo" not "pendiente" |

**Run:** `npx jest --testPathPattern="__tests__/legal"` (existing) + new file `__tests__/legal/cockpit-demo-labels.test.tsx`.

---

## Decision Matrix for Cesar

| Tema | Decision requerida |
|------|-------------------|
| A3: DEMO badge on KPIs | Aprobar prop addition to `LegalKPIRow` |
| A4-A6: DEMO labels on 3 panels | Aprobar texto exacto ("datos de ejemplo" vs "DEMO" vs "piloto") |
| A7: Trust items → "demo" status | Aprobar changing from "pending" to "demo" for isolation/human |
| A8: Silent fallback notice | Aprobar showing "datos de ejemplo" notice when API fails |
| B1-B4: Backend integration | Priorizar: B2 (hearings) first? B1 (KPIs) first? |
| B2: useHearings hook | Aprobar new hook creation (backend endpoint confirmed exists) |

---

## Proximo Paso

1. Cesar revisa los 3 documentos (COCKPIT_DEMO_AUDIT.md, CONFIG_CONTRAST_AUDIT.md, este plan)
2. Cesar aprueba/modifica Part A scope
3. Implementar Part A en branch `fix/legal-cockpit-trust` (single PR)
4. Part B se planifica como features separados con PRs individuales
