# Final Wiring — Credit Hub Demo (HANDOFF v2)

Branch: `feat/credit-hub-final-wiring`

## G1 — Monthly Goals

- `DealerGoals` / `BankGoals` → `GET /api/v2/credit/goals/monthly/{yyyy-mm}?role_scope=dealer|bank`
- Hardcoded targets removed; pacing from seeded `credit_monthly_goals`.

## DemoModeBanner

- `TenantInfo.is_demo` on `GET /api/v2/auth/me` → `current_tenant.is_demo`
- `useTenantConfig` merges session `tenant.is_demo` into `tenantConfig.is_demo`.

## B2 — Expediente

- `useBankApplication` → `getBankApplicationDetail` prefers `expediente/full`, falls back to `GET applications/{id}` on 403/404.

## B11 — Stipulations

- New tab **Estipulaciones** on `BankDetailLayout` → `GET /api/v2/credit/applications/{id}/stipulations` via `useStipulations`.

## Auction Intel handback

See `AUCTION_INTEL_HANDBACK.md` if probe returned empty 200.

## Verification

```bash
npm run typecheck
npm run build:webpack
npm test
rg d3b00111 app/ components/ lib/credit-hub
```
