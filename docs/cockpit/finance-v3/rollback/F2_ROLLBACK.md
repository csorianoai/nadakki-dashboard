# F2 — Revenue page rollback

**Branch:** `finance-v3/f2-revenue-page`  
**Target rollback time:** < 5 minutes

## Feature flag (fastest)

```bash
NEXT_PUBLIC_COCKPIT_FINANCE_ENABLED=false
```

Hides Finanzas sidebar entry; routes remain but unreachable from nav.

## Git revert

```bash
git revert <F2_COMMIT_SHA>
```

## Files added (remove on rollback)

- `app/(cockpit)/cockpit/finance/**`
- `components/cockpit/finance/**`
- `lib/cockpit/api/finance.ts`, `fetchOrDemo.ts`
- `lib/cockpit/demo-finance.ts`
- `lib/cockpit/finance-v3/normalize/finance.ts`, `format.ts`

## Migrations

None (frontend-only).

## Verification

```bash
npm run typecheck
npm run test:run -- tests/cockpit
```
