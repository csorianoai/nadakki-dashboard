# T6.4 App Health Score — rollback

META MVP 4 · Agent-3

## Quick disable

1. Set **`NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`** to `false`, `0`, or `off` (see `lib/env/feature-app-health-score.ts`).
2. Rebuild / redeploy the Next.js frontend.

Feature is **enabled by default** when the variable is omitted.

## Behavioral notes

Removes:

- Dealer application detail readiness overlay (`AppHealthScore`).
- Calibration rows that patch local overlays on `/credit/dealer/[applicationId]`.

No backend or bank routes are impacted.

## Code removal (optional surgical revert)

Undo changes under:

- `components/credit/AppHealthScore.tsx`
- `hooks/useAppHealthScore.ts`
- `lib/credit/app-health-score.ts`
- `lib/env/feature-app-health-score.ts`
- `tests/credit/AppHealthScore.test.tsx`
- `docs/dealer/T6-4-app-health-score-rollback.md` (this note)
- `app/credit/dealer/[applicationId]/DealerApplicationClient.tsx`
- `.env.example` entry for `NEXT_PUBLIC_FEATURE_APP_HEALTH_SCORE`

Also drop re-exports added to `components/credit/index.ts` when reverting cleanly.
