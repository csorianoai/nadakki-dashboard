# F1H — Enum expansion rollback (7 data_source states)

**Phase:** F1_HOTFIX_ENUM_EXPANSION  
**Branch:** `finance-v3/f1-hotfix-enum-expansion`  
**Target rollback time:** < 5 minutes

---

## Commits to revert

```bash
git revert <F1H_COMMIT_SHA> --no-edit
```

Or reset branch to parent:

```bash
git checkout finance-v3/f1-hotfix-enum-expansion
git reset --hard main
```

---

## Migrations

None — frontend-only enum expansion.

---

## Feature flags

No new flags. Existing finance flags unchanged in `lib/cockpit/finance-v3/flags.ts`.

---

## Environment variables

None required for rollback.

---

## Files affected (revert restores 5-state enum)

| File | Change |
|------|--------|
| `lib/cockpit/finance-v3/envelope.ts` | 7 → 5 states |
| `lib/cockpit/finance-v3/data-source.ts` | mapping |
| `lib/credit-hub/honesty/data-truth.ts` | badge levels |
| `components/credit-hub/honesty/DataTruthBadge.tsx` | retry button |
| `lib/cockpit/finance-v3/normalize/population.ts` | coerce |

---

## Risk

| Risk | Mitigation |
|------|------------|
| Downstream F2+ expects 7 states | Do not rollback after F2 merges without coordinating |
| Credit Hub badges | PARTIAL/STALE/ERROR unused outside finance until F2 |

---

## Verification after rollback

```bash
npm run typecheck
npm run test:run -- tests/cockpit/finance-v3
```

Expected: 5-state tests pass (pre-F1H).
