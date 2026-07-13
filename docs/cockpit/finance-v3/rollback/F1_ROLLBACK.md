# F1 Rollback — finance-v3/f1-navigation-shell

## Revert

```powershell
git checkout finance-v3/f0-baseline
git branch -D finance-v3/f1-navigation-shell
# If merged: git revert <f1-commit-sha>
```

## Files added/modified

```
lib/cockpit/finance-v3/**          (new)
lib/credit-hub/honesty/data-truth.ts (extended levels)
tests/cockpit/finance-v3/**        (new)
docs/cockpit/finance-v3/CONTRACTS.md
docs/cockpit/finance-v3/DATA_RECONCILIATION.md
docs/cockpit/finance-v3/ARCHITECTURE.md
```

## Feature flags

Defaults safe — finance UI routes not yet mounted in F1.

## Migrations

None (frontend only).

## Validation post-rollback

- `npm run test:run -- tests/cockpit` — 6 original tests pass
- `DataTruthBadge` reverts to 4 levels (may break new tests only)

## Tiempo estimado

< 5 minutos

## Riesgos

Low — no routes, no API wiring, no user-visible changes.
