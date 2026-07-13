# F0 Rollback — finance-v3/f0-baseline

**Risk:** Minimal — documentation only, no runtime changes.

## Commits

Revert the F0 commit on branch `finance-v3/f0-baseline` (docs-only).

## Files

```
docs/cockpit/finance-v3/F0_BASELINE.md
docs/cockpit/finance-v3/HYPOTHESIS_LEDGER.md
docs/cockpit/finance-v3/EVIDENCE_LEDGER.md
docs/cockpit/finance-v3/rollback/F0_ROLLBACK.md
```

## Feature flags

None introduced in F0.

## Migrations

None.

## Reversión

```powershell
git checkout main
git branch -D finance-v3/f0-baseline
# If merged: git revert <f0-commit-sha>
```

## Validación post-rollback

- `npm run build:webpack` — unchanged vs pre-F0
- No app routes or components modified

## Tiempo estimado

< 2 minutos

## Riesgos

Ninguno operacional. Pérdida únicamente de documentación baseline.
