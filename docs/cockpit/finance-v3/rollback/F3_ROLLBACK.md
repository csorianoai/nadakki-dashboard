# F3 — Population views rollback

**Branch:** `finance-v3/f3-population-full`  
**Target rollback time:** < 5 minutes

## Feature flag

```bash
NEXT_PUBLIC_COCKPIT_FINANCE_ENABLED=false
```

## Git revert

Revert F3 commit(s) on stacked branch; population page reverts to F2 stub.

## Files added

- `components/cockpit/finance/population/*`
- `lib/cockpit/api/population.ts`
- `lib/cockpit/population-config.ts`
- Extended `lib/cockpit/finance-v3/normalize/population.ts`

## Migrations

None.

## Verification

```bash
npm run typecheck
npm run test:run -- tests/cockpit
```
