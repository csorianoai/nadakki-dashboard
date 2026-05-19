# T6.3 Stipulations workflow — rollback

## Feature flag

- **Fail-closed default:** orchestration + “Nueva estipulación / bulk enqueue” widgets stay **hidden** until `NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI` is set to **`1`** or **`true`** at **build time** (`lib/env/bank-stipulation-workflow.ts`).
- **Disable after pilot:** set `NEXT_PUBLIC_BANK_STIPULATION_WORKFLOW_UI=false` (or omit) — `BankWorkflowOrchestrationModal`, admin bulk launcher, and StipulationsPanel CTA disappear; verify/reject list remains.

## Code rollback

1. Revert commits touching:
   - `components/bank/StipulationsModal.tsx`
   - `components/bank/StipulationsList.tsx`
   - `components/bank/WorkflowStipulationsList.tsx`
   - `components/bank/BankWorkflowOrchestrationModal.tsx`
   - `components/bank/stipulations/StipulationsList.tsx` (re-export)
   - `hooks/useStipulations.ts`
   - `lib/api/stipulations.ts` / `lib/api/stipulations-types.ts`
   - `app/(bank)/bank/applications/[id]/stipulations/StipulationsAdminClient.tsx`
   - `lib/env/bank-stipulation-workflow.ts`
2. Restore prior `StipulationsModal` if a parallel Radix-based implementation existed; ensure `npm test` and `npm run build` pass.

## Data / API

- Create stipulation: `POST /api/v2/credit/applications/{id}/stipulations` — failures are shown via toast; no partial server state on client beyond SWR revalidation.
- Upload link / dealer notify: soft-fail patterns preserved for unsupported routes.

## Audit

- Client workflow audit is session-scoped (`workflow-audit.ts`). Clearing `sessionStorage` key `nadakki:audit:bank-stip-workflow:v1` removes local UX audit only.
