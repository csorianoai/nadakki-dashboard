# COCKPIT DEMO AUDIT — Legal Guide Page

**Repo:** nadakki-dashboard
**Page:** `app/(forge)/legal/guide/page.tsx`
**Date:** 2026-06-26
**Auditor:** Claude (automated, no implementation)

---

## 1. Bloque-por-bloque Classification

| # | Bloque | Componente | Fuente actual | Estado | Endpoint real existe | Accion recomendada |
|---|--------|-----------|---------------|--------|---------------------|--------------------|
| 1 | KPIs (4 cards) | `LegalKPIRow` | `KPI_CARDS` in `calendar-data.ts` (hardcoded) | **DEMO_CAN_BE_REAL** | YES: `GET /deadlines/upcoming`, `GET /cases` (counts derivable) | Connect KPIs to real hooks: cases count from `useLegalCases`, deadlines from `useUpcomingDeadlines`. "AUDIENCIAS SEMANA" requires hearings backend (see #3). |
| 2 | Casos urgentes | `LegalUrgentMatters` | `DEMO_URGENT_MATTERS` -> tries `fetchCasesList()` | **DEMO_CAN_BE_REAL** | YES: `GET /api/legal/cases` | Already partially connected. Fallback is silent (catch keeps demo). Add error/empty state. |
| 3 | Calendario judicial | `JudicialCalendarPanel` | `WEEK_DAYS`, `RAW_EVENTS`, `DEMO_REMINDERS` in `calendar-data.ts` | **DEMO_BACKEND_MISSING** | PARTIAL: `GET /api/v1/legal/hearings` exists in backend (PR #400 merged) but **NO frontend hook yet** | Etiquetar visiblemente como DEMO. Backend hearings endpoint exists but dashboard has no hook/integration. Requires new `useHearings` hook + wiring. |
| 4 | Golden Path (7 steps) | `LegalGoldenPath` | `DEMO_GOLDEN_PATH` in `demo-data.ts` | **DEMO_BACKEND_MISSING** | NO: no backend for workflow step tracking | Etiquetar como DEMO. Value is navigational (links to real pages). No backend to build — workflow tracker is a future feature. |
| 5 | Agentes (6 cards) | `LegalAgentGrid` | `DEMO_AGENTS` in `demo-data.ts`; backend provides count only | **DEMO_UNFLAGGED** | PARTIAL: `GET /api/legal/agents` exists but returns IDs+count, NOT descriptions | Always shows demo descriptions (page.tsx:128 `setAgents(DEMO_AGENTS)`). Agent descriptions/metadata not in backend. Etiquetar. |
| 6 | Trust Panel (6 items) | `LegalTrustPanel` | `DEFAULT_TRUST_ITEMS` -> updated by `fetchLegalHealth()` | **REAL_API** | YES: `GET /api/legal/health?deep=true` | Already real when health succeeds. Items stay "pending" on failure — this is honest. Two items (`isolation`, `human`) never update from backend — should be flagged or connected. |
| 7 | Metricas rendimiento | `PerformanceMetrics` | `METRICS` array (hardcoded `2.4d`, `87%`, `142 casos`) + `HEAT_BANDS` | **DEMO_BACKEND_MISSING** | NO: no endpoint for case resolution time, success rate, or query heatmap | Etiquetar visiblemente como DEMO. These metrics have no backend source. Do NOT invent endpoint. |
| 8 | Command Center | `LegalCommandCenter` | Pure logic (`intent-router.ts`) | **REAL_API** | N/A (no data fetch, routes to real pages) | No changes needed. |
| 9 | Fallback Panel | `LegalActionFallbackPanel` | Generated from user query | **REAL_API** | N/A | No changes needed. |
| 10 | FAB Button | `FabButton` | `ACTIONS` array (hardcoded links) | **DEMO_UNFLAGGED** | N/A (navigational only) | Static navigation links — acceptable. Low priority. |
| 11 | Shell badges | `LegalCockpitShell` | `status` prop from page state | **REAL_API** | YES: derived from health + agents | Shows "modo demo" badge when `status.demoData === true`. Honest. |

---

## 2. Fallback silencioso Analysis

### Pattern A: safeFetch (never throws)

**File:** `lib/legal-cockpit/api.ts:8-29`

```typescript
// On HTTP error or network failure:
return { ok: false, error: msg, demoData: true };
```

**Impact:** `fetchLegalHealth()` and `fetchLegalAgents()` never throw. Page checks `healthRes.ok` / `agentsRes.ok` and silently keeps demo state. **No toast, no error indicator to the user.**

### Pattern B: fetchCasesList catch → keep demo

**File:** `app/(forge)/legal/guide/page.tsx:131-140`

```typescript
try {
  const { cases } = await fetchCasesList(tid, { limit: 6, sort: "priority" });
  if (!cancelled && cases.length > 0) {
    setMatters(cases.map(caseToUrgentMatter));
  }
} catch {
  // keep DEMO_URGENT_MATTERS as fallback
}
```

**Impact:** API failure → user sees demo urgent matters with no indication they're demo. `caseToUrgentMatter` does NOT set `demoData: false` on mapped items, so demo items and real items look identical.

### Pattern C: normalizeListPayload → empty array

**File:** `lib/legal/cases/legal-cases-api.ts:31-46`

Malformed API response → `{ cases: [], total: 0 }`. User sees empty list (no error message).

### Pattern D: Knowledge pack .catch(() => setInfo(null))

**File:** `hooks/useLegal.ts:99-103`

API error silently swallowed, component renders `null`. Config page shows error message ("No se pudo cargar") but cockpit doesn't use this hook.

### Pattern E: Agents always demo

**File:** `app/(forge)/legal/guide/page.tsx:128`

```typescript
setAgents(DEMO_AGENTS); // Keep rich demo descriptions
```

Even when backend responds, agent descriptions stay demo. This is intentional but **unflagged to the user**.

---

## 3. DEMO_CAN_BE_REAL — Backend Confirmation

| Bloque | Endpoint confirmado | Location in backend | Hook exists in dashboard | Gap |
|--------|--------------------|--------------------|------------------------|-----|
| KPIs: Casos activos | `GET /api/legal/cases` | `backend/routers/legal_router.py` | YES: `useLegalCases` | Need to wire count to KPI card |
| KPIs: Plazos urgentes | `GET /api/legal/deadlines/upcoming` | `legal-cases-api.ts:445` routes to backend | YES: `useUpcomingDeadlines` | Need to wire count to KPI card |
| KPIs: Docs pendientes | `GET /api/legal/cases/{id}/documents` | legal-cases-api.ts:187 | YES: `useCaseDocuments` | Need aggregate count (no list-all-docs endpoint) |
| KPIs: Audiencias semana | `GET /api/v1/legal/hearings` | `routers/legal/hearings_router.py:44` | **NO** | Need new `useHearings` hook |
| Casos urgentes | `GET /api/legal/cases` | backend/routers/legal_router.py | YES: `useLegalCases` | Already wired (partial). Silent fallback needs fix. |
| Trust Panel: RAG | `GET /api/legal/health?deep=true` | backend/routers/legal_router.py:126 | YES (via safeFetch) | Already working |
| Trust Panel: Audit | `GET /api/legal/health?deep=true` | same | YES | Already working |
| Trust Panel: Isolation | None | N/A | N/A | `isolation` and `human` items never change from "pending" |

---

## 4. DEMO_BACKEND_MISSING — Cannot Connect Today

| Bloque | Razon | Accion |
|--------|-------|--------|
| Calendario judicial | Backend `GET /api/v1/legal/hearings` exists (PR #400) but dashboard has NO hook, NO integration, NO data mapping | Etiquetar como DEMO. Future: create `useHearings` hook, map to calendar events |
| Golden Path | No backend for workflow step tracking | Etiquetar como DEMO. Navigational value (links to real pages) justifies keeping |
| Metricas rendimiento (`2.4d`, `87%`, `142`) | No backend for resolution time, success rate, heatmap | Etiquetar como DEMO. Do NOT invent endpoint |
| Heatmap actividad | No backend for query activity tracking | Etiquetar como DEMO |

---

## 5. Critical Findings

### F1: Silent demo-to-real swap (no user indicator)
When `fetchCasesList` succeeds, urgent matters switch from demo to real with **no visual change**. When it fails, demo stays with **no error indicator**. User cannot tell if they're looking at real or demo data.

### F2: Trust Panel has 2 permanently-pending items
`isolation` (RLS) and `human` (human review) are initialized as `"pending"` and **never updated** by any API call. They permanently show "pendiente de verificación" regardless of system state.

### F3: KPI numbers are hardcoded (12 cases, 3 deadlines, 7 docs, 4 hearings)
`KPI_CARDS` in `calendar-data.ts` has static values. Real endpoints exist for 3 of 4 KPIs. These should be wired to actual counts.

### F4: Performance metrics are fully fabricated
`2.4 dias`, `87%`, `142 casos resueltos` are hardcoded constants in `PerformanceMetrics.tsx:19-49`. No backend provides these.

### F5: Agent descriptions are always demo
Even when `fetchLegalAgents()` succeeds, page.tsx:128 discards the response and uses `DEMO_AGENTS`. Only the agent count is used from the backend.

### F6: Calendar events are static fiction
`RAW_EVENTS` has 5 hardcoded events (Cobro de Pesos, Contestacion, etc.) with fixed dates. The hearings backend endpoint exists but has no dashboard hook.
