# T6.5 Risk-based UX — rollback

META MVP 4 · Agent-3

## Quick disable

1. Export **`NEXT_PUBLIC_FEATURE_RISK_BASED_UX=false`** (`0`, `false`, `off`).
2. Rebuild frontend.

Defaults to **enabled** while unset (`lib/env/feature-risk-based-ux.ts`).

Removes the dealer playbook ribbon from `/credit/dealer/[applicationId]`.
