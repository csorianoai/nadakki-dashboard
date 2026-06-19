# PR-FE-6 — Bank Audit/Compliance Global Pages → Real API

> Repo: `nadakki-dashboard` · Branch: `feat/antispoofing-bank-evidence-real` · Base HEAD: `fc45b70`
> Scope: connect the tenant-wide Bank **Audit** and **Compliance** pages to real backend data, removing client-synthesized rows. No backend changes, no shell rewrite, no duplicate routes.

## Objective

Eliminate the synthetic data on the global bank audit/compliance surfaces (blocker from the Dealer-Bank Core audit) by consuming the real event-sourced endpoints, while preserving auth + `X-Tenant-ID` and not hardcoding the tenant.

## Backend reality (what exists)

There is **no dedicated tenant-wide audit/compliance LIST endpoint**. Authoritative data is per-application (already present in `lib/credit-hub/api/bankClient.ts`):
- `GET /api/v2/credit/applications/queue` → `getQueue` (tenant-scoped application list)
- `GET /api/v2/credit/applications/{id}/audit-trail` → `getAuditTrail` → `BankAuditTrail.events: BankAuditEvent[]` (`{ event, timestamp, by, decision? }`)
- `GET /api/v2/credit/compliance/{id}` → `getComplianceReport` → `ComplianceReport.issues[]` (`{ type, severity, action_required }`)

Approach: the global views are now built by **aggregating the real per-application calls across the tenant's active queue** (event-sourced, tenant-scoped, no mock). This shares the React Query cache with the per-application detail route.

> Note: the full-stack audit doc referenced in the task (`nadakki-ai-suite/docs/audits/DEALER_BANK_CORE_FULL_STACK_AUDIT.md`) was **not present** on disk; this PR relied on the in-repo frontend audit (`docs/audits/FRONTEND_DEALER_BANK_CORE_AUDIT.md`) and direct code inspection.

## Before → After

| Surface | Before | After |
|---|---|---|
| `/credit-hub/bank/audit` | Synthesized 2 events/app from queue fields; actor hardcoded `"system"`/`"analista"`; only `submitted`/`decided` (`audit/page.tsx:11-37`) | Real `BankAuditEvent[]` from `getAuditTrail` aggregated across the queue (full event types: `analyzed`, `claimed`, `compliance_approved`, `decided`, …); actor = real `ev.by` |
| `/credit-hub/bank/compliance` | Issues derived from queue flag with hardcoded `rule`/`severity`/`description` (`compliance/page.tsx:15-23`) | Real `ComplianceReport.issues[]` from `getComplianceReport` aggregated across the queue; `rule = issue.type`, `description = issue.action_required`, severity normalized |

## Files changed

| File | Type | Change |
|---|---|---|
| `lib/credit-hub/hooks/useBankAuditCompliance.ts` | **NEW** | `useBankGlobalAuditTrail()` + `useBankGlobalCompliance()` — aggregate real per-application audit-trail/compliance across the tenant queue via `useQueries`; expose `{ events|issues, isLoading, isError, isPartialCoverage, refetch }`. |
| `app/(forge)/credit-hub/bank/audit/page.tsx` | MODIFIED | Removed queue-based synthesis; consumes `useBankGlobalAuditTrail()`. |
| `app/(forge)/credit-hub/bank/compliance/page.tsx` | MODIFIED | Removed queue-based synthesis; consumes `useBankGlobalCompliance()`; keeps `useTenantConfig` for jurisdiction/institution hero. |
| `tests/credit-hub/bank/pages/compliance.test.tsx` | MODIFIED | Mocks the new hook + isolates `useTenantConfig`; corrected a stale assertion (`"Ley 172-13 RD"` → `/Ley 172-13/`, which matches the real DO hero "Perfil Ley 172-13 (República Dominicana)"). |

## API clients changed/created

- **No new API client functions** — reused existing real clients (`getQueue`, `getAuditTrail`, `getComplianceReport`) from `lib/credit-hub/api/bankClient.ts`, all routed through `chFetch` (sets `X-Tenant-ID`, `X-Actor-Role`, conditional `Authorization: Bearer`; browser relative URL / SSR `NEXT_PUBLIC_*` base; 401→login; 5xx retry).
- **New hooks** (data layer): `useBankGlobalAuditTrail`, `useBankGlobalCompliance` in `lib/credit-hub/hooks/useBankAuditCompliance.ts`.

## Routes/components connected

- `/credit-hub/bank/audit` → `BankAuditView` (unchanged) ← `useBankGlobalAuditTrail`
- `/credit-hub/bank/compliance` → `BankComplianceView` (unchanged) ← `useBankGlobalCompliance`
- States: **loading** (queue or per-app fetches pending), **empty** (no events/issues → existing `EmptyStateRich`), **error** (queue error, or all per-app fetches errored → Reintentar/`refetch`). 401 is auto-redirected to `/login` by `chFetch`; 403 surfaces as the error state.

## Mock data removed

- `app/(forge)/credit-hub/bank/audit/page.tsx`: removed the inline `useMemo` that fabricated events with `actor: "system"` / `"analista"` and `action: "submitted"`/`"decided"`.
- `app/(forge)/credit-hub/bank/compliance/page.tsx`: removed the inline `useMemo` that produced issues with hardcoded `rule: "LEY-172-13"`, `severity: "media"`, and a fixed `description` string.
- No `mockAuditEvents` / `demoEvents` / `sampleEvents` named arrays existed; the synthesis was inline and is now gone. No mock fallback remains in production code.

## Endpoint contracts used

- `getQueue({ tenantId, limit })` → `BankQueueResponse.applications[].application_id`
- `getAuditTrail({ tenantId, applicationId })` → `BankAuditTrail.events[]` → mapped to `BankAuditEventView { timestamp, actor: by, action: event, applicationId, details:{decision?} }`
- `getComplianceReport({ tenantId, applicationId })` → `ComplianceReport.issues[]` → mapped to `BankComplianceIssueView { rule: type, severity(normalized), description: action_required, application_id }`

## Remaining backend gaps

1. **[PARTIAL] No tenant-wide audit/compliance LIST endpoint.** Aggregation is bounded to the most recent `GLOBAL_AGGREGATION_APP_LIMIT = 50` queue applications to keep request fan-out reasonable. A dedicated backend endpoint (e.g. `GET /api/v2/credit/audit-trail?tenant` and `GET /api/v2/credit/compliance?tenant`) would give full coverage in one request and remove the fan-out. `isPartialCoverage` is computed (queue total > aggregated count) and available to surface in a future UI notice.
2. **Compliance index shows only structured `issues[]`.** An application with `ley_172_13_compliant === false` but an empty `issues[]` will not list a row on the index (still visible on the detail page). No synthetic row is fabricated (per rules).
3. **RTBF (derecho al olvido)** remains an explicit placeholder section — no backend listing endpoint exposed yet (unchanged, already labeled).
4. **Compliance KPIs "Solicitudes en cola" / "RTBF pendientes"** remain `"—"` honest placeholders (view left unchanged to avoid scope creep; `reviewedCount` is now available from the hook for a future wiring).

## Test results

- **typecheck** (`tsc --noEmit`): **PASS** (exit 0)
- **lint** (`npm run lint`): **PASS** (exit 0) — note the repo lint script whitelists files and does not include `credit-hub/**`, so changed files were linted directly: `npx eslint` on the new hook + both pages → **PASS** (0 errors)
- **build** (`next build`): **PASS** (exit 0, ~120s)
- **unit** (`jest tests/credit-hub/bank/pages/compliance.test.tsx`): **PASS** (1/1) after updating it to the new hook + correcting a pre-existing stale assertion

## Risk level

**LOW–MEDIUM.** Change is additive (new data hook) and small. Behavioral change: the two pages now render real event-sourced data instead of synthetic rows — row counts/labels will differ from before (expected and desired). Main operational consideration is increased request fan-out (≤50 parallel per-app calls per page on mount), mitigated by the cap, shared React Query cache with the detail route, and `staleTime`. Tolerant of partial per-app failures (shows what loaded).

## Recommendation

**Merge PR-FE-6.** Follow-ups: (a) backend dedicated tenant-wide audit/compliance list endpoint to replace aggregation and eliminate fan-out + partial coverage; (b) surface the `isPartialCoverage` notice and wire `reviewedCount` into the compliance KPI; (c) RTBF endpoint + UI.

---

```
STATUS: DONE
FILES CHANGED:
- lib/credit-hub/hooks/useBankAuditCompliance.ts (NEW)
- app/(forge)/credit-hub/bank/audit/page.tsx (MODIFIED)
- app/(forge)/credit-hub/bank/compliance/page.tsx (MODIFIED)
- tests/credit-hub/bank/pages/compliance.test.tsx (MODIFIED)
- docs/audits/PR_FE_6_AUDIT_COMPLIANCE_REAL_API_REPORT.md (NEW, this report)
TESTS:
- typecheck: PASS (exit 0)
- lint: PASS (exit 0; changed credit-hub files linted directly via npx eslint → PASS)
- build: PASS (next build, exit 0, ~120s)
- unit: PASS (compliance page test 1/1)
REMAINING GAPS:
- No tenant-wide audit/compliance LIST endpoint → aggregation bounded to 50 most-recent apps [PARTIAL coverage]
- Compliance index lists only real issues[]; non-compliant-with-empty-issues apps shown only on detail
- RTBF listing endpoint not exposed (placeholder retained)
PR READY: YES
```
