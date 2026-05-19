# T6.7 Time compression wizard — rollback (<2 min)

## Feature flag

- **Disable compressed flow:** set `NEXT_PUBLIC_FEATURE_COMPRESSED_WIZARD=false` (or `0`) at **build** time.
- **Effect:** `app/credit/dealer/new/page.tsx` serves `DealerNewEntry`, which falls back to the legacy `DealerNewWizard` (full multi-step with document uploads per existing flow).

## Code rollback

1. Revert the commit or restore:
   - `components/credit/CompressedWizard.tsx`
   - `components/credit/CompressedWizardSteps.tsx`
   - `components/credit/compressed-wizard-types.ts`
   - `hooks/useCompressedWizard.ts`
   - `lib/credit/compressed-wizard-map.ts`
   - `lib/env/feature-compressed-wizard.ts`
   - `app/credit/dealer/new/DealerNewEntry.tsx`
   - `app/credit/dealer/new/page.tsx` (import `DealerNewWizard` directly again)
2. Run `npm run typecheck` and `npm test -- tests/dealer`.

## Data / offline drafts

- Local drafts live under `localStorage` key prefix `nadakki:cw-draft:{tenantId}:{applicationId|new}`.
- Telemetry buffer: `sessionStorage` prefix `nadakki:cw-telemetry:{tenantId}`.
- Clearing browser storage removes UX-only state; no server data affected.

## Zone compliance

- Agent-3 only: `app/credit/dealer/*`, `components/credit/*`, `hooks/useCompressedWizard.ts`, `lib/credit/*`, `lib/env/*`.
